// Iframe canvas bridge: lifecycle, coordinate mapping, hit-testing, DnD state.
// The editing canvas is an <iframe> (same-origin via srcdoc) so the page being
// edited lives inside a real document with <html>, <head>, and <body>.
// All interaction is handled by the parent through a transparent overlay; the
// iframe itself has pointer-events:none.

/** @type {HTMLIFrameElement|null} */
let _iframe = null;

/** @type {Document|null} Cached reference to the iframe's document. */
let _iframeDoc = null;

// ================== CANVAS ACCESS ==================

/**
 * Returns the iframe element, if initialised.
 * @returns {HTMLIFrameElement|null}
 */
export function getIframe() {
  return _iframe;
}

/**
 * Returns the iframe's document (same-origin access).
 * @returns {Document|null}
 */
export function getIframeDoc() {
  if (_iframeDoc) return _iframeDoc;
  if (_iframe && _iframe.contentDocument) {
    _iframeDoc = _iframe.contentDocument;
    return _iframeDoc;
  }
  return null;
}

/**
 * Invalidate the cached iframe document reference.
 * Must be called before iframeDoc.open() since open() replaces the document.
 */
export function resetIframeDoc() {
  _iframeDoc = null;
}

/**
 * Initialise the iframe inside a parent element. Call once when the canvas is
 * first built. Returns the iframe element for layout insertion.
 *
 * @param {HTMLElement} container - Parent that will hold the iframe.
 * @returns {HTMLIFrameElement}
 */
export function initIframe(container) {
  const iframe = document.createElement('iframe');
  iframe.className = 'canvas-frame';
  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
  // No src/srcdoc — the iframe loads about:blank and we write the full document
  // via document.write() in page-canvas.js rebuildIframeContent().
  iframe.style.cssText =
    'width:100%;height:100%;border:none;display:block;pointer-events:none;overflow:auto;background:#fff;';
  container.appendChild(iframe);
  _iframe = iframe;
  _iframeDoc = null;
  return iframe;
}

/**
 * Cached reference to the canvas viewport element (set by page-canvas.js).
 * Used to compute the iframe's position for coordinate mapping.
 * @type {HTMLElement|null}
 */
let _viewportEl = null;

/** @param {HTMLElement} el */
export function setViewportElement(el) {
  _viewportEl = el;
}

// ================== COORDINATE MAPPING ==================

/**
 * Convert a pointer event from the parent document into coordinates the
 * iframe's document understands (accounts for zoom scale, iframe offset and
 * iframe scroll).
 *
 * @param {MouseEvent|PointerEvent} e - Event with clientX/clientY.
 * @returns {{x: number, y: number}|null} Iframe-local coords, or null if unavailable.
 */
export function parentToIframeCoords(e) {
  if (!_iframe || !_iframeDoc || !_viewportEl) return null;
  const iframeRect = _iframe.getBoundingClientRect();
  const zoom = getZoom();

  // Offset from iframe visual edge (post-transform pixels), converted to
  // iframe layout pixels (undo zoom).  These are viewport-relative coords
  // suitable for elementFromPoint() — do NOT add scrollTop/scrollLeft here
  // because elementFromPoint takes coords relative to the visible viewport,
  // not the scrolled document.
  const x = (e.clientX - iframeRect.left) / zoom;
  const y = (e.clientY - iframeRect.top) / zoom;

  return { x, y };
}

/**
 * Get the current zoom scale (1 = 100%).
 * The zoom is set by page-editor.js via setZoomScale().
 * @returns {number}
 */
let _zoomScale = 1;
/** @param {number} z */
export function setZoomScale(z) { _zoomScale = z; }
/** @returns {number} */
export function getZoom() { return _zoomScale; }

/**
 * Hit-test inside the iframe at the given iframe-local coordinates.
 * @param {number} x
 * @param {number} y
 * @returns {Element|null}
 */
export function iframeElementFromPoint(x, y) {
  const doc = getIframeDoc();
  if (!doc) return null;
  try {
    return doc.elementFromPoint(x, y);
  } catch (_) {
    return null;
  }
}

/**
 * Find the nearest .canvas-page-node ancestor (or self) of an element.
 * @param {Element} el
 * @returns {Element|null}
 */
export function findPageNode(el) {
  return el && el.closest ? el.closest('.canvas-page-node') : null;
}

// ================== DRAG-AND-DROP STATE ==================

/**
 * Shared drag state for pointer-based DnD (replaces the HTML DnD API which
 * cannot cross iframe boundaries). Palette and canvas both read/write this.
 *
 * @type {{
 *   active: boolean,
 *   nodeId: string|null,
 *   componentType: string|null,
 *   originX: number,
 *   originY: number
 * }}
 */
export const dragState = {
  active: false,
  nodeId: null,
  componentType: null,
  originX: 0,
  originY: 0,
};

/** Distance (px) before a pointer-down is promoted to a drag. */
const DRAG_THRESHOLD = 4;

/**
 * Start tracking a potential drag from a palette pointerdown.
 * @param {string|null} componentType - Palette component type (e.g. "box").
 * @param {string|null} nodeId - Existing node id (for canvas re-order), or null.
 * @param {number} x - clientX of the pointerdown.
 * @param {number} y - clientY of the pointerdown.
 */
export function startDragTracking(componentType, nodeId, x, y) {
  dragState.active = false;
  dragState.componentType = componentType;
  dragState.nodeId = nodeId;
  dragState.originX = x;
  dragState.originY = y;
}

/**
 * Call on every pointermove while tracking a potential drag.
 * Returns true once the drag threshold is crossed (first time only).
 * @param {number} x - clientX.
 * @param {number} y - clientY.
 * @returns {boolean}
 */
export function updateDragTracking(x, y) {
  if (dragState.active) return false;
  const dx = x - dragState.originX;
  const dy = y - dragState.originY;
  if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
    dragState.active = true;
    return true; // just crossed the threshold
  }
  return false;
}

/** @returns {boolean} */
export function isDragActive() {
  return dragState.active;
}

/** Reset drag state. */
export function endDrag() {
  dragState.active = false;
  dragState.nodeId = null;
  dragState.componentType = null;
}
