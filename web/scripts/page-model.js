// Page tree model (spec_page_editor.md §§9–10).
// Pure functions, zero DOM — mirrors the approach of json-model.js.
// Manages page document structure, node operations, and nesting validation.

/**
 * @typedef {Object} PageNode
 * @property {string} id - Unique node identifier (e.g. "node-1").
 * @property {'box'|'text'|'image'} type - Node type.
 * @property {Object<string, *>} props - Type-specific properties (element, value, src, alt, etc.).
 * @property {Object<string, string>} [styles] - Inline CSS styles.
 * @property {string[]} [classes] - CSS class names.
 * @property {PageNode[]} [children] - Child nodes (only for box type).
 */

let nextId = 1;

/** @type {string[]} All supported node types. */
export const NODE_TYPES = ['box', 'text', 'image'];

/** @type {string[]} HTML elements allowed for box nodes. */
export const BOX_ELEMENTS = ['div', 'section', 'header', 'main', 'footer', 'article', 'aside'];

/** @type {string[]} HTML elements allowed for text nodes. */
export const TEXT_ELEMENTS = ['p', 'h1', 'h2', 'h3', 'span', 'blockquote'];

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
  if (childType === 'image') return true; // Image goes anywhere valid

  switch (parentType) {
    case 'box':
      // Flow containers accept Box and Text (any element)
      if (childType === 'box') return true;
      if (childType === 'text') return true;
      return false;

    case 'text': {
      // Phrasing containers accept only Text(span)
      const el = parentElement || 'p';
      if (el === 'span') {
        return childType === 'text' && childElement === 'span';
      }
      // p, h1, h2, h3, blockquote accept only Text(span)
      return childType === 'text' && childElement === 'span';
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
 * @returns {{ version: number, title: string, meta: { description: string, og_image: string }, classes: string[], root: PageNode }} A new page document.
 */
export function createEmptyPage(title = 'New Page') {
  return {
    version: 1,
    title,
    meta: { description: '', og_image: '' },
    classes: [],
    root: createNode('box', { element: 'main' }),
  };
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
