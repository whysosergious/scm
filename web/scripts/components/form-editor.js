// Recursive form renderer for JSON documents (spec.md §9.3–§9.5).
// Light DOM only; visual language reused from the original sketch classes.

import * as model from '../json-model.js';
import { el, icon } from '../dom.js';
import { selectedProject } from '../state.js';
import { enableDrag } from './dnd.js';

/** @type {Object<string, string>} Human-readable labels for each JSON value type. */
const TYPE_LABELS = {
  string: 'String',
  number: 'Number',
  boolean: 'Boolean',
  object: 'Object',
  array: 'Array',
  null: 'Null',
};

/**
 * HTML-ish values carry markup tags; markdown-ish values carry markdown
 * markers (headings, lists, emphasis, code, links, fences). Deliberately
 * NO single-underscore emphasis: it false-positives on URLs and
 * snake_case identifiers.
 * @type {RegExp}
 */
const HTMLISH_RE = /<[a-z!][\s\S]*>/i;
/** @type {RegExp} Matches common markdown syntax patterns. */
const MARKDOWNISH_RE = /(^|\n)[ ]{0,3}(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s)|\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]+\)|(^|\n)```/;

/** Length beyond which plain text autodetects as a multi-line field. */
const TEXTAREA_LENGTH_THRESHOLD = 100;

/**
 * Determine the rich-text format for a string value.
 * @param {string|null|undefined} value - The string value to inspect.
 * @returns {'html'|'markdown'} The detected format.
 */
function richFormatFor(value) {
  return 'html';
}

/**
 * Pure autodetect heuristic (exported for tests): rich for HTML/markdown,
 * textarea for long or multi-line plain text, input for the rest.
 * @param {string|null|undefined} value - The string value to classify.
 * @returns {'rich'|'textarea'|'input'} The detected editing mode.
 */
export function autodetectStringMode(value) {
  const v = String(value ?? '');
  if (HTMLISH_RE.test(v) || MARKDOWNISH_RE.test(v)) return 'rich';
  if (v.includes('\n') || v.length > TEXTAREA_LENGTH_THRESHOLD) return 'textarea';
  return 'input';
}

/**
 * Create a recursive form editor bound to a root DOM element.
 * Returns an API object with render, expand, tree, and onDirty.
 * @param {HTMLElement} rootEl - The container element to render into.
 * @param {Object} options - Configuration options.
 * @param {Object} options.tree - The json-model root node to edit.
 * @param {function(): void} [options.onDirty] - Callback invoked when any value changes.
 * @returns {{ tree: Object, collapsed: Set<number>, render: function(): void, expand: function(number): boolean, onDirty: function(): void, focusNewId: number|null }}
 */
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

  /**
   * Append rendered child rows to a container element.
   * @param {HTMLElement} list - The container to append rows into.
   * @param {Object} parent - The parent container node (object or array).
   * @param {number} depth - Nesting depth for indentation.
   */
  function appendChildren(list, parent, depth) {
    parent.children.forEach((child, index) => {
      list.append(renderRow(child, parent, index, depth));
    });
  }

  // ================== ROW ==================

  /**
   * Render a single property/entry row with drag handle, name/index, type
   * button, clone/delete actions, and value editor.
   * @param {Object} node - The json-model node to render.
   * @param {Object} parent - The parent container node.
   * @param {number} index - The child index within the parent.
   * @param {number} depth - Nesting depth for indentation.
   * @returns {HTMLElement} The rendered row element.
   */
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

    const cloneBtn = el(
      'button',
      {
        class: 'btn-icon clone-btn',
        title: 'Clone',
        onclick: () => {
          const copy = model.cloneNode(api.tree, node);
          if (copy) {
            // Focus the copy's name for immediate rename (object copies).
            if (parent.type === 'object') api.focusNewId = copy.id;
            rerender();
          }
        },
      },
      icon('content_copy', 16),
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

    const actions = el('div', { class: 'row-actions' }, cloneBtn, chevron, delBtn);

    // prop-body is a DIRECT child of the row (sibling of field-content) so
    // nested containers and value inputs span the row's full width; the row
    // uses flex-wrap to place it on its own line beneath the head.
    row.append(handle, content, actions, valueArea(node));

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

  /**
   * Create an editable text input for a property key (object) name.
   * On blur, attempts rename via model.renameKey; highlights invalid names inline.
   * @param {Object} node - The json-model node whose key is being edited.
   * @param {Object} parent - The parent container node.
   * @returns {HTMLInputElement} The input element.
   */
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

  /**
   * Render a child-count label (e.g. "(3 items)") for container nodes.
   * @param {Object} node - The node to display the count for.
   * @returns {HTMLElement} A span element (empty if node is not a container).
   */
  function countNote(node) {
    if (!model.isContainer(node)) return el('span');
    return el('span', {
      class: 'count-note',
      text: `(${model.childCount(node)} item${model.childCount(node) === 1 ? '' : 's'})`,
    });
  }

  /**
   * Create a type-change dropdown button for a node.
   * Shows current type label and opens a menu to convert the node type.
   * @param {Object} node - The json-model node whose type can be changed.
   * @returns {HTMLElement} A wrapper div containing the type dropdown.
   */
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

  // ================== STRING EDITOR MODES ==================
  // Three ways to edit a string value: single-line input, resizable text
  // field, rich text (ProseMirror). The mode is UI state per node (not
  // stored in the document); the value is always a plain string — in rich
  // mode it holds the HTML serialization.

  /**
   * Available string editing modes: input (single-line), textarea (multi-line), rich (ProseMirror).
   * @type {Array<[string, string, string]>} Tuple of [mode, icon name, tooltip].
   */
  const STRING_MODES = [
    ['input', 'text_fields', 'Single-line text input'],
    ['textarea', 'wrap_text', 'Resizable text field'],
    ['rich', 'edit_note', 'Rich text'],
  ];
  /** @type {Map<string, string>} Map from property path to active string editing mode. */
  const stringModes = new Map();
  /**
   * Derive a unique string key for a node's property path.
   * @param {Object} node - The json-model node.
   * @returns {string} A separator-joined path key.
   */
  const modeKeyFor = (node) => model.nodePath(api.tree, node).join('\u001f');

  /**
   * Get the active string editing mode for a node, falling back to autodetect.
   * @param {Object} node - The json-model node.
   * @returns {'input'|'textarea'|'rich'} The current editing mode.
   */
  function stringModeFor(node) {
    const key = modeKeyFor(node);
    if (stringModes.has(key)) return stringModes.get(key);
    return autodetectStringMode(node.value);
  }

  /**
   * Render the string value editor with a mode-switcher and the active control.
   * @param {Object} node - The json-model string node.
   * @returns {HTMLElement} A div containing the mode buttons and the value input.
   */
  function stringValueArea(node) {
    const mode = stringModeFor(node);
    const wrap = el('div', { class: 'string-value' });

    const switcher = el('div', { class: 'value-mode-switch' });
    for (const [m, ic, title] of STRING_MODES) {
      switcher.append(
        el('button', {
          class: `mode-btn ${m === mode ? 'active' : ''}`,
          type: 'button',
          title,
          onclick: () => {
            if (stringModeFor(node) !== m) {
              stringModes.set(modeKeyFor(node), m);
              rerender();
            }
          },
        }, icon(ic, 15)),
      );
    }
    wrap.append(switcher);

    if (mode === 'rich') wrap.append(richHolder(node));
    else wrap.append(stringControl(node, mode));

    return wrap;
  }

  /**
   * Lazy-load the rich-text editor (ProseMirror) and mount it inside a holder div.
   * Falls back to textarea on load failure.
   * @param {Object} node - The json-model string node.
   * @returns {HTMLElement} A holder div that will be populated asynchronously.
   */
  function richHolder(node) {
    const holder = el('div', { class: 'rich-holder' },
      el('span', { class: 'muted-note', text: 'Loading editor…' }));
    import('/web/scripts/vendor/rich-editor.bundle.js')
      .then(() => {
        const rte = document.createElement('rich-text-editor');
        const project = selectedProject();
        rte.setAttribute('format', richFormatFor(node.value));
        if (project) rte.setAttribute('upload-url', `/api/projects/${encodeURIComponent(project.id)}/media`);
        rte.setAttribute('value', node.value ?? '');
        rte.addEventListener('input', () => {
          node.value = rte.value;
          onDirty?.();
        });
        holder.textContent = '';
        holder.append(rte);
      })
      .catch((err) => {
        console.error(err);
        holder.textContent = '';
        holder.append(
          el('span', { class: 'editor-error', text: '✕ Rich editor failed to load — plain text fallback.' }),
          stringControl(node, 'textarea'),
        );
      });
    return holder;
  }

  /**
   * Create a plain-text editing control (input or textarea) for a string node.
   * @param {Object} node - The json-model string node.
   * @param {'input'|'textarea'} mode - The control type to create.
   * @returns {HTMLInputElement|HTMLTextAreaElement} The input or textarea element.
   */
  function stringControl(node, mode) {
    if (mode === 'input') {
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
    // resizable textarea (default)
    const ta = el('textarea', {
      class: 'value-input string-input',
      spellcheck: 'false',
      rows: '1',
      placeholder: '',
    });
    ta.value = node.value ?? '';

    const autoSize = () => {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 320)}px`;
    };
    ta.addEventListener('input', () => {
      node.value = ta.value;
      autoSize();
      onDirty?.();
    });
    requestAnimationFrame(autoSize);

    return ta;
  }

  /**
   * Render the value editor body for a node based on its type.
   * Delegates to string/number/boolean/null/container-specific renderers.
   * @param {Object} node - The json-model node.
   * @returns {HTMLElement} A div (prop-body) containing the value editor.
   */
  function valueArea(node) {
    const body = el('div', { class: 'prop-body' });

    switch (node.type) {
      case 'string':
        body.append(stringValueArea(node));
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

  /**
   * Create a numeric input control for a number node.
   * @param {Object} node - The json-model number node.
   * @returns {HTMLInputElement} A number-type input element.
   */
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

  /**
   * Create a toggle switch for a boolean node.
   * @param {Object} node - The json-model boolean node.
   * @returns {HTMLElement} A label element wrapping the checkbox and slider.
   */
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

  /**
   * Render the "Add property/entry" section with a type selector and button.
   * @param {Object} parent - The parent container node (object or array).
   * @returns {HTMLElement} A div containing the add controls.
   */
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

  /**
   * Toggle the collapsed state of a node row by id.
   * @param {number} id - The node id to toggle.
   */
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
