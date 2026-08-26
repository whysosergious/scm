// Transform control frame for selected canvas element.
// Always visible when an element is selected — handles width/height via drag.
// Inspector renders dimension/padding/margin scrubbers.

import { el } from '../dom.js';

/** @type {number} Pixels of value change per pixel of pointer drag. */
const STEP = 1;

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

  // Transform control frame — always shown
  renderTransformFrame(pl, targetEl, top, left, tWidth, tHeight, node, onChange);
}

/**
 * Renders a transform control frame with 8 draggable resize handles.
 * Handles always resize width/height.
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

      handle.setPointerCapture(e.pointerId);
      document.body.style.cursor = hd.cursor;
      document.body.style.userSelect = 'none';

      function onMove(ev) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (!node.styles) node.styles = {};

        if (affectsWidth) {
          const next = Math.max(0, startW + dx * invertX);
          node.styles.width = `${next}px`;
        }
        if (affectsHeight) {
          const next = Math.max(0, startH + dy * invertY);
          node.styles.height = `${next}px`;
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
    const axis = vertical ? e.clientY : e.clientX;
    let last = axis;

    function onMove(ev) {
      const current = vertical ? ev.clientY : ev.clientX;
      const delta = Math.round((current - last) * STEP);
      if (delta !== 0) {
        onChange(delta);
        last = current;
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

// ================== HELPERS ==================

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
  makeDragScrub(wGroup, (delta) => {
    const current = parsePx(node.styles?.width || '0');
    const next = Math.max(0, current + delta);
    if (!node.styles) node.styles = {};
    node.styles.width = `${next}px`;
    wValue.textContent = `${next}px`;
    onChange();
  });

  const hGroup = el('div', { class: 'bm-dim-group' });
  const hLabel = el('span', { class: 'bm-dim-label', text: 'H' });
  const hValue = el('span', { class: 'bm-dim-value', text: node.styles?.height || '—' });
  hGroup.append(hLabel, hValue);
  makeDragScrub(hGroup, (delta) => {
    const current = parsePx(node.styles?.height || '0');
    const next = Math.max(0, current + delta);
    if (!node.styles) node.styles = {};
    node.styles.height = `${next}px`;
    hValue.textContent = `${next}px`;
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
      const current = parsePx(node.styles?.[key] || '0');
      const next = Math.max(0, current + delta * invert);
      if (!node.styles) node.styles = {};
      node.styles[key] = `${next}px`;
      zones[side].valueEl.textContent = `${next}`;
      onChange();
    }, isVertical);
    box.append(zone);
  }

  const center = el('div', { class: 'bm-center' }, el('span', { text: 'content' }));
  box.append(center);

  container.append(box);
}
