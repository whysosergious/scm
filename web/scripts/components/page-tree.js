// DOM tree panel for the page editor (spec_page_editor.md §11).
// Shows head elements and recursive body node tree.

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
 * Render the DOM tree panel showing head elements and body node tree.
 * @param {HTMLElement} root - Container to render into.
 * @param {import('../page-model.js').PageDocument} doc - Page document.
 * @param {string|null} selectedNodeId - Currently selected body node ID, or null.
 * @param {number|null} selectedHeadIndex - Currently selected head element index, or null.
 * @param {Object} callbacks - { onSelectNode, onSelectHead, onAddHead, onRemoveHead }
 */
export function renderTree(root, doc, selectedNodeId, selectedHeadIndex, callbacks) {
  root.textContent = '';

  /** @type {Set<string>} IDs of collapsed tree nodes. */
  const collapsed = new Set();

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
    });
    row.append(el('span', { class: 'tree-badge', text: HEAD_BADGES[elem.type] || '?' }));
    row.append(el('span', { class: 'tree-label', text: headElementLabel(elem) }));

    // Hover-revealed delete button
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

  // Close dropdown when clicking outside
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
          // Re-render body list
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

    row.addEventListener('click', () => callbacks.onSelectNode(node.id));
    bodyList.append(row);

    // Render children if expanded
    if (hasChildren && !isCollapsed) {
      for (const child of node.children) {
        renderNode(child, depth + 1);
      }
    }
  }

  if (doc.root) {
    // Auto-expand ancestors of selected node
    if (selectedNodeId && doc.root) {
      autoExpandFor(doc.root, selectedNodeId);
    }
    renderNode(doc.root, 0);
  }

  bodySection.append(bodyList);
  root.append(bodySection);

  /**
   * Expand all ancestors of targetId so the selected node is visible.
   * @param {import('../page-model.js').PageNode} node
   * @param {string} targetId
   */
  function autoExpandFor(node, targetId) {
    if (node.children) {
      for (const child of node.children) {
        if (isAncestorOf(child, targetId)) {
          collapsed.delete(node.id); // ensure this parent is expanded
          autoExpandFor(child, targetId);
        }
      }
    }
  }
}
