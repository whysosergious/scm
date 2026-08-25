// Page tree model (spec_page_editor.md §§9–10).
// Pure functions, zero DOM — mirrors the approach of json-model.js.
// Manages page document structure, node operations, and nesting validation.

let nextId = 1;

export const NODE_TYPES = ['box', 'text', 'image'];

export const BOX_ELEMENTS = ['div', 'section', 'header', 'main', 'footer', 'article', 'aside'];
export const TEXT_ELEMENTS = ['p', 'h1', 'h2', 'h3', 'span', 'blockquote'];

// ================== NESTING RULES ==================

// Parent→child compatibility matrix (spec_page_editor.md §10).
// Returns true when a child of `childType`/`childElement` can be placed
// inside a parent of `parentType`/`parentElement`.
export function canNest(parentType, parentElement, childType, childElement) {
  if (childType === 'image') return true; // Image goes anywhere valid

  switch (parentType) {
    case 'box':
      // Flow containers accept Box and Text(span)
      if (childType === 'box') return true;
      if (childType === 'text' && childElement === 'span') return true;
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

export function generateId() {
  return `node-${nextId++}`;
}

export function resetIdCounter(start = 1) {
  nextId = start;
}

// ================== DOCUMENT CREATION ==================

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

/** Is `id` found anywhere inside `subtree` (inclusive)? */
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
 * Returns true when the tree changed.
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
 * Remove a node from the tree. Returns true when removed.
 * The root node cannot be removed.
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
 * Deep-clone a node with fresh IDs.
 * Returns the clone.
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
 * Insert a clone of `nodeId` directly after it in the same parent.
 * Returns the new node or null.
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
 * Returns { valid: boolean, errors: string[] }.
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
 * Serialize a page document to pretty JSON.
 */
export function serializePage(doc) {
  return JSON.stringify(doc, null, 2) + '\n';
}
