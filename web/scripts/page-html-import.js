// HTML → PageDocument parser (client-side).
// Parses the imported HTML with the browser's HTML parser (DOMParser), walks the
// resulting DOM tree, and extracts structure + inline styles + classes +
// attributes + head elements into a PageDocument (page-model.js).
//
// Design decisions (per spec_markup_parser.md §4 + project conventions):
//  - Stylesheets are NOT inlined. <link rel="stylesheet"> is preserved as a
//    `stylesheet` head element so the editor (canvas + preview) loads the real
//    CSS via the project mount (/files/{id}/). This gives a faithful 1:1
//    rendering instead of dumping inlined CSS with comments like
//    `/* inlined from ./styles/layout.css */`. The same applies to <script src>.
//  - Computed styles are NOT extracted as inline node styles. Deriving inline
//    styles from a rendered document is noisy and fragile (zero-width layout
//    yields width:0/height:0, body margin, default borders, etc.) and produces
//    "inline styles that do not exist in the original page." Instead, the page's
//    own CSS is applied through its <link>/<style>/<class> references exactly as
//    authored. Inline `style="..."` attributes from the source ARE preserved.
//  - Asset URLs (href/src) are stored AS WRITTEN in the source (relative or
//    absolute). They are resolved against the project mount at render time
//    (canvas resolveImgSrc/resolveStylesheetHref + preview <base href>),
//    never baked into absolute localhost URLs that would break portability.

import * as pm from './page-model.js';

// ===================== CONSTANTS =====================

/** Elements that map to box nodes (containers). */
const BOX_ELEMENTS = new Set([
  'div', 'section', 'main', 'header', 'footer', 'article', 'aside', 'nav',
  'ul', 'ol', 'video', 'audio', 'table', 'form',
]);

/** Elements that map to text nodes (leaf, hold a `value`). */
const TEXT_ELEMENTS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'blockquote',
  'a', 'button', 'li', 'label', 'strong', 'em', 'b', 'i', 'code', 'pre', 'small',
]);

/** Elements to skip entirely (reported in the import report). */
const SKIP_ELEMENTS = new Set([
  'noscript', 'iframe', 'object', 'embed', 'applet',
  'canvas', 'template', 'slot',
]);

/** SVG elements — preserved as box nodes (vector graphics) in the SVG namespace. */
const SVG_ELEMENTS = new Set([
  'svg', 'path', 'circle', 'rect', 'g', 'line', 'polygon', 'polyline',
  'ellipse', 'defs', 'use', 'text', 'tspan', 'symbol', 'linearGradient',
  'radialGradient', 'stop', 'clipPath', 'mask', 'pattern', 'image',
  'filter', 'marker', 'title', 'desc', 'switch', 'foreignObject',
]);

/** Void / self-closing elements (no end tag). */
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/**
 * Extract all attributes from an element into a {name: value} map.
 * Preserves every attribute (class, style, id, data-*, aria-*, etc.)
 * except those in the skip set which are handled separately.
 * @param {Element} el
 * @param {Set<string>} skip - Lowercased attribute names to skip.
 * @returns {Object<string,string>}
 */
function extractAttrs(el, skip) {
  const out = {};
  for (const attr of el.attributes) {
    if (skip.has(attr.name)) continue;
    out[attr.name] = attr.value;
  }
  return out;
}

// ===================== STYLE / CLASS HELPERS =====================

/** Split a class attribute into a class array. */
function splitClasses(classAttr) {
  return classAttr ? classAttr.split(/\s+/).filter(Boolean) : [];
}

/**
 * Parse an inline style attribute into a property map, preserving the original
 * property names (kebab-case as written in the source).
 * @param {string} styleText
 * @returns {Object<string,string>}
 */
function parseInlineStyle(styleText) {
  if (!styleText) return {};
  const styles = {};
  for (const part of styleText.split(';')) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = part.slice(0, colonIdx).trim();
    const val = part.slice(colonIdx + 1).trim();
    if (prop && val) styles[prop] = val;
  }
  return styles;
}



// ===================== HEAD EXTRACTION =====================

/**
 * Extract head elements from a parsed HTML document into HeadElement[] (in
 * source order). Hrefs/srcs are stored AS WRITTEN so they resolve via the
 * project mount at render time. Title is returned separately.
 *
 * @param {Document} doc - The parsed HTML document.
 * @returns {{ title: string, head: HeadElement[], warnings: string[] }}
 */
function extractHead(doc) {
  const head = [];
  const warnings = [];
  let title = doc.title || '';

  const headEl = doc.head;
  if (!headEl) return { title, head, warnings };

  for (const child of Array.from(headEl.children)) {
    const tag = child.tagName.toLowerCase();

    switch (tag) {
      case 'title':
        break;

      case 'link': {
        const rel = (child.getAttribute('rel') || '').toLowerCase();
        const href = child.getAttribute('href');
        if (rel === 'icon' || rel === 'shortcut icon' || rel === 'apple-touch-icon') {
          // Skip favicons — not useful in the editor.
        } else if (rel === 'stylesheet' && href) {
          head.push({
            type: 'stylesheet',
            href,
            media: child.getAttribute('media') || undefined,
          });
        } else if (href || rel) {
          // Preserve all other <link> elements (preconnect, preload, dns-prefetch,
          // canonical, manifest, alternate, modulepreload, etc.)
          const attrs = {};
          for (const attr of child.attributes) {
            attrs[attr.name] = attr.value;
          }
          head.push({ type: 'link', attrs });
        }
        break;
      }

      case 'style': {
        const css = child.textContent || '';
        if (css.trim()) head.push({ type: 'style', css });
        break;
      }

      case 'meta': {
        const name = child.getAttribute('name');
        const property = child.getAttribute('property');
        const httpEquiv = child.getAttribute('http-equiv');
        const charset = child.getAttribute('charset');
        const content = child.getAttribute('content');
        if (charset) {
          head.push({ type: 'meta', charset });
        } else if (name && content) {
          if (name === 'viewport') break; // we generate viewport ourselves
          head.push({ type: 'meta', name, content });
        } else if (property && content) {
          head.push({ type: 'meta', property, content });
        } else if (httpEquiv && content) {
          head.push({ type: 'meta', httpEquiv, content });
        }
        break;
      }

      case 'script': {
        const src = child.getAttribute('src');
        const defer = child.hasAttribute('defer');
        const async = child.hasAttribute('async');
        if (src) {
          head.push({ type: 'script', src, defer: defer || undefined, async: async || undefined });
        } else {
          const js = child.textContent || '';
          if (js.trim()) head.push({ type: 'script', js });
        }
        break;
      }

      case 'noscript':
        // Skip — not useful in the editor.
        break;

      default:
        break;
    }
  }

  return { title, head, warnings };
}

// ===================== DOM TREE WALKER =====================

/**
 * Convert a DOM text node into a span Text node (used for direct text that is a
 * child of a box — the page model can only carry text inside Text nodes).
 * @param {string} text
 * @returns {import('./page-model.js').PageNode}
 */
function makeTextNode(text) {
  const node = pm.createNode('text', { element: 'span' });
  node.props.value = text;
  return node;
}

/**
 * Resolve a node's HTML element to the stored box element, or null if the
 * element should be skipped.
 * @param {string} tag - Lowercased tag name.
 * @param {Element} el - The DOM element (for display-based fallback).
 * @returns {string|null} Element name or null to skip.
 */
function resolveBoxElement(tag, el) {
  if (SVG_ELEMENTS.has(tag)) return tag;
  if (BOX_ELEMENTS.has(tag) || TEXT_ELEMENTS.has(tag)) return tag;
  if (tag.includes('-')) return null; // custom element — handled by caller
  // Unknown element — infer from computed display.
  let disp = '';
  try {
    disp = getComputedStyle(el).display;
  } catch (_) {}
  if (disp === 'block' || disp === 'flex' || disp === 'grid' || disp === 'inline-block') {
    return 'div';
  }
  return null;
}

/**
 * Walk the DOM tree and convert to a PageNode tree.
 *
 * Element-with-element-children → box (preserves nested structure, e.g.
 * `<a href><img/><span>…</span></a>` stays a box with an image + text child
 * instead of being flattened/lost). An element with only text content maps to
 * a Text leaf when its tag is a text element, or a box wrapping the text in a
 * span otherwise.
 *
 * @param {Node} domNode - Current DOM node.
 * @param {Object} ctx - Parser context (idMap, nextId, report, scripts).
 * @returns {import('./page-model.js').PageNode|null}
 */
function walkNode(domNode, ctx) {
  // Text node → span Text node (only meaningful as a child of a box).
  if (domNode.nodeType === Node.TEXT_NODE) {
    const text = domNode.textContent || '';
    if (!text.trim()) return null; // whitespace between block elements
    return makeTextNode(text);
  }

  // Element node
  if (domNode.nodeType !== Node.ELEMENT_NODE) return null;

  const el = domNode;
  const tag = el.tagName.toLowerCase();

  if (el.getAttribute('aria-hidden') === 'true') return null;

  // Inner SVG elements (path, circle, rect, g, etc.) — skip; they are part of
  // the parent <svg>'s innerHTML which we capture as raw content.
  if (SVG_ELEMENTS.has(tag) && tag !== 'svg') return null;

  // <script> in body → box node preserving src/js/defer/async props.
  if (tag === 'script') {
    const node = buildBoxNode('script', el, ctx);
    const src = el.getAttribute('src');
    if (src) node.props.src = src;
    const js = el.textContent || '';
    if (js.trim()) node.props.js = js;
    if (el.hasAttribute('defer')) node.props.defer = true;
    if (el.hasAttribute('async')) node.props.async = true;
    return node;
  }

  // Skip unsupported elements.
  if (SKIP_ELEMENTS.has(tag)) {
    ctx.report.warnings.push(`[skipped element] <${tag}>`);
    return null;
  }

  // <img> → image node (src/alt live in props, not attrs, to avoid duplicates).
  if (tag === 'img') {
    const rawId = el.getAttribute('id');
    const id = ctx.nextId(rawId);
    const node = {
      id,
      type: 'image',
      props: {
        src: el.getAttribute('src') || '',
        alt: el.getAttribute('alt') || '',
      },
      styles: parseInlineStyle(el.getAttribute('style')),
      classes: splitClasses(el.getAttribute('class')),
      attrs: extractAttrs(el, new Set(['src', 'alt', 'style', 'class'])),
      children: [],
    };
    if (rawId) node.attrs.id = rawId;
    ctx.idMap.set(id, true);
    ctx.report.stats.total++;
    ctx.report.stats.images++;
    return node;
  }

  // <hr> → generic box (div) per spec (§18).
  if (tag === 'hr') {
    const node = buildBoxNode('div', el, ctx);
    return node;
  }

  // Other void elements in body (br, input, meta, link, etc.) — skip.
  if (VOID_ELEMENTS.has(tag)) return null;

  const isCustom = tag.includes('-');
  const isSvg = tag === 'svg';
  const resolved = resolveBoxElement(tag, el);

  // Unknown inline element without a known block role — skip and report.
  if (!resolved && !isCustom && !isSvg && !TEXT_ELEMENTS.has(tag)) {
    ctx.report.warnings.push(`[skipped element] <${tag}>`);
    return null;
  }

  const hasElementChildren = el.children.length > 0;
  const isLeafText = TEXT_ELEMENTS.has(tag) && !isCustom && !isSvg && !hasElementChildren;

  let type;
  let nodeElement;
  if (isLeafText) {
    type = 'text';
    nodeElement = tag;
  } else {
    type = 'box';
    if (isCustom || isSvg) {
      nodeElement = tag; // preserve original tag name (custom element or svg)
    } else if (resolved) {
      nodeElement = resolved;
    } else {
      // Unknown element that is a block (display was block/flex/grid) → div.
      nodeElement = 'div';
    }
  }

  const node = buildNode(type, nodeElement, el, ctx);
  ctx.idMap.set(node.id, true);

  if (type === 'text') {
    node.props.value = el.textContent || '';
    if (el.children.length > 0) {
      ctx.report.warnings.push(`[lossy text] <${tag}> contains nested elements (text is a leaf; nested markup flattened into value)`);
    }
  } else if (isSvg) {
    // SVG: serialize with XMLSerializer to preserve namespaces, self-closing
    // tags, and attribute casing correctly (innerHTML may mangle SVG in some
    // browsers).  Store the FULL <svg>…</svg> markup so the canvas can inject
    // it into an SVG-namespace element without loss.
    const serializer = new XMLSerializer();
    node.props.innerHTML = serializer.serializeToString(el);
  } else {
    // Box: walk children. Direct text runs become span Text nodes.
    for (const child of Array.from(el.childNodes)) {
      const childNode = walkNode(child, ctx);
      if (childNode) node.children.push(childNode);
    }
  }

  ctx.report.stats.total++;
  if (type === 'box') ctx.report.stats.boxes++;
  else if (type === 'text') ctx.report.stats.texts++;

  return node;
}

/**
 * Build a node object (id/styles/classes/attrs shared by box and text).
 * @param {'box'|'text'} type
 * @param {string} element
 * @param {Element} el
 * @param {Object} ctx
 * @returns {import('./page-model.js').PageNode}
 */
function buildNode(type, element, el, ctx) {
  const rawId = el.getAttribute('id');
  const node = {
    id: ctx.nextId(rawId),
    type,
    props: { element },
    styles: parseInlineStyle(el.getAttribute('style')),
    classes: splitClasses(el.getAttribute('class')),
    attrs: extractAttrs(el, new Set(['style', 'class'])),
    children: type === 'box' ? [] : undefined,
  };
  // Preserve original id attribute so getElementById works in imported scripts
  if (rawId) node.attrs.id = rawId;
  if (type === 'text') node.props.value = '';
  return node;
}

/** Convenience: build a box node with a known element. */
function buildBoxNode(element, el, ctx) {
  return buildNode('box', element, el, ctx);
}

// ===================== DOM PARSING =====================

/**
 * Parse an HTML string into a browser Document via DOMParser (uses the native
 * HTML parser, so malformed HTML, implicit table bodies, etc. are normalised
 * the same way a browser would render them).
 * @param {string} html
 * @returns {Document}
 */
function parseHtml(html) {
  return new DOMParser().parseFromString(html, 'text/html');
}

// ===================== MAIN API =====================

/**
 * Import an HTML string into a PageDocument.
 *
 * @param {string} html - Full HTML document string.
 * @param {Object} [options={}]
 * @param {string} [options.baseUrl=''] - Base URL for resolving relative paths
 *   (used only for the import report / future stylesheet resolution). Stored
 *   URLs remain relative as authored.
 * @returns {Promise<{doc: import('./page-model.js').PageDocument, report: ImportReport}>}
 */
export async function importHtml(html, options = {}) {
  const { baseUrl = '' } = options;

  let doc;
  try {
    doc = parseHtml(html);
  } catch (e) {
    throw new Error(`Failed to parse HTML: ${e.message}`);
  }

  const report = {
    warnings: [],
    errors: [],
    stats: { total: 0, boxes: 0, texts: 0, images: 0 },
  };

  // 1. Extract head elements (original hrefs/srcs preserved).
  const { title, head: headElems, warnings: headWarnings } = extractHead(doc);
  report.warnings.push(...headWarnings);

  // 2. Walk the body. <body> itself is not a node — its classes/inline styles
  //    are applied to the page root, and its children become the root's children.
  //    Body attributes are preserved in doc.body for the canvas iframe.
  const idMap = new Map();
  const ctx = {
    doc,
    report,
    idMap,
    nextId(rawId) {
      if (rawId && /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(rawId) && !idMap.has(rawId)) {
        idMap.set(rawId, true);
        return rawId;
      }
      // Use the global counter to guarantee uniqueness across import + editing
      let id;
      do {
        id = pm.generateId();
      } while (idMap.has(id));
      idMap.set(id, true);
      return id;
    },
  };

  const body = doc.body;
  const rootNode = pm.createNode('box', { element: 'main' });
  idMap.set(rootNode.id, true);

  /** Preserved body attributes for the canvas iframe <body> tag. */
  const bodyInfo = { classes: [], styles: {}, attrs: {} };

  if (body) {
    const bodyClasses = splitClasses(body.getAttribute('class'));
    if (bodyClasses.length) {
      rootNode.classes = bodyClasses;
      bodyInfo.classes = bodyClasses;
    }
    const bodyStyles = parseInlineStyle(body.getAttribute('style'));
    rootNode.styles = bodyStyles;
    bodyInfo.styles = bodyStyles;
    bodyInfo.attrs = extractAttrs(body, new Set(['class', 'style', 'id']));

    for (const child of Array.from(body.childNodes)) {
      const childNode = walkNode(child, ctx);
      if (childNode) rootNode.children.push(childNode);
    }
  }

  // 3. Build the PageDocument.
  const result = {
    version: 1,
    title: title || 'Imported Page',
    meta: { description: '', og_image: '' },
    head: headElems,
    classes: [],
    body: bodyInfo,
    root: rootNode,
  };

  // 4. Stats (root inclusive).
  report.stats = countNodes(rootNode);

  return { doc: result, report };
}

/**
 * Import an HTML file.
 * @param {File} file
 * @param {Object} [options={}]
 * @returns {Promise<{doc: import('./page-model.js').PageDocument, report: ImportReport}>}
 */
export async function importHtmlFile(file, options = {}) {
  const text = await file.text();
  const baseUrl = options.baseUrl || '';
  return importHtml(text, { ...options, baseUrl });
}

/**
 * Import HTML from a URL (fetches the document). Cross-origin fetches without
 * CORS are not possible from the browser; serve the page from the project mount
 * (/files/{id}/...) for same-origin import.
 * @param {string} url
 * @returns {Promise<{doc: import('./page-model.js').PageDocument, report: ImportReport}>}
 */
export async function importHtmlUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  const html = await res.text();
  return importHtml(html, { baseUrl: url });
}

// ===================== JSON IMPORT =====================

/**
 * Count nodes in a tree (inclusive of root).
 * @param {import('./page-model.js').PageNode} node
 * @returns {{total:number,boxes:number,texts:number,images:number}}
 */
function countNodes(node) {
  const stats = { total: 0, boxes: 0, texts: 0, images: 0, svgs: 0 };
  walk(node);
  function walk(n) {
    if (!n) return;
    stats.total++;
    if (n.type === 'box') {
      stats.boxes++;
      if (n.props && n.props.element === 'svg') stats.svgs++;
    }
    else if (n.type === 'text') stats.texts++;
    else if (n.type === 'image') stats.images++;
    if (n.children) n.children.forEach(walk);
  }
  return stats;
}

/**
 * Import a PageDocument JSON object directly (validates structure).
 * @param {Object} json - Parsed JSON object (a page document).
 * @returns {{doc: import('./page-model.js').PageDocument, report: ImportReport}}
 */
export function importJson(json) {
  const report = {
    warnings: [],
    errors: [],
    stats: { total: 0, boxes: 0, texts: 0, images: 0 },
  };

  const validation = pm.validatePage(json);
  if (!validation.valid) {
    throw new Error('Invalid page JSON: ' + validation.errors.join('; '));
  }

  report.stats = countNodes(json.root);

  // Reset id counter above max existing id.
  let maxId = 0;
  (function scan(n) {
    if (n?.id) {
      const m = n.id.match(/^node-(\d+)$/);
      if (m) maxId = Math.max(maxId, parseInt(m[1], 10));
    }
    if (n?.children) n.children.forEach(scan);
  })(json.root);
  pm.resetIdCounter(maxId + 1);

  return { doc: json, report };
}

/**
 * Detect format (HTML or JSON) from raw text and import accordingly.
 * @param {string} text - Raw input text (HTML or JSON).
 * @param {Object} [options={}] - Options forwarded to {@link importHtml} for HTML input.
 * @returns {Promise<{doc: import('./page-model.js').PageDocument, report: ImportReport}>}
 */
export async function importAuto(text, options = {}) {
  const trimmed = (text || '').trim();
  if (!trimmed) throw new Error('Empty input');

  const first = trimmed[0];
  if (first === '{' || first === '[') {
    let json;
    try {
      json = JSON.parse(trimmed);
    } catch (e) {
      throw new Error(`Invalid JSON: ${e.message}`);
    }
    return importJson(json);
  }

  return importHtml(trimmed, options);
}

/**
 * Import from a File, detecting HTML vs JSON by content.
 * @param {File} file
 * @param {Object} [options={}]
 * @returns {Promise<{doc: import('./page-model.js').PageDocument, report: ImportReport}>}
 */
export async function importFileAuto(file, options = {}) {
  const text = await file.text();
  return importAuto(text, options);
}
