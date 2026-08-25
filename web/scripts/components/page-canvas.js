// Visual canvas for the page editor.
// Renders page nodes as actual HTML elements.
// Hover label on directly-hovered element only (no stacking).
// Alt+click shows element picker for all nodes under cursor.
// Images resolved via /files/{projectId}/ for canvas display.

import * as pm from '../page-model.js';
import { el } from '../dom.js';

/** @type {string} Current project ID used for resolving image sources. */
let _projectId = '';

/**
 * Sets the project ID used for resolving relative image paths.
 * @param {string} id - The project ID.
 * @returns {void}
 */
export function setProjectId(id) { _projectId = id; }

/**
 * Renders the visual canvas from the page document tree.
 * @param {HTMLElement} root - Container element to render the canvas into.
 * @param {Object|null} doc - Page document with a root node tree, or null if no page loaded.
 * @param {string|null} selectedNodeId - ID of the currently selected node, or null.
 * @param {function(string): void} onSelect - Callback when a node is selected.
 * @param {function(string, string, number): void} onDrop - Callback when a node is dropped (nodeId, targetParentId, index).
 * @param {function(string, number, string): void} onAddNode - Callback to add a new node (parentId, index, type).
 * @returns {void}
 */
export function renderCanvas(root, doc, selectedNodeId, onSelect, onDrop, onAddNode) {
  root.textContent = '';

  if (!doc || !doc.root) {
    root.append(el('div', { class: 'page-canvas-empty muted-note', text: 'No page loaded' }));
    return;
  }

  root.append(el('div', { class: 'canvas-label mono-label', text: 'CANVAS' }));

  const pageLayer = el('div', { class: 'canvas-page-layer' });
  renderNode(pageLayer, doc.root, selectedNodeId, onSelect, onDrop, onAddNode);
  root.append(pageLayer);
}

/**
 * Sets up root-level drag/drop, hover tracking, and Alt+click element picker listeners.
 * Call once per editor mount.
 * @param {HTMLElement} root - The canvas container element.
 * @param {function(): Object|null} getDoc - Returns the current page document (or null).
 * @param {function(string): void} onSelect - Callback when a node is selected.
 * @param {function(string, number, string): void} onAddNode - Callback to add a new node (parentId, index, type).
 * @returns {void}
 */
export function setupCanvasDragDrop(root, getDoc, onSelect, onAddNode) {
  // Hover tracking: only one label at a time
  root.addEventListener('mouseover', (e) => {
    const node = e.target.closest?.('.canvas-page-node');
    // Remove previous hover
    root.querySelectorAll('.canvas-hovered').forEach((n) => n.classList.remove('canvas-hovered'));
    if (node && root.contains(node)) {
      node.classList.add('canvas-hovered');
    }
  });
  root.addEventListener('mouseout', (e) => {
    const related = e.relatedTarget;
    if (!related || !root.contains(related)) {
      root.querySelectorAll('.canvas-hovered').forEach((n) => n.classList.remove('canvas-hovered'));
    }
  });

  // Alt+click: element picker
  root.addEventListener('click', (e) => {
    if (!e.altKey) return;
    e.preventDefault();
    e.stopPropagation();
    showElementPicker(root, e, getDoc, onSelect);
  });

  // Drag/drop
  root.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    highlightDropTarget(root, e);
  });

  root.addEventListener('dragleave', (e) => {
    if (!root.contains(e.relatedTarget)) {
      clearDropHighlights(root);
    }
  });

  root.addEventListener('drop', (e) => {
    e.preventDefault();
    clearDropHighlights(root);

    const componentType = e.dataTransfer.getData('application/x-scm-component');
    const nodeId = e.dataTransfer.getData('application/x-scm-node');
    const doc = getDoc();
    if (!doc || !doc.root) return;

    const target = findDropTarget(root, e);
    if (!target) {
      if (componentType) {
        onAddNode(doc.root.id, doc.root.children.length, componentType);
      }
      return;
    }

    const { element: targetEl, position } = target;
    const targetNodeId = targetEl.dataset.nodeId;
    if (!targetNodeId) return;

    if (componentType) {
      const targetNode = pm.findNode(doc.root, targetNodeId);
      if (!targetNode) return;

      if (position === 'inside' && targetNode.type === 'box') {
        onAddNode(targetNodeId, 0, componentType);
      } else if (position === 'before' || position === 'after') {
        const parent = pm.findParent(doc.root, targetNodeId);
        if (parent && parent.children) {
          const idx = parent.children.findIndex((c) => c.id === targetNodeId);
          const at = position === 'before' ? idx : idx + 1;
          onAddNode(parent.id, at, componentType);
        }
      }
    } else if (nodeId) {
      const targetNode = pm.findNode(doc.root, targetNodeId);
      if (!targetNode) return;

      if (position === 'inside' && targetNode.type === 'box') {
        onDrop(nodeId, targetNodeId, targetNode.children ? targetNode.children.length : 0);
      } else if (position === 'before' || position === 'after') {
        const parent = pm.findParent(doc.root, targetNodeId);
        if (parent && parent.children) {
          const idx = parent.children.findIndex((c) => c.id === targetNodeId);
          const at = position === 'before' ? idx : idx + 1;
          onDrop(nodeId, parent.id, at);
        }
      }
    }
  });
}

// ================== NODE RENDERING ==================

/**
 * Dispatches rendering of a page node to the appropriate renderer by type.
 * @param {HTMLElement} parent - Parent DOM element to append to.
 * @param {Object} node - Page node tree object.
 * @param {string|null} selectedId - ID of the currently selected node.
 * @param {function(string): void} onSelect - Node selection callback.
 * @param {function(string, string, number): void} onDrop - Node drop callback.
 * @param {function(string, number, string): void} onAddNode - Add-node callback.
 * @returns {void}
 */
function renderNode(parent, node, selectedId, onSelect, onDrop, onAddNode) {
  if (node.type === 'box') {
    renderBox(parent, node, selectedId, onSelect, onDrop, onAddNode);
  } else if (node.type === 'text') {
    renderText(parent, node, selectedId, onSelect);
  } else if (node.type === 'image') {
    renderImage(parent, node, selectedId, onSelect);
  }
}

/**
 * Renders a box node as a container element with recursive children.
 * @param {HTMLElement} parent - Parent DOM element.
 * @param {Object} node - Box node with props.element, children, styles, classes.
 * @param {string|null} selectedId - ID of the currently selected node.
 * @param {function(string): void} onSelect - Node selection callback.
 * @param {function(string, string, number): void} onDrop - Node drop callback.
 * @param {function(string, number, string): void} onAddNode - Add-node callback.
 * @returns {void}
 */
function renderBox(parent, node, selectedId, onSelect, onDrop, onAddNode) {
  const element = (node.props && node.props.element) || 'div';
  const tag = document.createElement(element);
  tag.dataset.nodeId = node.id;
  tag.dataset.nodeType = 'box';
  tag.dataset.element = element;
  tag.classList.add('canvas-page-node');
  applyStyles(tag, node);
  applyClasses(tag, node);

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      renderNode(tag, child, selectedId, onSelect, onDrop, onAddNode);
    }
  } else {
    tag.classList.add('canvas-empty-box');
  }

  addInteraction(tag, node.id, onSelect);
  if (node.id === selectedId) tag.classList.add('selected');
  parent.append(tag);
}

/**
 * Renders a text node as a text element (p, h1, h2, span, etc.).
 * @param {HTMLElement} parent - Parent DOM element.
 * @param {Object} node - Text node with props.element, props.value, styles, classes.
 * @param {string|null} selectedId - ID of the currently selected node.
 * @param {function(string): void} onSelect - Node selection callback.
 * @returns {void}
 */
function renderText(parent, node, selectedId, onSelect) {
  const element = (node.props && node.props.element) || 'p';
  const tag = document.createElement(element);
  tag.dataset.nodeId = node.id;
  tag.dataset.nodeType = 'text';
  tag.dataset.element = element;
  tag.classList.add('canvas-page-node');
  tag.textContent = (node.props && node.props.value) || '';
  applyStyles(tag, node);
  applyClasses(tag, node);

  addInteraction(tag, node.id, onSelect);
  if (node.id === selectedId) tag.classList.add('selected');
  parent.append(tag);
}

/**
 * Renders an image node as a wrapper div containing an img element.
 * @param {HTMLElement} parent - Parent DOM element.
 * @param {Object} node - Image node with props.src, props.alt, styles, classes.
 * @param {string|null} selectedId - ID of the currently selected node.
 * @param {function(string): void} onSelect - Node selection callback.
 * @returns {void}
 */
function renderImage(parent, node, selectedId, onSelect) {
  // Wrap img in a div because ::after doesn't work on replaced elements
  const wrapper = document.createElement('div');
  wrapper.dataset.nodeId = node.id;
  wrapper.dataset.nodeType = 'image';
  wrapper.dataset.element = 'img';
  wrapper.classList.add('canvas-page-node');
  applyStyles(wrapper, node);
  applyClasses(wrapper, node);

  const tag = document.createElement('img');
  tag.src = resolveImgSrc(node.props && node.props.src);
  tag.alt = (node.props && node.props.alt) || '';
  tag.style.maxWidth = '100%';
  tag.style.display = 'block';
  wrapper.append(tag);

  addInteraction(wrapper, node.id, onSelect);
  if (node.id === selectedId) wrapper.classList.add('selected');
  parent.append(wrapper);
}

/**
 * Adds click-to-select and dragstart/dragend event handlers to a canvas node element.
 * @param {HTMLElement} tag - The DOM element to attach interactions to.
 * @param {string} nodeId - The page node ID.
 * @param {function(string): void} onSelect - Node selection callback.
 * @returns {void}
 */
function addInteraction(tag, nodeId, onSelect) {
  tag.addEventListener('click', (e) => {
    if (e.altKey) return; // handled by element picker
    e.stopPropagation();
    onSelect(nodeId);
  });

  tag.draggable = true;
  tag.addEventListener('dragstart', (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/x-scm-node', nodeId);
    e.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => tag.classList.add('dragging'));
  });
  tag.addEventListener('dragend', () => {
    tag.classList.remove('dragging');
  });
}

/**
 * Resolves an image source path relative to the current project's files endpoint.
 * @param {string} src - Image source path (may be relative, absolute, or data URI).
 * @returns {string} Resolved absolute URL or empty string if no source.
 */
function resolveImgSrc(src) {
  if (!src) return '';
  // Already absolute or data URI
  if (src.startsWith('/') || src.startsWith('http') || src.startsWith('data:')) return src;
  // Resolve relative to /files/{projectId}/
  return `/files/${_projectId}/${src}`;
}

/**
 * Applies inline CSS styles from a node's styles object to a DOM element.
 * @param {HTMLElement} tag - Target DOM element.
 * @param {Object} node - Page node with optional styles property.
 * @returns {void}
 */
function applyStyles(tag, node) {
  if (!node.styles) return;
  for (const [k, v] of Object.entries(node.styles)) {
    try { tag.style.setProperty(k, v); } catch (_) { /* skip */ }
  }
}

/**
 * Applies CSS classes from a node's classes array to a DOM element.
 * @param {HTMLElement} tag - Target DOM element.
 * @param {Object} node - Page node with optional classes property.
 * @returns {void}
 */
function applyClasses(tag, node) {
  if (node.classes && node.classes.length > 0) {
    tag.classList.add(...node.classes);
  }
}

// ================== ELEMENT PICKER (Alt+click) ==================

/**
 * Shows an element picker dropdown listing all nodes under the cursor.
 * @param {HTMLElement} canvasRoot - The canvas container element.
 * @param {MouseEvent} mouseEvent - The Alt+click event.
 * @param {function(): Object|null} getDoc - Returns the current page document.
 * @param {function(string): void} onSelect - Callback when a node is selected from the picker.
 * @returns {void}
 */
function showElementPicker(canvasRoot, mouseEvent, getDoc, onSelect) {
  closeElementPicker(canvasRoot);

  const pageLayer = canvasRoot.querySelector('.canvas-page-layer');
  if (!pageLayer) return;

  const doc = getDoc();
  if (!doc) return;

  // Get all elements at cursor
  const allEls = document.elementsFromPoint(mouseEvent.clientX, mouseEvent.clientY);
  const nodes = [];
  const seen = new Set();

  for (const domEl of allEls) {
    if (!domEl.dataset || !domEl.dataset.nodeId) continue;
    if (!pageLayer.contains(domEl)) continue;
    if (seen.has(domEl.dataset.nodeId)) continue;
    seen.add(domEl.dataset.nodeId);

    const treeNode = pm.findNode(doc.root, domEl.dataset.nodeId);
    if (!treeNode) continue;

    nodes.push({ domEl, treeNode });
  }

  if (nodes.length === 0) return;

  // Build picker dropdown
  const picker = el('div', { class: 'canvas-element-picker' });
  picker.style.top = `${mouseEvent.clientY}px`;
  picker.style.left = `${mouseEvent.clientX}px`;

  for (const { domEl, treeNode } of nodes) {
    const element = treeNode.props?.element || treeNode.type;
    const typeBadge = treeNode.type === 'box' ? 'box' : treeNode.type === 'text' ? 'text' : 'img';
    const label = treeNode.type === 'text'
      ? `${element}: "${(treeNode.props?.value || '').slice(0, 30)}"`
      : treeNode.type === 'image'
        ? `img: ${treeNode.props?.alt || treeNode.props?.src || ''}`
        : element;

    const item = el('div', { class: 'canvas-picker-item' },
      el('span', { class: 'canvas-picker-badge', text: typeBadge }),
      el('span', { text: label }),
    );

    item.addEventListener('mouseenter', () => {
      canvasRoot.querySelectorAll('.canvas-picker-highlight').forEach((n) => n.classList.remove('canvas-picker-highlight'));
      domEl.classList.add('canvas-picker-highlight');
    });
    item.addEventListener('mouseleave', () => {
      domEl.classList.remove('canvas-picker-highlight');
    });
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelect(treeNode.id);
      closeElementPicker(canvasRoot);
    });

    picker.append(item);
  }

  canvasRoot.append(picker);

  // Close on outside click
  const close = (e) => {
    if (!picker.contains(e.target)) {
      closeElementPicker(canvasRoot);
      document.removeEventListener('click', close, true);
    }
  };
  setTimeout(() => document.addEventListener('click', close, true), 0);
}

/**
 * Closes the element picker dropdown and removes hover highlights.
 * @param {HTMLElement} canvasRoot - The canvas container element.
 * @returns {void}
 */
function closeElementPicker(canvasRoot) {
  canvasRoot.querySelectorAll('.canvas-element-picker').forEach((p) => p.remove());
  canvasRoot.querySelectorAll('.canvas-picker-highlight').forEach((n) => n.classList.remove('canvas-picker-highlight'));
}

// ================== DROP TARGET DETECTION ==================

/**
 * Finds the drop target element and position (before/after/inside) at the drag cursor.
 * @param {HTMLElement} canvasRoot - The canvas container element.
 * @param {DragEvent} dragEvent - The dragover or drop event.
 * @returns {{element: HTMLElement, position: string}|null} Target element and drop position, or null.
 */
function findDropTarget(canvasRoot, dragEvent) {
  const pageLayer = canvasRoot.querySelector('.canvas-page-layer');
  if (!pageLayer) return null;

  const dragging = pageLayer.querySelector('.dragging');
  const elements = document.elementsFromPoint(dragEvent.clientX, dragEvent.clientY);

  for (const el of elements) {
    if (el === dragging) continue;
    if (!el.dataset || !el.dataset.nodeId) continue;
    if (!pageLayer.contains(el)) continue;

    const rect = el.getBoundingClientRect();
    const relY = dragEvent.clientY - rect.top;
    const height = rect.height;
    const zone = height * 0.25;

    let position;
    if (el.dataset.nodeType === 'box' && relY > zone && relY < height - zone) {
      position = 'inside';
    } else if (relY < zone) {
      position = 'before';
    } else {
      position = 'after';
    }

    return { element: el, position };
  }

  return null;
}

/**
 * Highlights the current drop target element with appropriate CSS classes.
 * @param {HTMLElement} canvasRoot - The canvas container element.
 * @param {DragEvent} dragEvent - The drag event.
 * @returns {void}
 */
function highlightDropTarget(canvasRoot, dragEvent) {
  clearDropHighlights(canvasRoot);
  const target = findDropTarget(canvasRoot, dragEvent);
  if (!target) return;
  target.element.classList.add('drop-target', `drop-${target.position}`);
}

/**
 * Removes all drop-target highlight classes from the canvas.
 * @param {HTMLElement} canvasRoot - The canvas container element.
 * @returns {void}
 */
function clearDropHighlights(canvasRoot) {
  canvasRoot.querySelectorAll('.drop-target').forEach((el) => {
    el.classList.remove('drop-target', 'drop-before', 'drop-after', 'drop-inside');
  });
}
