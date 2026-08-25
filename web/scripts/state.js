// Tiny pub/sub store. The selected project is UI state (spec §7):
// persisted in localStorage by stable id, never written to scm-config.json.

import { api } from './api.js';

const STORAGE_KEY = 'scm:selected-project-id';

export const state = {
  ready: false,
  projects: [],
  projectsDir: 'projects',
  mediaDir: './public/media/',
  selectedId: null,
  selectedFile: null,
  files: [],
  gitStatus: null,
  view: 'content', // 'content' | 'settings' | 'media'
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify() {
  for (const fn of listeners) fn(state);
}

export function patch(partial) {
  Object.assign(state, partial);
  notify();
}

export function selectedProject() {
  return state.projects.find((p) => p.id === state.selectedId) || null;
}

export async function refreshProjects() {
  const data = await api.listProjects();
  patch({ projects: data.projects, projectsDir: data.projects_dir, mediaDir: data.media_dir });
  applySelectionRules();
  return data;
}

/** Selection rules exactly per spec §7. */
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

export function setSelection(id) {
  localStorage.setItem(STORAGE_KEY, id);
  patch({
    selectedId: id,
    selectedFile: null,
    gitStatus: null,
    view: 'content',
  });
  refreshFiles().catch(() => {});
  refreshGitStatus().catch(() => {});
}

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
