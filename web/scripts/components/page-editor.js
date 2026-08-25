// Page editor container (spec_page_editor.md §§11–12).
// Toolbar + three-column layout: palette | canvas | inspector.
// Manages page load/save flow and dirty state.

import { api } from '../api.js';
import * as pm from '../page-model.js';
import { el, icon } from '../dom.js';
import { patch, refreshGitStatus, refreshPages, selectedProject, state } from '../state.js';
import { renderPalette } from './page-palette.js';
import { renderCanvas, setupCanvasDragDrop, setProjectId } from './page-canvas.js';
import { renderInspector } from './page-inspector.js';
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
 * Renders the full page editor: toolbar, three-column layout (palette|canvas|inspector),
 * manages load/save flow and dirty state.
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

  // Three-column layout
  const paletteEl = el('div', { class: 'page-palette' });
  const canvasEl = el('div', { class: 'page-canvas' });
  const inspectorEl = el('div', { class: 'page-inspector' });

  const columns = el('div', { class: 'page-columns' }, paletteEl, canvasEl, inspectorEl);

  wrap.append(toolbar, columns);
  root.append(wrap);

  // Set up canvas drag/drop listeners once (not on every re-render)
  setProjectId(project.id);
  setupCanvasDragDrop(canvasEl, () => doc, selectNode, onAddNode);

  // State
  /**
   * Marks the document as dirty or clean and updates the save button and indicator.
   * @param {boolean} v - Whether the document has unsaved changes.
   * @returns {void}
   */
  function markDirty(v) {
    dirty = v;
    saveBtn.disabled = !v;
    dirtyIndicator.style.display = v ? 'inline' : 'none';
    dirtyIndicator.textContent = v ? '(unsaved changes)' : '';
  }

  /**
   * Clears and re-renders the box model control for the current selection.
   * @returns {void}
   */
  function renderBoxModelNow() {
    clearBoxModel(canvasEl);
    if (selectedNodeId) {
      const node = pm.findNode(doc.root, selectedNodeId);
      if (node) renderBoxModel(canvasEl, node, onNodeChange);
    }
  }

  /**
   * Selects a node by ID: updates the inspector, canvas selection highlight, and box model.
   * @param {string} id - The node ID to select.
   * @returns {void}
   */
  function selectNode(id) {
    selectedNodeId = id;
    renderInspector(inspectorEl, doc, id, onNodeChange);
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

  /**
   * Handles any node property change: marks dirty, re-renders canvas and box model.
   * @returns {void}
   */
  function onNodeChange() {
    markDirty(true);
    renderCanvas(canvasEl, doc, selectedNodeId, selectNode, onDrop, onAddNode);
    if (selectedNodeId) {
      requestAnimationFrame(() => {
        const node = pm.findNode(doc.root, selectedNodeId);
        if (node) renderBoxModel(canvasEl, node, onNodeChange);
      });
    }
  }

  /**
   * Handles node drop (reorder/move): moves the node in the tree and re-renders.
   * @param {string} nodeId - ID of the node being moved.
   * @param {string} targetParentId - ID of the target parent node.
   * @param {number} index - Insertion index in the target parent's children.
   * @returns {void}
   */
  function onDrop(nodeId, targetParentId, index) {
    const changed = pm.moveNode(doc.root, nodeId, targetParentId, index);
    if (changed) {
      markDirty(true);
      clearBoxModel(canvasEl);
      renderCanvas(canvasEl, doc, selectedNodeId, selectNode, onDrop, onAddNode);
      if (selectedNodeId) {
        requestAnimationFrame(() => {
          const node = pm.findNode(doc.root, selectedNodeId);
          if (node) renderBoxModel(canvasEl, node, onNodeChange);
        });
      }
    }
  }

  /**
   * Handles adding a new node: inserts into the tree, marks dirty, selects the new node.
   * @param {string} parentId - ID of the parent node to add to.
   * @param {number} index - Insertion index in the parent's children.
   * @param {string} type - Component type ('box'|'text'|'image').
   * @returns {void}
   */
  function onAddNode(parentId, index, type) {
    const node = pm.addNode(doc.root, parentId, type, index);
    if (node) {
      markDirty(true);
      clearBoxModel(canvasEl);
      renderCanvas(canvasEl, doc, selectedNodeId, selectNode, onDrop, onAddNode);
      requestAnimationFrame(() => selectNode(node.id));
    }
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

  // Re-render box model when canvas resizes (layout reflow changes element positions)
  const resizeObs = new ResizeObserver(() => {
    if (selectedNodeId) {
      requestAnimationFrame(renderBoxModelNow);
    }
  });
  resizeObs.observe(canvasEl);

  // Load page
  loadPage();
  /**
   * Loads the page content from the API, parses it, validates, and renders.
   * @returns {Promise<void>}
   */
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
      renderInspector(inspectorEl, doc, selectedNodeId, onNodeChange);
    } catch (err) {
      toastError(err);
    }
  }
}
