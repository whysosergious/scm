// Component palette for the page editor (spec_page_editor.md §11).
// Grouped base components with draggable items and add buttons.
// Item types may carry a concrete element as "type:element" (e.g. "text:a");
// page-editor.js splits the composite before calling pm.addNode.

import { el, icon } from '../dom.js';

/**
 * @typedef {Object} ComponentDef
 * @property {string} type - Component type identifier ('box'|'text'|'image') or "type:element" composite.
 * @property {string} label - Display label
 * @property {string} icon - Material icon name
 * @property {string} desc - Tooltip description
 */

/**
 * @typedef {Object} ComponentGroup
 * @property {string} title - Section heading.
 * @property {ComponentDef[]} items - Components in the section.
 */

/** @type {ComponentGroup[]} Base component definitions grouped by category. */
const COMPONENT_GROUPS = [
  {
    title: 'LAYOUT',
    items: [
      { type: 'box', label: 'Box', icon: 'check_box_outline_blank', desc: 'Container for grouping children' },
      { type: 'box:nav', label: 'Nav', icon: 'menu', desc: 'Navigation container' },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { type: 'text', label: 'Text', icon: 'text_fields', desc: 'Text content (p, h1, h2, span…)' },
      { type: 'text:a', label: 'Link', icon: 'link', desc: 'Hyperlink — set href under Attributes' },
      { type: 'text:button', label: 'Button', icon: 'smart_button', desc: 'Clickable button' },
    ],
  },
  {
    title: 'MEDIA',
    items: [
      { type: 'image', label: 'Image', icon: 'image', desc: 'Image from media directory' },
      { type: 'box:video', label: 'Video', icon: 'videocam', desc: 'Video player — set src under Attributes' },
      { type: 'box:audio', label: 'Audio', icon: 'audiotrack', desc: 'Audio player — set src under Attributes' },
    ],
  },
  {
    title: 'LISTS',
    items: [
      { type: 'box:ul', label: 'List', icon: 'format_list_bulleted', desc: 'Unordered list — add List items inside' },
      { type: 'text:li', label: 'List item', icon: 'radio_button_unchecked', desc: 'List entry — place inside a List' },
    ],
  },
];

/**
 * Creates a collapsible section with a header and content container.
 */
function createSection(root, title, defaultOpen = true) {
  const details = el('details', { class: 'palette-section', open: defaultOpen });
  const summary = el('summary', { class: 'palette-section-header' },
    icon('expand_more', 16),
    el('span', { text: title }),
  );
  const body = el('div', { class: 'palette-section-body' });
  details.append(summary, body);
  root.append(details);
  return body;
}

/**
 * Creates a palette item element.
 */
function createItem(comp, onAdd) {
  const item = el('div', {
    class: 'palette-item',
    draggable: 'true',
    title: comp.desc,
    'data-component-type': comp.type,
  },
    el('div', { class: 'palette-icon' }, icon(comp.icon, 22)),
    el('span', { class: 'palette-label', text: comp.label }),
  );

  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('application/x-scm-component', comp.type);
    e.dataTransfer.effectAllowed = 'copy';
  });

  item.addEventListener('click', () => {
    onAdd(comp.type);
  });

  return item;
}

/**
 * Renders the component palette with draggable items and click-to-add support.
 * @param {HTMLElement} root - Container element to render the palette into.
 * @param {function(string): void} onAdd - Callback invoked with component type (or "type:element") when added.
 * @returns {void}
 */
export function renderPalette(root, onAdd) {
  root.textContent = '';

  // Hint at top
  root.append(el('div', { class: 'palette-hint' },
    el('span', { class: 'muted-note', text: 'Drag onto canvas or click to add to root' }),
  ));

  // Custom Components section
  const customBody = createSection(root, 'Custom Components', true);
  customBody.append(el('div', { class: 'palette-empty muted-note', text: 'No custom components yet' }));

  // Base Components section
  const baseBody = createSection(root, 'Base Components', true);

  for (const group of COMPONENT_GROUPS) {
    baseBody.append(el('div', { class: 'palette-group-title muted-note', text: group.title }));

    const grid = el('div', { class: 'palette-grid' });
    for (const comp of group.items) {
      grid.append(createItem(comp, onAdd));
    }
    baseBody.append(grid);
  }
}
