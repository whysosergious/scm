// Sidebar content-file list + "New JSON file" action (spec §8, §14).

import { api } from '../api.js';
import { el, icon } from '../dom.js';
import { patch, selectedProject, state } from '../state.js';
import { toast, toastError } from './toast.js';

export function renderContentNav(container) {
  container.textContent = '';

  if (!selectedProject()) {
    container.append(el('div', { class: 'nav-empty', text: 'No project selected' }));
    return;
  }

  for (const name of state.files) {
    const active = name === state.selectedFile && state.view === 'content';
    container.append(
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
    container.append(el('div', { class: 'nav-empty', text: 'No JSON files' }));
  }
}

export function wireAddFileButton(button) {
  button.addEventListener('click', async () => {
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
  });
}

export async function refreshFileList() {
  const { refreshFiles } = await import('../state.js');
  await refreshFiles().catch(() => {});
}
