// Toast notifications; error toasts render the API error category (spec §15).

import { el, icon } from '../dom.js';

/**
 * Show a toast notification in the toast root element.
 * Auto-removes after 4 s for non-error toasts or 8 s for error toasts.
 *
 * @param {string} message - The primary text displayed in the toast.
 * @param {'ok'|'error'|string} [kind='ok'] - Visual style / severity of the toast.
 * @param {string|null} [detail=null] - Optional detail text shown below the message (truncated to 300 chars).
 * @returns {void}
 */
export function toast(message, kind = 'ok', detail = null) {
  const root = document.getElementById('toast-root');
  const box = el(
    'div',
    { class: `toast ${kind}` },
    el('div', { class: 'toast-message', text: message }),
    detail ? el('div', { class: 'toast-detail', text: String(detail).slice(0, 300) }) : null,
  );
  const close = el('button', {
    class: 'toast-close',
    onclick: () => box.remove(),
  }, icon('close', 14));
  box.append(close);
  root.append(box);
  setTimeout(() => box.remove(), kind === 'error' ? 8000 : 4000);
}

/**
 * Convenience wrapper that extracts message/detail/category from an error
 * object and displays it as an error toast.
 *
 * @param {Error & { detail?: string, category?: string }} err - The error to display.
 * @returns {void}
 */
export function toastError(err) {
  toast(err.message || 'Something went wrong', 'error', err.detail || err.category || '');
}
