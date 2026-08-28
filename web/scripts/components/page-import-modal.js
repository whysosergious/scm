// HTML import modal for the page editor (spec_page_editor.md §18).
// Allows pasting or uploading HTML to import as a page JSON document.

import { api, ApiError } from '../api.js';
import { el, icon } from '../dom.js';
import { selectedProject, setPageSelection } from '../state.js';
import { toast, toastError } from './toast.js';

/**
 * Open the HTML import modal dialog.
 * @param {function(): void} [onImported] - Callback after successful import.
 * @returns {void}
 */
export function openHtmlImportModal(onImported) {
  const root = document.getElementById('modal-root');
  root.textContent = '';

  const project = selectedProject();
  if (!project) { toast('No project selected', 'error'); return; }

  const errBox = el('div', { class: 'modal-error', style: { display: 'none' } });
  const warnBox = el('div', { class: 'modal-warnings', style: { display: 'none', maxHeight: '120px', overflow: 'auto', fontSize: '11px', padding: '8px', background: 'rgba(251,191,36,0.1)', borderRadius: '4px', marginTop: '8px' } });
  const submitBtn = el('button', { class: 'btn-save', type: 'submit' }, icon('upload', 16), ' Import');
  const fileInput = el('input', { type: 'file', accept: '.html,.htm', style: { display: 'none' } });
  let htmlContent = '';

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      htmlContent = reader.result;
      textarea.value = htmlContent;
      textarea.placeholder = '';
    };
    reader.readAsText(file);
  });

  const textarea = el('textarea', {
    class: 'value-input',
    rows: '12',
    placeholder: 'Paste HTML here, or choose a file...',
  });
  textarea.addEventListener('input', () => { htmlContent = textarea.value; });

  const chooseFileBtn = el('button', {
    class: 'btn-secondary',
    type: 'button',
    style: { marginBottom: '8px' },
  }, icon('folder_open', 16), ' Choose HTML file');
  chooseFileBtn.addEventListener('click', () => fileInput.click());

  const form = el(
    'form',
    {
      class: 'modal-form',
      onsubmit: async (e) => {
        e.preventDefault();
        const html = htmlContent.trim();
        if (!html) { toast('No HTML content', 'error'); return; }
        errBox.style.display = 'none';
        warnBox.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Importing…';
        try {
          const res = await api.importPage(project.id, html);
          if (res.warnings && res.warnings.length > 0) {
            warnBox.textContent = '';
            warnBox.append(el('strong', { text: 'Warnings:' }));
            for (const w of res.warnings) {
              warnBox.append(el('div', { text: w }));
            }
            warnBox.style.display = 'block';
          }
          if (res.saved_as) {
            toast(`Imported as ${res.saved_as}`);
            overlay.remove();
            await setPageSelection(res.saved_as);
            if (onImported) onImported();
          } else {
            toast('Import completed');
            overlay.remove();
          }
        } catch (err) {
          if (!(err instanceof ApiError)) console.error(err);
          errBox.textContent = '';
          errBox.append(
            el('strong', { text: err.message || 'Import failed' }),
            err.detail ? el('pre', { class: 'err-detail', text: String(err.detail).slice(0, 600) }) : null,
          );
          errBox.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = '';
          submitBtn.append(icon('upload', 16), ' Import');
        }
      },
    },
    el('h2', { text: 'Import HTML page' }),
    el('p', { class: 'muted-note', text: 'Paste HTML or upload a file. It will be converted to a page JSON document.' }),
    errBox,
    warnBox,
    fileInput,
    chooseFileBtn,
    textarea,
    el(
      'div',
      { class: 'action-bar' },
      el('button', { class: 'btn-secondary', type: 'button', onclick: () => overlay.remove() }, 'Cancel'),
      submitBtn,
    ),
  );

  const overlay = el(
    'div',
    { class: 'modal-overlay' },
    el('div', { class: 'modal' }, form),
  );
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  root.append(overlay);
  textarea.focus();
}
