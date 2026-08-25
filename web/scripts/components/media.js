// Media manager view (spec.md §18): list/upload/rename/delete media files from the
// project's media folder, with four view modes and a lightbox viewer.

import { api, ApiError } from '../api.js';
import { el, icon } from '../dom.js';
import { selectedProject } from '../state.js';
import { toast, toastError } from './toast.js';

/** @type {string} localStorage key for the current media view mode. */
const VIEW_KEY = 'scm:media-view';

/** @type {Array<[string, string, string]>} Available view modes as [mode-id, material-icon-name, tooltip]. */
const MODES = [
  ['grid-sm', 'calendar_view_month', 'Small grid'],
  ['grid-lg', 'grid_view', 'Large grid'],
  ['list-md', 'view_list', 'List (medium previews)'],
  ['list-sm', 'view_agenda', 'List (small previews)'],
];

/** @type {string} Active media view mode identifier. */
let viewMode = localStorage.getItem(VIEW_KEY) || 'grid-sm';

/**
 * Persist the selected media view mode.
 * @param {string} mode - One of the MODES identifiers.
 * @returns {void}
 */
function setViewMode(mode) {
  viewMode = mode;
  localStorage.setItem(VIEW_KEY, mode);
}

/**
 * Format a byte count into a human-readable string.
 * @param {number} bytes - File size in bytes.
 * @returns {string} Human-readable size (e.g. "1.2 MB").
 */
function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Render the full media management view into the given container.
 * @param {HTMLElement} root - Container element to render into (will be cleared).
 * @returns {void}
 */
export function renderMedia(root) {
  root.textContent = '';
  const project = selectedProject();

  if (!project) {
    root.append(
      el('div', { class: 'empty-state' },
        el('h1', { text: 'Media' }),
        el('p', { text: 'Import or select a project first.' })),
    );
    return;
  }

  const mediaDirLabel = project.media_dir || 'media';
  const wrap = el('div', { class: 'media-view' });

  wrap.append(
    el('div', { class: 'header-section' },
      el('h1', { text: 'Media' }),
      el('p', { text: `${project.name} \u00b7 ${mediaDirLabel}` })),
  );

  const toolbar = el('div', { class: 'media-toolbar' });
  const uploadBtn = el('button', { class: 'btn-primary' }, icon('upload', 15), ' Upload');
  toolbar.append(uploadBtn);

  const modeSwitch = el('div', { class: 'media-mode-switch' });
  for (const [mode, ic, title] of MODES) {
    modeSwitch.append(
      el('button', {
        class: `media-mode-btn ${mode === viewMode ? 'active' : ''}`,
        title,
        onclick: () => {
          setViewMode(mode);
          renderMedia(root);
        },
      }, icon(ic, 17)),
    );
  }
  toolbar.append(modeSwitch);
  wrap.append(toolbar);

  const container = el('div', {
    class: 'media-container',
    'data-mode': viewMode,
  });
  const loadingEl = el('div', { class: 'media-loading muted-note', text: 'Loading\u2026' });
  wrap.append(loadingEl, container);
  root.append(wrap);

  // ---- upload ----
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.accept = 'image/*';
  fileInput.addEventListener('change', async () => {
    const files = [...(fileInput.files || [])];
    if (!files.length) return;
    for (const file of files) {
      try {
        const res = await api.uploadMedia(project.id, file);
        toast(`Uploaded ${res.file}`);
      } catch (err) {
        toastError(err);
      }
    }
    renderMedia(root);
  });
  uploadBtn.addEventListener('click', () => fileInput.click());

  // ---- list ----
  api.listMedia(project.id)
    .then((data) => {
      loadingEl.remove();
      const files = data.files || [];
      container.textContent = '';

      if (!files.length) {
        const uploadBtn2 = el('button', { class: 'btn-primary' }, icon('upload', 15), ' Upload');
        uploadBtn2.addEventListener('click', () => fileInput.click());
        container.append(
          el('div', { class: 'empty-state media-empty' },
            el('p', { text: 'No media files yet.' }),
            uploadBtn2),
        );
        return;
      }

      files.forEach((file, index) => {
        container.append(mediaItem(project, file, files, index, root));
      });
    })
    .catch((err) => {
      loadingEl.remove();
      container.textContent = '';
      container.append(
        el('div', { class: 'empty-state media-empty' },
          el('p', { text: err.message || 'Could not load media.' })),
      );
    });
}

/**
 * Build a single media-item DOM node with thumbnail, metadata, and action buttons.
 * @param {Object} project - The currently selected project.
 * @param {Object} file - A media file descriptor from the API.
 * @param {Array<Object>} files - The full list of media files.
 * @param {number} index - Index of this file in the files array.
 * @param {HTMLElement} root - Root container for re-renders after mutations.
 * @returns {HTMLElement} The constructed media-item element.
 */
function mediaItem(project, file, files, index, root) {
  const serveUrl = api.serveMediaUrl(project.id, file.name);

  const item = el('div', { class: 'media-item' });

  const thumb = el('button', {
    class: 'media-thumb',
    title: `Open ${file.name}`,
    onclick: () => openViewer(project, files, index, root),
  }, el('img', { src: serveUrl, alt: file.name, loading: 'lazy' }));
  item.append(thumb);

  const meta = el('div', { class: 'media-meta' },
    el('span', { class: 'media-name', title: file.name, text: file.name }),
    el('span', { class: 'media-size muted-note', text: fmtSize(file.size) }),
  );
  item.append(meta);

  const actions = el('div', { class: 'media-actions' });
  actions.append(
    actionBtn('content_copy', 'Copy link', async () => {
      try {
        await navigator.clipboard.writeText(file.url);
        toast(`Copied ${file.url}`);
      } catch (e) {
        toast(`Link: ${file.url}`);
      }
    }),
    actionBtn('edit', 'Rename', () => renameFlow(project, file, root)),
    actionBtn('delete', 'Delete', async () => {
      if (!confirm(`Delete ${file.name}?`)) return;
      try {
        await api.deleteMedia(project.id, file.name);
        toast(`Deleted ${file.name}`);
        renderMedia(root);
      } catch (err) {
        toastError(err);
      }
    }),
  );
  item.append(actions);

  return item;
}

/**
 * Create an icon button for a media action (copy/rename/delete).
 * @param {string} iconName - Material icon name.
 * @param {string} title - Tooltip text for the button.
 * @param {function(): void} onclick - Click handler.
 * @returns {HTMLElement} The button element.
 */
function actionBtn(iconName, title, onclick) {
  return el('button', { class: 'btn-icon media-act', title, onclick }, icon(iconName, 16));
}

/**
 * Prompt for a new filename and perform the rename via the API.
 * @param {Object} project - The currently selected project.
 * @param {Object} file - The media file descriptor to rename.
 * @param {HTMLElement} root - Root container for re-renders.
 * @returns {Promise<void>}
 */
async function renameFlow(project, file, root) {
  const newName = prompt(`Rename ${file.name} to:`, file.name);
  if (newName === null || newName === file.name) return;
  try {
    await api.renameMedia(project.id, file.name, newName.trim());
    toast(`Renamed to ${newName.trim()}`);
    renderMedia(root);
  } catch (err) {
    toastError(err); // 409 "already exists" surfaces here
  }
}

// ------------------------------------------------------------- lightbox

/**
 * Open the lightbox viewer for a media file.
 * @param {Object} project - The currently selected project.
 * @param {Array<Object>} files - The full list of media files.
 * @param {number} index - Index of the file to display initially.
 * @param {HTMLElement} root - Root container for re-renders on delete.
 * @returns {void}
 */
function openViewer(project, files, index, root) {
  let current = index;
  let dirty = false;

  const backdrop = el('div', { class: 'lightbox' });
  const img = el('img', { src: api.serveMediaUrl(project.id, files[current].name), alt: files[current].name });
  const label = el('span', { class: 'lightbox-name mono-note', text: files[current].name });

  function show(i) {
    current = (i + files.length) % files.length;
    img.src = api.serveMediaUrl(project.id, files[current].name);
    img.alt = files[current].name;
    label.textContent = files[current].name;
  }

  const prevBtn = el('button', { class: 'lightbox-nav prev', title: 'Previous' }, icon('chevron_left', 30));
  const nextBtn = el('button', { class: 'lightbox-nav next', title: 'Next' }, icon('chevron_right', 30));
  const closeBtn = el('button', { class: 'lightbox-close', title: 'Close (Esc)' }, icon('close', 24));

  function close() {
    document.removeEventListener('keydown', onKey, true);
    backdrop.remove();
    if (dirty) renderMedia(root);
  }
  function onKey(e) {
    if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
    else if (e.key === 'Escape') close();
  }

  prevBtn.addEventListener('click', () => show(current - 1));
  nextBtn.addEventListener('click', () => show(current + 1));
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);

  // swipe: left/right navigate, up/down close
  let touch = null;
  backdrop.addEventListener('touchstart', (e) => {
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  backdrop.addEventListener('touchend', (e) => {
    if (!touch) return;
    const dx = e.changedTouches[0].clientX - touch.x;
    const dy = e.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
    else if (Math.abs(dy) > 50) close();
  }, { passive: true });

  // bottom action bar: rename / copy link / delete
  const bar = el('div', { class: 'lightbox-bar' },
    label,
    el('div', { class: 'lightbox-actions' },
      actionBtn('content_copy', 'Copy link', async () => {
        try {
          await navigator.clipboard.writeText(files[current].url);
          toast(`Copied ${files[current].url}`);
        } catch (e) {
          toast(`Link: ${files[current].url}`);
        }
      }),
      actionBtn('edit', 'Rename', () => {
        const newName = prompt(`Rename ${files[current].name} to:`, files[current].name);
        if (newName === null || newName === files[current].name) return;
        api.renameMedia(project.id, files[current].name, newName.trim())
          .then(() => {
            dirty = true;
            files[current].name = newName.trim();
            files[current].url = api.serveMediaUrl(project.id, newName.trim());
            show(current);
            toast(`Renamed to ${newName.trim()}`);
          })
          .catch(toastError);
      }),
      actionBtn('delete', 'Delete', async () => {
        if (!confirm(`Delete ${files[current].name}?`)) return;
        try {
          await api.deleteMedia(project.id, files[current].name);
          dirty = true;
          files.splice(current, 1);
          if (!files.length) { close(); return; }
          if (current >= files.length) current = files.length - 1;
          show(current);
          toast('Deleted');
        } catch (err) {
          toastError(err);
        }
      }),
    ),
  );

  backdrop.append(img, prevBtn, nextBtn, closeBtn, bar);
  document.body.append(backdrop);
}
