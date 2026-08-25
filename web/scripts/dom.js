// Small DOM helpers. Light DOM only — no Shadow DOM (spec §3).

/**
 * Escapes HTML special characters in a string to prevent XSS.
 * @param {*} s - The value to escape (converted to string via `String()`).
 * @returns {string} The escaped string safe for insertion into HTML.
 */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

/**
 * Creates an HTML element with the given tag, attributes, and child nodes.
 *
 * Reserved attribute keys:
 * - `class` → sets `className`
 * - `text` → sets `textContent`
 * - `html` → sets `innerHTML`
 * - `on*` (e.g. `onclick`) → adds an event listener (lowercased)
 * - `style` (object) → merged via `Object.assign(node.style, …)`
 *
 * @param {string} tag - The HTML tag name.
 * @param {Object<string, *>} [attrs={}] - Attributes to set on the element.
 * @param {...(Node|string|null|undefined)} children - Child nodes or text to append.
 * @returns {HTMLElement} The created element.
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'style' && typeof v === 'object') {
      Object.assign(node.style, v);
    } else {
      node.setAttribute(k, v);
    }
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined) continue;
    node.append(child.nodeType ? child : document.createTextNode(child));
  }
  return node;
}

/**
 * Creates a Material Symbols icon span.
 * @param {string} name - The icon ligature name (e.g. `"edit"`, `"delete"`).
 * @param {number} [size] - Optional font size in pixels.
 * @returns {HTMLElement} A `<span>` element with the icon.
 */
export function icon(name, size) {
  const span = el('span', { class: 'material-symbols-outlined', text: name });
  if (size) span.style.fontSize = `${size}px`;
  return span;
}
