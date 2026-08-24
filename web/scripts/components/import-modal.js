// Import-project modal (spec §14 empty state). Posts to /api/projects and
// clones immediately so the user sees real progress/result.

import { api, ApiError } from '../api.js';
import { el } from '../dom.js';
import { refreshProjects } from '../state.js';
import { toast, toastError } from './toast.js';

export function openImportModal({ dismissable = true } = {}) {
  const root = document.getElementById('modal-root');
  root.textContent = '';

  const errBox = el('div', { class: 'modal-error', style: { display: 'none' } });
  const submitBtn = el('button', { class: 'btn-save', type: 'submit' }, 'Import & clone');
  const fields = {};

  function showErr(err) {
    errBox.textContent = '';
    errBox.append(
      el('strong', { text: err.message || 'Import failed' }),
      err.detail ? el('pre', { class: 'err-detail', text: String(err.detail).slice(0, 600) }) : null,
    );
    errBox.style.display = 'block';
  }

  const form = el(
    'form',
    {
      class: 'modal-form',
      onsubmit: async (e) => {
        e.preventDefault();
        errBox.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Cloning…';
        try {
          const created = await api.importProject({
            id: fields.id.value.trim() || undefined,
            name: fields.name.value.trim() || undefined,
            repo: fields.repo.value.trim(),
            branch: fields.branch.value.trim(),
            content_dir: fields.content_dir.value.trim() || 'content',
            clone_now: true,
          });
          overlay.remove();
          toast(`Imported “${created.project.name}”`);
          await refreshProjects();
          // Select the freshly imported project.
          const { setSelection } = await import('../state.js');
          setSelection(created.project.id);
        } catch (err) {
          if (!(err instanceof ApiError)) console.error(err);
          showErr(err);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Import & clone';
        }
      },
    },
    el('h2', { text: 'Import project' }),
    el('p', { text: 'Add a target website repository and clone it locally.' }),
    errBox,
    field('Repository URL', 'repo', 'https://github.com/you/site.git or git@…', true),
    row(
      field('Branch', 'branch', 'main', true, 'main'),
      field('Content directory', 'content_dir', 'content', true, 'content'),
    ),
    row(
      field('Project id (optional)', 'id', 'my-site'),
      field('Display name (optional)', 'name', 'My Site'),
    ),
    el(
      'div',
      { class: 'action-bar' },
      dismissable
        ? el('button', { class: 'btn-secondary', type: 'button', onclick: () => overlay.remove() }, 'Cancel')
        : null,
      submitBtn,
    ),
  );

  function field(labelText, key, placeholder, required, value = '') {
    const input = el('input', {
      type: 'text',
      id: `imp-${key}`,
      placeholder,
      value,
      autocomplete: 'off',
    });
    if (required) input.required = true;
    fields[key] = input;
    return el('div', {}, el('label', { for: `imp-${key}`, text: labelText }), input);
  }

  function row(...cells) {
    return el('div', { class: 'field-row' }, ...cells);
  }

  const overlay = el(
    'div',
    { class: 'modal-overlay' },
    el('div', { class: 'modal' }, form),
  );
  if (dismissable) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }
  root.append(overlay);
  fields.repo.focus();
}
