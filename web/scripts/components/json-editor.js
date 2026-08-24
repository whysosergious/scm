// JSON editor v1 (spec §9): plain textarea loading the complete file,
// client-side syntax pre-check, server remains authoritative.

import { api } from '../api.js';
import { el } from '../dom.js';
import { patch, refreshGitStatus, selectedProject, state } from '../state.js';
import { toast, toastError } from './toast.js';

let originalText = '';

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
      btn.addEventListener('click', () =>
        document.getElementById('add-file-btn').click());
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

  const errLine = el('p', { class: 'editor-error', style: { display: 'none' } });
  const saveBtn = el('button', { class: 'btn-save', disabled: true }, 'Save');
  const cancelBtn = el('button', { class: 'btn-secondary', disabled: true }, 'Cancel');

  let current = '';
  const textarea = el('textarea', {
    class: 'json-editor',
    spellcheck: 'false',
    placeholder: 'Loading…',
  });

  function validate() {
    const raw = textarea.value;
    if (raw === originalText) {
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      errLine.style.display = 'none';
      return;
    }
    cancelBtn.disabled = false;
    try {
      JSON.parse(raw);
      errLine.style.display = 'none';
      saveBtn.disabled = false;
    } catch (e) {
      // Refuse to save malformed JSON (spec §9).
      errLine.textContent = `✕ Invalid JSON: ${e.message}`;
      errLine.style.display = 'block';
      saveBtn.disabled = true;
    }
  }

  textarea.addEventListener('input', validate);

  cancelBtn.addEventListener('click', () => {
    textarea.value = originalText;
    validate();
  });

  saveBtn.addEventListener('click', async () => {
    let parsed;
    try {
      parsed = JSON.parse(textarea.value);
    } catch (e) {
      toastError({ message: 'Invalid JSON — not saved', detail: e.message, category: 'invalid-json' });
      return;
    }
    saveBtn.disabled = true;
    try {
      await api.saveFile(project.id, name, JSON.stringify(parsed, null, 2) + '\n');
      originalText = JSON.stringify(parsed, null, 2) + '\n';
      textarea.value = originalText;
      validate();
      toast(`Saved ${name}`);
      await refreshGitStatus().catch(() => {});
      patch({});
    } catch (err) {
      toastError(err);
      saveBtn.disabled = false; // keep local edits intact on failure (spec §11)
    }
  });

  root.append(
    el('div', { class: 'header-section' },
      el('h1', { class: 'mono-title', text: name }),
      el('p', { text: `${project.name} · ${project.content_dir}/${name}` })),
    textarea,
    errLine,
    el('div', { class: 'action-bar' }, cancelBtn, saveBtn),
  );

  textarea.value = '';
  textarea.placeholder = 'Loading…';
  try {
    const data = await api.loadFile(project.id, name);
    // Ignore stale responses when the user switched files meanwhile.
    if (state.selectedFile !== name) return;
    originalText = data.text;
    current = data.text;
    textarea.value = current;
    textarea.placeholder = '';
    validate();
  } catch (err) {
    textarea.placeholder = '';
    toastError(err);
  }
}
