// DOM tree panel for the page editor (spec_page_editor.md §11).
// Shows head elements and recursive body node tree.
// Supports keyboard navigation: arrow keys, Enter to select, Delete to remove.

import { el } from '../dom.js';
import { headElementLabel } from '../page-model.js';

/** @type {Record<string, string>} Badge text per head element type. */
const HEAD_BADGES = {
  stylesheet: 'link',
  style: 'css',
  meta: 'meta',
  script: 'js',
};

/** @type {string[]} Head element type options for the add dropdown. */
const HEAD_TYPES = ['stylesheet', 'style', 'meta', 'script'];

/** @type {Record<string, string>} Badge text per body node type. */
const NODE_BADGES = {
  box: 'box',
  text: 'text',
  image: 'img',
};

/**
 * Check whether a node is an ancestor of (or equal to) `targetId` in the tree.
 * @param {import('../page-model.js').PageNode} node
 * @param {string} targetId
 * @returns {boolean}
 */
function isAncestorOf(node, targetId) {
  if (node.id === targetId) return true;
  if (node.children) {
    for (const child of node.children) {
      if (isAncestorOf(child, targetId)) return true;
    }
  }
  return false;
}

/**
 * Short preview of a node's content for the tree label.
 * @param {import('../page-model.js').PageNode} node
 * @returns {string}
 */
function nodePreview(node) {
  if (node.type === 'text') {
    const val = node.props?.value || '';
    const short = val.length > 30 ? val.slice(0, 30) + '…' : val;
    return short || `&lt;${node.props?.element || 'p'}&gt;`;
  }
  if (node.type === 'image') {
    return node.props?.alt || node.props?.src || 'img';
  }
  return node.props?.element || 'div';
}

/**
 * Flatten visible tree items (head + body) in display order for keyboard navigation.
 * Each item: { type: 'head'|'body', index?: number, nodeId?: string, el: HTMLElement }
 * @param {HTMLElement} root
 * @returns {Array<{type: string, index?: number, nodeId?: string, el: HTMLElement}>}
 */
function getVisibleItems(root) {
  const items = [];
  root.querySelectorAll('.tree-item').forEach((row) => {
    if (row.offsetParent === null) return; // skip hidden
    if (row.classList.contains('tree-item-head')) {
      const idx = parseInt(row.dataset.headIndex, 10);
      items.push({ type: 'head', index: idx, el: row });
    } else if (row.dataset.nodeId) {
      items.push({ type: 'body', nodeId: row.dataset.nodeId, el: row });
    }
  });
  return items;
}

/**
 * Render the DOM tree panel showing head elements and body node tree.
 * @param {HTMLElement} root - Container to render into.
 * @param {import('../page-model.js').PageDocument} doc - Page document.
 * @param {string|null} selectedNodeId - Currently selected body node ID, or null.
 * @param {number|null} selectedHeadIndex - Currently selected head element index, or null.
 * @param {Object} callbacks - { onSelectNode, onSelectHead, onAddHead, onRemoveHead, onRemoveNode }
 * @param {Set<string>} [collapsed] - Persistent collapsed node IDs (shared across renders).
 */
export function renderTree(root, doc, selectedNodeId, selectedHeadIndex, callbacks, collapsed) {
  root.textContent = '';

  if (!collapsed) collapsed = new Set();
  let focusedIdx = -1; // index into visible items for keyboard nav

  // ---- Head section ----
  const headSection = el('div', { class: 'page-tree-head' });
  headSection.append(el('div', { class: 'tree-section-header', text: '«head»' }));

  const headList = el('div', { class: 'tree-list' });

  const head = doc.head || [];
  for (let i = 0; i < head.length; i++) {
    const elem = head[i];
    const idx = i;
    const row = el('div', {
      class: 'tree-item tree-item-head' + (selectedHeadIndex === idx ? ' selected' : ''),
      'data-head-index': String(idx),
    });
    row.append(el('span', { class: 'tree-badge', text: HEAD_BADGES[elem.type] || '?' }));
    row.append(el('span', { class: 'tree-label', text: headElementLabel(elem) }));

    const delBtn = el('button', {
      class: 'tree-delete',
      title: 'Remove',
      onclick(e) {
        e.stopPropagation();
        callbacks.onRemoveHead(idx);
      },
    }, '×');
    row.append(delBtn);

    row.addEventListener('click', () => callbacks.onSelectHead(idx));
    headList.append(row);
  }

  // + Add button
  const addBtnWrap = el('div', { class: 'tree-add-wrap' });
  const addBtn = el('button', { class: 'tree-add-btn' }, '+ Add');
  const dropdown = el('div', { class: 'tree-add-dropdown' });
  dropdown.style.display = 'none';

  for (const type of HEAD_TYPES) {
    const opt = el('div', {
      class: 'tree-add-option',
      text: type.charAt(0).toUpperCase() + type.slice(1),
      onclick(e) {
        e.stopPropagation();
        dropdown.style.display = 'none';
        callbacks.onAddHead(type);
      },
    });
    dropdown.append(opt);
  }

  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const visible = dropdown.style.display !== 'none';
    dropdown.style.display = visible ? 'none' : 'block';
  });

  document.addEventListener('click', () => {
    dropdown.style.display = 'none';
  });

  addBtnWrap.append(addBtn, dropdown);
  headList.append(addBtnWrap);

  headSection.append(headList);
  root.append(headSection);

  // ---- Body section ----
  const bodySection = el('div', { class: 'page-tree-body' });
  bodySection.append(el('div', { class: 'tree-section-header', text: '«body»' }));

  const bodyList = el('div', { class: 'tree-list' });

  /**
   * Recursively render a node and its children.
   * @param {import('../page-model.js').PageNode} node
   * @param {number} depth
   */
  function renderNode(node, depth) {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsed.has(node.id);

    const row = el('div', {
      class: 'tree-item' + (selectedNodeId === node.id ? ' selected' : ''),
      'data-node-id': node.id,
      style: { paddingLeft: `${depth * 16}px` },
    });

    // Chevron
    if (hasChildren) {
      const chevron = el('span', {
        class: 'tree-chevron',
        text: isCollapsed ? '▶' : '▼',
        onclick(e) {
          e.stopPropagation();
          if (collapsed.has(node.id)) collapsed.delete(node.id);
          else collapsed.add(node.id);
          bodyList.textContent = '';
          if (doc.root) renderNode(doc.root, 0);
        },
      });
      row.append(chevron);
    } else {
      row.append(el('span', { class: 'tree-chevron', text: '' }));
    }

    row.append(el('span', { class: 'tree-badge', text: NODE_BADGES[node.type] || '?' }));
    row.append(el('span', { class: 'tree-label', html: nodePreview(node) }));

    // Add child button (visible on hover, only for box nodes with children)
    if (node.type === 'box' && node.id !== 'root') {
      const addChildBtn = el('button', {
        class: 'tree-add-child',
        title: 'Add child',
        onclick(e) {
          e.stopPropagation();
          callbacks.onAddToNode(node.id);
        },
      }, '+');
      row.append(addChildBtn);
    }

    row.addEventListener('click', () => callbacks.onSelectNode(node.id));
    bodyList.append(row);

    if (hasChildren && !isCollapsed) {
      for (const child of node.children) {
        renderNode(child, depth + 1);
      }
    }
  }

  if (doc.root) {
    if (selectedNodeId && doc.root) {
      autoExpandFor(doc.root, selectedNodeId);
    }
    renderNode(doc.root, 0);
  }

  bodySection.append(bodyList);
  root.append(bodySection);

  // ---- Keyboard navigation ----
  root.addEventListener('keydown', handleKeyDown);

  function handleKeyDown(e) {
    const items = getVisibleItems(root);
    if (items.length === 0) return;

    // Find currently focused item
    if (focusedIdx < 0 || focusedIdx >= items.length) {
      // Default to selected item
      focusedIdx = items.findIndex((it) =>
        (it.type === 'body' && it.nodeId === selectedNodeId) ||
        (it.type === 'head' && it.index === selectedHeadIndex)
      );
      if (focusedIdx < 0) focusedIdx = 0;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocused(items, Math.min(focusedIdx + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocused(items, Math.max(focusedIdx - 1, 0));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const item = items[focusedIdx];
      if (item.type === 'body') {
        // Expand if collapsed
        if (collapsed.has(item.nodeId)) {
          collapsed.delete(item.nodeId);
          bodyList.textContent = '';
          if (doc.root) renderNode(doc.root, 0);
          // Re-find focused
          const newItems = getVisibleItems(root);
          const idx = newItems.findIndex((it) => it.nodeId === item.nodeId);
          if (idx >= 0) setFocused(newItems, idx);
        } else {
          // Move to first child
          const node = findNodeById(doc.root, item.nodeId);
          if (node && node.children && node.children.length > 0) {
            const childIdx = items.findIndex((it) => it.type === 'body' && it.nodeId === node.children[0].id);
            if (childIdx >= 0) setFocused(items, childIdx);
          }
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const item = items[focusedIdx];
      if (item.type === 'body') {
        // If expanded, collapse. If collapsed, move to parent.
        if (collapsed.has(item.nodeId) || !hasVisibleChildren(doc.root, item.nodeId)) {
          // Move to parent
          const parent = findParentId(doc.root, item.nodeId);
          if (parent) {
            const parentIdx = items.findIndex((it) => it.type === 'body' && it.nodeId === parent);
            if (parentIdx >= 0) setFocused(items, parentIdx);
          }
        } else {
          collapsed.add(item.nodeId);
          bodyList.textContent = '';
          if (doc.root) renderNode(doc.root, 0);
          const newItems = getVisibleItems(root);
          const idx = newItems.findIndex((it) => it.nodeId === item.nodeId);
          if (idx >= 0) setFocused(newItems, idx);
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[focusedIdx];
      if (item.type === 'body') callbacks.onSelectNode(item.nodeId);
      else if (item.type === 'head') callbacks.onSelectHead(item.index);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      const item = items[focusedIdx];
      if (item.type === 'body' && item.nodeId !== 'root' && callbacks.onRemoveNode) {
        callbacks.onRemoveNode(item.nodeId);
      } else if (item.type === 'head' && callbacks.onRemoveHead) {
        callbacks.onRemoveHead(item.index);
      }
    }
  }

  function setFocused(items, idx) {
    // Remove old focus
    root.querySelectorAll('.tree-item.focused').forEach((r) => r.classList.remove('focused'));
    focusedIdx = idx;
    const row = items[idx]?.el;
    if (row) {
      row.classList.add('focused');
      row.scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Expand all ancestors of targetId so the selected node is visible.
   * @param {import('../page-model.js').PageNode} node
   * @param {string} targetId
   */
  function autoExpandFor(node, targetId) {
    if (node.children) {
      for (const child of node.children) {
        if (isAncestorOf(child, targetId)) {
          collapsed.delete(node.id);
          autoExpandFor(child, targetId);
        }
      }
    }
  }
}

/**
 * Find a node by id in the tree.
 * @param {import('../page-model.js').PageNode} root
 * @param {string} id
 * @returns {import('../page-model.js').PageNode|null}
 */
function findNodeById(root, id) {
  if (root.id === id) return root;
  if (root.children) {
    for (const c of root.children) {
      const hit = findNodeById(c, id);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Find parent id of a node.
 * @param {import('../page-model.js').PageNode} root
 * @param {string} id
 * @returns {string|null}
 */
function findParentId(root, id) {
  if (root.children) {
    for (const c of root.children) {
      if (c.id === id) return root.id;
      const hit = findParentId(c, id);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Check if a node has visible (non-collapsed) children.
 * @param {import('../page-model.js').PageNode} root
 * @param {string} id
 * @returns {boolean}
 */
function hasVisibleChildren(root, id) {
  const node = findNodeById(root, id);
  return !!(node && node.children && node.children.length > 0);
}
