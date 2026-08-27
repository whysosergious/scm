// Tiny pub/sub store. The selected project is UI state (spec §7):
// persisted in localStorage by stable id, never written to scm-config.json.

import { api } from './api.js';

/** @type {string} localStorage key used to persist the selected project id. */
const STORAGE_KEY = 'scm:selected-project-id';

/**
 * Global reactive state object. Mutations go through {@link patch} so
 * subscribers are notified automatically.
 *
 * @type {{
 *   ready: boolean,
 *   projects: Array<Object>,
 *   projectsDir: string,
 *   selectedId: string|null,
 *   selectedFile: string|null,
 *   files: Array<string>,
 *   pages: Array<string>,
 *   selectedPage: string|null,
 *   gitStatus: Object|null,
 *   view: 'content'|'settings'|'media'|'page-editor'
 * }}
 */
export const state = {
  ready: false,
  projects: [],
  projectsDir: 'projects',
  selectedId: null,
  selectedFile: null,
  files: [],
  pages: [],
  selectedPage: null,
  gitStatus: null,
  view: 'content', // 'content' | 'settings' | 'media' | 'page-editor'
  pageDirty: false,
};

/** @type {Set<function(Object): void>} Active state-change subscribers. */
const listeners = new Set();

/**
 * Registers a subscriber that is called after every {@link patch}.
 * @param {function(Object): void} fn - Callback receiving the current state.
 * @returns {function(): void} Unsubscribe function (removes the listener).
 */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Notifies all registered subscribers of the current state.
 * Called internally by {@link patch}.
 * @returns {void}
 */
export function notify() {
  for (const fn of listeners) fn(state);
}

/**
 * Merges `partial` into the global state and notifies subscribers.
 * @param {Object<string, *>} partial - Partial state fields to merge.
 * @returns {void}
 */
export function patch(partial) {
  Object.assign(state, partial);
  notify();
}

/**
 * Returns the currently selected project object, or `null` if none matches.
 * @returns {Object|null} The project with `id === state.selectedId`.
 */
export function selectedProject() {
  return state.projects.find((p) => p.id === state.selectedId) || null;
}

/**
 * Fetches the project list from the server and updates state.
 * Also runs {@link applySelectionRules} to keep the selection valid.
 * @returns {Promise<Object>} Raw server response (`{ projects, projects_dir }`).
 */
export async function refreshProjects() {
  const data = await api.listProjects();
  patch({ projects: data.projects, projectsDir: data.projects_dir });
  applySelectionRules();
  return data;
}

/**
 * Selection rules exactly per spec §7.
 * If the selected id no longer exists, falls back to the first project.
 * If no projects remain, clears the selection.
 * @returns {void}
 */
export function applySelectionRules() {
  if (state.projects.length === 0) {
    if (state.selectedId !== null) patch({ selectedId: null, selectedFile: null });
    return;
  }
  let target = state.projects.find((p) => p.id === state.selectedId);
  if (!target) {
    // Stored id no longer exists → select the first project.
    target = state.projects[0];
    setSelection(target.id);
  }
}

/**
 * Sets the active project by id, persists it to localStorage, resets
 * file/page/git state, and triggers a refresh of all project data.
 * If the page editor is dirty, prompts the user before switching.
 * @param {string} id - The project id to select.
 * @returns {void}
 */
export function setSelection(id) {
  if (id === state.selectedId) return;
  if (!confirmIfDirty()) return;
  localStorage.setItem(STORAGE_KEY, id);
  patch({
    selectedId: id,
    selectedFile: null,
    selectedPage: null,
    gitStatus: null,
    view: 'content',
  });
  refreshFiles().catch(() => {});
  refreshPages().catch(() => {});
  refreshGitStatus().catch(() => {});
}

/**
 * Reloads the content file list for the selected project.
 * On error (e.g. missing content dir) patches an empty list silently.
 * @returns {Promise<void>}
 */
export async function refreshFiles() {
  const project = selectedProject();
  if (!project || !state.projects.find((p) => p.id === project.id)) return;
  try {
    const data = await api.listFiles(project.id);
    patch({ files: data.files.map((f) => f.name || f) });
  } catch (e) {
    // Missing content dir or checkout — represent as empty list; the
    // empty-state UI explains what to do.
    patch({ files: [] });
  }
}

/**
 * Reloads the pages list for the selected project.
 * On error (e.g. missing pages dir) patches an empty list silently.
 * @returns {Promise<void>}
 */
export async function refreshPages() {
  const project = selectedProject();
  if (!project || !state.projects.find((p) => p.id === project.id)) return;
  try {
    const data = await api.listPages(project.id);
    patch({ pages: data.files.map((f) => f.name || f) });
  } catch (e) {
    // Pages dir may not exist yet — represent as empty list.
    patch({ pages: [] });
  }
}

/**
 * Returns true if the page editor has unsaved changes.
 * @returns {boolean}
 */
export function isPageDirty() {
  return state.pageDirty;
}

/**
 * Sets the page editor dirty flag.
 * @param {boolean} v
 * @returns {void}
 */
export function setPageDirty(v) {
  state.pageDirty = v;
}

/**
 * Prompts the user if there are unsaved page changes.
 * @returns {boolean} True if safe to proceed, false if user cancelled.
 */
export function confirmIfDirty() {
  if (!state.pageDirty) return true;
  return confirm('You have unsaved changes. Discard them?');
}

/**
 * Selects a page for editing in the page-editor view.
 * If the editor is dirty, prompts the user before switching.
 * @param {string} name - Page name to open.
 * @returns {void}
 */
export function setPageSelection(name) {
  // Already open on this page in the page editor: no-op.
  if (name === state.selectedPage && state.view === 'page-editor') return;
  if (!confirmIfDirty()) return;
  patch({ selectedPage: name, view: 'page-editor', selectedFile: null, pageDirty: false });
}

/**
 * Reloads the git status for the selected project.
 * If no project is selected or the request fails, patches `gitStatus` to `null`.
 * @returns {Promise<void>}
 */
export async function refreshGitStatus() {
  const project = selectedProject();
  if (!project) {
    patch({ gitStatus: null });
    return;
  }
  try {
    patch({ gitStatus: await api.gitStatus(project.id) });
  } catch (e) {
    patch({ gitStatus: null });
  }
}
