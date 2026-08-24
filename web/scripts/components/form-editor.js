// Recursive form renderer for JSON documents (spec_json_edit.md §4–§7).
// Light DOM only; visual language reused from the original sketch classes.

import * as model from '../json-model.js';
import { el, icon } from '../dom.js';
import { enableDrag } from './dnd.js';

const TYPE_LABELS = {
  string: 'String',
  number: 'Number',
  boolean: 'Boolean',
  object: 'Object',
  array: 'Array',
  null: 'Null',
};

export function createFormEditor(rootEl, { tree, onDirty }) {
  const api = {
    tree,
    collapsed: new Set(),
    render,
    expand,
    onDirty,
    focusNewId: null,
  };

  function rerender() {
    render();
    onDirty?.();
  }

  function render() {
    rootEl.textContent = '';
    const list = el('div', {
      class: 'fields-list',
      id: 'form-root-list',
      'data-parent-id': String(tree.id),
    });
    rootEl.append(list);

    if (model.isContainer(tree)) {
      appendChildren(list, tree, 1);
      list.append(addSection(tree));
      if (!model.childCount(tree)) {
        list.append(
          el('p', {
            class: 'muted-note empty-hint',
            text: tree.type === 'object' ? 'No properties yet.' : 'No items yet.',
          }),
        );
      }
    } else {
      // Scalar root: single card without handle/name/delete.
      const card = el('div', { class: 'field-item prop-row' });
      const content = el('div', { class: 'field-content' });
      content.append(
        el('div', { class: 'field-row head-row' },
          el('span', { class: 'mono-label', text: 'Root value' }),
          typeButton(tree)),
      );
      content.append(valueArea(tree));
      card.append(content);
      list.append(card);
    }
  }

  function appendChildren(list, parent, depth) {
    parent.children.forEach((child, index) => {
      list.append(renderRow(child, parent, index, depth));
    });
  }

  // ================== ROW ==================

  function renderRow(node, parent, index, depth) {
    const row = el('div', {
      class: `field-item prop-row ${api.collapsed.has(node.id) ? 'collapsed' : ''}`,
      'data-node-id': String(node.id),
    });

    const handle = el(
      'div',
      { class: 'drag-handle', title: 'Drag to reorder' },
      icon('drag_indicator', 18),
    );

    const content = el('div', { class: 'field-content' });

    // Head row: name/index · type · count.
    const nameCell = el('div', { class: 'name-cell' });
    if (parent.type === 'array') {
      nameCell.append(el('span', { class: 'index-badge', text: `[${index}]` }));
    } else {
      nameCell.append(titleInput(node, parent));
    }

    const head = el(
      'div',
      { class: 'field-row head-row' },
      nameCell,
      el('div', { class: 'head-right' }, countNote(node), typeButton(node)),
    );

    content.append(head);

    const delBtn = el(
      'button',
      {
        class: 'btn-icon delete-btn',
        title: 'Delete',
        onclick: () => {
          if (model.removeNode(api.tree, node)) rerender();
        },
      },
      '×',
    );

    const chevron = el(
      'button',
      {
        class: 'chevron-btn',
        title: node.type === 'object' || node.type === 'array'
          ? 'Expand/collapse'
          : 'Show/hide value',
        onclick: () => toggleCollapse(node.id),
      },
      icon('expand_more', 18),
    );

    // prop-body is a DIRECT child of the row (sibling of field-content) so
    // nested containers and value inputs span the row's full width; the row
    // uses flex-wrap to place it on its own line beneath the head.
    row.append(handle, chevron, content, delBtn, valueArea(node));

    enableDrag({
      handle,
      row,
      api,
      nodeId: node.id,
    });

    if (api.focusNewId === node.id) {
      api.focusNewId = null;
      requestAnimationFrame(() => {
        const input = row.querySelector('.title-input');
        input?.focus();
        input?.select();
      });
    }

    return row;
  }

  function titleInput(node, parent) {
    const input = el('input', {
      type: 'text',
      class: 'title-input',
      value: node.key,
      title: 'Property name',
      autocomplete: 'off',
      spellcheck: 'false',
    });

    let draft = node.key;

    input.addEventListener('input', () => {
      draft = input.value;
      input.classList.remove('invalid');
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      } else if (e.key === 'Escape') {
        draft = node.key;
        input.value = node.key;
        input.classList.remove('invalid');
        input.blur();
      }
    });

    input.addEventListener('blur', () => {
      if (draft === node.key) {
        input.classList.remove('invalid');
        return;
      }
      const res = model.renameKey(parent, node, draft);
      if (res.ok) {
        input.value = node.key;
        input.classList.remove('invalid');
        onDirty?.();
      } else {
        // Inline rejection: highlight and refocus (spec §10).
        input.classList.add('invalid');
        input.title = res.error;
        input.focus();
        input.select();
      }
    });

    return input;
  }

  function countNote(node) {
    if (!model.isContainer(node)) return el('span');
    return el('span', {
      class: 'count-note',
      text: `(${model.childCount(node)} item${model.childCount(node) === 1 ? '' : 's'})`,
    });
  }

  function typeButton(node) {
    const wrap = el('div', { class: 'type-dropdown' });
    const btn = el(
      'button',
      { class: 'type-btn', type: 'button', title: 'Change type' },
      el('span', { class: 'type-label', text: TYPE_LABELS[node.type] }),
      icon('arrow_drop_down', 16),
    );

    let menu = null;

    btn.addEventListener('click', () => {
      if (menu) {
        menu.remove();
        menu = null;
        return;
      }
      menu = el('div', { class: 'menu-dropdown type-menu' });
      for (const t of model.TYPES) {
        menu.append(
          el(
            'button',
            {
              class: `menu-item ${t === node.type ? 'active' : ''}`,
              onclick: () => {
                menu.remove();
                menu = null;
                if (t !== node.type) {
                  model.convertType(node, t);
                  rerender();
                }
              },
            },
            el('span', { text: TYPE_LABELS[t] }),
          ),
        );
      }
      document.body.append(menu);
      const r = btn.getBoundingClientRect();
      menu.style.left = `${Math.min(r.left, window.innerWidth - 200)}px`;
      menu.style.top = `${r.bottom + 4}px`;
      requestAnimationFrame(() =>
        document.addEventListener('click', function onOutside(ev) {
          if (menu && !menu.contains(ev.target)) {
            menu.remove();
            menu = null;
            document.removeEventListener('click', onOutside);
          }
        }),
      );
    });

    wrap.append(btn);
    return wrap;
  }

  // ================== VALUE AREA ==================

  function valueArea(node) {
    const body = el('div', { class: 'prop-body' });

    switch (node.type) {
      case 'string':
        body.append(stringInput(node));
        break;
      case 'number':
        body.append(numberInput(node));
        break;
      case 'boolean':
        body.append(booleanToggle(node));
        break;
      case 'null':
        body.append(el('span', { class: 'muted-note null-note', text: 'null' }));
        break;
      case 'object':
      case 'array': {
        const nested = el('div', {
          class: 'nested-container',
          'data-parent-id': String(node.id),
        });
        appendChildren(nested, node, 2);
        nested.append(addSection(node));
        if (!model.childCount(node)) {
          nested.append(
            el('p', {
              class: 'muted-note empty-hint',
              text: node.type === 'object' ? 'No properties yet.' : 'No items yet.',
            }),
          );
        }
        body.append(nested);
        break;
      }
    }
    return body;
  }

  function stringInput(node) {
    const input = el('input', {
      type: 'text',
      class: 'value-input',
      value: node.value ?? '',
      autocomplete: 'off',
    });
    input.addEventListener('input', () => {
      node.value = input.value;
      onDirty?.();
    });
    return input;
  }

  function numberInput(node) {
    const input = el('input', {
      type: 'number',
      class: 'value-input',
      value: Number.isFinite(node.value) ? node.value : 0,
      step: 'any',
    });
    input.addEventListener('input', () => {
      const n = Number(input.value);
      if (input.value !== '' && !Number.isNaN(n)) {
        node.value = n;
        onDirty?.();
      }
    });
    return input;
  }

  function booleanToggle(node) {
    const input = el('input', { type: 'checkbox' });
    input.checked = !!node.value;
    input.addEventListener('change', () => {
      node.value = input.checked;
      onDirty?.();
    });
    return el('label', { class: 'switch' }, input, el('span', { class: 'slider' }), el('span', { class: 'switch-state', text: input.checked ? 'true' : 'false' }));
  }

  // ================== ADD SECTION ==================

  function addSection(parent) {
    const select = el('select', { class: 'add-type' });
    for (const t of model.TYPES) {
      select.append(el('option', { value: t, text: TYPE_LABELS[t] }));
    }
    const isObj = parent.type === 'object';
    const btn = el(
      'button',
      {
        class: 'btn-primary',
        onclick: () => {
          const child = model.addChild(parent, select.value);
          api.collapsed.delete(parent.id);
          api.focusNewId = isObj ? child.id : null;
          rerender();
        },
      },
      'Add',
    );
    return el(
      'div',
      { class: 'add-section compact' },
      el(
        'div',
        { class: 'add-section-left' },
        icon('add_circle', 16),
        el('span', { text: isObj ? 'Add property' : 'Add entry' }),
      ),
      el('div', { class: 'add-section-right' }, select, btn),
    );
  }

  // ================== COLLAPSE ==================

  function toggleCollapse(id) {
    if (api.collapsed.has(id)) api.collapsed.delete(id);
    else api.collapsed.add(id);
    const row = rootEl.querySelector(`[data-node-id="${id}"]`);
    if (row) row.classList.toggle('collapsed', api.collapsed.has(id));
  }

  /** Used by DnD to auto-expand a collapsed container mid-drag. */
  function expand(id) {
    if (!api.collapsed.has(id)) return false;
    api.collapsed.delete(id);
    const row = rootEl.querySelector(`[data-node-id="${id}"]`);
    if (row) row.classList.remove('collapsed');
    return true;
  }

  return api;
}
