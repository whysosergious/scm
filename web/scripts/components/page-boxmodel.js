// Transform control frame for selected canvas element.
// Frame is rendered in the parent document inside .canvas-zoom-wrap, positioned
// over the iframe using coordinate mapping.  Handles use pointer events on the
// parent window — no cross-frame capture needed.

import { el } from '../dom.js';
import { getIframe, getIframeDoc, getZoom } from './canvas-iframe.js';

/** @type {number} Pixels of value change per pixel of pointer drag. */
const STEP = 1;

// ================== VALUE PARSING ==================

/**
 * Parses a CSS value into {num, unit}.
 * @param {string} val - e.g. '10px', '50%', '1.5em', '0'
 * @returns {{num: number, unit: string}}
 */
export function parseValue(val) {
  const s = String(val).trim();
  const match = s.match(/^(-?[\d.]+)\s*(%|px|em|rem|vw|vh|pt|cm|mm|in)?$/);
  if (!match) return { num: 0, unit: 'px' };
  return { num: parseFloat(match[1]), unit: match[2] || 'px' };
}

/**
 * Parses a CSS pixel value string into a number.
 * @param {string|number} val
 * @returns {number}
 */
export function parsePx(val) {
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Applies a pixel delta to a CSS value, preserving the original unit.
 * @param {string} origVal - Original CSS value (e.g. '50%')
 * @param {number} delta - Change in pixels (applied as numeric delta)
 * @returns {string} Updated CSS value with same unit
 */
function applyDelta(origVal, delta) {
  const { num, unit } = parseValue(origVal);
  const next = Math.max(0, num + delta);
  return `${next}${unit}`;
}

/**
 * Applies a pixel delta for side properties (padding-top, margin-left, etc.).
 * For % units, converts the pixel delta to percentage of the parent dimension.
 * For em/rem, converts to em/rem.
 * @param {HTMLElement} contextEl - Element for context (parent size, font size)
 * @param {string} origVal - Original CSS value
 * @param {number} delta - Change in pixels
 * @returns {string} Updated CSS value
 */
function applySideDelta(contextEl, origVal, delta) {
  const { num, unit } = parseValue(origVal);
  let convertedDelta = delta;

  if (unit === '%') {
    const parent = contextEl.parentElement;
    if (parent) {
      const parentW = parseFloat(getComputedStyle(parent).width) || 1;
      convertedDelta = (delta / parentW) * 100;
    }
  } else if (unit === 'em' || unit === 'rem') {
    const ref = unit === 'rem' ? document.documentElement : contextEl;
    const fontSize = parseFloat(getComputedStyle(ref).fontSize) || 16;
    convertedDelta = delta / fontSize;
  }

  const next = Math.max(0, num + convertedDelta);
  const formatted = unit === 'px' || unit === ''
    ? Math.round(next)
    : parseFloat(next.toFixed(2));
  return `${formatted}${unit}`;
}

// ================== TRANSFORM FRAME ==================

/**
 * Renders the transform control frame around the selected element.
 * The frame is appended to the zoom-wrap (parent document) and positioned
 * over the iframe using the target element's layout coordinates.
 *
 * @param {HTMLElement} canvasEl - The canvas container element (.page-canvas).
 * @param {Object|null} node - The page node, or null to clear.
 * @param {function(): void} onChange - Callback when a value is modified.
 * @returns {void}
 */
export function renderBoxModel(canvasEl, node, onChange) {
  clearBoxModel(canvasEl);
  if (!node) return;

  const iframeDoc = getIframeDoc();
  if (!iframeDoc) return;
  const iframe = getIframe();
  if (!iframe) return;

  const targetEl = iframeDoc.querySelector(`[data-node-id="${node.id}"]`);
  if (!targetEl) return;

  const zoomWrap = canvasEl.querySelector('.canvas-zoom-wrap');
  if (!zoomWrap) return;

  const zoom = getZoom();

  // Target element's layout coordinates relative to the iframe's body
  let top = 0;
  let left = 0;
  let walk = targetEl;
  while (walk && walk !== iframeDoc.body) {
    top += walk.offsetTop;
    left += walk.offsetLeft;
    walk = walk.offsetParent;
  }

  const tWidth = targetEl.offsetWidth;
  const tHeight = targetEl.offsetHeight;

  renderTransformFrame(zoomWrap, top, left, tWidth, tHeight, zoom, targetEl, node, onChange);
}

/**
 * Renders a transform control frame with 8 draggable resize handles.
 * Appended to zoomWrap so it scales with the zoom transform alongside the iframe.
 */
function renderTransformFrame(zoomWrap, top, left, w, h, zoom, targetEl, node, onChange) {
  const frame = el('div', { class: 'bm-frame' });
  // Position in zoom-scaled coordinates (matches the iframe's visual layout)
  frame.style.top = `${top * zoom - 1}px`;
  frame.style.left = `${left * zoom - 1}px`;
  frame.style.width = `${w * zoom + 2}px`;
  frame.style.height = `${h * zoom + 2}px`;

  const handles = [
    { name: 'nw', cursor: 'nw-resize', top: -4, left: -4 },
    { name: 'n',  cursor: 'n-resize',  top: -4, left: w * zoom / 2 - 4 },
    { name: 'ne', cursor: 'ne-resize', top: -4, left: w * zoom - 4 },
    { name: 'e',  cursor: 'e-resize',  top: h * zoom / 2 - 4, left: w * zoom - 4 },
    { name: 'se', cursor: 'se-resize', top: h * zoom - 4, left: w * zoom - 4 },
    { name: 's',  cursor: 's-resize',  top: h * zoom - 4, left: w * zoom / 2 - 4 },
    { name: 'sw', cursor: 'sw-resize', top: h * zoom - 4, left: -4 },
    { name: 'w',  cursor: 'w-resize',  top: h * zoom / 2 - 4, left: -4 },
  ];

  for (const hd of handles) {
    const handle = el('div', { class: 'bm-handle', 'data-handle': hd.name });
    handle.style.top = `${hd.top}px`;
    handle.style.left = `${hd.left}px`;
    handle.style.cursor = hd.cursor;

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = targetEl.offsetWidth;
      const startH = targetEl.offsetHeight;

      const affectsWidth = hd.name.includes('e') || hd.name.includes('w');
      const affectsHeight = hd.name.includes('n') || hd.name.includes('s');
      const invertX = hd.name.includes('w') ? -1 : 1;
      const invertY = hd.name.includes('n') ? -1 : 1;

      const origW = node.styles?.width || '';
      const origH = node.styles?.height || '';

      document.body.style.cursor = hd.cursor;
      document.body.style.userSelect = 'none';

      function onMove(ev) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (!node.styles) node.styles = {};

        if (affectsWidth) {
          node.styles.width = applyDelta(origW, dx * invertX);
        }
        if (affectsHeight) {
          node.styles.height = applyDelta(origH, dy * invertY);
        }

        if (onChange) onChange();

        // Re-query the target element after onChange (iframe may have re-rendered)
        const iframeDoc = getIframeDoc();
        if (iframeDoc) {
          const freshEl = iframeDoc.querySelector(`[data-node-id="${node.id}"]`);
          if (freshEl) {
            // Update frame position to match the (potentially) changed element
            if (zoomWrap) {
              let newTop = 0, newLeft = 0;
              let w2 = freshEl;
              while (w2 && w2 !== iframeDoc.body) {
                newTop += w2.offsetTop;
                newLeft += w2.offsetLeft;
                w2 = w2.offsetParent;
              }
              const z = getZoom();
              frame.style.top = `${newTop * z - 1}px`;
              frame.style.left = `${newLeft * z - 1}px`;
              frame.style.width = `${freshEl.offsetWidth * z + 2}px`;
              frame.style.height = `${freshEl.offsetHeight * z + 2}px`;
            }
          }
        }
      }

      function onUp() {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    frame.append(handle);
  }

  zoomWrap.append(frame);
}

/**
 * Removes the transform frame from the canvas.
 * @param {HTMLElement} canvasEl
 */
export function clearBoxModel(canvasEl) {
  const zoomWrap = canvasEl.querySelector('.canvas-zoom-wrap');
  if (!zoomWrap) return;
  zoomWrap.querySelectorAll('.bm-frame').forEach((n) => n.remove());
}

/**
 * Hides/shows the transform frame (used during canvas drag).
 * @param {HTMLElement} canvasEl
 * @param {boolean} visible
 */
export function setFrameVisible(canvasEl, visible) {
  const zoomWrap = canvasEl.querySelector('.canvas-zoom-wrap');
  if (!zoomWrap) return;
  zoomWrap.querySelectorAll('.bm-frame').forEach((n) => {
    n.style.display = visible ? '' : 'none';
  });
}

// ================== DRAG TO SCRUB ==================

/**
 * Attaches pointer-drag-to-scrub behavior to an element.
 * @param {HTMLElement} element
 * @param {function(number): void} onChange - Callback with delta in pixels.
 * @param {boolean} [vertical=false]
 */
export function makeDragScrub(element, onChange, vertical = false) {
  element.style.touchAction = 'none';
  element.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startAxis = vertical ? e.clientY : e.clientX;
    let last = null;

    function onMove(ev) {
      const current = vertical ? ev.clientY : ev.clientX;
      const delta = Math.round((current - startAxis) * STEP);
      if (delta !== last) {
        last = delta;
        onChange(delta);
      }
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.body.style.cursor = vertical ? 'ns-resize' : 'ew-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}

// ================== INSPECTOR PANEL RENDERING ==================

/**
 * Renders the Dimensions scrubber (W/H) into a container.
 * @param {HTMLElement} container
 * @param {Object} node
 * @param {function(): void} onChange
 */
export function renderDimensionsPanel(container, node, onChange) {
  const grid = el('div', { class: 'bm-dim-grid' });

  const wGroup = el('div', { class: 'bm-dim-group' });
  const wLabel = el('span', { class: 'bm-dim-label', text: 'W' });
  const wValue = el('span', { class: 'bm-dim-value', text: node.styles?.width || '—' });
  wGroup.append(wLabel, wValue);
  const origW = node.styles?.width || '';
  makeDragScrub(wGroup, (delta) => {
    if (!node.styles) node.styles = {};
    node.styles.width = applyDelta(origW, delta);
    wValue.textContent = node.styles.width;
    onChange();
  });

  const hGroup = el('div', { class: 'bm-dim-group' });
  const hLabel = el('span', { class: 'bm-dim-label', text: 'H' });
  const hValue = el('span', { class: 'bm-dim-value', text: node.styles?.height || '—' });
  hGroup.append(hLabel, hValue);
  const origH = node.styles?.height || '';
  makeDragScrub(hGroup, (delta) => {
    if (!node.styles) node.styles = {};
    node.styles.height = applyDelta(origH, delta);
    hValue.textContent = node.styles.height;
    onChange();
  });

  grid.append(wGroup, hGroup);
  container.append(grid);
}

/**
 * Renders the Padding or Margin box diagram scrubber into a container.
 * @param {HTMLElement} container
 * @param {Object} node
 * @param {string} mode - 'p' for padding, 'm' for margin
 * @param {function(): void} onChange
 */
export function renderSidesPanel(container, node, mode, onChange) {
  const prop = mode === 'p' ? 'padding' : 'margin';
  const box = el('div', { class: 'bm-box' });

  const sides = ['top', 'right', 'bottom', 'left'];
  const styleKey = (side) => `${prop}-${side}`;

  const origVals = {};
  for (const side of sides) origVals[side] = node.styles?.[styleKey(side)] || '0';

  const zones = {};
  for (const side of sides) {
    const key = styleKey(side);
    const val = node.styles?.[key] || '0';
    const zone = el('div', { class: `bm-zone bm-zone-${side}`, 'data-side': side },
      el('span', { class: 'bm-zone-value', text: parsePx(val) }),
    );
    zones[side] = { el: zone, key, valueEl: zone.querySelector('.bm-zone-value') };

    const isVertical = side === 'top' || side === 'bottom';
    const invert = side === 'bottom' || side === 'right' ? -1 : 1;

    makeDragScrub(zone, (delta) => {
      if (!node.styles) node.styles = {};
      node.styles[key] = applySideDelta(container, origVals[side], delta * invert);
      zones[side].valueEl.textContent = node.styles[key];
      onChange();
    }, isVertical);
    box.append(zone);
  }

  const center = el('div', { class: 'bm-center' }, el('span', { text: 'content' }));
  box.append(center);
  container.append(box);
}
