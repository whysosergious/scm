// Thin fetch wrappers for the SCM JSON API.
// Server errors use the shape { error: { category, message, detail } };
// they are unwrapped into typed ApiError rejections.

export class ApiError extends Error {
  constructor(category, message, detail) {
    super(message);
    this.category = category;
    this.detail = detail;
  }
}

async function request(method, url, body, raw) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body,
    });
  } catch (e) {
    throw new ApiError('network', 'Could not reach the SCM server', String(e));
  }

  const text = await res.text();
  if (!res.ok) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.error) {
        throw new ApiError(parsed.error.category, parsed.error.message, parsed.error.detail);
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
    }
    if (!raw && text.startsWith('{')) {
      // Publish outcomes arrive with HTTP 200; anything non-JSON here is unexpected.
    }
    throw new ApiError('internal', `Request failed (${res.status})`, text.slice(0, 500));
  }

  return raw ? text : text ? JSON.parse(text) : null;
}

const json = (v) => JSON.stringify(v);

export const api = {
  getConfig: () => request('GET', '/api/config'),
  putConfig: (doc) => request('POST', '/api/config', json(doc)),

  listProjects: () => request('GET', '/api/projects'),
  importProject: (p) => request('POST', '/api/projects', json(p)),
  deleteProject: (id) => request('DELETE', `/api/projects/${encodeURIComponent(id)}`),
  checkout: (id) => request('POST', `/api/projects/${encodeURIComponent(id)}/checkout`),
  ensureContentDir: (id) =>
    request('POST', `/api/projects/${encodeURIComponent(id)}/ensure-content-dir`, '{}'),

  listFiles: (id) =>
    request('GET', `/api/projects/${encodeURIComponent(id)}/content`),
  loadFile: async (id, name) => ({
    name,
    text: await request('GET', `/api/projects/${encodeURIComponent(id)}/content/${encodeURIComponent(name)}`, undefined, true),
  }),
  saveFile: (id, name, text) =>
    request('PUT', `/api/projects/${encodeURIComponent(id)}/content/${encodeURIComponent(name)}`, text),
  createFile: (id, name, initial) =>
    request('POST', `/api/projects/${encodeURIComponent(id)}/content`, json({ name, initial })),

  gitStatus: (id) => request('GET', `/api/projects/${encodeURIComponent(id)}/git/status`),

  listMedia: (id) => request('GET', `/api/projects/${encodeURIComponent(id)}/media`),
  serveMediaUrl: (id, name) => `/api/projects/${encodeURIComponent(id)}/media/${encodeURIComponent(name)}`,
  deleteMedia: (id, name) => request('DELETE', `/api/projects/${encodeURIComponent(id)}/media/${encodeURIComponent(name)}`),
  renameMedia: (id, oldName, newName) =>
    request('POST', `/api/projects/${encodeURIComponent(id)}/media/${encodeURIComponent(oldName)}/rename`, JSON.stringify({ name: newName })),
  uploadMedia: async (id, file) => {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/media?filename=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    if (!res.ok) {
      let err = { message: `Upload failed (${res.status})` };
      try { const p = await res.json(); if (p?.error) err = p.error; } catch (_) {}
      throw new ApiError(err.category || 'filesystem', err.message || 'Upload failed', err.detail);
    }
    return res.json();
  },
  publish: (id, message) =>
    request(
      'POST',
      `/api/projects/${encodeURIComponent(id)}/publish`,
      json(message ? { message } : {}),
    ),

  // ================== PAGES ==================

  listPages: (id) =>
    request('GET', `/api/projects/${encodeURIComponent(id)}/pages`),
  loadPage: async (id, name) => ({
    name,
    text: await request('GET', `/api/projects/${encodeURIComponent(id)}/pages/${encodeURIComponent(name)}`, undefined, true),
  }),
  savePage: (id, name, text) =>
    request('PUT', `/api/projects/${encodeURIComponent(id)}/pages/${encodeURIComponent(name)}`, text),
  createPage: (id, name, initial) =>
    request('POST', `/api/projects/${encodeURIComponent(id)}/pages`, json({ name, initial })),
  deletePage: (id, name) =>
    request('DELETE', `/api/projects/${encodeURIComponent(id)}/pages/${encodeURIComponent(name)}`),
  generatePage: (id, name) =>
    request('POST', `/api/projects/${encodeURIComponent(id)}/pages/${encodeURIComponent(name)}/generate`),
  previewPageUrl: (id, name) =>
    `/api/projects/${encodeURIComponent(id)}/pages/${encodeURIComponent(name)}/preview`,
  importPage: (id, html) =>
    request('POST', `/api/projects/${encodeURIComponent(id)}/pages/import`, json({ html })),
};
