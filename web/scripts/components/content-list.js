// Sidebar content navigation (spec §8, §14): a collapsible "Content"
// category listing the project's JSON files with an add button at the
// bottom. When the whole sidebar is collapsed, hovering the category icon
// shows the same list as a fly-out to the side.

import { api } from '../api.js';
import { el, icon } from '../dom.js';
import { patch, selectedProject, state } from '../state.js';
import { toast, toastError } from './toast.js';

/** @type {boolean} Whether the Content category is expanded in the sidebar. */
let categoryOpen = true;

/**
 * Render the collapsible Content navigation category into the given container.
 * Includes a header toggle, the file list, and a fly-out for collapsed sidebar mode.
 * @param {HTMLElement} container - The sidebar element to render into.
 */
export function renderContentNav(container) {
  container.textContent = '';
  const project = selectedProject();

  const header = el(
    'button',
    {
      class: `nav-cat-header ${categoryOpen ? '' : 'closed'}`,
      title: 'Content files',
      onclick: () => {
        categoryOpen = !categoryOpen;
        renderContentNav(container);
      },
    },
    icon('folder_open', 18),
    el('span', { class: 'cat-label', text: 'Content' }),
    icon('expand_more', 16),
  );

  const category = el('div', { class: 'nav-category' }, header);

  if (categoryOpen) {
    category.append(buildFileList(project, false));
  }

  // Fly-out for collapsed-sidebar hover (shown via CSS in collapsed mode).
  category.append(el('div', { class: 'cat-flyout' }, buildFileList(project, true)));

  container.append(category);
}

/**
 * Build the list of content files for a project, with an "Add" button at the bottom.
 * @param {Object|null} project - The currently selected project, or null if none.
 * @param {boolean} inFlyout - Whether this list is rendered inside a collapsed-sidebar fly-out.
 * @returns {HTMLElement} A div containing the file list items.
 */
function buildFileList(project, inFlyout) {
  const list = el('div', { class: 'nav-file-list' });

  if (!project) {
    list.append(el('div', { class: 'nav-empty', text: 'No project selected' }));
    return list;
  }

  for (const name of state.files) {
    const active = name === state.selectedFile && state.view === 'content';
    list.append(
      el(
        'a',
        {
          class: `nav-item ${active ? 'active' : ''}`,
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            patch({ selectedFile: name, view: 'content' });
          },
        },
        icon('description', 18),
        el('span', { text: name }),
      ),
    );
  }

  if (state.files.length === 0) {
    list.append(el('div', { class: 'nav-empty', text: 'No JSON files' }));
  }

  const addBtn = el(
    'button',
    {
      class: 'nav-file-add',
      title: 'New JSON file',
      ...(inFlyout ? {} : { id: 'add-file-btn' }),
      onclick: (e) => {
        e.preventDefault();
        triggerAddFile();
      },
    },
    icon('add', 16),
    el('span', { text: 'Add' }),
  );
  list.append(addBtn);

  return list;
}

/**
 * Add-file flow: prompt for a name, create via API, offer content-dir creation if missing.
 * @returns {Promise<void>}
 */
export async function triggerAddFile() {
  const project = selectedProject();
  if (!project) {
    toast('Import or select a project first', 'error');
    return;
  }
  const name = prompt('New content file name:', 'new-content.json');
  if (!name) return;
  try {
    await api.createFile(project.id, name.trim());
    toast(`Created ${name.trim()}`);
    await refreshFileList();
    patch({ selectedFile: name.trim(), view: 'content' });
  } catch (err) {
    if (err.category === 'not-found') {
      // Content dir missing — offer to create it, then retry (spec §8).
      if (confirm(`The directory "${project.content_dir}" does not exist in this checkout.\nCreate it now?`)) {
        try {
          await api.ensureContentDir(project.id);
          await api.createFile(project.id, name.trim());
          toast(`Created ${project.content_dir}/${name.trim()}`);
          await refreshFileList();
          patch({ selectedFile: name.trim(), view: 'content' });
        } catch (err2) {
          toastError(err2);
        }
      }
    } else {
      toastError(err);
    }
  }
}

/**
 * Reload the file list from the server (silent, errors swallowed).
 * @returns {Promise<void>}
 */
export async function refreshFileList() {
  const { refreshFiles } = await import('../state.js');
  await refreshFiles().catch(() => {});
}
