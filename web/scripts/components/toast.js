// Toast notifications; error toasts render the API error category (spec §15).

import { el, icon } from '../dom.js';

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

export function toastError(err) {
  toast(err.message || 'Something went wrong', 'error', err.detail || err.category || '');
}
