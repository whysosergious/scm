// Page editor container (spec_page_editor.md §§11, 9a).
// Toolbar + two-column layout: canvas | tabbed right panel (Components | Tree | Inspector).
// Manages page load/save flow, head element selection, and dirty state.

import { api } from '../api.js';
import * as pm from '../page-model.js';
import { el, icon } from '../dom.js';
import { patch, refreshGitStatus, refreshPages, selectedProject, setPageDirty, state } from '../state.js';
import { renderPalette } from './page-palette.js';
import { renderCanvas, setProjectId, isDragging, setShowEmpty, updateSizeLabel, patchNode, patchBodyAttrs } from './page-canvas.js';
import { getIframeDoc, setZoomScale } from './canvas-iframe.js';
import { renderInspector, renderHeadInspector, renderBodyInspector } from './page-inspector.js';
import { renderTree } from './page-tree.js';
import { renderBoxModel, clearBoxModel } from './page-boxmodel.js';
import { toast, toastError } from './toast.js';

/** @type {function|null} Previous beforeunload handler to remove on re-render. */
let _prevBeforeUnload = null;
/** @type {function|null} Previous escape keydown handler to remove on re-render. */
let _prevEscapeHandler = null;
/** @type {function|null} Previous document click handler closing the toolbar menu. */
let _prevMenuDocClick = null;
/** @type {function|null} Previous keydown handler closing the toolbar menu. */
let _prevMenuKey = null;

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

  // Toolbar actions — these live inside the burger menu
  const saveBtn = el('button', { class: 'menu-item menu-item-primary', disabled: true }, icon('save', 18), el('span', { text: 'Save' }));
  const generateBtn = el('button', { class: 'menu-item' }, icon('code', 18), el('span', { text: 'Generate' }));
  const previewBtn = el('button', { class: 'menu-item' }, icon('open_in_new', 18), el('span', { text: 'Preview' }));
  const importBtn = el('button', { class: 'menu-item' }, icon('upload', 18), el('span', { text: 'Import HTML' }));
  const dirtyIndicator = el('span', { class: 'muted-note', text: '', style: { display: 'none' } });

  // Persisted menu settings
  const LS_SHOW_EMPTY = 'scm-show-empty';
  const LS_CONFIRM_CLOSE = 'scm-confirm-close';
  let showEmpty = localStorage.getItem(LS_SHOW_EMPTY) !== 'false';
  let confirmClose = localStorage.getItem(LS_CONFIRM_CLOSE) !== 'false';

  setShowEmpty(showEmpty);

  // VIEW: show empty element markers on the canvas
  const emptyCheck = el('span', { class: 'menu-check-box' + (showEmpty ? ' checked' : '') }, icon('check', 16));
  const emptyToggle = el('div', { class: 'menu-item menu-check', title: 'Show empty elements' },
    emptyCheck,
    el('span', { text: 'Show empty elements' }),
  );
  emptyToggle.addEventListener('click', () => {
    showEmpty = !showEmpty;
    emptyCheck.classList.toggle('checked', showEmpty);
    localStorage.setItem(LS_SHOW_EMPTY, showEmpty);
    setShowEmpty(showEmpty);
    // Toggle empty-box class on all box nodes in the iframe (no full re-render)
    const iframeDoc = getIframeDoc();
    if (iframeDoc) {
      iframeDoc.querySelectorAll('.canvas-page-node[data-node-type="box"]').forEach((n) => {
        // Only toggle on leaf boxes (no children rendered inside)
        if (n.children.length === 0) n.classList.toggle('canvas-empty-box', showEmpty);
      });
    }
    if (selectedNodeId && selectedNodeId !== '__body__') {
      requestAnimationFrame(() => {
        const node = pm.findNode(doc.root, selectedNodeId);
        if (node) renderBoxModel(canvasEl, node, onNodeChange);
      });
    }
  });

  // OPTIONS: warn before closing the tab/browser with unsaved changes
  const confirmCheck = el('span', { class: 'menu-check-box' + (confirmClose ? ' checked' : '') }, icon('check', 16));
  const confirmToggle = el('div', { class: 'menu-item menu-check', title: 'Warn before closing with unsaved changes' },
    confirmCheck,
    el('span', { text: 'Confirm on close' }),
  );
  confirmToggle.addEventListener('click', () => {
    confirmClose = !confirmClose;
    confirmCheck.classList.toggle('checked', confirmClose);
    localStorage.setItem(LS_CONFIRM_CLOSE, confirmClose);
  });

  // Burger menu
  const burgerBtn = el('button', { class: 'btn-icon burger', title: 'Menu' }, icon('menu', 20));
  const pageMenu = el('div', { class: 'menu-dropdown page-menu', style: { display: 'none' } },
    saveBtn,
    previewBtn,
    generateBtn,
    importBtn,
    el('div', { class: 'menu-divider' }),
    el('div', { class: 'menu-section-title', text: 'VIEW' }),
    emptyToggle,
    el('div', { class: 'menu-divider' }),
    el('div', { class: 'menu-section-title', text: 'OPTIONS' }),
    confirmToggle,
  );

  function closeMenu() { pageMenu.style.display = 'none'; }
  burgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pageMenu.style.display = pageMenu.style.display === 'none' ? 'block' : 'none';
  });
  pageMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.menu-item');
    if (item && !item.classList.contains('menu-check')) closeMenu();
  });
  // Capture phase so it fires even when a canvas node stops propagation (bubble)
  if (_prevMenuDocClick) document.removeEventListener('click', _prevMenuDocClick, true);
  _prevMenuDocClick = (e) => {
    if (pageMenu.style.display !== 'none' && !pageMenu.contains(e.target) && e.target !== burgerBtn) {
      closeMenu();
    }
  };
  document.addEventListener('click', _prevMenuDocClick, true);
  if (_prevMenuKey) document.removeEventListener('keydown', _prevMenuKey);
  _prevMenuKey = (e) => {
    if (e.key === 'Escape' && pageMenu.style.display !== 'none') closeMenu();
  };
  document.addEventListener('keydown', _prevMenuKey);

  const toolbar = el('div', { class: 'page-toolbar' },
    el('div', { class: 'page-toolbar-left' },
      burgerBtn,
      el('span', { class: 'mono-title', text: name }),
      dirtyIndicator,
    ),
    pageMenu,
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
    { id: 'components', label: 'Base Components', icon: 'widgets' },
    { id: 'tree', label: 'Tree', icon: 'account_tree' },
    { id: 'inspector', label: 'Inspector', icon: 'tune' },
  ];

  const tabButtons = {};
  for (const t of tabs) {
    const btn = el('button', {
      class: 'panel-tab' + (t.id === activeTab ? ' active' : ''),
      'data-tab': t.id,
      title: t.label,
    }, icon(t.icon, 16));
    btn.addEventListener('click', () => switchTab(t.id));
    tabButtons[t.id] = btn;
    tabBar.append(btn);
  }

  // Scroll tabs on vertical mouse wheel
  tabBar.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      tabBar.scrollLeft += e.deltaY;
    }
  }, { passive: false });

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

  setProjectId(project.id);

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
    setZoomScale(zoomLevel / 100);
    const zoomWrap = canvasEl.querySelector('.canvas-zoom-wrap');
    const zoomPct = canvasEl.querySelector('.canvas-zoom-pct');
    if (zoomWrap) zoomWrap.style.transform = `scale(${zoomLevel / 100})`;
    if (zoomPct) zoomPct.textContent = `${zoomLevel}%`;
    positionHandles();
  }

  /**
   * Position resize handles at the viewport visual edges.
   *
   * Handles are children of .canvas-viewport (NOT zoom-wrap), so they are not
   * scaled by the zoom transform. The zoom-wrap is a block child of the viewport
   * filling its width, so its layout edges align with the viewport edges. The
   * CSS scale only shrinks the *visual* rendering. We compute where the visual
   * edges actually fall and set inline styles on each handle accordingly.
   */
  function positionHandles() {
    const viewport = canvasEl._viewport;
    const resizeW = canvasEl._resizeW;
    const resizeH = canvasEl._resizeH;
    const widthLabel = canvasEl._widthLabel;
    if (!viewport || !resizeW || !resizeH) return;

    const z = zoomLevel / 100;
    const vpW = viewport.offsetWidth;
    const vpH = viewport.offsetHeight;
    const zoomWrap = canvasEl.querySelector('.canvas-zoom-wrap');
    const wrapH = zoomWrap ? zoomWrap.offsetHeight : vpH;

    // Width handle — tracks the viewport right edge.
    // Visual right edge of zoom-wrap = center + wrapW/2 * z. Handle sits 15px outside.
    // Convert to a CSS `right` value: right = (vpW - visualRight) - 15
    const wRight = (vpW - (vpW + vpW * z) / 2) - 15;
    resizeW.style.right = `${wRight}px`;
    // Vertically center on the zoom-wrap visual center.
    const wTop = (vpH - wrapH * z) / 2 + (wrapH * z) / 2;
    resizeW.style.top = `${wTop}px`;
    resizeW.style.transform = 'translateY(-50%)';

    // Width label — same horizontal as handle, offset below it.
    if (widthLabel) {
      widthLabel.style.right = `${wRight}px`;
      widthLabel.style.top = `${wTop}px`;
    }

    // Height handle — tracks the viewport bottom edge.
    // Visual bottom of zoom-wrap = topMargin + wrapH * z. topMargin = (vpH - wrapH*z)/2.
    // Handle sits 15px below: bottom offset = vpH - visualBottom - 15.
    resizeH.style.bottom = `${vpH - ((vpH - wrapH * z) / 2 + wrapH * z) - 15}px`;
    // Horizontally center on the viewport.
    resizeH.style.left = `${vpW / 2}px`;
    resizeH.style.transform = 'translateX(-50%)';
  }

  function setZoom(level) {
    zoomLevel = Math.max(25, Math.min(300, level));
    applyZoom();
  }

    // Wire zoom bar + resize handles. Idempotent: the canvas structure is built
    // asynchronously inside loadPage (after an await), so this is invoked once
    // the structure actually exists — not from a rAF that would fire too early.
    let controlsWired = false;
    function wireCanvasControls() {
      if (controlsWired) return;
      const resizeW = canvasEl._resizeW;
      const resizeH = canvasEl._resizeH;
      const widthLabel = canvasEl._widthLabel;
      const viewport = canvasEl._viewport;
      if (!resizeW || !resizeH || !viewport) return; // structure not built yet
      controlsWired = true;

      const scale = () => zoomLevel / 100;

      canvasEl._zoomOut.addEventListener('click', () => {
        const idx = ZOOM_LEVELS.findIndex((z) => z >= zoomLevel);
        setZoom(idx > 0 ? ZOOM_LEVELS[idx - 1] : zoomLevel - 25);
      });
      canvasEl._zoomIn.addEventListener('click', () => {
        const idx = ZOOM_LEVELS.findIndex((z) => z > zoomLevel);
        setZoom(idx >= 0 ? ZOOM_LEVELS[idx] : zoomLevel + 25);
      });
      canvasEl._zoomFit.addEventListener('click', () => {
        // Fit to available width
        const scroll = canvasEl.querySelector('.canvas-viewport-scroll');
        if (scroll && viewport) {
          const available = scroll.clientWidth - 48; // padding
          const pageW = viewport.scrollWidth || 1200;
          setZoom(Math.round((available / pageW) * 100));
        }
      });

      // Ctrl+scroll zoom on canvas
      canvasEl.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        setZoom(zoomLevel + delta);
      }, { passive: false });

      // Viewport resize handles. Pointer movement is in screen pixels while the
      // viewport width/height are design pixels (the zoom transform is applied
      // to an inner wrapper), so divide by the current zoom scale.
      function wireResize(handle, orient) {
        handle.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const startX = e.clientX;
          const startY = e.clientY;
          const startW = viewport.offsetWidth;
          const startH = viewport.offsetHeight;
          handle.classList.add('dragging');
          handle.setPointerCapture(e.pointerId);
          document.body.style.cursor = orient === 'w' ? 'ew-resize' : 'ns-resize';
          document.body.style.userSelect = 'none';

          function onMove(ev) {
            if (orient === 'w') {
              const dx = (ev.clientX - startX) / scale();
              const newW = Math.max(200, Math.min(startW + dx, 2400));
              viewport.style.width = `${newW}px`;
              if (widthLabel) widthLabel.textContent = `${Math.round(newW)}px`;
            } else {
              const dy = (ev.clientY - startY) / scale();
              const newH = Math.max(80, startH + dy);
              viewport.style.height = `${newH}px`;
            }
            positionHandles();
            updateSizeLabel(canvasEl);
          }

          function onUp() {
            handle.releasePointerCapture(e.pointerId);
            handle.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            localStorage.setItem('scm-canvas-width', viewport.offsetWidth);
            localStorage.setItem('scm-canvas-height', viewport.offsetHeight);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
          }

          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
        });
      }

      wireResize(resizeW, 'w');
      wireResize(resizeH, 'h');
    }

  // State
  function markDirty(v) {
    dirty = v;
    setPageDirty(v);
    saveBtn.disabled = !v;
    dirtyIndicator.style.display = v ? 'inline' : 'none';
    dirtyIndicator.textContent = v ? '*' : '';
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
      onAddTop,
      onReorder,
    }, treeCollapsed);
  }

  /** Re-render the inspector for the current selection (node, head, or body). */
  function refreshInspector() {
    if (selectedHeadIndex !== null) {
      renderHeadInspector(inspectorContent, doc, selectedHeadIndex, onNodeChange, () => onRemoveHead(selectedHeadIndex));
    } else if (selectedNodeId === '__body__') {
      renderBodyInspector(inspectorContent, doc, onNodeChange);
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
    // Update canvas selection (inside the iframe)
    const iframeDoc = getIframeDoc();
    if (iframeDoc) {
      iframeDoc.querySelectorAll('.canvas-page-node').forEach((n) => {
        n.classList.toggle('selected', n.dataset.nid === id);
      });
      // Body pseudo-node: highlight the <body> element
      if (iframeDoc.body) {
        iframeDoc.body.classList.toggle('selected', id === '__body__');
      }
    }
    // Box model control — defer to let canvas layout settle
    clearBoxModel(canvasEl);
    if (id && id !== '__body__') {
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

  /** Handle any property change: mark dirty, patch DOM in place, re-render tree. */
  function onNodeChange() {
    markDirty(true);
    // Try targeted patching first — only full re-render if patch fails
    let patched = false;
    if (selectedHeadIndex !== null) {
      // Head element change → full re-render (affects iframe <head>)
      renderCanvas(canvasEl, doc, selectedNodeId, selectNode, onDrop, onAddNode);
      patched = true;
    } else if (selectedNodeId === '__body__') {
      patchBodyAttrs(doc);
      patched = true;
    } else if (selectedNodeId) {
      const node = pm.findNode(doc.root, selectedNodeId);
      if (node) patched = patchNode(selectedNodeId, node, selectedNodeId);
    }
    if (!patched) {
      renderCanvas(canvasEl, doc, selectedNodeId, selectNode, onDrop, onAddNode);
    }
    refreshTree();
    if (selectedNodeId && selectedNodeId !== '__body__') {
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
    // SVG gets a default template so it renders as a visible placeholder
    const props = {};
    if (element === 'svg') {
      props.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="20" y="20" width="160" height="160" rx="8" fill="none" stroke="#999" stroke-width="2"/></svg>';
    }
    const node = pm.addNode(doc.root, parentId, type, index, props, element);
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
    if (!doc || !doc.root || nodeId === doc.root.id) return;
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
    const type = prompt('Component type (box, text, image) or type:element (e.g. box:svg, text:a):', 'box');
    if (!type) return;
    const t = type.trim().toLowerCase();
    const base = t.includes(':') ? t.split(':')[0] : t;
    if (!['box', 'text', 'image'].includes(base)) { toast('Invalid type', 'error'); return; }
    onAddNode(parentId, undefined, t);
  }

  /** Add a new element at the top of the body (first child of root). */
  function onAddTop(typeSpec) {
    if (!doc) return;
    onAddNode(doc.root.id, 0, typeSpec);
  }

  /** Reorder a node via drag-and-drop in the tree. */
  function onReorder(draggedId, targetId, position) {
    if (!doc || draggedId === targetId) return;
    const target = pm.findNode(doc.root, targetId);
    if (!target) return;

    let targetParentId;
    let index;
    if (position === 'inside') {
      targetParentId = targetId;
      index = 0;
    } else {
      const parent = pm.findParent(doc.root, targetId);
      if (!parent) return;
      targetParentId = parent.id;
      const idx = parent.children.indexOf(target);
      index = position === 'before' ? idx : idx + 1;
    }

    const ok = pm.moveNode(doc.root, draggedId, targetParentId, index);
    if (!ok) {
      toast('Cannot move there (nesting or cycle rule)', 'error');
      return;
    }
    markDirty(true);
    renderCanvas(canvasEl, doc, selectedNodeId, selectNode, onDrop, onAddNode);
    refreshTree();
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

  importBtn.addEventListener('click', async () => {
    closeMenu();
    const { openPageImportModal } = await import('./page-import-modal.js');
    openPageImportModal({
      projectId: project.id,
      onImport({ doc: importedDoc }) {
        doc = importedDoc;
        dirty = true;
        renderCanvas(canvasEl, doc, selectedNodeId, selectNode, onDrop, onAddNode);
        wireCanvasControls();
        refreshTree();
        refreshInspector();
        toast('Page imported');
      },
    });
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

  // Warn before leaving with unsaved changes (honors the "Confirm on close" setting)
  function onBeforeUnload(e) {
    if (dirty && confirmClose) { e.preventDefault(); e.returnValue = ''; }
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
      wireCanvasControls();
      applyZoom();
      refreshTree();
      refreshInspector();
    } catch (err) {
      toastError(err);
    }
  }
}
