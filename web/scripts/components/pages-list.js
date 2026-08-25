// Sidebar pages navigation (spec_page_editor.md §7): a collapsible "Pages"
// category listing the project's page JSON files. Mirrors content-list.js.

import { api } from '../api.js';
import { el, icon } from '../dom.js';
import { patch, refreshPages, selectedProject, setPageSelection, state } from '../state.js';
import { toast, toastError } from './toast.js';

/** Whether the "Pages" sidebar category is expanded. */
let categoryOpen = true;

/**
 * Render the full "Pages" sidebar category into the given container.
 * Builds a collapsible header, the page list, and a fly-out clone
 * for use when the sidebar is collapsed.
 *
 * @param {HTMLElement} container - The DOM element to render into.
 * @returns {void}
 */
export function renderPagesNav(container) {
  container.textContent = '';
  const project = selectedProject();

  const header = el(
    'button',
    {
      class: `nav-cat-header ${categoryOpen ? '' : 'closed'}`,
      title: 'Page files',
      onclick: () => {
        categoryOpen = !categoryOpen;
        renderPagesNav(container);
      },
    },
    icon('web', 18),
    el('span', { class: 'cat-label', text: 'Pages' }),
    icon('expand_more', 16),
  );

  const category = el('div', { class: 'nav-category' }, header);

  if (categoryOpen) {
    category.append(buildPageList(project, false));
  }

  // Fly-out for collapsed-sidebar hover
  category.append(el('div', { class: 'cat-flyout' }, buildPageList(project, true)));

  container.append(category);
}

/**
 * Build the list of page items for a given project.
 * Each item is an anchor that sets the selected page in state.
 * An "Add" button is appended at the bottom.
 *
 * @param {object|null} project - The currently selected project, or null if none.
 * @param {boolean} inFlyout - Whether this list is rendered inside the collapsed-sidebar fly-out.
 * @returns {HTMLElement} The constructed nav-file-list div.
 */
function buildPageList(project, inFlyout) {
  const list = el('div', { class: 'nav-file-list' });

  if (!project) {
    list.append(el('div', { class: 'nav-empty', text: 'No project selected' }));
    return list;
  }

  for (const name of state.pages) {
    const active = name === state.selectedPage && state.view === 'page-editor';
    const isIndex = name === 'index.json';
    list.append(
      el(
        'a',
        {
          class: `nav-item ${active ? 'active' : ''}`,
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            setPageSelection(name);
          },
        },
        icon(isIndex ? 'home' : 'description', 18),
        el('span', { text: name }),
      ),
    );
  }

  if (state.pages.length === 0) {
    list.append(el('div', { class: 'nav-empty', text: 'No pages yet' }));
  }

  const addBtn = el(
    'button',
    {
      class: 'nav-file-add',
      title: 'New page',
      ...(inFlyout ? {} : { id: 'add-page-btn' }),
      onclick: (e) => {
        e.preventDefault();
        triggerAddPage();
      },
    },
    icon('add', 16),
    el('span', { text: 'Add' }),
  );
  list.append(addBtn);

  return list;
}

/**
 * Add-page flow: prompt for a name, create via API, refresh the
 * sidebar list, and open the new page in the editor.
 *
 * @returns {Promise<void>}
 */
export async function triggerAddPage() {
  const project = selectedProject();
  if (!project) {
    toast('Import or select a project first', 'error');
    return;
  }
  const name = prompt('New page name:', 'about.json');
  if (!name) return;

  const trimmed = name.trim();
  const finalName = trimmed.endsWith('.json') ? trimmed : trimmed + '.json';

  try {
    await api.createPage(project.id, finalName);
    toast(`Created ${finalName}`);
    await refreshPages();
    setPageSelection(finalName);
  } catch (err) {
    toastError(err);
  }
}
