// App bootstrap: sidebar toggle, store subscription → view rendering.

import { api } from './api.js';
import { applySelectionRules, patch, refreshGitStatus, refreshFiles, refreshProjects, selectedProject, state, subscribe } from './state.js';
import { renderContentNav, wireAddFileButton } from './components/content-list.js';
import { renderConfigEditor } from './components/config-editor.js';
import { renderHeaderStatus } from './components/git-status.js';
import { renderProjectInfo } from './components/project-info.js';
import { renderProjectSelector } from './components/project-selector.js';
import { renderEditor } from './components/json-editor.js';
import { toast, toastError } from './components/toast.js';

const $ = (id) => document.getElementById(id);

// Sidebar toggle (kept from the original sketch).
$('toggle-sidebar').addEventListener('click', () => {
  $('sidebar').classList.toggle('collapsed');
});

wireAddFileButton($('add-file-btn'));

// Settings nav toggles the config editor view.
let settingsActive = false;
$('nav-settings').addEventListener('click', (e) => {
  e.preventDefault();
  settingsActive = !settingsActive;
  $('nav-settings').classList.toggle('active', settingsActive);
  patch({ view: settingsActive ? 'settings' : 'content' });
});

function render() {
  renderProjectSelector($('header-title'));
  renderContentNav($('content-nav'));
  renderHeaderStatus($('header-status'));

  const root = $('view-root');
  if (state.view === 'settings') {
    renderConfigEditor(root);
    return;
  }

  root.textContent = '';
  if (!state.projects.find((p) => p.id === state.selectedId)) {
    // No-project / empty-state flow.
    renderEditor(root);
    // Auto-open the import modal when there are no projects at all (spec §7).
    if (state.ready && state.projects.length === 0 && !document.querySelector('.modal-overlay')) {
      import('./components/import-modal.js').then((m) =>
        m.openImportModal({ dismissable: true }),
      );
    }
    return;
  }

  const stack = document.createElement('div');
  root.append(stack);
  renderProjectInfo(stack);
  renderEditor(root);
}

subscribe(render);

(async function boot() {
  try {
    await refreshProjects();
    applySelectionRules();

    // A restored selection whose checkout is missing counts as "accessed":
    // clone it lazily (spec §6), then refresh everything.
    const project = selectedProject();
    if (project && (!project.checkout || !project.checkout.exists)) {
      try {
        await api.checkout(project.id);
        await refreshProjects();
        toast(`Fetched “${project.name}”`);
      } catch (err) {
        toastError(err);
      }
    }

    await Promise.all([refreshFiles().catch(() => {}), refreshGitStatus().catch(() => {})]);
  } catch (err) {
    toastError(err);
  } finally {
    patch({ ready: true });
  }
})();
