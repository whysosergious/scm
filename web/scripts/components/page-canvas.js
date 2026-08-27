// Visual canvas for the page editor.
// Renders page nodes as actual HTML elements.
// Hover label on directly-hovered element only (no stacking).
// Alt+click shows element picker for all nodes under cursor.
// Images resolved via /files/{projectId}/ for canvas display.
// Canvas supports zoom (CSS transform scale) and resizable viewport width.

import * as pm from "../page-model.js";
import { el } from "../dom.js";
import { setFrameVisible } from "./page-boxmodel.js";

/**
 * Returns the shadow root of the page-root layer inside the canvas, if any.
 * The page content is rendered into this shadow root so editor styles and the
 * page's own styles are isolated from each other.
 * @param {HTMLElement} canvasEl - The canvas container element.
 * @returns {ShadowRoot|null}
 */
export function canvasPageShadow(canvasEl) {
  const layer = canvasEl.querySelector(".canvas-page-layer");
  return layer && layer.shadowRoot ? layer.shadowRoot : null;
}

/**
 * Editor canvas CSS that must apply to page content (selection outlines, hover,
 * drop indicators, box-model frame). Lives in the shadow root so it cannot leak
 * into the editor chrome, and editor chrome styles cannot reach page content.
 * `:host()` matches the page-root layer (the shadow host) for drag-active hints.
 */
const EDITOR_CANVAS_CSS = `
.canvas-media video,
.canvas-media audio {
  display: block;
  min-width: 240px;
  min-height: 44px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}
.canvas-page-node {
  min-height: 1em;
  position: relative;
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: outline-color 0.1s;
  cursor: pointer;
}
.canvas-page-node.canvas-hovered:not(.dragging) {
  outline-color: rgba(66, 133, 244, 0.25);
}
.canvas-page-node.selected {
  outline-color: var(--color-primary);
  outline-width: 2px;
}
.canvas-page-node.dragging {
  opacity: 0.3;
  outline-color: transparent;
  pointer-events: none;
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
  font-family: var(--font-mono);
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--color-outline-variant);
  color: var(--color-on-surface-variant);
  pointer-events: none;
  white-space: nowrap;
  z-index: 4;
}
:host(.drag-active) .canvas-page-node[data-node-type='box'] {
  outline: 1px dashed rgba(66, 133, 244, 0.35);
  outline-offset: 2px;
}
.canvas-page-node.drop-target {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.canvas-page-node.drop-before {
  outline-color: var(--color-primary);
  box-shadow: 0 -3px 0 0 var(--color-primary);
}
.canvas-page-node.drop-after {
  outline-color: var(--color-primary);
  box-shadow: 0 3px 0 0 var(--color-primary);
}
.canvas-page-node.drop-inside {
  outline: 2px dashed var(--color-primary);
  outline-offset: 2px;
  background: rgba(66, 133, 244, 0.12);
}
:host(.drag-active) .canvas-page-node.drop-target,
:host(.drag-active) .canvas-page-node.drop-before,
:host(.drag-active) .canvas-page-node.drop-after,
:host(.drag-active) .canvas-page-node.drop-inside {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.canvas-page-node.canvas-picker-highlight {
  outline: 2px solid var(--color-tertiary) !important;
  outline-offset: 2px;
  background: var(--color-tertiary-container) !important;
}
.bm-frame {
  position: absolute;
  z-index: 17;
  border: 2px dashed var(--color-primary);
  pointer-events: none;
}
.bm-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1.5px solid var(--color-primary);
  border-radius: 2px;
  pointer-events: auto;
  z-index: 18;
  user-select: none;
  touch-action: none;
}
`;

/**
 * Builds a CSS string from the page document's own styles (reusable classes +
 * inline <style> head elements) so the canvas previews the page faithfully.
 * @param {Object|null} doc - Page document.
 * @returns {string}
 */
function buildPageCss(doc) {
  if (!doc) return "";
  let css = "";
  if (Array.isArray(doc.classes)) {
    for (const c of doc.classes) {
      const name = (c && c.name) || "";
      if (!name) continue;
      const styles = (c && c.styles) || {};
      const decls = Object.entries(styles)
        .map(([k, v]) => `${k}: ${v};`)
        .join("\n");
      if (decls) {
        const safe = typeof CSS !== "undefined" && CSS.escape
          ? CSS.escape(name)
          : name.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
        css += `.${safe} {\n${decls}\n}\n`;
      }
    }
  }
  if (Array.isArray(doc.head)) {
    for (const he of doc.head) {
      if (he.type === "style" && he.css) css += he.css + "\n";
    }
  }
  return css;
}

/**
 * (Re)builds the page-root shadow root: clears it, injects the editor canvas
 * CSS and the page's own styles, and <link>s external stylesheets from <head>.
 * After building, wires the canvas interactions to the shadow root so events
 * originating inside the page tree reach the handlers (they do not always
 * bubble out to the canvas host).
 * @param {HTMLElement} pageLayer - The page-root host element.
 * @param {Object|null} doc - Page document.
 * @param {Object|null} doc - Page document.
 * @param {function(): Object|null} getDoc - Returns the current page document (or null).
 * @param {function(string): void} onSelect - Callback when a node is selected.
 * @param {function(string, string, number): void} onDrop - Callback when a node is dropped.
 * @param {function(string, number, string): void} onAddNode - Callback to add a new node.
 * @param {HTMLElement} canvasRoot - The canvas container element (for picker/drop wiring).
 * @returns {ShadowRoot}
 */
function buildShadow(pageLayer, doc, getDoc, onSelect, onDrop, onAddNode, canvasRoot) {
  let shadow = pageLayer.shadowRoot;
  if (!shadow) shadow = pageLayer.attachShadow({ mode: "open" });
  shadow.textContent = "";

  const edStyle = document.createElement("style");
  edStyle.textContent = EDITOR_CANVAS_CSS;
  shadow.append(edStyle);

  const pgStyle = document.createElement("style");
  pgStyle.textContent = buildPageCss(doc);
  shadow.append(pgStyle);

  if (doc && Array.isArray(doc.head)) {
    for (const he of doc.head) {
      if (he.type === "stylesheet" && he.href) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = he.href;
        if (he.media) link.media = he.media;
        shadow.append(link);
      }
    }
  }

  wireShadowInteractions(shadow, pageLayer, getDoc, onSelect, onDrop, onAddNode, canvasRoot);

  return shadow;
}

/**
 * Attaches hover, Alt+click picker, and drag/drop listeners to the page-root
 * shadow root (rather than the canvas host) so they reliably receive events
 * from inside the isolated page tree.
 * @param {ShadowRoot} shadow - The shadow root of the page layer.
 * @param {HTMLElement} pageLayer - The page-root host element.
 * @param {function(): Object|null} getDoc - Returns the current page document (or null).
 * @param {function(string): void} onSelect - Callback when a node is selected.
 * @param {function(string, string, number): void} onDrop - Callback when a node is dropped.
 * @param {function(string, number, string): void} onAddNode - Callback to add a new node.
 * @returns {void}
 */
function wireShadowInteractions(shadow, pageLayer, getDoc, onSelect, onDrop, onAddNode, canvasRoot) {
  // Hover tracking: only one highlight at a time
  shadow.addEventListener("mouseover", (e) => {
    const target = e.target;
    const node =
      target && target.closest ? target.closest(".canvas-page-node") : null;
    shadow.querySelectorAll(".canvas-hovered").forEach((n) => {
      if (n !== node) n.classList.remove("canvas-hovered");
    });
    if (node) node.classList.add("canvas-hovered");
  });
  shadow.addEventListener("mouseout", (e) => {
    const related = e.relatedTarget;
    if (!related || !shadow.contains(related)) {
      shadow
        .querySelectorAll(".canvas-hovered")
        .forEach((n) => n.classList.remove("canvas-hovered"));
    }
  });

  // Alt+click: element picker
  shadow.addEventListener("click", (e) => {
    if (!e.altKey) return;
    e.preventDefault();
    e.stopPropagation();
    showElementPicker(canvasRoot, e, getDoc, onSelect);
  });

  // Hide transform frame during drag
  shadow.addEventListener("dragstart", () => setFrameVisible(canvasRoot, false));
  shadow.addEventListener("dragend", () => {
    setFrameVisible(canvasRoot, true);
    _isDragging = false;
    pageLayer.classList.remove("drag-active");
  });

  // Drag/drop
  shadow.addEventListener("dragover", (e) => {
    e.preventDefault();
    const hasNode = e.dataTransfer.types.includes("application/x-scm-node");
    e.dataTransfer.dropEffect = hasNode ? "move" : "copy";
    highlightDropTarget(canvasRoot, e);
  });
  shadow.addEventListener("dragleave", (e) => {
    if (!shadow.contains(e.relatedTarget)) {
      clearDropHighlights(canvasRoot);
    }
  });
  shadow.addEventListener("drop", (e) => {
    e.preventDefault();
    clearDropHighlights(canvasRoot);

    const componentType = e.dataTransfer.getData("application/x-scm-component");
    const nodeId = e.dataTransfer.getData("application/x-scm-node");
    const doc = getDoc();
    if (!doc || !doc.root) return;

    const target = findDropTarget(canvasRoot, e);
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
      if (position === "inside" && targetNode.type === "box") {
        onAddNode(targetNodeId, 0, componentType);
      } else if (position === "before" || position === "after") {
        const parent = pm.findParent(doc.root, targetNodeId);
        if (parent && parent.children) {
          const idx = parent.children.findIndex((c) => c.id === targetNodeId);
          const at = position === "before" ? idx : idx + 1;
          onAddNode(parent.id, at, componentType);
        }
      }
    } else if (nodeId) {
      const targetNode = pm.findNode(doc.root, targetNodeId);
      if (!targetNode) return;
      if (position === "inside" && targetNode.type === "box") {
        onDrop(
          nodeId,
          targetNodeId,
          targetNode.children ? targetNode.children.length : 0,
        );
      } else if (position === "before" || position === "after") {
        const parent = pm.findParent(doc.root, targetNodeId);
        if (parent && parent.children) {
          const idx = parent.children.findIndex((c) => c.id === targetNodeId);
          const at = position === "before" ? idx : idx + 1;
          onDrop(nodeId, parent.id, at);
        }
      }
    }

    pageLayer.classList.remove("drag-active");
  });
}

/** @type {string} Current project ID used for resolving image sources. */
let _projectId = "";

/** @type {boolean} True while a canvas node drag is in progress. */
let _isDragging = false;

/**
 * Returns whether a canvas node drag is in progress.
 * @returns {boolean}
 */
export function isDragging() {
  return _isDragging;
}

/** @type {boolean} When true, empty boxes render an "empty" marker (editor aid). */
let _showEmpty = true;

/**
 * Toggles the "show empty elements" editor aid. When disabled, empty boxes
 * render exactly like the generated HTML (no marker, natural size).
 * @param {boolean} v - Whether to show empty element markers.
 * @returns {void}
 */
export function setShowEmpty(v) {
  _showEmpty = v;
}

/**
 * Sets the project ID used for resolving relative image paths.
 * @param {string} id - The project ID.
 * @returns {void}
 */
export function setProjectId(id) {
  _projectId = id;
}

/**
 * Renders the visual canvas from the page document tree.
 * Preserves zoom level and viewport width across re-renders.
 * @param {HTMLElement} root - Container element (.page-canvas).
 * @param {Object|null} doc - Page document with a root node tree, or null.
 * @param {string|null} selectedNodeId - ID of the currently selected node, or null.
 * @param {function(string): void} onSelect - Callback when a node is selected.
 * @param {function(string, string, number): void} onDrop - Callback when a node is dropped.
 * @param {function(string, number, string): void} onAddNode - Callback to add a new node.
 * @returns {void}
 */
export function renderCanvas(
  root,
  doc,
  selectedNodeId,
  onSelect,
  onDrop,
  onAddNode,
) {
  // Preserve zoom/viewport state across re-renders
  const existingZoomWrap = root.querySelector(".canvas-zoom-wrap");
  const existingViewport = root.querySelector(".canvas-viewport");
  const zoomPctEl = root.querySelector(".canvas-zoom-pct");

  if (!doc || !doc.root) {
    root.textContent = "";
    root.append(
      el("div", {
        class: "page-canvas-empty muted-note",
        text: "No page loaded",
      }),
    );
    return;
  }

  // If first render, build the full structure
  if (!existingViewport) {
    root.textContent = "";

    // Scroll container (centers the viewport, handles overflow)
    const scroll = el("div", { class: "canvas-viewport-scroll" });
    root.append(scroll);

    // Viewport container (resizable width)
    const viewport = el("div", { class: "canvas-viewport" });
    const savedW = parseInt(localStorage.getItem("scm-canvas-width"), 10);
    const savedH = parseInt(localStorage.getItem("scm-canvas-height"), 10);
    viewport.style.width =
      savedW >= 200 && savedW <= 2400 ? `${savedW}px` : "1200px";
    if (savedH >= 80) viewport.style.height = `${savedH}px`;
    scroll.append(viewport);

    // Zoom wrapper (CSS transform scale)
    const zoomWrap = el("div", { class: "canvas-zoom-wrap" });
    viewport.append(zoomWrap);

    // Page layer (wraps the editable page; isolated from editor styles)
    const pageLayer = el("div", {
      class: "canvas-page-layer",
      "data-role": "page-root",
    });
    renderNode(
      buildShadow(pageLayer, doc, () => doc, onSelect, onDrop, onAddNode, root),
      doc.root,
      selectedNodeId,
      onSelect,
      onDrop,
      onAddNode,
    );
    zoomWrap.append(pageLayer);

    // Resize handles live in the viewport (outside zoom-wrap) so they are NOT
    // scaled by the zoom transform. JS positions them at the visual edges.
    const resizeW = el("div", {
      class: "canvas-resize-handle canvas-resize-w",
      title: "Drag to resize width",
    });
    const resizeH = el("div", {
      class: "canvas-resize-handle canvas-resize-h",
      title: "Drag to resize height",
    });
    const widthLabel = el("div", { class: "canvas-width-label" });
    viewport.append(resizeW, resizeH, widthLabel);

    // Canvas info / zoom bar
    const zoomBar = el("div", { class: "canvas-zoom-bar" });
    const sizeLabel = el("span", { class: "canvas-size-label", text: "—" });
    const zoomOut = el("button", { title: "Zoom out (Ctrl+-)", text: "−" });
    const zoomPct = el("span", { class: "canvas-zoom-pct", text: "100%" });
    const zoomIn = el("button", { title: "Zoom in (Ctrl++)", text: "+" });
    const zoomFit = el("button", {
      class: "canvas-zoom-fit",
      title: "Fit to width",
      text: "Fit",
    });
    zoomBar.append(
      sizeLabel,
      el("span", { class: "canvas-zoom-spacer" }),
      zoomOut,
      zoomPct,
      zoomIn,
      zoomFit,
    );
    root.append(zoomBar);

    // Wire zoom controls (callbacks set by page-editor.js via setupCanvasZoom)
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
    // Re-render: rebuild the page layer content inside existing structure
    const zoomWrap = root.querySelector(".canvas-zoom-wrap");
    zoomWrap.textContent = "";
    const pageLayer = el("div", {
      class: "canvas-page-layer",
      "data-role": "page-root",
    });
    renderNode(
      buildShadow(pageLayer, doc, () => doc, onSelect, onDrop, onAddNode, root),
      doc.root,
      selectedNodeId,
      onSelect,
      onDrop,
      onAddNode,
    );
    zoomWrap.append(pageLayer);
  }

  updateSizeLabel(root);
}

/**
 * Updates the canvas size readout (design pixels, independent of zoom).
 * @param {HTMLElement} root - The canvas container element.
 * @returns {void}
 */
export function updateSizeLabel(root) {
  const sizeLabel = root._sizeLabel;
  if (!sizeLabel) return;
  const viewport = root._viewport;
  if (!viewport) return;
  // offsetWidth/Height are layout metrics and unaffected by the zoom transform.
  const w = viewport.offsetWidth;
  const h = viewport.offsetHeight;
  sizeLabel.textContent = `${Math.round(w)} × ${Math.round(h)}`;
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
  if (node.type === "box") {
    renderBox(parent, node, selectedId, onSelect, onDrop, onAddNode);
  } else if (node.type === "text") {
    renderText(parent, node, selectedId, onSelect);
  } else if (node.type === "image") {
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
  const element = (node.props && node.props.element) || "div";

  // Media players (video/audio) render via a selectable wrapper
  if (element === "video" || element === "audio") {
    renderMedia(parent, node, selectedId, onSelect);
    return;
  }

  const tag = document.createElement(element);
  tag.dataset.nodeId = node.id;
  tag.dataset.nodeType = "box";
  tag.dataset.element = element;
  tag.classList.add("canvas-page-node");
  applyStyles(tag, node);
  applyClasses(tag, node);
  applyAttrs(tag, node);

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      renderNode(tag, child, selectedId, onSelect, onDrop, onAddNode);
    }
  } else if (_showEmpty) {
    tag.classList.add("canvas-empty-box");
  }

  addInteraction(tag, node.id, onSelect);
  if (node.id === selectedId) tag.classList.add("selected");

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
  const element = (node.props && node.props.element) || "p";
  const tag = document.createElement(element);
  tag.dataset.nodeId = node.id;
  tag.dataset.nodeType = "text";
  tag.dataset.element = element;
  tag.classList.add("canvas-page-node");
  tag.textContent = (node.props && node.props.value) || "";
  applyStyles(tag, node);
  applyClasses(tag, node);
  applyAttrs(tag, node);

  addInteraction(tag, node.id, onSelect);
  if (node.id === selectedId) tag.classList.add("selected");
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
  const wrapper = document.createElement("div");
  wrapper.dataset.nodeId = node.id;
  wrapper.dataset.nodeType = "image";
  wrapper.dataset.element = "img";
  wrapper.classList.add("canvas-page-node");
  applyStyles(wrapper, node);
  applyClasses(wrapper, node);

  const tag = document.createElement("img");
  tag.src = resolveImgSrc(node.props && node.props.src);
  tag.alt = (node.props && node.props.alt) || "";
  tag.style.maxWidth = "100%";
  tag.style.display = "block";
  wrapper.append(tag);

  addInteraction(wrapper, node.id, onSelect);
  if (node.id === selectedId) wrapper.classList.add("selected");
  parent.append(wrapper);
}

/**
 * Renders a video/audio node as a wrapper div containing the native player.
 * Media players are leaf boxes; the wrapper carries selection/hover visuals
 * because replaced elements cannot draw ::after labels.
 * @param {HTMLElement} parent - Parent DOM element.
 * @param {Object} node - Box node with props.element 'video'|'audio' and attrs (src, controls…).
 * @param {string|null} selectedId - ID of the currently selected node.
 * @param {function(string): void} onSelect - Node selection callback.
 * @returns {void}
 */
function renderMedia(parent, node, selectedId, onSelect) {
  const element = (node.props && node.props.element) || "video";
  const wrapper = document.createElement("div");
  wrapper.dataset.nodeId = node.id;
  wrapper.dataset.nodeType = "box";
  wrapper.dataset.element = element;
  wrapper.classList.add("canvas-page-node", "canvas-media");
  applyStyles(wrapper, node);
  applyClasses(wrapper, node);

  const tag = document.createElement(element);
  applyAttrs(tag, node);
  wrapper.append(tag);

  addInteraction(wrapper, node.id, onSelect);
  if (node.id === selectedId) wrapper.classList.add("selected");
  parent.append(wrapper);
}

/**
 * Applies node.attrs as DOM attributes on a rendered element.
 * Skips style/class (owned by styles/classes), event handlers (on*),
 * and anything falsy-named to keep the editing surface safe.
 * @param {HTMLElement} tag - The DOM element to decorate.
 * @param {Object} node - Page node with optional attrs map.
 * @returns {void}
 */
function applyAttrs(tag, node) {
  const attrs = (node && node.attrs) || {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "style" || key === "class" || key === "id") continue;
    if (/^on/i.test(key)) continue;
    tag.setAttribute(key, value == null ? "" : String(value));
  }
}

/**
 * Adds click-to-select and dragstart/dragend event handlers to a canvas node element.
 * @param {HTMLElement} tag - The DOM element to attach interactions to.
 * @param {string} nodeId - The page node ID.
 * @param {function(string): void} onSelect - Node selection callback.
 * @returns {void}
 */
function addInteraction(tag, nodeId, onSelect) {
  tag.addEventListener("click", (e) => {
    if (e.altKey) return; // handled by element picker
    e.stopPropagation();
    onSelect(nodeId);
  });

  tag.draggable = true;
  tag.addEventListener("dragstart", (e) => {
    e.stopPropagation();
    e.dataTransfer.setData("application/x-scm-node", nodeId);
    e.dataTransfer.effectAllowed = "move";
    _isDragging = true;
    const layer = tag.getRootNode()?.host;
    if (layer) layer.classList.add("drag-active");
    requestAnimationFrame(() => tag.classList.add("dragging"));
  });
  tag.addEventListener("dragend", () => {
    tag.classList.remove("dragging");
    _isDragging = false;
    const layer = tag.getRootNode()?.host;
    if (layer) layer.classList.remove("drag-active");
  });
}

/**
 * Resolves an image source path relative to the current project's files endpoint.
 * @param {string} src - Image source path (may be relative, absolute, or data URI).
 * @returns {string} Resolved absolute URL or empty string if no source.
 */
function resolveImgSrc(src) {
  if (!src) return "";
  // Already absolute or data URI
  if (src.startsWith("/") || src.startsWith("http") || src.startsWith("data:"))
    return src;
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
    try {
      tag.style.setProperty(k, v);
    } catch (_) {
      /* skip */
    }
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

  const pageLayer = canvasRoot.querySelector(".canvas-page-layer");
  if (!pageLayer || !pageLayer.shadowRoot) return;

  const doc = getDoc();
  if (!doc) return;

  // Collect page nodes under the cursor via the event's composed path
  // (reliable through the shadow root, unlike elementsFromPoint which may
  // return only the host element).
  const nodes = [];
  const seen = new Set();

  for (const domEl of mouseEvent.composedPath()) {
    if (!domEl || !domEl.classList || !domEl.classList.contains("canvas-page-node")) continue;
    if (!domEl.dataset || !domEl.dataset.nodeId) continue;
    if (seen.has(domEl.dataset.nodeId)) continue;
    seen.add(domEl.dataset.nodeId);

    const treeNode = pm.findNode(doc.root, domEl.dataset.nodeId);
    if (!treeNode) continue;

    nodes.push({ domEl, treeNode });
  }

  if (nodes.length === 0) return;

  // Build picker dropdown
  const picker = el("div", { class: "canvas-element-picker" });
  picker.style.top = `${mouseEvent.clientY}px`;
  picker.style.left = `${mouseEvent.clientX}px`;

  for (const { domEl, treeNode } of nodes) {
    const element = treeNode.props?.element || treeNode.type;
    const typeBadge =
      treeNode.type === "box"
        ? "box"
        : treeNode.type === "text"
          ? "text"
          : "img";
    const label =
      treeNode.type === "text"
        ? `${element}: "${(treeNode.props?.value || "").slice(0, 30)}"`
        : treeNode.type === "image"
          ? `img: ${treeNode.props?.alt || treeNode.props?.src || ""}`
          : element;

    const item = el(
      "div",
      { class: "canvas-picker-item" },
      el("span", { class: "canvas-picker-badge", text: typeBadge }),
      el("span", { text: label }),
    );

    item.addEventListener("mouseenter", () => {
      const shadow = canvasPageShadow(canvasRoot);
      if (shadow) {
        shadow
          .querySelectorAll(".canvas-picker-highlight")
          .forEach((n) => n.classList.remove("canvas-picker-highlight"));
      }
      domEl.classList.add("canvas-picker-highlight");
    });
    item.addEventListener("mouseleave", () => {
      domEl.classList.remove("canvas-picker-highlight");
    });
    item.addEventListener("click", (e) => {
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
      document.removeEventListener("click", close, true);
    }
  };
  setTimeout(() => document.addEventListener("click", close, true), 0);
}

/**
 * Closes the element picker dropdown and removes hover highlights.
 * @param {HTMLElement} canvasRoot - The canvas container element.
 * @returns {void}
 */
function closeElementPicker(canvasRoot) {
  canvasRoot
    .querySelectorAll(".canvas-element-picker")
    .forEach((p) => p.remove());
  const shadow = canvasPageShadow(canvasRoot);
  if (shadow) {
    shadow
      .querySelectorAll(".canvas-picker-highlight")
      .forEach((n) => n.classList.remove("canvas-picker-highlight"));
  }
}

// ================== DROP TARGET DETECTION ==================

/**
 * Finds the drop target element and position (before/after/inside) at the drag cursor.
 * @param {HTMLElement} canvasRoot - The canvas container element.
 * @param {DragEvent} dragEvent - The dragover or drop event.
 * @returns {{element: HTMLElement, position: string}|null} Target element and drop position, or null.
 */
function findDropTarget(canvasRoot, dragEvent) {
  const pageLayer = canvasRoot.querySelector(".canvas-page-layer");
  if (!pageLayer || !pageLayer.shadowRoot) return null;

  const dragging = canvasPageShadow(canvasRoot)?.querySelector(".dragging");

  // Use the event's composed path (reliable through the shadow root) instead of
  // document.elementsFromPoint, which may return only the shadow host.
  const elements = dragEvent.composedPath();

  for (const el of elements) {
    if (!el || !el.classList || !el.classList.contains("canvas-page-node")) continue;
    if (dragging && (el === dragging || dragging.contains(el))) continue;
    if (!el.dataset || !el.dataset.nodeId) continue;
    if (!pageLayer.shadowRoot.contains(el)) continue;

    const rect = el.getBoundingClientRect();
    const relY = dragEvent.clientY - rect.top;
    const height = rect.height;
    const zone = height * 0.25;

    let position;
    if (el.dataset.nodeType === "box" && relY > zone && relY < height - zone) {
      position = "inside";
    } else if (relY < zone) {
      position = "before";
    } else {
      position = "after";
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
  target.element.classList.add("drop-target", `drop-${target.position}`);
}

/**
 * Removes all drop-target highlight classes from the canvas.
 * @param {HTMLElement} canvasRoot - The canvas container element.
 * @returns {void}
 */
function clearDropHighlights(canvasRoot) {
  const shadow = canvasPageShadow(canvasRoot);
  if (!shadow) return;
  shadow.querySelectorAll(".drop-target").forEach((el) => {
    el.classList.remove(
      "drop-target",
      "drop-before",
      "drop-after",
      "drop-inside",
    );
  });
}
