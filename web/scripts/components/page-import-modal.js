// HTML/JSON import modal for the page editor.
// Three tabs: Paste, File, From URL.
// Paste/file accept HTML or JSON (JSON structure is validated).
// Paste tab uses the CodeMirror 6 <code-editor> custom element.
// Calls page-html-import.js to parse, shows preview/stats/warnings,
// returns the resulting PageDocument to the caller.

import { el } from '../dom.js';
import { importAuto, importFileAuto, importHtmlUrl } from '../page-html-import.js';

/**
 * Open the HTML/JSON import modal.
 * @param {Object} [opts]
 * @param {string} [opts.projectId] - Current project id (used to resolve relative
 *   asset hrefs against the project checkout via /files/{id}/).
 * @param {Function} [opts.onImport] - Callback receiving { doc, report } on successful import.
 * @returns {void}
 */
export function openPageImportModal({ projectId, onImport } = {}) {
  const root = document.getElementById('modal-root');
  root.textContent = '';

  // Base URL for resolving relative/root-relative asset hrefs against the
  // project checkout (served by GET /files/{id}/...). Empty for arbitrary HTML.
  const projectBase = projectId ? `/files/${projectId}` : '';

  let activeTab = 'paste';
  let parseResult = null;
  let parseTimer = null;
  let isParsing = false;
  let pasteEditor = null; // <code-editor> instance or textarea fallback

  // ---- Elements ----

  const errBox = el('div', { class: 'modal-error', style: { display: 'none' } });
  const importBtn = el('button', { class: 'btn-save', type: 'button', disabled: true }, 'Import');
  const titleInput = el('input', {
    type: 'text',
    id: 'imp-html-title',
    placeholder: 'Page title (auto-detected)',
    autocomplete: 'off',
  });

  // Per-tab instruction text
  const instructionEl = el('p', { class: 'modal-instruction' });

  // Tab buttons (names: paste, file, url)
  const tabs = {
    paste: el('button', { class: 'panel-tab active', 'data-tab': 'paste' }, 'Paste'),
    file: el('button', { class: 'panel-tab', 'data-tab': 'file' }, 'File'),
    url: el('button', { class: 'panel-tab', 'data-tab': 'url' }, 'URL'),
  };

  // ---- Paste tab: CodeMirror 6 editor ----

  const pastePlaceholder = el('div', {
    class: 'code-editor-placeholder',
    text: 'Loading editor…',
    style: { padding: '1rem', color: 'var(--color-on-surface-variant)' },
  });

  async function loadPasteEditor() {
    try {
      await import('../vendor/code-editor.bundle.js');
      const editor = document.createElement('code-editor');
      editor.setAttribute('language', 'html');
      editor.style.height = '350px';
      editor.addEventListener('input', runParse);
      pastePlaceholder.replaceWith(editor);
      pasteEditor = editor;
    } catch (e) {
      // Fallback: plain textarea
      const ta = el('textarea', {
        class: 'import-textarea',
        placeholder: 'Paste HTML or JSON here…',
        spellcheck: 'false',
        style: 'width:100%;min-height:300px;font-family:var(--font-mono);font-size:12px;resize:vertical',
      });
      ta.addEventListener('input', runParse);
      pastePlaceholder.replaceWith(ta);
      pasteEditor = ta;
    }
  }

  // ---- File tab: drop zone ----

  const fileInput = el('input', {
    type: 'file',
    accept: '.html,.htm,.json',
    style: { display: 'none' }, // hide the unstyled native button
  });
  const fileZoneText = el('p', { text: 'Drop a file here or click to browse' });
  const fileLabel = el('div', { class: 'file-drop-zone' }, fileZoneText);
  fileLabel.style.cssText = 'border:2px dashed var(--color-outline);border-radius:8px;padding:2.5rem;text-align:center;cursor:pointer';

  function openFileDialog() {
    fileInput.click();
  }
  fileLabel.addEventListener('click', openFileDialog);

  // ---- URL tab ----

  const urlInput = el('input', {
    type: 'url',
    placeholder: 'https://example.com/page.html',
    autocomplete: 'off',
    style: 'width:100%',
  });
  const fetchBtn = el('button', { class: 'btn-secondary', type: 'button' }, 'Fetch');
  const urlArea = el('div', {},
    el('label', { text: 'URL' }),
    urlInput,
    el('div', { style: { marginTop: '0.5rem' } }, fetchBtn),
  );

  // ---- Preview + loading ----

  const previewBox = el('div', { class: 'import-preview', style: { display: 'none' } });
  previewBox.style.cssText = 'background:var(--color-surface-variant);border-radius:6px;padding:0.75rem;margin-top:0.75rem;font-size:12px;max-height:150px;overflow-y:auto';

  const loadingEl = el('div', { class: 'muted-note', text: 'Parsing…', style: { display: 'none' } });

  // ---- Tab content containers ----

  const tabContents = { paste: pastePlaceholder, file: fileLabel, url: urlArea };

  const INSTRUCTIONS = {
    paste: 'Paste html or json',
    file: 'Upload an html or json',
    url: 'Fetch an HTML page',
  };

  const tabContentWrap = el('div', { class: 'tab-content-wrap' }, pastePlaceholder);

  function switchTab(id) {
    activeTab = id;
    for (const [tid, btn] of Object.entries(tabs)) {
      btn.classList.toggle('active', tid === id);
    }
    tabContentWrap.textContent = '';
    tabContentWrap.append(tabContents[id]);
    instructionEl.textContent = INSTRUCTIONS[id];
  }

  for (const [id, btn] of Object.entries(tabs)) {
    btn.addEventListener('click', () => switchTab(id));
  }

  // ---- Parsing ----

  function getPasteText() {
    if (pasteEditor && pasteEditor.value !== undefined) return pasteEditor.value;
    return '';
  }

  async function runParse() {
    if (parseTimer) clearTimeout(parseTimer);
    parseTimer = setTimeout(doParse, 300);
  }

  async function doParse() {
    isParsing = true;
    loadingEl.style.display = 'block';
    previewBox.style.display = 'none';
    errBox.style.display = 'none';
    importBtn.disabled = true;

    try {
      let result;
      if (activeTab === 'paste') {
        const text = getPasteText().trim();
        if (!text) { parseResult = null; loadingEl.style.display = 'none'; return; }
        result = await importAuto(text, { baseUrl: projectBase });
      } else if (activeTab === 'file') {
        const file = fileInput.files?.[0];
        if (!file) { parseResult = null; loadingEl.style.display = 'none'; return; }
        result = await importFileAuto(file, { baseUrl: projectBase });
      } else {
        // URL tab — handled by fetch button
        loadingEl.style.display = 'none';
        return;
      }

      parseResult = result;
      showPreview(result);
      if (!titleInput.value.trim() && result.doc.title) {
        titleInput.value = result.doc.title;
      }
      importBtn.disabled = false;
    } catch (err) {
      parseResult = null;
      errBox.textContent = '';
      errBox.append(el('strong', { text: 'Parse error' }), el('p', { text: String(err.message || err) }));
      errBox.style.display = 'block';
      importBtn.disabled = true;
    } finally {
      isParsing = false;
      loadingEl.style.display = 'none';
    }
  }

  function showPreview({ doc, report }) {
    const stats = report.stats;
    const lines = [];
    lines.push(`${stats.total} elements: ${stats.boxes} boxes, ${stats.texts} texts, ${stats.images} images`);
    if (report.warnings.length > 0) {
      lines.push(`${report.warnings.length} warnings:`);
      for (const w of report.warnings.slice(0, 10)) {
        lines.push(`  ${w}`);
      }
      if (report.warnings.length > 10) {
        lines.push(`  … and ${report.warnings.length - 10} more`);
      }
    }
    previewBox.textContent = '';
    previewBox.append(el('pre', { text: lines.join('\n'), style: { margin: '0', whiteSpace: 'pre-wrap' } }));
    previewBox.style.display = 'block';
  }

  // ---- Event wiring ----

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) {
      fileZoneText.textContent = file.name;
      runParse();
    }
  });

  // Drag-and-drop on file zone
  fileLabel.addEventListener('dragover', (e) => { e.preventDefault(); fileLabel.style.borderColor = 'var(--color-primary)'; });
  fileLabel.addEventListener('dragleave', () => { fileLabel.style.borderColor = ''; });
  fileLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    fileLabel.style.borderColor = '';
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileZoneText.textContent = file.name;
      runParse();
    }
  });

  fetchBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return;
    fetchBtn.disabled = true;
    fetchBtn.textContent = 'Fetching…';
    loadingEl.style.display = 'block';
    errBox.style.display = 'none';
    try {
      const result = await importHtmlUrl(url);
      parseResult = result;
      showPreview(result);
      if (!titleInput.value.trim() && result.doc.title) {
        titleInput.value = result.doc.title;
      }
      importBtn.disabled = false;
    } catch (err) {
      errBox.textContent = '';
      errBox.append(el('strong', { text: 'Fetch failed' }), el('p', { text: String(err.message || err) }));
      errBox.style.display = 'block';
      importBtn.disabled = true;
    } finally {
      fetchBtn.disabled = false;
      fetchBtn.textContent = 'Fetch';
      loadingEl.style.display = 'none';
    }
  });

  // ---- Import button ----

  importBtn.addEventListener('click', () => {
    if (!parseResult) return;
    const customTitle = titleInput.value.trim();
    if (customTitle) parseResult.doc.title = customTitle;
    overlay.remove();
    if (onImport) onImport(parseResult);
  });

  // ---- Form layout ----

  const form = el(
    'div',
    { class: 'modal-form' },
    el('h2', { text: 'Import HTML / JSON' }),
    instructionEl,
    errBox,
    el('div', { class: 'panel-tab-bar', style: { marginBottom: '0.5rem' } },
      tabs.paste, tabs.file, tabs.url,
    ),
    tabContentWrap,
    loadingEl,
    el('div', { style: { marginTop: '0.75rem' } },
      el('label', { for: 'imp-html-title', text: 'Page title' }),
      titleInput,
    ),
    previewBox,
    el('div', { class: 'action-bar', style: { marginTop: '0.75rem' } },
      el('button', { class: 'btn-secondary', type: 'button', onclick: () => overlay.remove() }, 'Cancel'),
      importBtn,
    ),
  );

  const overlay = el('div', { class: 'modal-overlay' }, el('div', { class: 'modal' }, form));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  root.append(overlay);

  // Initialize
  switchTab('paste');
  loadPasteEditor();
}
