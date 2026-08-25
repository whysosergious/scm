// File editor container (spec.md §9.1): "Form" and "JSON" modes
// over one document, sharing a single dirty/save flow. The backend stays
// authoritative (spec §9).

import { api } from '../api.js';
import * as model from '../json-model.js';
import { el } from '../dom.js';
import { patch, refreshGitStatus, selectedProject, state } from '../state.js';
import { createFormEditor } from './form-editor.js';
import { triggerAddFile } from './content-list.js';
import { toast, toastError } from './toast.js';

/**
 * Renders the file editor into the given root element. Displays one of:
 * clone prompt, file list/empty state, or the tabbed Form|JSON editor.
 * @param {HTMLElement} root - DOM element to render into (caller owns clearing it)
 */
export function renderEditor(root) {
  // NOTE: caller owns clearing `root`; this function renders into it.
  const project = selectedProject();

  if (!project) {
    renderNoProject(root);
    return;
  }

  // Checkout missing → offer to clone (spec §6).
  if (!project.checkout || !project.checkout.exists) {
    const btn = el('button', { class: 'btn-primary' }, 'Clone now');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await api.checkout(project.id);
        toast(`“${project.name}” cloned`);
        const { refreshProjects } = await import('../state.js');
        await refreshProjects();
      } catch (err) {
        toastError(err);
        btn.disabled = false;
      }
    });
    root.append(
      el(
        'div',
        { class: 'empty-state' },
        el('h1', { text: 'Checkout not found' }),
        el('p', { text: `The local copy of “${project.name}” has not been cloned into the projects directory yet.` }),
        btn,
      ),
    );
    return;
  }

  // No file selected → file list / create-file empty state (spec §8).
  if (!state.selectedFile) {
    if (state.files.length > 0) {
      root.append(
        el('div', { class: 'header-section' },
          el('h1', { text: project.name }),
          el('p', { text: `Pick a JSON content file from ${project.content_dir}/ in the sidebar.` })),
      );
    } else {
      const btn = el('button', { class: 'btn-primary' }, 'Create a JSON file');
      btn.addEventListener('click', () => triggerAddFile());
      root.append(
        el(
          'div',
          { class: 'empty-state' },
          el('h1', { text: 'No content yet' }),
          el('p', { text: `${project.content_dir}/ contains no .json files. Create one to start editing.` }),
          btn,
        ),
      );
    }
    return;
  }

  renderFileEditor(root, project);
}

function renderNoProject(root) {
  const btn = el('button', { class: 'btn-primary' }, 'Import a project');
  btn.addEventListener('click', async () => {
    const mod = await import('./import-modal.js');
    mod.openImportModal();
  });
  root.append(
    el(
      'div',
      { class: 'empty-state' },
      el('h1', { text: 'Welcome to SCM' }),
      el('p', { text: 'No website projects are configured yet. Import a repository to manage its JSON content.' }),
      btn,
    ),
  );
}

async function renderFileEditor(root, project) {
  const name = state.selectedFile;

  let originalText = '';
  let mode = 'form'; // 'form' | 'json'
  let tree = null;
  let dirty = false;

  const errLine = el('p', { class: 'editor-error', style: { display: 'none' } });
  const saveBtn = el('button', { class: 'btn-save', disabled: true }, 'Save');
  const cancelBtn = el('button', { class: 'btn-secondary', disabled: true }, 'Cancel');

  const surface = el('div', { class: 'editor-surface' });

  // ---------- tabs ----------
  let formTab, jsonTab;
  function paintTabs() {
    formTab.classList.toggle('active', mode === 'form');
    jsonTab.classList.toggle('active', mode === 'json');
  }
  formTab = el('button', { class: 'tab-btn active', text: 'Form' });
  jsonTab = el('button', { class: 'tab-btn', text: 'JSON' });
  formTab.addEventListener('click', () => setMode('form'));
  jsonTab.addEventListener('click', () => setMode('json'));

  // ---------- plain-text editor ----------
  const textarea = el('textarea', {
    class: 'json-editor',
    spellcheck: 'false',
    placeholder: 'Loading…',
  });
  textarea.addEventListener('input', () => {
    validateJsonText();
    markDirty(textarea.value !== originalText);
  });

  function validateJsonText() {
    try {
      JSON.parse(textarea.value);
      hideErr();
      return true;
    } catch (e) {
      // Refuse to save malformed JSON (spec §9).
      showErr(`✕ Invalid JSON: ${e.message}`);
      return false;
    }
  }

  function showErr(msg) {
    errLine.textContent = msg;
    errLine.style.display = 'block';
  }
  function hideErr() {
    errLine.style.display = 'none';
  }

  function markDirty(v) {
    dirty = v;
    syncButtons();
  }

  function syncButtons() {
    saveBtn.disabled = !dirty || (mode === 'json' && !validateQuiet());
    cancelBtn.disabled = !dirty;
  }

  function validateQuiet() {
    try {
      JSON.parse(textarea.value);
      return true;
    } catch {
      return false;
    }
  }

  // ---------- actions ----------
  cancelBtn.addEventListener('click', () => {
    textarea.value = originalText;
    reloadTreeFromOriginal();
    if (mode === 'form') renderForm();
    else renderJson();
    markDirty(false);
    hideErr();
  });

  saveBtn.addEventListener('click', async () => {
    let textOut;
    if (mode === 'form') {
      if (!tree) return;
      textOut = model.serialize(tree);
    } else {
      if (!validateJsonText()) {
        toastError({ message: 'Invalid JSON — not saved', category: 'invalid-json' });
        return;
      }
      textOut = textarea.value;
    }

    saveBtn.disabled = true;
    try {
      await api.saveFile(project.id, name, textOut);
      originalText = textOut;
      if (mode === 'json') reloadTreeFromOriginal();
      markDirty(false);
      hideErr();
      toast(`Saved ${name}`);
      await refreshGitStatus().catch(() => {});
      patch({});
    } catch (err) {
      toastError(err);
      saveBtn.disabled = false; // keep local edits intact on failure (spec §11)
    }
  });

  function reloadTreeFromOriginal() {
    try {
      tree = model.parse(originalText);
      formTab.disabled = false;
    } catch {
      tree = null;
      formTab.disabled = true; // can't render forms for invalid documents
    }
  }

  // ---------- mode switching ----------
  function setMode(m) {
    if (m === mode) return;
    if (m === 'form') {
      // Gated: JSON text must parse before we can render forms.
      try {
        tree = model.parse(textarea.value);
      } catch (e) {
        showErr(`✕ Fix the JSON first: ${e.message}`);
        return;
      }
      hideErr();
      mode = 'form';
    } else {
      if (mode === 'form' && tree) {
        textarea.value = model.serialize(tree); // live sync Form → JSON
      }
      mode = 'json';
    }
    paintTabs();
    renderSurface();
    syncButtons();
  }

  function renderSurface() {
    surface.textContent = '';
    if (mode === 'form' && tree) {
      renderForm();
    } else {
      renderJson();
    }
  }

  function renderForm() {
    const editor = createFormEditor(surface, {
      tree,
      // Any call means "the document changed" (spec §10 dirty semantics).
      onDirty: () => markDirty(true),
    });
    editor.render();
  }

  function renderJson() {
    surface.append(textarea);
  }

  // ---------- layout ----------
  root.append(
    el('div', { class: 'header-section' },
      el('h1', { class: 'mono-title', text: name }),
      el('p', { text: `${project.name} · ${project.content_dir}/${name}` })),
    el('div', { class: 'editor-tabs' }, formTab, jsonTab),
    surface,
    errLine,
    el('div', { class: 'action-bar' }, cancelBtn, saveBtn),
  );

  // ---------- load ----------
  textarea.value = '';
  textarea.placeholder = 'Loading…';
  renderJson(); // placeholder surface until loaded

  try {
    const data = await api.loadFile(project.id, name);
    // Ignore stale responses when the user switched files meanwhile.
    if (state.selectedFile !== name) return;
    originalText = data.text;
    textarea.value = originalText;
    textarea.placeholder = '';
    reloadTreeFromOriginal();

    if (tree) {
      mode = 'form';
    } else {
      mode = 'json';
      showErr('✕ This file is not valid JSON — edit it as text.');
    }
    paintTabs();
    renderSurface();
    syncButtons();
  } catch (err) {
    textarea.placeholder = '';
    toastError(err);
  }
}
