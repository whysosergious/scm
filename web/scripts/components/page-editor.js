// Page editor container (spec_page_editor.md §§11, 9a).
// Toolbar + four-column layout: palette | tree | canvas | inspector.
// Manages page load/save flow, head element selection, and dirty state.

import { api } from '../api.js';
import * as pm from '../page-model.js';
import { el, icon } from '../dom.js';
import { patch, refreshGitStatus, refreshPages, selectedProject, state } from '../state.js';
import { renderPalette } from './page-palette.js';
import { renderCanvas, setupCanvasDragDrop, setProjectId } from './page-canvas.js';
import { renderInspector, renderHeadInspector } from './page-inspector.js';
import { renderTree } from './page-tree.js';
import { renderBoxModel, clearBoxModel } from './page-boxmodel.js';
import { toast, toastError } from './toast.js';

/**
 * Top-level entry point for the page editor. Shows the appropriate view
 * (no project, no checkout, no page selected, or the full editor).
 * @param {HTMLElement} root - Container element to render into.
 * @returns {void}
 */
export function renderPageEditor(root) {
  root.textContent = '';
  const project = selectedProject();

  if (!project) {
    renderNoProject(root);
    return;
  }

  if (!project.checkout || !project.checkout.exists) {
    renderNeedsCheckout(root, project);
    return;
  }

  if (!state.selectedPage) {
    renderNoPage(root, project);
    return;
  }

  renderEditor(root, project);
}

/**
 * Renders the "no project configured" empty state with an import button.
 * @param {HTMLElement} root - Container element.
 * @returns {void}
 */
function renderNoProject(root) {
  const btn = el('button', { class: 'btn-primary' }, 'Import a project');
  btn.addEventListener('click', async () => {
    const mod = await import('./import-modal.js');
    mod.openImportModal();
  });
  root.append(
    el('div', { class: 'empty-state' },
      el('h1', { text: 'Welcome to SCM' }),
      el('p', { text: 'No website projects are configured yet. Import a repository to manage its content and pages.' }),
      btn,
    ),
  );
}

/**
 * Renders the "checkout not found" empty state with a clone button.
 * @param {HTMLElement} root - Container element.
 * @param {Object} project - Project configuration object.
 * @returns {void}
 */
function renderNeedsCheckout(root, project) {
  const btn = el('button', { class: 'btn-primary' }, 'Clone now');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      await api.checkout(project.id);
      toast(`"${project.name}" cloned`);
      const { refreshProjects } = await import('../state.js');
      await refreshProjects();
    } catch (err) {
      toastError(err);
      btn.disabled = false;
    }
  });
  root.append(
    el('div', { class: 'empty-state' },
      el('h1', { text: 'Checkout not found' }),
      el('p', { text: `The local copy of "${project.name}" has not been cloned yet.` }),
      btn,
    ),
  );
}

/**
 * Renders the "no page selected" empty state with a create-index button.
 * @param {HTMLElement} root - Container element.
 * @param {Object} project - Project configuration object.
 * @returns {void}
 */
function renderNoPage(root, project) {
  const btn = el('button', { class: 'btn-primary' }, 'Create index.json');
  btn.addEventListener('click', async () => {
    try {
      await api.createPage(project.id, 'index.json');
      toast('Created index.json');
      const { refreshPages, setPageSelection } = await import('../state.js');
      await refreshPages();
      setPageSelection('index.json');
    } catch (err) {
      toastError(err);
    }
  });
  root.append(
    el('div', { class: 'empty-state' },
      el('h1', { text: 'No page selected' }),
      el('p', { text: 'Select a page from the Pages list, or create index.json to start.' }),
      btn,
    ),
  );
}

/**
 * Renders the full page editor: toolbar, four-column layout (palette|tree|canvas|inspector),
 * manages load/save flow, head element selection, and dirty state.
 * @param {HTMLElement} root - Container element.
 * @param {Object} project - Project configuration object.
 * @returns {void}
 */
function renderEditor(root, project) {
  const name = state.selectedPage;
  let originalText = '';
  let doc = null;
  let dirty = false;
  let selectedNodeId = null;
  let selectedHeadIndex = null;

  // Layout
  const wrap = el('div', { class: 'page-editor-wrap' });

  // Toolbar
  const saveBtn = el('button', { class: 'btn-save', disabled: true }, icon('save', 16), ' Save');
  const generateBtn = el('button', { class: 'btn-secondary' }, icon('code', 16), ' Generate');
  const previewBtn = el('button', { class: 'btn-secondary' }, icon('open_in_new', 16), ' Preview');
  const dirtyIndicator = el('span', { class: 'muted-note', text: '', style: { display: 'none' } });

  const toolbar = el('div', { class: 'page-toolbar' },
    el('div', { class: 'page-toolbar-left' },
      el('span', { class: 'mono-title', text: name }),
      dirtyIndicator,
    ),
    el('div', { class: 'page-toolbar-right' },
      generateBtn,
      previewBtn,
      saveBtn,
    ),
  );

  // Four-column layout: palette | tree | canvas | inspector
  const paletteEl = el('div', { class: 'page-palette' });
  const treeEl = el('div', { class: 'page-tree' });
  const canvasEl = el('div', { class: 'page-canvas' });
  const inspectorEl = el('div', { class: 'page-inspector' });

  const columns = el('div', { class: 'page-columns' }, paletteEl, treeEl, canvasEl, inspectorEl);

  wrap.append(toolbar, columns);
  root.append(wrap);

  // Set up canvas drag/drop listeners once (not on every re-render)
  setProjectId(project.id);
  setupCanvasDragDrop(canvasEl, () => doc, selectNode, onAddNode);

  // ================== ZOOM + VIEWPORT RESIZE ==================

  const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200, 300];
  let zoomLevel = 100;

  function applyZoom() {
    const zoomWrap = canvasEl.querySelector('.canvas-zoom-wrap');
    const zoomPct = canvasEl.querySelector('.canvas-zoom-pct');
    if (zoomWrap) zoomWrap.style.transform = `scale(${zoomLevel / 100})`;
    if (zoomPct) zoomPct.textContent = `${zoomLevel}%`;
  }

  function setZoom(level) {
    zoomLevel = Math.max(25, Math.min(300, level));
    applyZoom();
  }

  // Wire zoom bar buttons after first renderCanvas call
  requestAnimationFrame(() => {
    const zoomBar = canvasEl._zoomBar;
    const handle = canvasEl._resizeHandle;
    const widthLabel = canvasEl._widthLabel;
    const viewport = canvasEl._viewport;

    if (zoomBar) {
      const buttons = zoomBar.querySelectorAll('button');
      // buttons: [out, pct(is span), in, fit]
      buttons[0].addEventListener('click', () => {
        const idx = ZOOM_LEVELS.findIndex((z) => z >= zoomLevel);
        setZoom(idx > 0 ? ZOOM_LEVELS[idx - 1] : zoomLevel - 25);
      });
      buttons[2].addEventListener('click', () => {
        const idx = ZOOM_LEVELS.findIndex((z) => z > zoomLevel);
        setZoom(idx >= 0 ? ZOOM_LEVELS[idx] : zoomLevel + 25);
      });
      buttons[3].addEventListener('click', () => {
        // Fit to available width
        const scroll = canvasEl.querySelector('.canvas-viewport-scroll');
        if (scroll && viewport) {
          const available = scroll.clientWidth - 48; // padding
          const pageW = viewport.scrollWidth || 1200;
          setZoom(Math.round((available / pageW) * 100));
        }
      });
    }

    // Ctrl+scroll zoom on canvas
    canvasEl.addEventListener('wheel', (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom(zoomLevel + delta);
    }, { passive: false });

    // Viewport resize handle
    if (handle && viewport) {
      let startX = 0;
      let startW = 0;

      handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startW = viewport.offsetWidth;
        handle.classList.add('dragging');
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        function onMove(ev) {
          const dx = ev.clientX - startX;
          const newW = Math.max(200, Math.min(startW + dx, 2400));
          viewport.style.width = `${newW}px`;
          if (widthLabel) widthLabel.textContent = `${Math.round(newW)}px`;
        }

        function onUp() {
          handle.classList.remove('dragging');
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        }

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });
    }

    applyZoom();
  });

  // State
  function markDirty(v) {
    dirty = v;
    saveBtn.disabled = !v;
    dirtyIndicator.style.display = v ? 'inline' : 'none';
    dirtyIndicator.textContent = v ? '(unsaved changes)' : '';
  }

  function renderBoxModelNow() {
    clearBoxModel(canvasEl);
    if (selectedNodeId) {
      const node = pm.findNode(doc.root, selectedNodeId);
      if (node) renderBoxModel(canvasEl, node, onNodeChange);
    }
  }

  /** Re-render the tree panel (head + body sections). */
  function refreshTree() {
    if (!doc) return;
    renderTree(treeEl, doc, selectedNodeId, selectedHeadIndex, {
      onSelectNode: selectNode,
      onSelectHead: selectHead,
      onAddHead,
      onRemoveHead,
    });
  }

  /** Re-render the inspector for the current selection (node or head). */
  function refreshInspector() {
    if (selectedHeadIndex !== null) {
      renderHeadInspector(inspectorEl, doc, selectedHeadIndex, onNodeChange, () => onRemoveHead(selectedHeadIndex));
    } else {
      renderInspector(inspectorEl, doc, selectedNodeId, onNodeChange);
    }
  }

  /** Select a body tree node. Clears head selection. */
  function selectNode(id) {
    selectedNodeId = id;
    selectedHeadIndex = null;
    refreshInspector();
    refreshTree();
    // Update canvas selection
    canvasEl.querySelectorAll('.canvas-page-node').forEach((n) => {
      n.classList.toggle('selected', n.dataset.nodeId === id);
    });
    // Box model control — defer to let canvas layout settle
    clearBoxModel(canvasEl);
    if (id) {
      requestAnimationFrame(() => {
        const node = pm.findNode(doc.root, id);
        if (node && selectedNodeId === id) {
          renderBoxModel(canvasEl, node, onNodeChange);
        }
      });
    }
  }

  /** Select a head element. Clears body node selection. */
  function selectHead(index) {
    selectedHeadIndex = index;
    selectedNodeId = null;
    refreshInspector();
    refreshTree();
    clearBoxModel(canvasEl);
  }

  /** Handle any property change: mark dirty, re-render canvas, tree, box model. */
  function onNodeChange() {
    markDirty(true);
    renderCanvas(canvasEl, doc, selectedNodeId, selectNode, onDrop, onAddNode);
    refreshTree();
    if (selectedNodeId) {
      requestAnimationFrame(() => {
        const node = pm.findNode(doc.root, selectedNodeId);
        if (node) renderBoxModel(canvasEl, node, onNodeChange);
      });
    }
  }

  /** Handle node drop (reorder/move). */
  function onDrop(nodeId, targetParentId, index) {
    const changed = pm.moveNode(doc.root, nodeId, targetParentId, index);
    if (changed) {
      markDirty(true);
      clearBoxModel(canvasEl);
      renderCanvas(canvasEl, doc, selectedNodeId, selectNode, onDrop, onAddNode);
      refreshTree();
      if (selectedNodeId) {
        requestAnimationFrame(() => {
          const node = pm.findNode(doc.root, selectedNodeId);
          if (node) renderBoxModel(canvasEl, node, onNodeChange);
        });
      }
    }
  }

  /** Handle adding a new body node. */
  function onAddNode(parentId, index, type) {
    const node = pm.addNode(doc.root, parentId, type, index);
    if (node) {
      markDirty(true);
      clearBoxModel(canvasEl);
      renderCanvas(canvasEl, doc, selectedNodeId, selectNode, onDrop, onAddNode);
      refreshTree();
      requestAnimationFrame(() => selectNode(node.id));
    }
  }

  /** Add a new head element to the document. */
  function onAddHead(type) {
    if (!doc) return;
    pm.addHeadElement(doc, type);
    markDirty(true);
    refreshTree();
    selectHead(doc.head.length - 1);
  }

  /** Remove a head element at the given index. */
  function onRemoveHead(index) {
    if (!doc) return;
    if (selectedHeadIndex === index) selectedHeadIndex = null;
    pm.removeHeadElement(doc, index);
    if (selectedHeadIndex !== null && selectedHeadIndex >= doc.head.length) {
      selectedHeadIndex = doc.head.length > 0 ? doc.head.length - 1 : null;
    }
    markDirty(true);
    refreshTree();
    refreshInspector();
  }

  // Actions
  saveBtn.addEventListener('click', async () => {
    if (!doc) return;
    const text = pm.serializePage(doc);
    saveBtn.disabled = true;
    try {
      await api.savePage(project.id, name, text);
      originalText = text;
      markDirty(false);
      toast(`Saved ${name}`);
      await refreshGitStatus().catch(() => {});
      patch({});
    } catch (err) {
      toastError(err);
      saveBtn.disabled = false;
    }
  });

  generateBtn.addEventListener('click', async () => {
    try {
      const res = await api.generatePage(project.id, name);
      toast(`Generated ${res.output}`);
    } catch (err) {
      toastError(err);
    }
  });

  previewBtn.addEventListener('click', () => {
    const url = api.previewPageUrl(project.id, name);
    window.open(url, '_blank');
  });

  // Initial render
  renderPalette(paletteEl, (type) => {
    onAddNode(doc.root.id, doc.root.children.length, type);
  });

  // Re-render box model when canvas resizes
  const resizeObs = new ResizeObserver(() => {
    if (selectedNodeId) {
      requestAnimationFrame(renderBoxModelNow);
    }
  });
  resizeObs.observe(canvasEl);

  // Load page
  loadPage();
  async function loadPage() {
    try {
      const data = await api.loadPage(project.id, name);
      if (state.selectedPage !== name) return;
      originalText = data.text;
      doc = pm.parsePage(originalText);
      const validation = pm.validatePage(doc);
      if (!validation.valid) {
        toast(`Page has issues: ${validation.errors[0]}`, 'warn');
      }
      renderCanvas(canvasEl, doc, selectedNodeId, selectNode, onDrop, onAddNode);
      refreshTree();
      refreshInspector();
    } catch (err) {
      toastError(err);
    }
  }
}
