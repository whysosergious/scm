// Project info panel: fixed bottom status bar with collapse/expand,
// checkout status, git status, and publish action.

import { api } from '../api.js';
import { el, icon } from '../dom.js';
import { refreshGitStatus, refreshProjects, selectedProject, state } from '../state.js';
import { renderStatusPanel } from './git-status.js';
import { toast, toastError } from './toast.js';

const OUTCOME_STYLE = {
  committed_and_pushed: ['ok', 'check_circle', 'Published'],
  no_changes: ['ok', 'info', 'Nothing to publish'],
  commit_failed: ['error', 'error', 'Commit failed'],
  push_failed: ['error', 'cloud_off', 'Push failed'],
  auth_failed: ['error', 'key_off', 'Authentication failed'],
  remote_rejected: ['warn', 'sync_problem', 'Remote rejected the push'],
  merge_conflict: ['error', 'call_merge', 'Merge conflict'],
  git_missing: ['error', 'terminal', 'Git executable not found'],
  invalid_repo: ['error', 'folder_off', 'Invalid repository'],
};

const COLLAPSE_KEY = 'scm:status-collapsed';

export function renderProjectInfo() {
  const bar = document.getElementById('status-bar');
  if (!bar) return;
  bar.textContent = '';

  const project = selectedProject();
  if (!project || state.view === 'settings') {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = '';

  const collapsed = localStorage.getItem(COLLAPSE_KEY) !== '0';
  bar.classList.toggle('collapsed', collapsed);

  // --- collapsed row: always present ---
  const row = el('div', { class: 'status-row' });
  const left = el('div', { class: 'status-left' });
  left.append(icon('folder_open', 14));
  left.append(el('span', { class: 'mono-label', text: project.id }));

  if (!project.checkout || !project.checkout.exists) {
    left.append(el('span', { class: 'badge warn', text: 'not cloned' }));
  } else {
    const c = project.checkout;
    if (c.remote_matches === true && c.branch_ready) {
      left.append(el('span', { class: 'badge ok', text: 'ready' }));
    } else {
      left.append(el('span', {
        class: 'badge warn',
        text: !c.remote_matches ? 'remote mismatch' : 'branch missing',
      }));
    }
    left.append(el('span', { class: 'muted-note', text: `${project.branch} \u00b7 ${project.content_dir}/` }));
  }

  const right = el('div', { class: 'status-right' });
  const publishBtn = el('button', { class: 'btn-sm btn-publish' }, icon('cloud_upload', 13), ' Publish');
  publishBtn.addEventListener('click', () => doPublish(publishBtn));
  right.append(publishBtn);

  const toggleBtn = el('button', {
    class: 'btn-icon status-toggle',
    title: collapsed ? 'Expand' : 'Collapse',
    onclick: () => {
      const next = localStorage.getItem(COLLAPSE_KEY) === '0' ? '1' : '0';
      localStorage.setItem(COLLAPSE_KEY, next);
      renderProjectInfo();
    },
  }, icon(collapsed ? 'expand_less' : 'expand_more', 18));
  right.append(toggleBtn);

  row.append(left, right);
  bar.append(row);

  // --- expanded details ---
  if (!collapsed) {
    const details = el('div', { class: 'status-details' });

    details.append(
      el('div', { class: 'muted-note mono-note', text: `${project.repo} \u2192 ${project.branch}` }),
    );

    // Git status sub-panel
    const statusSlot = el('div');
    renderStatusPanel(statusSlot);
    details.append(statusSlot);

    bar.append(details);
  }
}

async function doPublish(btn) {
  const project = selectedProject();
  if (!project || !state.gitStatus) return;

  const s = state.gitStatus;
  if (s.clean && s.ahead === 0) {
    toast('Nothing to publish \u2014 working tree is clean');
    return;
  }

  const message = prompt(`Commit message for ${s.files.length} change(s):`, 'Update content');
  if (message === null) return;

  btn.disabled = true;
  btn.textContent = 'Publishing\u2026';
  try {
    const result = await api.publish(project.id, message);
    const [kind, iconName, prefix] = OUTCOME_STYLE[result.outcome] || ['error', 'error', result.outcome];
    toast(`${prefix}: ${result.message}`, kind, result.detail);
    await Promise.all([refreshProjects().catch(() => {}), refreshGitStatus().catch(() => {})]);
  } catch (err) {
    toastError(err);
  } finally {
    btn.disabled = false;
    btn.textContent = '';
    btn.append(icon('cloud_upload', 13), ' Publish');
  }
}
