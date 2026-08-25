var Wl = Object.defineProperty;
var Pl = (t, e, n) => e in t ? Wl(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var O = (t, e, n) => Pl(t, typeof e != "symbol" ? e + "" : e, n);
function L(t) {
  this.content = t;
}
L.prototype = {
  constructor: L,
  find: function(t) {
    for (var e = 0; e < this.content.length; e += 2)
      if (this.content[e] === t) return e;
    return -1;
  },
  // :: (string) → ?any
  // Retrieve the value stored under `key`, or return undefined when
  // no such key exists.
  get: function(t) {
    var e = this.find(t);
    return e == -1 ? void 0 : this.content[e + 1];
  },
  // :: (string, any, ?string) → OrderedMap
  // Create a new map by replacing the value of `key` with a new
  // value, or adding a binding to the end of the map. If `newKey` is
  // given, the key of the binding will be replaced with that key.
  update: function(t, e, n) {
    var r = n && n != t ? this.remove(n) : this, i = r.find(t), u = r.content.slice();
    return i == -1 ? u.push(n || t, e) : (u[i + 1] = e, n && (u[i] = n)), new L(u);
  },
  // :: (string) → OrderedMap
  // Return a map with the given key removed, if it existed.
  remove: function(t) {
    var e = this.find(t);
    if (e == -1) return this;
    var n = this.content.slice();
    return n.splice(e, 2), new L(n);
  },
  // :: (string, any) → OrderedMap
  // Add a new key to the start of the map.
  addToStart: function(t, e) {
    return new L([t, e].concat(this.remove(t).content));
  },
  // :: (string, any) → OrderedMap
  // Add a new key to the end of the map.
  addToEnd: function(t, e) {
    var n = this.remove(t).content.slice();
    return n.push(t, e), new L(n);
  },
  // :: (string, string, any) → OrderedMap
  // Add a key after the given key. If `place` is not found, the new
  // key is added to the end.
  addBefore: function(t, e, n) {
    var r = this.remove(e), i = r.content.slice(), u = r.find(t);
    return i.splice(u == -1 ? i.length : u, 0, e, n), new L(i);
  },
  // :: ((key: string, value: any))
  // Call the given function for each key/value pair in the map, in
  // order.
  forEach: function(t) {
    for (var e = 0; e < this.content.length; e += 2)
      t(this.content[e], this.content[e + 1]);
  },
  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a new map by prepending the keys in this map that don't
  // appear in `map` before the keys in `map`.
  prepend: function(t) {
    return t = L.from(t), t.size ? new L(t.content.concat(this.subtract(t).content)) : this;
  },
  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a new map by appending the keys in this map that don't
  // appear in `map` after the keys in `map`.
  append: function(t) {
    return t = L.from(t), t.size ? new L(this.subtract(t).content.concat(t.content)) : this;
  },
  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a map containing all the keys in this map that don't
  // appear in `map`.
  subtract: function(t) {
    var e = this;
    t = L.from(t);
    for (var n = 0; n < t.content.length; n += 2)
      e = e.remove(t.content[n]);
    return e;
  },
  // :: () → Object
  // Turn ordered map into a plain object.
  toObject: function() {
    var t = {};
    return this.forEach(function(e, n) {
      t[e] = n;
    }), t;
  },
  // :: number
  // The amount of keys in this map.
  get size() {
    return this.content.length >> 1;
  }
};
L.from = function(t) {
  if (t instanceof L) return t;
  var e = [];
  if (t) for (var n in t) e.push(n, t[n]);
  return new L(e);
};
function mo(t, e, n) {
  for (let r = 0; ; r++) {
    if (r == t.childCount || r == e.childCount)
      return t.childCount == e.childCount ? null : n;
    let i = t.child(r), u = e.child(r);
    if (i == u) {
      n += i.nodeSize;
      continue;
    }
    if (!i.sameMarkup(u))
      return n;
    if (i.isText && i.text != u.text) {
      let o = i.text, s = u.text, l = 0;
      for (; o[l] == s[l]; l++)
        n++;
      return l && l < o.length && l < s.length && ko(o.charCodeAt(l - 1)) && bo(o.charCodeAt(l)) && n--, n;
    }
    if (i.content.size || u.content.size) {
      let o = mo(i.content, u.content, n + 1);
      if (o != null)
        return o;
    }
    n += i.nodeSize;
  }
}
function go(t, e, n, r) {
  for (let i = t.childCount, u = e.childCount; ; ) {
    if (i == 0 || u == 0)
      return i == u ? null : { a: n, b: r };
    let o = t.child(--i), s = e.child(--u), l = o.nodeSize;
    if (o == s) {
      n -= l, r -= l;
      continue;
    }
    if (!o.sameMarkup(s))
      return { a: n, b: r };
    if (o.isText && o.text != s.text) {
      let c = o.text, a = s.text, f = c.length, p = a.length;
      for (; f > 0 && p > 0 && c[f - 1] == a[p - 1]; )
        f--, p--, n--, r--;
      return f && p && f < c.length && ko(c.charCodeAt(f - 1)) && bo(c.charCodeAt(f)) && (n++, r++), { a: n, b: r };
    }
    if (o.content.size || s.content.size) {
      let c = go(o.content, s.content, n - 1, r - 1);
      if (c)
        return c;
    }
    n -= l, r -= l;
  }
}
function bo(t) {
  return t >= 56320 && t < 57344;
}
function ko(t) {
  return t >= 55296 && t < 56320;
}
class y {
  /**
  @internal
  */
  constructor(e, n) {
    if (this.content = e, this.size = n || 0, n == null)
      for (let r = 0; r < e.length; r++)
        this.size += e[r].nodeSize;
  }
  /**
  Invoke a callback for all descendant nodes between the given two
  positions (relative to start of this fragment). Doesn't descend
  into a node when the callback returns `false`.
  */
  nodesBetween(e, n, r, i = 0, u) {
    for (let o = 0, s = 0; s < n; o++) {
      let l = this.content[o], c = s + l.nodeSize;
      if (c > e && r(l, i + s, u || null, o) !== !1 && l.content.size) {
        let a = s + 1;
        l.nodesBetween(Math.max(0, e - a), Math.min(l.content.size, n - a), r, i + a);
      }
      s = c;
    }
  }
  /**
  Call the given callback for every descendant node. `pos` will be
  relative to the start of the fragment. The callback may return
  `false` to prevent traversal of a given node's children.
  */
  descendants(e) {
    this.nodesBetween(0, this.size, e);
  }
  /**
  Extract the text between `from` and `to`. See the same method on
  [`Node`](https://prosemirror.net/docs/ref/#model.Node.textBetween).
  */
  textBetween(e, n, r, i) {
    let u = "", o = !0;
    return this.nodesBetween(e, n, (s, l) => {
      let c = s.isText ? s.text.slice(Math.max(e, l) - l, n - l) : s.isLeaf ? i ? typeof i == "function" ? i(s) : i : s.type.spec.leafText ? s.type.spec.leafText(s) : "" : "";
      s.isBlock && (s.isLeaf && c || s.isTextblock) && r && (o ? o = !1 : u += r), u += c;
    }, 0), u;
  }
  /**
  Create a new fragment containing the combined content of this
  fragment and the other.
  */
  append(e) {
    if (!e.size)
      return this;
    if (!this.size)
      return e;
    let n = this.lastChild, r = e.firstChild, i = this.content.slice(), u = 0;
    for (n.isText && n.sameMarkup(r) && (i[i.length - 1] = n.withText(n.text + r.text), u = 1); u < e.content.length; u++)
      i.push(e.content[u]);
    return new y(i, this.size + e.size);
  }
  /**
  Cut out the sub-fragment between the two given positions.
  */
  cut(e, n = this.size) {
    if (e == 0 && n == this.size)
      return this;
    let r = [], i = 0;
    if (n > e)
      for (let u = 0, o = 0; o < n; u++) {
        let s = this.content[u], l = o + s.nodeSize;
        l > e && ((o < e || l > n) && (s.isText ? s = s.cut(Math.max(0, e - o), Math.min(s.text.length, n - o)) : s = s.cut(Math.max(0, e - o - 1), Math.min(s.content.size, n - o - 1))), r.push(s), i += s.nodeSize), o = l;
      }
    return new y(r, i);
  }
  /**
  @internal
  */
  cutByIndex(e, n) {
    return e == n ? y.empty : e == 0 && n == this.content.length ? this : new y(this.content.slice(e, n));
  }
  /**
  Create a new fragment in which the node at the given index is
  replaced by the given node.
  */
  replaceChild(e, n) {
    let r = this.content[e];
    if (r == n)
      return this;
    let i = this.content.slice(), u = this.size + n.nodeSize - r.nodeSize;
    return i[e] = n, new y(i, u);
  }
  /**
  Create a new fragment by prepending the given node to this
  fragment.
  */
  addToStart(e) {
    return new y([e].concat(this.content), this.size + e.nodeSize);
  }
  /**
  Create a new fragment by appending the given node to this
  fragment.
  */
  addToEnd(e) {
    return new y(this.content.concat(e), this.size + e.nodeSize);
  }
  /**
  Compare this fragment to another one.
  */
  eq(e) {
    if (this.content.length != e.content.length)
      return !1;
    for (let n = 0; n < this.content.length; n++)
      if (!this.content[n].eq(e.content[n]))
        return !1;
    return !0;
  }
  /**
  The first child of the fragment, or `null` if it is empty.
  */
  get firstChild() {
    return this.content.length ? this.content[0] : null;
  }
  /**
  The last child of the fragment, or `null` if it is empty.
  */
  get lastChild() {
    return this.content.length ? this.content[this.content.length - 1] : null;
  }
  /**
  The number of child nodes in this fragment.
  */
  get childCount() {
    return this.content.length;
  }
  /**
  Get the child node at the given index. Raise an error when the
  index is out of range.
  */
  child(e) {
    let n = this.content[e];
    if (!n)
      throw new RangeError("Index " + e + " out of range for " + this);
    return n;
  }
  /**
  Get the child node at the given index, if it exists.
  */
  maybeChild(e) {
    return this.content[e] || null;
  }
  /**
  Call `f` for every child node, passing the node, its offset
  into this parent node, and its index.
  */
  forEach(e) {
    for (let n = 0, r = 0; n < this.content.length; n++) {
      let i = this.content[n];
      e(i, r, n), r += i.nodeSize;
    }
  }
  /**
  Find the first position at which this fragment and another
  fragment differ, or `null` if they are the same.
  */
  findDiffStart(e, n = 0) {
    return mo(this, e, n);
  }
  /**
  Find the first position, searching from the end, at which this
  fragment and the given fragment differ, or `null` if they are
  the same. Since this position will not be the same in both
  nodes, an object with two separate positions is returned.
  */
  findDiffEnd(e, n = this.size, r = e.size) {
    return go(this, e, n, r);
  }
  /**
  Find the index and inner offset corresponding to a given relative
  position in this fragment. The result object will be reused
  (overwritten) the next time the function is called. @internal
  */
  findIndex(e) {
    if (e == 0)
      return Cn(0, e);
    if (e == this.size)
      return Cn(this.content.length, e);
    if (e > this.size || e < 0)
      throw new RangeError(`Position ${e} outside of fragment (${this})`);
    for (let n = 0, r = 0; ; n++) {
      let i = this.child(n), u = r + i.nodeSize;
      if (u >= e)
        return u == e ? Cn(n + 1, u) : Cn(n, r);
      r = u;
    }
  }
  /**
  Return a debugging string that describes this fragment.
  */
  toString() {
    return "<" + this.toStringInner() + ">";
  }
  /**
  @internal
  */
  toStringInner() {
    return this.content.join(", ");
  }
  /**
  Create a JSON-serializeable representation of this fragment.
  */
  toJSON() {
    return this.content.length ? this.content.map((e) => e.toJSON()) : null;
  }
  /**
  Deserialize a fragment from its JSON representation.
  */
  static fromJSON(e, n) {
    if (!n)
      return y.empty;
    if (!Array.isArray(n))
      throw new RangeError("Invalid input for Fragment.fromJSON");
    return y.fromArray(n.map(e.nodeFromJSON));
  }
  /**
  Build a fragment from an array of nodes. Ensures that adjacent
  text nodes with the same marks are joined together.
  */
  static fromArray(e) {
    if (!e.length)
      return y.empty;
    let n, r = 0;
    for (let i = 0; i < e.length; i++) {
      let u = e[i];
      r += u.nodeSize, i && u.isText && e[i - 1].sameMarkup(u) ? (n || (n = e.slice(0, i)), n[n.length - 1] = u.withText(n[n.length - 1].text + u.text)) : n && n.push(u);
    }
    return new y(n || e, r);
  }
  /**
  Create a fragment from something that can be interpreted as a
  set of nodes. For `null`, it returns the empty fragment. For a
  fragment, the fragment itself. For a node or array of nodes, a
  fragment containing those nodes.
  */
  static from(e) {
    if (!e)
      return y.empty;
    if (e instanceof y)
      return e;
    if (Array.isArray(e))
      return this.fromArray(e);
    if (e.attrs)
      return new y([e], e.nodeSize);
    throw new RangeError("Can not convert " + e + " to a Fragment" + (e.nodesBetween ? " (looks like multiple versions of prosemirror-model were loaded)" : ""));
  }
}
y.empty = new y([], 0);
const sr = { index: 0, offset: 0 };
function Cn(t, e) {
  return sr.index = t, sr.offset = e, sr;
}
function Nn(t, e) {
  if (t === e)
    return !0;
  if (!(t && typeof t == "object") || !(e && typeof e == "object"))
    return !1;
  let n = Array.isArray(t);
  if (Array.isArray(e) != n)
    return !1;
  if (n) {
    if (t.length != e.length)
      return !1;
    for (let r = 0; r < t.length; r++)
      if (!Nn(t[r], e[r]))
        return !1;
  } else {
    for (let r in t)
      if (!(r in e) || !Nn(t[r], e[r]))
        return !1;
    for (let r in e)
      if (!(r in t))
        return !1;
  }
  return !0;
}
class B {
  /**
  @internal
  */
  constructor(e, n) {
    this.type = e, this.attrs = n;
  }
  /**
  Given a set of marks, create a new set which contains this one as
  well, in the right position. If this mark is already in the set,
  the set itself is returned. If any marks that are set to be
  [exclusive](https://prosemirror.net/docs/ref/#model.MarkSpec.excludes) with this mark are present,
  those are replaced by this one.
  */
  addToSet(e) {
    let n, r = !1;
    for (let i = 0; i < e.length; i++) {
      let u = e[i];
      if (this.eq(u))
        return e;
      if (this.type.excludes(u.type))
        n || (n = e.slice(0, i));
      else {
        if (u.type.excludes(this.type))
          return e;
        !r && u.type.rank > this.type.rank && (n || (n = e.slice(0, i)), n.push(this), r = !0), n && n.push(u);
      }
    }
    return n || (n = e.slice()), r || n.push(this), n;
  }
  /**
  Remove this mark from the given set, returning a new set. If this
  mark is not in the set, the set itself is returned.
  */
  removeFromSet(e) {
    for (let n = 0; n < e.length; n++)
      if (this.eq(e[n]))
        return e.slice(0, n).concat(e.slice(n + 1));
    return e;
  }
  /**
  Test whether this mark is in the given set of marks.
  */
  isInSet(e) {
    for (let n = 0; n < e.length; n++)
      if (this.eq(e[n]))
        return !0;
    return !1;
  }
  /**
  Test whether this mark has the same type and attributes as
  another mark.
  */
  eq(e) {
    return this == e || this.type == e.type && Nn(this.attrs, e.attrs);
  }
  /**
  Convert this mark to a JSON-serializeable representation.
  */
  toJSON() {
    let e = { type: this.type.name };
    for (let n in this.attrs) {
      e.attrs = this.attrs;
      break;
    }
    return e;
  }
  /**
  Deserialize a mark from JSON.
  */
  static fromJSON(e, n) {
    if (!n)
      throw new RangeError("Invalid input for Mark.fromJSON");
    let r = e.marks[n.type];
    if (!r)
      throw new RangeError(`There is no mark type ${n.type} in this schema`);
    let i = r.create(n.attrs);
    return r.checkAttrs(i.attrs), i;
  }
  /**
  Test whether two sets of marks are identical.
  */
  static sameSet(e, n) {
    if (e == n)
      return !0;
    if (e.length != n.length)
      return !1;
    for (let r = 0; r < e.length; r++)
      if (!e[r].eq(n[r]))
        return !1;
    return !0;
  }
  /**
  Create a properly sorted mark set from null, a single mark, or an
  unsorted array of marks.
  */
  static setFrom(e) {
    if (!e || Array.isArray(e) && e.length == 0)
      return B.none;
    if (e instanceof B)
      return [e];
    let n = e.slice();
    return n.sort((r, i) => r.type.rank - i.type.rank), n;
  }
}
B.none = [];
class Yt extends Error {
}
class F {
  /**
  Create a slice. When specifying a non-zero open depth, you must
  make sure that there are nodes of at least that depth at the
  appropriate side of the fragment—i.e. if the fragment is an
  empty paragraph node, `openStart` and `openEnd` can't be greater
  than 1.
  
  It is not necessary for the content of open nodes to conform to
  the schema's content constraints, though it should be a valid
  start/end/middle for such a node, depending on which sides are
  open.
  */
  constructor(e, n, r) {
    this.content = e, this.openStart = n, this.openEnd = r;
  }
  /**
  The size this slice would add when inserted into a document.
  */
  get size() {
    return this.content.size - this.openStart - this.openEnd;
  }
  /**
  @internal
  */
  insertAt(e, n) {
    let r = Co(this.content, e + this.openStart, n, this.openStart + 1, this.openEnd + 1);
    return r && new F(r, this.openStart, this.openEnd);
  }
  /**
  @internal
  */
  removeBetween(e, n) {
    return new F(xo(this.content, e + this.openStart, n + this.openStart), this.openStart, this.openEnd);
  }
  /**
  Tests whether this slice is equal to another slice.
  */
  eq(e) {
    return this.content.eq(e.content) && this.openStart == e.openStart && this.openEnd == e.openEnd;
  }
  /**
  @internal
  */
  toString() {
    return this.content + "(" + this.openStart + "," + this.openEnd + ")";
  }
  /**
  Convert a slice to a JSON-serializable representation.
  */
  toJSON() {
    if (!this.content.size)
      return null;
    let e = { content: this.content.toJSON() };
    return this.openStart > 0 && (e.openStart = this.openStart), this.openEnd > 0 && (e.openEnd = this.openEnd), e;
  }
  /**
  Deserialize a slice from its JSON representation.
  */
  static fromJSON(e, n) {
    if (!n)
      return F.empty;
    let r = n.openStart || 0, i = n.openEnd || 0;
    if (typeof r != "number" || typeof i != "number")
      throw new RangeError("Invalid input for Slice.fromJSON");
    return new F(y.fromJSON(e, n.content), r, i);
  }
  /**
  Create a slice from a fragment by taking the maximum possible
  open value on both side of the fragment.
  */
  static maxOpen(e, n = !0) {
    let r = 0, i = 0;
    for (let u = e.firstChild; u && !u.isLeaf && (n || !u.type.spec.isolating); u = u.firstChild)
      r++;
    for (let u = e.lastChild; u && !u.isLeaf && (n || !u.type.spec.isolating); u = u.lastChild)
      i++;
    return new F(e, r, i);
  }
}
F.empty = new F(y.empty, 0, 0);
function xo(t, e, n) {
  let { index: r, offset: i } = t.findIndex(e), u = t.maybeChild(r), { index: o, offset: s } = t.findIndex(n);
  if (i == e || u.isText) {
    if (s != n && !t.child(o).isText)
      throw new RangeError("Removing non-flat range");
    return t.cut(0, e).append(t.cut(n));
  }
  if (r != o)
    throw new RangeError("Removing non-flat range");
  return t.replaceChild(r, u.copy(xo(u.content, e - i - 1, n - i - 1)));
}
function Co(t, e, n, r, i, u) {
  let { index: o, offset: s } = t.findIndex(e), l = t.maybeChild(o);
  if (s == e || l.isText)
    return u && r <= 0 && i <= 0 && !u.canReplace(o, o, n) ? null : t.cut(0, e).append(n).append(t.cut(e));
  let c = Co(l.content, e - s - 1, n, o == 0 ? r - 1 : 0, o == t.childCount - 1 ? i - 1 : 0, l);
  return c && t.replaceChild(o, l.copy(c));
}
function Jl(t, e, n) {
  if (n.openStart > t.depth)
    throw new Yt("Inserted content deeper than insertion position");
  if (t.depth - n.openStart != e.depth - n.openEnd)
    throw new Yt("Inconsistent open depths");
  return yo(t, e, n, 0);
}
function yo(t, e, n, r) {
  let i = t.index(r), u = t.node(r);
  if (i == e.index(r) && r < t.depth - n.openStart) {
    let o = yo(t, e, n, r + 1);
    return u.copy(u.content.replaceChild(i, o));
  } else if (n.content.size)
    if (!n.openStart && !n.openEnd && t.depth == r && e.depth == r) {
      let o = t.parent, s = o.content;
      return lt(o, s.cut(0, t.parentOffset).append(n.content).append(s.cut(e.parentOffset)));
    } else {
      let { start: o, end: s } = Gl(n, t);
      return lt(u, Eo(t, o, s, e, r));
    }
  else return lt(u, On(t, e, r));
}
function Do(t, e) {
  if (!e.type.compatibleContent(t.type))
    throw new Yt("Cannot join " + e.type.name + " onto " + t.type.name);
}
function Qr(t, e, n) {
  let r = t.node(n);
  return Do(r, e.node(n)), r;
}
function st(t, e) {
  let n = e.length - 1;
  n >= 0 && t.isText && t.sameMarkup(e[n]) ? e[n] = t.withText(e[n].text + t.text) : e.push(t);
}
function Pt(t, e, n, r) {
  let i = (e || t).node(n), u = 0, o = e ? e.index(n) : i.childCount;
  t && (u = t.index(n), t.depth > n ? u++ : t.textOffset && (st(t.nodeAfter, r), u++));
  for (let s = u; s < o; s++)
    st(i.child(s), r);
  e && e.depth == n && e.textOffset && st(e.nodeBefore, r);
}
function lt(t, e) {
  if (!t.type.validContent(e))
    throw new Yt("Invalid content for node " + t.type.name);
  return t.copy(e);
}
function Eo(t, e, n, r, i) {
  let u = t.depth > i && Qr(t, e, i + 1), o = r.depth > i && Qr(n, r, i + 1), s = [];
  return Pt(null, t, i, s), u && o && e.index(i) == n.index(i) ? (Do(u, o), st(lt(u, Eo(t, e, n, r, i + 1)), s)) : (u && st(lt(u, On(t, e, i + 1)), s), Pt(e, n, i, s), o && st(lt(o, On(n, r, i + 1)), s)), Pt(r, null, i, s), new y(s);
}
function On(t, e, n) {
  let r = [];
  if (Pt(null, t, n, r), t.depth > n) {
    let i = Qr(t, e, n + 1);
    st(lt(i, On(t, e, n + 1)), r);
  }
  return Pt(e, null, n, r), new y(r);
}
function Gl(t, e) {
  let n = e.depth - t.openStart, i = e.node(n).copy(t.content);
  for (let u = n - 1; u >= 0; u--)
    i = e.node(u).copy(y.from(i));
  return {
    start: i.resolveNoCache(t.openStart + n),
    end: i.resolveNoCache(i.content.size - t.openEnd - n)
  };
}
class Ht {
  /**
  @internal
  */
  constructor(e, n, r) {
    this.pos = e, this.path = n, this.parentOffset = r, this.depth = n.length / 3 - 1;
  }
  /**
  @internal
  */
  resolveDepth(e) {
    return e == null ? this.depth : e < 0 ? this.depth + e : e;
  }
  /**
  The parent node that the position points into. Note that even if
  a position points into a text node, that node is not considered
  the parent—text nodes are ‘flat’ in this model, and have no content.
  */
  get parent() {
    return this.node(this.depth);
  }
  /**
  The root node in which the position was resolved.
  */
  get doc() {
    return this.node(0);
  }
  /**
  The ancestor node at the given level. `p.node(p.depth)` is the
  same as `p.parent`.
  */
  node(e) {
    return this.path[this.resolveDepth(e) * 3];
  }
  /**
  The index into the ancestor at the given level. If this points
  at the 3rd node in the 2nd paragraph on the top level, for
  example, `p.index(0)` is 1 and `p.index(1)` is 2.
  */
  index(e) {
    return this.path[this.resolveDepth(e) * 3 + 1];
  }
  /**
  The index pointing after this position into the ancestor at the
  given level.
  */
  indexAfter(e) {
    return e = this.resolveDepth(e), this.index(e) + (e == this.depth && !this.textOffset ? 0 : 1);
  }
  /**
  The (absolute) position at the start of the node at the given
  level.
  */
  start(e) {
    return e = this.resolveDepth(e), e == 0 ? 0 : this.path[e * 3 - 1] + 1;
  }
  /**
  The (absolute) position at the end of the node at the given
  level.
  */
  end(e) {
    return e = this.resolveDepth(e), this.start(e) + this.node(e).content.size;
  }
  /**
  The (absolute) position directly before the wrapping node at the
  given level, or, when `depth` is `this.depth + 1`, the original
  position.
  */
  before(e) {
    if (e = this.resolveDepth(e), !e)
      throw new RangeError("There is no position before the top-level node");
    return e == this.depth + 1 ? this.pos : this.path[e * 3 - 1];
  }
  /**
  The (absolute) position directly after the wrapping node at the
  given level, or the original position when `depth` is `this.depth + 1`.
  */
  after(e) {
    if (e = this.resolveDepth(e), !e)
      throw new RangeError("There is no position after the top-level node");
    return e == this.depth + 1 ? this.pos : this.path[e * 3 - 1] + this.path[e * 3].nodeSize;
  }
  /**
  When this position points into a text node, this returns the
  distance between the position and the start of the text node.
  Will be zero for positions that point between nodes.
  */
  get textOffset() {
    return this.pos - this.path[this.path.length - 1];
  }
  /**
  Get the node directly after the position, if any. If the position
  points into a text node, only the part of that node after the
  position is returned.
  */
  get nodeAfter() {
    let e = this.parent, n = this.index(this.depth);
    if (n == e.childCount)
      return null;
    let r = this.pos - this.path[this.path.length - 1], i = e.child(n);
    return r ? e.child(n).cut(r) : i;
  }
  /**
  Get the node directly before the position, if any. If the
  position points into a text node, only the part of that node
  before the position is returned.
  */
  get nodeBefore() {
    let e = this.index(this.depth), n = this.pos - this.path[this.path.length - 1];
    return n ? this.parent.child(e).cut(0, n) : e == 0 ? null : this.parent.child(e - 1);
  }
  /**
  Get the position at the given index in the parent node at the
  given depth (which defaults to `this.depth`).
  */
  posAtIndex(e, n) {
    n = this.resolveDepth(n);
    let r = this.path[n * 3], i = n == 0 ? 0 : this.path[n * 3 - 1] + 1;
    for (let u = 0; u < e; u++)
      i += r.child(u).nodeSize;
    return i;
  }
  /**
  Get the marks at this position, factoring in the surrounding
  marks' [`inclusive`](https://prosemirror.net/docs/ref/#model.MarkSpec.inclusive) property. If the
  position is at the start of a non-empty node, the marks of the
  node after it (if any) are returned.
  */
  marks() {
    let e = this.parent, n = this.index();
    if (e.content.size == 0)
      return B.none;
    if (this.textOffset)
      return e.child(n).marks;
    let r = e.maybeChild(n - 1), i = e.maybeChild(n);
    if (!r) {
      let s = r;
      r = i, i = s;
    }
    let u = r.marks;
    for (var o = 0; o < u.length; o++)
      u[o].type.spec.inclusive === !1 && (!i || !u[o].isInSet(i.marks)) && (u = u[o--].removeFromSet(u));
    return u;
  }
  /**
  Get the marks after the current position, if any, except those
  that are non-inclusive and not present at position `$end`. This
  is mostly useful for getting the set of marks to preserve after a
  deletion. Will return `null` if this position is at the end of
  its parent node or its parent node isn't a textblock (in which
  case no marks should be preserved).
  */
  marksAcross(e) {
    let n = this.parent.maybeChild(this.index());
    if (!n || !n.isInline)
      return null;
    let r = n.marks, i = e.parent.maybeChild(e.index());
    for (var u = 0; u < r.length; u++)
      r[u].type.spec.inclusive === !1 && (!i || !r[u].isInSet(i.marks)) && (r = r[u--].removeFromSet(r));
    return r;
  }
  /**
  The depth up to which this position and the given (non-resolved)
  position share the same parent nodes.
  */
  sharedDepth(e) {
    for (let n = this.depth; n > 0; n--)
      if (this.start(n) <= e && this.end(n) >= e)
        return n;
    return 0;
  }
  /**
  Returns a range based on the place where this position and the
  given position diverge around block content. If both point into
  the same textblock, for example, a range around that textblock
  will be returned. If they point into different blocks, the range
  around those blocks in their shared ancestor is returned. You can
  pass in an optional predicate that will be called with a parent
  node to see if a range into that parent is acceptable.
  */
  blockRange(e = this, n) {
    if (e.pos < this.pos)
      return e.blockRange(this);
    for (let r = this.depth - (this.parent.inlineContent || this.pos == e.pos ? 1 : 0); r >= 0; r--)
      if (e.pos <= this.end(r) && (!n || n(this.node(r))))
        return new Rn(this, e, r);
    return null;
  }
  /**
  Query whether the given position shares the same parent node.
  */
  sameParent(e) {
    return this.pos - this.parentOffset == e.pos - e.parentOffset;
  }
  /**
  Return the greater of this and the given position.
  */
  max(e) {
    return e.pos > this.pos ? e : this;
  }
  /**
  Return the smaller of this and the given position.
  */
  min(e) {
    return e.pos < this.pos ? e : this;
  }
  /**
  @internal
  */
  toString() {
    let e = "";
    for (let n = 1; n <= this.depth; n++)
      e += (e ? "/" : "") + this.node(n).type.name + "_" + this.index(n - 1);
    return e + ":" + this.parentOffset;
  }
  /**
  @internal
  */
  static resolve(e, n) {
    if (!(n >= 0 && n <= e.content.size))
      throw new RangeError("Position " + n + " out of range");
    let r = [], i = 0, u = n;
    for (let o = e; ; ) {
      let { index: s, offset: l } = o.content.findIndex(u), c = u - l;
      if (r.push(o, s, i + l), !c || (o = o.child(s), o.isText))
        break;
      u = c - 1, i += l + 1;
    }
    return new Ht(n, r, u);
  }
  /**
  @internal
  */
  static resolveCached(e, n) {
    let r = Bi.get(e);
    if (r)
      for (let u = 0; u < r.elts.length; u++) {
        let o = r.elts[u];
        if (o.pos == n)
          return o;
      }
    else
      Bi.set(e, r = new Ll());
    let i = r.elts[r.i] = Ht.resolve(e, n);
    return r.i = (r.i + 1) % Zl, i;
  }
}
class Ll {
  constructor() {
    this.elts = [], this.i = 0;
  }
}
const Zl = 12, Bi = /* @__PURE__ */ new WeakMap();
class Rn {
  /**
  Construct a node range. `$from` and `$to` should point into the
  same node until at least the given `depth`, since a node range
  denotes an adjacent set of nodes in a single parent node.
  */
  constructor(e, n, r) {
    this.$from = e, this.$to = n, this.depth = r;
  }
  /**
  The position at the start of the range.
  */
  get start() {
    return this.$from.before(this.depth + 1);
  }
  /**
  The position at the end of the range.
  */
  get end() {
    return this.$to.after(this.depth + 1);
  }
  /**
  The parent node that the range points into.
  */
  get parent() {
    return this.$from.node(this.depth);
  }
  /**
  The start index of the range in the parent node.
  */
  get startIndex() {
    return this.$from.index(this.depth);
  }
  /**
  The end index of the range in the parent node.
  */
  get endIndex() {
    return this.$to.indexAfter(this.depth);
  }
}
const Yl = /* @__PURE__ */ Object.create(null);
class ye {
  /**
  @internal
  */
  constructor(e, n, r, i = B.none) {
    this.type = e, this.attrs = n, this.marks = i, this.content = r || y.empty;
  }
  /**
  The array of this node's child nodes.
  */
  get children() {
    return this.content.content;
  }
  /**
  The size of this node, as defined by the integer-based [indexing
  scheme](https://prosemirror.net/docs/guide/#doc.indexing). For text nodes, this is the
  amount of characters. For other leaf nodes, it is one. For
  non-leaf nodes, it is the size of the content plus two (the
  start and end token).
  */
  get nodeSize() {
    return this.isLeaf ? 1 : 2 + this.content.size;
  }
  /**
  The number of children that the node has.
  */
  get childCount() {
    return this.content.childCount;
  }
  /**
  Get the child node at the given index. Raises an error when the
  index is out of range.
  */
  child(e) {
    return this.content.child(e);
  }
  /**
  Get the child node at the given index, if it exists.
  */
  maybeChild(e) {
    return this.content.maybeChild(e);
  }
  /**
  Call `f` for every child node, passing the node, its offset
  into this parent node, and its index.
  */
  forEach(e) {
    this.content.forEach(e);
  }
  /**
  Invoke a callback for all descendant nodes recursively overlapping
  the given two positions that are relative to start of this
  node's content. This includes all ancestors of the nodes
  containing the two positions. The callback is invoked with the
  node, its position relative to the original node (method receiver),
  its parent node, and its child index. When the callback returns
  false for a given node, that node's children will not be
  recursed over. The last parameter can be used to specify a
  starting position to count from.
  */
  nodesBetween(e, n, r, i = 0) {
    this.content.nodesBetween(e, n, r, i, this);
  }
  /**
  Call the given callback for every descendant node. Doesn't
  descend into a node when the callback returns `false`.
  */
  descendants(e) {
    this.nodesBetween(0, this.content.size, e);
  }
  /**
  Concatenates all the text nodes found in this fragment and its
  children.
  */
  get textContent() {
    return this.isLeaf && this.type.spec.leafText ? this.type.spec.leafText(this) : this.textBetween(0, this.content.size, "");
  }
  /**
  Get all text between positions `from` and `to`. When
  `blockSeparator` is given, it will be inserted to separate text
  from different block nodes. If `leafText` is given, it'll be
  inserted for every non-text leaf node encountered, otherwise
  [`leafText`](https://prosemirror.net/docs/ref/#model.NodeSpec.leafText) will be used.
  */
  textBetween(e, n, r, i) {
    return this.content.textBetween(e, n, r, i);
  }
  /**
  Returns this node's first child, or `null` if there are no
  children.
  */
  get firstChild() {
    return this.content.firstChild;
  }
  /**
  Returns this node's last child, or `null` if there are no
  children.
  */
  get lastChild() {
    return this.content.lastChild;
  }
  /**
  Test whether two nodes represent the same piece of document.
  */
  eq(e) {
    return this == e || this.sameMarkup(e) && this.content.eq(e.content);
  }
  /**
  Compare the markup (type, attributes, and marks) of this node to
  those of another. Returns `true` if both have the same markup.
  */
  sameMarkup(e) {
    return this.hasMarkup(e.type, e.attrs, e.marks);
  }
  /**
  Check whether this node's markup correspond to the given type,
  attributes, and marks.
  */
  hasMarkup(e, n, r) {
    return this.type == e && Nn(this.attrs, n || e.defaultAttrs || Yl) && B.sameSet(this.marks, r || B.none);
  }
  /**
  Create a new node with the same markup as this node, containing
  the given content (or empty, if no content is given).
  */
  copy(e = null) {
    return e == this.content ? this : new ye(this.type, this.attrs, e, this.marks);
  }
  /**
  Create a copy of this node, with the given set of marks instead
  of the node's own marks.
  */
  mark(e) {
    return e == this.marks ? this : new ye(this.type, this.attrs, this.content, e);
  }
  /**
  Create a copy of this node with only the content between the
  given positions. If `to` is not given, it defaults to the end of
  the node.
  */
  cut(e, n = this.content.size) {
    return e == 0 && n == this.content.size ? this : this.copy(this.content.cut(e, n));
  }
  /**
  Cut out the part of the document between the given positions, and
  return it as a `Slice` object.
  */
  slice(e, n = this.content.size, r = !1) {
    if (e == n)
      return F.empty;
    let i = this.resolve(e), u = this.resolve(n), o = r ? 0 : i.sharedDepth(n), s = i.start(o), c = i.node(o).content.cut(i.pos - s, u.pos - s);
    return new F(c, i.depth - o, u.depth - o);
  }
  /**
  Replace the part of the document between the given positions with
  the given slice. The slice must 'fit', meaning its open sides
  must be able to connect to the surrounding content, and its
  content nodes must be valid children for the node they are placed
  into. If any of this is violated, an error of type
  [`ReplaceError`](https://prosemirror.net/docs/ref/#model.ReplaceError) is thrown.
  */
  replace(e, n, r) {
    return Jl(this.resolve(e), this.resolve(n), r);
  }
  /**
  Find the node directly after the given position.
  */
  nodeAt(e) {
    for (let n = this; ; ) {
      let { index: r, offset: i } = n.content.findIndex(e);
      if (n = n.maybeChild(r), !n)
        return null;
      if (i == e || n.isText)
        return n;
      e -= i + 1;
    }
  }
  /**
  Find the (direct) child node after the given offset, if any,
  and return it along with its index and offset relative to this
  node.
  */
  childAfter(e) {
    let { index: n, offset: r } = this.content.findIndex(e);
    return { node: this.content.maybeChild(n), index: n, offset: r };
  }
  /**
  Find the (direct) child node before the given offset, if any,
  and return it along with its index and offset relative to this
  node.
  */
  childBefore(e) {
    if (e == 0)
      return { node: null, index: 0, offset: 0 };
    let { index: n, offset: r } = this.content.findIndex(e);
    if (r < e)
      return { node: this.content.child(n), index: n, offset: r };
    let i = this.content.child(n - 1);
    return { node: i, index: n - 1, offset: r - i.nodeSize };
  }
  /**
  Resolve the given position in the document, returning an
  [object](https://prosemirror.net/docs/ref/#model.ResolvedPos) with information about its context.
  */
  resolve(e) {
    return Ht.resolveCached(this, e);
  }
  /**
  @internal
  */
  resolveNoCache(e) {
    return Ht.resolve(this, e);
  }
  /**
  Test whether a given mark or mark type occurs in this document
  between the two given positions.
  */
  rangeHasMark(e, n, r) {
    let i = !1;
    return n > e && this.nodesBetween(e, n, (u) => (r.isInSet(u.marks) && (i = !0), !i)), i;
  }
  /**
  True when this is a block (non-inline node)
  */
  get isBlock() {
    return this.type.isBlock;
  }
  /**
  True when this is a textblock node, a block node with inline
  content.
  */
  get isTextblock() {
    return this.type.isTextblock;
  }
  /**
  True when this node allows inline content.
  */
  get inlineContent() {
    return this.type.inlineContent;
  }
  /**
  True when this is an inline node (a text node or a node that can
  appear among text).
  */
  get isInline() {
    return this.type.isInline;
  }
  /**
  True when this is a text node.
  */
  get isText() {
    return this.type.isText;
  }
  /**
  True when this is a leaf node.
  */
  get isLeaf() {
    return this.type.isLeaf;
  }
  /**
  True when this is an atom, i.e. when it does not have directly
  editable content. This is usually the same as `isLeaf`, but can
  be configured with the [`atom` property](https://prosemirror.net/docs/ref/#model.NodeSpec.atom)
  on a node's spec (typically used when the node is displayed as
  an uneditable [node view](https://prosemirror.net/docs/ref/#view.NodeView)).
  */
  get isAtom() {
    return this.type.isAtom;
  }
  /**
  Return a string representation of this node for debugging
  purposes.
  */
  toString() {
    if (this.type.spec.toDebugString)
      return this.type.spec.toDebugString(this);
    let e = this.type.name;
    return this.content.size && (e += "(" + this.content.toStringInner() + ")"), Fo(this.marks, e);
  }
  /**
  Get the content match in this node at the given index.
  */
  contentMatchAt(e) {
    let n = this.type.contentMatch.matchFragment(this.content, 0, e);
    if (!n)
      throw new Error("Called contentMatchAt on a node with invalid content");
    return n;
  }
  /**
  Test whether replacing the range between `from` and `to` (by
  child index) with the given replacement fragment (which defaults
  to the empty fragment) would leave the node's content valid. You
  can optionally pass `start` and `end` indices into the
  replacement fragment.
  */
  canReplace(e, n, r = y.empty, i = 0, u = r.childCount) {
    let o = this.contentMatchAt(e).matchFragment(r, i, u), s = o && o.matchFragment(this.content, n);
    if (!s || !s.validEnd)
      return !1;
    for (let l = i; l < u; l++)
      if (!this.type.allowsMarks(r.child(l).marks))
        return !1;
    return !0;
  }
  /**
  Test whether replacing the range `from` to `to` (by index) with
  a node of the given type would leave the node's content valid.
  */
  canReplaceWith(e, n, r, i) {
    if (i && !this.type.allowsMarks(i))
      return !1;
    let u = this.contentMatchAt(e).matchType(r), o = u && u.matchFragment(this.content, n);
    return o ? o.validEnd : !1;
  }
  /**
  Test whether the given node's content could be appended to this
  node. If that node is empty, this will only return true if there
  is at least one node type that can appear in both nodes (to avoid
  merging completely incompatible nodes).
  */
  canAppend(e) {
    return e.content.size ? this.canReplace(this.childCount, this.childCount, e.content) : this.type.compatibleContent(e.type);
  }
  /**
  Check whether this node and its descendants conform to the
  schema, and raise an exception when they do not.
  */
  check() {
    this.type.checkContent(this.content), this.type.checkAttrs(this.attrs);
    let e = B.none;
    for (let n = 0; n < this.marks.length; n++) {
      let r = this.marks[n];
      r.type.checkAttrs(r.attrs), e = r.addToSet(e);
    }
    if (!B.sameSet(e, this.marks))
      throw new RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map((n) => n.type.name)}`);
    this.content.forEach((n) => n.check());
  }
  /**
  Return a JSON-serializeable representation of this node.
  */
  toJSON() {
    let e = { type: this.type.name };
    for (let n in this.attrs) {
      e.attrs = this.attrs;
      break;
    }
    return this.content.size && (e.content = this.content.toJSON()), this.marks.length && (e.marks = this.marks.map((n) => n.toJSON())), e;
  }
  /**
  Deserialize a node from its JSON representation.
  */
  static fromJSON(e, n) {
    if (!n)
      throw new RangeError("Invalid input for Node.fromJSON");
    let r;
    if (n.marks) {
      if (!Array.isArray(n.marks))
        throw new RangeError("Invalid mark data for Node.fromJSON");
      r = n.marks.map(e.markFromJSON);
    }
    if (n.type == "text") {
      if (typeof n.text != "string")
        throw new RangeError("Invalid text node in JSON");
      return e.text(n.text, r);
    }
    let i = y.fromJSON(e, n.content), u = e.nodeType(n.type).create(n.attrs, i, r);
    return u.type.checkAttrs(u.attrs), u;
  }
}
ye.prototype.text = void 0;
class Tn extends ye {
  /**
  @internal
  */
  constructor(e, n, r, i) {
    if (super(e, n, null, i), !r)
      throw new RangeError("Empty text nodes are not allowed");
    this.text = r;
  }
  toString() {
    return this.type.spec.toDebugString ? this.type.spec.toDebugString(this) : Fo(this.marks, JSON.stringify(this.text));
  }
  get textContent() {
    return this.text;
  }
  textBetween(e, n) {
    return this.text.slice(e, n);
  }
  get nodeSize() {
    return this.text.length;
  }
  mark(e) {
    return e == this.marks ? this : new Tn(this.type, this.attrs, this.text, e);
  }
  withText(e) {
    return e == this.text ? this : new Tn(this.type, this.attrs, e, this.marks);
  }
  cut(e = 0, n = this.text.length) {
    return e == 0 && n == this.text.length ? this : this.withText(this.text.slice(e, n));
  }
  eq(e) {
    return this.sameMarkup(e) && this.text == e.text;
  }
  toJSON() {
    let e = super.toJSON();
    return e.text = this.text, e;
  }
}
function Fo(t, e) {
  for (let n = t.length - 1; n >= 0; n--)
    e = t[n].type.name + "(" + e + ")";
  return e;
}
class dt {
  /**
  @internal
  */
  constructor(e) {
    this.validEnd = e, this.next = [], this.wrapCache = [];
  }
  /**
  @internal
  */
  static parse(e, n) {
    let r = new Hl(e, n);
    if (r.next == null)
      return dt.empty;
    let i = _o(r);
    r.next && r.err("Unexpected trailing text");
    let u = ec(Xl(i));
    return tc(u, r), u;
  }
  /**
  Match a node type, returning a match after that node if
  successful.
  */
  matchType(e) {
    for (let n = 0; n < this.next.length; n++)
      if (this.next[n].type == e)
        return this.next[n].next;
    return null;
  }
  /**
  Try to match a fragment. Returns the resulting match when
  successful.
  */
  matchFragment(e, n = 0, r = e.childCount) {
    let i = this;
    for (let u = n; i && u < r; u++)
      i = i.matchType(e.child(u).type);
    return i;
  }
  /**
  @internal
  */
  get inlineContent() {
    return this.next.length != 0 && this.next[0].type.isInline;
  }
  /**
  Get the first matching node type at this match position that can
  be generated.
  */
  get defaultType() {
    for (let e = 0; e < this.next.length; e++) {
      let { type: n } = this.next[e];
      if (!(n.isText || n.hasRequiredAttrs()))
        return n;
    }
    return null;
  }
  /**
  @internal
  */
  compatible(e) {
    for (let n = 0; n < this.next.length; n++)
      for (let r = 0; r < e.next.length; r++)
        if (this.next[n].type == e.next[r].type)
          return !0;
    return !1;
  }
  /**
  Try to match the given fragment, and if that fails, see if it can
  be made to match by inserting nodes in front of it. When
  successful, return a fragment of inserted nodes (which may be
  empty if nothing had to be inserted). When `toEnd` is true, only
  return a fragment if the resulting match goes to the end of the
  content expression.
  */
  fillBefore(e, n = !1, r = 0) {
    let i = [this];
    function u(o, s) {
      let l = o.matchFragment(e, r);
      if (l && (!n || l.validEnd))
        return y.from(s.map((c) => c.createAndFill()));
      for (let c = 0; c < o.next.length; c++) {
        let { type: a, next: f } = o.next[c];
        if (!(a.isText || a.hasRequiredAttrs()) && i.indexOf(f) == -1) {
          i.push(f);
          let p = u(f, s.concat(a));
          if (p)
            return p;
        }
      }
      return null;
    }
    return u(this, []);
  }
  /**
  Find a set of wrapping node types that would allow a node of the
  given type to appear at this position. The result may be empty
  (when it fits directly) and will be null when no such wrapping
  exists.
  */
  findWrapping(e) {
    for (let r = 0; r < this.wrapCache.length; r += 2)
      if (this.wrapCache[r] == e)
        return this.wrapCache[r + 1];
    let n = this.computeWrapping(e);
    return this.wrapCache.push(e, n), n;
  }
  /**
  @internal
  */
  computeWrapping(e) {
    let n = /* @__PURE__ */ Object.create(null), r = [{ match: this, type: null, via: null }];
    for (; r.length; ) {
      let i = r.shift(), u = i.match;
      if (u.matchType(e)) {
        let o = [];
        for (let s = i; s.type; s = s.via)
          o.push(s.type);
        return o.reverse();
      }
      for (let o = 0; o < u.next.length; o++) {
        let { type: s, next: l } = u.next[o];
        !s.isLeaf && !s.hasRequiredAttrs() && !(s.name in n) && (!i.type || l.validEnd) && (r.push({ match: s.contentMatch, type: s, via: i }), n[s.name] = !0);
      }
    }
    return null;
  }
  /**
  The number of outgoing edges this node has in the finite
  automaton that describes the content expression.
  */
  get edgeCount() {
    return this.next.length;
  }
  /**
  Get the _n_​th outgoing edge from this node in the finite
  automaton that describes the content expression.
  */
  edge(e) {
    if (e >= this.next.length)
      throw new RangeError(`There's no ${e}th edge in this content match`);
    return this.next[e];
  }
  /**
  @internal
  */
  toString() {
    let e = [];
    function n(r) {
      e.push(r);
      for (let i = 0; i < r.next.length; i++)
        e.indexOf(r.next[i].next) == -1 && n(r.next[i].next);
    }
    return n(this), e.map((r, i) => {
      let u = i + (r.validEnd ? "*" : " ") + " ";
      for (let o = 0; o < r.next.length; o++)
        u += (o ? ", " : "") + r.next[o].type.name + "->" + e.indexOf(r.next[o].next);
      return u;
    }).join(`
`);
  }
}
dt.empty = new dt(!0);
class Hl {
  constructor(e, n) {
    this.string = e, this.nodeTypes = n, this.inline = null, this.pos = 0, this.tokens = e.split(/\s*(?=\b|\W|$)/), this.tokens[this.tokens.length - 1] == "" && this.tokens.pop(), this.tokens[0] == "" && this.tokens.shift();
  }
  get next() {
    return this.tokens[this.pos];
  }
  eat(e) {
    return this.next == e && (this.pos++ || !0);
  }
  err(e) {
    throw new SyntaxError(e + " (in content expression '" + this.string + "')");
  }
}
function _o(t) {
  let e = [];
  do
    e.push(Vl(t));
  while (t.eat("|"));
  return e.length == 1 ? e[0] : { type: "choice", exprs: e };
}
function Vl(t) {
  let e = [];
  do
    e.push(Ul(t));
  while (t.next && t.next != ")" && t.next != "|");
  return e.length == 1 ? e[0] : { type: "seq", exprs: e };
}
function Ul(t) {
  let e = jl(t);
  for (; ; )
    if (t.eat("+"))
      e = { type: "plus", expr: e };
    else if (t.eat("*"))
      e = { type: "star", expr: e };
    else if (t.eat("?"))
      e = { type: "opt", expr: e };
    else if (t.eat("{"))
      e = $l(t, e);
    else
      break;
  return e;
}
function Si(t) {
  /\D/.test(t.next) && t.err("Expected number, got '" + t.next + "'");
  let e = Number(t.next);
  return t.pos++, e;
}
function $l(t, e) {
  let n = Si(t), r = n;
  return t.eat(",") && (t.next != "}" ? r = Si(t) : r = -1), t.eat("}") || t.err("Unclosed braced range"), { type: "range", min: n, max: r, expr: e };
}
function ql(t, e) {
  let n = t.nodeTypes, r = n[e];
  if (r)
    return [r];
  let i = [];
  for (let u in n) {
    let o = n[u];
    o.isInGroup(e) && i.push(o);
  }
  return i.length == 0 && t.err("No node type or group '" + e + "' found"), i;
}
function jl(t) {
  if (t.eat("(")) {
    let e = _o(t);
    return t.eat(")") || t.err("Missing closing paren"), e;
  } else if (/\W/.test(t.next))
    t.err("Unexpected token '" + t.next + "'");
  else {
    let e = ql(t, t.next).map((n) => (t.inline == null ? t.inline = n.isInline : t.inline != n.isInline && t.err("Mixing inline and block content"), { type: "name", value: n }));
    return t.pos++, e.length == 1 ? e[0] : { type: "choice", exprs: e };
  }
}
function Xl(t) {
  let e = [[]];
  return i(u(t, 0), n()), e;
  function n() {
    return e.push([]) - 1;
  }
  function r(o, s, l) {
    let c = { term: l, to: s };
    return e[o].push(c), c;
  }
  function i(o, s) {
    o.forEach((l) => l.to = s);
  }
  function u(o, s) {
    if (o.type == "choice")
      return o.exprs.reduce((l, c) => l.concat(u(c, s)), []);
    if (o.type == "seq")
      for (let l = 0; ; l++) {
        let c = u(o.exprs[l], s);
        if (l == o.exprs.length - 1)
          return c;
        i(c, s = n());
      }
    else if (o.type == "star") {
      let l = n();
      return r(s, l), i(u(o.expr, l), l), [r(l)];
    } else if (o.type == "plus") {
      let l = n();
      return i(u(o.expr, s), l), i(u(o.expr, l), l), [r(l)];
    } else {
      if (o.type == "opt")
        return [r(s)].concat(u(o.expr, s));
      if (o.type == "range") {
        let l = s;
        for (let c = 0; c < o.min; c++) {
          let a = n();
          i(u(o.expr, l), a), l = a;
        }
        if (o.max == -1)
          i(u(o.expr, l), l);
        else
          for (let c = o.min; c < o.max; c++) {
            let a = n();
            r(l, a), i(u(o.expr, l), a), l = a;
          }
        return [r(l)];
      } else {
        if (o.type == "name")
          return [r(s, void 0, o.value)];
        throw new Error("Unknown expr type");
      }
    }
  }
}
function wo(t, e) {
  return e - t;
}
function Mi(t, e) {
  let n = [];
  return r(e), n.sort(wo);
  function r(i) {
    let u = t[i];
    if (u.length == 1 && !u[0].term)
      return r(u[0].to);
    n.push(i);
    for (let o = 0; o < u.length; o++) {
      let { term: s, to: l } = u[o];
      !s && n.indexOf(l) == -1 && r(l);
    }
  }
}
function ec(t) {
  let e = /* @__PURE__ */ Object.create(null);
  return n(Mi(t, 0));
  function n(r) {
    let i = [];
    r.forEach((o) => {
      t[o].forEach(({ term: s, to: l }) => {
        if (!s)
          return;
        let c;
        for (let a = 0; a < i.length; a++)
          i[a][0] == s && (c = i[a][1]);
        Mi(t, l).forEach((a) => {
          c || i.push([s, c = []]), c.indexOf(a) == -1 && c.push(a);
        });
      });
    });
    let u = e[r.join(",")] = new dt(r.indexOf(t.length - 1) > -1);
    for (let o = 0; o < i.length; o++) {
      let s = i[o][1].sort(wo);
      u.next.push({ type: i[o][0], next: e[s.join(",")] || n(s) });
    }
    return u;
  }
}
function tc(t, e) {
  for (let n = 0, r = [t]; n < r.length; n++) {
    let i = r[n], u = !i.validEnd, o = [];
    for (let s = 0; s < i.next.length; s++) {
      let { type: l, next: c } = i.next[s];
      o.push(l.name), u && !(l.isText || l.hasRequiredAttrs()) && (u = !1), r.indexOf(c) == -1 && r.push(c);
    }
    u && e.err("Only non-generatable nodes (" + o.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
  }
}
function Io(t) {
  let e = /* @__PURE__ */ Object.create(null);
  for (let n in t) {
    let r = t[n];
    if (!r.hasDefault)
      return null;
    e[n] = r.default;
  }
  return e;
}
function Bo(t, e) {
  let n = /* @__PURE__ */ Object.create(null);
  for (let r in t) {
    let i = e && e[r];
    if (i === void 0) {
      let u = t[r];
      if (u.hasDefault)
        i = u.default;
      else
        throw new RangeError("No value supplied for attribute " + r);
    }
    n[r] = i;
  }
  return n;
}
function So(t, e, n, r) {
  for (let i in e)
    if (!(i in t))
      throw new RangeError(`Unsupported attribute ${i} for ${n} of type ${r}`);
  for (let i in t)
    t[i].validate && t[i].validate(e[i]);
}
function Mo(t, e) {
  let n = /* @__PURE__ */ Object.create(null);
  if (e)
    for (let r in e)
      n[r] = new rc(t, r, e[r]);
  return n;
}
let Ni = class No {
  /**
  @internal
  */
  constructor(e, n, r) {
    this.name = e, this.schema = n, this.spec = r, this.markSet = null, this.groups = r.group ? r.group.split(" ") : [], this.attrs = Mo(e, r.attrs), this.defaultAttrs = Io(this.attrs), this.contentMatch = null, this.inlineContent = null, this.isBlock = !(r.inline || e == "text"), this.isText = e == "text";
  }
  /**
  True if this is an inline type.
  */
  get isInline() {
    return !this.isBlock;
  }
  /**
  True if this is a textblock type, a block that contains inline
  content.
  */
  get isTextblock() {
    return this.isBlock && this.inlineContent;
  }
  /**
  True for node types that allow no content.
  */
  get isLeaf() {
    return this.contentMatch == dt.empty;
  }
  /**
  True when this node is an atom, i.e. when it does not have
  directly editable content.
  */
  get isAtom() {
    return this.isLeaf || !!this.spec.atom;
  }
  /**
  Return true when this node type is part of the given
  [group](https://prosemirror.net/docs/ref/#model.NodeSpec.group).
  */
  isInGroup(e) {
    return this.groups.indexOf(e) > -1;
  }
  /**
  The node type's [whitespace](https://prosemirror.net/docs/ref/#model.NodeSpec.whitespace) option.
  */
  get whitespace() {
    return this.spec.whitespace || (this.spec.code ? "pre" : "normal");
  }
  /**
  Tells you whether this node type has any required attributes.
  */
  hasRequiredAttrs() {
    for (let e in this.attrs)
      if (this.attrs[e].isRequired)
        return !0;
    return !1;
  }
  /**
  Indicates whether this node allows some of the same content as
  the given node type.
  */
  compatibleContent(e) {
    return this == e || this.contentMatch.compatible(e.contentMatch);
  }
  /**
  @internal
  */
  computeAttrs(e) {
    return !e && this.defaultAttrs ? this.defaultAttrs : Bo(this.attrs, e);
  }
  /**
  Create a `Node` of this type. The given attributes are
  checked and defaulted (you can pass `null` to use the type's
  defaults entirely, if no required attributes exist). `content`
  may be a `Fragment`, a node, an array of nodes, or
  `null`. Similarly `marks` may be `null` to default to the empty
  set of marks.
  */
  create(e = null, n, r) {
    if (this.isText)
      throw new Error("NodeType.create can't construct text nodes");
    return new ye(this, this.computeAttrs(e), y.from(n), B.setFrom(r));
  }
  /**
  Like [`create`](https://prosemirror.net/docs/ref/#model.NodeType.create), but check the given content
  against the node type's content restrictions, and throw an error
  if it doesn't match.
  */
  createChecked(e = null, n, r) {
    return n = y.from(n), this.checkContent(n), new ye(this, this.computeAttrs(e), n, B.setFrom(r));
  }
  /**
  Like [`create`](https://prosemirror.net/docs/ref/#model.NodeType.create), but see if it is
  necessary to add nodes to the start or end of the given fragment
  to make it fit the node. If no fitting wrapping can be found,
  return null. Note that, due to the fact that required nodes can
  always be created, this will always succeed if you pass null or
  `Fragment.empty` as content.
  */
  createAndFill(e = null, n, r) {
    if (e = this.computeAttrs(e), n = y.from(n), n.size) {
      let o = this.contentMatch.fillBefore(n);
      if (!o)
        return null;
      n = o.append(n);
    }
    let i = this.contentMatch.matchFragment(n), u = i && i.fillBefore(y.empty, !0);
    return u ? new ye(this, e, n.append(u), B.setFrom(r)) : null;
  }
  /**
  Returns true if the given fragment is valid content for this node
  type.
  */
  validContent(e) {
    let n = this.contentMatch.matchFragment(e);
    if (!n || !n.validEnd)
      return !1;
    for (let r = 0; r < e.childCount; r++)
      if (!this.allowsMarks(e.child(r).marks))
        return !1;
    return !0;
  }
  /**
  Throws a RangeError if the given fragment is not valid content for this
  node type.
  @internal
  */
  checkContent(e) {
    if (!this.validContent(e))
      throw new RangeError(`Invalid content for node ${this.name}: ${e.toString().slice(0, 50)}`);
  }
  /**
  @internal
  */
  checkAttrs(e) {
    So(this.attrs, e, "node", this.name);
  }
  /**
  Check whether the given mark type is allowed in this node.
  */
  allowsMarkType(e) {
    return this.markSet == null || this.markSet.indexOf(e) > -1;
  }
  /**
  Test whether the given set of marks are allowed in this node.
  */
  allowsMarks(e) {
    if (this.markSet == null)
      return !0;
    for (let n = 0; n < e.length; n++)
      if (!this.allowsMarkType(e[n].type))
        return !1;
    return !0;
  }
  /**
  Removes the marks that are not allowed in this node from the given set.
  */
  allowedMarks(e) {
    if (this.markSet == null)
      return e;
    let n;
    for (let r = 0; r < e.length; r++)
      this.allowsMarkType(e[r].type) ? n && n.push(e[r]) : n || (n = e.slice(0, r));
    return n ? n.length ? n : B.none : e;
  }
  /**
  @internal
  */
  static compile(e, n) {
    let r = /* @__PURE__ */ Object.create(null);
    e.forEach((u, o) => r[u] = new No(u, n, o));
    let i = n.spec.topNode || "doc";
    if (!r[i])
      throw new RangeError("Schema is missing its top node type ('" + i + "')");
    if (!r.text)
      throw new RangeError("Every schema needs a 'text' type");
    for (let u in r.text.attrs)
      throw new RangeError("The text node type should not have attributes");
    return r;
  }
};
function nc(t, e, n) {
  let r = n.split("|");
  return (i) => {
    let u = i === null ? "null" : typeof i;
    if (r.indexOf(u) < 0)
      throw new RangeError(`Expected value of type ${r} for attribute ${e} on type ${t}, got ${u}`);
  };
}
class rc {
  constructor(e, n, r) {
    this.hasDefault = Object.prototype.hasOwnProperty.call(r, "default"), this.default = r.default, this.validate = typeof r.validate == "string" ? nc(e, n, r.validate) : r.validate;
  }
  get isRequired() {
    return !this.hasDefault;
  }
}
class Hn {
  /**
  @internal
  */
  constructor(e, n, r, i) {
    this.name = e, this.rank = n, this.schema = r, this.spec = i, this.attrs = Mo(e, i.attrs), this.excluded = null;
    let u = Io(this.attrs);
    this.instance = u ? new B(this, u) : null;
  }
  /**
  Create a mark of this type. `attrs` may be `null` or an object
  containing only some of the mark's attributes. The others, if
  they have defaults, will be added.
  */
  create(e = null) {
    return !e && this.instance ? this.instance : new B(this, Bo(this.attrs, e));
  }
  /**
  @internal
  */
  static compile(e, n) {
    let r = /* @__PURE__ */ Object.create(null), i = 0;
    return e.forEach((u, o) => r[u] = new Hn(u, i++, n, o)), r;
  }
  /**
  When there is a mark of this type in the given set, a new set
  without it is returned. Otherwise, the input set is returned.
  */
  removeFromSet(e) {
    for (var n = 0; n < e.length; n++)
      e[n].type == this && (e = e.slice(0, n).concat(e.slice(n + 1)), n--);
    return e;
  }
  /**
  Tests whether there is a mark of this type in the given set.
  */
  isInSet(e) {
    for (let n = 0; n < e.length; n++)
      if (e[n].type == this)
        return e[n];
  }
  /**
  @internal
  */
  checkAttrs(e) {
    So(this.attrs, e, "mark", this.name);
  }
  /**
  Queries whether a given mark type is
  [excluded](https://prosemirror.net/docs/ref/#model.MarkSpec.excludes) by this one.
  */
  excludes(e) {
    return this.excluded.indexOf(e) > -1;
  }
}
class ri {
  /**
  Construct a schema from a schema [specification](https://prosemirror.net/docs/ref/#model.SchemaSpec).
  */
  constructor(e) {
    this.linebreakReplacement = null, this.cached = /* @__PURE__ */ Object.create(null);
    let n = this.spec = {};
    for (let i in e)
      n[i] = e[i];
    n.nodes = L.from(e.nodes), n.marks = L.from(e.marks || {}), this.nodes = Ni.compile(this.spec.nodes, this), this.marks = Hn.compile(this.spec.marks, this);
    let r = /* @__PURE__ */ Object.create(null);
    for (let i in this.nodes) {
      if (i in this.marks)
        throw new RangeError(i + " can not be both a node and a mark");
      let u = this.nodes[i], o = u.spec.content || "", s = u.spec.marks;
      if (u.contentMatch = r[o] || (r[o] = dt.parse(o, this.nodes)), u.inlineContent = u.contentMatch.inlineContent, u.spec.linebreakReplacement) {
        if (this.linebreakReplacement)
          throw new RangeError("Multiple linebreak nodes defined");
        if (!u.isInline || !u.isLeaf)
          throw new RangeError("Linebreak replacement nodes must be inline leaf nodes");
        this.linebreakReplacement = u;
      }
      u.markSet = s == "_" ? null : s ? Oi(this, s.split(" ")) : s == "" || !u.inlineContent ? [] : null;
    }
    for (let i in this.marks) {
      let u = this.marks[i], o = u.spec.excludes;
      u.excluded = o == null ? [u] : o == "" ? [] : Oi(this, o.split(" "));
    }
    this.nodeFromJSON = (i) => ye.fromJSON(this, i), this.markFromJSON = (i) => B.fromJSON(this, i), this.topNodeType = this.nodes[this.spec.topNode || "doc"], this.cached.wrappings = /* @__PURE__ */ Object.create(null);
  }
  /**
  Create a node in this schema. The `type` may be a string or a
  `NodeType` instance. Attributes will be extended with defaults,
  `content` may be a `Fragment`, `null`, a `Node`, or an array of
  nodes.
  */
  node(e, n = null, r, i) {
    if (typeof e == "string")
      e = this.nodeType(e);
    else if (e instanceof Ni) {
      if (e.schema != this)
        throw new RangeError("Node type from different schema used (" + e.name + ")");
    } else throw new RangeError("Invalid node type: " + e);
    return e.createChecked(n, r, i);
  }
  /**
  Create a text node in the schema. Empty text nodes are not
  allowed.
  */
  text(e, n) {
    let r = this.nodes.text;
    return new Tn(r, r.defaultAttrs, e, B.setFrom(n));
  }
  /**
  Create a mark with the given type and attributes.
  */
  mark(e, n) {
    return typeof e == "string" && (e = this.marks[e]), e.create(n);
  }
  /**
  @internal
  */
  nodeType(e) {
    let n = this.nodes[e];
    if (!n)
      throw new RangeError("Unknown node type: " + e);
    return n;
  }
}
function Oi(t, e) {
  let n = [];
  for (let r = 0; r < e.length; r++) {
    let i = e[r], u = t.marks[i], o = u;
    if (u)
      n.push(u);
    else
      for (let s in t.marks) {
        let l = t.marks[s];
        (i == "_" || l.spec.group && l.spec.group.split(" ").indexOf(i) > -1) && n.push(o = l);
      }
    if (!o)
      throw new SyntaxError("Unknown mark type: '" + e[r] + "'");
  }
  return n;
}
function ic(t) {
  return t.tag != null;
}
function uc(t) {
  return t.style != null;
}
class Et {
  /**
  Create a parser that targets the given schema, using the given
  parsing rules.
  */
  constructor(e, n) {
    this.schema = e, this.rules = n, this.tags = [], this.styles = [];
    let r = this.matchedStyles = [];
    n.forEach((i) => {
      if (ic(i))
        this.tags.push(i);
      else if (uc(i)) {
        let u = /[^=]*/.exec(i.style)[0];
        r.indexOf(u) < 0 && r.push(u), this.styles.push(i);
      }
    }), this.normalizeLists = !this.tags.some((i) => {
      if (!/^(ul|ol)\b/.test(i.tag) || !i.node)
        return !1;
      let u = e.nodes[i.node];
      return u.contentMatch.matchType(u);
    });
  }
  /**
  Parse a document from the content of a DOM node.
  */
  parse(e, n = {}) {
    let r = new Ti(this, n, !1);
    return r.addAll(e, B.none, n.from, n.to), r.finish();
  }
  /**
  Parses the content of the given DOM node, like
  [`parse`](https://prosemirror.net/docs/ref/#model.DOMParser.parse), and takes the same set of
  options. But unlike that method, which produces a whole node,
  this one returns a slice that is open at the sides, meaning that
  the schema constraints aren't applied to the start of nodes to
  the left of the input and the end of nodes at the end.
  */
  parseSlice(e, n = {}) {
    let r = new Ti(this, n, !0);
    return r.addAll(e, B.none, n.from, n.to), F.maxOpen(r.finish());
  }
  /**
  @internal
  */
  matchTag(e, n, r) {
    for (let i = r ? this.tags.indexOf(r) + 1 : 0; i < this.tags.length; i++) {
      let u = this.tags[i];
      if (lc(e, u.tag) && (u.namespace === void 0 || e.namespaceURI == u.namespace) && (!u.context || n.matchesContext(u.context))) {
        if (u.getAttrs) {
          let o = u.getAttrs(e);
          if (o === !1)
            continue;
          u.attrs = o || void 0;
        }
        return u;
      }
    }
  }
  /**
  @internal
  */
  matchStyle(e, n, r, i) {
    for (let u = i ? this.styles.indexOf(i) + 1 : 0; u < this.styles.length; u++) {
      let o = this.styles[u], s = o.style;
      if (!(s.indexOf(e) != 0 || o.context && !r.matchesContext(o.context) || // Test that the style string either precisely matches the prop,
      // or has an '=' sign after the prop, followed by the given
      // value.
      s.length > e.length && (s.charCodeAt(e.length) != 61 || s.slice(e.length + 1) != n))) {
        if (o.getAttrs) {
          let l = o.getAttrs(n);
          if (l === !1)
            continue;
          o.attrs = l || void 0;
        }
        return o;
      }
    }
  }
  /**
  @internal
  */
  static schemaRules(e) {
    let n = [];
    function r(i) {
      let u = i.priority == null ? 50 : i.priority, o = 0;
      for (; o < n.length; o++) {
        let s = n[o];
        if ((s.priority == null ? 50 : s.priority) < u)
          break;
      }
      n.splice(o, 0, i);
    }
    for (let i in e.marks) {
      let u = e.marks[i].spec.parseDOM;
      u && u.forEach((o) => {
        r(o = vi(o)), o.mark || o.ignore || o.clearMark || (o.mark = i);
      });
    }
    for (let i in e.nodes) {
      let u = e.nodes[i].spec.parseDOM;
      u && u.forEach((o) => {
        r(o = vi(o)), o.node || o.ignore || o.mark || (o.node = i);
      });
    }
    return n;
  }
  /**
  Construct a DOM parser using the parsing rules listed in a
  schema's [node specs](https://prosemirror.net/docs/ref/#model.NodeSpec.parseDOM), reordered by
  [priority](https://prosemirror.net/docs/ref/#model.GenericParseRule.priority).
  */
  static fromSchema(e) {
    return e.cached.domParser || (e.cached.domParser = new Et(e, Et.schemaRules(e)));
  }
}
const Oo = {
  address: !0,
  article: !0,
  aside: !0,
  blockquote: !0,
  body: !0,
  canvas: !0,
  dd: !0,
  div: !0,
  dl: !0,
  fieldset: !0,
  figcaption: !0,
  figure: !0,
  footer: !0,
  form: !0,
  h1: !0,
  h2: !0,
  h3: !0,
  h4: !0,
  h5: !0,
  h6: !0,
  header: !0,
  hgroup: !0,
  hr: !0,
  li: !0,
  noscript: !0,
  ol: !0,
  output: !0,
  p: !0,
  pre: !0,
  section: !0,
  table: !0,
  tfoot: !0,
  ul: !0
}, oc = {
  head: !0,
  noscript: !0,
  object: !0,
  script: !0,
  style: !0,
  title: !0
}, Ro = { ol: !0, ul: !0 }, Vt = 1, Kr = 2, Jt = 4;
function Ri(t, e, n) {
  return e != null ? (e ? Vt : 0) | (e === "full" ? Kr : 0) : t && t.whitespace == "pre" ? Vt | Kr : n & ~Jt;
}
class yn {
  constructor(e, n, r, i, u, o) {
    this.type = e, this.attrs = n, this.marks = r, this.solid = i, this.options = o, this.content = [], this.activeMarks = B.none, this.match = u || (o & Jt ? null : e.contentMatch);
  }
  findWrapping(e) {
    if (!this.match) {
      if (!this.type)
        return [];
      let n = this.type.contentMatch.fillBefore(y.from(e));
      if (n)
        this.match = this.type.contentMatch.matchFragment(n);
      else {
        let r = this.type.contentMatch, i;
        return (i = r.findWrapping(e.type)) ? (this.match = r, i) : null;
      }
    }
    return this.match.findWrapping(e.type);
  }
  finish(e) {
    if (!(this.options & Vt)) {
      let r = this.content[this.content.length - 1], i;
      if (r && r.isText && (i = /[ \t\r\n\u000c]+$/.exec(r.text))) {
        let u = r;
        r.text.length == i[0].length ? this.content.pop() : this.content[this.content.length - 1] = u.withText(u.text.slice(0, u.text.length - i[0].length));
      }
    }
    let n = y.from(this.content);
    return !e && this.match && (n = n.append(this.match.fillBefore(y.empty, !0))), this.type ? this.type.create(this.attrs, n, this.marks) : n;
  }
  inlineContext(e) {
    return this.type ? this.type.inlineContent : this.content.length ? this.content[0].isInline : e.parentNode && !Oo.hasOwnProperty(e.parentNode.nodeName.toLowerCase());
  }
}
class Ti {
  constructor(e, n, r) {
    this.parser = e, this.options = n, this.isOpen = r, this.open = 0, this.localPreserveWS = !1;
    let i = n.topNode, u, o = Ri(null, n.preserveWhitespace, 0) | (r ? Jt : 0);
    i ? u = new yn(i.type, i.attrs, B.none, !0, n.topMatch || i.type.contentMatch, o) : r ? u = new yn(null, null, B.none, !0, null, o) : u = new yn(e.schema.topNodeType, null, B.none, !0, null, o), this.nodes = [u], this.find = n.findPositions, this.needsBlock = !1;
  }
  get top() {
    return this.nodes[this.open];
  }
  // Add a DOM node to the content. Text is inserted as text node,
  // otherwise, the node is passed to `addElement` or, if it has a
  // `style` attribute, `addElementWithStyles`.
  addDOM(e, n) {
    e.nodeType == 3 ? this.addTextNode(e, n) : e.nodeType == 1 && this.addElement(e, n);
  }
  addTextNode(e, n) {
    let r = e.nodeValue, i = this.top, u = i.options & Kr ? "full" : this.localPreserveWS || (i.options & Vt) > 0, { schema: o } = this.parser;
    if (u === "full" || i.inlineContext(e) || /[^ \t\r\n\u000c]/.test(r)) {
      if (u)
        if (u === "full")
          r = r.replace(/\r\n?/g, `
`);
        else if (o.linebreakReplacement && /[\r\n]/.test(r) && this.top.findWrapping(o.linebreakReplacement.create())) {
          let s = r.split(/\r?\n|\r/);
          for (let l = 0; l < s.length; l++)
            l && this.insertNode(o.linebreakReplacement.create(), n, !0), s[l] && this.insertNode(o.text(s[l]), n, !/\S/.test(s[l]));
          r = "";
        } else
          r = r.replace(/\r?\n|\r/g, " ");
      else if (r = r.replace(/[ \t\r\n\u000c]+/g, " "), /^[ \t\r\n\u000c]/.test(r) && this.open == this.nodes.length - 1) {
        let s = i.content[i.content.length - 1], l = e.previousSibling;
        (!s || l && l.nodeName == "BR" || s.isText && /[ \t\r\n\u000c]$/.test(s.text)) && (r = r.slice(1));
      }
      r && this.insertNode(o.text(r), n, !/\S/.test(r)), this.findInText(e);
    } else
      this.findInside(e);
  }
  // Try to find a handler for the given tag and use that to parse. If
  // none is found, the element's content nodes are added directly.
  addElement(e, n, r) {
    let i = this.localPreserveWS, u = this.top;
    (e.tagName == "PRE" || /pre/.test(e.style && e.style.whiteSpace)) && (this.localPreserveWS = !0);
    let o = e.nodeName.toLowerCase(), s;
    Ro.hasOwnProperty(o) && this.parser.normalizeLists && sc(e);
    let l = this.options.ruleFromNode && this.options.ruleFromNode(e) || (s = this.parser.matchTag(e, this, r));
    e: if (l ? l.ignore : oc.hasOwnProperty(o))
      this.findInside(e), this.ignoreFallback(e, n);
    else if (!l || l.skip || l.closeParent) {
      l && l.closeParent ? this.open = Math.max(0, this.open - 1) : l && l.skip.nodeType && (e = l.skip);
      let c, a = this.needsBlock;
      if (Oo.hasOwnProperty(o))
        u.content.length && u.content[0].isInline && this.open && (this.open--, u = this.top), c = !0, u.type || (this.needsBlock = !0);
      else if (!e.firstChild) {
        this.leafFallback(e, n);
        break e;
      }
      let f = l && l.skip ? n : this.readStyles(e, n);
      f && this.addAll(e, f), c && this.sync(u), this.needsBlock = a;
    } else {
      let c = this.readStyles(e, n);
      c && this.addElementByRule(e, l, c, l.consuming === !1 ? s : void 0);
    }
    this.localPreserveWS = i;
  }
  // Called for leaf DOM nodes that would otherwise be ignored
  leafFallback(e, n) {
    e.nodeName == "BR" && this.top.type && this.top.type.inlineContent && this.addTextNode(e.ownerDocument.createTextNode(`
`), n);
  }
  // Called for ignored nodes
  ignoreFallback(e, n) {
    e.nodeName == "BR" && (!this.top.type || !this.top.type.inlineContent) && this.findPlace(this.parser.schema.text("-"), n, !0);
  }
  // Run any style parser associated with the node's styles. Either
  // return an updated array of marks, or null to indicate some of the
  // styles had a rule with `ignore` set.
  readStyles(e, n) {
    let r = e.style;
    if (r && r.length)
      for (let i = 0; i < this.parser.matchedStyles.length; i++) {
        let u = this.parser.matchedStyles[i], o = r.getPropertyValue(u);
        if (o)
          for (let s = void 0; ; ) {
            let l = this.parser.matchStyle(u, o, this, s);
            if (!l)
              break;
            if (l.ignore)
              return null;
            if (l.clearMark ? n = n.filter((c) => !l.clearMark(c)) : n = n.concat(this.parser.schema.marks[l.mark].create(l.attrs)), l.consuming === !1)
              s = l;
            else
              break;
          }
      }
    return n;
  }
  // Look up a handler for the given node. If none are found, return
  // false. Otherwise, apply it, use its return value to drive the way
  // the node's content is wrapped, and return true.
  addElementByRule(e, n, r, i) {
    let u, o;
    if (n.node)
      if (o = this.parser.schema.nodes[n.node], o.isLeaf)
        this.insertNode(o.create(n.attrs), r, e.nodeName == "BR") || this.leafFallback(e, r);
      else {
        let l = this.enter(o, n.attrs || null, r, n.preserveWhitespace);
        l && (u = !0, r = l);
      }
    else {
      let l = this.parser.schema.marks[n.mark];
      r = r.concat(l.create(n.attrs));
    }
    let s = this.top;
    if (o && o.isLeaf)
      this.findInside(e);
    else if (i)
      this.addElement(e, r, i);
    else if (n.getContent)
      this.findInside(e), n.getContent(e, this.parser.schema).forEach((l) => this.insertNode(l, r, !1));
    else {
      let l = e;
      typeof n.contentElement == "string" ? l = e.querySelector(n.contentElement) : typeof n.contentElement == "function" ? l = n.contentElement(e) : n.contentElement && (l = n.contentElement), this.findAround(e, l, !0), this.addAll(l, r), this.findAround(e, l, !1);
    }
    u && this.sync(s) && this.open--;
  }
  // Add all child nodes between `startIndex` and `endIndex` (or the
  // whole node, if not given). If `sync` is passed, use it to
  // synchronize after every block element.
  addAll(e, n, r, i) {
    let u = r || 0;
    for (let o = r ? e.childNodes[r] : e.firstChild, s = i == null ? null : e.childNodes[i]; o != s; o = o.nextSibling, ++u)
      this.findAtPoint(e, u), this.addDOM(o, n);
    this.findAtPoint(e, u);
  }
  // Try to find a way to fit the given node type into the current
  // context. May add intermediate wrappers and/or leave non-solid
  // nodes that we're in.
  findPlace(e, n, r) {
    let i, u;
    for (let o = this.open, s = 0; o >= 0; o--) {
      let l = this.nodes[o], c = l.findWrapping(e);
      if (c && (!i || i.length > c.length + s) && (i = c, u = l, !c.length))
        break;
      if (l.solid) {
        if (r)
          break;
        s += 2;
      }
    }
    if (!i)
      return null;
    this.sync(u);
    for (let o = 0; o < i.length; o++)
      n = this.enterInner(i[o], null, n, !1);
    return n;
  }
  // Try to insert the given node, adjusting the context when needed.
  insertNode(e, n, r) {
    if (e.isInline && this.needsBlock && !this.top.type) {
      let u = this.textblockFromContext();
      u && (n = this.enterInner(u, null, n));
    }
    let i = this.findPlace(e, n, r);
    if (i) {
      this.closeExtra();
      let u = this.top;
      u.match && (u.match = u.match.matchType(e.type));
      let o = B.none;
      for (let s of i.concat(e.marks))
        (u.type ? u.type.allowsMarkType(s.type) : zi(s.type, e.type)) && (o = s.addToSet(o));
      return u.content.push(e.mark(o)), !0;
    }
    return !1;
  }
  // Try to start a node of the given type, adjusting the context when
  // necessary.
  enter(e, n, r, i) {
    let u = this.findPlace(e.create(n), r, !1);
    return u && (u = this.enterInner(e, n, r, !0, i)), u;
  }
  // Open a node of the given type
  enterInner(e, n, r, i = !1, u) {
    this.closeExtra();
    let o = this.top;
    o.match = o.match && o.match.matchType(e);
    let s = Ri(e, u, o.options);
    o.options & Jt && o.content.length == 0 && (s |= Jt);
    let l = B.none;
    return r = r.filter((c) => (o.type ? o.type.allowsMarkType(c.type) : zi(c.type, e)) ? (l = c.addToSet(l), !1) : !0), this.nodes.push(new yn(e, n, l, i, null, s)), this.open++, r;
  }
  // Make sure all nodes above this.open are finished and added to
  // their parents
  closeExtra(e = !1) {
    let n = this.nodes.length - 1;
    if (n > this.open) {
      for (; n > this.open; n--)
        this.nodes[n - 1].content.push(this.nodes[n].finish(e));
      this.nodes.length = this.open + 1;
    }
  }
  finish() {
    return this.open = 0, this.closeExtra(this.isOpen), this.nodes[0].finish(!!(this.isOpen || this.options.topOpen));
  }
  sync(e) {
    for (let n = this.open; n >= 0; n--) {
      if (this.nodes[n] == e)
        return this.open = n, !0;
      this.localPreserveWS && (this.nodes[n].options |= Vt);
    }
    return !1;
  }
  get currentPos() {
    this.closeExtra();
    let e = 0;
    for (let n = this.open; n >= 0; n--) {
      let r = this.nodes[n].content;
      for (let i = r.length - 1; i >= 0; i--)
        e += r[i].nodeSize;
      n && e++;
    }
    return e;
  }
  findAtPoint(e, n) {
    if (this.find)
      for (let r = 0; r < this.find.length; r++)
        this.find[r].node == e && this.find[r].offset == n && (this.find[r].pos = this.currentPos);
  }
  findInside(e) {
    if (this.find)
      for (let n = 0; n < this.find.length; n++)
        this.find[n].pos == null && e.nodeType == 1 && e.contains(this.find[n].node) && (this.find[n].pos = this.currentPos);
  }
  findAround(e, n, r) {
    if (e != n && this.find)
      for (let i = 0; i < this.find.length; i++)
        this.find[i].pos == null && e.nodeType == 1 && e.contains(this.find[i].node) && n.compareDocumentPosition(this.find[i].node) & (r ? 2 : 4) && (this.find[i].pos = this.currentPos);
  }
  findInText(e) {
    if (this.find)
      for (let n = 0; n < this.find.length; n++)
        this.find[n].node == e && (this.find[n].pos = this.currentPos - (e.nodeValue.length - this.find[n].offset));
  }
  // Determines whether the given context string matches this context.
  matchesContext(e) {
    if (e.indexOf("|") > -1)
      return e.split(/\s*\|\s*/).some(this.matchesContext, this);
    let n = e.split("/"), r = this.options.context, i = !this.isOpen && (!r || r.parent.type == this.nodes[0].type), u = -(r ? r.depth + 1 : 0) + (i ? 0 : 1), o = (s, l) => {
      for (; s >= 0; s--) {
        let c = n[s];
        if (c == "") {
          if (s == n.length - 1 || s == 0)
            continue;
          for (; l >= u; l--)
            if (o(s - 1, l))
              return !0;
          return !1;
        } else {
          let a = l > 0 || l == 0 && i ? this.nodes[l].type : r && l >= u ? r.node(l - u).type : null;
          if (!a || a.name != c && !a.isInGroup(c))
            return !1;
          l--;
        }
      }
      return !0;
    };
    return o(n.length - 1, this.open);
  }
  textblockFromContext() {
    let e = this.options.context;
    if (e)
      for (let n = e.depth; n >= 0; n--) {
        let r = e.node(n).contentMatchAt(e.indexAfter(n)).defaultType;
        if (r && r.isTextblock && r.defaultAttrs)
          return r;
      }
    for (let n in this.parser.schema.nodes) {
      let r = this.parser.schema.nodes[n];
      if (r.isTextblock && r.defaultAttrs)
        return r;
    }
  }
}
function sc(t) {
  for (let e = t.firstChild, n = null; e; e = e.nextSibling) {
    let r = e.nodeType == 1 ? e.nodeName.toLowerCase() : null;
    r && Ro.hasOwnProperty(r) && n ? (n.appendChild(e), e = n) : r == "li" ? n = e : r && (n = null);
  }
}
function lc(t, e) {
  return (t.matches || t.msMatchesSelector || t.webkitMatchesSelector || t.mozMatchesSelector).call(t, e);
}
function vi(t) {
  let e = {};
  for (let n in t)
    e[n] = t[n];
  return e;
}
function zi(t, e) {
  let n = e.schema.nodes;
  for (let r in n) {
    let i = n[r];
    if (!i.allowsMarkType(t))
      continue;
    let u = [], o = (s) => {
      u.push(s);
      for (let l = 0; l < s.edgeCount; l++) {
        let { type: c, next: a } = s.edge(l);
        if (c == e || u.indexOf(a) < 0 && o(a))
          return !0;
      }
    };
    if (o(i.contentMatch))
      return !0;
  }
}
class mt {
  /**
  Create a serializer. `nodes` should map node names to functions
  that take a node and return a description of the corresponding
  DOM. `marks` does the same for mark names, but also gets an
  argument that tells it whether the mark's content is block or
  inline content (for typical use, it'll always be inline). A mark
  serializer may be `null` to indicate that marks of that type
  should not be serialized.
  */
  constructor(e, n) {
    this.nodes = e, this.marks = n;
  }
  /**
  Serialize the content of this fragment to a DOM fragment. When
  not in the browser, the `document` option, containing a DOM
  document, should be passed so that the serializer can create
  nodes.
  */
  serializeFragment(e, n = {}, r) {
    r || (r = Dn(n).createDocumentFragment());
    let i = r, u = [];
    return e.forEach((o) => {
      if (u.length || o.marks.length) {
        let s = 0, l = 0;
        for (; s < u.length && l < o.marks.length; ) {
          let c = o.marks[l];
          if (!this.marks[c.type.name]) {
            l++;
            continue;
          }
          if (!c.eq(u[s][0]) || c.type.spec.spanning === !1)
            break;
          s++, l++;
        }
        for (; s < u.length; )
          i = u.pop()[1];
        for (; l < o.marks.length; ) {
          let c = o.marks[l++], a = this.serializeMark(c, o.isInline, n);
          a && (u.push([c, i]), i.appendChild(a.dom), i = a.contentDOM || a.dom);
        }
      }
      i.appendChild(this.serializeNodeInner(o, n));
    }), r;
  }
  /**
  @internal
  */
  serializeNodeInner(e, n) {
    if (e.isText)
      return Dn(n).createTextNode(e.text);
    let { dom: r, contentDOM: i } = Bn(Dn(n), this.nodes[e.type.name](e), null, e.attrs);
    if (i) {
      if (e.isLeaf)
        throw new RangeError("Content hole not allowed in a leaf node spec");
      this.serializeFragment(e.content, n, i);
    }
    return r;
  }
  /**
  Serialize this node to a DOM node. This can be useful when you
  need to serialize a part of a document, as opposed to the whole
  document. To serialize a whole document, use
  [`serializeFragment`](https://prosemirror.net/docs/ref/#model.DOMSerializer.serializeFragment) on
  its [content](https://prosemirror.net/docs/ref/#model.Node.content).
  */
  serializeNode(e, n = {}) {
    let r = this.serializeNodeInner(e, n);
    for (let i = e.marks.length - 1; i >= 0; i--) {
      let u = this.serializeMark(e.marks[i], e.isInline, n);
      u && ((u.contentDOM || u.dom).appendChild(r), r = u.dom);
    }
    return r;
  }
  /**
  @internal
  */
  serializeMark(e, n, r = {}) {
    let i = this.marks[e.type.name];
    return i && Bn(Dn(r), i(e, n), null, e.attrs);
  }
  static renderSpec(e, n, r = null, i) {
    return typeof n == "string" ? { dom: e.createTextNode(n) } : Bn(e, n, r, i);
  }
  /**
  Build a serializer using the [`toDOM`](https://prosemirror.net/docs/ref/#model.NodeSpec.toDOM)
  properties in a schema's node and mark specs.
  */
  static fromSchema(e) {
    return e.cached.domSerializer || (e.cached.domSerializer = new mt(this.nodesFromSchema(e), this.marksFromSchema(e)));
  }
  /**
  Gather the serializers in a schema's node specs into an object.
  This can be useful as a base to build a custom serializer from.
  */
  static nodesFromSchema(e) {
    let n = Qi(e.nodes);
    return n.text || (n.text = (r) => r.text), n;
  }
  /**
  Gather the serializers in a schema's mark specs into an object.
  */
  static marksFromSchema(e) {
    return Qi(e.marks);
  }
}
function Qi(t) {
  let e = {};
  for (let n in t) {
    let r = t[n].spec.toDOM;
    r && (e[n] = r);
  }
  return e;
}
function Dn(t) {
  return t.document || window.document;
}
const Ki = /* @__PURE__ */ new WeakMap();
function cc(t) {
  let e = Ki.get(t);
  return e === void 0 && Ki.set(t, e = ac(t)), e;
}
function ac(t) {
  let e = null;
  function n(r) {
    if (r && typeof r == "object")
      if (Array.isArray(r))
        if (typeof r[0] == "string")
          e || (e = []), e.push(r);
        else
          for (let i = 0; i < r.length; i++)
            n(r[i]);
      else
        for (let i in r)
          n(r[i]);
  }
  return n(t), e;
}
function Bn(t, e, n, r) {
  if (e.nodeType == 1)
    return { dom: e };
  if (e.dom && e.dom.nodeType == 1)
    return e;
  let i = e[0], u;
  if (typeof i != "string")
    throw new RangeError("Invalid array passed to renderSpec");
  if (r && (u = cc(r)) && u.indexOf(e) > -1)
    throw new RangeError("Using an array from an attribute object as a DOM spec. This may be an attempted cross site scripting attack.");
  let o = i.indexOf(" ");
  o > 0 && (n = i.slice(0, o), i = i.slice(o + 1));
  let s, l = n ? t.createElementNS(n, i) : t.createElement(i), c = e[1], a = 1;
  if (c && typeof c == "object" && c.nodeType == null && !Array.isArray(c)) {
    a = 2;
    for (let f in c)
      if (c[f] != null) {
        let p = f.indexOf(" ");
        p > 0 ? l.setAttributeNS(f.slice(0, p), f.slice(p + 1), c[f]) : f == "style" && l.style ? l.style.cssText = c[f] : l.setAttribute(f, c[f]);
      }
  }
  for (let f = a; f < e.length; f++) {
    let p = e[f];
    if (p === 0) {
      if (f < e.length - 1 || f > a)
        throw new RangeError("Content hole must be the only child of its parent node");
      return { dom: l, contentDOM: l };
    } else if (typeof p == "string")
      l.appendChild(t.createTextNode(p));
    else {
      let { dom: d, contentDOM: h } = Bn(t, p, n, r);
      if (l.appendChild(d), h) {
        if (s)
          throw new RangeError("Multiple content holes");
        s = h;
      }
    }
  }
  return { dom: l, contentDOM: s };
}
const To = 65535, vo = Math.pow(2, 16);
function fc(t, e) {
  return t + e * vo;
}
function Wi(t) {
  return t & To;
}
function hc(t) {
  return (t - (t & To)) / vo;
}
const zo = 1, Qo = 2, Sn = 4, Ko = 8;
class Wr {
  /**
  @internal
  */
  constructor(e, n, r) {
    this.pos = e, this.delInfo = n, this.recover = r;
  }
  /**
  Tells you whether the position was deleted, that is, whether the
  step removed the token on the side queried (via the `assoc`)
  argument from the document.
  */
  get deleted() {
    return (this.delInfo & Ko) > 0;
  }
  /**
  Tells you whether the token before the mapped position was deleted.
  */
  get deletedBefore() {
    return (this.delInfo & (zo | Sn)) > 0;
  }
  /**
  True when the token after the mapped position was deleted.
  */
  get deletedAfter() {
    return (this.delInfo & (Qo | Sn)) > 0;
  }
  /**
  Tells whether any of the steps mapped through deletes across the
  position (including both the token before and after the
  position).
  */
  get deletedAcross() {
    return (this.delInfo & Sn) > 0;
  }
}
class ue {
  /**
  Create a position map. The modifications to the document are
  represented as an array of numbers, in which each group of three
  represents a modified chunk as `[start, oldSize, newSize]`.
  */
  constructor(e, n = !1) {
    if (this.ranges = e, this.inverted = n, !e.length && ue.empty)
      return ue.empty;
  }
  /**
  @internal
  */
  recover(e) {
    let n = 0, r = Wi(e);
    if (!this.inverted)
      for (let i = 0; i < r; i++)
        n += this.ranges[i * 3 + 2] - this.ranges[i * 3 + 1];
    return this.ranges[r * 3] + n + hc(e);
  }
  mapResult(e, n = 1) {
    return this._map(e, n, !1);
  }
  map(e, n = 1) {
    return this._map(e, n, !0);
  }
  /**
  @internal
  */
  _map(e, n, r) {
    let i = 0, u = this.inverted ? 2 : 1, o = this.inverted ? 1 : 2;
    for (let s = 0; s < this.ranges.length; s += 3) {
      let l = this.ranges[s] - (this.inverted ? i : 0);
      if (l > e)
        break;
      let c = this.ranges[s + u], a = this.ranges[s + o], f = l + c;
      if (e <= f) {
        let p = c ? e == l ? -1 : e == f ? 1 : n : n, d = l + i + (p < 0 ? 0 : a);
        if (r)
          return d;
        let h = e == (n < 0 ? l : f) ? null : fc(s / 3, e - l), A = e == l ? Qo : e == f ? zo : Sn;
        return (n < 0 ? e != l : e != f) && (A |= Ko), new Wr(d, A, h);
      }
      i += a - c;
    }
    return r ? e + i : new Wr(e + i, 0, null);
  }
  /**
  @internal
  */
  touches(e, n) {
    let r = 0, i = Wi(n), u = this.inverted ? 2 : 1, o = this.inverted ? 1 : 2;
    for (let s = 0; s < this.ranges.length; s += 3) {
      let l = this.ranges[s] - (this.inverted ? r : 0);
      if (l > e)
        break;
      let c = this.ranges[s + u], a = l + c;
      if (e <= a && s == i * 3)
        return !0;
      r += this.ranges[s + o] - c;
    }
    return !1;
  }
  /**
  Calls the given function on each of the changed ranges included in
  this map.
  */
  forEach(e) {
    let n = this.inverted ? 2 : 1, r = this.inverted ? 1 : 2;
    for (let i = 0, u = 0; i < this.ranges.length; i += 3) {
      let o = this.ranges[i], s = o - (this.inverted ? u : 0), l = o + (this.inverted ? 0 : u), c = this.ranges[i + n], a = this.ranges[i + r];
      e(s, s + c, l, l + a), u += a - c;
    }
  }
  /**
  Create an inverted version of this map. The result can be used to
  map positions in the post-step document to the pre-step document.
  */
  invert() {
    return new ue(this.ranges, !this.inverted);
  }
  /**
  @internal
  */
  toString() {
    return (this.inverted ? "-" : "") + JSON.stringify(this.ranges);
  }
  /**
  Create a map that moves all positions by offset `n` (which may be
  negative). This can be useful when applying steps meant for a
  sub-document to a larger document, or vice-versa.
  */
  static offset(e) {
    return e == 0 ? ue.empty : new ue(e < 0 ? [0, -e, 0] : [0, 0, e]);
  }
}
ue.empty = new ue([]);
class Ut {
  /**
  Create a new mapping with the given position maps.
  */
  constructor(e, n, r = 0, i = e ? e.length : 0) {
    this.mirror = n, this.from = r, this.to = i, this._maps = e || [], this.ownData = !(e || n);
  }
  /**
  The step maps in this mapping.
  */
  get maps() {
    return this._maps;
  }
  /**
  Create a mapping that maps only through a part of this one.
  */
  slice(e = 0, n = this.maps.length) {
    return new Ut(this._maps, this.mirror, e, n);
  }
  /**
  Add a step map to the end of this mapping. If `mirrors` is
  given, it should be the index of the step map that is the mirror
  image of this one.
  */
  appendMap(e, n) {
    this.ownData || (this._maps = this._maps.slice(), this.mirror = this.mirror && this.mirror.slice(), this.ownData = !0), this.to = this._maps.push(e), n != null && this.setMirror(this._maps.length - 1, n);
  }
  /**
  Add all the step maps in a given mapping to this one (preserving
  mirroring information).
  */
  appendMapping(e) {
    for (let n = 0, r = this._maps.length; n < e._maps.length; n++) {
      let i = e.getMirror(n);
      this.appendMap(e._maps[n], i != null && i < n ? r + i : void 0);
    }
  }
  /**
  Finds the offset of the step map that mirrors the map at the
  given offset, in this mapping (as per the second argument to
  `appendMap`).
  */
  getMirror(e) {
    if (this.mirror) {
      for (let n = 0; n < this.mirror.length; n++)
        if (this.mirror[n] == e)
          return this.mirror[n + (n % 2 ? -1 : 1)];
    }
  }
  /**
  @internal
  */
  setMirror(e, n) {
    this.mirror || (this.mirror = []), this.mirror.push(e, n);
  }
  /**
  Append the inverse of the given mapping to this one.
  */
  appendMappingInverted(e) {
    for (let n = e.maps.length - 1, r = this._maps.length + e._maps.length; n >= 0; n--) {
      let i = e.getMirror(n);
      this.appendMap(e._maps[n].invert(), i != null && i > n ? r - i - 1 : void 0);
    }
  }
  /**
  Create an inverted version of this mapping.
  */
  invert() {
    let e = new Ut();
    return e.appendMappingInverted(this), e;
  }
  /**
  Map a position through this mapping.
  */
  map(e, n = 1) {
    if (this.mirror)
      return this._map(e, n, !0);
    for (let r = this.from; r < this.to; r++)
      e = this._maps[r].map(e, n);
    return e;
  }
  /**
  Map a position through this mapping, returning a mapping
  result.
  */
  mapResult(e, n = 1) {
    return this._map(e, n, !1);
  }
  /**
  @internal
  */
  _map(e, n, r) {
    let i = 0;
    for (let u = this.from; u < this.to; u++) {
      let o = this._maps[u], s = o.mapResult(e, n);
      if (s.recover != null) {
        let l = this.getMirror(u);
        if (l != null && l > u && l < this.to) {
          u = l, e = this._maps[l].recover(s.recover);
          continue;
        }
      }
      i |= s.delInfo, e = s.pos;
    }
    return r ? e : new Wr(e, i, null);
  }
}
const lr = /* @__PURE__ */ Object.create(null);
class j {
  /**
  Get the step map that represents the changes made by this step,
  and which can be used to transform between positions in the old
  and the new document.
  */
  getMap() {
    return ue.empty;
  }
  /**
  Try to merge this step with another one, to be applied directly
  after it. Returns the merged step when possible, null if the
  steps can't be merged.
  */
  merge(e) {
    return null;
  }
  /**
  Deserialize a step from its JSON representation. Will call
  through to the step class' own implementation of this method.
  */
  static fromJSON(e, n) {
    if (!n || !n.stepType)
      throw new RangeError("Invalid input for Step.fromJSON");
    let r = lr[n.stepType];
    if (!r)
      throw new RangeError(`No step type ${n.stepType} defined`);
    return r.fromJSON(e, n);
  }
  /**
  To be able to serialize steps to JSON, each step needs a string
  ID to attach to its JSON representation. Use this method to
  register an ID for your step classes. Try to pick something
  that's unlikely to clash with steps from other modules.
  */
  static jsonID(e, n) {
    if (e in lr)
      throw new RangeError("Duplicate use of step JSON ID " + e);
    return lr[e] = n, n.prototype.jsonID = e, n;
  }
}
class z {
  /**
  @internal
  */
  constructor(e, n) {
    this.doc = e, this.failed = n;
  }
  /**
  Create a successful step result.
  */
  static ok(e) {
    return new z(e, null);
  }
  /**
  Create a failed step result.
  */
  static fail(e) {
    return new z(null, e);
  }
  /**
  Call [`Node.replace`](https://prosemirror.net/docs/ref/#model.Node.replace) with the given
  arguments. Create a successful result if it succeeds, and a
  failed one if it throws a `ReplaceError`.
  */
  static fromReplace(e, n, r, i) {
    try {
      return z.ok(e.replace(n, r, i));
    } catch (u) {
      if (u instanceof Yt)
        return z.fail(u.message);
      throw u;
    }
  }
}
function ii(t, e, n) {
  let r = [];
  for (let i = 0; i < t.childCount; i++) {
    let u = t.child(i);
    u.content.size && (u = u.copy(ii(u.content, e, u))), u.isInline && (u = e(u, n, i)), r.push(u);
  }
  return y.fromArray(r);
}
class Je extends j {
  /**
  Create a mark step.
  */
  constructor(e, n, r) {
    super(), this.from = e, this.to = n, this.mark = r;
  }
  apply(e) {
    let n = e.slice(this.from, this.to), r = e.resolve(this.from), i = r.node(r.sharedDepth(this.to)), u = new F(ii(n.content, (o, s) => !o.isAtom || !s.type.allowsMarkType(this.mark.type) ? o : o.mark(this.mark.addToSet(o.marks)), i), n.openStart, n.openEnd);
    return z.fromReplace(e, this.from, this.to, u);
  }
  invert() {
    return new ke(this.from, this.to, this.mark);
  }
  map(e) {
    let n = e.mapResult(this.from, 1), r = e.mapResult(this.to, -1);
    return n.deleted && r.deleted || n.pos >= r.pos ? null : new Je(n.pos, r.pos, this.mark);
  }
  merge(e) {
    return e instanceof Je && e.mark.eq(this.mark) && this.from <= e.to && this.to >= e.from ? new Je(Math.min(this.from, e.from), Math.max(this.to, e.to), this.mark) : null;
  }
  toJSON() {
    return {
      stepType: "addMark",
      mark: this.mark.toJSON(),
      from: this.from,
      to: this.to
    };
  }
  /**
  @internal
  */
  static fromJSON(e, n) {
    if (typeof n.from != "number" || typeof n.to != "number")
      throw new RangeError("Invalid input for AddMarkStep.fromJSON");
    return new Je(n.from, n.to, e.markFromJSON(n.mark));
  }
}
j.jsonID("addMark", Je);
class ke extends j {
  /**
  Create a mark-removing step.
  */
  constructor(e, n, r) {
    super(), this.from = e, this.to = n, this.mark = r;
  }
  apply(e) {
    let n = e.slice(this.from, this.to), r = new F(ii(n.content, (i) => i.mark(this.mark.removeFromSet(i.marks)), e), n.openStart, n.openEnd);
    return z.fromReplace(e, this.from, this.to, r);
  }
  invert() {
    return new Je(this.from, this.to, this.mark);
  }
  map(e) {
    let n = e.mapResult(this.from, 1), r = e.mapResult(this.to, -1);
    return n.deleted && r.deleted || n.pos >= r.pos ? null : new ke(n.pos, r.pos, this.mark);
  }
  merge(e) {
    return e instanceof ke && e.mark.eq(this.mark) && this.from <= e.to && this.to >= e.from ? new ke(Math.min(this.from, e.from), Math.max(this.to, e.to), this.mark) : null;
  }
  toJSON() {
    return {
      stepType: "removeMark",
      mark: this.mark.toJSON(),
      from: this.from,
      to: this.to
    };
  }
  /**
  @internal
  */
  static fromJSON(e, n) {
    if (typeof n.from != "number" || typeof n.to != "number")
      throw new RangeError("Invalid input for RemoveMarkStep.fromJSON");
    return new ke(n.from, n.to, e.markFromJSON(n.mark));
  }
}
j.jsonID("removeMark", ke);
class Ge extends j {
  /**
  Create a node mark step.
  */
  constructor(e, n) {
    super(), this.pos = e, this.mark = n;
  }
  apply(e) {
    let n = e.nodeAt(this.pos);
    if (!n)
      return z.fail("No node at mark step's position");
    let r = n.type.create(n.attrs, null, this.mark.addToSet(n.marks));
    return z.fromReplace(e, this.pos, this.pos + 1, new F(y.from(r), 0, n.isLeaf ? 0 : 1));
  }
  invert(e) {
    let n = e.nodeAt(this.pos);
    if (n) {
      let r = this.mark.addToSet(n.marks);
      if (r.length == n.marks.length) {
        for (let i = 0; i < n.marks.length; i++)
          if (!n.marks[i].isInSet(r))
            return new Ge(this.pos, n.marks[i]);
        return new Ge(this.pos, this.mark);
      }
    }
    return new pt(this.pos, this.mark);
  }
  map(e) {
    let n = e.mapResult(this.pos, 1);
    return n.deletedAfter ? null : new Ge(n.pos, this.mark);
  }
  toJSON() {
    return { stepType: "addNodeMark", pos: this.pos, mark: this.mark.toJSON() };
  }
  /**
  @internal
  */
  static fromJSON(e, n) {
    if (typeof n.pos != "number")
      throw new RangeError("Invalid input for AddNodeMarkStep.fromJSON");
    return new Ge(n.pos, e.markFromJSON(n.mark));
  }
}
j.jsonID("addNodeMark", Ge);
class pt extends j {
  /**
  Create a mark-removing step.
  */
  constructor(e, n) {
    super(), this.pos = e, this.mark = n;
  }
  apply(e) {
    let n = e.nodeAt(this.pos);
    if (!n)
      return z.fail("No node at mark step's position");
    let r = n.type.create(n.attrs, null, this.mark.removeFromSet(n.marks));
    return z.fromReplace(e, this.pos, this.pos + 1, new F(y.from(r), 0, n.isLeaf ? 0 : 1));
  }
  invert(e) {
    let n = e.nodeAt(this.pos);
    return !n || !this.mark.isInSet(n.marks) ? this : new Ge(this.pos, this.mark);
  }
  map(e) {
    let n = e.mapResult(this.pos, 1);
    return n.deletedAfter ? null : new pt(n.pos, this.mark);
  }
  toJSON() {
    return { stepType: "removeNodeMark", pos: this.pos, mark: this.mark.toJSON() };
  }
  /**
  @internal
  */
  static fromJSON(e, n) {
    if (typeof n.pos != "number")
      throw new RangeError("Invalid input for RemoveNodeMarkStep.fromJSON");
    return new pt(n.pos, e.markFromJSON(n.mark));
  }
}
j.jsonID("removeNodeMark", pt);
class W extends j {
  /**
  The given `slice` should fit the 'gap' between `from` and
  `to`—the depths must line up, and the surrounding nodes must be
  able to be joined with the open sides of the slice. When
  `structure` is true, the step will fail if the content between
  from and to is not just a sequence of closing and then opening
  tokens (this is to guard against rebased replace steps
  overwriting something they weren't supposed to).
  */
  constructor(e, n, r, i = !1) {
    super(), this.from = e, this.to = n, this.slice = r, this.structure = i;
  }
  apply(e) {
    return this.structure && Pr(e, this.from, this.to) ? z.fail("Structure replace would overwrite content") : z.fromReplace(e, this.from, this.to, this.slice);
  }
  getMap() {
    return new ue([this.from, this.to - this.from, this.slice.size]);
  }
  invert(e) {
    return new W(this.from, this.from + this.slice.size, e.slice(this.from, this.to));
  }
  map(e) {
    let n = e.mapResult(this.to, -1), r = this.from == this.to && W.MAP_BIAS < 0 ? n : e.mapResult(this.from, 1);
    return r.deletedAcross && n.deletedAcross ? null : new W(r.pos, Math.max(r.pos, n.pos), this.slice, this.structure);
  }
  merge(e) {
    if (!(e instanceof W) || e.structure || this.structure)
      return null;
    if (this.from + this.slice.size == e.from && !this.slice.openEnd && !e.slice.openStart) {
      let n = this.slice.size + e.slice.size == 0 ? F.empty : new F(this.slice.content.append(e.slice.content), this.slice.openStart, e.slice.openEnd);
      return new W(this.from, this.to + (e.to - e.from), n, this.structure);
    } else if (e.to == this.from && !this.slice.openStart && !e.slice.openEnd) {
      let n = this.slice.size + e.slice.size == 0 ? F.empty : new F(e.slice.content.append(this.slice.content), e.slice.openStart, this.slice.openEnd);
      return new W(e.from, this.to, n, this.structure);
    } else
      return null;
  }
  toJSON() {
    let e = { stepType: "replace", from: this.from, to: this.to };
    return this.slice.size && (e.slice = this.slice.toJSON()), this.structure && (e.structure = !0), e;
  }
  /**
  @internal
  */
  static fromJSON(e, n) {
    if (typeof n.from != "number" || typeof n.to != "number")
      throw new RangeError("Invalid input for ReplaceStep.fromJSON");
    return new W(n.from, n.to, F.fromJSON(e, n.slice), !!n.structure);
  }
}
W.MAP_BIAS = 1;
j.jsonID("replace", W);
class U extends j {
  /**
  Create a replace-around step with the given range and gap.
  `insert` should be the point in the slice into which the content
  of the gap should be moved. `structure` has the same meaning as
  it has in the [`ReplaceStep`](https://prosemirror.net/docs/ref/#transform.ReplaceStep) class.
  */
  constructor(e, n, r, i, u, o, s = !1) {
    super(), this.from = e, this.to = n, this.gapFrom = r, this.gapTo = i, this.slice = u, this.insert = o, this.structure = s;
  }
  apply(e) {
    if (this.structure && (Pr(e, this.from, this.gapFrom) || Pr(e, this.gapTo, this.to)))
      return z.fail("Structure gap-replace would overwrite content");
    let n = e.slice(this.gapFrom, this.gapTo);
    if (n.openStart || n.openEnd)
      return z.fail("Gap is not a flat range");
    let r = this.slice.insertAt(this.insert, n.content);
    return r ? z.fromReplace(e, this.from, this.to, r) : z.fail("Content does not fit in gap");
  }
  getMap() {
    return new ue([
      this.from,
      this.gapFrom - this.from,
      this.insert,
      this.gapTo,
      this.to - this.gapTo,
      this.slice.size - this.insert
    ]);
  }
  invert(e) {
    let n = this.gapTo - this.gapFrom;
    return new U(this.from, this.from + this.slice.size + n, this.from + this.insert, this.from + this.insert + n, e.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure);
  }
  map(e) {
    let n = e.mapResult(this.from, 1), r = e.mapResult(this.to, -1), i = this.from == this.gapFrom ? n.pos : e.map(this.gapFrom, -1), u = this.to == this.gapTo ? r.pos : e.map(this.gapTo, 1);
    return n.deletedAcross && r.deletedAcross || i < n.pos || u > r.pos ? null : new U(n.pos, r.pos, i, u, this.slice, this.insert, this.structure);
  }
  toJSON() {
    let e = {
      stepType: "replaceAround",
      from: this.from,
      to: this.to,
      gapFrom: this.gapFrom,
      gapTo: this.gapTo,
      insert: this.insert
    };
    return this.slice.size && (e.slice = this.slice.toJSON()), this.structure && (e.structure = !0), e;
  }
  /**
  @internal
  */
  static fromJSON(e, n) {
    if (typeof n.from != "number" || typeof n.to != "number" || typeof n.gapFrom != "number" || typeof n.gapTo != "number" || typeof n.insert != "number")
      throw new RangeError("Invalid input for ReplaceAroundStep.fromJSON");
    return new U(n.from, n.to, n.gapFrom, n.gapTo, F.fromJSON(e, n.slice), n.insert, !!n.structure);
  }
}
j.jsonID("replaceAround", U);
function Pr(t, e, n) {
  let r = t.resolve(e), i = n - e, u = r.depth;
  for (; i > 0 && u > 0 && r.indexAfter(u) == r.node(u).childCount; )
    u--, i--;
  if (i > 0) {
    let o = r.node(u).maybeChild(r.indexAfter(u));
    for (; i > 0; ) {
      if (!o || o.isLeaf)
        return !0;
      o = o.firstChild, i--;
    }
  }
  return !1;
}
function dc(t, e, n, r) {
  let i = [], u = [], o, s;
  t.doc.nodesBetween(e, n, (l, c, a) => {
    if (!l.isInline)
      return;
    let f = l.marks;
    if (!r.isInSet(f) && a.type.allowsMarkType(r.type)) {
      let p = Math.max(c, e), d = Math.min(c + l.nodeSize, n), h = r.addToSet(f);
      for (let A = 0; A < f.length; A++)
        f[A].isInSet(h) || (o && o.to == p && o.mark.eq(f[A]) ? o.to = d : i.push(o = new ke(p, d, f[A])));
      s && s.to == p ? s.to = d : u.push(s = new Je(p, d, r));
    }
  }), i.forEach((l) => t.step(l)), u.forEach((l) => t.step(l));
}
function pc(t, e, n, r) {
  let i = [], u = 0;
  t.doc.nodesBetween(e, n, (o, s) => {
    if (!o.isInline)
      return;
    u++;
    let l = null;
    if (r instanceof Hn) {
      let c = o.marks, a;
      for (; a = r.isInSet(c); )
        (l || (l = [])).push(a), c = a.removeFromSet(c);
    } else r ? r.isInSet(o.marks) && (l = [r]) : l = o.marks;
    if (l && l.length) {
      let c = Math.min(s + o.nodeSize, n);
      for (let a = 0; a < l.length; a++) {
        let f = l[a], p;
        for (let d = 0; d < i.length; d++) {
          let h = i[d];
          h.step == u - 1 && f.eq(i[d].style) && (p = h);
        }
        p ? (p.to = c, p.step = u) : i.push({ style: f, from: Math.max(s, e), to: c, step: u });
      }
    }
  }), i.forEach((o) => t.step(new ke(o.from, o.to, o.style)));
}
function ui(t, e, n, r = n.contentMatch, i = !0) {
  let u = t.doc.nodeAt(e), o = [], s = e + 1;
  for (let l = 0; l < u.childCount; l++) {
    let c = u.child(l), a = s + c.nodeSize, f = r.matchType(c.type);
    if (!f)
      o.push(new W(s, a, F.empty));
    else {
      r = f;
      for (let p = 0; p < c.marks.length; p++)
        n.allowsMarkType(c.marks[p].type) || t.step(new ke(s, a, c.marks[p]));
      if (i && c.isText && n.whitespace != "pre") {
        let p, d = /\r?\n|\r/g, h;
        for (; p = d.exec(c.text); )
          h || (h = new F(y.from(n.schema.text(" ", n.allowedMarks(c.marks))), 0, 0)), o.push(new W(s + p.index, s + p.index + p[0].length, h));
      }
    }
    s = a;
  }
  if (!r.validEnd) {
    let l = r.fillBefore(y.empty, !0);
    t.replace(s, s, new F(l, 0, 0));
  }
  for (let l = o.length - 1; l >= 0; l--)
    t.step(o[l]);
}
function Ac(t, e, n) {
  return (e == 0 || t.canReplace(e, t.childCount)) && (n == t.childCount || t.canReplace(0, n));
}
function Vn(t) {
  let n = t.parent.content.cutByIndex(t.startIndex, t.endIndex);
  for (let r = t.depth, i = 0, u = 0; ; --r) {
    let o = t.$from.node(r), s = t.$from.index(r) + i, l = t.$to.indexAfter(r) - u;
    if (r < t.depth && o.canReplace(s, l, n))
      return r;
    if (r == 0 || o.type.spec.isolating || !Ac(o, s, l))
      break;
    s && (i = 1), l < o.childCount && (u = 1);
  }
  return null;
}
function mc(t, e, n) {
  let { $from: r, $to: i, depth: u } = e, o = r.before(u + 1), s = i.after(u + 1), l = o, c = s, a = y.empty, f = 0;
  for (let h = u, A = !1; h > n; h--)
    A || r.index(h) > 0 ? (A = !0, a = y.from(r.node(h).copy(a)), f++) : l--;
  let p = y.empty, d = 0;
  for (let h = u, A = !1; h > n; h--)
    A || i.after(h + 1) < i.end(h) ? (A = !0, p = y.from(i.node(h).copy(p)), d++) : c++;
  t.step(new U(l, c, o, s, new F(a.append(p), f, d), a.size - f, !0));
}
function Wo(t, e, n = null, r = t) {
  let i = gc(t, e), u = i && bc(r, e);
  return u ? i.map(Pi).concat({ type: e, attrs: n }).concat(u.map(Pi)) : null;
}
function Pi(t) {
  return { type: t, attrs: null };
}
function gc(t, e) {
  let { parent: n, startIndex: r, endIndex: i } = t, u = n.contentMatchAt(r).findWrapping(e);
  if (!u)
    return null;
  let o = u.length ? u[0] : e;
  return n.canReplaceWith(r, i, o) ? u : null;
}
function bc(t, e) {
  let { parent: n, startIndex: r, endIndex: i } = t, u = n.child(r), o = e.contentMatch.findWrapping(u.type);
  if (!o)
    return null;
  let l = (o.length ? o[o.length - 1] : e).contentMatch;
  for (let c = r; l && c < i; c++)
    l = l.matchType(n.child(c).type);
  return !l || !l.validEnd ? null : o;
}
function kc(t, e, n) {
  let r = y.empty;
  for (let o = n.length - 1; o >= 0; o--) {
    if (r.size) {
      let s = n[o].type.contentMatch.matchFragment(r);
      if (!s || !s.validEnd)
        throw new RangeError("Wrapper type given to Transform.wrap does not form valid content of its parent wrapper");
    }
    r = y.from(n[o].type.create(n[o].attrs, r));
  }
  let i = e.start, u = e.end;
  t.step(new U(i, u, i, u, new F(r, 0, 0), n.length, !0));
}
function xc(t, e, n, r, i) {
  if (!r.isTextblock)
    throw new RangeError("Type given to setBlockType should be a textblock");
  let u = t.steps.length;
  t.doc.nodesBetween(e, n, (o, s) => {
    let l = typeof i == "function" ? i(o) : i;
    if (o.isTextblock && !o.hasMarkup(r, l) && Cc(t.doc, t.mapping.slice(u).map(s), r)) {
      let c = null;
      if (r.schema.linebreakReplacement) {
        let d = r.whitespace == "pre", h = !!r.contentMatch.matchType(r.schema.linebreakReplacement);
        d && !h ? c = !1 : !d && h && (c = !0);
      }
      c === !1 && Jo(t, o, s, u), ui(t, t.mapping.slice(u).map(s, 1), r, void 0, c === null);
      let a = t.mapping.slice(u), f = a.map(s, 1), p = a.map(s + o.nodeSize, 1);
      return t.step(new U(f, p, f + 1, p - 1, new F(y.from(r.create(l, null, o.marks)), 0, 0), 1, !0)), c === !0 && Po(t, o, s, u), !1;
    }
  });
}
function Po(t, e, n, r) {
  e.forEach((i, u) => {
    if (i.isText) {
      let o, s = /\r?\n|\r/g;
      for (; o = s.exec(i.text); ) {
        let l = t.mapping.slice(r).map(n + 1 + u + o.index);
        t.replaceWith(l, l + 1, e.type.schema.linebreakReplacement.create());
      }
    }
  });
}
function Jo(t, e, n, r) {
  e.forEach((i, u) => {
    if (i.type == i.type.schema.linebreakReplacement) {
      let o = t.mapping.slice(r).map(n + 1 + u);
      t.replaceWith(o, o + 1, e.type.schema.text(`
`));
    }
  });
}
function Cc(t, e, n) {
  let r = t.resolve(e), i = r.index();
  return r.parent.canReplaceWith(i, i + 1, n);
}
function yc(t, e, n, r, i) {
  let u = t.doc.nodeAt(e);
  if (!u)
    throw new RangeError("No node at given position");
  n || (n = u.type);
  let o = n.create(r, null, i || u.marks);
  if (u.isLeaf)
    return t.replaceWith(e, e + u.nodeSize, o);
  if (!n.validContent(u.content))
    throw new RangeError("Invalid content for node type " + n.name);
  t.step(new U(e, e + u.nodeSize, e + 1, e + u.nodeSize - 1, new F(y.from(o), 0, 0), 1, !0));
}
function Ct(t, e, n = 1, r) {
  let i = t.resolve(e), u = i.depth - n, o = r && r[r.length - 1] || i.parent;
  if (u < 0 || i.parent.type.spec.isolating || !i.parent.canReplace(i.index(), i.parent.childCount) || !o.type.validContent(i.parent.content.cutByIndex(i.index(), i.parent.childCount)))
    return !1;
  for (let c = i.depth - 1, a = n - 2; c > u; c--, a--) {
    let f = i.node(c), p = i.index(c);
    if (f.type.spec.isolating)
      return !1;
    let d = f.content.cutByIndex(p, f.childCount), h = r && r[a + 1];
    h && (d = d.replaceChild(0, h.type.create(h.attrs)));
    let A = r && r[a] || f;
    if (!f.canReplace(p + 1, f.childCount) || !A.type.validContent(d))
      return !1;
  }
  let s = i.indexAfter(u), l = r && r[0];
  return i.node(u).canReplaceWith(s, s, l ? l.type : i.node(u + 1).type);
}
function Dc(t, e, n = 1, r) {
  let i = t.doc.resolve(e), u = y.empty, o = y.empty;
  for (let s = i.depth, l = i.depth - n, c = n - 1; s > l; s--, c--) {
    u = y.from(i.node(s).copy(u));
    let a = r && r[c];
    o = y.from(a ? a.type.create(a.attrs, o) : i.node(s).copy(o));
  }
  t.step(new W(e, e, new F(u.append(o), n, n), !0));
}
function oi(t, e) {
  let n = t.resolve(e), r = n.index();
  return Fc(n.nodeBefore, n.nodeAfter) && n.parent.canReplace(r, r + 1);
}
function Ec(t, e) {
  e.content.size || t.type.compatibleContent(e.type);
  let n = t.contentMatchAt(t.childCount), { linebreakReplacement: r } = t.type.schema;
  for (let i = 0; i < e.childCount; i++) {
    let u = e.child(i), o = u.type == r ? t.type.schema.nodes.text : u.type;
    if (n = n.matchType(o), !n || !t.type.allowsMarks(u.marks))
      return !1;
  }
  return n.validEnd;
}
function Fc(t, e) {
  return !!(t && e && !t.isLeaf && Ec(t, e));
}
function _c(t, e, n) {
  let r = null, { linebreakReplacement: i } = t.doc.type.schema, u = t.doc.resolve(e - n), o = u.node().type;
  if (i && o.inlineContent) {
    let a = o.whitespace == "pre", f = !!o.contentMatch.matchType(i);
    a && !f ? r = !1 : !a && f && (r = !0);
  }
  let s = t.steps.length;
  if (r === !1) {
    let a = t.doc.resolve(e + n);
    Jo(t, a.node(), a.before(), s);
  }
  o.inlineContent && ui(t, e + n - 1, o, u.node().contentMatchAt(u.index()), r == null);
  let l = t.mapping.slice(s), c = l.map(e - n);
  if (t.step(new W(c, l.map(e + n, -1), F.empty, !0)), r === !0) {
    let a = t.doc.resolve(c);
    Po(t, a.node(), a.before(), t.steps.length);
  }
  return t;
}
function wc(t, e, n) {
  let r = t.resolve(e);
  if (r.parent.canReplaceWith(r.index(), r.index(), n))
    return e;
  if (r.parentOffset == 0)
    for (let i = r.depth - 1; i >= 0; i--) {
      let u = r.index(i);
      if (r.node(i).canReplaceWith(u, u, n))
        return r.before(i + 1);
      if (u > 0)
        return null;
    }
  if (r.parentOffset == r.parent.content.size)
    for (let i = r.depth - 1; i >= 0; i--) {
      let u = r.indexAfter(i);
      if (r.node(i).canReplaceWith(u, u, n))
        return r.after(i + 1);
      if (u < r.node(i).childCount)
        return null;
    }
  return null;
}
function Ic(t, e, n) {
  let r = t.resolve(e);
  if (!n.content.size)
    return e;
  let i = n.content;
  for (let u = 0; u < n.openStart; u++)
    i = i.firstChild.content;
  for (let u = 1; u <= (n.openStart == 0 && n.size ? 2 : 1); u++)
    for (let o = r.depth; o >= 0; o--) {
      let s = o == r.depth ? 0 : r.pos <= (r.start(o + 1) + r.end(o + 1)) / 2 ? -1 : 1, l = r.index(o) + (s > 0 ? 1 : 0), c = r.node(o), a = !1;
      if (u == 1)
        a = c.canReplace(l, l, i);
      else {
        let f = c.contentMatchAt(l).findWrapping(i.firstChild.type);
        a = f && c.canReplaceWith(l, l, f[0]);
      }
      if (a)
        return s == 0 ? r.pos : s < 0 ? r.before(o + 1) : r.after(o + 1);
    }
  return null;
}
function si(t, e, n = e, r = F.empty) {
  if (e == n && !r.size)
    return null;
  let i = t.resolve(e), u = t.resolve(n);
  return Go(i, u, r) ? new W(e, n, r) : new Bc(i, u, r).fit();
}
function Go(t, e, n) {
  return !n.openStart && !n.openEnd && t.start() == e.start() && t.parent.canReplace(t.index(), e.index(), n.content);
}
class Bc {
  constructor(e, n, r) {
    this.$from = e, this.$to = n, this.unplaced = r, this.frontier = [], this.placed = y.empty;
    for (let i = 0; i <= e.depth; i++) {
      let u = e.node(i);
      this.frontier.push({
        type: u.type,
        match: u.contentMatchAt(e.indexAfter(i))
      });
    }
    for (let i = e.depth; i > 0; i--)
      this.placed = y.from(e.node(i).copy(this.placed));
  }
  get depth() {
    return this.frontier.length - 1;
  }
  fit() {
    for (; this.unplaced.size; ) {
      let c = this.findFittable();
      c ? this.placeNodes(c) : this.openMore() || this.dropNode();
    }
    let e = this.mustMoveInline(), n = this.placed.size - this.depth - this.$from.depth, r = this.$from, i = this.close(e < 0 ? this.$to : r.doc.resolve(e));
    if (!i)
      return null;
    let u = this.placed, o = r.depth, s = i.depth;
    for (; o && s && u.childCount == 1; )
      u = u.firstChild.content, o--, s--;
    let l = new F(u, o, s);
    return e > -1 ? new U(r.pos, e, this.$to.pos, this.$to.end(), l, n) : l.size || r.pos != this.$to.pos ? new W(r.pos, i.pos, l) : null;
  }
  // Find a position on the start spine of `this.unplaced` that has
  // content that can be moved somewhere on the frontier. Returns two
  // depths, one for the slice and one for the frontier.
  findFittable() {
    let e = this.unplaced.openStart;
    for (let n = this.unplaced.content, r = 0, i = this.unplaced.openEnd; r < e; r++) {
      let u = n.firstChild;
      if (n.childCount > 1 && (i = 0), u.type.spec.isolating && i <= r) {
        e = r;
        break;
      }
      n = u.content;
    }
    for (let n = 1; n <= 2; n++)
      for (let r = n == 1 ? e : this.unplaced.openStart; r >= 0; r--) {
        let i, u = null;
        r ? (u = cr(this.unplaced.content, r - 1).firstChild, i = u.content) : i = this.unplaced.content;
        let o = i.firstChild;
        for (let s = this.depth; s >= 0; s--) {
          let { type: l, match: c } = this.frontier[s], a, f = null;
          if (n == 1 && (o ? c.matchType(o.type) || (f = c.fillBefore(y.from(o), !1)) : u && l.compatibleContent(u.type)))
            return { sliceDepth: r, frontierDepth: s, parent: u, inject: f };
          if (n == 2 && o && (a = c.findWrapping(o.type)))
            return { sliceDepth: r, frontierDepth: s, parent: u, wrap: a };
          if (u && c.matchType(u.type))
            break;
        }
      }
  }
  openMore() {
    let { content: e, openStart: n, openEnd: r } = this.unplaced, i = cr(e, n);
    return !i.childCount || i.firstChild.isLeaf ? !1 : (this.unplaced = new F(e, n + 1, Math.max(r, i.size + n >= e.size - r ? n + 1 : 0)), !0);
  }
  dropNode() {
    let { content: e, openStart: n, openEnd: r } = this.unplaced, i = cr(e, n);
    if (i.childCount <= 1 && n > 0) {
      let u = e.size - n <= n + i.size;
      this.unplaced = new F(Qt(e, n - 1, 1), n - 1, u ? n - 1 : r);
    } else
      this.unplaced = new F(Qt(e, n, 1), n, r);
  }
  // Move content from the unplaced slice at `sliceDepth` to the
  // frontier node at `frontierDepth`. Close that frontier node when
  // applicable.
  placeNodes({ sliceDepth: e, frontierDepth: n, parent: r, inject: i, wrap: u }) {
    for (; this.depth > n; )
      this.closeFrontierNode();
    if (u)
      for (let A = 0; A < u.length; A++)
        this.openFrontierNode(u[A]);
    let o = this.unplaced, s = r ? r.content : o.content, l = o.openStart - e, c = 0, a = [], { match: f, type: p } = this.frontier[n];
    if (i) {
      for (let A = 0; A < i.childCount; A++)
        a.push(i.child(A));
      f = f.matchFragment(i);
    }
    let d = s.size + e - (o.content.size - o.openEnd);
    for (; c < s.childCount; ) {
      let A = s.child(c), m = f.matchType(A.type);
      if (!m)
        break;
      c++, (c > 1 || l == 0 || A.content.size) && (f = m, a.push(Lo(A.mark(p.allowedMarks(A.marks)), c == 1 ? l : 0, c == s.childCount ? d : -1)));
    }
    let h = c == s.childCount;
    h || (d = -1), this.placed = Kt(this.placed, n, y.from(a)), this.frontier[n].match = f, h && d < 0 && r && r.type == this.frontier[this.depth].type && this.frontier.length > 1 && this.closeFrontierNode();
    for (let A = 0, m = s; A < d; A++) {
      let g = m.lastChild;
      this.frontier.push({ type: g.type, match: g.contentMatchAt(g.childCount) }), m = g.content;
    }
    this.unplaced = h ? e == 0 ? F.empty : new F(Qt(o.content, e - 1, 1), e - 1, d < 0 ? o.openEnd : e - 1) : new F(Qt(o.content, e, c), o.openStart, o.openEnd);
  }
  mustMoveInline() {
    if (!this.$to.parent.isTextblock)
      return -1;
    let e = this.frontier[this.depth], n;
    if (!e.type.isTextblock || !ar(this.$to, this.$to.depth, e.type, e.match, !1) || this.$to.depth == this.depth && (n = this.findCloseLevel(this.$to)) && n.depth == this.depth)
      return -1;
    let { depth: r } = this.$to, i = this.$to.after(r);
    for (; r > 1 && i == this.$to.end(--r); )
      ++i;
    return i;
  }
  findCloseLevel(e) {
    e: for (let n = Math.min(this.depth, e.depth); n >= 0; n--) {
      let { match: r, type: i } = this.frontier[n], u = n < e.depth && e.end(n + 1) == e.pos + (e.depth - (n + 1)), o = ar(e, n, i, r, u);
      if (o) {
        for (let s = n - 1; s >= 0; s--) {
          let { match: l, type: c } = this.frontier[s], a = ar(e, s, c, l, !0);
          if (!a || a.childCount)
            continue e;
        }
        return { depth: n, fit: o, move: u ? e.doc.resolve(e.after(n + 1)) : e };
      }
    }
  }
  close(e) {
    let n = this.findCloseLevel(e);
    if (!n)
      return null;
    for (; this.depth > n.depth; )
      this.closeFrontierNode();
    n.fit.childCount && (this.placed = Kt(this.placed, n.depth, n.fit)), e = n.move;
    for (let r = n.depth + 1; r <= e.depth; r++) {
      let i = e.node(r), u = i.type.contentMatch.fillBefore(i.content, !0, e.index(r));
      this.openFrontierNode(i.type, i.attrs, u);
    }
    return e;
  }
  openFrontierNode(e, n = null, r) {
    let i = this.frontier[this.depth];
    i.match = i.match.matchType(e), this.placed = Kt(this.placed, this.depth, y.from(e.create(n, r))), this.frontier.push({ type: e, match: e.contentMatch });
  }
  closeFrontierNode() {
    let n = this.frontier.pop().match.fillBefore(y.empty, !0);
    n.childCount && (this.placed = Kt(this.placed, this.frontier.length, n));
  }
}
function Qt(t, e, n) {
  return e == 0 ? t.cutByIndex(n, t.childCount) : t.replaceChild(0, t.firstChild.copy(Qt(t.firstChild.content, e - 1, n)));
}
function Kt(t, e, n) {
  return e == 0 ? t.append(n) : t.replaceChild(t.childCount - 1, t.lastChild.copy(Kt(t.lastChild.content, e - 1, n)));
}
function cr(t, e) {
  for (let n = 0; n < e; n++)
    t = t.firstChild.content;
  return t;
}
function Lo(t, e, n) {
  if (e <= 0)
    return t;
  let r = t.content;
  return e > 1 && (r = r.replaceChild(0, Lo(r.firstChild, e - 1, r.childCount == 1 ? n - 1 : 0))), e > 0 && (r = t.type.contentMatch.fillBefore(r).append(r), n <= 0 && (r = r.append(t.type.contentMatch.matchFragment(r).fillBefore(y.empty, !0)))), t.copy(r);
}
function ar(t, e, n, r, i) {
  let u = t.node(e), o = i ? t.indexAfter(e) : t.index(e);
  if (o == u.childCount && !n.compatibleContent(u.type))
    return null;
  let s = r.fillBefore(u.content, !0, o);
  return s && !Sc(n, u.content, o) ? s : null;
}
function Sc(t, e, n) {
  for (let r = n; r < e.childCount; r++)
    if (!t.allowsMarks(e.child(r).marks))
      return !0;
  return !1;
}
function Mc(t) {
  return t.spec.defining || t.spec.definingForContent;
}
function Nc(t, e, n, r) {
  if (!r.size)
    return t.deleteRange(e, n);
  let i = t.doc.resolve(e), u = t.doc.resolve(n);
  if (Go(i, u, r))
    return t.step(new W(e, n, r));
  let o = Yo(i, u);
  o[o.length - 1] == 0 && o.pop();
  let s = -(i.depth + 1);
  o.unshift(s);
  for (let p = i.depth, d = i.pos - 1; p > 0; p--, d--) {
    let h = i.node(p).type.spec;
    if (h.defining || h.definingAsContext || h.isolating)
      break;
    o.indexOf(p) > -1 ? s = p : i.before(p) == d && o.splice(1, 0, -p);
  }
  let l = o.indexOf(s), c = [], a = r.openStart;
  for (let p = r.content, d = 0; ; d++) {
    let h = p.firstChild;
    if (c.push(h), d == r.openStart)
      break;
    p = h.content;
  }
  for (let p = a - 1; p >= 0; p--) {
    let d = c[p], h = Mc(d.type);
    if (h && !d.sameMarkup(i.node(Math.abs(s) - 1)))
      a = p;
    else if (h || !d.type.isTextblock)
      break;
  }
  for (let p = r.openStart; p >= 0; p--) {
    let d = (p + a + 1) % (r.openStart + 1), h = c[d];
    if (h)
      for (let A = 0; A < o.length; A++) {
        let m = o[(A + l) % o.length], g = !0;
        m < 0 && (g = !1, m = -m);
        let x = i.node(m - 1), b = i.index(m - 1);
        if (x.canReplaceWith(b, b, h.type, h.marks))
          return t.replace(i.before(m), g ? u.after(m) : n, new F(Zo(r.content, 0, r.openStart, d), d, r.openEnd));
      }
  }
  let f = t.steps.length;
  for (let p = o.length - 1; p >= 0 && (t.replace(e, n, r), !(t.steps.length > f)); p--) {
    let d = o[p];
    d < 0 || (e = i.before(d), n = u.after(d));
  }
}
function Zo(t, e, n, r, i) {
  if (e < n) {
    let u = t.firstChild;
    t = t.replaceChild(0, u.copy(Zo(u.content, e + 1, n, r, u)));
  }
  if (e > r) {
    let u = i.contentMatchAt(0), o = u.fillBefore(t).append(t);
    t = o.append(u.matchFragment(o).fillBefore(y.empty, !0));
  }
  return t;
}
function Oc(t, e, n, r) {
  if (!r.isInline && e == n && t.doc.resolve(e).parent.content.size) {
    let i = wc(t.doc, e, r.type);
    i != null && (e = n = i);
  }
  t.replaceRange(e, n, new F(y.from(r), 0, 0));
}
function Rc(t, e, n) {
  let r = t.doc.resolve(e), i = t.doc.resolve(n);
  if (r.parent.isTextblock && i.parent.isTextblock && r.start() != i.start() && r.parentOffset == 0 && i.parentOffset == 0) {
    let o = r.sharedDepth(n), s = !1;
    for (let l = r.depth; l > o; l--)
      r.node(l).type.spec.isolating && (s = !0);
    for (let l = i.depth; l > o; l--)
      i.node(l).type.spec.isolating && (s = !0);
    if (!s) {
      for (let l = r.depth; l > 0 && e == r.start(l); l--)
        e = r.before(l);
      for (let l = i.depth; l > 0 && n == i.start(l); l--)
        n = i.before(l);
      r = t.doc.resolve(e), i = t.doc.resolve(n);
    }
  }
  let u = Yo(r, i);
  for (let o = 0; o < u.length; o++) {
    let s = u[o], l = o == u.length - 1;
    if (l && s == 0 || r.node(s).type.contentMatch.validEnd)
      return t.delete(r.start(s), i.end(s));
    if (s > 0 && (l || r.node(s - 1).canReplace(r.index(s - 1), i.indexAfter(s - 1))))
      return t.delete(r.before(s), i.after(s));
  }
  for (let o = 1; o <= r.depth && o <= i.depth; o++)
    if (e - r.start(o) == r.depth - o && n > r.end(o) && i.end(o) - n != i.depth - o && r.start(o - 1) == i.start(o - 1) && r.node(o - 1).canReplace(r.index(o - 1), i.index(o - 1)))
      return t.delete(r.before(o), n);
  t.delete(e, n);
}
function Yo(t, e) {
  let n = [], r = Math.min(t.depth, e.depth);
  for (let i = r; i >= 0; i--) {
    let u = t.start(i);
    if (u < t.pos - (t.depth - i) || e.end(i) > e.pos + (e.depth - i) || t.node(i).type.spec.isolating || e.node(i).type.spec.isolating)
      break;
    (u == e.start(i) || i == t.depth && i == e.depth && t.parent.inlineContent && e.parent.inlineContent && i && e.start(i - 1) == u - 1) && n.push(i);
  }
  return n;
}
class yt extends j {
  /**
  Construct an attribute step.
  */
  constructor(e, n, r) {
    super(), this.pos = e, this.attr = n, this.value = r;
  }
  apply(e) {
    let n = e.nodeAt(this.pos);
    if (!n)
      return z.fail("No node at attribute step's position");
    let r = /* @__PURE__ */ Object.create(null);
    for (let u in n.attrs)
      r[u] = n.attrs[u];
    r[this.attr] = this.value;
    let i = n.type.create(r, null, n.marks);
    return z.fromReplace(e, this.pos, this.pos + 1, new F(y.from(i), 0, n.isLeaf ? 0 : 1));
  }
  getMap() {
    return ue.empty;
  }
  invert(e) {
    return new yt(this.pos, this.attr, e.nodeAt(this.pos).attrs[this.attr]);
  }
  map(e) {
    let n = e.mapResult(this.pos, 1);
    return n.deletedAfter ? null : new yt(n.pos, this.attr, this.value);
  }
  toJSON() {
    return { stepType: "attr", pos: this.pos, attr: this.attr, value: this.value };
  }
  static fromJSON(e, n) {
    if (typeof n.pos != "number" || typeof n.attr != "string")
      throw new RangeError("Invalid input for AttrStep.fromJSON");
    return new yt(n.pos, n.attr, n.value);
  }
}
j.jsonID("attr", yt);
class $t extends j {
  /**
  Construct an attribute step.
  */
  constructor(e, n) {
    super(), this.attr = e, this.value = n;
  }
  apply(e) {
    let n = /* @__PURE__ */ Object.create(null);
    for (let i in e.attrs)
      n[i] = e.attrs[i];
    n[this.attr] = this.value;
    let r = e.type.create(n, e.content, e.marks);
    return z.ok(r);
  }
  getMap() {
    return ue.empty;
  }
  invert(e) {
    return new $t(this.attr, e.attrs[this.attr]);
  }
  map(e) {
    return this;
  }
  toJSON() {
    return { stepType: "docAttr", attr: this.attr, value: this.value };
  }
  static fromJSON(e, n) {
    if (typeof n.attr != "string")
      throw new RangeError("Invalid input for DocAttrStep.fromJSON");
    return new $t(n.attr, n.value);
  }
}
j.jsonID("docAttr", $t);
let Ft = class extends Error {
};
Ft = function t(e) {
  let n = Error.call(this, e);
  return n.__proto__ = t.prototype, n;
};
Ft.prototype = Object.create(Error.prototype);
Ft.prototype.constructor = Ft;
Ft.prototype.name = "TransformError";
class Tc {
  /**
  Create a transform that starts with the given document.
  */
  constructor(e) {
    this.doc = e, this.steps = [], this.docs = [], this.mapping = new Ut();
  }
  /**
  The starting document.
  */
  get before() {
    return this.docs.length ? this.docs[0] : this.doc;
  }
  /**
  Apply a new step in this transform, saving the result. Throws an
  error when the step fails.
  */
  step(e) {
    let n = this.maybeStep(e);
    if (n.failed)
      throw new Ft(n.failed);
    return this;
  }
  /**
  Try to apply a step in this transformation, ignoring it if it
  fails. Returns the step result.
  */
  maybeStep(e) {
    let n = e.apply(this.doc);
    return n.failed || this.addStep(e, n.doc), n;
  }
  /**
  True when the document has been changed (when there are any
  steps).
  */
  get docChanged() {
    return this.steps.length > 0;
  }
  /**
  Return a single range, in post-transform document positions,
  that covers all content changed by this transform. Returns null
  if no replacements are made. Note that this will ignore changes
  that add/remove marks without replacing the underlying content.
  */
  changedRange() {
    let e = 1e9, n = -1e9;
    for (let r = 0; r < this.mapping.maps.length; r++) {
      let i = this.mapping.maps[r];
      r && (e = i.map(e, 1), n = i.map(n, -1)), i.forEach((u, o, s, l) => {
        e = Math.min(e, s), n = Math.max(n, l);
      });
    }
    return e == 1e9 ? null : { from: e, to: n };
  }
  /**
  @internal
  */
  addStep(e, n) {
    this.docs.push(this.doc), this.steps.push(e), this.mapping.appendMap(e.getMap()), this.doc = n;
  }
  /**
  Replace the part of the document between `from` and `to` with the
  given `slice`.
  */
  replace(e, n = e, r = F.empty) {
    let i = si(this.doc, e, n, r);
    return i && this.step(i), this;
  }
  /**
  Replace the given range with the given content, which may be a
  fragment, node, or array of nodes.
  */
  replaceWith(e, n, r) {
    return this.replace(e, n, new F(y.from(r), 0, 0));
  }
  /**
  Delete the content between the given positions.
  */
  delete(e, n) {
    return this.replace(e, n, F.empty);
  }
  /**
  Insert the given content at the given position.
  */
  insert(e, n) {
    return this.replaceWith(e, e, n);
  }
  /**
  Replace a range of the document with a given slice, using
  `from`, `to`, and the slice's
  [`openStart`](https://prosemirror.net/docs/ref/#model.Slice.openStart) property as hints, rather
  than fixed start and end points. This method may grow the
  replaced area or close open nodes in the slice in order to get a
  fit that is more in line with WYSIWYG expectations, by dropping
  fully covered parent nodes of the replaced region when they are
  marked [non-defining as
  context](https://prosemirror.net/docs/ref/#model.NodeSpec.definingAsContext), or including an
  open parent node from the slice that _is_ marked as [defining
  its content](https://prosemirror.net/docs/ref/#model.NodeSpec.definingForContent).
  
  This is the method, for example, to handle paste. The similar
  [`replace`](https://prosemirror.net/docs/ref/#transform.Transform.replace) method is a more
  primitive tool which will _not_ move the start and end of its given
  range, and is useful in situations where you need more precise
  control over what happens.
  */
  replaceRange(e, n, r) {
    return Nc(this, e, n, r), this;
  }
  /**
  Replace the given range with a node, but use `from` and `to` as
  hints, rather than precise positions. When from and to are the same
  and are at the start or end of a parent node in which the given
  node doesn't fit, this method may _move_ them out towards a parent
  that does allow the given node to be placed. When the given range
  completely covers a parent node, this method may completely replace
  that parent node.
  */
  replaceRangeWith(e, n, r) {
    return Oc(this, e, n, r), this;
  }
  /**
  Delete the given range, expanding it to cover fully covered
  parent nodes until a valid replace is found.
  */
  deleteRange(e, n) {
    return Rc(this, e, n), this;
  }
  /**
  Split the content in the given range off from its parent, if there
  is sibling content before or after it, and move it up the tree to
  the depth specified by `target`. You'll probably want to use
  [`liftTarget`](https://prosemirror.net/docs/ref/#transform.liftTarget) to compute `target`, to make
  sure the lift is valid.
  */
  lift(e, n) {
    return mc(this, e, n), this;
  }
  /**
  Join the blocks around the given position. If depth is 2, their
  last and first siblings are also joined, and so on.
  */
  join(e, n = 1) {
    return _c(this, e, n), this;
  }
  /**
  Wrap the given [range](https://prosemirror.net/docs/ref/#model.NodeRange) in the given set of wrappers.
  The wrappers are assumed to be valid in this position, and should
  probably be computed with [`findWrapping`](https://prosemirror.net/docs/ref/#transform.findWrapping).
  */
  wrap(e, n) {
    return kc(this, e, n), this;
  }
  /**
  Set the type of all textblocks (partly) between `from` and `to` to
  the given node type with the given attributes.
  */
  setBlockType(e, n = e, r, i = null) {
    return xc(this, e, n, r, i), this;
  }
  /**
  Change the type, attributes, and/or marks of the node at `pos`.
  When `type` isn't given, the existing node type is preserved,
  */
  setNodeMarkup(e, n, r = null, i) {
    return yc(this, e, n, r, i), this;
  }
  /**
  Set a single attribute on a given node to a new value.
  The `pos` addresses the document content. Use `setDocAttribute`
  to set attributes on the document itself.
  */
  setNodeAttribute(e, n, r) {
    return this.step(new yt(e, n, r)), this;
  }
  /**
  Set a single attribute on the document to a new value.
  */
  setDocAttribute(e, n) {
    return this.step(new $t(e, n)), this;
  }
  /**
  Add a mark to the node at position `pos`.
  */
  addNodeMark(e, n) {
    return this.step(new Ge(e, n)), this;
  }
  /**
  Remove a mark (or all marks of the given type) from the node at
  position `pos`.
  */
  removeNodeMark(e, n) {
    let r = this.doc.nodeAt(e);
    if (!r)
      throw new RangeError("No node at position " + e);
    if (n instanceof B)
      n.isInSet(r.marks) && this.step(new pt(e, n));
    else {
      let i = r.marks, u, o = [];
      for (; u = n.isInSet(i); )
        o.push(new pt(e, u)), i = u.removeFromSet(i);
      for (let s = o.length - 1; s >= 0; s--)
        this.step(o[s]);
    }
    return this;
  }
  /**
  Split the node at the given position, and optionally, if `depth` is
  greater than one, any number of nodes above that. By default, the
  parts split off will inherit the node type of the original node.
  This can be changed by passing an array of types and attributes to
  use after the split (with the outermost nodes coming first).
  */
  split(e, n = 1, r) {
    return Dc(this, e, n, r), this;
  }
  /**
  Add the given mark to the inline content between `from` and `to`.
  */
  addMark(e, n, r) {
    return dc(this, e, n, r), this;
  }
  /**
  Remove marks from inline nodes between `from` and `to`. When
  `mark` is a single mark, remove precisely that mark. When it is
  a mark type, remove all marks of that type. When it is null,
  remove all marks of any type.
  */
  removeMark(e, n, r) {
    return pc(this, e, n, r), this;
  }
  /**
  Removes all marks and nodes from the content of the node at
  `pos` that don't match the given new parent node type. Accepts
  an optional starting [content match](https://prosemirror.net/docs/ref/#model.ContentMatch) as
  third argument.
  */
  clearIncompatible(e, n, r) {
    return ui(this, e, n, r), this;
  }
}
const fr = /* @__PURE__ */ Object.create(null);
class M {
  /**
  Initialize a selection with the head and anchor and ranges. If no
  ranges are given, constructs a single range across `$anchor` and
  `$head`.
  */
  constructor(e, n, r) {
    this.$anchor = e, this.$head = n, this.ranges = r || [new vc(e.min(n), e.max(n))];
  }
  /**
  The selection's anchor, as an unresolved position.
  */
  get anchor() {
    return this.$anchor.pos;
  }
  /**
  The selection's head.
  */
  get head() {
    return this.$head.pos;
  }
  /**
  The lower bound of the selection's main range.
  */
  get from() {
    return this.$from.pos;
  }
  /**
  The upper bound of the selection's main range.
  */
  get to() {
    return this.$to.pos;
  }
  /**
  The resolved lower  bound of the selection's main range.
  */
  get $from() {
    return this.ranges[0].$from;
  }
  /**
  The resolved upper bound of the selection's main range.
  */
  get $to() {
    return this.ranges[0].$to;
  }
  /**
  Indicates whether the selection contains any content.
  */
  get empty() {
    let e = this.ranges;
    for (let n = 0; n < e.length; n++)
      if (e[n].$from.pos != e[n].$to.pos)
        return !1;
    return !0;
  }
  /**
  Get the content of this selection as a slice.
  */
  content() {
    return this.$from.doc.slice(this.from, this.to, !0);
  }
  /**
  Replace the selection with a slice or, if no slice is given,
  delete the selection. Will append to the given transaction.
  */
  replace(e, n = F.empty) {
    let r = n.content.lastChild, i = null;
    for (let s = 0; s < n.openEnd; s++)
      i = r, r = r.lastChild;
    let u = e.steps.length, o = this.ranges;
    for (let s = 0; s < o.length; s++) {
      let { $from: l, $to: c } = o[s], a = e.mapping.slice(u);
      e.replaceRange(a.map(l.pos), a.map(c.pos), s ? F.empty : n), s == 0 && Li(e, u, (r ? r.isInline : i && i.isTextblock) ? -1 : 1);
    }
  }
  /**
  Replace the selection with the given node, appending the changes
  to the given transaction.
  */
  replaceWith(e, n) {
    let r = e.steps.length, i = this.ranges;
    for (let u = 0; u < i.length; u++) {
      let { $from: o, $to: s } = i[u], l = e.mapping.slice(r), c = l.map(o.pos), a = l.map(s.pos);
      u ? e.deleteRange(c, a) : (e.replaceRangeWith(c, a, n), Li(e, r, n.isInline ? -1 : 1));
    }
  }
  /**
  Find a valid cursor or leaf node selection starting at the given
  position and searching back if `dir` is negative, and forward if
  positive. When `textOnly` is true, only consider cursor
  selections. Will return null when no valid selection position is
  found.
  */
  static findFrom(e, n, r = !1) {
    let i = e.parent.inlineContent ? new N(e) : kt(e.node(0), e.parent, e.pos, e.index(), n, r);
    if (i)
      return i;
    for (let u = e.depth - 1; u >= 0; u--) {
      let o = n < 0 ? kt(e.node(0), e.node(u), e.before(u + 1), e.index(u), n, r) : kt(e.node(0), e.node(u), e.after(u + 1), e.index(u) + 1, n, r);
      if (o)
        return o;
    }
    return null;
  }
  /**
  Find a valid cursor or leaf node selection near the given
  position. Searches forward first by default, but if `bias` is
  negative, it will search backwards first.
  */
  static near(e, n = 1) {
    return this.findFrom(e, n) || this.findFrom(e, -n) || new oe(e.node(0));
  }
  /**
  Find the cursor or leaf node selection closest to the start of
  the given document. Will return an
  [`AllSelection`](https://prosemirror.net/docs/ref/#state.AllSelection) if no valid position
  exists.
  */
  static atStart(e) {
    return kt(e, e, 0, 0, 1) || new oe(e);
  }
  /**
  Find the cursor or leaf node selection closest to the end of the
  given document.
  */
  static atEnd(e) {
    return kt(e, e, e.content.size, e.childCount, -1) || new oe(e);
  }
  /**
  Deserialize the JSON representation of a selection. Must be
  implemented for custom classes (as a static class method).
  */
  static fromJSON(e, n) {
    if (!n || !n.type)
      throw new RangeError("Invalid input for Selection.fromJSON");
    let r = fr[n.type];
    if (!r)
      throw new RangeError(`No selection type ${n.type} defined`);
    return r.fromJSON(e, n);
  }
  /**
  To be able to deserialize selections from JSON, custom selection
  classes must register themselves with an ID string, so that they
  can be disambiguated. Try to pick something that's unlikely to
  clash with classes from other modules.
  */
  static jsonID(e, n) {
    if (e in fr)
      throw new RangeError("Duplicate use of selection JSON ID " + e);
    return fr[e] = n, n.prototype.jsonID = e, n;
  }
  /**
  Get a [bookmark](https://prosemirror.net/docs/ref/#state.SelectionBookmark) for this selection,
  which is a value that can be mapped without having access to a
  current document, and later resolved to a real selection for a
  given document again. (This is used mostly by the history to
  track and restore old selections.) The default implementation of
  this method just converts the selection to a text selection and
  returns the bookmark for that.
  */
  getBookmark() {
    return N.between(this.$anchor, this.$head).getBookmark();
  }
}
M.prototype.visible = !0;
class vc {
  /**
  Create a range.
  */
  constructor(e, n) {
    this.$from = e, this.$to = n;
  }
}
let Ji = !1;
function Gi(t) {
  !Ji && !t.parent.inlineContent && (Ji = !0, console.warn("TextSelection endpoint not pointing into a node with inline content (" + t.parent.type.name + ")"));
}
class N extends M {
  /**
  Construct a text selection between the given points.
  */
  constructor(e, n = e) {
    Gi(e), Gi(n), super(e, n);
  }
  /**
  Returns a resolved position if this is a cursor selection (an
  empty text selection), and null otherwise.
  */
  get $cursor() {
    return this.$anchor.pos == this.$head.pos ? this.$head : null;
  }
  map(e, n) {
    let r = e.resolve(n.map(this.head));
    if (!r.parent.inlineContent)
      return M.near(r);
    let i = e.resolve(n.map(this.anchor));
    return new N(i.parent.inlineContent ? i : r, r);
  }
  replace(e, n = F.empty) {
    if (super.replace(e, n), n == F.empty) {
      let r = this.$from.marksAcross(this.$to);
      r && e.ensureMarks(r);
    }
  }
  eq(e) {
    return e instanceof N && e.anchor == this.anchor && e.head == this.head;
  }
  getBookmark() {
    return new Un(this.anchor, this.head);
  }
  toJSON() {
    return { type: "text", anchor: this.anchor, head: this.head };
  }
  /**
  @internal
  */
  static fromJSON(e, n) {
    if (typeof n.anchor != "number" || typeof n.head != "number")
      throw new RangeError("Invalid input for TextSelection.fromJSON");
    return new N(e.resolve(n.anchor), e.resolve(n.head));
  }
  /**
  Create a text selection from non-resolved positions.
  */
  static create(e, n, r = n) {
    let i = e.resolve(n);
    return new this(i, r == n ? i : e.resolve(r));
  }
  /**
  Return a text selection that spans the given positions or, if
  they aren't text positions, find a text selection near them.
  `bias` determines whether the method searches forward (default)
  or backwards (negative number) first. Will fall back to calling
  [`Selection.near`](https://prosemirror.net/docs/ref/#state.Selection^near) when the document
  doesn't contain a valid text position.
  */
  static between(e, n, r) {
    let i = e.pos - n.pos;
    if ((!r || i) && (r = i >= 0 ? 1 : -1), !n.parent.inlineContent) {
      let u = M.findFrom(n, r, !0) || M.findFrom(n, -r, !0);
      if (u)
        n = u.$head;
      else
        return M.near(n, r);
    }
    return e.parent.inlineContent || (i == 0 ? e = n : (e = (M.findFrom(e, -r, !0) || M.findFrom(e, r, !0)).$anchor, e.pos < n.pos != i < 0 && (e = n))), new N(e, n);
  }
}
M.jsonID("text", N);
class Un {
  constructor(e, n) {
    this.anchor = e, this.head = n;
  }
  map(e) {
    return new Un(e.map(this.anchor), e.map(this.head));
  }
  resolve(e) {
    return N.between(e.resolve(this.anchor), e.resolve(this.head));
  }
}
class w extends M {
  /**
  Create a node selection. Does not verify the validity of its
  argument.
  */
  constructor(e) {
    let n = e.nodeAfter, r = e.node(0).resolve(e.pos + n.nodeSize);
    super(e, r), this.node = n;
  }
  map(e, n) {
    let { deleted: r, pos: i } = n.mapResult(this.anchor), u = e.resolve(i);
    return r ? M.near(u) : new w(u);
  }
  content() {
    return new F(y.from(this.node), 0, 0);
  }
  eq(e) {
    return e instanceof w && e.anchor == this.anchor;
  }
  toJSON() {
    return { type: "node", anchor: this.anchor };
  }
  getBookmark() {
    return new li(this.anchor);
  }
  /**
  @internal
  */
  static fromJSON(e, n) {
    if (typeof n.anchor != "number")
      throw new RangeError("Invalid input for NodeSelection.fromJSON");
    return new w(e.resolve(n.anchor));
  }
  /**
  Create a node selection from non-resolved positions.
  */
  static create(e, n) {
    return new w(e.resolve(n));
  }
  /**
  Determines whether the given node may be selected as a node
  selection.
  */
  static isSelectable(e) {
    return !e.isText && e.type.spec.selectable !== !1;
  }
}
w.prototype.visible = !1;
M.jsonID("node", w);
class li {
  constructor(e) {
    this.anchor = e;
  }
  map(e) {
    let { deleted: n, pos: r } = e.mapResult(this.anchor);
    return n ? new Un(r, r) : new li(r);
  }
  resolve(e) {
    let n = e.resolve(this.anchor), r = n.nodeAfter;
    return r && w.isSelectable(r) ? new w(n) : M.near(n);
  }
}
class oe extends M {
  /**
  Create an all-selection over the given document.
  */
  constructor(e) {
    super(e.resolve(0), e.resolve(e.content.size));
  }
  replace(e, n = F.empty) {
    if (n == F.empty) {
      e.delete(0, e.doc.content.size);
      let r = M.atStart(e.doc);
      r.eq(e.selection) || e.setSelection(r);
    } else
      super.replace(e, n);
  }
  toJSON() {
    return { type: "all" };
  }
  /**
  @internal
  */
  static fromJSON(e) {
    return new oe(e);
  }
  map(e) {
    return new oe(e);
  }
  eq(e) {
    return e instanceof oe;
  }
  getBookmark() {
    return zc;
  }
}
M.jsonID("all", oe);
const zc = {
  map() {
    return this;
  },
  resolve(t) {
    return new oe(t);
  }
};
function kt(t, e, n, r, i, u = !1) {
  if (e.inlineContent)
    return N.create(t, n);
  for (let o = r - (i > 0 ? 0 : 1); i > 0 ? o < e.childCount : o >= 0; o += i) {
    let s = e.child(o);
    if (s.isAtom) {
      if (!u && w.isSelectable(s))
        return w.create(t, n - (i < 0 ? s.nodeSize : 0));
    } else {
      let l = kt(t, s, n + i, i < 0 ? s.childCount : 0, i, u);
      if (l)
        return l;
    }
    n += s.nodeSize * i;
  }
  return null;
}
function Li(t, e, n) {
  let r = t.steps.length - 1;
  if (r < e)
    return;
  let i = t.steps[r];
  if (!(i instanceof W || i instanceof U))
    return;
  let u = t.mapping.maps[r], o;
  u.forEach((s, l, c, a) => {
    o == null && (o = a);
  }), t.setSelection(M.near(t.doc.resolve(o), n));
}
const Zi = 1, En = 2, Yi = 4;
class Qc extends Tc {
  /**
  @internal
  */
  constructor(e) {
    super(e.doc), this.curSelectionFor = 0, this.updated = 0, this.meta = /* @__PURE__ */ Object.create(null), this.time = Date.now(), this.curSelection = e.selection, this.storedMarks = e.storedMarks;
  }
  /**
  The transaction's current selection. This defaults to the editor
  selection [mapped](https://prosemirror.net/docs/ref/#state.Selection.map) through the steps in the
  transaction, but can be overwritten with
  [`setSelection`](https://prosemirror.net/docs/ref/#state.Transaction.setSelection).
  */
  get selection() {
    return this.curSelectionFor < this.steps.length && (this.curSelection = this.curSelection.map(this.doc, this.mapping.slice(this.curSelectionFor)), this.curSelectionFor = this.steps.length), this.curSelection;
  }
  /**
  Update the transaction's current selection. Will determine the
  selection that the editor gets when the transaction is applied.
  */
  setSelection(e) {
    if (e.$from.doc != this.doc)
      throw new RangeError("Selection passed to setSelection must point at the current document");
    return this.curSelection = e, this.curSelectionFor = this.steps.length, this.updated = (this.updated | Zi) & ~En, this.storedMarks = null, this;
  }
  /**
  Whether the selection was explicitly updated by this transaction.
  */
  get selectionSet() {
    return (this.updated & Zi) > 0;
  }
  /**
  Set the current stored marks.
  */
  setStoredMarks(e) {
    return this.storedMarks = e, this.updated |= En, this;
  }
  /**
  Make sure the current stored marks or, if that is null, the marks
  at the selection, match the given set of marks. Does nothing if
  this is already the case.
  */
  ensureMarks(e) {
    return B.sameSet(this.storedMarks || this.selection.$from.marks(), e) || this.setStoredMarks(e), this;
  }
  /**
  Add a mark to the set of stored marks.
  */
  addStoredMark(e) {
    return this.ensureMarks(e.addToSet(this.storedMarks || this.selection.$head.marks()));
  }
  /**
  Remove a mark or mark type from the set of stored marks.
  */
  removeStoredMark(e) {
    return this.ensureMarks(e.removeFromSet(this.storedMarks || this.selection.$head.marks()));
  }
  /**
  Whether the stored marks were explicitly set for this transaction.
  */
  get storedMarksSet() {
    return (this.updated & En) > 0;
  }
  /**
  @internal
  */
  addStep(e, n) {
    super.addStep(e, n), this.updated = this.updated & ~En, this.storedMarks = null;
  }
  /**
  Update the timestamp for the transaction.
  */
  setTime(e) {
    return this.time = e, this;
  }
  /**
  Replace the current selection with the given slice.
  */
  replaceSelection(e) {
    return this.selection.replace(this, e), this;
  }
  /**
  Replace the selection with the given node. When `inheritMarks` is
  true and the content is inline, it inherits the marks from the
  place where it is inserted.
  */
  replaceSelectionWith(e, n = !0) {
    let r = this.selection;
    return n && (e = e.mark(this.storedMarks || (r.empty ? r.$from.marks() : r.$from.marksAcross(r.$to) || B.none))), r.replaceWith(this, e), this;
  }
  /**
  Delete the selection.
  */
  deleteSelection() {
    return this.selection.replace(this), this;
  }
  /**
  Replace the given range, or the selection if no range is given,
  with a text node containing the given string.
  */
  insertText(e, n, r) {
    let i = this.doc.type.schema;
    if (n == null)
      return e ? this.replaceSelectionWith(i.text(e), !0) : this.deleteSelection();
    {
      if (r == null && (r = n), !e)
        return this.deleteRange(n, r);
      let u = this.storedMarks;
      if (!u) {
        let o = this.doc.resolve(n);
        u = r == n ? o.marks() : o.marksAcross(this.doc.resolve(r));
      }
      return this.replaceRangeWith(n, r, i.text(e, u)), !this.selection.empty && this.selection.to == n + e.length && this.setSelection(M.near(this.selection.$to)), this;
    }
  }
  /**
  Store a metadata property in this transaction, keyed either by
  name or by plugin.
  */
  setMeta(e, n) {
    return this.meta[typeof e == "string" ? e : e.key] = n, this;
  }
  /**
  Retrieve a metadata property for a given name or plugin.
  */
  getMeta(e) {
    return this.meta[typeof e == "string" ? e : e.key];
  }
  /**
  Returns true if this transaction doesn't contain any metadata,
  and can thus safely be extended.
  */
  get isGeneric() {
    for (let e in this.meta)
      return !1;
    return !0;
  }
  /**
  Indicate that the editor should scroll the selection into view
  when updated to the state produced by this transaction.
  */
  scrollIntoView() {
    return this.updated |= Yi, this;
  }
  /**
  True when this transaction has had `scrollIntoView` called on it.
  */
  get scrolledIntoView() {
    return (this.updated & Yi) > 0;
  }
}
function Hi(t, e) {
  return !e || !t ? t : t.bind(e);
}
class Wt {
  constructor(e, n, r) {
    this.name = e, this.init = Hi(n.init, r), this.apply = Hi(n.apply, r);
  }
}
const Kc = [
  new Wt("doc", {
    init(t) {
      return t.doc || t.schema.topNodeType.createAndFill();
    },
    apply(t) {
      return t.doc;
    }
  }),
  new Wt("selection", {
    init(t, e) {
      return t.selection || M.atStart(e.doc);
    },
    apply(t) {
      return t.selection;
    }
  }),
  new Wt("storedMarks", {
    init(t) {
      return t.storedMarks || null;
    },
    apply(t, e, n, r) {
      return r.selection.$cursor ? t.storedMarks : null;
    }
  }),
  new Wt("scrollToSelection", {
    init() {
      return 0;
    },
    apply(t, e) {
      return t.scrolledIntoView ? e + 1 : e;
    }
  })
];
class hr {
  constructor(e, n) {
    this.schema = e, this.plugins = [], this.pluginsByKey = /* @__PURE__ */ Object.create(null), this.fields = Kc.slice(), n && n.forEach((r) => {
      if (this.pluginsByKey[r.key])
        throw new RangeError("Adding different instances of a keyed plugin (" + r.key + ")");
      this.plugins.push(r), this.pluginsByKey[r.key] = r, r.spec.state && this.fields.push(new Wt(r.key, r.spec.state, r));
    });
  }
}
class it {
  /**
  @internal
  */
  constructor(e) {
    this.config = e;
  }
  /**
  The schema of the state's document.
  */
  get schema() {
    return this.config.schema;
  }
  /**
  The plugins that are active in this state.
  */
  get plugins() {
    return this.config.plugins;
  }
  /**
  Apply the given transaction to produce a new state.
  */
  apply(e) {
    return this.applyTransaction(e).state;
  }
  /**
  @internal
  */
  filterTransaction(e, n = -1) {
    for (let r = 0; r < this.config.plugins.length; r++)
      if (r != n) {
        let i = this.config.plugins[r];
        if (i.spec.filterTransaction && !i.spec.filterTransaction.call(i, e, this))
          return !1;
      }
    return !0;
  }
  /**
  Verbose variant of [`apply`](https://prosemirror.net/docs/ref/#state.EditorState.apply) that
  returns the precise transactions that were applied (which might
  be influenced by the [transaction
  hooks](https://prosemirror.net/docs/ref/#state.PluginSpec.filterTransaction) of
  plugins) along with the new state.
  */
  applyTransaction(e) {
    if (!this.filterTransaction(e))
      return { state: this, transactions: [] };
    let n = [e], r = this.applyInner(e), i = null;
    for (; ; ) {
      let u = !1;
      for (let o = 0; o < this.config.plugins.length; o++) {
        let s = this.config.plugins[o];
        if (s.spec.appendTransaction) {
          let l = i ? i[o].n : 0, c = i ? i[o].state : this, a = l < n.length && s.spec.appendTransaction.call(s, l ? n.slice(l) : n, c, r);
          if (a && r.filterTransaction(a, o)) {
            if (a.setMeta("appendedTransaction", e), !i) {
              i = [];
              for (let f = 0; f < this.config.plugins.length; f++)
                i.push(f < o ? { state: r, n: n.length } : { state: this, n: 0 });
            }
            n.push(a), r = r.applyInner(a), u = !0;
          }
          i && (i[o] = { state: r, n: n.length });
        }
      }
      if (!u)
        return { state: r, transactions: n };
    }
  }
  /**
  @internal
  */
  applyInner(e) {
    if (!e.before.eq(this.doc))
      throw new RangeError("Applying a mismatched transaction");
    let n = new it(this.config), r = this.config.fields;
    for (let i = 0; i < r.length; i++) {
      let u = r[i];
      n[u.name] = u.apply(e, this[u.name], this, n);
    }
    return n;
  }
  /**
  Accessor that constructs and returns a new [transaction](https://prosemirror.net/docs/ref/#state.Transaction) from this state.
  */
  get tr() {
    return new Qc(this);
  }
  /**
  Create a new state.
  */
  static create(e) {
    let n = new hr(e.doc ? e.doc.type.schema : e.schema, e.plugins), r = new it(n);
    for (let i = 0; i < n.fields.length; i++)
      r[n.fields[i].name] = n.fields[i].init(e, r);
    return r;
  }
  /**
  Create a new state based on this one, but with an adjusted set
  of active plugins. State fields that exist in both sets of
  plugins are kept unchanged. Those that no longer exist are
  dropped, and those that are new are initialized using their
  [`init`](https://prosemirror.net/docs/ref/#state.StateField.init) method, passing in the new
  configuration object..
  */
  reconfigure(e) {
    let n = new hr(this.schema, e.plugins), r = n.fields, i = new it(n);
    for (let u = 0; u < r.length; u++) {
      let o = r[u].name;
      i[o] = this.hasOwnProperty(o) ? this[o] : r[u].init(e, i);
    }
    return i;
  }
  /**
  Serialize this state to JSON. If you want to serialize the state
  of plugins, pass an object mapping property names to use in the
  resulting JSON object to plugin objects. The argument may also be
  a string or number, in which case it is ignored, to support the
  way `JSON.stringify` calls `toString` methods.
  */
  toJSON(e) {
    let n = { doc: this.doc.toJSON(), selection: this.selection.toJSON() };
    if (this.storedMarks && (n.storedMarks = this.storedMarks.map((r) => r.toJSON())), e && typeof e == "object")
      for (let r in e) {
        if (r == "doc" || r == "selection")
          throw new RangeError("The JSON fields `doc` and `selection` are reserved");
        let i = e[r], u = i.spec.state;
        u && u.toJSON && (n[r] = u.toJSON.call(i, this[i.key]));
      }
    return n;
  }
  /**
  Deserialize a JSON representation of a state. `config` should
  have at least a `schema` field, and should contain array of
  plugins to initialize the state with. `pluginFields` can be used
  to deserialize the state of plugins, by associating plugin
  instances with the property names they use in the JSON object.
  */
  static fromJSON(e, n, r) {
    if (!n)
      throw new RangeError("Invalid input for EditorState.fromJSON");
    if (!e.schema)
      throw new RangeError("Required config field 'schema' missing");
    let i = new hr(e.schema, e.plugins), u = new it(i);
    return i.fields.forEach((o) => {
      if (o.name == "doc")
        u.doc = ye.fromJSON(e.schema, n.doc);
      else if (o.name == "selection")
        u.selection = M.fromJSON(u.doc, n.selection);
      else if (o.name == "storedMarks")
        n.storedMarks && (u.storedMarks = n.storedMarks.map(e.schema.markFromJSON));
      else {
        if (r)
          for (let s in r) {
            let l = r[s], c = l.spec.state;
            if (l.key == o.name && c && c.fromJSON && Object.prototype.hasOwnProperty.call(n, s)) {
              u[o.name] = c.fromJSON.call(l, e, n[s], u);
              return;
            }
          }
        u[o.name] = o.init(e, u);
      }
    }), u;
  }
}
function Ho(t, e, n) {
  for (let r in t) {
    let i = t[r];
    i instanceof Function ? i = i.bind(e) : r == "handleDOMEvents" && (i = Ho(i, e, {})), n[r] = i;
  }
  return n;
}
class Vo {
  /**
  Create a plugin.
  */
  constructor(e) {
    this.spec = e, this.props = {}, e.props && Ho(e.props, this, this.props), this.key = e.key ? e.key.key : Uo("plugin");
  }
  /**
  Extract the plugin's state field from an editor state.
  */
  getState(e) {
    return e[this.key];
  }
}
const dr = /* @__PURE__ */ Object.create(null);
function Uo(t) {
  return t in dr ? t + "$" + ++dr[t] : (dr[t] = 0, t + "$");
}
class $o {
  /**
  Create a plugin key.
  */
  constructor(e = "key") {
    this.key = Uo(e);
  }
  /**
  Get the active plugin with this key, if any, from an editor
  state.
  */
  get(e) {
    return e.config.pluginsByKey[this.key];
  }
  /**
  Get the plugin's state from an editor state.
  */
  getState(e) {
    return e[this.key];
  }
}
const Y = function(t) {
  for (var e = 0; ; e++)
    if (t = t.previousSibling, !t)
      return e;
}, _t = function(t) {
  let e = t.assignedSlot || t.parentNode;
  return e && e.nodeType == 11 ? e.host : e;
};
let Jr = null;
const Be = function(t, e, n) {
  let r = Jr || (Jr = document.createRange());
  return r.setEnd(t, n ?? t.nodeValue.length), r.setStart(t, e || 0), r;
}, Wc = function() {
  Jr = null;
}, At = function(t, e, n, r) {
  return n && (Vi(t, e, n, r, -1) || Vi(t, e, n, r, 1));
}, Pc = /^(img|br|input|textarea|hr)$/i;
function Vi(t, e, n, r, i) {
  for (var u; ; ) {
    if (t == n && e == r)
      return !0;
    if (e == (i < 0 ? 0 : ce(t))) {
      let o = t.parentNode;
      if (!o || o.nodeType != 1 || pn(t) || Pc.test(t.nodeName) || t.contentEditable == "false")
        return !1;
      e = Y(t) + (i < 0 ? 0 : 1), t = o;
    } else if (t.nodeType == 1) {
      let o = t.childNodes[e + (i < 0 ? -1 : 0)];
      if (o.nodeType == 1 && o.contentEditable == "false")
        if (!((u = o.pmViewDesc) === null || u === void 0) && u.ignoreForSelection)
          e += i;
        else
          return !1;
      else
        t = o, e = i < 0 ? ce(t) : 0;
    } else
      return !1;
  }
}
function ce(t) {
  return t.nodeType == 3 ? t.nodeValue.length : t.childNodes.length;
}
function Jc(t, e) {
  for (; ; ) {
    if (t.nodeType == 3 && e)
      return t;
    if (t.nodeType == 1 && e > 0) {
      if (t.contentEditable == "false")
        return null;
      t = t.childNodes[e - 1], e = ce(t);
    } else if (t.parentNode && !pn(t))
      e = Y(t), t = t.parentNode;
    else
      return null;
  }
}
function Gc(t, e) {
  for (; ; ) {
    if (t.nodeType == 3 && e < t.nodeValue.length)
      return t;
    if (t.nodeType == 1 && e < t.childNodes.length) {
      if (t.contentEditable == "false")
        return null;
      t = t.childNodes[e], e = 0;
    } else if (t.parentNode && !pn(t))
      e = Y(t) + 1, t = t.parentNode;
    else
      return null;
  }
}
function Lc(t, e, n) {
  for (let r = e == 0, i = e == ce(t); r || i; ) {
    if (t == n)
      return !0;
    let u = Y(t);
    if (t = t.parentNode, !t)
      return !1;
    r = r && u == 0, i = i && u == ce(t);
  }
}
function pn(t) {
  let e;
  for (let n = t; n && !(e = n.pmViewDesc); n = n.parentNode)
    ;
  return e && e.node && e.node.isBlock && (e.dom == t || e.contentDOM == t);
}
const $n = function(t) {
  return t.focusNode && At(t.focusNode, t.focusOffset, t.anchorNode, t.anchorOffset);
};
function rt(t, e) {
  let n = document.createEvent("Event");
  return n.initEvent("keydown", !0, !0), n.keyCode = t, n.key = n.code = e, n;
}
function Zc(t) {
  let e = t.activeElement;
  for (; e && e.shadowRoot; )
    e = e.shadowRoot.activeElement;
  return e;
}
function Yc(t, e, n) {
  if (t.caretPositionFromPoint)
    try {
      let r = t.caretPositionFromPoint(e, n);
      if (r)
        return { node: r.offsetNode, offset: Math.min(ce(r.offsetNode), r.offset) };
    } catch {
    }
  if (t.caretRangeFromPoint) {
    let r = t.caretRangeFromPoint(e, n);
    if (r)
      return { node: r.startContainer, offset: Math.min(ce(r.startContainer), r.startOffset) };
  }
}
const De = typeof navigator < "u" ? navigator : null, Ui = typeof document < "u" ? document : null, Xe = De && De.userAgent || "", Gr = /Edge\/(\d+)/.exec(Xe), qo = /MSIE \d/.exec(Xe), Lr = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(Xe), ne = !!(qo || Lr || Gr), Ze = qo ? document.documentMode : Lr ? +Lr[1] : Gr ? +Gr[1] : 0, ae = !ne && /gecko\/(\d+)/i.test(Xe);
ae && +(/Firefox\/(\d+)/.exec(Xe) || [0, 0])[1];
const Zr = !ne && /Chrome\/(\d+)/.exec(Xe), V = !!Zr, jo = Zr ? +Zr[1] : 0, q = !ne && !!De && /Apple Computer/.test(De.vendor), wt = q && (/Mobile\/\w+/.test(Xe) || !!De && De.maxTouchPoints > 2), le = wt || (De ? /Mac/.test(De.platform) : !1), Xo = De ? /Win/.test(De.platform) : !1, Ne = /Android \d/.test(Xe), An = !!Ui && "webkitFontSmoothing" in Ui.documentElement.style, Hc = An ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0;
function Vc(t) {
  let e = t.defaultView && t.defaultView.visualViewport;
  return e ? {
    left: 0,
    right: e.width,
    top: 0,
    bottom: e.height
  } : {
    left: 0,
    right: t.documentElement.clientWidth,
    top: 0,
    bottom: t.documentElement.clientHeight
  };
}
function Ie(t, e) {
  return typeof t == "number" ? t : t[e];
}
function Uc(t) {
  let e = t.getBoundingClientRect(), n = e.width / t.offsetWidth || 1, r = e.height / t.offsetHeight || 1;
  return {
    left: e.left,
    right: e.left + t.clientWidth * n,
    top: e.top,
    bottom: e.top + t.clientHeight * r
  };
}
function $i(t, e, n) {
  if (!Yr(e) && e.left == 0)
    return;
  let r = t.someProp("scrollThreshold") || 0, i = t.someProp("scrollMargin") || 5, u = t.dom.ownerDocument;
  for (let o = n || t.dom; o; ) {
    if (o.nodeType != 1) {
      o = _t(o);
      continue;
    }
    let s = o, l = s == u.body, c = l ? Vc(u) : Uc(s), a = 0, f = 0;
    if (e.top < c.top + Ie(r, "top") ? f = -(c.top - e.top + Ie(i, "top")) : e.bottom > c.bottom - Ie(r, "bottom") && (f = e.bottom - e.top > c.bottom - c.top ? e.top + Ie(i, "top") - c.top : e.bottom - c.bottom + Ie(i, "bottom")), e.left < c.left + Ie(r, "left") ? a = -(c.left - e.left + Ie(i, "left")) : e.right > c.right - Ie(r, "right") && (a = e.right - c.right + Ie(i, "right")), a || f)
      if (l)
        u.defaultView.scrollBy(a, f);
      else {
        let d = s.scrollLeft, h = s.scrollTop;
        f && (s.scrollTop += f), a && (s.scrollLeft += a);
        let A = s.scrollLeft - d, m = s.scrollTop - h;
        e = { left: e.left - A, top: e.top - m, right: e.right - A, bottom: e.bottom - m };
      }
    let p = l ? "fixed" : getComputedStyle(o).position;
    if (/^(fixed|sticky)$/.test(p))
      break;
    o = p == "absolute" ? o.offsetParent : _t(o);
  }
}
function $c(t) {
  let e = t.dom.getBoundingClientRect(), n = Math.max(0, e.top), r, i;
  for (let u = (e.left + e.right) / 2, o = n + 1; o < Math.min(innerHeight, e.bottom); o += 5) {
    let s = t.root.elementFromPoint(u, o);
    if (!s || s == t.dom || !t.dom.contains(s))
      continue;
    let l = s.getBoundingClientRect();
    if (l.top >= n - 20) {
      r = s, i = l.top;
      break;
    }
  }
  return { refDOM: r, refTop: i, stack: es(t.dom) };
}
function es(t) {
  let e = [], n = t.ownerDocument;
  for (let r = t; r && (e.push({ dom: r, top: r.scrollTop, left: r.scrollLeft }), t != n); r = _t(r))
    ;
  return e;
}
function qc({ refDOM: t, refTop: e, stack: n }) {
  let r = t ? t.getBoundingClientRect().top : 0;
  ts(n, r == 0 ? 0 : r - e);
}
function ts(t, e) {
  for (let n = 0; n < t.length; n++) {
    let { dom: r, top: i, left: u } = t[n];
    r.scrollTop != i + e && (r.scrollTop = i + e), r.scrollLeft != u && (r.scrollLeft = u);
  }
}
let gt = null;
function jc(t) {
  if (t.setActive)
    return t.setActive();
  if (gt)
    return t.focus(gt);
  let e = es(t);
  t.focus(gt == null ? {
    get preventScroll() {
      return gt = { preventScroll: !0 }, !0;
    }
  } : void 0), gt || (gt = !1, ts(e, 0));
}
function ns(t, e) {
  let n, r = 2e8, i, u = 0, o = e.top, s = e.top, l, c;
  for (let a = t.firstChild, f = 0; a; a = a.nextSibling, f++) {
    let p;
    if (a.nodeType == 1)
      p = a.getClientRects();
    else if (a.nodeType == 3)
      p = Be(a).getClientRects();
    else
      continue;
    for (let d = 0; d < p.length; d++) {
      let h = p[d];
      if (h.top <= o && h.bottom >= s) {
        o = Math.max(h.bottom, o), s = Math.min(h.top, s);
        let A = h.left > e.left ? h.left - e.left : h.right < e.left ? e.left - h.right : 0;
        if (A < r) {
          n = a, r = A, i = A && n.nodeType == 3 ? {
            left: h.right < e.left ? h.right : h.left,
            top: e.top
          } : e, a.nodeType == 1 && A && (u = f + (e.left >= (h.left + h.right) / 2 ? 1 : 0));
          continue;
        }
      } else h.top > e.top && !l && h.left <= e.left && h.right >= e.left && (l = a, c = { left: Math.max(h.left, Math.min(h.right, e.left)), top: h.top });
      !n && (e.left >= h.right && e.top >= h.top || e.left >= h.left && e.top >= h.bottom) && (u = f + 1);
    }
  }
  return !n && l && (n = l, i = c, r = 0), n && n.nodeType == 3 ? Xc(n, i) : !n || r && n.nodeType == 1 ? { node: t, offset: u } : ns(n, i);
}
function Xc(t, e) {
  let n = t.nodeValue.length, r = document.createRange(), i;
  for (let u = 0; u < n; u++) {
    r.setEnd(t, u + 1), r.setStart(t, u);
    let o = ve(r, 1);
    if (o.top != o.bottom && ci(e, o)) {
      i = { node: t, offset: u + (e.left >= (o.left + o.right) / 2 ? 1 : 0) };
      break;
    }
  }
  return r.detach(), i || { node: t, offset: 0 };
}
function ci(t, e) {
  return t.left >= e.left - 1 && t.left <= e.right + 1 && t.top >= e.top - 1 && t.top <= e.bottom + 1;
}
function ea(t, e) {
  let n = t.parentNode;
  return n && /^li$/i.test(n.nodeName) && e.left < t.getBoundingClientRect().left ? n : t;
}
function ta(t, e, n) {
  let { node: r, offset: i } = ns(e, n), u = -1;
  if (r.nodeType == 1 && !r.firstChild) {
    let o = r.getBoundingClientRect();
    u = o.left != o.right && n.left > (o.left + o.right) / 2 ? 1 : -1;
  }
  return t.docView.posFromDOM(r, i, u);
}
function na(t, e, n, r) {
  let i = -1;
  for (let u = e, o = !1; u != t.dom; ) {
    let s = t.docView.nearestDesc(u, !0), l;
    if (!s)
      return null;
    if (s.dom.nodeType == 1 && (s.node.isBlock && s.parent || !s.contentDOM) && // Ignore elements with zero-size bounding rectangles
    ((l = s.dom.getBoundingClientRect()).width || l.height) && (s.node.isBlock && s.parent && !/^T(R|BODY|HEAD|FOOT)$/.test(s.dom.nodeName) && (!o && l.left > r.left || l.top > r.top ? i = s.posBefore : (!o && l.right < r.left || l.bottom < r.top) && (i = s.posAfter), o = !0), !s.contentDOM && i < 0 && !s.node.isText))
      return (s.node.isBlock ? r.top < (l.top + l.bottom) / 2 : r.left < (l.left + l.right) / 2) ? s.posBefore : s.posAfter;
    u = s.dom.parentNode;
  }
  return i > -1 ? i : t.docView.posFromDOM(e, n, -1);
}
function rs(t, e, n) {
  let r = t.childNodes.length;
  if (r && n.top < n.bottom)
    for (let i = Math.max(0, Math.min(r - 1, Math.floor(r * (e.top - n.top) / (n.bottom - n.top)) - 2)), u = i; ; ) {
      let o = t.childNodes[u];
      if (o.nodeType == 1) {
        let s = o.getClientRects();
        for (let l = 0; l < s.length; l++) {
          let c = s[l];
          if (ci(e, c))
            return rs(o, e, c);
        }
      }
      if ((u = (u + 1) % r) == i)
        break;
    }
  return t;
}
function ra(t, e) {
  let n = t.dom.ownerDocument, r, i = 0, u = Yc(n, e.left, e.top);
  u && ({ node: r, offset: i } = u);
  let o = (t.root.elementFromPoint ? t.root : n).elementFromPoint(e.left, e.top), s;
  if (!o || !t.dom.contains(o.nodeType != 1 ? o.parentNode : o)) {
    let c = t.dom.getBoundingClientRect();
    if (!ci(e, c) || (o = rs(t.dom, e, c), !o))
      return null;
  }
  if (q)
    for (let c = o; r && c; c = _t(c))
      c.draggable && (r = void 0);
  if (o = ea(o, e), r) {
    if (ae && r.nodeType == 1 && (i = Math.min(i, r.childNodes.length), i < r.childNodes.length)) {
      let a = r.childNodes[i], f;
      a.nodeName == "IMG" && (f = a.getBoundingClientRect()).right <= e.left && f.bottom > e.top && i++;
    }
    let c;
    An && i && r.nodeType == 1 && (c = r.childNodes[i - 1]).nodeType == 1 && c.contentEditable == "false" && c.getBoundingClientRect().top >= e.top && i--, r == t.dom && i == r.childNodes.length - 1 && r.lastChild.nodeType == 1 && e.top > r.lastChild.getBoundingClientRect().bottom ? s = t.state.doc.content.size : (i == 0 || r.nodeType != 1 || r.childNodes[i - 1].nodeName != "BR") && (s = na(t, r, i, e));
  }
  s == null && (s = ta(t, o, e));
  let l = t.docView.nearestDesc(o, !0);
  return { pos: s, inside: l ? l.posAtStart - l.border : -1 };
}
function Yr(t) {
  return t.top < t.bottom || t.left < t.right;
}
function ve(t, e) {
  let n = t.getClientRects();
  if (n.length) {
    let r = n[e < 0 ? 0 : n.length - 1];
    if (Yr(r))
      return r;
  }
  return Array.prototype.find.call(n, Yr) || t.getBoundingClientRect();
}
const ia = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
function is(t, e, n) {
  let { node: r, offset: i, atom: u } = t.docView.domFromPos(e, n < 0 ? -1 : 1), o = An || ae;
  if (r.nodeType == 3)
    if (o && (ia.test(r.nodeValue) || (n < 0 ? !i : i == r.nodeValue.length))) {
      let l = ve(Be(r, i, i), n);
      if (ae && i && /\s/.test(r.nodeValue[i - 1]) && i < r.nodeValue.length) {
        let c = ve(Be(r, i - 1, i - 1), -1);
        if (c.top == l.top) {
          let a = ve(Be(r, i, i + 1), -1);
          if (a.top != l.top)
            return Tt(a, a.left < c.left);
        }
      }
      return l;
    } else {
      let l = i, c = i, a = n < 0 ? 1 : -1;
      return n < 0 && !i ? (c++, a = -1) : n >= 0 && i == r.nodeValue.length ? (l--, a = 1) : n < 0 ? l-- : c++, Tt(ve(Be(r, l, c), a), a < 0);
    }
  if (!t.state.doc.resolve(e - (u || 0)).parent.inlineContent) {
    if (u == null && i && (n < 0 || i == ce(r))) {
      let l = r.childNodes[i - 1];
      if (l.nodeType == 1)
        return pr(l.getBoundingClientRect(), !1);
    }
    if (u == null && i < ce(r)) {
      let l = r.childNodes[i];
      if (l.nodeType == 1)
        return pr(l.getBoundingClientRect(), !0);
    }
    return pr(r.getBoundingClientRect(), n >= 0);
  }
  if (u == null && i && (n < 0 || i == ce(r))) {
    let l = r.childNodes[i - 1], c = l.nodeType == 3 ? Be(l, ce(l) - (o ? 0 : 1)) : l.nodeType == 1 && (l.nodeName != "BR" || !l.nextSibling) ? l : null;
    if (c)
      return Tt(ve(c, 1), !1);
  }
  if (u == null && i < ce(r)) {
    let l = r.childNodes[i];
    for (; l.pmViewDesc && l.pmViewDesc.ignoreForCoords; )
      l = l.nextSibling;
    let c = l ? l.nodeType == 3 ? Be(l, 0, o ? 0 : 1) : l.nodeType == 1 ? l : null : null;
    if (c)
      return Tt(ve(c, -1), !0);
  }
  return Tt(ve(r.nodeType == 3 ? Be(r) : r, -n), n >= 0);
}
function Tt(t, e) {
  if (t.width == 0)
    return t;
  let n = e ? t.left : t.right;
  return { top: t.top, bottom: t.bottom, left: n, right: n };
}
function pr(t, e) {
  if (t.height == 0)
    return t;
  let n = e ? t.top : t.bottom;
  return { top: n, bottom: n, left: t.left, right: t.right };
}
function us(t, e, n) {
  let r = t.state, i = t.root.activeElement;
  r != e && t.updateState(e), i != t.dom && t.focus();
  try {
    return n();
  } finally {
    r != e && t.updateState(r), i != t.dom && i && i.focus();
  }
}
function ua(t, e, n) {
  let r = e.selection, i = n == "up" ? r.$from : r.$to;
  return us(t, e, () => {
    let { node: u } = t.docView.domFromPos(i.pos, n == "up" ? -1 : 1);
    for (; ; ) {
      let s = t.docView.nearestDesc(u, !0);
      if (!s)
        break;
      if (s.node.isBlock) {
        u = s.contentDOM || s.dom;
        break;
      }
      u = s.dom.parentNode;
    }
    let o = is(t, i.pos, 1);
    for (let s = u.firstChild; s; s = s.nextSibling) {
      let l;
      if (s.nodeType == 1)
        l = s.getClientRects();
      else if (s.nodeType == 3)
        l = Be(s, 0, s.nodeValue.length).getClientRects();
      else
        continue;
      for (let c = 0; c < l.length; c++) {
        let a = l[c];
        if (a.bottom > a.top + 1 && (n == "up" ? o.top - a.top > (a.bottom - o.top) * 2 : a.bottom - o.bottom > (o.bottom - a.top) * 2))
          return !1;
      }
    }
    return !0;
  });
}
const oa = /[\u0590-\u08ac]/;
function sa(t, e, n) {
  let { $head: r } = e.selection;
  if (!r.parent.isTextblock)
    return !1;
  let i = r.parentOffset, u = !i, o = i == r.parent.content.size, s = t.domSelection();
  return s ? !oa.test(r.parent.textContent) || !s.modify ? n == "left" || n == "backward" ? u : o : us(t, e, () => {
    let { focusNode: l, focusOffset: c, anchorNode: a, anchorOffset: f } = t.domSelectionRange(), p = s.caretBidiLevel;
    s.modify("move", n, "character");
    let d = r.depth ? t.docView.domAfterPos(r.before()) : t.dom, { focusNode: h, focusOffset: A } = t.domSelectionRange(), m = h && !d.contains(h.nodeType == 1 ? h : h.parentNode) || l == h && c == A;
    try {
      s.collapse(a, f), l && (l != a || c != f) && s.extend && s.extend(l, c);
    } catch {
    }
    return p != null && (s.caretBidiLevel = p), m;
  }) : r.pos == r.start() || r.pos == r.end();
}
let qi = null, ji = null, Xi = !1;
function la(t, e, n) {
  return qi == e && ji == n ? Xi : (qi = e, ji = n, Xi = n == "up" || n == "down" ? ua(t, e, n) : sa(t, e, n));
}
const fe = 0, eu = 1, ut = 2, me = 3;
class mn {
  constructor(e, n, r, i) {
    this.parent = e, this.children = n, this.dom = r, this.contentDOM = i, this.dirty = fe, r.pmViewDesc = this;
  }
  // Used to check whether a given description corresponds to a
  // widget/mark/node.
  matchesWidget(e) {
    return !1;
  }
  matchesMark(e) {
    return !1;
  }
  matchesNode(e, n, r) {
    return !1;
  }
  matchesHack(e) {
    return !1;
  }
  // When parsing in-editor content (in domchange.js), we allow
  // descriptions to determine the parse rules that should be used to
  // parse them.
  parseRule(e) {
    return null;
  }
  // Used by the editor's event handler to ignore events that come
  // from certain descs.
  stopEvent(e) {
    return !1;
  }
  // The size of the content represented by this desc.
  get size() {
    let e = 0;
    for (let n = 0; n < this.children.length; n++)
      e += this.children[n].size;
    return e;
  }
  // For block nodes, this represents the space taken up by their
  // start/end tokens.
  get border() {
    return 0;
  }
  destroy() {
    this.parent = void 0, this.dom.pmViewDesc == this && (this.dom.pmViewDesc = void 0);
    for (let e = 0; e < this.children.length; e++)
      this.children[e].destroy();
  }
  posBeforeChild(e) {
    for (let n = 0, r = this.posAtStart; ; n++) {
      let i = this.children[n];
      if (i == e)
        return r;
      r += i.size;
    }
  }
  get posBefore() {
    return this.parent.posBeforeChild(this);
  }
  get posAtStart() {
    return this.parent ? this.parent.posBeforeChild(this) + this.border : 0;
  }
  get posAfter() {
    return this.posBefore + this.size;
  }
  get posAtEnd() {
    return this.posAtStart + this.size - 2 * this.border;
  }
  localPosFromDOM(e, n, r) {
    if (this.contentDOM && this.contentDOM.contains(e.nodeType == 1 ? e : e.parentNode))
      if (r < 0) {
        let u, o;
        if (e == this.contentDOM)
          u = e.childNodes[n - 1];
        else {
          for (; e.parentNode != this.contentDOM; )
            e = e.parentNode;
          u = e.previousSibling;
        }
        for (; u && !((o = u.pmViewDesc) && o.parent == this); )
          u = u.previousSibling;
        return u ? this.posBeforeChild(o) + o.size : this.posAtStart;
      } else {
        let u, o;
        if (e == this.contentDOM)
          u = e.childNodes[n];
        else {
          for (; e.parentNode != this.contentDOM; )
            e = e.parentNode;
          u = e.nextSibling;
        }
        for (; u && !((o = u.pmViewDesc) && o.parent == this); )
          u = u.nextSibling;
        return u ? this.posBeforeChild(o) : this.posAtEnd;
      }
    let i;
    if (e == this.dom && this.contentDOM)
      i = n > Y(this.contentDOM);
    else if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM))
      i = e.compareDocumentPosition(this.contentDOM) & 2;
    else if (this.dom.firstChild) {
      if (n == 0)
        for (let u = e; ; u = u.parentNode) {
          if (u == this.dom) {
            i = !1;
            break;
          }
          if (u.previousSibling)
            break;
        }
      if (i == null && n == e.childNodes.length)
        for (let u = e; ; u = u.parentNode) {
          if (u == this.dom) {
            i = !0;
            break;
          }
          if (u.nextSibling)
            break;
        }
    }
    return i ?? r > 0 ? this.posAtEnd : this.posAtStart;
  }
  nearestDesc(e, n = !1) {
    for (let r = !0, i = e; i; i = i.parentNode) {
      let u = this.getDesc(i), o;
      if (u && (!n || u.node))
        if (r && (o = u.nodeDOM) && !(o.nodeType == 1 ? o.contains(e.nodeType == 1 ? e : e.parentNode) : o == e))
          r = !1;
        else
          return u;
    }
  }
  getDesc(e) {
    let n = e.pmViewDesc;
    for (let r = n; r; r = r.parent)
      if (r == this)
        return n;
  }
  posFromDOM(e, n, r) {
    for (let i = e; i; i = i.parentNode) {
      let u = this.getDesc(i);
      if (u)
        return u.localPosFromDOM(e, n, r);
    }
    return -1;
  }
  // Find the desc for the node after the given pos, if any. (When a
  // parent node overrode rendering, there might not be one.)
  descAt(e) {
    for (let n = 0, r = 0; n < this.children.length; n++) {
      let i = this.children[n], u = r + i.size;
      if (r == e && u != r) {
        for (; !i.border && i.children.length; )
          for (let o = 0; o < i.children.length; o++) {
            let s = i.children[o];
            if (s.size) {
              i = s;
              break;
            }
          }
        return i;
      }
      if (e < u)
        return i.descAt(e - r - i.border);
      r = u;
    }
  }
  domFromPos(e, n) {
    if (!this.contentDOM)
      return { node: this.dom, offset: 0, atom: e + 1 };
    let r = 0, i = 0;
    for (let u = 0; r < this.children.length; r++) {
      let o = this.children[r], s = u + o.size;
      if (s > e || o instanceof ls) {
        i = e - u;
        break;
      }
      u = s;
    }
    if (i)
      return this.children[r].domFromPos(i - this.children[r].border, n);
    for (let u; r && !(u = this.children[r - 1]).size && u instanceof ss && u.side >= 0; r--)
      ;
    if (n <= 0) {
      let u, o = !0;
      for (; u = r ? this.children[r - 1] : null, !(!u || u.dom.parentNode == this.contentDOM); r--, o = !1)
        ;
      return u && n && o && !u.border && !u.domAtom ? u.domFromPos(u.size, n) : { node: this.contentDOM, offset: u ? Y(u.dom) + 1 : 0 };
    } else {
      let u, o = !0;
      for (; u = r < this.children.length ? this.children[r] : null, !(!u || u.dom.parentNode == this.contentDOM); r++, o = !1)
        ;
      return u && o && !u.border && !u.domAtom ? u.domFromPos(0, n) : { node: this.contentDOM, offset: u ? Y(u.dom) : this.contentDOM.childNodes.length };
    }
  }
  // Used to find a DOM range in a single parent for a given changed
  // range.
  parseRange(e, n, r = 0) {
    if (this.children.length == 0)
      return { node: this.contentDOM, from: e, to: n, fromOffset: 0, toOffset: this.contentDOM.childNodes.length };
    let i = -1, u = -1;
    for (let o = r, s = 0; ; s++) {
      let l = this.children[s], c = o + l.size;
      if (i == -1 && e <= c) {
        let a = o + l.border;
        if (e >= a && n <= c - l.border && l.node && l.contentDOM && this.contentDOM.contains(l.contentDOM))
          return l.parseRange(e, n, a);
        e = o;
        for (let f = s; f > 0; f--) {
          let p = this.children[f - 1];
          if (p.size && p.dom.parentNode == this.contentDOM && !p.emptyChildAt(1)) {
            i = Y(p.dom) + 1;
            break;
          }
          e -= p.size;
        }
        i == -1 && (i = 0);
      }
      if (i > -1 && (c > n || s == this.children.length - 1)) {
        n = c;
        for (let a = s + 1; a < this.children.length; a++) {
          let f = this.children[a];
          if (f.size && f.dom.parentNode == this.contentDOM && !f.emptyChildAt(-1)) {
            u = Y(f.dom);
            break;
          }
          n += f.size;
        }
        u == -1 && (u = this.contentDOM.childNodes.length);
        break;
      }
      o = c;
    }
    return { node: this.contentDOM, from: e, to: n, fromOffset: i, toOffset: u };
  }
  emptyChildAt(e) {
    if (this.border || !this.contentDOM || !this.children.length)
      return !1;
    let n = this.children[e < 0 ? 0 : this.children.length - 1];
    return n.size == 0 || n.emptyChildAt(e);
  }
  domAfterPos(e) {
    let { node: n, offset: r } = this.domFromPos(e, 0);
    if (n.nodeType != 1 || r == n.childNodes.length)
      throw new RangeError("No node after pos " + e);
    return n.childNodes[r];
  }
  // View descs are responsible for setting any selection that falls
  // entirely inside of them, so that custom implementations can do
  // custom things with the selection. Note that this falls apart when
  // a selection starts in such a node and ends in another, in which
  // case we just use whatever domFromPos produces as a best effort.
  setSelection(e, n, r, i = !1) {
    let u = Math.min(e, n), o = Math.max(e, n);
    for (let d = 0, h = 0; d < this.children.length; d++) {
      let A = this.children[d], m = h + A.size;
      if (u > h && o < m)
        return A.setSelection(e - h - A.border, n - h - A.border, r, i);
      h = m;
    }
    let s = this.domFromPos(e, e ? -1 : 1), l = n == e ? s : this.domFromPos(n, n ? -1 : 1), c = r.root.getSelection(), a = r.domSelectionRange(), f = !1;
    if ((ae || q) && e == n) {
      let { node: d, offset: h } = s;
      if (d.nodeType == 3) {
        if (f = !!(h && d.nodeValue[h - 1] == `
`), f && h == d.nodeValue.length)
          for (let A = d, m; A; A = A.parentNode) {
            if (m = A.nextSibling) {
              m.nodeName == "BR" && (s = l = { node: m.parentNode, offset: Y(m) + 1 });
              break;
            }
            let g = A.pmViewDesc;
            if (g && g.node && g.node.isBlock)
              break;
          }
      } else {
        let A = d.childNodes[h - 1];
        f = A && (A.nodeName == "BR" || A.contentEditable == "false");
      }
    }
    if (ae && a.focusNode && a.focusNode != l.node && a.focusNode.nodeType == 1) {
      let d = a.focusNode.childNodes[a.focusOffset];
      d && d.contentEditable == "false" && (i = !0);
    }
    if (!(i || f && q) && At(s.node, s.offset, a.anchorNode, a.anchorOffset) && At(l.node, l.offset, a.focusNode, a.focusOffset))
      return;
    let p = !1;
    if ((c.extend || e == n) && !(f && ae)) {
      c.collapse(s.node, s.offset);
      try {
        e != n && c.extend(l.node, l.offset), p = !0;
      } catch {
      }
    }
    if (!p) {
      if (e > n) {
        let h = s;
        s = l, l = h;
      }
      let d = document.createRange();
      d.setEnd(l.node, l.offset), d.setStart(s.node, s.offset), c.removeAllRanges(), c.addRange(d);
    }
  }
  ignoreMutation(e) {
    return !this.contentDOM && e.type != "selection";
  }
  get contentLost() {
    return this.contentDOM && this.contentDOM != this.dom && !this.dom.contains(this.contentDOM);
  }
  // Remove a subtree of the element tree that has been touched
  // by a DOM change, so that the next update will redraw it.
  markDirty(e, n) {
    for (let r = 0, i = 0; i < this.children.length; i++) {
      let u = this.children[i], o = r + u.size;
      if (r == o ? e <= o && n >= r : e < o && n > r) {
        let s = r + u.border, l = o - u.border;
        if (e >= s && n <= l) {
          this.dirty = e == r || n == o ? ut : eu, e == s && n == l && (u.contentLost || u.dom.parentNode != this.contentDOM) ? u.dirty = me : u.markDirty(e - s, n - s);
          return;
        } else
          u.dirty = u.dom == u.contentDOM && u.dom.parentNode == this.contentDOM && !u.children.length ? ut : me;
      }
      r = o;
    }
    this.dirty = ut;
  }
  markParentsDirty() {
    let e = 1;
    for (let n = this.parent; n; n = n.parent, e++) {
      let r = e == 1 ? ut : eu;
      n.dirty < r && (n.dirty = r);
    }
  }
  get domAtom() {
    return !1;
  }
  get ignoreForCoords() {
    return !1;
  }
  get ignoreForSelection() {
    return !1;
  }
  isText(e) {
    return !1;
  }
}
class ss extends mn {
  constructor(e, n, r, i) {
    let u, o = n.type.toDOM;
    if (typeof o == "function" && (o = o(r, () => {
      if (!u)
        return i;
      if (u.parent)
        return u.parent.posBeforeChild(u);
    })), !n.type.spec.raw) {
      if (o.nodeType != 1) {
        let s = document.createElement("span");
        s.appendChild(o), o = s;
      }
      o.hasAttribute("contenteditable") || (o.contentEditable = "false"), o.classList.add("ProseMirror-widget");
    }
    super(e, [], o, null), this.widget = n, this.widget = n, u = this;
  }
  matchesWidget(e) {
    return this.dirty == fe && e.type.eq(this.widget.type);
  }
  parseRule() {
    return { ignore: !0 };
  }
  stopEvent(e) {
    let n = this.widget.spec.stopEvent;
    return n ? n(e) : !1;
  }
  ignoreMutation(e) {
    return e.type != "selection" || this.widget.spec.ignoreSelection;
  }
  destroy() {
    this.widget.type.destroy(this.dom), super.destroy();
  }
  get domAtom() {
    return !0;
  }
  get ignoreForSelection() {
    return !!this.widget.type.spec.relaxedSide;
  }
  get side() {
    return this.widget.type.side;
  }
}
class ca extends mn {
  constructor(e, n, r, i) {
    super(e, [], n, null), this.textDOM = r, this.text = i;
  }
  get size() {
    return this.text.length;
  }
  localPosFromDOM(e, n) {
    return e != this.textDOM ? this.posAtStart + (n ? this.size : 0) : this.posAtStart + n;
  }
  domFromPos(e) {
    return { node: this.textDOM, offset: e };
  }
  ignoreMutation(e) {
    return e.type === "characterData" && e.target.nodeValue == e.oldValue;
  }
}
class Ye extends mn {
  constructor(e, n, r, i, u) {
    super(e, [], r, i), this.mark = n, this.spec = u;
  }
  static create(e, n, r, i) {
    let u = i.nodeViews[n.type.name], o = u && u(n, i, r);
    return (!o || !o.dom) && (o = mt.renderSpec(document, n.type.spec.toDOM(n, r), null, n.attrs)), new Ye(e, n, o.dom, o.contentDOM || o.dom, o);
  }
  parseRule() {
    return this.dirty & me || this.mark.type.spec.reparseInView ? null : { mark: this.mark.type.name, attrs: this.mark.attrs, contentElement: this.contentDOM };
  }
  matchesMark(e) {
    return this.dirty != me && this.mark.eq(e);
  }
  markDirty(e, n) {
    if (super.markDirty(e, n), this.dirty != fe) {
      let r = this.parent;
      for (; !r.node; )
        r = r.parent;
      r.dirty < this.dirty && (r.dirty = this.dirty), this.dirty = fe;
    }
  }
  slice(e, n, r) {
    let i = Ye.create(this.parent, this.mark, !0, r), u = this.children, o = this.size;
    n < o && (u = Vr(u, n, o, r)), e > 0 && (u = Vr(u, 0, e, r));
    for (let s = 0; s < u.length; s++)
      u[s].parent = i;
    return i.children = u, i;
  }
  ignoreMutation(e) {
    return this.spec.ignoreMutation ? this.spec.ignoreMutation(e) : super.ignoreMutation(e);
  }
  destroy() {
    this.spec.destroy && this.spec.destroy(), super.destroy();
  }
}
class He extends mn {
  constructor(e, n, r, i, u, o, s) {
    super(e, [], u, o), this.node = n, this.outerDeco = r, this.innerDeco = i, this.nodeDOM = s;
  }
  // By default, a node is rendered using the `toDOM` method from the
  // node type spec. But client code can use the `nodeViews` spec to
  // supply a custom node view, which can influence various aspects of
  // the way the node works.
  //
  // (Using subclassing for this was intentionally decided against,
  // since it'd require exposing a whole slew of finicky
  // implementation details to the user code that they probably will
  // never need.)
  static create(e, n, r, i, u, o) {
    let s = u.nodeViews[n.type.name], l, c = s && s(n, u, () => {
      if (!l)
        return o;
      if (l.parent)
        return l.parent.posBeforeChild(l);
    }, r, i), a = c && c.dom, f = c && c.contentDOM;
    if (n.isText) {
      if (!a)
        a = document.createTextNode(n.text);
      else if (a.nodeType != 3)
        throw new RangeError("Text must be rendered as a DOM text node");
    } else a || ({ dom: a, contentDOM: f } = mt.renderSpec(document, n.type.spec.toDOM(n), null, n.attrs));
    !f && !n.isText && a.nodeName != "BR" && (a.hasAttribute("contenteditable") || (a.contentEditable = "false"), n.type.spec.draggable && (a.draggable = !0));
    let p = a;
    return a = fs(a, r, n), c ? l = new aa(e, n, r, i, a, f || null, p, c) : n.isText ? new qn(e, n, r, i, a, p) : new He(e, n, r, i, a, f || null, p);
  }
  parseRule(e) {
    if (this.node.type.spec.reparseInView)
      return null;
    let n = { node: this.node.type.name, attrs: this.node.attrs };
    if (this.node.type.whitespace == "pre" && (n.preserveWhitespace = "full"), !this.contentDOM)
      n.getContent = () => this.node.content;
    else if (!this.contentLost)
      n.contentElement = this.contentDOM;
    else {
      for (let r = this.children.length - 1; r >= 0; r--) {
        let i = this.children[r];
        if (this.dom.contains(i.dom.parentNode)) {
          n.contentElement = i.dom.parentNode;
          break;
        }
      }
      if (!n.contentElement) {
        let r = e && e.find((i) => i.nodeType == 1 && e.indexOf(i.parentNode) < 0 && this.dom.contains(i));
        r ? n.contentElement = r : n.getContent = () => y.empty;
      }
    }
    return n;
  }
  matchesNode(e, n, r) {
    return this.dirty == fe && e.eq(this.node) && vn(n, this.outerDeco) && r.eq(this.innerDeco);
  }
  get size() {
    return this.node.nodeSize;
  }
  get border() {
    return this.node.isLeaf ? 0 : 1;
  }
  // Syncs `this.children` to match `this.node.content` and the local
  // decorations, possibly introducing nesting for marks. Then, in a
  // separate step, syncs the DOM inside `this.contentDOM` to
  // `this.children`.
  updateChildren(e, n) {
    let r = this.node.inlineContent, i = n, u = e.composing ? this.localCompositionInfo(e, n) : null, o = u && u.pos > -1 ? u : null, s = u && u.pos < 0, l = new ha(this, o && o.node, e);
    Aa(this.node, this.innerDeco, (c, a, f) => {
      c.spec.marks ? l.syncToMarks(c.spec.marks, r, e, a) : c.type.side >= 0 && !f && l.syncToMarks(a == this.node.childCount ? B.none : this.node.child(a).marks, r, e, a), l.placeWidget(c, e, i);
    }, (c, a, f, p) => {
      l.syncToMarks(c.marks, r, e, p);
      let d;
      l.findNodeMatch(c, a, f, p) || s && e.state.selection.from > i && e.state.selection.to < i + c.nodeSize && (d = l.findIndexWithChild(u.node)) > -1 && l.updateNodeAt(c, a, f, d, e) || l.updateNextNode(c, a, f, e, p, i) || l.addNode(c, a, f, e, i), i += c.nodeSize;
    }), l.syncToMarks([], r, e, 0), this.node.isTextblock && l.addTextblockHacks(), l.destroyRest(), (l.changed || this.dirty == ut) && (o && this.protectLocalComposition(e, o), cs(this.contentDOM, this.children, e), wt && ma(this.dom));
  }
  localCompositionInfo(e, n) {
    let { from: r, to: i } = e.state.selection;
    if (!(e.state.selection instanceof N) || r < n || i > n + this.node.content.size)
      return null;
    let u = e.input.compositionNode;
    if (!u || !this.dom.contains(u.parentNode))
      return null;
    if (this.node.inlineContent) {
      let o = u.nodeValue, s = ga(this.node.content, o, r - n, i - n);
      return s < 0 ? null : { node: u, pos: s, text: o };
    } else
      return { node: u, pos: -1, text: "" };
  }
  protectLocalComposition(e, { node: n, pos: r, text: i }) {
    if (this.getDesc(n))
      return;
    let u = n;
    for (; u.parentNode != this.contentDOM; u = u.parentNode) {
      for (; u.previousSibling; )
        u.parentNode.removeChild(u.previousSibling);
      for (; u.nextSibling; )
        u.parentNode.removeChild(u.nextSibling);
      u.pmViewDesc && (u.pmViewDesc = void 0);
    }
    let o = new ca(this, u, n, i);
    e.input.compositionNodes.push(o), this.children = Vr(this.children, r, r + i.length, e, o);
  }
  // If this desc must be updated to match the given node decoration,
  // do so and return true.
  update(e, n, r, i) {
    return this.dirty == me || !e.sameMarkup(this.node) ? !1 : (this.updateInner(e, n, r, i), !0);
  }
  updateInner(e, n, r, i) {
    this.updateOuterDeco(n), this.node = e, this.innerDeco = r, this.contentDOM && this.updateChildren(i, this.posAtStart), this.dirty = fe;
  }
  updateOuterDeco(e) {
    if (vn(e, this.outerDeco))
      return;
    let n = this.nodeDOM.nodeType != 1, r = this.dom;
    this.dom = as(this.dom, this.nodeDOM, Hr(this.outerDeco, this.node, n), Hr(e, this.node, n)), this.dom != r && (r.pmViewDesc = void 0, this.dom.pmViewDesc = this), this.outerDeco = e;
  }
  // Mark this node as being the selected node.
  selectNode() {
    this.nodeDOM.nodeType == 1 && (this.nodeDOM.classList.add("ProseMirror-selectednode"), (this.contentDOM || !this.node.type.spec.draggable) && (this.nodeDOM.draggable = !0));
  }
  // Remove selected node marking from this node.
  deselectNode() {
    this.nodeDOM.nodeType == 1 && (this.nodeDOM.classList.remove("ProseMirror-selectednode"), (this.contentDOM || !this.node.type.spec.draggable) && this.nodeDOM.removeAttribute("draggable"));
  }
  get domAtom() {
    return this.node.isAtom;
  }
}
function tu(t, e, n, r, i) {
  fs(r, e, t);
  let u = new He(void 0, t, e, n, r, r, r);
  return u.contentDOM && u.updateChildren(i, 0), u;
}
class qn extends He {
  constructor(e, n, r, i, u, o) {
    super(e, n, r, i, u, null, o);
  }
  parseRule() {
    let e = this.nodeDOM.parentNode;
    for (; e && e != this.dom && !e.pmIsDeco; )
      e = e.parentNode;
    return { skip: e || !0 };
  }
  update(e, n, r, i) {
    return this.dirty == me || this.dirty != fe && !this.inParent() || !e.sameMarkup(this.node) ? !1 : (this.updateOuterDeco(n), (this.dirty != fe || e.text != this.node.text) && e.text != this.nodeDOM.nodeValue && (this.nodeDOM.nodeValue = e.text, i.trackWrites == this.nodeDOM && (i.trackWrites = null)), this.node = e, this.dirty = fe, !0);
  }
  inParent() {
    let e = this.parent.contentDOM;
    for (let n = this.nodeDOM; n; n = n.parentNode)
      if (n == e)
        return !0;
    return !1;
  }
  domFromPos(e) {
    return { node: this.nodeDOM, offset: e };
  }
  localPosFromDOM(e, n, r) {
    return e == this.nodeDOM ? this.posAtStart + Math.min(n, this.node.text.length) : super.localPosFromDOM(e, n, r);
  }
  ignoreMutation(e) {
    return e.type != "characterData" && e.type != "selection";
  }
  slice(e, n, r) {
    let i = this.node.cut(e, n), u = document.createTextNode(i.text);
    return new qn(this.parent, i, this.outerDeco, this.innerDeco, u, u);
  }
  markDirty(e, n) {
    super.markDirty(e, n), this.dom != this.nodeDOM && (e == 0 || n == this.nodeDOM.nodeValue.length) && (this.dirty = me);
  }
  get domAtom() {
    return !1;
  }
  isText(e) {
    return this.node.text == e;
  }
}
class ls extends mn {
  parseRule() {
    return { ignore: !0 };
  }
  matchesHack(e) {
    return this.dirty == fe && this.dom.nodeName == e;
  }
  get domAtom() {
    return !0;
  }
  get ignoreForCoords() {
    return this.dom.nodeName == "IMG";
  }
}
class aa extends He {
  constructor(e, n, r, i, u, o, s, l) {
    super(e, n, r, i, u, o, s), this.spec = l;
  }
  // A custom `update` method gets to decide whether the update goes
  // through. If it does, and there's a `contentDOM` node, our logic
  // updates the children.
  update(e, n, r, i) {
    if (this.dirty == me)
      return !1;
    if (this.spec.update && (this.node.type == e.type || this.spec.multiType)) {
      let u = this.spec.update(e, n, r);
      return u && this.updateInner(e, n, r, i), u;
    } else return !this.contentDOM && !e.isLeaf ? !1 : super.update(e, n, r, i);
  }
  selectNode() {
    this.spec.selectNode ? this.spec.selectNode() : super.selectNode();
  }
  deselectNode() {
    this.spec.deselectNode ? this.spec.deselectNode() : super.deselectNode();
  }
  setSelection(e, n, r, i) {
    this.spec.setSelection ? this.spec.setSelection(e, n, r.root) : super.setSelection(e, n, r, i);
  }
  destroy() {
    this.spec.destroy && this.spec.destroy(), super.destroy();
  }
  stopEvent(e) {
    return this.spec.stopEvent ? this.spec.stopEvent(e) : !1;
  }
  ignoreMutation(e) {
    return this.spec.ignoreMutation ? this.spec.ignoreMutation(e) : super.ignoreMutation(e);
  }
}
function cs(t, e, n) {
  let r = t.firstChild, i = !1;
  for (let u = 0; u < e.length; u++) {
    let o = e[u], s = o.dom;
    if (s.parentNode == t) {
      for (; s != r; )
        r = nu(r), i = !0;
      r = r.nextSibling;
    } else
      i = !0, t.insertBefore(s, r);
    if (o instanceof Ye) {
      let l = r ? r.previousSibling : t.lastChild;
      cs(o.contentDOM, o.children, n), r = l ? l.nextSibling : t.firstChild;
    }
  }
  for (; r; )
    r = nu(r), i = !0;
  i && n.trackWrites == t && (n.trackWrites = null);
}
const Gt = function(t) {
  t && (this.nodeName = t);
};
Gt.prototype = /* @__PURE__ */ Object.create(null);
const ot = [new Gt()];
function Hr(t, e, n) {
  if (t.length == 0)
    return ot;
  let r = n ? ot[0] : new Gt(), i = [r];
  for (let u = 0; u < t.length; u++) {
    let o = t[u].type.attrs;
    if (o) {
      o.nodeName && i.push(r = new Gt(o.nodeName));
      for (let s in o) {
        let l = o[s];
        l != null && (n && i.length == 1 && i.push(r = new Gt(e.isInline ? "span" : "div")), s == "class" ? r.class = (r.class ? r.class + " " : "") + l : s == "style" ? r.style = (r.style ? r.style + ";" : "") + l : s != "nodeName" && (r[s] = l));
      }
    }
  }
  return i;
}
function as(t, e, n, r) {
  if (n == ot && r == ot)
    return e;
  let i = e;
  for (let u = 0; u < r.length; u++) {
    let o = r[u], s = n[u];
    if (u) {
      let l;
      s && s.nodeName == o.nodeName && i != t && (l = i.parentNode) && l.nodeName.toLowerCase() == o.nodeName || (l = document.createElement(o.nodeName), l.pmIsDeco = !0, l.appendChild(i), s = ot[0]), i = l;
    }
    fa(i, s || ot[0], o);
  }
  return i;
}
function fa(t, e, n) {
  for (let r in e)
    r != "class" && r != "style" && r != "nodeName" && !(r in n) && t.removeAttribute(r);
  for (let r in n)
    r != "class" && r != "style" && r != "nodeName" && n[r] != e[r] && t.setAttribute(r, n[r]);
  if (e.class != n.class) {
    let r = e.class ? e.class.split(" ").filter(Boolean) : [], i = n.class ? n.class.split(" ").filter(Boolean) : [];
    for (let u = 0; u < r.length; u++)
      i.indexOf(r[u]) == -1 && t.classList.remove(r[u]);
    for (let u = 0; u < i.length; u++)
      r.indexOf(i[u]) == -1 && t.classList.add(i[u]);
    t.classList.length == 0 && t.removeAttribute("class");
  }
  if (e.style != n.style) {
    if (e.style) {
      let r = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g, i;
      for (; i = r.exec(e.style); )
        t.style.removeProperty(i[1]);
    }
    n.style && (t.style.cssText += n.style);
  }
}
function fs(t, e, n) {
  return as(t, t, ot, Hr(e, n, t.nodeType != 1));
}
function vn(t, e) {
  if (t.length != e.length)
    return !1;
  for (let n = 0; n < t.length; n++)
    if (!t[n].type.eq(e[n].type))
      return !1;
  return !0;
}
function nu(t) {
  let e = t.nextSibling;
  return t.parentNode.removeChild(t), e;
}
class ha {
  constructor(e, n, r) {
    this.lock = n, this.view = r, this.index = 0, this.stack = [], this.changed = !1, this.top = e, this.preMatch = da(e.node.content, e);
  }
  // Destroy and remove the children between the given indices in
  // `this.top`.
  destroyBetween(e, n) {
    if (e != n) {
      for (let r = e; r < n; r++)
        this.top.children[r].destroy();
      this.top.children.splice(e, n - e), this.changed = !0;
    }
  }
  // Destroy all remaining children in `this.top`.
  destroyRest() {
    this.destroyBetween(this.index, this.top.children.length);
  }
  // Sync the current stack of mark descs with the given array of
  // marks, reusing existing mark descs when possible.
  syncToMarks(e, n, r, i) {
    let u = 0, o = this.stack.length >> 1, s = Math.min(o, e.length);
    for (; u < s && (u == o - 1 ? this.top : this.stack[u + 1 << 1]).matchesMark(e[u]) && e[u].type.spec.spanning !== !1; )
      u++;
    for (; u < o; )
      this.destroyRest(), this.top.dirty = fe, this.index = this.stack.pop(), this.top = this.stack.pop(), o--;
    for (; o < e.length; ) {
      this.stack.push(this.top, this.index + 1);
      let l = -1, c = this.top.children.length;
      i < this.preMatch.index && (c = Math.min(this.index + 3, c));
      for (let a = this.index; a < c; a++) {
        let f = this.top.children[a];
        if (f.matchesMark(e[o]) && !this.isLocked(f.dom)) {
          l = a;
          break;
        }
      }
      if (l < 0 && this.index < this.top.children.length) {
        let a = this.top.children[this.index];
        a instanceof Ye && a.dirty != me && a.mark.type == e[o].type && a.spec.update && !this.isLocked(a.dom) && a.spec.update(e[o]) && (a.mark = e[o], l = this.index, this.changed = !0);
      }
      if (l > -1)
        l > this.index && (this.changed = !0, this.destroyBetween(this.index, l)), this.top = this.top.children[this.index];
      else {
        let a = Ye.create(this.top, e[o], n, r);
        this.top.children.splice(this.index, 0, a), this.top = a, this.changed = !0;
      }
      this.index = 0, o++;
    }
  }
  // Try to find a node desc matching the given data. Skip over it and
  // return true when successful.
  findNodeMatch(e, n, r, i) {
    let u = -1, o;
    if (i >= this.preMatch.index && (o = this.preMatch.matches[i - this.preMatch.index]).parent == this.top && o.matchesNode(e, n, r))
      u = this.top.children.indexOf(o, this.index);
    else
      for (let s = this.index, l = Math.min(this.top.children.length, s + 5); s < l; s++) {
        let c = this.top.children[s];
        if (c.matchesNode(e, n, r) && !this.preMatch.matched.has(c)) {
          u = s;
          break;
        }
      }
    return u < 0 ? !1 : (this.destroyBetween(this.index, u), this.index++, !0);
  }
  updateNodeAt(e, n, r, i, u) {
    let o = this.top.children[i];
    return o.dirty == me && o.dom == o.contentDOM && (o.dirty = ut), o.update(e, n, r, u) ? (this.destroyBetween(this.index, i), this.index++, !0) : !1;
  }
  findIndexWithChild(e) {
    for (; ; ) {
      let n = e.parentNode;
      if (!n)
        return -1;
      if (n == this.top.contentDOM) {
        let r = e.pmViewDesc;
        if (r) {
          for (let i = this.index; i < this.top.children.length; i++)
            if (this.top.children[i] == r)
              return i;
        }
        return -1;
      }
      e = n;
    }
  }
  // Try to update the next node, if any, to the given data. Checks
  // pre-matches to avoid overwriting nodes that could still be used.
  updateNextNode(e, n, r, i, u, o) {
    for (let s = this.index; s < this.top.children.length; s++) {
      let l = this.top.children[s];
      if (l instanceof He) {
        let c = this.preMatch.matched.get(l);
        if (c != null && c != u)
          return !1;
        let a = l.dom, f, p = this.isLocked(a) && !(e.isText && l.node && l.node.isText && l.nodeDOM.nodeValue == e.text && l.dirty != me && vn(n, l.outerDeco));
        if (!p && l.update(e, n, r, i))
          return this.destroyBetween(this.index, s), l.dom != a && (this.changed = !0), this.index++, !0;
        if (!p && (f = this.recreateWrapper(l, e, n, r, i, o)))
          return this.destroyBetween(this.index, s), this.top.children[this.index] = f, f.contentDOM && (f.dirty = ut, f.updateChildren(i, o + 1), f.dirty = fe), this.changed = !0, this.index++, !0;
        break;
      }
    }
    return !1;
  }
  // When a node with content is replaced by a different node with
  // identical content, move over its children.
  recreateWrapper(e, n, r, i, u, o) {
    if (e.dirty || n.isAtom || !e.children.length || !e.node.content.eq(n.content) || !vn(r, e.outerDeco) || !i.eq(e.innerDeco))
      return null;
    let s = He.create(this.top, n, r, i, u, o);
    if (s.contentDOM) {
      s.children = e.children, e.children = [];
      for (let l of s.children)
        l.parent = s;
    }
    return e.destroy(), s;
  }
  // Insert the node as a newly created node desc.
  addNode(e, n, r, i, u) {
    let o = He.create(this.top, e, n, r, i, u);
    o.contentDOM && o.updateChildren(i, u + 1), this.top.children.splice(this.index++, 0, o), this.changed = !0;
  }
  placeWidget(e, n, r) {
    let i = this.index < this.top.children.length ? this.top.children[this.index] : null;
    if (i && i.matchesWidget(e) && (e == i.widget || !i.widget.type.toDOM.parentNode))
      this.index++;
    else {
      let u = new ss(this.top, e, n, r);
      this.top.children.splice(this.index++, 0, u), this.changed = !0;
    }
  }
  // Make sure a textblock looks and behaves correctly in
  // contentEditable.
  addTextblockHacks() {
    let e = this.top.children[this.index - 1], n = this.top;
    for (; e instanceof Ye; )
      n = e, e = n.children[n.children.length - 1];
    (!e || // Empty textblock
    !(e instanceof qn) || /\n$/.test(e.node.text) || this.view.requiresGeckoHackNode && /\s$/.test(e.node.text)) && ((q || V) && e && e.dom.contentEditable == "false" && this.addHackNode("IMG", n), this.addHackNode("BR", this.top));
  }
  addHackNode(e, n) {
    if (n == this.top && this.index < n.children.length && n.children[this.index].matchesHack(e))
      this.index++;
    else {
      let r = document.createElement(e);
      e == "IMG" && (r.className = "ProseMirror-separator", r.alt = ""), e == "BR" && (r.className = "ProseMirror-trailingBreak");
      let i = new ls(this.top, [], r, null);
      n != this.top ? n.children.push(i) : n.children.splice(this.index++, 0, i), this.changed = !0;
    }
  }
  isLocked(e) {
    return this.lock && (e == this.lock || e.nodeType == 1 && e.contains(this.lock.parentNode));
  }
}
function da(t, e) {
  let n = e, r = n.children.length, i = t.childCount, u = /* @__PURE__ */ new Map(), o = [];
  e: for (; i > 0; ) {
    let s;
    for (; ; )
      if (r) {
        let c = n.children[r - 1];
        if (c instanceof Ye)
          n = c, r = c.children.length;
        else {
          s = c, r--;
          break;
        }
      } else {
        if (n == e)
          break e;
        r = n.parent.children.indexOf(n), n = n.parent;
      }
    let l = s.node;
    if (l) {
      if (l != t.child(i - 1))
        break;
      --i, u.set(s, i), o.push(s);
    }
  }
  return { index: i, matched: u, matches: o.reverse() };
}
function pa(t, e) {
  return t.type.side - e.type.side;
}
function Aa(t, e, n, r) {
  let i = e.locals(t), u = 0;
  if (i.length == 0) {
    for (let c = 0; c < t.childCount; c++) {
      let a = t.child(c);
      r(a, i, e.forChild(u, a), c), u += a.nodeSize;
    }
    return;
  }
  let o = 0, s = [], l = null;
  for (let c = 0; ; ) {
    let a, f;
    for (; o < i.length && i[o].to == u; ) {
      let m = i[o++];
      m.widget && (a ? (f || (f = [a])).push(m) : a = m);
    }
    if (a)
      if (f) {
        f.sort(pa);
        for (let m = 0; m < f.length; m++)
          n(f[m], c, !!l);
      } else
        n(a, c, !!l);
    let p, d;
    if (l)
      d = -1, p = l, l = null;
    else if (c < t.childCount)
      d = c, p = t.child(c++);
    else
      break;
    for (let m = 0; m < s.length; m++)
      s[m].to <= u && s.splice(m--, 1);
    for (; o < i.length && i[o].from <= u && i[o].to > u; )
      s.push(i[o++]);
    let h = u + p.nodeSize;
    if (p.isText) {
      let m = h;
      o < i.length && i[o].from < m && (m = i[o].from);
      for (let g = 0; g < s.length; g++)
        s[g].to < m && (m = s[g].to);
      m < h && (l = p.cut(m - u), p = p.cut(0, m - u), h = m, d = -1);
    } else
      for (; o < i.length && i[o].to < h; )
        o++;
    let A = p.isInline && !p.isLeaf ? s.filter((m) => !m.inline) : s.slice();
    r(p, A, e.forChild(u, p), d), u = h;
  }
}
function ma(t) {
  if (t.nodeName == "UL" || t.nodeName == "OL") {
    let e = t.style.cssText;
    t.style.cssText = e + "; list-style: square !important", window.getComputedStyle(t).listStyle, t.style.cssText = e;
  }
}
function ga(t, e, n, r) {
  for (let i = 0, u = 0; i < t.childCount && u <= r; ) {
    let o = t.child(i++), s = u;
    if (u += o.nodeSize, !o.isText)
      continue;
    let l = o.text;
    for (; i < t.childCount; ) {
      let c = t.child(i++);
      if (u += c.nodeSize, !c.isText)
        break;
      l += c.text;
    }
    if (u >= n) {
      if (u >= r && l.slice(r - e.length - s, r - s) == e)
        return r - e.length;
      let c = s < r ? l.lastIndexOf(e, r - s - 1) : -1;
      if (c >= 0 && c + e.length + s >= n)
        return s + c;
      if (n == r && l.length >= r + e.length - s && l.slice(r - s, r - s + e.length) == e)
        return r;
    }
  }
  return -1;
}
function Vr(t, e, n, r, i) {
  let u = [];
  for (let o = 0, s = 0; o < t.length; o++) {
    let l = t[o], c = s, a = s += l.size;
    c >= n || a <= e ? u.push(l) : (c < e && u.push(l.slice(0, e - c, r)), i && (u.push(i), i = void 0), a > n && u.push(l.slice(n - c, l.size, r)));
  }
  return u;
}
function ai(t, e = null) {
  let n = t.domSelectionRange(), r = t.state.doc;
  if (!n.focusNode)
    return null;
  let i = t.docView.nearestDesc(n.focusNode), u = i && i.size == 0, o = t.docView.posFromDOM(n.focusNode, n.focusOffset, 1);
  if (o < 0)
    return null;
  let s = r.resolve(o), l, c;
  if ($n(n)) {
    for (l = o; i && !i.node; )
      i = i.parent;
    let f = i.node;
    if (i && f.isAtom && w.isSelectable(f) && i.parent && !(f.isInline && Lc(n.focusNode, n.focusOffset, i.dom))) {
      let p = i.posBefore;
      c = new w(o == p ? s : r.resolve(p));
    }
  } else {
    if (n instanceof t.dom.ownerDocument.defaultView.Selection && n.rangeCount > 1) {
      let f = o, p = o;
      for (let d = 0; d < n.rangeCount; d++) {
        let h = n.getRangeAt(d);
        f = Math.min(f, t.docView.posFromDOM(h.startContainer, h.startOffset, 1)), p = Math.max(p, t.docView.posFromDOM(h.endContainer, h.endOffset, -1));
      }
      if (f < 0)
        return null;
      [l, o] = p == t.state.selection.anchor ? [p, f] : [f, p], s = r.resolve(o);
    } else
      l = t.docView.posFromDOM(n.anchorNode, n.anchorOffset, 1);
    if (l < 0)
      return null;
  }
  let a = r.resolve(l);
  if (!c) {
    let f = e == "pointer" || t.state.selection.head < s.pos && !u ? 1 : -1;
    c = fi(t, a, s, f);
  }
  return c;
}
function hs(t) {
  return t.editable ? t.hasFocus() : ps(t) && document.activeElement && document.activeElement.contains(t.dom);
}
function Re(t, e = !1) {
  let n = t.state.selection;
  if (ds(t, n), !hs(t))
    return;
  let r = t.input.mouseDown;
  if (!e && V && r) {
    let i = t.domSelectionRange(), u = t.domObserver.currentSelection;
    if (i.anchorNode && u.anchorNode && At(i.anchorNode, i.anchorOffset, u.anchorNode, u.anchorOffset) && r.delaySelUpdate()) {
      t.domObserver.setCurSelection();
      return;
    }
  }
  if (t.domObserver.disconnectSelection(), t.cursorWrapper)
    ka(t);
  else {
    let { anchor: i, head: u } = n, o, s;
    ru && !(n instanceof N) && (n.$from.parent.inlineContent || (o = iu(t, n.from)), !n.empty && !n.$from.parent.inlineContent && (s = iu(t, n.to))), t.docView.setSelection(i, u, t, e), ru && (o && uu(o), s && uu(s)), n.visible ? t.dom.classList.remove("ProseMirror-hideselection") : (t.dom.classList.add("ProseMirror-hideselection"), "onselectionchange" in document && ba(t));
  }
  t.domObserver.setCurSelection(), t.domObserver.connectSelection();
}
const ru = q || V && jo < 63;
function iu(t, e) {
  let { node: n, offset: r } = t.docView.domFromPos(e, 0), i = r < n.childNodes.length ? n.childNodes[r] : null, u = r ? n.childNodes[r - 1] : null;
  if (q && i && i.contentEditable == "false")
    return Ar(i);
  if ((!i || i.contentEditable == "false") && (!u || u.contentEditable == "false")) {
    if (i)
      return Ar(i);
    if (u)
      return Ar(u);
  }
}
function Ar(t) {
  return t.contentEditable = "true", q && t.draggable && (t.draggable = !1, t.wasDraggable = !0), t;
}
function uu(t) {
  t.contentEditable = "false", t.wasDraggable && (t.draggable = !0, t.wasDraggable = null);
}
function ba(t) {
  let e = t.dom.ownerDocument;
  e.removeEventListener("selectionchange", t.input.hideSelectionGuard);
  let n = t.domSelectionRange(), r = n.anchorNode, i = n.anchorOffset;
  e.addEventListener("selectionchange", t.input.hideSelectionGuard = () => {
    (n.anchorNode != r || n.anchorOffset != i) && (e.removeEventListener("selectionchange", t.input.hideSelectionGuard), setTimeout(() => {
      (!hs(t) || t.state.selection.visible) && t.dom.classList.remove("ProseMirror-hideselection");
    }, 20));
  });
}
function ka(t) {
  let e = t.domSelection();
  if (!e)
    return;
  let n = t.cursorWrapper.dom, r = n.nodeName == "IMG";
  r ? e.collapse(n.parentNode, Y(n) + 1) : e.collapse(n, 0), !r && !t.state.selection.visible && ne && Ze <= 11 && (n.disabled = !0, n.disabled = !1);
}
function ds(t, e) {
  if (e instanceof w) {
    let n = t.docView.descAt(e.from);
    n != t.lastSelectedViewDesc && (ou(t), n && n.selectNode(), t.lastSelectedViewDesc = n);
  } else
    ou(t);
}
function ou(t) {
  t.lastSelectedViewDesc && (t.lastSelectedViewDesc.parent && t.lastSelectedViewDesc.deselectNode(), t.lastSelectedViewDesc = void 0);
}
function fi(t, e, n, r) {
  return t.someProp("createSelectionBetween", (i) => i(t, e, n)) || N.between(e, n, r);
}
function su(t) {
  return t.editable && !t.hasFocus() ? !1 : ps(t);
}
function ps(t) {
  let e = t.domSelectionRange();
  if (!e.anchorNode)
    return !1;
  try {
    return t.dom.contains(e.anchorNode.nodeType == 3 ? e.anchorNode.parentNode : e.anchorNode) && (t.editable || t.dom.contains(e.focusNode.nodeType == 3 ? e.focusNode.parentNode : e.focusNode));
  } catch {
    return !1;
  }
}
function xa(t) {
  let e = t.docView.domFromPos(t.state.selection.anchor, 0), n = t.domSelectionRange();
  return At(e.node, e.offset, n.anchorNode, n.anchorOffset);
}
function Ur(t, e) {
  let { $anchor: n, $head: r } = t.selection, i = e > 0 ? n.max(r) : n.min(r), u = i.parent.inlineContent ? i.depth ? t.doc.resolve(e > 0 ? i.after() : i.before()) : null : i;
  return u && M.findFrom(u, e);
}
function ze(t, e) {
  return t.dispatch(t.state.tr.setSelection(e).scrollIntoView()), !0;
}
function lu(t, e, n) {
  let r = t.state.selection;
  if (r instanceof N)
    if (n.indexOf("s") > -1) {
      let { $head: i } = r, u = i.textOffset ? null : e < 0 ? i.nodeBefore : i.nodeAfter;
      if (!u || u.isText || !u.isLeaf)
        return !1;
      let o = t.state.doc.resolve(i.pos + u.nodeSize * (e < 0 ? -1 : 1));
      return ze(t, new N(r.$anchor, o));
    } else if (r.empty) {
      if (t.endOfTextblock(e > 0 ? "forward" : "backward")) {
        let i = Ur(t.state, e);
        return i && i instanceof w ? ze(t, i) : !1;
      } else if (!(le && n.indexOf("m") > -1)) {
        let i = r.$head, u = i.textOffset ? null : e < 0 ? i.nodeBefore : i.nodeAfter, o;
        if (!u || u.isText)
          return !1;
        let s = e < 0 ? i.pos - u.nodeSize : i.pos;
        return u.isAtom || (o = t.docView.descAt(s)) && !o.contentDOM ? w.isSelectable(u) ? ze(t, new w(e < 0 ? t.state.doc.resolve(i.pos - u.nodeSize) : i)) : An ? ze(t, new N(t.state.doc.resolve(e < 0 ? s : s + u.nodeSize))) : !1 : !1;
      }
    } else return !1;
  else {
    if (r instanceof w && r.node.isInline)
      return ze(t, new N(e > 0 ? r.$to : r.$from));
    {
      let i = Ur(t.state, e);
      return i ? ze(t, i) : !1;
    }
  }
}
function zn(t) {
  return t.nodeType == 3 ? t.nodeValue.length : t.childNodes.length;
}
function Lt(t, e) {
  let n = t.pmViewDesc;
  return n && n.size == 0 && (e < 0 || t.nextSibling || t.nodeName != "BR");
}
function bt(t, e) {
  return e < 0 ? Ca(t) : ya(t);
}
function Ca(t) {
  let e = t.domSelectionRange(), n = e.focusNode, r = e.focusOffset;
  if (!n)
    return;
  let i, u, o = !1;
  for (ae && n.nodeType == 1 && r < zn(n) && Lt(n.childNodes[r], -1) && (o = !0); ; )
    if (r > 0) {
      if (n.nodeType != 1)
        break;
      {
        let s = n.childNodes[r - 1];
        if (Lt(s, -1))
          i = n, u = --r;
        else if (s.nodeType == 3)
          n = s, r = n.nodeValue.length;
        else
          break;
      }
    } else {
      if (As(n))
        break;
      {
        let s = n.previousSibling;
        for (; s && Lt(s, -1); )
          i = n.parentNode, u = Y(s), s = s.previousSibling;
        if (s)
          n = s, r = zn(n);
        else {
          if (n = n.parentNode, n == t.dom)
            break;
          r = 0;
        }
      }
    }
  o ? $r(t, n, r) : i && $r(t, i, u);
}
function ya(t) {
  let e = t.domSelectionRange(), n = e.focusNode, r = e.focusOffset;
  if (!n)
    return;
  let i = zn(n), u, o;
  for (; ; )
    if (r < i) {
      if (n.nodeType != 1)
        break;
      let s = n.childNodes[r];
      if (Lt(s, 1))
        u = n, o = ++r;
      else
        break;
    } else {
      if (As(n))
        break;
      {
        let s = n.nextSibling;
        for (; s && Lt(s, 1); )
          u = s.parentNode, o = Y(s) + 1, s = s.nextSibling;
        if (s)
          n = s, r = 0, i = zn(n);
        else {
          if (n = n.parentNode, n == t.dom)
            break;
          r = i = 0;
        }
      }
    }
  u && $r(t, u, o);
}
function As(t) {
  let e = t.pmViewDesc;
  return e && e.node && e.node.isBlock;
}
function Da(t, e) {
  for (; t && e == t.childNodes.length && !pn(t); )
    e = Y(t) + 1, t = t.parentNode;
  for (; t && e < t.childNodes.length; ) {
    let n = t.childNodes[e];
    if (n.nodeType == 3)
      return n;
    if (n.nodeType == 1 && n.contentEditable == "false")
      break;
    t = n, e = 0;
  }
}
function Ea(t, e) {
  for (; t && !e && !pn(t); )
    e = Y(t), t = t.parentNode;
  for (; t && e; ) {
    let n = t.childNodes[e - 1];
    if (n.nodeType == 3)
      return n;
    if (n.nodeType == 1 && n.contentEditable == "false")
      break;
    t = n, e = t.childNodes.length;
  }
}
function $r(t, e, n) {
  if (e.nodeType != 3) {
    let u, o;
    (o = Da(e, n)) ? (e = o, n = 0) : (u = Ea(e, n)) && (e = u, n = u.nodeValue.length);
  }
  let r = t.domSelection();
  if (!r)
    return;
  if ($n(r)) {
    let u = document.createRange();
    u.setEnd(e, n), u.setStart(e, n), r.removeAllRanges(), r.addRange(u);
  } else r.extend && r.extend(e, n);
  t.domObserver.setCurSelection();
  let { state: i } = t;
  setTimeout(() => {
    t.state == i && Re(t);
  }, 50);
}
function cu(t, e) {
  let n = t.state.doc.resolve(e);
  if (!(V || Xo) && n.parent.inlineContent) {
    let i = t.coordsAtPos(e);
    if (e > n.start()) {
      let u = t.coordsAtPos(e - 1), o = (u.top + u.bottom) / 2;
      if (o > i.top && o < i.bottom && Math.abs(u.left - i.left) > 1)
        return u.left < i.left ? "ltr" : "rtl";
    }
    if (e < n.end()) {
      let u = t.coordsAtPos(e + 1), o = (u.top + u.bottom) / 2;
      if (o > i.top && o < i.bottom && Math.abs(u.left - i.left) > 1)
        return u.left > i.left ? "ltr" : "rtl";
    }
  }
  return getComputedStyle(t.dom).direction == "rtl" ? "rtl" : "ltr";
}
function au(t, e, n) {
  let r = t.state.selection;
  if (r instanceof N && !r.empty || n.indexOf("s") > -1 || le && n.indexOf("m") > -1)
    return !1;
  let { $from: i, $to: u } = r;
  if (!i.parent.inlineContent || t.endOfTextblock(e < 0 ? "up" : "down")) {
    let o = Ur(t.state, e);
    if (o && o instanceof w)
      return ze(t, o);
  }
  if (!i.parent.inlineContent) {
    let o = e < 0 ? i : u, s = r instanceof oe ? M.near(o, e) : M.findFrom(o, e);
    return s ? ze(t, s) : !1;
  }
  return !1;
}
function fu(t, e) {
  if (!(t.state.selection instanceof N))
    return !0;
  let { $head: n, $anchor: r, empty: i } = t.state.selection;
  if (!n.sameParent(r))
    return !0;
  if (!i)
    return !1;
  if (t.endOfTextblock(e > 0 ? "forward" : "backward"))
    return !0;
  let u = !n.textOffset && (e < 0 ? n.nodeBefore : n.nodeAfter);
  if (u && !u.isText) {
    let o = t.state.tr;
    return e < 0 ? o.delete(n.pos - u.nodeSize, n.pos) : o.delete(n.pos, n.pos + u.nodeSize), t.dispatch(o), !0;
  }
  return !1;
}
function hu(t, e, n) {
  t.domObserver.stop(), e.contentEditable = n, t.domObserver.start();
}
function Fa(t) {
  if (!q || t.state.selection.$head.parentOffset > 0)
    return !1;
  let { focusNode: e, focusOffset: n } = t.domSelectionRange();
  if (e && e.nodeType == 1 && n == 0 && e.firstChild && e.firstChild.contentEditable == "false") {
    let r = e.firstChild;
    hu(t, r, "true"), setTimeout(() => hu(t, r, "false"), 20);
  }
  return !1;
}
function _a(t) {
  let e = "";
  return t.ctrlKey && (e += "c"), t.metaKey && (e += "m"), t.altKey && (e += "a"), t.shiftKey && (e += "s"), e;
}
function wa(t, e) {
  let n = e.keyCode, r = _a(e);
  if (n == 8 || le && n == 72 && r == "c")
    return fu(t, -1) || bt(t, -1);
  if (n == 46 && !e.shiftKey || le && n == 68 && r == "c")
    return fu(t, 1) || bt(t, 1);
  if (n == 13 || n == 27)
    return !0;
  if (n == 37 || le && n == 66 && r == "c") {
    let i = n == 37 ? cu(t, t.state.selection.from) == "ltr" ? -1 : 1 : -1;
    return lu(t, i, r) || bt(t, i);
  } else if (n == 39 || le && n == 70 && r == "c") {
    let i = n == 39 ? cu(t, t.state.selection.from) == "ltr" ? 1 : -1 : 1;
    return lu(t, i, r) || bt(t, i);
  } else {
    if (n == 38 || le && n == 80 && r == "c")
      return au(t, -1, r) || bt(t, -1);
    if (n == 40 || le && n == 78 && r == "c")
      return Fa(t) || au(t, 1, r) || bt(t, 1);
    if (r == (le ? "m" : "c") && (n == 66 || n == 73 || n == 89 || n == 90))
      return !0;
  }
  return !1;
}
function hi(t, e) {
  t.someProp("transformCopied", (d) => {
    e = d(e, t);
  });
  let n = [], { content: r, openStart: i, openEnd: u } = e;
  for (; i > 1 && u > 1 && r.childCount == 1 && r.firstChild.childCount == 1; ) {
    i--, u--;
    let d = r.firstChild;
    n.push(d.type.name, d.attrs != d.type.defaultAttrs ? d.attrs : null), r = d.content;
  }
  let o = t.someProp("clipboardSerializer") || mt.fromSchema(t.state.schema), s = Cs(), l = s.createElement("div");
  l.appendChild(o.serializeFragment(r, { document: s }));
  let c = l.firstChild, a, f = 0;
  for (; c && c.nodeType == 1 && (a = xs[c.nodeName.toLowerCase()]); ) {
    for (let d = a.length - 1; d >= 0; d--) {
      let h = s.createElement(a[d]);
      for (; l.firstChild; )
        h.appendChild(l.firstChild);
      l.appendChild(h), f++;
    }
    c = l.firstChild;
  }
  c && c.nodeType == 1 && c.setAttribute("data-pm-slice", `${i} ${u}${f ? ` -${f}` : ""} ${JSON.stringify(n)}`);
  let p = t.someProp("clipboardTextSerializer", (d) => d(e, t)) || e.content.textBetween(0, e.content.size, `

`);
  return { dom: l, text: p, slice: e };
}
function ms(t, e, n, r, i) {
  let u = i.parent.type.spec.code, o, s;
  if (!n && !e)
    return null;
  let l = !!e && (r || u || !n);
  if (l) {
    if (t.someProp("transformPastedText", (p) => {
      e = p(e, u || r, t);
    }), u)
      return s = new F(y.from(t.state.schema.text(e.replace(/\r\n?/g, `
`))), 0, 0), t.someProp("transformPasted", (p) => {
        s = p(s, t, !0);
      }), s;
    let f = t.someProp("clipboardTextParser", (p) => p(e, i, r, t));
    if (f)
      s = f;
    else {
      let p = i.marks(), { schema: d } = t.state, h = mt.fromSchema(d);
      o = document.createElement("div"), e.split(/(?:\r\n?|\n)+/).forEach((A) => {
        let m = o.appendChild(document.createElement("p"));
        A && m.appendChild(h.serializeNode(d.text(A, p)));
      });
    }
  } else
    t.someProp("transformPastedHTML", (f) => {
      n = f(n, t);
    }), o = Ma(n), An && Na(o);
  let c = o && o.querySelector("[data-pm-slice]"), a = c && /^(\d+) (\d+)(?: -(\d+))? (.*)/.exec(c.getAttribute("data-pm-slice") || "");
  if (a && a[3])
    for (let f = +a[3]; f > 0; f--) {
      let p = o.firstChild;
      for (; p && p.nodeType != 1; )
        p = p.nextSibling;
      if (!p)
        break;
      o = p;
    }
  if (s || (s = (t.someProp("clipboardParser") || t.someProp("domParser") || Et.fromSchema(t.state.schema)).parseSlice(o, {
    preserveWhitespace: !!(l || a),
    context: i,
    ruleFromNode(p) {
      return p.nodeName == "BR" && !p.nextSibling && p.parentNode && !Ia.test(p.parentNode.nodeName) ? { ignore: !0 } : null;
    }
  })), a)
    s = Oa(du(s, +a[1], +a[2]), a[4]);
  else if (s = F.maxOpen(Ba(s.content, i), !0), s.openStart || s.openEnd) {
    let f = 0, p = 0;
    for (let d = s.content.firstChild; f < s.openStart && !d.type.spec.isolating; f++, d = d.firstChild)
      ;
    for (let d = s.content.lastChild; p < s.openEnd && !d.type.spec.isolating; p++, d = d.lastChild)
      ;
    s = du(s, f, p);
  }
  return t.someProp("transformPasted", (f) => {
    s = f(s, t, l);
  }), s;
}
const Ia = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var)$/i;
function Ba(t, e) {
  if (t.childCount < 2)
    return t;
  for (let n = e.depth; n >= 0; n--) {
    let i = e.node(n).contentMatchAt(e.index(n)), u, o = [];
    if (t.forEach((s) => {
      if (!o)
        return;
      let l = i.findWrapping(s.type), c;
      if (!l)
        return o = null;
      if (c = o.length && u.length && bs(l, u, s, o[o.length - 1], 0))
        o[o.length - 1] = c;
      else {
        o.length && (o[o.length - 1] = ks(o[o.length - 1], u.length));
        let a = gs(s, l);
        o.push(a), i = i.matchType(a.type), u = l;
      }
    }), o)
      return y.from(o);
  }
  return t;
}
function gs(t, e, n = 0) {
  for (let r = e.length - 1; r >= n; r--)
    t = e[r].create(null, y.from(t));
  return t;
}
function bs(t, e, n, r, i) {
  if (i < t.length && i < e.length && t[i] == e[i]) {
    let u = bs(t, e, n, r.lastChild, i + 1);
    if (u)
      return r.copy(r.content.replaceChild(r.childCount - 1, u));
    if (r.contentMatchAt(r.childCount).matchType(i == t.length - 1 ? n.type : t[i + 1]))
      return r.copy(r.content.append(y.from(gs(n, t, i + 1))));
  }
}
function ks(t, e) {
  if (e == 0)
    return t;
  let n = t.content.replaceChild(t.childCount - 1, ks(t.lastChild, e - 1)), r = t.contentMatchAt(t.childCount).fillBefore(y.empty, !0);
  return t.copy(n.append(r));
}
function qr(t, e, n, r, i, u) {
  let o = e < 0 ? t.firstChild : t.lastChild, s = o.content;
  return t.childCount > 1 && (u = 0), i < r - 1 && (s = qr(s, e, n, r, i + 1, u)), i >= n && (s = e < 0 ? o.contentMatchAt(0).fillBefore(s, u <= i).append(s) : s.append(o.contentMatchAt(o.childCount).fillBefore(y.empty, !0))), t.replaceChild(e < 0 ? 0 : t.childCount - 1, o.copy(s));
}
function du(t, e, n) {
  return e < t.openStart && (t = new F(qr(t.content, -1, e, t.openStart, 0, t.openEnd), e, t.openEnd)), n < t.openEnd && (t = new F(qr(t.content, 1, n, t.openEnd, 0, 0), t.openStart, n)), t;
}
const xs = {
  thead: ["table"],
  tbody: ["table"],
  tfoot: ["table"],
  caption: ["table"],
  colgroup: ["table"],
  col: ["table", "colgroup"],
  tr: ["table", "tbody"],
  td: ["table", "tbody", "tr"],
  th: ["table", "tbody", "tr"]
};
function Cs() {
  return document.implementation.createHTMLDocument("title");
}
let vt = null;
function Sa(t) {
  let e = window.trustedTypes;
  if (!e)
    return t;
  if (!vt) {
    if (vt = e.defaultPolicy)
      try {
        return vt.createHTML(t);
      } catch {
      }
    vt = e.createPolicy("ProseMirrorClipboard", { createHTML: (n) => n });
  }
  return vt.createHTML(t);
}
function Ma(t) {
  let e = /^(\s*<meta [^>]*>)*/.exec(t);
  e && (t = t.slice(e[0].length));
  let n = Cs(), r = n.body, i = /<([a-z][^>\s]+)/i.exec(t), u;
  if ((u = i && xs[i[1].toLowerCase()]) && (t = u.map((o) => "<" + o + ">").join("") + t + u.map((o) => "</" + o + ">").reverse().join("")), r.innerHTML = Sa(t), u)
    for (let o = 0; o < u.length; o++)
      r = r.querySelector(u[o]) || r;
  for (let o = 0; o < n.styleSheets.length; o++) {
    let s = n.styleSheets[o];
    for (let l = 0; l < s.rules.length; l++) {
      let c = s.rules[l];
      if (c instanceof CSSStyleRule) {
        let a = r.querySelectorAll(c.selectorText);
        for (let f = 0; f < a.length; f++)
          a[f].style.cssText += c.style.cssText;
      }
    }
  }
  return r;
}
function Na(t) {
  let e = t.querySelectorAll(V ? "span:not([class]):not([style])" : "span.Apple-converted-space");
  for (let n = 0; n < e.length; n++) {
    let r = e[n];
    r.childNodes.length == 1 && r.textContent == " " && r.parentNode && r.parentNode.replaceChild(t.ownerDocument.createTextNode(" "), r);
  }
}
function Oa(t, e) {
  if (!t.size)
    return t;
  let n = t.content.firstChild.type.schema, r;
  try {
    r = JSON.parse(e);
  } catch {
    return t;
  }
  let { content: i, openStart: u, openEnd: o } = t;
  for (let s = r.length - 2; s >= 0; s -= 2) {
    let l = n.nodes[r[s]];
    if (!l || l.hasRequiredAttrs())
      break;
    try {
      l.checkAttrs(r[s + 1]);
    } catch {
      break;
    }
    i = y.from(l.create(r[s + 1], i)), u++, o++;
  }
  return new F(i, u, o);
}
const ee = {}, te = {}, Ra = { touchstart: !0, touchmove: !0 };
class Ta {
  constructor() {
    this.shiftKey = !1, this.mouseDown = null, this.lastKeyCode = null, this.lastKeyCodeTime = 0, this.lastClick = { time: 0, x: 0, y: 0, type: "", button: 0 }, this.lastSelectionOrigin = null, this.lastSelectionTime = 0, this.lastIOSEnter = 0, this.lastIOSEnterFallbackTimeout = -1, this.lastFocus = 0, this.lastTouch = 0, this.lastChromeDelete = 0, this.composing = !1, this.compositionNode = null, this.composingTimeout = -1, this.compositionNodes = [], this.compositionEndedAt = -2e8, this.compositionID = 1, this.badSafariComposition = !1, this.compositionPendingChanges = 0, this.domChangeCount = 0, this.eventHandlers = /* @__PURE__ */ Object.create(null), this.hideSelectionGuard = null;
  }
}
function va(t) {
  for (let e in ee) {
    let n = ee[e];
    t.dom.addEventListener(e, t.input.eventHandlers[e] = (r) => {
      Qa(t, r) && !di(t, r) && (t.editable || !(r.type in te)) && n(t, r);
    }, Ra[e] ? { passive: !0 } : void 0);
  }
  q && t.dom.addEventListener("input", () => null), jr(t);
}
function Oe(t, e) {
  t.input.lastSelectionOrigin = e, t.input.lastSelectionTime = Date.now();
}
function za(t) {
  t.input.mouseDown && t.input.mouseDown.done(), t.domObserver.stop();
  for (let e in t.input.eventHandlers)
    t.dom.removeEventListener(e, t.input.eventHandlers[e]);
  clearTimeout(t.input.composingTimeout), clearTimeout(t.input.lastIOSEnterFallbackTimeout);
}
function jr(t) {
  t.someProp("handleDOMEvents", (e) => {
    for (let n in e)
      t.input.eventHandlers[n] || t.dom.addEventListener(n, t.input.eventHandlers[n] = (r) => di(t, r));
  });
}
function di(t, e) {
  return t.someProp("handleDOMEvents", (n) => {
    let r = n[e.type];
    return r ? r(t, e) || e.defaultPrevented : !1;
  });
}
function Qa(t, e) {
  if (!e.bubbles)
    return !0;
  if (e.defaultPrevented)
    return !1;
  for (let n = e.target; n != t.dom; n = n.parentNode)
    if (!n || n.nodeType == 11 || n.pmViewDesc && n.pmViewDesc.stopEvent(e))
      return !1;
  return !0;
}
function Ka(t, e) {
  !di(t, e) && ee[e.type] && (t.editable || !(e.type in te)) && ee[e.type](t, e);
}
te.keydown = (t, e) => {
  let n = e;
  if (t.input.shiftKey = n.keyCode == 16 || n.shiftKey, !Fs(t) && (t.input.lastKeyCode = n.keyCode, t.input.lastKeyCodeTime = Date.now(), !(Ne && V && n.keyCode == 13)))
    if (n.keyCode != 229 && t.domObserver.forceFlush(), wt && n.keyCode == 13 && !n.ctrlKey && !n.altKey && !n.metaKey) {
      let r = Date.now();
      t.input.lastIOSEnter = r, t.input.lastIOSEnterFallbackTimeout = setTimeout(() => {
        t.input.lastIOSEnter == r && (t.someProp("handleKeyDown", (i) => i(t, rt(13, "Enter"))), t.input.lastIOSEnter = 0);
      }, 200);
    } else t.someProp("handleKeyDown", (r) => r(t, n)) || wa(t, n) ? n.preventDefault() : Oe(t, "key");
};
te.keyup = (t, e) => {
  e.keyCode == 16 && (t.input.shiftKey = !1);
};
te.keypress = (t, e) => {
  let n = e;
  if (Fs(t) || !n.charCode || n.ctrlKey && !n.altKey || le && n.metaKey)
    return;
  if (t.someProp("handleKeyPress", (i) => i(t, n))) {
    n.preventDefault();
    return;
  }
  let r = t.state.selection;
  if (!(r instanceof N) || !r.$from.sameParent(r.$to)) {
    let i = String.fromCharCode(n.charCode), u = () => t.state.tr.insertText(i).scrollIntoView();
    !/[\r\n]/.test(i) && !t.someProp("handleTextInput", (o) => o(t, r.$from.pos, r.$to.pos, i, u)) && t.dispatch(u()), n.preventDefault();
  }
};
function gn(t) {
  return { left: t.clientX, top: t.clientY };
}
function Wa(t, e) {
  let n = e.x - t.clientX, r = e.y - t.clientY;
  return n * n + r * r < 100;
}
function pi(t, e, n, r, i) {
  if (r == -1)
    return !1;
  let u = t.state.doc.resolve(r);
  for (let o = u.depth + 1; o > 0; o--)
    if (t.someProp(e, (s) => o > u.depth ? s(t, n, u.nodeAfter, u.before(o), i, !0) : s(t, n, u.node(o), u.before(o), i, !1)))
      return !0;
  return !1;
}
function bn(t, e, n) {
  if (t.focused || t.focus(), t.state.selection.eq(e))
    return;
  let r = t.state.tr.setSelection(e);
  r.setMeta("pointer", !0), t.dispatch(r);
}
function Pa(t, e) {
  if (e == -1)
    return !1;
  let n = t.state.doc.resolve(e), r = n.nodeAfter;
  return r && r.isAtom && w.isSelectable(r) ? (bn(t, new w(n)), !0) : !1;
}
function Ja(t, e) {
  if (e == -1)
    return !1;
  let n = t.state.selection, r, i;
  n instanceof w && (r = n.node);
  let u = t.state.doc.resolve(e);
  for (let o = u.depth + 1; o > 0; o--) {
    let s = o > u.depth ? u.nodeAfter : u.node(o);
    if (w.isSelectable(s)) {
      r && n.$from.depth > 0 && o >= n.$from.depth && u.before(n.$from.depth + 1) == n.$from.pos ? i = u.before(n.$from.depth) : i = u.before(o);
      break;
    }
  }
  return i != null ? (bn(t, w.create(t.state.doc, i)), !0) : !1;
}
function Ga(t, e, n, r, i) {
  return pi(t, "handleClickOn", e, n, r) || t.someProp("handleClick", (u) => u(t, e, r)) || (i ? Ja(t, n) : Pa(t, n));
}
function La(t, e, n, r) {
  return pi(t, "handleDoubleClickOn", e, n, r) || t.someProp("handleDoubleClick", (i) => i(t, e, r));
}
function Za(t, e, n, r) {
  return pi(t, "handleTripleClickOn", e, n, r) || t.someProp("handleTripleClick", (i) => i(t, e, r)) || Ya(t, n, r);
}
function Ya(t, e, n) {
  if (n.button != 0)
    return !1;
  let r = ys(t, e, !0), i = t.state.doc;
  return r ? (bn(t, r), r instanceof N && i.eq(t.state.doc) && (t.input.mouseDown = new Va(t, r)), !0) : !1;
}
function ys(t, e, n) {
  let r = t.state.doc;
  if (e == -1)
    return r.inlineContent ? N.create(r, 0, r.content.size) : null;
  let i = r.resolve(e);
  for (let u = i.depth + 1; u > 0; u--) {
    let o = u > i.depth ? i.nodeAfter : i.node(u), s = i.before(u);
    if (o.inlineContent)
      return N.create(r, s + 1, s + 1 + o.content.size);
    if (n && w.isSelectable(o))
      return w.create(r, s);
  }
  return null;
}
function Ai(t) {
  return Qn(t);
}
const Ds = le ? "metaKey" : "ctrlKey";
ee.mousedown = (t, e) => {
  let n = e;
  t.input.shiftKey = n.shiftKey;
  let r = Ai(t), i = Date.now(), u = "singleClick";
  i - t.input.lastClick.time < 500 && Wa(n, t.input.lastClick) && !n[Ds] && t.input.lastClick.button == n.button && (t.input.lastClick.type == "singleClick" ? u = "doubleClick" : t.input.lastClick.type == "doubleClick" && (u = "tripleClick")), t.input.lastClick = { time: i, x: n.clientX, y: n.clientY, type: u, button: n.button }, t.input.mouseDown && t.input.mouseDown.done();
  let o = t.posAtCoords(gn(n));
  o && (u == "singleClick" ? t.input.mouseDown = new Ha(t, o, n, !!r) : (u == "doubleClick" ? La : Za)(t, o.pos, o.inside, n) ? n.preventDefault() : Oe(t, "pointer"));
};
class Es {
  constructor(e) {
    this.view = e, this.mightDrag = null, e.root.addEventListener("mouseup", this.up = this.up.bind(this)), e.root.addEventListener("mousemove", this.move = this.move.bind(this));
  }
  up(e) {
    this.done();
  }
  move(e) {
    e.buttons == 0 && this.done();
  }
  done() {
    this.view.root.removeEventListener("mouseup", this.up), this.view.root.removeEventListener("mousemove", this.move), this.view.input.mouseDown == this && (this.view.input.mouseDown = null);
  }
  delaySelUpdate() {
    return !1;
  }
}
class Ha extends Es {
  constructor(e, n, r, i) {
    super(e), this.pos = n, this.event = r, this.flushed = i, this.delayedSelectionSync = !1, this.startDoc = e.state.doc, this.selectNode = !!r[Ds], this.allowDefault = r.shiftKey;
    let u, o;
    if (n.inside > -1)
      u = e.state.doc.nodeAt(n.inside), o = n.inside;
    else {
      let a = e.state.doc.resolve(n.pos);
      u = a.parent, o = a.depth ? a.before() : 0;
    }
    const s = i ? null : r.target, l = s ? e.docView.nearestDesc(s, !0) : null;
    this.target = l && l.nodeDOM.nodeType == 1 ? l.nodeDOM : null;
    let { selection: c } = e.state;
    r.button == 0 && (u.type.spec.draggable && u.type.spec.selectable !== !1 || c instanceof w && c.from <= o && c.to > o) && (this.mightDrag = {
      node: u,
      pos: o,
      addAttr: !!(this.target && !this.target.draggable),
      setUneditable: !!(this.target && ae && !this.target.hasAttribute("contentEditable"))
    }), this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable) && (this.view.domObserver.stop(), this.mightDrag.addAttr && (this.target.draggable = !0), this.mightDrag.setUneditable && setTimeout(() => {
      this.view.input.mouseDown == this && this.target.setAttribute("contentEditable", "false");
    }, 20), this.view.domObserver.start()), Oe(e, "pointer");
  }
  done() {
    super.done(), this.mightDrag && this.target && (this.view.domObserver.stop(), this.mightDrag.addAttr && this.target.removeAttribute("draggable"), this.mightDrag.setUneditable && this.target.removeAttribute("contentEditable"), this.view.domObserver.start()), this.delayedSelectionSync && setTimeout(() => {
      this.view.isDestroyed || Re(this.view);
    });
  }
  up(e) {
    if (this.done(), !this.view.dom.contains(e.target))
      return;
    let n = this.pos;
    this.view.state.doc != this.startDoc && (n = this.view.posAtCoords(gn(e))), this.updateAllowDefault(e), this.allowDefault || !n ? Oe(this.view, "pointer") : Ga(this.view, n.pos, n.inside, e, this.selectNode) ? e.preventDefault() : e.button == 0 && (this.flushed || // Safari ignores clicks on draggable elements
    q && this.mightDrag && !this.mightDrag.node.isAtom || // Chrome will sometimes treat a node selection as a
    // cursor, but still report that the node is selected
    // when asked through getSelection. You'll then get a
    // situation where clicking at the point where that
    // (hidden) cursor is doesn't change the selection, and
    // thus doesn't get a reaction from ProseMirror. This
    // works around that.
    V && !this.view.state.selection.visible && Math.min(Math.abs(n.pos - this.view.state.selection.from), Math.abs(n.pos - this.view.state.selection.to)) <= 2) ? (bn(this.view, M.near(this.view.state.doc.resolve(n.pos))), e.preventDefault()) : Oe(this.view, "pointer");
  }
  move(e) {
    this.updateAllowDefault(e), Oe(this.view, "pointer"), super.move(e);
  }
  updateAllowDefault(e) {
    !this.allowDefault && (Math.abs(this.event.x - e.clientX) > 4 || Math.abs(this.event.y - e.clientY) > 4) && (this.allowDefault = !0);
  }
  delaySelUpdate() {
    return this.allowDefault ? (this.delayedSelectionSync = !0, !0) : !1;
  }
}
class Va extends Es {
  constructor(e, n) {
    super(e), this.startSelection = n, this.startDoc = e.state.doc;
  }
  move(e) {
    if (e.buttons == 0 || this.view.isDestroyed || !this.view.state.doc.eq(this.startDoc)) {
      this.done();
      return;
    }
    e.preventDefault(), Oe(this.view, "pointer");
    let n = this.view.posAtCoords(gn(e)), r = n && ys(this.view, n.inside, !1);
    if (!r)
      return;
    let { doc: i } = this.view.state, u = this.startSelection, [o, s] = r.from < u.from ? [u.to, r.from] : [u.from, r.to];
    bn(this.view, N.create(i, o, s));
  }
}
ee.touchstart = (t) => {
  t.input.lastTouch = Date.now(), Ai(t), Oe(t, "pointer");
};
ee.touchmove = (t) => {
  t.input.lastTouch = Date.now(), Oe(t, "pointer");
};
ee.contextmenu = (t) => Ai(t);
function Fs(t, e) {
  return t.composing ? !0 : q && Math.abs(Date.now() - t.input.compositionEndedAt) < 500 ? (t.input.compositionEndedAt = -2e8, !0) : !1;
}
const Ua = Ne ? 5e3 : -1;
te.compositionstart = te.compositionupdate = (t) => {
  if (!t.composing) {
    t.domObserver.flush();
    let { state: e } = t, n = e.selection.$to;
    if (e.selection instanceof N && (e.storedMarks || !n.textOffset && n.parentOffset && n.nodeBefore.marks.some((r) => r.type.spec.inclusive === !1) || V && Xo && $a(t)))
      t.markCursor = t.state.storedMarks || n.marks(), Qn(t, !0), t.markCursor = null;
    else if (Qn(t, !e.selection.empty), ae && e.selection.empty && n.parentOffset && !n.textOffset && n.nodeBefore.marks.length) {
      let r = t.domSelectionRange();
      for (let i = r.focusNode, u = r.focusOffset; i && i.nodeType == 1 && u != 0; ) {
        let o = u < 0 ? i.lastChild : i.childNodes[u - 1];
        if (!o)
          break;
        if (o.nodeType == 3) {
          let s = t.domSelection();
          s && s.collapse(o, o.nodeValue.length);
          break;
        } else
          i = o, u = -1;
      }
    }
    t.input.composing = !0;
  }
  _s(t, Ua);
};
function $a(t) {
  let { focusNode: e, focusOffset: n } = t.domSelectionRange();
  if (!e || e.nodeType != 1 || n >= e.childNodes.length)
    return !1;
  let r = e.childNodes[n];
  return r.nodeType == 1 && r.contentEditable == "false";
}
te.compositionend = (t, e) => {
  t.composing && (t.input.composing = !1, t.input.compositionEndedAt = Date.now(), t.input.compositionPendingChanges = t.domObserver.pendingRecords().length ? t.input.compositionID : 0, t.input.compositionNode = null, t.input.badSafariComposition ? t.domObserver.forceFlush() : t.input.compositionPendingChanges && Promise.resolve().then(() => t.domObserver.flush()), t.input.compositionID++, _s(t, 20));
};
function _s(t, e) {
  clearTimeout(t.input.composingTimeout), e > -1 && (t.input.composingTimeout = setTimeout(() => Qn(t), e));
}
function ws(t) {
  for (t.composing && (t.input.composing = !1, t.input.compositionEndedAt = Date.now()); t.input.compositionNodes.length > 0; )
    t.input.compositionNodes.pop().markParentsDirty();
}
function qa(t) {
  let e = t.domSelectionRange();
  if (!e.focusNode)
    return null;
  let n = Jc(e.focusNode, e.focusOffset), r = Gc(e.focusNode, e.focusOffset);
  if (n && r && n != r) {
    let i = r.pmViewDesc, u = t.domObserver.lastChangedTextNode;
    if (n == u || r == u)
      return u;
    if (!i || !i.isText(r.nodeValue))
      return r;
    if (t.input.compositionNode == r) {
      let o = n.pmViewDesc;
      if (!(!o || !o.isText(n.nodeValue)))
        return r;
    }
  }
  return n || r;
}
function Qn(t, e = !1) {
  if (!(Ne && t.domObserver.flushingSoon >= 0)) {
    if (t.domObserver.forceFlush(), ws(t), e || t.docView && t.docView.dirty) {
      let n = ai(t), r = t.state.selection;
      return n && !n.eq(r) ? t.dispatch(t.state.tr.setSelection(n)) : (t.markCursor || e) && !r.$from.node(r.$from.sharedDepth(r.to)).inlineContent ? t.dispatch(t.state.tr.deleteSelection()) : t.updateState(t.state), !0;
    }
    return !1;
  }
}
function ja(t, e) {
  if (!t.dom.parentNode)
    return;
  let n = t.dom.parentNode.appendChild(document.createElement("div"));
  n.appendChild(e), n.style.cssText = "position: fixed; left: -10000px; top: 10px";
  let r = getSelection(), i = document.createRange();
  i.selectNodeContents(e), t.dom.blur(), r.removeAllRanges(), r.addRange(i), setTimeout(() => {
    n.parentNode && n.parentNode.removeChild(n), t.focus();
  }, 50);
}
const qt = ne && Ze < 15 || wt && Hc < 604;
ee.copy = te.cut = (t, e) => {
  let n = e, r = t.state.selection, i = n.type == "cut";
  if (r.empty)
    return;
  let u = qt ? null : n.clipboardData, o = r.content(), { dom: s, text: l } = hi(t, o);
  u ? (n.preventDefault(), u.clearData(), u.setData("text/html", s.innerHTML), u.setData("text/plain", l)) : ja(t, s), i && t.dispatch(t.state.tr.deleteSelection().scrollIntoView().setMeta("uiEvent", "cut"));
};
function Xa(t) {
  return t.openStart == 0 && t.openEnd == 0 && t.content.childCount == 1 ? t.content.firstChild : null;
}
function ef(t, e) {
  if (!t.dom.parentNode)
    return;
  let n = t.input.shiftKey || t.state.selection.$from.parent.type.spec.code, r = t.dom.parentNode.appendChild(document.createElement(n ? "textarea" : "div"));
  n || (r.contentEditable = "true"), r.style.cssText = "position: fixed; left: -10000px; top: 10px", r.focus();
  let i = t.input.shiftKey && t.input.lastKeyCode != 45;
  setTimeout(() => {
    t.focus(), r.parentNode && r.parentNode.removeChild(r), n ? jt(t, r.value, null, i, e) : jt(t, r.textContent, r.innerHTML, i, e);
  }, 50);
}
function jt(t, e, n, r, i) {
  let u = ms(t, e, n, r, t.state.selection.$from);
  if (t.someProp("handlePaste", (l) => l(t, i, u || F.empty)))
    return !0;
  if (!u)
    return !1;
  let o = Xa(u), s = o ? t.state.tr.replaceSelectionWith(o, r) : t.state.tr.replaceSelection(u);
  return t.dispatch(s.scrollIntoView().setMeta("paste", !0).setMeta("uiEvent", "paste")), !0;
}
function Is(t) {
  let e = t.getData("text/plain") || t.getData("Text");
  if (e)
    return e;
  let n = t.getData("text/uri-list");
  return n ? n.replace(/\r?\n/g, " ") : "";
}
te.paste = (t, e) => {
  let n = e;
  if (t.composing && !Ne)
    return;
  let r = qt ? null : n.clipboardData, i = t.input.shiftKey && t.input.lastKeyCode != 45;
  r && jt(t, Is(r), r.getData("text/html"), i, n) ? n.preventDefault() : ef(t, n);
};
class Bs {
  constructor(e, n, r) {
    this.slice = e, this.move = n, this.node = r;
  }
}
const tf = le ? "altKey" : "ctrlKey";
function Ss(t, e) {
  let n;
  return t.someProp("dragCopies", (r) => {
    n = n || r(e);
  }), n != null ? !n : !e[tf];
}
ee.dragstart = (t, e) => {
  let n = e, r = t.input.mouseDown;
  if (r && r.done(), !n.dataTransfer)
    return;
  let i = t.state.selection, u = i.empty ? null : t.posAtCoords(gn(n)), o;
  if (!(u && u.pos >= i.from && u.pos <= (i instanceof w ? i.to - 1 : i.to))) {
    if (r && r.mightDrag)
      o = w.create(t.state.doc, r.mightDrag.pos);
    else if (n.target && n.target.nodeType == 1) {
      let f = t.docView.nearestDesc(n.target, !0);
      f && f.node.type.spec.draggable && f != t.docView && (o = w.create(t.state.doc, f.posBefore));
    }
  }
  let s = (o || t.state.selection).content(), { dom: l, text: c, slice: a } = hi(t, s);
  (!n.dataTransfer.files.length || !V || jo > 120) && n.dataTransfer.clearData(), n.dataTransfer.setData(qt ? "Text" : "text/html", l.innerHTML), n.dataTransfer.effectAllowed = "copyMove", qt || n.dataTransfer.setData("text/plain", c), t.dragging = new Bs(a, Ss(t, n), o);
};
ee.dragend = (t) => {
  let e = t.dragging;
  window.setTimeout(() => {
    t.dragging == e && (t.dragging = null);
  }, 50);
};
te.dragover = te.dragenter = (t, e) => e.preventDefault();
te.drop = (t, e) => {
  try {
    nf(t, e, t.dragging);
  } finally {
    t.dragging = null;
  }
};
function nf(t, e, n) {
  if (!e.dataTransfer)
    return;
  let r = t.posAtCoords(gn(e));
  if (!r)
    return;
  let i = t.state.doc.resolve(r.pos), u = n && n.slice;
  u ? t.someProp("transformPasted", (d) => {
    u = d(u, t, !1);
  }) : u = ms(t, Is(e.dataTransfer), qt ? null : e.dataTransfer.getData("text/html"), !1, i);
  let o = !!(n && Ss(t, e));
  if (t.someProp("handleDrop", (d) => d(t, e, u || F.empty, o))) {
    e.preventDefault();
    return;
  }
  if (!u)
    return;
  e.preventDefault();
  let s = u ? Ic(t.state.doc, i.pos, u) : i.pos;
  s == null && (s = i.pos);
  let l = t.state.tr;
  if (o) {
    let { node: d } = n;
    d ? d.replace(l) : l.deleteSelection();
  }
  let c = l.mapping.map(s), a = u.openStart == 0 && u.openEnd == 0 && u.content.childCount == 1, f = l.doc;
  if (a ? l.replaceRangeWith(c, c, u.content.firstChild) : l.replaceRange(c, c, u), l.doc.eq(f))
    return;
  let p = l.doc.resolve(c);
  if (a && w.isSelectable(u.content.firstChild) && p.nodeAfter && p.nodeAfter.sameMarkup(u.content.firstChild))
    l.setSelection(new w(p));
  else {
    let d = l.mapping.map(s);
    l.mapping.maps[l.mapping.maps.length - 1].forEach((h, A, m, g) => d = g), l.setSelection(fi(t, p, l.doc.resolve(d)));
  }
  t.focus(), t.dispatch(l.setMeta("uiEvent", "drop"));
}
ee.focus = (t) => {
  t.input.lastFocus = Date.now(), t.focused || (t.domObserver.stop(), t.dom.classList.add("ProseMirror-focused"), t.domObserver.start(), t.focused = !0, setTimeout(() => {
    t.docView && t.hasFocus() && !t.domObserver.currentSelection.eq(t.domSelectionRange()) && Re(t);
  }, 20));
};
ee.blur = (t, e) => {
  let n = e;
  t.focused && (t.domObserver.stop(), t.dom.classList.remove("ProseMirror-focused"), t.domObserver.start(), n.relatedTarget && t.dom.contains(n.relatedTarget) && t.domObserver.currentSelection.clear(), t.focused = !1);
};
ee.beforeinput = (t, e) => {
  if (Ne && e.inputType == "deleteContentBackward") {
    t.domObserver.flushSoon();
    let { domChangeCount: r } = t.input;
    setTimeout(() => {
      if (t.input.domChangeCount != r || (t.dom.blur(), t.focus(), t.someProp("handleKeyDown", (u) => u(t, rt(8, "Backspace")))))
        return;
      let { $cursor: i } = t.state.selection;
      i && i.pos > 0 && t.dispatch(t.state.tr.delete(i.pos - 1, i.pos).scrollIntoView());
    }, 50);
  }
};
for (let t in te)
  ee[t] = te[t];
function Xt(t, e) {
  if (t == e)
    return !0;
  for (let n in t)
    if (t[n] !== e[n])
      return !1;
  for (let n in e)
    if (!(n in t))
      return !1;
  return !0;
}
class Kn {
  constructor(e, n) {
    this.toDOM = e, this.spec = n || ct, this.side = this.spec.side || 0;
  }
  map(e, n, r, i) {
    let { pos: u, deleted: o } = e.mapResult(n.from + i, this.side < 0 ? -1 : 1);
    return o ? null : new Ae(u - r, u - r, this);
  }
  valid() {
    return !0;
  }
  eq(e) {
    return this == e || e instanceof Kn && (this.spec.key && this.spec.key == e.spec.key || this.toDOM == e.toDOM && Xt(this.spec, e.spec));
  }
  destroy(e) {
    this.spec.destroy && this.spec.destroy(e);
  }
}
class Ve {
  constructor(e, n) {
    this.attrs = e, this.spec = n || ct;
  }
  map(e, n, r, i) {
    let u = e.map(n.from + i, this.spec.inclusiveStart ? -1 : 1) - r, o = e.map(n.to + i, this.spec.inclusiveEnd ? 1 : -1) - r;
    return u >= o ? null : new Ae(u, o, this);
  }
  valid(e, n) {
    return n.from < n.to;
  }
  eq(e) {
    return this == e || e instanceof Ve && Xt(this.attrs, e.attrs) && Xt(this.spec, e.spec);
  }
  static is(e) {
    return e.type instanceof Ve;
  }
  destroy() {
  }
}
class mi {
  constructor(e, n) {
    this.attrs = e, this.spec = n || ct;
  }
  map(e, n, r, i) {
    let u = e.mapResult(n.from + i, 1);
    if (u.deleted)
      return null;
    let o = e.mapResult(n.to + i, -1);
    return o.deleted || o.pos <= u.pos ? null : new Ae(u.pos - r, o.pos - r, this);
  }
  valid(e, n) {
    let { index: r, offset: i } = e.content.findIndex(n.from), u;
    return i == n.from && !(u = e.child(r)).isText && i + u.nodeSize == n.to;
  }
  eq(e) {
    return this == e || e instanceof mi && Xt(this.attrs, e.attrs) && Xt(this.spec, e.spec);
  }
  destroy() {
  }
}
class Ae {
  /**
  @internal
  */
  constructor(e, n, r) {
    this.from = e, this.to = n, this.type = r;
  }
  /**
  @internal
  */
  copy(e, n) {
    return new Ae(e, n, this.type);
  }
  /**
  @internal
  */
  eq(e, n = 0) {
    return this.type.eq(e.type) && this.from + n == e.from && this.to + n == e.to;
  }
  /**
  @internal
  */
  map(e, n, r) {
    return this.type.map(e, this, n, r);
  }
  /**
  Creates a widget decoration, which is a DOM node that's shown in
  the document at the given position. It is recommended that you
  delay rendering the widget by passing a function that will be
  called when the widget is actually drawn in a view, but you can
  also directly pass a DOM node. `getPos` can be used to find the
  widget's current document position.
  */
  static widget(e, n, r) {
    return new Ae(e, e, new Kn(n, r));
  }
  /**
  Creates an inline decoration, which adds the given attributes to
  each inline node between `from` and `to`.
  */
  static inline(e, n, r, i) {
    return new Ae(e, n, new Ve(r, i));
  }
  /**
  Creates a node decoration. `from` and `to` should point precisely
  before and after a node in the document. That node, and only that
  node, will receive the given attributes.
  */
  static node(e, n, r, i) {
    return new Ae(e, n, new mi(r, i));
  }
  /**
  The spec provided when creating this decoration. Can be useful
  if you've stored extra information in that object.
  */
  get spec() {
    return this.type.spec;
  }
  /**
  @internal
  */
  get inline() {
    return this.type instanceof Ve;
  }
  /**
  @internal
  */
  get widget() {
    return this.type instanceof Kn;
  }
}
const xt = [], ct = {};
class P {
  /**
  @internal
  */
  constructor(e, n) {
    this.local = e.length ? e : xt, this.children = n.length ? n : xt;
  }
  /**
  Create a set of decorations, using the structure of the given
  document. This will consume (modify) the `decorations` array, so
  you must make a copy if you want need to preserve that.
  */
  static create(e, n) {
    return n.length ? Wn(n, e, 0, ct) : $;
  }
  /**
  Find all decorations in this set which touch the given range
  (including decorations that start or end directly at the
  boundaries) and match the given predicate on their spec. When
  `start` and `end` are omitted, all decorations in the set are
  considered. When `predicate` isn't given, all decorations are
  assumed to match.
  */
  find(e, n, r) {
    let i = [];
    return this.findInner(e ?? 0, n ?? 1e9, i, 0, r), i;
  }
  findInner(e, n, r, i, u) {
    for (let o = 0; o < this.local.length; o++) {
      let s = this.local[o];
      s.from <= n && s.to >= e && (!u || u(s.spec)) && r.push(s.copy(s.from + i, s.to + i));
    }
    for (let o = 0; o < this.children.length; o += 3)
      if (this.children[o] < n && this.children[o + 1] > e) {
        let s = this.children[o] + 1;
        this.children[o + 2].findInner(e - s, n - s, r, i + s, u);
      }
  }
  /**
  Map the set of decorations in response to a change in the
  document.
  */
  map(e, n, r) {
    return this == $ || e.maps.length == 0 ? this : this.mapInner(e, n, 0, 0, r || ct);
  }
  /**
  @internal
  */
  mapInner(e, n, r, i, u) {
    let o;
    for (let s = 0; s < this.local.length; s++) {
      let l = this.local[s].map(e, r, i);
      l && l.type.valid(n, l) ? (o || (o = [])).push(l) : u.onRemove && u.onRemove(this.local[s].spec);
    }
    return this.children.length ? rf(this.children, o || [], e, n, r, i, u) : o ? new P(o.sort(at), xt) : $;
  }
  /**
  Add the given array of decorations to the ones in the set,
  producing a new set. Consumes the `decorations` array. Needs
  access to the current document to create the appropriate tree
  structure.
  */
  add(e, n) {
    return n.length ? this == $ ? P.create(e, n) : this.addInner(e, n, 0) : this;
  }
  addInner(e, n, r) {
    let i, u = 0;
    e.forEach((s, l) => {
      let c = l + r, a;
      if (a = Ns(n, s, c)) {
        for (i || (i = this.children.slice()); u < i.length && i[u] < l; )
          u += 3;
        i[u] == l ? i[u + 2] = i[u + 2].addInner(s, a, c + 1) : i.splice(u, 0, l, l + s.nodeSize, Wn(a, s, c + 1, ct)), u += 3;
      }
    });
    let o = Ms(u ? Os(n) : n, -r);
    for (let s = 0; s < o.length; s++)
      o[s].type.valid(e, o[s]) || o.splice(s--, 1);
    return new P(o.length ? this.local.concat(o).sort(at) : this.local, i || this.children);
  }
  /**
  Create a new set that contains the decorations in this set, minus
  the ones in the given array.
  */
  remove(e) {
    return e.length == 0 || this == $ ? this : this.removeInner(e, 0);
  }
  removeInner(e, n) {
    let r = this.children, i = this.local;
    for (let u = 0; u < r.length; u += 3) {
      let o, s = r[u] + n, l = r[u + 1] + n;
      for (let a = 0, f; a < e.length; a++)
        (f = e[a]) && f.from > s && f.to < l && (e[a] = null, (o || (o = [])).push(f));
      if (!o)
        continue;
      r == this.children && (r = this.children.slice());
      let c = r[u + 2].removeInner(o, s + 1);
      c != $ ? r[u + 2] = c : (r.splice(u, 3), u -= 3);
    }
    if (i.length) {
      for (let u = 0, o; u < e.length; u++)
        if (o = e[u])
          for (let s = 0; s < i.length; s++)
            i[s].eq(o, n) && (i == this.local && (i = this.local.slice()), i.splice(s--, 1));
    }
    return r == this.children && i == this.local ? this : i.length || r.length ? new P(i, r) : $;
  }
  forChild(e, n) {
    if (this == $)
      return this;
    if (n.isLeaf)
      return P.empty;
    let r, i;
    for (let s = 0; s < this.children.length; s += 3)
      if (this.children[s] >= e) {
        this.children[s] == e && (r = this.children[s + 2]);
        break;
      }
    let u = e + 1, o = u + n.content.size;
    for (let s = 0; s < this.local.length; s++) {
      let l = this.local[s];
      if (l.from < o && l.to > u && l.type instanceof Ve) {
        let c = Math.max(u, l.from) - u, a = Math.min(o, l.to) - u;
        c < a && (i || (i = [])).push(l.copy(c, a));
      }
    }
    if (i) {
      let s = new P(i.sort(at), xt);
      return r ? new We([s, r]) : s;
    }
    return r || $;
  }
  /**
  @internal
  */
  eq(e) {
    if (this == e)
      return !0;
    if (!(e instanceof P) || this.local.length != e.local.length || this.children.length != e.children.length)
      return !1;
    for (let n = 0; n < this.local.length; n++)
      if (!this.local[n].eq(e.local[n]))
        return !1;
    for (let n = 0; n < this.children.length; n += 3)
      if (this.children[n] != e.children[n] || this.children[n + 1] != e.children[n + 1] || !this.children[n + 2].eq(e.children[n + 2]))
        return !1;
    return !0;
  }
  /**
  @internal
  */
  locals(e) {
    return gi(this.localsInner(e));
  }
  /**
  @internal
  */
  localsInner(e) {
    if (this == $)
      return xt;
    if (e.inlineContent || !this.local.some(Ve.is))
      return this.local;
    let n = [];
    for (let r = 0; r < this.local.length; r++)
      this.local[r].type instanceof Ve || n.push(this.local[r]);
    return n;
  }
  forEachSet(e) {
    e(this);
  }
}
P.empty = new P([], []);
P.removeOverlap = gi;
const $ = P.empty;
class We {
  constructor(e) {
    this.members = e;
  }
  map(e, n) {
    const r = this.members.map((i) => i.map(e, n, ct));
    return We.from(r);
  }
  forChild(e, n) {
    if (n.isLeaf)
      return P.empty;
    let r = [];
    for (let i = 0; i < this.members.length; i++) {
      let u = this.members[i].forChild(e, n);
      u != $ && (u instanceof We ? r = r.concat(u.members) : r.push(u));
    }
    return We.from(r);
  }
  eq(e) {
    if (!(e instanceof We) || e.members.length != this.members.length)
      return !1;
    for (let n = 0; n < this.members.length; n++)
      if (!this.members[n].eq(e.members[n]))
        return !1;
    return !0;
  }
  locals(e) {
    let n, r = !0;
    for (let i = 0; i < this.members.length; i++) {
      let u = this.members[i].localsInner(e);
      if (u.length)
        if (!n)
          n = u;
        else {
          r && (n = n.slice(), r = !1);
          for (let o = 0; o < u.length; o++)
            n.push(u[o]);
        }
    }
    return n ? gi(r ? n : n.sort(at)) : xt;
  }
  // Create a group for the given array of decoration sets, or return
  // a single set when possible.
  static from(e) {
    switch (e.length) {
      case 0:
        return $;
      case 1:
        return e[0];
      default:
        return new We(e.every((n) => n instanceof P) ? e : e.reduce((n, r) => n.concat(r instanceof P ? r : r.members), []));
    }
  }
  forEachSet(e) {
    for (let n = 0; n < this.members.length; n++)
      this.members[n].forEachSet(e);
  }
}
function rf(t, e, n, r, i, u, o) {
  let s = t.slice();
  for (let c = 0, a = u; c < n.maps.length; c++) {
    let f = 0;
    n.maps[c].forEach((p, d, h, A) => {
      let m = A - h - (d - p);
      for (let g = 0; g < s.length; g += 3) {
        let x = s[g + 1];
        if (x < 0 || p > x + a - f)
          continue;
        let b = s[g] + a - f;
        d >= b ? s[g + 1] = p <= b ? -2 : -1 : p >= a && m && (s[g] += m, s[g + 1] += m);
      }
      f += m;
    }), a = n.maps[c].map(a, -1);
  }
  let l = !1;
  for (let c = 0; c < s.length; c += 3)
    if (s[c + 1] < 0) {
      if (s[c + 1] == -2) {
        l = !0, s[c + 1] = -1;
        continue;
      }
      let a = n.map(t[c] + u), f = a - i;
      if (f < 0 || f >= r.content.size) {
        l = !0;
        continue;
      }
      let p = n.map(t[c + 1] + u, -1), d = p - i, { index: h, offset: A } = r.content.findIndex(f), m = r.maybeChild(h);
      if (m && A == f && A + m.nodeSize == d) {
        let g = s[c + 2].mapInner(n, m, a + 1, t[c] + u + 1, o);
        g != $ ? (s[c] = f, s[c + 1] = d, s[c + 2] = g) : (s[c + 1] = -2, l = !0);
      } else
        l = !0;
    }
  if (l) {
    let c = uf(s, t, e, n, i, u, o), a = Wn(c, r, 0, o);
    e = a.local;
    for (let f = 0; f < s.length; f += 3)
      s[f + 1] < 0 && (s.splice(f, 3), f -= 3);
    for (let f = 0, p = 0; f < a.children.length; f += 3) {
      let d = a.children[f];
      for (; p < s.length && s[p] < d; )
        p += 3;
      s.splice(p, 0, a.children[f], a.children[f + 1], a.children[f + 2]);
    }
  }
  return new P(e.sort(at), s);
}
function Ms(t, e) {
  if (!e || !t.length)
    return t;
  let n = [];
  for (let r = 0; r < t.length; r++) {
    let i = t[r];
    n.push(new Ae(i.from + e, i.to + e, i.type));
  }
  return n;
}
function uf(t, e, n, r, i, u, o) {
  function s(l, c) {
    for (let a = 0; a < l.local.length; a++) {
      let f = l.local[a].map(r, i, c);
      f ? n.push(f) : o.onRemove && o.onRemove(l.local[a].spec);
    }
    for (let a = 0; a < l.children.length; a += 3)
      s(l.children[a + 2], l.children[a] + c + 1);
  }
  for (let l = 0; l < t.length; l += 3)
    t[l + 1] == -1 && s(t[l + 2], e[l] + u + 1);
  return n;
}
function Ns(t, e, n) {
  if (e.isLeaf)
    return null;
  let r = n + e.nodeSize, i = null;
  for (let u = 0, o; u < t.length; u++)
    (o = t[u]) && o.from > n && o.to < r && ((i || (i = [])).push(o), t[u] = null);
  return i;
}
function Os(t) {
  let e = [];
  for (let n = 0; n < t.length; n++)
    t[n] != null && e.push(t[n]);
  return e;
}
function Wn(t, e, n, r) {
  let i = [], u = !1;
  e.forEach((s, l) => {
    let c = Ns(t, s, l + n);
    if (c) {
      u = !0;
      let a = Wn(c, s, n + l + 1, r);
      a != $ && i.push(l, l + s.nodeSize, a);
    }
  });
  let o = Ms(u ? Os(t) : t, -n).sort(at);
  for (let s = 0; s < o.length; s++)
    o[s].type.valid(e, o[s]) || (r.onRemove && r.onRemove(o[s].spec), o.splice(s--, 1));
  return o.length || i.length ? new P(o, i) : $;
}
function at(t, e) {
  return t.from - e.from || t.to - e.to;
}
function gi(t) {
  let e = t;
  for (let n = 0; n < e.length - 1; n++) {
    let r = e[n];
    if (r.from != r.to)
      for (let i = n + 1; i < e.length; i++) {
        let u = e[i];
        if (u.from == r.from) {
          u.to != r.to && (e == t && (e = t.slice()), e[i] = u.copy(u.from, r.to), pu(e, i + 1, u.copy(r.to, u.to)));
          continue;
        } else {
          u.from < r.to && (e == t && (e = t.slice()), e[n] = r.copy(r.from, u.from), pu(e, i, r.copy(u.from, r.to)));
          break;
        }
      }
  }
  return e;
}
function pu(t, e, n) {
  for (; e < t.length && at(n, t[e]) > 0; )
    e++;
  t.splice(e, 0, n);
}
function mr(t) {
  let e = [];
  return t.someProp("decorations", (n) => {
    let r = n(t.state);
    r && r != $ && e.push(r);
  }), t.cursorWrapper && e.push(P.create(t.state.doc, [t.cursorWrapper.deco])), We.from(e);
}
const of = {
  childList: !0,
  characterData: !0,
  characterDataOldValue: !0,
  attributes: !0,
  attributeOldValue: !0,
  subtree: !0
}, sf = ne && Ze <= 11;
class lf {
  constructor() {
    this.anchorNode = null, this.anchorOffset = 0, this.focusNode = null, this.focusOffset = 0;
  }
  set(e) {
    this.anchorNode = e.anchorNode, this.anchorOffset = e.anchorOffset, this.focusNode = e.focusNode, this.focusOffset = e.focusOffset;
  }
  clear() {
    this.anchorNode = this.focusNode = null;
  }
  eq(e) {
    return e.anchorNode == this.anchorNode && e.anchorOffset == this.anchorOffset && e.focusNode == this.focusNode && e.focusOffset == this.focusOffset;
  }
}
class cf {
  constructor(e, n) {
    this.view = e, this.handleDOMChange = n, this.queue = [], this.flushingSoon = -1, this.observer = null, this.currentSelection = new lf(), this.onCharData = null, this.suppressingSelectionUpdates = !1, this.lastChangedTextNode = null, this.observer = window.MutationObserver && new window.MutationObserver((r) => {
      for (let i = 0; i < r.length; i++)
        this.queue.push(r[i]);
      ne && Ze <= 11 && r.some((i) => i.type == "childList" && i.removedNodes.length || i.type == "characterData" && i.oldValue.length > i.target.nodeValue.length) ? this.flushSoon() : q && e.composing && r.some((i) => i.type == "childList" && i.target.nodeName == "TR") ? (e.input.badSafariComposition = !0, this.flushSoon()) : this.flush();
    }), sf && (this.onCharData = (r) => {
      this.queue.push({ target: r.target, type: "characterData", oldValue: r.prevValue }), this.flushSoon();
    }), this.onSelectionChange = this.onSelectionChange.bind(this);
  }
  flushSoon() {
    this.flushingSoon < 0 && (this.flushingSoon = window.setTimeout(() => {
      this.flushingSoon = -1, this.flush();
    }, 20));
  }
  forceFlush() {
    this.flushingSoon > -1 && (window.clearTimeout(this.flushingSoon), this.flushingSoon = -1, this.flush());
  }
  start() {
    this.observer && (this.observer.takeRecords(), this.observer.observe(this.view.dom, of)), this.onCharData && this.view.dom.addEventListener("DOMCharacterDataModified", this.onCharData), this.connectSelection();
  }
  stop() {
    if (this.observer) {
      let e = this.observer.takeRecords();
      if (e.length) {
        for (let n = 0; n < e.length; n++)
          this.queue.push(e[n]);
        window.setTimeout(() => this.flush(), 20);
      }
      this.observer.disconnect();
    }
    this.onCharData && this.view.dom.removeEventListener("DOMCharacterDataModified", this.onCharData), this.disconnectSelection();
  }
  connectSelection() {
    this.view.dom.ownerDocument.addEventListener("selectionchange", this.onSelectionChange);
  }
  disconnectSelection() {
    this.view.dom.ownerDocument.removeEventListener("selectionchange", this.onSelectionChange);
  }
  suppressSelectionUpdates() {
    this.suppressingSelectionUpdates = !0, setTimeout(() => this.suppressingSelectionUpdates = !1, 50);
  }
  onSelectionChange() {
    if (su(this.view)) {
      if (this.suppressingSelectionUpdates)
        return Re(this.view);
      if (ne && Ze <= 11 && !this.view.state.selection.empty) {
        let e = this.view.domSelectionRange();
        if (e.focusNode && At(e.focusNode, e.focusOffset, e.anchorNode, e.anchorOffset))
          return this.flushSoon();
      }
      this.flush();
    }
  }
  setCurSelection() {
    this.currentSelection.set(this.view.domSelectionRange());
  }
  ignoreSelectionChange(e) {
    if (!e.focusNode)
      return !0;
    let n = /* @__PURE__ */ new Set(), r;
    for (let u = e.focusNode; u; u = _t(u))
      n.add(u);
    for (let u = e.anchorNode; u; u = _t(u))
      if (n.has(u)) {
        r = u;
        break;
      }
    let i = r && this.view.docView.nearestDesc(r);
    if (i && i.ignoreMutation({
      type: "selection",
      target: r.nodeType == 3 ? r.parentNode : r
    }))
      return this.setCurSelection(), !0;
  }
  pendingRecords() {
    if (this.observer)
      for (let e of this.observer.takeRecords())
        this.queue.push(e);
    return this.queue;
  }
  flush() {
    let { view: e } = this;
    if (!e.docView || this.flushingSoon > -1)
      return;
    let n = this.pendingRecords();
    n.length && (this.queue = []);
    let r = e.domSelectionRange(), i = !this.suppressingSelectionUpdates && !this.currentSelection.eq(r) && su(e) && !this.ignoreSelectionChange(r), u = -1, o = -1, s = !1, l = [];
    if (e.editable)
      for (let a = 0; a < n.length; a++) {
        let f = this.registerMutation(n[a], l);
        f && (u = u < 0 ? f.from : Math.min(f.from, u), o = o < 0 ? f.to : Math.max(f.to, o), f.typeOver && (s = !0));
      }
    if (l.some((a) => a.nodeName == "BR") && (e.input.lastKeyCode == 8 || e.input.lastKeyCode == 46 || V && (e.composing || e.input.compositionEndedAt > Date.now() - 50) && n.some((a) => a.type == "childList" && a.removedNodes.length))) {
      for (let a of l)
        if (a.nodeName == "BR" && a.parentNode) {
          let f = a.nextSibling;
          for (; f && f.nodeType == 1; ) {
            if (f.contentEditable == "false") {
              a.parentNode.removeChild(a);
              break;
            }
            f = f.firstChild;
          }
        }
    } else if (ae && l.length) {
      let a = l.filter((f) => f.nodeName == "BR");
      if (a.length == 2) {
        let [f, p] = a;
        f.parentNode && f.parentNode.parentNode == p.parentNode ? p.remove() : f.remove();
      } else {
        let { focusNode: f } = this.currentSelection;
        for (let p of a) {
          let d = p.parentNode;
          d && d.nodeName == "LI" && (!f || hf(e, f) != d) && p.remove();
        }
      }
    }
    let c = null;
    u < 0 && i && e.input.lastFocus > Date.now() - 200 && Math.max(e.input.lastTouch, e.input.lastClick.time) < Date.now() - 300 && $n(r) && (c = ai(e)) && c.eq(M.near(e.state.doc.resolve(0), 1)) ? (e.input.lastFocus = 0, Re(e), this.currentSelection.set(r), e.scrollToSelection()) : (u > -1 || i) && (u > -1 && (e.docView.markDirty(u, o), af(e)), e.input.badSafariComposition && (e.input.badSafariComposition = !1, df(e, l)), this.handleDOMChange(u, o, s, l), e.docView && e.docView.dirty ? e.updateState(e.state) : this.currentSelection.eq(r) || Re(e), this.currentSelection.set(r));
  }
  registerMutation(e, n) {
    if (n.indexOf(e.target) > -1)
      return null;
    let r = this.view.docView.nearestDesc(e.target);
    if (e.type == "attributes" && (r == this.view.docView || e.attributeName == "contenteditable" || // Firefox sometimes fires spurious events for null/empty styles
    e.attributeName == "style" && !e.oldValue && !e.target.getAttribute("style")) || !r || r.ignoreMutation(e))
      return null;
    if (e.type == "childList") {
      for (let a = 0; a < e.addedNodes.length; a++) {
        let f = e.addedNodes[a];
        n.push(f), f.nodeType == 3 && (this.lastChangedTextNode = f);
      }
      if (r.contentDOM && r.contentDOM != r.dom && !r.contentDOM.contains(e.target))
        return { from: r.posBefore, to: r.posAfter };
      let i = e.previousSibling, u = e.nextSibling;
      if (ne && Ze <= 11 && e.addedNodes.length)
        for (let a = 0; a < e.addedNodes.length; a++) {
          let { previousSibling: f, nextSibling: p } = e.addedNodes[a];
          (!f || Array.prototype.indexOf.call(e.addedNodes, f) < 0) && (i = f), (!p || Array.prototype.indexOf.call(e.addedNodes, p) < 0) && (u = p);
        }
      let o = i && i.parentNode == e.target ? Y(i) + 1 : 0, s = r.localPosFromDOM(e.target, o, -1), l = u && u.parentNode == e.target ? Y(u) : e.target.childNodes.length, c = r.localPosFromDOM(e.target, l, 1);
      return { from: s, to: c };
    } else return e.type == "attributes" ? { from: r.posAtStart - r.border, to: r.posAtEnd + r.border } : (this.lastChangedTextNode = e.target, {
      from: r.posAtStart,
      to: r.posAtEnd,
      // An event was generated for a text change that didn't change
      // any text. Mark the dom change to fall back to assuming the
      // selection was typed over with an identical value if it can't
      // find another change.
      typeOver: e.target.nodeValue == e.oldValue
    });
  }
}
let Au = /* @__PURE__ */ new WeakMap(), mu = !1;
function af(t) {
  if (!Au.has(t) && (Au.set(t, null), ["normal", "nowrap", "pre-line"].indexOf(getComputedStyle(t.dom).whiteSpace) !== -1)) {
    if (t.requiresGeckoHackNode = ae, mu)
      return;
    console.warn("ProseMirror expects the CSS white-space property to be set, preferably to 'pre-wrap'. It is recommended to load style/prosemirror.css from the prosemirror-view package."), mu = !0;
  }
}
function gu(t, e) {
  let n = e.startContainer, r = e.startOffset, i = e.endContainer, u = e.endOffset, o = t.domAtPos(t.state.selection.anchor);
  return At(o.node, o.offset, i, u) && ([n, r, i, u] = [i, u, n, r]), { anchorNode: n, anchorOffset: r, focusNode: i, focusOffset: u };
}
function ff(t, e) {
  if (e.getComposedRanges) {
    let i = e.getComposedRanges(t.root)[0];
    if (i)
      return gu(t, i);
  }
  let n;
  function r(i) {
    i.preventDefault(), i.stopImmediatePropagation(), n = i.getTargetRanges()[0];
  }
  return t.dom.addEventListener("beforeinput", r, !0), document.execCommand("indent"), t.dom.removeEventListener("beforeinput", r, !0), n ? gu(t, n) : null;
}
function hf(t, e) {
  for (let n = e.parentNode; n && n != t.dom; n = n.parentNode) {
    let r = t.docView.nearestDesc(n, !0);
    if (r && r.node.isBlock)
      return n;
  }
  return null;
}
function df(t, e) {
  var n;
  let { focusNode: r, focusOffset: i } = t.domSelectionRange();
  for (let u of e)
    if (((n = u.parentNode) === null || n === void 0 ? void 0 : n.nodeName) == "TR") {
      let o = u.nextSibling;
      for (; o && o.nodeName != "TD" && o.nodeName != "TH"; )
        o = o.nextSibling;
      if (o) {
        let s = o;
        for (; ; ) {
          let l = s.firstChild;
          if (!l || l.nodeType != 1 || l.contentEditable == "false" || /^(BR|IMG)$/.test(l.nodeName))
            break;
          s = l;
        }
        s.insertBefore(u, s.firstChild), r == u && t.domSelection().collapse(u, i);
      } else
        u.parentNode.removeChild(u);
    }
}
function pf(t, e, n, r) {
  let { node: i, fromOffset: u, toOffset: o, from: s, to: l } = t.docView.parseRange(e, n), c = t.domSelectionRange(), a, f = c.anchorNode;
  if (f && t.dom.contains(f.nodeType == 1 ? f : f.parentNode) && (a = [{ node: f, offset: c.anchorOffset }], $n(c) || a.push({ node: c.focusNode, offset: c.focusOffset })), V && t.input.lastKeyCode === 8)
    for (let g = o; g > u; g--) {
      let x = i.childNodes[g - 1], b = x.pmViewDesc;
      if (x.nodeName == "BR" && !b) {
        o = g;
        break;
      }
      if (!b || b.size)
        break;
    }
  let p = t.state.doc, d = t.someProp("domParser") || Et.fromSchema(t.state.schema), h = p.resolve(s), A = null, m = d.parse(i, {
    topNode: h.parent,
    topMatch: h.parent.contentMatchAt(h.index()),
    topOpen: !0,
    from: u,
    to: o,
    preserveWhitespace: h.parent.type.whitespace == "pre" ? "full" : !0,
    findPositions: a,
    ruleFromNode: Af(r),
    context: h
  });
  if (a && a[0].pos != null) {
    let g = a[0].pos, x = a[1] && a[1].pos;
    x == null && (x = g), A = { anchor: g + s, head: x + s };
  }
  return { doc: m, sel: A, from: s, to: l };
}
const Af = (t) => (e) => {
  let n = e.pmViewDesc;
  if (n)
    return n.parseRule(t);
  if (e.nodeName == "BR" && e.parentNode) {
    if (q && /^(ul|ol)$/i.test(e.parentNode.nodeName)) {
      let r = document.createElement("div");
      return r.appendChild(document.createElement("li")), { skip: r };
    } else if (e.parentNode.lastChild == e || q && /^(tr|table)$/i.test(e.parentNode.nodeName))
      return { ignore: !0 };
  } else if (e.nodeName == "IMG" && e.getAttribute("mark-placeholder"))
    return { ignore: !0 };
  return null;
}, mf = /^(a|abbr|acronym|b|bd[io]|big|br|button|cite|code|data(list)?|del|dfn|em|i|img|ins|kbd|label|map|mark|meter|output|q|ruby|s|samp|small|span|strong|su[bp]|time|u|tt|var)$/i;
function gf(t, e, n, r, i) {
  let u = t.input.compositionPendingChanges || (t.composing ? t.input.compositionID : 0);
  if (t.input.compositionPendingChanges = 0, e < 0) {
    let D = t.input.lastSelectionTime > Date.now() - 50 ? t.input.lastSelectionOrigin : null, I = ai(t, D);
    if (I && !t.state.selection.eq(I)) {
      if (V && Ne && t.input.lastKeyCode === 13 && Date.now() - 100 < t.input.lastKeyCodeTime && t.someProp("handleKeyDown", (de) => de(t, rt(13, "Enter"))))
        return;
      let S = t.state.tr.setSelection(I);
      D == "pointer" ? S.setMeta("pointer", !0) : D == "key" && S.scrollIntoView(), u && S.setMeta("composition", u), t.dispatch(S);
    }
    return;
  }
  let o = t.state.doc.resolve(e), s = o.sharedDepth(n);
  e = o.before(s + 1), n = t.state.doc.resolve(n).after(s + 1);
  let l = t.state.selection, c = pf(t, e, n, i), a = t.state.doc, f = a.slice(c.from, c.to), p, d;
  t.input.lastKeyCode === 8 && Date.now() - 100 < t.input.lastKeyCodeTime ? (p = t.state.selection.to, d = "end") : (p = t.state.selection.from, d = "start"), t.input.lastKeyCode = null;
  let h = xf(f.content, c.doc.content, c.from, p, d);
  if (h && t.input.domChangeCount++, (wt && t.input.lastIOSEnter > Date.now() - 225 || Ne) && i.some((D) => D.nodeType == 1 && !mf.test(D.nodeName)) && (!h || h.endA >= h.endB) && t.someProp("handleKeyDown", (D) => D(t, rt(13, "Enter")))) {
    t.input.lastIOSEnter = 0;
    return;
  }
  if (!h)
    if (r && l instanceof N && !l.empty && l.$head.sameParent(l.$anchor) && !t.composing && !(c.sel && c.sel.anchor != c.sel.head))
      h = { start: l.from, endA: l.to, endB: l.to };
    else {
      if (c.sel) {
        let D = bu(t, t.state.doc, c.sel);
        if (D && !D.eq(t.state.selection)) {
          let I = t.state.tr.setSelection(D);
          u && I.setMeta("composition", u), t.dispatch(I);
        }
      }
      return;
    }
  t.state.selection.from < t.state.selection.to && h.start == h.endB && t.state.selection instanceof N && (h.start > t.state.selection.from && h.start <= t.state.selection.from + 2 && t.state.selection.from >= c.from ? h.start = t.state.selection.from : h.endA < t.state.selection.to && h.endA >= t.state.selection.to - 2 && t.state.selection.to <= c.to && (h.endB += t.state.selection.to - h.endA, h.endA = t.state.selection.to)), ne && Ze <= 11 && h.endB == h.start + 1 && h.endA == h.start && h.start > c.from && c.doc.textBetween(h.start - c.from - 1, h.start - c.from + 1) == "  " && (h.start--, h.endA--, h.endB--);
  let A = c.doc.resolveNoCache(h.start - c.from), m = c.doc.resolveNoCache(h.endB - c.from), g = a.resolve(h.start), x = A.sameParent(m) && A.parent.inlineContent && g.end() >= h.endA;
  if ((wt && t.input.lastIOSEnter > Date.now() - 225 && (!x || i.some((D) => D.nodeName == "DIV" || D.nodeName == "P")) || !x && A.pos < c.doc.content.size && (!A.sameParent(m) || !A.parent.inlineContent) && A.pos < m.pos && !/\S/.test(c.doc.textBetween(A.pos, m.pos, "", ""))) && t.someProp("handleKeyDown", (D) => D(t, rt(13, "Enter")))) {
    t.input.lastIOSEnter = 0;
    return;
  }
  if (t.state.selection.anchor > h.start && kf(a, h.start, h.endA, A, m) && t.someProp("handleKeyDown", (D) => D(t, rt(8, "Backspace")))) {
    Ne && V && t.domObserver.suppressSelectionUpdates();
    return;
  }
  V && h.endB == h.start && (t.input.lastChromeDelete = Date.now()), Ne && !x && A.start() != m.start() && m.parentOffset == 0 && A.depth == m.depth && c.sel && c.sel.anchor == c.sel.head && c.sel.head == h.endA && (h.endB -= 2, m = c.doc.resolveNoCache(h.endB - c.from), setTimeout(() => {
    t.someProp("handleKeyDown", function(D) {
      return D(t, rt(13, "Enter"));
    });
  }, 20));
  let b = h.start, k = h.endA, C = (D) => {
    let I = D || t.state.tr.replace(b, k, c.doc.slice(h.start - c.from, h.endB - c.from));
    if (c.sel) {
      let S = bu(t, I.doc, c.sel);
      S && !(V && t.composing && S.empty && (h.start != h.endB || t.input.lastChromeDelete < Date.now() - 100) && (S.head == b || S.head == I.mapping.map(k) - 1) || ne && S.empty && S.head == b) && I.setSelection(S);
    }
    return u && I.setMeta("composition", u), I.scrollIntoView();
  }, E;
  if (x)
    if (A.pos == m.pos) {
      ne && Ze <= 11 && A.parentOffset == 0 && (t.domObserver.suppressSelectionUpdates(), setTimeout(() => Re(t), 20));
      let D = C(t.state.tr.delete(b, k)), I = a.resolve(h.start).marksAcross(a.resolve(h.endA));
      I && D.ensureMarks(I), t.dispatch(D);
    } else if (
      // Adding or removing a mark
      h.endA == h.endB && (E = bf(A.parent.content.cut(A.parentOffset, m.parentOffset), g.parent.content.cut(g.parentOffset, h.endA - g.start())))
    ) {
      let D = C(t.state.tr);
      E.type == "add" ? D.addMark(b, k, E.mark) : D.removeMark(b, k, E.mark), t.dispatch(D);
    } else if (A.parent.child(A.index()).isText && A.index() == m.index() - (m.textOffset ? 0 : 1)) {
      let D = A.parent.textBetween(A.parentOffset, m.parentOffset), I = () => C(t.state.tr.insertText(D, b, k));
      t.someProp("handleTextInput", (S) => S(t, b, k, D, I)) || t.dispatch(I());
    } else
      t.dispatch(C());
  else
    t.dispatch(C());
}
function bu(t, e, n) {
  return Math.max(n.anchor, n.head) > e.content.size ? null : fi(t, e.resolve(n.anchor), e.resolve(n.head));
}
function bf(t, e) {
  let n = t.firstChild.marks, r = e.firstChild.marks, i = n, u = r, o, s, l;
  for (let a = 0; a < r.length; a++)
    i = r[a].removeFromSet(i);
  for (let a = 0; a < n.length; a++)
    u = n[a].removeFromSet(u);
  if (i.length == 1 && u.length == 0)
    s = i[0], o = "add", l = (a) => a.mark(s.addToSet(a.marks));
  else if (i.length == 0 && u.length == 1)
    s = u[0], o = "remove", l = (a) => a.mark(s.removeFromSet(a.marks));
  else
    return null;
  let c = [];
  for (let a = 0; a < e.childCount; a++)
    c.push(l(e.child(a)));
  if (y.from(c).eq(t))
    return { mark: s, type: o };
}
function kf(t, e, n, r, i) {
  if (
    // The content must have shrunk
    n - e <= i.pos - r.pos || // newEnd must point directly at or after the end of the block that newStart points into
    gr(r, !0, !1) < i.pos
  )
    return !1;
  let u = t.resolve(e);
  if (!r.parent.isTextblock) {
    let s = u.nodeAfter;
    return s != null && n == e + s.nodeSize;
  }
  if (u.parentOffset < u.parent.content.size || !u.parent.isTextblock)
    return !1;
  let o = t.resolve(gr(u, !0, !0));
  return !o.parent.isTextblock || o.pos > n || gr(o, !0, !1) < n ? !1 : r.parent.content.cut(r.parentOffset).eq(o.parent.content);
}
function gr(t, e, n) {
  let r = t.depth, i = e ? t.end() : t.pos;
  for (; r > 0 && (e || t.indexAfter(r) == t.node(r).childCount); )
    r--, i++, e = !1;
  if (n) {
    let u = t.node(r).maybeChild(t.indexAfter(r));
    for (; u && !u.isLeaf; )
      u = u.firstChild, i++;
  }
  return i;
}
function xf(t, e, n, r, i) {
  let u = t.findDiffStart(e, n), o = n + t.size, s = n + e.size;
  if (u == null)
    return null;
  let { a: l, b: c } = t.findDiffEnd(e, o, s);
  if (i == "end") {
    let a = Math.max(0, u - Math.min(l, c));
    r -= l + a - u;
  }
  if (l < u && o < s) {
    let a = r <= u && r >= l ? u - r : 0;
    u -= a, c = u + (c - l), l = u;
  } else if (c < u) {
    let a = r <= u && r >= c ? u - r : 0;
    u -= a, l = u + (l - c), c = u;
  }
  return { start: u, endA: l, endB: c };
}
class Rs {
  /**
  Create a view. `place` may be a DOM node that the editor should
  be appended to, a function that will place it into the document,
  or an object whose `mount` property holds the node to use as the
  document container. If it is `null`, the editor will not be
  added to the document.
  */
  constructor(e, n) {
    this._root = null, this.focused = !1, this.trackWrites = null, this.mounted = !1, this.markCursor = null, this.cursorWrapper = null, this.lastSelectedViewDesc = void 0, this.input = new Ta(), this.prevDirectPlugins = [], this.pluginViews = [], this.requiresGeckoHackNode = !1, this.dragging = null, this._props = n, this.state = n.state, this.directPlugins = n.plugins || [], this.directPlugins.forEach(Du), this.dispatch = this.dispatch.bind(this), this.dom = e && e.mount || document.createElement("div"), e && (e.appendChild ? e.appendChild(this.dom) : typeof e == "function" ? e(this.dom) : e.mount && (this.mounted = !0)), this.editable = Cu(this), xu(this), this.nodeViews = yu(this), this.docView = tu(this.state.doc, ku(this), mr(this), this.dom, this), this.domObserver = new cf(this, (r, i, u, o) => gf(this, r, i, u, o)), this.domObserver.start(), va(this), this.updatePluginViews();
  }
  /**
  Holds `true` when a
  [composition](https://w3c.github.io/uievents/#events-compositionevents)
  is active.
  */
  get composing() {
    return this.input.composing;
  }
  /**
  The view's current [props](https://prosemirror.net/docs/ref/#view.EditorProps).
  */
  get props() {
    if (this._props.state != this.state) {
      let e = this._props;
      this._props = {};
      for (let n in e)
        this._props[n] = e[n];
      this._props.state = this.state;
    }
    return this._props;
  }
  /**
  Update the view's props. Will immediately cause an update to
  the DOM.
  */
  update(e) {
    e.handleDOMEvents != this._props.handleDOMEvents && jr(this);
    let n = this._props;
    this._props = e, e.plugins && (e.plugins.forEach(Du), this.directPlugins = e.plugins), this.updateStateInner(e.state, n);
  }
  /**
  Update the view by updating existing props object with the object
  given as argument. Equivalent to `view.update(Object.assign({},
  view.props, props))`.
  */
  setProps(e) {
    let n = {};
    for (let r in this._props)
      n[r] = this._props[r];
    n.state = this.state;
    for (let r in e)
      n[r] = e[r];
    this.update(n);
  }
  /**
  Update the editor's `state` prop, without touching any of the
  other props.
  */
  updateState(e) {
    this.updateStateInner(e, this._props);
  }
  updateStateInner(e, n) {
    var r;
    let i = this.state, u = !1, o = !1;
    e.storedMarks && this.composing && (ws(this), o = !0), this.state = e;
    let s = i.plugins != e.plugins || this._props.plugins != n.plugins;
    if (s || this._props.plugins != n.plugins || this._props.nodeViews != n.nodeViews) {
      let d = yu(this);
      yf(d, this.nodeViews) && (this.nodeViews = d, u = !0);
    }
    (s || n.handleDOMEvents != this._props.handleDOMEvents) && jr(this), this.editable = Cu(this), xu(this);
    let l = mr(this), c = ku(this), a = i.plugins != e.plugins && !i.doc.eq(e.doc) ? "reset" : e.scrollToSelection > i.scrollToSelection ? "to selection" : "preserve", f = u || !this.docView.matchesNode(e.doc, c, l);
    (f || !e.selection.eq(i.selection)) && (o = !0);
    let p = a == "preserve" && o && this.dom.style.overflowAnchor == null && $c(this);
    if (o) {
      this.domObserver.stop();
      let d = f && (ne || V) && !this.composing && !i.selection.empty && !e.selection.empty && Cf(i.selection, e.selection);
      if (f) {
        let A = V ? this.trackWrites = this.domSelectionRange().focusNode : null;
        this.composing && (this.input.compositionNode = qa(this)), (u || !this.docView.update(e.doc, c, l, this)) && (this.docView.updateOuterDeco(c), this.docView.destroy(), this.docView = tu(e.doc, c, l, this.dom, this)), A && (!this.trackWrites || !this.dom.contains(this.trackWrites)) && (d = !0);
      }
      let h = this.input.mouseDown;
      d || !(h && this.domObserver.currentSelection.eq(this.domSelectionRange()) && xa(this) && h.delaySelUpdate()) ? Re(this, d) : (ds(this, e.selection), this.domObserver.setCurSelection()), this.domObserver.start();
    }
    this.updatePluginViews(i), !((r = this.dragging) === null || r === void 0) && r.node && !i.doc.eq(e.doc) && this.updateDraggedNode(this.dragging, i), a == "reset" ? this.dom.scrollTop = 0 : a == "to selection" ? this.scrollToSelection() : p && qc(p);
  }
  /**
  @internal
  */
  scrollToSelection() {
    let e = this.domSelectionRange().focusNode;
    if (!(!e || !this.dom.contains(e.nodeType == 1 ? e : e.parentNode))) {
      if (!this.someProp("handleScrollToSelection", (n) => n(this))) if (this.state.selection instanceof w) {
        let n = this.docView.domAfterPos(this.state.selection.from);
        n.nodeType == 1 && $i(this, n.getBoundingClientRect(), e);
      } else
        $i(this, this.coordsAtPos(this.state.selection.head, 1), e);
    }
  }
  destroyPluginViews() {
    let e;
    for (; e = this.pluginViews.pop(); )
      e.destroy && e.destroy();
  }
  updatePluginViews(e) {
    if (!e || e.plugins != this.state.plugins || this.directPlugins != this.prevDirectPlugins) {
      this.prevDirectPlugins = this.directPlugins, this.destroyPluginViews();
      for (let n = 0; n < this.directPlugins.length; n++) {
        let r = this.directPlugins[n];
        r.spec.view && this.pluginViews.push(r.spec.view(this));
      }
      for (let n = 0; n < this.state.plugins.length; n++) {
        let r = this.state.plugins[n];
        r.spec.view && this.pluginViews.push(r.spec.view(this));
      }
    } else
      for (let n = 0; n < this.pluginViews.length; n++) {
        let r = this.pluginViews[n];
        r.update && r.update(this, e);
      }
  }
  updateDraggedNode(e, n) {
    let r = e.node, i = -1;
    if (r.from < this.state.doc.content.size && this.state.doc.nodeAt(r.from) == r.node)
      i = r.from;
    else {
      let u = r.from + (this.state.doc.content.size - n.doc.content.size);
      (u > 0 && u < this.state.doc.content.size && this.state.doc.nodeAt(u)) == r.node && (i = u);
    }
    this.dragging = new Bs(e.slice, e.move, i < 0 ? void 0 : w.create(this.state.doc, i));
  }
  someProp(e, n) {
    let r = this._props && this._props[e], i;
    if (r != null && (i = n ? n(r) : r))
      return i;
    for (let o = 0; o < this.directPlugins.length; o++) {
      let s = this.directPlugins[o].props[e];
      if (s != null && (i = n ? n(s) : s))
        return i;
    }
    let u = this.state.plugins;
    if (u)
      for (let o = 0; o < u.length; o++) {
        let s = u[o].props[e];
        if (s != null && (i = n ? n(s) : s))
          return i;
      }
  }
  /**
  Query whether the view has focus.
  */
  hasFocus() {
    if (ne) {
      let e = this.root.activeElement;
      if (e == this.dom)
        return !0;
      if (!e || !this.dom.contains(e))
        return !1;
      for (; e && this.dom != e && this.dom.contains(e); ) {
        if (e.contentEditable == "false")
          return !1;
        e = e.parentElement;
      }
      return !0;
    }
    return this.root.activeElement == this.dom;
  }
  /**
  Focus the editor.
  */
  focus() {
    this.domObserver.stop(), this.editable && jc(this.dom), Re(this), this.domObserver.start();
  }
  /**
  Get the document root in which the editor exists. This will
  usually be the top-level `document`, but might be a [shadow
  DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Shadow_DOM)
  root if the editor is inside one.
  */
  get root() {
    let e = this._root;
    if (e == null) {
      for (let n = this.dom.parentNode; n; n = n.parentNode)
        if (n.nodeType == 9 || n.nodeType == 11 && n.host)
          return n.getSelection || (Object.getPrototypeOf(n).getSelection = () => n.ownerDocument.getSelection()), this._root = n;
    }
    return e || document;
  }
  /**
  When an existing editor view is moved to a new document or
  shadow tree, call this to make it recompute its root.
  */
  updateRoot() {
    this._root = null;
  }
  /**
  Given a pair of viewport coordinates, return the document
  position that corresponds to them. May return null if the given
  coordinates aren't inside of the editor. When an object is
  returned, its `pos` property is the position nearest to the
  coordinates, and its `inside` property holds the position of the
  inner node that the position falls inside of, or -1 if it is at
  the top level, not in any node.
  */
  posAtCoords(e) {
    return ra(this, e);
  }
  /**
  Returns the viewport rectangle at a given document position.
  `left` and `right` will be the same number, as this returns a
  flat cursor-ish rectangle. If the position is between two things
  that aren't directly adjacent, `side` determines which element
  is used. When < 0, the element before the position is used,
  otherwise the element after.
  */
  coordsAtPos(e, n = 1) {
    return is(this, e, n);
  }
  /**
  Find the DOM position that corresponds to the given document
  position. When `side` is negative, find the position as close as
  possible to the content before the position. When positive,
  prefer positions close to the content after the position. When
  zero, prefer as shallow a position as possible.
  
  Note that you should **not** mutate the editor's internal DOM,
  only inspect it (and even that is usually not necessary).
  */
  domAtPos(e, n = 0) {
    return this.docView.domFromPos(e, n);
  }
  /**
  Find the DOM node that represents the document node after the
  given position. May return `null` when the position doesn't point
  in front of a node or if the node is inside an opaque node view.
  
  This is intended to be able to call things like
  `getBoundingClientRect` on that DOM node. Do **not** mutate the
  editor DOM directly, or add styling this way, since that will be
  immediately overriden by the editor as it redraws the node.
  */
  nodeDOM(e) {
    let n = this.docView.descAt(e);
    return n ? n.nodeDOM : null;
  }
  /**
  Find the document position that corresponds to a given DOM
  position. (Whenever possible, it is preferable to inspect the
  document structure directly, rather than poking around in the
  DOM, but sometimes—for example when interpreting an event
  target—you don't have a choice.)
  
  The `bias` parameter can be used to influence which side of a DOM
  node to use when the position is inside a leaf node.
  */
  posAtDOM(e, n, r = -1) {
    let i = this.docView.posFromDOM(e, n, r);
    if (i == null)
      throw new RangeError("DOM position not inside the editor");
    return i;
  }
  /**
  Find out whether the selection is at the end of a textblock when
  moving in a given direction. When, for example, given `"left"`,
  it will return true if moving left from the current cursor
  position would leave that position's parent textblock. Will apply
  to the view's current state by default, but it is possible to
  pass a different state.
  */
  endOfTextblock(e, n) {
    return la(this, n || this.state, e);
  }
  /**
  Run the editor's paste logic with the given HTML string. The
  `event`, if given, will be passed to the
  [`handlePaste`](https://prosemirror.net/docs/ref/#view.EditorProps.handlePaste) hook.
  */
  pasteHTML(e, n) {
    return jt(this, "", e, !1, n || new ClipboardEvent("paste"));
  }
  /**
  Run the editor's paste logic with the given plain-text input.
  */
  pasteText(e, n) {
    return jt(this, e, null, !0, n || new ClipboardEvent("paste"));
  }
  /**
  Serialize the given slice as it would be if it was copied from
  this editor. Returns a DOM element that contains a
  representation of the slice as its children, a textual
  representation, and the transformed slice (which can be
  different from the given input due to hooks like
  [`transformCopied`](https://prosemirror.net/docs/ref/#view.EditorProps.transformCopied)).
  */
  serializeForClipboard(e) {
    return hi(this, e);
  }
  /**
  Removes the editor from the DOM and destroys all [node
  views](https://prosemirror.net/docs/ref/#view.NodeView).
  */
  destroy() {
    this.docView && (za(this), this.destroyPluginViews(), this.mounted ? (this.docView.update(this.state.doc, [], mr(this), this), this.dom.textContent = "") : this.dom.parentNode && this.dom.parentNode.removeChild(this.dom), this.docView.destroy(), this.docView = null, Wc());
  }
  /**
  This is true when the view has been
  [destroyed](https://prosemirror.net/docs/ref/#view.EditorView.destroy) (and thus should not be
  used anymore).
  */
  get isDestroyed() {
    return this.docView == null;
  }
  /**
  Used for testing.
  */
  dispatchEvent(e) {
    return Ka(this, e);
  }
  /**
  @internal
  */
  domSelectionRange() {
    let e = this.domSelection();
    return e ? q && this.root.nodeType === 11 && Zc(this.dom.ownerDocument) == this.dom && ff(this, e) || e : { focusNode: null, focusOffset: 0, anchorNode: null, anchorOffset: 0 };
  }
  /**
  @internal
  */
  domSelection() {
    return this.root.getSelection();
  }
}
Rs.prototype.dispatch = function(t) {
  let e = this._props.dispatchTransaction;
  e ? e.call(this, t) : this.updateState(this.state.apply(t));
};
function ku(t) {
  let e = /* @__PURE__ */ Object.create(null);
  return e.class = "ProseMirror", e.contenteditable = String(t.editable), t.someProp("attributes", (n) => {
    if (typeof n == "function" && (n = n(t.state)), n)
      for (let r in n)
        r == "class" ? e.class += " " + n[r] : r == "style" ? e.style = (e.style ? e.style + ";" : "") + n[r] : !e[r] && r != "contenteditable" && r != "nodeName" && (e[r] = String(n[r]));
  }), e.translate || (e.translate = "no"), [Ae.node(0, t.state.doc.content.size, e)];
}
function xu(t) {
  if (t.markCursor) {
    let e = document.createElement("img");
    e.className = "ProseMirror-separator", e.setAttribute("mark-placeholder", "true"), e.setAttribute("alt", ""), t.cursorWrapper = { dom: e, deco: Ae.widget(t.state.selection.from, e, { raw: !0, marks: t.markCursor }) };
  } else
    t.cursorWrapper = null;
}
function Cu(t) {
  return !t.someProp("editable", (e) => e(t.state) === !1);
}
function Cf(t, e) {
  let n = Math.min(t.$anchor.sharedDepth(t.head), e.$anchor.sharedDepth(e.head));
  return t.$anchor.start(n) != e.$anchor.start(n);
}
function yu(t) {
  let e = /* @__PURE__ */ Object.create(null);
  function n(r) {
    for (let i in r)
      Object.prototype.hasOwnProperty.call(e, i) || (e[i] = r[i]);
  }
  return t.someProp("nodeViews", n), t.someProp("markViews", n), e;
}
function yf(t, e) {
  let n = 0, r = 0;
  for (let i in t) {
    if (t[i] != e[i])
      return !0;
    n++;
  }
  for (let i in e)
    r++;
  return n != r;
}
function Du(t) {
  if (t.spec.state || t.spec.filterTransaction || t.spec.appendTransaction)
    throw new RangeError("Plugins passed directly to the view must not have a state component");
}
const Df = ["p", 0], Ef = ["blockquote", 0], Ff = ["hr"], _f = ["pre", ["code", 0]], wf = ["br"], If = {
  /**
  NodeSpec The top level document node.
  */
  doc: {
    content: "block+"
  },
  /**
  A plain paragraph textblock. Represented in the DOM
  as a `<p>` element.
  */
  paragraph: {
    content: "inline*",
    group: "block",
    parseDOM: [{ tag: "p" }],
    toDOM() {
      return Df;
    }
  },
  /**
  A blockquote (`<blockquote>`) wrapping one or more blocks.
  */
  blockquote: {
    content: "block+",
    group: "block",
    defining: !0,
    parseDOM: [{ tag: "blockquote" }],
    toDOM() {
      return Ef;
    }
  },
  /**
  A horizontal rule (`<hr>`).
  */
  horizontal_rule: {
    group: "block",
    parseDOM: [{ tag: "hr" }],
    toDOM() {
      return Ff;
    }
  },
  /**
  A heading textblock, with a `level` attribute that
  should hold the number 1 to 6. Parsed and serialized as `<h1>` to
  `<h6>` elements.
  */
  heading: {
    attrs: { level: { default: 1, validate: "number" } },
    content: "inline*",
    group: "block",
    defining: !0,
    parseDOM: [
      { tag: "h1", attrs: { level: 1 } },
      { tag: "h2", attrs: { level: 2 } },
      { tag: "h3", attrs: { level: 3 } },
      { tag: "h4", attrs: { level: 4 } },
      { tag: "h5", attrs: { level: 5 } },
      { tag: "h6", attrs: { level: 6 } }
    ],
    toDOM(t) {
      return ["h" + t.attrs.level, 0];
    }
  },
  /**
  A code listing. Disallows marks or non-text inline
  nodes by default. Represented as a `<pre>` element with a
  `<code>` element inside of it.
  */
  code_block: {
    content: "text*",
    marks: "",
    group: "block",
    code: !0,
    defining: !0,
    parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
    toDOM() {
      return _f;
    }
  },
  /**
  The text node.
  */
  text: {
    group: "inline"
  },
  /**
  An inline image (`<img>`) node. Supports `src`,
  `alt`, and `href` attributes. The latter two default to the empty
  string.
  */
  image: {
    inline: !0,
    attrs: {
      src: { validate: "string" },
      alt: { default: null, validate: "string|null" },
      title: { default: null, validate: "string|null" }
    },
    group: "inline",
    draggable: !0,
    parseDOM: [{ tag: "img[src]", getAttrs(t) {
      return {
        src: t.getAttribute("src"),
        title: t.getAttribute("title"),
        alt: t.getAttribute("alt")
      };
    } }],
    toDOM(t) {
      let { src: e, alt: n, title: r } = t.attrs;
      return ["img", { src: e, alt: n, title: r }];
    }
  },
  /**
  A hard line break, represented in the DOM as `<br>`.
  */
  hard_break: {
    inline: !0,
    group: "inline",
    selectable: !1,
    parseDOM: [{ tag: "br" }],
    toDOM() {
      return wf;
    }
  }
}, Bf = ["em", 0], Sf = ["strong", 0], Mf = ["code", 0], Nf = {
  /**
  A link. Has `href` and `title` attributes. `title`
  defaults to the empty string. Rendered and parsed as an `<a>`
  element.
  */
  link: {
    attrs: {
      href: { validate: "string" },
      title: { default: null, validate: "string|null" }
    },
    inclusive: !1,
    parseDOM: [{ tag: "a[href]", getAttrs(t) {
      return { href: t.getAttribute("href"), title: t.getAttribute("title") };
    } }],
    toDOM(t) {
      let { href: e, title: n } = t.attrs;
      return ["a", { href: e, title: n }, 0];
    }
  },
  /**
  An emphasis mark. Rendered as an `<em>` element. Has parse rules
  that also match `<i>` and `font-style: italic`.
  */
  em: {
    parseDOM: [
      { tag: "i" },
      { tag: "em" },
      { style: "font-style=italic" },
      { style: "font-style=normal", clearMark: (t) => t.type.name == "em" }
    ],
    toDOM() {
      return Bf;
    }
  },
  /**
  A strong mark. Rendered as `<strong>`, parse rules also match
  `<b>` and `font-weight: bold`.
  */
  strong: {
    parseDOM: [
      { tag: "strong" },
      // This works around a Google Docs misbehavior where
      // pasted content will be inexplicably wrapped in `<b>`
      // tags with a font-weight normal.
      { tag: "b", getAttrs: (t) => t.style.fontWeight != "normal" && null },
      { style: "font-weight=400", clearMark: (t) => t.type.name == "strong" },
      { style: "font-weight", getAttrs: (t) => /^(bold(er)?|[5-9]\d{2,})$/.test(t) && null }
    ],
    toDOM() {
      return Sf;
    }
  },
  /**
  Code font mark. Represented as a `<code>` element.
  */
  code: {
    code: !0,
    parseDOM: [{ tag: "code" }],
    toDOM() {
      return Mf;
    }
  }
}, Eu = new ri({ nodes: If, marks: Nf }), Of = ["ol", 0], Rf = ["ul", 0], Tf = ["li", 0], vf = {
  attrs: { order: { default: 1, validate: "number" } },
  parseDOM: [{ tag: "ol", getAttrs(t) {
    return { order: t.hasAttribute("start") ? +t.getAttribute("start") : 1 };
  } }],
  toDOM(t) {
    return t.attrs.order == 1 ? Of : ["ol", { start: t.attrs.order }, 0];
  }
}, zf = {
  parseDOM: [{ tag: "ul" }],
  toDOM() {
    return Rf;
  }
}, Qf = {
  parseDOM: [{ tag: "li" }],
  toDOM() {
    return Tf;
  },
  defining: !0
};
function br(t, e) {
  let n = {};
  for (let r in t)
    n[r] = t[r];
  for (let r in e)
    n[r] = e[r];
  return n;
}
function Kf(t, e, n) {
  return t.append({
    ordered_list: br(vf, { content: "list_item+", group: n }),
    bullet_list: br(zf, { content: "list_item+", group: n }),
    list_item: br(Qf, { content: e })
  });
}
function Fu(t, e = null) {
  return function(n, r) {
    let { $from: i, $to: u } = n.selection, o = i.blockRange(u);
    if (!o)
      return !1;
    let s = r ? n.tr : null;
    return Wf(s, o, t, e) ? (r && r(s.scrollIntoView()), !0) : !1;
  };
}
function Wf(t, e, n, r = null) {
  let i = !1, u = e, o = e.$from.doc;
  if (e.depth >= 2 && e.$from.node(e.depth - 1).type.compatibleContent(n) && e.startIndex == 0) {
    if (e.$from.index(e.depth - 1) == 0)
      return !1;
    let l = o.resolve(e.start - 2);
    u = new Rn(l, l, e.depth), e.endIndex < e.parent.childCount && (e = new Rn(e.$from, o.resolve(e.$to.end(e.depth)), e.depth)), i = !0;
  }
  let s = Wo(u, n, r, e);
  return s ? (t && Pf(t, e, s, i, n), !0) : !1;
}
function Pf(t, e, n, r, i) {
  let u = y.empty;
  for (let a = n.length - 1; a >= 0; a--)
    u = y.from(n[a].type.create(n[a].attrs, u));
  t.step(new U(e.start - (r ? 2 : 0), e.end, e.start, e.end, new F(u, 0, 0), n.length, !0));
  let o = 0;
  for (let a = 0; a < n.length; a++)
    n[a].type == i && (o = a + 1);
  let s = n.length - o, l = e.start + n.length - (r ? 2 : 0), c = e.parent;
  for (let a = e.startIndex, f = e.endIndex, p = !0; a < f; a++, p = !1)
    !p && Ct(t.doc, l, s) && (t.split(l, s), l += 2 * s), l += c.child(a).nodeSize;
  return t;
}
function Jf(t, e) {
  return function(n, r) {
    let { $from: i, $to: u, node: o } = n.selection;
    if (o && o.isBlock || i.depth < 2 || !i.sameParent(u))
      return !1;
    let s = i.node(-1);
    if (s.type != t)
      return !1;
    if (i.parent.content.size == 0 && i.node(-1).childCount == i.indexAfter(-1)) {
      if (i.depth == 3 || i.node(-3).type != t || i.index(-2) != i.node(-2).childCount - 1)
        return !1;
      if (r) {
        let f = y.empty, p = i.index(-1) ? 1 : i.index(-2) ? 2 : 3;
        for (let g = i.depth - p; g >= i.depth - 3; g--)
          f = y.from(i.node(g).copy(f));
        let d = i.indexAfter(-1) < i.node(-2).childCount ? 1 : i.indexAfter(-2) < i.node(-3).childCount ? 2 : 3;
        f = f.append(y.from(t.createAndFill()));
        let h = i.before(i.depth - (p - 1)), A = n.tr.replace(h, i.after(-d), new F(f, 4 - p, 0)), m = -1;
        A.doc.nodesBetween(h, A.doc.content.size, (g, x) => {
          if (m > -1)
            return !1;
          g.isTextblock && g.content.size == 0 && (m = x + 1);
        }), m > -1 && A.setSelection(M.near(A.doc.resolve(m))), r(A.scrollIntoView());
      }
      return !0;
    }
    let l = u.pos == i.end() ? s.contentMatchAt(0).defaultType : null, c = n.tr.delete(i.pos, u.pos), a = l ? [null, { type: l }] : void 0;
    return Ct(c.doc, i.pos, 2, a) ? (r && r(c.split(i.pos, 2, a).scrollIntoView()), !0) : !1;
  };
}
function Gf(t) {
  return function(e, n) {
    let { $from: r, $to: i } = e.selection, u = r.blockRange(i, (o) => o.childCount > 0 && o.firstChild.type == t);
    return u ? n ? r.node(u.depth - 1).type == t ? Lf(e, n, t, u) : Zf(e, n, u) : !0 : !1;
  };
}
function Lf(t, e, n, r) {
  let i = t.tr, u = r.end, o = r.$to.end(r.depth);
  u < o && (i.step(new U(u - 1, o, u, o, new F(y.from(n.create(null, r.parent.copy())), 1, 0), 1, !0)), r = new Rn(i.doc.resolve(r.$from.pos), i.doc.resolve(o), r.depth));
  const s = Vn(r);
  if (s == null)
    return !1;
  i.lift(r, s);
  let l = i.doc.resolve(i.mapping.map(u, -1) - 1);
  return oi(i.doc, l.pos) && l.nodeBefore.type == l.nodeAfter.type && i.join(l.pos), e(i.scrollIntoView()), !0;
}
function Zf(t, e, n) {
  let r = t.tr, i = n.parent;
  for (let d = n.end, h = n.endIndex - 1, A = n.startIndex; h > A; h--)
    d -= i.child(h).nodeSize, r.delete(d - 1, d + 1);
  let u = r.doc.resolve(n.start), o = u.nodeAfter;
  if (r.mapping.map(n.end) != n.start + u.nodeAfter.nodeSize)
    return !1;
  let s = n.startIndex == 0, l = n.endIndex == i.childCount, c = u.node(-1), a = u.index(-1);
  if (!c.canReplace(a + (s ? 0 : 1), a + 1, o.content.append(l ? y.empty : y.from(i))))
    return !1;
  let f = u.pos, p = f + o.nodeSize;
  return r.step(new U(f - (s ? 1 : 0), p + (l ? 1 : 0), f + 1, p - 1, new F((s ? y.empty : y.from(i.copy(y.empty))).append(l ? y.empty : y.from(i.copy(y.empty))), s ? 0 : 1, l ? 0 : 1), s ? 0 : 1)), e(r.scrollIntoView()), !0;
}
function Yf(t) {
  return function(e, n) {
    let { $from: r, $to: i } = e.selection, u = r.blockRange(i, (c) => c.childCount > 0 && c.firstChild.type == t);
    if (!u)
      return !1;
    let o = u.startIndex;
    if (o == 0)
      return !1;
    let s = u.parent, l = s.child(o - 1);
    if (l.type != t)
      return !1;
    if (n) {
      let c = l.lastChild && l.lastChild.type == s.type, a = y.from(c ? t.create() : null), f = new F(y.from(t.create(null, y.from(s.type.create(null, a)))), c ? 3 : 1, 0), p = u.start, d = u.end;
      n(e.tr.step(new U(p - (c ? 3 : 1), d, p, d, f, 1, !0)).scrollIntoView());
    }
    return !0;
  };
}
const Ts = (t, e) => t.selection.empty ? !1 : (e && e(t.tr.deleteSelection().scrollIntoView()), !0);
function Hf(t, e) {
  let { $cursor: n } = t.selection;
  return !n || (e ? !e.endOfTextblock("backward", t) : n.parentOffset > 0) ? null : n;
}
const Vf = (t, e, n) => {
  let r = Hf(t, n);
  if (!r)
    return !1;
  let i = vs(r);
  if (!i) {
    let o = r.blockRange(), s = o && Vn(o);
    return s == null ? !1 : (e && e(t.tr.lift(o, s).scrollIntoView()), !0);
  }
  let u = i.nodeBefore;
  if (Qs(t, i, e, -1))
    return !0;
  if (r.parent.content.size == 0 && (It(u, "end") || w.isSelectable(u)))
    for (let o = r.depth; ; o--) {
      let s = si(t.doc, r.before(o), r.after(o), F.empty);
      if (s && s.slice.size < s.to - s.from) {
        if (e) {
          let l = t.tr.step(s);
          l.setSelection(It(u, "end") ? M.findFrom(l.doc.resolve(l.mapping.map(i.pos, -1)), -1) : w.create(l.doc, i.pos - u.nodeSize)), e(l.scrollIntoView());
        }
        return !0;
      }
      if (o == 1 || r.node(o - 1).childCount > 1)
        break;
    }
  return u.isAtom && i.depth == r.depth - 1 ? (e && e(t.tr.delete(i.pos - u.nodeSize, i.pos).scrollIntoView()), !0) : !1;
};
function It(t, e, n = !1) {
  for (let r = t; r; r = e == "start" ? r.firstChild : r.lastChild) {
    if (r.isTextblock)
      return !0;
    if (n && r.childCount != 1)
      return !1;
  }
  return !1;
}
const Uf = (t, e, n) => {
  let { $head: r, empty: i } = t.selection, u = r;
  if (!i)
    return !1;
  if (r.parent.isTextblock) {
    if (n ? !n.endOfTextblock("backward", t) : r.parentOffset > 0)
      return !1;
    u = vs(r);
  }
  let o = u && u.nodeBefore;
  return !o || !w.isSelectable(o) ? !1 : (e && e(t.tr.setSelection(w.create(t.doc, u.pos - o.nodeSize)).scrollIntoView()), !0);
};
function vs(t) {
  if (!t.parent.type.spec.isolating)
    for (let e = t.depth - 1; e >= 0; e--) {
      if (t.index(e) > 0)
        return t.doc.resolve(t.before(e + 1));
      if (t.node(e).type.spec.isolating)
        break;
    }
  return null;
}
function $f(t, e) {
  let { $cursor: n } = t.selection;
  return !n || (e ? !e.endOfTextblock("forward", t) : n.parentOffset < n.parent.content.size) ? null : n;
}
const qf = (t, e, n) => {
  let r = $f(t, n);
  if (!r)
    return !1;
  let i = zs(r);
  if (!i)
    return !1;
  let u = i.nodeAfter;
  if (Qs(t, i, e, 1))
    return !0;
  if (r.parent.content.size == 0 && (It(u, "start") || w.isSelectable(u))) {
    let o = si(t.doc, r.before(), r.after(), F.empty);
    if (o && o.slice.size < o.to - o.from) {
      if (e) {
        let s = t.tr.step(o);
        s.setSelection(It(u, "start") ? M.findFrom(s.doc.resolve(s.mapping.map(i.pos)), 1) : w.create(s.doc, s.mapping.map(i.pos))), e(s.scrollIntoView());
      }
      return !0;
    }
  }
  return u.isAtom && i.depth == r.depth - 1 ? (e && e(t.tr.delete(i.pos, i.pos + u.nodeSize).scrollIntoView()), !0) : !1;
}, jf = (t, e, n) => {
  let { $head: r, empty: i } = t.selection, u = r;
  if (!i)
    return !1;
  if (r.parent.isTextblock) {
    if (n ? !n.endOfTextblock("forward", t) : r.parentOffset < r.parent.content.size)
      return !1;
    u = zs(r);
  }
  let o = u && u.nodeAfter;
  return !o || !w.isSelectable(o) ? !1 : (e && e(t.tr.setSelection(w.create(t.doc, u.pos)).scrollIntoView()), !0);
};
function zs(t) {
  if (!t.parent.type.spec.isolating)
    for (let e = t.depth - 1; e >= 0; e--) {
      let n = t.node(e);
      if (t.index(e) + 1 < n.childCount)
        return t.doc.resolve(t.after(e + 1));
      if (n.type.spec.isolating)
        break;
    }
  return null;
}
const Xf = (t, e) => {
  let { $head: n, $anchor: r } = t.selection;
  return !n.parent.type.spec.code || !n.sameParent(r) ? !1 : (e && e(t.tr.insertText(`
`).scrollIntoView()), !0);
};
function bi(t) {
  for (let e = 0; e < t.edgeCount; e++) {
    let { type: n } = t.edge(e);
    if (n.isTextblock && !n.hasRequiredAttrs())
      return n;
  }
  return null;
}
const Xr = (t, e) => {
  let { $head: n, $anchor: r } = t.selection;
  if (!n.parent.type.spec.code || !n.sameParent(r))
    return !1;
  let i = n.node(-1), u = n.indexAfter(-1), o = bi(i.contentMatchAt(u));
  if (!o || !i.canReplaceWith(u, u, o))
    return !1;
  if (e) {
    let s = n.after(), l = t.tr.replaceWith(s, s, o.createAndFill());
    l.setSelection(M.near(l.doc.resolve(s), 1)), e(l.scrollIntoView());
  }
  return !0;
}, e0 = (t, e) => {
  let n = t.selection, { $from: r, $to: i } = n;
  if (n instanceof oe || r.parent.inlineContent || i.parent.inlineContent)
    return !1;
  let u = bi(i.parent.contentMatchAt(i.indexAfter()));
  if (!u || !u.isTextblock)
    return !1;
  if (e) {
    let o = (!r.parentOffset && i.index() < i.parent.childCount ? r : i).pos, s = t.tr.insert(o, u.createAndFill());
    s.setSelection(N.create(s.doc, o + 1)), e(s.scrollIntoView());
  }
  return !0;
}, t0 = (t, e) => {
  let { $cursor: n } = t.selection;
  if (!n || n.parent.content.size)
    return !1;
  if (n.depth > 1 && n.after() != n.end(-1)) {
    let u = n.before();
    if (Ct(t.doc, u))
      return e && e(t.tr.split(u).scrollIntoView()), !0;
  }
  let r = n.blockRange(), i = r && Vn(r);
  return i == null ? !1 : (e && e(t.tr.lift(r, i).scrollIntoView()), !0);
};
function n0(t) {
  return (e, n) => {
    if (e.selection instanceof w && e.selection.node.isBlock) {
      let { $from: d } = e.selection;
      return !d.parentOffset || !Ct(e.doc, d.pos) ? !1 : (n && n(e.tr.split(d.pos).scrollIntoView()), !0);
    }
    if (!e.selection.$from.depth)
      return !1;
    let r = e.tr;
    !e.selection.empty && (e.selection instanceof N || e.selection instanceof oe) && r.deleteSelection();
    let { $from: i } = r.selection, u = r.steps.length, o = [], s, l, c = !1, a = !1;
    for (let d = i.depth; ; d--)
      if (i.node(d).isBlock) {
        c = i.end(d) == i.pos + (i.depth - d), a = i.start(d) == i.pos - (i.depth - d), l = bi(i.node(d - 1).contentMatchAt(i.indexAfter(d - 1))), o.unshift(c && l ? { type: l } : null), s = d;
        break;
      } else {
        if (d == 1)
          return !1;
        o.unshift(null);
      }
    let f = i.pos, p = Ct(r.doc, f, o.length, o);
    if (p || (o[0] = l ? { type: l } : null, p = Ct(r.doc, f, o.length, o)), !p)
      return !1;
    if (r.split(f, o.length, o), !c && a && i.node(s).type != l) {
      let d = r.mapping.slice(u), h = d.map(i.before(s)), A = r.doc.resolve(h);
      l && i.node(s - 1).canReplaceWith(A.index(), A.index() + 1, l) && r.setNodeMarkup(d.map(i.before(s)), l);
    }
    return n && n(r.scrollIntoView()), !0;
  };
}
const r0 = n0(), i0 = (t, e) => (e && e(t.tr.setSelection(new oe(t.doc))), !0);
function u0(t, e, n) {
  let r = e.nodeBefore, i = e.nodeAfter, u = e.index();
  return !r || !i || !r.type.compatibleContent(i.type) ? !1 : !r.content.size && e.parent.canReplace(u - 1, u) ? (n && n(t.tr.delete(e.pos - r.nodeSize, e.pos).scrollIntoView()), !0) : !e.parent.canReplace(u, u + 1) || !(i.isTextblock || oi(t.doc, e.pos)) ? !1 : (n && n(t.tr.join(e.pos).scrollIntoView()), !0);
}
function Qs(t, e, n, r) {
  let i = e.nodeBefore, u = e.nodeAfter, o, s, l = i.type.spec.isolating || u.type.spec.isolating;
  if (!l && u0(t, e, n))
    return !0;
  let c = !l && e.parent.canReplace(e.index(), e.index() + 1);
  if (c && (o = (s = i.contentMatchAt(i.childCount)).findWrapping(u.type)) && s.matchType(o[0] || u.type).validEnd) {
    if (n) {
      let d = e.pos + u.nodeSize, h = y.empty;
      for (let g = o.length - 1; g >= 0; g--)
        h = y.from(o[g].create(null, h));
      h = y.from(i.copy(h));
      let A = t.tr.step(new U(e.pos - 1, d, e.pos, d, new F(h, 1, 0), o.length, !0)), m = A.doc.resolve(d + 2 * o.length);
      m.nodeAfter && m.nodeAfter.type == i.type && oi(A.doc, m.pos) && A.join(m.pos), n(A.scrollIntoView());
    }
    return !0;
  }
  let a = u.type.spec.isolating || r > 0 && l ? null : M.findFrom(e, 1), f = a && a.$from.blockRange(a.$to), p = f && Vn(f);
  if (p != null && p >= e.depth)
    return n && n(t.tr.lift(f, p).scrollIntoView()), !0;
  if (c && It(u, "start", !0) && It(i, "end")) {
    let d = i, h = [];
    for (; h.push(d), !d.isTextblock; )
      d = d.lastChild;
    let A = u, m = 1;
    for (; !A.isTextblock; A = A.firstChild)
      m++;
    if (d.canReplace(d.childCount, d.childCount, A.content)) {
      if (n) {
        let g = y.empty;
        for (let b = h.length - 1; b >= 0; b--)
          g = y.from(h[b].copy(g));
        let x = t.tr.step(new U(e.pos - h.length, e.pos + u.nodeSize, e.pos + m, e.pos + u.nodeSize - m, new F(g, h.length, 0), 0, !0));
        n(x.scrollIntoView());
      }
      return !0;
    }
  }
  return !1;
}
function Ks(t) {
  return function(e, n) {
    let r = e.selection, i = t < 0 ? r.$from : r.$to, u = i.depth;
    for (; i.node(u).isInline; ) {
      if (!u)
        return !1;
      u--;
    }
    return i.node(u).isTextblock ? (n && n(e.tr.setSelection(N.create(e.doc, t < 0 ? i.start(u) : i.end(u)))), !0) : !1;
  };
}
const o0 = Ks(-1), s0 = Ks(1);
function l0(t, e = null) {
  return function(n, r) {
    let { $from: i, $to: u } = n.selection, o = i.blockRange(u), s = o && Wo(o, t, e);
    return s ? (r && r(n.tr.wrap(o, s).scrollIntoView()), !0) : !1;
  };
}
function c0(t, e, n, r) {
  for (let i = 0; i < e.length; i++) {
    let { $from: u, $to: o } = e[i], s = u.depth == 0 ? t.inlineContent && t.type.allowsMarkType(n) : !1;
    if (t.nodesBetween(u.pos, o.pos, (l, c) => {
      if (s)
        return !1;
      s = l.inlineContent && l.type.allowsMarkType(n);
    }), s)
      return !0;
  }
  return !1;
}
function Zt(t, e = null, n) {
  return function(r, i) {
    let { empty: u, $cursor: o, ranges: s } = r.selection;
    if (u && !o || !c0(r.doc, s, t))
      return !1;
    if (i)
      if (o)
        t.isInSet(r.storedMarks || o.marks()) ? i(r.tr.removeStoredMark(t)) : i(r.tr.addStoredMark(t.create(e)));
      else {
        let l, c = r.tr;
        l = !s.some((a) => r.doc.rangeHasMark(a.$from.pos, a.$to.pos, t));
        for (let a = 0; a < s.length; a++) {
          let { $from: f, $to: p } = s[a];
          if (!l)
            c.removeMark(f.pos, p.pos, t);
          else {
            let d = f.pos, h = p.pos, A = f.nodeAfter, m = p.nodeBefore, g = A && A.isText ? /^\s*/.exec(A.text)[0].length : 0, x = m && m.isText ? /\s*$/.exec(m.text)[0].length : 0;
            d + g < h && (d += g, h -= x), c.addMark(d, h, t.create(e));
          }
        }
        i(c.scrollIntoView());
      }
    return !0;
  };
}
function jn(...t) {
  return function(e, n, r) {
    for (let i = 0; i < t.length; i++)
      if (t[i](e, n, r))
        return !0;
    return !1;
  };
}
let kr = jn(Ts, Vf, Uf), _u = jn(Ts, qf, jf);
const Se = {
  Enter: jn(Xf, e0, t0, r0),
  "Mod-Enter": Xr,
  Backspace: kr,
  "Mod-Backspace": kr,
  "Shift-Backspace": kr,
  Delete: _u,
  "Mod-Delete": _u,
  "Mod-a": i0
}, Ws = {
  "Ctrl-h": Se.Backspace,
  "Alt-Backspace": Se["Mod-Backspace"],
  "Ctrl-d": Se.Delete,
  "Ctrl-Alt-Backspace": Se["Mod-Delete"],
  "Alt-Delete": Se["Mod-Delete"],
  "Alt-d": Se["Mod-Delete"],
  "Ctrl-a": o0,
  "Ctrl-e": s0
};
for (let t in Se)
  Ws[t] = Se[t];
const a0 = typeof navigator < "u" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : typeof os < "u" && os.platform ? os.platform() == "darwin" : !1, f0 = a0 ? Ws : Se;
var Pn = 200, G = function() {
};
G.prototype.append = function(e) {
  return e.length ? (e = G.from(e), !this.length && e || e.length < Pn && this.leafAppend(e) || this.length < Pn && e.leafPrepend(this) || this.appendInner(e)) : this;
};
G.prototype.prepend = function(e) {
  return e.length ? G.from(e).append(this) : this;
};
G.prototype.appendInner = function(e) {
  return new h0(this, e);
};
G.prototype.slice = function(e, n) {
  return e === void 0 && (e = 0), n === void 0 && (n = this.length), e >= n ? G.empty : this.sliceInner(Math.max(0, e), Math.min(this.length, n));
};
G.prototype.get = function(e) {
  if (!(e < 0 || e >= this.length))
    return this.getInner(e);
};
G.prototype.forEach = function(e, n, r) {
  n === void 0 && (n = 0), r === void 0 && (r = this.length), n <= r ? this.forEachInner(e, n, r, 0) : this.forEachInvertedInner(e, n, r, 0);
};
G.prototype.map = function(e, n, r) {
  n === void 0 && (n = 0), r === void 0 && (r = this.length);
  var i = [];
  return this.forEach(function(u, o) {
    return i.push(e(u, o));
  }, n, r), i;
};
G.from = function(e) {
  return e instanceof G ? e : e && e.length ? new Ps(e) : G.empty;
};
var Ps = /* @__PURE__ */ function(t) {
  function e(r) {
    t.call(this), this.values = r;
  }
  t && (e.__proto__ = t), e.prototype = Object.create(t && t.prototype), e.prototype.constructor = e;
  var n = { length: { configurable: !0 }, depth: { configurable: !0 } };
  return e.prototype.flatten = function() {
    return this.values;
  }, e.prototype.sliceInner = function(i, u) {
    return i == 0 && u == this.length ? this : new e(this.values.slice(i, u));
  }, e.prototype.getInner = function(i) {
    return this.values[i];
  }, e.prototype.forEachInner = function(i, u, o, s) {
    for (var l = u; l < o; l++)
      if (i(this.values[l], s + l) === !1)
        return !1;
  }, e.prototype.forEachInvertedInner = function(i, u, o, s) {
    for (var l = u - 1; l >= o; l--)
      if (i(this.values[l], s + l) === !1)
        return !1;
  }, e.prototype.leafAppend = function(i) {
    if (this.length + i.length <= Pn)
      return new e(this.values.concat(i.flatten()));
  }, e.prototype.leafPrepend = function(i) {
    if (this.length + i.length <= Pn)
      return new e(i.flatten().concat(this.values));
  }, n.length.get = function() {
    return this.values.length;
  }, n.depth.get = function() {
    return 0;
  }, Object.defineProperties(e.prototype, n), e;
}(G);
G.empty = new Ps([]);
var h0 = /* @__PURE__ */ function(t) {
  function e(n, r) {
    t.call(this), this.left = n, this.right = r, this.length = n.length + r.length, this.depth = Math.max(n.depth, r.depth) + 1;
  }
  return t && (e.__proto__ = t), e.prototype = Object.create(t && t.prototype), e.prototype.constructor = e, e.prototype.flatten = function() {
    return this.left.flatten().concat(this.right.flatten());
  }, e.prototype.getInner = function(r) {
    return r < this.left.length ? this.left.get(r) : this.right.get(r - this.left.length);
  }, e.prototype.forEachInner = function(r, i, u, o) {
    var s = this.left.length;
    if (i < s && this.left.forEachInner(r, i, Math.min(u, s), o) === !1 || u > s && this.right.forEachInner(r, Math.max(i - s, 0), Math.min(this.length, u) - s, o + s) === !1)
      return !1;
  }, e.prototype.forEachInvertedInner = function(r, i, u, o) {
    var s = this.left.length;
    if (i > s && this.right.forEachInvertedInner(r, i - s, Math.max(u, s) - s, o + s) === !1 || u < s && this.left.forEachInvertedInner(r, Math.min(i, s), u, o) === !1)
      return !1;
  }, e.prototype.sliceInner = function(r, i) {
    if (r == 0 && i == this.length)
      return this;
    var u = this.left.length;
    return i <= u ? this.left.slice(r, i) : r >= u ? this.right.slice(r - u, i - u) : this.left.slice(r, u).append(this.right.slice(0, i - u));
  }, e.prototype.leafAppend = function(r) {
    var i = this.right.leafAppend(r);
    if (i)
      return new e(this.left, i);
  }, e.prototype.leafPrepend = function(r) {
    var i = this.left.leafPrepend(r);
    if (i)
      return new e(i, this.right);
  }, e.prototype.appendInner = function(r) {
    return this.left.depth >= Math.max(this.right.depth, r.depth) + 1 ? new e(this.left, new e(this.right, r)) : new e(this, r);
  }, e;
}(G);
const d0 = 500;
class pe {
  constructor(e, n) {
    this.items = e, this.eventCount = n;
  }
  // Pop the latest event off the branch's history and apply it
  // to a document transform.
  popEvent(e, n) {
    if (this.eventCount == 0)
      return null;
    let r = this.items.length;
    for (; ; r--)
      if (this.items.get(r - 1).selection) {
        --r;
        break;
      }
    let i, u;
    n && (i = this.remapping(r, this.items.length), u = i.maps.length);
    let o = e.tr, s, l, c = [], a = [];
    return this.items.forEach((f, p) => {
      if (!f.step) {
        i || (i = this.remapping(r, p + 1), u = i.maps.length), u--, a.push(f);
        return;
      }
      if (i) {
        a.push(new be(f.map));
        let d = f.step.map(i.slice(u)), h;
        d && o.maybeStep(d).doc && (h = o.mapping.maps[o.mapping.maps.length - 1], c.push(new be(h, void 0, void 0, c.length + a.length))), u--, h && i.appendMap(h, u);
      } else
        o.maybeStep(f.step);
      if (f.selection)
        return s = i ? f.selection.map(i.slice(u)) : f.selection, l = new pe(this.items.slice(0, r).append(a.reverse().concat(c)), this.eventCount - 1), !1;
    }, this.items.length, 0), { remaining: l, transform: o, selection: s };
  }
  // Create a new branch with the given transform added.
  addTransform(e, n, r, i) {
    let u = [], o = this.eventCount, s = this.items, l = !i && s.length ? s.get(s.length - 1) : null;
    for (let a = 0; a < e.steps.length; a++) {
      let f = e.steps[a].invert(e.docs[a]), p = new be(e.mapping.maps[a], f, n), d;
      (d = l && l.merge(p)) && (p = d, a ? u.pop() : s = s.slice(0, s.length - 1)), u.push(p), n && (o++, n = void 0), i || (l = p);
    }
    let c = o - r.depth;
    return c > A0 && (s = p0(s, c), o -= c), new pe(s.append(u), o);
  }
  remapping(e, n) {
    let r = new Ut();
    return this.items.forEach((i, u) => {
      let o = i.mirrorOffset != null && u - i.mirrorOffset >= e ? r.maps.length - i.mirrorOffset : void 0;
      r.appendMap(i.map, o);
    }, e, n), r;
  }
  addMaps(e) {
    return this.eventCount == 0 ? this : new pe(this.items.append(e.map((n) => new be(n))), this.eventCount);
  }
  // When the collab module receives remote changes, the history has
  // to know about those, so that it can adjust the steps that were
  // rebased on top of the remote changes, and include the position
  // maps for the remote changes in its array of items.
  rebased(e, n) {
    if (!this.eventCount)
      return this;
    let r = [], i = Math.max(0, this.items.length - n), u = e.mapping, o = e.steps.length, s = this.eventCount;
    this.items.forEach((p) => {
      p.selection && s--;
    }, i);
    let l = n;
    this.items.forEach((p) => {
      let d = u.getMirror(--l);
      if (d == null)
        return;
      o = Math.min(o, d);
      let h = u.maps[d];
      if (p.step) {
        let A = e.steps[d].invert(e.docs[d]), m = p.selection && p.selection.map(u.slice(l + 1, d));
        m && s++, r.push(new be(h, A, m));
      } else
        r.push(new be(h));
    }, i);
    let c = [];
    for (let p = n; p < o; p++)
      c.push(new be(u.maps[p]));
    let a = this.items.slice(0, i).append(c).append(r), f = new pe(a, s);
    return f.emptyItemCount() > d0 && (f = f.compress(this.items.length - r.length)), f;
  }
  emptyItemCount() {
    let e = 0;
    return this.items.forEach((n) => {
      n.step || e++;
    }), e;
  }
  // Compressing a branch means rewriting it to push the air (map-only
  // items) out. During collaboration, these naturally accumulate
  // because each remote change adds one. The `upto` argument is used
  // to ensure that only the items below a given level are compressed,
  // because `rebased` relies on a clean, untouched set of items in
  // order to associate old items with rebased steps.
  compress(e = this.items.length) {
    let n = this.remapping(0, e), r = n.maps.length, i = [], u = 0;
    return this.items.forEach((o, s) => {
      if (s >= e)
        i.push(o), o.selection && u++;
      else if (o.step) {
        let l = o.step.map(n.slice(r)), c = l && l.getMap();
        if (r--, c && n.appendMap(c, r), l) {
          let a = o.selection && o.selection.map(n.slice(r));
          a && u++;
          let f = new be(c.invert(), l, a), p, d = i.length - 1;
          (p = i.length && i[d].merge(f)) ? i[d] = p : i.push(f);
        }
      } else o.map && r--;
    }, this.items.length, 0), new pe(G.from(i.reverse()), u);
  }
}
pe.empty = new pe(G.empty, 0);
function p0(t, e) {
  let n;
  return t.forEach((r, i) => {
    if (r.selection && e-- == 0)
      return n = i, !1;
  }), t.slice(n);
}
class be {
  constructor(e, n, r, i) {
    this.map = e, this.step = n, this.selection = r, this.mirrorOffset = i;
  }
  merge(e) {
    if (this.step && e.step && !e.selection) {
      let n = e.step.merge(this.step);
      if (n)
        return new be(n.getMap().invert(), n, this.selection);
    }
  }
}
class Qe {
  constructor(e, n, r, i, u) {
    this.done = e, this.undone = n, this.prevRanges = r, this.prevTime = i, this.prevComposition = u;
  }
}
const A0 = 20;
function m0(t, e, n, r) {
  let i = n.getMeta(ft), u;
  if (i)
    return i.historyState;
  n.getMeta(k0) && (t = new Qe(t.done, t.undone, null, 0, -1));
  let o = n.getMeta("appendedTransaction");
  if (n.steps.length == 0)
    return t;
  if (o && o.getMeta(ft))
    return o.getMeta(ft).redo ? new Qe(t.done.addTransform(n, void 0, r, Mn(e)), t.undone, wu(n.mapping.maps), t.prevTime, t.prevComposition) : new Qe(t.done, t.undone.addTransform(n, void 0, r, Mn(e)), null, t.prevTime, t.prevComposition);
  if (n.getMeta("addToHistory") !== !1 && !(o && o.getMeta("addToHistory") === !1)) {
    let s = n.getMeta("composition"), l = t.prevTime == 0 || !o && t.prevComposition != s && (t.prevTime < (n.time || 0) - r.newGroupDelay || !g0(n, t.prevRanges)), c = o ? xr(t.prevRanges, n.mapping) : wu(n.mapping.maps);
    return new Qe(t.done.addTransform(n, l ? e.selection.getBookmark() : void 0, r, Mn(e)), pe.empty, c, n.time, s ?? t.prevComposition);
  } else return (u = n.getMeta("rebased")) ? new Qe(t.done.rebased(n, u), t.undone.rebased(n, u), xr(t.prevRanges, n.mapping), t.prevTime, t.prevComposition) : new Qe(t.done.addMaps(n.mapping.maps), t.undone.addMaps(n.mapping.maps), xr(t.prevRanges, n.mapping), t.prevTime, t.prevComposition);
}
function g0(t, e) {
  if (!e)
    return !1;
  if (!t.docChanged)
    return !0;
  let n = !1;
  return t.mapping.maps[0].forEach((r, i) => {
    for (let u = 0; u < e.length; u += 2)
      r <= e[u + 1] && i >= e[u] && (n = !0);
  }), n;
}
function wu(t) {
  let e = [];
  for (let n = t.length - 1; n >= 0 && e.length == 0; n--)
    t[n].forEach((r, i, u, o) => e.push(u, o));
  return e;
}
function xr(t, e) {
  if (!t)
    return null;
  let n = [];
  for (let r = 0; r < t.length; r += 2) {
    let i = e.map(t[r], 1), u = e.map(t[r + 1], -1);
    i <= u && n.push(i, u);
  }
  return n;
}
function b0(t, e, n) {
  let r = Mn(e), i = ft.get(e).spec.config, u = (n ? t.undone : t.done).popEvent(e, r);
  if (!u)
    return null;
  let o = u.selection.resolve(u.transform.doc), s = (n ? t.done : t.undone).addTransform(u.transform, e.selection.getBookmark(), i, r), l = new Qe(n ? s : u.remaining, n ? u.remaining : s, null, 0, -1);
  return u.transform.setSelection(o).setMeta(ft, { redo: n, historyState: l });
}
let Cr = !1, Iu = null;
function Mn(t) {
  let e = t.plugins;
  if (Iu != e) {
    Cr = !1, Iu = e;
    for (let n = 0; n < e.length; n++)
      if (e[n].spec.historyPreserveItems) {
        Cr = !0;
        break;
      }
  }
  return Cr;
}
const ft = new $o("history"), k0 = new $o("closeHistory");
function x0(t = {}) {
  return t = {
    depth: t.depth || 100,
    newGroupDelay: t.newGroupDelay || 500
  }, new Vo({
    key: ft,
    state: {
      init() {
        return new Qe(pe.empty, pe.empty, null, 0, -1);
      },
      apply(e, n, r) {
        return m0(n, r, e, t);
      }
    },
    config: t,
    props: {
      handleDOMEvents: {
        beforeinput(e, n) {
          let r = n.inputType, i = r == "historyUndo" ? ki : r == "historyRedo" ? Jn : null;
          return !i || !e.editable ? !1 : (n.preventDefault(), i(e.state, e.dispatch));
        }
      }
    }
  });
}
function Js(t, e) {
  return (n, r) => {
    let i = ft.getState(n);
    if (!i || (t ? i.undone : i.done).eventCount == 0)
      return !1;
    if (r) {
      let u = b0(i, n, t);
      u && r(e ? u.scrollIntoView() : u);
    }
    return !0;
  };
}
const ki = Js(!1, !0), Jn = Js(!0, !0);
var Ue = {
  8: "Backspace",
  9: "Tab",
  10: "Enter",
  12: "NumLock",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  44: "PrintScreen",
  45: "Insert",
  46: "Delete",
  59: ";",
  61: "=",
  91: "Meta",
  92: "Meta",
  106: "*",
  107: "+",
  108: ",",
  109: "-",
  110: ".",
  111: "/",
  144: "NumLock",
  145: "ScrollLock",
  160: "Shift",
  161: "Shift",
  162: "Control",
  163: "Control",
  164: "Alt",
  165: "Alt",
  173: "-",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  192: "`",
  219: "[",
  220: "\\",
  221: "]",
  222: "'"
}, Gn = {
  48: ")",
  49: "!",
  50: "@",
  51: "#",
  52: "$",
  53: "%",
  54: "^",
  55: "&",
  56: "*",
  57: "(",
  59: ":",
  61: "+",
  173: "_",
  186: ":",
  187: "+",
  188: "<",
  189: "_",
  190: ">",
  191: "?",
  192: "~",
  219: "{",
  220: "|",
  221: "}",
  222: '"'
}, C0 = typeof navigator < "u" && /Mac/.test(navigator.platform), y0 = typeof navigator < "u" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
for (var H = 0; H < 10; H++) Ue[48 + H] = Ue[96 + H] = String(H);
for (var H = 1; H <= 24; H++) Ue[H + 111] = "F" + H;
for (var H = 65; H <= 90; H++)
  Ue[H] = String.fromCharCode(H + 32), Gn[H] = String.fromCharCode(H);
for (var yr in Ue) Gn.hasOwnProperty(yr) || (Gn[yr] = Ue[yr]);
function D0(t) {
  var e = C0 && t.metaKey && t.shiftKey && !t.ctrlKey && !t.altKey || y0 && t.shiftKey && t.key && t.key.length == 1 || t.key == "Unidentified", n = !e && t.key || (t.shiftKey ? Gn : Ue)[t.keyCode] || t.key || "Unidentified";
  return n == "Esc" && (n = "Escape"), n == "Del" && (n = "Delete"), n == "Left" && (n = "ArrowLeft"), n == "Up" && (n = "ArrowUp"), n == "Right" && (n = "ArrowRight"), n == "Down" && (n = "ArrowDown"), n;
}
const E0 = typeof navigator < "u" && /Mac|iP(hone|[oa]d)/.test(navigator.platform), F0 = typeof navigator < "u" && /Win/.test(navigator.platform);
function _0(t) {
  let e = t.split(/-(?!$)/), n = e[e.length - 1];
  n == "Space" && (n = " ");
  let r, i, u, o;
  for (let s = 0; s < e.length - 1; s++) {
    let l = e[s];
    if (/^(cmd|meta|m)$/i.test(l))
      o = !0;
    else if (/^a(lt)?$/i.test(l))
      r = !0;
    else if (/^(c|ctrl|control)$/i.test(l))
      i = !0;
    else if (/^s(hift)?$/i.test(l))
      u = !0;
    else if (/^mod$/i.test(l))
      E0 ? o = !0 : i = !0;
    else
      throw new Error("Unrecognized modifier name: " + l);
  }
  return r && (n = "Alt-" + n), i && (n = "Ctrl-" + n), o && (n = "Meta-" + n), u && (n = "Shift-" + n), n;
}
function w0(t) {
  let e = /* @__PURE__ */ Object.create(null);
  for (let n in t)
    e[_0(n)] = t[n];
  return e;
}
function Dr(t, e, n = !0) {
  return e.altKey && (t = "Alt-" + t), e.ctrlKey && (t = "Ctrl-" + t), e.metaKey && (t = "Meta-" + t), n && e.shiftKey && (t = "Shift-" + t), t;
}
function Bu(t) {
  return new Vo({ props: { handleKeyDown: I0(t) } });
}
function I0(t) {
  let e = w0(t);
  return function(n, r) {
    let i = D0(r), u, o = e[Dr(i, r)];
    if (o && o(n.state, n.dispatch, n))
      return !0;
    if (i.length == 1 && i != " ") {
      if (r.shiftKey) {
        let s = e[Dr(i, r, !1)];
        if (s && s(n.state, n.dispatch, n))
          return !0;
      }
      if ((r.altKey || r.metaKey || r.ctrlKey) && // Ctrl-Alt may be used for AltGr on Windows
      !(F0 && r.ctrlKey && r.altKey) && (u = Ue[r.keyCode]) && u != i) {
        let s = e[Dr(u, r)];
        if (s && s(n.state, n.dispatch, n))
          return !0;
      }
    }
    return !1;
  };
}
const Su = {};
function B0(t) {
  let e = Su[t];
  if (e)
    return e;
  e = Su[t] = [];
  for (let n = 0; n < 128; n++) {
    const r = String.fromCharCode(n);
    e.push(r);
  }
  for (let n = 0; n < t.length; n++) {
    const r = t.charCodeAt(n);
    e[r] = "%" + ("0" + r.toString(16).toUpperCase()).slice(-2);
  }
  return e;
}
function $e(t, e) {
  typeof e != "string" && (e = $e.defaultChars);
  const n = B0(e);
  return t.replace(/(%[a-f0-9]{2})+/gi, function(r) {
    let i = "";
    for (let u = 0, o = r.length; u < o; u += 3) {
      const s = parseInt(r.slice(u + 1, u + 3), 16);
      if (s < 128) {
        i += n[s];
        continue;
      }
      if ((s & 224) === 192 && u + 3 < o) {
        const l = parseInt(r.slice(u + 4, u + 6), 16);
        if ((l & 192) === 128) {
          const c = s << 6 & 1984 | l & 63;
          c < 128 ? i += "��" : i += String.fromCharCode(c), u += 3;
          continue;
        }
      }
      if ((s & 240) === 224 && u + 6 < o) {
        const l = parseInt(r.slice(u + 4, u + 6), 16), c = parseInt(r.slice(u + 7, u + 9), 16);
        if ((l & 192) === 128 && (c & 192) === 128) {
          const a = s << 12 & 61440 | l << 6 & 4032 | c & 63;
          a < 2048 || a >= 55296 && a <= 57343 ? i += "���" : i += String.fromCharCode(a), u += 6;
          continue;
        }
      }
      if ((s & 248) === 240 && u + 9 < o) {
        const l = parseInt(r.slice(u + 4, u + 6), 16), c = parseInt(r.slice(u + 7, u + 9), 16), a = parseInt(r.slice(u + 10, u + 12), 16);
        if ((l & 192) === 128 && (c & 192) === 128 && (a & 192) === 128) {
          let f = s << 18 & 1835008 | l << 12 & 258048 | c << 6 & 4032 | a & 63;
          f < 65536 || f > 1114111 ? i += "����" : (f -= 65536, i += String.fromCharCode(55296 + (f >> 10), 56320 + (f & 1023))), u += 9;
          continue;
        }
      }
      i += "�";
    }
    return i;
  });
}
$e.defaultChars = ";/?:@&=+$,#";
$e.componentChars = "";
const Mu = {};
function S0(t) {
  let e = Mu[t];
  if (e)
    return e;
  e = Mu[t] = [];
  for (let n = 0; n < 128; n++) {
    const r = String.fromCharCode(n);
    /^[0-9a-z]$/i.test(r) ? e.push(r) : e.push("%" + ("0" + n.toString(16).toUpperCase()).slice(-2));
  }
  for (let n = 0; n < t.length; n++)
    e[t.charCodeAt(n)] = t[n];
  return e;
}
function Mt(t, e, n) {
  typeof e != "string" && (n = e, e = Mt.defaultChars), typeof n > "u" && (n = !0);
  const r = S0(e);
  let i = "";
  for (let u = 0, o = t.length; u < o; u++) {
    const s = t.charCodeAt(u);
    if (n && s === 37 && u + 2 < o && /^[0-9a-f]{2}$/i.test(t.slice(u + 1, u + 3))) {
      i += t.slice(u, u + 3), u += 2;
      continue;
    }
    if (s < 128) {
      i += r[s];
      continue;
    }
    if (s >= 55296 && s <= 57343) {
      if (s >= 55296 && s <= 56319 && u + 1 < o) {
        const l = t.charCodeAt(u + 1);
        if (l >= 56320 && l <= 57343) {
          i += encodeURIComponent(t[u] + t[u + 1]), u++;
          continue;
        }
      }
      i += "%EF%BF%BD";
      continue;
    }
    i += encodeURIComponent(t[u]);
  }
  return i;
}
Mt.defaultChars = ";/?:@&=+$,-_.!~*'()#";
Mt.componentChars = "-_.!~*'()";
function en(t) {
  let e = "";
  return e += t.protocol || "", e += t.slashes ? "//" : "", e += t.auth ? t.auth + "@" : "", t.hostname && t.hostname.indexOf(":") !== -1 ? e += "[" + t.hostname + "]" : e += t.hostname || "", e += t.port ? ":" + t.port : "", e += t.pathname || "", e += t.search || "", e += t.hash || "", e;
}
function Ln() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
const M0 = /^([a-z0-9.+-]+:)/i, N0 = /:[0-9]*$/, O0 = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/, R0 = ["<", ">", '"', "`", " ", "\r", `
`, "	"], T0 = ["{", "}", "|", "\\", "^", "`"].concat(R0), v0 = ["'"].concat(T0), Nu = ["%", "/", "?", ";", "#"].concat(v0), Ou = ["/", "?", "#"], z0 = 255, Ru = /^[+a-z0-9A-Z_-]{0,63}$/, Q0 = /^([+a-z0-9A-Z_-]{0,63})(.*)$/, Tu = {
  javascript: !0,
  "javascript:": !0
}, vu = {
  http: !0,
  https: !0,
  ftp: !0,
  gopher: !0,
  file: !0,
  "http:": !0,
  "https:": !0,
  "ftp:": !0,
  "gopher:": !0,
  "file:": !0
};
function tn(t, e) {
  if (t && t instanceof Ln) return t;
  const n = new Ln();
  return n.parse(t, e), n;
}
Ln.prototype.parse = function(t, e) {
  let n, r, i, u = t;
  if (u = u.trim(), !e && t.split("#").length === 1) {
    const c = O0.exec(u);
    if (c)
      return this.pathname = c[1], c[2] && (this.search = c[2]), this;
  }
  let o = M0.exec(u);
  if (o && (o = o[0], n = o.toLowerCase(), this.protocol = o, u = u.substr(o.length)), (e || o || u.match(/^\/\/[^@\/]+@[^@\/]+/)) && (i = u.substr(0, 2) === "//", i && !(o && Tu[o]) && (u = u.substr(2), this.slashes = !0)), !Tu[o] && (i || o && !vu[o])) {
    let c = -1;
    for (let h = 0; h < Ou.length; h++)
      r = u.indexOf(Ou[h]), r !== -1 && (c === -1 || r < c) && (c = r);
    let a, f;
    c === -1 ? f = u.lastIndexOf("@") : f = u.lastIndexOf("@", c), f !== -1 && (a = u.slice(0, f), u = u.slice(f + 1), this.auth = a), c = -1;
    for (let h = 0; h < Nu.length; h++)
      r = u.indexOf(Nu[h]), r !== -1 && (c === -1 || r < c) && (c = r);
    c === -1 && (c = u.length), u[c - 1] === ":" && c--;
    const p = u.slice(0, c);
    u = u.slice(c), this.parseHost(p), this.hostname = this.hostname || "";
    const d = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!d) {
      const h = this.hostname.split(/\./);
      for (let A = 0, m = h.length; A < m; A++) {
        const g = h[A];
        if (g && !g.match(Ru)) {
          let x = "";
          for (let b = 0, k = g.length; b < k; b++)
            g.charCodeAt(b) > 127 ? x += "x" : x += g[b];
          if (!x.match(Ru)) {
            const b = h.slice(0, A), k = h.slice(A + 1), C = g.match(Q0);
            C && (b.push(C[1]), k.unshift(C[2])), k.length && (u = k.join(".") + u), this.hostname = b.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > z0 && (this.hostname = ""), d && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  const s = u.indexOf("#");
  s !== -1 && (this.hash = u.substr(s), u = u.slice(0, s));
  const l = u.indexOf("?");
  return l !== -1 && (this.search = u.substr(l), u = u.slice(0, l)), u && (this.pathname = u), vu[n] && this.hostname && !this.pathname && (this.pathname = ""), this;
};
Ln.prototype.parseHost = function(t) {
  let e = N0.exec(t);
  e && (e = e[0], e !== ":" && (this.port = e.substr(1)), t = t.substr(0, t.length - e.length)), t && (this.hostname = t);
};
const Gs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  decode: $e,
  encode: Mt,
  format: en,
  parse: tn
}, Symbol.toStringTag, { value: "Module" })), Ls = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, Zs = /[\0-\x1F\x7F-\x9F]/, K0 = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, xi = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B60\u1B7D-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDEAD\uDED0\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]/, Ys = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C1\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD803[\uDD8E\uDD8F\uDED1-\uDED8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDC00-\uDCEF\uDCFA-\uDCFC\uDD00-\uDEB3\uDEBA-\uDED0\uDEE0-\uDEF0\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED8\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDCD0-\uDCD8\uDD00-\uDE57\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF\uDFFA]/, Hs = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, W0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Any: Ls,
  Cc: Zs,
  Cf: K0,
  P: xi,
  S: Ys,
  Z: Hs
}, Symbol.toStringTag, { value: "Module" })), P0 = /* @__PURE__ */ new Map([
  [0, 65533],
  // C1 Unicode control character reference replacements
  [128, 8364],
  [130, 8218],
  [131, 402],
  [132, 8222],
  [133, 8230],
  [134, 8224],
  [135, 8225],
  [136, 710],
  [137, 8240],
  [138, 352],
  [139, 8249],
  [140, 338],
  [142, 381],
  [145, 8216],
  [146, 8217],
  [147, 8220],
  [148, 8221],
  [149, 8226],
  [150, 8211],
  [151, 8212],
  [152, 732],
  [153, 8482],
  [154, 353],
  [155, 8250],
  [156, 339],
  [158, 382],
  [159, 376]
]);
function J0(t) {
  return t >= 55296 && t <= 57343 || t > 1114111 ? 65533 : P0.get(t) ?? t;
}
function G0(t) {
  const e = atob(t), n = e.length & -2, r = new Uint16Array(n / 2);
  for (let i = 0, u = 0; i < n; i += 2) {
    const o = e.charCodeAt(i), s = e.charCodeAt(i + 1);
    r[u++] = o | s << 8;
  }
  return r;
}
const L0 = /* @__PURE__ */ G0("QR08ALkAAgH6AYsDNQR2BO0EPgXZBQEGLAbdBxMISQrvCmQLfQurDKQNLw4fD4YPpA+6D/IPAAAAAAAAAAAAAAAAKhBMEY8TmxUWF2EYLBkxGuAa3RsJHDscWR8YIC8jSCSIJcMl6ie3Ku8rEC0CLjoupS7kLgAIRU1hYmNmZ2xtbm9wcnN0dVQAWgBeAGUAaQBzAHcAfgCBAIQAhwCSAJoAoACsALMAbABpAGcAO4DGAMZAUAA7gCYAJkBjAHUAdABlADuAwQDBQHIiZXZlAAJhAAFpeW0AcgByAGMAO4DCAMJAEGRyAADgNdgE3XIAYQB2AGUAO4DAAMBA8CFoYZFj4SFjcgBhZAAAoFMqAAFncIsAjgBvAG4ABGFmAADgNdg43fAlbHlGdW5jdGlvbgCgYSBpAG4AZwA7gMUAxUAAAWNzpACoAHIAAOA12Jzc6SFnbgCgVCJpAGwAZABlADuAwwDDQG0AbAA7gMQAxEAABGFjZWZvcnN1xQDYANoA7QDxAPYA+QD8AAABY3LJAM8AayNzbGFzaAAAoBYidgHTANUAAKDnKmUAZAAAoAYjeQARZIABY3J0AOAA5QDrAGEidXNlAACgNSLuI291bGxpcwCgLCFhAJJjcgAA4DXYBd1wAGYAAOA12Dnd5SF2ZdhiYwDyAOoAbSJwZXEAAKBOIgAHSE9hY2RlZmhpbG9yc3UXARoBHwE6AVIBVQFiAWQBZgGCAakB6QHtAfIBYwB5ACdkUABZADuAqQCpQIABY3B5ACUBKAE1AfUhdGUGYWmg0iJ0KGFsRGlmZmVyZW50aWFsRAAAoEUhbCJleXMAAKAtIQACYWVpb0EBRAFKAU0B8iFvbgxhZABpAGwAO4DHAMdAcgBjAAhhbiJpbnQAAKAwIm8AdAAKYQABZG5ZAV0BaSJsbGEAuGB0I2VyRG90ALdg8gA5AWkAp2NyImNsZQAAAkRNUFRwAXQBeQF9AW8AdAAAoJkiaSJudXMAAKCWIuwhdXMAoJUiaSJtZXMAAKCXIm8AAAFjc4cBlAFrKndpc2VDb250b3VySW50ZWdyYWwAAKAyImUjQ3VybHkAAAFEUZwBpAFvJXVibGVRdW90ZQAAoB0gdSJvdGUAAKAZIAACbG5wdbABtgHNAdgBbwBuAGWgNyIAoHQqgAFnaXQAvAHBAcUB8iJ1ZW50AKBhIm4AdAAAoC8i7yV1ckludGVncmFsAKAuIgABZnLRAdMBAKACIe8iZHVjdACgECJuLnRlckNsb2Nrd2lzZUNvbnRvdXJJbnRlZ3JhbAAAoDMi7yFzcwCgLypjAHIAAOA12J7ccABDoNMiYQBwAACgTSKABURKU1phY2VmaW9zAAsCEgIVAhgCGwIsAjQCOQI9AnMCfwNvoEUh9CJyYWhkAKARKWMAeQACZGMAeQAFZGMAeQAPZIABZ3JzACECJQIoAuchZXIAoCEgcgAAoKEhaAB2AACg5CoAAWF5MAIzAvIhb24OYRRkbAB0oAciYQCUY3IAAOA12AfdAAFhZkECawIAAWNtRQJnAvIjaXRpY2FsAAJBREdUUAJUAl8CYwJjInV0ZQC0YG8AdAFZAloC2WJiJGxlQWN1dGUA3WJyImF2ZQBgYGkibGRlANxi7yFuZACgxCJmJWVyZW50aWFsRAAAoEYhcAR9AgAAAAAAAIECjgIAABoDZgAA4DXYO91EoagAhQKJAm8AdAAAoNwgcSJ1YWwAAKBQIuIhbGUAA0NETFJVVpkCqAK1Au8C/wIRA28AbgB0AG8AdQByAEkAbgB0AGUAZwByAGEA7ADEAW8AdAKvAgAAAACwAqhgbiNBcnJvdwAAoNMhAAFlb7kC0AJmAHQAgAFBUlQAwQLGAs0CciJyb3cAAKDQIekkZ2h0QXJyb3cAoNQhZQDlACsCbgBnAAABTFLWAugC5SFmdAABQVLcAuECciJyb3cAAKD4J+kkZ2h0QXJyb3cAoPon6SRnaHRBcnJvdwCg+SdpImdodAAAAUFU9gL7AnIicm93AACg0iFlAGUAAKCoInAAQQIGAwAAAAALA3Iicm93AACg0SFvJHduQXJyb3cAAKDVIWUlcnRpY2FsQmFyAACgJSJuAAADQUJMUlRhJAM2AzoDWgNxA3oDciJyb3cAAKGTIUJVLAMwA2EAcgAAoBMpcCNBcnJvdwAAoPUhciJldmUAEWPlIWZ00gJDAwAASwMAAFIDaSVnaHRWZWN0b3IAAKBQKWUkZVZlY3RvcgAAoF4p5SJjdG9yQqC9IWEAcgAAoFYpaSJnaHQA1AFiAwAAaQNlJGVWZWN0b3IAAKBfKeUiY3RvckKgwSFhAHIAAKBXKWUAZQBBoKQiciJyb3cAAKCnIXIAcgBvAPcAtAIAAWN0gwOHA3IAAOA12J/c8iFvaxBhAAhOVGFjZGZnbG1vcHFzdHV4owOlA6kDsAO/A8IDxgPNA9ID8gP9AwEEFAQeBCAEJQRHAEphSAA7gNAA0EBjAHUAdABlADuAyQDJQIABYWl5ALYDuQO+A/Ihb24aYXIAYwA7gMoAykAtZG8AdAAWYXIAAOA12AjdcgBhAHYAZQA7gMgAyEDlIm1lbnQAoAgiAAFhcNYD2QNjAHIAEmF0AHkAUwLhAwAAAADpA20lYWxsU3F1YXJlAACg+yVlJ3J5U21hbGxTcXVhcmUAAKCrJQABZ3D2A/kDbwBuABhhZgAA4DXYPN3zImlsb26VY3UAAAFhaQYEDgRsAFSgdSppImxkZQAAoEIi7CNpYnJpdW0AoMwhAAFjaRgEGwRyAACgMCFtAACgcyphAJdjbQBsADuAywDLQAABaXApBC0E8yF0cwCgAyLvJG5lbnRpYWxFAKBHIYACY2Zpb3MAPQQ/BEMEXQRyBHkAJGRyAADgNdgJ3WwibGVkAFMCTAQAAAAAVARtJWFsbFNxdWFyZQAAoPwlZSdyeVNtYWxsU3F1YXJlAACgqiVwA2UEAABpBAAAAABtBGYAAOA12D3dwSFsbACgACLyI2llcnRyZgCgMSFjAPIAcQQABkpUYWJjZGZnb3JzdIgEiwSOBJMElwSkBKcEqwStBLIE5QTqBGMAeQADZDuAPgA+QO0hbWFkoJMD3GNyImV2ZQAeYYABZWl5AJ0EoASjBOQhaWwiYXIAYwAcYRNkbwB0ACBhcgAA4DXYCt0AoNkicABmAADgNdg+3eUiYXRlcgADRUZHTFNUvwTIBM8E1QTZBOAEcSJ1YWwATKBlIuUhc3MAoNsidSRsbEVxdWFsAACgZyJyI2VhdGVyAACgoirlIXNzAKB3IuwkYW50RXF1YWwAoH4qaSJsZGUAAKBzImMAcgAA4DXYotwAoGsiAARBYWNmaW9zdfkE/QQFBQgFCwUTBSIFKwVSIkRjeQAqZAABY3QBBQQFZQBrAMdiXmDpIXJjJGFyAACgDCFsJWJlcnRTcGFjZQAAoAsh8AEYBQAAGwVmAACgDSHpJXpvbnRhbExpbmUAoAAlAAFjdCYFKAXyABIF8iFvayZhbQBwAEQBMQU5BW8AdwBuAEgAdQBtAPAAAAFxInVhbAAAoE8iAAdFSk9hY2RmZ21ub3N0dVMFVgVZBVwFYwVtBXAFcwV6BZAFtgXFBckFzQVjAHkAFWTsIWlnMmFjAHkAAWRjAHUAdABlADuAzQDNQAABaXlnBWwFcgBjADuAzgDOQBhkbwB0ADBhcgAAoBEhcgBhAHYAZQA7gMwAzEAAoREhYXB/BYsFAAFjZ4MFhQVyACphaSNuYXJ5SQAAoEghbABpAGUA8wD6AvQBlQUAAKUFZaAsIgABZ3KaBZ4F8iFhbACgKyLzI2VjdGlvbgCgwiJpI3NpYmxlAAABQ1SsBbEFbyJtbWEAAKBjIGkibWVzAACgYiCAAWdwdAC8Bb8FwwVvAG4ALmFmAADgNdhA3WEAmWNjAHIAAKAQIWkibGRlAChh6wHSBQAA1QVjAHkABmRsADuAzwDPQIACY2Zvc3UA4QXpBe0F8gX9BQABaXnlBegFcgBjADRhGWRyAADgNdgN3XAAZgAA4DXYQd3jAfcFAAD7BXIAAOA12KXc8iFjeQhk6yFjeQRkgANISmFjZm9zAAwGDwYSBhUGHQYhBiYGYwB5ACVkYwB5AAxk8CFwYZpjAAFleRkGHAbkIWlsNmEaZHIAAOA12A7dcABmAADgNdhC3WMAcgAA4DXYptyABUpUYWNlZmxtb3N0AD0GQAZDBl4GawZkB2gHcAd0B80H2gdjAHkACWQ7gDwAPECAAmNtbnByAEwGTwZSBlUGWwb1IXRlOWHiIWRhm2NnAACg6ifsI2FjZXRyZgCgEiFyAACgniGAAWFleQBkBmcGagbyIW9uPWHkIWlsO2EbZAABZnNvBjQHdAAABUFDREZSVFVWYXKABp4GpAbGBssG3AYDByEHwQIqBwABbnKEBowGZyVsZUJyYWNrZXQAAKDoJ/Ihb3cAoZAhQlKTBpcGYQByAACg5CHpJGdodEFycm93AKDGIWUjaWxpbmcAAKAII28A9QGqBgAAsgZiJWxlQnJhY2tldAAAoOYnbgDUAbcGAAC+BmUkZVZlY3RvcgAAoGEp5SJjdG9yQqDDIWEAcgAAoFkpbCJvb3IAAKAKI2kiZ2h0AAABQVbSBtcGciJyb3cAAKCUIeUiY3RvcgCgTikAAWVy4AbwBmUAAKGjIkFW5gbrBnIicm93AACgpCHlImN0b3IAoFopaSNhbmdsZQBCorIi+wYAAAAA/wZhAHIAAKDPKXEidWFsAACgtCJwAIABRFRWAAoHEQcYB+8kd25WZWN0b3IAoFEpZSRlVmVjdG9yAACgYCnlImN0b3JCoL8hYQByAACgWCnlImN0b3JCoLwhYQByAACgUilpAGcAaAB0AGEAcgByAG8A9wDMAnMAAANFRkdMU1Q/B0cHTgdUB1gHXwfxJXVhbEdyZWF0ZXIAoNoidSRsbEVxdWFsAACgZiJyI2VhdGVyAACgdiLlIXNzAKChKuwkYW50RXF1YWwAoH0qaSJsZGUAAKByInIAAOA12A/dZaDYIuYjdGFycm93AKDaIWkiZG90AD9hgAFucHcAege1B7kHZwAAAkxSbHKCB5QHmwerB+UhZnQAAUFSiAeNB3Iicm93AACg9SfpJGdodEFycm93AKD3J+kkZ2h0QXJyb3cAoPYn5SFmdAABYXLcAqEHaQBnAGgAdABhAHIAcgBvAPcA5wJpAGcAaAB0AGEAcgByAG8A9wDuAmYAAOA12EPdZQByAAABTFK/B8YHZSRmdEFycm93AACgmSHpJGdodEFycm93AKCYIYABY2h0ANMH1QfXB/IAWgYAoLAh8iFva0FhAKBqIgAEYWNlZmlvc3XpB+wH7gf/BwMICQgOCBEIcAAAoAUpeQAcZAABZGzyB/kHaSR1bVNwYWNlAACgXyBsI2ludHJmAACgMyFyAADgNdgQ3e4jdXNQbHVzAKATInAAZgAA4DXYRN1jAPIA/gecY4AESmFjZWZvc3R1ACEIJAgoCDUIgQiFCDsKQApHCmMAeQAKZGMidXRlAENhgAFhZXkALggxCDQI8iFvbkdh5CFpbEVhHWSAAWdzdwA7CGEIfQjhInRpdmWAAU1UVgBECEwIWQhlJWRpdW1TcGFjZQAAoAsgaABpAAABY25SCFMIawBTAHAAYQBjAOUASwhlAHIAeQBUAGgAaQDuAFQI9CFlZAABR0xnCHUIcgBlAGEAdABlAHIARwByAGUAYQB0AGUA8gDrBGUAcwBzAEwAZQBzAPMA2wdMImluZQAKYHIAAOA12BHdAAJCbnB0jAiRCJkInAhyImVhawAAoGAgwiZyZWFraW5nU3BhY2WgYGYAAKAVIUOq7CqzCMIIzQgAAOcIGwkAAAAAAAAtCQAAbwkAAIcJAACdCcAJGQoAADQKAAFvdbYIvAjuI2dydWVudACgYiJwIkNhcAAAoG0ibyh1YmxlVmVydGljYWxCYXIAAKAmIoABbHF4ANII1wjhCOUibWVudACgCSL1IWFsVKBgImkibGRlAADgQiI4A2kic3RzAACgBCJyI2VhdGVyAACjbyJFRkdMU1T1CPoIAgkJCQ0JFQlxInVhbAAAoHEidSRsbEVxdWFsAADgZyI4A3IjZWF0ZXIAAOBrIjgD5SFzcwCgeSLsJGFudEVxdWFsAOB+KjgDaSJsZGUAAKB1IvUhbXBEASAJJwnvI3duSHVtcADgTiI4A3EidWFsAADgTyI4A2UAAAFmczEJRgn0JFRyaWFuZ2xlQqLqIj0JAAAAAEIJYQByAADgzyk4A3EidWFsAACg7CJzAICibiJFR0xTVABRCVYJXAlhCWkJcSJ1YWwAAKBwInIjZWF0ZXIAAKB4IuUhc3MA4GoiOAPsJGFudEVxdWFsAOB9KjgDaSJsZGUAAKB0IuUic3RlZAABR0x1CX8J8iZlYXRlckdyZWF0ZXIA4KIqOAPlI3NzTGVzcwDgoSo4A/IjZWNlZGVzAKGAIkVTjwmVCXEidWFsAADgryo4A+wkYW50RXF1YWwAoOAiAAFlaaAJqQl2JmVyc2VFbGVtZW50AACgDCLnJWh0VHJpYW5nbGVCousitgkAAAAAuwlhAHIAAODQKTgDcSJ1YWwAAKDtIgABcXXDCeAJdSNhcmVTdQAAAWJwywnVCfMhZXRF4I8iOANxInVhbAAAoOIi5SJyc2V0ReCQIjgDcSJ1YWwAAKDjIoABYmNwAOYJ8AkNCvMhZXRF4IIi0iBxInVhbAAAoIgi4yJlZWRzgKGBIkVTVAD6CQAKBwpxInVhbAAA4LAqOAPsJGFudEVxdWFsAKDhImkibGRlAADgfyI4A+UicnNldEXggyLSIHEidWFsAACgiSJpImxkZQCAoUEiRUZUACIKJwouCnEidWFsAACgRCJ1JGxsRXF1YWwAAKBHImkibGRlAACgSSJlJXJ0aWNhbEJhcgAAoCQiYwByAADgNdip3GkAbABkAGUAO4DRANFAnWMAB0VhY2RmZ21vcHJzdHV2XgphCmgKcgp2CnoKgQqRCpYKqwqtCrsKyArNCuwhaWdSYWMAdQB0AGUAO4DTANNAAAFpeWwKcQpyAGMAO4DUANRAHmRiImxhYwBQYXIAAOA12BLdcgBhAHYAZQA7gNIA0kCAAWFlaQCHCooKjQpjAHIATGFnAGEAqWNjInJvbgCfY3AAZgAA4DXYRt3lI25DdXJseQABRFGeCqYKbyV1YmxlUXVvdGUAAKAcIHUib3RlAACgGCAAoFQqAAFjbLEKtQpyAADgNdiq3GEAcwBoADuA2ADYQGkAbAHACsUKZABlADuA1QDVQGUAcwAAoDcqbQBsADuA1gDWQGUAcgAAAUJQ0wrmCgABYXLXCtoKcgAAoD4gYQBjAAABZWvgCuIKAKDeI2UAdAAAoLQjYSVyZW50aGVzaXMAAKDcI4AEYWNmaGlsb3JzAP0KAwsFCwkLCwsMCxELIwtaC3IjdGlhbEQAAKACInkAH2RyAADgNdgT3WkApmOgY/Ujc01pbnVzsWAAAWlwFQsgC24AYwBhAHIAZQBwAGwAYQBuAOUACgVmAACgGSGAobsqZWlvACoLRQtJC+MiZWRlc4CheiJFU1QANAs5C0ALcSJ1YWwAAKCvKuwkYW50RXF1YWwAoHwiaSJsZGUAAKB+Im0AZQAAoDMgAAFkcE0LUQv1IWN0AKAPIm8jcnRpb24AYaA3ImwAAKAdIgABY2leC2ILcgAA4DXYq9yoYwACVWZvc2oLbwtzC3cLTwBUADuAIgAiQHIAAOA12BTdcABmAACgGiFjAHIAAOA12KzcAAZCRWFjZWZoaW9yc3WPC5MLlwupC7YL2AvbC90LhQyTDJoMowzhIXJyAKAQKUcAO4CuAK5AgAFjbnIAnQugC6ML9SF0ZVRhZwAAoOsncgB0oKAhbAAAoBYpgAFhZXkArwuyC7UL8iFvblhh5CFpbFZhIGR2oBwhZSJyc2UAAAFFVb8LzwsAAWxxwwvIC+UibWVudACgCyL1JGlsaWJyaXVtAKDLIXAmRXF1aWxpYnJpdW0AAKBvKXIAAKAcIW8AoWPnIWh0AARBQ0RGVFVWYewLCgwQDDIMNwxeDHwM9gIAAW5y8Av4C2clbGVCcmFja2V0AACg6SfyIW93AKGSIUJM/wsDDGEAcgAAoOUhZSRmdEFycm93AACgxCFlI2lsaW5nAACgCSNvAPUBFgwAAB4MYiVsZUJyYWNrZXQAAKDnJ24A1AEjDAAAKgxlJGVWZWN0b3IAAKBdKeUiY3RvckKgwiFhAHIAAKBVKWwib29yAACgCyMAAWVyOwxLDGUAAKGiIkFWQQxGDHIicm93AACgpiHlImN0b3IAoFspaSNhbmdsZQBCorMiVgwAAAAAWgxhAHIAAKDQKXEidWFsAACgtSJwAIABRFRWAGUMbAxzDO8kd25WZWN0b3IAoE8pZSRlVmVjdG9yAACgXCnlImN0b3JCoL4hYQByAACgVCnlImN0b3JCoMAhYQByAACgUykAAXB1iQyMDGYAAKAdIe4kZEltcGxpZXMAoHAp6SRnaHRhcnJvdwCg2yEAAWNongyhDHIAAKAbIQCgsSHsJGVEZWxheWVkAKD0KYAGSE9hY2ZoaW1vcXN0dQC/DMgMzAzQDOIM5gwKDQ0NFA0ZDU8NVA1YDQABQ2PDDMYMyCFjeSlkeQAoZEYiVGN5ACxkYyJ1dGUAWmEAorwqYWVpedgM2wzeDOEM8iFvbmBh5CFpbF5hcgBjAFxhIWRyAADgNdgW3e8hcnQAAkRMUlXvDPYM/QwEDW8kd25BcnJvdwAAoJMhZSRmdEFycm93AACgkCHpJGdodEFycm93AKCSIXAjQXJyb3cAAKCRIechbWGjY+EkbGxDaXJjbGUAoBgicABmAADgNdhK3XICHw0AAAAAIg10AACgGiLhIXJlgKGhJUlTVQAqDTINSg3uJXRlcnNlY3Rpb24AoJMidQAAAWJwNw1ADfMhZXRFoI8icSJ1YWwAAKCRIuUicnNldEWgkCJxInVhbAAAoJIibiJpb24AAKCUImMAcgAA4DXYrtxhAHIAAKDGIgACYmNtcF8Nag2ODZANc6DQImUAdABFoNAicSJ1YWwAAKCGIgABY2huDYkNZSJlZHMAgKF7IkVTVAB4DX0NhA1xInVhbAAAoLAq7CRhbnRFcXVhbACgfSJpImxkZQAAoH8iVABoAGEA9ADHCwCgESIAodEiZXOVDZ8NciJzZXQARaCDInEidWFsAACghyJlAHQAAKDRIoAFSFJTYWNmaGlvcnMAtQ27Db8NyA3ODdsN3w3+DRgOHQ4jDk8AUgBOADuA3gDeQMEhREUAoCIhAAFIY8MNxg1jAHkAC2R5ACZkAAFidcwNzQ0JYKRjgAFhZXkA1A3XDdoN8iFvbmRh5CFpbGJhImRyAADgNdgX3QABZWnjDe4N8gHoDQAA7Q3lImZvcmUAoDQiYQCYYwABY27yDfkNayNTcGFjZQAA4F8gCiDTInBhY2UAoAkg7CFkZYChPCJFRlQABw4MDhMOcSJ1YWwAAKBDInUkbGxFcXVhbAAAoEUiaSJsZGUAAKBIInAAZgAA4DXYS93pI3BsZURvdACg2yAAAWN0Jw4rDnIAAOA12K/c8iFva2Zh4QpFDlYOYA5qDgAAbg5yDgAAAAAAAAAAAAB5DnwOqA6zDgAADg8RDxYPGg8AAWNySA5ODnUAdABlADuA2gDaQHIAb6CfIeMhaXIAoEkpcgDjAVsOAABdDnkADmR2AGUAbGEAAWl5Yw5oDnIAYwA7gNsA20AjZGIibGFjAHBhcgAA4DXYGN1yAGEAdgBlADuA2QDZQOEhY3JqYQABZGl/Dp8OZQByAAABQlCFDpcOAAFhcokOiw5yAF9gYQBjAAABZWuRDpMOAKDfI2UAdAAAoLUjYSVyZW50aGVzaXMAAKDdI28AbgBQoMMi7CF1cwCgjiIAAWdwqw6uDm8AbgByYWYAAOA12EzdAARBREVUYWRwc78O0g7ZDuEOBQPqDvMOBw9yInJvdwDCoZEhyA4AAMwOYQByAACgEilvJHduQXJyb3cAAKDFIW8kd25BcnJvdwAAoJUhcSV1aWxpYnJpdW0AAKBuKWUAZQBBoKUiciJyb3cAAKClIW8AdwBuAGEAcgByAG8A9wAQA2UAcgAAAUxS+Q4AD2UkZnRBcnJvdwAAoJYh6SRnaHRBcnJvdwCglyFpAGyg0gNvAG4ApWPpIW5nbmFjAHIAAOA12LDcaSJsZGUAaGFtAGwAO4DcANxAgAREYmNkZWZvc3YALQ8xDzUPNw89D3IPdg97D4AP4SFzaACgqyJhAHIAAKDrKnkAEmThIXNobKCpIgCg5ioAAWVyQQ9DDwCgwSKAAWJ0eQBJD00Paw9hAHIAAKAWIGmgFiDjIWFsAAJCTFNUWA9cD18PZg9hAHIAAKAjIukhbmV8YGUkcGFyYXRvcgAAoFgnaSJsZGUAAKBAItQkaGluU3BhY2UAoAogcgAA4DXYGd1wAGYAAOA12E3dYwByAADgNdix3GQiYXNoAACgqiKAAmNlZm9zAI4PkQ+VD5kPng/pIXJjdGHkIWdlAKDAInIAAOA12BrdcABmAADgNdhO3WMAcgAA4DXYstwAAmZpb3OqD64Prw+0D3IAAOA12BvdnmNwAGYAAOA12E/dYwByAADgNdiz3IAEQUlVYWNmb3N1AMgPyw/OD9EP2A/gD+QP6Q/uD2MAeQAvZGMAeQAHZGMAeQAuZGMAdQB0AGUAO4DdAN1AAAFpedwP3w9yAGMAdmErZHIAAOA12BzdcABmAADgNdhQ3WMAcgAA4DXYtNxtAGwAeGEABEhhY2RlZm9z/g8BEAUQDRAQEB0QIBAkEGMAeQAWZGMidXRlAHlhAAFheQkQDBDyIW9ufWEXZG8AdAB7YfIBFRAAABwQbwBXAGkAZAB0AOgAVAhhAJZjcgAAoCghcABmAACgJCFjAHIAAOA12LXc4QtCEEkQTRAAAGcQbRByEAAAAAAAAAAAeRCKEJcQ8hD9EAAAGxEhETIROREAAD4RYwB1AHQAZQA7gOEA4UByImV2ZQADYYCiPiJFZGl1eQBWEFkQWxBgEGUQAOA+IjMDAKA/InIAYwA7gOIA4kB0AGUAO4C0ALRAMGRsAGkAZwA7gOYA5kByoGEgAOA12B7dcgBhAHYAZQA7gOAA4EAAAWVwfBCGEAABZnCAEIQQ8yF5bQCgNSHoAIMQaABhALFjAAFhcI0QWwAAAWNskRCTEHIAAWFnAACgPypkApwQAAAAALEQAKInImFkc3ajEKcQqRCuEG4AZAAAoFUqAKBcKmwib3BlAACgWCoAoFoqAKMgImVsbXJzersQvRDAEN0Q5RDtEACgpCllAACgICJzAGQAYaAhImEEzhDQENIQ1BDWENgQ2hDcEACgqCkAoKkpAKCqKQCgqykAoKwpAKCtKQCgrikAoK8pdAB2oB8iYgBkoL4iAKCdKQABcHTpEOwQaAAAoCIixWDhIXJyAKB8IwABZ3D1EPgQbwBuAAVhZgAA4DXYUt0Ao0giRWFlaW9wBxEJEQ0RDxESERQRAKBwKuMhaXIAoG8qAKBKImQAAKBLInMAJ2DyIW94ZaBIIvEADhFpAG4AZwA7gOUA5UCAAWN0eQAmESoRKxFyAADgNdi23CpgbQBwAGWgSCLxAPgBaQBsAGQAZQA7gOMA40BtAGwAO4DkAORAAAFjaUERRxFvAG4AaQBuAPQA6AFuAHQAAKARKgAITmFiY2RlZmlrbG5vcHJzdWQRaBGXEZ8RpxGrEdIR1hErEjASexKKEn0RThNbE3oTbwB0AACg7SoAAWNybBGJEWsAAAJjZXBzdBF4EX0RghHvIW5nAKBMInAjc2lsb24A9mNyImltZQAAoDUgaQBtAGWgPSJxAACgzSJ2AY0RkRFlAGUAAKC9ImUAZABnoAUjZQAAoAUjcgBrAHSgtSPiIXJrAKC2IwABb3mjEaYRbgDnAHcRMWTxIXVvAKAeIIACY21wcnQAtBG5Eb4RwRHFEeEhdXPloDUi5ABwInR5dgAAoLApcwDpAH0RbgBvAPUA6gCAAWFodwDLEcwRzhGyYwCgNiHlIWVuAKBsInIAAOA12B/dZwCAA2Nvc3R1dncA4xHyEQUSEhIhEiYSKRKAAWFpdQDpEesR7xHwAKMFcgBjAACg7yVwAACgwyKAAWRwdAD4EfwRABJvAHQAAKAAKuwhdXMAoAEqaSJtZXMAAKACKnECCxIAAAAADxLjIXVwAKAGKmEAcgAAoAUm8iNpYW5nbGUAAWR1GhIeEu8hd24AoL0lcAAAoLMlcCJsdXMAAKAEKmUA5QBCD+UAkg9hInJvdwAAoA0pgAFha28ANhJoEncSAAFjbjoSZRJrAIABbHN0AEESRxJNEm8jemVuZ2UAAKDrKXEAdQBhAHIA5QBcBPIjaWFuZ2xlgKG0JWRscgBYElwSYBLvIXduAKC+JeUhZnQAoMIlaSJnaHQAAKC4JWsAAKAjJLEBbRIAAHUSsgFxEgAAcxIAoJIlAKCRJTQAAKCTJWMAawAAoIglAAFlb38ShxJx4D0A5SD1IWl2AOBhIuUgdAAAoBAjAAJwdHd4kRKVEpsSnxJmAADgNdhT3XSgpSJvAG0AAKClIvQhaWUAoMgiAAZESFVWYmRobXB0dXayEsES0RLgEvcS+xIKExoTHxMjEygTNxMAAkxSbHK5ErsSvRK/EgCgVyUAoFQlAKBWJQCgUyUAolAlRFVkdckSyxLNEs8SAKBmJQCgaSUAoGQlAKBnJQACTFJsctgS2hLcEt4SAKBdJQCgWiUAoFwlAKBZJQCjUSVITFJobHLrEu0S7xLxEvMS9RIAoGwlAKBjJQCgYCUAoGslAKBiJQCgXyVvAHgAAKDJKQACTFJscgITBBMGEwgTAKBVJQCgUiUAoBAlAKAMJQCiACVEVWR1EhMUExYTGBMAoGUlAKBoJQCgLCUAoDQlaSJudXMAAKCfIuwhdXMAoJ4iaSJtZXMAAKCgIgACTFJsci8TMRMzEzUTAKBbJQCgWCUAoBglAKAUJQCjAiVITFJobHJCE0QTRhNIE0oTTBMAoGolAKBhJQCgXiUAoDwlAKAkJQCgHCUAAWV2UhNVE3YA5QD5AGIAYQByADuApgCmQAACY2Vpb2ITZhNqE24TcgAA4DXYt9xtAGkAAKBPIG0A5aA9IogRbAAAoVwAYmh0E3YTAKDFKfMhdWIAoMgnbAF+E4QTbABloCIgdAAAoCIgcAAAoU4iRWWJE4sTAKCuKvGgTyI8BeEMqRMAAN8TABQDFB8UAAAjFDQUAAAAAIUUAAAAAI0UAAAAANcU4xT3FPsUAACIFQAAlhWAAWNwcgCuE7ET1RP1IXRlB2GAoikiYWJjZHMAuxO/E8QTzhPSE24AZAAAoEQqciJjdXAAAKBJKgABYXXIE8sTcAAAoEsqcAAAoEcqbwB0AACgQCoA4CkiAP4AAWVv2RPcE3QAAKBBIO4ABAUAAmFlaXXlE+8T9RP4E/AB6hMAAO0TcwAAoE0qbwBuAA1hZABpAGwAO4DnAOdAcgBjAAlhcABzAHOgTCptAACgUCpvAHQAC2GAAWRtbgAIFA0UEhRpAGwAO4C4ALhAcCJ0eXYAAKCyKXQAAIGiADtlGBQZFKJAcgBkAG8A9ABiAXIAAOA12CDdgAFjZWkAKBQqFDIUeQBHZGMAawBtoBMn4SFyawCgEyfHY3IAAKPLJUVjZWZtcz8UQRRHFHcUfBSAFACgwykAocYCZWxGFEkUcQAAoFciZQBhAlAUAAAAAGAUciJyb3cAAAFsclYUWhTlIWZ0AKC6IWkiZ2h0AACguyGAAlJTYWNkAGgUaRRrFG8UcxSuYACgyCRzAHQAAKCbIukhcmMAoJoi4SFzaACgnSJuImludAAAoBAqaQBkAACg7yrjIWlyAKDCKfUhYnN1oGMmaQB0AACgYybsApMUmhS2FAAAwxRvAG4AZaA6APGgVCKrAG0CnxQAAAAAoxRhAHSgLABAYAChASJmbKcUqRTuABMNZQAAAW14rhSyFOUhbnQAoAEiZQDzANIB5wG6FAAAwBRkoEUibwB0AACgbSpuAPQAzAGAAWZyeQDIFMsUzhQA4DXYVN1vAOQA1wEAgakAO3MeAdMUcgAAoBchAAFhb9oU3hRyAHIAAKC1IXMAcwAAoBcnAAFjdeYU6hRyAADgNdi43AABYnDuFPIUZaDPKgCg0SploNAqAKDSKuQhb3QAoO8igANkZWxwcnZ3AAYVEBUbFSEVRBVlFYQV4SFycgABbHIMFQ4VAKA4KQCgNSlwAhYVAAAAABkVcgAAoN4iYwAAoN8i4SFycnCgtiEAoD0pgKIqImJjZG9zACsVMBU6FT4VQRVyImNhcAAAoEgqAAFhdTQVNxVwAACgRipwAACgSipvAHQAAKCNInIAAKBFKgDgKiIA/gACYWxydksVURVuFXMVcgByAG2gtyEAoDwpeQCAAWV2dwBYFWUVaRVxAHACXxUAAAAAYxVyAGUA4wAXFXUA4wAZFWUAZQAAoM4iZSJkZ2UAAKDPImUAbgA7gKQApEBlI2Fycm93AAABbHJ7FX8V5SFmdACgtiFpImdodAAAoLchZQDkAG0VAAFjaYsVkRVvAG4AaQBuAPQAkwFuAHQAAKAxImwiY3R5AACgLSOACUFIYWJjZGVmaGlqbG9yc3R1d3oAuBW7Fb8V1RXgFegV+RUKFhUWHxZUFlcWZRbFFtsW7xb7FgUXChdyAPIAtAJhAHIAAKBlKQACZ2xyc8YVyhXOFdAV5yFlcgCgICDlIXRoAKA4IfIA9QxoAHagECAAoKMiawHZFd4VYSJyb3cAAKAPKWEA4wBfAgABYXnkFecV8iFvbg9hNGQAoUYhYW/tFfQVAAFnciEC8RVyAACgyiF0InNlcQAAoHcqgAFnbG0A/xUCFgUWO4CwALBAdABhALRjcCJ0eXYAAKCxKQABaXIOFhIW8yFodACgfykA4DXYId1hAHIAAAFschsWHRYAoMMhAKDCIYACYWVnc3YAKBauAjYWOhY+Fm0AAKHEIm9zLhY0Fm4AZABzoMQi9SFpdACgZiZhIm1tYQDdY2kAbgAAoPIiAKH3AGlvQxZRFmQAZQAAgfcAO29KFksW90BuI3RpbWVzAACgxyJuAPgAUBZjAHkAUmRjAG8CXhYAAAAAYhZyAG4AAKAeI28AcAAAoA0jgAJscHR1dwBuFnEWdRaSFp4W7CFhciRgZgAA4DXYVd0AotkCZW1wc30WhBaJFo0WcQBkoFAibwB0AACgUSJpIm51cwAAoDgi7CF1cwCgFCLxInVhcmUAoKEiYgBsAGUAYgBhAHIAdwBlAGQAZwDlANcAbgCAAWFkaAClFqoWtBZyAHIAbwD3APUMbwB3AG4AYQByAHIAbwB3APMA8xVhI3Jwb29uAAABbHK8FsAWZQBmAPQAHBZpAGcAaAD0AB4WYgHJFs8WawBhAHIAbwD3AJILbwLUFgAAAADYFnIAbgAAoB8jbwBwAACgDCOAAWNvdADhFukW7BYAAXJ55RboFgDgNdi53FVkbAAAoPYp8iFvaxFhAAFkcvMW9xZvAHQAAKDxImkA5qC/JVsSAAFhaP8WAhdyAPIANQNhAPIA1wvhIm5nbGUAoKYpAAFjaQ4XEBd5AF9k5yJyYXJyAKD/JwAJRGFjZGVmZ2xtbm9wcXJzdHV4MRc4F0YXWxcyBF4XaRd5F40XrBe0F78X2RcVGCEYLRg1GEAYAAFEbzUXgRZvAPQA+BUAAWNzPBdCF3UAdABlADuA6QDpQPQhZXIAoG4qAAJhaW95TRdQF1YXWhfyIW9uG2FyAGOgViI7gOoA6kDsIW9uAKBVIk1kbwB0ABdhAAFEcmIXZhdvAHQAAKBSIgDgNdgi3XKhmipuF3QXYQB2AGUAO4DoAOhAZKCWKm8AdAAAoJgqgKGZKmlscwCAF4UXhxfuInRlcnMAoOcjAKATIWSglSpvAHQAAKCXKoABYXBzAJMXlheiF2MAcgATYXQAeQBzogUinxcAAAAAoRdlAHQAAKAFInAAMaADIDMBqRerFwCgBCAAoAUgAAFnc7AXsRdLYXAAAKACIAABZ3C4F7sXbwBuABlhZgAA4DXYVt2AAWFscwDFF8sXzxdyAHOg1SJsAACg4yl1AHMAAKBxKmkAAKG1A2x21RfYF28AbgC1Y/VjAAJjc3V24BfoF/0XEBgAAWlv5BdWF3IAYwAAoFYiaQLuFwAAAADwF+0ADQThIW50AAFnbPUX+Rd0AHIAAKCWKuUhc3MAoJUqgAFhZWkAAxgGGAoYbABzAD1gcwB0AACgXyJ2AESgYSJEAACgeCrwImFyc2wAoOUpAAFEYRkYHRhvAHQAAKBTInIAcgAAoHEpgAFjZGkAJxgqGO0XcgAAoC8hbwD0AIwCAAFhaDEYMhi3YzuA8ADwQAABbXI5GD0YbAA7gOsA60BvAACgrCCAAWNpcABGGEgYSxhsACFgcwD0ACwEAAFlb08YVxhjAHQAYQB0AGkAbwDuABoEbgBlAG4AdABpAGEAbADlADME4Ql1GAAAgRgAAIMYiBgAAAAAoRilGAAAqhgAALsYvhjRGAAA1xgnGWwAbABpAG4AZwBkAG8AdABzAGUA8QBlF3kARGRtImFsZQAAoEAmgAFpbHIAjRiRGJ0Y7CFpZwCgA/tpApcYAAAAAJoYZwAAoAD7aQBnAACgBPsA4DXYI93sIWlnAKAB++whaWcA4GYAagCAAWFsdACvGLIYthh0AACgbSZpAGcAAKAC+24AcwAAoLElbwBmAJJh8AHCGAAAxhhmAADgNdhX3QABYWvJGMwYbADsAGsEdqDUIgCg2SphI3J0aW50AACgDSoAAWFv2hgiGQABY3PeGB8ZsQPnGP0YBRkSGRUZAAAdGbID7xjyGPQY9xj5GAAA+xg7gL0AvUAAoFMhO4C8ALxAAKBVIQCgWSEAoFshswEBGQAAAxkAoFQhAKBWIbQCCxkOGQAAAAAQGTuAvgC+QACgVyEAoFwhNQAAoFghtgEZGQAAGxkAoFohAKBdITgAAKBeIWwAAKBEIHcAbgAAoCIjYwByAADgNdi73IAIRWFiY2RlZmdpamxub3JzdHYARhlKGVoZXhlmGWkZkhmWGZkZnRmgGa0ZxhnLGc8Z4BkjGmygZyIAoIwqgAFjbXAAUBlTGVgZ9SF0ZfVhbQBhAOSgswM6FgCghipyImV2ZQAfYQABaXliGWUZcgBjAB1hM2RvAHQAIWGAoWUibHFzAMYEcBl6GfGhZSLOBAAAdhlsAGEAbgD0AN8EgKF+KmNkbACBGYQZjBljAACgqSpvAHQAb6CAKmyggioAoIQqZeDbIgD+cwAAoJQqcgAA4DXYJN3noGsirATtIWVsAKA3IWMAeQBTZIChdyJFYWoApxmpGasZAKCSKgCgpSoAoKQqAAJFYWVztBm2Gb0ZwhkAoGkicABwoIoq8iFveACgiipxoIgq8aCIKrUZaQBtAACg5yJwAGYAAOA12FjdYQB2AOUAYwIAAWNp0xnWGXIAAKAKIW0AAKFzImVs3BneGQCgjioAoJAqAIM+ADtjZGxxco0E6xn0GfgZ/BkBGgABY2nvGfEZAKCnKnIAAKB6Km8AdAAAoNci0CFhcgCglSl1ImVzdAAAoHwqgAJhZGVscwAKGvQZFhrVBCAa8AEPGgAAFBpwAHIAbwD4AFkZcgAAoHgpcQAAAWxxxAQbGmwAZQBzAPMASRlpAO0A5AQAAWVuJxouGnIjdG5lcXEAAOBpIgD+xQAsGgAFQWFiY2Vma29zeUAaQxpmGmoabRqDGocalhrCGtMacgDyAMwCAAJpbG1yShpOGlAaVBpyAHMA8ABxD2YAvWBpAGwA9AASBQABZHJYGlsaYwB5AEpkAKGUIWN3YBpkGmkAcgAAoEgpAKCtIWEAcgAAoA8h6SFyYyVhgAFhbHIAcxp7Gn8a8iF0c3WgZSZpAHQAAKBlJuwhaXAAoCYg4yFvbgCguSJyAADgNdgl3XMAAAFld4wakRphInJvdwAAoCUpYSJyb3cAAKAmKYACYW1vcHIAnxqjGqcauhq+GnIAcgAAoP8h9CFodACgOyJrAAABbHKsGrMaZSRmdGFycm93AACgqSHpJGdodGFycm93AKCqIWYAAOA12Fnd4iFhcgCgFSCAAWNsdADIGswa0BpyAADgNdi93GEAcwDoAGka8iFvaydhAAFicNca2xr1IWxsAKBDIOghZW4AoBAg4Qr2GgAA/RoAAAgbExsaGwAAIRs7GwAAAAA+G2IbmRuVG6sbAACyG80b0htjAHUAdABlADuA7QDtQAChYyBpeQEbBhtyAGMAO4DuAO5AOGQAAWN4CxsNG3kANWRjAGwAO4ChAKFAAAFmcssCFhsA4DXYJt1yAGEAdgBlADuA7ADsQIChSCFpbm8AJxsyGzYbAAFpbisbLxtuAHQAAKAMKnQAAKAtIuYhaW4AoNwpdABhAACgKSHsIWlnM2GAAWFvcABDG1sbXhuAAWNndABJG0sbWRtyACthgAFlbHAAcQVRG1UbaQBuAOUAyAVhAHIA9AByBWgAMWFmAACgtyJlAGQAtWEAoggiY2ZvdGkbbRt1G3kb4SFyZQCgBSFpAG4AdKAeImkAZQAAoN0pZABvAPQAWxsAoisiY2VscIEbhRuPG5QbYQBsAACguiIAAWdyiRuNG2UAcgDzACMQ4wCCG2EicmhrAACgFyryIW9kAKA8KgACY2dwdJ8boRukG6gbeQBRZG8AbgAvYWYAAOA12FrdYQC5Y3UAZQBzAHQAO4C/AL9AAAFjabUbuRtyAADgNdi+3G4AAKIIIkVkc3bCG8QbyBvQAwCg+SJvAHQAAKD1Inag9CIAoPMiaaBiIOwhZGUpYesB1hsAANkbYwB5AFZkbAA7gO8A70AAA2NmbW9zdeYb7hvyG/Ub+hsFHAABaXnqG+0bcgBjADVhOWRyAADgNdgn3eEhdGg3YnAAZgAA4DXYW93jAf8bAAADHHIAAOA12L/c8iFjeVhk6yFjeVRkAARhY2ZnaGpvcxUcGhwiHCYcKhwtHDAcNRzwIXBhdqC6A/BjAAFleR4cIRzkIWlsN2E6ZHIAAOA12CjdciJlZW4AOGFjAHkARWRjAHkAXGRwAGYAAOA12FzdYwByAADgNdjA3IALQUJFSGFiY2RlZmdoamxtbm9wcnN0dXYAXhxtHHEcdRx5HN8cBx0dHTwd3B3tHfEdAR4EHh0eLB5FHrwewx7hHgkfPR9LH4ABYXJ0AGQcZxxpHHIA8gBvB/IAxQLhIWlsAKAbKeEhcnIAoA4pZ6BmIgCgiyphAHIAAKBiKWMJjRwAAJAcAACVHAAAAAAAAAAAAACZHJwcAACmHKgcrRwAANIc9SF0ZTph7SJwdHl2AKC0KXIAYQDuAFoG4iFkYbtjZwAAoegnZGyhHKMcAKCRKeUAiwYAoIUqdQBvADuAqwCrQHIAgKOQIWJmaGxwc3QAuhy/HMIcxBzHHMoczhxmoOQhcwAAoB8pcwAAoB0p6wCyGnAAAKCrIWwAAKA5KWkAbQAAoHMpbAAAoKIhAKGrKmFl1hzaHGkAbAAAoBkpc6CtKgDgrSoA/oABYWJyAOUc6RztHHIAcgAAoAwpcgBrAACgcicAAWFr8Rz4HGMAAAFla/Yc9xx7YFtgAAFlc/wc/hwAoIspbAAAAWR1Ax0FHQCgjykAoI0pAAJhZXV5Dh0RHRodHB3yIW9uPmEAAWRpFR0YHWkAbAA8YewAowbiAPccO2QAAmNxcnMkHScdLB05HWEAAKA2KXUAbwDyoBwgqhEAAWR1MB00HeghYXIAoGcpcyJoYXIAAKBLKWgAAKCyIQCiZCJmZ3FzRB1FB5Qdnh10AIACYWhscnQATh1WHWUdbB2NHXIicm93AHSgkCFhAOkAzxxhI3Jwb29uAAABZHVeHWId7yF3bgCgvSFwAACgvCHlJGZ0YXJyb3dzAKDHIWkiZ2h0AIABYWhzAHUdex2DHXIicm93APOglCGdBmEAcgBwAG8AbwBuAPMAzgtxAHUAaQBnAGEAcgByAG8A9wBlGugkcmVldGltZXMAoMsi8aFkIk0HAACaHWwAYQBuAPQAXgcAon0qY2Rnc6YdqR2xHbcdYwAAoKgqbwB0AG+gfypyoIEqAKCDKmXg2iIA/nMAAKCTKoACYWRlZ3MAwB3GHcod1h3ZHXAAcAByAG8A+ACmHG8AdAAAoNYicQAAAWdxzx3SHXQA8gBGB2cAdADyAHQcdADyAFMHaQDtAGMHgAFpbHIA4h3mHeod8yFodACgfClvAG8A8gDKBgDgNdgp3UWgdiIAoJEqYQH1Hf4dcgAAAWR1YB35HWygvCEAoGopbABrAACghCVjAHkAWWQAomoiYWNodAweDx4VHhkecgDyAGsdbwByAG4AZQDyAGAW4SFyZACgaylyAGkAAKD6JQABaW8hHiQe5CFvdEBh9SFzdGGgsCPjIWhlAKCwIwACRWFlczMeNR48HkEeAKBoInAAcKCJKvIhb3gAoIkqcaCHKvGghyo0HmkAbQAAoOYiAARhYm5vcHR3elIeXB5fHoUelh6mHqsetB4AAW5yVh5ZHmcAAKDsJ3IAAKD9IXIA6wCwBmcAgAFsbXIAZh52Hnse5SFmdAABYXKIB2weaQBnAGgAdABhAHIAcgBvAPcAkwfhInBzdG8AoPwnaQBnAGgAdABhAHIAcgBvAPcAmgdwI2Fycm93AAABbHKNHpEeZQBmAPQAxhxpImdodAAAoKwhgAFhZmwAnB6fHqIecgAAoIUpAOA12F3ddQBzAACgLSppIm1lcwAAoDQqYQGvHrMecwB0AACgFyLhAIoOZaHKJbkeRhLuIWdlAKDKJWEAcgBsoCgAdAAAoJMpgAJhY2htdADMHs8e1R7bHt0ecgDyAJ0GbwByAG4AZQDyANYWYQByAGSgyyEAoG0pAKAOIHIAaQAAoL8iAANhY2hpcXTrHu8e1QfzHv0eBh/xIXVvAKA5IHIAAOA12MHcbQDloXIi+h4AAPweAKCNKgCgjyoAAWJ19xwBH28AcqAYIACgGiDyIW9rQmEAhDwAO2NkaGlscXJCBhcfxh0gHyQfKB8sHzEfAAFjaRsfHR8AoKYqcgAAoHkqcgBlAOUAkx3tIWVzAKDJIuEhcnIAoHYpdSJlc3QAAKB7KgABUGk1HzkfYQByAACglillocMlAgdfEnIAAAFkdUIfRx9zImhhcgAAoEop6CFhcgCgZikAAWVuTx9WH3IjdG5lcXEAAOBoIgD+xQBUHwAHRGFjZGVmaGlsbm9wc3VuH3Ifoh+rH68ftx+7H74f5h/uH/MfBwj/HwsgxCFvdACgOiIAAmNscHJ5H30fiR+eH3IAO4CvAK9AAAFldIEfgx8AoEImZaAgJ3MAZQAAoCAnc6CmIXQAbwCAoaYhZGx1AJQfmB+cH28AdwDuAHkDZQBmAPQA6gbwAOkO6yFlcgCgriUAAW95ph+qH+0hbWEAoCkqPGThIXNoAKAUIOElc3VyZWRhbmdsZQCgISJyAADgNdgq3W8AAKAnIYABY2RuAMQfyR/bH3IAbwA7gLUAtUBhoiMi0B8AANMf1x9zAPQAKxFpAHIAAKDwKm8AdAA7gLcAt0B1AHMA4qESIh4TAADjH3WgOCIAoCoqYwHqH+0fcAAAoNsq8gB+GnAAbAB1APMACAgAAWRw9x/7H+UhbHMAoKciZgAA4DXYXt0AAWN0AyAHIHIAAOA12MLc8CFvcwCgPiJsobwDECAVIPQiaW1hcACguCJhAPAAEyAADEdMUlZhYmNkZWZnaGlqbG1vcHJzdHV2dzwgRyBmIG0geSCqILgg2iDeIBEhFSEyIUMhTSFQIZwhnyHSIQAiIyKLIrEivyIUIwABZ3RAIEMgAODZIjgD9uBrItIgBwmAAWVsdABNIF8gYiBmAHQAAAFhclMgWCByInJvdwAAoM0h6SRnaHRhcnJvdwCgziEA4NgiOAP24Goi0iBfCekkZ2h0YXJyb3cAoM8hAAFEZHEgdSDhIXNoAKCvIuEhc2gAoK4igAJiY25wdACCIIYgiSCNIKIgbABhAACgByL1IXRlRGFnAADgICLSIACiSSJFaW9wlSCYIJwgniAA4HAqOANkAADgSyI4A3MASWFyAG8A+AAyCnUAcgBhoG4mbADzoG4mmwjzAa8gAACzIHAAO4CgAKBAbQBwAOXgTiI4AyoJgAJhZW91eQDBIMogzSDWINkg8AHGIAAAyCAAoEMqbwBuAEhh5CFpbEZhbgBnAGSgRyJvAHQAAOBtKjgDcAAAoEIqPWThIXNoAKATIACjYCJBYWRxc3jpIO0g+SD+IAIhDCFyAHIAAKDXIXIAAAFocvIg9SBrAACgJClvoJch9wAGD28AdAAA4FAiOAN1AGkA9gC7CAABZWkGIQohYQByAACgKCntAN8I6SFzdPOgBCLlCHIAAOA12CvdAAJFZXN0/wgcISshLiHxoXEiIiEAABMJ8aFxIgAJAAAnIWwAYQBuAPQAEwlpAO0AGQlyoG8iAKBvIoABQWFwADghOyE/IXIA8gBeIHIAcgAAoK4hYQByAACg8ipzogsiSiEAAAAAxwtkoPwiAKD6ImMAeQBaZIADQUVhZGVzdABcIV8hYiFmIWkhkyGWIXIA8gBXIADgZiI4A3IAcgAAoJohcgAAoCUggKFwImZxcwBwIYQhjiF0AAABYXJ1IXohcgByAG8A9wBlIWkAZwBoAHQAYQByAHIAbwD3AD4h8aFwImAhAACKIWwAYQBuAPQAZwlz4H0qOAMAoG4iaQDtAG0JcqBuImkA5aDqIkUJaQDkADoKAAFwdKMhpyFmAADgNdhf3YCBrAA7aW4AriGvIcchrEBuAIChCSJFZHYAtyG6Ib8hAOD5IjgDbwB0AADg9SI4A+EB1gjEIcYhAKD3IgCg9iJpAHagDCLhAagJzyHRIQCg/iIAoP0igAFhb3IA2CHsIfEhcgCAoSYiYXN0AOAh5SHpIWwAbABlAOwAywhsAADg/SrlIADgAiI4A2wiaW50AACgFCrjoYAi9yEAAPohdQDlAJsJY+CvKjgDZaCAIvEAkwkAAkFhaXQHIgoiFyIeInIA8gBsIHIAcgAAoZshY3cRIhQiAOAzKTgDAOCdITgDZyRodGFycm93AACgmyFyAGkA5aDrIr4JgANjaGltcHF1AC8iPCJHIpwhTSJQIloigKGBImNlcgA2Iv0JOSJ1AOUABgoA4DXYw9zvIXJ0bQKdIQAAAABEImEAcgDhAOEhbQBloEEi8aBEIiYKYQDyAMsIcwB1AAABYnBWIlgi5QDUCeUA3wmAAWJjcABgInMieCKAoYQiRWVzAGci7glqIgDgxSo4A2UAdABl4IIi0iBxAPGgiCJoImMAZaCBIvEA/gmAoYUiRWVzAH8iFgqCIgDgxio4A2UAdABl4IMi0iBxAPGgiSKAIgACZ2lscpIilCKaIpwi7AAMCWwAZABlADuA8QDxQOcAWwlpI2FuZ2xlAAABbHKkIqoi5SFmdGWg6iLxAEUJaSJnaHQAZaDrIvEAvgltoL0DAKEjAGVzuCK8InIAbwAAoBYhcAAAoAcggARESGFkZ2lscnMAziLSItYi2iLeIugi7SICIw8j4SFzaACgrSLhIXJyAKAEKXAAAOBNItIg4SFzaACgrCIAAWV04iLlIgDgZSLSIADgPgDSIG4iZmluAACg3imAAUFldADzIvci+iJyAHIAAKACKQDgZCLSIHLgPADSIGkAZQAA4LQi0iAAAUF0BiMKI3IAcgAAoAMp8iFpZQDgtSLSIGkAbQAA4Dwi0iCAAUFhbgAaIx4jKiNyAHIAAKDWIXIAAAFociMjJiNrAACgIylvoJYh9wD/DuUhYXIAoCcpUxJqFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVCMAAF4jaSN/I4IjjSOeI8AUAAAAAKYjwCMAANoj3yMAAO8jHiQvJD8kRCQAAWNzVyNsFHUAdABlADuA8wDzQAABaXlhI2cjcgBjoJoiO4D0APRAPmSAAmFiaW9zAHEjdCN3I3EBeiNzAOgAdhTsIWFjUWF2AACgOCrvIWxkAKC8KewhaWdTYQABY3KFI4kjaQByAACgvykA4DXYLN1vA5QjAAAAAJYjAACcI24A22JhAHYAZQA7gPIA8kAAoMEpAAFibaEjjAphAHIAAKC1KQACYWNpdKwjryO6I70jcgDyAFkUAAFpcrMjtiNyAACgvinvIXNzAKC7KW4A5QDZCgCgwCmAAWFlaQDFI8gjyyNjAHIATWFnAGEAyWOAAWNkbgDRI9Qj1iPyIW9uv2MAoLYpdQDzAHgBcABmAADgNdhg3YABYWVsAOQj5yPrI3IAAKC3KXIAcAAAoLkpdQDzAHwBAKMoImFkaW9zdvkj/CMPJBMkFiQbJHIA8gBeFIChXSplZm0AAyQJJAwkcgBvoDQhZgAAoDQhO4CqAKpAO4C6ALpA5yFvZgCgtiJyAACgVipsIm9wZQAAoFcqAKBbKoABY2xvACMkJSQrJPIACCRhAHMAaAA7gPgA+EBsAACgmCJpAGwBMyQ4JGQAZQA7gPUA9UBlAHMAYaCXInMAAKA2Km0AbAA7gPYA9kDiIWFyAKA9I+EKXiQAAHokAAB8JJQkAACYJKkkAAAAALUkEQsAAPAkAAAAAAQleiUAAIMlcgCAoSUiYXN0AGUkbyQBCwCBtgA7bGokayS2QGwAZQDsABgDaQJ1JAAAAAB4JG0AAKDzKgCg/Sp5AD9kcgCAAmNpbXB0AIUkiCSLJJkSjyRuAHQAJWBvAGQALmBpAGwAAKAwIOUhbmsAoDEgcgAA4DXYLd2AAWltbwCdJKAkpCR2oMYD1WNtAGEA9AD+B24AZQAAoA4m9KHAA64kAAC0JGMjaGZvcmsAAKDUItZjAAFhdbgkxCRuAAABY2u9JMIkawBooA8hAKAOIfYAaRpzAACkKwBhYmNkZW1zdNMkIRPXJNsk4STjJOck6yTjIWlyAKAjKmkAcgAAoCIqAAFvdYsW3yQAoCUqAKByKm4AO4CxALFAaQBtAACgJip3AG8AAKAnKoABaXB1APUk+iT+JO4idGludACgFSpmAADgNdhh3W4AZAA7gKMAo0CApHoiRWFjZWlub3N1ABMlFSUYJRslTCVRJVklSSV1JQCgsypwAACgtyp1AOUAPwtjoK8qgKJ6ImFjZW5zACclLSU0JTYlSSVwAHAAcgBvAPgAFyV1AHIAbAB5AGUA8QA/C/EAOAuAAWFlcwA8JUElRSXwInByb3gAoLkqcQBxAACgtSppAG0AAKDoImkA7QBEC20AZQDzoDIgIguAAUVhcwBDJVclRSXwAEAlgAFkZnAATwtfJXElgAFhbHMAZSVpJW0l7CFhcgCgLiPpIW5lAKASI/UhcmYAoBMjdKAdIu8AWQvyIWVsAKCwIgABY2l9JYElcgAA4DXYxdzIY24iY3NwAACgCCAAA2Zpb3BzdZElKxuVJZolnyWkJXIAAOA12C7dcABmAADgNdhi3XIiaW1lAACgVyBjAHIAAOA12MbcgAFhZW8AqiW6JcAldAAAAWVpryW2JXIAbgBpAG8AbgDzABkFbgB0AACgFipzAHQAZaA/APEACRj0AG0LgApBQkhhYmNkZWZoaWxtbm9wcnN0dXgA4yXyJfYl+iVpJpAmpia9JtUm5ib4JlonaCdxJ3UnnietJ7EnyCfiJ+cngAFhcnQA6SXsJe4lcgDyAJkM8gD6AuEhaWwAoBwpYQByAPIA3BVhAHIAAKBkKYADY2RlbnFydAAGJhAmEyYYJiYmKyZaJgABZXUKJg0mAOA9IjEDdABlAFVhaQDjACAN7SJwdHl2AKCzKWcAgKHpJ2RlbAAgJiImJCYAoJIpAKClKeUA9wt1AG8AO4C7ALtAcgAApZIhYWJjZmhscHN0dz0mQCZFJkcmSiZMJk4mUSZVJlgmcAAAoHUpZqDlIXMAAKAgKQCgMylzAACgHinrALka8ACVHmwAAKBFKWkAbQAAoHQpbAAAoKMhAKCdIQABYWleJmImaQBsAACgGilvAG6gNiJhAGwA8wB2C4ABYWJyAG8mciZ2JnIA8gAvEnIAawAAoHMnAAFha3omgSZjAAABZWt/JoAmfWBdYAABZXOFJocmAKCMKWwAAAFkdYwmjiYAoI4pAKCQKQACYWV1eZcmmiajJqUm8iFvbllhAAFkaZ4moSZpAGwAV2HsAA8M4gCAJkBkAAJjbHFzrSawJrUmuiZhAACgNylkImhhcgAAoGkpdQBvAPKgHSCjAWgAAKCzIYABYWNnAMMm0iaUC2wAgKEcIWlwcwDLJs4migxuAOUAoAxhAHIA9ADaC3QAAKCtJYABaWxyANsm3ybjJvMhaHQAoH0pbwBvAPIANgwA4DXYL90AAWFv6ib1JnIAAAFkde8m8SYAoMEhbKDAIQCgbCl2oMED8WOAAWducwD+Jk4nUCdoAHQAAANhaGxyc3QKJxInISc1Jz0nRydyInJvdwB0oJIhYQDpAFYmYSNycG9vbgAAAWR1GiceJ28AdwDuAPAmcAAAoMAh5SFmdAABYWgnJy0ncgByAG8AdwDzAAkMYQByAHAAbwBvAG4A8wATBGklZ2h0YXJyb3dzAACgySFxAHUAaQBnAGEAcgByAG8A9wBZJugkcmVldGltZXMAoMwiZwDaYmkAbgBnAGQAbwB0AHMAZQDxABwYgAFhaG0AYCdjJ2YncgDyAAkMYQDyABMEAKAPIG8idXN0AGGgsSPjIWhlAKCxI+0haWQAoO4qAAJhYnB0fCeGJ4knmScAAW5ygCeDJ2cAAKDtJ3IAAKD+IXIA6wAcDIABYWZsAI8nkieVJ3IAAKCGKQDgNdhj3XUAcwAAoC4qaSJtZXMAAKA1KgABYXCiJ6gncgBnoCkAdAAAoJQp7yJsaW50AKASKmEAcgDyADwnAAJhY2hxuCe8J6EMwCfxIXVvAKA6IHIAAOA12MfcAAFidYAmxCdvAPKgGSCoAYABaGlyAM4n0ifWJ3IAZQDlAE0n7SFlcwCgyiJpAIChuSVlZmwAXAxjEt4n9CFyaQCgzinsInVoYXIAoGgpAKAeIWENBSgJKA0oSyhVKIYoAACLKLAoAAAAAOMo5ygAABApJCkxKW0pcSmHKaYpAACYKgAAAACxKmMidXRlAFthcQB1AO8ABR+ApHsiRWFjZWlucHN5ABwoHignKCooLygyKEEoRihJKACgtCrwASMoAAAlKACguCpvAG4AYWF1AOUAgw1koLAqaQBsAF9hcgBjAF1hgAFFYXMAOCg6KD0oAKC2KnAAAKC6KmkAbQAAoOki7yJsaW50AKATKmkA7QCIDUFkbwB0AGKixSKRFgAAAABTKACgZiqAA0FhY21zdHgAYChkKG8ocyh1KHkogihyAHIAAKDYIXIAAAFocmkoayjrAJAab6CYIfcAzAd0ADuApwCnQGkAO2D3IWFyAKApKW0AAAFpbn4ozQBuAHUA8wDOAHQAAKA2J3IA7+A12DDdIxkAAmFjb3mRKJUonSisKHIAcAAAoG8mAAFoeZkonChjAHkASWRIZHIAdABtAqUoAAAAAKgoaQDkAFsPYQByAGEA7ABsJDuArQCtQAABZ22zKLsobQBhAAChwwNmdroouijCY4CjPCJkZWdsbnByAMgozCjPKNMo1yjaKN4obwB0AACgairxoEMiCw5FoJ4qAKCgKkWgnSoAoJ8qZQAAoEYi7CF1cwCgJCrhIXJyAKByKWEAcgDyAPwMAAJhZWl07Sj8KAEpCCkAAWxz8Sj4KGwAcwBlAHQAbQDpAH8oaABwAACgMyrwImFyc2wAoOQpAAFkbFoPBSllAACgIyNloKoqc6CsKgDgrCoA/oABZmxwABUpGCkfKfQhY3lMZGKgLwBhoMQpcgAAoD8jZgAA4DXYZN1hAAABZHIoKRcDZQBzAHWgYCZpAHQAAKBgJoABY3N1ADYpRilhKQABYXU6KUApcABzoJMiAOCTIgD+cABzoJQiAOCUIgD+dQAAAWJwSylWKQChjyJlcz4NUCllAHQAZaCPIvEAPw0AoZAiZXNIDVspZQB0AGWgkCLxAEkNAKGhJWFmZilbBHIAZQFrKVwEAKChJWEAcgDyAAMNAAJjZW10dyl7KX8pgilyAADgNdjI3HQAbQDuAM4AaQDsAAYpYQByAOYAVw0AAWFyiimOKXIA5qAGJhESAAFhbpIpoylpImdodAAAAWVwmSmgKXAAcwBpAGwAbwDuANkXaADpAKAkcwCvYIACYmNtbnAArin8KY4NJSooKgCkgiJFZGVtbnByc7wpvinCKcgpzCnUKdgp3CkAoMUqbwB0AACgvSpkoIYibwB0AACgwyr1IWx0AKDBKgABRWXQKdIpAKDLKgCgiiLsIXVzAKC/KuEhcnIAoHkpgAFlaXUA4inxKfQpdAAAoYIiZW7oKewpcQDxoIYivSllAHEA8aCKItEpbQAAoMcqAAFicPgp+ikAoNUqAKDTKmMAgKJ7ImFjZW5zAAcqDSoUKhYqRihwAHAAcgBvAPgAIyh1AHIAbAB5AGUA8QCDDfEAfA2AAWFlcwAcKiIqPShwAHAAcgBvAPgAPChxAPEAOShnAACgaiYApoMiMTIzRWRlaGxtbnBzPCo/KkIqRSpHKlIqWCpjKmcqaypzKncqO4C5ALlAO4CyALJAO4CzALNAAKDGKgABb3NLKk4qdAAAoL4qdQBiAACg2CpkoIcibwB0AACgxCpzAAABb3VdKmAqbAAAoMknYgAAoNcq4SFycgCgeyn1IWx0AKDCKgABRWVvKnEqAKDMKgCgiyLsIXVzAKDAKoABZWl1AH0qjCqPKnQAAKGDImVugyqHKnEA8aCHIkYqZQBxAPGgiyJwKm0AAKDIKgABYnCTKpUqAKDUKgCg1iqAAUFhbgCdKqEqrCpyAHIAAKDZIXIAAAFocqYqqCrrAJUab6CZIfcAxQf3IWFyAKAqKWwAaQBnADuA3wDfQOELzyrZKtwq6SrsKvEqAAD1KjQrAAAAAAAAAAAAAEwrbCsAAHErvSsAAAAAAADRK3IC1CoAAAAA2CrnIWV0AKAWI8RjcgDrAOUKgAFhZXkA4SrkKucq8iFvbmVh5CFpbGNhQmRvAPQAIg5sInJlYwAAoBUjcgAA4DXYMd0AAmVpa2/7KhIrKCsuK/IBACsAAAkrZQAAATRm6g0EK28AcgDlAOsNYQBzorgDECsAAAAAEit5AG0A0WMAAWNuFislK2sAAAFhcxsrIStwAHAAcgBvAPgAFw5pAG0AAKA8InMA8AD9DQABYXMsKyEr8AAXDnIAbgA7gP4A/kDsATgrOyswG2QA5QBnAmUAcwCAgdcAO2JkAEMrRCtJK9dAYaCgInIAAKAxKgCgMCqAAWVwcwBRK1MraSvhAAkh4qKkIlsrXysAAAAAYytvAHQAAKA2I2kAcgAAoPEqb+A12GXdcgBrAACg2irhAHgociJpbWUAAKA0IIABYWlwAHYreSu3K2QA5QC+DYADYWRlbXBzdACFK6MrmiunK6wrsCuzK24iZ2xlAACitSVkbHFykCuUK5ornCvvIXduAKC/JeUhZnRloMMl8QACBwCgXCJpImdodABloLkl8QBdDG8AdAAAoOwlaSJudXMAAKA6KuwhdXMAoDkqYgAAoM0p6SFtZQCgOyrlInppdW0AoOIjgAFjaHQAwivKK80rAAFyecYrySsA4DXYydxGZGMAeQBbZPIhb2tnYQABaW/UK9creAD0ANERaCJlYWQAAAFsct4r5ytlAGYAdABhAHIAcgBvAPcAXQbpJGdodGFycm93AKCgIQAJQUhhYmNkZmdobG1vcHJzdHV3CiwNLBEsHSwnLDEsQCxLLFIsYix6LIQsjyzLLOgs7Sz/LAotcgDyAAkDYQByAACgYykAAWNyFSwbLHUAdABlADuA+gD6QPIACQ1yAOMBIywAACUseQBeZHYAZQBtYQABaXkrLDAscgBjADuA+wD7QENkgAFhYmgANyw6LD0scgDyANEO7CFhY3FhYQDyAOAOAAFpckQsSCzzIWh0AKB+KQDgNdgy3XIAYQB2AGUAO4D5APlAYQFWLF8scgAAAWxyWixcLACgvyEAoL4hbABrAACggCUAAWN0Zix2LG8CbCwAAAAAcyxyAG4AZaAcI3IAAKAcI28AcAAAoA8jcgBpAACg+CUAAWFsfiyBLGMAcgBrYTuAqACoQAABZ3CILIssbwBuAHNhZgAA4DXYZt0AA2FkaGxzdZksniynLLgsuyzFLHIAcgBvAPcACQ1vAHcAbgBhAHIAcgBvAPcA2A5hI3Jwb29uAAABbHKvLLMsZQBmAPQAWyxpAGcAaAD0AF0sdQDzAKYOaQAAocUDaGzBLMIs0mNvAG4AxWPwI2Fycm93cwCgyCGAAWNpdADRLOEs5CxvAtcsAAAAAN4scgBuAGWgHSNyAACgHSNvAHAAAKAOI24AZwBvYXIAaQAAoPklYwByAADgNdjK3IABZGlyAPMs9yz6LG8AdAAAoPAi7CFkZWlhaQBmoLUlAKC0JQABYW0DLQYtcgDyAMosbAA7gPwA/EDhIm5nbGUAoKcpgAdBQkRhY2RlZmxub3Byc3oAJy0qLTAtNC2bLZ0toS2/LcMtxy3TLdgt3C3gLfwtcgDyABADYQByAHag6CoAoOkqYQBzAOgA/gIAAW5yOC08LechcnQAoJwpgANla25wcnN0AJkpSC1NLVQtXi1iLYItYQBwAHAA4QAaHG8AdABoAGkAbgDnAKEXgAFoaXIAoSmzJFotbwBwAPQAdCVooJUh7wD4JgABaXVmLWotZwBtAOEAuygAAWJwbi14LXMjZXRuZXEAceCKIgD+AODLKgD+cyNldG5lcQBx4IsiAP4A4MwqAP4AAWhyhi2KLWUAdADhABIraSNhbmdsZQAAAWxyki2WLeUhZnQAoLIiaSJnaHQAAKCzInkAMmThIXNoAKCiIoABZWxyAKcttC24LWKiKCKuLQAAAACyLWEAcgAAoLsicQAAoFoi7CFpcACg7iIAAWJ0vC1eD2EA8gBfD3IAAOA12DPddAByAOkAlS1zAHUAAAFicM0t0C0A4IIi0iAA4IMi0iBwAGYAAOA12GfdcgBvAPAAWQt0AHIA6QCaLQABY3XkLegtcgAA4DXYy9wAAWJw7C30LW4AAAFFZXUt8S0A4IoiAP5uAAABRWV/LfktAOCLIgD+6SJnemFnAKCaKYADY2Vmb3BycwANLhAuJS4pLiMuLi40LukhcmN1YQABZGkULiEuAAFiZxguHC5hAHIAAKBfKmUAcaAnIgCgWSLlIXJwAKAYIXIAAOA12DTdcABmAADgNdho3WWgQCJhAHQA6ABqD2MAcgAA4DXYzNzjCuQRUC4AAFQuAABYLmIuAAAAAGMubS5wLnQuAAAAAIguki4AAJouJxIqEnQAcgDpAB0ScgAA4DXYNd0AAUFhWy5eLnIA8gDnAnIA8gCTB75jAAFBYWYuaS5yAPIA4AJyAPIAjAdhAPAAeh5pAHMAAKD7IoABZHB0APgReS6DLgABZmx9LoAuAOA12GnddQDzAP8RaQBtAOUABBIAAUFhiy6OLnIA8gDuAnIA8gCaBwABY3GVLgoScgAA4DXYzdwAAXB0nS6hLmwAdQDzACUScgDpACASAARhY2VmaW9zdbEuvC7ELsguzC7PLtQu2S5jAAABdXm2LrsudABlADuA/QD9QE9kAAFpecAuwy5yAGMAd2FLZG4AO4ClAKVAcgAA4DXYNt1jAHkAV2RwAGYAAOA12GrdYwByAADgNdjO3AABY23dLt8ueQBOZGwAO4D/AP9AAAVhY2RlZmhpb3N38y73Lv8uAi8MLxAvEy8YLx0vIi9jInV0ZQB6YQABYXn7Lv4u8iFvbn5hN2RvAHQAfGEAAWV0Bi8KL3QAcgDmAB8QYQC2Y3IAAOA12DfdYwB5ADZk5yJyYXJyAKDdIXAAZgAA4DXYa91jAHIAAOA12M/cAAFqbiYvKC8AoA0gagAAoAwg");
var X;
(function(t) {
  t[t.VALUE_LENGTH = 49152] = "VALUE_LENGTH", t[t.FLAG13 = 8192] = "FLAG13", t[t.BRANCH_LENGTH = 8064] = "BRANCH_LENGTH", t[t.JUMP_TABLE = 127] = "JUMP_TABLE";
})(X || (X = {}));
var v;
(function(t) {
  t[t.NUM = 35] = "NUM", t[t.SEMI = 59] = "SEMI", t[t.EQUALS = 61] = "EQUALS", t[t.ZERO = 48] = "ZERO", t[t.NINE = 57] = "NINE", t[t.LOWER_A = 97] = "LOWER_A", t[t.LOWER_F = 102] = "LOWER_F", t[t.LOWER_X = 120] = "LOWER_X", t[t.LOWER_Z = 122] = "LOWER_Z", t[t.UPPER_A = 65] = "UPPER_A", t[t.UPPER_F = 70] = "UPPER_F", t[t.UPPER_Z = 90] = "UPPER_Z";
})(v || (v = {}));
const zu = 32;
function ei(t) {
  return t >= v.ZERO && t <= v.NINE;
}
function Z0(t) {
  return t >= v.UPPER_A && t <= v.UPPER_F || t >= v.LOWER_A && t <= v.LOWER_F;
}
function Y0(t) {
  return t >= v.UPPER_A && t <= v.UPPER_Z || t >= v.LOWER_A && t <= v.LOWER_Z || ei(t);
}
function H0(t) {
  return t === v.EQUALS || Y0(t);
}
var Q;
(function(t) {
  t[t.EntityStart = 0] = "EntityStart", t[t.NumericStart = 1] = "NumericStart", t[t.NumericDecimal = 2] = "NumericDecimal", t[t.NumericHex = 3] = "NumericHex", t[t.NamedEntity = 4] = "NamedEntity";
})(Q || (Q = {}));
var Pe;
(function(t) {
  t[t.Legacy = 0] = "Legacy", t[t.Strict = 1] = "Strict", t[t.Attribute = 2] = "Attribute";
})(Pe || (Pe = {}));
let V0 = class {
  constructor(e, n, r) {
    O(this, "decodeTree");
    O(this, "emitCodePoint");
    O(this, "errors");
    /** The current state of the decoder. */
    O(this, "state", Q.EntityStart);
    /** Characters that were consumed while parsing an entity. */
    O(this, "consumed", 1);
    /**
     * The result of the entity.
     *
     * Either the result index of a numeric entity, or the codepoint of a
     * numeric entity.
     */
    O(this, "result", 0);
    /** The current index in the decode tree. */
    O(this, "treeIndex", 0);
    /** The number of characters that were consumed in excess. */
    O(this, "excess", 1);
    /** The mode in which the decoder is operating. */
    O(this, "decodeMode", Pe.Strict);
    /** The number of characters that have been consumed in the current run. */
    O(this, "runConsumed", 0);
    this.decodeTree = e, this.emitCodePoint = n, this.errors = r;
  }
  /**
   * Resets the instance to make it reusable.
   * @param decodeMode Entity decoding mode to use.
   */
  startEntity(e) {
    this.decodeMode = e, this.state = Q.EntityStart, this.result = 0, this.treeIndex = 0, this.excess = 1, this.consumed = 1, this.runConsumed = 0;
  }
  /**
   * Write an entity to the decoder. This can be called multiple times with partial entities.
   * If the entity is incomplete, the decoder will return -1.
   *
   * Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
   * entity is incomplete, and resume when the next string is written.
   * @param input The string containing the entity (or a continuation of the entity).
   * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  write(e, n) {
    switch (this.state) {
      case Q.EntityStart:
        return e.charCodeAt(n) === v.NUM ? (this.state = Q.NumericStart, this.consumed += 1, this.stateNumericStart(e, n + 1)) : (this.state = Q.NamedEntity, this.stateNamedEntity(e, n));
      case Q.NumericStart:
        return this.stateNumericStart(e, n);
      case Q.NumericDecimal:
        return this.stateNumericDecimal(e, n);
      case Q.NumericHex:
        return this.stateNumericHex(e, n);
      case Q.NamedEntity:
        return this.stateNamedEntity(e, n);
    }
  }
  /**
   * Switches between the numeric decimal and hexadecimal states.
   *
   * Equivalent to the `Numeric character reference state` in the HTML spec.
   * @param input The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericStart(e, n) {
    return n >= e.length ? -1 : (e.charCodeAt(n) | zu) === v.LOWER_X ? (this.state = Q.NumericHex, this.consumed += 1, this.stateNumericHex(e, n + 1)) : (this.state = Q.NumericDecimal, this.stateNumericDecimal(e, n));
  }
  /**
   * Parses a hexadecimal numeric entity.
   *
   * Equivalent to the `Hexademical character reference state` in the HTML spec.
   * @param input The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericHex(e, n) {
    for (; n < e.length; ) {
      const r = e.charCodeAt(n);
      if (ei(r) || Z0(r)) {
        const i = r <= v.NINE ? r - v.ZERO : (r | zu) - v.LOWER_A + 10;
        this.result = this.result * 16 + i, this.consumed++, n++;
      } else
        return this.emitNumericEntity(r, 3);
    }
    return -1;
  }
  /**
   * Parses a decimal numeric entity.
   *
   * Equivalent to the `Decimal character reference state` in the HTML spec.
   * @param input The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericDecimal(e, n) {
    for (; n < e.length; ) {
      const r = e.charCodeAt(n);
      if (ei(r))
        this.result = this.result * 10 + (r - v.ZERO), this.consumed++, n++;
      else
        return this.emitNumericEntity(r, 2);
    }
    return -1;
  }
  /**
   * Validate and emit a numeric entity.
   *
   * Implements the logic from the `Hexademical character reference start
   * state` and `Numeric character reference end state` in the HTML spec.
   * @param lastCp The last code point of the entity. Used to see if the
   *               entity was terminated with a semicolon.
   * @param expectedLength The minimum number of characters that should be
   *                       consumed. Used to validate that at least one digit
   *                       was consumed.
   * @returns The number of characters that were consumed.
   */
  emitNumericEntity(e, n) {
    var r;
    if (this.consumed <= n)
      return (r = this.errors) == null || r.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
    if (e === v.SEMI)
      this.consumed += 1;
    else if (this.decodeMode === Pe.Strict)
      return 0;
    return this.emitCodePoint(J0(this.result), this.consumed), this.errors && (e !== v.SEMI && this.errors.missingSemicolonAfterCharacterReference(), this.errors.validateNumericCharacterReference(this.result)), this.consumed;
  }
  /**
   * Parses a named entity.
   *
   * Equivalent to the `Named character reference state` in the HTML spec.
   * @param input The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNamedEntity(e, n) {
    const { decodeTree: r } = this;
    let i = r[this.treeIndex], u = (i & X.VALUE_LENGTH) >> 14;
    for (; n < e.length; ) {
      if (u === 0 && i & X.FLAG13) {
        const s = (i & X.BRANCH_LENGTH) >> 7;
        if (this.runConsumed === 0) {
          const l = i & X.JUMP_TABLE;
          if (e.charCodeAt(n) !== l)
            return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
          n++, this.excess++, this.runConsumed++;
        }
        for (; this.runConsumed < s; ) {
          if (n >= e.length)
            return -1;
          const l = this.runConsumed - 1, c = r[this.treeIndex + 1 + (l >> 1)], a = l % 2 === 0 ? c & 255 : c >> 8 & 255;
          if (e.charCodeAt(n) !== a)
            return this.runConsumed = 0, this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
          n++, this.excess++, this.runConsumed++;
        }
        this.runConsumed = 0, this.treeIndex += 1 + (s >> 1), i = r[this.treeIndex], u = (i & X.VALUE_LENGTH) >> 14;
      }
      if (n >= e.length)
        break;
      const o = e.charCodeAt(n);
      if (o === v.SEMI && u !== 0 && i & X.FLAG13)
        return this.emitNamedEntityData(this.treeIndex, u, this.consumed + this.excess);
      if (this.treeIndex = $0(r, i, this.treeIndex + Math.max(1, u), o), this.treeIndex < 0)
        return this.result === 0 || // If we are parsing an attribute
        this.decodeMode === Pe.Attribute && // We shouldn't have consumed any characters after the entity,
        (u === 0 || // And there should be no invalid characters.
        H0(o)) ? 0 : this.emitNotTerminatedNamedEntity();
      if (i = r[this.treeIndex], u = (i & X.VALUE_LENGTH) >> 14, u !== 0) {
        if (o === v.SEMI)
          return this.emitNamedEntityData(this.treeIndex, u, this.consumed + this.excess);
        this.decodeMode !== Pe.Strict && !(i & X.FLAG13) && (this.result = this.treeIndex, this.consumed += this.excess, this.excess = 0);
      }
      n++, this.excess++;
    }
    return -1;
  }
  /**
   * Emit a named entity that was not terminated with a semicolon.
   * @returns The number of characters consumed.
   */
  emitNotTerminatedNamedEntity() {
    var i;
    const { result: e, decodeTree: n } = this, r = (n[e] & X.VALUE_LENGTH) >> 14;
    return this.emitNamedEntityData(e, r, this.consumed), (i = this.errors) == null || i.missingSemicolonAfterCharacterReference(), this.consumed;
  }
  /**
   * Emit a named entity.
   * @param result The index of the entity in the decode tree.
   * @param valueLength The number of bytes in the entity.
   * @param consumed The number of characters consumed.
   * @returns The number of characters consumed.
   */
  emitNamedEntityData(e, n, r) {
    const { decodeTree: i } = this;
    return this.emitCodePoint(n === 1 ? i[e] & ~(X.VALUE_LENGTH | X.FLAG13) : i[e + 1], r), n === 3 && this.emitCodePoint(i[e + 2], r), r;
  }
  /**
   * Signal to the parser that the end of the input was reached.
   *
   * Remaining data will be emitted and relevant errors will be produced.
   * @returns The number of characters consumed.
   */
  end() {
    var e;
    switch (this.state) {
      case Q.NamedEntity:
        return this.result !== 0 && (this.decodeMode !== Pe.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      case Q.NumericDecimal:
        return this.emitNumericEntity(0, 2);
      case Q.NumericHex:
        return this.emitNumericEntity(0, 3);
      case Q.NumericStart:
        return (e = this.errors) == null || e.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
      case Q.EntityStart:
        return 0;
    }
  }
};
function U0(t) {
  let e = "";
  const n = new V0(t, (r) => e += String.fromCodePoint(r));
  return function(i, u) {
    let o = 0, s = 0;
    for (; (s = i.indexOf("&", s)) >= 0; ) {
      e += i.slice(o, s), n.startEntity(u);
      const c = n.write(
        i,
        // Skip the "&"
        s + 1
      );
      if (c < 0) {
        o = s + n.end();
        break;
      }
      o = s + c, s = c === 0 ? o + 1 : o;
    }
    const l = e + i.slice(o);
    return e = "", l;
  };
}
function $0(t, e, n, r) {
  const i = (e & X.BRANCH_LENGTH) >> 7, u = e & X.JUMP_TABLE;
  if (i === 0)
    return u !== 0 && r === u ? n : -1;
  if (u) {
    const c = r - u;
    return c < 0 || c >= i ? -1 : t[n + c] - 1;
  }
  const o = i + 1 >> 1;
  let s = 0, l = i - 1;
  for (; s <= l; ) {
    const c = s + l >>> 1, a = c >> 1, p = t[n + a] >> (c & 1) * 8 & 255;
    if (p < r)
      s = c + 1;
    else if (p > r)
      l = c - 1;
    else
      return t[n + o + c];
  }
  return -1;
}
const q0 = /* @__PURE__ */ U0(L0);
function Vs(t) {
  return q0(t, Pe.Strict);
}
var j0 = class {
  constructor(t = {}) {
    O(this, "src_Any", Ls.source);
    O(this, "src_Cc", Zs.source);
    O(this, "src_Z", Hs.source);
    O(this, "src_P", xi.source);
    O(this, "src_ZPCc", [
      this.src_Z,
      this.src_P,
      this.src_Cc
    ].join("|"));
    O(this, "src_ZCc", [this.src_Z, this.src_Cc].join("|"));
    O(this, "cache", {});
    O(this, "opts", {
      maxLength: 1e4,
      urlAuth: !1,
      schema_names: []
    });
    this.opts = {
      ...this.opts,
      ...t
    };
  }
  set(t = {}) {
    return this.opts = {
      ...this.opts,
      ...t
    }, this.cache = {}, this;
  }
  escapeRE(t) {
    return t.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
  }
  nestedPairRE(t, e, n = 4) {
    const r = this.escapeRE(t), i = this.escapeRE(e), u = `(?:(?!${this.src_ZCc}|${r}|${i}).)`;
    let o = `${r}${u}{0,1000}${i}`;
    for (let s = 2; s <= n; s++) o = `${r}(?:${u}|${o}){0,1000}${i}`;
    return o;
  }
  get_text_separators() {
    var t;
    return (t = this.cache).text_separators ?? (t.text_separators = /[><\uff5c]/);
  }
  get_pseudo_letter() {
    var t;
    return (t = this.cache).src_pseudo_letter ?? (t.src_pseudo_letter = new RegExp(`(?:(?!${this.get_text_separators().source}|${this.src_ZPCc})${this.src_Any})`));
  }
  get_ipv4_addr() {
    var t;
    return (t = this.cache).src_ip4 ?? (t.src_ip4 = /* @__PURE__ */ new RegExp("(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])[.]){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])"));
  }
  get_ipv6_addr() {
    var n;
    const t = "[0-9A-Fa-f]{1,4}", e = `(?:(?:${t}:${t})|${this.get_ipv4_addr().source})`;
    return (n = this.cache).src_ip6_addr ?? (n.src_ip6_addr = new RegExp(`(?:(?:${t}:){6}${e}|::(?:${t}:){5}${e}|(?:${t})?::(?:${t}:){4}${e}|(?:(?:${t}:){0,1}${t})?::(?:${t}:){3}${e}|(?:(?:${t}:){0,2}${t})?::(?:${t}:){2}${e}|(?:(?:${t}:){0,3}${t})?::${t}:${e}|(?:(?:${t}:){0,4}${t})?::${e}|(?:(?:${t}:){0,5}${t})?::${t}|(?:(?:${t}:){0,6}${t})?::)`));
  }
  get_ipv6_url_host() {
    var t;
    return (t = this.cache).src_ip6_host ?? (t.src_ip6_host = new RegExp(`\\[${this.get_ipv6_addr().source}\\]`));
  }
  get_ipv6_mail_host() {
    var t;
    return (t = this.cache).src_ipv6_mail_host ?? (t.src_ipv6_mail_host = new RegExp(`\\[IPv6:${this.get_ipv6_addr().source}\\]`));
  }
  get_auth() {
    var t;
    return (t = this.cache).src_auth ?? (t.src_auth = new RegExp(`(?:(?:(?!${this.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`));
  }
  get_port() {
    var t;
    return (t = this.cache).src_port ?? (t.src_port = /* @__PURE__ */ new RegExp("(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?"));
  }
  get_host_terminator() {
    var t;
    return (t = this.cache).src_host_terminator ?? (t.src_host_terminator = new RegExp(`(?=$|${this.get_text_separators().source}|${this.src_ZPCc})(?!${this.opts["---"] ? "-(?!--)|" : "-|"}_|:\\d|\\.-|\\.(?!$|${this.src_ZPCc}))`));
  }
  get_path_terminator() {
    var t;
    return (t = this.cache).src_path_terminator ?? (t.src_path_terminator = new RegExp(`${this.src_ZPCc}|${this.get_text_separators().source}`));
  }
  get_path() {
    var t;
    return (t = this.cache).src_path ?? (t.src_path = new RegExp(`(?:[/?#](?:${this.nestedPairRE("[", "]")}|${this.nestedPairRE("(", ")")}|${this.nestedPairRE("{", "}")}|\\"(?:(?!${this.src_ZCc}|["]).){1,100}\\"|\\'(?:(?!${this.src_ZCc}|[']).){1,100}\\'|\\'(?=${this.get_pseudo_letter().source}|[-])|\\.{2,20}[:]?[a-zA-Z0-9%/&]|\\.(?!${this.src_ZCc}|[.]|$)|` + (this.opts["---"] ? "\\-(?!--(?:[^-]|$))(?:-{0,19})|" : "\\-{1,20}|") + `,(?!${this.src_ZCc}|$)|;(?!${this.src_ZCc}|$)|\\!{1,20}(?!${this.src_ZCc}|[!]|$)|\\?(?!${this.src_ZCc}|[?]|$)|` + this.get_path_extra().source + `[\\\\/:%@#&=_~*]|(?!${this.get_path_terminator().source}).){1,${this.opts.maxLength}}|\\/)?`));
  }
  get_mail_name() {
    var t;
    return (t = this.cache).src_mail_name ?? (t.src_mail_name = /* @__PURE__ */ new RegExp("[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9](?:[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9]|[.](?=[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9])){0,63}"));
  }
  get_xn() {
    var t;
    return (t = this.cache).src_xn ?? (t.src_xn = /* @__PURE__ */ new RegExp("xn--[a-z0-9\\-]{1,59}"));
  }
  get_tld() {
    if (this.cache.tld) return this.cache.tld;
    const t = [...new Set(this.opts.tlds || [])].sort().reverse().join("|");
    return this.cache.tld = new RegExp(`${t || "$#none#$"}|${this.get_xn().source}`), this.cache.tld;
  }
  get_domain_root() {
    var t;
    return (t = this.cache).src_domain_root ?? (t.src_domain_root = new RegExp("(?:" + this.get_xn().source + `|${this.get_pseudo_letter().source}{1,63})`));
  }
  get_domain() {
    var t;
    return (t = this.cache).src_domain ?? (t.src_domain = new RegExp("(?:" + this.get_xn().source + `|(?:${this.get_pseudo_letter().source})|(?:${this.get_pseudo_letter().source}(?:-|${this.get_pseudo_letter().source}){0,61}${this.get_pseudo_letter().source}))`));
  }
  get_url_host_port() {
    var t;
    return (t = this.cache).url_host_port ?? (t.url_host_port = new RegExp("(?:" + this.get_ipv6_url_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,10}${this.get_domain().source}))` + this.get_port().source + this.get_host_terminator().source));
  }
  get_fuzzy_url_host_port() {
    var t;
    return (t = this.cache).fuzzy_url_host_port ?? (t.fuzzy_url_host_port = new RegExp("(?:" + (this.opts.fuzzyIP ? this.get_ipv4_addr().source + "|" : "") + `(?:(?:(?:${this.get_domain().source})\\.){1,10}(?:${this.get_tld().source})))` + this.get_host_terminator().source));
  }
  get_mail_host() {
    var t;
    return (t = this.cache).src_mail_host ?? (t.src_mail_host = new RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,4}${this.get_domain().source}))` + this.get_host_terminator().source));
  }
  get_fuzzy_mail_host() {
    var t;
    return (t = this.cache).src_fuzzy_mail_host ?? (t.src_fuzzy_mail_host = new RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})[.]){1,4}${this.get_domain_root().source}))` + this.get_host_terminator().source));
  }
  get_path_extra() {
    var t;
    return (t = this.cache).src_path_extra ?? (t.src_path_extra = /* @__PURE__ */ new RegExp(""));
  }
  get_fuzzy_mail_host_search() {
    var t;
    return (t = this.cache).mail_fuzzy_host_search ?? (t.mail_fuzzy_host_search = new RegExp(`@${this.get_fuzzy_mail_host().source}`, "ig"));
  }
  get_fuzzy_link_search() {
    var t;
    return (t = this.cache).link_fuzzy_search ?? (t.link_fuzzy_search = new RegExp(`(^|(?![.:/\\-_@])(?:[$+<=>^\`|｜]|${this.src_ZPCc}))(?:(?![$+<=>^\`|｜])${this.get_fuzzy_url_host_port().source}${this.get_path().source})`, "ig"));
  }
  get_http_validator() {
    var t;
    return (t = this.cache).http_validator ?? (t.http_validator = new RegExp("\\/\\/" + (this.opts.urlAuth ? this.get_auth().source : "") + this.get_url_host_port().source + this.get_path().source, "iy"));
  }
  get_relative_proto_validator() {
    var t;
    return (t = this.cache).relative_proto_validator ?? (t.relative_proto_validator = new RegExp((this.opts.urlAuth ? this.get_auth().source : "") + `(?:localhost|${this.get_ipv6_url_host().source}|(?:(?:${this.get_domain().source})[.]){1,10}${this.get_domain_root().source})` + this.get_port().source + this.get_host_terminator().source + this.get_path().source, "iy"));
  }
  get_mail_name_validator() {
    var t;
    return (t = this.cache).mail_name_validator ?? (t.mail_name_validator = new RegExp(`(?:^|${this.get_text_separators().source}|"|\\(|${this.src_ZCc})(${this.get_mail_name().source})$`));
  }
  get_mailto_validator() {
    var t;
    return (t = this.cache).mailto_validator ?? (t.mailto_validator = new RegExp(`${this.get_mail_name().source}@${this.get_mail_host().source}`, "iy"));
  }
  get_schema_names() {
    var t;
    return (t = this.cache).schema_names ?? (t.schema_names = new RegExp((this.opts.schema_names || []).map((e) => this.escapeRE(e)).join("|")));
  }
  get_schema_search() {
    var t;
    return (t = this.cache).schema_search ?? (t.schema_search = new RegExp(`(^|(?!_)(?:[><｜]|${this.src_ZPCc}))(${this.get_schema_names().source})`, "ig"));
  }
  get_schema_at_start() {
    var t;
    return (t = this.cache).schema_at_start ?? (t.schema_at_start = new RegExp(`^${this.get_schema_search().source}`, "i"));
  }
}, Er = {
  validate: (t, e, n) => {
    const r = n.re.get_http_validator();
    r.lastIndex = e;
    const i = r.exec(t);
    return i ? i[0].length : 0;
  },
  normalize: (t, e) => e.normalize(t)
}, X0 = {
  "http:": Er,
  "https:": Er,
  "ftp:": Er,
  "//": {
    validate: function(t, e, n) {
      const r = n.re.get_relative_proto_validator();
      r.lastIndex = e;
      const i = r.exec(t);
      return i ? e >= 3 && t[e - 3] === ":" || e >= 3 && t[e - 3] === "/" ? 0 : i[0].length : 0;
    },
    normalize: (t, e) => e.normalize(t)
  },
  "mailto:": {
    validate: function(t, e, n) {
      const r = n.re.get_mailto_validator();
      r.lastIndex = e;
      const i = r.exec(t);
      return i ? i[0].length : 0;
    },
    normalize: (t, e) => e.normalize(t)
  }
}, eh = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw", th = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф";
function nh() {
  const t = th.split("|");
  return eh.split("|").forEach((e) => {
    const n = e.indexOf(":"), r = e.slice(0, n);
    for (const i of e.slice(n + 1)) t.push(r + i);
  }), t;
}
var rh = {
  fuzzyLink: !1,
  fuzzyEmail: !0,
  fuzzyIP: !1,
  "---": !1,
  tlds: nh(),
  urlAuth: !1,
  maxLength: 1e4
}, Qu = class {
  constructor(e, n, r, i) {
    /** Prefix (protocol) for matched string. Empty for fuzzy links. */
    O(this, "schema");
    /** First position of matched string. */
    O(this, "index");
    /** Next position after matched string. */
    O(this, "lastIndex");
    /** Matched string. */
    O(this, "raw");
    /** Normalized text of matched string. */
    O(this, "text");
    /** Normalized URL of matched string. */
    O(this, "url");
    const u = e.slice(r, i);
    this.schema = n.toLowerCase(), this.index = r, this.lastIndex = i, this.raw = u, this.text = u, this.url = u;
  }
}, ih = class {
  /**
  * Creates new linkifier instance.
  *
  * By default understands:
  *
  * - `http(s)://...` , `ftp://...`, `mailto:...` & `//...` links
  * - "fuzzy" emails (foo@bar.com).
  *
  * See {@link LinkifyConstructorOptions} for available options.
  *
  * @param options Recognition options.
  *
  * @example
  * ```javascript
  * import { LinkifyIt } from 'linkify-it'
  *
  * const linkify = new LinkifyIt({ fuzzyLink: true })
  *
  * linkify
  *   .tlds(require('tlds'))       // Reload with full TLD list
  *   .tlds('onion', true)         // Add unofficial `.onion` domain
  *   .add('ftp:', null)           // Disable `ftp:` protocol
  *   .set({ fuzzyIP: true })      // Enable IPs in fuzzy links
  *
  * console.log(linkify.test('Site github.com!')) // true
  * console.log(linkify.match('Site github.com!'))
  * ```
  */
  constructor(e = {}) {
    O(this, "__opts__");
    O(this, "__schemas__");
    O(this, "re");
    const { rebuilder: n, ...r } = e;
    this.__opts__ = {
      ...rh,
      ...r
    }, this.__schemas__ = { ...X0 }, this.re = n || new j0(), this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    });
  }
  /**
  * Add new rule definition.
  *
  * `schema` is a link prefix (usually, protocol name with `:` at the end,
  * `skype:` for example). `linkify-it` makes sure that prefix is not
  * preceded with alphanumeric char and symbols. Only whitespaces and
  * punctuation allowed.
  *
  * `definition` is a rule to check tail after link prefix. To disable an
  * existing rule, pass `null`.
  *
  * @param schema Rule name (fixed pattern prefix).
  * @param definition Schema definition, or `null` to disable the rule.
  *
  * See [twitter mentions example](https://github.com/markdown-it/linkify-it/blob/master/examples/twitter.mjs).
  */
  add(e, n = null) {
    if (!n) delete this.__schemas__[e];
    else {
      const r = {
        normalize: (i, u) => u.normalize(i),
        ...n
      };
      this.__schemas__[e] = r;
    }
    return this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    }), this;
  }
  /**
  * Set recognition options for links without schema.
  *
  * @param options Recognition options.
  */
  set(e = {}) {
    return this.__opts__ = {
      ...this.__opts__,
      ...e
    }, this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    }), this;
  }
  /**
  * Searches linkifiable pattern and returns `true` on success or `false` on fail.
  *
  * @param text Text to scan.
  */
  test(e) {
    if (!e.length) return !1;
    let n, r;
    for (r = this.re.get_schema_search(), r.lastIndex = 0; (n = r.exec(e)) !== null; ) if (this.testSchemaAt(e, n[2], r.lastIndex)) return !0;
    if (this.__opts__.fuzzyLink && this.__schemas__["http:"] && (r = this.re.get_fuzzy_link_search(), r.lastIndex = 0, r.exec(e) !== null))
      return !0;
    if (this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && e.indexOf("@") >= 0) {
      const i = this.re.get_fuzzy_mail_host_search(), u = this.re.get_mail_name_validator();
      for (i.lastIndex = 0; (n = i.exec(e)) !== null; ) {
        const o = e.slice(Math.max(0, n.index - 65), n.index);
        if (u.test(o)) return !0;
      }
    }
    return !1;
  }
  /**
  * Similar to {@link LinkifyIt.test} but checks only specific protocol tail exactly
  * at given position. Returns length of found pattern (0 on fail).
  *
  * @param text Text to scan.
  * @param schema Rule (schema) name.
  * @param pos Text offset to check from.
  */
  testSchemaAt(e, n, r) {
    return this.__schemas__[n.toLowerCase()] ? this.__schemas__[n.toLowerCase()].validate(e.slice(0, r + this.__opts__.maxLength), r, this) : 0;
  }
  /**
  * Returns array of found link descriptions or `null` on fail. We strongly
  * recommend to use {@link LinkifyIt.test} first, for best speed.
  *
  * @param text Text to scan.
  */
  match(e) {
    const n = [], r = this.re.get_schema_search();
    let i, u, o, s, l, c, a = !1, f = !1, p = !1, d = 0;
    if (!e.length) return null;
    for (r.lastIndex = 0, this.__opts__.fuzzyLink && this.__schemas__["http:"] && (i = this.re.get_fuzzy_link_search(), i.lastIndex = 0), this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && (u = this.re.get_fuzzy_mail_host_search(), u.lastIndex = 0, o = this.re.get_mail_name_validator()); ; ) {
      const h = Math.max(d - 1, 0);
      if (u && o && !p && (!l || l.index < d))
        for (u.lastIndex < h && (u.lastIndex = h); ; ) {
          const b = u.exec(e);
          if (!b) {
            p = !0, l = void 0;
            break;
          }
          const k = o.exec(e.slice(Math.max(0, b.index - 65), b.index));
          if (k) {
            if (l = {
              schema: "mailto:",
              index: b.index - k[1].length,
              lastIndex: b.index + b[0].length
            }, l.index >= d) break;
            u.lastIndex < h && (u.lastIndex = h);
          }
        }
      if (i && !f && (!s || s.index < d))
        for (i.lastIndex < h && (i.lastIndex = h); ; ) {
          const b = i.exec(e);
          if (!b) {
            f = !0, s = void 0;
            break;
          }
          if (s = {
            schema: "",
            index: b.index + b[1].length,
            lastIndex: b.index + b[0].length
          }, s.index >= d) break;
          i.lastIndex < h && (i.lastIndex = h);
        }
      let A = l;
      (!A || s && (s.index < A.index || s.index === A.index && s.lastIndex > A.lastIndex)) && (A = s);
      let m;
      if (!a) for (; ; ) {
        if (!c) {
          r.lastIndex < h && (r.lastIndex = h);
          const C = r.exec(e);
          if (!C) {
            a = !0;
            break;
          }
          c = {
            schema: C[2],
            index: C.index + C[1].length,
            lastIndex: C.index + C[0].length
          };
        }
        if (c.index < d) {
          c = void 0;
          continue;
        }
        if (A && c.index > A.index) break;
        const b = c;
        c = void 0;
        const k = this.testSchemaAt(e, b.schema, b.lastIndex);
        if (k) {
          m = {
            schema: b.schema,
            index: b.index,
            lastIndex: b.lastIndex + k
          };
          break;
        }
      }
      let g = m;
      if ((!g || l && (l.index < g.index || l.index === g.index && l.lastIndex > g.lastIndex)) && (g = l), (!g || s && (s.index < g.index || s.index === g.index && s.lastIndex > g.lastIndex)) && (g = s), !g) break;
      g === l ? l = void 0 : g === s && (s = void 0);
      const x = new Qu(e, g.schema, g.index, g.lastIndex);
      x.schema ? this.__schemas__[x.schema].normalize(x, this) : this.normalize(x), n.push(x), d = g.lastIndex;
    }
    return n.length ? n : null;
  }
  /**
  * Returns fully-formed (not fuzzy) link if it starts at the beginning
  * of the string, and null otherwise.
  *
  * @param text Text to scan.
  */
  matchAtStart(e) {
    if (!e.length) return null;
    const n = this.re.get_schema_at_start().exec(e);
    if (!n) return null;
    const r = this.testSchemaAt(e, n[2], n[0].length);
    if (!r) return null;
    const i = new Qu(e, n[2], n.index + n[1].length, n.index + n[0].length + r);
    return this.__schemas__[i.schema].normalize(i, this), i;
  }
  /**
  * Load (or merge) new TLDs list. Those are used for fuzzy links (without
  * prefix) to avoid false positives. By default this algorithm is used:
  *
  * - hostname with any 2-letter root zones are ok.
  * - biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф
  *   are ok.
  * - encoded (`xn--...`) root zones are ok.
  *
  * If list is replaced, then exact match for 2-chars root zones will be checked.
  *
  * @param list List of TLDs.
  * @param keepOld Merge with current list if `true` (`false` by default).
  */
  tlds(e, n = !1) {
    return e = Array.isArray(e) ? e : [e], n ? this.__opts__.tlds = this.__opts__.tlds.concat(e) : this.__opts__.tlds = e, this.re.set({
      ...this.__opts__,
      schema_names: Object.keys(this.__schemas__)
    }), this;
  }
  /**
  * Default normalizer (if schema does not define its own).
  *
  * @param match Match to normalize.
  */
  normalize(e) {
    e.schema || (e.url = `http://${e.url}`), e.schema === "mailto:" && !/^mailto:/i.test(e.url) && (e.url = `mailto:${e.url}`);
  }
};
const Dt = 2147483647, xe = 36, Ci = 1, nn = 26, uh = 38, oh = 700, Us = 72, $s = 128, qs = "-", sh = /^xn--/, lh = /[^\0-\x7F]/, ch = /[\x2E\u3002\uFF0E\uFF61]/g, ah = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
}, Fr = xe - Ci, Ce = Math.floor, _r = String.fromCharCode;
function Ke(t) {
  throw new RangeError(ah[t]);
}
function fh(t, e) {
  const n = [];
  let r = t.length;
  for (; r--; )
    n[r] = e(t[r]);
  return n;
}
function js(t, e) {
  const n = t.split("@");
  let r = "";
  n.length > 1 && (r = n[0] + "@", t = n[1]), t = t.replace(ch, ".");
  const i = t.split("."), u = fh(i, e).join(".");
  return r + u;
}
function Xs(t) {
  const e = [];
  let n = 0;
  const r = t.length;
  for (; n < r; ) {
    const i = t.charCodeAt(n++);
    if (i >= 55296 && i <= 56319 && n < r) {
      const u = t.charCodeAt(n++);
      (u & 64512) == 56320 ? e.push(((i & 1023) << 10) + (u & 1023) + 65536) : (e.push(i), n--);
    } else
      e.push(i);
  }
  return e;
}
const hh = (t) => String.fromCodePoint(...t), dh = function(t) {
  return t >= 48 && t < 58 ? 26 + (t - 48) : t >= 65 && t < 91 ? t - 65 : t >= 97 && t < 123 ? t - 97 : xe;
}, Ku = function(t, e) {
  return t + 22 + 75 * (t < 26) - ((e != 0) << 5);
}, el = function(t, e, n) {
  let r = 0;
  for (t = n ? Ce(t / oh) : t >> 1, t += Ce(t / e); t > Fr * nn >> 1; r += xe)
    t = Ce(t / Fr);
  return Ce(r + (Fr + 1) * t / (t + uh));
}, tl = function(t) {
  const e = [], n = t.length;
  let r = 0, i = $s, u = Us, o = t.lastIndexOf(qs);
  o < 0 && (o = 0);
  for (let s = 0; s < o; ++s)
    t.charCodeAt(s) >= 128 && Ke("not-basic"), e.push(t.charCodeAt(s));
  for (let s = o > 0 ? o + 1 : 0; s < n; ) {
    const l = r;
    for (let a = 1, f = xe; ; f += xe) {
      s >= n && Ke("invalid-input");
      const p = dh(t.charCodeAt(s++));
      p >= xe && Ke("invalid-input"), p > Ce((Dt - r) / a) && Ke("overflow"), r += p * a;
      const d = f <= u ? Ci : f >= u + nn ? nn : f - u;
      if (p < d)
        break;
      const h = xe - d;
      a > Ce(Dt / h) && Ke("overflow"), a *= h;
    }
    const c = e.length + 1;
    u = el(r - l, c, l == 0), Ce(r / c) > Dt - i && Ke("overflow"), i += Ce(r / c), r %= c, e.splice(r++, 0, i);
  }
  return String.fromCodePoint(...e);
}, nl = function(t) {
  const e = [];
  t = Xs(t);
  const n = t.length;
  let r = $s, i = 0, u = Us;
  for (const l of t)
    l < 128 && e.push(_r(l));
  const o = e.length;
  let s = o;
  for (o && e.push(qs); s < n; ) {
    let l = Dt;
    for (const a of t)
      a >= r && a < l && (l = a);
    const c = s + 1;
    l - r > Ce((Dt - i) / c) && Ke("overflow"), i += (l - r) * c, r = l;
    for (const a of t)
      if (a < r && ++i > Dt && Ke("overflow"), a === r) {
        let f = i;
        for (let p = xe; ; p += xe) {
          const d = p <= u ? Ci : p >= u + nn ? nn : p - u;
          if (f < d)
            break;
          const h = f - d, A = xe - d;
          e.push(
            _r(Ku(d + h % A, 0))
          ), f = Ce(h / A);
        }
        e.push(_r(Ku(f, 0))), u = el(i, c, s === o), i = 0, ++s;
      }
    ++i, ++r;
  }
  return e.join("");
}, ph = function(t) {
  return js(t, function(e) {
    return sh.test(e) ? tl(e.slice(4).toLowerCase()) : e;
  });
}, Ah = function(t) {
  return js(t, function(e) {
    return lh.test(e) ? "xn--" + nl(e) : e;
  });
}, Zn = {
  /**
   * A string representing the current Punycode.js version number.
   * @memberOf punycode
   * @type String
   */
  version: "2.3.1",
  /**
   * An object of methods to convert from JavaScript's internal character
   * representation (UCS-2) to Unicode code points, and back.
   * @see <https://mathiasbynens.be/notes/javascript-encoding>
   * @memberOf punycode
   * @type Object
   */
  ucs2: {
    decode: Xs,
    encode: hh
  },
  decode: tl,
  encode: nl,
  toASCII: Ah,
  toUnicode: ph
};
/*! markdown-it 15.0.0 https://github.com/markdown-it/markdown-it @license MIT */
var Wu = Object.defineProperty, rl = (t, e) => {
  let n = {};
  for (var r in t) Wu(n, r, {
    get: t[r],
    enumerable: !0
  });
  return Wu(n, Symbol.toStringTag, { value: "Module" }), n;
}, mh = /* @__PURE__ */ rl({
  arrayReplaceAt: () => ul,
  asciiTrim: () => er,
  callable: () => il,
  escapeHtml: () => qe,
  escapeRE: () => _h,
  fromCodePoint: () => rn,
  isMdAsciiPunct: () => sn,
  isPunctChar: () => sl,
  isPunctCharCode: () => on,
  isSpace: () => R,
  isValidEntityCode: () => yi,
  isWhiteSpace: () => un,
  lib: () => wh,
  normalizeReference: () => Xn,
  unescapeAll: () => Bt,
  unescapeMd: () => xh
});
function il(t) {
  const e = function(...n) {
    return Reflect.construct(t, n, new.target && new.target !== e ? new.target : t);
  };
  return Object.defineProperty(e, "name", { value: t.name }), Object.setPrototypeOf(e, t), e.prototype = t.prototype, e;
}
function ul(t, e, n) {
  return [].concat(t.slice(0, e), n, t.slice(e + 1));
}
function yi(t) {
  return !(t >= 55296 && t <= 57343 || t >= 64976 && t <= 65007 || (t & 65535) === 65535 || (t & 65535) === 65534 || t >= 0 && t <= 8 || t === 11 || t >= 14 && t <= 31 || t >= 127 && t <= 159 || t > 1114111);
}
function rn(t) {
  if (t > 65535) {
    t -= 65536;
    const e = 55296 + (t >> 10), n = 56320 + (t & 1023);
    return String.fromCharCode(e, n);
  }
  return String.fromCharCode(t);
}
var ol = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, gh = new RegExp(`${ol.source}|${/&([a-z#][a-z0-9]{1,31});/gi.source}`, "gi"), bh = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function kh(t, e) {
  if (e.charCodeAt(0) === 35 && bh.test(e)) {
    const r = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return yi(r) ? rn(r) : t;
  }
  const n = Vs(t);
  return n !== t ? n : t;
}
function xh(t) {
  return t.indexOf("\\") < 0 ? t : t.replace(ol, "$1");
}
function Bt(t) {
  return t.indexOf("\\") < 0 && t.indexOf("&") < 0 ? t : t.replace(gh, function(e, n, r) {
    return n || kh(e, r);
  });
}
var Ch = /[&<>"]/, yh = /[&<>"]/g, Dh = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function Eh(t) {
  return Dh[t];
}
function qe(t) {
  return Ch.test(t) ? t.replace(yh, Eh) : t;
}
var Fh = /[.?*+^$[\]\\(){}|-]/g;
function _h(t) {
  return t.replace(Fh, "\\$&");
}
function R(t) {
  switch (t) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function un(t) {
  if (t >= 8192 && t <= 8202) return !0;
  switch (t) {
    case 9:
    case 10:
    case 11:
    case 12:
    case 13:
    case 32:
    case 160:
    case 5760:
    case 8239:
    case 8287:
    case 12288:
      return !0;
  }
  return !1;
}
function sl(t) {
  return xi.test(t) || Ys.test(t);
}
function on(t) {
  return sl(rn(t));
}
function sn(t) {
  switch (t) {
    case 33:
    case 34:
    case 35:
    case 36:
    case 37:
    case 38:
    case 39:
    case 40:
    case 41:
    case 42:
    case 43:
    case 44:
    case 45:
    case 46:
    case 47:
    case 58:
    case 59:
    case 60:
    case 61:
    case 62:
    case 63:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 124:
    case 125:
    case 126:
      return !0;
    default:
      return !1;
  }
}
function Xn(t) {
  return t = t.trim().replace(/\s+/g, " "), t.toLowerCase().toUpperCase();
}
function Pu(t) {
  return t === 32 || t === 9 || t === 10 || t === 13;
}
function er(t) {
  let e = 0;
  for (; e < t.length && Pu(t.charCodeAt(e)); e++) ;
  let n = t.length - 1;
  for (; n >= e && Pu(t.charCodeAt(n)); n--) ;
  return t.slice(e, n + 1);
}
var wh = {
  mdurl: Gs,
  ucmicro: W0
};
function Ih(t, e, n) {
  let r, i, u, o;
  const s = t.posMax, l = t.pos;
  for (t.pos = e + 1, r = 1; t.pos < s; ) {
    if (u = t.src.charCodeAt(t.pos), u === 93 && (r--, r === 0)) {
      i = !0;
      break;
    }
    if (o = t.pos, t.md.inline.skipToken(t), u === 91) {
      if (o === t.pos - 1) r++;
      else if (n)
        return t.pos = l, -1;
    }
  }
  let c = -1;
  return i && (c = t.pos), t.pos = l, c;
}
function Bh(t, e, n) {
  let r, i = e;
  const u = {
    ok: !1,
    pos: 0,
    str: ""
  };
  if (t.charCodeAt(i) === 60) {
    for (i++; i < n; ) {
      if (r = t.charCodeAt(i), r === 10 || r === 60) return u;
      if (r === 62)
        return u.pos = i + 1, u.str = Bt(t.slice(e + 1, i)), u.ok = !0, u;
      if (r === 92 && i + 1 < n) {
        i += 2;
        continue;
      }
      i++;
    }
    return u;
  }
  let o = 0;
  for (; i < n && (r = t.charCodeAt(i), !(r === 32 || r < 32 || r === 127)); ) {
    if (r === 92 && i + 1 < n) {
      if (t.charCodeAt(i + 1) === 32) {
        i++;
        continue;
      }
      i += 2;
      continue;
    }
    if (r === 40 && (o++, o > 32))
      return u;
    if (r === 41) {
      if (o === 0) break;
      o--;
    }
    i++;
  }
  return e === i || o !== 0 || (u.str = Bt(t.slice(e, i)), u.pos = i, u.ok = !0), u;
}
function Sh(t, e, n, r) {
  let i, u = e;
  const o = {
    ok: !1,
    can_continue: !1,
    pos: 0,
    str: "",
    marker: 0
  };
  if (r)
    o.str = r.str, o.marker = r.marker;
  else {
    if (u >= n) return o;
    let s = t.charCodeAt(u);
    if (s !== 34 && s !== 39 && s !== 40) return o;
    e++, u++, s === 40 && (s = 41), o.marker = s;
  }
  for (; u < n; ) {
    if (i = t.charCodeAt(u), i === o.marker)
      return o.pos = u + 1, o.str += Bt(t.slice(e, u)), o.ok = !0, o;
    if (i === 40 && o.marker === 41) return o;
    i === 92 && u + 1 < n && u++, u++;
  }
  return o.can_continue = !0, o.str += Bt(t.slice(e, u)), o;
}
var Mh = /* @__PURE__ */ rl({
  parseLinkDestination: () => Bh,
  parseLinkLabel: () => Ih,
  parseLinkTitle: () => Sh
});
function ln(t) {
  "@babel/helpers - typeof";
  return ln = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, ln(t);
}
function Nh(t, e) {
  if (ln(t) != "object" || !t) return t;
  var n = t[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(t, e);
    if (ln(r) != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
function Oh(t) {
  var e = Nh(t, "string");
  return ln(e) == "symbol" ? e : e + "";
}
function _(t, e, n) {
  return (e = Oh(e)) in t ? Object.defineProperty(t, e, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : t[e] = n, t;
}
var ht = class {
  constructor(e, n, r) {
    _(
      this,
      /**
      * Source map info. Format: `[ line_begin, line_end ]`
      */
      "map",
      null
    ), _(
      this,
      /**
      * nesting level, the same as `state.level`
      */
      "level",
      0
    ), _(
      this,
      /**
      * An array of child nodes (inline and img tokens)
      */
      "children",
      null
    ), _(
      this,
      /**
      * In a case of self-closing tag (code, html, fence, etc.),
      * it has contents of this tag.
      */
      "content",
      ""
    ), _(
      this,
      /**
      * '*' or '_' for emphasis, fence string for fence, etc.
      */
      "markup",
      ""
    ), _(
      this,
      /**
      * Additional information:
      *
      * - Info string for "fence" tokens
      * - The value "auto" for autolink "link_open" and "link_close" tokens
      * - The string value of the item marker for ordered-list "list_item_open" tokens
      */
      "info",
      ""
    ), _(
      this,
      /**
      * True for block-level tokens, false for inline tokens.
      * Used in renderer to calculate line breaks
      */
      "block",
      !1
    ), _(
      this,
      /**
      * If it's true, ignore this element when rendering. Used for tight lists
      * to hide paragraphs.
      */
      "hidden",
      !1
    ), this.type = e, this.tag = n, this.attrs = null, this.nesting = r, this.meta = null;
  }
  /**
  * Search attribute index by name.
  */
  attrIndex(e) {
    if (!this.attrs) return -1;
    const n = this.attrs;
    for (let r = 0, i = n.length; r < i; r++) if (n[r][0] === e) return r;
    return -1;
  }
  /**
  * Add `[ name, value ]` attribute to list. Init attrs if necessary
  */
  attrPush(e) {
    this.attrs ? this.attrs.push(e) : this.attrs = [e];
  }
  /**
  * Set `name` attribute to `value`. Override old value if exists.
  */
  attrSet(e, n) {
    const r = this.attrIndex(e), i = [e, n];
    r < 0 ? this.attrPush(i) : this.attrs[r] = i;
  }
  /**
  * Get the value of attribute `name`, or null if it does not exist.
  */
  attrGet(e) {
    const n = this.attrIndex(e);
    let r = null;
    return n >= 0 && (r = this.attrs[n][1]), r;
  }
  /**
  * Join value to existing attribute via space. Or create new attribute if not
  * exists. Useful to operate with token classes.
  */
  attrJoin(e, n) {
    const r = this.attrIndex(e);
    r < 0 ? this.attrPush([e, n]) : this.attrs[r][1] = `${this.attrs[r][1]} ${n}`;
  }
}, cn = class {
  constructor() {
    _(this, "__rules__", []), _(this, "__cache__", null);
  }
  __find__(e) {
    for (let n = 0; n < this.__rules__.length; n++) if (this.__rules__[n].name === e) return n;
    return -1;
  }
  __compile__() {
    const e = /* @__PURE__ */ new Set();
    this.__rules__.forEach((n) => {
      n.enabled && n.alt.forEach((r) => {
        r && e.add(r);
      });
    }), this.__cache__ = /* @__PURE__ */ Object.create(null), this.__cache__[""] = [], this.__rules__.forEach((n) => {
      n.enabled && this.__cache__[""].push(n.fn);
    }), e.forEach((n) => {
      this.__cache__[n] = [], this.__rules__.forEach((r) => {
        r.enabled && r.alt.indexOf(n) >= 0 && this.__cache__[n].push(r.fn);
      });
    });
  }
  /**
  * Replace rule by name with new function & options. Throws error if name not
  * found.
  *
  * @param name Rule name to replace.
  * @param fn New rule function.
  * @param options Rule options. `alt` is an array with names of "alternate"
  * chains.
  *
  * @example Replace existing typographer replacement rule with new one
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  * const md = new MarkdownIt()
  *
  * md.core.ruler.at('replacements', function replace(state) {
  *   //...
  * });
  * ```
  */
  at(e, n, r = {}) {
    const i = this.__find__(e);
    if (i === -1) throw new Error(`Parser rule not found: ${e}`);
    this.__rules__[i].fn = n, this.__rules__[i].alt = r.alt || [], this.__cache__ = null;
  }
  /**
  * Add new rule to chain before one with given name. See also
  * {@link Ruler.after}, {@link Ruler.push}.
  *
  * @param beforeName New rule will be added before this one.
  * @param ruleName Name of added rule.
  * @param fn Rule function.
  * @param options Rule options. `alt` is an array with names of "alternate"
  * chains.
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  * const md = new MarkdownIt()
  *
  * md.block.ruler.before('paragraph', 'my_rule', function replace(state) {
  *   //...
  * });
  * ```
  */
  before(e, n, r, i = {}) {
    const u = this.__find__(e);
    if (u === -1) throw new Error(`Parser rule not found: ${e}`);
    this.__rules__.splice(u, 0, {
      name: n,
      enabled: !0,
      fn: r,
      alt: i.alt || []
    }), this.__cache__ = null;
  }
  /**
  * Add new rule to chain after one with given name. See also
  * {@link Ruler.before}, {@link Ruler.push}.
  *
  * @param afterName New rule will be added after this one.
  * @param ruleName Name of added rule.
  * @param fn Rule function.
  * @param options Rule options. `alt` is an array with names of "alternate"
  * chains.
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  * const md = new MarkdownIt()
  *
  * md.inline.ruler.after('text', 'my_rule', function replace(state) {
  *   //...
  * });
  * ```
  */
  after(e, n, r, i = {}) {
    const u = this.__find__(e);
    if (u === -1) throw new Error(`Parser rule not found: ${e}`);
    this.__rules__.splice(u + 1, 0, {
      name: n,
      enabled: !0,
      fn: r,
      alt: i.alt || []
    }), this.__cache__ = null;
  }
  /**
  * Push new rule to the end of chain. See also
  * {@link Ruler.before}, {@link Ruler.after}.
  *
  * @param ruleName Name of added rule.
  * @param fn Rule function.
  * @param options Rule options. `alt` is an array with names of "alternate"
  * chains.
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  * const md = new MarkdownIt()
  *
  * md.core.ruler.push('my_rule', function replace(state) {
  *   //...
  * });
  * ```
  */
  push(e, n, r = {}) {
    this.__rules__.push({
      name: e,
      enabled: !0,
      fn: n,
      alt: r.alt || []
    }), this.__cache__ = null;
  }
  /**
  * Enable rules with given names. If any rule name not found - throw Error.
  * Errors can be disabled by second param.
  *
  * See also {@link Ruler.disable}, {@link Ruler.enableOnly}.
  *
  * @param list List of rule names to enable.
  * @param ignoreInvalid Set `true` to ignore errors when rule not found.
  * @returns List of found rule names (if no exception happened).
  */
  enable(e, n = !1) {
    Array.isArray(e) || (e = [e]);
    const r = [];
    return e.forEach((i) => {
      const u = this.__find__(i);
      if (u < 0) {
        if (n) return;
        throw new Error(`Rules manager: invalid rule name ${i}`);
      }
      this.__rules__[u].enabled = !0, r.push(i);
    }), this.__cache__ = null, r;
  }
  /**
  * Enable rules with given names, and disable everything else. If any rule name
  * not found - throw Error. Errors can be disabled by second param.
  *
  * See also {@link Ruler.disable}, {@link Ruler.enable}.
  *
  * @param list List of rule names to enable (whitelist).
  * @param ignoreInvalid Set `true` to ignore errors when rule not found.
  */
  enableOnly(e, n = !1) {
    Array.isArray(e) || (e = [e]), this.__rules__.forEach((r) => {
      r.enabled = !1;
    }), this.enable(e, n);
  }
  /**
  * Disable rules with given names. If any rule name not found - throw Error.
  * Errors can be disabled by second param.
  *
  * See also {@link Ruler.enable}, {@link Ruler.enableOnly}.
  *
  * @param list List of rule names to disable.
  * @param ignoreInvalid Set `true` to ignore errors when rule not found.
  * @returns List of found rule names (if no exception happened).
  */
  disable(e, n = !1) {
    Array.isArray(e) || (e = [e]);
    const r = [];
    return e.forEach((i) => {
      const u = this.__find__(i);
      if (u < 0) {
        if (n) return;
        throw new Error(`Rules manager: invalid rule name ${i}`);
      }
      this.__rules__[u].enabled = !1, r.push(i);
    }), this.__cache__ = null, r;
  }
  /**
  * Return array of active functions (rules) for given chain name. It analyzes
  * rules configuration, compiles caches if not exists and returns result.
  *
  * Default chain name is `''` (empty string). It can't be skipped. That's
  * done intentionally, to keep signature monomorphic for high speed.
  */
  getRules(e) {
    return this.__cache__ || this.__compile__(), this.__cache__[e] || [];
  }
}, Ee = {};
Ee.code_inline = function(t, e, n, r, i) {
  const u = t[e];
  return `<code${i.renderAttrs(u)}>${qe(u.content)}</code>`;
};
Ee.code_block = function(t, e, n, r, i) {
  const u = t[e];
  return `<pre${i.renderAttrs(u)}><code>${qe(t[e].content)}</code></pre>
`;
};
Ee.fence = function(t, e, n, r, i) {
  const u = t[e], o = u.info ? Bt(u.info).trim() : "";
  let s = "", l = "";
  if (o) {
    const a = o.split(/(\s+)/g);
    s = a[0], l = a.slice(2).join("");
  }
  let c;
  if (n.highlight ? c = n.highlight(u.content, s, l) || qe(u.content) : c = qe(u.content), c.indexOf("<pre") === 0) return c + `
`;
  if (o) {
    const a = u.attrIndex("class"), f = u.attrs ? u.attrs.slice() : [];
    a < 0 ? f.push(["class", `${n.langPrefix}${s}`]) : (f[a] = [f[a][0], f[a][1]], f[a][1] += ` ${n.langPrefix}${s}`);
    const p = { attrs: f };
    return `<pre><code${i.renderAttrs(p)}>${c}</code></pre>
`;
  }
  return `<pre><code${i.renderAttrs(u)}>${c}</code></pre>
`;
};
Ee.image = function(t, e, n, r, i) {
  const u = t[e];
  return u.attrs[u.attrIndex("alt")][1] = i.renderInlineAsText(u.children, n, r), i.renderToken(t, e, n);
};
Ee.hardbreak = function(t, e, n) {
  return n.xhtmlOut ? `<br />
` : `<br>
`;
};
Ee.softbreak = function(t, e, n) {
  return n.breaks ? n.xhtmlOut ? `<br />
` : `<br>
` : `
`;
};
Ee.text = function(t, e) {
  return qe(t[e].content);
};
Ee.html_block = function(t, e) {
  return t[e].content;
};
Ee.html_inline = function(t, e) {
  return t[e].content;
};
var ll = class {
  constructor() {
    _(
      this,
      /**
      * Contains render rules for tokens. Can be updated and extended.
      *
      * See [source code](https://github.com/markdown-it/markdown-it/blob/master/src/renderer.ts)
      * for more details and examples.
      *
      * @example Custom render rules
      * ```javascript
      * import MarkdownIt from 'markdown-it'
      * const md = new MarkdownIt()
      *
      * md.renderer.rules.strong_open  = function () { return '<b>'; };
      * md.renderer.rules.strong_close = function () { return '</b>'; };
      *
      * const result = md.renderInline(...);
      * ```
      *
      * @example Each rule is called as independent static function with fixed signature
      * ```javascript
      * function my_token_render(tokens, idx, options, env, renderer) {
      *   // ...
      *   return renderedHTML;
      * }
      * ```
      */
      "rules",
      Object.assign({}, Ee)
    );
  }
  /**
  * Render token attributes to string.
  */
  renderAttrs(e) {
    let n, r, i;
    if (!e.attrs) return "";
    for (i = "", n = 0, r = e.attrs.length; n < r; n++) i += ` ${qe(e.attrs[n][0])}="${qe(String(e.attrs[n][1]))}"`;
    return i;
  }
  /**
  * Default token renderer. Can be overriden by custom function
  * in {@link Renderer.rules}.
  *
  * @param tokens List of tokens.
  * @param idx Token index to render.
  * @param options Params of parser instance.
  */
  renderToken(e, n, r) {
    const i = e[n];
    let u = "";
    if (i.hidden) return "";
    let o = n - 1;
    for (; o >= 0 && e[o].hidden && e[o].nesting === 0; ) o--;
    i.block && i.nesting !== -1 && o >= 0 && e[o].hidden && e[o].nesting === -1 && (u += `
`), u += (i.nesting === -1 ? "</" : "<") + i.tag, u += this.renderAttrs(i), i.nesting === 0 && r.xhtmlOut && (u += " /");
    let s = !1;
    if (i.block && (s = !0, i.nesting === 1)) {
      let l = n + 1;
      for (; l < e.length && e[l].hidden && e[l].nesting === 0; ) l++;
      if (l < e.length) {
        const c = e[l];
        (c.type === "inline" || c.hidden || c.nesting === -1 && c.tag === i.tag) && (s = !1);
      }
    }
    return u += s ? `>
` : ">", u;
  }
  /**
  * The same as {@link Renderer.render}, but for single token of `inline` type.
  *
  * @param tokens List on block tokens to render.
  * @param options Params of parser instance.
  * @param env Additional data from parsed input (references, for example).
  */
  renderInline(e, n, r) {
    let i = "";
    const u = this.rules;
    for (let o = 0, s = e.length; o < s; o++) {
      const l = e[o].type;
      typeof u[l] < "u" ? i += u[l](e, o, n, r, this) : i += this.renderToken(e, o, n);
    }
    return i;
  }
  /**
  * Special kludge for image `alt` attributes to conform CommonMark spec.
  * Don't try to use it! Spec requires to show `alt` content with stripped markup,
  * instead of simple escaping.
  *
  * @param tokens List on block tokens to render.
  * @param options Params of parser instance.
  * @param env Additional data from parsed input (references, for example).
  */
  renderInlineAsText(e, n, r) {
    let i = "";
    for (let u = 0, o = e.length; u < o; u++) switch (e[u].type) {
      case "text":
      case "code_inline":
        i += e[u].content;
        break;
      case "image":
        i += this.renderInlineAsText(e[u].children, n, r);
        break;
      case "html_inline":
      case "html_block":
        i += e[u].content;
        break;
      case "softbreak":
      case "hardbreak":
        i += `
`;
    }
    return i;
  }
  /**
  * Takes token stream and generates HTML. Probably, you will never need to call
  * this method directly.
  *
  * @param tokens List on block tokens to render.
  * @param options Params of parser instance.
  * @param env Additional data from parsed input (references, for example).
  */
  render(e, n, r) {
    let i = "";
    const u = this.rules;
    for (let o = 0, s = e.length; o < s; o++) {
      const l = e[o].type;
      l === "inline" ? i += this.renderInline(e[o].children, n, r) : typeof u[l] < "u" ? i += u[l](e, o, n, r, this) : i += this.renderToken(e, o, n);
    }
    return i;
  }
}, cl = class {
  constructor(e, n, r) {
    _(this, "tokens", []), _(this, "inlineMode", !1), _(this, "Token", ht), this.src = e, this.env = r, this.md = n;
  }
}, Rh = /\r\n?|\n/g, Th = /\0/g;
function vh(t) {
  let e;
  e = t.src.replace(Rh, `
`), e = e.replace(Th, "�"), t.src = e;
}
function zh(t) {
  let e;
  t.inlineMode ? (e = new t.Token("inline", "", 0), e.content = t.src, e.map = [0, 1], e.children = [], t.tokens.push(e)) : t.md.block.parse(t.src, t.md, t.env, t.tokens);
}
function Qh(t) {
  const e = t.tokens;
  let n = 0;
  for (let r = 0; r < e.length; r++)
    e[r].type !== "reference_definition" && (r !== n && (e[n] = e[r]), n++);
  e.length !== n && (e.length = n);
}
function Kh(t) {
  const e = t.tokens;
  for (let n = 0, r = e.length; n < r; n++) {
    const i = e[n];
    i.type === "inline" && t.md.inline.parse(i.content, t.md, t.env, i.children);
  }
}
function Wh(t) {
  return /^<a[>\s]/i.test(t);
}
function Ph(t) {
  return /^<\/a\s*>/i.test(t);
}
function Jh(t) {
  const e = t.tokens;
  if (t.md.options.linkify)
    for (let n = 0, r = e.length; n < r; n++) {
      if (e[n].type !== "inline" || !t.md.linkify.test(e[n].content)) continue;
      let i = e[n].children, u = 0;
      for (let o = i.length - 1; o >= 0; o--) {
        const s = i[o];
        if (s.type === "link_close") {
          for (o--; i[o].level !== s.level && i[o].type !== "link_open"; ) o--;
          continue;
        }
        if (s.type === "html_inline" && (Wh(s.content) && u > 0 && u--, Ph(s.content) && u++), !(u > 0) && s.type === "text" && t.md.linkify.test(s.content)) {
          const l = s.content;
          let c = t.md.linkify.match(l);
          const a = [];
          let f = s.level, p = 0;
          c.length > 0 && c[0].index === 0 && o > 0 && i[o - 1].type === "text_special" && (c = c.slice(1));
          for (let d = 0; d < c.length; d++) {
            const h = c[d].url, A = t.md.normalizeLink(h);
            if (!t.md.validateLink(A)) continue;
            let m = c[d].text;
            c[d].schema ? c[d].schema === "mailto:" && !/^mailto:/i.test(m) ? m = t.md.normalizeLinkText(`mailto:${m}`).replace(/^mailto:/, "") : m = t.md.normalizeLinkText(m) : m = t.md.normalizeLinkText(`http://${m}`).replace(/^http:\/\//, "");
            const g = c[d].index;
            if (g > p) {
              const C = new t.Token("text", "", 0);
              C.content = l.slice(p, g), C.level = f, a.push(C);
            }
            const x = new t.Token("link_open", "a", 1);
            x.attrs = [["href", A]], x.level = f++, x.markup = "linkify", x.info = "auto", a.push(x);
            const b = new t.Token("text", "", 0);
            b.content = m, b.level = f, a.push(b);
            const k = new t.Token("link_close", "a", -1);
            k.level = --f, k.markup = "linkify", k.info = "auto", a.push(k), p = c[d].lastIndex;
          }
          if (p < l.length) {
            const d = new t.Token("text", "", 0);
            d.content = l.slice(p), d.level = f, a.push(d);
          }
          e[n].children = i = ul(i, o, a);
        }
      }
    }
}
var al = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, Gh = /\((c|tm|r)\)/i, Lh = /\((c|tm|r)\)/gi, Zh = {
  c: "©",
  r: "®",
  tm: "™"
};
function Yh(t, e) {
  return Zh[e.toLowerCase()];
}
function Hh(t) {
  let e = 0;
  for (let n = t.length - 1; n >= 0; n--) {
    const r = t[n];
    r.type === "text" && !e && (r.content = r.content.replace(Lh, Yh)), r.type === "link_open" && r.info === "auto" && e--, r.type === "link_close" && r.info === "auto" && e++;
  }
}
function Vh(t) {
  let e = 0;
  for (let n = t.length - 1; n >= 0; n--) {
    const r = t[n];
    r.type === "text" && !e && al.test(r.content) && (r.content = r.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1—").replace(/(^|\s)--(?=\s|$)/gm, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1–")), r.type === "link_open" && r.info === "auto" && e--, r.type === "link_close" && r.info === "auto" && e++;
  }
}
function Uh(t) {
  let e;
  if (t.md.options.typographer)
    for (e = t.tokens.length - 1; e >= 0; e--)
      t.tokens[e].type === "inline" && (Gh.test(t.tokens[e].content) && Hh(t.tokens[e].children), al.test(t.tokens[e].content) && Vh(t.tokens[e].children));
}
var $h = /['"]/, Ju = /['"]/g, Gu = "’";
function Fn(t, e, n, r) {
  t[e] || (t[e] = []), t[e].push({
    pos: n,
    ch: r
  });
}
function qh(t, e) {
  let n = "", r = 0;
  e.sort((i, u) => i.pos - u.pos);
  for (let i = 0; i < e.length; i++) {
    const u = e[i];
    n += t.slice(r, u.pos) + u.ch, r = u.pos + 1;
  }
  return n + t.slice(r);
}
function jh(t, e) {
  let n;
  const r = [], i = {};
  for (let u = 0; u < t.length; u++) {
    const o = t[u], s = t[u].level;
    for (n = r.length - 1; n >= 0 && !(r[n].level <= s); n--) ;
    if (r.length = n + 1, o.type !== "text") continue;
    const l = o.content;
    let c = 0;
    const a = l.length;
    e: for (; c < a; ) {
      Ju.lastIndex = c;
      const f = Ju.exec(l);
      if (!f) break;
      let p = !0, d = !0;
      c = f.index + 1;
      const h = f[0] === "'";
      let A = 32;
      if (f.index - 1 >= 0) A = l.charCodeAt(f.index - 1);
      else for (n = u - 1; n >= 0 && !(t[n].type === "softbreak" || t[n].type === "hardbreak"); n--)
        if (t[n].content) {
          A = t[n].content.charCodeAt(t[n].content.length - 1);
          break;
        }
      let m = 32;
      if (c < a) m = l.charCodeAt(c);
      else for (n = u + 1; n < t.length && !(t[n].type === "softbreak" || t[n].type === "hardbreak"); n++)
        if (t[n].content) {
          m = t[n].content.charCodeAt(0);
          break;
        }
      const g = sn(A) || on(A), x = sn(m) || on(m), b = un(A), k = un(m);
      if (k ? p = !1 : x && (b || g || (p = !1)), b ? d = !1 : g && (k || x || (d = !1)), m === 34 && f[0] === '"' && A >= 48 && A <= 57 && (d = p = !1), p && d && (p = g, d = x), !p && !d) {
        h && Fn(i, u, f.index, Gu);
        continue;
      }
      if (d) for (n = r.length - 1; n >= 0; n--) {
        let C = r[n];
        if (r[n].level < s) break;
        if (C.single === h && r[n].level === s) {
          C = r[n];
          let E, D;
          h ? (E = e.md.options.quotes[2], D = e.md.options.quotes[3]) : (E = e.md.options.quotes[0], D = e.md.options.quotes[1]), Fn(i, u, f.index, D), Fn(i, C.token, C.pos, E), r.length = n;
          continue e;
        }
      }
      p ? r.push({
        token: u,
        pos: f.index,
        single: h,
        level: s
      }) : d && h && Fn(i, u, f.index, Gu);
    }
  }
  Object.keys(i).forEach(function(u) {
    const o = Number(u);
    t[o].content = qh(t[o].content, i[u]);
  });
}
function Xh(t) {
  if (t.md.options.typographer)
    for (let e = t.tokens.length - 1; e >= 0; e--)
      t.tokens[e].type !== "inline" || !$h.test(t.tokens[e].content) || jh(t.tokens[e].children, t);
}
function ed(t) {
  let e, n;
  const r = t.length;
  for (e = 0; e < r; e++) t[e].type === "text_special" && (t[e].type = "text");
  for (e = n = 0; e < r; e++) t[e].type === "text" && e + 1 < r && t[e + 1].type === "text" ? t[e + 1].content = t[e].content + t[e + 1].content : (e !== n && (t[n] = t[e]), n++);
  e !== n && (t.length = n);
}
function td(t) {
  let e, n;
  const r = t.tokens, i = r.length;
  for (let u = 0; u < i; u++) {
    if (r[u].type !== "inline") continue;
    const o = r[u].children, s = o.length;
    for (e = 0; e < s; e++)
      o[e].type === "text_special" && (o[e].type = "text"), o[e].children && ed(o[e].children);
    for (e = n = 0; e < s; e++) o[e].type === "text" && e + 1 < s && o[e + 1].type === "text" ? o[e + 1].content = o[e].content + o[e + 1].content : (e !== n && (o[n] = o[e]), n++);
    e !== n && (o.length = n);
  }
}
var wr = [
  ["normalize", vh],
  ["block", zh],
  ["strip_references", Qh],
  ["inline", Kh],
  ["linkify", Jh],
  ["replacements", Uh],
  ["smartquotes", Xh],
  ["text_join", td]
], fl = class {
  constructor() {
    _(
      this,
      /**
      * {@link Ruler} instance. Keep configuration of core rules.
      */
      "ruler",
      new cn()
    ), _(this, "State", cl);
    for (let t = 0; t < wr.length; t++) this.ruler.push(wr[t][0], wr[t][1]);
  }
  /**
  * Executes core chain rules.
  */
  process(t) {
    const e = this.ruler.getRules("");
    for (let n = 0, r = e.length; n < r; n++) e[n](t);
  }
}, hl = class {
  constructor(e, n, r, i) {
    _(this, "bMarks", []), _(this, "eMarks", []), _(this, "tShift", []), _(this, "sCount", []), _(this, "bsCount", []), _(this, "blkIndent", 0), _(this, "line", 0), _(this, "lineMax", 0), _(this, "tight", !1), _(this, "listIndent", -1), _(this, "parentType", "root"), _(this, "level", 0), _(this, "Token", ht), this.src = e, this.md = n, this.env = r, this.tokens = i;
    const u = this.src;
    for (let o = 0, s = 0, l = 0, c = 0, a = u.length, f = !1; s < a; s++) {
      const p = u.charCodeAt(s);
      if (!f) if (R(p)) {
        l++, p === 9 ? c += 4 - c % 4 : c++;
        continue;
      } else f = !0;
      (p === 10 || s === a - 1) && (p !== 10 && s++, this.bMarks.push(o), this.eMarks.push(s), this.tShift.push(l), this.sCount.push(c), this.bsCount.push(0), f = !1, l = 0, c = 0, o = s + 1);
    }
    this.bMarks.push(u.length), this.eMarks.push(u.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
  }
  push(e, n, r) {
    const i = new ht(e, n, r);
    return i.block = !0, r < 0 && this.level--, i.level = this.level, r > 0 && this.level++, this.tokens.push(i), i;
  }
  isEmpty(e) {
    return this.bMarks[e] + this.tShift[e] >= this.eMarks[e];
  }
  skipEmptyLines(e) {
    for (let n = this.lineMax; e < n && !(this.bMarks[e] + this.tShift[e] < this.eMarks[e]); e++) ;
    return e;
  }
  skipSpaces(e) {
    for (let n = this.src.length; e < n && R(this.src.charCodeAt(e)); e++) ;
    return e;
  }
  skipSpacesBack(e, n) {
    if (e <= n) return e;
    for (; e > n; ) if (!R(this.src.charCodeAt(--e))) return e + 1;
    return e;
  }
  skipChars(e, n) {
    for (let r = this.src.length; e < r && this.src.charCodeAt(e) === n; e++) ;
    return e;
  }
  skipCharsBack(e, n, r) {
    if (e <= r) return e;
    for (; e > r; ) if (n !== this.src.charCodeAt(--e)) return e + 1;
    return e;
  }
  getLines(e, n, r, i) {
    if (e >= n) return "";
    const u = new Array(n - e);
    for (let o = 0, s = e; s < n; s++, o++) {
      let l = 0;
      const c = this.bMarks[s];
      let a = c, f;
      for (s + 1 < n || i ? f = this.eMarks[s] + 1 : f = this.eMarks[s]; a < f && l < r; ) {
        const p = this.src.charCodeAt(a);
        if (R(p)) p === 9 ? l += 4 - (l + this.bsCount[s]) % 4 : l++;
        else if (a - c < this.tShift[s]) l++;
        else break;
        a++;
      }
      l > r ? u[o] = new Array(l - r + 1).join(" ") + this.src.slice(a, f) : u[o] = this.src.slice(a, f);
    }
    return u.join("");
  }
}, nd = 65536;
function Ir(t, e) {
  const n = t.bMarks[e] + t.tShift[e], r = t.eMarks[e];
  return t.src.slice(n, r);
}
function Lu(t) {
  const e = [], n = t.length;
  let r = 0, i = t.charCodeAt(r), u = !1, o = 0, s = "";
  for (; r < n; )
    i === 124 && (u ? (s += t.substring(o, r - 1), o = r) : (e.push(s + t.substring(o, r)), s = "", o = r + 1)), u = i === 92, r++, i = t.charCodeAt(r);
  return e.push(s + t.substring(o)), e;
}
function rd(t, e, n, r) {
  if (e + 2 > n) return !1;
  let i = e + 1;
  if (t.sCount[i] < t.blkIndent || t.sCount[i] - t.blkIndent >= 4) return !1;
  let u = t.bMarks[i] + t.tShift[i];
  if (u >= t.eMarks[i]) return !1;
  const o = t.src.charCodeAt(u++);
  if (o !== 124 && o !== 45 && o !== 58 || u >= t.eMarks[i]) return !1;
  const s = t.src.charCodeAt(u++);
  if (s !== 124 && s !== 45 && s !== 58 && !R(s) || o === 45 && R(s)) return !1;
  for (; u < t.eMarks[i]; ) {
    const k = t.src.charCodeAt(u);
    if (k !== 124 && k !== 45 && k !== 58 && !R(k)) return !1;
    u++;
  }
  let l = Ir(t, e + 1), c = l.split("|");
  const a = [];
  for (let k = 0; k < c.length; k++) {
    const C = c[k].trim();
    if (!C) {
      if (k === 0 || k === c.length - 1) continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(C)) return !1;
    C.charCodeAt(C.length - 1) === 58 ? a.push(C.charCodeAt(0) === 58 ? "center" : "right") : C.charCodeAt(0) === 58 ? a.push("left") : a.push("");
  }
  if (l = Ir(t, e).trim(), l.indexOf("|") === -1 || t.sCount[e] - t.blkIndent >= 4) return !1;
  c = Lu(l), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop();
  const f = c.length;
  if (f === 0 || f !== a.length) return !1;
  if (r) return !0;
  const p = t.parentType;
  t.parentType = "table";
  const d = t.md.block.ruler.getRules("blockquote"), h = t.push("table_open", "table", 1), A = [e, 0];
  h.map = A;
  const m = t.push("thead_open", "thead", 1);
  m.map = [e, e + 1];
  const g = t.push("tr_open", "tr", 1);
  g.map = [e, e + 1];
  for (let k = 0; k < c.length; k++) {
    const C = t.push("th_open", "th", 1);
    a[k] && (C.attrs = [["style", `text-align:${a[k]}`]]);
    const E = t.push("inline", "", 0);
    E.content = c[k].trim(), E.children = [], t.push("th_close", "th", -1);
  }
  t.push("tr_close", "tr", -1), t.push("thead_close", "thead", -1);
  let x, b = 0;
  for (i = e + 2; i < n && !(t.sCount[i] < t.blkIndent); i++) {
    let k = !1;
    for (let E = 0, D = d.length; E < D; E++) if (d[E](t, i, n, !0)) {
      k = !0;
      break;
    }
    if (k || (l = Ir(t, i).trim(), !l) || t.sCount[i] - t.blkIndent >= 4 || (c = Lu(l), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop(), b += f - c.length, b > nd)) break;
    if (i === e + 2) {
      const E = t.push("tbody_open", "tbody", 1);
      E.map = x = [e + 2, 0];
    }
    const C = t.push("tr_open", "tr", 1);
    C.map = [i, i + 1];
    for (let E = 0; E < f; E++) {
      const D = t.push("td_open", "td", 1);
      a[E] && (D.attrs = [["style", `text-align:${a[E]}`]]);
      const I = t.push("inline", "", 0);
      I.content = c[E] ? c[E].trim() : "", I.children = [], t.push("td_close", "td", -1);
    }
    t.push("tr_close", "tr", -1);
  }
  return x && (t.push("tbody_close", "tbody", -1), x[1] = i), t.push("table_close", "table", -1), A[1] = i, t.parentType = p, t.line = i, !0;
}
function id(t, e, n) {
  if (t.sCount[e] - t.blkIndent < 4) return !1;
  let r = e + 1, i = r;
  for (; r < n; ) {
    if (t.isEmpty(r)) {
      r++;
      continue;
    }
    if (t.sCount[r] - t.blkIndent >= 4) {
      r++, i = r;
      continue;
    }
    break;
  }
  t.line = i;
  const u = t.push("code_block", "code", 0);
  return u.content = t.getLines(e, i, 4 + t.blkIndent, !1) + `
`, u.map = [e, t.line], !0;
}
function ud(t, e, n, r) {
  let i = t.bMarks[e] + t.tShift[e], u = t.eMarks[e];
  if (t.sCount[e] - t.blkIndent >= 4 || i + 3 > u) return !1;
  const o = t.src.charCodeAt(i);
  if (o !== 126 && o !== 96) return !1;
  let s = i;
  i = t.skipChars(i, o);
  let l = i - s;
  if (l < 3) return !1;
  const c = t.src.slice(s, i), a = t.src.slice(i, u);
  if (o === 96 && a.indexOf(String.fromCharCode(o)) >= 0)
    return !1;
  if (r) return !0;
  let f = e, p = !1;
  for (; f++, !(f >= n || (i = s = t.bMarks[f] + t.tShift[f], u = t.eMarks[f], i < u && t.sCount[f] < t.blkIndent)); )
    if (t.src.charCodeAt(i) === o && !(t.sCount[f] - t.blkIndent >= 4) && (i = t.skipChars(i, o), !(i - s < l) && (i = t.skipSpaces(i), !(i < u)))) {
      p = !0;
      break;
    }
  l = t.sCount[e], t.line = f + (p ? 1 : 0);
  const d = t.push("fence", "code", 0);
  return d.info = a, d.content = t.getLines(e + 1, f, l, !0), d.markup = c, d.map = [e, t.line], !0;
}
function od(t, e, n, r) {
  let i = t.bMarks[e] + t.tShift[e], u = t.eMarks[e];
  const o = t.lineMax;
  if (t.sCount[e] - t.blkIndent >= 4 || t.src.charCodeAt(i) !== 62) return !1;
  if (r) return !0;
  const s = [], l = [], c = [], a = [], f = t.md.block.ruler.getRules("blockquote"), p = t.parentType;
  t.parentType = "blockquote";
  let d = !1, h;
  for (h = e; h < n; h++) {
    const b = t.sCount[h] < t.blkIndent;
    if (i = t.bMarks[h] + t.tShift[h], u = t.eMarks[h], i >= u) break;
    if (t.src.charCodeAt(i++) === 62 && !b) {
      let C = t.sCount[h] + 1, E, D;
      t.src.charCodeAt(i) === 32 ? (i++, C++, D = !1, E = !0) : t.src.charCodeAt(i) === 9 ? (E = !0, (t.bsCount[h] + C) % 4 === 3 ? (i++, C++, D = !1) : D = !0) : E = !1;
      let I = C;
      for (s.push(t.bMarks[h]), t.bMarks[h] = i; i < u; ) {
        const S = t.src.charCodeAt(i);
        if (R(S)) S === 9 ? I += 4 - (I + t.bsCount[h] + (D ? 1 : 0)) % 4 : I++;
        else break;
        i++;
      }
      d = i >= u, l.push(t.bsCount[h]), t.bsCount[h] = t.sCount[h] + 1 + (E ? 1 : 0), c.push(t.sCount[h]), t.sCount[h] = I - C, a.push(t.tShift[h]), t.tShift[h] = i - t.bMarks[h];
      continue;
    }
    if (d) break;
    let k = !1;
    for (let C = 0, E = f.length; C < E; C++) if (f[C](t, h, n, !0)) {
      k = !0;
      break;
    }
    if (k) {
      t.lineMax = h, t.blkIndent !== 0 && (s.push(t.bMarks[h]), l.push(t.bsCount[h]), a.push(t.tShift[h]), c.push(t.sCount[h]), t.sCount[h] -= t.blkIndent);
      break;
    }
    s.push(t.bMarks[h]), l.push(t.bsCount[h]), a.push(t.tShift[h]), c.push(t.sCount[h]), t.sCount[h] = -1;
  }
  const A = t.blkIndent;
  t.blkIndent = 0;
  const m = t.push("blockquote_open", "blockquote", 1);
  m.markup = ">";
  const g = [e, 0];
  m.map = g, t.md.block.tokenize(t, e, h);
  const x = t.push("blockquote_close", "blockquote", -1);
  x.markup = ">", t.lineMax = o, t.parentType = p, g[1] = t.line;
  for (let b = 0; b < a.length; b++)
    t.bMarks[b + e] = s[b], t.tShift[b + e] = a[b], t.sCount[b + e] = c[b], t.bsCount[b + e] = l[b];
  return t.blkIndent = A, !0;
}
function sd(t, e, n, r) {
  const i = t.eMarks[e];
  if (t.sCount[e] - t.blkIndent >= 4) return !1;
  let u = t.bMarks[e] + t.tShift[e];
  const o = t.src.charCodeAt(u++);
  if (o !== 42 && o !== 45 && o !== 95) return !1;
  let s = 1;
  for (; u < i; ) {
    const c = t.src.charCodeAt(u++);
    if (c !== o && !R(c)) return !1;
    c === o && s++;
  }
  if (s < 3) return !1;
  if (r) return !0;
  t.line = e + 1;
  const l = t.push("hr", "hr", 0);
  return l.map = [e, t.line], l.markup = Array(s + 1).join(String.fromCharCode(o)), !0;
}
function Zu(t, e) {
  const n = t.eMarks[e];
  let r = t.bMarks[e] + t.tShift[e];
  const i = t.src.charCodeAt(r++);
  return i !== 42 && i !== 45 && i !== 43 || r < n && !R(t.src.charCodeAt(r)) ? -1 : r;
}
function Yu(t, e) {
  const n = t.bMarks[e] + t.tShift[e], r = t.eMarks[e];
  let i = n;
  if (i + 1 >= r) return -1;
  let u = t.src.charCodeAt(i++);
  if (u < 48 || u > 57) return -1;
  for (; ; ) {
    if (i >= r) return -1;
    if (u = t.src.charCodeAt(i++), u >= 48 && u <= 57) {
      if (i - n >= 10) return -1;
      continue;
    }
    if (u === 41 || u === 46) break;
    return -1;
  }
  return i < r && (u = t.src.charCodeAt(i), !R(u)) ? -1 : i;
}
function ld(t, e) {
  const n = t.level + 2;
  for (let r = e + 2, i = t.tokens.length - 2; r < i; r++) t.tokens[r].level === n && t.tokens[r].type === "paragraph_open" && (t.tokens[r + 2].hidden = !0, t.tokens[r].hidden = !0, r += 2);
}
function cd(t, e, n, r) {
  let i, u, o, s, l = e, c = !0;
  if (t.sCount[l] - t.blkIndent >= 4 || t.listIndent >= 0 && t.sCount[l] - t.listIndent >= 4 && t.sCount[l] < t.blkIndent) return !1;
  let a = !1;
  r && t.parentType === "paragraph" && t.sCount[l] >= t.blkIndent && (a = !0);
  let f, p, d;
  if ((d = Yu(t, l)) >= 0) {
    if (f = !0, o = t.bMarks[l] + t.tShift[l], p = Number(t.src.slice(o, d - 1)), a && p !== 1) return !1;
  } else if ((d = Zu(t, l)) >= 0) f = !1;
  else return !1;
  if (a && t.skipSpaces(d) >= t.eMarks[l])
    return !1;
  if (r) return !0;
  const h = t.src.charCodeAt(d - 1), A = t.tokens.length;
  f ? (s = t.push("ordered_list_open", "ol", 1), p !== 1 && (s.attrs = [["start", p]])) : s = t.push("bullet_list_open", "ul", 1);
  const m = [l, 0];
  s.map = m, s.markup = String.fromCharCode(h);
  let g = !1;
  const x = t.md.block.ruler.getRules("list"), b = t.parentType;
  for (t.parentType = "list"; l < n; ) {
    u = d, i = t.eMarks[l];
    const k = t.sCount[l] + d - (t.bMarks[l] + t.tShift[l]);
    let C = k;
    for (; u < i; ) {
      const ie = t.src.charCodeAt(u);
      if (ie === 9) C += 4 - (C + t.bsCount[l]) % 4;
      else if (ie === 32) C++;
      else break;
      u++;
    }
    const E = u;
    let D;
    E >= i ? D = 1 : D = C - k, D > 4 && (D = 1);
    const I = k + D;
    s = t.push("list_item_open", "li", 1), s.markup = String.fromCharCode(h);
    const S = [l, 0];
    s.map = S, f && (s.info = t.src.slice(o, d - 1));
    const de = t.tight, Te = t.tShift[l], et = t.sCount[l], Ot = t.listIndent;
    if (t.listIndent = t.blkIndent, t.blkIndent = I, t.tight = !0, t.tShift[l] = E - t.bMarks[l], t.sCount[l] = C, E >= i && t.isEmpty(l + 1) ? t.line = Math.min(t.line + 2, n) : t.md.block.tokenize(t, l, n), (!t.tight || g) && (c = !1), g = t.line - l > 1 && t.isEmpty(t.line - 1), t.blkIndent = t.listIndent, t.listIndent = Ot, t.tShift[l] = Te, t.sCount[l] = et, t.tight = de, s = t.push("list_item_close", "li", -1), s.markup = String.fromCharCode(h), l = t.line, S[1] = l, l >= n || t.sCount[l] < t.blkIndent || t.sCount[l] - t.blkIndent >= 4) break;
    let Rt = !1;
    for (let ie = 0, or = x.length; ie < or; ie++) if (x[ie](t, l, n, !0)) {
      Rt = !0;
      break;
    }
    if (Rt) break;
    if (f) {
      if (d = Yu(t, l), d < 0) break;
      o = t.bMarks[l] + t.tShift[l];
    } else if (d = Zu(t, l), d < 0) break;
    if (h !== t.src.charCodeAt(d - 1)) break;
  }
  return f ? s = t.push("ordered_list_close", "ol", -1) : s = t.push("bullet_list_close", "ul", -1), s.markup = String.fromCharCode(h), m[1] = l, t.line = l, t.parentType = b, c && ld(t, A), !0;
}
function ad(t, e, n, r) {
  let i = t.bMarks[e] + t.tShift[e], u = t.eMarks[e], o = e + 1;
  if (t.sCount[e] - t.blkIndent >= 4 || t.src.charCodeAt(i) !== 91) return !1;
  function s(k) {
    const C = t.lineMax;
    if (k >= C || t.isEmpty(k)) return null;
    let E = !1;
    if (t.sCount[k] - t.blkIndent > 3 && (E = !0), t.sCount[k] < 0 && (E = !0), !E) {
      const S = t.md.block.ruler.getRules("reference"), de = t.parentType;
      t.parentType = "reference";
      let Te = !1;
      for (let et = 0, Ot = S.length; et < Ot; et++) if (S[et](t, k, C, !0)) {
        Te = !0;
        break;
      }
      if (t.parentType = de, Te) return null;
    }
    const D = t.bMarks[k] + t.tShift[k], I = t.eMarks[k];
    return t.src.slice(D, I + 1);
  }
  let l = t.src.slice(i, u + 1);
  u = l.length;
  let c = -1;
  for (i = 1; i < u; i++) {
    const k = l.charCodeAt(i);
    if (k === 91) return !1;
    if (k === 93) {
      c = i;
      break;
    } else if (k === 10) {
      const C = s(o);
      C !== null && (l += C, u = l.length, o++);
    } else if (k === 92 && (i++, i < u && l.charCodeAt(i) === 10)) {
      const C = s(o);
      C !== null && (l += C, u = l.length, o++);
    }
  }
  if (c < 0 || l.charCodeAt(c + 1) !== 58) return !1;
  for (i = c + 2; i < u; i++) {
    const k = l.charCodeAt(i);
    if (k === 10) {
      const C = s(o);
      C !== null && (l += C, u = l.length, o++);
    } else if (!R(k)) break;
  }
  const a = t.md.helpers.parseLinkDestination(l, i, u);
  if (!a.ok) return !1;
  const f = t.md.normalizeLink(a.str);
  if (!t.md.validateLink(f)) return !1;
  i = a.pos;
  const p = i, d = o, h = i;
  for (; i < u; i++) {
    const k = l.charCodeAt(i);
    if (k === 10) {
      const C = s(o);
      C !== null && (l += C, u = l.length, o++);
    } else if (!R(k)) break;
  }
  let A = t.md.helpers.parseLinkTitle(l, i, u);
  for (; A.can_continue; ) {
    const k = s(o);
    if (k === null) break;
    l += k, i = u, u = l.length, o++, A = t.md.helpers.parseLinkTitle(l, i, u, A);
  }
  let m;
  for (i < u && h !== i && A.ok ? (m = A.str, i = A.pos) : (m = "", i = p, o = d); i < u && R(l.charCodeAt(i)); )
    i++;
  if (i < u && l.charCodeAt(i) !== 10 && m)
    for (m = "", i = p, o = d; i < u && R(l.charCodeAt(i)); )
      i++;
  if (i < u && l.charCodeAt(i) !== 10) return !1;
  const g = Xn(l.slice(1, c));
  if (!g) return !1;
  if (r) return !0;
  typeof t.env.references > "u" && (t.env.references = {}), typeof t.env.references[g] > "u" && (t.env.references[g] = {
    title: m,
    href: f
  });
  const x = t.push("reference_definition", "", 0);
  x.map = [e, o], x.hidden = !0;
  const b = /* @__PURE__ */ Object.create(null);
  return b.label = g, x.meta = b, t.line = o, !0;
}
var fd = [
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "search",
  "section",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul"
], dl = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`, pl = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", hd = new RegExp(`^(?:${dl}|${pl}|<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->|<[?][\\s\\S]*?[?]>|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`), dd = new RegExp(`^(?:${dl}|${pl})`), tt = [
  [
    /^<(script|pre|style|textarea)(?=(\s|>|$))/i,
    /<\/(script|pre|style|textarea)>/i,
    !0
  ],
  [
    /^<!--/,
    /-->/,
    !0
  ],
  [
    /^<\?/,
    /\?>/,
    !0
  ],
  [
    /^<![A-Za-z]/,
    />/,
    !0
  ],
  [
    /^<!\[CDATA\[/,
    /\]\]>/,
    !0
  ],
  [
    new RegExp(`^</?(${fd.join("|")})(?=(\\s|/?>|$))`, "i"),
    /^$/,
    !0
  ],
  [
    new RegExp(`${dd.source}\\s*$`),
    /^$/,
    !1
  ]
];
function pd(t, e, n, r) {
  let i = t.bMarks[e] + t.tShift[e], u = t.eMarks[e];
  if (t.sCount[e] - t.blkIndent >= 4 || !t.md.options.html || t.src.charCodeAt(i) !== 60) return !1;
  let o = t.src.slice(i, u), s = 0;
  for (; s < tt.length && !tt[s][0].test(o); s++) ;
  if (s === tt.length) return !1;
  if (r) return tt[s][2];
  let l = e + 1;
  const c = tt[s][1].test("");
  if (!tt[s][1].test(o)) {
    for (; l < n && !(t.sCount[l] < t.blkIndent && (c || !t.isEmpty(l))); l++)
      if (i = t.bMarks[l] + t.tShift[l], u = t.eMarks[l], o = t.src.slice(i, u), tt[s][1].test(o)) {
        o.length !== 0 && l++;
        break;
      }
  }
  t.line = l;
  const a = t.push("html_block", "", 0);
  return a.map = [e, l], a.content = t.getLines(e, l, t.blkIndent, !0), !0;
}
function Ad(t, e, n, r) {
  let i = t.bMarks[e] + t.tShift[e], u = t.eMarks[e];
  if (t.sCount[e] - t.blkIndent >= 4) return !1;
  let o = t.src.charCodeAt(i);
  if (o !== 35 || i >= u) return !1;
  let s = 1;
  for (o = t.src.charCodeAt(++i); o === 35 && i < u && s <= 6; )
    s++, o = t.src.charCodeAt(++i);
  if (s > 6 || i < u && !R(o)) return !1;
  if (r) return !0;
  u = t.skipSpacesBack(u, i);
  const l = t.skipCharsBack(u, 35, i);
  l > i && R(t.src.charCodeAt(l - 1)) && (u = l), t.line = e + 1;
  const c = t.push("heading_open", `h${s}`, 1);
  c.markup = "########".slice(0, s), c.map = [e, t.line];
  const a = t.push("inline", "", 0);
  a.content = er(t.src.slice(i, u)), a.map = [e, t.line], a.children = [];
  const f = t.push("heading_close", `h${s}`, -1);
  return f.markup = "########".slice(0, s), !0;
}
function md(t, e, n) {
  const r = t.md.block.ruler.getRules("paragraph");
  if (t.sCount[e] - t.blkIndent >= 4) return !1;
  const i = t.parentType;
  t.parentType = "paragraph";
  let u = 0, o, s = e + 1;
  for (; s < n && !t.isEmpty(s); s++) {
    if (t.sCount[s] - t.blkIndent > 3) continue;
    if (t.sCount[s] >= t.blkIndent) {
      let d = t.bMarks[s] + t.tShift[s];
      const h = t.eMarks[s];
      if (d < h && (o = t.src.charCodeAt(d), (o === 45 || o === 61) && (d = t.skipChars(d, o), d = t.skipSpaces(d), d >= h))) {
        u = o === 61 ? 1 : 2;
        break;
      }
    }
    if (t.sCount[s] < 0) continue;
    let p = !1;
    for (let d = 0, h = r.length; d < h; d++) if (r[d](t, s, n, !0)) {
      p = !0;
      break;
    }
    if (p) break;
  }
  if (!u)
    return t.parentType = i, !1;
  const l = er(t.getLines(e, s, t.blkIndent, !1));
  t.line = s + 1;
  const c = t.push("heading_open", `h${u}`, 1);
  c.markup = String.fromCharCode(o), c.map = [e, t.line];
  const a = t.push("inline", "", 0);
  a.content = l, a.map = [e, t.line - 1], a.children = [];
  const f = t.push("heading_close", `h${u}`, -1);
  return f.markup = String.fromCharCode(o), t.parentType = i, !0;
}
function gd(t, e, n) {
  const r = t.md.block.ruler.getRules("paragraph"), i = t.parentType;
  let u = e + 1;
  for (t.parentType = "paragraph"; u < n && !t.isEmpty(u); u++) {
    if (t.sCount[u] - t.blkIndent > 3 || t.sCount[u] < 0) continue;
    let c = !1;
    for (let a = 0, f = r.length; a < f; a++) if (r[a](t, u, n, !0)) {
      c = !0;
      break;
    }
    if (c) break;
  }
  const o = er(t.getLines(e, u, t.blkIndent, !1));
  t.line = u;
  const s = t.push("paragraph_open", "p", 1);
  s.map = [e, t.line];
  const l = t.push("inline", "", 0);
  return l.content = o, l.map = [e, t.line], l.children = [], t.push("paragraph_close", "p", -1), t.parentType = i, !0;
}
var _n = [
  [
    "table",
    rd,
    ["paragraph", "reference"]
  ],
  ["code", id],
  [
    "fence",
    ud,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "blockquote",
    od,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "hr",
    sd,
    [
      "paragraph",
      "reference",
      "blockquote",
      "list"
    ]
  ],
  [
    "list",
    cd,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["reference", ad],
  [
    "html_block",
    pd,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  [
    "heading",
    Ad,
    [
      "paragraph",
      "reference",
      "blockquote"
    ]
  ],
  ["lheading", md],
  ["paragraph", gd]
], Al = class {
  constructor() {
    _(
      this,
      /**
      * {@link Ruler} instance. Keep configuration of block rules.
      */
      "ruler",
      new cn()
    ), _(this, "State", hl);
    for (let e = 0; e < _n.length; e++) this.ruler.push(_n[e][0], _n[e][1], { alt: (_n[e][2] || []).slice() });
  }
  tokenize(e, n, r) {
    const i = this.ruler.getRules(""), u = i.length, o = e.md.options.maxNesting;
    let s = n, l = !1;
    for (; s < r && (e.line = s = e.skipEmptyLines(s), !(s >= r || e.sCount[s] < e.blkIndent)); ) {
      if (e.level >= o) {
        e.line = r;
        break;
      }
      const c = e.line;
      let a = !1;
      for (let f = 0; f < u; f++)
        if (a = i[f](e, s, r, !1), a) {
          if (c >= e.line) throw new Error("block rule didn't increment state.line");
          break;
        }
      if (!a) throw new Error("none of the block rules matched");
      e.tight = !l, e.isEmpty(e.line - 1) && (l = !0), s = e.line, s < r && e.isEmpty(s) && (l = !0, s++, e.line = s);
    }
  }
  /**
  * Process input string and push block tokens into `outTokens`
  */
  parse(e, n, r, i) {
    if (!e) return;
    const u = new this.State(e, n, r, i);
    this.tokenize(u, u.line, u.lineMax);
  }
}, ml = class {
  constructor(e, n, r, i) {
    _(this, "pos", 0), _(this, "level", 0), _(this, "pending", ""), _(this, "pendingLevel", 0), _(this, "cache", {}), _(this, "backticks", {}), _(this, "backticksScanned", !1), _(this, "linkLevel", 0), _(this, "delimiters", []), _(this, "_prev_delimiters", []), _(this, "Token", ht), this.src = e, this.env = r, this.md = n, this.tokens = i, this.tokens_meta = Array(i.length), this.posMax = this.src.length;
  }
  pushPending() {
    const e = new ht("text", "", 0);
    return e.content = this.pending, e.level = this.pendingLevel, this.tokens.push(e), this.pending = "", e;
  }
  push(e, n, r) {
    this.pending && this.pushPending();
    const i = new ht(e, n, r);
    let u;
    return r < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), i.level = this.level, r > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], u = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(i), this.tokens_meta.push(u), i;
  }
  scanDelims(e, n) {
    const r = this.posMax, i = this.src.charCodeAt(e);
    let u;
    if (e === 0) u = 32;
    else if (e === 1)
      u = this.src.charCodeAt(0), (u & 63488) === 55296 && (u = 65533);
    else if (u = this.src.charCodeAt(e - 1), (u & 64512) === 56320) {
      const A = this.src.charCodeAt(e - 2);
      u = (A & 64512) === 55296 ? 65536 + (A - 55296 << 10) + (u - 56320) : 65533;
    } else (u & 64512) === 55296 && (u = 65533);
    let o = e;
    for (; o < r && this.src.charCodeAt(o) === i; ) o++;
    const s = o - e;
    let l = o < r ? this.src.charCodeAt(o) : 32;
    if ((l & 64512) === 55296) {
      const A = this.src.charCodeAt(o + 1);
      l = (A & 64512) === 56320 ? 65536 + (l - 55296 << 10) + (A - 56320) : 65533;
    } else (l & 64512) === 56320 && (l = 65533);
    const c = sn(u) || on(u), a = sn(l) || on(l), f = un(u), p = un(l), d = !p && (!a || f || c), h = !f && (!c || p || a);
    return {
      can_open: d && (n || !h || c),
      can_close: h && (n || !d || a),
      length: s
    };
  }
};
function bd(t) {
  switch (t) {
    case 10:
    case 33:
    case 35:
    case 36:
    case 37:
    case 38:
    case 42:
    case 43:
    case 45:
    case 58:
    case 60:
    case 61:
    case 62:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 125:
    case 126:
      return !0;
    default:
      return !1;
  }
}
function kd(t, e) {
  let n = t.pos;
  for (; n < t.posMax && !bd(t.src.charCodeAt(n)); ) n++;
  return n === t.pos ? !1 : (e || (t.pending += t.src.slice(t.pos, n)), t.pos = n, !0);
}
var xd = /(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;
function Cd(t, e) {
  if (!t.md.options.linkify || t.linkLevel > 0) return !1;
  const n = t.pos, r = t.posMax;
  if (n + 3 > r || t.src.charCodeAt(n) !== 58 || t.src.charCodeAt(n + 1) !== 47 || t.src.charCodeAt(n + 2) !== 47) return !1;
  const i = t.pending.match(xd);
  if (!i) return !1;
  const u = i[1], o = t.md.linkify.matchAtStart(t.src.slice(n - u.length));
  if (!o) return !1;
  let s = o.url;
  if (s.length <= u.length) return !1;
  let l = s.length;
  for (; l > 0 && s.charCodeAt(l - 1) === 42; ) l--;
  l !== s.length && (s = s.slice(0, l));
  const c = t.md.normalizeLink(s);
  if (!t.md.validateLink(c)) return !1;
  if (!e) {
    t.pending = t.pending.slice(0, -u.length);
    const a = t.push("link_open", "a", 1);
    a.attrs = [["href", c]], a.markup = "linkify", a.info = "auto";
    const f = t.push("text", "", 0);
    f.content = t.md.normalizeLinkText(s);
    const p = t.push("link_close", "a", -1);
    p.markup = "linkify", p.info = "auto";
  }
  return t.pos += s.length - u.length, !0;
}
function yd(t, e) {
  let n = t.pos;
  if (t.src.charCodeAt(n) !== 10) return !1;
  const r = t.pending.length - 1, i = t.posMax;
  if (!e) if (r >= 0 && t.pending.charCodeAt(r) === 32) if (r >= 1 && t.pending.charCodeAt(r - 1) === 32) {
    let u = r - 1;
    for (; u >= 1 && t.pending.charCodeAt(u - 1) === 32; ) u--;
    t.pending = t.pending.slice(0, u), t.push("hardbreak", "br", 0);
  } else
    t.pending = t.pending.slice(0, -1), t.push("softbreak", "br", 0);
  else t.push("softbreak", "br", 0);
  for (n++; n < i && R(t.src.charCodeAt(n)); ) n++;
  return t.pos = n, !0;
}
var Di = [];
for (let t = 0; t < 256; t++) Di.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(t) {
  Di[t.charCodeAt(0)] = 1;
});
function Dd(t, e) {
  let n = t.pos;
  const r = t.posMax;
  if (t.src.charCodeAt(n) !== 92 || (n++, n >= r)) return !1;
  let i = t.src.charCodeAt(n);
  if (i === 10) {
    for (e || t.push("hardbreak", "br", 0), n++; n < r && (i = t.src.charCodeAt(n), !!R(i)); )
      n++;
    return t.pos = n, !0;
  }
  if (i === 32) {
    if (!e) {
      const s = t.push("text_special", "", 0);
      s.content = "\\", s.markup = "\\", s.info = "escape";
    }
    return t.pos = n, !0;
  }
  let u = t.src[n];
  if (i >= 55296 && i <= 56319 && n + 1 < r) {
    const s = t.src.charCodeAt(n + 1);
    s >= 56320 && s <= 57343 && (u += t.src[n + 1], n++);
  }
  const o = "\\" + u;
  if (!e) {
    const s = t.push("text_special", "", 0);
    i < 256 && Di[i] !== 0 ? s.content = u : s.content = o, s.markup = o, s.info = "escape";
  }
  return t.pos = n + 1, !0;
}
function Ed(t, e) {
  let n = t.pos;
  if (t.src.charCodeAt(n) !== 96) return !1;
  const r = n;
  n++;
  const i = t.posMax;
  for (; n < i && t.src.charCodeAt(n) === 96; ) n++;
  const u = t.src.slice(r, n), o = u.length;
  if (t.backticksScanned && (t.backticks[o] || 0) <= r)
    return e || (t.pending += u), t.pos += o, !0;
  let s = n, l;
  for (; (l = t.src.indexOf("`", s)) !== -1; ) {
    for (s = l + 1; s < i && t.src.charCodeAt(s) === 96; ) s++;
    const c = s - l;
    if (c === o) {
      if (!e) {
        const a = t.push("code_inline", "code", 0);
        a.markup = u, a.content = t.src.slice(n, l).replace(/\n/g, " ").replace(/^ (.+) $/, "$1");
      }
      return t.pos = s, !0;
    }
    t.backticks[c] = l;
  }
  return t.backticksScanned = !0, e || (t.pending += u), t.pos += o, !0;
}
function Fd(t, e) {
  const n = t.pos, r = t.src.charCodeAt(n);
  if (e || r !== 126) return !1;
  const i = t.scanDelims(t.pos, !0);
  let u = i.length;
  const o = String.fromCharCode(r);
  if (u < 2) return !1;
  let s;
  u % 2 && (s = t.push("text", "", 0), s.content = o, u--);
  for (let l = 0; l < u; l += 2)
    s = t.push("text", "", 0), s.content = o + o, t.delimiters.push({
      marker: r,
      length: 0,
      token: t.tokens.length - 1,
      end: -1,
      open: i.can_open,
      close: i.can_close
    });
  return t.pos += i.length, !0;
}
function Hu(t, e) {
  let n;
  const r = [], i = e.length;
  for (let u = 0; u < i; u++) {
    const o = e[u];
    if (o.marker !== 126 || o.end === -1) continue;
    const s = e[o.end];
    n = t.tokens[o.token], n.type = "s_open", n.tag = "s", n.nesting = 1, n.markup = "~~", n.content = "", n = t.tokens[s.token], n.type = "s_close", n.tag = "s", n.nesting = -1, n.markup = "~~", n.content = "", t.tokens[s.token - 1].type === "text" && t.tokens[s.token - 1].content === "~" && r.push(s.token - 1);
  }
  for (; r.length; ) {
    const u = r.pop();
    let o = u + 1;
    for (; o < t.tokens.length && t.tokens[o].type === "s_close"; ) o++;
    o--, u !== o && (n = t.tokens[o], t.tokens[o] = t.tokens[u], t.tokens[u] = n);
  }
}
function _d(t) {
  const e = t.tokens_meta, n = t.tokens_meta.length;
  Hu(t, t.delimiters);
  for (let i = 0; i < n; i++) {
    var r;
    const u = (r = e[i]) === null || r === void 0 ? void 0 : r.delimiters;
    u && Hu(t, u);
  }
}
var gl = {
  tokenize: Fd,
  postProcess: _d
};
function wd(t, e) {
  const n = t.pos, r = t.src.charCodeAt(n);
  if (e || r !== 95 && r !== 42) return !1;
  const i = t.scanDelims(t.pos, r === 42);
  for (let u = 0; u < i.length; u++) {
    const o = t.push("text", "", 0);
    o.content = String.fromCharCode(r), t.delimiters.push({
      marker: r,
      length: i.length,
      token: t.tokens.length - 1,
      end: -1,
      open: i.can_open,
      close: i.can_close
    });
  }
  return t.pos += i.length, !0;
}
function Vu(t, e) {
  const n = e.length;
  for (let r = n - 1; r >= 0; r--) {
    const i = e[r];
    if (i.marker !== 95 && i.marker !== 42 || i.end === -1) continue;
    const u = e[i.end], o = r > 0 && e[r - 1].end === i.end + 1 && e[r - 1].marker === i.marker && e[r - 1].token === i.token - 1 && e[i.end + 1].token === u.token + 1, s = String.fromCharCode(i.marker), l = t.tokens[i.token];
    l.type = o ? "strong_open" : "em_open", l.tag = o ? "strong" : "em", l.nesting = 1, l.markup = o ? s + s : s, l.content = "";
    const c = t.tokens[u.token];
    c.type = o ? "strong_close" : "em_close", c.tag = o ? "strong" : "em", c.nesting = -1, c.markup = o ? s + s : s, c.content = "", o && (t.tokens[e[r - 1].token].content = "", t.tokens[e[i.end + 1].token].content = "", r--);
  }
}
function Id(t) {
  const e = t.tokens_meta, n = t.tokens_meta.length;
  Vu(t, t.delimiters);
  for (let i = 0; i < n; i++) {
    var r;
    const u = (r = e[i]) === null || r === void 0 ? void 0 : r.delimiters;
    u && Vu(t, u);
  }
}
var bl = {
  tokenize: wd,
  postProcess: Id
};
function Bd(t, e) {
  let n, r, i, u, o = "", s = "", l = t.pos, c = !0;
  if (t.src.charCodeAt(t.pos) !== 91) return !1;
  const a = t.pos, f = t.posMax, p = t.pos + 1, d = t.md.helpers.parseLinkLabel(t, t.pos, !0);
  if (d < 0) return !1;
  let h = d + 1;
  if (h < f && t.src.charCodeAt(h) === 40) {
    for (c = !1, h++; h < f && (n = t.src.charCodeAt(h), !(!R(n) && n !== 10)); h++)
      ;
    if (h >= f) return !1;
    if (l = h, i = t.md.helpers.parseLinkDestination(t.src, h, t.posMax), i.ok) {
      for (o = t.md.normalizeLink(i.str), t.md.validateLink(o) ? h = i.pos : o = "", l = h; h < f && (n = t.src.charCodeAt(h), !(!R(n) && n !== 10)); h++)
        ;
      if (i = t.md.helpers.parseLinkTitle(t.src, h, t.posMax), h < f && l !== h && i.ok)
        for (s = i.str, h = i.pos; h < f && (n = t.src.charCodeAt(h), !(!R(n) && n !== 10)); h++)
          ;
    }
    (h >= f || t.src.charCodeAt(h) !== 41) && (c = !0), h++;
  }
  if (c) {
    if (typeof t.env.references > "u") return !1;
    if (h < f && t.src.charCodeAt(h) === 91 ? (l = h + 1, h = t.md.helpers.parseLinkLabel(t, h), h >= 0 ? r = t.src.slice(l, h++) : h = d + 1) : h = d + 1, r || (r = t.src.slice(p, d)), r = Xn(r), u = t.env.references[r], !u)
      return t.pos = a, !1;
    o = u.href, s = u.title;
  }
  if (!e) {
    t.pos = p, t.posMax = d;
    const A = t.push("link_open", "a", 1), m = [["href", o]];
    if (A.attrs = m, s && m.push(["title", s]), r) {
      const g = /* @__PURE__ */ Object.create(null);
      g.label = r, A.meta = g;
    }
    t.linkLevel++, t.md.inline.tokenize(t), t.linkLevel--, t.push("link_close", "a", -1);
  }
  return t.pos = h, t.posMax = f, !0;
}
function Sd(t, e) {
  let n, r, i, u, o, s, l, c, a = "";
  const f = t.pos, p = t.posMax;
  if (t.src.charCodeAt(t.pos) !== 33 || t.src.charCodeAt(t.pos + 1) !== 91) return !1;
  const d = t.pos + 2, h = t.md.helpers.parseLinkLabel(t, t.pos + 1, !1);
  if (h < 0) return !1;
  if (u = h + 1, u < p && t.src.charCodeAt(u) === 40) {
    for (u++; u < p && (n = t.src.charCodeAt(u), !(!R(n) && n !== 10)); u++)
      ;
    if (u >= p) return !1;
    for (c = u, s = t.md.helpers.parseLinkDestination(t.src, u, t.posMax), s.ok && (a = t.md.normalizeLink(s.str), t.md.validateLink(a) ? u = s.pos : a = ""), c = u; u < p && (n = t.src.charCodeAt(u), !(!R(n) && n !== 10)); u++)
      ;
    if (s = t.md.helpers.parseLinkTitle(t.src, u, t.posMax), u < p && c !== u && s.ok)
      for (l = s.str, u = s.pos; u < p && (n = t.src.charCodeAt(u), !(!R(n) && n !== 10)); u++)
        ;
    else l = "";
    if (u >= p || t.src.charCodeAt(u) !== 41)
      return t.pos = f, !1;
    u++;
  } else {
    if (typeof t.env.references > "u") return !1;
    if (u < p && t.src.charCodeAt(u) === 91 ? (c = u + 1, u = t.md.helpers.parseLinkLabel(t, u), u >= 0 ? i = t.src.slice(c, u++) : u = h + 1) : u = h + 1, i || (i = t.src.slice(d, h)), i = Xn(i), o = t.env.references[i], !o)
      return t.pos = f, !1;
    a = o.href, l = o.title;
  }
  if (!e) {
    r = t.src.slice(d, h);
    const A = [];
    t.md.inline.parse(r, t.md, t.env, A);
    const m = t.push("image", "img", 0), g = [["src", a], ["alt", ""]];
    if (m.attrs = g, m.children = A, m.content = r, l && g.push(["title", l]), i) {
      const x = /* @__PURE__ */ Object.create(null);
      x.label = i, m.meta = x;
    }
  }
  return t.pos = u, t.posMax = p, !0;
}
var Md = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, Nd = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function Od(t, e) {
  let n = t.pos;
  if (t.src.charCodeAt(n) !== 60) return !1;
  const r = t.pos, i = t.posMax;
  for (; ; ) {
    if (++n >= i) return !1;
    const o = t.src.charCodeAt(n);
    if (o === 60) return !1;
    if (o === 62) break;
  }
  const u = t.src.slice(r + 1, n);
  if (Nd.test(u)) {
    const o = t.md.normalizeLink(u);
    if (!t.md.validateLink(o)) return !1;
    if (!e) {
      const s = t.push("link_open", "a", 1);
      s.attrs = [["href", o]], s.markup = "autolink", s.info = "auto";
      const l = t.push("text", "", 0);
      l.content = t.md.normalizeLinkText(u);
      const c = t.push("link_close", "a", -1);
      c.markup = "autolink", c.info = "auto";
    }
    return t.pos += u.length + 2, !0;
  }
  if (Md.test(u)) {
    const o = t.md.normalizeLink(`mailto:${u}`);
    if (!t.md.validateLink(o)) return !1;
    if (!e) {
      const s = t.push("link_open", "a", 1);
      s.attrs = [["href", o]], s.markup = "autolink", s.info = "auto";
      const l = t.push("text", "", 0);
      l.content = t.md.normalizeLinkText(u);
      const c = t.push("link_close", "a", -1);
      c.markup = "autolink", c.info = "auto";
    }
    return t.pos += u.length + 2, !0;
  }
  return !1;
}
function Rd(t) {
  return /^<a[>\s]/i.test(t);
}
function Td(t) {
  return /^<\/a\s*>/i.test(t);
}
function vd(t) {
  const e = t | 32;
  return e >= 97 && e <= 122;
}
function zd(t, e) {
  if (!t.md.options.html) return !1;
  const n = t.posMax, r = t.pos;
  if (t.src.charCodeAt(r) !== 60 || r + 2 >= n) return !1;
  const i = t.src.charCodeAt(r + 1);
  if (i !== 33 && i !== 63 && i !== 47 && !vd(i)) return !1;
  const u = t.src.slice(r).match(hd);
  if (!u) return !1;
  if (!e) {
    const o = t.push("html_inline", "", 0);
    o.content = u[0], Rd(o.content) && t.linkLevel++, Td(o.content) && t.linkLevel--;
  }
  return t.pos += u[0].length, !0;
}
var Qd = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, Kd = /^&([a-z][a-z0-9]{1,31});/i;
function Wd(t, e) {
  const n = t.pos, r = t.posMax;
  if (t.src.charCodeAt(n) !== 38 || n + 1 >= r) return !1;
  if (t.src.charCodeAt(n + 1) === 35) {
    const i = t.src.slice(n).match(Qd);
    if (i) {
      if (!e) {
        const u = i[1][0].toLowerCase() === "x" ? parseInt(i[1].slice(1), 16) : parseInt(i[1], 10), o = t.push("text_special", "", 0);
        o.content = yi(u) ? rn(u) : rn(65533), o.markup = i[0], o.info = "entity";
      }
      return t.pos += i[0].length, !0;
    }
  } else {
    const i = t.src.slice(n).match(Kd);
    if (i) {
      const u = Vs(i[0]);
      if (u !== i[0]) {
        if (!e) {
          const o = t.push("text_special", "", 0);
          o.content = u, o.markup = i[0], o.info = "entity";
        }
        return t.pos += i[0].length, !0;
      }
    }
  }
  return !1;
}
function Uu(t) {
  const e = {}, n = t.length;
  if (!n) return;
  let r = 0, i = -2;
  const u = [];
  for (let o = 0; o < n; o++) {
    const s = t[o];
    if (u.push(0), (t[r].marker !== s.marker || i !== s.token - 1) && (r = o), i = s.token, s.length = s.length || 0, !s.close) continue;
    e.hasOwnProperty(s.marker) || (e[s.marker] = [
      -1,
      -1,
      -1,
      -1,
      -1,
      -1
    ]);
    const l = e[s.marker][(s.open ? 3 : 0) + s.length % 3];
    let c = r - u[r] - 1, a = c;
    for (; c > l; c -= u[c] + 1) {
      const f = t[c];
      if (f.marker === s.marker && f.open && f.end < 0) {
        let p = !1;
        if ((f.close || s.open) && (f.length + s.length) % 3 === 0 && (f.length % 3 !== 0 || s.length % 3 !== 0) && (p = !0), !p) {
          const d = c > 0 && !t[c - 1].open ? u[c - 1] + 1 : 0;
          u[o] = o - c + d, u[c] = d, s.open = !1, f.end = o, f.close = !1, a = -1, i = -2;
          break;
        }
      }
    }
    a !== -1 && (e[s.marker][(s.open ? 3 : 0) + (s.length || 0) % 3] = a);
  }
}
function Pd(t) {
  const e = t.tokens_meta, n = t.tokens_meta.length;
  Uu(t.delimiters);
  for (let i = 0; i < n; i++) {
    var r;
    const u = (r = e[i]) === null || r === void 0 ? void 0 : r.delimiters;
    u && Uu(u);
  }
}
function Jd(t) {
  let e, n, r = 0;
  const i = t.tokens, u = t.tokens.length;
  for (e = n = 0; e < u; e++)
    i[e].nesting < 0 && r--, i[e].level = r, i[e].nesting > 0 && r++, i[e].type === "text" && e + 1 < u && i[e + 1].type === "text" ? i[e + 1].content = i[e].content + i[e + 1].content : (e !== n && (i[n] = i[e]), n++);
  e !== n && (i.length = n);
}
var Br = [
  ["text", kd],
  ["linkify", Cd],
  ["newline", yd],
  ["escape", Dd],
  ["backticks", Ed],
  ["strikethrough", gl.tokenize],
  ["emphasis", bl.tokenize],
  ["link", Bd],
  ["image", Sd],
  ["autolink", Od],
  ["html_inline", zd],
  ["entity", Wd]
], Sr = [
  ["balance_pairs", Pd],
  ["strikethrough", gl.postProcess],
  ["emphasis", bl.postProcess],
  ["fragments_join", Jd]
], kl = class {
  constructor() {
    _(
      this,
      /**
      * {@link Ruler} instance. Keep configuration of inline rules.
      */
      "ruler",
      new cn()
    ), _(
      this,
      /**
      * {@link Ruler} instance. Second ruler used for post-processing
      * (e.g. in emphasis-like rules).
      */
      "ruler2",
      new cn()
    ), _(this, "State", ml);
    for (let e = 0; e < Br.length; e++) this.ruler.push(Br[e][0], Br[e][1]);
    for (let e = 0; e < Sr.length; e++) this.ruler2.push(Sr[e][0], Sr[e][1]);
  }
  skipToken(e) {
    const n = e.pos, r = this.ruler.getRules(""), i = r.length, u = e.md.options.maxNesting, o = e.cache;
    if (typeof o[n] < "u") {
      e.pos = o[n];
      return;
    }
    let s = !1;
    if (e.level < u) {
      for (let l = 0; l < i; l++)
        if (e.level++, s = r[l](e, !0), e.level--, s) {
          if (n >= e.pos) throw new Error("inline rule didn't increment state.pos");
          break;
        }
    } else e.pos = e.posMax;
    s || e.pos++, o[n] = e.pos;
  }
  tokenize(e) {
    const n = this.ruler.getRules(""), r = n.length, i = e.posMax, u = e.md.options.maxNesting;
    for (; e.pos < i; ) {
      const o = e.pos;
      let s = !1;
      if (e.level < u) {
        for (let l = 0; l < r; l++)
          if (s = n[l](e, !1), s) {
            if (o >= e.pos) throw new Error("inline rule didn't increment state.pos");
            break;
          }
      }
      if (s) {
        if (e.pos >= i) break;
        continue;
      }
      e.pending += e.src[e.pos++];
    }
    e.pending && e.pushPending();
  }
  /**
  * Process input string and push inline tokens into `outTokens`
  */
  parse(e, n, r, i) {
    const u = new this.State(e, n, r, i);
    this.tokenize(u);
    const o = this.ruler2.getRules(""), s = o.length;
    for (let l = 0; l < s; l++) o[l](u);
  }
}, Gd = {
  default: {
    options: {
      html: !1,
      xhtmlOut: !1,
      breaks: !1,
      langPrefix: "language-",
      linkify: !1,
      typographer: !1,
      quotes: "“”‘’",
      highlight: null,
      maxNesting: 100
    },
    components: {
      core: {},
      block: {},
      inline: {}
    }
  },
  zero: {
    options: {
      html: !1,
      xhtmlOut: !1,
      breaks: !1,
      langPrefix: "language-",
      linkify: !1,
      typographer: !1,
      quotes: "“”‘’",
      highlight: null,
      maxNesting: 20
    },
    components: {
      core: { rules: [
        "normalize",
        "block",
        "strip_references",
        "inline",
        "text_join"
      ] },
      block: { rules: ["paragraph"] },
      inline: {
        rules: ["text"],
        rules2: ["balance_pairs", "fragments_join"]
      }
    }
  },
  commonmark: {
    options: {
      html: !0,
      xhtmlOut: !0,
      breaks: !1,
      langPrefix: "language-",
      linkify: !1,
      typographer: !1,
      quotes: "“”‘’",
      highlight: null,
      maxNesting: 20
    },
    components: {
      core: { rules: [
        "normalize",
        "block",
        "strip_references",
        "inline",
        "text_join"
      ] },
      block: { rules: [
        "blockquote",
        "code",
        "fence",
        "heading",
        "hr",
        "html_block",
        "lheading",
        "list",
        "reference",
        "paragraph"
      ] },
      inline: {
        rules: [
          "autolink",
          "backticks",
          "emphasis",
          "entity",
          "escape",
          "html_inline",
          "image",
          "link",
          "newline",
          "text"
        ],
        rules2: [
          "balance_pairs",
          "emphasis",
          "fragments_join"
        ]
      }
    }
  }
}, Ld = /^(vbscript|javascript|file|data):/, Zd = /^data:image\/(gif|png|jpeg|webp);/, $u = [
  "http:",
  "https:",
  "mailto:"
], Fe = class {
  /**
  * Link validation function. CommonMark allows too much in links. By default
  * we disable `javascript:`, `vbscript:`, `file:` schemas, and almost all `data:...` schemas
  * except some embedded image types.
  *
  * You can change this behaviour:
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  * const md = new MarkdownIt()
  *
  * // enable everything
  * md.validateLink = function () { return true; }
  * ```
  */
  validateLink(e) {
    const n = e.trim().toLowerCase();
    return Ld.test(n) ? Zd.test(n) : !0;
  }
  /**
  * Function used to encode link url to a machine-readable format,
  * which includes url-encoding, punycode, etc.
  */
  normalizeLink(e) {
    const n = tn(e, !0);
    if (n.hostname && (!n.protocol || $u.indexOf(n.protocol) >= 0))
      try {
        n.hostname = Zn.toASCII(n.hostname);
      } catch {
      }
    return Mt(en(n));
  }
  /**
  * Function used to decode link url to a human-readable format`
  */
  normalizeLinkText(e) {
    const n = tn(e, !0);
    if (n.hostname && (!n.protocol || $u.indexOf(n.protocol) >= 0))
      try {
        n.hostname = Zn.toUnicode(n.hostname);
      } catch {
      }
    return $e(en(n), $e.defaultChars + "%");
  }
  constructor(...e) {
    _(
      this,
      /**
      * Instance of {@link ParserInline}. You may need it to add new rules when
      * writing plugins. For simple rules control use {@link MarkdownIt.disable}
      * and {@link MarkdownIt.enable}.
      */
      "inline",
      new kl()
    ), _(
      this,
      /**
      * Instance of {@link ParserBlock}. You may need it to add new rules when
      * writing plugins. For simple rules control use {@link MarkdownIt.disable}
      * and {@link MarkdownIt.enable}.
      */
      "block",
      new Al()
    ), _(
      this,
      /**
      * Instance of {@link ParserCore} chain executor. You may need it to add new
      * rules when writing plugins. For simple rules control use
      * {@link MarkdownIt.disable} and {@link MarkdownIt.enable}.
      */
      "core",
      new fl()
    ), _(
      this,
      /**
      * Instance of {@link Renderer}. Use it to modify output look. Or to add rendering
      * rules for new token types, generated by plugins.
      *
      * See {@link Renderer} docs and
      * [source code](https://github.com/markdown-it/markdown-it/blob/master/src/renderer.ts).
      *
      * @example
      * ```javascript
      * import MarkdownIt from 'markdown-it'
      * const md = new MarkdownIt()
      *
      * function myToken(tokens, idx, options, env, self) {
      *   //...
      *   return result;
      * };
      *
      * md.renderer.rules['my_token'] = myToken
      * ```
      */
      "renderer",
      new ll()
    ), _(
      this,
      /**
      * [linkify-it](https://github.com/markdown-it/linkify-it) instance.
      * Used by [linkify](https://github.com/markdown-it/markdown-it/blob/master/src/rules_core/linkify.ts)
      * rule.
      */
      "linkify",
      new ih()
    ), _(
      this,
      /**
      * Assorted utility functions, useful to write plugins. See details
      * [here](https://github.com/markdown-it/markdown-it/blob/master/src/common/utils.ts).
      */
      "utils",
      mh
    ), _(
      this,
      /**
      * Link components parser functions, useful to write plugins. See details
      * [here](https://github.com/markdown-it/markdown-it/blob/master/src/helpers).
      */
      "helpers",
      Object.assign({}, Mh)
    );
    const [n, r] = e;
    typeof n == "string" ? (this.configure(n), r && this.set(r)) : (this.configure("default"), this.set(n || {}));
  }
  /**
  * Set parser options (in the same format as in constructor). Probably, you
  * will never need it, but you can change options after constructor call.
  *
  * __Note:__ To achieve the best possible performance, don't modify a
  * `markdown-it` instance options on the fly. If you need multiple configurations
  * it's best to create multiple instances and initialize each with separate
  * config.
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  *
  * const md = new MarkdownIt()
  *   .set({ html: true, breaks: true })
  *   .set({ typographer: true })
  * ```
  */
  set(e) {
    return Object.assign(this.options, e), this;
  }
  /**
  * Batch load of all options and compenent settings. This is internal method,
  * and you probably will not need it. But if you will - see available presets
  * and data structure [here](https://github.com/markdown-it/markdown-it/tree/master/src/presets)
  *
  * We strongly recommend to use presets instead of direct config loads. That
  * will give better compatibility with next versions.
  */
  configure(e) {
    let n;
    if (typeof e == "string") {
      const u = e;
      if (n = Gd[u], !n) throw new Error(`Wrong 'markdown-it' preset "${u}", check name`);
    } else n = e;
    if (!n) throw new Error("Wrong `markdown-it` preset, can't be empty");
    n.options && (this.options = { ...n.options });
    const r = n.components;
    if (r) {
      var i;
      [
        "core",
        "block",
        "inline"
      ].forEach((o) => {
        var s;
        const l = (s = r[o]) === null || s === void 0 ? void 0 : s.rules;
        l && this[o].ruler.enableOnly(l);
      });
      const u = (i = r.inline) === null || i === void 0 ? void 0 : i.rules2;
      u && this.inline.ruler2.enableOnly(u);
    }
    return this;
  }
  /**
  * Enable list or rules. It will automatically find appropriate components,
  * containing rules with given names. If rule not found, and `ignoreInvalid`
  * not set - throws exception.
  *
  * @param list Rule name or list of rule names to enable.
  * @param ignoreInvalid Set `true` to ignore errors when rule not found.
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  *
  * const md = new MarkdownIt()
  *   .enable(['sub', 'sup'])
  *   .disable('smartquotes')
  * ```
  */
  enable(e, n = !1) {
    let r = [];
    Array.isArray(e) || (e = [e]), [
      "core",
      "block",
      "inline"
    ].forEach((u) => {
      r = r.concat(this[u].ruler.enable(e, !0));
    }), r = r.concat(this.inline.ruler2.enable(e, !0));
    const i = e.filter((u) => r.indexOf(u) < 0);
    if (i.length && !n) throw new Error(`MarkdownIt. Failed to enable unknown rule(s): ${i}`);
    return this;
  }
  /**
  * The same as {@link MarkdownIt.enable}, but turn specified rules off.
  *
  * @param list Rule name or list of rule names to disable.
  * @param ignoreInvalid Set `true` to ignore errors when rule not found.
  */
  disable(e, n = !1) {
    let r = [];
    Array.isArray(e) || (e = [e]), [
      "core",
      "block",
      "inline"
    ].forEach((u) => {
      r = r.concat(this[u].ruler.disable(e, !0));
    }), r = r.concat(this.inline.ruler2.disable(e, !0));
    const i = e.filter((u) => r.indexOf(u) < 0);
    if (i.length && !n) throw new Error(`MarkdownIt. Failed to disable unknown rule(s): ${i}`);
    return this;
  }
  /**
  * Load specified plugin with given params into current parser instance.
  * It's just a sugar to call `plugin(md, params)` with curring.
  *
  * @example
  * ```javascript
  * import MarkdownIt from 'markdown-it'
  * import iterator from 'markdown-it-for-inline'
  *
  * const md = new MarkdownIt()
  *   .use(iterator, 'foo_replace', 'text', function (tokens, idx) {
  *     tokens[idx].content = tokens[idx].content.replace(/foo/g, 'bar')
  *   })
  * ```
  */
  use(e, ...n) {
    return e.apply(e, [this, ...n]), this;
  }
  /**
  * Parse input string and return list of block tokens (special token type
  * "inline" will contain list of inline tokens). You should not call this
  * method directly, until you write custom renderer (for example, to produce
  * AST).
  *
  * `env` is used to pass data between "distributed" rules and return additional
  * metadata like reference info, needed for the renderer. It also can be used to
  * inject data in specific cases. Usually, you will be ok to pass `{}`,
  * and then pass updated object to renderer.
  *
  * @param src Source string.
  * @param env Environment sandbox.
  */
  parse(e, n) {
    if (typeof e != "string") throw new Error("Input data should be a String");
    const r = new this.core.State(e, this, n);
    return this.core.process(r), r.tokens;
  }
  /**
  * Render markdown string into html. It does all magic for you :).
  *
  * `env` can be used to inject additional metadata (`{}` by default).
  * But you will not need it with high probability. See also comment
  * in {@link MarkdownIt.parse}.
  *
  * @param src Source string.
  * @param env Environment sandbox.
  */
  render(e, n = {}) {
    return this.renderer.render(this.parse(e, n), this.options, n);
  }
  /**
  * The same as {@link MarkdownIt.parse} but skip all block rules. It returns
  * the block tokens list with the single `inline` element, containing parsed
  * inline tokens in `children` property. Also updates `env` object.
  *
  * @param src Source string.
  * @param env Environment sandbox.
  */
  parseInline(e, n) {
    const r = new this.core.State(e, this, n);
    return r.inlineMode = !0, this.core.process(r), r.tokens;
  }
  /**
  * Similar to {@link MarkdownIt.render} but for single paragraph content.
  * Result will NOT be wrapped into `<p>` tags.
  *
  * @param src Source string.
  * @param env Environment sandbox.
  */
  renderInline(e, n = {}) {
    return this.renderer.render(this.parseInline(e, n), this.options, n);
  }
};
_(Fe, "Token", ht);
_(Fe, "Ruler", cn);
_(Fe, "Renderer", ll);
_(Fe, "ParserCore", fl);
_(Fe, "StateCore", cl);
_(Fe, "ParserBlock", Al);
_(Fe, "StateBlock", hl);
_(Fe, "ParserInline", kl);
_(Fe, "StateInline", ml);
var Yd = il(Fe);
const xl = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, Cl = /[\0-\x1F\x7F-\x9F]/, Hd = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/, Ei = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/, yl = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/, Dl = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/, Vd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Any: xl,
  Cc: Cl,
  Cf: Hd,
  P: Ei,
  S: yl,
  Z: Dl
}, Symbol.toStringTag, { value: "Module" })), Ud = new Uint16Array(
  // prettier-ignore
  'ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻 ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌'.split("").map((t) => t.charCodeAt(0))
), $d = new Uint16Array(
  // prettier-ignore
  "Ȁaglq	\x1Bɭ\0\0p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map((t) => t.charCodeAt(0))
);
var Mr;
const qd = /* @__PURE__ */ new Map([
  [0, 65533],
  // C1 Unicode control character reference replacements
  [128, 8364],
  [130, 8218],
  [131, 402],
  [132, 8222],
  [133, 8230],
  [134, 8224],
  [135, 8225],
  [136, 710],
  [137, 8240],
  [138, 352],
  [139, 8249],
  [140, 338],
  [142, 381],
  [145, 8216],
  [146, 8217],
  [147, 8220],
  [148, 8221],
  [149, 8226],
  [150, 8211],
  [151, 8212],
  [152, 732],
  [153, 8482],
  [154, 353],
  [155, 8250],
  [156, 339],
  [158, 382],
  [159, 376]
]), jd = (
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, node/no-unsupported-features/es-builtins
  (Mr = String.fromCodePoint) !== null && Mr !== void 0 ? Mr : function(t) {
    let e = "";
    return t > 65535 && (t -= 65536, e += String.fromCharCode(t >>> 10 & 1023 | 55296), t = 56320 | t & 1023), e += String.fromCharCode(t), e;
  }
);
function Xd(t) {
  var e;
  return t >= 55296 && t <= 57343 || t > 1114111 ? 65533 : (e = qd.get(t)) !== null && e !== void 0 ? e : t;
}
var J;
(function(t) {
  t[t.NUM = 35] = "NUM", t[t.SEMI = 59] = "SEMI", t[t.EQUALS = 61] = "EQUALS", t[t.ZERO = 48] = "ZERO", t[t.NINE = 57] = "NINE", t[t.LOWER_A = 97] = "LOWER_A", t[t.LOWER_F = 102] = "LOWER_F", t[t.LOWER_X = 120] = "LOWER_X", t[t.LOWER_Z = 122] = "LOWER_Z", t[t.UPPER_A = 65] = "UPPER_A", t[t.UPPER_F = 70] = "UPPER_F", t[t.UPPER_Z = 90] = "UPPER_Z";
})(J || (J = {}));
const ep = 32;
var Le;
(function(t) {
  t[t.VALUE_LENGTH = 49152] = "VALUE_LENGTH", t[t.BRANCH_LENGTH = 16256] = "BRANCH_LENGTH", t[t.JUMP_TABLE = 127] = "JUMP_TABLE";
})(Le || (Le = {}));
function ti(t) {
  return t >= J.ZERO && t <= J.NINE;
}
function tp(t) {
  return t >= J.UPPER_A && t <= J.UPPER_F || t >= J.LOWER_A && t <= J.LOWER_F;
}
function np(t) {
  return t >= J.UPPER_A && t <= J.UPPER_Z || t >= J.LOWER_A && t <= J.LOWER_Z || ti(t);
}
function rp(t) {
  return t === J.EQUALS || np(t);
}
var K;
(function(t) {
  t[t.EntityStart = 0] = "EntityStart", t[t.NumericStart = 1] = "NumericStart", t[t.NumericDecimal = 2] = "NumericDecimal", t[t.NumericHex = 3] = "NumericHex", t[t.NamedEntity = 4] = "NamedEntity";
})(K || (K = {}));
var Me;
(function(t) {
  t[t.Legacy = 0] = "Legacy", t[t.Strict = 1] = "Strict", t[t.Attribute = 2] = "Attribute";
})(Me || (Me = {}));
class ip {
  constructor(e, n, r) {
    this.decodeTree = e, this.emitCodePoint = n, this.errors = r, this.state = K.EntityStart, this.consumed = 1, this.result = 0, this.treeIndex = 0, this.excess = 1, this.decodeMode = Me.Strict;
  }
  /** Resets the instance to make it reusable. */
  startEntity(e) {
    this.decodeMode = e, this.state = K.EntityStart, this.result = 0, this.treeIndex = 0, this.excess = 1, this.consumed = 1;
  }
  /**
   * Write an entity to the decoder. This can be called multiple times with partial entities.
   * If the entity is incomplete, the decoder will return -1.
   *
   * Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
   * entity is incomplete, and resume when the next string is written.
   *
   * @param string The string containing the entity (or a continuation of the entity).
   * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  write(e, n) {
    switch (this.state) {
      case K.EntityStart:
        return e.charCodeAt(n) === J.NUM ? (this.state = K.NumericStart, this.consumed += 1, this.stateNumericStart(e, n + 1)) : (this.state = K.NamedEntity, this.stateNamedEntity(e, n));
      case K.NumericStart:
        return this.stateNumericStart(e, n);
      case K.NumericDecimal:
        return this.stateNumericDecimal(e, n);
      case K.NumericHex:
        return this.stateNumericHex(e, n);
      case K.NamedEntity:
        return this.stateNamedEntity(e, n);
    }
  }
  /**
   * Switches between the numeric decimal and hexadecimal states.
   *
   * Equivalent to the `Numeric character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericStart(e, n) {
    return n >= e.length ? -1 : (e.charCodeAt(n) | ep) === J.LOWER_X ? (this.state = K.NumericHex, this.consumed += 1, this.stateNumericHex(e, n + 1)) : (this.state = K.NumericDecimal, this.stateNumericDecimal(e, n));
  }
  addToNumericResult(e, n, r, i) {
    if (n !== r) {
      const u = r - n;
      this.result = this.result * Math.pow(i, u) + parseInt(e.substr(n, u), i), this.consumed += u;
    }
  }
  /**
   * Parses a hexadecimal numeric entity.
   *
   * Equivalent to the `Hexademical character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericHex(e, n) {
    const r = n;
    for (; n < e.length; ) {
      const i = e.charCodeAt(n);
      if (ti(i) || tp(i))
        n += 1;
      else
        return this.addToNumericResult(e, r, n, 16), this.emitNumericEntity(i, 3);
    }
    return this.addToNumericResult(e, r, n, 16), -1;
  }
  /**
   * Parses a decimal numeric entity.
   *
   * Equivalent to the `Decimal character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericDecimal(e, n) {
    const r = n;
    for (; n < e.length; ) {
      const i = e.charCodeAt(n);
      if (ti(i))
        n += 1;
      else
        return this.addToNumericResult(e, r, n, 10), this.emitNumericEntity(i, 2);
    }
    return this.addToNumericResult(e, r, n, 10), -1;
  }
  /**
   * Validate and emit a numeric entity.
   *
   * Implements the logic from the `Hexademical character reference start
   * state` and `Numeric character reference end state` in the HTML spec.
   *
   * @param lastCp The last code point of the entity. Used to see if the
   *               entity was terminated with a semicolon.
   * @param expectedLength The minimum number of characters that should be
   *                       consumed. Used to validate that at least one digit
   *                       was consumed.
   * @returns The number of characters that were consumed.
   */
  emitNumericEntity(e, n) {
    var r;
    if (this.consumed <= n)
      return (r = this.errors) === null || r === void 0 || r.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
    if (e === J.SEMI)
      this.consumed += 1;
    else if (this.decodeMode === Me.Strict)
      return 0;
    return this.emitCodePoint(Xd(this.result), this.consumed), this.errors && (e !== J.SEMI && this.errors.missingSemicolonAfterCharacterReference(), this.errors.validateNumericCharacterReference(this.result)), this.consumed;
  }
  /**
   * Parses a named entity.
   *
   * Equivalent to the `Named character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNamedEntity(e, n) {
    const { decodeTree: r } = this;
    let i = r[this.treeIndex], u = (i & Le.VALUE_LENGTH) >> 14;
    for (; n < e.length; n++, this.excess++) {
      const o = e.charCodeAt(n);
      if (this.treeIndex = up(r, i, this.treeIndex + Math.max(1, u), o), this.treeIndex < 0)
        return this.result === 0 || // If we are parsing an attribute
        this.decodeMode === Me.Attribute && // We shouldn't have consumed any characters after the entity,
        (u === 0 || // And there should be no invalid characters.
        rp(o)) ? 0 : this.emitNotTerminatedNamedEntity();
      if (i = r[this.treeIndex], u = (i & Le.VALUE_LENGTH) >> 14, u !== 0) {
        if (o === J.SEMI)
          return this.emitNamedEntityData(this.treeIndex, u, this.consumed + this.excess);
        this.decodeMode !== Me.Strict && (this.result = this.treeIndex, this.consumed += this.excess, this.excess = 0);
      }
    }
    return -1;
  }
  /**
   * Emit a named entity that was not terminated with a semicolon.
   *
   * @returns The number of characters consumed.
   */
  emitNotTerminatedNamedEntity() {
    var e;
    const { result: n, decodeTree: r } = this, i = (r[n] & Le.VALUE_LENGTH) >> 14;
    return this.emitNamedEntityData(n, i, this.consumed), (e = this.errors) === null || e === void 0 || e.missingSemicolonAfterCharacterReference(), this.consumed;
  }
  /**
   * Emit a named entity.
   *
   * @param result The index of the entity in the decode tree.
   * @param valueLength The number of bytes in the entity.
   * @param consumed The number of characters consumed.
   *
   * @returns The number of characters consumed.
   */
  emitNamedEntityData(e, n, r) {
    const { decodeTree: i } = this;
    return this.emitCodePoint(n === 1 ? i[e] & ~Le.VALUE_LENGTH : i[e + 1], r), n === 3 && this.emitCodePoint(i[e + 2], r), r;
  }
  /**
   * Signal to the parser that the end of the input was reached.
   *
   * Remaining data will be emitted and relevant errors will be produced.
   *
   * @returns The number of characters consumed.
   */
  end() {
    var e;
    switch (this.state) {
      case K.NamedEntity:
        return this.result !== 0 && (this.decodeMode !== Me.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      case K.NumericDecimal:
        return this.emitNumericEntity(0, 2);
      case K.NumericHex:
        return this.emitNumericEntity(0, 3);
      case K.NumericStart:
        return (e = this.errors) === null || e === void 0 || e.absenceOfDigitsInNumericCharacterReference(this.consumed), 0;
      case K.EntityStart:
        return 0;
    }
  }
}
function El(t) {
  let e = "";
  const n = new ip(t, (r) => e += jd(r));
  return function(i, u) {
    let o = 0, s = 0;
    for (; (s = i.indexOf("&", s)) >= 0; ) {
      e += i.slice(o, s), n.startEntity(u);
      const c = n.write(
        i,
        // Skip the "&"
        s + 1
      );
      if (c < 0) {
        o = s + n.end();
        break;
      }
      o = s + c, s = c === 0 ? o + 1 : o;
    }
    const l = e + i.slice(o);
    return e = "", l;
  };
}
function up(t, e, n, r) {
  const i = (e & Le.BRANCH_LENGTH) >> 7, u = e & Le.JUMP_TABLE;
  if (i === 0)
    return u !== 0 && r === u ? n : -1;
  if (u) {
    const l = r - u;
    return l < 0 || l >= i ? -1 : t[n + l] - 1;
  }
  let o = n, s = o + i - 1;
  for (; o <= s; ) {
    const l = o + s >>> 1, c = t[l];
    if (c < r)
      o = l + 1;
    else if (c > r)
      s = l - 1;
    else
      return t[l + i];
  }
  return -1;
}
const Fl = El(Ud);
El($d);
function op(t, e = Me.Legacy) {
  return Fl(t, e);
}
function sp(t) {
  return Fl(t, Me.Strict);
}
function lp(t) {
  return Object.prototype.toString.call(t);
}
function Fi(t) {
  return lp(t) === "[object String]";
}
const cp = Object.prototype.hasOwnProperty;
function ap(t, e) {
  return cp.call(t, e);
}
function tr(t) {
  return Array.prototype.slice.call(arguments, 1).forEach(function(n) {
    if (n) {
      if (typeof n != "object")
        throw new TypeError(n + "must be object");
      Object.keys(n).forEach(function(r) {
        t[r] = n[r];
      });
    }
  }), t;
}
function _l(t, e, n) {
  return [].concat(t.slice(0, e), n, t.slice(e + 1));
}
function _i(t) {
  return !(t >= 55296 && t <= 57343 || t >= 64976 && t <= 65007 || (t & 65535) === 65535 || (t & 65535) === 65534 || t >= 0 && t <= 8 || t === 11 || t >= 14 && t <= 31 || t >= 127 && t <= 159 || t > 1114111);
}
function an(t) {
  if (t > 65535) {
    t -= 65536;
    const e = 55296 + (t >> 10), n = 56320 + (t & 1023);
    return String.fromCharCode(e, n);
  }
  return String.fromCharCode(t);
}
const wl = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, fp = /&([a-z#][a-z0-9]{1,31});/gi, hp = new RegExp(wl.source + "|" + fp.source, "gi"), dp = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function pp(t, e) {
  if (e.charCodeAt(0) === 35 && dp.test(e)) {
    const r = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return _i(r) ? an(r) : t;
  }
  const n = op(t);
  return n !== t ? n : t;
}
function Ap(t) {
  return t.indexOf("\\") < 0 ? t : t.replace(wl, "$1");
}
function St(t) {
  return t.indexOf("\\") < 0 && t.indexOf("&") < 0 ? t : t.replace(hp, function(e, n, r) {
    return n || pp(e, r);
  });
}
const mp = /[&<>"]/, gp = /[&<>"]/g, bp = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
};
function kp(t) {
  return bp[t];
}
function je(t) {
  return mp.test(t) ? t.replace(gp, kp) : t;
}
const xp = /[.?*+^$[\]\\(){}|-]/g;
function Cp(t) {
  return t.replace(xp, "\\$&");
}
function T(t) {
  switch (t) {
    case 9:
    case 32:
      return !0;
  }
  return !1;
}
function fn(t) {
  if (t >= 8192 && t <= 8202)
    return !0;
  switch (t) {
    case 9:
    case 10:
    case 11:
    case 12:
    case 13:
    case 32:
    case 160:
    case 5760:
    case 8239:
    case 8287:
    case 12288:
      return !0;
  }
  return !1;
}
function Il(t) {
  return Ei.test(t) || yl.test(t);
}
function hn(t) {
  return Il(an(t));
}
function dn(t) {
  switch (t) {
    case 33:
    case 34:
    case 35:
    case 36:
    case 37:
    case 38:
    case 39:
    case 40:
    case 41:
    case 42:
    case 43:
    case 44:
    case 45:
    case 46:
    case 47:
    case 58:
    case 59:
    case 60:
    case 61:
    case 62:
    case 63:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 124:
    case 125:
    case 126:
      return !0;
    default:
      return !1;
  }
}
function nr(t) {
  return t = t.trim().replace(/\s+/g, " "), "ẞ".toLowerCase() === "Ṿ" && (t = t.replace(/ẞ/g, "ß")), t.toLowerCase().toUpperCase();
}
function qu(t) {
  return t === 32 || t === 9 || t === 10 || t === 13;
}
function rr(t) {
  let e = 0;
  for (; e < t.length && qu(t.charCodeAt(e)); e++)
    ;
  let n = t.length - 1;
  for (; n >= e && qu(t.charCodeAt(n)); n--)
    ;
  return t.slice(e, n + 1);
}
const yp = { mdurl: Gs, ucmicro: Vd }, Dp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  arrayReplaceAt: _l,
  asciiTrim: rr,
  assign: tr,
  escapeHtml: je,
  escapeRE: Cp,
  fromCodePoint: an,
  has: ap,
  isMdAsciiPunct: dn,
  isPunctChar: Il,
  isPunctCharCode: hn,
  isSpace: T,
  isString: Fi,
  isValidEntityCode: _i,
  isWhiteSpace: fn,
  lib: yp,
  normalizeReference: nr,
  unescapeAll: St,
  unescapeMd: Ap
}, Symbol.toStringTag, { value: "Module" }));
function Ep(t, e, n) {
  let r, i, u, o;
  const s = t.posMax, l = t.pos;
  for (t.pos = e + 1, r = 1; t.pos < s; ) {
    if (u = t.src.charCodeAt(t.pos), u === 93 && (r--, r === 0)) {
      i = !0;
      break;
    }
    if (o = t.pos, t.md.inline.skipToken(t), u === 91) {
      if (o === t.pos - 1)
        r++;
      else if (n)
        return t.pos = l, -1;
    }
  }
  let c = -1;
  return i && (c = t.pos), t.pos = l, c;
}
function Fp(t, e, n) {
  let r, i = e;
  const u = {
    ok: !1,
    pos: 0,
    str: ""
  };
  if (t.charCodeAt(i) === 60) {
    for (i++; i < n; ) {
      if (r = t.charCodeAt(i), r === 10 || r === 60)
        return u;
      if (r === 62)
        return u.pos = i + 1, u.str = St(t.slice(e + 1, i)), u.ok = !0, u;
      if (r === 92 && i + 1 < n) {
        i += 2;
        continue;
      }
      i++;
    }
    return u;
  }
  let o = 0;
  for (; i < n && (r = t.charCodeAt(i), !(r === 32 || r < 32 || r === 127)); ) {
    if (r === 92 && i + 1 < n) {
      if (t.charCodeAt(i + 1) === 32)
        break;
      i += 2;
      continue;
    }
    if (r === 40 && (o++, o > 32))
      return u;
    if (r === 41) {
      if (o === 0)
        break;
      o--;
    }
    i++;
  }
  return e === i || o !== 0 || (u.str = St(t.slice(e, i)), u.pos = i, u.ok = !0), u;
}
function _p(t, e, n, r) {
  let i, u = e;
  const o = {
    // if `true`, this is a valid link title
    ok: !1,
    // if `true`, this link can be continued on the next line
    can_continue: !1,
    // if `ok`, it's the position of the first character after the closing marker
    pos: 0,
    // if `ok`, it's the unescaped title
    str: "",
    // expected closing marker character code
    marker: 0
  };
  if (r)
    o.str = r.str, o.marker = r.marker;
  else {
    if (u >= n)
      return o;
    let s = t.charCodeAt(u);
    if (s !== 34 && s !== 39 && s !== 40)
      return o;
    e++, u++, s === 40 && (s = 41), o.marker = s;
  }
  for (; u < n; ) {
    if (i = t.charCodeAt(u), i === o.marker)
      return o.pos = u + 1, o.str += St(t.slice(e, u)), o.ok = !0, o;
    if (i === 40 && o.marker === 41)
      return o;
    i === 92 && u + 1 < n && u++, u++;
  }
  return o.can_continue = !0, o.str += St(t.slice(e, u)), o;
}
const wp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  parseLinkDestination: Fp,
  parseLinkLabel: Ep,
  parseLinkTitle: _p
}, Symbol.toStringTag, { value: "Module" })), _e = {};
_e.code_inline = function(t, e, n, r, i) {
  const u = t[e];
  return "<code" + i.renderAttrs(u) + ">" + je(u.content) + "</code>";
};
_e.code_block = function(t, e, n, r, i) {
  const u = t[e];
  return "<pre" + i.renderAttrs(u) + "><code>" + je(t[e].content) + `</code></pre>
`;
};
_e.fence = function(t, e, n, r, i) {
  const u = t[e], o = u.info ? St(u.info).trim() : "";
  let s = "", l = "";
  if (o) {
    const a = o.split(/(\s+)/g);
    s = a[0], l = a.slice(2).join("");
  }
  let c;
  if (n.highlight ? c = n.highlight(u.content, s, l) || je(u.content) : c = je(u.content), c.indexOf("<pre") === 0)
    return c + `
`;
  if (o) {
    const a = u.attrIndex("class"), f = u.attrs ? u.attrs.slice() : [];
    a < 0 ? f.push(["class", n.langPrefix + s]) : (f[a] = f[a].slice(), f[a][1] += " " + n.langPrefix + s);
    const p = {
      attrs: f
    };
    return `<pre><code${i.renderAttrs(p)}>${c}</code></pre>
`;
  }
  return `<pre><code${i.renderAttrs(u)}>${c}</code></pre>
`;
};
_e.image = function(t, e, n, r, i) {
  const u = t[e];
  return u.attrs[u.attrIndex("alt")][1] = i.renderInlineAsText(u.children, n, r), i.renderToken(t, e, n);
};
_e.hardbreak = function(t, e, n) {
  return n.xhtmlOut ? `<br />
` : `<br>
`;
};
_e.softbreak = function(t, e, n) {
  return n.breaks ? n.xhtmlOut ? `<br />
` : `<br>
` : `
`;
};
_e.text = function(t, e) {
  return je(t[e].content);
};
_e.html_block = function(t, e) {
  return t[e].content;
};
_e.html_inline = function(t, e) {
  return t[e].content;
};
function Nt() {
  this.rules = tr({}, _e);
}
Nt.prototype.renderAttrs = function(e) {
  let n, r, i;
  if (!e.attrs)
    return "";
  for (i = "", n = 0, r = e.attrs.length; n < r; n++)
    i += " " + je(e.attrs[n][0]) + '="' + je(e.attrs[n][1]) + '"';
  return i;
};
Nt.prototype.renderToken = function(e, n, r) {
  const i = e[n];
  let u = "";
  if (i.hidden)
    return "";
  i.block && i.nesting !== -1 && n && e[n - 1].hidden && (u += `
`), u += (i.nesting === -1 ? "</" : "<") + i.tag, u += this.renderAttrs(i), i.nesting === 0 && r.xhtmlOut && (u += " /");
  let o = !1;
  if (i.block && (o = !0, i.nesting === 1 && n + 1 < e.length)) {
    const s = e[n + 1];
    (s.type === "inline" || s.hidden || s.nesting === -1 && s.tag === i.tag) && (o = !1);
  }
  return u += o ? `>
` : ">", u;
};
Nt.prototype.renderInline = function(t, e, n) {
  let r = "";
  const i = this.rules;
  for (let u = 0, o = t.length; u < o; u++) {
    const s = t[u].type;
    typeof i[s] < "u" ? r += i[s](t, u, e, n, this) : r += this.renderToken(t, u, e);
  }
  return r;
};
Nt.prototype.renderInlineAsText = function(t, e, n) {
  let r = "";
  for (let i = 0, u = t.length; i < u; i++)
    switch (t[i].type) {
      case "text":
        r += t[i].content;
        break;
      case "image":
        r += this.renderInlineAsText(t[i].children, e, n);
        break;
      case "html_inline":
      case "html_block":
        r += t[i].content;
        break;
      case "softbreak":
      case "hardbreak":
        r += `
`;
        break;
    }
  return r;
};
Nt.prototype.render = function(t, e, n) {
  let r = "";
  const i = this.rules;
  for (let u = 0, o = t.length; u < o; u++) {
    const s = t[u].type;
    s === "inline" ? r += this.renderInline(t[u].children, e, n) : typeof i[s] < "u" ? r += i[s](t, u, e, n, this) : r += this.renderToken(t, u, e, n);
  }
  return r;
};
function re() {
  this.__rules__ = [], this.__cache__ = null;
}
re.prototype.__find__ = function(t) {
  for (let e = 0; e < this.__rules__.length; e++)
    if (this.__rules__[e].name === t)
      return e;
  return -1;
};
re.prototype.__compile__ = function() {
  const t = this, e = [""];
  t.__rules__.forEach(function(n) {
    n.enabled && n.alt.forEach(function(r) {
      e.indexOf(r) < 0 && e.push(r);
    });
  }), t.__cache__ = {}, e.forEach(function(n) {
    t.__cache__[n] = [], t.__rules__.forEach(function(r) {
      r.enabled && (n && r.alt.indexOf(n) < 0 || t.__cache__[n].push(r.fn));
    });
  });
};
re.prototype.at = function(t, e, n) {
  const r = this.__find__(t), i = n || {};
  if (r === -1)
    throw new Error("Parser rule not found: " + t);
  this.__rules__[r].fn = e, this.__rules__[r].alt = i.alt || [], this.__cache__ = null;
};
re.prototype.before = function(t, e, n, r) {
  const i = this.__find__(t), u = r || {};
  if (i === -1)
    throw new Error("Parser rule not found: " + t);
  this.__rules__.splice(i, 0, {
    name: e,
    enabled: !0,
    fn: n,
    alt: u.alt || []
  }), this.__cache__ = null;
};
re.prototype.after = function(t, e, n, r) {
  const i = this.__find__(t), u = r || {};
  if (i === -1)
    throw new Error("Parser rule not found: " + t);
  this.__rules__.splice(i + 1, 0, {
    name: e,
    enabled: !0,
    fn: n,
    alt: u.alt || []
  }), this.__cache__ = null;
};
re.prototype.push = function(t, e, n) {
  const r = n || {};
  this.__rules__.push({
    name: t,
    enabled: !0,
    fn: e,
    alt: r.alt || []
  }), this.__cache__ = null;
};
re.prototype.enable = function(t, e) {
  Array.isArray(t) || (t = [t]);
  const n = [];
  return t.forEach(function(r) {
    const i = this.__find__(r);
    if (i < 0) {
      if (e)
        return;
      throw new Error("Rules manager: invalid rule name " + r);
    }
    this.__rules__[i].enabled = !0, n.push(r);
  }, this), this.__cache__ = null, n;
};
re.prototype.enableOnly = function(t, e) {
  Array.isArray(t) || (t = [t]), this.__rules__.forEach(function(n) {
    n.enabled = !1;
  }), this.enable(t, e);
};
re.prototype.disable = function(t, e) {
  Array.isArray(t) || (t = [t]);
  const n = [];
  return t.forEach(function(r) {
    const i = this.__find__(r);
    if (i < 0) {
      if (e)
        return;
      throw new Error("Rules manager: invalid rule name " + r);
    }
    this.__rules__[i].enabled = !1, n.push(r);
  }, this), this.__cache__ = null, n;
};
re.prototype.getRules = function(t) {
  return this.__cache__ === null && this.__compile__(), this.__cache__[t] || [];
};
function ge(t, e, n) {
  this.type = t, this.tag = e, this.attrs = null, this.map = null, this.nesting = n, this.level = 0, this.children = null, this.content = "", this.markup = "", this.info = "", this.meta = null, this.block = !1, this.hidden = !1;
}
ge.prototype.attrIndex = function(e) {
  if (!this.attrs)
    return -1;
  const n = this.attrs;
  for (let r = 0, i = n.length; r < i; r++)
    if (n[r][0] === e)
      return r;
  return -1;
};
ge.prototype.attrPush = function(e) {
  this.attrs ? this.attrs.push(e) : this.attrs = [e];
};
ge.prototype.attrSet = function(e, n) {
  const r = this.attrIndex(e), i = [e, n];
  r < 0 ? this.attrPush(i) : this.attrs[r] = i;
};
ge.prototype.attrGet = function(e) {
  const n = this.attrIndex(e);
  let r = null;
  return n >= 0 && (r = this.attrs[n][1]), r;
};
ge.prototype.attrJoin = function(e, n) {
  const r = this.attrIndex(e);
  r < 0 ? this.attrPush([e, n]) : this.attrs[r][1] = this.attrs[r][1] + " " + n;
};
function Bl(t, e, n) {
  this.src = t, this.env = n, this.tokens = [], this.inlineMode = !1, this.md = e;
}
Bl.prototype.Token = ge;
const Ip = /\r\n?|\n/g, Bp = /\0/g;
function Sp(t) {
  let e;
  e = t.src.replace(Ip, `
`), e = e.replace(Bp, "�"), t.src = e;
}
function Mp(t) {
  let e;
  t.inlineMode ? (e = new t.Token("inline", "", 0), e.content = t.src, e.map = [0, 1], e.children = [], t.tokens.push(e)) : t.md.block.parse(t.src, t.md, t.env, t.tokens);
}
function Np(t) {
  const e = t.tokens;
  for (let n = 0, r = e.length; n < r; n++) {
    const i = e[n];
    i.type === "inline" && t.md.inline.parse(i.content, t.md, t.env, i.children);
  }
}
function Op(t) {
  return /^<a[>\s]/i.test(t);
}
function Rp(t) {
  return /^<\/a\s*>/i.test(t);
}
function Tp(t) {
  const e = t.tokens;
  if (t.md.options.linkify)
    for (let n = 0, r = e.length; n < r; n++) {
      if (e[n].type !== "inline" || !t.md.linkify.pretest(e[n].content))
        continue;
      let i = e[n].children, u = 0;
      for (let o = i.length - 1; o >= 0; o--) {
        const s = i[o];
        if (s.type === "link_close") {
          for (o--; i[o].level !== s.level && i[o].type !== "link_open"; )
            o--;
          continue;
        }
        if (s.type === "html_inline" && (Op(s.content) && u > 0 && u--, Rp(s.content) && u++), !(u > 0) && s.type === "text" && t.md.linkify.test(s.content)) {
          const l = s.content;
          let c = t.md.linkify.match(l);
          const a = [];
          let f = s.level, p = 0;
          c.length > 0 && c[0].index === 0 && o > 0 && i[o - 1].type === "text_special" && (c = c.slice(1));
          for (let d = 0; d < c.length; d++) {
            const h = c[d].url, A = t.md.normalizeLink(h);
            if (!t.md.validateLink(A))
              continue;
            let m = c[d].text;
            c[d].schema ? c[d].schema === "mailto:" && !/^mailto:/i.test(m) ? m = t.md.normalizeLinkText("mailto:" + m).replace(/^mailto:/, "") : m = t.md.normalizeLinkText(m) : m = t.md.normalizeLinkText("http://" + m).replace(/^http:\/\//, "");
            const g = c[d].index;
            if (g > p) {
              const C = new t.Token("text", "", 0);
              C.content = l.slice(p, g), C.level = f, a.push(C);
            }
            const x = new t.Token("link_open", "a", 1);
            x.attrs = [["href", A]], x.level = f++, x.markup = "linkify", x.info = "auto", a.push(x);
            const b = new t.Token("text", "", 0);
            b.content = m, b.level = f, a.push(b);
            const k = new t.Token("link_close", "a", -1);
            k.level = --f, k.markup = "linkify", k.info = "auto", a.push(k), p = c[d].lastIndex;
          }
          if (p < l.length) {
            const d = new t.Token("text", "", 0);
            d.content = l.slice(p), d.level = f, a.push(d);
          }
          e[n].children = i = _l(i, o, a);
        }
      }
    }
}
const Sl = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/, vp = /\((c|tm|r)\)/i, zp = /\((c|tm|r)\)/ig, Qp = {
  c: "©",
  r: "®",
  tm: "™"
};
function Kp(t, e) {
  return Qp[e.toLowerCase()];
}
function Wp(t) {
  let e = 0;
  for (let n = t.length - 1; n >= 0; n--) {
    const r = t[n];
    r.type === "text" && !e && (r.content = r.content.replace(zp, Kp)), r.type === "link_open" && r.info === "auto" && e--, r.type === "link_close" && r.info === "auto" && e++;
  }
}
function Pp(t) {
  let e = 0;
  for (let n = t.length - 1; n >= 0; n--) {
    const r = t[n];
    r.type === "text" && !e && Sl.test(r.content) && (r.content = r.content.replace(/\+-/g, "±").replace(/\.{2,}/g, "…").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/mg, "$1—").replace(/(^|\s)--(?=\s|$)/mg, "$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg, "$1–")), r.type === "link_open" && r.info === "auto" && e--, r.type === "link_close" && r.info === "auto" && e++;
  }
}
function Jp(t) {
  let e;
  if (t.md.options.typographer)
    for (e = t.tokens.length - 1; e >= 0; e--)
      t.tokens[e].type === "inline" && (vp.test(t.tokens[e].content) && Wp(t.tokens[e].children), Sl.test(t.tokens[e].content) && Pp(t.tokens[e].children));
}
const Gp = /['"]/, ju = /['"]/g, Xu = "’";
function wn(t, e, n, r) {
  t[e] || (t[e] = []), t[e].push({ pos: n, ch: r });
}
function Lp(t, e) {
  let n = "", r = 0;
  e.sort((i, u) => i.pos - u.pos);
  for (let i = 0; i < e.length; i++) {
    const u = e[i];
    n += t.slice(r, u.pos) + u.ch, r = u.pos + 1;
  }
  return n + t.slice(r);
}
function Zp(t, e) {
  let n;
  const r = [], i = {};
  for (let u = 0; u < t.length; u++) {
    const o = t[u], s = t[u].level;
    for (n = r.length - 1; n >= 0 && !(r[n].level <= s); n--)
      ;
    if (r.length = n + 1, o.type !== "text")
      continue;
    const l = o.content;
    let c = 0;
    const a = l.length;
    e:
      for (; c < a; ) {
        ju.lastIndex = c;
        const f = ju.exec(l);
        if (!f)
          break;
        let p = !0, d = !0;
        c = f.index + 1;
        const h = f[0] === "'";
        let A = 32;
        if (f.index - 1 >= 0)
          A = l.charCodeAt(f.index - 1);
        else
          for (n = u - 1; n >= 0 && !(t[n].type === "softbreak" || t[n].type === "hardbreak"); n--)
            if (t[n].content) {
              A = t[n].content.charCodeAt(t[n].content.length - 1);
              break;
            }
        let m = 32;
        if (c < a)
          m = l.charCodeAt(c);
        else
          for (n = u + 1; n < t.length && !(t[n].type === "softbreak" || t[n].type === "hardbreak"); n++)
            if (t[n].content) {
              m = t[n].content.charCodeAt(0);
              break;
            }
        const g = dn(A) || hn(A), x = dn(m) || hn(m), b = fn(A), k = fn(m);
        if (k ? p = !1 : x && (b || g || (p = !1)), b ? d = !1 : g && (k || x || (d = !1)), m === 34 && f[0] === '"' && A >= 48 && A <= 57 && (d = p = !1), p && d && (p = g, d = x), !p && !d) {
          h && wn(i, u, f.index, Xu);
          continue;
        }
        if (d)
          for (n = r.length - 1; n >= 0; n--) {
            let C = r[n];
            if (r[n].level < s)
              break;
            if (C.single === h && r[n].level === s) {
              C = r[n];
              let E, D;
              h ? (E = e.md.options.quotes[2], D = e.md.options.quotes[3]) : (E = e.md.options.quotes[0], D = e.md.options.quotes[1]), wn(i, u, f.index, D), wn(i, C.token, C.pos, E), r.length = n;
              continue e;
            }
          }
        p ? r.push({
          token: u,
          pos: f.index,
          single: h,
          level: s
        }) : d && h && wn(i, u, f.index, Xu);
      }
  }
  Object.keys(i).forEach(function(u) {
    t[u].content = Lp(t[u].content, i[u]);
  });
}
function Yp(t) {
  if (t.md.options.typographer)
    for (let e = t.tokens.length - 1; e >= 0; e--)
      t.tokens[e].type !== "inline" || !Gp.test(t.tokens[e].content) || Zp(t.tokens[e].children, t);
}
function Hp(t) {
  let e, n;
  const r = t.tokens, i = r.length;
  for (let u = 0; u < i; u++) {
    if (r[u].type !== "inline") continue;
    const o = r[u].children, s = o.length;
    for (e = 0; e < s; e++)
      o[e].type === "text_special" && (o[e].type = "text");
    for (e = n = 0; e < s; e++)
      o[e].type === "text" && e + 1 < s && o[e + 1].type === "text" ? o[e + 1].content = o[e].content + o[e + 1].content : (e !== n && (o[n] = o[e]), n++);
    e !== n && (o.length = n);
  }
}
const Nr = [
  ["normalize", Sp],
  ["block", Mp],
  ["inline", Np],
  ["linkify", Tp],
  ["replacements", Jp],
  ["smartquotes", Yp],
  // `text_join` finds `text_special` tokens (for escape sequences)
  // and joins them with the rest of the text
  ["text_join", Hp]
];
function wi() {
  this.ruler = new re();
  for (let t = 0; t < Nr.length; t++)
    this.ruler.push(Nr[t][0], Nr[t][1]);
}
wi.prototype.process = function(t) {
  const e = this.ruler.getRules("");
  for (let n = 0, r = e.length; n < r; n++)
    e[n](t);
};
wi.prototype.State = Bl;
function we(t, e, n, r) {
  this.src = t, this.md = e, this.env = n, this.tokens = r, this.bMarks = [], this.eMarks = [], this.tShift = [], this.sCount = [], this.bsCount = [], this.blkIndent = 0, this.line = 0, this.lineMax = 0, this.tight = !1, this.ddIndent = -1, this.listIndent = -1, this.parentType = "root", this.level = 0;
  const i = this.src;
  for (let u = 0, o = 0, s = 0, l = 0, c = i.length, a = !1; o < c; o++) {
    const f = i.charCodeAt(o);
    if (!a)
      if (T(f)) {
        s++, f === 9 ? l += 4 - l % 4 : l++;
        continue;
      } else
        a = !0;
    (f === 10 || o === c - 1) && (f !== 10 && o++, this.bMarks.push(u), this.eMarks.push(o), this.tShift.push(s), this.sCount.push(l), this.bsCount.push(0), a = !1, s = 0, l = 0, u = o + 1);
  }
  this.bMarks.push(i.length), this.eMarks.push(i.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
}
we.prototype.push = function(t, e, n) {
  const r = new ge(t, e, n);
  return r.block = !0, n < 0 && this.level--, r.level = this.level, n > 0 && this.level++, this.tokens.push(r), r;
};
we.prototype.isEmpty = function(e) {
  return this.bMarks[e] + this.tShift[e] >= this.eMarks[e];
};
we.prototype.skipEmptyLines = function(e) {
  for (let n = this.lineMax; e < n && !(this.bMarks[e] + this.tShift[e] < this.eMarks[e]); e++)
    ;
  return e;
};
we.prototype.skipSpaces = function(e) {
  for (let n = this.src.length; e < n; e++) {
    const r = this.src.charCodeAt(e);
    if (!T(r))
      break;
  }
  return e;
};
we.prototype.skipSpacesBack = function(e, n) {
  if (e <= n)
    return e;
  for (; e > n; )
    if (!T(this.src.charCodeAt(--e)))
      return e + 1;
  return e;
};
we.prototype.skipChars = function(e, n) {
  for (let r = this.src.length; e < r && this.src.charCodeAt(e) === n; e++)
    ;
  return e;
};
we.prototype.skipCharsBack = function(e, n, r) {
  if (e <= r)
    return e;
  for (; e > r; )
    if (n !== this.src.charCodeAt(--e))
      return e + 1;
  return e;
};
we.prototype.getLines = function(e, n, r, i) {
  if (e >= n)
    return "";
  const u = new Array(n - e);
  for (let o = 0, s = e; s < n; s++, o++) {
    let l = 0;
    const c = this.bMarks[s];
    let a = c, f;
    for (s + 1 < n || i ? f = this.eMarks[s] + 1 : f = this.eMarks[s]; a < f && l < r; ) {
      const p = this.src.charCodeAt(a);
      if (T(p))
        p === 9 ? l += 4 - (l + this.bsCount[s]) % 4 : l++;
      else if (a - c < this.tShift[s])
        l++;
      else
        break;
      a++;
    }
    l > r ? u[o] = new Array(l - r + 1).join(" ") + this.src.slice(a, f) : u[o] = this.src.slice(a, f);
  }
  return u.join("");
};
we.prototype.Token = ge;
const Vp = 65536;
function Or(t, e) {
  const n = t.bMarks[e] + t.tShift[e], r = t.eMarks[e];
  return t.src.slice(n, r);
}
function eo(t) {
  const e = [], n = t.length;
  let r = 0, i = t.charCodeAt(r), u = !1, o = 0, s = "";
  for (; r < n; )
    i === 124 && (u ? (s += t.substring(o, r - 1), o = r) : (e.push(s + t.substring(o, r)), s = "", o = r + 1)), u = i === 92, r++, i = t.charCodeAt(r);
  return e.push(s + t.substring(o)), e;
}
function Up(t, e, n, r) {
  if (e + 2 > n)
    return !1;
  let i = e + 1;
  if (t.sCount[i] < t.blkIndent || t.sCount[i] - t.blkIndent >= 4)
    return !1;
  let u = t.bMarks[i] + t.tShift[i];
  if (u >= t.eMarks[i])
    return !1;
  const o = t.src.charCodeAt(u++);
  if (o !== 124 && o !== 45 && o !== 58 || u >= t.eMarks[i])
    return !1;
  const s = t.src.charCodeAt(u++);
  if (s !== 124 && s !== 45 && s !== 58 && !T(s) || o === 45 && T(s))
    return !1;
  for (; u < t.eMarks[i]; ) {
    const k = t.src.charCodeAt(u);
    if (k !== 124 && k !== 45 && k !== 58 && !T(k))
      return !1;
    u++;
  }
  let l = Or(t, e + 1), c = l.split("|");
  const a = [];
  for (let k = 0; k < c.length; k++) {
    const C = c[k].trim();
    if (!C) {
      if (k === 0 || k === c.length - 1)
        continue;
      return !1;
    }
    if (!/^:?-+:?$/.test(C))
      return !1;
    C.charCodeAt(C.length - 1) === 58 ? a.push(C.charCodeAt(0) === 58 ? "center" : "right") : C.charCodeAt(0) === 58 ? a.push("left") : a.push("");
  }
  if (l = Or(t, e).trim(), l.indexOf("|") === -1 || t.sCount[e] - t.blkIndent >= 4)
    return !1;
  c = eo(l), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop();
  const f = c.length;
  if (f === 0 || f !== a.length)
    return !1;
  if (r)
    return !0;
  const p = t.parentType;
  t.parentType = "table";
  const d = t.md.block.ruler.getRules("blockquote"), h = t.push("table_open", "table", 1), A = [e, 0];
  h.map = A;
  const m = t.push("thead_open", "thead", 1);
  m.map = [e, e + 1];
  const g = t.push("tr_open", "tr", 1);
  g.map = [e, e + 1];
  for (let k = 0; k < c.length; k++) {
    const C = t.push("th_open", "th", 1);
    a[k] && (C.attrs = [["style", "text-align:" + a[k]]]);
    const E = t.push("inline", "", 0);
    E.content = c[k].trim(), E.children = [], t.push("th_close", "th", -1);
  }
  t.push("tr_close", "tr", -1), t.push("thead_close", "thead", -1);
  let x, b = 0;
  for (i = e + 2; i < n && !(t.sCount[i] < t.blkIndent); i++) {
    let k = !1;
    for (let E = 0, D = d.length; E < D; E++)
      if (d[E](t, i, n, !0)) {
        k = !0;
        break;
      }
    if (k || (l = Or(t, i).trim(), !l) || t.sCount[i] - t.blkIndent >= 4 || (c = eo(l), c.length && c[0] === "" && c.shift(), c.length && c[c.length - 1] === "" && c.pop(), b += f - c.length, b > Vp))
      break;
    if (i === e + 2) {
      const E = t.push("tbody_open", "tbody", 1);
      E.map = x = [e + 2, 0];
    }
    const C = t.push("tr_open", "tr", 1);
    C.map = [i, i + 1];
    for (let E = 0; E < f; E++) {
      const D = t.push("td_open", "td", 1);
      a[E] && (D.attrs = [["style", "text-align:" + a[E]]]);
      const I = t.push("inline", "", 0);
      I.content = c[E] ? c[E].trim() : "", I.children = [], t.push("td_close", "td", -1);
    }
    t.push("tr_close", "tr", -1);
  }
  return x && (t.push("tbody_close", "tbody", -1), x[1] = i), t.push("table_close", "table", -1), A[1] = i, t.parentType = p, t.line = i, !0;
}
function $p(t, e, n) {
  if (t.sCount[e] - t.blkIndent < 4)
    return !1;
  let r = e + 1, i = r;
  for (; r < n; ) {
    if (t.isEmpty(r)) {
      r++;
      continue;
    }
    if (t.sCount[r] - t.blkIndent >= 4) {
      r++, i = r;
      continue;
    }
    break;
  }
  t.line = i;
  const u = t.push("code_block", "code", 0);
  return u.content = t.getLines(e, i, 4 + t.blkIndent, !1) + `
`, u.map = [e, t.line], !0;
}
function qp(t, e, n, r) {
  let i = t.bMarks[e] + t.tShift[e], u = t.eMarks[e];
  if (t.sCount[e] - t.blkIndent >= 4 || i + 3 > u)
    return !1;
  const o = t.src.charCodeAt(i);
  if (o !== 126 && o !== 96)
    return !1;
  let s = i;
  i = t.skipChars(i, o);
  let l = i - s;
  if (l < 3)
    return !1;
  const c = t.src.slice(s, i), a = t.src.slice(i, u);
  if (o === 96 && a.indexOf(String.fromCharCode(o)) >= 0)
    return !1;
  if (r)
    return !0;
  let f = e, p = !1;
  for (; f++, !(f >= n || (i = s = t.bMarks[f] + t.tShift[f], u = t.eMarks[f], i < u && t.sCount[f] < t.blkIndent)); )
    if (t.src.charCodeAt(i) === o && !(t.sCount[f] - t.blkIndent >= 4) && (i = t.skipChars(i, o), !(i - s < l) && (i = t.skipSpaces(i), !(i < u)))) {
      p = !0;
      break;
    }
  l = t.sCount[e], t.line = f + (p ? 1 : 0);
  const d = t.push("fence", "code", 0);
  return d.info = a, d.content = t.getLines(e + 1, f, l, !0), d.markup = c, d.map = [e, t.line], !0;
}
function jp(t, e, n, r) {
  let i = t.bMarks[e] + t.tShift[e], u = t.eMarks[e];
  const o = t.lineMax;
  if (t.sCount[e] - t.blkIndent >= 4 || t.src.charCodeAt(i) !== 62)
    return !1;
  if (r)
    return !0;
  const s = [], l = [], c = [], a = [], f = t.md.block.ruler.getRules("blockquote"), p = t.parentType;
  t.parentType = "blockquote";
  let d = !1, h;
  for (h = e; h < n; h++) {
    const b = t.sCount[h] < t.blkIndent;
    if (i = t.bMarks[h] + t.tShift[h], u = t.eMarks[h], i >= u)
      break;
    if (t.src.charCodeAt(i++) === 62 && !b) {
      let C = t.sCount[h] + 1, E, D;
      t.src.charCodeAt(i) === 32 ? (i++, C++, D = !1, E = !0) : t.src.charCodeAt(i) === 9 ? (E = !0, (t.bsCount[h] + C) % 4 === 3 ? (i++, C++, D = !1) : D = !0) : E = !1;
      let I = C;
      for (s.push(t.bMarks[h]), t.bMarks[h] = i; i < u; ) {
        const S = t.src.charCodeAt(i);
        if (T(S))
          S === 9 ? I += 4 - (I + t.bsCount[h] + (D ? 1 : 0)) % 4 : I++;
        else
          break;
        i++;
      }
      d = i >= u, l.push(t.bsCount[h]), t.bsCount[h] = t.sCount[h] + 1 + (E ? 1 : 0), c.push(t.sCount[h]), t.sCount[h] = I - C, a.push(t.tShift[h]), t.tShift[h] = i - t.bMarks[h];
      continue;
    }
    if (d)
      break;
    let k = !1;
    for (let C = 0, E = f.length; C < E; C++)
      if (f[C](t, h, n, !0)) {
        k = !0;
        break;
      }
    if (k) {
      t.lineMax = h, t.blkIndent !== 0 && (s.push(t.bMarks[h]), l.push(t.bsCount[h]), a.push(t.tShift[h]), c.push(t.sCount[h]), t.sCount[h] -= t.blkIndent);
      break;
    }
    s.push(t.bMarks[h]), l.push(t.bsCount[h]), a.push(t.tShift[h]), c.push(t.sCount[h]), t.sCount[h] = -1;
  }
  const A = t.blkIndent;
  t.blkIndent = 0;
  const m = t.push("blockquote_open", "blockquote", 1);
  m.markup = ">";
  const g = [e, 0];
  m.map = g, t.md.block.tokenize(t, e, h);
  const x = t.push("blockquote_close", "blockquote", -1);
  x.markup = ">", t.lineMax = o, t.parentType = p, g[1] = t.line;
  for (let b = 0; b < a.length; b++)
    t.bMarks[b + e] = s[b], t.tShift[b + e] = a[b], t.sCount[b + e] = c[b], t.bsCount[b + e] = l[b];
  return t.blkIndent = A, !0;
}
function Xp(t, e, n, r) {
  const i = t.eMarks[e];
  if (t.sCount[e] - t.blkIndent >= 4)
    return !1;
  let u = t.bMarks[e] + t.tShift[e];
  const o = t.src.charCodeAt(u++);
  if (o !== 42 && o !== 45 && o !== 95)
    return !1;
  let s = 1;
  for (; u < i; ) {
    const c = t.src.charCodeAt(u++);
    if (c !== o && !T(c))
      return !1;
    c === o && s++;
  }
  if (s < 3)
    return !1;
  if (r)
    return !0;
  t.line = e + 1;
  const l = t.push("hr", "hr", 0);
  return l.map = [e, t.line], l.markup = Array(s + 1).join(String.fromCharCode(o)), !0;
}
function to(t, e) {
  const n = t.eMarks[e];
  let r = t.bMarks[e] + t.tShift[e];
  const i = t.src.charCodeAt(r++);
  if (i !== 42 && i !== 45 && i !== 43)
    return -1;
  if (r < n) {
    const u = t.src.charCodeAt(r);
    if (!T(u))
      return -1;
  }
  return r;
}
function no(t, e) {
  const n = t.bMarks[e] + t.tShift[e], r = t.eMarks[e];
  let i = n;
  if (i + 1 >= r)
    return -1;
  let u = t.src.charCodeAt(i++);
  if (u < 48 || u > 57)
    return -1;
  for (; ; ) {
    if (i >= r)
      return -1;
    if (u = t.src.charCodeAt(i++), u >= 48 && u <= 57) {
      if (i - n >= 10)
        return -1;
      continue;
    }
    if (u === 41 || u === 46)
      break;
    return -1;
  }
  return i < r && (u = t.src.charCodeAt(i), !T(u)) ? -1 : i;
}
function eA(t, e) {
  const n = t.level + 2;
  for (let r = e + 2, i = t.tokens.length - 2; r < i; r++)
    t.tokens[r].level === n && t.tokens[r].type === "paragraph_open" && (t.tokens[r + 2].hidden = !0, t.tokens[r].hidden = !0, r += 2);
}
function tA(t, e, n, r) {
  let i, u, o, s, l = e, c = !0;
  if (t.sCount[l] - t.blkIndent >= 4 || t.listIndent >= 0 && t.sCount[l] - t.listIndent >= 4 && t.sCount[l] < t.blkIndent)
    return !1;
  let a = !1;
  r && t.parentType === "paragraph" && t.sCount[l] >= t.blkIndent && (a = !0);
  let f, p, d;
  if ((d = no(t, l)) >= 0) {
    if (f = !0, o = t.bMarks[l] + t.tShift[l], p = Number(t.src.slice(o, d - 1)), a && p !== 1) return !1;
  } else if ((d = to(t, l)) >= 0)
    f = !1;
  else
    return !1;
  if (a && t.skipSpaces(d) >= t.eMarks[l])
    return !1;
  if (r)
    return !0;
  const h = t.src.charCodeAt(d - 1), A = t.tokens.length;
  f ? (s = t.push("ordered_list_open", "ol", 1), p !== 1 && (s.attrs = [["start", p]])) : s = t.push("bullet_list_open", "ul", 1);
  const m = [l, 0];
  s.map = m, s.markup = String.fromCharCode(h);
  let g = !1;
  const x = t.md.block.ruler.getRules("list"), b = t.parentType;
  for (t.parentType = "list"; l < n; ) {
    u = d, i = t.eMarks[l];
    const k = t.sCount[l] + d - (t.bMarks[l] + t.tShift[l]);
    let C = k;
    for (; u < i; ) {
      const ie = t.src.charCodeAt(u);
      if (ie === 9)
        C += 4 - (C + t.bsCount[l]) % 4;
      else if (ie === 32)
        C++;
      else
        break;
      u++;
    }
    const E = u;
    let D;
    E >= i ? D = 1 : D = C - k, D > 4 && (D = 1);
    const I = k + D;
    s = t.push("list_item_open", "li", 1), s.markup = String.fromCharCode(h);
    const S = [l, 0];
    s.map = S, f && (s.info = t.src.slice(o, d - 1));
    const de = t.tight, Te = t.tShift[l], et = t.sCount[l], Ot = t.listIndent;
    if (t.listIndent = t.blkIndent, t.blkIndent = I, t.tight = !0, t.tShift[l] = E - t.bMarks[l], t.sCount[l] = C, E >= i && t.isEmpty(l + 1) ? t.line = Math.min(t.line + 2, n) : t.md.block.tokenize(t, l, n, !0), (!t.tight || g) && (c = !1), g = t.line - l > 1 && t.isEmpty(t.line - 1), t.blkIndent = t.listIndent, t.listIndent = Ot, t.tShift[l] = Te, t.sCount[l] = et, t.tight = de, s = t.push("list_item_close", "li", -1), s.markup = String.fromCharCode(h), l = t.line, S[1] = l, l >= n || t.sCount[l] < t.blkIndent || t.sCount[l] - t.blkIndent >= 4)
      break;
    let Rt = !1;
    for (let ie = 0, or = x.length; ie < or; ie++)
      if (x[ie](t, l, n, !0)) {
        Rt = !0;
        break;
      }
    if (Rt)
      break;
    if (f) {
      if (d = no(t, l), d < 0)
        break;
      o = t.bMarks[l] + t.tShift[l];
    } else if (d = to(t, l), d < 0)
      break;
    if (h !== t.src.charCodeAt(d - 1))
      break;
  }
  return f ? s = t.push("ordered_list_close", "ol", -1) : s = t.push("bullet_list_close", "ul", -1), s.markup = String.fromCharCode(h), m[1] = l, t.line = l, t.parentType = b, c && eA(t, A), !0;
}
function nA(t, e, n, r) {
  let i = t.bMarks[e] + t.tShift[e], u = t.eMarks[e], o = e + 1;
  if (t.sCount[e] - t.blkIndent >= 4 || t.src.charCodeAt(i) !== 91)
    return !1;
  function s(x) {
    const b = t.lineMax;
    if (x >= b || t.isEmpty(x))
      return null;
    let k = !1;
    if (t.sCount[x] - t.blkIndent > 3 && (k = !0), t.sCount[x] < 0 && (k = !0), !k) {
      const D = t.md.block.ruler.getRules("reference"), I = t.parentType;
      t.parentType = "reference";
      let S = !1;
      for (let de = 0, Te = D.length; de < Te; de++)
        if (D[de](t, x, b, !0)) {
          S = !0;
          break;
        }
      if (t.parentType = I, S)
        return null;
    }
    const C = t.bMarks[x] + t.tShift[x], E = t.eMarks[x];
    return t.src.slice(C, E + 1);
  }
  let l = t.src.slice(i, u + 1);
  u = l.length;
  let c = -1;
  for (i = 1; i < u; i++) {
    const x = l.charCodeAt(i);
    if (x === 91)
      return !1;
    if (x === 93) {
      c = i;
      break;
    } else if (x === 10) {
      const b = s(o);
      b !== null && (l += b, u = l.length, o++);
    } else if (x === 92 && (i++, i < u && l.charCodeAt(i) === 10)) {
      const b = s(o);
      b !== null && (l += b, u = l.length, o++);
    }
  }
  if (c < 0 || l.charCodeAt(c + 1) !== 58)
    return !1;
  for (i = c + 2; i < u; i++) {
    const x = l.charCodeAt(i);
    if (x === 10) {
      const b = s(o);
      b !== null && (l += b, u = l.length, o++);
    } else if (!T(x)) break;
  }
  const a = t.md.helpers.parseLinkDestination(l, i, u);
  if (!a.ok)
    return !1;
  const f = t.md.normalizeLink(a.str);
  if (!t.md.validateLink(f))
    return !1;
  i = a.pos;
  const p = i, d = o, h = i;
  for (; i < u; i++) {
    const x = l.charCodeAt(i);
    if (x === 10) {
      const b = s(o);
      b !== null && (l += b, u = l.length, o++);
    } else if (!T(x)) break;
  }
  let A = t.md.helpers.parseLinkTitle(l, i, u);
  for (; A.can_continue; ) {
    const x = s(o);
    if (x === null) break;
    l += x, i = u, u = l.length, o++, A = t.md.helpers.parseLinkTitle(l, i, u, A);
  }
  let m;
  for (i < u && h !== i && A.ok ? (m = A.str, i = A.pos) : (m = "", i = p, o = d); i < u; ) {
    const x = l.charCodeAt(i);
    if (!T(x))
      break;
    i++;
  }
  if (i < u && l.charCodeAt(i) !== 10 && m)
    for (m = "", i = p, o = d; i < u; ) {
      const x = l.charCodeAt(i);
      if (!T(x))
        break;
      i++;
    }
  if (i < u && l.charCodeAt(i) !== 10)
    return !1;
  const g = nr(l.slice(1, c));
  return g ? (r || (typeof t.env.references > "u" && (t.env.references = {}), typeof t.env.references[g] > "u" && (t.env.references[g] = { title: m, href: f }), t.line = o), !0) : !1;
}
const rA = [
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "search",
  "section",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul"
], iA = "[a-zA-Z_:][a-zA-Z0-9:._-]*", uA = "[^\"'=<>`\\x00-\\x20]+", oA = "'[^']*'", sA = '"[^"]*"', lA = "(?:" + uA + "|" + oA + "|" + sA + ")", cA = "(?:\\s+" + iA + "(?:\\s*=\\s*" + lA + ")?)", Ml = "<[A-Za-z][A-Za-z0-9\\-]*" + cA + "*\\s*\\/?>", Nl = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>", aA = "<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->", fA = "<[?][\\s\\S]*?[?]>", hA = "<![A-Za-z][^>]*>", dA = "<!\\[CDATA\\[[\\s\\S]*?\\]\\]>", pA = new RegExp("^(?:" + Ml + "|" + Nl + "|" + aA + "|" + fA + "|" + hA + "|" + dA + ")"), AA = new RegExp("^(?:" + Ml + "|" + Nl + ")"), nt = [
  [/^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, !0],
  [/^<!--/, /-->/, !0],
  [/^<\?/, /\?>/, !0],
  [/^<![A-Z]/, />/, !0],
  [/^<!\[CDATA\[/, /\]\]>/, !0],
  [new RegExp("^</?(" + rA.join("|") + ")(?=(\\s|/?>|$))", "i"), /^$/, !0],
  [new RegExp(AA.source + "\\s*$"), /^$/, !1]
];
function mA(t, e, n, r) {
  let i = t.bMarks[e] + t.tShift[e], u = t.eMarks[e];
  if (t.sCount[e] - t.blkIndent >= 4 || !t.md.options.html || t.src.charCodeAt(i) !== 60)
    return !1;
  let o = t.src.slice(i, u), s = 0;
  for (; s < nt.length && !nt[s][0].test(o); s++)
    ;
  if (s === nt.length)
    return !1;
  if (r)
    return nt[s][2];
  let l = e + 1;
  const c = nt[s][1].test("");
  if (!nt[s][1].test(o)) {
    for (; l < n && !(t.sCount[l] < t.blkIndent && (c || !t.isEmpty(l))); l++)
      if (i = t.bMarks[l] + t.tShift[l], u = t.eMarks[l], o = t.src.slice(i, u), nt[s][1].test(o)) {
        o.length !== 0 && l++;
        break;
      }
  }
  t.line = l;
  const a = t.push("html_block", "", 0);
  return a.map = [e, l], a.content = t.getLines(e, l, t.blkIndent, !0), !0;
}
function gA(t, e, n, r) {
  let i = t.bMarks[e] + t.tShift[e], u = t.eMarks[e];
  if (t.sCount[e] - t.blkIndent >= 4)
    return !1;
  let o = t.src.charCodeAt(i);
  if (o !== 35 || i >= u)
    return !1;
  let s = 1;
  for (o = t.src.charCodeAt(++i); o === 35 && i < u && s <= 6; )
    s++, o = t.src.charCodeAt(++i);
  if (s > 6 || i < u && !T(o))
    return !1;
  if (r)
    return !0;
  u = t.skipSpacesBack(u, i);
  const l = t.skipCharsBack(u, 35, i);
  l > i && T(t.src.charCodeAt(l - 1)) && (u = l), t.line = e + 1;
  const c = t.push("heading_open", "h" + String(s), 1);
  c.markup = "########".slice(0, s), c.map = [e, t.line];
  const a = t.push("inline", "", 0);
  a.content = rr(t.src.slice(i, u)), a.map = [e, t.line], a.children = [];
  const f = t.push("heading_close", "h" + String(s), -1);
  return f.markup = "########".slice(0, s), !0;
}
function bA(t, e, n) {
  const r = t.md.block.ruler.getRules("paragraph");
  if (t.sCount[e] - t.blkIndent >= 4)
    return !1;
  const i = t.parentType;
  t.parentType = "paragraph";
  let u = 0, o, s = e + 1;
  for (; s < n && !t.isEmpty(s); s++) {
    if (t.sCount[s] - t.blkIndent > 3)
      continue;
    if (t.sCount[s] >= t.blkIndent) {
      let d = t.bMarks[s] + t.tShift[s];
      const h = t.eMarks[s];
      if (d < h && (o = t.src.charCodeAt(d), (o === 45 || o === 61) && (d = t.skipChars(d, o), d = t.skipSpaces(d), d >= h))) {
        u = o === 61 ? 1 : 2;
        break;
      }
    }
    if (t.sCount[s] < 0)
      continue;
    let p = !1;
    for (let d = 0, h = r.length; d < h; d++)
      if (r[d](t, s, n, !0)) {
        p = !0;
        break;
      }
    if (p)
      break;
  }
  if (!u)
    return t.parentType = i, !1;
  const l = rr(t.getLines(e, s, t.blkIndent, !1));
  t.line = s + 1;
  const c = t.push("heading_open", "h" + String(u), 1);
  c.markup = String.fromCharCode(o), c.map = [e, t.line];
  const a = t.push("inline", "", 0);
  a.content = l, a.map = [e, t.line - 1], a.children = [];
  const f = t.push("heading_close", "h" + String(u), -1);
  return f.markup = String.fromCharCode(o), t.parentType = i, !0;
}
function kA(t, e, n) {
  const r = t.md.block.ruler.getRules("paragraph"), i = t.parentType;
  let u = e + 1;
  for (t.parentType = "paragraph"; u < n && !t.isEmpty(u); u++) {
    if (t.sCount[u] - t.blkIndent > 3 || t.sCount[u] < 0)
      continue;
    let c = !1;
    for (let a = 0, f = r.length; a < f; a++)
      if (r[a](t, u, n, !0)) {
        c = !0;
        break;
      }
    if (c)
      break;
  }
  const o = rr(t.getLines(e, u, t.blkIndent, !1));
  t.line = u;
  const s = t.push("paragraph_open", "p", 1);
  s.map = [e, t.line];
  const l = t.push("inline", "", 0);
  return l.content = o, l.map = [e, t.line], l.children = [], t.push("paragraph_close", "p", -1), t.parentType = i, !0;
}
const In = [
  // First 2 params - rule name & source. Secondary array - list of rules,
  // which can be terminated by this one.
  ["table", Up, ["paragraph", "reference"]],
  ["code", $p],
  ["fence", qp, ["paragraph", "reference", "blockquote", "list"]],
  ["blockquote", jp, ["paragraph", "reference", "blockquote", "list"]],
  ["hr", Xp, ["paragraph", "reference", "blockquote", "list"]],
  ["list", tA, ["paragraph", "reference", "blockquote"]],
  ["reference", nA],
  ["html_block", mA, ["paragraph", "reference", "blockquote"]],
  ["heading", gA, ["paragraph", "reference", "blockquote"]],
  ["lheading", bA],
  ["paragraph", kA]
];
function ir() {
  this.ruler = new re();
  for (let t = 0; t < In.length; t++)
    this.ruler.push(In[t][0], In[t][1], { alt: (In[t][2] || []).slice() });
}
ir.prototype.tokenize = function(t, e, n) {
  const r = this.ruler.getRules(""), i = r.length, u = t.md.options.maxNesting;
  let o = e, s = !1;
  for (; o < n && (t.line = o = t.skipEmptyLines(o), !(o >= n || t.sCount[o] < t.blkIndent)); ) {
    if (t.level >= u) {
      t.line = n;
      break;
    }
    const l = t.line;
    let c = !1;
    for (let a = 0; a < i; a++)
      if (c = r[a](t, o, n, !1), c) {
        if (l >= t.line)
          throw new Error("block rule didn't increment state.line");
        break;
      }
    if (!c) throw new Error("none of the block rules matched");
    t.tight = !s, t.isEmpty(t.line - 1) && (s = !0), o = t.line, o < n && t.isEmpty(o) && (s = !0, o++, t.line = o);
  }
};
ir.prototype.parse = function(t, e, n, r) {
  if (!t)
    return;
  const i = new this.State(t, e, n, r);
  this.tokenize(i, i.line, i.lineMax);
};
ir.prototype.State = we;
function kn(t, e, n, r) {
  this.src = t, this.env = n, this.md = e, this.tokens = r, this.tokens_meta = Array(r.length), this.pos = 0, this.posMax = this.src.length, this.level = 0, this.pending = "", this.pendingLevel = 0, this.cache = {}, this.delimiters = [], this._prev_delimiters = [], this.backticks = {}, this.backticksScanned = !1, this.linkLevel = 0;
}
kn.prototype.pushPending = function() {
  const t = new ge("text", "", 0);
  return t.content = this.pending, t.level = this.pendingLevel, this.tokens.push(t), this.pending = "", t;
};
kn.prototype.push = function(t, e, n) {
  this.pending && this.pushPending();
  const r = new ge(t, e, n);
  let i = null;
  return n < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), r.level = this.level, n > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], i = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(r), this.tokens_meta.push(i), r;
};
kn.prototype.scanDelims = function(t, e) {
  const n = this.posMax, r = this.src.charCodeAt(t);
  let i;
  if (t === 0)
    i = 32;
  else if (t === 1)
    i = this.src.charCodeAt(0), (i & 63488) === 55296 && (i = 65533);
  else if (i = this.src.charCodeAt(t - 1), (i & 64512) === 56320) {
    const m = this.src.charCodeAt(t - 2);
    i = (m & 64512) === 55296 ? 65536 + (m - 55296 << 10) + (i - 56320) : 65533;
  } else (i & 64512) === 55296 && (i = 65533);
  let u = t;
  for (; u < n && this.src.charCodeAt(u) === r; )
    u++;
  const o = u - t;
  let s = u < n ? this.src.charCodeAt(u) : 32;
  if ((s & 64512) === 55296) {
    const m = this.src.charCodeAt(u + 1);
    s = (m & 64512) === 56320 ? 65536 + (s - 55296 << 10) + (m - 56320) : 65533;
  } else (s & 64512) === 56320 && (s = 65533);
  const l = dn(i) || hn(i), c = dn(s) || hn(s), a = fn(i), f = fn(s), p = !f && (!c || a || l), d = !a && (!l || f || c);
  return { can_open: p && (e || !d || l), can_close: d && (e || !p || c), length: o };
};
kn.prototype.Token = ge;
function xA(t) {
  switch (t) {
    case 10:
    case 33:
    case 35:
    case 36:
    case 37:
    case 38:
    case 42:
    case 43:
    case 45:
    case 58:
    case 60:
    case 61:
    case 62:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 125:
    case 126:
      return !0;
    default:
      return !1;
  }
}
function CA(t, e) {
  let n = t.pos;
  for (; n < t.posMax && !xA(t.src.charCodeAt(n)); )
    n++;
  return n === t.pos ? !1 : (e || (t.pending += t.src.slice(t.pos, n)), t.pos = n, !0);
}
const yA = /(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;
function DA(t, e) {
  if (!t.md.options.linkify || t.linkLevel > 0) return !1;
  const n = t.pos, r = t.posMax;
  if (n + 3 > r || t.src.charCodeAt(n) !== 58 || t.src.charCodeAt(n + 1) !== 47 || t.src.charCodeAt(n + 2) !== 47) return !1;
  const i = t.pending.match(yA);
  if (!i) return !1;
  const u = i[1], o = t.md.linkify.matchAtStart(t.src.slice(n - u.length));
  if (!o) return !1;
  let s = o.url;
  if (s.length <= u.length) return !1;
  let l = s.length;
  for (; l > 0 && s.charCodeAt(l - 1) === 42; )
    l--;
  l !== s.length && (s = s.slice(0, l));
  const c = t.md.normalizeLink(s);
  if (!t.md.validateLink(c)) return !1;
  if (!e) {
    t.pending = t.pending.slice(0, -u.length);
    const a = t.push("link_open", "a", 1);
    a.attrs = [["href", c]], a.markup = "linkify", a.info = "auto";
    const f = t.push("text", "", 0);
    f.content = t.md.normalizeLinkText(s);
    const p = t.push("link_close", "a", -1);
    p.markup = "linkify", p.info = "auto";
  }
  return t.pos += s.length - u.length, !0;
}
function EA(t, e) {
  let n = t.pos;
  if (t.src.charCodeAt(n) !== 10)
    return !1;
  const r = t.pending.length - 1, i = t.posMax;
  if (!e)
    if (r >= 0 && t.pending.charCodeAt(r) === 32)
      if (r >= 1 && t.pending.charCodeAt(r - 1) === 32) {
        let u = r - 1;
        for (; u >= 1 && t.pending.charCodeAt(u - 1) === 32; ) u--;
        t.pending = t.pending.slice(0, u), t.push("hardbreak", "br", 0);
      } else
        t.pending = t.pending.slice(0, -1), t.push("softbreak", "br", 0);
    else
      t.push("softbreak", "br", 0);
  for (n++; n < i && T(t.src.charCodeAt(n)); )
    n++;
  return t.pos = n, !0;
}
const Ii = [];
for (let t = 0; t < 256; t++)
  Ii.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(t) {
  Ii[t.charCodeAt(0)] = 1;
});
function FA(t, e) {
  let n = t.pos;
  const r = t.posMax;
  if (t.src.charCodeAt(n) !== 92 || (n++, n >= r)) return !1;
  let i = t.src.charCodeAt(n);
  if (i === 10) {
    for (e || t.push("hardbreak", "br", 0), n++; n < r && (i = t.src.charCodeAt(n), !!T(i)); )
      n++;
    return t.pos = n, !0;
  }
  if (i === 32) {
    if (!e) {
      const s = t.push("text_special", "", 0);
      s.content = "\\", s.markup = "\\", s.info = "escape";
    }
    return t.pos = n, !0;
  }
  let u = t.src[n];
  if (i >= 55296 && i <= 56319 && n + 1 < r) {
    const s = t.src.charCodeAt(n + 1);
    s >= 56320 && s <= 57343 && (u += t.src[n + 1], n++);
  }
  const o = "\\" + u;
  if (!e) {
    const s = t.push("text_special", "", 0);
    i < 256 && Ii[i] !== 0 ? s.content = u : s.content = o, s.markup = o, s.info = "escape";
  }
  return t.pos = n + 1, !0;
}
function _A(t, e) {
  let n = t.pos;
  if (t.src.charCodeAt(n) !== 96)
    return !1;
  const i = n;
  n++;
  const u = t.posMax;
  for (; n < u && t.src.charCodeAt(n) === 96; )
    n++;
  const o = t.src.slice(i, n), s = o.length;
  if (t.backticksScanned && (t.backticks[s] || 0) <= i)
    return e || (t.pending += o), t.pos += s, !0;
  let l = n, c;
  for (; (c = t.src.indexOf("`", l)) !== -1; ) {
    for (l = c + 1; l < u && t.src.charCodeAt(l) === 96; )
      l++;
    const a = l - c;
    if (a === s) {
      if (!e) {
        const f = t.push("code_inline", "code", 0);
        f.markup = o, f.content = t.src.slice(n, c).replace(/\n/g, " ").replace(/^ (.+) $/, "$1");
      }
      return t.pos = l, !0;
    }
    t.backticks[a] = c;
  }
  return t.backticksScanned = !0, e || (t.pending += o), t.pos += s, !0;
}
function wA(t, e) {
  const n = t.pos, r = t.src.charCodeAt(n);
  if (e || r !== 126)
    return !1;
  const i = t.scanDelims(t.pos, !0);
  let u = i.length;
  const o = String.fromCharCode(r);
  if (u < 2)
    return !1;
  let s;
  u % 2 && (s = t.push("text", "", 0), s.content = o, u--);
  for (let l = 0; l < u; l += 2)
    s = t.push("text", "", 0), s.content = o + o, t.delimiters.push({
      marker: r,
      length: 0,
      // disable "rule of 3" length checks meant for emphasis
      token: t.tokens.length - 1,
      end: -1,
      open: i.can_open,
      close: i.can_close
    });
  return t.pos += i.length, !0;
}
function ro(t, e) {
  let n;
  const r = [], i = e.length;
  for (let u = 0; u < i; u++) {
    const o = e[u];
    if (o.marker !== 126 || o.end === -1)
      continue;
    const s = e[o.end];
    n = t.tokens[o.token], n.type = "s_open", n.tag = "s", n.nesting = 1, n.markup = "~~", n.content = "", n = t.tokens[s.token], n.type = "s_close", n.tag = "s", n.nesting = -1, n.markup = "~~", n.content = "", t.tokens[s.token - 1].type === "text" && t.tokens[s.token - 1].content === "~" && r.push(s.token - 1);
  }
  for (; r.length; ) {
    const u = r.pop();
    let o = u + 1;
    for (; o < t.tokens.length && t.tokens[o].type === "s_close"; )
      o++;
    o--, u !== o && (n = t.tokens[o], t.tokens[o] = t.tokens[u], t.tokens[u] = n);
  }
}
function IA(t) {
  const e = t.tokens_meta, n = t.tokens_meta.length;
  ro(t, t.delimiters);
  for (let r = 0; r < n; r++)
    e[r] && e[r].delimiters && ro(t, e[r].delimiters);
}
const Ol = {
  tokenize: wA,
  postProcess: IA
};
function BA(t, e) {
  const n = t.pos, r = t.src.charCodeAt(n);
  if (e || r !== 95 && r !== 42)
    return !1;
  const i = t.scanDelims(t.pos, r === 42);
  for (let u = 0; u < i.length; u++) {
    const o = t.push("text", "", 0);
    o.content = String.fromCharCode(r), t.delimiters.push({
      // Char code of the starting marker (number).
      //
      marker: r,
      // Total length of these series of delimiters.
      //
      length: i.length,
      // A position of the token this delimiter corresponds to.
      //
      token: t.tokens.length - 1,
      // If this delimiter is matched as a valid opener, `end` will be
      // equal to its position, otherwise it's `-1`.
      //
      end: -1,
      // Boolean flags that determine if this delimiter could open or close
      // an emphasis.
      //
      open: i.can_open,
      close: i.can_close
    });
  }
  return t.pos += i.length, !0;
}
function io(t, e) {
  const n = e.length;
  for (let r = n - 1; r >= 0; r--) {
    const i = e[r];
    if (i.marker !== 95 && i.marker !== 42 || i.end === -1)
      continue;
    const u = e[i.end], o = r > 0 && e[r - 1].end === i.end + 1 && // check that first two markers match and adjacent
    e[r - 1].marker === i.marker && e[r - 1].token === i.token - 1 && // check that last two markers are adjacent (we can safely assume they match)
    e[i.end + 1].token === u.token + 1, s = String.fromCharCode(i.marker), l = t.tokens[i.token];
    l.type = o ? "strong_open" : "em_open", l.tag = o ? "strong" : "em", l.nesting = 1, l.markup = o ? s + s : s, l.content = "";
    const c = t.tokens[u.token];
    c.type = o ? "strong_close" : "em_close", c.tag = o ? "strong" : "em", c.nesting = -1, c.markup = o ? s + s : s, c.content = "", o && (t.tokens[e[r - 1].token].content = "", t.tokens[e[i.end + 1].token].content = "", r--);
  }
}
function SA(t) {
  const e = t.tokens_meta, n = t.tokens_meta.length;
  io(t, t.delimiters);
  for (let r = 0; r < n; r++)
    e[r] && e[r].delimiters && io(t, e[r].delimiters);
}
const Rl = {
  tokenize: BA,
  postProcess: SA
};
function MA(t, e) {
  let n, r, i, u, o = "", s = "", l = t.pos, c = !0;
  if (t.src.charCodeAt(t.pos) !== 91)
    return !1;
  const a = t.pos, f = t.posMax, p = t.pos + 1, d = t.md.helpers.parseLinkLabel(t, t.pos, !0);
  if (d < 0)
    return !1;
  let h = d + 1;
  if (h < f && t.src.charCodeAt(h) === 40) {
    for (c = !1, h++; h < f && (n = t.src.charCodeAt(h), !(!T(n) && n !== 10)); h++)
      ;
    if (h >= f)
      return !1;
    if (l = h, i = t.md.helpers.parseLinkDestination(t.src, h, t.posMax), i.ok) {
      for (o = t.md.normalizeLink(i.str), t.md.validateLink(o) ? h = i.pos : o = "", l = h; h < f && (n = t.src.charCodeAt(h), !(!T(n) && n !== 10)); h++)
        ;
      if (i = t.md.helpers.parseLinkTitle(t.src, h, t.posMax), h < f && l !== h && i.ok)
        for (s = i.str, h = i.pos; h < f && (n = t.src.charCodeAt(h), !(!T(n) && n !== 10)); h++)
          ;
    }
    (h >= f || t.src.charCodeAt(h) !== 41) && (c = !0), h++;
  }
  if (c) {
    if (typeof t.env.references > "u")
      return !1;
    if (h < f && t.src.charCodeAt(h) === 91 ? (l = h + 1, h = t.md.helpers.parseLinkLabel(t, h), h >= 0 ? r = t.src.slice(l, h++) : h = d + 1) : h = d + 1, r || (r = t.src.slice(p, d)), u = t.env.references[nr(r)], !u)
      return t.pos = a, !1;
    o = u.href, s = u.title;
  }
  if (!e) {
    t.pos = p, t.posMax = d;
    const A = t.push("link_open", "a", 1), m = [["href", o]];
    A.attrs = m, s && m.push(["title", s]), t.linkLevel++, t.md.inline.tokenize(t), t.linkLevel--, t.push("link_close", "a", -1);
  }
  return t.pos = h, t.posMax = f, !0;
}
function NA(t, e) {
  let n, r, i, u, o, s, l, c, a = "";
  const f = t.pos, p = t.posMax;
  if (t.src.charCodeAt(t.pos) !== 33 || t.src.charCodeAt(t.pos + 1) !== 91)
    return !1;
  const d = t.pos + 2, h = t.md.helpers.parseLinkLabel(t, t.pos + 1, !1);
  if (h < 0)
    return !1;
  if (u = h + 1, u < p && t.src.charCodeAt(u) === 40) {
    for (u++; u < p && (n = t.src.charCodeAt(u), !(!T(n) && n !== 10)); u++)
      ;
    if (u >= p)
      return !1;
    for (c = u, s = t.md.helpers.parseLinkDestination(t.src, u, t.posMax), s.ok && (a = t.md.normalizeLink(s.str), t.md.validateLink(a) ? u = s.pos : a = ""), c = u; u < p && (n = t.src.charCodeAt(u), !(!T(n) && n !== 10)); u++)
      ;
    if (s = t.md.helpers.parseLinkTitle(t.src, u, t.posMax), u < p && c !== u && s.ok)
      for (l = s.str, u = s.pos; u < p && (n = t.src.charCodeAt(u), !(!T(n) && n !== 10)); u++)
        ;
    else
      l = "";
    if (u >= p || t.src.charCodeAt(u) !== 41)
      return t.pos = f, !1;
    u++;
  } else {
    if (typeof t.env.references > "u")
      return !1;
    if (u < p && t.src.charCodeAt(u) === 91 ? (c = u + 1, u = t.md.helpers.parseLinkLabel(t, u), u >= 0 ? i = t.src.slice(c, u++) : u = h + 1) : u = h + 1, i || (i = t.src.slice(d, h)), o = t.env.references[nr(i)], !o)
      return t.pos = f, !1;
    a = o.href, l = o.title;
  }
  if (!e) {
    r = t.src.slice(d, h);
    const A = [];
    t.md.inline.parse(
      r,
      t.md,
      t.env,
      A
    );
    const m = t.push("image", "img", 0), g = [["src", a], ["alt", ""]];
    m.attrs = g, m.children = A, m.content = r, l && g.push(["title", l]);
  }
  return t.pos = u, t.posMax = p, !0;
}
const OA = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/, RA = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function TA(t, e) {
  let n = t.pos;
  if (t.src.charCodeAt(n) !== 60)
    return !1;
  const r = t.pos, i = t.posMax;
  for (; ; ) {
    if (++n >= i) return !1;
    const o = t.src.charCodeAt(n);
    if (o === 60) return !1;
    if (o === 62) break;
  }
  const u = t.src.slice(r + 1, n);
  if (RA.test(u)) {
    const o = t.md.normalizeLink(u);
    if (!t.md.validateLink(o))
      return !1;
    if (!e) {
      const s = t.push("link_open", "a", 1);
      s.attrs = [["href", o]], s.markup = "autolink", s.info = "auto";
      const l = t.push("text", "", 0);
      l.content = t.md.normalizeLinkText(u);
      const c = t.push("link_close", "a", -1);
      c.markup = "autolink", c.info = "auto";
    }
    return t.pos += u.length + 2, !0;
  }
  if (OA.test(u)) {
    const o = t.md.normalizeLink("mailto:" + u);
    if (!t.md.validateLink(o))
      return !1;
    if (!e) {
      const s = t.push("link_open", "a", 1);
      s.attrs = [["href", o]], s.markup = "autolink", s.info = "auto";
      const l = t.push("text", "", 0);
      l.content = t.md.normalizeLinkText(u);
      const c = t.push("link_close", "a", -1);
      c.markup = "autolink", c.info = "auto";
    }
    return t.pos += u.length + 2, !0;
  }
  return !1;
}
function vA(t) {
  return /^<a[>\s]/i.test(t);
}
function zA(t) {
  return /^<\/a\s*>/i.test(t);
}
function QA(t) {
  const e = t | 32;
  return e >= 97 && e <= 122;
}
function KA(t, e) {
  if (!t.md.options.html)
    return !1;
  const n = t.posMax, r = t.pos;
  if (t.src.charCodeAt(r) !== 60 || r + 2 >= n)
    return !1;
  const i = t.src.charCodeAt(r + 1);
  if (i !== 33 && i !== 63 && i !== 47 && !QA(i))
    return !1;
  const u = t.src.slice(r).match(pA);
  if (!u)
    return !1;
  if (!e) {
    const o = t.push("html_inline", "", 0);
    o.content = u[0], vA(o.content) && t.linkLevel++, zA(o.content) && t.linkLevel--;
  }
  return t.pos += u[0].length, !0;
}
const WA = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i, PA = /^&([a-z][a-z0-9]{1,31});/i;
function JA(t, e) {
  const n = t.pos, r = t.posMax;
  if (t.src.charCodeAt(n) !== 38 || n + 1 >= r) return !1;
  if (t.src.charCodeAt(n + 1) === 35) {
    const u = t.src.slice(n).match(WA);
    if (u) {
      if (!e) {
        const o = u[1][0].toLowerCase() === "x" ? parseInt(u[1].slice(1), 16) : parseInt(u[1], 10), s = t.push("text_special", "", 0);
        s.content = _i(o) ? an(o) : an(65533), s.markup = u[0], s.info = "entity";
      }
      return t.pos += u[0].length, !0;
    }
  } else {
    const u = t.src.slice(n).match(PA);
    if (u) {
      const o = sp(u[0]);
      if (o !== u[0]) {
        if (!e) {
          const s = t.push("text_special", "", 0);
          s.content = o, s.markup = u[0], s.info = "entity";
        }
        return t.pos += u[0].length, !0;
      }
    }
  }
  return !1;
}
function uo(t) {
  const e = {}, n = t.length;
  if (!n) return;
  let r = 0, i = -2;
  const u = [];
  for (let o = 0; o < n; o++) {
    const s = t[o];
    if (u.push(0), (t[r].marker !== s.marker || i !== s.token - 1) && (r = o), i = s.token, s.length = s.length || 0, !s.close) continue;
    e.hasOwnProperty(s.marker) || (e[s.marker] = [-1, -1, -1, -1, -1, -1]);
    const l = e[s.marker][(s.open ? 3 : 0) + s.length % 3];
    let c = r - u[r] - 1, a = c;
    for (; c > l; c -= u[c] + 1) {
      const f = t[c];
      if (f.marker === s.marker && f.open && f.end < 0) {
        let p = !1;
        if ((f.close || s.open) && (f.length + s.length) % 3 === 0 && (f.length % 3 !== 0 || s.length % 3 !== 0) && (p = !0), !p) {
          const d = c > 0 && !t[c - 1].open ? u[c - 1] + 1 : 0;
          u[o] = o - c + d, u[c] = d, s.open = !1, f.end = o, f.close = !1, a = -1, i = -2;
          break;
        }
      }
    }
    a !== -1 && (e[s.marker][(s.open ? 3 : 0) + (s.length || 0) % 3] = a);
  }
}
function GA(t) {
  const e = t.tokens_meta, n = t.tokens_meta.length;
  uo(t.delimiters);
  for (let r = 0; r < n; r++)
    e[r] && e[r].delimiters && uo(e[r].delimiters);
}
function LA(t) {
  let e, n, r = 0;
  const i = t.tokens, u = t.tokens.length;
  for (e = n = 0; e < u; e++)
    i[e].nesting < 0 && r--, i[e].level = r, i[e].nesting > 0 && r++, i[e].type === "text" && e + 1 < u && i[e + 1].type === "text" ? i[e + 1].content = i[e].content + i[e + 1].content : (e !== n && (i[n] = i[e]), n++);
  e !== n && (i.length = n);
}
const Rr = [
  ["text", CA],
  ["linkify", DA],
  ["newline", EA],
  ["escape", FA],
  ["backticks", _A],
  ["strikethrough", Ol.tokenize],
  ["emphasis", Rl.tokenize],
  ["link", MA],
  ["image", NA],
  ["autolink", TA],
  ["html_inline", KA],
  ["entity", JA]
], Tr = [
  ["balance_pairs", GA],
  ["strikethrough", Ol.postProcess],
  ["emphasis", Rl.postProcess],
  // rules for pairs separate '**' into its own text tokens, which may be left unused,
  // rule below merges unused segments back with the rest of the text
  ["fragments_join", LA]
];
function xn() {
  this.ruler = new re();
  for (let t = 0; t < Rr.length; t++)
    this.ruler.push(Rr[t][0], Rr[t][1]);
  this.ruler2 = new re();
  for (let t = 0; t < Tr.length; t++)
    this.ruler2.push(Tr[t][0], Tr[t][1]);
}
xn.prototype.skipToken = function(t) {
  const e = t.pos, n = this.ruler.getRules(""), r = n.length, i = t.md.options.maxNesting, u = t.cache;
  if (typeof u[e] < "u") {
    t.pos = u[e];
    return;
  }
  let o = !1;
  if (t.level < i) {
    for (let s = 0; s < r; s++)
      if (t.level++, o = n[s](t, !0), t.level--, o) {
        if (e >= t.pos)
          throw new Error("inline rule didn't increment state.pos");
        break;
      }
  } else
    t.pos = t.posMax;
  o || t.pos++, u[e] = t.pos;
};
xn.prototype.tokenize = function(t) {
  const e = this.ruler.getRules(""), n = e.length, r = t.posMax, i = t.md.options.maxNesting;
  for (; t.pos < r; ) {
    const u = t.pos;
    let o = !1;
    if (t.level < i) {
      for (let s = 0; s < n; s++)
        if (o = e[s](t, !1), o) {
          if (u >= t.pos)
            throw new Error("inline rule didn't increment state.pos");
          break;
        }
    }
    if (o) {
      if (t.pos >= r)
        break;
      continue;
    }
    t.pending += t.src[t.pos++];
  }
  t.pending && t.pushPending();
};
xn.prototype.parse = function(t, e, n, r) {
  const i = new this.State(t, e, n, r);
  this.tokenize(i);
  const u = this.ruler2.getRules(""), o = u.length;
  for (let s = 0; s < o; s++)
    u[s](i);
};
xn.prototype.State = kn;
function ZA(t) {
  const e = {};
  t = t || {}, e.src_Any = xl.source, e.src_Cc = Cl.source, e.src_Z = Dl.source, e.src_P = Ei.source, e.src_ZPCc = [e.src_Z, e.src_P, e.src_Cc].join("|"), e.src_ZCc = [e.src_Z, e.src_Cc].join("|");
  const n = "[><｜]";
  return e.src_pseudo_letter = `(?:(?!${n}|${e.src_ZPCc})${e.src_Any})`, e.src_ip4 = "(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)", e.src_auth = `(?:(?:(?!${e.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`, e.src_port = "(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?", e.src_host_terminator = `(?=$|${n}|${e.src_ZPCc})(?!${t["---"] ? "-(?!--)|" : "-|"}_|:\\d|\\.-|\\.(?!$|${e.src_ZPCc}))`, e.src_path = `(?:[/?#](?:(?!${e.src_ZCc}|${n}|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!${e.src_ZCc}|\\]).)*\\]|\\((?:(?!${e.src_ZCc}|[)]).)*\\)|\\{(?:(?!${e.src_ZCc}|[}]).)*\\}|\\"(?:(?!${e.src_ZCc}|["]).)+\\"|\\'(?:(?!${e.src_ZCc}|[']).)+\\'|\\'(?=${e.src_pseudo_letter}|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!${e.src_ZCc}|[.]|$)|` + (t["---"] ? "\\-(?!--(?:[^-]|$))(?:-*)|" : "\\-+|") + // allow `,,,` in paths
  `,(?!${e.src_ZCc}|$)|;(?!${e.src_ZCc}|$)|\\!+(?!${e.src_ZCc}|[!]|$)|\\?(?!${e.src_ZCc}|[?]|$))+|\\/)?`, e.src_email_name = '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]{0,63}', e.src_xn = "xn--[a-z0-9\\-]{1,59}", e.src_domain_root = // Allow letters & digits (http://test1)
  "(?:" + e.src_xn + `|${e.src_pseudo_letter}{1,63})`, e.src_domain = "(?:" + e.src_xn + `|(?:${e.src_pseudo_letter})|(?:${e.src_pseudo_letter}(?:-|${e.src_pseudo_letter}){0,61}${e.src_pseudo_letter}))`, e.src_host = `(?:(?:(?:(?:${e.src_domain})\\.)*${e.src_domain}))`, e.tpl_host_fuzzy = "(?:" + e.src_ip4 + `|(?:(?:(?:${e.src_domain})\\.)+(?:%TLDS%)))`, e.tpl_host_no_ip_fuzzy = `(?:(?:(?:${e.src_domain})\\.)+(?:%TLDS%))`, e.src_host_strict = e.src_host + e.src_host_terminator, e.tpl_host_fuzzy_strict = e.tpl_host_fuzzy + e.src_host_terminator, e.src_host_port_strict = e.src_host + e.src_port + e.src_host_terminator, e.tpl_host_port_fuzzy_strict = e.tpl_host_fuzzy + e.src_port + e.src_host_terminator, e.tpl_host_port_no_ip_fuzzy_strict = e.tpl_host_no_ip_fuzzy + e.src_port + e.src_host_terminator, e.tpl_host_fuzzy_test = `localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:${e.src_ZPCc}|>|$))`, e.tpl_email_fuzzy = `(^|${n}|"|\\(|${e.src_ZCc})(${e.src_email_name}@${e.tpl_host_fuzzy_strict})`, e.tpl_link_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  `(^|(?![.:/\\-_@])(?:[$+<=>^\`|｜]|${e.src_ZPCc}))((?![$+<=>^\`|｜])${e.tpl_host_port_fuzzy_strict}${e.src_path})`, e.tpl_link_no_ip_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
  // but can start with > (markdown blockquote)
  `(^|(?![.:/\\-_@])(?:[$+<=>^\`|｜]|${e.src_ZPCc}))((?![$+<=>^\`|｜])${e.tpl_host_port_no_ip_fuzzy_strict}${e.src_path})`, e;
}
function ni(t) {
  return Array.prototype.slice.call(arguments, 1).forEach(function(n) {
    n && Object.keys(n).forEach(function(r) {
      t[r] = n[r];
    });
  }), t;
}
function ur(t) {
  return Object.prototype.toString.call(t);
}
function YA(t) {
  return ur(t) === "[object String]";
}
function HA(t) {
  return ur(t) === "[object Object]";
}
function VA(t) {
  return ur(t) === "[object RegExp]";
}
function oo(t) {
  return ur(t) === "[object Function]";
}
function UA(t) {
  return t.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
const Tl = {
  fuzzyLink: !0,
  fuzzyEmail: !0,
  fuzzyIP: !1
};
function $A(t) {
  return Object.keys(t || {}).reduce(function(e, n) {
    return e || Tl.hasOwnProperty(n);
  }, !1);
}
const qA = {
  "http:": {
    validate: function(t, e, n) {
      const r = t.slice(e);
      return n.re.http || (n.re.http = new RegExp(
        `^\\/\\/${n.re.src_auth}${n.re.src_host_port_strict}${n.re.src_path}`,
        "i"
      )), n.re.http.test(r) ? r.match(n.re.http)[0].length : 0;
    }
  },
  "https:": "http:",
  "ftp:": "http:",
  "//": {
    validate: function(t, e, n) {
      const r = t.slice(e);
      return n.re.no_http || (n.re.no_http = new RegExp(
        "^" + n.re.src_auth + // Don't allow single-level domains, because of false positives like '//test'
        // with code comments
        `(?:localhost|(?:(?:${n.re.src_domain})\\.)+${n.re.src_domain_root})` + n.re.src_port + n.re.src_host_terminator + n.re.src_path,
        "i"
      )), n.re.no_http.test(r) ? e >= 3 && t[e - 3] === ":" || e >= 3 && t[e - 3] === "/" ? 0 : r.match(n.re.no_http)[0].length : 0;
    }
  },
  "mailto:": {
    validate: function(t, e, n) {
      const r = t.slice(e);
      return n.re.mailto || (n.re.mailto = new RegExp(
        `^${n.re.src_email_name}@${n.re.src_host_strict}`,
        "i"
      )), n.re.mailto.test(r) ? r.match(n.re.mailto)[0].length : 0;
    }
  }
}, jA = "a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]", XA = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф".split("|");
function e1(t) {
  return function(e, n) {
    const r = e.slice(n);
    return t.test(r) ? r.match(t)[0].length : 0;
  };
}
function so() {
  return function(t, e) {
    e.normalize(t);
  };
}
function Yn(t) {
  const e = t.re = ZA(t.__opts__), n = t.__tlds__.slice();
  t.onCompile(), t.__tlds_replaced__ || n.push(jA), n.push(e.src_xn), e.src_tlds = n.join("|");
  function r(s) {
    return s.replace("%TLDS%", e.src_tlds);
  }
  e.email_fuzzy = RegExp(r(e.tpl_email_fuzzy), "i"), e.email_fuzzy_global = RegExp(r(e.tpl_email_fuzzy), "ig"), e.link_fuzzy = RegExp(r(e.tpl_link_fuzzy), "i"), e.link_fuzzy_global = RegExp(r(e.tpl_link_fuzzy), "ig"), e.link_no_ip_fuzzy = RegExp(r(e.tpl_link_no_ip_fuzzy), "i"), e.link_no_ip_fuzzy_global = RegExp(r(e.tpl_link_no_ip_fuzzy), "ig"), e.host_fuzzy_test = RegExp(r(e.tpl_host_fuzzy_test), "i");
  const i = [];
  t.__compiled__ = {};
  function u(s, l) {
    throw new Error(`(LinkifyIt) Invalid schema "${s}": ${l}`);
  }
  Object.keys(t.__schemas__).forEach(function(s) {
    const l = t.__schemas__[s];
    if (l === null)
      return;
    const c = { validate: null, link: null };
    if (t.__compiled__[s] = c, HA(l)) {
      VA(l.validate) ? c.validate = e1(l.validate) : oo(l.validate) ? c.validate = l.validate : u(s, l), oo(l.normalize) ? c.normalize = l.normalize : l.normalize ? u(s, l) : c.normalize = so();
      return;
    }
    if (YA(l)) {
      i.push(s);
      return;
    }
    u(s, l);
  }), i.forEach(function(s) {
    t.__compiled__[t.__schemas__[s]] && (t.__compiled__[s].validate = t.__compiled__[t.__schemas__[s]].validate, t.__compiled__[s].normalize = t.__compiled__[t.__schemas__[s]].normalize);
  }), t.__compiled__[""] = { validate: null, normalize: so() };
  const o = Object.keys(t.__compiled__).filter(function(s) {
    return s.length > 0 && t.__compiled__[s];
  }).map(UA).join("|");
  t.re.schema_test = RegExp(`(^|(?!_)(?:[><｜]|${e.src_ZPCc}))(${o})`, "i"), t.re.schema_search = RegExp(`(^|(?!_)(?:[><｜]|${e.src_ZPCc}))(${o})`, "ig"), t.re.schema_at_start = RegExp(`^${t.re.schema_search.source}`, "i"), t.re.pretest = RegExp(
    `(${t.re.schema_test.source})|(${t.re.host_fuzzy_test.source})|@`,
    "i"
  );
}
function vl(t, e, n, r) {
  const i = t.slice(n, r);
  this.schema = e.toLowerCase(), this.index = n, this.lastIndex = r, this.raw = i, this.text = i, this.url = i;
}
function se(t, e) {
  if (!(this instanceof se))
    return new se(t, e);
  e || $A(t) && (e = t, t = {}), this.__opts__ = ni({}, Tl, e), this.__schemas__ = ni({}, qA, t), this.__compiled__ = {}, this.__tlds__ = XA, this.__tlds_replaced__ = !1, this.re = {}, Yn(this);
}
se.prototype.add = function(e, n) {
  return this.__schemas__[e] = n, Yn(this), this;
};
se.prototype.set = function(e) {
  return this.__opts__ = ni(this.__opts__, e), this;
};
se.prototype.test = function(e) {
  if (!e.length)
    return !1;
  let n, r;
  if (this.re.schema_test.test(e)) {
    for (r = this.re.schema_search, r.lastIndex = 0; (n = r.exec(e)) !== null; )
      if (this.testSchemaAt(e, n[2], r.lastIndex))
        return !0;
  }
  return !!(this.__opts__.fuzzyLink && this.__compiled__["http:"] && e.search(this.re.host_fuzzy_test) >= 0 && e.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy) !== null || this.__opts__.fuzzyEmail && this.__compiled__["mailto:"] && e.indexOf("@") >= 0 && e.match(this.re.email_fuzzy) !== null);
};
se.prototype.pretest = function(e) {
  return this.re.pretest.test(e);
};
se.prototype.testSchemaAt = function(e, n, r) {
  return this.__compiled__[n.toLowerCase()] ? this.__compiled__[n.toLowerCase()].validate(e, r, this) : 0;
};
se.prototype.match = function(e) {
  const n = [], r = [], i = [], u = [];
  let o, s, l;
  function c(p, d) {
    return p ? d ? p.index !== d.index ? p.index < d.index ? p : d : p.lastIndex >= d.lastIndex ? p : d : p : d;
  }
  if (!e.length)
    return null;
  if (this.re.schema_test.test(e))
    for (l = this.re.schema_search, l.lastIndex = 0; (o = l.exec(e)) !== null; )
      s = this.testSchemaAt(e, o[2], l.lastIndex), s && r.push({
        schema: o[2],
        index: o.index + o[1].length,
        lastIndex: o.index + o[0].length + s
      });
  if (this.__opts__.fuzzyLink && this.__compiled__["http:"])
    for (l = this.__opts__.fuzzyIP ? this.re.link_fuzzy_global : this.re.link_no_ip_fuzzy_global, l.lastIndex = 0; (o = l.exec(e)) !== null; )
      i.push({
        schema: "",
        index: o.index + o[1].length,
        lastIndex: o.index + o[0].length
      });
  if (this.__opts__.fuzzyEmail && this.__compiled__["mailto:"])
    for (l = this.re.email_fuzzy_global, l.lastIndex = 0; (o = l.exec(e)) !== null; )
      u.push({
        schema: "mailto:",
        index: o.index + o[1].length,
        lastIndex: o.index + o[0].length
      });
  const a = [0, 0, 0];
  let f = 0;
  for (; ; ) {
    const p = [
      r[a[0]],
      u[a[1]],
      i[a[2]]
    ], d = c(c(p[0], p[1]), p[2]);
    if (!d)
      break;
    if (d === p[0] ? a[0]++ : d === p[1] ? a[1]++ : a[2]++, d.index < f)
      continue;
    const h = new vl(e, d.schema, d.index, d.lastIndex);
    this.__compiled__[h.schema].normalize(h, this), n.push(h), f = d.lastIndex;
  }
  return n.length ? n : null;
};
se.prototype.matchAtStart = function(e) {
  if (!e.length) return null;
  const n = this.re.schema_at_start.exec(e);
  if (!n) return null;
  const r = this.testSchemaAt(e, n[2], n[0].length);
  if (!r) return null;
  const i = new vl(e, n[2], n.index + n[1].length, n.index + n[0].length + r);
  return this.__compiled__[i.schema].normalize(i, this), i;
};
se.prototype.tlds = function(e, n) {
  return e = Array.isArray(e) ? e : [e], n ? (this.__tlds__ = this.__tlds__.concat(e).sort().filter(function(r, i, u) {
    return r !== u[i - 1];
  }).reverse(), Yn(this), this) : (this.__tlds__ = e.slice(), this.__tlds_replaced__ = !0, Yn(this), this);
};
se.prototype.normalize = function(e) {
  e.schema || (e.url = `http://${e.url}`), e.schema === "mailto:" && !/^mailto:/i.test(e.url) && (e.url = `mailto:${e.url}`);
};
se.prototype.onCompile = function() {
};
const t1 = {
  options: {
    // Enable HTML tags in source
    html: !1,
    // Use '/' to close single tags (<br />)
    xhtmlOut: !1,
    // Convert '\n' in paragraphs into <br>
    breaks: !1,
    // CSS language prefix for fenced blocks
    langPrefix: "language-",
    // autoconvert URL-like texts to links
    linkify: !1,
    // Enable some language-neutral replacements + quotes beautification
    typographer: !1,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: "“”‘’",
    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    // Internal protection, recursion limit
    maxNesting: 100
  },
  components: {
    core: {},
    block: {},
    inline: {}
  }
}, n1 = {
  options: {
    // Enable HTML tags in source
    html: !1,
    // Use '/' to close single tags (<br />)
    xhtmlOut: !1,
    // Convert '\n' in paragraphs into <br>
    breaks: !1,
    // CSS language prefix for fenced blocks
    langPrefix: "language-",
    // autoconvert URL-like texts to links
    linkify: !1,
    // Enable some language-neutral replacements + quotes beautification
    typographer: !1,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: "“”‘’",
    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    // Internal protection, recursion limit
    maxNesting: 20
  },
  components: {
    core: {
      rules: [
        "normalize",
        "block",
        "inline",
        "text_join"
      ]
    },
    block: {
      rules: [
        "paragraph"
      ]
    },
    inline: {
      rules: [
        "text"
      ],
      rules2: [
        "balance_pairs",
        "fragments_join"
      ]
    }
  }
}, r1 = {
  options: {
    // Enable HTML tags in source
    html: !0,
    // Use '/' to close single tags (<br />)
    xhtmlOut: !0,
    // Convert '\n' in paragraphs into <br>
    breaks: !1,
    // CSS language prefix for fenced blocks
    langPrefix: "language-",
    // autoconvert URL-like texts to links
    linkify: !1,
    // Enable some language-neutral replacements + quotes beautification
    typographer: !1,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: "“”‘’",
    /* “”‘’ */
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,
    // Internal protection, recursion limit
    maxNesting: 20
  },
  components: {
    core: {
      rules: [
        "normalize",
        "block",
        "inline",
        "text_join"
      ]
    },
    block: {
      rules: [
        "blockquote",
        "code",
        "fence",
        "heading",
        "hr",
        "html_block",
        "lheading",
        "list",
        "reference",
        "paragraph"
      ]
    },
    inline: {
      rules: [
        "autolink",
        "backticks",
        "emphasis",
        "entity",
        "escape",
        "html_inline",
        "image",
        "link",
        "newline",
        "text"
      ],
      rules2: [
        "balance_pairs",
        "emphasis",
        "fragments_join"
      ]
    }
  }
}, i1 = {
  default: t1,
  zero: n1,
  commonmark: r1
}, u1 = /^(vbscript|javascript|file|data):/, o1 = /^data:image\/(gif|png|jpeg|webp);/;
function s1(t) {
  const e = t.trim().toLowerCase();
  return u1.test(e) ? o1.test(e) : !0;
}
const zl = ["http:", "https:", "mailto:"];
function l1(t) {
  const e = tn(t, !0);
  if (e.hostname && (!e.protocol || zl.indexOf(e.protocol) >= 0))
    try {
      e.hostname = Zn.toASCII(e.hostname);
    } catch {
    }
  return Mt(en(e));
}
function c1(t) {
  const e = tn(t, !0);
  if (e.hostname && (!e.protocol || zl.indexOf(e.protocol) >= 0))
    try {
      e.hostname = Zn.toUnicode(e.hostname);
    } catch {
    }
  return $e(en(e), $e.defaultChars + "%");
}
function he(t, e) {
  if (!(this instanceof he))
    return new he(t, e);
  e || Fi(t) || (e = t || {}, t = "default"), this.inline = new xn(), this.block = new ir(), this.core = new wi(), this.renderer = new Nt(), this.linkify = new se(), this.validateLink = s1, this.normalizeLink = l1, this.normalizeLinkText = c1, this.utils = Dp, this.helpers = tr({}, wp), this.options = {}, this.configure(t), e && this.set(e);
}
he.prototype.set = function(t) {
  return tr(this.options, t), this;
};
he.prototype.configure = function(t) {
  const e = this;
  if (Fi(t)) {
    const n = t;
    if (t = i1[n], !t)
      throw new Error('Wrong `markdown-it` preset "' + n + '", check name');
  }
  if (!t)
    throw new Error("Wrong `markdown-it` preset, can't be empty");
  return t.options && e.set(t.options), t.components && Object.keys(t.components).forEach(function(n) {
    t.components[n].rules && e[n].ruler.enableOnly(t.components[n].rules), t.components[n].rules2 && e[n].ruler2.enableOnly(t.components[n].rules2);
  }), this;
};
he.prototype.enable = function(t, e) {
  let n = [];
  Array.isArray(t) || (t = [t]), ["core", "block", "inline"].forEach(function(i) {
    n = n.concat(this[i].ruler.enable(t, !0));
  }, this), n = n.concat(this.inline.ruler2.enable(t, !0));
  const r = t.filter(function(i) {
    return n.indexOf(i) < 0;
  });
  if (r.length && !e)
    throw new Error("MarkdownIt. Failed to enable unknown rule(s): " + r);
  return this;
};
he.prototype.disable = function(t, e) {
  let n = [];
  Array.isArray(t) || (t = [t]), ["core", "block", "inline"].forEach(function(i) {
    n = n.concat(this[i].ruler.disable(t, !0));
  }, this), n = n.concat(this.inline.ruler2.disable(t, !0));
  const r = t.filter(function(i) {
    return n.indexOf(i) < 0;
  });
  if (r.length && !e)
    throw new Error("MarkdownIt. Failed to disable unknown rule(s): " + r);
  return this;
};
he.prototype.use = function(t) {
  const e = [this].concat(Array.prototype.slice.call(arguments, 1));
  return t.apply(t, e), this;
};
he.prototype.parse = function(t, e) {
  if (typeof t != "string")
    throw new Error("Input data should be a String");
  const n = new this.core.State(t, this, e);
  return this.core.process(n), n.tokens;
};
he.prototype.render = function(t, e) {
  return e = e || {}, this.renderer.render(this.parse(t, e), this.options, e);
};
he.prototype.parseInline = function(t, e) {
  const n = new this.core.State(t, this, e);
  return n.inlineMode = !0, this.core.process(n), n.tokens;
};
he.prototype.renderInline = function(t, e) {
  return e = e || {}, this.renderer.render(this.parseInline(t, e), this.options, e);
};
const a1 = new ri({
  nodes: {
    doc: {
      content: "block+"
    },
    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      toDOM() {
        return ["p", 0];
      }
    },
    blockquote: {
      content: "block+",
      group: "block",
      parseDOM: [{ tag: "blockquote" }],
      toDOM() {
        return ["blockquote", 0];
      }
    },
    horizontal_rule: {
      group: "block",
      parseDOM: [{ tag: "hr" }],
      toDOM() {
        return ["div", ["hr"]];
      }
    },
    heading: {
      attrs: { level: { default: 1 } },
      content: "(text | image)*",
      group: "block",
      defining: !0,
      parseDOM: [
        { tag: "h1", attrs: { level: 1 } },
        { tag: "h2", attrs: { level: 2 } },
        { tag: "h3", attrs: { level: 3 } },
        { tag: "h4", attrs: { level: 4 } },
        { tag: "h5", attrs: { level: 5 } },
        { tag: "h6", attrs: { level: 6 } }
      ],
      toDOM(t) {
        return ["h" + t.attrs.level, 0];
      }
    },
    code_block: {
      content: "text*",
      group: "block",
      code: !0,
      defining: !0,
      marks: "",
      attrs: { params: { default: "" } },
      parseDOM: [{ tag: "pre", preserveWhitespace: "full", getAttrs: (t) => ({ params: t.getAttribute("data-params") || "" }) }],
      toDOM(t) {
        return ["pre", t.attrs.params ? { "data-params": t.attrs.params } : {}, ["code", 0]];
      }
    },
    ordered_list: {
      content: "list_item+",
      group: "block",
      attrs: { order: { default: 1 }, tight: { default: !1 } },
      parseDOM: [{ tag: "ol", getAttrs(t) {
        return {
          order: t.hasAttribute("start") ? +t.getAttribute("start") : 1,
          tight: t.hasAttribute("data-tight")
        };
      } }],
      toDOM(t) {
        return ["ol", {
          start: t.attrs.order == 1 ? null : t.attrs.order,
          "data-tight": t.attrs.tight ? "true" : null
        }, 0];
      }
    },
    bullet_list: {
      content: "list_item+",
      group: "block",
      attrs: { tight: { default: !1 } },
      parseDOM: [{ tag: "ul", getAttrs: (t) => ({ tight: t.hasAttribute("data-tight") }) }],
      toDOM(t) {
        return ["ul", { "data-tight": t.attrs.tight ? "true" : null }, 0];
      }
    },
    list_item: {
      content: "block+",
      defining: !0,
      parseDOM: [{ tag: "li" }],
      toDOM() {
        return ["li", 0];
      }
    },
    text: {
      group: "inline"
    },
    image: {
      inline: !0,
      attrs: {
        src: {},
        alt: { default: null },
        title: { default: null }
      },
      group: "inline",
      draggable: !0,
      parseDOM: [{ tag: "img[src]", getAttrs(t) {
        return {
          src: t.getAttribute("src"),
          title: t.getAttribute("title"),
          alt: t.getAttribute("alt")
        };
      } }],
      toDOM(t) {
        return ["img", t.attrs];
      }
    },
    hard_break: {
      inline: !0,
      group: "inline",
      selectable: !1,
      parseDOM: [{ tag: "br" }],
      toDOM() {
        return ["br"];
      }
    }
  },
  marks: {
    em: {
      parseDOM: [
        { tag: "i" },
        { tag: "em" },
        { style: "font-style=italic" },
        { style: "font-style=normal", clearMark: (t) => t.type.name == "em" }
      ],
      toDOM() {
        return ["em"];
      }
    },
    strong: {
      parseDOM: [
        { tag: "strong" },
        { tag: "b", getAttrs: (t) => t.style.fontWeight != "normal" && null },
        { style: "font-weight=400", clearMark: (t) => t.type.name == "strong" },
        { style: "font-weight", getAttrs: (t) => /^(bold(er)?|[5-9]\d{2,})$/.test(t) && null }
      ],
      toDOM() {
        return ["strong"];
      }
    },
    link: {
      attrs: {
        href: {},
        title: { default: null }
      },
      inclusive: !1,
      parseDOM: [{ tag: "a[href]", getAttrs(t) {
        return { href: t.getAttribute("href"), title: t.getAttribute("title") };
      } }],
      toDOM(t) {
        return ["a", t.attrs];
      }
    },
    code: {
      code: !0,
      parseDOM: [{ tag: "code" }],
      toDOM() {
        return ["code"];
      }
    }
  }
});
function f1(t, e) {
  if (t.isText && e.isText && B.sameSet(t.marks, e.marks))
    return t.withText(t.text + e.text);
}
class h1 {
  constructor(e, n) {
    this.schema = e, this.tokenHandlers = n, this.stack = [{ type: e.topNodeType, attrs: null, content: [], marks: B.none }];
  }
  top() {
    return this.stack[this.stack.length - 1];
  }
  push(e) {
    this.stack.length && this.top().content.push(e);
  }
  // Adds the given text to the current position in the document,
  // using the current marks as styling.
  addText(e) {
    if (!e)
      return;
    let n = this.top(), r = n.content, i = r[r.length - 1], u = this.schema.text(e, n.marks), o;
    i && (o = f1(i, u)) ? r[r.length - 1] = o : r.push(u);
  }
  // Adds the given mark to the set of active marks.
  openMark(e) {
    let n = this.top();
    n.marks = e.addToSet(n.marks);
  }
  // Removes the given mark from the set of active marks.
  closeMark(e) {
    let n = this.top();
    n.marks = e.removeFromSet(n.marks);
  }
  parseTokens(e) {
    for (let n = 0; n < e.length; n++) {
      let r = e[n], i = this.tokenHandlers[r.type];
      if (!i)
        throw new Error("Token type `" + r.type + "` not supported by Markdown parser");
      i(this, r, e, n);
    }
  }
  // Add a node at the current position.
  addNode(e, n, r) {
    let i = this.top(), u = e.createAndFill(n, r, i ? i.marks : []);
    return u ? (this.push(u), u) : null;
  }
  // Wrap subsequent content in a node of the given type.
  openNode(e, n) {
    this.stack.push({ type: e, attrs: n, content: [], marks: B.none });
  }
  // Close and return the node that is currently on top of the stack.
  closeNode() {
    let e = this.stack.pop();
    return this.addNode(e.type, e.attrs, e.content);
  }
}
function zt(t, e, n, r) {
  return t.getAttrs ? t.getAttrs(e, n, r) : t.attrs instanceof Function ? t.attrs(e) : t.attrs;
}
function vr(t, e) {
  return t.noCloseToken || e == "code_inline" || e == "code_block" || e == "fence";
}
function lo(t) {
  return t[t.length - 1] == `
` ? t.slice(0, t.length - 1) : t;
}
function zr() {
}
function d1(t, e) {
  let n = /* @__PURE__ */ Object.create(null);
  for (let r in e) {
    let i = e[r];
    if (i.block) {
      let u = t.nodeType(i.block);
      vr(i, r) ? n[r] = (o, s, l, c) => {
        o.openNode(u, zt(i, s, l, c)), o.addText(lo(s.content)), o.closeNode();
      } : (n[r + "_open"] = (o, s, l, c) => o.openNode(u, zt(i, s, l, c)), n[r + "_close"] = (o) => o.closeNode());
    } else if (i.node) {
      let u = t.nodeType(i.node);
      n[r] = (o, s, l, c) => o.addNode(u, zt(i, s, l, c));
    } else if (i.mark) {
      let u = t.marks[i.mark];
      vr(i, r) ? n[r] = (o, s, l, c) => {
        o.openMark(u.create(zt(i, s, l, c))), o.addText(lo(s.content)), o.closeMark(u);
      } : (n[r + "_open"] = (o, s, l, c) => o.openMark(u.create(zt(i, s, l, c))), n[r + "_close"] = (o) => o.closeMark(u));
    } else if (i.ignore)
      vr(i, r) ? n[r] = zr : (n[r + "_open"] = zr, n[r + "_close"] = zr);
    else
      throw new RangeError("Unrecognized parsing spec " + JSON.stringify(i));
  }
  return n.text = (r, i) => r.addText(i.content), n.inline = (r, i) => r.parseTokens(i.children), n.softbreak = n.softbreak || ((r) => r.addText(" ")), n;
}
class Ql {
  /**
  Create a parser with the given configuration. You can configure
  the markdown-it parser to parse the dialect you want, and provide
  a description of the ProseMirror entities those tokens map to in
  the `tokens` object, which maps token names to descriptions of
  what to do with them. Such a description is an object, and may
  have the following properties:
  */
  constructor(e, n, r) {
    this.schema = e, this.tokenizer = n, this.tokens = r, this.tokenHandlers = d1(e, r);
  }
  /**
  Parse a string as [CommonMark](http://commonmark.org/) markup,
  and create a ProseMirror document as prescribed by this parser's
  rules.
  
  The second argument, when given, is passed through to the
  [Markdown
  parser](https://markdown-it.github.io/markdown-it/#MarkdownIt.parse).
  */
  parse(e, n = {}) {
    let r = new h1(this.schema, this.tokenHandlers), i;
    r.parseTokens(this.tokenizer.parse(e, n));
    do
      i = r.closeNode();
    while (r.stack.length);
    return i || this.schema.topNodeType.createAndFill();
  }
}
function co(t, e) {
  for (; ++e < t.length; )
    if (t[e].type != "list_item_open")
      return t[e].hidden;
  return !1;
}
const p1 = new Ql(a1, he("commonmark", { html: !1 }), {
  blockquote: { block: "blockquote" },
  paragraph: { block: "paragraph" },
  list_item: { block: "list_item" },
  bullet_list: { block: "bullet_list", getAttrs: (t, e, n) => ({ tight: co(e, n) }) },
  ordered_list: { block: "ordered_list", getAttrs: (t, e, n) => ({
    order: +t.attrGet("start") || 1,
    tight: co(e, n)
  }) },
  heading: { block: "heading", getAttrs: (t) => ({ level: +t.tag.slice(1) }) },
  code_block: { block: "code_block", noCloseToken: !0 },
  fence: { block: "code_block", getAttrs: (t) => ({ params: t.info || "" }), noCloseToken: !0 },
  hr: { node: "horizontal_rule" },
  image: { node: "image", getAttrs: (t) => ({
    src: t.attrGet("src"),
    title: t.attrGet("title") || null,
    alt: t.children[0] && t.children[0].content || null
  }) },
  hardbreak: { node: "hard_break" },
  em: { mark: "em" },
  strong: { mark: "strong" },
  link: { mark: "link", getAttrs: (t) => ({
    href: t.attrGet("href"),
    title: t.attrGet("title") || null
  }) },
  code_inline: { mark: "code", noCloseToken: !0 }
}), A1 = { open: "", close: "", mixable: !0 };
class Kl {
  /**
  Construct a serializer with the given configuration. The `nodes`
  object should map node names in a given schema to function that
  take a serializer state and such a node, and serialize the node.
  */
  constructor(e, n, r = {}) {
    this.nodes = e, this.marks = n, this.options = r;
  }
  /**
  Serialize the content of the given node to
  [CommonMark](http://commonmark.org/).
  */
  serialize(e, n = {}) {
    n = Object.assign({}, this.options, n);
    let r = new g1(this.nodes, this.marks, n);
    return r.renderContent(e), r.out;
  }
}
const ao = new Kl({
  blockquote(t, e) {
    t.wrapBlock("> ", null, e, () => t.renderContent(e));
  },
  code_block(t, e) {
    const n = e.textContent.match(/`{3,}/gm), r = n ? n.sort().slice(-1)[0] + "`" : "```";
    t.write(r + (e.attrs.params || "") + `
`), t.text(e.textContent, !1), t.write(`
`), t.write(r), t.closeBlock(e);
  },
  heading(t, e) {
    t.write(t.repeat("#", e.attrs.level) + " "), t.renderInline(e, !1), t.closeBlock(e);
  },
  horizontal_rule(t, e) {
    t.write(e.attrs.markup || "---"), t.closeBlock(e);
  },
  bullet_list(t, e) {
    t.renderList(e, "  ", () => (e.attrs.bullet || "*") + " ");
  },
  ordered_list(t, e) {
    var n;
    let r = (n = e.attrs.order) !== null && n !== void 0 ? n : 1, i = String(r + e.childCount - 1).length, u = t.repeat(" ", i + 2);
    t.renderList(e, u, (o) => {
      let s = String(r + o);
      return t.repeat(" ", i - s.length) + s + ". ";
    });
  },
  list_item(t, e) {
    t.renderContent(e);
  },
  paragraph(t, e) {
    t.renderInline(e), t.closeBlock(e);
  },
  image(t, e) {
    t.write("![" + t.esc(e.attrs.alt || "") + "](" + e.attrs.src.replace(/[\(\)]/g, "\\$&") + (e.attrs.title ? ' "' + e.attrs.title.replace(/"/g, '\\"') + '"' : "") + ")");
  },
  hard_break(t, e, n, r) {
    for (let i = r + 1; i < n.childCount; i++)
      if (n.child(i).type != e.type) {
        t.write(`\\
`);
        return;
      }
  },
  text(t, e) {
    t.text(e.text, !t.inAutolink);
  }
}, {
  em: { open: "*", close: "*", mixable: !0, expelEnclosingWhitespace: !0 },
  strong: { open: "**", close: "**", mixable: !0, expelEnclosingWhitespace: !0 },
  link: {
    open(t, e, n, r) {
      return t.inAutolink = m1(e, n, r), t.inAutolink ? "<" : "[";
    },
    close(t, e, n, r) {
      let { inAutolink: i } = t;
      return t.inAutolink = void 0, i ? ">" : "](" + e.attrs.href.replace(/[\(\)"]/g, "\\$&") + (e.attrs.title ? ` "${e.attrs.title.replace(/"/g, '\\"')}"` : "") + ")";
    },
    mixable: !0
  },
  code: {
    open(t, e, n, r) {
      return fo(n.child(r), -1);
    },
    close(t, e, n, r) {
      return fo(n.child(r - 1), 1);
    },
    escape: !1
  }
});
function fo(t, e) {
  let n = /`+/g, r, i = 0;
  if (t.isText)
    for (; r = n.exec(t.text); )
      i = Math.max(i, r[0].length);
  let u = i > 0 && e > 0 ? " `" : "`";
  for (let o = 0; o < i; o++)
    u += "`";
  return i > 0 && e < 0 && (u += " "), u;
}
function m1(t, e, n) {
  if (t.attrs.title || !/^\w+:/.test(t.attrs.href))
    return !1;
  let r = e.child(n);
  return !r.isText || r.text != t.attrs.href || r.marks[r.marks.length - 1] != t ? !1 : n == e.childCount - 1 || !t.isInSet(e.child(n + 1).marks);
}
class g1 {
  /**
  @internal
  */
  constructor(e, n, r) {
    this.nodes = e, this.marks = n, this.options = r, this.delim = "", this.out = "", this.closed = null, this.inAutolink = void 0, this.atBlockStart = !1, this.inTightList = !1, typeof this.options.tightLists > "u" && (this.options.tightLists = !1), typeof this.options.hardBreakNodeName > "u" && (this.options.hardBreakNodeName = "hard_break");
  }
  /**
  @internal
  */
  flushClose(e = 2) {
    if (this.closed) {
      if (this.atBlank() || (this.out += `
`), e > 1) {
        let n = this.delim, r = /\s+$/.exec(n);
        r && (n = n.slice(0, n.length - r[0].length));
        for (let i = 1; i < e; i++)
          this.out += n + `
`;
      }
      this.closed = null;
    }
  }
  /**
  @internal
  */
  getMark(e) {
    let n = this.marks[e];
    if (!n) {
      if (this.options.strict !== !1)
        throw new Error(`Mark type \`${e}\` not supported by Markdown renderer`);
      n = A1;
    }
    return n;
  }
  /**
  Render a block, prefixing each line with `delim`, and the first
  line in `firstDelim`. `node` should be the node that is closed at
  the end of the block, and `f` is a function that renders the
  content of the block.
  */
  wrapBlock(e, n, r, i) {
    let u = this.delim;
    this.write(n ?? e), this.delim += e, i(), this.delim = u, this.closeBlock(r);
  }
  /**
  @internal
  */
  atBlank() {
    return /(^|\n)$/.test(this.out);
  }
  /**
  Ensure the current content ends with a newline.
  */
  ensureNewLine() {
    this.atBlank() || (this.out += `
`);
  }
  /**
  Prepare the state for writing output (closing closed paragraphs,
  adding delimiters, and so on), and then optionally add content
  (unescaped) to the output.
  */
  write(e) {
    this.flushClose(), this.delim && this.atBlank() && (this.out += this.delim), e && (this.out += e);
  }
  /**
  Close the block for the given node.
  */
  closeBlock(e) {
    this.closed = e;
  }
  /**
  Add the given text to the document. When escape is not `false`,
  it will be escaped.
  */
  text(e, n = !0) {
    let r = e.split(`
`);
    for (let i = 0; i < r.length; i++)
      this.write(), !n && r[i][0] == "[" && /(^|[^\\])\!$/.test(this.out) && (this.out = this.out.slice(0, this.out.length - 1) + "\\!"), this.out += n ? this.esc(r[i], this.atBlockStart) : r[i], i != r.length - 1 && (this.out += `
`);
  }
  /**
  Render the given node as a block.
  */
  render(e, n, r) {
    if (this.nodes[e.type.name])
      this.nodes[e.type.name](this, e, n, r);
    else {
      if (this.options.strict !== !1)
        throw new Error("Token type `" + e.type.name + "` not supported by Markdown renderer");
      e.type.isLeaf || (e.type.inlineContent ? this.renderInline(e) : this.renderContent(e), e.isBlock && this.closeBlock(e));
    }
  }
  /**
  Render the contents of `parent` as block nodes.
  */
  renderContent(e) {
    e.forEach((n, r, i) => this.render(n, e, i));
  }
  /**
  Render the contents of `parent` as inline content.
  */
  renderInline(e, n = !0) {
    this.atBlockStart = n;
    let r = [], i = "", u = (o, s, l) => {
      let c = o ? o.marks : [];
      o && o.type.name === this.options.hardBreakNodeName && (c = c.filter((A) => {
        if (l + 1 == e.childCount)
          return !1;
        let m = e.child(l + 1);
        return A.isInSet(m.marks) && (!m.isText || /\S/.test(m.text));
      }));
      let a = c.length ? c[c.length - 1] : null, f = a && this.getMark(a.type.name).escape === !1, p = c.length - (f ? 1 : 0);
      e: for (let A = 0; A < p; A++) {
        let m = c[A];
        if (!this.getMark(m.type.name).mixable)
          break;
        for (let g = 0; g < r.length; g++) {
          let x = r[g];
          if (!this.getMark(x.type.name).mixable)
            break;
          if (m.eq(x)) {
            A > g ? c = c.slice(0, g).concat(m).concat(c.slice(g, A)).concat(c.slice(A + 1, p)) : g > A && (c = c.slice(0, A).concat(c.slice(A + 1, g)).concat(m).concat(c.slice(g, p)));
            continue e;
          }
        }
      }
      let d = 0;
      for (; d < Math.min(r.length, p) && c[d].eq(r[d]); )
        ++d;
      let h = i;
      if (i = "", o && o.isText && c.some((A) => {
        let m = this.getMark(A.type.name);
        return m && m.expelEnclosingWhitespace && !r.some((g, x) => x < d && g.eq(A));
      })) {
        let [A, m, g] = /^(\s*)(.*)$/m.exec(o.text);
        m && (h += m, o = g ? o.withText(g) : null, o || (c = r));
      }
      if (o && o.isText && c.some((A) => {
        let m = this.getMark(A.type.name);
        return m && m.expelEnclosingWhitespace && !this.isMarkAhead(e, l + 1, A);
      })) {
        let [A, m, g] = /^(.*?)(\s*)$/m.exec(o.text);
        g && (i = g, o = m ? o.withText(m) : null, o || (c = r));
      }
      if (o || l == e.childCount)
        for (; d < r.length; )
          this.text(this.markString(r.pop(), !1, e, l), !1);
      if (h && this.text(h), o) {
        for (; r.length < p; ) {
          let A = c[r.length];
          r.push(A), this.text(this.markString(A, !0, e, l), !1), this.atBlockStart = !1;
        }
        f && o.isText ? this.text(this.markString(a, !0, e, l) + o.text + this.markString(a, !1, e, l + 1), !1) : this.render(o, e, l), this.atBlockStart = !1, o.isText && o.nodeSize > 0 && (this.atBlockStart = !1);
      }
    };
    e.forEach(u), u(null, 0, e.childCount), this.atBlockStart = !1;
  }
  /**
  Render a node's content as a list. `delim` should be the extra
  indentation added to all lines except the first in an item,
  `firstDelim` is a function going from an item index to a
  delimiter for the first line of the item.
  */
  renderList(e, n, r) {
    this.closed && this.closed.type == e.type ? this.flushClose(3) : this.inTightList && this.flushClose(1);
    let i = typeof e.attrs.tight < "u" ? e.attrs.tight : this.options.tightLists, u = this.inTightList;
    this.inTightList = i, e.forEach((o, s, l) => {
      l && i && this.flushClose(1), this.wrapBlock(n, r(l), e, () => this.render(o, e, l));
    }), this.inTightList = u;
  }
  /**
  Escape the given string so that it can safely appear in Markdown
  content. If `startOfLine` is true, also escape characters that
  have special meaning only at the start of the line.
  */
  esc(e, n = !1) {
    return e = e.replace(/[`*\\~\[\]_]/g, (r, i) => r == "_" && i > 0 && i + 1 < e.length && e[i - 1].match(/\w/) && e[i + 1].match(/\w/) ? r : "\\" + r), n && (e = e.replace(/^(\+[ ]|[\-*>])/, "\\$&").replace(/^(\s*)(#{1,6})(\s|$)/, "$1\\$2$3").replace(/^(\s*\d+)\.\s/, "$1\\. ")), this.options.escapeExtraCharacters && (e = e.replace(this.options.escapeExtraCharacters, "\\$&")), e;
  }
  /**
  @internal
  */
  quote(e) {
    let n = e.indexOf('"') == -1 ? '""' : e.indexOf("'") == -1 ? "''" : "()";
    return n[0] + e + n[1];
  }
  /**
  Repeat the given string `n` times.
  */
  repeat(e, n) {
    let r = "";
    for (let i = 0; i < n; i++)
      r += e;
    return r;
  }
  /**
  Get the markdown string for a given opening or closing mark.
  */
  markString(e, n, r, i) {
    let u = this.getMark(e.type.name), o = n ? u.open : u.close;
    return typeof o == "string" ? o : o(this, e, r, i);
  }
  /**
  Get leading and trailing whitespace from a string. Values of
  leading or trailing property of the return object will be undefined
  if there is no match.
  */
  getEnclosingWhitespace(e) {
    return {
      leading: (e.match(/^(\s+)/) || [void 0])[0],
      trailing: (e.match(/(\s+)$/) || [void 0])[0]
    };
  }
  /**
  @internal
  */
  isMarkAhead(e, n, r) {
    for (; ; n++) {
      if (n >= e.childCount)
        return !1;
      let i = e.child(n);
      if (i.type.name != this.options.hardBreakNodeName)
        return r.isInSet(i.marks);
      n++;
    }
  }
}
const Z = new ri({
  nodes: Kf(Eu.spec.nodes, "paragraph block*", "block"),
  marks: Eu.spec.marks
}), b1 = new Ql(
  Z,
  Yd("commonmark", { html: !1 }),
  p1.tokens
), k1 = new Kl(
  ao.nodes,
  ao.marks
), x1 = Et.fromSchema(Z), C1 = mt.fromSchema(Z);
function ho(t, e) {
  const n = document.createElement("div");
  if (e === "markdown")
    return b1.parse(String(t ?? ""));
  const r = String(t ?? "");
  if (/<[a-z!][\s\S]*>/i.test(r))
    n.innerHTML = r;
  else {
    const i = r.split(/\n{2,}/);
    n.innerHTML = i.map((u) => `<p>${u.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`).join("") || "<p></p>";
  }
  return x1.parse(n);
}
function y1(t, e) {
  const n = document.createElement("div");
  n.append(C1.serializeFragment(t.content));
  const r = n.innerHTML;
  return e === "markdown" ? k1.serialize(t).trim() : r;
}
const po = [
  { icon: "format_bold", title: "Bold (Ctrl+B)", run: (t) => Zt(Z.marks.strong)(t), active: (t) => t.selection.$from.marks().some((e) => e.type === Z.marks.strong) },
  { icon: "format_italic", title: "Italic (Ctrl+I)", run: (t) => Zt(Z.marks.em)(t), active: (t) => t.selection.$from.marks().some((e) => e.type === Z.marks.em) },
  { icon: "code", title: "Code", run: (t) => Zt(Z.marks.code)(t), active: (t) => t.selection.$from.marks().some((e) => e.type === Z.marks.code) },
  { sep: !0 },
  { icon: "format_list_bulleted", title: "Bullet list", run: (t) => Fu(Z.nodes.bullet_list)(t) },
  { icon: "format_list_numbered", title: "Numbered list", run: (t) => Fu(Z.nodes.ordered_list)(t) },
  { icon: "format_quote", title: "Quote", run: (t) => l0(Z.nodes.blockquote)(t) },
  { sep: !0 },
  { icon: "undo", title: "Undo (Ctrl+Z)", run: (t) => ki(t.state, t.dispatch) },
  { icon: "redo", title: "Redo (Ctrl+Y)", run: (t) => Jn(t.state, t.dispatch) }
], D1 = `
rich-text-editor { display: block; }
rich-text-editor .rte-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border: 1px solid var(--color-outline-variant);
  border-bottom: none;
  border-radius: var(--radius) var(--radius) 0 0;
  background-color: var(--color-surface-container-low);
  overflow: hidden;
}
rich-text-editor .rte-sep {
  width: 1px;
  height: 16px;
  background-color: var(--color-outline-variant);
  margin: 0 4px;
}
rich-text-editor .rte-btn {
  background: none;
  border: none;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  border-radius: 4px;
}
rich-text-editor .rte-btn:hover {
  color: var(--color-primary);
  background-color: var(--color-surface-variant);
}
rich-text-editor .rte-btn.active {
  color: var(--color-primary);
  background-color: rgba(37, 99, 235, 0.18);
}
rich-text-editor .rte-btn .material-symbols-outlined {
  font-size: 16px;
}
rich-text-editor .rte-view {
  border: 1px solid var(--color-outline-variant);
  border-radius: 0 0 var(--radius) var(--radius);
  background-color: var(--color-background);
  min-height: 96px;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.55;
}
rich-text-editor .rte-view:focus-within {
  border-color: var(--color-primary);
}
rich-text-editor .ProseMirror {
  outline: none;
  min-height: 76px;
}
rich-text-editor .ProseMirror p {
  margin: 0 0 6px;
}
rich-text-editor .ProseMirror p:last-child {
  margin-bottom: 0;
}
rich-text-editor .ProseMirror ul,
rich-text-editor .ProseMirror ol {
  padding-left: 20px;
  margin: 0 0 6px;
}
rich-text-editor .ProseMirror blockquote {
  border-left: 2px solid var(--color-outline-variant);
  margin: 0 0 6px;
  padding-left: 10px;
  color: var(--color-on-surface-variant);
}
rich-text-editor .ProseMirror code {
  font-family: var(--font-label);
  font-size: 11px;
  background-color: var(--color-surface-variant);
  border-radius: 4px;
  padding: 1px 4px;
}
rich-text-editor .ProseMirror a {
  color: var(--color-primary);
}
rich-text-editor .ProseMirror-focused {
  outline: none;
}
`;
let Ao = !1;
function E1() {
  if (Ao) return;
  Ao = !0;
  const t = document.createElement("style");
  t.textContent = D1, document.head.append(t);
}
class F1 extends HTMLElement {
  connectedCallback() {
    if (this._built) return;
    this._built = !0, E1();
    const e = document.createElement("div");
    e.className = "rte-toolbar";
    for (const r of po) {
      if (r.sep) {
        e.append(Object.assign(document.createElement("span"), { className: "rte-sep" }));
        continue;
      }
      const i = document.createElement("button");
      i.type = "button", i.className = "rte-btn", i.title = r.title, i.append(Object.assign(document.createElement("span"), {
        className: "material-symbols-outlined",
        textContent: r.icon
      })), i.addEventListener("mousedown", (u) => u.preventDefault()), i.addEventListener("click", () => {
        r.run(this._view), this._view.focus(), this._syncToolbar();
      }), e.append(i);
    }
    const n = document.createElement("div");
    n.className = "rte-view", this.append(e, n), this._format = this.getAttribute("format") === "markdown" ? "markdown" : "html", this._view = new Rs(n, {
      state: it.create({
        doc: ho(this.getAttribute("value") ?? "", this._format),
        plugins: [
          x0(),
          Bu({
            "Mod-z": ki,
            "Mod-y": Jn,
            "Shift-Mod-z": Jn,
            "Mod-b": Zt(Z.marks.strong),
            "Mod-i": Zt(Z.marks.em),
            Enter: Jf(Z.nodes.list_item),
            "Mod-[": Gf(Z.nodes.list_item),
            "Mod-]": Yf(Z.nodes.list_item),
            "Mod-Enter": jn(Xr, (r, i) => Xr(r, i))
          }),
          Bu(f0)
        ]
      }),
      dispatchTransaction: (r) => {
        const i = this._view;
        i.updateState(i.state.apply(r)), r.docChanged && this._emit(), this._syncToolbar();
      }
    }), this._syncToolbar();
  }
  disconnectedCallback() {
    this._view && (this._view.destroy(), this._view = null);
  }
  _syncToolbar() {
    if (!this._view) return;
    const e = this._view.state;
    for (const n of this.querySelectorAll(".rte-btn")) {
      const r = po[[...n.parentElement.children].indexOf(n)];
      r != null && r.active && n.classList.toggle("active", r.active(e));
    }
  }
  _emit() {
    this.dispatchEvent(new Event("input", { bubbles: !0 }));
  }
  get format() {
    return this._format ?? "html";
  }
  get value() {
    return this._view ? y1(this._view.state.doc, this._format) : this.getAttribute("value") ?? "";
  }
  set value(e) {
    if (!this._view) {
      this.setAttribute("value", e ?? "");
      return;
    }
    if (e === this.value || this._view.hasFocus()) return;
    const n = it.create({
      doc: ho(e, this._format),
      plugins: this._view.state.plugins
    });
    this._view.updateState(n);
  }
}
customElements.define("rich-text-editor", F1);
