// Cross-parent drag & drop for form rows (spec_json_edit.md §8).
// Pointer-event based, no libraries. FLIP animations respect
// prefers-reduced-motion.

import * as model from '../json-model.js';
import { el } from '../dom.js';

const REDUCED = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Wire a row's drag handle.
 *
 * api must expose:
 *   tree            root node
 *   render()        full re-render from the current tree
 *   onDirty()       dirty-state callback
 *   collapsed       Set of collapsed node ids
 *   expand(id)      expand one node (used for hover-to-expand)
 */
export function enableDrag({ handle, row, api, nodeId }) {
  handle.addEventListener('pointerdown', (e) => start(e));

  function start(e) {
    if (e.button !== 0) return;
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const root = api.tree;
    let active = false;
    let placeholder = null;
    let slots = [];
    let currentSlot = null;
    let hoverTimer = null;
    let lastCollapsedHover = null;

    const node = model.findNode(root, nodeId);
    if (!node || !model.findParent(root, nodeId)) return; // root is not draggable

    const onKey = (ev) => {
      if (ev.key === 'Escape') finish(false);
    };
    const onMove = (ev) => {
      if (!active) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 4) return;
        activate();
      }
      updateTarget(ev.clientX, ev.clientY);
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);

    function activate() {
      active = true;
      document.body.classList.add('dragging-active');
      // Read dimensions first, then hide the source entirely: the
      // placeholder becomes the only visual gap and can't intercept
      // elementFromPoint hit-testing.
      const h = row.offsetHeight;
      row.classList.add('drag-source');
      buildSlots(node);

      placeholder = el('div', { class: 'drop-placeholder' });
      placeholder.style.height = `${h}px`;
      row.before(placeholder);
      currentSlot = slotAtPlaceholder();
    }

    // Layout geometry uses plain client rects. The source row is hidden and
    // placeholder moves apply no transforms, so rects are always truthful
    // (no mid-flight FLIP measurements to skew drop-target math).
    function buildSlots(dragged) {
      slots = [];
      document
        .querySelectorAll('.fields-list[data-parent-id], .nested-container[data-parent-id]')
        .forEach((listEl) => {
          const pid = Number(listEl.dataset.parentId);
          const parent = model.findNode(root, pid);
          if (!parent || !model.isContainer(parent)) return;
          if (model.isWithin(dragged, pid)) return; // cycle guard at registry time

          const rows = [...listEl.querySelectorAll(':scope > .field-item.prop-row')]
            .filter((r) => r !== row);

          if (rows.length === 0) {
            slots.push({ parent, index: 0, listEl });
            return;
          }
          rows.forEach((r, idx) => {
            slots.push({ parent, index: idx, listEl, beforeEl: r });
          });
          slots.push({
            parent,
            index: rows.length,
            listEl,
            afterEl: rows[rows.length - 1],
          });
        });
    }

    function slotY(slot) {
      if (!slot.beforeEl && !slot.afterEl) {
        return slot.listEl.getBoundingClientRect().top;
      }
      const r = (slot.beforeEl ?? slot.afterEl).getBoundingClientRect();
      return slot.beforeEl ? r.top : r.bottom;
    }

    function updateTarget(x, y) {
      maybeExpandHover(x, y);
      let best = null;
      let bestDist = Infinity;
      for (const s of slots) {
        const lr = s.listEl.getBoundingClientRect();
        if (x < lr.left - 60 || x > lr.right + 60) continue;
        const d = Math.abs(slotY(s) - y);
        if (d < bestDist) {
          bestDist = d;
          best = s;
        }
      }
      if (!best || best === currentSlot) return;
      movePlaceholder(best);
      currentSlot = best;
    }

    function movePlaceholder(slot) {
      if (slot.beforeEl) slot.beforeEl.before(placeholder);
      else if (slot.afterEl) slot.afterEl.after(placeholder);
      else {
        // Empty list: before the empty hint / add section, else append.
        const hint =
          slot.listEl.querySelector('.empty-hint') ??
          slot.listEl.querySelector('.add-section');
        hint ? hint.before(placeholder) : slot.listEl.append(placeholder);
      }
    }

    function slotAtPlaceholder() {
      const listEl = placeholder.parentElement;
      let idx = 0;
      for (const c of listEl.children) {
        if (c === placeholder) break;
        if (c.classList.contains('prop-row')) idx++;
      }
      const pid = Number(listEl.dataset.parentId);
      return { parent: model.findNode(root, pid), index: idx, listEl };
    }

    function maybeExpandHover(x, y) {
      const under = document.elementFromPoint(x, y)?.closest('.field-item.prop-row');
      const idStr = under?.dataset.nodeId;
      const id = idStr !== undefined ? Number(idStr) : NaN;
      if (
        !under ||
        Number.isNaN(id) ||
        id === nodeId ||
        lastCollapsedHover === id
      ) {
        if (!under || id !== lastCollapsedHover) {
          clearTimeout(hoverTimer);
          lastCollapsedHover = null;
        }
        return;
      }
      const target = model.findNode(root, id);
      if (
        !target ||
        !model.isContainer(target) ||
        !api.collapsed.has(id) ||
        model.isWithin(node, id)
      ) {
        clearTimeout(hoverTimer);
        lastCollapsedHover = null;
        return;
      }
      lastCollapsedHover = id;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        api.expand(id);
        buildSlots(node);
        lastCollapsedHover = null;
      }, 400);
    }

    function cleanupListeners() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      document.removeEventListener('keydown', onKey);
      clearTimeout(hoverTimer);
      document.body.classList.remove('dragging-active');
      row.classList.remove('drag-source');
    }

    function finish(commit) {
      if (!active) {
        cleanupListeners();
        return;
      }
      active = false;

      const ph = placeholder;
      placeholder = null;
      const slot = currentSlot;

      let listEl = null;
      let idx = 0;
      if (ph) {
        listEl = ph.parentElement;
        for (const c of listEl.children) {
          if (c === ph) break;
          if (c.classList.contains('prop-row') && c !== row) idx++;
        }
        ph.remove();
      }

      cleanupListeners();

      const changed =
        commit && slot?.parent
          ? model.moveNode(root, node, slot.parent, idx)
          : false;
      api.render();
      if (changed) api.onDirty?.();
    }

    document.addEventListener('keydown', onKey);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }
}
