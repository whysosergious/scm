// Visual canvas for the page editor (spec_page_editor.md §§11–12).
// Renders the page tree as nested blocks with drop targets and selection.

import * as pm from '../page-model.js';
import { el, icon } from '../dom.js';

const ELEMENT_ICONS = {
  box: 'check_box_outline_blank',
  text: 'text_fields',
  image: 'image',
};

export function renderCanvas(root, doc, selectedNodeId, onSelect, onDrop, onAddNode) {
  root.textContent = '';

  if (!doc || !doc.root) {
    root.append(el('div', { class: 'page-canvas-empty muted-note', text: 'No page loaded' }));
    return;
  }

  root.append(el('div', { class: 'canvas-label mono-label', text: 'CANVAS' }));

  const treeEl = el('div', { class: 'canvas-tree' });
  renderNode(treeEl, doc.root, doc, selectedNodeId, onSelect, onDrop, 0);
  root.append(treeEl);
}

/** Call once per editor mount to set up root-level drag/drop listeners. */
export function setupCanvasDragDrop(root, getDoc, onSelect, onAddNode) {
  // Handle palette drops on the root container (outside any drop zone)
  root.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  root.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/x-scm-component');
    const doc = getDoc();
    if (!type || !doc || !doc.root || !onAddNode) return;
    onAddNode(doc.root.id, doc.root.children.length, type);
  });

  // Listen for palette-dropped components onto specific drop zones
  root.addEventListener('page-drop-new', (e) => {
    const { parentId, index, type } = e.detail;
    if (!onAddNode) return;
    onAddNode(parentId, index, type);
  });
}

function renderNode(parent, node, doc, selectedId, onSelect, onDrop, depth) {
  const isSelected = node.id === selectedId;

  const wrapper = el('div', {
    class: `page-node page-node-${node.type} ${isSelected ? 'selected' : ''}`,
    'data-node-id': node.id,
    'data-node-type': node.type,
  });

  // Apply node styles as inline preview
  if (node.styles && Object.keys(node.styles).length > 0) {
    for (const [k, v] of Object.entries(node.styles)) {
      try { wrapper.style.setProperty(k, v); } catch (_) { /* skip invalid */ }
    }
  }
  // Always keep indentation visible via padding-left
  wrapper.style.paddingLeft = `${depth * 16}px`;

  // Node header (click to select, shows element + label)
  const header = el('div', {
    class: 'page-node-header',
    onclick: (e) => {
      e.stopPropagation();
      onSelect(node.id);
    },
  });

  // Element badge
  const elementLabel = getElementLabel(node);
  header.append(el('span', { class: 'node-element-badge', text: elementLabel }));

  // Content preview
  if (node.type === 'text') {
    const val = (node.props && node.props.value) || '';
    const preview = val.length > 40 ? val.slice(0, 40) + '…' : val;
    header.append(el('span', { class: 'node-content-preview', text: preview || '(empty)' }));
  } else if (node.type === 'image') {
    const alt = (node.props && node.props.alt) || '';
    header.append(el('span', { class: 'node-content-preview', text: alt || '(no alt)' }));
  } else if (node.type === 'box') {
    const childCount = (node.children || []).length;
    if (childCount > 0) {
      header.append(el('span', { class: 'node-child-count muted-note', text: `(${childCount})` }));
    }
  }

  wrapper.append(header);

  // Children (for Box nodes)
  if (node.type === 'box' && node.children) {
    const childrenEl = el('div', { class: 'page-node-children' });

    if (node.children.length === 0) {
      // Empty state + drop target
      const emptyDrop = el('div', {
        class: 'page-node-empty-drop',
        text: 'Drop components here',
      });
      setupDropTarget(emptyDrop, node.id, 0, onDrop);
      childrenEl.append(emptyDrop);
    } else {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];

        // Drop zone before each child
        const dropBefore = el('div', { class: 'page-drop-zone' });
        setupDropTarget(dropBefore, node.id, i, onDrop);
        childrenEl.append(dropBefore);

        renderNode(childrenEl, child, doc, selectedId, onSelect, onDrop, depth + 1);
      }
      // Drop zone after last child
      const dropAfter = el('div', { class: 'page-drop-zone' });
      setupDropTarget(dropAfter, node.id, node.children.length, onDrop);
      childrenEl.append(dropAfter);
    }

    wrapper.append(childrenEl);
  }

  // Drag existing nodes
  wrapper.draggable = true;
  wrapper.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('application/x-scm-node', node.id);
    e.dataTransfer.effectAllowed = 'move';
    wrapper.classList.add('dragging');
    setTimeout(() => wrapper.classList.add('dragging'), 0);
  });
  wrapper.addEventListener('dragend', () => {
    wrapper.classList.remove('dragging');
    // Clean up all drop-zone highlights
    parent.querySelectorAll('.drop-zone-active').forEach((z) => z.classList.remove('drop-zone-active'));
  });

  parent.append(wrapper);
}

function setupDropTarget(el, parentId, index, onDrop) {
  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const hasComponent = e.dataTransfer.types.includes('application/x-scm-component');
    const hasNode = e.dataTransfer.types.includes('application/x-scm-node');
    if (hasComponent || hasNode) {
      e.dataTransfer.dropEffect = hasNode ? 'move' : 'copy';
      el.classList.add('drop-zone-active');
    }
  });
  el.addEventListener('dragleave', () => {
    el.classList.remove('drop-zone-active');
  });
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    el.classList.remove('drop-zone-active');

    const componentType = e.dataTransfer.getData('application/x-scm-component');
    const nodeId = e.dataTransfer.getData('application/x-scm-node');

    if (componentType) {
      // New component from palette
      const node = el.closest('.page-node');
      // Find the actual parent in the tree — for drop zones, parentId is set
      // We need to trigger the add through the parent
      // For simplicity, dispatch a custom event
      const event = new CustomEvent('page-drop-new', {
        bubbles: true,
        detail: { parentId, index, type: componentType },
      });
      el.dispatchEvent(event);
    } else if (nodeId) {
      // Existing node moved
      onDrop(nodeId, parentId, index);
    }
  });
}

function getElementLabel(node) {
  if (node.type === 'box') {
    return node.props && node.props.element || 'div';
  }
  if (node.type === 'text') {
    return node.props && node.props.element || 'p';
  }
  if (node.type === 'image') {
    return 'img';
  }
  return node.type;
}
