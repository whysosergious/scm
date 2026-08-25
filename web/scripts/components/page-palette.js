// Component palette for the page editor (spec_page_editor.md §11).
// Lists Box, Text, Image with draggable items and add buttons.

import { el, icon } from '../dom.js';

const COMPONENTS = [
  { type: 'box', label: 'Box', icon: 'check_box_outline_blank', desc: 'Container for grouping children' },
  { type: 'text', label: 'Text', icon: 'text_fields', desc: 'Text content (p, h1, h2, span…)' },
  { type: 'image', label: 'Image', icon: 'image', desc: 'Image from media directory' },
];

export function renderPalette(root, onAdd) {
  root.textContent = '';

  root.append(el('div', { class: 'palette-header' },
    el('span', { class: 'mono-label', text: 'COMPONENTS' }),
  ));

  for (const comp of COMPONENTS) {
    const item = el('div', {
      class: 'palette-item',
      draggable: 'true',
      title: comp.desc,
      'data-component-type': comp.type,
    },
      icon(comp.icon, 22),
      el('span', { class: 'palette-label', text: comp.label }),
    );

    // Drag start: set component type data
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('application/x-scm-component', comp.type);
      e.dataTransfer.effectAllowed = 'copy';
    });

    // Also support click-to-add (keyboard accessible)
    item.addEventListener('click', () => {
      onAdd(comp.type);
    });

    root.append(item);
  }

  // Keyboard hint
  root.append(el('div', { class: 'palette-hint' },
    el('span', { class: 'muted-note', text: 'Drag onto canvas or click to add to root' }),
  ));
}
