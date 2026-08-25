// Box model control: d/p/m buttons + floating panel with drag-to-scrub.
// Appears on the right edge of the selected canvas element.

import { el } from '../dom.js';

/** @type {number} Pixels of value change per pixel of pointer drag. */
const STEP = 1;

/**
 * Renders the box model control (d/p/m buttons and floating panel) for a node.
 * @param {HTMLElement} canvasEl - The canvas container element.
 * @param {Object|null} node - The page node to display box model for, or null to clear.
 * @param {function(): void} onChange - Callback invoked when a style value is scrubbed.
 * @returns {void}
 */
export function renderBoxModel(canvasEl, node, onChange) {
  clearBoxModel(canvasEl);
  if (!node) return;

  const targetEl = canvasEl.querySelector(`[data-node-id="${node.id}"]`);
  if (!targetEl) return;

  // Use offsetTop/offsetLeft which are relative to the offsetParent
  // Walk up from target to canvas-page-layer to accumulate offsets
  let top = 0;
  let left = 0;
  let walk = targetEl;
  while (walk && walk !== canvasEl) {
    top += walk.offsetTop;
    left += walk.offsetLeft;
    walk = walk.offsetParent;
  }

  const tWidth = targetEl.offsetWidth;
  const tHeight = targetEl.offsetHeight;

  const btnWrap = el('div', { class: 'bm-buttons' });
  btnWrap.style.top = `${top + tHeight / 2}px`;
  btnWrap.style.left = `${left + tWidth + 6}px`;

  let activeMode = null;
  let panel = null;

  function closePanel() {
    if (panel) { panel.remove(); panel = null; }
    activeMode = null;
    btnWrap.querySelectorAll('.bm-btn').forEach((b) => b.classList.remove('active'));
  }

  function openMode(mode) {
    closePanel();
    activeMode = mode;
    btnWrap.querySelector(`[data-bm="${mode}"]`)?.classList.add('active');

    panel = el('div', { class: 'bm-panel' });
    panel.style.top = `${top}px`;
    panel.style.left = `${left + tWidth + 36}px`;

    if (mode === 'd') {
      renderDimensions(panel, node, onChange);
    } else {
      renderSides(panel, node, mode, onChange);
    }

    const pl = canvasEl.querySelector('.canvas-page-layer');
    if (pl) pl.appendChild(panel);
  }

  for (const [mode, label] of [['d', 'd'], ['p', 'p'], ['m', 'm']]) {
    const btn = el('button', { class: 'bm-btn', 'data-bm': mode, title: mode === 'd' ? 'Dimensions' : mode === 'p' ? 'Padding' : 'Margin', text: label });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeMode === mode) {
        closePanel();
      } else {
        openMode(mode);
      }
    });
    btnWrap.append(btn);
  }

  const pl = canvasEl.querySelector('.canvas-page-layer');
  if (pl) pl.appendChild(btnWrap);
}

/**
 * Removes all box model control elements from the canvas.
 * @param {HTMLElement} canvasEl - The canvas container element.
 * @returns {void}
 */
export function clearBoxModel(canvasEl) {
  canvasEl.querySelectorAll('.bm-buttons, .bm-panel').forEach((n) => n.remove());
}

// ================== DIMENSIONS ==================

/**
 * Renders the width/height dimension controls with drag-to-scrub.
 * @param {HTMLElement} panel - The panel element to render into.
 * @param {Object} node - The page node with styles.width and styles.height.
 * @param {function(): void} onChange - Callback invoked when a value is modified.
 * @returns {void}
 */
function renderDimensions(panel, node, onChange) {
  const title = el('div', { class: 'bm-title', text: 'Dimensions' });
  panel.append(title);

  const grid = el('div', { class: 'bm-dim-grid' });

  // Width
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

  // Height
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
  panel.append(grid);
}

// ================== SIDES (padding/margin) ==================

/**
 * Renders the four-side (top/right/bottom/left) padding or margin controls with drag-to-scrub.
 * @param {HTMLElement} panel - The panel element to render into.
 * @param {Object} node - The page node with styles for the given mode.
 * @param {string} mode - 'p' for padding or 'm' for margin.
 * @param {function(): void} onChange - Callback invoked when a value is modified.
 * @returns {void}
 */
function renderSides(panel, node, mode, onChange) {
  const label = mode === 'p' ? 'Padding' : 'Margin';
  const prop = mode === 'p' ? 'padding' : 'margin';
  const title = el('div', { class: 'bm-title', text: label });
  panel.append(title);

  const box = el('div', { class: 'bm-box' });

  const sides = ['top', 'right', 'bottom', 'left'];
  const styleKey = (side) => side === 'top' ? `${prop}-top` : side === 'right' ? `${prop}-right` : side === 'bottom' ? `${prop}-bottom` : `${prop}-left`;

  // Zone map: top, right, bottom, left — each is a draggable region
  const zones = {};
  for (const side of sides) {
    const key = styleKey(side);
    const val = node.styles?.[key] || '0';
    const zone = el('div', { class: `bm-zone bm-zone-${side}`, 'data-side': side },
      el('span', { class: 'bm-zone-value', text: parsePx(val) }),
    );
    zones[side] = { el: zone, key, valueEl: zone.querySelector('.bm-zone-value') };

    // Drag direction: top/bottom = vertical drag, left/right = horizontal drag
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

  // Center element label
  const center = el('div', { class: 'bm-center' }, el('span', { text: 'content' }));
  box.append(center);

  panel.append(box);
}

// ================== DRAG TO SCRUB ==================

/**
 * Attaches pointer-drag-to-scrub behavior to an element. Dragging modifies a numeric value.
 * @param {HTMLElement} element - The element to make draggable for scrubbing.
 * @param {function(number): void} onChange - Callback invoked with delta in pixels per drag step.
 * @param {boolean} [vertical=false] - If true, scrub vertically (ns-resize cursor); otherwise horizontally.
 * @returns {void}
 */
function makeDragScrub(element, onChange, vertical = false) {
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
 * @param {string|number} val - CSS value like '10px', '0', or a number.
 * @returns {number} Parsed integer value, or 0 if unparseable.
 */
function parsePx(val) {
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}
