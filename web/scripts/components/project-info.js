// Project info panel: repo/branch/content_dir + checkout facts + publish
// action + git status (spec §14 areas: project info, git status, publish).

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

export function renderProjectInfo(root) {
  const project = selectedProject();
  if (!project) return;
  if (state.view !== 'content') return;

  const box = el('div', { class: 'field-item info-panel' });
  const content = el('div', { class: 'field-content' });
  const head = el('div', { class: 'status-head' }, icon('folder_open', 16));

  head.append(el('span', { class: 'mono-label', text: project.id }));

  if (!project.checkout || !project.checkout.exists) {
    head.append(el('span', { class: 'badge warn', text: 'not cloned' }));
    content.append(head);
    box.append(content);
    root.append(box);
    return;
  }

  const c = project.checkout;
  if (c.remote_matches === true && c.branch_ready) {
    head.append(el('span', { class: 'badge ok', text: 'ready' }));
  } else {
    head.append(
      el('span', {
        class: 'badge warn',
        text: !c.remote_matches ? 'remote mismatch' : 'branch missing',
      }),
    );
  }

  content.append(head);
  content.append(
    el('div', { class: 'muted-note mono-note', text: `${project.repo} → ${project.branch} · ${project.content_dir}/` }),
  );

  // Git status sub-panel
  const statusSlot = el('div');
  renderStatusPanel(statusSlot);
  content.append(statusSlot);

  // Publish button
  const publishBtn = el('button', { class: 'btn-save' }, icon('cloud_upload', 14), 'Publish…');
  publishBtn.addEventListener('click', () => doPublish(publishBtn));
  content.append(publishBtn);

  box.append(content);
  root.append(box);
}

async function doPublish(btn) {
  const project = selectedProject();
  if (!project || !state.gitStatus) return;

  const s = state.gitStatus;
  if (s.clean && s.ahead === 0) {
    toast('Nothing to publish — working tree is clean');
    return;
  }

  const message = prompt(`Commit message for ${s.files.length} change(s):`, 'Update content');
  if (message === null) return;

  btn.disabled = true;
  btn.textContent = 'Publishing…';
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
    btn.append(icon('cloud_upload', 14), 'Publish…');
  }
}
