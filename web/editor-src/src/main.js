// <rich-text-editor> — self-contained ProseMirror wrapper for SCM.
//
// Built as a single ES bundle (vite) and served from /web/scripts/vendor/;
// the vanilla frontend lazy-imports this file when a string property is
// switched to rich-text mode. No runtime dependencies beyond the bundle.
//
// API:
//   <rich-text-editor value="..." format="html|markdown"></rich-text-editor>
//   el.value            -> current HTML or Markdown string (per format)
//   el.value = str      -> replace document (ignored while the editor has focus)
//   el.format           -> 'html' | 'markdown'
//   'input' event       -> fired on every document change (bubbles)
//
// Feature set: paragraphs, headings 1-6, bold/italic/underline*/strike/inline
// code/links, bullet & ordered lists, quotes, code blocks, horizontal rules,
// hard breaks, images (URL + alt), text alignment* (HTML format only),
// undo/redo, markdown-style input rules, smart quotes/dashes, placeholder,
// word/char count.  (* = HTML format only; hidden in Markdown mode.)

import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser as PMDOMParser, DOMSerializer, Node as PMNode } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import {
  addListNodes, wrapInList, splitListItem, liftListItem, sinkListItem,
} from 'prosemirror-schema-list';
import {
  toggleMark, chainCommands, exitCode, baseKeymap, wrapIn, setBlockType,
} from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import {
  inputRules, wrappingInputRule, textblockTypeInputRule,
  smartQuotes, ellipsis, emDash,
} from 'prosemirror-inputrules';
import { Plugin, TextSelection } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import markdownit from 'markdown-it';
import {
  MarkdownParser, MarkdownSerializer,
  defaultMarkdownParser, defaultMarkdownSerializer,
} from 'prosemirror-markdown';

// ---------------------------------------------------------------- schema

// paragraph with optional text alignment (HTML round-trip only)
const paragraphSpec = (() => {
  const base = basicSchema.spec.nodes.get('paragraph');
  return {
    ...base,
    attrs: { ...base.attrs, align: { default: null } },
    parseDOM: [
      { tag: 'p' },
      {
        tag: 'p[style*="text-align"]',
        getAttrs: (dom) => {
          const align = dom.style.textAlign;
          return align && align !== 'start' ? { align } : {};
        },
      },
    ],
    toDOM: (node) => (node.attrs.align ? ['p', { style: `text-align: ${node.attrs.align}` }, 0] : ['p', 0]),
  };
})();

const marks = basicSchema.spec.marks.append({
  underline: {
    parseDOM: [{ tag: 'u' }, { style: 'text-decoration', getAttrs: (v) => (v === 'underline' ? {} : false) }],
    toDOM: () => ['u', 0],
  },
  strike: {
    parseDOM: [{ tag: 's' }, { tag: 'del' }, { tag: 'strike' }],
    toDOM: () => ['s', 0],
  },
});

const schema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes.update('paragraph', paragraphSpec), 'paragraph block*', 'block'),
  marks,
});

// ------------------------------------------------- markdown round-trip

const markdownParser = new MarkdownParser(
  schema,
  (() => {
    const md = markdownit('commonmark', { html: false, linkify: true });
    // GFM-style ~~strikethrough~~ (markdown-it commonmark has no strike rule)
    md.inline.ruler.before('emphasis', 'strikethrough', (state, silent) => {
      const pos = state.pos;
      const max = state.posMax;
      if (pos + 2 > max || state.src.slice(pos, pos + 2) !== '~~') return false;
      if (silent) return false;
      let end = -1;
      let i = pos + 2;
      while (i < max) {
        if (state.src.charCodeAt(i) === 0x5c /* \ */) { i += 2; continue; }
        if (state.src.charCodeAt(i) === 0x7e /* ~ */ && state.src.charCodeAt(i + 1) === 0x7e && i > pos + 2) { end = i; break; }
        i += 1;
      }
      if (end < 0) return false;
      const content = state.src.slice(pos + 2, end);
      if (!content.trim()) return false;
      state.push('s_open', 's', 1);
      const oldMax = state.posMax;
      state.pos = pos + 2;
      state.posMax = end;
      state.md.inline.tokenize(state);
      state.pos = end + 2;
      state.posMax = oldMax;
      state.push('s_close', 's', -1);
      return true;
    });
    return md;
  })(),
  { ...defaultMarkdownParser.tokens, s: { mark: 'strike' } },
);

const markdownSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
  },
  {
    ...defaultMarkdownSerializer.marks,
    // ~~strike~~ round-trips; underline has no markdown form — its content
    // is kept and the mark is dropped (toolbar hides it in markdown mode).
    // GFM strikethrough; underline has no markdown form — its content is
    // kept and the mark is dropped (toolbar hides it in markdown mode).
    strike: { open: '~~', close: '~~', mixable: false, escape: false },
    underline: { open: '', close: '', mixable: true },
  },
);

const htmlParser = PMDOMParser.fromSchema(schema);
const htmlSerializer = DOMSerializer.fromSchema(schema);

function parseContent(content, format) {
  if (format === 'markdown') return markdownParser.parse(String(content ?? ''));
  const div = document.createElement('div');
  const raw = String(content ?? '');
  if (!/<[a-z!][\s\S]*>/i.test(raw)) {
    const paras = raw.split(/\n{2,}/);
    div.innerHTML = paras
      .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
      .join('') || '<p></p>';
  } else {
    div.innerHTML = raw;
  }
  return htmlParser.parse(div);
}

function serializeContent(doc, format) {
  if (format === 'markdown') return markdownSerializer.serialize(doc).trim();
  const div = document.createElement('div');
  div.append(htmlSerializer.serializeFragment(doc.content));
  return div.innerHTML;
}

// ---------------------------------------------------------- placeholder

function placeholderPlugin(text) {
  return new Plugin({
    props: {
      decorations(state) {
        const doc = state.doc;
        if (doc.childCount === 1 && doc.firstChild.isTextblock && doc.firstChild.content.size === 0) {
          return DecorationSet.create(doc, [
            Decoration.widget(1, () => {
              const span = document.createElement('span');
              span.className = 'rte-placeholder';
              span.textContent = text;
              return span;
            }),
          ]);
        }
        return DecorationSet.empty;
      },
    },
  });
}

// -------------------------------------------------------------- commands

function insertHardBreak(state, dispatch) {
  if (dispatch) dispatch(state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView());
  return true;
}

function insertImageNode(view, src, alt) {
  const { state, dispatch } = view;
  const node = schema.nodes.image.create({ src, alt: alt || null, title: null });
  dispatch(state.tr.replaceSelectionWith(node).scrollIntoView());
  view.focus();
  return true;
}

function insertImage(view) {
  const src = window.prompt('Image URL:');
  if (!src) return true;
  const alt = window.prompt('Alt text (optional):') ?? '';
  return insertImageNode(view, src, alt);
}

function toggleLink(view) {
  const { state, dispatch } = view;
  const { $from } = state.selection;
  const existing = $from.marks().find((m) => m.type === schema.marks.link);
  const href = window.prompt(existing ? `Link URL (leave empty to remove):` : 'Link URL:');
  if (href === null) return true;
  if (!href) {
    toggleMark(schema.marks.link)(state, dispatch);
    return true;
  }
  toggleMark(schema.marks.link, { href })(state, dispatch);
  return true;
}

const setAlign = (align) => (state, dispatch) => {
  const { from, to } = state.selection;
  let tr = state.tr;
  let changed = false;
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type === schema.nodes.paragraph) {
      tr = tr.setNodeMarkup(pos, null, { ...node.attrs, align });
      changed = true;
      return false;
    }
    return true;
  });
  if (changed && dispatch) dispatch(tr.scrollIntoView());
  return true;
};

// --------------------------------------------------------------- toolbar

function hasMark(state, type) {
  const { empty, $from, $to } = state.selection;
  if (empty) return !!$from.marks().some((m) => m.type === type);
  return state.doc.rangeHasMark($from.pos, $to.pos, type);
}

function inBlock(state, type) {
  for (let d = state.selection.$from.depth; d > 0; d--) {
    if (state.selection.$from.node(d).type === type) return true;
  }
  return false;
}

function buildToolbarItems(format, uploadUrl) {
  const htmlOnly = format === 'html';
  const items = [];
  const cmd = (def) => items.push(def);
  const runView = (fn) => (view) => { fn(view.state, view.dispatch); view.focus(); };

  cmd({ icon: 'undo', title: 'Undo (Ctrl+Z)', run: runView(undo) });
  cmd({ icon: 'redo', title: 'Redo (Ctrl+Y)', run: runView(redo) });
  cmd({ sep: true });
  cmd({ text: '¶', title: 'Paragraph (Ctrl+Alt+0)', run: runView(setBlockType(schema.nodes.paragraph)),
        active: (s) => s.selection.$from.parent.type === schema.nodes.paragraph && !s.selection.$from.parent.attrs.align });
  [1, 2, 3, 4].forEach((level) => {
    cmd({ text: 'H' + level, title: `Heading ${level} (Ctrl+Alt+${level})`,
          run: runView(setBlockType(schema.nodes.heading, { level })),
          active: (s) => s.selection.$from.parent.type === schema.nodes.heading && s.selection.$from.parent.attrs.level === level });
  });
  cmd({ sep: true });
  cmd({ icon: 'format_bold', title: 'Bold (Ctrl+B)', run: runView(toggleMark(schema.marks.strong)), active: (s) => hasMark(s, schema.marks.strong) });
  cmd({ icon: 'format_italic', title: 'Italic (Ctrl+I)', run: runView(toggleMark(schema.marks.em)), active: (s) => hasMark(s, schema.marks.em) });
  if (htmlOnly) {
    cmd({ icon: 'format_underlined', title: 'Underline (HTML only)', run: runView(toggleMark(schema.marks.underline)), active: (s) => hasMark(s, schema.marks.underline) });
  }
  cmd({ icon: 'strikethrough_s', title: 'Strikethrough', run: runView(toggleMark(schema.marks.strike)), active: (s) => hasMark(s, schema.marks.strike) });
  cmd({ icon: 'code', title: 'Inline code', run: runView(toggleMark(schema.marks.code)), active: (s) => hasMark(s, schema.marks.code) });
  cmd({ sep: true });
  cmd({ icon: 'format_list_bulleted', title: 'Bullet list (Ctrl+Shift+8)', run: runView(wrapInList(schema.nodes.bullet_list)), active: (s) => inBlock(s, schema.nodes.bullet_list) });
  cmd({ icon: 'format_list_numbered', title: 'Numbered list (Ctrl+Shift+9)', run: runView(wrapInList(schema.nodes.ordered_list)), active: (s) => inBlock(s, schema.nodes.ordered_list) });
  cmd({ icon: 'format_quote', title: 'Quote', run: runView(wrapIn(schema.nodes.blockquote)), active: (s) => inBlock(s, schema.nodes.blockquote) });
  cmd({ icon: 'data_object', title: 'Code block', run: runView(setBlockType(schema.nodes.code_block)), active: (s) => s.selection.$from.parent.type === schema.nodes.code_block });
  cmd({ icon: 'horizontal_rule', title: 'Horizontal rule', run: (view) => { const tr = view.state.tr.replaceSelectionWith(schema.nodes.horizontal_rule.create()).scrollIntoView(); view.dispatch(tr); view.focus(); } });
  cmd({ sep: true });
  cmd({ icon: 'link', title: 'Insert/edit link (Ctrl+K)', run: (view) => toggleLink(view) });
  cmd({ icon: 'image', title: 'Insert image (URL)', run: (view) => insertImage(view) });
  if (uploadUrl) {
    cmd({ icon: 'add_photo_alternate', title: 'Insert image (upload)', run: (view) => openUploadPicker(view, uploadUrl) });
  }
  cmd({ icon: 'keyboard_return', title: 'Line break (Shift+Enter)', run: runView(insertHardBreak) });
  if (htmlOnly) {
    cmd({ sep: true });
    cmd({ icon: 'format_align_left', title: 'Align left', run: runView(setAlign(null)), active: (s) => s.selection.$from.parent.type === schema.nodes.paragraph && !s.selection.$from.parent.attrs.align });
    cmd({ icon: 'format_align_center', title: 'Align center', run: runView(setAlign('center')), active: (s) => s.selection.$from.parent.type === schema.nodes.paragraph && s.selection.$from.parent.attrs.align === 'center' });
    cmd({ icon: 'format_align_right', title: 'Align right', run: runView(setAlign('right')), active: (s) => s.selection.$from.parent.type === schema.nodes.paragraph && s.selection.$from.parent.attrs.align === 'right' });
    cmd({ icon: 'format_align_justify', title: 'Justify', run: runView(setAlign('justify')), active: (s) => s.selection.$from.parent.type === schema.nodes.paragraph && s.selection.$from.parent.attrs.align === 'justify' });
  }
  return items;
}

// ----------------------------------------------------------------- style

const STYLE = `
rich-text-editor { display: block; }
rich-text-editor .rte-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 3px 6px;
  border: 1px solid var(--color-outline-variant);
  border-bottom: none;
  border-radius: var(--radius) var(--radius) 0 0;
  background-color: var(--color-surface-container-low);
}
rich-text-editor .rte-sep {
  width: 1px;
  height: 16px;
  background-color: var(--color-outline-variant);
  margin: 0 4px;
}
rich-text-editor .rte-btn {
  background: none;
  border: none;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 2px 3px;
  border-radius: 4px;
  font-family: var(--font-label);
  font-size: 11px;
  font-weight: 600;
}
rich-text-editor .rte-btn:hover {
  color: var(--color-primary);
  background-color: var(--color-surface-variant);
}
rich-text-editor .rte-btn.active {
  color: var(--color-primary);
  background-color: rgba(37, 99, 235, 0.18);
}
rich-text-editor .rte-btn .material-symbols-outlined {
  font-size: 16px;
}
rich-text-editor .rte-count {
  margin-left: auto;
  font-family: var(--font-label);
  font-size: 10px;
  color: var(--color-on-surface-variant);
  opacity: 0.8;
  padding: 0 4px;
}
rich-text-editor .rte-view {
  border: 1px solid var(--color-outline-variant);
  border-radius: 0 0 var(--radius) var(--radius);
  background-color: var(--color-background);
  min-height: 96px;
  max-height: 340px;
  overflow-y: auto;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.55;
}
rich-text-editor .rte-view:focus-within {
  border-color: var(--color-primary);
}
rich-text-editor .ProseMirror {
  outline: none;
  min-height: 76px;
}
rich-text-editor .ProseMirror p { margin: 0 0 6px; }
rich-text-editor .ProseMirror p:last-child { margin-bottom: 0; }
rich-text-editor .ProseMirror h1,
rich-text-editor .ProseMirror h2,
rich-text-editor .ProseMirror h3,
rich-text-editor .ProseMirror h4 { margin: 8px 0 6px; }
rich-text-editor .ProseMirror ul,
rich-text-editor .ProseMirror ol { padding-left: 20px; margin: 0 0 6px; }
rich-text-editor .ProseMirror blockquote {
  border-left: 2px solid var(--color-outline-variant);
  margin: 0 0 6px;
  padding-left: 10px;
  color: var(--color-on-surface-variant);
}
rich-text-editor .ProseMirror pre {
  background-color: var(--color-surface-variant);
  border-radius: var(--radius);
  padding: 8px 10px;
  margin: 0 0 6px;
  font-family: var(--font-label);
  font-size: 11px;
  overflow-x: auto;
}
rich-text-editor .ProseMirror code {
  font-family: var(--font-label);
  font-size: 11px;
  background-color: var(--color-surface-variant);
  border-radius: 4px;
  padding: 1px 4px;
}
rich-text-editor .ProseMirror pre code {
  background: none;
  padding: 0;
}
rich-text-editor .ProseMirror img {
  max-width: 100%;
  border-radius: var(--radius);
  display: block;
  margin: 6px 0;
}
rich-text-editor .ProseMirror img.ProseMirror-selectednode {
  outline: 2px solid var(--color-primary);
}
rich-text-editor .ProseMirror hr {
  border: none;
  border-top: 1px solid var(--color-outline-variant);
  margin: 10px 0;
}
rich-text-editor .ProseMirror a { color: var(--color-primary); }
rich-text-editor .rte-placeholder {
  color: var(--color-on-surface-variant);
  opacity: 0.5;
  pointer-events: none;
}
rich-text-editor .rte-view::-webkit-scrollbar { width: 8px; }
rich-text-editor .rte-view::-webkit-scrollbar-thumb {
  background-color: var(--color-surface-container-highest);
  border-radius: 999px;
}
`;

let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const tag = document.createElement('style');
  tag.textContent = STYLE;
  document.head.append(tag);
}

// ------------------------------------------------------- image upload

function openUploadPicker(view, uploadUrl) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/avif,image/x-icon,image/bmp';
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const res = await fetch(`${uploadUrl}?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!res.ok) {
        let message = `Upload failed (${res.status})`;
        try {
          const parsed = await res.json();
          if (parsed && parsed.error && parsed.error.message) message = parsed.error.message;
        } catch (_) {}
        window.alert(message);
        return;
      }
      const data = await res.json();
      insertImageNode(view, data.url, file.name.replace(/\.[^.]+$/, ''));
    } catch (err) {
      window.alert(`Upload failed: ${err.message || err}`);
    }
  });
  input.click();
}

// --------------------------------------------------------------- element

class RichTextEditor extends HTMLElement {
  connectedCallback() {
    if (this._built) return;
    this._built = true;
    injectStyle();

    this._format = this.getAttribute('format') === 'markdown' ? 'markdown' : 'html';
    this._uploadUrl = this.getAttribute('upload-url') || null;
    const items = buildToolbarItems(this._format, this._uploadUrl);

    const toolbar = document.createElement('div');
    toolbar.className = 'rte-toolbar';
    this._buttons = [];
    for (const item of items) {
      if (item.sep) {
        toolbar.append(Object.assign(document.createElement('span'), { className: 'rte-sep' }));
        continue;
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rte-btn';
      btn.title = item.title;
      if (item.icon) {
        btn.append(Object.assign(document.createElement('span'), {
          className: 'material-symbols-outlined',
          textContent: item.icon,
        }));
      } else {
        btn.textContent = item.text;
      }
      btn.addEventListener('mousedown', (e) => e.preventDefault());
      btn.addEventListener('click', () => {
        item.run(this._view);
        this._syncToolbar();
      });
      this._buttons.push({ item, btn });
      toolbar.append(btn);
    }
    const count = document.createElement('span');
    count.className = 'rte-count';
    toolbar.append(count);
    this._count = count;

    const view = document.createElement('div');
    view.className = 'rte-view';
    this.append(toolbar, view);

    this._view = new EditorView(view, {
      state: EditorState.create({
        doc: parseContent(this.getAttribute('value') ?? '', this._format),
        plugins: [
          inputRules({
            rules: [
              ...smartQuotes,
              ellipsis,
              emDash,
              textblockTypeInputRule(/^#{1,3}\s$/, schema.nodes.heading, (m) => ({ level: m[0].trim().length })),
              wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote),
              wrappingInputRule(/^\s*[-+*]\s$/, schema.nodes.bullet_list),
              wrappingInputRule(/^\s*(\d+)\.\s$/, schema.nodes.ordered_list,
                (m) => ({ order: +m[1] }),
                (state, node) => node.childCount + node.attrs.order === state.selection.$from.number),
              textblockTypeInputRule(/^```(\w+)?\s$/, schema.nodes.code_block),
            ],
          }),
          placeholderPlugin('Write something…'),
          history(),
          keymap({
            'Mod-z': undo,
            'Mod-y': redo,
            'Shift-Mod-z': redo,
            'Mod-b': toggleMark(schema.marks.strong),
            'Mod-i': toggleMark(schema.marks.em),
            'Mod-k': (state, dispatch) => toggleLink({ state, dispatch, focus: () => this._view.focus() }),
            'Mod-Enter': insertHardBreak,
            'Shift-Enter': insertHardBreak,
            'Mod-Alt-0': setBlockType(schema.nodes.paragraph),
            'Mod-Alt-1': setBlockType(schema.nodes.heading, { level: 1 }),
            'Mod-Alt-2': setBlockType(schema.nodes.heading, { level: 2 }),
            'Mod-Alt-3': setBlockType(schema.nodes.heading, { level: 3 }),
            'Mod-Alt-4': setBlockType(schema.nodes.heading, { level: 4 }),
            Enter: splitListItem(schema.nodes.list_item),
            'Mod-[': liftListItem(schema.nodes.list_item),
            'Mod-]': sinkListItem(schema.nodes.list_item),
          }),
          keymap(baseKeymap),
        ],
      }),
      dispatchTransaction: (tr) => {
        const v = this._view;
        v.updateState(v.state.apply(tr));
        if (tr.docChanged) {
          this._updateCount();
          this._emit();
        }
        this._syncToolbar();
      },
    });
    this._updateCount();
    this._syncToolbar();
  }

  disconnectedCallback() {
    if (this._view) {
      this._view.destroy();
      this._view = null;
    }
  }

  _updateCount() {
    if (!this._view || !this._count) return;
    const text = this._view.state.doc.textBetween(0, this._view.state.doc.content.size, ' ', ' ');
    const words = text.split(/\s+/).filter(Boolean).length;
    this._count.textContent = `${words} word${words === 1 ? '' : 's'} · ${text.length} char${text.length === 1 ? '' : 's'}`;
  }

  _syncToolbar() {
    if (!this._view) return;
    const s = this._view.state;
    for (const { item, btn } of this._buttons) {
      btn.classList.toggle('active', item.active ? item.active(s) : false);
    }
  }

  _emit() {
    this.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /** Insert text at the cursor (inherits active marks). */
  insertText(text) {
    if (!this._view) return;
    const { state } = this._view;
    this._view.dispatch(state.tr.replaceSelectionWith(state.schema.text(text), true).scrollIntoView());
  }

  get format() {
    return this._format ?? 'html';
  }

  get value() {
    if (!this._view) return this.getAttribute('value') ?? '';
    return serializeContent(this._view.state.doc, this._format);
  }

  set value(content) {
    if (!this._view) {
      this.setAttribute('value', content ?? '');
      return;
    }
    if (content === this.value) return;
    if (this._view.hasFocus()) return; // don't yank the doc mid-typing
    const state = EditorState.create({
      doc: parseContent(content, this._format),
      plugins: this._view.state.plugins,
    });
    this._view.updateState(state);
    this._updateCount();
  }
}

customElements.define('rich-text-editor', RichTextEditor);
