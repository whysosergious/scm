// Pure tree model for the JSON form editor (spec_json_edit.md §3).
// No DOM access here — everything is testable without a browser.

export const TYPES = ['string', 'number', 'boolean', 'object', 'array', 'null'];

const SCALARS = new Set(['string', 'number', 'boolean']);

let nextId = 1;

function makeNode(partial) {
  return {
    id: nextId++,
    key: '',
    type: 'null',
    value: null,
    children: [],
    ...partial,
  };
}

/**
 * Parse a JSON document into a Node tree.
 *
 * Implemented as a tiny recursive-descent parser instead of JSON.parse:
 * JS objects reorder integer-like keys ("1", "42", …) to the front, which
 * would destroy document order — the thing this model exists to preserve.
 * Throws SyntaxError on malformed input, like JSON.parse would.
 */
export function parse(text) {
  nextId = 1;
  const s = String(text);
  let i = 0;

  const err = (msg) => new SyntaxError(`${msg || 'Unexpected token'} at position ${i}`);

  function ws() {
    while (i < s.length && ' \t\n\r'.includes(s[i])) i++;
  }

  function literal(word) {
    if (s.startsWith(word, i)) {
      i += word.length;
      return true;
    }
    return false;
  }

  function parseString() {
    // assumes s[i] === '"'
    i++;
    let out = '';
    while (i < s.length) {
      const c = s[i];
      if (c === '"') {
        i++;
        return out;
      }
      if (c === '\\') {
        const e = s[i + 1];
        i += 2;
        switch (e) {
          case '"': out += '"'; break;
          case '\\': out += '\\'; break;
          case '/': out += '/'; break;
          case 'b': out += '\b'; break;
          case 'f': out += '\f'; break;
          case 'n': out += '\n'; break;
          case 'r': out += '\r'; break;
          case 't': out += '\t'; break;
          case 'u': {
            const hex = s.slice(i, i + 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw err('Bad \\u escape');
            out += String.fromCharCode(parseInt(hex, 16));
            i += 4;
            break;
          }
          default:
            throw err(`Bad escape \\${e}`);
        }
        continue;
      }
      if (c < ' ') throw err('Unescaped control character in string');
      out += c;
      i++;
    }
    throw err('Unterminated string');
  }

  const NUM_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;

  function parseNumber() {
    const m = NUM_RE.exec(s.slice(i, i + 40));
    if (!m) throw err('Bad number');
    i += m[0].length;
    return Number(m[0]);
  }

  function parseValue(key) {
    ws();
    if (i >= s.length) throw err('Unexpected end of input');
    const c = s[i];
    if (c === '{') return parseObject(key);
    if (c === '[') return parseArray(key);
    if (c === '"') return makeNode({ key, type: 'string', value: parseString() });
    if (literal('true')) return makeNode({ key, type: 'boolean', value: true });
    if (literal('false')) return makeNode({ key, type: 'boolean', value: false });
    if (literal('null')) return makeNode({ key, type: 'null' });
    if (c === '-' || (c >= '0' && c <= '9')) {
      return makeNode({ key, type: 'number', value: parseNumber() });
    }
    throw err();
  }

  function parseObject(key) {
    i++; // {
    const node = makeNode({ key, type: 'object' });
    ws();
    if (s[i] === '}') {
      i++;
      return node;
    }
    for (;;) {
      ws();
      if (s[i] !== '"') throw err('Expected property name');
      const name = parseString();
      ws();
      if (s[i] !== ':') throw err('Expected ":"');
      i++;
      node.children.push(parseValue(name));
      ws();
      if (s[i] === ',') {
        i++;
        continue;
      }
      if (s[i] === '}') {
        i++;
        return node;
      }
      throw err('Expected "," or "}"');
    }
  }

  function parseArray(key) {
    i++; // [
    const node = makeNode({ key, type: 'array' });
    ws();
    if (s[i] === ']') {
      i++;
      return node;
    }
    for (;;) {
      node.children.push(parseValue(''));
      ws();
      if (s[i] === ',') {
        i++;
        continue;
      }
      if (s[i] === ']') {
        i++;
        return node;
      }
      throw err('Expected "," or "]"');
    }
  }

  const root = parseValue('');
  ws();
  if (i !== s.length) throw err('Trailing content after JSON document');
  return root;
}

/**
 * Serialize the tree to canonical pretty JSON (+ trailing newline).
 *
 * Emits text directly from the tree — routing through a plain object would
 * reorder integer-like keys at enumeration time.
 */
export function serialize(root) {
  return encodeNode(root, 0) + '\n';
}

function encodeNode(node, depth) {
  const pad = '  '.repeat(depth);
  const inner = '  '.repeat(depth + 1);
  switch (node.type) {
    case 'object': {
      if (node.children.length === 0) return '{}';
      const rows = node.children.map(
        (c) => `${inner}${JSON.stringify(c.key)}: ${encodeNode(c, depth + 1)}`,
      );
      return `{\n${rows.join(',\n')}\n${pad}}`;
    }
    case 'array': {
      if (node.children.length === 0) return '[]';
      const rows = node.children.map((c) => `${inner}${encodeNode(c, depth + 1)}`);
      return `[\n${rows.join(',\n')}\n${pad}]`;
    }
    case 'null':
      return 'null';
    case 'boolean':
      return node.value ? 'true' : 'false';
    case 'number':
      return Number.isFinite(node.value) ? String(node.value) : '0';
    case 'string':
      return JSON.stringify(node.value);
    default:
      return 'null';
  }
}

export function isContainer(node) {
  return node.type === 'object' || node.type === 'array';
}

export function childCount(node) {
  return node.children ? node.children.length : 0;
}

/** Depth-first search by node id. */
export function findNode(root, id) {
  if (root.id === id) return root;
  for (const c of root.children) {
    const hit = findNode(c, id);
    if (hit) return hit;
  }
  return null;
}

/** The immediate parent of the node with the given id, or null for root. */
export function findParent(root, id) {
  for (const c of root.children) {
    if (c.id === id) return root;
    const hit = findParent(c, id);
    if (hit) return hit;
  }
  return null;
}

/** Is `id` found anywhere inside `subtree` (inclusive)? */
export function isWithin(subtree, id) {
  if (subtree.id === id) return true;
  return subtree.children.some((c) => isWithin(c, id));
}

/**
 * Rename a child of an object node.
 * Returns {ok:true} or {ok:false, error:'...'} without mutating on failure.
 */
export function renameKey(parent, child, newKey) {
  const name = String(newKey ?? '').trim();
  if (!name) return { ok: false, error: 'Property name must not be empty.' };
  const clash = parent.children.some((c) => c !== child && c.key === name);
  if (clash) return { ok: false, error: `A property named “${name}” already exists.` };
  child.key = name;
  return { ok: true };
}

/** First available `base`, `base2`, `base3`, … among an object's children. */
export function uniqueKey(parent, base = 'property') {
  const taken = new Set(parent.children.map((c) => c.key));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}${n}`)) n++;
  return `${base}${n}`;
}

/**
 * Convert a node to another type applying the smart-coercion table
 * (spec_json_edit.md §9). Mutates the node.
 */
export function convertType(node, type) {
  if (!TYPES.includes(type) || node.type === type) return;
  const asObject = () =>
    node.type === 'array'
      ? node.children.map((c, i) => {
          c.key = String(i);
          return c;
        })
      : [];
  const asArray = () =>
    node.type === 'object'
      ? (node.children.forEach((c) => (c.key = '')), node.children)
      : [];

  switch (type) {
    case 'string': {
      const v =
        node.type === 'string'
          ? node.value
          : SCALARS.has(node.type)
            ? String(node.value)
            : encodeCompact(node);
      become(node, 'string', { value: v });
      break;
    }
    case 'number': {
      let v = 0;
      if (node.type === 'number') v = node.value;
      else if (node.type === 'boolean') v = node.value ? 1 : 0;
      else if (node.type === 'string') v = numOrZero(node.value);
      else v = numOrZero(encodeCompact(node));
      become(node, 'number', { value: v });
      break;
    }
    case 'boolean': {
      let v = false;
      if (node.type === 'boolean') v = node.value;
      else if (node.type === 'string') v = node.value !== '' && node.value !== 'false';
      else if (node.type === 'number') v = node.value !== 0;
      else if (isContainer(node)) v = node.children.length > 0;
      become(node, 'boolean', { value: v });
      break;
    }
    case 'object':
      become(node, 'object', { children: node.type === 'array' ? asObject() : [] });
      break;
    case 'array':
      become(node, 'array', { children: asArray() });
      break;
    case 'null':
      become(node, 'null', {});
      break;
  }
}

function become(node, type, patch) {
  node.type = type;
  node.value = null;
  node.children = [];
  Object.assign(node, patch);
}

function numOrZero(s) {
  const n = Number(s);
  return Number.isNaN(n) ? 0 : n;
}

/** Compact single-line JSON encoding (used for coercion to string/number). */
function encodeCompact(node) {
  switch (node.type) {
    case 'object':
      return `{${node.children
        .map((c) => `${JSON.stringify(c.key)}:${encodeCompact(c)}`)
        .join(',')}}`;
    case 'array':
      return `[${node.children.map(encodeCompact).join(',')}]`;
    case 'null':
      return 'null';
    case 'boolean':
      return node.value ? 'true' : 'false';
    case 'number':
      return Number.isFinite(node.value) ? String(node.value) : '0';
    default:
      return JSON.stringify(node.value);
  }
}

/**
 * Move `node` into `targetParent` at child `index`.
 *
 * `index` uses post-removal semantics: it counts positions in the target
 * list as it will be WITHOUT the dragged node (this is what the drag layer
 * computes from the placeholder position).
 *
 * Rules (spec_json_edit.md §8):
 * - the target parent may not be the node itself or inside its subtree;
 * - dropping into the node's own gap (same parent, index === its position
 *   after removal) is a no-op — in post-removal index space the gaps before
 *   and after the source are the SAME index;
 * - moving into an array clears the key; moving a keyless entry into an
 *   object generates a unique key;
 * - returns true when the tree changed.
 */
export function moveNode(root, node, targetParent, index) {
  if (!isContainer(targetParent)) return false;
  if (isWithin(node, targetParent.id)) return false; // cycle guard

  const oldParent = findParent(root, node.id);
  if (!oldParent) return false;

  const from = oldParent.children.indexOf(node);
  if (oldParent === targetParent && index === from) {
    return false; // dropped back into its own gap
  }

  oldParent.children.splice(from, 1);
  const at = Math.max(0, Math.min(index, targetParent.children.length));

  if (targetParent.type === 'array') {
    node.key = '';
  } else if (!node.key) {
    node.key = uniqueKey(targetParent, 'item');
  }

  targetParent.children.splice(at, 0, node);
  return true;
}

/** Remove a node from its parent. Returns true when removed. */
export function removeNode(root, node) {
  const parent = findParent(root, node.id);
  if (!parent) return false;
  parent.children.splice(parent.children.indexOf(node), 1);
  return true;
}

function deepClone(node) {
  const copy = makeNode({
    key: node.key,
    type: node.type,
    value: node.value,
  });
  copy.children = node.children.map(deepClone);
  return copy;
}

/**
 * Deep-copy `node` and insert the copy directly after it in the same parent
 * (spec_json_edit.md §7). Object copies get a unique key derived from the
 * original (`name` → `name2`); array copies need none. Returns the new node
 * or null when `node` has no parent (root).
 */
export function cloneNode(root, node) {
  const parent = findParent(root, node.id);
  if (!parent) return null;
  const copy = deepClone(node);
  if (parent.type === 'object') {
    copy.key = uniqueKey(parent, node.key || 'copy');
  }
  parent.children.splice(parent.children.indexOf(node) + 1, 0, copy);
  return copy;
}

/** Append a fresh child of `type` to a container; returns the child. */
export function addChild(parent, type = 'string', key = undefined) {
  const child = makeNode({ key: '', type: 'null' });
  if (SCALARS.has(type)) child.value = type === 'string' ? '' : type === 'number' ? 0 : false;
  child.type = type;
  if (type === 'object') child.children = [];
  if (type === 'array') child.children = [];
  child.key =
    parent.type === 'array' ? '' : key ?? uniqueKey(parent, type === 'object' || type === 'array' ? 'group' : 'property');
  parent.children.push(child);
  return child;
}
