// Inspector panel for the page editor (spec_page_editor.md §11).
// Shows selected node properties, CSS inputs, and class assignment.

import * as pm from '../page-model.js';
import { el, icon } from '../dom.js';
import { selectedProject } from '../state.js';

/**
 * Resolves an image source path relative to the selected project's files endpoint.
 * @param {string} src - Image source path (may be relative, absolute, or data URI).
 * @returns {string} Resolved absolute URL or the original source.
 */
function resolveImgSrc(src) {
  if (!src) return '';
  if (src.startsWith('/') || src.startsWith('http') || src.startsWith('data:')) return src;
  const project = selectedProject();
  return project ? `/files/${project.id}/${src}` : src;
}

/**
 * @typedef {Object} CssPropDef
 * @property {string} key - CSS property name.
 * @property {string} label - Display label.
 * @property {'text'|'select'} type - Input type.
 * @property {string} [placeholder] - Placeholder text for text inputs.
 * @property {string[]} [options] - Select options for select inputs.
 */

/** @type {CssPropDef[]} List of editable CSS properties for the inspector. */
const CSS_PROPS = [
  { key: 'display', label: 'display', type: 'select', options: ['block', 'flex', 'grid', 'none', 'inline', 'inline-block', 'inline-flex'] },
  { key: 'position', label: 'position', type: 'select', options: ['static', 'relative', 'absolute', 'fixed', 'sticky'] },
  { key: 'top', label: 'top', type: 'text', placeholder: 'auto' },
  { key: 'right', label: 'right', type: 'text', placeholder: 'auto' },
  { key: 'bottom', label: 'bottom', type: 'text', placeholder: 'auto' },
  { key: 'left', label: 'left', type: 'text', placeholder: 'auto' },
  { key: 'z-index', label: 'z-index', type: 'text', placeholder: 'auto' },
  { key: 'width', label: 'width', type: 'text', placeholder: 'auto' },
  { key: 'max-width', label: 'max-width', type: 'text', placeholder: 'none' },
  { key: 'min-width', label: 'min-width', type: 'text', placeholder: '0' },
  { key: 'height', label: 'height', type: 'text', placeholder: 'auto' },
  { key: 'max-height', label: 'max-height', type: 'text', placeholder: 'none' },
  { key: 'min-height', label: 'min-height', type: 'text', placeholder: '0' },
  { key: 'margin', label: 'margin', type: 'text', placeholder: '0' },
  { key: 'margin-top', label: 'margin-top', type: 'text', placeholder: '0' },
  { key: 'margin-right', label: 'margin-right', type: 'text', placeholder: '0' },
  { key: 'margin-bottom', label: 'margin-bottom', type: 'text', placeholder: '0' },
  { key: 'margin-left', label: 'margin-left', type: 'text', placeholder: '0' },
  { key: 'padding', label: 'padding', type: 'text', placeholder: '0' },
  { key: 'padding-top', label: 'padding-top', type: 'text', placeholder: '0' },
  { key: 'padding-right', label: 'padding-right', type: 'text', placeholder: '0' },
  { key: 'padding-bottom', label: 'padding-bottom', type: 'text', placeholder: '0' },
  { key: 'padding-left', label: 'padding-left', type: 'text', placeholder: '0' },
  { key: 'gap', label: 'gap', type: 'text', placeholder: '0' },
  { key: 'flex-direction', label: 'flex-direction', type: 'select', options: ['row', 'column', 'row-reverse', 'column-reverse'] },
  { key: 'flex-wrap', label: 'flex-wrap', type: 'select', options: ['nowrap', 'wrap', 'wrap-reverse'] },
  { key: 'flex-grow', label: 'flex-grow', type: 'text', placeholder: '0' },
  { key: 'flex-shrink', label: 'flex-shrink', type: 'text', placeholder: '1' },
  { key: 'flex-basis', label: 'flex-basis', type: 'text', placeholder: 'auto' },
  { key: 'justify-content', label: 'justify-content', type: 'select', options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'] },
  { key: 'align-items', label: 'align-items', type: 'select', options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'] },
  { key: 'align-self', label: 'align-self', type: 'select', options: ['auto', 'flex-start', 'center', 'flex-end', 'stretch', 'baseline'] },
  { key: 'grid-template-columns', label: 'grid-template-columns', type: 'text', placeholder: 'none' },
  { key: 'grid-template-rows', label: 'grid-template-rows', type: 'text', placeholder: 'none' },
  { key: 'grid-gap', label: 'grid-gap', type: 'text', placeholder: '0' },
  { key: 'color', label: 'color', type: 'text', placeholder: 'inherit' },
  { key: 'background-color', label: 'background-color', type: 'text', placeholder: 'transparent' },
  { key: 'background-image', label: 'background-image', type: 'text', placeholder: 'none' },
  { key: 'font-size', label: 'font-size', type: 'text', placeholder: 'medium' },
  { key: 'font-weight', label: 'font-weight', type: 'select', options: ['normal', 'bold', 'lighter', 'bolder', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { key: 'font-family', label: 'font-family', type: 'text', placeholder: 'inherit' },
  { key: 'line-height', label: 'line-height', type: 'text', placeholder: 'normal' },
  { key: 'text-align', label: 'text-align', type: 'select', options: ['left', 'center', 'right', 'justify'] },
  { key: 'text-decoration', label: 'text-decoration', type: 'select', options: ['none', 'underline', 'overline', 'line-through'] },
  { key: 'text-transform', label: 'text-transform', type: 'select', options: ['none', 'capitalize', 'uppercase', 'lowercase'] },
  { key: 'letter-spacing', label: 'letter-spacing', type: 'text', placeholder: 'normal' },
  { key: 'word-spacing', label: 'word-spacing', type: 'text', placeholder: 'normal' },
  { key: 'white-space', label: 'white-space', type: 'select', options: ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line'] },
  { key: 'overflow', label: 'overflow', type: 'select', options: ['visible', 'hidden', 'scroll', 'auto'] },
  { key: 'overflow-x', label: 'overflow-x', type: 'select', options: ['visible', 'hidden', 'scroll', 'auto'] },
  { key: 'overflow-y', label: 'overflow-y', type: 'select', options: ['visible', 'hidden', 'scroll', 'auto'] },
  { key: 'border', label: 'border', type: 'text', placeholder: 'none' },
  { key: 'border-width', label: 'border-width', type: 'text', placeholder: 'medium' },
  { key: 'border-style', label: 'border-style', type: 'select', options: ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'] },
  { key: 'border-color', label: 'border-color', type: 'text', placeholder: 'currentcolor' },
  { key: 'border-radius', label: 'border-radius', type: 'text', placeholder: '0' },
  { key: 'box-shadow', label: 'box-shadow', type: 'text', placeholder: 'none' },
  { key: 'opacity', label: 'opacity', type: 'text', placeholder: '1' },
  { key: 'cursor', label: 'cursor', type: 'select', options: ['auto', 'default', 'none', 'pointer', 'text', 'wait', 'help', 'move', 'grab', 'grabbing'] },
  { key: 'transition', label: 'transition', type: 'text', placeholder: 'none' },
];

/** @type {Object<string, CssPropDef>} Map of CSS property key to its definition for quick lookup. */
const CSS_PROP_MAP = Object.fromEntries(CSS_PROPS.map((p) => [p.key, p]));

/**
 * @typedef {Object} AttrDef
 * @property {string} key - Attribute name.
 * @property {string} label - Display label.
 * @property {string[]} [applies] - Elements this attribute applies to (all elements when omitted).
 * @property {'text'|'select'|'bool'} [type] - Input type (default 'text').
 * @property {string[]} [options] - Select options for select inputs.
 * @property {string} [placeholder] - Placeholder text for text inputs.
 */

/** @type {AttrDef[]} Known HTML attributes offered by the attribute picker. */
const ATTR_DEFS = [
  { key: 'href', label: 'href', applies: ['a'], placeholder: './page.html or https://…' },
  { key: 'target', label: 'target', applies: ['a'], type: 'select', options: ['_self', '_blank', '_parent', '_top'] },
  { key: 'rel', label: 'rel', applies: ['a'], placeholder: 'noopener' },
  { key: 'download', label: 'download', applies: ['a'], placeholder: 'filename' },
  { key: 'type', label: 'type', applies: ['button'], placeholder: 'button' },
  { key: 'disabled', label: 'disabled', type: 'bool', applies: ['button'] },
  { key: 'src', label: 'src', applies: ['video', 'audio'], placeholder: './media/file.mp4' },
  { key: 'controls', label: 'controls', type: 'bool', applies: ['video', 'audio'] },
  { key: 'autoplay', label: 'autoplay', type: 'bool', applies: ['video', 'audio'] },
  { key: 'loop', label: 'loop', type: 'bool', applies: ['video', 'audio'] },
  { key: 'muted', label: 'muted', type: 'bool', applies: ['video'] },
  { key: 'preload', label: 'preload', applies: ['video', 'audio'], type: 'select', options: ['auto', 'metadata', 'none'] },
  { key: 'poster', label: 'poster', applies: ['video'], placeholder: './media/poster.jpg' },
  { key: 'title', label: 'title', placeholder: 'tooltip' },
  { key: 'role', label: 'role', placeholder: 'navigation' },
  { key: 'tabindex', label: 'tabindex', placeholder: '0' },
  { key: 'aria-label', label: 'aria-label', placeholder: '' },
  { key: 'aria-hidden', label: 'aria-hidden', placeholder: 'true' },
];

/** @type {Set<string>} Attributes rendered/treated as presence-only flags (empty-string value). */
const BOOLEAN_ATTRS = new Set(['disabled', 'controls', 'autoplay', 'loop', 'muted']);

/**
 * Renders the inspector panel showing selected node properties, CSS styles, and class assignment.
 * @param {HTMLElement} root - Container element to render the inspector into.
 * @param {Object|null} doc - Page document with root node tree and classes array.
 * @param {string|null} selectedNodeId - ID of the currently selected node, or null.
 * @param {function(): void} onChange - Callback invoked when any property is modified.
 * @returns {void}
 */
export function renderInspector(root, doc, selectedNodeId, onChange) {
  root.textContent = '';

  if (!doc || !selectedNodeId) {
    root.append(el('div', { class: 'inspector-empty' },
      el('span', { class: 'muted-note', text: 'Select a node on the canvas' }),
    ));
    return;
  }

  const node = pm.findNode(doc.root, selectedNodeId);
  if (!node) {
    root.append(el('div', { class: 'inspector-empty' },
      el('span', { class: 'muted-note', text: 'Node not found' }),
    ));
    return;
  }

  root.append(el('div', { class: 'canvas-label mono-label', text: 'INSPECTOR' }));

  // Node ID
  root.append(el('div', { class: 'inspector-section' },
    el('label', { text: 'ID' }),
    el('div', { class: 'inspector-id', text: node.id }),
  ));

  // Type
  root.append(el('div', { class: 'inspector-section' },
    el('label', { text: 'Type' }),
    el('div', { class: 'inspector-type', text: node.type }),
  ));

  // Element selector (Box and Text)
  if (node.type === 'box' || node.type === 'text') {
    const elements = node.type === 'box' ? pm.BOX_ELEMENTS : pm.TEXT_ELEMENTS;
    const currentEl = (node.props && node.props.element) || elements[0];
    const select = el('select', { class: 'value-input' });
    for (const e of elements) {
      const opt = el('option', { value: e, text: e });
      if (e === currentEl) opt.selected = true;
      select.append(opt);
    }
    select.addEventListener('change', () => {
      node.props.element = select.value;
      onChange();
    });
    root.append(el('div', { class: 'inspector-section' },
      el('label', { text: 'Element' }),
      select,
    ));
  }

  // Text content
  if (node.type === 'text') {
    const ta = el('textarea', {
      class: 'value-input',
      rows: '3',
      placeholder: 'Text content...',
    });
    ta.value = (node.props && node.props.value) || '';
    ta.addEventListener('input', () => {
      node.props.value = ta.value;
      onChange();
    });
    root.append(el('div', { class: 'inspector-section' },
      el('label', { text: 'Content' }),
      ta,
    ));
  }

  // Image props
  if (node.type === 'image') {
    const srcInput = el('input', {
      type: 'text',
      class: 'value-input',
      value: (node.props && node.props.src) || '',
      placeholder: './media/image.png',
    });
    srcInput.addEventListener('input', () => {
      node.props.src = srcInput.value;
      onChange();
    });

    const altInput = el('input', {
      type: 'text',
      class: 'value-input',
      value: (node.props && node.props.alt) || '',
      placeholder: 'Alt text (required)',
    });
    altInput.addEventListener('input', () => {
      node.props.alt = altInput.value;
      onChange();
    });

    root.append(el('div', { class: 'inspector-section' },
      el('label', { text: 'Source' }),
      srcInput,
    ));
    root.append(el('div', { class: 'inspector-section' },
      el('label', { text: 'Alt text' }),
      altInput,
    ));

    // Preview thumbnail
    if (node.props.src) {
      root.append(el('div', { class: 'inspector-section' },
        el('label', { text: 'Preview' }),
        el('img', {
          src: resolveImgSrc(node.props.src),
          alt: node.props.alt || '',
          style: { maxWidth: '100%', borderRadius: '4px' },
        }),
      ));
    }
  }

  // Element-specific quick fields backed by node.attrs
  if (!node.attrs) node.attrs = {};
  const elementName = (node.props && node.props.element) || '';
  const attrFieldRows = [];

  /**
   * Builds an input bound to node.attrs[key] (checkbox/select/text per def).
   * @param {string} key - Attribute name to bind.
   * @param {AttrDef|null} def - Attribute definition shaping the input.
   * @returns {HTMLInputElement|HTMLSelectElement} The bound input element.
   */
  function makeAttrInput(key, def) {
    if (def && def.type === 'bool') {
      const cb = el('input', { type: 'checkbox' });
      cb.checked = key in node.attrs;
      cb.addEventListener('change', () => {
        if (cb.checked) node.attrs[key] = '';
        else delete node.attrs[key];
        onChange();
      });
      return cb;
    }
    if (def && def.type === 'select') {
      const sel = el('select', { class: 'value-input' });
      for (const opt of def.options) {
        const o = el('option', { value: opt, text: opt });
        if ((node.attrs[key] || '') === opt) o.selected = true;
        sel.append(o);
      }
      sel.addEventListener('change', () => {
        if (sel.value) node.attrs[key] = sel.value;
        else delete node.attrs[key];
        onChange();
      });
      return sel;
    }
    const input = el('input', {
      type: 'text',
      class: 'value-input',
      value: node.attrs[key] || '',
      placeholder: (def && def.placeholder) || '',
    });
    input.addEventListener('input', () => {
      if (input.value) node.attrs[key] = input.value;
      else delete node.attrs[key];
      onChange();
    });
    return input;
  }

  /**
   * Appends a labelled attribute row to the pending quick-field list.
   * @param {string} labelText - Row label.
   * @param {string} key - Attribute name to bind.
   * @param {AttrDef|null} def - Attribute definition shaping the input.
   * @returns {void}
   */
  function pushAttrRow(labelText, key, def) {
    attrFieldRows.push(el('div', { class: 'inspector-css-row' },
      el('span', { class: 'inspector-css-label', text: labelText }),
      makeAttrInput(key, def),
    ));
  }

  if (elementName === 'a') {
    pushAttrRow('Href', 'href', ATTR_DEFS.find((d) => d.key === 'href'));
    pushAttrRow('Target', 'target', ATTR_DEFS.find((d) => d.key === 'target'));
  }
  if (elementName === 'button') {
    pushAttrRow('Type', 'type', { key: 'type', type: 'select', options: ['button', 'submit', 'reset'] });
    pushAttrRow('Disabled', 'disabled', ATTR_DEFS.find((d) => d.key === 'disabled'));
  }
  if (elementName === 'video' || elementName === 'audio') {
    pushAttrRow('Source', 'src', ATTR_DEFS.find((d) => d.key === 'src'));
    pushAttrRow('Controls', 'controls', ATTR_DEFS.find((d) => d.key === 'controls'));
    pushAttrRow('Autoplay', 'autoplay', ATTR_DEFS.find((d) => d.key === 'autoplay'));
    pushAttrRow('Loop', 'loop', ATTR_DEFS.find((d) => d.key === 'loop'));
    if (elementName === 'video') {
      pushAttrRow('Muted', 'muted', ATTR_DEFS.find((d) => d.key === 'muted'));
      pushAttrRow('Poster', 'poster', ATTR_DEFS.find((d) => d.key === 'poster'));
    }
  }

  if (attrFieldRows.length > 0) {
    root.append(el('div', { class: 'inspector-divider' }));
    root.append(el('div', { class: 'inspector-section' },
      el('label', { text: elementName === 'a' ? 'Link' : 'Media' }),
    ));
    for (const row of attrFieldRows) root.append(row);
  }

  // CSS Styles
  root.append(el('div', { class: 'inspector-divider' }));
  root.append(el('div', { class: 'inspector-section' },
    el('label', { text: 'Styles' }),
  ));

  if (!node.styles) node.styles = {};

  const stylesContainer = el('div', { class: 'inspector-styles' });

  function renderStyles() {
    stylesContainer.textContent = '';

    const keys = Object.keys(node.styles).filter((k) => node.styles[k] !== '');

    for (const key of keys) {
      const val = node.styles[key];
      const prop = CSS_PROP_MAP[key];
      const label = prop ? prop.label : key;

      const row = el('div', { class: 'inspector-css-row', 'data-style-key': key });

      // Property name
      row.append(el('span', { class: 'inspector-css-label', text: label }));

      // Value input
      let input;
      if (prop && prop.type === 'select') {
        input = el('select', { class: 'value-input inspector-css-value' });
        for (const opt of prop.options) {
          const o = el('option', { value: opt, text: opt });
          if (opt === val) o.selected = true;
          input.append(o);
        }
      } else {
        const ph = prop ? prop.placeholder : '';
        input = el('input', {
          type: 'text',
          class: 'value-input inspector-css-value',
          value: val,
          placeholder: ph,
        });
        input.addEventListener('focus', () => input.select());
      }

      input.addEventListener('input', () => {
        if (input.value) {
          node.styles[key] = input.value;
        } else {
          delete node.styles[key];
        }
        onChange();
      });

      row.append(input);

      // Remove button
      const removeBtn = el('button', {
        class: 'inspector-css-remove',
        title: 'Remove',
        onclick: () => {
          delete node.styles[key];
          onChange();
          renderStyles();
        },
      }, icon('close', 14));
      row.append(removeBtn);

      stylesContainer.append(row);
    }

    // Add button
    const addBtn = el('button', { class: 'btn-add-menu' }, icon('add', 14), el('span', { text: 'Add style' }));
    addBtn.addEventListener('click', () => showPropertyPicker(stylesContainer, addBtn, node, onChange, renderStyles));
    stylesContainer.append(addBtn);
  }

  renderStyles();
  root.append(stylesContainer);

  // ================== HTML ATTRIBUTES ==================
  root.append(el('div', { class: 'inspector-divider' }));
  root.append(el('div', { class: 'inspector-section' },
    el('label', { text: 'Attributes' }),
  ));

  const attrsContainer = el('div', { class: 'inspector-styles' });

  /** Re-renders the generic attribute rows from node.attrs. */
  function renderAttrs() {
    attrsContainer.textContent = '';

    for (const [key, val] of Object.entries(node.attrs)) {
      const row = el('div', { class: 'inspector-css-row', 'data-attr-key': key });

      row.append(el('span', { class: 'inspector-css-label', text: key }));

      let input;
      if (BOOLEAN_ATTRS.has(key)) {
        input = el('input', { type: 'checkbox', title: 'Uncheck to remove' });
        input.checked = true;
        input.addEventListener('change', () => {
          delete node.attrs[key];
          onChange();
          renderAttrs();
        });
      } else {
        input = el('input', {
          type: 'text',
          class: 'value-input inspector-css-value',
          value: String(val ?? ''),
        });
        input.addEventListener('focus', () => input.select());
        input.addEventListener('input', () => {
          node.attrs[key] = input.value;
          onChange();
        });
      }
      row.append(input);

      row.append(el('button', {
        class: 'inspector-css-remove',
        title: 'Remove',
        onclick: () => {
          delete node.attrs[key];
          onChange();
          renderAttrs();
        },
      }, icon('close', 14)));

      attrsContainer.append(row);
    }

    const addBtn = el('button', { class: 'btn-add-menu' }, icon('add', 14), el('span', { text: 'Add attribute' }));
    addBtn.addEventListener('click', () => showAttrPicker(attrsContainer, addBtn, node, onChange, renderAttrs));
    attrsContainer.append(addBtn);
  }

  renderAttrs();
  root.append(attrsContainer);

  // Reusable classes (assignment)
  root.append(el('div', { class: 'inspector-divider' }));
  root.append(el('div', { class: 'inspector-section' },
    el('label', { text: 'Classes' }),
  ));

  if (!node.classes) node.classes = [];

  if (doc.classes && doc.classes.length > 0) {
    for (const cls of doc.classes) {
      const assigned = node.classes.includes(cls.name);
      const label = el('label', { class: 'inspector-class-item' });
      const cb = el('input', { type: 'checkbox' });
      cb.checked = assigned;
      cb.addEventListener('change', () => {
        if (cb.checked) {
          if (!node.classes.includes(cls.name)) node.classes.push(cls.name);
        } else {
          node.classes = node.classes.filter((c) => c !== cls.name);
        }
        onChange();
      });
      label.append(cb, el('span', { text: cls.label || cls.name }));
      root.append(label);
    }
  } else {
    root.append(el('div', { class: 'muted-note', style: { fontSize: '11px', padding: '2px 0' }, text: 'No classes defined yet' }));
  }

  // Class management (create / edit / delete)
  root.append(el('div', { class: 'inspector-divider' }));
  root.append(el('div', { class: 'inspector-section' },
    el('label', { text: 'Manage Classes' }),
  ));

  const classContainer = el('div', { class: 'inspector-styles' });

  function renderClassList() {
    classContainer.textContent = '';
    if (!doc.classes) doc.classes = [];

    for (let ci = 0; ci < doc.classes.length; ci++) {
      const cls = doc.classes[ci];
      const row = el('div', { class: 'inspector-css-row', 'data-class-idx': String(ci) });

      // Name input
      const nameInput = el('input', {
        type: 'text',
        class: 'value-input inspector-css-value',
        value: cls.name || '',
        placeholder: 'class-name',
        style: { fontFamily: 'monospace', fontSize: '11px' },
      });
      nameInput.addEventListener('input', () => {
        const oldName = cls.name;
        const newName = nameInput.value.trim();
        cls.name = newName;
        // Update references on nodes
        if (oldName && newName && oldName !== newName) {
          for (const n of allNodes(doc.root)) {
            if (n.classes) n.classes = n.classes.map((c) => c === oldName ? newName : c);
          }
        }
        onChange();
      });

      row.append(nameInput);

      // Edit styles button
      const stylesBtn = el('button', {
        class: 'inspector-css-remove',
        title: 'Edit class styles',
        style: { display: 'flex' },
      }, icon('palette', 14));
      row.append(stylesBtn);

      // Delete button
      const delBtn = el('button', {
        class: 'inspector-css-remove',
        title: 'Delete class',
        style: { display: 'flex' },
      }, icon('close', 14));
      delBtn.addEventListener('click', () => {
        if (cls.name && node.classes) {
          node.classes = node.classes.filter((c) => c !== cls.name);
        }
        doc.classes.splice(ci, 1);
        onChange();
        renderClassList();
      });
      row.append(delBtn);

      classContainer.append(row);

      // Inline style editor (toggle on button click)
      let styleSection = null;
      stylesBtn.addEventListener('click', () => {
        if (styleSection) { styleSection.remove(); styleSection = null; return; }
        styleSection = el('div', { class: 'inspector-class-style-editor', style: { paddingLeft: '8px', paddingBottom: '4px' } });

        const labelInput = el('input', {
          type: 'text',
          class: 'value-input',
          value: cls.label || '',
          placeholder: 'Display label (optional)',
        });
        labelInput.addEventListener('input', () => { cls.label = labelInput.value; onChange(); renderClassList(); });
        styleSection.append(el('div', { class: 'inspector-css-row' }, el('span', { class: 'inspector-css-label', text: 'label' }), labelInput));

        const descInput = el('input', {
          type: 'text',
          class: 'value-input',
          value: cls.description || '',
          placeholder: 'Description (optional)',
        });
        descInput.addEventListener('input', () => { cls.description = descInput.value; onChange(); });
        styleSection.append(el('div', { class: 'inspector-css-row' }, el('span', { class: 'inspector-css-label', text: 'desc' }), descInput));

        // CSS properties for this class
        if (!cls.styles) cls.styles = {};
        const keys = Object.keys(cls.styles).filter((k) => cls.styles[k] !== '');

        for (const key of keys) {
          const val = cls.styles[key];
          const prop = CSS_PROP_MAP[key];
          const prow = el('div', { class: 'inspector-css-row' });
          prow.append(el('span', { class: 'inspector-css-label', text: prop ? prop.label : key }));

          let input;
          if (prop && prop.type === 'select') {
            input = el('select', { class: 'value-input inspector-css-value' });
            for (const opt of prop.options) {
              const o = el('option', { value: opt, text: opt });
              if (opt === val) o.selected = true;
              input.append(o);
            }
          } else {
            input = el('input', { type: 'text', class: 'value-input inspector-css-value', value: val, placeholder: prop?.placeholder || '' });
          }
          input.addEventListener('input', () => {
            if (input.value) cls.styles[key] = input.value;
            else delete cls.styles[key];
            onChange();
          });
          prow.append(input);

          prow.append(el('button', {
            class: 'inspector-css-remove',
            title: 'Remove',
            onclick: () => { delete cls.styles[key]; onChange(); renderClassList(); stylesBtn.click(); stylesBtn.click(); },
          }, icon('close', 14)));
          styleSection.append(prow);
        }

        // Add style button for this class
        const addStyleBtn = el('button', { class: 'btn-add-menu' }, icon('add', 14), el('span', { text: 'Add style' }));
        addStyleBtn.addEventListener('click', () => showClassPropertyPicker(styleSection, addStyleBtn, cls, () => { onChange(); renderClassList(); stylesBtn.click(); stylesBtn.click(); }));
        styleSection.append(addStyleBtn);

        row.after(styleSection);
      });
    }

    // Add class button
    const addClassBtn = el('button', { class: 'btn-add-menu' }, icon('add', 14), el('span', { text: 'Add class' }));
    addClassBtn.addEventListener('click', () => {
      const name = 'class-' + (doc.classes.length + 1);
      doc.classes.push({ name, label: '', description: '', styles: {} });
      onChange();
      renderClassList();
    });
    classContainer.append(addClassBtn);
  }

  renderClassList();
  root.append(classContainer);

  // Delete button
  if (node.id !== 'root') {
    root.append(el('div', { class: 'inspector-divider' }));
    const delBtn = el('button', {
      class: 'btn-secondary inspector-delete',
      onclick: () => {
        if (confirm(`Delete node "${node.id}"?`)) {
          pm.removeNode(doc.root, node.id);
          onChange();
        }
      },
    }, icon('delete', 16), ' Delete');
    root.append(delBtn);
  }
}

/**
 * Renders the inspector panel for a head element (spec_page_editor.md §11 "Head element inspector").
 * @param {HTMLElement} root - Container element to render the inspector into.
 * @param {Object|null} doc - Page document containing the head array.
 * @param {number|null} headIndex - Index into doc.head of the selected head element.
 * @param {function(): void} onChange - Callback invoked when any property is modified.
 * @param {function(): void} onRemove - Callback invoked to remove the head element.
 * @returns {void}
 */
export function renderHeadInspector(root, doc, headIndex, onChange, onRemove) {
  root.textContent = '';

  if (!doc || headIndex === null || headIndex === undefined || !doc.head || !doc.head[headIndex]) {
    root.append(el('div', { class: 'inspector-empty' },
      el('span', { class: 'muted-note', text: 'No head element selected' }),
    ));
    return;
  }

  const elem = doc.head[headIndex];

  root.append(el('div', { class: 'canvas-label mono-label', text: 'INSPECTOR' }));

  root.append(el('div', { class: 'inspector-section' },
    el('label', { text: 'Type' }),
    el('div', { class: 'inspector-type', text: elem.type }),
  ));

  // --- stylesheet ---
  if (elem.type === 'stylesheet') {
    const hrefInput = el('input', {
      type: 'text',
      class: 'value-input',
      value: elem.href || '',
      placeholder: '/css/main.css',
    });
    hrefInput.addEventListener('input', () => { elem.href = hrefInput.value; onChange(); });
    root.append(el('div', { class: 'inspector-section' },
      el('label', { text: 'href' }),
      hrefInput,
    ));

    const mediaInput = el('input', {
      type: 'text',
      class: 'value-input',
      value: elem.media || '',
      placeholder: 'screen (optional)',
    });
    mediaInput.addEventListener('input', () => { elem.media = mediaInput.value; onChange(); });
    root.append(el('div', { class: 'inspector-section' },
      el('label', { text: 'media' }),
      mediaInput,
    ));
  }

  // --- style ---
  if (elem.type === 'style') {
    const cssTa = el('textarea', {
      class: 'value-input',
      rows: '8',
      placeholder: 'CSS rules...',
      style: { fontFamily: 'monospace' },
    });
    cssTa.value = elem.css || '';
    cssTa.addEventListener('input', () => { elem.css = cssTa.value; onChange(); });
    root.append(el('div', { class: 'inspector-section' },
      el('label', { text: 'css' }),
      cssTa,
    ));
  }

  // --- meta ---
  if (elem.type === 'meta') {
    const nameInput = el('input', {
      type: 'text',
      class: 'value-input',
      value: elem.name || '',
      placeholder: 'e.g. author, robots',
    });
    nameInput.addEventListener('input', () => { elem.name = nameInput.value; onChange(); });
    root.append(el('div', { class: 'inspector-section' },
      el('label', { text: 'name' }),
      nameInput,
    ));

    const propInput = el('input', {
      type: 'text',
      class: 'value-input',
      value: elem.property || '',
      placeholder: 'e.g. og:title',
    });
    propInput.addEventListener('input', () => { elem.property = propInput.value; onChange(); });
    root.append(el('div', { class: 'inspector-section' },
      el('label', { text: 'property' }),
      propInput,
    ));

    const charsetInput = el('input', {
      type: 'text',
      class: 'value-input',
      value: elem.charset || '',
      placeholder: 'e.g. utf-8',
    });
    charsetInput.addEventListener('input', () => { elem.charset = charsetInput.value; onChange(); });
    root.append(el('div', { class: 'inspector-section' },
      el('label', { text: 'charset' }),
      charsetInput,
    ));

    const contentInput = el('input', {
      type: 'text',
      class: 'value-input',
      value: elem.content || '',
      placeholder: 'Meta content value',
    });
    contentInput.addEventListener('input', () => { elem.content = contentInput.value; onChange(); });
    root.append(el('div', { class: 'inspector-section', 'data-meta-content': '' },
      el('label', { text: 'content' }),
      contentInput,
    ));

    // Hide content when charset is set
    const contentSection = root.querySelector('[data-meta-content]');
    if (elem.charset) contentSection.style.display = 'none';
    charsetInput.addEventListener('input', () => {
      contentSection.style.display = charsetInput.value ? 'none' : '';
    });
  }

  // --- script ---
  if (elem.type === 'script') {
    const srcInput = el('input', {
      type: 'text',
      class: 'value-input',
      value: elem.src || '',
      placeholder: '/js/app.js',
    });
    srcInput.addEventListener('input', () => { elem.src = srcInput.value; onChange(); });
    root.append(el('div', { class: 'inspector-section', 'data-script-src': '' },
      el('label', { text: 'src' }),
      srcInput,
    ));

    const jsTa = el('textarea', {
      class: 'value-input',
      rows: '6',
      placeholder: 'Inline JavaScript...',
      style: { fontFamily: 'monospace' },
    });
    jsTa.value = elem.js || '';
    jsTa.addEventListener('input', () => { elem.js = jsTa.value; onChange(); });
    root.append(el('div', { class: 'inspector-section', 'data-script-js': '' },
      el('label', { text: 'js' }),
      jsTa,
    ));

    // Show src when js is empty, show js when src is empty
    const srcSection = root.querySelector('[data-script-src]');
    const jsSection = root.querySelector('[data-script-js]');
    function syncScriptFields() {
      if (elem.src) {
        jsSection.style.display = 'none';
        srcSection.style.display = '';
      } else {
        srcSection.style.display = 'none';
        jsSection.style.display = '';
      }
    }
    syncScriptFields();
    srcInput.addEventListener('input', () => { syncScriptFields(); });
    jsTa.addEventListener('input', () => { syncScriptFields(); });

    // defer + async checkboxes (only meaningful when src is set)
    const deferCb = el('input', { type: 'checkbox' });
    deferCb.checked = !!elem.defer;
    deferCb.addEventListener('change', () => { elem.defer = deferCb.checked; onChange(); });
    const deferLabel = el('label', { class: 'inspector-class-item' }, deferCb, el('span', { text: 'defer' }));
    const deferRow = el('div', { class: 'inspector-section' }, deferLabel);
    root.append(deferRow);
    deferRow.style.display = elem.src ? '' : 'none';
    srcInput.addEventListener('input', () => { deferRow.style.display = elem.src ? '' : 'none'; });

    const asyncCb = el('input', { type: 'checkbox' });
    asyncCb.checked = !!elem.async;
    asyncCb.addEventListener('change', () => { elem.async = asyncCb.checked; onChange(); });
    const asyncLabel = el('label', { class: 'inspector-class-item' }, asyncCb, el('span', { text: 'async' }));
    const asyncRow = el('div', { class: 'inspector-section' }, asyncLabel);
    root.append(asyncRow);
    asyncRow.style.display = elem.src ? '' : 'none';
    srcInput.addEventListener('input', () => { asyncRow.style.display = elem.src ? '' : 'none'; });
  }

  // Delete button
  root.append(el('div', { class: 'inspector-divider' }));
  const delBtn = el('button', {
    class: 'btn-secondary inspector-delete',
    onclick: () => {
      if (confirm(`Delete ${elem.type} element?`)) {
        onRemove();
      }
    },
  }, icon('delete', 16), ' Delete');
  root.append(delBtn);
}

/**
 * Shows a CSS property picker dropdown with search filtering and keyboard navigation.
 * @param {HTMLElement} container - The styles container element.
 * @param {HTMLElement} addBtn - The "Add style" button to position the picker near.
 * @param {Object} node - The page node being edited.
 * @param {function(): void} onChange - Callback invoked when a property is added.
 * @param {function(): void} renderStyles - Callback to re-render the styles list.
 * @returns {void}
 */
/**
 * Opens a searchable attribute picker filtered to the node's element.
 * Suggests known attributes first; a free-form name matching valid attribute
 * syntax gets an "Add custom" entry.
 * Reuses the CSS property picker styles (.css-property-picker).
 * @param {HTMLElement} container - Container holding the attribute rows.
 * @param {HTMLElement} addBtn - The "Add attribute" button the picker anchors to.
 * @param {Object} node - Page node whose attrs will be modified.
 * @param {function(): void} onChange - Change callback.
 * @param {function(): void} renderAttrs - Re-render callback for the rows.
 * @returns {void}
 */
function showAttrPicker(container, addBtn, node, onChange, renderAttrs) {
  container.querySelector('.css-property-picker')?.remove();

  const elementName = (node.props && node.props.element) || '';
  const usedKeys = new Set(Object.keys(node.attrs || {}));
  const relevant = (def) =>
    (!def.applies || def.applies.includes(elementName)) && !usedKeys.has(def.key);

  let highlightIdx = -1;
  let filteredItems = [];

  const VALID_NAME = /^[a-zA-Z_][a-zA-Z0-9_:.-]*$/;

  const picker = el('div', { class: 'css-property-picker' });
  const search = el('input', {
    type: 'text',
    class: 'value-input css-picker-search',
    placeholder: 'Search or type name…',
  });
  const list = el('div', { class: 'css-picker-list' });

  function renderList(filter = '') {
    list.textContent = '';
    highlightIdx = -1;
    const lower = filter.toLowerCase();
    filteredItems = ATTR_DEFS.filter((d) =>
      relevant(d) &&
      (d.label.toLowerCase().includes(lower) || d.key.toLowerCase().includes(lower))
    );

    for (let i = 0; i < filteredItems.length; i++) {
      const def = filteredItems[i];
      const kind = def.type === 'bool' ? 'flag' : def.type === 'select' ? 'select' : 'value';
      const item = el('div', { class: 'css-picker-item', 'data-idx': i },
        el('span', { class: 'css-picker-item-name', text: def.label }),
        el('span', { class: 'css-picker-item-type muted-note', text: kind }),
      );
      item.addEventListener('click', () => pickAttr(def));
      item.addEventListener('mouseenter', () => setHighlight(i));
      list.append(item);
    }

    // Custom attribute entry for free-form valid names
    const trimmed = filter.trim();
    if (
      trimmed && VALID_NAME.test(trimmed) &&
      !usedKeys.has(trimmed) &&
      !filteredItems.some((d) => d.key === trimmed)
    ) {
      const idx = filteredItems.length;
      filteredItems.push({ key: trimmed, custom: true });
      const item = el('div', { class: 'css-picker-item', 'data-idx': idx },
        el('span', { class: 'css-picker-item-name', text: `Add custom "${trimmed}"` }),
        el('span', { class: 'css-picker-item-type muted-note', text: 'custom' }),
      );
      item.addEventListener('click', () => pickCustom(trimmed));
      item.addEventListener('mouseenter', () => setHighlight(idx));
      list.append(item);
    }

    if (filteredItems.length === 0) {
      list.append(el('div', { class: 'css-picker-empty muted-note', text: 'No matching attributes' }));
    } else {
      setHighlight(0);
    }
  }

  function setHighlight(idx) {
    highlightIdx = idx;
    list.querySelectorAll('.css-picker-item').forEach((item, i) => {
      item.classList.toggle('highlighted', i === idx);
    });
    const highlighted = list.querySelector('.highlighted');
    if (highlighted) highlighted.scrollIntoView({ block: 'nearest' });
  }

  function commitKey(key) {
    node.attrs[key] = '';
    onChange();
    picker.remove();
    document.removeEventListener('mousedown', closeHandler);
    renderAttrs();
    requestAnimationFrame(() => {
      const row = container.querySelector(`[data-attr-key="${CSS.escape(key)}"]`);
      const input = row?.querySelector('input[type="text"], select');
      if (input) input.focus();
    });
  }

  function pickAttr(def) { commitKey(def.key); }
  function pickCustom(name) { commitKey(name); }

  search.addEventListener('input', () => renderList(search.value));
  search.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(Math.min(highlightIdx + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(Math.max(highlightIdx - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filteredItems[highlightIdx];
      if (!item) return;
      if (item.custom) pickCustom(item.key);
      else pickAttr(item);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      picker.remove();
      document.removeEventListener('mousedown', closeHandler);
    }
  });

  picker.append(search, list);
  addBtn.before(picker);

  // Flip to drop-up if not enough space below
  const pickerRect = picker.getBoundingClientRect();
  const spaceBelow = window.innerHeight - pickerRect.bottom;
  if (spaceBelow < 180) {
    picker.classList.add('drop-up');
  }

  search.focus();
  renderList();

  const closeHandler = (e) => {
    if (!picker.contains(e.target)) {
      picker.remove();
      document.removeEventListener('mousedown', closeHandler);
    }
  };
  document.addEventListener('mousedown', closeHandler);
}

function showPropertyPicker(container, addBtn, node, onChange, renderStyles) {
  container.querySelector('.css-property-picker')?.remove();

  const usedKeys = new Set(Object.keys(node.styles || {}));
  const available = CSS_PROPS.filter((p) => !usedKeys.has(p.key));

  let highlightIdx = -1;
  let filteredItems = [];

  const picker = el('div', { class: 'css-property-picker' });
  const search = el('input', {
    type: 'text',
    class: 'value-input css-picker-search',
    placeholder: 'Type to search...',
  });
  const list = el('div', { class: 'css-picker-list' });

  function renderList(filter = '') {
    list.textContent = '';
    highlightIdx = -1;
    const lower = filter.toLowerCase();
    filteredItems = available.filter((p) =>
      !usedKeys.has(p.key) && (p.label.toLowerCase().includes(lower) || p.key.toLowerCase().includes(lower))
    );

    for (let i = 0; i < filteredItems.length; i++) {
      const prop = filteredItems[i];
      const item = el('div', { class: 'css-picker-item', 'data-idx': i },
        el('span', { class: 'css-picker-item-name', text: prop.label }),
        el('span', { class: 'css-picker-item-type muted-note', text: prop.type === 'select' ? 'select' : 'value' }),
      );
      item.addEventListener('click', () => pickProperty(prop));
      item.addEventListener('mouseenter', () => setHighlight(i));
      list.append(item);
    }

    if (filteredItems.length === 0) {
      list.append(el('div', { class: 'css-picker-empty muted-note', text: 'No matching properties' }));
    } else {
      setHighlight(0);
    }
  }

  function setHighlight(idx) {
    highlightIdx = idx;
    list.querySelectorAll('.css-picker-item').forEach((item, i) => {
      item.classList.toggle('highlighted', i === idx);
    });
    // Scroll highlighted into view
    const highlighted = list.querySelector('.highlighted');
    if (highlighted) highlighted.scrollIntoView({ block: 'nearest' });
  }

  function pickProperty(prop) {
    const defaultVal = prop.placeholder || (prop.type === 'select' ? prop.options[0] : 'unset');
    node.styles[prop.key] = defaultVal;
    onChange();
    picker.remove();
    renderStyles();
    // Focus the value input for the newly added property
    requestAnimationFrame(() => {
      const row = container.querySelector(`[data-style-key="${prop.key}"]`);
      const input = row?.querySelector('.value-input, select');
      if (input) input.focus();
    });
  }

  search.addEventListener('input', () => renderList(search.value));
  search.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(Math.min(highlightIdx + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(Math.max(highlightIdx - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < filteredItems.length) {
        pickProperty(filteredItems[highlightIdx]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      picker.remove();
    }
  });

  picker.append(search, list);
  addBtn.before(picker);

  // Flip to drop-up if not enough space below
  const pickerRect = picker.getBoundingClientRect();
  const spaceBelow = window.innerHeight - pickerRect.bottom;
  if (spaceBelow < 180) {
    picker.classList.add('drop-up');
  }

  search.focus();
  renderList();

  const closeHandler = (e) => {
    if (!picker.contains(e.target) && e.target !== addBtn) {
      picker.remove();
      document.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => document.addEventListener('click', closeHandler), 0);
}

/**
 * Yields all nodes in the tree (depth-first).
 * @param {Object} node
 * @returns {Generator<Object>}
 */
function* allNodes(node) {
  yield node;
  if (node.children) {
    for (const child of node.children) yield* allNodes(child);
  }
}

/**
 * Shows a CSS property picker for editing a reusable class's styles.
 * @param {HTMLElement} container
 * @param {HTMLElement} addBtn
 * @param {Object} cls - Class object with styles.
 * @param {function(): void} onCommit
 * @returns {void}
 */
function showClassPropertyPicker(container, addBtn, cls, onCommit) {
  container.querySelector('.css-property-picker')?.remove();

  const usedKeys = new Set(Object.keys(cls.styles || {}));
  const available = CSS_PROPS.filter((p) => !usedKeys.has(p.key));

  let highlightIdx = -1;
  let filteredItems = [];

  const picker = el('div', { class: 'css-property-picker' });
  const search = el('input', {
    type: 'text',
    class: 'value-input css-picker-search',
    placeholder: 'Type to search...',
  });
  const list = el('div', { class: 'css-picker-list' });

  function renderList(filter = '') {
    list.textContent = '';
    highlightIdx = -1;
    const lower = filter.toLowerCase();
    filteredItems = available.filter((p) =>
      !usedKeys.has(p.key) && (p.label.toLowerCase().includes(lower) || p.key.toLowerCase().includes(lower))
    );

    for (let i = 0; i < filteredItems.length; i++) {
      const prop = filteredItems[i];
      const item = el('div', { class: 'css-picker-item', 'data-idx': i },
        el('span', { class: 'css-picker-item-name', text: prop.label }),
        el('span', { class: 'css-picker-item-type muted-note', text: prop.type === 'select' ? 'select' : 'value' }),
      );
      item.addEventListener('click', () => pickProperty(prop));
      item.addEventListener('mouseenter', () => setHighlight(i));
      list.append(item);
    }

    if (filteredItems.length === 0) {
      list.append(el('div', { class: 'css-picker-empty muted-note', text: 'No matching properties' }));
    } else {
      setHighlight(0);
    }
  }

  function setHighlight(idx) {
    highlightIdx = idx;
    list.querySelectorAll('.css-picker-item').forEach((item, i) => {
      item.classList.toggle('highlighted', i === idx);
    });
    const highlighted = list.querySelector('.highlighted');
    if (highlighted) highlighted.scrollIntoView({ block: 'nearest' });
  }

  function pickProperty(prop) {
    const defaultVal = prop.placeholder || (prop.type === 'select' ? prop.options[0] : 'unset');
    cls.styles[prop.key] = defaultVal;
    onCommit();
    picker.remove();
    document.removeEventListener('mousedown', closeHandler);
  }

  search.addEventListener('input', () => renderList(search.value));
  search.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(Math.min(highlightIdx + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(Math.max(highlightIdx - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < filteredItems.length) {
        pickProperty(filteredItems[highlightIdx]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      picker.remove();
      document.removeEventListener('mousedown', closeHandler);
    }
  });

  picker.append(search, list);
  addBtn.before(picker);

  const pickerRect = picker.getBoundingClientRect();
  const spaceBelow = window.innerHeight - pickerRect.bottom;
  if (spaceBelow < 180) picker.classList.add('drop-up');

  search.focus();
  renderList();

  const closeHandler = (e) => {
    if (!picker.contains(e.target) && e.target !== addBtn) {
      picker.remove();
      document.removeEventListener('mousedown', closeHandler);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', closeHandler), 0);
}
