// Configuration editor v1 (spec §10): raw pretty JSON in a textarea,
// client-side Validate, whole-document Save. Unknown keys survive because
// the server round-trips them.

import { api, ApiError } from '../api.js';
import { el } from '../dom.js';
import { patch, refreshProjects, state } from '../state.js';
import { toast, toastError } from './toast.js';

export function renderConfigEditor(root) {
  root.textContent = '';

  const errBox = el('pre', { class: 'editor-error config-error', style: { display: 'none' } });
  const saveBtn = el('button', { class: 'btn-save', disabled: true }, 'Save configuration');
  const validateBtn = el('button', { class: 'btn-secondary' }, 'Validate');
  const textarea = el('textarea', { class: 'json-editor tall', spellcheck: 'false' });

  function showErr(err) {
    errBox.textContent = '';
    errBox.textContent = `${err.category ? `[${err.category}] ` : ''}${err.message}`;
    if (err.detail) errBox.textContent += `\n${err.detail}`;
    errBox.style.display = 'block';
  }

  textarea.addEventListener('input', () => {
    saveBtn.disabled = false;
    errBox.style.display = 'none';
  });

  validateBtn.addEventListener('click', () => {
    try {
      JSON.parse(textarea.value);
      toast('JSON syntax OK');
      errBox.style.display = 'none';
    } catch (e) {
      showErr({ category: 'invalid-json', message: e.message });
    }
  });

  saveBtn.addEventListener('click', async () => {
    let doc;
    try {
      doc = JSON.parse(textarea.value);
    } catch (e) {
      showErr({ category: 'invalid-json', message: e.message });
      return;
    }
    saveBtn.disabled = true;
    try {
      await api.putConfig(doc);
      toast('Configuration saved');
      await refreshProjects().catch(toastError);
      // Reload the editor with the canonical stored document.
      const cfg = await api.getConfig();
      textarea.value = JSON.stringify(cfg, null, 2) + '\n';
      saveBtn.disabled = true;
      patch({});
    } catch (err) {
      if (!(err instanceof ApiError)) console.error(err);
      showErr(err);
      saveBtn.disabled = false;
    }
  });

  root.append(
    el('div', { class: 'header-section' },
      el('h1', { text: 'Configuration' }),
      el('p', { text: 'scm-config.json — validated before it is written atomically.' })),
    textarea,
    errBox,
    el('div', { class: 'action-bar' }, validateBtn, saveBtn),
  );

  textarea.placeholder = 'Loading configuration…';
  api.getConfig()
    .then((cfg) => {
      textarea.value = JSON.stringify(cfg, null, 2) + '\n';
      textarea.placeholder = '';
    })
    .catch((err) => {
      textarea.placeholder = '';
      toastError(err);
    });
}
