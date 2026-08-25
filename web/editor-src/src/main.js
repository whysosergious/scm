// <rich-text-editor> — self-contained ProseMirror wrapper for SCM.
//
// Built as a single ES bundle (vite) and served from /web/scripts/vendor/;
// the vanilla frontend lazy-imports this file when a string property is
// switched to rich-text mode. No runtime dependencies beyond the bundle.
//
// API:
//   <rich-text-editor value="<p>html</p>"></rich-text-editor>
//   el.value            -> current HTML string
//   el.value = html     -> replace document (ignored while the editor has focus)
//   'input' event       -> fired on every document change (bubbles)

import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser as PMDOMParser, DOMSerializer } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes, wrapInList, splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list';
import { toggleMark, chainCommands, exitCode, baseKeymap, wrapIn } from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import markdownit from 'markdown-it';
import {
  MarkdownParser,
  MarkdownSerializer,
  defaultMarkdownParser,
  defaultMarkdownSerializer,
} from 'prosemirror-markdown';

const schema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block'),
  marks: basicSchema.spec.marks,
});

// Markdown round-trip bound to OUR schema (defaults are built for
// schema-basic, but their token/node specs are name-based and cover lists,
// so re-binding to the combined schema is safe).
const markdownParser = new MarkdownParser(
  schema,
  markdownit('commonmark', { html: false }),
  defaultMarkdownParser.tokens,
);
const markdownSerializer = new MarkdownSerializer(
  defaultMarkdownSerializer.nodes,
  defaultMarkdownSerializer.marks,
);

const htmlParser = PMDOMParser.fromSchema(schema);
const htmlSerializer = DOMSerializer.fromSchema(schema);

function parseContent(html, format) {
  const div = document.createElement('div');
  if (format === 'markdown') {
    return markdownParser.parse(String(html ?? ''));
  }
  const raw = String(html ?? '');
  if (!/<[a-z!][\s\S]*>/i.test(raw)) {
    // Plain text: blank lines split paragraphs, single newlines become <br>.
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
  const div = document.createElement('div');
  div.append(htmlSerializer.serializeFragment(doc.content));
  const html = div.innerHTML;
  return format === 'markdown' ? markdownSerializer.serialize(doc).trim() : html;
}

const TOOLBAR = [
  { icon: 'format_bold', title: 'Bold (Ctrl+B)', run: (view) => toggleMark(schema.marks.strong)(view), active: (s) => s.selection.$from.marks().some((m) => m.type === schema.marks.strong) },
  { icon: 'format_italic', title: 'Italic (Ctrl+I)', run: (view) => toggleMark(schema.marks.em)(view), active: (s) => s.selection.$from.marks().some((m) => m.type === schema.marks.em) },
  { icon: 'code', title: 'Code', run: (view) => toggleMark(schema.marks.code)(view), active: (s) => s.selection.$from.marks().some((m) => m.type === schema.marks.code) },
  { sep: true },
  { icon: 'format_list_bulleted', title: 'Bullet list', run: (view) => wrapInList(schema.nodes.bullet_list)(view) },
  { icon: 'format_list_numbered', title: 'Numbered list', run: (view) => wrapInList(schema.nodes.ordered_list)(view) },
  { icon: 'format_quote', title: 'Quote', run: (view) => wrapIn(schema.nodes.blockquote)(view) },
  { sep: true },
  { icon: 'undo', title: 'Undo (Ctrl+Z)', run: (view) => undo(view.state, view.dispatch) },
  { icon: 'redo', title: 'Redo (Ctrl+Y)', run: (view) => redo(view.state, view.dispatch) },
];

const STYLE = `
rich-text-editor { display: block; }
rich-text-editor .rte-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border: 1px solid var(--color-outline-variant);
  border-bottom: none;
  border-radius: var(--radius) var(--radius) 0 0;
  background-color: var(--color-surface-container-low);
  overflow: hidden;
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
  padding: 3px;
  border-radius: 4px;
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
rich-text-editor .rte-view {
  border: 1px solid var(--color-outline-variant);
  border-radius: 0 0 var(--radius) var(--radius);
  background-color: var(--color-background);
  min-height: 96px;
  max-height: 320px;
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
rich-text-editor .ProseMirror p {
  margin: 0 0 6px;
}
rich-text-editor .ProseMirror p:last-child {
  margin-bottom: 0;
}
rich-text-editor .ProseMirror ul,
rich-text-editor .ProseMirror ol {
  padding-left: 20px;
  margin: 0 0 6px;
}
rich-text-editor .ProseMirror blockquote {
  border-left: 2px solid var(--color-outline-variant);
  margin: 0 0 6px;
  padding-left: 10px;
  color: var(--color-on-surface-variant);
}
rich-text-editor .ProseMirror code {
  font-family: var(--font-label);
  font-size: 11px;
  background-color: var(--color-surface-variant);
  border-radius: 4px;
  padding: 1px 4px;
}
rich-text-editor .ProseMirror a {
  color: var(--color-primary);
}
rich-text-editor .ProseMirror-focused {
  outline: none;
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

class RichTextEditor extends HTMLElement {
  connectedCallback() {
    if (this._built) return;
    this._built = true;
    injectStyle();

    const toolbar = document.createElement('div');
    toolbar.className = 'rte-toolbar';
    for (const item of TOOLBAR) {
      if (item.sep) {
        toolbar.append(Object.assign(document.createElement('span'), { className: 'rte-sep' }));
        continue;
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rte-btn';
      btn.title = item.title;
      btn.append(Object.assign(document.createElement('span'), {
        className: 'material-symbols-outlined',
        textContent: item.icon,
      }));
      btn.addEventListener('mousedown', (e) => e.preventDefault()); // keep selection
      btn.addEventListener('click', () => {
        item.run(this._view);
        this._view.focus();
        this._syncToolbar();
      });
      toolbar.append(btn);
    }

    const view = document.createElement('div');
    view.className = 'rte-view';

    this.append(toolbar, view);

    this._format = this.getAttribute('format') === 'markdown' ? 'markdown' : 'html';
    this._view = new EditorView(view, {
      state: EditorState.create({
        doc: parseContent(this.getAttribute('value') ?? '', this._format),
        plugins: [
          history(),
          keymap({
            'Mod-z': undo,
            'Mod-y': redo,
            'Shift-Mod-z': redo,
            'Mod-b': toggleMark(schema.marks.strong),
            'Mod-i': toggleMark(schema.marks.em),
            Enter: splitListItem(schema.nodes.list_item),
            'Mod-[': liftListItem(schema.nodes.list_item),
            'Mod-]': sinkListItem(schema.nodes.list_item),
            'Mod-Enter': chainCommands(exitCode, (state, dispatch) => {
              // hard break via <br> is not in schema-basic; exit code block instead
              return exitCode(state, dispatch);
            }),
          }),
          keymap(baseKeymap),
        ],
      }),
      dispatchTransaction: (tr) => {
        const v = this._view;
        v.updateState(v.state.apply(tr));
        if (tr.docChanged) {
          this._emit();
        }
        this._syncToolbar();
      },
    });
    this._syncToolbar();
  }

  disconnectedCallback() {
    if (this._view) {
      this._view.destroy();
      this._view = null;
    }
  }

  _syncToolbar() {
    if (!this._view) return;
    const s = this._view.state;
    for (const btn of this.querySelectorAll('.rte-btn')) {
      const item = TOOLBAR[[...btn.parentElement.children].indexOf(btn)];
      if (item?.active) btn.classList.toggle('active', item.active(s));
    }
  }

  _emit() {
    this.dispatchEvent(new Event('input', { bubbles: true }));
  }

  get format() {
    return this._format ?? 'html';
  }

  get value() {
    if (!this._view) return this.getAttribute('value') ?? '';
    return serializeContent(this._view.state.doc, this._format);
  }

  set value(html) {
    if (!this._view) {
      this.setAttribute('value', html ?? '');
      return;
    }
    if (html === this.value) return;
    if (this._view.hasFocus()) return; // don't yank the doc mid-typing
    const state = EditorState.create({
      doc: parseContent(html, this._format),
      plugins: this._view.state.plugins,
    });
    this._view.updateState(state);
  }
}

customElements.define('rich-text-editor', RichTextEditor);
