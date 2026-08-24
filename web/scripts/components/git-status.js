// Git status area (spec §11, §14): branch, ahead/behind and changed files.

import { el, icon } from '../dom.js';
import { selectedProject, state } from '../state.js';
import { refreshGitStatus } from '../state.js';

export function renderHeaderStatus(container) {
  let dot = container.querySelector('.status-dot');
  let summary = container.querySelector('.header-summary');
  if (!dot || !summary) {
    container.textContent = '';
    dot = el('span', { class: 'status-dot' });
    summary = el('span', { class: 'header-summary' });
    container.append(dot, summary);
  }

  const project = selectedProject();
  dot.className = 'status-dot';

  if (!project) {
    summary.textContent = 'no project';
    return;
  }

  const s = state.gitStatus;
  if (!project.checkout || !project.checkout.exists) {
    dot.className += ' muted';
    summary.textContent = 'not cloned';
    return;
  } else if (!s) {
    summary.textContent = 'loading…';
    return;
  } else if (s.clean && s.ahead === 0 && s.behind === 0) {
    summary.textContent = `up to date · ${s.branch}`;
  } else {
    dot.className += ' dirty';
    const bits = [];
    if (!s.clean) bits.push(`${s.files.length} change${s.files.length === 1 ? '' : 's'}`);
    if (s.ahead) bits.push(`↑${s.ahead}`);
    if (s.behind) bits.push(`↓${s.behind}`);
    summary.textContent = `${s.branch}: ${bits.join(', ')}`;
  }
}

export function renderStatusPanel(container) {
  container.textContent = '';
  const project = selectedProject();
  if (!project || !project.checkout || !project.checkout.exists) {
    return;
  }
  if (!state.gitStatus) return;

  const s = state.gitStatus;
  const panel = el('div', { class: 'field-item status-panel' });

  panel.append(
    el(
      'div',
      { class: 'field-content' },
      el(
        'div',
        { class: 'status-head' },
        icon('sync', 16),
        el('span', { class: 'mono-label', text: `branch ${s.branch}` }),
        s.upstream ? el('span', { class: 'muted-note', text: `→ ${s.upstream}` }) : null,
        el('button', {
          class: 'btn-icon',
          title: 'Refresh status',
          onclick: () => refreshGitStatus().catch(() => {}),
        }, icon('refresh', 16)),
      ),
      s.files.length
        ? el(
            'div',
            { class: 'status-files' },
            ...s.files.map((f) =>
              el('div', { class: 'chip' }, el('code', { text: `${f.x}${f.y} ${f.path}` })),
            ),
          )
        : el('p', { class: 'muted-note', text: 'Working tree clean.' }),
    ),
  );

  container.append(panel);
}
