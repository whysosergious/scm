// Page editor container (spec_page_editor.md §§11, 9a).
// Toolbar + two-column layout: canvas | tabbed right panel (Components | Tree | Inspector).
// Manages page load/save flow, head element selection, and dirty state.

import { api } from '../api.js';
import * as pm from '../page-model.js';
import { el, icon } from '../dom.js';
import { patch, refreshGitStatus, refreshPages, selectedProject, setPageDirty, state } from '../state.js';
import { renderPalette } from './page-palette.js';
import { renderCanvas, setupCanvasDragDrop, setProjectId, isDragging } from './page-canvas.js';
import { renderInspector, renderHeadInspector } from './page-inspector.js';
import { renderTree } from './page-tree.js';
import { renderBoxModel, clearBoxModel } from './page-boxmodel.js';
import { toast, toastError } from './toast.js';

/** @type {function|null} Previous beforeunload handler to remove on re-render. */
let _prevBeforeUnload = null;
/** @type {function|null} Previous escape keydown handler to remove on re-render. */
let _prevEscapeHandler = null;

/**
 * Top-level entry point for the page editor. Shows the appropriate view
 * (no project, no checkout, no page selected, or the full editor).
 * @param {HTMLElement} root - Container element to render into.
 * @returns {void}
 */
export function renderPageEditor(root) {
  if (_prevBeforeUnload) { window.removeEventListener('beforeunload', _prevBeforeUnload); _prevBeforeUnload = null; }
  setPageDirty(false);
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
 * Renders the full page editor: toolbar, two-column layout (canvas | tabbed panel),
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
  const treeCollapsed = new Set();

  // Layout
  const wrap = el('div', { class: 'page-editor-wrap' });

  // Toolbar
  const saveBtn = el('button', { class: 'btn-save', disabled: true }, icon('save', 16), ' Save');
  const generateBtn = el('button', { class: 'btn-secondary' }, icon('code', 16), ' Generate');
  const previewBtn = el('button', { class: 'btn-secondary' }, icon('open_in_new', 16), ' Preview');
  const importHtmlBtn = el('button', { class: 'btn-secondary' }, icon('upload', 16), ' Import HTML');
  importHtmlBtn.addEventListener('click', async () => {
    const mod = await import('./page-import-modal.js');
    mod.openHtmlImportModal();
  });
  const dirtyIndicator = el('span', { class: 'muted-note', text: '', style: { display: 'none' } });

  const toolbar = el('div', { class: 'page-toolbar' },
    el('div', { class: 'page-toolbar-left' },
      el('span', { class: 'mono-title', text: name }),
      dirtyIndicator,
    ),
    el('div', { class: 'page-toolbar-right' },
      importHtmlBtn,
      generateBtn,
      previewBtn,
      saveBtn,
    ),
  );

  // Two-column layout: canvas | resize handle | tabbed right panel
  const canvasEl = el('div', { class: 'page-canvas' });

  // Right panel with tabs
  let activeTab = localStorage.getItem('scm-active-tab') || 'inspector'; // 'components' | 'tree' | 'inspector'
  const rightPanel = el('div', { class: 'page-right-panel' });
  const tabBar = el('div', { class: 'panel-tab-bar' });
  const tabContent = el('div', { class: 'panel-tab-content' });

  // Panel width from localStorage
  const savedPanelWidth = parseInt(localStorage.getItem('scm-panel-width'), 10);
  const panelWidth = (savedPanelWidth >= 200 && savedPanelWidth <= 800) ? savedPanelWidth : 300;
  rightPanel.style.width = `${panelWidth}px`;

  const tabs = [
    { id: 'components', label: 'Components', icon: 'widgets' },
    { id: 'tree', label: 'Tree', icon: 'account_tree' },
    { id: 'inspector', label: 'Inspector', icon: 'tune' },
  ];

  const tabButtons = {};
  for (const t of tabs) {
    const btn = el('button', {
      class: 'panel-tab' + (t.id === activeTab ? ' active' : ''),
      'data-tab': t.id,
    }, icon(t.icon, 16), el('span', { text: t.label }));
    btn.addEventListener('click', () => switchTab(t.id));
    tabButtons[t.id] = btn;
    tabBar.append(btn);
  }

  rightPanel.append(tabBar, tabContent);

  // Panel resize handle
  const panelResizeHandle = el('div', { class: 'panel-resize-handle' });
  panelResizeHandle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = rightPanel.offsetWidth;
    panelResizeHandle.classList.add('dragging');
    panelResizeHandle.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    function onMove(ev) {
      const dx = startX - ev.clientX;
      const newW = Math.max(200, Math.min(startW + dx, 800));
      rightPanel.style.width = `${newW}px`;
    }

    function onUp() {
      panelResizeHandle.releasePointerCapture(e.pointerId);
      panelResizeHandle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      localStorage.setItem('scm-panel-width', rightPanel.offsetWidth);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  const columns = el('div', { class: 'page-columns' }, canvasEl, panelResizeHandle, rightPanel);

  wrap.append(toolbar, columns);
  root.append(wrap);

  // Tab content containers (created once, reused)
  const componentsContent = el('div', { class: 'panel-tab-pane' });
  const treeContent = el('div', { class: 'panel-tab-pane' });
  const inspectorContent = el('div', { class: 'panel-tab-pane' });
  treeContent.tabIndex = 0;

  function switchTab(id) {
    activeTab = id;
    localStorage.setItem('scm-active-tab', id);
    for (const [tid, btn] of Object.entries(tabButtons)) {
      btn.classList.toggle('active', tid === id);
    }
    tabContent.textContent = '';
    if (id === 'components') tabContent.append(componentsContent);
    else if (id === 'tree') tabContent.append(treeContent);
    else if (id === 'inspector') tabContent.append(inspectorContent);
  }

  // Initial tab content render
  switchTab(activeTab);

  // Set up canvas drag/drop listeners once (not on every re-render)
  setProjectId(project.id);
  setupCanvasDragDrop(canvasEl, () => doc, selectNode, onDrop, onAddNode);

  // Escape key: deselect node
  if (_prevEscapeHandler) document.removeEventListener('keydown', _prevEscapeHandler);
  function handleEscape(e) {
    if (e.key === 'Escape' && selectedNodeId) {
      selectNode(null);
    }
  }
  document.addEventListener('keydown', handleEscape);
  _prevEscapeHandler = handleEscape;

  // Click on canvas viewport background deselects
  canvasEl.addEventListener('click', (e) => {
    if (e.target === canvasEl || e.target.classList.contains('canvas-viewport-scroll') ||
        e.target.classList.contains('canvas-viewport') || e.target.classList.contains('canvas-page-layer')) {
      selectNode(null);
    }
  });

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
        e.stopPropagation();
        startX = e.clientX;
        startW = viewport.offsetWidth;
        handle.classList.add('dragging');
        handle.setPointerCapture(e.pointerId);
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        function onMove(ev) {
          const dx = ev.clientX - startX;
          const newW = Math.max(200, Math.min(startW + dx, 2400));
          viewport.style.width = `${newW}px`;
          if (widthLabel) widthLabel.textContent = `${Math.round(newW)}px`;
        }

        function onUp() {
          handle.releasePointerCapture(e.pointerId);
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
    setPageDirty(v);
    saveBtn.disabled = !v;
    dirtyIndicator.style.display = v ? 'inline' : 'none';
    dirtyIndicator.textContent = v ? '(unsaved changes)' : '';
  }

  function renderBoxModelNow() {
    if (isDragging()) return; // don't re-render frame during active drag
    clearBoxModel(canvasEl);
    if (selectedNodeId) {
      const node = pm.findNode(doc.root, selectedNodeId);
      if (node) renderBoxModel(canvasEl, node, onNodeChange);
    }
  }

  /** Re-render the tree panel (head + body sections). */
  function refreshTree() {
    if (!doc) return;
    renderTree(treeContent, doc, selectedNodeId, selectedHeadIndex, {
      onSelectNode: selectNode,
      onSelectHead: selectHead,
      onAddHead,
      onRemoveHead,
      onRemoveNode,
      onAddToNode,
    }, treeCollapsed);
  }

  /** Re-render the inspector for the current selection (node or head). */
  function refreshInspector() {
    if (selectedHeadIndex !== null) {
      renderHeadInspector(inspectorContent, doc, selectedHeadIndex, onNodeChange, () => onRemoveHead(selectedHeadIndex));
    } else {
      renderInspector(inspectorContent, doc, selectedNodeId, onNodeChange);
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
  function onAddNode(parentId, index, typeSpec) {
    // Palette items may pass "type:element" composites (e.g. "text:a", "box:video")
    const sep = typeSpec.indexOf(':');
    const type = sep === -1 ? typeSpec : typeSpec.slice(0, sep);
    const element = sep === -1 ? undefined : typeSpec.slice(sep + 1);
    const node = pm.addNode(doc.root, parentId, type, index, {}, element);
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

  /** Remove a body node by id (called from tree keyboard Delete). */
  function onRemoveNode(nodeId) {
    if (!doc || nodeId === 'root') return;
    if (confirm(`Delete node "${nodeId}"?`)) {
      pm.removeNode(doc.root, nodeId);
      if (selectedNodeId === nodeId) selectedNodeId = null;
      markDirty(true);
      renderCanvas(canvasEl, doc, selectedNodeId, selectNode, onDrop, onAddNode);
      refreshTree();
      refreshInspector();
    }
  }

  /** Add a child to a specific node (from tree "+" button). Prompts with a simple type choice. */
  function onAddToNode(parentId) {
    const type = prompt('Component type (box, text, image):', 'box');
    if (!type) return;
    const t = type.trim().toLowerCase();
    if (!['box', 'text', 'image'].includes(t)) { toast('Invalid type', 'error'); return; }
    onAddNode(parentId, undefined, t);
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
  renderPalette(componentsContent, (type) => {
    onAddNode(doc.root.id, doc.root.children.length, type);
  });

  // Re-render box model when canvas resizes
  const resizeObs = new ResizeObserver(() => {
    if (selectedNodeId) {
      requestAnimationFrame(renderBoxModelNow);
    }
  });
  resizeObs.observe(canvasEl);

  // Warn before leaving with unsaved changes
  function onBeforeUnload(e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  }
  window.addEventListener('beforeunload', onBeforeUnload);
  _prevBeforeUnload = onBeforeUnload;

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
