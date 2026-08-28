// Thin fetch wrappers for the SCM JSON API.
// Server errors use the shape { error: { category, message, detail } };
// they are unwrapped into typed ApiError rejections.

/**
 * Typed error thrown by API wrapper functions.
 * Mirrors the server error shape `{ error: { category, message, detail } }`.
 */
export class ApiError extends Error {
  /**
   * @param {string} category - Error category (e.g. `"network"`, `"internal"`, `"filesystem"`).
   * @param {string} message - Human-readable error description.
   * @param {string} [detail] - Additional diagnostic detail (may be truncated).
   */
  constructor(category, message, detail) {
    super(message);
    this.category = category;
    this.detail = detail;
  }
}

/**
 * Internal helper: sends an HTTP request and parses the JSON response.
 * Throws an `ApiError` on non-2xx responses or network failures.
 * @param {string} method - HTTP method (`GET`, `POST`, `PUT`, `DELETE`).
 * @param {string} url - The request URL.
 * @param {*} [body] - Request body; if defined, `Content-Type: application/json` is set.
 * @param {boolean} [raw=false] - If `true`, returns the raw response text instead of parsed JSON.
 * @returns {Promise<*>} Parsed JSON body, raw text, or `null` for empty responses.
 * @throws {ApiError} On network failure or non-OK status.
 */
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

/** @param {*} v - Value to serialize. @returns {string} JSON string. */
const json = (v) => JSON.stringify(v);

/**
 * Thin fetch wrappers for every SCM JSON API endpoint.
 *
 * Methods return a `Promise` that resolves to the parsed JSON response
 * (or `null`/`string` for endpoints that return no/raw body).
 * All errors are wrapped in {@link ApiError}.
 *
 * @type {{
 *   getConfig: () => Promise<Object>,
 *   putConfig: (doc: Object) => Promise<Object>,
 *   listProjects: () => Promise<Object>,
 *   importProject: (p: Object) => Promise<Object>,
 *   deleteProject: (id: string) => Promise<Object>,
 *   checkout: (id: string) => Promise<Object>,
 *   ensureContentDir: (id: string) => Promise<Object>,
 *   listFiles: (id: string) => Promise<Object>,
 *   loadFile: (id: string, name: string) => Promise<{name: string, text: string}>,
 *   saveFile: (id: string, name: string, text: string) => Promise<Object>,
 *   createFile: (id: string, name: string, initial: string) => Promise<Object>,
 *   gitStatus: (id: string) => Promise<Object>,
 *   listMedia: (id: string) => Promise<Object>,
 *   serveMediaUrl: (id: string, name: string) => string,
 *   deleteMedia: (id: string, name: string) => Promise<Object>,
 *   renameMedia: (id: string, oldName: string, newName: string) => Promise<Object>,
 *   uploadMedia: (id: string, file: File) => Promise<Object>,
 *   publish: (id: string, message?: string) => Promise<Object>,
 *   listPages: (id: string) => Promise<Object>,
 *   loadPage: (id: string, name: string) => Promise<{name: string, text: string}>,
 *   savePage: (id: string, name: string, text: string) => Promise<Object>,
 *   createPage: (id: string, name: string, initial: string) => Promise<Object>,
 *   deletePage: (id: string, name: string) => Promise<Object>,
 *   generatePage: (id: string, name: string) => Promise<Object>,
 *   previewPageUrl: (id: string, name: string) => string
 * }}
 */
export const api = {
  /** @returns {Promise<Object>} The current `scm-config.json` document. */
  getConfig: () => request('GET', '/api/config'),
  /** @param {Object} doc - Full config document to persist. @returns {Promise<Object>} */
  putConfig: (doc) => request('POST', '/api/config', json(doc)),

  /** @returns {Promise<Object>} `{ projects: Array, projects_dir: string }`. */
  listProjects: () => request('GET', '/api/projects'),
  /** @param {Object} p - Project descriptor to import. @returns {Promise<Object>} */
  importProject: (p) => request('POST', '/api/projects', json(p)),
  /** @param {string} id - Project id. @returns {Promise<Object>} */
  deleteProject: (id) => request('DELETE', `/api/projects/${encodeURIComponent(id)}`),
  /** @param {string} id - Project id. @returns {Promise<Object>} */
  checkout: (id) => request('POST', `/api/projects/${encodeURIComponent(id)}/checkout`),
  /** @param {string} id - Project id. @returns {Promise<Object>} */
  ensureContentDir: (id) =>
    request('POST', `/api/projects/${encodeURIComponent(id)}/ensure-content-dir`, '{}'),

  /**
   * @param {string} id - Project id.
   * @returns {Promise<Object>} `{ files: Array<{name: string}> }`.
   */
  listFiles: (id) =>
    request('GET', `/api/projects/${encodeURIComponent(id)}/content`),
  /**
   * @param {string} id - Project id.
   * @param {string} name - File name.
   * @returns {Promise<{name: string, text: string}>} Raw file text.
   */
  loadFile: async (id, name) => ({
    name,
    text: await request('GET', `/api/projects/${encodeURIComponent(id)}/content/${encodeURIComponent(name)}`, undefined, true),
  }),
  /**
   * @param {string} id - Project id.
   * @param {string} name - File name.
   * @param {string} text - New file contents.
   * @returns {Promise<Object>}
   */
  saveFile: (id, name, text) =>
    request('PUT', `/api/projects/${encodeURIComponent(id)}/content/${encodeURIComponent(name)}`, text),
  /**
   * @param {string} id - Project id.
   * @param {string} name - File name to create.
   * @param {string} [initial=''] - Initial file contents.
   * @returns {Promise<Object>}
   */
  createFile: (id, name, initial) =>
    request('POST', `/api/projects/${encodeURIComponent(id)}/content`, json({ name, initial })),

  /** @param {string} id - Project id. @returns {Promise<Object>} Git status summary. */
  gitStatus: (id) => request('GET', `/api/projects/${encodeURIComponent(id)}/git/status`),

  /** @param {string} id - Project id. @returns {Promise<Object>} `{ files: Array }`. */
  listMedia: (id) => request('GET', `/api/projects/${encodeURIComponent(id)}/media`),
  /**
   * @param {string} id - Project id.
   * @param {string} name - Media file name.
   * @returns {string} Direct URL to serve the media file.
   */
  serveMediaUrl: (id, name) => `/api/projects/${encodeURIComponent(id)}/media/${encodeURIComponent(name)}`,
  /**
   * @param {string} id - Project id.
   * @param {string} name - Media file name.
   * @returns {Promise<Object>}
   */
  deleteMedia: (id, name) => request('DELETE', `/api/projects/${encodeURIComponent(id)}/media/${encodeURIComponent(name)}`),
  /**
   * @param {string} id - Project id.
   * @param {string} oldName - Current file name.
   * @param {string} newName - Desired file name.
   * @returns {Promise<Object>}
   */
  renameMedia: (id, oldName, newName) =>
    request('POST', `/api/projects/${encodeURIComponent(id)}/media/${encodeURIComponent(oldName)}/rename`, JSON.stringify({ name: newName })),
  /**
   * @param {string} id - Project id.
   * @param {File} file - The file object from an `<input type="file">`.
   * @returns {Promise<Object>} Server response with uploaded file metadata.
   */
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
  /**
   * @param {string} id - Project id.
   * @param {string} [message] - Optional commit message override.
   * @returns {Promise<Object>} Publish outcome (discriminated `outcome` field).
   */
  publish: (id, message) =>
    request(
      'POST',
      `/api/projects/${encodeURIComponent(id)}/publish`,
      json(message ? { message } : {}),
    ),

  // ================== PAGES ==================

  /** @param {string} id - Project id. @returns {Promise<Object>} `{ files: Array }`. */
  listPages: (id) =>
    request('GET', `/api/projects/${encodeURIComponent(id)}/pages`),
  /**
   * @param {string} id - Project id.
   * @param {string} name - Page name.
   * @returns {Promise<{name: string, text: string}>} Raw page HTML/text.
   */
  loadPage: async (id, name) => ({
    name,
    text: await request('GET', `/api/projects/${encodeURIComponent(id)}/pages/${encodeURIComponent(name)}`, undefined, true),
  }),
  /**
   * @param {string} id - Project id.
   * @param {string} name - Page name.
   * @param {string} text - New page contents.
   * @returns {Promise<Object>}
   */
  savePage: (id, name, text) =>
    request('PUT', `/api/projects/${encodeURIComponent(id)}/pages/${encodeURIComponent(name)}`, text),
  /**
   * @param {string} id - Project id.
   * @param {string} name - Page name to create.
   * @param {string} [initial=''] - Initial page contents.
   * @returns {Promise<Object>}
   */
  createPage: (id, name, initial) =>
    request('POST', `/api/projects/${encodeURIComponent(id)}/pages`, json({ name, initial })),
  /**
   * @param {string} id - Project id.
   * @param {string} name - Page name.
   * @returns {Promise<Object>}
   */
  deletePage: (id, name) =>
    request('DELETE', `/api/projects/${encodeURIComponent(id)}/pages/${encodeURIComponent(name)}`),
  /**
   * @param {string} id - Project id.
   * @param {string} name - Page name.
   * @returns {Promise<Object>}
   */
  generatePage: (id, name) =>
    request('POST', `/api/projects/${encodeURIComponent(id)}/pages/${encodeURIComponent(name)}/generate`),
  /**
   * @param {string} id - Project id.
   * @param {string} name - Page name.
   * @returns {string} Direct URL to the page preview.
   */
  previewPageUrl: (id, name) =>
    `/api/projects/${encodeURIComponent(id)}/pages/${encodeURIComponent(name)}/preview`,
};
