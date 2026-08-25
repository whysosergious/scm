// Project selector rendered into the header title. Click opens a dropdown
// listing configured projects plus the import action (spec §14).

import { api } from '../api.js';
import { el, esc, icon } from '../dom.js';
import { patch, refreshFiles, refreshGitStatus, refreshProjects, selectedProject, state } from '../state.js';
import { openImportModal } from './import-modal.js';
import { toast, toastError } from './toast.js';

/** @type {HTMLElement|null} The currently open dropdown element. */
let dropdown = null;

/**
 * Close and remove the dropdown menu if open.
 * @returns {void}
 */
function closeDropdown() {
  if (dropdown) {
    dropdown.remove();
    dropdown = null;
    document.removeEventListener('click', onOutside);
  }
}

/**
 * Handle clicks outside the dropdown to close it.
 * @param {MouseEvent} e - The document click event.
 * @returns {void}
 */
function onOutside(e) {
  if (dropdown && !dropdown.contains(e.target)) closeDropdown();
}

/**
 * Select a project by id, trigger lazy clone if needed, and refresh related state.
 * @param {string} id - The project id to select.
 * @returns {Promise<void>}
 */
async function selectAndPrepare(id) {
  closeDropdown();
  const project = state.projects.find((p) => p.id === id);
  if (!project) return;
  patch({ selectedId: id, selectedFile: null, view: 'content' });
  localStorage.setItem('scm:selected-project-id', id);

  // Clone lazily on first selection/access (spec §6).
  if (!project.checkout || !project.checkout.exists) {
    toast(`Fetching “${project.name}”…`);
    try {
      await api.checkout(id);
      await refreshProjects();
      refreshFiles().catch(() => {});
      refreshGitStatus().catch(() => {});
      toast(`“${project.name}” is ready`, 'ok');
    } catch (err) {
      toastError(err);
    }
    return;
  }
  refreshFiles().catch(() => {});
  refreshGitStatus().catch(() => {});
}

/**
 * Refresh all project-related data (projects list, files, git status).
 * @returns {Promise<void>}
 */
async function refreshEverything() {
  await refreshProjects().catch(toastError);
  refreshFiles().catch(() => {});
  refreshGitStatus().catch(() => {});
}

/**
 * Render the project selector (header dropdown trigger) into the given container.
 * @param {HTMLElement} container - The container element to render into.
 * @returns {void}
 */
export function renderProjectSelector(container) {
  container.textContent = '';
  const project = selectedProject();
  const label = project ? project.name : 'No project';

  container.append(
    el('span', { text: label }),
    icon('arrow_drop_down', 20),
  );

  container.onclick = () => {
    if (dropdown) {
      closeDropdown();
      return;
    }
    dropdown = el('div', { class: 'menu-dropdown' });

    for (const p of state.projects) {
      const badge =
        !p.checkout || !p.checkout.exists
          ? el('span', { class: 'badge muted', text: 'not cloned' })
          : p.checkout.remote_matches
            ? el('span', { class: 'badge ok', text: 'ready' })
            : el('span', { class: 'badge warn', text: 'remote?' });
      dropdown.append(
        el(
          'button',
          {
            class: `menu-item ${p.id === state.selectedId ? 'active' : ''}`,
            onclick: () => selectAndPrepare(p.id),
          },
          el('span', { class: 'menu-item-name', text: p.name }),
          badge,
        ),
      );
    }

    dropdown.append(el('div', { class: 'menu-sep' }));
    dropdown.append(
      el(
        'button',
        {
          class: 'menu-item',
          onclick: () => {
            closeDropdown();
            openImportModal();
          },
        },
        icon('add', 16),
        el('span', { text: 'Import project…' }),
      ),
    );
    // Remove projects
    if (project) {
      dropdown.append(
        el(
          'button',
          {
            class: 'menu-item danger',
            onclick: async () => {
              closeDropdown();
              if (!confirm(`Remove “${project.name}” from the configuration?\nThe local checkout will NOT be deleted.`)) return;
              try {
                await api.deleteProject(project.id);
                toast('Removed from configuration (files kept)');
                await refreshEverything();
              } catch (err) {
                toastError(err);
              }
            },
          },
          icon('delete', 16),
          el('span', { text: `Remove “${esc(project.id)}” from config` }),
        ),
      );
    }

    document.body.append(dropdown);
    requestAnimationFrame(() => document.addEventListener('click', onOutside));
  };
}
