// App bootstrap: sidebar toggle, store subscription → view rendering.

import { api } from './api.js';
import { applySelectionRules, patch, refreshGitStatus, refreshFiles, refreshPages, refreshProjects, selectedProject, state, subscribe } from './state.js';
import { renderContentNav } from './components/content-list.js';
import { renderPagesNav } from './components/pages-list.js';
import { renderConfigEditor } from './components/config-editor.js';
import { renderHeaderStatus } from './components/git-status.js';
import { renderProjectInfo } from './components/project-info.js';
import { renderProjectSelector } from './components/project-selector.js';
import { renderEditor } from './components/json-editor.js';
import { renderMedia } from './components/media.js';
import { renderPageEditor } from './components/page-editor.js';
import { toast, toastError } from './components/toast.js';

const $ = (id) => document.getElementById(id);

const SIDEBAR_KEY = 'scm:sidebar-collapsed';

// Sidebar toggle: arrow points in the direction the sidebar will go.
function setSidebarCollapsed(collapsed) {
  $('sidebar').classList.toggle('collapsed', collapsed);
  const icon = document.querySelector('#toggle-sidebar .material-symbols-outlined');
  if (icon) icon.textContent = collapsed ? 'chevron_right' : 'chevron_left';
  $('toggle-sidebar').title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
}

$('toggle-sidebar').addEventListener('click', () => {
  setSidebarCollapsed($('sidebar').classList.toggle('collapsed'));
});

// Restore sidebar state on boot
setSidebarCollapsed(localStorage.getItem(SIDEBAR_KEY) === '1');

// Settings nav toggles the config editor view.
$('nav-settings').addEventListener('click', (e) => {
  e.preventDefault();
  patch({ view: 'settings' });
});

// Media nav opens the media manager view.
$('nav-media').addEventListener('click', (e) => {
  e.preventDefault();
  patch({ view: 'media' });
});

function render() {
  renderProjectSelector($('header-title'));
  renderContentNav($('content-nav'));
  renderPagesNav($('pages-nav'));
  renderHeaderStatus($('header-status'));
  renderProjectInfo();

  // nav active states follow the current view
  const mediaActive = state.view === 'media';
  const settingsActive = state.view === 'settings';
  $('nav-media').classList.toggle('active', mediaActive);
  $('nav-settings').classList.toggle('active', settingsActive);

  const root = $('view-root');
  if (state.view === 'media') {
    renderMedia(root);
    return;
  }
  if (state.view === 'settings') {
    renderConfigEditor(root);
    return;
  }
  if (state.view === 'page-editor') {
    renderPageEditor(root);
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

    await Promise.all([refreshFiles().catch(() => {}), refreshPages().catch(() => {}), refreshGitStatus().catch(() => {})]);
  } catch (err) {
    toastError(err);
  } finally {
    patch({ ready: true });
  }
})();
