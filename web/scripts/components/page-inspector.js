// Inspector panel for the page editor (spec_page_editor.md §11).
// Shows selected node properties, CSS inputs, and class assignment.

import * as pm from '../page-model.js';
import { el, icon } from '../dom.js';

const CSS_PROPS = [
  { key: 'display', label: 'Display', type: 'select', options: ['block', 'flex', 'grid', 'none'] },
  { key: 'width', label: 'Width', type: 'text' },
  { key: 'max-width', label: 'Max Width', type: 'text' },
  { key: 'min-height', label: 'Min Height', type: 'text' },
  { key: 'margin', label: 'Margin', type: 'text' },
  { key: 'padding', label: 'Padding', type: 'text' },
  { key: 'gap', label: 'Gap', type: 'text' },
  { key: 'color', label: 'Color', type: 'text' },
  { key: 'background-color', label: 'Background', type: 'text' },
  { key: 'font-size', label: 'Font Size', type: 'text' },
  { key: 'font-weight', label: 'Font Weight', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { key: 'line-height', label: 'Line Height', type: 'text' },
  { key: 'text-align', label: 'Text Align', type: 'select', options: ['left', 'center', 'right', 'justify'] },
  { key: 'border', label: 'Border', type: 'text' },
  { key: 'border-radius', label: 'Border Radius', type: 'text' },
  { key: 'box-shadow', label: 'Box Shadow', type: 'text' },
  { key: 'flex-direction', label: 'Flex Direction', type: 'select', options: ['row', 'column', 'row-reverse', 'column-reverse'] },
  { key: 'justify-content', label: 'Justify', type: 'select', options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'] },
  { key: 'align-items', label: 'Align Items', type: 'select', options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'] },
  { key: 'grid-template-columns', label: 'Grid Columns', type: 'text' },
];

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
      placeholder: 'Text content…',
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
          src: node.props.src,
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

  for (const prop of CSS_PROPS) {
    const currentVal = node.styles[prop.key] || '';
    let input;

    if (prop.type === 'select') {
      input = el('select', { class: 'value-input' });
      input.append(el('option', { value: '', text: '(default)' }));
      for (const opt of prop.options) {
        const o = el('option', { value: opt, text: opt });
        if (opt === currentVal) o.selected = true;
        input.append(o);
      }
    } else {
      input = el('input', {
        type: 'text',
        class: 'value-input',
        value: currentVal,
        placeholder: prop.label,
      });
    }

    input.addEventListener('change', () => {
      if (input.value) {
        node.styles[prop.key] = input.value;
      } else {
        delete node.styles[prop.key];
      }
      onChange();
    });

    root.append(el('div', { class: 'inspector-css-row' },
      el('span', { class: 'inspector-css-label', text: prop.label }),
      input,
    ));
  }

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
