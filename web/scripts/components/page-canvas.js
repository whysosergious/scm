// Visual canvas for the page editor (iframe edition).
// Page content lives inside a same-origin <iframe> so the editor can render
// a full <html>/<head>/<body> document.  All interaction (selection, hover,
// drag-and-drop, element picker) is handled through a transparent overlay
// in the parent document using coordinate-mapped hit-testing against the
// iframe's document.  Drag-and-drop uses pointer events (not the HTML DnD
// API) so dragging works seamlessly across the iframe boundary.

import * as pm from '../page-model.js';
import { el } from '../dom.js';
import {
  initIframe, getIframe, getIframeDoc, setViewportElement,
  parentToIframeCoords, iframeElementFromPoint, findPageNode,
  startDragTracking, updateDragTracking, isDragActive, endDrag,
  setZoomScale, getZoom, dragState,
} from './canvas-iframe.js';
import { setFrameVisible } from './page-boxmodel.js';

// ================== EDITOR CANVAS CSS ==================

/**
 * CSS injected into the iframe's <head> for editor overlays (selection outlines,
 * hover, drop indicators, empty markers).  Also includes the page's own styles.
 */
const EDITOR_CANVAS_CSS = `
.canvas-page-node {
  min-height: 1em;
  position: relative;
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: outline-color 0.1s;
  cursor: pointer;
}
.canvas-page-node.canvas-hovered {
  outline-color: rgba(66, 133, 244, 0.25);
}
.canvas-page-node.selected {
  outline-color: #1a73e8;
  outline-width: 2px;
}
.canvas-page-node.dragging {
  opacity: 0.3;
  outline-color: transparent;
}
.canvas-page-node.canvas-empty-box {
  min-height: 22px;
}
.canvas-page-node.canvas-empty-box::before {
  content: 'empty';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: monospace;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  background: #e0e0e0;
  color: #666;
  pointer-events: none;
  white-space: nowrap;
  z-index: 4;
}
.canvas-page-node[data-node-type='box'] {
  outline: 1px dashed rgba(66, 133, 244, 0.25);
  outline-offset: 2px;
}
.canvas-page-node.drop-target {
  outline: 2px solid #1a73e8;
  outline-offset: 2px;
}
.canvas-page-node.drop-before {
  outline-color: #1a73e8;
  box-shadow: 0 -3px 0 0 #1a73e8;
}
.canvas-page-node.drop-after {
  outline-color: #1a73e8;
  box-shadow: 0 3px 0 0 #1a73e8;
}
.canvas-page-node.drop-inside {
  outline: 2px dashed #1a73e8;
  outline-offset: 2px;
  background: rgba(26, 115, 232, 0.12);
}
.canvas-page-node.drop-target,
.canvas-page-node.drop-before,
.canvas-page-node.drop-after,
.canvas-page-node.drop-inside {
  outline: 2px solid #1a73e8;
  outline-offset: 2px;
}
.canvas-page-node.canvas-picker-highlight {
  outline: 2px solid #0d9488 !important;
  outline-offset: 2px;
  background: #ccfbf1 !important;
}
.bm-frame {
  position: absolute;
  z-index: 17;
  border: 2px dashed #1a73e8;
  pointer-events: none;
}
.bm-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1.5px solid #1a73e8;
  border-radius: 2px;
  pointer-events: auto;
  z-index: 18;
  user-select: none;
  touch-action: none;
}
img.canvas-media-img {
  max-width: 100%;
  display: block;
}
video, audio {
  display: block;
  min-width: 240px;
  min-height: 44px;
  background: rgba(0,0,0,0.05);
  border-radius: 4px;
}
`;

// ================== PAGE CSS ==================

/**
 * Builds a CSS string from the page document's own styles (reusable classes +
 * inline <style> head elements) so the canvas previews the page faithfully.
 */
function buildPageCss(doc) {
  if (!doc) return '';
  let css = '';
  if (Array.isArray(doc.classes)) {
    for (const c of doc.classes) {
      const name = (c && c.name) || '';
      if (!name) continue;
      const styles = (c && c.styles) || {};
      const decls = Object.entries(styles)
        .map(([k, v]) => `${k}: ${v};`)
        .join('\n');
      if (decls) {
        const safe = typeof CSS !== 'undefined' && CSS.escape
          ? CSS.escape(name)
          : name.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
        css += `.${safe} {\n${decls}\n}\n`;
      }
    }
  }
  if (Array.isArray(doc.head)) {
    for (const he of doc.head) {
      if (he.type === 'style' && he.css) css += he.css + '\n';
    }
  }
  return css;
}

// ================== MODULE STATE ==================

/** @type {string} Current project ID used for resolving image sources. */
let _projectId = '';

/** @type {boolean} When true, empty boxes render an "empty" marker (editor aid). */
let _showEmpty = true;

// ================== PUBLIC API ==================

/** @param {boolean} v */
export function setShowEmpty(v) { _showEmpty = v; }

/** @param {string} id */
export function setProjectId(id) { _projectId = id; }

/**
 * Returns whether a canvas node drag is in progress.
 * @returns {boolean}
 */
export function isDragging() {
  return isDragActive();
}

// ================== RENDER CANVAS ==================

/**
 * Renders the visual canvas from the page document tree.
 * Preserves zoom level and viewport width across re-renders.
 *
 * @param {HTMLElement} root - Container element (.page-canvas).
 * @param {Object|null} doc - Page document with a root node tree, or null.
 * @param {string|null} selectedNodeId - ID of the currently selected node, or null.
 * @param {function(string): void} onSelect - Callback when a node is selected.
 * @param {function(string, string, number): void} onDrop - Callback when a node is dropped.
 * @param {function(string, number, string): void} onAddNode - Callback to add a new node.
 * @returns {void}
 */
export function renderCanvas(root, doc, selectedNodeId, onSelect, onDrop, onAddNode) {
  const existingViewport = root.querySelector('.canvas-viewport');

  if (!doc || !doc.root) {
    root.textContent = '';
    root.append(el('div', { class: 'page-canvas-empty muted-note', text: 'No page loaded' }));
    return;
  }

  // ── First render: build the full structure ──
  if (!existingViewport) {
    root.textContent = '';

    const scroll = el('div', { class: 'canvas-viewport-scroll' });
    root.append(scroll);

    const viewport = el('div', { class: 'canvas-viewport' });
    const savedW = parseInt(localStorage.getItem('scm-canvas-width'), 10);
    const savedH = parseInt(localStorage.getItem('scm-canvas-height'), 10);
    viewport.style.width = savedW >= 200 && savedW <= 2400 ? `${savedW}px` : '1200px';
    if (savedH >= 80) viewport.style.height = `${savedH}px`;
    scroll.append(viewport);

    const zoomWrap = el('div', { class: 'canvas-zoom-wrap' });
    viewport.append(zoomWrap);

    // Iframe canvas — replaces the shadow-DOM page layer
    const iframe = initIframe(zoomWrap);
    setViewportElement(viewport);

    // Overlay — transparent hit-test layer that captures all pointer events
    const overlay = el('div', { class: 'canvas-hit-overlay' });
    zoomWrap.append(overlay);

    wireOverlayInteractions(overlay, root, doc, onSelect, onDrop, onAddNode);

    // Viewport resize handles (outside zoom-wrap, not scaled by zoom)
    const resizeW = el('div', { class: 'canvas-resize-handle canvas-resize-w', title: 'Drag to resize width' });
    const resizeH = el('div', { class: 'canvas-resize-handle canvas-resize-h', title: 'Drag to resize height' });
    const widthLabel = el('div', { class: 'canvas-width-label' });
    viewport.append(resizeW, resizeH, widthLabel);

    // Zoom bar
    const zoomBar = el('div', { class: 'canvas-zoom-bar' });
    const sizeLabel = el('span', { class: 'canvas-size-label', text: '—' });
    const zoomOut = el('button', { title: 'Zoom out (Ctrl+-)', text: '−' });
    const zoomPct = el('span', { class: 'canvas-zoom-pct', text: '100%' });
    const zoomIn = el('button', { title: 'Zoom in (Ctrl++)', text: '+' });
    const zoomFit = el('button', { class: 'canvas-zoom-fit', title: 'Fit to width', text: 'Fit' });
    zoomBar.append(sizeLabel, el('span', { class: 'canvas-zoom-spacer' }), zoomOut, zoomPct, zoomIn, zoomFit);
    root.append(zoomBar);

    // Expose refs for page-editor.js zoom wiring
    root._zoomBar = zoomBar;
    root._zoomPct = zoomPct;
    root._zoomOut = zoomOut;
    root._zoomIn = zoomIn;
    root._zoomFit = zoomFit;
    root._viewport = viewport;
    root._zoomWrap = zoomWrap;
    root._resizeW = resizeW;
    root._resizeH = resizeH;
    root._widthLabel = widthLabel;
    root._sizeLabel = sizeLabel;
  } else {
    // ── Re-render: just rebuild iframe content ──
  }

  rebuildIframeContent(doc, selectedNodeId, onSelect, onDrop, onAddNode, root);
  updateSizeLabel(root);
}

// ================== IFRAME CONTENT ==================

/**
 * (Re)builds the page content inside the iframe.  Called on every re-render.
 * The iframe document structure is rebuilt from scratch each time, which keeps
 * the code simple and avoids stale-reference bugs.
 */
function rebuildIframeContent(doc, selectedNodeId, onSelect, onDrop, onAddNode, canvasRoot) {
  const iframeDoc = getIframeDoc();
  if (!iframeDoc) return;

  // Page CSS
  let pageCss = buildPageCss(doc);
  if (Array.isArray(doc.head)) {
    for (const he of doc.head) {
      if (he.type === 'stylesheet' && he.href) {
        pageCss += `@import url("${he.href}");\n`;
      }
    }
  }

  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${EDITOR_CANVAS_CSS}</style>
${pageCss ? `<style>${pageCss}</style>` : ''}
</head>
<body style="margin:0;padding:0;">
<div data-role="page-root" class="canvas-page-root"></div>
</body>
</html>`);
  iframeDoc.close();

  // Render page nodes into the root container
  const rootContainer = iframeDoc.querySelector('[data-role="page-root"]');
  if (!rootContainer || !doc.root) return;

  renderNode(rootContainer, doc.root, selectedNodeId, onSelect, onDrop, onAddNode);
}

// ================== OVERLAY INTERACTIONS ==================

/**
 * Wires click-to-select, hover, and drag-and-drop onto the transparent overlay.
 * All coordinates are mapped into the iframe for hit-testing.
 */
function wireOverlayInteractions(overlay, canvasRoot, doc, onSelect, onDrop, onAddNode) {
  let hoveredNode = null;
  let dragStarted = false;

  // ── Hover ──
  overlay.addEventListener('mousemove', (e) => {
    if (isDragActive()) return;
    const coords = parentToIframeCoords(e);
    if (!coords) return;
    const hit = iframeElementFromPoint(coords.x, coords.y);
    const node = findPageNode(hit);
    if (node !== hoveredNode) {
      if (hoveredNode) hoveredNode.classList.remove('canvas-hovered');
      hoveredNode = node;
      if (node) node.classList.add('canvas-hovered');
    }
  });

  overlay.addEventListener('mouseleave', () => {
    if (hoveredNode) { hoveredNode.classList.remove('canvas-hovered'); hoveredNode = null; }
  });

  // ── Click-to-select ──
  overlay.addEventListener('click', (e) => {
    if (isDragActive() || dragStarted || e.altKey) return;
    const coords = parentToIframeCoords(e);
    if (!coords) return;
    const hit = iframeElementFromPoint(coords.x, coords.y);
    const node = findPageNode(hit);
    if (node && node.dataset.nodeId) {
      onSelect(node.dataset.nodeId);
    }
  });

  // ── Alt+click element picker ──
  overlay.addEventListener('click', (e) => {
    if (!e.altKey) return;
    e.preventDefault();
    showElementPicker(canvasRoot, e, doc, onSelect);
  });

  // ── Drag-and-drop (pointer events) ──
  // Global listeners handle the drag lifecycle so it works regardless of
  // where the pointerdown originated (palette, tree, or canvas overlay).

  overlay.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.altKey) return;
    const coords = parentToIframeCoords(e);
    if (!coords) return;
    const hit = iframeElementFromPoint(coords.x, coords.y);
    const node = findPageNode(hit);
    if (node && node.dataset.nodeId) {
      startDragTracking(null, node.dataset.nodeId, e.clientX, e.clientY);
    }
  });

  document.addEventListener('pointermove', (e) => {
    if (!dragState.active && !isDragActive()) return;

    if (!isDragActive()) {
      const started = updateDragTracking(e.clientX, e.clientY);
      if (!started) return;
      // Drag just started — set up visuals
      dragStarted = true;
      const st = dragState;
      if (st.nodeId) {
        const iframeDoc = getIframeDoc();
        if (iframeDoc) {
          const el = iframeDoc.querySelector(`[data-node-id="${st.nodeId}"]`);
          if (el) el.classList.add('dragging');
        }
      }
      setFrameVisible(canvasRoot, false);
      overlay.classList.add('drag-active');
    }

    // Highlight drop target
    clearDropHighlights();
    const target = findDropTarget(e);
    if (target) {
      target.element.classList.add('drop-target', `drop-${target.position}`);
    }
  });

  document.addEventListener('pointerup', (e) => {
    if (!isDragActive()) return;
    const st = dragState;
    const target = findDropTarget(e);

    if (target) {
      const targetNodeId = target.element.dataset.nodeId;
      const targetDoc = doc;

      if (st.componentType) {
        const targetNode = pm.findNode(targetDoc.root, targetNodeId);
        if (targetNode) {
          if (target.position === 'inside' && targetNode.type === 'box') {
            onAddNode(targetNodeId, 0, st.componentType);
          } else if (target.position === 'before' || target.position === 'after') {
            const parent = pm.findParent(targetDoc.root, targetNodeId);
            if (parent && parent.children) {
              const idx = parent.children.findIndex((c) => c.id === targetNodeId);
              const at = target.position === 'before' ? idx : idx + 1;
              onAddNode(parent.id, at, st.componentType);
            }
          }
        }
      } else if (st.nodeId) {
        const targetNode = pm.findNode(targetDoc.root, targetNodeId);
        if (targetNode) {
          if (target.position === 'inside' && targetNode.type === 'box') {
            onDrop(st.nodeId, targetNodeId, targetNode.children ? targetNode.children.length : 0);
          } else if (target.position === 'before' || target.position === 'after') {
            const parent = pm.findParent(targetDoc.root, targetNodeId);
            if (parent && parent.children) {
              const idx = parent.children.findIndex((c) => c.id === targetNodeId);
              const at = target.position === 'before' ? idx : idx + 1;
              onDrop(st.nodeId, parent.id, at);
            }
          }
        }
      }
    }

    // Cleanup
    clearDropHighlights();
    const iframeDoc = getIframeDoc();
    if (iframeDoc) {
      iframeDoc.querySelectorAll('.dragging').forEach((n) => n.classList.remove('dragging'));
    }
    setFrameVisible(canvasRoot, true);
    overlay.classList.remove('drag-active');
    endDrag();
    // Delay resetting dragStarted so the click handler (which fires after
    // pointerup) can still see it and suppress the selection click.
    setTimeout(() => { dragStarted = false; }, 0);
  });
}

/** Convenience accessor — dragState is now a direct import from canvas-iframe. */

// ================== DROP TARGET DETECTION ==================

/**
 * Finds the drop target element and position (before/after/inside) at the drag cursor.
 * Uses iframe coordinate mapping to hit-test inside the iframe document.
 */
function findDropTarget(dragEvent) {
  const iframeDoc = getIframeDoc();
  if (!iframeDoc) return null;

  const coords = parentToIframeCoords(dragEvent);
  if (!coords) return null;

  const st = dragState;
  const draggingId = st.nodeId;

  // Walk up from the hit element
  let el = iframeElementFromPoint(coords.x, coords.y);
  while (el && el !== iframeDoc.body) {
    if (el.classList && el.classList.contains('canvas-page-node') && el.dataset.nodeId) {
      // Skip the node being dragged
      if (draggingId && el.dataset.nodeId === draggingId) {
        el = el.parentElement;
        continue;
      }

      const rect = el.getBoundingClientRect();
      const iframeRect = getIframe().getBoundingClientRect();
      const zoom = getZoom();
      // Convert cursor to iframe-layout coords relative to this element
      const relY = (dragEvent.clientY - iframeRect.top) / zoom - (rect.top - iframeRect.top);
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
    el = el.parentElement;
  }
  return null;
}

/**
 * Removes all drop-target highlight classes from the iframe.
 */
function clearDropHighlights() {
  const iframeDoc = getIframeDoc();
  if (!iframeDoc) return;
  iframeDoc.querySelectorAll('.drop-target').forEach((el) => {
    el.classList.remove('drop-target', 'drop-before', 'drop-after', 'drop-inside');
  });
}

// ================== NODE RENDERING ==================

function renderNode(parent, node, selectedId, onSelect, onDrop, onAddNode) {
  if (node.type === 'box') renderBox(parent, node, selectedId, onSelect, onDrop, onAddNode);
  else if (node.type === 'text') renderText(parent, node, selectedId, onSelect);
  else if (node.type === 'image') renderImage(parent, node, selectedId, onSelect);
}

function renderBox(parent, node, selectedId, onSelect, onDrop, onAddNode) {
  const element = (node.props && node.props.element) || 'div';
  if (element === 'video' || element === 'audio') {
    renderMedia(parent, node, selectedId, onSelect);
    return;
  }

  const doc = parent.ownerDocument;
  const tag = doc.createElement(element);
  tag.dataset.nodeId = node.id;
  tag.dataset.nodeType = 'box';
  tag.dataset.element = element;
  tag.classList.add('canvas-page-node');
  applyStyles(tag, node);
  applyClasses(tag, node);
  applyAttrs(tag, node);

  if (node.children && node.children.length > 0) {
    for (const child of node.children) renderNode(tag, child, selectedId, onSelect, onDrop, onAddNode);
  } else if (_showEmpty) {
    tag.classList.add('canvas-empty-box');
  }

  if (node.id === selectedId) tag.classList.add('selected');
  parent.append(tag);
}

function renderText(parent, node, selectedId, onSelect) {
  const element = (node.props && node.props.element) || 'p';
  const doc = parent.ownerDocument;
  const tag = doc.createElement(element);
  tag.dataset.nodeId = node.id;
  tag.dataset.nodeType = 'text';
  tag.dataset.element = element;
  tag.classList.add('canvas-page-node');
  tag.textContent = (node.props && node.props.value) || '';
  applyStyles(tag, node);
  applyClasses(tag, node);
  applyAttrs(tag, node);

  if (node.id === selectedId) tag.classList.add('selected');
  parent.append(tag);
}

function renderImage(parent, node, selectedId, onSelect) {
  const doc = parent.ownerDocument;
  const wrapper = doc.createElement('div');
  wrapper.dataset.nodeId = node.id;
  wrapper.dataset.nodeType = 'image';
  wrapper.dataset.element = 'img';
  wrapper.classList.add('canvas-page-node');
  applyStyles(wrapper, node);
  applyClasses(wrapper, node);

  const tag = doc.createElement('img');
  tag.src = resolveImgSrc(node.props && node.props.src);
  tag.alt = (node.props && node.props.alt) || '';
  tag.style.maxWidth = '100%';
  tag.style.display = 'block';
  tag.classList.add('canvas-media-img');
  wrapper.append(tag);

  if (node.id === selectedId) wrapper.classList.add('selected');
  parent.append(wrapper);
}

function renderMedia(parent, node, selectedId, onSelect) {
  const element = (node.props && node.props.element) || 'video';
  const doc = parent.ownerDocument;
  const wrapper = doc.createElement('div');
  wrapper.dataset.nodeId = node.id;
  wrapper.dataset.nodeType = 'box';
  wrapper.dataset.element = element;
  wrapper.classList.add('canvas-page-node', 'canvas-media');
  applyStyles(wrapper, node);
  applyClasses(wrapper, node);

  const tag = doc.createElement(element);
  applyAttrs(tag, node);
  wrapper.append(tag);

  if (node.id === selectedId) wrapper.classList.add('selected');
  parent.append(wrapper);
}

// ================== STYLE / CLASS / ATTR HELPERS ==================

function applyStyles(tag, node) {
  if (!node.styles) return;
  for (const [k, v] of Object.entries(node.styles)) {
    try { tag.style.setProperty(k, v); } catch (_) { /* skip */ }
  }
}

function applyClasses(tag, node) {
  if (node.classes && node.classes.length > 0) tag.classList.add(...node.classes);
}

function applyAttrs(tag, node) {
  const attrs = (node && node.attrs) || {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'style' || key === 'class' || key === 'id') continue;
    if (/^on/i.test(key)) continue;
    tag.setAttribute(key, value == null ? '' : String(value));
  }
}

function resolveImgSrc(src) {
  if (!src) return '';
  if (src.startsWith('/') || src.startsWith('http') || src.startsWith('data:')) return src;
  return `/files/${_projectId}/${src}`;
}

// ================== ELEMENT PICKER ==================

function showElementPicker(canvasRoot, mouseEvent, doc, onSelect) {
  closeElementPicker(canvasRoot);
  if (!doc) return;

  const coords = parentToIframeCoords(mouseEvent);
  if (!coords) return;

  const nodes = [];
  const seen = new Set();
  let el = iframeElementFromPoint(coords.x, coords.y);

  while (el && el.classList) {
    if (el.classList.contains('canvas-page-node') && el.dataset.nodeId && !seen.has(el.dataset.nodeId)) {
      seen.add(el.dataset.nodeId);
      const treeNode = pm.findNode(doc.root, el.dataset.nodeId);
      if (treeNode) nodes.push({ domEl: el, treeNode });
    }
    el = el.parentElement;
  }

  if (nodes.length === 0) return;

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
      const iframeDoc = getIframeDoc();
      if (iframeDoc) iframeDoc.querySelectorAll('.canvas-picker-highlight').forEach((n) => n.classList.remove('canvas-picker-highlight'));
      domEl.classList.add('canvas-picker-highlight');
    });
    item.addEventListener('mouseleave', () => { domEl.classList.remove('canvas-picker-highlight'); });
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelect(treeNode.id);
      closeElementPicker(canvasRoot);
    });
    picker.append(item);
  }

  canvasRoot.append(picker);

  const close = (e) => {
    if (!picker.contains(e.target)) { closeElementPicker(canvasRoot); document.removeEventListener('click', close, true); }
  };
  setTimeout(() => document.addEventListener('click', close, true), 0);
}

function closeElementPicker(canvasRoot) {
  canvasRoot.querySelectorAll('.canvas-element-picker').forEach((p) => p.remove());
  const iframeDoc = getIframeDoc();
  if (iframeDoc) iframeDoc.querySelectorAll('.canvas-picker-highlight').forEach((n) => n.classList.remove('canvas-picker-highlight'));
}

// ================== SIZE LABEL ==================

export function updateSizeLabel(root) {
  const sizeLabel = root._sizeLabel;
  if (!sizeLabel) return;
  const viewport = root._viewport;
  if (!viewport) return;
  const w = viewport.offsetWidth;
  const h = viewport.offsetHeight;
  sizeLabel.textContent = `${Math.round(w)} × ${Math.round(h)}`;
}
