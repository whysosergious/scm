// Page tree model (spec_page_editor.md §§9–10, 9a).
// Pure functions, zero DOM — mirrors the approach of json-model.js.
// Manages page document structure, node operations, head elements, and nesting validation.

/**
 * @typedef {Object} PageNode
 * @property {string} id - Unique node identifier (e.g. "node-1").
 * @property {'box'|'text'|'image'} type - Node type.
 * @property {Object<string, *>} props - Type-specific properties (element, value, src, alt, etc.).
 * @property {Object<string, string>} [styles] - Inline CSS styles.
 * @property {string[]} [classes] - CSS class names.
 * @property {Object<string, string>} [attrs] - HTML attributes (href, target, src, controls, …).
 * @property {PageNode[]} [children] - Child nodes (only for box type).
 */

/**
 * @typedef {Object} HeadElement
 * @property {'stylesheet'|'style'|'meta'|'script'} type - Head element type.
 * @property {string} [href] - Stylesheet URL (stylesheet type).
 * @property {string} [media] - Media query (stylesheet type).
 * @property {string} [css] - Inline CSS text (style type).
 * @property {string} [name] - Meta name (meta type).
 * @property {string} [property] - Open Graph property (meta type).
 * @property {string} [charset] - Character set (meta type).
 * @property {string} [content] - Meta content (meta type).
 * @property {string} [src] - Script URL (script type).
 * @property {string} [js] - Inline JavaScript (script type).
 * @property {boolean} [defer] - Defer attribute (script type).
 * @property {boolean} [async] - Async attribute (script type).
 */

/**
 * @typedef {Object} PageDocument
 * @property {number} version - Document version (always 1).
 * @property {string} title - Page title.
 * @property {{ description: string, og_image: string }} meta - Legacy meta fields.
 * @property {HeadElement[]} head - Head elements array.
 * @property {Array<{name: string, label?: string, description?: string, styles: Object<string, string>}>} classes - Reusable CSS classes.
 * @property {PageNode} root - Root page node.
 */

let nextId = 1;

/** @type {string[]} All supported node types. */
export const NODE_TYPES = ['box', 'text', 'image'];

/** @type {string[]} HTML elements allowed for box nodes. */
export const BOX_ELEMENTS = ['div', 'section', 'header', 'main', 'footer', 'article', 'aside', 'nav', 'ul', 'ol', 'video', 'audio'];

/** @type {string[]} HTML elements allowed for text nodes. */
export const TEXT_ELEMENTS = ['p', 'h1', 'h2', 'h3', 'span', 'blockquote', 'a', 'button', 'li'];

/** @type {string[]} Box elements rendered as native media players (leaf nodes). */
export const MEDIA_ELEMENTS = ['video', 'audio'];

// ================== NESTING RULES ==================

/**
 * Check whether a child node can be placed inside a parent node.
 * Implements the parent→child compatibility matrix from spec_page_editor.md §10.
 *
 * @param {'box'|'text'|'image'} parentType - Type of the parent node.
 * @param {string} [parentElement] - HTML element of the parent (e.g. 'div', 'span').
 * @param {'box'|'text'|'image'} childType - Type of the child node.
 * @param {string} [childElement] - HTML element of the child (e.g. 'span', 'p').
 * @returns {boolean} True if the child can nest inside the parent.
 */
export function canNest(parentType, parentElement, childType, childElement) {
  const parentEl = parentElement || '';

  // Media players are leaf nodes — nothing nests inside video/audio
  if (parentType === 'box' && (parentEl === 'video' || parentEl === 'audio')) {
    return false;
  }

  if (childType === 'image') return true; // Image goes anywhere valid

  switch (parentType) {
    case 'box':
      // Lists accept only list items
      if (parentEl === 'ul' || parentEl === 'ol') {
        return childType === 'text' && childElement === 'li';
      }
      // Flow containers accept Box and Text (any element)
      if (childType === 'box') return true;
      if (childType === 'text') return true;
      return false;

    case 'text': {
      if (childType !== 'text') return false;
      const child = childElement || 'span';
      // No links nested inside links
      if (parentEl === 'a' && child === 'a') return false;
      // Spans are valid inline phrasing everywhere
      if (child === 'span') return true;
      // Links are valid inside phrasing content (headings, paragraphs, list items)
      if (child === 'a') return ['p', 'h1', 'h2', 'h3', 'blockquote', 'li'].includes(parentEl);
      return false;
    }

    default:
      return false;
  }
}

// ================== NODE CREATION ==================

/**
 * Create a new page node with a generated id and default properties.
 *
 * @param {'box'|'text'|'image'} type - Node type.
 * @param {Object<string, *>} [props={}] - Initial properties to merge.
 * @param {string} [element] - HTML element for box/text nodes (defaults to 'div'/'p').
 * @returns {PageNode} The newly created node.
 */
export function createNode(type, props = {}, element) {
  const id = generateId();
  const node = {
    id,
    type,
    props: { ...props },
    styles: {},
    classes: [],
    attrs: {},
    children: [],
  };
  if (type === 'box') {
    node.props.element = element || 'div';
  } else if (type === 'text') {
    node.props.element = element || 'p';
    node.props.value = props.value || '';
  } else if (type === 'image') {
    node.props.src = props.src || '';
    node.props.alt = props.alt || '';
  }
  return node;
}

/**
 * Generate the next unique node id (e.g. "node-1", "node-2", …).
 *
 * @returns {string} A new unique node id.
 */
export function generateId() {
  return `node-${nextId++}`;
}

/**
 * Reset the internal id counter. Call after parsing an existing document
 * to avoid collisions with pre-existing node ids.
 *
 * @param {number} [start=1] - Next id number to use.
 */
export function resetIdCounter(start = 1) {
  nextId = start;
}

// ================== DOCUMENT CREATION ==================

/**
 * Create an empty page document with a single root box node.
 *
 * @param {string} [title='New Page'] - Page title.
 * @returns {PageDocument} A new page document.
 */
export function createEmptyPage(title = 'New Page') {
  return {
    version: 1,
    title,
    meta: { description: '', og_image: '' },
    head: [],
    classes: [],
    root: createNode('box', { element: 'main' }),
  };
}

// ================== HEAD ELEMENTS ==================

/**
 * Default properties for each head element type.
 * @type {Object<string, Object<string, *>>}
 */
const HEAD_DEFAULTS = {
  stylesheet: { href: '' },
  style: { css: '' },
  meta: { name: '', content: '' },
  script: { src: '' },
};

/**
 * Add a new head element to the document's head array.
 *
 * @param {PageDocument} doc - The page document.
 * @param {'stylesheet'|'style'|'meta'|'script'} type - Head element type.
 * @param {Object<string, *>} [props] - Initial properties to merge.
 * @returns {HeadElement|null} The newly created head element, or null if type is invalid.
 */
export function addHeadElement(doc, type, props = {}) {
  if (!HEAD_DEFAULTS[type]) return null;
  if (!doc.head) doc.head = [];
  const element = { type, ...HEAD_DEFAULTS[type], ...props };
  doc.head.push(element);
  return element;
}

/**
 * Update properties of a head element at the given index.
 *
 * @param {PageDocument} doc - The page document.
 * @param {number} index - Index in the head array.
 * @param {Object<string, *>} props - Properties to merge into the element.
 * @returns {boolean} True if the element was updated, false if index is out of bounds.
 */
export function updateHeadElement(doc, index, props) {
  if (!doc.head || index < 0 || index >= doc.head.length) return false;
  Object.assign(doc.head[index], props);
  return true;
}

/**
 * Remove a head element at the given index.
 *
 * @param {PageDocument} doc - The page document.
 * @param {number} index - Index in the head array.
 * @returns {boolean} True if the element was removed, false if index is out of bounds.
 */
export function removeHeadElement(doc, index) {
  if (!doc.head || index < 0 || index >= doc.head.length) return false;
  doc.head.splice(index, 1);
  return true;
}

/**
 * Get a human-readable label for a head element.
 *
 * @param {HeadElement} elem - The head element.
 * @returns {string} A short label (max ~40 chars).
 */
export function headElementLabel(elem) {
  switch (elem.type) {
    case 'stylesheet': return elem.href || '(empty stylesheet)';
    case 'style': return (elem.css || '').slice(0, 40) || '(empty style)';
    case 'meta': return elem.name ? `name="${elem.name}"` : elem.property ? `property="${elem.property}"` : elem.charset ? `charset="${elem.charset}"` : '(meta)';
    case 'script': return elem.src || (elem.js || '').slice(0, 40) || '(empty script)';
    default: return elem.type;
  }
}

// ================== TREE TRAVERSAL ==================

/**
 * Find a node by id anywhere in the tree (depth-first).
 *
 * @param {PageNode} root - Root of the tree to search.
 * @param {string} id - Node id to find.
 * @returns {PageNode|null} The matching node, or null if not found.
 */
export function findNode(root, id) {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const hit = findNode(child, id);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Find the parent of a node by its id.
 *
 * @param {PageNode} root - Root of the tree to search.
 * @param {string} id - Id of the child node.
 * @returns {PageNode|null} The parent node, or null if not found (or if id is the root).
 */
export function findParent(root, id) {
  if (root.children) {
    for (const child of root.children) {
      if (child.id === id) return root;
      const hit = findParent(child, id);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Check whether a node id exists anywhere inside a subtree (inclusive).
 * Used as a cycle guard before moving a node.
 *
 * @param {PageNode} subtree - Subtree root to check.
 * @param {string} id - Node id to look for.
 * @returns {boolean} True if the id is found within the subtree.
 */
export function isWithin(subtree, id) {
  if (subtree.id === id) return true;
  if (subtree.children) {
    return subtree.children.some((c) => isWithin(c, id));
  }
  return false;
}

// ================== NODE OPERATIONS ==================

/**
 * Add a new child node to a parent at the given index.
 * Validates nesting rules before adding.
 *
 * @param {PageNode} root - Root of the page tree.
 * @param {string} parentId - Id of the parent node to add to.
 * @param {'box'|'text'|'image'} type - Type of the new child node.
 * @param {number|null} [index] - Position within parent's children array. Appends if null/omitted.
 * @param {Object<string, *>} [props={}] - Initial properties for the new node.
 * @param {string} [element] - HTML element for box/text nodes.
 * @returns {PageNode|null} The newly created node, or null if the operation is invalid.
 */
export function addNode(root, parentId, type, index, props = {}, element) {
  const parent = findNode(root, parentId);
  if (!parent) return null;
  if (parent.type !== 'box' || !parent.children) return null;

  const childElement = type === 'box' ? (element || 'div')
    : type === 'text' ? (element || 'p')
    : undefined;

  if (!canNest(parent.type, parent.props.element, type, childElement)) {
    return null; // nesting rejected
  }

  const node = createNode(type, props, element);
  const at = Math.max(0, Math.min(index ?? parent.children.length, parent.children.length));
  parent.children.splice(at, 0, node);
  return node;
}

/**
 * Move a node to a new parent at the given index.
 * Enforces cycle guard and nesting validation.
 *
 * @param {PageNode} root - Root of the page tree.
 * @param {string} nodeId - Id of the node to move.
 * @param {string} targetParentId - Id of the new parent node.
 * @param {number} index - Position within the target parent's children array.
 * @returns {boolean} True when the tree was mutated, false if rejected.
 */
export function moveNode(root, nodeId, targetParentId, index) {
  const node = findNode(root, nodeId);
  const targetParent = findNode(root, targetParentId);
  if (!node || !targetParent) return false;
  if (!targetParent.children) return false;
  if (isWithin(node, targetParentId)) return false; // cycle guard

  const oldParent = findParent(root, nodeId);
  if (!oldParent) return false;

  // Check nesting compatibility
  const childElement = node.type === 'box' ? node.props.element
    : node.type === 'text' ? node.props.element
    : undefined;
  if (!canNest(targetParent.type, targetParent.props.element, node.type, childElement)) {
    return false;
  }

  const from = oldParent.children.indexOf(node);
  if (from === -1) return false;

  // No-op if dropped into same position
  if (oldParent === targetParent && index === from) return false;

  oldParent.children.splice(from, 1);
  const at = Math.max(0, Math.min(index, targetParent.children.length));
  targetParent.children.splice(at, 0, node);
  return true;
}

/**
 * Remove a node from the tree by id. The root node cannot be removed.
 *
 * @param {PageNode} root - Root of the page tree.
 * @param {string} nodeId - Id of the node to remove.
 * @returns {boolean} True when the node was removed, false otherwise.
 */
export function removeNode(root, nodeId) {
  const parent = findParent(root, nodeId);
  if (!parent) return false; // root or not found
  const idx = parent.children.findIndex((c) => c.id === nodeId);
  if (idx === -1) return false;
  parent.children.splice(idx, 1);
  return true;
}

/**
 * Deep-clone a node with fresh IDs. Recursively clones all children.
 *
 * @param {PageNode} node - The node to clone.
 * @returns {PageNode} A deep copy with a newly generated id.
 */
export function cloneNode(node) {
  const clone = {
    id: generateId(),
    type: node.type,
    props: JSON.parse(JSON.stringify(node.props)),
    styles: JSON.parse(JSON.stringify(node.styles || {})),
    classes: [...(node.classes || [])],
    children: (node.children || []).map(cloneNode),
  };
  return clone;
}

/**
 * Insert a clone of a node directly after it in the same parent.
 *
 * @param {PageNode} root - Root of the page tree.
 * @param {string} nodeId - Id of the node to duplicate.
 * @returns {PageNode|null} The cloned node, or null if not found.
 */
export function cloneNodeInPlace(root, nodeId) {
  const node = findNode(root, nodeId);
  if (!node) return null;
  const parent = findParent(root, nodeId);
  if (!parent) return null;

  const copy = cloneNode(node);
  const idx = parent.children.indexOf(node);
  parent.children.splice(idx + 1, 0, copy);
  return copy;
}

// ================== VALIDATION ==================

/**
 * Validate a page document structure.
 *
 * @param {*} doc - The page document to validate.
 * @returns {{ valid: boolean, errors: string[] }} Validation result with any error messages.
 */
export function validatePage(doc) {
  const errors = [];

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: ['Page document must be an object'] };
  }
  if (doc.version !== 1) {
    errors.push('Page version must be 1');
  }
  if (typeof doc.title !== 'string') {
    errors.push('Page must have a title');
  }
  if (!doc.root) {
    errors.push('Page must have a root node');
    return { valid: errors.length === 0, errors };
  }

  const seenIds = new Set();
  validateNode(doc.root, seenIds, errors);

  // Validate head elements
  if (doc.head && Array.isArray(doc.head)) {
    for (let i = 0; i < doc.head.length; i++) {
      const he = doc.head[i];
      if (!he || typeof he !== 'object') {
        errors.push(`Head element ${i} must be an object`);
        continue;
      }
      if (!HEAD_DEFAULTS[he.type]) {
        errors.push(`Head element ${i} has unknown type '${he.type}'`);
        continue;
      }
      if (he.type === 'stylesheet' && !he.href) {
        errors.push(`Head element ${i} (stylesheet) must have an 'href'`);
      }
      if (he.type === 'style' && !he.css) {
        errors.push(`Head element ${i} (style) must have 'css'`);
      }
      if (he.type === 'meta' && !he.charset && !he.name && !he.property) {
        errors.push(`Head element ${i} (meta) must have 'name', 'property', or 'charset'`);
      }
      if (he.type === 'script' && !he.src && !he.js) {
        errors.push(`Head element ${i} (script) must have 'src' or 'js'`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateNode(node, seenIds, errors) {
  if (!node.id) {
    errors.push('Every node must have an id');
    return;
  }
  if (seenIds.has(node.id)) {
    errors.push(`Duplicate node id '${node.id}'`);
    return;
  }
  seenIds.add(node.id);

  if (!node.type || !NODE_TYPES.includes(node.type)) {
    errors.push(`Node '${node.id}' has unknown type '${node.type}'`);
    return;
  }

  if (node.type === 'box') {
    const el = (node.props && node.props.element) || 'div';
    if (!BOX_ELEMENTS.includes(el)) {
      errors.push(`Box '${node.id}' has unsupported element '${el}'`);
    }
    if (node.children) {
      for (const child of node.children) {
        validateNode(child, seenIds, errors);
      }
    }
  } else if (node.type === 'text') {
    const el = (node.props && node.props.element) || 'p';
    if (!TEXT_ELEMENTS.includes(el)) {
      errors.push(`Text '${node.id}' has unsupported element '${el}'`);
    }
  } else if (node.type === 'image') {
    if (!node.props || !node.props.src) {
      errors.push(`Image '${node.id}' must have a src`);
    }
    if (!node.props || !node.props.alt) {
      errors.push(`Image '${node.id}' must have alt text`);
    }
  }
}

// ================== SERIALIZE / PARSE ==================

/**
 * Parse a page JSON string into a page document.
 * Sets up the in-memory id counter from existing node ids.
 *
 * @param {string} text - JSON string representing a page document.
 * @returns {Object} The parsed page document.
 */
export function parsePage(text) {
  const doc = JSON.parse(text);
  // Scan all node ids and set counter above max
  let maxId = 0;
  function scanIds(node) {
    if (node && node.id) {
      const m = node.id.match(/^node-(\d+)$/);
      if (m) maxId = Math.max(maxId, parseInt(m[1], 10));
    }
    if (node && node.children) {
      node.children.forEach(scanIds);
    }
  }
  if (doc.root) scanIds(doc.root);
  nextId = maxId + 1;
  // Ensure head array exists for backward compatibility
  if (!doc.head || !Array.isArray(doc.head)) doc.head = [];
  return doc;
}

/**
 * Serialize a page document to pretty-printed JSON.
 *
 * @param {Object} doc - The page document to serialize.
 * @returns {string} JSON string with 2-space indentation and trailing newline.
 */
export function serializePage(doc) {
  return JSON.stringify(doc, null, 2) + '\n';
}
