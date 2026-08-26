// Transform control frame for selected canvas element.
// Always visible when an element is selected — handles width/height via drag.
// Inspector renders dimension/padding/margin scrubbers.
// Units are preserved during drag — the numeric part is updated, unit stays.

import { el } from '../dom.js';

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
 * The delta is treated as a change in the numeric part of the value.
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
 * Applies a pixel delta to a CSS value for side properties (padding-top, margin-left, etc.).
 * For % units, converts the pixel delta to percentage of the parent dimension.
 * For em/rem, converts the pixel delta to em/rem.
 * For px or no unit, applies directly.
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
  // Keep a reasonable number of decimal places
  const formatted = unit === 'px' || unit === ''
    ? Math.round(next)
    : parseFloat(next.toFixed(2));
  return `${formatted}${unit}`;
}

// ================== TRANSFORM FRAME ==================

/**
 * Renders the transform control frame around the selected element.
 * @param {HTMLElement} canvasEl - The canvas container element.
 * @param {Object|null} node - The page node, or null to clear.
 * @param {function(): void} onChange - Callback when a value is modified.
 * @returns {void}
 */
export function renderBoxModel(canvasEl, node, onChange) {
  clearBoxModel(canvasEl);
  if (!node) return;

  const targetEl = canvasEl.querySelector(`[data-node-id="${node.id}"]`);
  if (!targetEl) return;

  const pl = canvasEl.querySelector('.canvas-page-layer');
  if (!pl) return;

  // Offset of target relative to page-layer
  let top = 0;
  let left = 0;
  let walk = targetEl;
  while (walk && walk !== pl) {
    top += walk.offsetTop;
    left += walk.offsetLeft;
    walk = walk.offsetParent;
  }

  const tWidth = targetEl.offsetWidth;
  const tHeight = targetEl.offsetHeight;

  renderTransformFrame(pl, targetEl, top, left, tWidth, tHeight, node, onChange);
}

/**
 * Renders a transform control frame with 8 draggable resize handles.
 */
function renderTransformFrame(pl, targetEl, top, left, w, h, node, onChange) {
  const frame = el('div', { class: 'bm-frame' });
  frame.style.top = `${top - 1}px`;
  frame.style.left = `${left - 1}px`;
  frame.style.width = `${w + 2}px`;
  frame.style.height = `${h + 2}px`;

  const handles = [
    { name: 'nw', cursor: 'nw-resize', top: -4, left: -4 },
    { name: 'n', cursor: 'n-resize', top: -4, left: w / 2 - 4 },
    { name: 'ne', cursor: 'ne-resize', top: -4, left: w - 4 },
    { name: 'e', cursor: 'e-resize', top: h / 2 - 4, left: w - 4 },
    { name: 'se', cursor: 'se-resize', top: h - 4, left: w - 4 },
    { name: 's', cursor: 's-resize', top: h - 4, left: w / 2 - 4 },
    { name: 'sw', cursor: 'sw-resize', top: h - 4, left: -4 },
    { name: 'w', cursor: 'w-resize', top: h / 2 - 4, left: -4 },
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

      // Remember original values for width/height
      const origW = node.styles?.width || '';
      const origH = node.styles?.height || '';

      handle.setPointerCapture(e.pointerId);
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
      }

      function onUp() {
        handle.releasePointerCapture(e.pointerId);
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

  pl.append(frame);
}

/**
 * Removes the transform frame from the canvas.
 * @param {HTMLElement} canvasEl
 */
export function clearBoxModel(canvasEl) {
  canvasEl.querySelectorAll('.bm-frame').forEach((n) => n.remove());
}

/**
 * Hides/shows the transform frame (used during canvas drag).
 * @param {HTMLElement} canvasEl
 * @param {boolean} visible
 */
export function setFrameVisible(canvasEl, visible) {
  canvasEl.querySelectorAll('.bm-frame').forEach((n) => {
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
      // Delta is measured from the drag START, not the last move, so the
      // value accumulates correctly against the original base captured by
      // the caller (applyDelta(origVal, delta)).
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

  // Width
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

  // Height
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

  // Remember original values for each side
  const origVals = {};
  for (const side of sides) {
    origVals[side] = node.styles?.[styleKey(side)] || '0';
  }

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
