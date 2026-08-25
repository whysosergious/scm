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

  // Reusable classes
  if (doc.classes && doc.classes.length > 0) {
    root.append(el('div', { class: 'inspector-divider' }));
    root.append(el('div', { class: 'inspector-section' },
      el('label', { text: 'Classes' }),
    ));

    if (!node.classes) node.classes = [];

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
  }

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
 * Shows a CSS property picker dropdown with search filtering and keyboard navigation.
 * @param {HTMLElement} container - The styles container element.
 * @param {HTMLElement} addBtn - The "Add style" button to position the picker near.
 * @param {Object} node - The page node being edited.
 * @param {function(): void} onChange - Callback invoked when a property is added.
 * @param {function(): void} renderStyles - Callback to re-render the styles list.
 * @returns {void}
 */
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
