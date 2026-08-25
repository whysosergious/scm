function R(r) {
  this.content = r;
}
R.prototype = {
  constructor: R,
  find: function(r) {
    for (var e = 0; e < this.content.length; e += 2)
      if (this.content[e] === r) return e;
    return -1;
  },
  // :: (string) → ?any
  // Retrieve the value stored under `key`, or return undefined when
  // no such key exists.
  get: function(r) {
    var e = this.find(r);
    return e == -1 ? void 0 : this.content[e + 1];
  },
  // :: (string, any, ?string) → OrderedMap
  // Create a new map by replacing the value of `key` with a new
  // value, or adding a binding to the end of the map. If `newKey` is
  // given, the key of the binding will be replaced with that key.
  update: function(r, e, t) {
    var n = t && t != r ? this.remove(t) : this, i = n.find(r), s = n.content.slice();
    return i == -1 ? s.push(t || r, e) : (s[i + 1] = e, t && (s[i] = t)), new R(s);
  },
  // :: (string) → OrderedMap
  // Return a map with the given key removed, if it existed.
  remove: function(r) {
    var e = this.find(r);
    if (e == -1) return this;
    var t = this.content.slice();
    return t.splice(e, 2), new R(t);
  },
  // :: (string, any) → OrderedMap
  // Add a new key to the start of the map.
  addToStart: function(r, e) {
    return new R([r, e].concat(this.remove(r).content));
  },
  // :: (string, any) → OrderedMap
  // Add a new key to the end of the map.
  addToEnd: function(r, e) {
    var t = this.remove(r).content.slice();
    return t.push(r, e), new R(t);
  },
  // :: (string, string, any) → OrderedMap
  // Add a key after the given key. If `place` is not found, the new
  // key is added to the end.
  addBefore: function(r, e, t) {
    var n = this.remove(e), i = n.content.slice(), s = n.find(r);
    return i.splice(s == -1 ? i.length : s, 0, e, t), new R(i);
  },
  // :: ((key: string, value: any))
  // Call the given function for each key/value pair in the map, in
  // order.
  forEach: function(r) {
    for (var e = 0; e < this.content.length; e += 2)
      r(this.content[e], this.content[e + 1]);
  },
  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a new map by prepending the keys in this map that don't
  // appear in `map` before the keys in `map`.
  prepend: function(r) {
    return r = R.from(r), r.size ? new R(r.content.concat(this.subtract(r).content)) : this;
  },
  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a new map by appending the keys in this map that don't
  // appear in `map` after the keys in `map`.
  append: function(r) {
    return r = R.from(r), r.size ? new R(this.subtract(r).content.concat(r.content)) : this;
  },
  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a map containing all the keys in this map that don't
  // appear in `map`.
  subtract: function(r) {
    var e = this;
    r = R.from(r);
    for (var t = 0; t < r.content.length; t += 2)
      e = e.remove(r.content[t]);
    return e;
  },
  // :: () → Object
  // Turn ordered map into a plain object.
  toObject: function() {
    var r = {};
    return this.forEach(function(e, t) {
      r[e] = t;
    }), r;
  },
  // :: number
  // The amount of keys in this map.
  get size() {
    return this.content.length >> 1;
  }
};
R.from = function(r) {
  if (r instanceof R) return r;
  var e = [];
  if (r) for (var t in r) e.push(t, r[t]);
  return new R(e);
};
function $r(r, e, t) {
  for (let n = 0; ; n++) {
    if (n == r.childCount || n == e.childCount)
      return r.childCount == e.childCount ? null : t;
    let i = r.child(n), s = e.child(n);
    if (i == s) {
      t += i.nodeSize;
      continue;
    }
    if (!i.sameMarkup(s))
      return t;
    if (i.isText && i.text != s.text) {
      let o = i.text, l = s.text, a = 0;
      for (; o[a] == l[a]; a++)
        t++;
      return a && a < o.length && a < l.length && _r(o.charCodeAt(a - 1)) && Hr(o.charCodeAt(a)) && t--, t;
    }
    if (i.content.size || s.content.size) {
      let o = $r(i.content, s.content, t + 1);
      if (o != null)
        return o;
    }
    t += i.nodeSize;
  }
}
function Kr(r, e, t, n) {
  for (let i = r.childCount, s = e.childCount; ; ) {
    if (i == 0 || s == 0)
      return i == s ? null : { a: t, b: n };
    let o = r.child(--i), l = e.child(--s), a = o.nodeSize;
    if (o == l) {
      t -= a, n -= a;
      continue;
    }
    if (!o.sameMarkup(l))
      return { a: t, b: n };
    if (o.isText && o.text != l.text) {
      let c = o.text, f = l.text, h = c.length, d = f.length;
      for (; h > 0 && d > 0 && c[h - 1] == f[d - 1]; )
        h--, d--, t--, n--;
      return h && d && h < c.length && _r(c.charCodeAt(h - 1)) && Hr(c.charCodeAt(h)) && (t++, n++), { a: t, b: n };
    }
    if (o.content.size || l.content.size) {
      let c = Kr(o.content, l.content, t - 1, n - 1);
      if (c)
        return c;
    }
    t -= a, n -= a;
  }
}
function Hr(r) {
  return r >= 56320 && r < 57344;
}
function _r(r) {
  return r >= 55296 && r < 56320;
}
class y {
  /**
  @internal
  */
  constructor(e, t) {
    if (this.content = e, this.size = t || 0, t == null)
      for (let n = 0; n < e.length; n++)
        this.size += e[n].nodeSize;
  }
  /**
  Invoke a callback for all descendant nodes between the given two
  positions (relative to start of this fragment). Doesn't descend
  into a node when the callback returns `false`.
  */
  nodesBetween(e, t, n, i = 0, s) {
    for (let o = 0, l = 0; l < t; o++) {
      let a = this.content[o], c = l + a.nodeSize;
      if (c > e && n(a, i + l, s || null, o) !== !1 && a.content.size) {
        let f = l + 1;
        a.nodesBetween(Math.max(0, e - f), Math.min(a.content.size, t - f), n, i + f);
      }
      l = c;
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
  textBetween(e, t, n, i) {
    let s = "", o = !0;
    return this.nodesBetween(e, t, (l, a) => {
      let c = l.isText ? l.text.slice(Math.max(e, a) - a, t - a) : l.isLeaf ? i ? typeof i == "function" ? i(l) : i : l.type.spec.leafText ? l.type.spec.leafText(l) : "" : "";
      l.isBlock && (l.isLeaf && c || l.isTextblock) && n && (o ? o = !1 : s += n), s += c;
    }, 0), s;
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
    let t = this.lastChild, n = e.firstChild, i = this.content.slice(), s = 0;
    for (t.isText && t.sameMarkup(n) && (i[i.length - 1] = t.withText(t.text + n.text), s = 1); s < e.content.length; s++)
      i.push(e.content[s]);
    return new y(i, this.size + e.size);
  }
  /**
  Cut out the sub-fragment between the two given positions.
  */
  cut(e, t = this.size) {
    if (e == 0 && t == this.size)
      return this;
    let n = [], i = 0;
    if (t > e)
      for (let s = 0, o = 0; o < t; s++) {
        let l = this.content[s], a = o + l.nodeSize;
        a > e && ((o < e || a > t) && (l.isText ? l = l.cut(Math.max(0, e - o), Math.min(l.text.length, t - o)) : l = l.cut(Math.max(0, e - o - 1), Math.min(l.content.size, t - o - 1))), n.push(l), i += l.nodeSize), o = a;
      }
    return new y(n, i);
  }
  /**
  @internal
  */
  cutByIndex(e, t) {
    return e == t ? y.empty : e == 0 && t == this.content.length ? this : new y(this.content.slice(e, t));
  }
  /**
  Create a new fragment in which the node at the given index is
  replaced by the given node.
  */
  replaceChild(e, t) {
    let n = this.content[e];
    if (n == t)
      return this;
    let i = this.content.slice(), s = this.size + t.nodeSize - n.nodeSize;
    return i[e] = t, new y(i, s);
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
    for (let t = 0; t < this.content.length; t++)
      if (!this.content[t].eq(e.content[t]))
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
    let t = this.content[e];
    if (!t)
      throw new RangeError("Index " + e + " out of range for " + this);
    return t;
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
    for (let t = 0, n = 0; t < this.content.length; t++) {
      let i = this.content[t];
      e(i, n, t), n += i.nodeSize;
    }
  }
  /**
  Find the first position at which this fragment and another
  fragment differ, or `null` if they are the same.
  */
  findDiffStart(e, t = 0) {
    return $r(this, e, t);
  }
  /**
  Find the first position, searching from the end, at which this
  fragment and the given fragment differ, or `null` if they are
  the same. Since this position will not be the same in both
  nodes, an object with two separate positions is returned.
  */
  findDiffEnd(e, t = this.size, n = e.size) {
    return Kr(this, e, t, n);
  }
  /**
  Find the index and inner offset corresponding to a given relative
  position in this fragment. The result object will be reused
  (overwritten) the next time the function is called. @internal
  */
  findIndex(e) {
    if (e == 0)
      return bt(0, e);
    if (e == this.size)
      return bt(this.content.length, e);
    if (e > this.size || e < 0)
      throw new RangeError(`Position ${e} outside of fragment (${this})`);
    for (let t = 0, n = 0; ; t++) {
      let i = this.child(t), s = n + i.nodeSize;
      if (s >= e)
        return s == e ? bt(t + 1, s) : bt(t, n);
      n = s;
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
  static fromJSON(e, t) {
    if (!t)
      return y.empty;
    if (!Array.isArray(t))
      throw new RangeError("Invalid input for Fragment.fromJSON");
    return y.fromArray(t.map(e.nodeFromJSON));
  }
  /**
  Build a fragment from an array of nodes. Ensures that adjacent
  text nodes with the same marks are joined together.
  */
  static fromArray(e) {
    if (!e.length)
      return y.empty;
    let t, n = 0;
    for (let i = 0; i < e.length; i++) {
      let s = e[i];
      n += s.nodeSize, i && s.isText && e[i - 1].sameMarkup(s) ? (t || (t = e.slice(0, i)), t[t.length - 1] = s.withText(t[t.length - 1].text + s.text)) : t && t.push(s);
    }
    return new y(t || e, n);
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
const $t = { index: 0, offset: 0 };
function bt(r, e) {
  return $t.index = r, $t.offset = e, $t;
}
function Nt(r, e) {
  if (r === e)
    return !0;
  if (!(r && typeof r == "object") || !(e && typeof e == "object"))
    return !1;
  let t = Array.isArray(r);
  if (Array.isArray(e) != t)
    return !1;
  if (t) {
    if (r.length != e.length)
      return !1;
    for (let n = 0; n < r.length; n++)
      if (!Nt(r[n], e[n]))
        return !1;
  } else {
    for (let n in r)
      if (!(n in e) || !Nt(r[n], e[n]))
        return !1;
    for (let n in e)
      if (!(n in r))
        return !1;
  }
  return !0;
}
class M {
  /**
  @internal
  */
  constructor(e, t) {
    this.type = e, this.attrs = t;
  }
  /**
  Given a set of marks, create a new set which contains this one as
  well, in the right position. If this mark is already in the set,
  the set itself is returned. If any marks that are set to be
  [exclusive](https://prosemirror.net/docs/ref/#model.MarkSpec.excludes) with this mark are present,
  those are replaced by this one.
  */
  addToSet(e) {
    let t, n = !1;
    for (let i = 0; i < e.length; i++) {
      let s = e[i];
      if (this.eq(s))
        return e;
      if (this.type.excludes(s.type))
        t || (t = e.slice(0, i));
      else {
        if (s.type.excludes(this.type))
          return e;
        !n && s.type.rank > this.type.rank && (t || (t = e.slice(0, i)), t.push(this), n = !0), t && t.push(s);
      }
    }
    return t || (t = e.slice()), n || t.push(this), t;
  }
  /**
  Remove this mark from the given set, returning a new set. If this
  mark is not in the set, the set itself is returned.
  */
  removeFromSet(e) {
    for (let t = 0; t < e.length; t++)
      if (this.eq(e[t]))
        return e.slice(0, t).concat(e.slice(t + 1));
    return e;
  }
  /**
  Test whether this mark is in the given set of marks.
  */
  isInSet(e) {
    for (let t = 0; t < e.length; t++)
      if (this.eq(e[t]))
        return !0;
    return !1;
  }
  /**
  Test whether this mark has the same type and attributes as
  another mark.
  */
  eq(e) {
    return this == e || this.type == e.type && Nt(this.attrs, e.attrs);
  }
  /**
  Convert this mark to a JSON-serializeable representation.
  */
  toJSON() {
    let e = { type: this.type.name };
    for (let t in this.attrs) {
      e.attrs = this.attrs;
      break;
    }
    return e;
  }
  /**
  Deserialize a mark from JSON.
  */
  static fromJSON(e, t) {
    if (!t)
      throw new RangeError("Invalid input for Mark.fromJSON");
    let n = e.marks[t.type];
    if (!n)
      throw new RangeError(`There is no mark type ${t.type} in this schema`);
    let i = n.create(t.attrs);
    return n.checkAttrs(i.attrs), i;
  }
  /**
  Test whether two sets of marks are identical.
  */
  static sameSet(e, t) {
    if (e == t)
      return !0;
    if (e.length != t.length)
      return !1;
    for (let n = 0; n < e.length; n++)
      if (!e[n].eq(t[n]))
        return !1;
    return !0;
  }
  /**
  Create a properly sorted mark set from null, a single mark, or an
  unsorted array of marks.
  */
  static setFrom(e) {
    if (!e || Array.isArray(e) && e.length == 0)
      return M.none;
    if (e instanceof M)
      return [e];
    let t = e.slice();
    return t.sort((n, i) => n.type.rank - i.type.rank), t;
  }
}
M.none = [];
class it extends Error {
}
class b {
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
  constructor(e, t, n) {
    this.content = e, this.openStart = t, this.openEnd = n;
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
  insertAt(e, t) {
    let n = jr(this.content, e + this.openStart, t, this.openStart + 1, this.openEnd + 1);
    return n && new b(n, this.openStart, this.openEnd);
  }
  /**
  @internal
  */
  removeBetween(e, t) {
    return new b(Ur(this.content, e + this.openStart, t + this.openStart), this.openStart, this.openEnd);
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
  static fromJSON(e, t) {
    if (!t)
      return b.empty;
    let n = t.openStart || 0, i = t.openEnd || 0;
    if (typeof n != "number" || typeof i != "number")
      throw new RangeError("Invalid input for Slice.fromJSON");
    return new b(y.fromJSON(e, t.content), n, i);
  }
  /**
  Create a slice from a fragment by taking the maximum possible
  open value on both side of the fragment.
  */
  static maxOpen(e, t = !0) {
    let n = 0, i = 0;
    for (let s = e.firstChild; s && !s.isLeaf && (t || !s.type.spec.isolating); s = s.firstChild)
      n++;
    for (let s = e.lastChild; s && !s.isLeaf && (t || !s.type.spec.isolating); s = s.lastChild)
      i++;
    return new b(e, n, i);
  }
}
b.empty = new b(y.empty, 0, 0);
function Ur(r, e, t) {
  let { index: n, offset: i } = r.findIndex(e), s = r.maybeChild(n), { index: o, offset: l } = r.findIndex(t);
  if (i == e || s.isText) {
    if (l != t && !r.child(o).isText)
      throw new RangeError("Removing non-flat range");
    return r.cut(0, e).append(r.cut(t));
  }
  if (n != o)
    throw new RangeError("Removing non-flat range");
  return r.replaceChild(n, s.copy(Ur(s.content, e - i - 1, t - i - 1)));
}
function jr(r, e, t, n, i, s) {
  let { index: o, offset: l } = r.findIndex(e), a = r.maybeChild(o);
  if (l == e || a.isText)
    return s && n <= 0 && i <= 0 && !s.canReplace(o, o, t) ? null : r.cut(0, e).append(t).append(r.cut(e));
  let c = jr(a.content, e - l - 1, t, o == 0 ? n - 1 : 0, o == r.childCount - 1 ? i - 1 : 0, a);
  return c && r.replaceChild(o, a.copy(c));
}
function bs(r, e, t) {
  if (t.openStart > r.depth)
    throw new it("Inserted content deeper than insertion position");
  if (r.depth - t.openStart != e.depth - t.openEnd)
    throw new it("Inconsistent open depths");
  return Gr(r, e, t, 0);
}
function Gr(r, e, t, n) {
  let i = r.index(n), s = r.node(n);
  if (i == e.index(n) && n < r.depth - t.openStart) {
    let o = Gr(r, e, t, n + 1);
    return s.copy(s.content.replaceChild(i, o));
  } else if (t.content.size)
    if (!t.openStart && !t.openEnd && r.depth == n && e.depth == n) {
      let o = r.parent, l = o.content;
      return Te(o, l.cut(0, r.parentOffset).append(t.content).append(l.cut(e.parentOffset)));
    } else {
      let { start: o, end: l } = xs(t, r);
      return Te(s, Xr(r, o, l, e, n));
    }
  else return Te(s, wt(r, e, n));
}
function Yr(r, e) {
  if (!e.type.compatibleContent(r.type))
    throw new it("Cannot join " + e.type.name + " onto " + r.type.name);
}
function ln(r, e, t) {
  let n = r.node(t);
  return Yr(n, e.node(t)), n;
}
function De(r, e) {
  let t = e.length - 1;
  t >= 0 && r.isText && r.sameMarkup(e[t]) ? e[t] = r.withText(e[t].text + r.text) : e.push(r);
}
function Qe(r, e, t, n) {
  let i = (e || r).node(t), s = 0, o = e ? e.index(t) : i.childCount;
  r && (s = r.index(t), r.depth > t ? s++ : r.textOffset && (De(r.nodeAfter, n), s++));
  for (let l = s; l < o; l++)
    De(i.child(l), n);
  e && e.depth == t && e.textOffset && De(e.nodeBefore, n);
}
function Te(r, e) {
  if (!r.type.validContent(e))
    throw new it("Invalid content for node " + r.type.name);
  return r.copy(e);
}
function Xr(r, e, t, n, i) {
  let s = r.depth > i && ln(r, e, i + 1), o = n.depth > i && ln(t, n, i + 1), l = [];
  return Qe(null, r, i, l), s && o && e.index(i) == t.index(i) ? (Yr(s, o), De(Te(s, Xr(r, e, t, n, i + 1)), l)) : (s && De(Te(s, wt(r, e, i + 1)), l), Qe(e, t, i, l), o && De(Te(o, wt(t, n, i + 1)), l)), Qe(n, null, i, l), new y(l);
}
function wt(r, e, t) {
  let n = [];
  if (Qe(null, r, t, n), r.depth > t) {
    let i = ln(r, e, t + 1);
    De(Te(i, wt(r, e, t + 1)), n);
  }
  return Qe(e, null, t, n), new y(n);
}
function xs(r, e) {
  let t = e.depth - r.openStart, i = e.node(t).copy(r.content);
  for (let s = t - 1; s >= 0; s--)
    i = e.node(s).copy(y.from(i));
  return {
    start: i.resolveNoCache(r.openStart + t),
    end: i.resolveNoCache(i.content.size - r.openEnd - t)
  };
}
class st {
  /**
  @internal
  */
  constructor(e, t, n) {
    this.pos = e, this.path = t, this.parentOffset = n, this.depth = t.length / 3 - 1;
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
    let e = this.parent, t = this.index(this.depth);
    if (t == e.childCount)
      return null;
    let n = this.pos - this.path[this.path.length - 1], i = e.child(t);
    return n ? e.child(t).cut(n) : i;
  }
  /**
  Get the node directly before the position, if any. If the
  position points into a text node, only the part of that node
  before the position is returned.
  */
  get nodeBefore() {
    let e = this.index(this.depth), t = this.pos - this.path[this.path.length - 1];
    return t ? this.parent.child(e).cut(0, t) : e == 0 ? null : this.parent.child(e - 1);
  }
  /**
  Get the position at the given index in the parent node at the
  given depth (which defaults to `this.depth`).
  */
  posAtIndex(e, t) {
    t = this.resolveDepth(t);
    let n = this.path[t * 3], i = t == 0 ? 0 : this.path[t * 3 - 1] + 1;
    for (let s = 0; s < e; s++)
      i += n.child(s).nodeSize;
    return i;
  }
  /**
  Get the marks at this position, factoring in the surrounding
  marks' [`inclusive`](https://prosemirror.net/docs/ref/#model.MarkSpec.inclusive) property. If the
  position is at the start of a non-empty node, the marks of the
  node after it (if any) are returned.
  */
  marks() {
    let e = this.parent, t = this.index();
    if (e.content.size == 0)
      return M.none;
    if (this.textOffset)
      return e.child(t).marks;
    let n = e.maybeChild(t - 1), i = e.maybeChild(t);
    if (!n) {
      let l = n;
      n = i, i = l;
    }
    let s = n.marks;
    for (var o = 0; o < s.length; o++)
      s[o].type.spec.inclusive === !1 && (!i || !s[o].isInSet(i.marks)) && (s = s[o--].removeFromSet(s));
    return s;
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
    let t = this.parent.maybeChild(this.index());
    if (!t || !t.isInline)
      return null;
    let n = t.marks, i = e.parent.maybeChild(e.index());
    for (var s = 0; s < n.length; s++)
      n[s].type.spec.inclusive === !1 && (!i || !n[s].isInSet(i.marks)) && (n = n[s--].removeFromSet(n));
    return n;
  }
  /**
  The depth up to which this position and the given (non-resolved)
  position share the same parent nodes.
  */
  sharedDepth(e) {
    for (let t = this.depth; t > 0; t--)
      if (this.start(t) <= e && this.end(t) >= e)
        return t;
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
  blockRange(e = this, t) {
    if (e.pos < this.pos)
      return e.blockRange(this);
    for (let n = this.depth - (this.parent.inlineContent || this.pos == e.pos ? 1 : 0); n >= 0; n--)
      if (e.pos <= this.end(n) && (!t || t(this.node(n))))
        return new Dt(this, e, n);
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
    for (let t = 1; t <= this.depth; t++)
      e += (e ? "/" : "") + this.node(t).type.name + "_" + this.index(t - 1);
    return e + ":" + this.parentOffset;
  }
  /**
  @internal
  */
  static resolve(e, t) {
    if (!(t >= 0 && t <= e.content.size))
      throw new RangeError("Position " + t + " out of range");
    let n = [], i = 0, s = t;
    for (let o = e; ; ) {
      let { index: l, offset: a } = o.content.findIndex(s), c = s - a;
      if (n.push(o, l, i + a), !c || (o = o.child(l), o.isText))
        break;
      s = c - 1, i += a + 1;
    }
    return new st(t, n, s);
  }
  /**
  @internal
  */
  static resolveCached(e, t) {
    let n = Ln.get(e);
    if (n)
      for (let s = 0; s < n.elts.length; s++) {
        let o = n.elts[s];
        if (o.pos == t)
          return o;
      }
    else
      Ln.set(e, n = new ks());
    let i = n.elts[n.i] = st.resolve(e, t);
    return n.i = (n.i + 1) % Ss, i;
  }
}
class ks {
  constructor() {
    this.elts = [], this.i = 0;
  }
}
const Ss = 12, Ln = /* @__PURE__ */ new WeakMap();
class Dt {
  /**
  Construct a node range. `$from` and `$to` should point into the
  same node until at least the given `depth`, since a node range
  denotes an adjacent set of nodes in a single parent node.
  */
  constructor(e, t, n) {
    this.$from = e, this.$to = t, this.depth = n;
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
const Cs = /* @__PURE__ */ Object.create(null);
class ne {
  /**
  @internal
  */
  constructor(e, t, n, i = M.none) {
    this.type = e, this.attrs = t, this.marks = i, this.content = n || y.empty;
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
  nodesBetween(e, t, n, i = 0) {
    this.content.nodesBetween(e, t, n, i, this);
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
  textBetween(e, t, n, i) {
    return this.content.textBetween(e, t, n, i);
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
  hasMarkup(e, t, n) {
    return this.type == e && Nt(this.attrs, t || e.defaultAttrs || Cs) && M.sameSet(this.marks, n || M.none);
  }
  /**
  Create a new node with the same markup as this node, containing
  the given content (or empty, if no content is given).
  */
  copy(e = null) {
    return e == this.content ? this : new ne(this.type, this.attrs, e, this.marks);
  }
  /**
  Create a copy of this node, with the given set of marks instead
  of the node's own marks.
  */
  mark(e) {
    return e == this.marks ? this : new ne(this.type, this.attrs, this.content, e);
  }
  /**
  Create a copy of this node with only the content between the
  given positions. If `to` is not given, it defaults to the end of
  the node.
  */
  cut(e, t = this.content.size) {
    return e == 0 && t == this.content.size ? this : this.copy(this.content.cut(e, t));
  }
  /**
  Cut out the part of the document between the given positions, and
  return it as a `Slice` object.
  */
  slice(e, t = this.content.size, n = !1) {
    if (e == t)
      return b.empty;
    let i = this.resolve(e), s = this.resolve(t), o = n ? 0 : i.sharedDepth(t), l = i.start(o), c = i.node(o).content.cut(i.pos - l, s.pos - l);
    return new b(c, i.depth - o, s.depth - o);
  }
  /**
  Replace the part of the document between the given positions with
  the given slice. The slice must 'fit', meaning its open sides
  must be able to connect to the surrounding content, and its
  content nodes must be valid children for the node they are placed
  into. If any of this is violated, an error of type
  [`ReplaceError`](https://prosemirror.net/docs/ref/#model.ReplaceError) is thrown.
  */
  replace(e, t, n) {
    return bs(this.resolve(e), this.resolve(t), n);
  }
  /**
  Find the node directly after the given position.
  */
  nodeAt(e) {
    for (let t = this; ; ) {
      let { index: n, offset: i } = t.content.findIndex(e);
      if (t = t.maybeChild(n), !t)
        return null;
      if (i == e || t.isText)
        return t;
      e -= i + 1;
    }
  }
  /**
  Find the (direct) child node after the given offset, if any,
  and return it along with its index and offset relative to this
  node.
  */
  childAfter(e) {
    let { index: t, offset: n } = this.content.findIndex(e);
    return { node: this.content.maybeChild(t), index: t, offset: n };
  }
  /**
  Find the (direct) child node before the given offset, if any,
  and return it along with its index and offset relative to this
  node.
  */
  childBefore(e) {
    if (e == 0)
      return { node: null, index: 0, offset: 0 };
    let { index: t, offset: n } = this.content.findIndex(e);
    if (n < e)
      return { node: this.content.child(t), index: t, offset: n };
    let i = this.content.child(t - 1);
    return { node: i, index: t - 1, offset: n - i.nodeSize };
  }
  /**
  Resolve the given position in the document, returning an
  [object](https://prosemirror.net/docs/ref/#model.ResolvedPos) with information about its context.
  */
  resolve(e) {
    return st.resolveCached(this, e);
  }
  /**
  @internal
  */
  resolveNoCache(e) {
    return st.resolve(this, e);
  }
  /**
  Test whether a given mark or mark type occurs in this document
  between the two given positions.
  */
  rangeHasMark(e, t, n) {
    let i = !1;
    return t > e && this.nodesBetween(e, t, (s) => (n.isInSet(s.marks) && (i = !0), !i)), i;
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
    return this.content.size && (e += "(" + this.content.toStringInner() + ")"), Zr(this.marks, e);
  }
  /**
  Get the content match in this node at the given index.
  */
  contentMatchAt(e) {
    let t = this.type.contentMatch.matchFragment(this.content, 0, e);
    if (!t)
      throw new Error("Called contentMatchAt on a node with invalid content");
    return t;
  }
  /**
  Test whether replacing the range between `from` and `to` (by
  child index) with the given replacement fragment (which defaults
  to the empty fragment) would leave the node's content valid. You
  can optionally pass `start` and `end` indices into the
  replacement fragment.
  */
  canReplace(e, t, n = y.empty, i = 0, s = n.childCount) {
    let o = this.contentMatchAt(e).matchFragment(n, i, s), l = o && o.matchFragment(this.content, t);
    if (!l || !l.validEnd)
      return !1;
    for (let a = i; a < s; a++)
      if (!this.type.allowsMarks(n.child(a).marks))
        return !1;
    return !0;
  }
  /**
  Test whether replacing the range `from` to `to` (by index) with
  a node of the given type would leave the node's content valid.
  */
  canReplaceWith(e, t, n, i) {
    if (i && !this.type.allowsMarks(i))
      return !1;
    let s = this.contentMatchAt(e).matchType(n), o = s && s.matchFragment(this.content, t);
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
    let e = M.none;
    for (let t = 0; t < this.marks.length; t++) {
      let n = this.marks[t];
      n.type.checkAttrs(n.attrs), e = n.addToSet(e);
    }
    if (!M.sameSet(e, this.marks))
      throw new RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map((t) => t.type.name)}`);
    this.content.forEach((t) => t.check());
  }
  /**
  Return a JSON-serializeable representation of this node.
  */
  toJSON() {
    let e = { type: this.type.name };
    for (let t in this.attrs) {
      e.attrs = this.attrs;
      break;
    }
    return this.content.size && (e.content = this.content.toJSON()), this.marks.length && (e.marks = this.marks.map((t) => t.toJSON())), e;
  }
  /**
  Deserialize a node from its JSON representation.
  */
  static fromJSON(e, t) {
    if (!t)
      throw new RangeError("Invalid input for Node.fromJSON");
    let n;
    if (t.marks) {
      if (!Array.isArray(t.marks))
        throw new RangeError("Invalid mark data for Node.fromJSON");
      n = t.marks.map(e.markFromJSON);
    }
    if (t.type == "text") {
      if (typeof t.text != "string")
        throw new RangeError("Invalid text node in JSON");
      return e.text(t.text, n);
    }
    let i = y.fromJSON(e, t.content), s = e.nodeType(t.type).create(t.attrs, i, n);
    return s.type.checkAttrs(s.attrs), s;
  }
}
ne.prototype.text = void 0;
class Tt extends ne {
  /**
  @internal
  */
  constructor(e, t, n, i) {
    if (super(e, t, null, i), !n)
      throw new RangeError("Empty text nodes are not allowed");
    this.text = n;
  }
  toString() {
    return this.type.spec.toDebugString ? this.type.spec.toDebugString(this) : Zr(this.marks, JSON.stringify(this.text));
  }
  get textContent() {
    return this.text;
  }
  textBetween(e, t) {
    return this.text.slice(e, t);
  }
  get nodeSize() {
    return this.text.length;
  }
  mark(e) {
    return e == this.marks ? this : new Tt(this.type, this.attrs, this.text, e);
  }
  withText(e) {
    return e == this.text ? this : new Tt(this.type, this.attrs, e, this.marks);
  }
  cut(e = 0, t = this.text.length) {
    return e == 0 && t == this.text.length ? this : this.withText(this.text.slice(e, t));
  }
  eq(e) {
    return this.sameMarkup(e) && this.text == e.text;
  }
  toJSON() {
    let e = super.toJSON();
    return e.text = this.text, e;
  }
}
function Zr(r, e) {
  for (let t = r.length - 1; t >= 0; t--)
    e = r[t].type.name + "(" + e + ")";
  return e;
}
class Re {
  /**
  @internal
  */
  constructor(e) {
    this.validEnd = e, this.next = [], this.wrapCache = [];
  }
  /**
  @internal
  */
  static parse(e, t) {
    let n = new Ms(e, t);
    if (n.next == null)
      return Re.empty;
    let i = Qr(n);
    n.next && n.err("Unexpected trailing text");
    let s = As(Es(i));
    return Is(s, n), s;
  }
  /**
  Match a node type, returning a match after that node if
  successful.
  */
  matchType(e) {
    for (let t = 0; t < this.next.length; t++)
      if (this.next[t].type == e)
        return this.next[t].next;
    return null;
  }
  /**
  Try to match a fragment. Returns the resulting match when
  successful.
  */
  matchFragment(e, t = 0, n = e.childCount) {
    let i = this;
    for (let s = t; i && s < n; s++)
      i = i.matchType(e.child(s).type);
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
      let { type: t } = this.next[e];
      if (!(t.isText || t.hasRequiredAttrs()))
        return t;
    }
    return null;
  }
  /**
  @internal
  */
  compatible(e) {
    for (let t = 0; t < this.next.length; t++)
      for (let n = 0; n < e.next.length; n++)
        if (this.next[t].type == e.next[n].type)
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
  fillBefore(e, t = !1, n = 0) {
    let i = [this];
    function s(o, l) {
      let a = o.matchFragment(e, n);
      if (a && (!t || a.validEnd))
        return y.from(l.map((c) => c.createAndFill()));
      for (let c = 0; c < o.next.length; c++) {
        let { type: f, next: h } = o.next[c];
        if (!(f.isText || f.hasRequiredAttrs()) && i.indexOf(h) == -1) {
          i.push(h);
          let d = s(h, l.concat(f));
          if (d)
            return d;
        }
      }
      return null;
    }
    return s(this, []);
  }
  /**
  Find a set of wrapping node types that would allow a node of the
  given type to appear at this position. The result may be empty
  (when it fits directly) and will be null when no such wrapping
  exists.
  */
  findWrapping(e) {
    for (let n = 0; n < this.wrapCache.length; n += 2)
      if (this.wrapCache[n] == e)
        return this.wrapCache[n + 1];
    let t = this.computeWrapping(e);
    return this.wrapCache.push(e, t), t;
  }
  /**
  @internal
  */
  computeWrapping(e) {
    let t = /* @__PURE__ */ Object.create(null), n = [{ match: this, type: null, via: null }];
    for (; n.length; ) {
      let i = n.shift(), s = i.match;
      if (s.matchType(e)) {
        let o = [];
        for (let l = i; l.type; l = l.via)
          o.push(l.type);
        return o.reverse();
      }
      for (let o = 0; o < s.next.length; o++) {
        let { type: l, next: a } = s.next[o];
        !l.isLeaf && !l.hasRequiredAttrs() && !(l.name in t) && (!i.type || a.validEnd) && (n.push({ match: l.contentMatch, type: l, via: i }), t[l.name] = !0);
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
    function t(n) {
      e.push(n);
      for (let i = 0; i < n.next.length; i++)
        e.indexOf(n.next[i].next) == -1 && t(n.next[i].next);
    }
    return t(this), e.map((n, i) => {
      let s = i + (n.validEnd ? "*" : " ") + " ";
      for (let o = 0; o < n.next.length; o++)
        s += (o ? ", " : "") + n.next[o].type.name + "->" + e.indexOf(n.next[o].next);
      return s;
    }).join(`
`);
  }
}
Re.empty = new Re(!0);
class Ms {
  constructor(e, t) {
    this.string = e, this.nodeTypes = t, this.inline = null, this.pos = 0, this.tokens = e.split(/\s*(?=\b|\W|$)/), this.tokens[this.tokens.length - 1] == "" && this.tokens.pop(), this.tokens[0] == "" && this.tokens.shift();
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
function Qr(r) {
  let e = [];
  do
    e.push(Os(r));
  while (r.eat("|"));
  return e.length == 1 ? e[0] : { type: "choice", exprs: e };
}
function Os(r) {
  let e = [];
  do
    e.push(Ns(r));
  while (r.next && r.next != ")" && r.next != "|");
  return e.length == 1 ? e[0] : { type: "seq", exprs: e };
}
function Ns(r) {
  let e = Ts(r);
  for (; ; )
    if (r.eat("+"))
      e = { type: "plus", expr: e };
    else if (r.eat("*"))
      e = { type: "star", expr: e };
    else if (r.eat("?"))
      e = { type: "opt", expr: e };
    else if (r.eat("{"))
      e = ws(r, e);
    else
      break;
  return e;
}
function Wn(r) {
  /\D/.test(r.next) && r.err("Expected number, got '" + r.next + "'");
  let e = Number(r.next);
  return r.pos++, e;
}
function ws(r, e) {
  let t = Wn(r), n = t;
  return r.eat(",") && (r.next != "}" ? n = Wn(r) : n = -1), r.eat("}") || r.err("Unclosed braced range"), { type: "range", min: t, max: n, expr: e };
}
function Ds(r, e) {
  let t = r.nodeTypes, n = t[e];
  if (n)
    return [n];
  let i = [];
  for (let s in t) {
    let o = t[s];
    o.isInGroup(e) && i.push(o);
  }
  return i.length == 0 && r.err("No node type or group '" + e + "' found"), i;
}
function Ts(r) {
  if (r.eat("(")) {
    let e = Qr(r);
    return r.eat(")") || r.err("Missing closing paren"), e;
  } else if (/\W/.test(r.next))
    r.err("Unexpected token '" + r.next + "'");
  else {
    let e = Ds(r, r.next).map((t) => (r.inline == null ? r.inline = t.isInline : r.inline != t.isInline && r.err("Mixing inline and block content"), { type: "name", value: t }));
    return r.pos++, e.length == 1 ? e[0] : { type: "choice", exprs: e };
  }
}
function Es(r) {
  let e = [[]];
  return i(s(r, 0), t()), e;
  function t() {
    return e.push([]) - 1;
  }
  function n(o, l, a) {
    let c = { term: a, to: l };
    return e[o].push(c), c;
  }
  function i(o, l) {
    o.forEach((a) => a.to = l);
  }
  function s(o, l) {
    if (o.type == "choice")
      return o.exprs.reduce((a, c) => a.concat(s(c, l)), []);
    if (o.type == "seq")
      for (let a = 0; ; a++) {
        let c = s(o.exprs[a], l);
        if (a == o.exprs.length - 1)
          return c;
        i(c, l = t());
      }
    else if (o.type == "star") {
      let a = t();
      return n(l, a), i(s(o.expr, a), a), [n(a)];
    } else if (o.type == "plus") {
      let a = t();
      return i(s(o.expr, l), a), i(s(o.expr, a), a), [n(a)];
    } else {
      if (o.type == "opt")
        return [n(l)].concat(s(o.expr, l));
      if (o.type == "range") {
        let a = l;
        for (let c = 0; c < o.min; c++) {
          let f = t();
          i(s(o.expr, a), f), a = f;
        }
        if (o.max == -1)
          i(s(o.expr, a), a);
        else
          for (let c = o.min; c < o.max; c++) {
            let f = t();
            n(a, f), i(s(o.expr, a), f), a = f;
          }
        return [n(a)];
      } else {
        if (o.type == "name")
          return [n(l, void 0, o.value)];
        throw new Error("Unknown expr type");
      }
    }
  }
}
function ei(r, e) {
  return e - r;
}
function Jn(r, e) {
  let t = [];
  return n(e), t.sort(ei);
  function n(i) {
    let s = r[i];
    if (s.length == 1 && !s[0].term)
      return n(s[0].to);
    t.push(i);
    for (let o = 0; o < s.length; o++) {
      let { term: l, to: a } = s[o];
      !l && t.indexOf(a) == -1 && n(a);
    }
  }
}
function As(r) {
  let e = /* @__PURE__ */ Object.create(null);
  return t(Jn(r, 0));
  function t(n) {
    let i = [];
    n.forEach((o) => {
      r[o].forEach(({ term: l, to: a }) => {
        if (!l)
          return;
        let c;
        for (let f = 0; f < i.length; f++)
          i[f][0] == l && (c = i[f][1]);
        Jn(r, a).forEach((f) => {
          c || i.push([l, c = []]), c.indexOf(f) == -1 && c.push(f);
        });
      });
    });
    let s = e[n.join(",")] = new Re(n.indexOf(r.length - 1) > -1);
    for (let o = 0; o < i.length; o++) {
      let l = i[o][1].sort(ei);
      s.next.push({ type: i[o][0], next: e[l.join(",")] || t(l) });
    }
    return s;
  }
}
function Is(r, e) {
  for (let t = 0, n = [r]; t < n.length; t++) {
    let i = n[t], s = !i.validEnd, o = [];
    for (let l = 0; l < i.next.length; l++) {
      let { type: a, next: c } = i.next[l];
      o.push(a.name), s && !(a.isText || a.hasRequiredAttrs()) && (s = !1), n.indexOf(c) == -1 && n.push(c);
    }
    s && e.err("Only non-generatable nodes (" + o.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
  }
}
function ti(r) {
  let e = /* @__PURE__ */ Object.create(null);
  for (let t in r) {
    let n = r[t];
    if (!n.hasDefault)
      return null;
    e[t] = n.default;
  }
  return e;
}
function ni(r, e) {
  let t = /* @__PURE__ */ Object.create(null);
  for (let n in r) {
    let i = e && e[n];
    if (i === void 0) {
      let s = r[n];
      if (s.hasDefault)
        i = s.default;
      else
        throw new RangeError("No value supplied for attribute " + n);
    }
    t[n] = i;
  }
  return t;
}
function ri(r, e, t, n) {
  for (let i in e)
    if (!(i in r))
      throw new RangeError(`Unsupported attribute ${i} for ${t} of type ${n}`);
  for (let i in r)
    r[i].validate && r[i].validate(e[i]);
}
function ii(r, e) {
  let t = /* @__PURE__ */ Object.create(null);
  if (e)
    for (let n in e)
      t[n] = new Ps(r, n, e[n]);
  return t;
}
let qn = class si {
  /**
  @internal
  */
  constructor(e, t, n) {
    this.name = e, this.schema = t, this.spec = n, this.markSet = null, this.groups = n.group ? n.group.split(" ") : [], this.attrs = ii(e, n.attrs), this.defaultAttrs = ti(this.attrs), this.contentMatch = null, this.inlineContent = null, this.isBlock = !(n.inline || e == "text"), this.isText = e == "text";
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
    return this.contentMatch == Re.empty;
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
    return !e && this.defaultAttrs ? this.defaultAttrs : ni(this.attrs, e);
  }
  /**
  Create a `Node` of this type. The given attributes are
  checked and defaulted (you can pass `null` to use the type's
  defaults entirely, if no required attributes exist). `content`
  may be a `Fragment`, a node, an array of nodes, or
  `null`. Similarly `marks` may be `null` to default to the empty
  set of marks.
  */
  create(e = null, t, n) {
    if (this.isText)
      throw new Error("NodeType.create can't construct text nodes");
    return new ne(this, this.computeAttrs(e), y.from(t), M.setFrom(n));
  }
  /**
  Like [`create`](https://prosemirror.net/docs/ref/#model.NodeType.create), but check the given content
  against the node type's content restrictions, and throw an error
  if it doesn't match.
  */
  createChecked(e = null, t, n) {
    return t = y.from(t), this.checkContent(t), new ne(this, this.computeAttrs(e), t, M.setFrom(n));
  }
  /**
  Like [`create`](https://prosemirror.net/docs/ref/#model.NodeType.create), but see if it is
  necessary to add nodes to the start or end of the given fragment
  to make it fit the node. If no fitting wrapping can be found,
  return null. Note that, due to the fact that required nodes can
  always be created, this will always succeed if you pass null or
  `Fragment.empty` as content.
  */
  createAndFill(e = null, t, n) {
    if (e = this.computeAttrs(e), t = y.from(t), t.size) {
      let o = this.contentMatch.fillBefore(t);
      if (!o)
        return null;
      t = o.append(t);
    }
    let i = this.contentMatch.matchFragment(t), s = i && i.fillBefore(y.empty, !0);
    return s ? new ne(this, e, t.append(s), M.setFrom(n)) : null;
  }
  /**
  Returns true if the given fragment is valid content for this node
  type.
  */
  validContent(e) {
    let t = this.contentMatch.matchFragment(e);
    if (!t || !t.validEnd)
      return !1;
    for (let n = 0; n < e.childCount; n++)
      if (!this.allowsMarks(e.child(n).marks))
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
    ri(this.attrs, e, "node", this.name);
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
    for (let t = 0; t < e.length; t++)
      if (!this.allowsMarkType(e[t].type))
        return !1;
    return !0;
  }
  /**
  Removes the marks that are not allowed in this node from the given set.
  */
  allowedMarks(e) {
    if (this.markSet == null)
      return e;
    let t;
    for (let n = 0; n < e.length; n++)
      this.allowsMarkType(e[n].type) ? t && t.push(e[n]) : t || (t = e.slice(0, n));
    return t ? t.length ? t : M.none : e;
  }
  /**
  @internal
  */
  static compile(e, t) {
    let n = /* @__PURE__ */ Object.create(null);
    e.forEach((s, o) => n[s] = new si(s, t, o));
    let i = t.spec.topNode || "doc";
    if (!n[i])
      throw new RangeError("Schema is missing its top node type ('" + i + "')");
    if (!n.text)
      throw new RangeError("Every schema needs a 'text' type");
    for (let s in n.text.attrs)
      throw new RangeError("The text node type should not have attributes");
    return n;
  }
};
function Rs(r, e, t) {
  let n = t.split("|");
  return (i) => {
    let s = i === null ? "null" : typeof i;
    if (n.indexOf(s) < 0)
      throw new RangeError(`Expected value of type ${n} for attribute ${e} on type ${r}, got ${s}`);
  };
}
class Ps {
  constructor(e, t, n) {
    this.hasDefault = Object.prototype.hasOwnProperty.call(n, "default"), this.default = n.default, this.validate = typeof n.validate == "string" ? Rs(e, t, n.validate) : n.validate;
  }
  get isRequired() {
    return !this.hasDefault;
  }
}
class Ft {
  /**
  @internal
  */
  constructor(e, t, n, i) {
    this.name = e, this.rank = t, this.schema = n, this.spec = i, this.attrs = ii(e, i.attrs), this.excluded = null;
    let s = ti(this.attrs);
    this.instance = s ? new M(this, s) : null;
  }
  /**
  Create a mark of this type. `attrs` may be `null` or an object
  containing only some of the mark's attributes. The others, if
  they have defaults, will be added.
  */
  create(e = null) {
    return !e && this.instance ? this.instance : new M(this, ni(this.attrs, e));
  }
  /**
  @internal
  */
  static compile(e, t) {
    let n = /* @__PURE__ */ Object.create(null), i = 0;
    return e.forEach((s, o) => n[s] = new Ft(s, i++, t, o)), n;
  }
  /**
  When there is a mark of this type in the given set, a new set
  without it is returned. Otherwise, the input set is returned.
  */
  removeFromSet(e) {
    for (var t = 0; t < e.length; t++)
      e[t].type == this && (e = e.slice(0, t).concat(e.slice(t + 1)), t--);
    return e;
  }
  /**
  Tests whether there is a mark of this type in the given set.
  */
  isInSet(e) {
    for (let t = 0; t < e.length; t++)
      if (e[t].type == this)
        return e[t];
  }
  /**
  @internal
  */
  checkAttrs(e) {
    ri(this.attrs, e, "mark", this.name);
  }
  /**
  Queries whether a given mark type is
  [excluded](https://prosemirror.net/docs/ref/#model.MarkSpec.excludes) by this one.
  */
  excludes(e) {
    return this.excluded.indexOf(e) > -1;
  }
}
class oi {
  /**
  Construct a schema from a schema [specification](https://prosemirror.net/docs/ref/#model.SchemaSpec).
  */
  constructor(e) {
    this.linebreakReplacement = null, this.cached = /* @__PURE__ */ Object.create(null);
    let t = this.spec = {};
    for (let i in e)
      t[i] = e[i];
    t.nodes = R.from(e.nodes), t.marks = R.from(e.marks || {}), this.nodes = qn.compile(this.spec.nodes, this), this.marks = Ft.compile(this.spec.marks, this);
    let n = /* @__PURE__ */ Object.create(null);
    for (let i in this.nodes) {
      if (i in this.marks)
        throw new RangeError(i + " can not be both a node and a mark");
      let s = this.nodes[i], o = s.spec.content || "", l = s.spec.marks;
      if (s.contentMatch = n[o] || (n[o] = Re.parse(o, this.nodes)), s.inlineContent = s.contentMatch.inlineContent, s.spec.linebreakReplacement) {
        if (this.linebreakReplacement)
          throw new RangeError("Multiple linebreak nodes defined");
        if (!s.isInline || !s.isLeaf)
          throw new RangeError("Linebreak replacement nodes must be inline leaf nodes");
        this.linebreakReplacement = s;
      }
      s.markSet = l == "_" ? null : l ? $n(this, l.split(" ")) : l == "" || !s.inlineContent ? [] : null;
    }
    for (let i in this.marks) {
      let s = this.marks[i], o = s.spec.excludes;
      s.excluded = o == null ? [s] : o == "" ? [] : $n(this, o.split(" "));
    }
    this.nodeFromJSON = (i) => ne.fromJSON(this, i), this.markFromJSON = (i) => M.fromJSON(this, i), this.topNodeType = this.nodes[this.spec.topNode || "doc"], this.cached.wrappings = /* @__PURE__ */ Object.create(null);
  }
  /**
  Create a node in this schema. The `type` may be a string or a
  `NodeType` instance. Attributes will be extended with defaults,
  `content` may be a `Fragment`, `null`, a `Node`, or an array of
  nodes.
  */
  node(e, t = null, n, i) {
    if (typeof e == "string")
      e = this.nodeType(e);
    else if (e instanceof qn) {
      if (e.schema != this)
        throw new RangeError("Node type from different schema used (" + e.name + ")");
    } else throw new RangeError("Invalid node type: " + e);
    return e.createChecked(t, n, i);
  }
  /**
  Create a text node in the schema. Empty text nodes are not
  allowed.
  */
  text(e, t) {
    let n = this.nodes.text;
    return new Tt(n, n.defaultAttrs, e, M.setFrom(t));
  }
  /**
  Create a mark with the given type and attributes.
  */
  mark(e, t) {
    return typeof e == "string" && (e = this.marks[e]), e.create(t);
  }
  /**
  @internal
  */
  nodeType(e) {
    let t = this.nodes[e];
    if (!t)
      throw new RangeError("Unknown node type: " + e);
    return t;
  }
}
function $n(r, e) {
  let t = [];
  for (let n = 0; n < e.length; n++) {
    let i = e[n], s = r.marks[i], o = s;
    if (s)
      t.push(s);
    else
      for (let l in r.marks) {
        let a = r.marks[l];
        (i == "_" || a.spec.group && a.spec.group.split(" ").indexOf(i) > -1) && t.push(o = a);
      }
    if (!o)
      throw new SyntaxError("Unknown mark type: '" + e[n] + "'");
  }
  return t;
}
function vs(r) {
  return r.tag != null;
}
function zs(r) {
  return r.style != null;
}
class qe {
  /**
  Create a parser that targets the given schema, using the given
  parsing rules.
  */
  constructor(e, t) {
    this.schema = e, this.rules = t, this.tags = [], this.styles = [];
    let n = this.matchedStyles = [];
    t.forEach((i) => {
      if (vs(i))
        this.tags.push(i);
      else if (zs(i)) {
        let s = /[^=]*/.exec(i.style)[0];
        n.indexOf(s) < 0 && n.push(s), this.styles.push(i);
      }
    }), this.normalizeLists = !this.tags.some((i) => {
      if (!/^(ul|ol)\b/.test(i.tag) || !i.node)
        return !1;
      let s = e.nodes[i.node];
      return s.contentMatch.matchType(s);
    });
  }
  /**
  Parse a document from the content of a DOM node.
  */
  parse(e, t = {}) {
    let n = new Hn(this, t, !1);
    return n.addAll(e, M.none, t.from, t.to), n.finish();
  }
  /**
  Parses the content of the given DOM node, like
  [`parse`](https://prosemirror.net/docs/ref/#model.DOMParser.parse), and takes the same set of
  options. But unlike that method, which produces a whole node,
  this one returns a slice that is open at the sides, meaning that
  the schema constraints aren't applied to the start of nodes to
  the left of the input and the end of nodes at the end.
  */
  parseSlice(e, t = {}) {
    let n = new Hn(this, t, !0);
    return n.addAll(e, M.none, t.from, t.to), b.maxOpen(n.finish());
  }
  /**
  @internal
  */
  matchTag(e, t, n) {
    for (let i = n ? this.tags.indexOf(n) + 1 : 0; i < this.tags.length; i++) {
      let s = this.tags[i];
      if (Vs(e, s.tag) && (s.namespace === void 0 || e.namespaceURI == s.namespace) && (!s.context || t.matchesContext(s.context))) {
        if (s.getAttrs) {
          let o = s.getAttrs(e);
          if (o === !1)
            continue;
          s.attrs = o || void 0;
        }
        return s;
      }
    }
  }
  /**
  @internal
  */
  matchStyle(e, t, n, i) {
    for (let s = i ? this.styles.indexOf(i) + 1 : 0; s < this.styles.length; s++) {
      let o = this.styles[s], l = o.style;
      if (!(l.indexOf(e) != 0 || o.context && !n.matchesContext(o.context) || // Test that the style string either precisely matches the prop,
      // or has an '=' sign after the prop, followed by the given
      // value.
      l.length > e.length && (l.charCodeAt(e.length) != 61 || l.slice(e.length + 1) != t))) {
        if (o.getAttrs) {
          let a = o.getAttrs(t);
          if (a === !1)
            continue;
          o.attrs = a || void 0;
        }
        return o;
      }
    }
  }
  /**
  @internal
  */
  static schemaRules(e) {
    let t = [];
    function n(i) {
      let s = i.priority == null ? 50 : i.priority, o = 0;
      for (; o < t.length; o++) {
        let l = t[o];
        if ((l.priority == null ? 50 : l.priority) < s)
          break;
      }
      t.splice(o, 0, i);
    }
    for (let i in e.marks) {
      let s = e.marks[i].spec.parseDOM;
      s && s.forEach((o) => {
        n(o = _n(o)), o.mark || o.ignore || o.clearMark || (o.mark = i);
      });
    }
    for (let i in e.nodes) {
      let s = e.nodes[i].spec.parseDOM;
      s && s.forEach((o) => {
        n(o = _n(o)), o.node || o.ignore || o.mark || (o.node = i);
      });
    }
    return t;
  }
  /**
  Construct a DOM parser using the parsing rules listed in a
  schema's [node specs](https://prosemirror.net/docs/ref/#model.NodeSpec.parseDOM), reordered by
  [priority](https://prosemirror.net/docs/ref/#model.GenericParseRule.priority).
  */
  static fromSchema(e) {
    return e.cached.domParser || (e.cached.domParser = new qe(e, qe.schemaRules(e)));
  }
}
const li = {
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
}, Bs = {
  head: !0,
  noscript: !0,
  object: !0,
  script: !0,
  style: !0,
  title: !0
}, ai = { ol: !0, ul: !0 }, ot = 1, an = 2, et = 4;
function Kn(r, e, t) {
  return e != null ? (e ? ot : 0) | (e === "full" ? an : 0) : r && r.whitespace == "pre" ? ot | an : t & ~et;
}
class xt {
  constructor(e, t, n, i, s, o) {
    this.type = e, this.attrs = t, this.marks = n, this.solid = i, this.options = o, this.content = [], this.activeMarks = M.none, this.match = s || (o & et ? null : e.contentMatch);
  }
  findWrapping(e) {
    if (!this.match) {
      if (!this.type)
        return [];
      let t = this.type.contentMatch.fillBefore(y.from(e));
      if (t)
        this.match = this.type.contentMatch.matchFragment(t);
      else {
        let n = this.type.contentMatch, i;
        return (i = n.findWrapping(e.type)) ? (this.match = n, i) : null;
      }
    }
    return this.match.findWrapping(e.type);
  }
  finish(e) {
    if (!(this.options & ot)) {
      let n = this.content[this.content.length - 1], i;
      if (n && n.isText && (i = /[ \t\r\n\u000c]+$/.exec(n.text))) {
        let s = n;
        n.text.length == i[0].length ? this.content.pop() : this.content[this.content.length - 1] = s.withText(s.text.slice(0, s.text.length - i[0].length));
      }
    }
    let t = y.from(this.content);
    return !e && this.match && (t = t.append(this.match.fillBefore(y.empty, !0))), this.type ? this.type.create(this.attrs, t, this.marks) : t;
  }
  inlineContext(e) {
    return this.type ? this.type.inlineContent : this.content.length ? this.content[0].isInline : e.parentNode && !li.hasOwnProperty(e.parentNode.nodeName.toLowerCase());
  }
}
class Hn {
  constructor(e, t, n) {
    this.parser = e, this.options = t, this.isOpen = n, this.open = 0, this.localPreserveWS = !1;
    let i = t.topNode, s, o = Kn(null, t.preserveWhitespace, 0) | (n ? et : 0);
    i ? s = new xt(i.type, i.attrs, M.none, !0, t.topMatch || i.type.contentMatch, o) : n ? s = new xt(null, null, M.none, !0, null, o) : s = new xt(e.schema.topNodeType, null, M.none, !0, null, o), this.nodes = [s], this.find = t.findPositions, this.needsBlock = !1;
  }
  get top() {
    return this.nodes[this.open];
  }
  // Add a DOM node to the content. Text is inserted as text node,
  // otherwise, the node is passed to `addElement` or, if it has a
  // `style` attribute, `addElementWithStyles`.
  addDOM(e, t) {
    e.nodeType == 3 ? this.addTextNode(e, t) : e.nodeType == 1 && this.addElement(e, t);
  }
  addTextNode(e, t) {
    let n = e.nodeValue, i = this.top, s = i.options & an ? "full" : this.localPreserveWS || (i.options & ot) > 0, { schema: o } = this.parser;
    if (s === "full" || i.inlineContext(e) || /[^ \t\r\n\u000c]/.test(n)) {
      if (s)
        if (s === "full")
          n = n.replace(/\r\n?/g, `
`);
        else if (o.linebreakReplacement && /[\r\n]/.test(n) && this.top.findWrapping(o.linebreakReplacement.create())) {
          let l = n.split(/\r?\n|\r/);
          for (let a = 0; a < l.length; a++)
            a && this.insertNode(o.linebreakReplacement.create(), t, !0), l[a] && this.insertNode(o.text(l[a]), t, !/\S/.test(l[a]));
          n = "";
        } else
          n = n.replace(/\r?\n|\r/g, " ");
      else if (n = n.replace(/[ \t\r\n\u000c]+/g, " "), /^[ \t\r\n\u000c]/.test(n) && this.open == this.nodes.length - 1) {
        let l = i.content[i.content.length - 1], a = e.previousSibling;
        (!l || a && a.nodeName == "BR" || l.isText && /[ \t\r\n\u000c]$/.test(l.text)) && (n = n.slice(1));
      }
      n && this.insertNode(o.text(n), t, !/\S/.test(n)), this.findInText(e);
    } else
      this.findInside(e);
  }
  // Try to find a handler for the given tag and use that to parse. If
  // none is found, the element's content nodes are added directly.
  addElement(e, t, n) {
    let i = this.localPreserveWS, s = this.top;
    (e.tagName == "PRE" || /pre/.test(e.style && e.style.whiteSpace)) && (this.localPreserveWS = !0);
    let o = e.nodeName.toLowerCase(), l;
    ai.hasOwnProperty(o) && this.parser.normalizeLists && Fs(e);
    let a = this.options.ruleFromNode && this.options.ruleFromNode(e) || (l = this.parser.matchTag(e, this, n));
    e: if (a ? a.ignore : Bs.hasOwnProperty(o))
      this.findInside(e), this.ignoreFallback(e, t);
    else if (!a || a.skip || a.closeParent) {
      a && a.closeParent ? this.open = Math.max(0, this.open - 1) : a && a.skip.nodeType && (e = a.skip);
      let c, f = this.needsBlock;
      if (li.hasOwnProperty(o))
        s.content.length && s.content[0].isInline && this.open && (this.open--, s = this.top), c = !0, s.type || (this.needsBlock = !0);
      else if (!e.firstChild) {
        this.leafFallback(e, t);
        break e;
      }
      let h = a && a.skip ? t : this.readStyles(e, t);
      h && this.addAll(e, h), c && this.sync(s), this.needsBlock = f;
    } else {
      let c = this.readStyles(e, t);
      c && this.addElementByRule(e, a, c, a.consuming === !1 ? l : void 0);
    }
    this.localPreserveWS = i;
  }
  // Called for leaf DOM nodes that would otherwise be ignored
  leafFallback(e, t) {
    e.nodeName == "BR" && this.top.type && this.top.type.inlineContent && this.addTextNode(e.ownerDocument.createTextNode(`
`), t);
  }
  // Called for ignored nodes
  ignoreFallback(e, t) {
    e.nodeName == "BR" && (!this.top.type || !this.top.type.inlineContent) && this.findPlace(this.parser.schema.text("-"), t, !0);
  }
  // Run any style parser associated with the node's styles. Either
  // return an updated array of marks, or null to indicate some of the
  // styles had a rule with `ignore` set.
  readStyles(e, t) {
    let n = e.style;
    if (n && n.length)
      for (let i = 0; i < this.parser.matchedStyles.length; i++) {
        let s = this.parser.matchedStyles[i], o = n.getPropertyValue(s);
        if (o)
          for (let l = void 0; ; ) {
            let a = this.parser.matchStyle(s, o, this, l);
            if (!a)
              break;
            if (a.ignore)
              return null;
            if (a.clearMark ? t = t.filter((c) => !a.clearMark(c)) : t = t.concat(this.parser.schema.marks[a.mark].create(a.attrs)), a.consuming === !1)
              l = a;
            else
              break;
          }
      }
    return t;
  }
  // Look up a handler for the given node. If none are found, return
  // false. Otherwise, apply it, use its return value to drive the way
  // the node's content is wrapped, and return true.
  addElementByRule(e, t, n, i) {
    let s, o;
    if (t.node)
      if (o = this.parser.schema.nodes[t.node], o.isLeaf)
        this.insertNode(o.create(t.attrs), n, e.nodeName == "BR") || this.leafFallback(e, n);
      else {
        let a = this.enter(o, t.attrs || null, n, t.preserveWhitespace);
        a && (s = !0, n = a);
      }
    else {
      let a = this.parser.schema.marks[t.mark];
      n = n.concat(a.create(t.attrs));
    }
    let l = this.top;
    if (o && o.isLeaf)
      this.findInside(e);
    else if (i)
      this.addElement(e, n, i);
    else if (t.getContent)
      this.findInside(e), t.getContent(e, this.parser.schema).forEach((a) => this.insertNode(a, n, !1));
    else {
      let a = e;
      typeof t.contentElement == "string" ? a = e.querySelector(t.contentElement) : typeof t.contentElement == "function" ? a = t.contentElement(e) : t.contentElement && (a = t.contentElement), this.findAround(e, a, !0), this.addAll(a, n), this.findAround(e, a, !1);
    }
    s && this.sync(l) && this.open--;
  }
  // Add all child nodes between `startIndex` and `endIndex` (or the
  // whole node, if not given). If `sync` is passed, use it to
  // synchronize after every block element.
  addAll(e, t, n, i) {
    let s = n || 0;
    for (let o = n ? e.childNodes[n] : e.firstChild, l = i == null ? null : e.childNodes[i]; o != l; o = o.nextSibling, ++s)
      this.findAtPoint(e, s), this.addDOM(o, t);
    this.findAtPoint(e, s);
  }
  // Try to find a way to fit the given node type into the current
  // context. May add intermediate wrappers and/or leave non-solid
  // nodes that we're in.
  findPlace(e, t, n) {
    let i, s;
    for (let o = this.open, l = 0; o >= 0; o--) {
      let a = this.nodes[o], c = a.findWrapping(e);
      if (c && (!i || i.length > c.length + l) && (i = c, s = a, !c.length))
        break;
      if (a.solid) {
        if (n)
          break;
        l += 2;
      }
    }
    if (!i)
      return null;
    this.sync(s);
    for (let o = 0; o < i.length; o++)
      t = this.enterInner(i[o], null, t, !1);
    return t;
  }
  // Try to insert the given node, adjusting the context when needed.
  insertNode(e, t, n) {
    if (e.isInline && this.needsBlock && !this.top.type) {
      let s = this.textblockFromContext();
      s && (t = this.enterInner(s, null, t));
    }
    let i = this.findPlace(e, t, n);
    if (i) {
      this.closeExtra();
      let s = this.top;
      s.match && (s.match = s.match.matchType(e.type));
      let o = M.none;
      for (let l of i.concat(e.marks))
        (s.type ? s.type.allowsMarkType(l.type) : Un(l.type, e.type)) && (o = l.addToSet(o));
      return s.content.push(e.mark(o)), !0;
    }
    return !1;
  }
  // Try to start a node of the given type, adjusting the context when
  // necessary.
  enter(e, t, n, i) {
    let s = this.findPlace(e.create(t), n, !1);
    return s && (s = this.enterInner(e, t, n, !0, i)), s;
  }
  // Open a node of the given type
  enterInner(e, t, n, i = !1, s) {
    this.closeExtra();
    let o = this.top;
    o.match = o.match && o.match.matchType(e);
    let l = Kn(e, s, o.options);
    o.options & et && o.content.length == 0 && (l |= et);
    let a = M.none;
    return n = n.filter((c) => (o.type ? o.type.allowsMarkType(c.type) : Un(c.type, e)) ? (a = c.addToSet(a), !1) : !0), this.nodes.push(new xt(e, t, a, i, null, l)), this.open++, n;
  }
  // Make sure all nodes above this.open are finished and added to
  // their parents
  closeExtra(e = !1) {
    let t = this.nodes.length - 1;
    if (t > this.open) {
      for (; t > this.open; t--)
        this.nodes[t - 1].content.push(this.nodes[t].finish(e));
      this.nodes.length = this.open + 1;
    }
  }
  finish() {
    return this.open = 0, this.closeExtra(this.isOpen), this.nodes[0].finish(!!(this.isOpen || this.options.topOpen));
  }
  sync(e) {
    for (let t = this.open; t >= 0; t--) {
      if (this.nodes[t] == e)
        return this.open = t, !0;
      this.localPreserveWS && (this.nodes[t].options |= ot);
    }
    return !1;
  }
  get currentPos() {
    this.closeExtra();
    let e = 0;
    for (let t = this.open; t >= 0; t--) {
      let n = this.nodes[t].content;
      for (let i = n.length - 1; i >= 0; i--)
        e += n[i].nodeSize;
      t && e++;
    }
    return e;
  }
  findAtPoint(e, t) {
    if (this.find)
      for (let n = 0; n < this.find.length; n++)
        this.find[n].node == e && this.find[n].offset == t && (this.find[n].pos = this.currentPos);
  }
  findInside(e) {
    if (this.find)
      for (let t = 0; t < this.find.length; t++)
        this.find[t].pos == null && e.nodeType == 1 && e.contains(this.find[t].node) && (this.find[t].pos = this.currentPos);
  }
  findAround(e, t, n) {
    if (e != t && this.find)
      for (let i = 0; i < this.find.length; i++)
        this.find[i].pos == null && e.nodeType == 1 && e.contains(this.find[i].node) && t.compareDocumentPosition(this.find[i].node) & (n ? 2 : 4) && (this.find[i].pos = this.currentPos);
  }
  findInText(e) {
    if (this.find)
      for (let t = 0; t < this.find.length; t++)
        this.find[t].node == e && (this.find[t].pos = this.currentPos - (e.nodeValue.length - this.find[t].offset));
  }
  // Determines whether the given context string matches this context.
  matchesContext(e) {
    if (e.indexOf("|") > -1)
      return e.split(/\s*\|\s*/).some(this.matchesContext, this);
    let t = e.split("/"), n = this.options.context, i = !this.isOpen && (!n || n.parent.type == this.nodes[0].type), s = -(n ? n.depth + 1 : 0) + (i ? 0 : 1), o = (l, a) => {
      for (; l >= 0; l--) {
        let c = t[l];
        if (c == "") {
          if (l == t.length - 1 || l == 0)
            continue;
          for (; a >= s; a--)
            if (o(l - 1, a))
              return !0;
          return !1;
        } else {
          let f = a > 0 || a == 0 && i ? this.nodes[a].type : n && a >= s ? n.node(a - s).type : null;
          if (!f || f.name != c && !f.isInGroup(c))
            return !1;
          a--;
        }
      }
      return !0;
    };
    return o(t.length - 1, this.open);
  }
  textblockFromContext() {
    let e = this.options.context;
    if (e)
      for (let t = e.depth; t >= 0; t--) {
        let n = e.node(t).contentMatchAt(e.indexAfter(t)).defaultType;
        if (n && n.isTextblock && n.defaultAttrs)
          return n;
      }
    for (let t in this.parser.schema.nodes) {
      let n = this.parser.schema.nodes[t];
      if (n.isTextblock && n.defaultAttrs)
        return n;
    }
  }
}
function Fs(r) {
  for (let e = r.firstChild, t = null; e; e = e.nextSibling) {
    let n = e.nodeType == 1 ? e.nodeName.toLowerCase() : null;
    n && ai.hasOwnProperty(n) && t ? (t.appendChild(e), e = t) : n == "li" ? t = e : n && (t = null);
  }
}
function Vs(r, e) {
  return (r.matches || r.msMatchesSelector || r.webkitMatchesSelector || r.mozMatchesSelector).call(r, e);
}
function _n(r) {
  let e = {};
  for (let t in r)
    e[t] = r[t];
  return e;
}
function Un(r, e) {
  let t = e.schema.nodes;
  for (let n in t) {
    let i = t[n];
    if (!i.allowsMarkType(r))
      continue;
    let s = [], o = (l) => {
      s.push(l);
      for (let a = 0; a < l.edgeCount; a++) {
        let { type: c, next: f } = l.edge(a);
        if (c == e || s.indexOf(f) < 0 && o(f))
          return !0;
      }
    };
    if (o(i.contentMatch))
      return !0;
  }
}
class ze {
  /**
  Create a serializer. `nodes` should map node names to functions
  that take a node and return a description of the corresponding
  DOM. `marks` does the same for mark names, but also gets an
  argument that tells it whether the mark's content is block or
  inline content (for typical use, it'll always be inline). A mark
  serializer may be `null` to indicate that marks of that type
  should not be serialized.
  */
  constructor(e, t) {
    this.nodes = e, this.marks = t;
  }
  /**
  Serialize the content of this fragment to a DOM fragment. When
  not in the browser, the `document` option, containing a DOM
  document, should be passed so that the serializer can create
  nodes.
  */
  serializeFragment(e, t = {}, n) {
    n || (n = kt(t).createDocumentFragment());
    let i = n, s = [];
    return e.forEach((o) => {
      if (s.length || o.marks.length) {
        let l = 0, a = 0;
        for (; l < s.length && a < o.marks.length; ) {
          let c = o.marks[a];
          if (!this.marks[c.type.name]) {
            a++;
            continue;
          }
          if (!c.eq(s[l][0]) || c.type.spec.spanning === !1)
            break;
          l++, a++;
        }
        for (; l < s.length; )
          i = s.pop()[1];
        for (; a < o.marks.length; ) {
          let c = o.marks[a++], f = this.serializeMark(c, o.isInline, t);
          f && (s.push([c, i]), i.appendChild(f.dom), i = f.contentDOM || f.dom);
        }
      }
      i.appendChild(this.serializeNodeInner(o, t));
    }), n;
  }
  /**
  @internal
  */
  serializeNodeInner(e, t) {
    if (e.isText)
      return kt(t).createTextNode(e.text);
    let { dom: n, contentDOM: i } = Ct(kt(t), this.nodes[e.type.name](e), null, e.attrs);
    if (i) {
      if (e.isLeaf)
        throw new RangeError("Content hole not allowed in a leaf node spec");
      this.serializeFragment(e.content, t, i);
    }
    return n;
  }
  /**
  Serialize this node to a DOM node. This can be useful when you
  need to serialize a part of a document, as opposed to the whole
  document. To serialize a whole document, use
  [`serializeFragment`](https://prosemirror.net/docs/ref/#model.DOMSerializer.serializeFragment) on
  its [content](https://prosemirror.net/docs/ref/#model.Node.content).
  */
  serializeNode(e, t = {}) {
    let n = this.serializeNodeInner(e, t);
    for (let i = e.marks.length - 1; i >= 0; i--) {
      let s = this.serializeMark(e.marks[i], e.isInline, t);
      s && ((s.contentDOM || s.dom).appendChild(n), n = s.dom);
    }
    return n;
  }
  /**
  @internal
  */
  serializeMark(e, t, n = {}) {
    let i = this.marks[e.type.name];
    return i && Ct(kt(n), i(e, t), null, e.attrs);
  }
  static renderSpec(e, t, n = null, i) {
    return typeof t == "string" ? { dom: e.createTextNode(t) } : Ct(e, t, n, i);
  }
  /**
  Build a serializer using the [`toDOM`](https://prosemirror.net/docs/ref/#model.NodeSpec.toDOM)
  properties in a schema's node and mark specs.
  */
  static fromSchema(e) {
    return e.cached.domSerializer || (e.cached.domSerializer = new ze(this.nodesFromSchema(e), this.marksFromSchema(e)));
  }
  /**
  Gather the serializers in a schema's node specs into an object.
  This can be useful as a base to build a custom serializer from.
  */
  static nodesFromSchema(e) {
    let t = jn(e.nodes);
    return t.text || (t.text = (n) => n.text), t;
  }
  /**
  Gather the serializers in a schema's mark specs into an object.
  */
  static marksFromSchema(e) {
    return jn(e.marks);
  }
}
function jn(r) {
  let e = {};
  for (let t in r) {
    let n = r[t].spec.toDOM;
    n && (e[t] = n);
  }
  return e;
}
function kt(r) {
  return r.document || window.document;
}
const Gn = /* @__PURE__ */ new WeakMap();
function Ls(r) {
  let e = Gn.get(r);
  return e === void 0 && Gn.set(r, e = Ws(r)), e;
}
function Ws(r) {
  let e = null;
  function t(n) {
    if (n && typeof n == "object")
      if (Array.isArray(n))
        if (typeof n[0] == "string")
          e || (e = []), e.push(n);
        else
          for (let i = 0; i < n.length; i++)
            t(n[i]);
      else
        for (let i in n)
          t(n[i]);
  }
  return t(r), e;
}
function Ct(r, e, t, n) {
  if (e.nodeType == 1)
    return { dom: e };
  if (e.dom && e.dom.nodeType == 1)
    return e;
  let i = e[0], s;
  if (typeof i != "string")
    throw new RangeError("Invalid array passed to renderSpec");
  if (n && (s = Ls(n)) && s.indexOf(e) > -1)
    throw new RangeError("Using an array from an attribute object as a DOM spec. This may be an attempted cross site scripting attack.");
  let o = i.indexOf(" ");
  o > 0 && (t = i.slice(0, o), i = i.slice(o + 1));
  let l, a = t ? r.createElementNS(t, i) : r.createElement(i), c = e[1], f = 1;
  if (c && typeof c == "object" && c.nodeType == null && !Array.isArray(c)) {
    f = 2;
    for (let h in c)
      if (c[h] != null) {
        let d = h.indexOf(" ");
        d > 0 ? a.setAttributeNS(h.slice(0, d), h.slice(d + 1), c[h]) : h == "style" && a.style ? a.style.cssText = c[h] : a.setAttribute(h, c[h]);
      }
  }
  for (let h = f; h < e.length; h++) {
    let d = e[h];
    if (d === 0) {
      if (h < e.length - 1 || h > f)
        throw new RangeError("Content hole must be the only child of its parent node");
      return { dom: a, contentDOM: a };
    } else if (typeof d == "string")
      a.appendChild(r.createTextNode(d));
    else {
      let { dom: u, contentDOM: p } = Ct(r, d, t, n);
      if (a.appendChild(u), p) {
        if (l)
          throw new RangeError("Multiple content holes");
        l = p;
      }
    }
  }
  return { dom: a, contentDOM: l };
}
const ci = 65535, fi = Math.pow(2, 16);
function Js(r, e) {
  return r + e * fi;
}
function Yn(r) {
  return r & ci;
}
function qs(r) {
  return (r - (r & ci)) / fi;
}
const hi = 1, di = 2, Mt = 4, ui = 8;
class cn {
  /**
  @internal
  */
  constructor(e, t, n) {
    this.pos = e, this.delInfo = t, this.recover = n;
  }
  /**
  Tells you whether the position was deleted, that is, whether the
  step removed the token on the side queried (via the `assoc`)
  argument from the document.
  */
  get deleted() {
    return (this.delInfo & ui) > 0;
  }
  /**
  Tells you whether the token before the mapped position was deleted.
  */
  get deletedBefore() {
    return (this.delInfo & (hi | Mt)) > 0;
  }
  /**
  True when the token after the mapped position was deleted.
  */
  get deletedAfter() {
    return (this.delInfo & (di | Mt)) > 0;
  }
  /**
  Tells whether any of the steps mapped through deletes across the
  position (including both the token before and after the
  position).
  */
  get deletedAcross() {
    return (this.delInfo & Mt) > 0;
  }
}
class H {
  /**
  Create a position map. The modifications to the document are
  represented as an array of numbers, in which each group of three
  represents a modified chunk as `[start, oldSize, newSize]`.
  */
  constructor(e, t = !1) {
    if (this.ranges = e, this.inverted = t, !e.length && H.empty)
      return H.empty;
  }
  /**
  @internal
  */
  recover(e) {
    let t = 0, n = Yn(e);
    if (!this.inverted)
      for (let i = 0; i < n; i++)
        t += this.ranges[i * 3 + 2] - this.ranges[i * 3 + 1];
    return this.ranges[n * 3] + t + qs(e);
  }
  mapResult(e, t = 1) {
    return this._map(e, t, !1);
  }
  map(e, t = 1) {
    return this._map(e, t, !0);
  }
  /**
  @internal
  */
  _map(e, t, n) {
    let i = 0, s = this.inverted ? 2 : 1, o = this.inverted ? 1 : 2;
    for (let l = 0; l < this.ranges.length; l += 3) {
      let a = this.ranges[l] - (this.inverted ? i : 0);
      if (a > e)
        break;
      let c = this.ranges[l + s], f = this.ranges[l + o], h = a + c;
      if (e <= h) {
        let d = c ? e == a ? -1 : e == h ? 1 : t : t, u = a + i + (d < 0 ? 0 : f);
        if (n)
          return u;
        let p = e == (t < 0 ? a : h) ? null : Js(l / 3, e - a), m = e == a ? di : e == h ? hi : Mt;
        return (t < 0 ? e != a : e != h) && (m |= ui), new cn(u, m, p);
      }
      i += f - c;
    }
    return n ? e + i : new cn(e + i, 0, null);
  }
  /**
  @internal
  */
  touches(e, t) {
    let n = 0, i = Yn(t), s = this.inverted ? 2 : 1, o = this.inverted ? 1 : 2;
    for (let l = 0; l < this.ranges.length; l += 3) {
      let a = this.ranges[l] - (this.inverted ? n : 0);
      if (a > e)
        break;
      let c = this.ranges[l + s], f = a + c;
      if (e <= f && l == i * 3)
        return !0;
      n += this.ranges[l + o] - c;
    }
    return !1;
  }
  /**
  Calls the given function on each of the changed ranges included in
  this map.
  */
  forEach(e) {
    let t = this.inverted ? 2 : 1, n = this.inverted ? 1 : 2;
    for (let i = 0, s = 0; i < this.ranges.length; i += 3) {
      let o = this.ranges[i], l = o - (this.inverted ? s : 0), a = o + (this.inverted ? 0 : s), c = this.ranges[i + t], f = this.ranges[i + n];
      e(l, l + c, a, a + f), s += f - c;
    }
  }
  /**
  Create an inverted version of this map. The result can be used to
  map positions in the post-step document to the pre-step document.
  */
  invert() {
    return new H(this.ranges, !this.inverted);
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
    return e == 0 ? H.empty : new H(e < 0 ? [0, -e, 0] : [0, 0, e]);
  }
}
H.empty = new H([]);
class lt {
  /**
  Create a new mapping with the given position maps.
  */
  constructor(e, t, n = 0, i = e ? e.length : 0) {
    this.mirror = t, this.from = n, this.to = i, this._maps = e || [], this.ownData = !(e || t);
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
  slice(e = 0, t = this.maps.length) {
    return new lt(this._maps, this.mirror, e, t);
  }
  /**
  Add a step map to the end of this mapping. If `mirrors` is
  given, it should be the index of the step map that is the mirror
  image of this one.
  */
  appendMap(e, t) {
    this.ownData || (this._maps = this._maps.slice(), this.mirror = this.mirror && this.mirror.slice(), this.ownData = !0), this.to = this._maps.push(e), t != null && this.setMirror(this._maps.length - 1, t);
  }
  /**
  Add all the step maps in a given mapping to this one (preserving
  mirroring information).
  */
  appendMapping(e) {
    for (let t = 0, n = this._maps.length; t < e._maps.length; t++) {
      let i = e.getMirror(t);
      this.appendMap(e._maps[t], i != null && i < t ? n + i : void 0);
    }
  }
  /**
  Finds the offset of the step map that mirrors the map at the
  given offset, in this mapping (as per the second argument to
  `appendMap`).
  */
  getMirror(e) {
    if (this.mirror) {
      for (let t = 0; t < this.mirror.length; t++)
        if (this.mirror[t] == e)
          return this.mirror[t + (t % 2 ? -1 : 1)];
    }
  }
  /**
  @internal
  */
  setMirror(e, t) {
    this.mirror || (this.mirror = []), this.mirror.push(e, t);
  }
  /**
  Append the inverse of the given mapping to this one.
  */
  appendMappingInverted(e) {
    for (let t = e.maps.length - 1, n = this._maps.length + e._maps.length; t >= 0; t--) {
      let i = e.getMirror(t);
      this.appendMap(e._maps[t].invert(), i != null && i > t ? n - i - 1 : void 0);
    }
  }
  /**
  Create an inverted version of this mapping.
  */
  invert() {
    let e = new lt();
    return e.appendMappingInverted(this), e;
  }
  /**
  Map a position through this mapping.
  */
  map(e, t = 1) {
    if (this.mirror)
      return this._map(e, t, !0);
    for (let n = this.from; n < this.to; n++)
      e = this._maps[n].map(e, t);
    return e;
  }
  /**
  Map a position through this mapping, returning a mapping
  result.
  */
  mapResult(e, t = 1) {
    return this._map(e, t, !1);
  }
  /**
  @internal
  */
  _map(e, t, n) {
    let i = 0;
    for (let s = this.from; s < this.to; s++) {
      let o = this._maps[s], l = o.mapResult(e, t);
      if (l.recover != null) {
        let a = this.getMirror(s);
        if (a != null && a > s && a < this.to) {
          s = a, e = this._maps[a].recover(l.recover);
          continue;
        }
      }
      i |= l.delInfo, e = l.pos;
    }
    return n ? e : new cn(e, i, null);
  }
}
const Kt = /* @__PURE__ */ Object.create(null);
class W {
  /**
  Get the step map that represents the changes made by this step,
  and which can be used to transform between positions in the old
  and the new document.
  */
  getMap() {
    return H.empty;
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
  static fromJSON(e, t) {
    if (!t || !t.stepType)
      throw new RangeError("Invalid input for Step.fromJSON");
    let n = Kt[t.stepType];
    if (!n)
      throw new RangeError(`No step type ${t.stepType} defined`);
    return n.fromJSON(e, t);
  }
  /**
  To be able to serialize steps to JSON, each step needs a string
  ID to attach to its JSON representation. Use this method to
  register an ID for your step classes. Try to pick something
  that's unlikely to clash with steps from other modules.
  */
  static jsonID(e, t) {
    if (e in Kt)
      throw new RangeError("Duplicate use of step JSON ID " + e);
    return Kt[e] = t, t.prototype.jsonID = e, t;
  }
}
class D {
  /**
  @internal
  */
  constructor(e, t) {
    this.doc = e, this.failed = t;
  }
  /**
  Create a successful step result.
  */
  static ok(e) {
    return new D(e, null);
  }
  /**
  Create a failed step result.
  */
  static fail(e) {
    return new D(null, e);
  }
  /**
  Call [`Node.replace`](https://prosemirror.net/docs/ref/#model.Node.replace) with the given
  arguments. Create a successful result if it succeeds, and a
  failed one if it throws a `ReplaceError`.
  */
  static fromReplace(e, t, n, i) {
    try {
      return D.ok(e.replace(t, n, i));
    } catch (s) {
      if (s instanceof it)
        return D.fail(s.message);
      throw s;
    }
  }
}
function Mn(r, e, t) {
  let n = [];
  for (let i = 0; i < r.childCount; i++) {
    let s = r.child(i);
    s.content.size && (s = s.copy(Mn(s.content, e, s))), s.isInline && (s = e(s, t, i)), n.push(s);
  }
  return y.fromArray(n);
}
class pe extends W {
  /**
  Create a mark step.
  */
  constructor(e, t, n) {
    super(), this.from = e, this.to = t, this.mark = n;
  }
  apply(e) {
    let t = e.slice(this.from, this.to), n = e.resolve(this.from), i = n.node(n.sharedDepth(this.to)), s = new b(Mn(t.content, (o, l) => !o.isAtom || !l.type.allowsMarkType(this.mark.type) ? o : o.mark(this.mark.addToSet(o.marks)), i), t.openStart, t.openEnd);
    return D.fromReplace(e, this.from, this.to, s);
  }
  invert() {
    return new te(this.from, this.to, this.mark);
  }
  map(e) {
    let t = e.mapResult(this.from, 1), n = e.mapResult(this.to, -1);
    return t.deleted && n.deleted || t.pos >= n.pos ? null : new pe(t.pos, n.pos, this.mark);
  }
  merge(e) {
    return e instanceof pe && e.mark.eq(this.mark) && this.from <= e.to && this.to >= e.from ? new pe(Math.min(this.from, e.from), Math.max(this.to, e.to), this.mark) : null;
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
  static fromJSON(e, t) {
    if (typeof t.from != "number" || typeof t.to != "number")
      throw new RangeError("Invalid input for AddMarkStep.fromJSON");
    return new pe(t.from, t.to, e.markFromJSON(t.mark));
  }
}
W.jsonID("addMark", pe);
class te extends W {
  /**
  Create a mark-removing step.
  */
  constructor(e, t, n) {
    super(), this.from = e, this.to = t, this.mark = n;
  }
  apply(e) {
    let t = e.slice(this.from, this.to), n = new b(Mn(t.content, (i) => i.mark(this.mark.removeFromSet(i.marks)), e), t.openStart, t.openEnd);
    return D.fromReplace(e, this.from, this.to, n);
  }
  invert() {
    return new pe(this.from, this.to, this.mark);
  }
  map(e) {
    let t = e.mapResult(this.from, 1), n = e.mapResult(this.to, -1);
    return t.deleted && n.deleted || t.pos >= n.pos ? null : new te(t.pos, n.pos, this.mark);
  }
  merge(e) {
    return e instanceof te && e.mark.eq(this.mark) && this.from <= e.to && this.to >= e.from ? new te(Math.min(this.from, e.from), Math.max(this.to, e.to), this.mark) : null;
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
  static fromJSON(e, t) {
    if (typeof t.from != "number" || typeof t.to != "number")
      throw new RangeError("Invalid input for RemoveMarkStep.fromJSON");
    return new te(t.from, t.to, e.markFromJSON(t.mark));
  }
}
W.jsonID("removeMark", te);
class me extends W {
  /**
  Create a node mark step.
  */
  constructor(e, t) {
    super(), this.pos = e, this.mark = t;
  }
  apply(e) {
    let t = e.nodeAt(this.pos);
    if (!t)
      return D.fail("No node at mark step's position");
    let n = t.type.create(t.attrs, null, this.mark.addToSet(t.marks));
    return D.fromReplace(e, this.pos, this.pos + 1, new b(y.from(n), 0, t.isLeaf ? 0 : 1));
  }
  invert(e) {
    let t = e.nodeAt(this.pos);
    if (t) {
      let n = this.mark.addToSet(t.marks);
      if (n.length == t.marks.length) {
        for (let i = 0; i < t.marks.length; i++)
          if (!t.marks[i].isInSet(n))
            return new me(this.pos, t.marks[i]);
        return new me(this.pos, this.mark);
      }
    }
    return new Pe(this.pos, this.mark);
  }
  map(e) {
    let t = e.mapResult(this.pos, 1);
    return t.deletedAfter ? null : new me(t.pos, this.mark);
  }
  toJSON() {
    return { stepType: "addNodeMark", pos: this.pos, mark: this.mark.toJSON() };
  }
  /**
  @internal
  */
  static fromJSON(e, t) {
    if (typeof t.pos != "number")
      throw new RangeError("Invalid input for AddNodeMarkStep.fromJSON");
    return new me(t.pos, e.markFromJSON(t.mark));
  }
}
W.jsonID("addNodeMark", me);
class Pe extends W {
  /**
  Create a mark-removing step.
  */
  constructor(e, t) {
    super(), this.pos = e, this.mark = t;
  }
  apply(e) {
    let t = e.nodeAt(this.pos);
    if (!t)
      return D.fail("No node at mark step's position");
    let n = t.type.create(t.attrs, null, this.mark.removeFromSet(t.marks));
    return D.fromReplace(e, this.pos, this.pos + 1, new b(y.from(n), 0, t.isLeaf ? 0 : 1));
  }
  invert(e) {
    let t = e.nodeAt(this.pos);
    return !t || !this.mark.isInSet(t.marks) ? this : new me(this.pos, this.mark);
  }
  map(e) {
    let t = e.mapResult(this.pos, 1);
    return t.deletedAfter ? null : new Pe(t.pos, this.mark);
  }
  toJSON() {
    return { stepType: "removeNodeMark", pos: this.pos, mark: this.mark.toJSON() };
  }
  /**
  @internal
  */
  static fromJSON(e, t) {
    if (typeof t.pos != "number")
      throw new RangeError("Invalid input for RemoveNodeMarkStep.fromJSON");
    return new Pe(t.pos, e.markFromJSON(t.mark));
  }
}
W.jsonID("removeNodeMark", Pe);
class E extends W {
  /**
  The given `slice` should fit the 'gap' between `from` and
  `to`—the depths must line up, and the surrounding nodes must be
  able to be joined with the open sides of the slice. When
  `structure` is true, the step will fail if the content between
  from and to is not just a sequence of closing and then opening
  tokens (this is to guard against rebased replace steps
  overwriting something they weren't supposed to).
  */
  constructor(e, t, n, i = !1) {
    super(), this.from = e, this.to = t, this.slice = n, this.structure = i;
  }
  apply(e) {
    return this.structure && fn(e, this.from, this.to) ? D.fail("Structure replace would overwrite content") : D.fromReplace(e, this.from, this.to, this.slice);
  }
  getMap() {
    return new H([this.from, this.to - this.from, this.slice.size]);
  }
  invert(e) {
    return new E(this.from, this.from + this.slice.size, e.slice(this.from, this.to));
  }
  map(e) {
    let t = e.mapResult(this.to, -1), n = this.from == this.to && E.MAP_BIAS < 0 ? t : e.mapResult(this.from, 1);
    return n.deletedAcross && t.deletedAcross ? null : new E(n.pos, Math.max(n.pos, t.pos), this.slice, this.structure);
  }
  merge(e) {
    if (!(e instanceof E) || e.structure || this.structure)
      return null;
    if (this.from + this.slice.size == e.from && !this.slice.openEnd && !e.slice.openStart) {
      let t = this.slice.size + e.slice.size == 0 ? b.empty : new b(this.slice.content.append(e.slice.content), this.slice.openStart, e.slice.openEnd);
      return new E(this.from, this.to + (e.to - e.from), t, this.structure);
    } else if (e.to == this.from && !this.slice.openStart && !e.slice.openEnd) {
      let t = this.slice.size + e.slice.size == 0 ? b.empty : new b(e.slice.content.append(this.slice.content), e.slice.openStart, this.slice.openEnd);
      return new E(e.from, this.to, t, this.structure);
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
  static fromJSON(e, t) {
    if (typeof t.from != "number" || typeof t.to != "number")
      throw new RangeError("Invalid input for ReplaceStep.fromJSON");
    return new E(t.from, t.to, b.fromJSON(e, t.slice), !!t.structure);
  }
}
E.MAP_BIAS = 1;
W.jsonID("replace", E);
class B extends W {
  /**
  Create a replace-around step with the given range and gap.
  `insert` should be the point in the slice into which the content
  of the gap should be moved. `structure` has the same meaning as
  it has in the [`ReplaceStep`](https://prosemirror.net/docs/ref/#transform.ReplaceStep) class.
  */
  constructor(e, t, n, i, s, o, l = !1) {
    super(), this.from = e, this.to = t, this.gapFrom = n, this.gapTo = i, this.slice = s, this.insert = o, this.structure = l;
  }
  apply(e) {
    if (this.structure && (fn(e, this.from, this.gapFrom) || fn(e, this.gapTo, this.to)))
      return D.fail("Structure gap-replace would overwrite content");
    let t = e.slice(this.gapFrom, this.gapTo);
    if (t.openStart || t.openEnd)
      return D.fail("Gap is not a flat range");
    let n = this.slice.insertAt(this.insert, t.content);
    return n ? D.fromReplace(e, this.from, this.to, n) : D.fail("Content does not fit in gap");
  }
  getMap() {
    return new H([
      this.from,
      this.gapFrom - this.from,
      this.insert,
      this.gapTo,
      this.to - this.gapTo,
      this.slice.size - this.insert
    ]);
  }
  invert(e) {
    let t = this.gapTo - this.gapFrom;
    return new B(this.from, this.from + this.slice.size + t, this.from + this.insert, this.from + this.insert + t, e.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure);
  }
  map(e) {
    let t = e.mapResult(this.from, 1), n = e.mapResult(this.to, -1), i = this.from == this.gapFrom ? t.pos : e.map(this.gapFrom, -1), s = this.to == this.gapTo ? n.pos : e.map(this.gapTo, 1);
    return t.deletedAcross && n.deletedAcross || i < t.pos || s > n.pos ? null : new B(t.pos, n.pos, i, s, this.slice, this.insert, this.structure);
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
  static fromJSON(e, t) {
    if (typeof t.from != "number" || typeof t.to != "number" || typeof t.gapFrom != "number" || typeof t.gapTo != "number" || typeof t.insert != "number")
      throw new RangeError("Invalid input for ReplaceAroundStep.fromJSON");
    return new B(t.from, t.to, t.gapFrom, t.gapTo, b.fromJSON(e, t.slice), t.insert, !!t.structure);
  }
}
W.jsonID("replaceAround", B);
function fn(r, e, t) {
  let n = r.resolve(e), i = t - e, s = n.depth;
  for (; i > 0 && s > 0 && n.indexAfter(s) == n.node(s).childCount; )
    s--, i--;
  if (i > 0) {
    let o = n.node(s).maybeChild(n.indexAfter(s));
    for (; i > 0; ) {
      if (!o || o.isLeaf)
        return !0;
      o = o.firstChild, i--;
    }
  }
  return !1;
}
function $s(r, e, t, n) {
  let i = [], s = [], o, l;
  r.doc.nodesBetween(e, t, (a, c, f) => {
    if (!a.isInline)
      return;
    let h = a.marks;
    if (!n.isInSet(h) && f.type.allowsMarkType(n.type)) {
      let d = Math.max(c, e), u = Math.min(c + a.nodeSize, t), p = n.addToSet(h);
      for (let m = 0; m < h.length; m++)
        h[m].isInSet(p) || (o && o.to == d && o.mark.eq(h[m]) ? o.to = u : i.push(o = new te(d, u, h[m])));
      l && l.to == d ? l.to = u : s.push(l = new pe(d, u, n));
    }
  }), i.forEach((a) => r.step(a)), s.forEach((a) => r.step(a));
}
function Ks(r, e, t, n) {
  let i = [], s = 0;
  r.doc.nodesBetween(e, t, (o, l) => {
    if (!o.isInline)
      return;
    s++;
    let a = null;
    if (n instanceof Ft) {
      let c = o.marks, f;
      for (; f = n.isInSet(c); )
        (a || (a = [])).push(f), c = f.removeFromSet(c);
    } else n ? n.isInSet(o.marks) && (a = [n]) : a = o.marks;
    if (a && a.length) {
      let c = Math.min(l + o.nodeSize, t);
      for (let f = 0; f < a.length; f++) {
        let h = a[f], d;
        for (let u = 0; u < i.length; u++) {
          let p = i[u];
          p.step == s - 1 && h.eq(i[u].style) && (d = p);
        }
        d ? (d.to = c, d.step = s) : i.push({ style: h, from: Math.max(l, e), to: c, step: s });
      }
    }
  }), i.forEach((o) => r.step(new te(o.from, o.to, o.style)));
}
function On(r, e, t, n = t.contentMatch, i = !0) {
  let s = r.doc.nodeAt(e), o = [], l = e + 1;
  for (let a = 0; a < s.childCount; a++) {
    let c = s.child(a), f = l + c.nodeSize, h = n.matchType(c.type);
    if (!h)
      o.push(new E(l, f, b.empty));
    else {
      n = h;
      for (let d = 0; d < c.marks.length; d++)
        t.allowsMarkType(c.marks[d].type) || r.step(new te(l, f, c.marks[d]));
      if (i && c.isText && t.whitespace != "pre") {
        let d, u = /\r?\n|\r/g, p;
        for (; d = u.exec(c.text); )
          p || (p = new b(y.from(t.schema.text(" ", t.allowedMarks(c.marks))), 0, 0)), o.push(new E(l + d.index, l + d.index + d[0].length, p));
      }
    }
    l = f;
  }
  if (!n.validEnd) {
    let a = n.fillBefore(y.empty, !0);
    r.replace(l, l, new b(a, 0, 0));
  }
  for (let a = o.length - 1; a >= 0; a--)
    r.step(o[a]);
}
function Hs(r, e, t) {
  return (e == 0 || r.canReplace(e, r.childCount)) && (t == r.childCount || r.canReplace(0, t));
}
function Vt(r) {
  let t = r.parent.content.cutByIndex(r.startIndex, r.endIndex);
  for (let n = r.depth, i = 0, s = 0; ; --n) {
    let o = r.$from.node(n), l = r.$from.index(n) + i, a = r.$to.indexAfter(n) - s;
    if (n < r.depth && o.canReplace(l, a, t))
      return n;
    if (n == 0 || o.type.spec.isolating || !Hs(o, l, a))
      break;
    l && (i = 1), a < o.childCount && (s = 1);
  }
  return null;
}
function _s(r, e, t) {
  let { $from: n, $to: i, depth: s } = e, o = n.before(s + 1), l = i.after(s + 1), a = o, c = l, f = y.empty, h = 0;
  for (let p = s, m = !1; p > t; p--)
    m || n.index(p) > 0 ? (m = !0, f = y.from(n.node(p).copy(f)), h++) : a--;
  let d = y.empty, u = 0;
  for (let p = s, m = !1; p > t; p--)
    m || i.after(p + 1) < i.end(p) ? (m = !0, d = y.from(i.node(p).copy(d)), u++) : c++;
  r.step(new B(a, c, o, l, new b(f.append(d), h, u), f.size - h, !0));
}
function pi(r, e, t = null, n = r) {
  let i = Us(r, e), s = i && js(n, e);
  return s ? i.map(Xn).concat({ type: e, attrs: t }).concat(s.map(Xn)) : null;
}
function Xn(r) {
  return { type: r, attrs: null };
}
function Us(r, e) {
  let { parent: t, startIndex: n, endIndex: i } = r, s = t.contentMatchAt(n).findWrapping(e);
  if (!s)
    return null;
  let o = s.length ? s[0] : e;
  return t.canReplaceWith(n, i, o) ? s : null;
}
function js(r, e) {
  let { parent: t, startIndex: n, endIndex: i } = r, s = t.child(n), o = e.contentMatch.findWrapping(s.type);
  if (!o)
    return null;
  let a = (o.length ? o[o.length - 1] : e).contentMatch;
  for (let c = n; a && c < i; c++)
    a = a.matchType(t.child(c).type);
  return !a || !a.validEnd ? null : o;
}
function Gs(r, e, t) {
  let n = y.empty;
  for (let o = t.length - 1; o >= 0; o--) {
    if (n.size) {
      let l = t[o].type.contentMatch.matchFragment(n);
      if (!l || !l.validEnd)
        throw new RangeError("Wrapper type given to Transform.wrap does not form valid content of its parent wrapper");
    }
    n = y.from(t[o].type.create(t[o].attrs, n));
  }
  let i = e.start, s = e.end;
  r.step(new B(i, s, i, s, new b(n, 0, 0), t.length, !0));
}
function Ys(r, e, t, n, i) {
  if (!n.isTextblock)
    throw new RangeError("Type given to setBlockType should be a textblock");
  let s = r.steps.length;
  r.doc.nodesBetween(e, t, (o, l) => {
    let a = typeof i == "function" ? i(o) : i;
    if (o.isTextblock && !o.hasMarkup(n, a) && Xs(r.doc, r.mapping.slice(s).map(l), n)) {
      let c = null;
      if (n.schema.linebreakReplacement) {
        let u = n.whitespace == "pre", p = !!n.contentMatch.matchType(n.schema.linebreakReplacement);
        u && !p ? c = !1 : !u && p && (c = !0);
      }
      c === !1 && gi(r, o, l, s), On(r, r.mapping.slice(s).map(l, 1), n, void 0, c === null);
      let f = r.mapping.slice(s), h = f.map(l, 1), d = f.map(l + o.nodeSize, 1);
      return r.step(new B(h, d, h + 1, d - 1, new b(y.from(n.create(a, null, o.marks)), 0, 0), 1, !0)), c === !0 && mi(r, o, l, s), !1;
    }
  });
}
function mi(r, e, t, n) {
  e.forEach((i, s) => {
    if (i.isText) {
      let o, l = /\r?\n|\r/g;
      for (; o = l.exec(i.text); ) {
        let a = r.mapping.slice(n).map(t + 1 + s + o.index);
        r.replaceWith(a, a + 1, e.type.schema.linebreakReplacement.create());
      }
    }
  });
}
function gi(r, e, t, n) {
  e.forEach((i, s) => {
    if (i.type == i.type.schema.linebreakReplacement) {
      let o = r.mapping.slice(n).map(t + 1 + s);
      r.replaceWith(o, o + 1, e.type.schema.text(`
`));
    }
  });
}
function Xs(r, e, t) {
  let n = r.resolve(e), i = n.index();
  return n.parent.canReplaceWith(i, i + 1, t);
}
function Zs(r, e, t, n, i) {
  let s = r.doc.nodeAt(e);
  if (!s)
    throw new RangeError("No node at given position");
  t || (t = s.type);
  let o = t.create(n, null, i || s.marks);
  if (s.isLeaf)
    return r.replaceWith(e, e + s.nodeSize, o);
  if (!t.validContent(s.content))
    throw new RangeError("Invalid content for node type " + t.name);
  r.step(new B(e, e + s.nodeSize, e + 1, e + s.nodeSize - 1, new b(y.from(o), 0, 0), 1, !0));
}
function We(r, e, t = 1, n) {
  let i = r.resolve(e), s = i.depth - t, o = n && n[n.length - 1] || i.parent;
  if (s < 0 || i.parent.type.spec.isolating || !i.parent.canReplace(i.index(), i.parent.childCount) || !o.type.validContent(i.parent.content.cutByIndex(i.index(), i.parent.childCount)))
    return !1;
  for (let c = i.depth - 1, f = t - 2; c > s; c--, f--) {
    let h = i.node(c), d = i.index(c);
    if (h.type.spec.isolating)
      return !1;
    let u = h.content.cutByIndex(d, h.childCount), p = n && n[f + 1];
    p && (u = u.replaceChild(0, p.type.create(p.attrs)));
    let m = n && n[f] || h;
    if (!h.canReplace(d + 1, h.childCount) || !m.type.validContent(u))
      return !1;
  }
  let l = i.indexAfter(s), a = n && n[0];
  return i.node(s).canReplaceWith(l, l, a ? a.type : i.node(s + 1).type);
}
function Qs(r, e, t = 1, n) {
  let i = r.doc.resolve(e), s = y.empty, o = y.empty;
  for (let l = i.depth, a = i.depth - t, c = t - 1; l > a; l--, c--) {
    s = y.from(i.node(l).copy(s));
    let f = n && n[c];
    o = y.from(f ? f.type.create(f.attrs, o) : i.node(l).copy(o));
  }
  r.step(new E(e, e, new b(s.append(o), t, t), !0));
}
function Nn(r, e) {
  let t = r.resolve(e), n = t.index();
  return to(t.nodeBefore, t.nodeAfter) && t.parent.canReplace(n, n + 1);
}
function eo(r, e) {
  e.content.size || r.type.compatibleContent(e.type);
  let t = r.contentMatchAt(r.childCount), { linebreakReplacement: n } = r.type.schema;
  for (let i = 0; i < e.childCount; i++) {
    let s = e.child(i), o = s.type == n ? r.type.schema.nodes.text : s.type;
    if (t = t.matchType(o), !t || !r.type.allowsMarks(s.marks))
      return !1;
  }
  return t.validEnd;
}
function to(r, e) {
  return !!(r && e && !r.isLeaf && eo(r, e));
}
function no(r, e, t) {
  let n = null, { linebreakReplacement: i } = r.doc.type.schema, s = r.doc.resolve(e - t), o = s.node().type;
  if (i && o.inlineContent) {
    let f = o.whitespace == "pre", h = !!o.contentMatch.matchType(i);
    f && !h ? n = !1 : !f && h && (n = !0);
  }
  let l = r.steps.length;
  if (n === !1) {
    let f = r.doc.resolve(e + t);
    gi(r, f.node(), f.before(), l);
  }
  o.inlineContent && On(r, e + t - 1, o, s.node().contentMatchAt(s.index()), n == null);
  let a = r.mapping.slice(l), c = a.map(e - t);
  if (r.step(new E(c, a.map(e + t, -1), b.empty, !0)), n === !0) {
    let f = r.doc.resolve(c);
    mi(r, f.node(), f.before(), r.steps.length);
  }
  return r;
}
function ro(r, e, t) {
  let n = r.resolve(e);
  if (n.parent.canReplaceWith(n.index(), n.index(), t))
    return e;
  if (n.parentOffset == 0)
    for (let i = n.depth - 1; i >= 0; i--) {
      let s = n.index(i);
      if (n.node(i).canReplaceWith(s, s, t))
        return n.before(i + 1);
      if (s > 0)
        return null;
    }
  if (n.parentOffset == n.parent.content.size)
    for (let i = n.depth - 1; i >= 0; i--) {
      let s = n.indexAfter(i);
      if (n.node(i).canReplaceWith(s, s, t))
        return n.after(i + 1);
      if (s < n.node(i).childCount)
        return null;
    }
  return null;
}
function io(r, e, t) {
  let n = r.resolve(e);
  if (!t.content.size)
    return e;
  let i = t.content;
  for (let s = 0; s < t.openStart; s++)
    i = i.firstChild.content;
  for (let s = 1; s <= (t.openStart == 0 && t.size ? 2 : 1); s++)
    for (let o = n.depth; o >= 0; o--) {
      let l = o == n.depth ? 0 : n.pos <= (n.start(o + 1) + n.end(o + 1)) / 2 ? -1 : 1, a = n.index(o) + (l > 0 ? 1 : 0), c = n.node(o), f = !1;
      if (s == 1)
        f = c.canReplace(a, a, i);
      else {
        let h = c.contentMatchAt(a).findWrapping(i.firstChild.type);
        f = h && c.canReplaceWith(a, a, h[0]);
      }
      if (f)
        return l == 0 ? n.pos : l < 0 ? n.before(o + 1) : n.after(o + 1);
    }
  return null;
}
function wn(r, e, t = e, n = b.empty) {
  if (e == t && !n.size)
    return null;
  let i = r.resolve(e), s = r.resolve(t);
  return yi(i, s, n) ? new E(e, t, n) : new so(i, s, n).fit();
}
function yi(r, e, t) {
  return !t.openStart && !t.openEnd && r.start() == e.start() && r.parent.canReplace(r.index(), e.index(), t.content);
}
class so {
  constructor(e, t, n) {
    this.$from = e, this.$to = t, this.unplaced = n, this.frontier = [], this.placed = y.empty;
    for (let i = 0; i <= e.depth; i++) {
      let s = e.node(i);
      this.frontier.push({
        type: s.type,
        match: s.contentMatchAt(e.indexAfter(i))
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
    let e = this.mustMoveInline(), t = this.placed.size - this.depth - this.$from.depth, n = this.$from, i = this.close(e < 0 ? this.$to : n.doc.resolve(e));
    if (!i)
      return null;
    let s = this.placed, o = n.depth, l = i.depth;
    for (; o && l && s.childCount == 1; )
      s = s.firstChild.content, o--, l--;
    let a = new b(s, o, l);
    return e > -1 ? new B(n.pos, e, this.$to.pos, this.$to.end(), a, t) : a.size || n.pos != this.$to.pos ? new E(n.pos, i.pos, a) : null;
  }
  // Find a position on the start spine of `this.unplaced` that has
  // content that can be moved somewhere on the frontier. Returns two
  // depths, one for the slice and one for the frontier.
  findFittable() {
    let e = this.unplaced.openStart;
    for (let t = this.unplaced.content, n = 0, i = this.unplaced.openEnd; n < e; n++) {
      let s = t.firstChild;
      if (t.childCount > 1 && (i = 0), s.type.spec.isolating && i <= n) {
        e = n;
        break;
      }
      t = s.content;
    }
    for (let t = 1; t <= 2; t++)
      for (let n = t == 1 ? e : this.unplaced.openStart; n >= 0; n--) {
        let i, s = null;
        n ? (s = Ht(this.unplaced.content, n - 1).firstChild, i = s.content) : i = this.unplaced.content;
        let o = i.firstChild;
        for (let l = this.depth; l >= 0; l--) {
          let { type: a, match: c } = this.frontier[l], f, h = null;
          if (t == 1 && (o ? c.matchType(o.type) || (h = c.fillBefore(y.from(o), !1)) : s && a.compatibleContent(s.type)))
            return { sliceDepth: n, frontierDepth: l, parent: s, inject: h };
          if (t == 2 && o && (f = c.findWrapping(o.type)))
            return { sliceDepth: n, frontierDepth: l, parent: s, wrap: f };
          if (s && c.matchType(s.type))
            break;
        }
      }
  }
  openMore() {
    let { content: e, openStart: t, openEnd: n } = this.unplaced, i = Ht(e, t);
    return !i.childCount || i.firstChild.isLeaf ? !1 : (this.unplaced = new b(e, t + 1, Math.max(n, i.size + t >= e.size - n ? t + 1 : 0)), !0);
  }
  dropNode() {
    let { content: e, openStart: t, openEnd: n } = this.unplaced, i = Ht(e, t);
    if (i.childCount <= 1 && t > 0) {
      let s = e.size - t <= t + i.size;
      this.unplaced = new b(Ye(e, t - 1, 1), t - 1, s ? t - 1 : n);
    } else
      this.unplaced = new b(Ye(e, t, 1), t, n);
  }
  // Move content from the unplaced slice at `sliceDepth` to the
  // frontier node at `frontierDepth`. Close that frontier node when
  // applicable.
  placeNodes({ sliceDepth: e, frontierDepth: t, parent: n, inject: i, wrap: s }) {
    for (; this.depth > t; )
      this.closeFrontierNode();
    if (s)
      for (let m = 0; m < s.length; m++)
        this.openFrontierNode(s[m]);
    let o = this.unplaced, l = n ? n.content : o.content, a = o.openStart - e, c = 0, f = [], { match: h, type: d } = this.frontier[t];
    if (i) {
      for (let m = 0; m < i.childCount; m++)
        f.push(i.child(m));
      h = h.matchFragment(i);
    }
    let u = l.size + e - (o.content.size - o.openEnd);
    for (; c < l.childCount; ) {
      let m = l.child(c), g = h.matchType(m.type);
      if (!g)
        break;
      c++, (c > 1 || a == 0 || m.content.size) && (h = g, f.push(bi(m.mark(d.allowedMarks(m.marks)), c == 1 ? a : 0, c == l.childCount ? u : -1)));
    }
    let p = c == l.childCount;
    p || (u = -1), this.placed = Xe(this.placed, t, y.from(f)), this.frontier[t].match = h, p && u < 0 && n && n.type == this.frontier[this.depth].type && this.frontier.length > 1 && this.closeFrontierNode();
    for (let m = 0, g = l; m < u; m++) {
      let x = g.lastChild;
      this.frontier.push({ type: x.type, match: x.contentMatchAt(x.childCount) }), g = x.content;
    }
    this.unplaced = p ? e == 0 ? b.empty : new b(Ye(o.content, e - 1, 1), e - 1, u < 0 ? o.openEnd : e - 1) : new b(Ye(o.content, e, c), o.openStart, o.openEnd);
  }
  mustMoveInline() {
    if (!this.$to.parent.isTextblock)
      return -1;
    let e = this.frontier[this.depth], t;
    if (!e.type.isTextblock || !_t(this.$to, this.$to.depth, e.type, e.match, !1) || this.$to.depth == this.depth && (t = this.findCloseLevel(this.$to)) && t.depth == this.depth)
      return -1;
    let { depth: n } = this.$to, i = this.$to.after(n);
    for (; n > 1 && i == this.$to.end(--n); )
      ++i;
    return i;
  }
  findCloseLevel(e) {
    e: for (let t = Math.min(this.depth, e.depth); t >= 0; t--) {
      let { match: n, type: i } = this.frontier[t], s = t < e.depth && e.end(t + 1) == e.pos + (e.depth - (t + 1)), o = _t(e, t, i, n, s);
      if (o) {
        for (let l = t - 1; l >= 0; l--) {
          let { match: a, type: c } = this.frontier[l], f = _t(e, l, c, a, !0);
          if (!f || f.childCount)
            continue e;
        }
        return { depth: t, fit: o, move: s ? e.doc.resolve(e.after(t + 1)) : e };
      }
    }
  }
  close(e) {
    let t = this.findCloseLevel(e);
    if (!t)
      return null;
    for (; this.depth > t.depth; )
      this.closeFrontierNode();
    t.fit.childCount && (this.placed = Xe(this.placed, t.depth, t.fit)), e = t.move;
    for (let n = t.depth + 1; n <= e.depth; n++) {
      let i = e.node(n), s = i.type.contentMatch.fillBefore(i.content, !0, e.index(n));
      this.openFrontierNode(i.type, i.attrs, s);
    }
    return e;
  }
  openFrontierNode(e, t = null, n) {
    let i = this.frontier[this.depth];
    i.match = i.match.matchType(e), this.placed = Xe(this.placed, this.depth, y.from(e.create(t, n))), this.frontier.push({ type: e, match: e.contentMatch });
  }
  closeFrontierNode() {
    let t = this.frontier.pop().match.fillBefore(y.empty, !0);
    t.childCount && (this.placed = Xe(this.placed, this.frontier.length, t));
  }
}
function Ye(r, e, t) {
  return e == 0 ? r.cutByIndex(t, r.childCount) : r.replaceChild(0, r.firstChild.copy(Ye(r.firstChild.content, e - 1, t)));
}
function Xe(r, e, t) {
  return e == 0 ? r.append(t) : r.replaceChild(r.childCount - 1, r.lastChild.copy(Xe(r.lastChild.content, e - 1, t)));
}
function Ht(r, e) {
  for (let t = 0; t < e; t++)
    r = r.firstChild.content;
  return r;
}
function bi(r, e, t) {
  if (e <= 0)
    return r;
  let n = r.content;
  return e > 1 && (n = n.replaceChild(0, bi(n.firstChild, e - 1, n.childCount == 1 ? t - 1 : 0))), e > 0 && (n = r.type.contentMatch.fillBefore(n).append(n), t <= 0 && (n = n.append(r.type.contentMatch.matchFragment(n).fillBefore(y.empty, !0)))), r.copy(n);
}
function _t(r, e, t, n, i) {
  let s = r.node(e), o = i ? r.indexAfter(e) : r.index(e);
  if (o == s.childCount && !t.compatibleContent(s.type))
    return null;
  let l = n.fillBefore(s.content, !0, o);
  return l && !oo(t, s.content, o) ? l : null;
}
function oo(r, e, t) {
  for (let n = t; n < e.childCount; n++)
    if (!r.allowsMarks(e.child(n).marks))
      return !0;
  return !1;
}
function lo(r) {
  return r.spec.defining || r.spec.definingForContent;
}
function ao(r, e, t, n) {
  if (!n.size)
    return r.deleteRange(e, t);
  let i = r.doc.resolve(e), s = r.doc.resolve(t);
  if (yi(i, s, n))
    return r.step(new E(e, t, n));
  let o = ki(i, s);
  o[o.length - 1] == 0 && o.pop();
  let l = -(i.depth + 1);
  o.unshift(l);
  for (let d = i.depth, u = i.pos - 1; d > 0; d--, u--) {
    let p = i.node(d).type.spec;
    if (p.defining || p.definingAsContext || p.isolating)
      break;
    o.indexOf(d) > -1 ? l = d : i.before(d) == u && o.splice(1, 0, -d);
  }
  let a = o.indexOf(l), c = [], f = n.openStart;
  for (let d = n.content, u = 0; ; u++) {
    let p = d.firstChild;
    if (c.push(p), u == n.openStart)
      break;
    d = p.content;
  }
  for (let d = f - 1; d >= 0; d--) {
    let u = c[d], p = lo(u.type);
    if (p && !u.sameMarkup(i.node(Math.abs(l) - 1)))
      f = d;
    else if (p || !u.type.isTextblock)
      break;
  }
  for (let d = n.openStart; d >= 0; d--) {
    let u = (d + f + 1) % (n.openStart + 1), p = c[u];
    if (p)
      for (let m = 0; m < o.length; m++) {
        let g = o[(m + a) % o.length], x = !0;
        g < 0 && (x = !1, g = -g);
        let N = i.node(g - 1), w = i.index(g - 1);
        if (N.canReplaceWith(w, w, p.type, p.marks))
          return r.replace(i.before(g), x ? s.after(g) : t, new b(xi(n.content, 0, n.openStart, u), u, n.openEnd));
      }
  }
  let h = r.steps.length;
  for (let d = o.length - 1; d >= 0 && (r.replace(e, t, n), !(r.steps.length > h)); d--) {
    let u = o[d];
    u < 0 || (e = i.before(u), t = s.after(u));
  }
}
function xi(r, e, t, n, i) {
  if (e < t) {
    let s = r.firstChild;
    r = r.replaceChild(0, s.copy(xi(s.content, e + 1, t, n, s)));
  }
  if (e > n) {
    let s = i.contentMatchAt(0), o = s.fillBefore(r).append(r);
    r = o.append(s.matchFragment(o).fillBefore(y.empty, !0));
  }
  return r;
}
function co(r, e, t, n) {
  if (!n.isInline && e == t && r.doc.resolve(e).parent.content.size) {
    let i = ro(r.doc, e, n.type);
    i != null && (e = t = i);
  }
  r.replaceRange(e, t, new b(y.from(n), 0, 0));
}
function fo(r, e, t) {
  let n = r.doc.resolve(e), i = r.doc.resolve(t);
  if (n.parent.isTextblock && i.parent.isTextblock && n.start() != i.start() && n.parentOffset == 0 && i.parentOffset == 0) {
    let o = n.sharedDepth(t), l = !1;
    for (let a = n.depth; a > o; a--)
      n.node(a).type.spec.isolating && (l = !0);
    for (let a = i.depth; a > o; a--)
      i.node(a).type.spec.isolating && (l = !0);
    if (!l) {
      for (let a = n.depth; a > 0 && e == n.start(a); a--)
        e = n.before(a);
      for (let a = i.depth; a > 0 && t == i.start(a); a--)
        t = i.before(a);
      n = r.doc.resolve(e), i = r.doc.resolve(t);
    }
  }
  let s = ki(n, i);
  for (let o = 0; o < s.length; o++) {
    let l = s[o], a = o == s.length - 1;
    if (a && l == 0 || n.node(l).type.contentMatch.validEnd)
      return r.delete(n.start(l), i.end(l));
    if (l > 0 && (a || n.node(l - 1).canReplace(n.index(l - 1), i.indexAfter(l - 1))))
      return r.delete(n.before(l), i.after(l));
  }
  for (let o = 1; o <= n.depth && o <= i.depth; o++)
    if (e - n.start(o) == n.depth - o && t > n.end(o) && i.end(o) - t != i.depth - o && n.start(o - 1) == i.start(o - 1) && n.node(o - 1).canReplace(n.index(o - 1), i.index(o - 1)))
      return r.delete(n.before(o), t);
  r.delete(e, t);
}
function ki(r, e) {
  let t = [], n = Math.min(r.depth, e.depth);
  for (let i = n; i >= 0; i--) {
    let s = r.start(i);
    if (s < r.pos - (r.depth - i) || e.end(i) > e.pos + (e.depth - i) || r.node(i).type.spec.isolating || e.node(i).type.spec.isolating)
      break;
    (s == e.start(i) || i == r.depth && i == e.depth && r.parent.inlineContent && e.parent.inlineContent && i && e.start(i - 1) == s - 1) && t.push(i);
  }
  return t;
}
class Je extends W {
  /**
  Construct an attribute step.
  */
  constructor(e, t, n) {
    super(), this.pos = e, this.attr = t, this.value = n;
  }
  apply(e) {
    let t = e.nodeAt(this.pos);
    if (!t)
      return D.fail("No node at attribute step's position");
    let n = /* @__PURE__ */ Object.create(null);
    for (let s in t.attrs)
      n[s] = t.attrs[s];
    n[this.attr] = this.value;
    let i = t.type.create(n, null, t.marks);
    return D.fromReplace(e, this.pos, this.pos + 1, new b(y.from(i), 0, t.isLeaf ? 0 : 1));
  }
  getMap() {
    return H.empty;
  }
  invert(e) {
    return new Je(this.pos, this.attr, e.nodeAt(this.pos).attrs[this.attr]);
  }
  map(e) {
    let t = e.mapResult(this.pos, 1);
    return t.deletedAfter ? null : new Je(t.pos, this.attr, this.value);
  }
  toJSON() {
    return { stepType: "attr", pos: this.pos, attr: this.attr, value: this.value };
  }
  static fromJSON(e, t) {
    if (typeof t.pos != "number" || typeof t.attr != "string")
      throw new RangeError("Invalid input for AttrStep.fromJSON");
    return new Je(t.pos, t.attr, t.value);
  }
}
W.jsonID("attr", Je);
class at extends W {
  /**
  Construct an attribute step.
  */
  constructor(e, t) {
    super(), this.attr = e, this.value = t;
  }
  apply(e) {
    let t = /* @__PURE__ */ Object.create(null);
    for (let i in e.attrs)
      t[i] = e.attrs[i];
    t[this.attr] = this.value;
    let n = e.type.create(t, e.content, e.marks);
    return D.ok(n);
  }
  getMap() {
    return H.empty;
  }
  invert(e) {
    return new at(this.attr, e.attrs[this.attr]);
  }
  map(e) {
    return this;
  }
  toJSON() {
    return { stepType: "docAttr", attr: this.attr, value: this.value };
  }
  static fromJSON(e, t) {
    if (typeof t.attr != "string")
      throw new RangeError("Invalid input for DocAttrStep.fromJSON");
    return new at(t.attr, t.value);
  }
}
W.jsonID("docAttr", at);
let $e = class extends Error {
};
$e = function r(e) {
  let t = Error.call(this, e);
  return t.__proto__ = r.prototype, t;
};
$e.prototype = Object.create(Error.prototype);
$e.prototype.constructor = $e;
$e.prototype.name = "TransformError";
class ho {
  /**
  Create a transform that starts with the given document.
  */
  constructor(e) {
    this.doc = e, this.steps = [], this.docs = [], this.mapping = new lt();
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
    let t = this.maybeStep(e);
    if (t.failed)
      throw new $e(t.failed);
    return this;
  }
  /**
  Try to apply a step in this transformation, ignoring it if it
  fails. Returns the step result.
  */
  maybeStep(e) {
    let t = e.apply(this.doc);
    return t.failed || this.addStep(e, t.doc), t;
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
    let e = 1e9, t = -1e9;
    for (let n = 0; n < this.mapping.maps.length; n++) {
      let i = this.mapping.maps[n];
      n && (e = i.map(e, 1), t = i.map(t, -1)), i.forEach((s, o, l, a) => {
        e = Math.min(e, l), t = Math.max(t, a);
      });
    }
    return e == 1e9 ? null : { from: e, to: t };
  }
  /**
  @internal
  */
  addStep(e, t) {
    this.docs.push(this.doc), this.steps.push(e), this.mapping.appendMap(e.getMap()), this.doc = t;
  }
  /**
  Replace the part of the document between `from` and `to` with the
  given `slice`.
  */
  replace(e, t = e, n = b.empty) {
    let i = wn(this.doc, e, t, n);
    return i && this.step(i), this;
  }
  /**
  Replace the given range with the given content, which may be a
  fragment, node, or array of nodes.
  */
  replaceWith(e, t, n) {
    return this.replace(e, t, new b(y.from(n), 0, 0));
  }
  /**
  Delete the content between the given positions.
  */
  delete(e, t) {
    return this.replace(e, t, b.empty);
  }
  /**
  Insert the given content at the given position.
  */
  insert(e, t) {
    return this.replaceWith(e, e, t);
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
  replaceRange(e, t, n) {
    return ao(this, e, t, n), this;
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
  replaceRangeWith(e, t, n) {
    return co(this, e, t, n), this;
  }
  /**
  Delete the given range, expanding it to cover fully covered
  parent nodes until a valid replace is found.
  */
  deleteRange(e, t) {
    return fo(this, e, t), this;
  }
  /**
  Split the content in the given range off from its parent, if there
  is sibling content before or after it, and move it up the tree to
  the depth specified by `target`. You'll probably want to use
  [`liftTarget`](https://prosemirror.net/docs/ref/#transform.liftTarget) to compute `target`, to make
  sure the lift is valid.
  */
  lift(e, t) {
    return _s(this, e, t), this;
  }
  /**
  Join the blocks around the given position. If depth is 2, their
  last and first siblings are also joined, and so on.
  */
  join(e, t = 1) {
    return no(this, e, t), this;
  }
  /**
  Wrap the given [range](https://prosemirror.net/docs/ref/#model.NodeRange) in the given set of wrappers.
  The wrappers are assumed to be valid in this position, and should
  probably be computed with [`findWrapping`](https://prosemirror.net/docs/ref/#transform.findWrapping).
  */
  wrap(e, t) {
    return Gs(this, e, t), this;
  }
  /**
  Set the type of all textblocks (partly) between `from` and `to` to
  the given node type with the given attributes.
  */
  setBlockType(e, t = e, n, i = null) {
    return Ys(this, e, t, n, i), this;
  }
  /**
  Change the type, attributes, and/or marks of the node at `pos`.
  When `type` isn't given, the existing node type is preserved,
  */
  setNodeMarkup(e, t, n = null, i) {
    return Zs(this, e, t, n, i), this;
  }
  /**
  Set a single attribute on a given node to a new value.
  The `pos` addresses the document content. Use `setDocAttribute`
  to set attributes on the document itself.
  */
  setNodeAttribute(e, t, n) {
    return this.step(new Je(e, t, n)), this;
  }
  /**
  Set a single attribute on the document to a new value.
  */
  setDocAttribute(e, t) {
    return this.step(new at(e, t)), this;
  }
  /**
  Add a mark to the node at position `pos`.
  */
  addNodeMark(e, t) {
    return this.step(new me(e, t)), this;
  }
  /**
  Remove a mark (or all marks of the given type) from the node at
  position `pos`.
  */
  removeNodeMark(e, t) {
    let n = this.doc.nodeAt(e);
    if (!n)
      throw new RangeError("No node at position " + e);
    if (t instanceof M)
      t.isInSet(n.marks) && this.step(new Pe(e, t));
    else {
      let i = n.marks, s, o = [];
      for (; s = t.isInSet(i); )
        o.push(new Pe(e, s)), i = s.removeFromSet(i);
      for (let l = o.length - 1; l >= 0; l--)
        this.step(o[l]);
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
  split(e, t = 1, n) {
    return Qs(this, e, t, n), this;
  }
  /**
  Add the given mark to the inline content between `from` and `to`.
  */
  addMark(e, t, n) {
    return $s(this, e, t, n), this;
  }
  /**
  Remove marks from inline nodes between `from` and `to`. When
  `mark` is a single mark, remove precisely that mark. When it is
  a mark type, remove all marks of that type. When it is null,
  remove all marks of any type.
  */
  removeMark(e, t, n) {
    return Ks(this, e, t, n), this;
  }
  /**
  Removes all marks and nodes from the content of the node at
  `pos` that don't match the given new parent node type. Accepts
  an optional starting [content match](https://prosemirror.net/docs/ref/#model.ContentMatch) as
  third argument.
  */
  clearIncompatible(e, t, n) {
    return On(this, e, t, n), this;
  }
}
const Ut = /* @__PURE__ */ Object.create(null);
class C {
  /**
  Initialize a selection with the head and anchor and ranges. If no
  ranges are given, constructs a single range across `$anchor` and
  `$head`.
  */
  constructor(e, t, n) {
    this.$anchor = e, this.$head = t, this.ranges = n || [new uo(e.min(t), e.max(t))];
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
    for (let t = 0; t < e.length; t++)
      if (e[t].$from.pos != e[t].$to.pos)
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
  replace(e, t = b.empty) {
    let n = t.content.lastChild, i = null;
    for (let l = 0; l < t.openEnd; l++)
      i = n, n = n.lastChild;
    let s = e.steps.length, o = this.ranges;
    for (let l = 0; l < o.length; l++) {
      let { $from: a, $to: c } = o[l], f = e.mapping.slice(s);
      e.replaceRange(f.map(a.pos), f.map(c.pos), l ? b.empty : t), l == 0 && er(e, s, (n ? n.isInline : i && i.isTextblock) ? -1 : 1);
    }
  }
  /**
  Replace the selection with the given node, appending the changes
  to the given transaction.
  */
  replaceWith(e, t) {
    let n = e.steps.length, i = this.ranges;
    for (let s = 0; s < i.length; s++) {
      let { $from: o, $to: l } = i[s], a = e.mapping.slice(n), c = a.map(o.pos), f = a.map(l.pos);
      s ? e.deleteRange(c, f) : (e.replaceRangeWith(c, f, t), er(e, n, t.isInline ? -1 : 1));
    }
  }
  /**
  Find a valid cursor or leaf node selection starting at the given
  position and searching back if `dir` is negative, and forward if
  positive. When `textOnly` is true, only consider cursor
  selections. Will return null when no valid selection position is
  found.
  */
  static findFrom(e, t, n = !1) {
    let i = e.parent.inlineContent ? new O(e) : Ve(e.node(0), e.parent, e.pos, e.index(), t, n);
    if (i)
      return i;
    for (let s = e.depth - 1; s >= 0; s--) {
      let o = t < 0 ? Ve(e.node(0), e.node(s), e.before(s + 1), e.index(s), t, n) : Ve(e.node(0), e.node(s), e.after(s + 1), e.index(s) + 1, t, n);
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
  static near(e, t = 1) {
    return this.findFrom(e, t) || this.findFrom(e, -t) || new _(e.node(0));
  }
  /**
  Find the cursor or leaf node selection closest to the start of
  the given document. Will return an
  [`AllSelection`](https://prosemirror.net/docs/ref/#state.AllSelection) if no valid position
  exists.
  */
  static atStart(e) {
    return Ve(e, e, 0, 0, 1) || new _(e);
  }
  /**
  Find the cursor or leaf node selection closest to the end of the
  given document.
  */
  static atEnd(e) {
    return Ve(e, e, e.content.size, e.childCount, -1) || new _(e);
  }
  /**
  Deserialize the JSON representation of a selection. Must be
  implemented for custom classes (as a static class method).
  */
  static fromJSON(e, t) {
    if (!t || !t.type)
      throw new RangeError("Invalid input for Selection.fromJSON");
    let n = Ut[t.type];
    if (!n)
      throw new RangeError(`No selection type ${t.type} defined`);
    return n.fromJSON(e, t);
  }
  /**
  To be able to deserialize selections from JSON, custom selection
  classes must register themselves with an ID string, so that they
  can be disambiguated. Try to pick something that's unlikely to
  clash with classes from other modules.
  */
  static jsonID(e, t) {
    if (e in Ut)
      throw new RangeError("Duplicate use of selection JSON ID " + e);
    return Ut[e] = t, t.prototype.jsonID = e, t;
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
    return O.between(this.$anchor, this.$head).getBookmark();
  }
}
C.prototype.visible = !0;
class uo {
  /**
  Create a range.
  */
  constructor(e, t) {
    this.$from = e, this.$to = t;
  }
}
let Zn = !1;
function Qn(r) {
  !Zn && !r.parent.inlineContent && (Zn = !0, console.warn("TextSelection endpoint not pointing into a node with inline content (" + r.parent.type.name + ")"));
}
class O extends C {
  /**
  Construct a text selection between the given points.
  */
  constructor(e, t = e) {
    Qn(e), Qn(t), super(e, t);
  }
  /**
  Returns a resolved position if this is a cursor selection (an
  empty text selection), and null otherwise.
  */
  get $cursor() {
    return this.$anchor.pos == this.$head.pos ? this.$head : null;
  }
  map(e, t) {
    let n = e.resolve(t.map(this.head));
    if (!n.parent.inlineContent)
      return C.near(n);
    let i = e.resolve(t.map(this.anchor));
    return new O(i.parent.inlineContent ? i : n, n);
  }
  replace(e, t = b.empty) {
    if (super.replace(e, t), t == b.empty) {
      let n = this.$from.marksAcross(this.$to);
      n && e.ensureMarks(n);
    }
  }
  eq(e) {
    return e instanceof O && e.anchor == this.anchor && e.head == this.head;
  }
  getBookmark() {
    return new Lt(this.anchor, this.head);
  }
  toJSON() {
    return { type: "text", anchor: this.anchor, head: this.head };
  }
  /**
  @internal
  */
  static fromJSON(e, t) {
    if (typeof t.anchor != "number" || typeof t.head != "number")
      throw new RangeError("Invalid input for TextSelection.fromJSON");
    return new O(e.resolve(t.anchor), e.resolve(t.head));
  }
  /**
  Create a text selection from non-resolved positions.
  */
  static create(e, t, n = t) {
    let i = e.resolve(t);
    return new this(i, n == t ? i : e.resolve(n));
  }
  /**
  Return a text selection that spans the given positions or, if
  they aren't text positions, find a text selection near them.
  `bias` determines whether the method searches forward (default)
  or backwards (negative number) first. Will fall back to calling
  [`Selection.near`](https://prosemirror.net/docs/ref/#state.Selection^near) when the document
  doesn't contain a valid text position.
  */
  static between(e, t, n) {
    let i = e.pos - t.pos;
    if ((!n || i) && (n = i >= 0 ? 1 : -1), !t.parent.inlineContent) {
      let s = C.findFrom(t, n, !0) || C.findFrom(t, -n, !0);
      if (s)
        t = s.$head;
      else
        return C.near(t, n);
    }
    return e.parent.inlineContent || (i == 0 ? e = t : (e = (C.findFrom(e, -n, !0) || C.findFrom(e, n, !0)).$anchor, e.pos < t.pos != i < 0 && (e = t))), new O(e, t);
  }
}
C.jsonID("text", O);
class Lt {
  constructor(e, t) {
    this.anchor = e, this.head = t;
  }
  map(e) {
    return new Lt(e.map(this.anchor), e.map(this.head));
  }
  resolve(e) {
    return O.between(e.resolve(this.anchor), e.resolve(this.head));
  }
}
class k extends C {
  /**
  Create a node selection. Does not verify the validity of its
  argument.
  */
  constructor(e) {
    let t = e.nodeAfter, n = e.node(0).resolve(e.pos + t.nodeSize);
    super(e, n), this.node = t;
  }
  map(e, t) {
    let { deleted: n, pos: i } = t.mapResult(this.anchor), s = e.resolve(i);
    return n ? C.near(s) : new k(s);
  }
  content() {
    return new b(y.from(this.node), 0, 0);
  }
  eq(e) {
    return e instanceof k && e.anchor == this.anchor;
  }
  toJSON() {
    return { type: "node", anchor: this.anchor };
  }
  getBookmark() {
    return new Dn(this.anchor);
  }
  /**
  @internal
  */
  static fromJSON(e, t) {
    if (typeof t.anchor != "number")
      throw new RangeError("Invalid input for NodeSelection.fromJSON");
    return new k(e.resolve(t.anchor));
  }
  /**
  Create a node selection from non-resolved positions.
  */
  static create(e, t) {
    return new k(e.resolve(t));
  }
  /**
  Determines whether the given node may be selected as a node
  selection.
  */
  static isSelectable(e) {
    return !e.isText && e.type.spec.selectable !== !1;
  }
}
k.prototype.visible = !1;
C.jsonID("node", k);
class Dn {
  constructor(e) {
    this.anchor = e;
  }
  map(e) {
    let { deleted: t, pos: n } = e.mapResult(this.anchor);
    return t ? new Lt(n, n) : new Dn(n);
  }
  resolve(e) {
    let t = e.resolve(this.anchor), n = t.nodeAfter;
    return n && k.isSelectable(n) ? new k(t) : C.near(t);
  }
}
class _ extends C {
  /**
  Create an all-selection over the given document.
  */
  constructor(e) {
    super(e.resolve(0), e.resolve(e.content.size));
  }
  replace(e, t = b.empty) {
    if (t == b.empty) {
      e.delete(0, e.doc.content.size);
      let n = C.atStart(e.doc);
      n.eq(e.selection) || e.setSelection(n);
    } else
      super.replace(e, t);
  }
  toJSON() {
    return { type: "all" };
  }
  /**
  @internal
  */
  static fromJSON(e) {
    return new _(e);
  }
  map(e) {
    return new _(e);
  }
  eq(e) {
    return e instanceof _;
  }
  getBookmark() {
    return po;
  }
}
C.jsonID("all", _);
const po = {
  map() {
    return this;
  },
  resolve(r) {
    return new _(r);
  }
};
function Ve(r, e, t, n, i, s = !1) {
  if (e.inlineContent)
    return O.create(r, t);
  for (let o = n - (i > 0 ? 0 : 1); i > 0 ? o < e.childCount : o >= 0; o += i) {
    let l = e.child(o);
    if (l.isAtom) {
      if (!s && k.isSelectable(l))
        return k.create(r, t - (i < 0 ? l.nodeSize : 0));
    } else {
      let a = Ve(r, l, t + i, i < 0 ? l.childCount : 0, i, s);
      if (a)
        return a;
    }
    t += l.nodeSize * i;
  }
  return null;
}
function er(r, e, t) {
  let n = r.steps.length - 1;
  if (n < e)
    return;
  let i = r.steps[n];
  if (!(i instanceof E || i instanceof B))
    return;
  let s = r.mapping.maps[n], o;
  s.forEach((l, a, c, f) => {
    o == null && (o = f);
  }), r.setSelection(C.near(r.doc.resolve(o), t));
}
const tr = 1, St = 2, nr = 4;
class mo extends ho {
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
    return this.curSelection = e, this.curSelectionFor = this.steps.length, this.updated = (this.updated | tr) & ~St, this.storedMarks = null, this;
  }
  /**
  Whether the selection was explicitly updated by this transaction.
  */
  get selectionSet() {
    return (this.updated & tr) > 0;
  }
  /**
  Set the current stored marks.
  */
  setStoredMarks(e) {
    return this.storedMarks = e, this.updated |= St, this;
  }
  /**
  Make sure the current stored marks or, if that is null, the marks
  at the selection, match the given set of marks. Does nothing if
  this is already the case.
  */
  ensureMarks(e) {
    return M.sameSet(this.storedMarks || this.selection.$from.marks(), e) || this.setStoredMarks(e), this;
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
    return (this.updated & St) > 0;
  }
  /**
  @internal
  */
  addStep(e, t) {
    super.addStep(e, t), this.updated = this.updated & ~St, this.storedMarks = null;
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
  replaceSelectionWith(e, t = !0) {
    let n = this.selection;
    return t && (e = e.mark(this.storedMarks || (n.empty ? n.$from.marks() : n.$from.marksAcross(n.$to) || M.none))), n.replaceWith(this, e), this;
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
  insertText(e, t, n) {
    let i = this.doc.type.schema;
    if (t == null)
      return e ? this.replaceSelectionWith(i.text(e), !0) : this.deleteSelection();
    {
      if (n == null && (n = t), !e)
        return this.deleteRange(t, n);
      let s = this.storedMarks;
      if (!s) {
        let o = this.doc.resolve(t);
        s = n == t ? o.marks() : o.marksAcross(this.doc.resolve(n));
      }
      return this.replaceRangeWith(t, n, i.text(e, s)), !this.selection.empty && this.selection.to == t + e.length && this.setSelection(C.near(this.selection.$to)), this;
    }
  }
  /**
  Store a metadata property in this transaction, keyed either by
  name or by plugin.
  */
  setMeta(e, t) {
    return this.meta[typeof e == "string" ? e : e.key] = t, this;
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
    return this.updated |= nr, this;
  }
  /**
  True when this transaction has had `scrollIntoView` called on it.
  */
  get scrolledIntoView() {
    return (this.updated & nr) > 0;
  }
}
function rr(r, e) {
  return !e || !r ? r : r.bind(e);
}
class Ze {
  constructor(e, t, n) {
    this.name = e, this.init = rr(t.init, n), this.apply = rr(t.apply, n);
  }
}
const go = [
  new Ze("doc", {
    init(r) {
      return r.doc || r.schema.topNodeType.createAndFill();
    },
    apply(r) {
      return r.doc;
    }
  }),
  new Ze("selection", {
    init(r, e) {
      return r.selection || C.atStart(e.doc);
    },
    apply(r) {
      return r.selection;
    }
  }),
  new Ze("storedMarks", {
    init(r) {
      return r.storedMarks || null;
    },
    apply(r, e, t, n) {
      return n.selection.$cursor ? r.storedMarks : null;
    }
  }),
  new Ze("scrollToSelection", {
    init() {
      return 0;
    },
    apply(r, e) {
      return r.scrolledIntoView ? e + 1 : e;
    }
  })
];
class jt {
  constructor(e, t) {
    this.schema = e, this.plugins = [], this.pluginsByKey = /* @__PURE__ */ Object.create(null), this.fields = go.slice(), t && t.forEach((n) => {
      if (this.pluginsByKey[n.key])
        throw new RangeError("Adding different instances of a keyed plugin (" + n.key + ")");
      this.plugins.push(n), this.pluginsByKey[n.key] = n, n.spec.state && this.fields.push(new Ze(n.key, n.spec.state, n));
    });
  }
}
class Oe {
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
  filterTransaction(e, t = -1) {
    for (let n = 0; n < this.config.plugins.length; n++)
      if (n != t) {
        let i = this.config.plugins[n];
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
    let t = [e], n = this.applyInner(e), i = null;
    for (; ; ) {
      let s = !1;
      for (let o = 0; o < this.config.plugins.length; o++) {
        let l = this.config.plugins[o];
        if (l.spec.appendTransaction) {
          let a = i ? i[o].n : 0, c = i ? i[o].state : this, f = a < t.length && l.spec.appendTransaction.call(l, a ? t.slice(a) : t, c, n);
          if (f && n.filterTransaction(f, o)) {
            if (f.setMeta("appendedTransaction", e), !i) {
              i = [];
              for (let h = 0; h < this.config.plugins.length; h++)
                i.push(h < o ? { state: n, n: t.length } : { state: this, n: 0 });
            }
            t.push(f), n = n.applyInner(f), s = !0;
          }
          i && (i[o] = { state: n, n: t.length });
        }
      }
      if (!s)
        return { state: n, transactions: t };
    }
  }
  /**
  @internal
  */
  applyInner(e) {
    if (!e.before.eq(this.doc))
      throw new RangeError("Applying a mismatched transaction");
    let t = new Oe(this.config), n = this.config.fields;
    for (let i = 0; i < n.length; i++) {
      let s = n[i];
      t[s.name] = s.apply(e, this[s.name], this, t);
    }
    return t;
  }
  /**
  Accessor that constructs and returns a new [transaction](https://prosemirror.net/docs/ref/#state.Transaction) from this state.
  */
  get tr() {
    return new mo(this);
  }
  /**
  Create a new state.
  */
  static create(e) {
    let t = new jt(e.doc ? e.doc.type.schema : e.schema, e.plugins), n = new Oe(t);
    for (let i = 0; i < t.fields.length; i++)
      n[t.fields[i].name] = t.fields[i].init(e, n);
    return n;
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
    let t = new jt(this.schema, e.plugins), n = t.fields, i = new Oe(t);
    for (let s = 0; s < n.length; s++) {
      let o = n[s].name;
      i[o] = this.hasOwnProperty(o) ? this[o] : n[s].init(e, i);
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
    let t = { doc: this.doc.toJSON(), selection: this.selection.toJSON() };
    if (this.storedMarks && (t.storedMarks = this.storedMarks.map((n) => n.toJSON())), e && typeof e == "object")
      for (let n in e) {
        if (n == "doc" || n == "selection")
          throw new RangeError("The JSON fields `doc` and `selection` are reserved");
        let i = e[n], s = i.spec.state;
        s && s.toJSON && (t[n] = s.toJSON.call(i, this[i.key]));
      }
    return t;
  }
  /**
  Deserialize a JSON representation of a state. `config` should
  have at least a `schema` field, and should contain array of
  plugins to initialize the state with. `pluginFields` can be used
  to deserialize the state of plugins, by associating plugin
  instances with the property names they use in the JSON object.
  */
  static fromJSON(e, t, n) {
    if (!t)
      throw new RangeError("Invalid input for EditorState.fromJSON");
    if (!e.schema)
      throw new RangeError("Required config field 'schema' missing");
    let i = new jt(e.schema, e.plugins), s = new Oe(i);
    return i.fields.forEach((o) => {
      if (o.name == "doc")
        s.doc = ne.fromJSON(e.schema, t.doc);
      else if (o.name == "selection")
        s.selection = C.fromJSON(s.doc, t.selection);
      else if (o.name == "storedMarks")
        t.storedMarks && (s.storedMarks = t.storedMarks.map(e.schema.markFromJSON));
      else {
        if (n)
          for (let l in n) {
            let a = n[l], c = a.spec.state;
            if (a.key == o.name && c && c.fromJSON && Object.prototype.hasOwnProperty.call(t, l)) {
              s[o.name] = c.fromJSON.call(a, e, t[l], s);
              return;
            }
          }
        s[o.name] = o.init(e, s);
      }
    }), s;
  }
}
function Si(r, e, t) {
  for (let n in r) {
    let i = r[n];
    i instanceof Function ? i = i.bind(e) : n == "handleDOMEvents" && (i = Si(i, e, {})), t[n] = i;
  }
  return t;
}
class Ci {
  /**
  Create a plugin.
  */
  constructor(e) {
    this.spec = e, this.props = {}, e.props && Si(e.props, this, this.props), this.key = e.key ? e.key.key : Mi("plugin");
  }
  /**
  Extract the plugin's state field from an editor state.
  */
  getState(e) {
    return e[this.key];
  }
}
const Gt = /* @__PURE__ */ Object.create(null);
function Mi(r) {
  return r in Gt ? r + "$" + ++Gt[r] : (Gt[r] = 0, r + "$");
}
class Oi {
  /**
  Create a plugin key.
  */
  constructor(e = "key") {
    this.key = Mi(e);
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
const P = function(r) {
  for (var e = 0; ; e++)
    if (r = r.previousSibling, !r)
      return e;
}, Ke = function(r) {
  let e = r.assignedSlot || r.parentNode;
  return e && e.nodeType == 11 ? e.host : e;
};
let hn = null;
const se = function(r, e, t) {
  let n = hn || (hn = document.createRange());
  return n.setEnd(r, t ?? r.nodeValue.length), n.setStart(r, e || 0), n;
}, yo = function() {
  hn = null;
}, ve = function(r, e, t, n) {
  return t && (ir(r, e, t, n, -1) || ir(r, e, t, n, 1));
}, bo = /^(img|br|input|textarea|hr)$/i;
function ir(r, e, t, n, i) {
  for (var s; ; ) {
    if (r == t && e == n)
      return !0;
    if (e == (i < 0 ? 0 : j(r))) {
      let o = r.parentNode;
      if (!o || o.nodeType != 1 || dt(r) || bo.test(r.nodeName) || r.contentEditable == "false")
        return !1;
      e = P(r) + (i < 0 ? 0 : 1), r = o;
    } else if (r.nodeType == 1) {
      let o = r.childNodes[e + (i < 0 ? -1 : 0)];
      if (o.nodeType == 1 && o.contentEditable == "false")
        if (!((s = o.pmViewDesc) === null || s === void 0) && s.ignoreForSelection)
          e += i;
        else
          return !1;
      else
        r = o, e = i < 0 ? j(r) : 0;
    } else
      return !1;
  }
}
function j(r) {
  return r.nodeType == 3 ? r.nodeValue.length : r.childNodes.length;
}
function xo(r, e) {
  for (; ; ) {
    if (r.nodeType == 3 && e)
      return r;
    if (r.nodeType == 1 && e > 0) {
      if (r.contentEditable == "false")
        return null;
      r = r.childNodes[e - 1], e = j(r);
    } else if (r.parentNode && !dt(r))
      e = P(r), r = r.parentNode;
    else
      return null;
  }
}
function ko(r, e) {
  for (; ; ) {
    if (r.nodeType == 3 && e < r.nodeValue.length)
      return r;
    if (r.nodeType == 1 && e < r.childNodes.length) {
      if (r.contentEditable == "false")
        return null;
      r = r.childNodes[e], e = 0;
    } else if (r.parentNode && !dt(r))
      e = P(r) + 1, r = r.parentNode;
    else
      return null;
  }
}
function So(r, e, t) {
  for (let n = e == 0, i = e == j(r); n || i; ) {
    if (r == t)
      return !0;
    let s = P(r);
    if (r = r.parentNode, !r)
      return !1;
    n = n && s == 0, i = i && s == j(r);
  }
}
function dt(r) {
  let e;
  for (let t = r; t && !(e = t.pmViewDesc); t = t.parentNode)
    ;
  return e && e.node && e.node.isBlock && (e.dom == r || e.contentDOM == r);
}
const Wt = function(r) {
  return r.focusNode && ve(r.focusNode, r.focusOffset, r.anchorNode, r.anchorOffset);
};
function Me(r, e) {
  let t = document.createEvent("Event");
  return t.initEvent("keydown", !0, !0), t.keyCode = r, t.key = t.code = e, t;
}
function Co(r) {
  let e = r.activeElement;
  for (; e && e.shadowRoot; )
    e = e.shadowRoot.activeElement;
  return e;
}
function Mo(r, e, t) {
  if (r.caretPositionFromPoint)
    try {
      let n = r.caretPositionFromPoint(e, t);
      if (n)
        return { node: n.offsetNode, offset: Math.min(j(n.offsetNode), n.offset) };
    } catch {
    }
  if (r.caretRangeFromPoint) {
    let n = r.caretRangeFromPoint(e, t);
    if (n)
      return { node: n.startContainer, offset: Math.min(j(n.startContainer), n.startOffset) };
  }
}
const re = typeof navigator < "u" ? navigator : null, sr = typeof document < "u" ? document : null, Se = re && re.userAgent || "", dn = /Edge\/(\d+)/.exec(Se), Ni = /MSIE \d/.exec(Se), un = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(Se), K = !!(Ni || un || dn), ge = Ni ? document.documentMode : un ? +un[1] : dn ? +dn[1] : 0, G = !K && /gecko\/(\d+)/i.test(Se);
G && +(/Firefox\/(\d+)/.exec(Se) || [0, 0])[1];
const pn = !K && /Chrome\/(\d+)/.exec(Se), z = !!pn, wi = pn ? +pn[1] : 0, L = !K && !!re && /Apple Computer/.test(re.vendor), He = L && (/Mobile\/\w+/.test(Se) || !!re && re.maxTouchPoints > 2), U = He || (re ? /Mac/.test(re.platform) : !1), Di = re ? /Win/.test(re.platform) : !1, le = /Android \d/.test(Se), ut = !!sr && "webkitFontSmoothing" in sr.documentElement.style, Oo = ut ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0;
function No(r) {
  let e = r.defaultView && r.defaultView.visualViewport;
  return e ? {
    left: 0,
    right: e.width,
    top: 0,
    bottom: e.height
  } : {
    left: 0,
    right: r.documentElement.clientWidth,
    top: 0,
    bottom: r.documentElement.clientHeight
  };
}
function ie(r, e) {
  return typeof r == "number" ? r : r[e];
}
function wo(r) {
  let e = r.getBoundingClientRect(), t = e.width / r.offsetWidth || 1, n = e.height / r.offsetHeight || 1;
  return {
    left: e.left,
    right: e.left + r.clientWidth * t,
    top: e.top,
    bottom: e.top + r.clientHeight * n
  };
}
function or(r, e, t) {
  if (!mn(e) && e.left == 0)
    return;
  let n = r.someProp("scrollThreshold") || 0, i = r.someProp("scrollMargin") || 5, s = r.dom.ownerDocument;
  for (let o = t || r.dom; o; ) {
    if (o.nodeType != 1) {
      o = Ke(o);
      continue;
    }
    let l = o, a = l == s.body, c = a ? No(s) : wo(l), f = 0, h = 0;
    if (e.top < c.top + ie(n, "top") ? h = -(c.top - e.top + ie(i, "top")) : e.bottom > c.bottom - ie(n, "bottom") && (h = e.bottom - e.top > c.bottom - c.top ? e.top + ie(i, "top") - c.top : e.bottom - c.bottom + ie(i, "bottom")), e.left < c.left + ie(n, "left") ? f = -(c.left - e.left + ie(i, "left")) : e.right > c.right - ie(n, "right") && (f = e.right - c.right + ie(i, "right")), f || h)
      if (a)
        s.defaultView.scrollBy(f, h);
      else {
        let u = l.scrollLeft, p = l.scrollTop;
        h && (l.scrollTop += h), f && (l.scrollLeft += f);
        let m = l.scrollLeft - u, g = l.scrollTop - p;
        e = { left: e.left - m, top: e.top - g, right: e.right - m, bottom: e.bottom - g };
      }
    let d = a ? "fixed" : getComputedStyle(o).position;
    if (/^(fixed|sticky)$/.test(d))
      break;
    o = d == "absolute" ? o.offsetParent : Ke(o);
  }
}
function Do(r) {
  let e = r.dom.getBoundingClientRect(), t = Math.max(0, e.top), n, i;
  for (let s = (e.left + e.right) / 2, o = t + 1; o < Math.min(innerHeight, e.bottom); o += 5) {
    let l = r.root.elementFromPoint(s, o);
    if (!l || l == r.dom || !r.dom.contains(l))
      continue;
    let a = l.getBoundingClientRect();
    if (a.top >= t - 20) {
      n = l, i = a.top;
      break;
    }
  }
  return { refDOM: n, refTop: i, stack: Ti(r.dom) };
}
function Ti(r) {
  let e = [], t = r.ownerDocument;
  for (let n = r; n && (e.push({ dom: n, top: n.scrollTop, left: n.scrollLeft }), r != t); n = Ke(n))
    ;
  return e;
}
function To({ refDOM: r, refTop: e, stack: t }) {
  let n = r ? r.getBoundingClientRect().top : 0;
  Ei(t, n == 0 ? 0 : n - e);
}
function Ei(r, e) {
  for (let t = 0; t < r.length; t++) {
    let { dom: n, top: i, left: s } = r[t];
    n.scrollTop != i + e && (n.scrollTop = i + e), n.scrollLeft != s && (n.scrollLeft = s);
  }
}
let Be = null;
function Eo(r) {
  if (r.setActive)
    return r.setActive();
  if (Be)
    return r.focus(Be);
  let e = Ti(r);
  r.focus(Be == null ? {
    get preventScroll() {
      return Be = { preventScroll: !0 }, !0;
    }
  } : void 0), Be || (Be = !1, Ei(e, 0));
}
function Ai(r, e) {
  let t, n = 2e8, i, s = 0, o = e.top, l = e.top, a, c;
  for (let f = r.firstChild, h = 0; f; f = f.nextSibling, h++) {
    let d;
    if (f.nodeType == 1)
      d = f.getClientRects();
    else if (f.nodeType == 3)
      d = se(f).getClientRects();
    else
      continue;
    for (let u = 0; u < d.length; u++) {
      let p = d[u];
      if (p.top <= o && p.bottom >= l) {
        o = Math.max(p.bottom, o), l = Math.min(p.top, l);
        let m = p.left > e.left ? p.left - e.left : p.right < e.left ? e.left - p.right : 0;
        if (m < n) {
          t = f, n = m, i = m && t.nodeType == 3 ? {
            left: p.right < e.left ? p.right : p.left,
            top: e.top
          } : e, f.nodeType == 1 && m && (s = h + (e.left >= (p.left + p.right) / 2 ? 1 : 0));
          continue;
        }
      } else p.top > e.top && !a && p.left <= e.left && p.right >= e.left && (a = f, c = { left: Math.max(p.left, Math.min(p.right, e.left)), top: p.top });
      !t && (e.left >= p.right && e.top >= p.top || e.left >= p.left && e.top >= p.bottom) && (s = h + 1);
    }
  }
  return !t && a && (t = a, i = c, n = 0), t && t.nodeType == 3 ? Ao(t, i) : !t || n && t.nodeType == 1 ? { node: r, offset: s } : Ai(t, i);
}
function Ao(r, e) {
  let t = r.nodeValue.length, n = document.createRange(), i;
  for (let s = 0; s < t; s++) {
    n.setEnd(r, s + 1), n.setStart(r, s);
    let o = fe(n, 1);
    if (o.top != o.bottom && Tn(e, o)) {
      i = { node: r, offset: s + (e.left >= (o.left + o.right) / 2 ? 1 : 0) };
      break;
    }
  }
  return n.detach(), i || { node: r, offset: 0 };
}
function Tn(r, e) {
  return r.left >= e.left - 1 && r.left <= e.right + 1 && r.top >= e.top - 1 && r.top <= e.bottom + 1;
}
function Io(r, e) {
  let t = r.parentNode;
  return t && /^li$/i.test(t.nodeName) && e.left < r.getBoundingClientRect().left ? t : r;
}
function Ro(r, e, t) {
  let { node: n, offset: i } = Ai(e, t), s = -1;
  if (n.nodeType == 1 && !n.firstChild) {
    let o = n.getBoundingClientRect();
    s = o.left != o.right && t.left > (o.left + o.right) / 2 ? 1 : -1;
  }
  return r.docView.posFromDOM(n, i, s);
}
function Po(r, e, t, n) {
  let i = -1;
  for (let s = e, o = !1; s != r.dom; ) {
    let l = r.docView.nearestDesc(s, !0), a;
    if (!l)
      return null;
    if (l.dom.nodeType == 1 && (l.node.isBlock && l.parent || !l.contentDOM) && // Ignore elements with zero-size bounding rectangles
    ((a = l.dom.getBoundingClientRect()).width || a.height) && (l.node.isBlock && l.parent && !/^T(R|BODY|HEAD|FOOT)$/.test(l.dom.nodeName) && (!o && a.left > n.left || a.top > n.top ? i = l.posBefore : (!o && a.right < n.left || a.bottom < n.top) && (i = l.posAfter), o = !0), !l.contentDOM && i < 0 && !l.node.isText))
      return (l.node.isBlock ? n.top < (a.top + a.bottom) / 2 : n.left < (a.left + a.right) / 2) ? l.posBefore : l.posAfter;
    s = l.dom.parentNode;
  }
  return i > -1 ? i : r.docView.posFromDOM(e, t, -1);
}
function Ii(r, e, t) {
  let n = r.childNodes.length;
  if (n && t.top < t.bottom)
    for (let i = Math.max(0, Math.min(n - 1, Math.floor(n * (e.top - t.top) / (t.bottom - t.top)) - 2)), s = i; ; ) {
      let o = r.childNodes[s];
      if (o.nodeType == 1) {
        let l = o.getClientRects();
        for (let a = 0; a < l.length; a++) {
          let c = l[a];
          if (Tn(e, c))
            return Ii(o, e, c);
        }
      }
      if ((s = (s + 1) % n) == i)
        break;
    }
  return r;
}
function vo(r, e) {
  let t = r.dom.ownerDocument, n, i = 0, s = Mo(t, e.left, e.top);
  s && ({ node: n, offset: i } = s);
  let o = (r.root.elementFromPoint ? r.root : t).elementFromPoint(e.left, e.top), l;
  if (!o || !r.dom.contains(o.nodeType != 1 ? o.parentNode : o)) {
    let c = r.dom.getBoundingClientRect();
    if (!Tn(e, c) || (o = Ii(r.dom, e, c), !o))
      return null;
  }
  if (L)
    for (let c = o; n && c; c = Ke(c))
      c.draggable && (n = void 0);
  if (o = Io(o, e), n) {
    if (G && n.nodeType == 1 && (i = Math.min(i, n.childNodes.length), i < n.childNodes.length)) {
      let f = n.childNodes[i], h;
      f.nodeName == "IMG" && (h = f.getBoundingClientRect()).right <= e.left && h.bottom > e.top && i++;
    }
    let c;
    ut && i && n.nodeType == 1 && (c = n.childNodes[i - 1]).nodeType == 1 && c.contentEditable == "false" && c.getBoundingClientRect().top >= e.top && i--, n == r.dom && i == n.childNodes.length - 1 && n.lastChild.nodeType == 1 && e.top > n.lastChild.getBoundingClientRect().bottom ? l = r.state.doc.content.size : (i == 0 || n.nodeType != 1 || n.childNodes[i - 1].nodeName != "BR") && (l = Po(r, n, i, e));
  }
  l == null && (l = Ro(r, o, e));
  let a = r.docView.nearestDesc(o, !0);
  return { pos: l, inside: a ? a.posAtStart - a.border : -1 };
}
function mn(r) {
  return r.top < r.bottom || r.left < r.right;
}
function fe(r, e) {
  let t = r.getClientRects();
  if (t.length) {
    let n = t[e < 0 ? 0 : t.length - 1];
    if (mn(n))
      return n;
  }
  return Array.prototype.find.call(t, mn) || r.getBoundingClientRect();
}
const zo = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
function Ri(r, e, t) {
  let { node: n, offset: i, atom: s } = r.docView.domFromPos(e, t < 0 ? -1 : 1), o = ut || G;
  if (n.nodeType == 3)
    if (o && (zo.test(n.nodeValue) || (t < 0 ? !i : i == n.nodeValue.length))) {
      let a = fe(se(n, i, i), t);
      if (G && i && /\s/.test(n.nodeValue[i - 1]) && i < n.nodeValue.length) {
        let c = fe(se(n, i - 1, i - 1), -1);
        if (c.top == a.top) {
          let f = fe(se(n, i, i + 1), -1);
          if (f.top != a.top)
            return je(f, f.left < c.left);
        }
      }
      return a;
    } else {
      let a = i, c = i, f = t < 0 ? 1 : -1;
      return t < 0 && !i ? (c++, f = -1) : t >= 0 && i == n.nodeValue.length ? (a--, f = 1) : t < 0 ? a-- : c++, je(fe(se(n, a, c), f), f < 0);
    }
  if (!r.state.doc.resolve(e - (s || 0)).parent.inlineContent) {
    if (s == null && i && (t < 0 || i == j(n))) {
      let a = n.childNodes[i - 1];
      if (a.nodeType == 1)
        return Yt(a.getBoundingClientRect(), !1);
    }
    if (s == null && i < j(n)) {
      let a = n.childNodes[i];
      if (a.nodeType == 1)
        return Yt(a.getBoundingClientRect(), !0);
    }
    return Yt(n.getBoundingClientRect(), t >= 0);
  }
  if (s == null && i && (t < 0 || i == j(n))) {
    let a = n.childNodes[i - 1], c = a.nodeType == 3 ? se(a, j(a) - (o ? 0 : 1)) : a.nodeType == 1 && (a.nodeName != "BR" || !a.nextSibling) ? a : null;
    if (c)
      return je(fe(c, 1), !1);
  }
  if (s == null && i < j(n)) {
    let a = n.childNodes[i];
    for (; a.pmViewDesc && a.pmViewDesc.ignoreForCoords; )
      a = a.nextSibling;
    let c = a ? a.nodeType == 3 ? se(a, 0, o ? 0 : 1) : a.nodeType == 1 ? a : null : null;
    if (c)
      return je(fe(c, -1), !0);
  }
  return je(fe(n.nodeType == 3 ? se(n) : n, -t), t >= 0);
}
function je(r, e) {
  if (r.width == 0)
    return r;
  let t = e ? r.left : r.right;
  return { top: r.top, bottom: r.bottom, left: t, right: t };
}
function Yt(r, e) {
  if (r.height == 0)
    return r;
  let t = e ? r.top : r.bottom;
  return { top: t, bottom: t, left: r.left, right: r.right };
}
function Pi(r, e, t) {
  let n = r.state, i = r.root.activeElement;
  n != e && r.updateState(e), i != r.dom && r.focus();
  try {
    return t();
  } finally {
    n != e && r.updateState(n), i != r.dom && i && i.focus();
  }
}
function Bo(r, e, t) {
  let n = e.selection, i = t == "up" ? n.$from : n.$to;
  return Pi(r, e, () => {
    let { node: s } = r.docView.domFromPos(i.pos, t == "up" ? -1 : 1);
    for (; ; ) {
      let l = r.docView.nearestDesc(s, !0);
      if (!l)
        break;
      if (l.node.isBlock) {
        s = l.contentDOM || l.dom;
        break;
      }
      s = l.dom.parentNode;
    }
    let o = Ri(r, i.pos, 1);
    for (let l = s.firstChild; l; l = l.nextSibling) {
      let a;
      if (l.nodeType == 1)
        a = l.getClientRects();
      else if (l.nodeType == 3)
        a = se(l, 0, l.nodeValue.length).getClientRects();
      else
        continue;
      for (let c = 0; c < a.length; c++) {
        let f = a[c];
        if (f.bottom > f.top + 1 && (t == "up" ? o.top - f.top > (f.bottom - o.top) * 2 : f.bottom - o.bottom > (o.bottom - f.top) * 2))
          return !1;
      }
    }
    return !0;
  });
}
const Fo = /[\u0590-\u08ac]/;
function Vo(r, e, t) {
  let { $head: n } = e.selection;
  if (!n.parent.isTextblock)
    return !1;
  let i = n.parentOffset, s = !i, o = i == n.parent.content.size, l = r.domSelection();
  return l ? !Fo.test(n.parent.textContent) || !l.modify ? t == "left" || t == "backward" ? s : o : Pi(r, e, () => {
    let { focusNode: a, focusOffset: c, anchorNode: f, anchorOffset: h } = r.domSelectionRange(), d = l.caretBidiLevel;
    l.modify("move", t, "character");
    let u = n.depth ? r.docView.domAfterPos(n.before()) : r.dom, { focusNode: p, focusOffset: m } = r.domSelectionRange(), g = p && !u.contains(p.nodeType == 1 ? p : p.parentNode) || a == p && c == m;
    try {
      l.collapse(f, h), a && (a != f || c != h) && l.extend && l.extend(a, c);
    } catch {
    }
    return d != null && (l.caretBidiLevel = d), g;
  }) : n.pos == n.start() || n.pos == n.end();
}
let lr = null, ar = null, cr = !1;
function Lo(r, e, t) {
  return lr == e && ar == t ? cr : (lr = e, ar = t, cr = t == "up" || t == "down" ? Bo(r, e, t) : Vo(r, e, t));
}
const Y = 0, fr = 1, Ne = 2, Q = 3;
class pt {
  constructor(e, t, n, i) {
    this.parent = e, this.children = t, this.dom = n, this.contentDOM = i, this.dirty = Y, n.pmViewDesc = this;
  }
  // Used to check whether a given description corresponds to a
  // widget/mark/node.
  matchesWidget(e) {
    return !1;
  }
  matchesMark(e) {
    return !1;
  }
  matchesNode(e, t, n) {
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
    for (let t = 0; t < this.children.length; t++)
      e += this.children[t].size;
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
    for (let t = 0, n = this.posAtStart; ; t++) {
      let i = this.children[t];
      if (i == e)
        return n;
      n += i.size;
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
  localPosFromDOM(e, t, n) {
    if (this.contentDOM && this.contentDOM.contains(e.nodeType == 1 ? e : e.parentNode))
      if (n < 0) {
        let s, o;
        if (e == this.contentDOM)
          s = e.childNodes[t - 1];
        else {
          for (; e.parentNode != this.contentDOM; )
            e = e.parentNode;
          s = e.previousSibling;
        }
        for (; s && !((o = s.pmViewDesc) && o.parent == this); )
          s = s.previousSibling;
        return s ? this.posBeforeChild(o) + o.size : this.posAtStart;
      } else {
        let s, o;
        if (e == this.contentDOM)
          s = e.childNodes[t];
        else {
          for (; e.parentNode != this.contentDOM; )
            e = e.parentNode;
          s = e.nextSibling;
        }
        for (; s && !((o = s.pmViewDesc) && o.parent == this); )
          s = s.nextSibling;
        return s ? this.posBeforeChild(o) : this.posAtEnd;
      }
    let i;
    if (e == this.dom && this.contentDOM)
      i = t > P(this.contentDOM);
    else if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM))
      i = e.compareDocumentPosition(this.contentDOM) & 2;
    else if (this.dom.firstChild) {
      if (t == 0)
        for (let s = e; ; s = s.parentNode) {
          if (s == this.dom) {
            i = !1;
            break;
          }
          if (s.previousSibling)
            break;
        }
      if (i == null && t == e.childNodes.length)
        for (let s = e; ; s = s.parentNode) {
          if (s == this.dom) {
            i = !0;
            break;
          }
          if (s.nextSibling)
            break;
        }
    }
    return i ?? n > 0 ? this.posAtEnd : this.posAtStart;
  }
  nearestDesc(e, t = !1) {
    for (let n = !0, i = e; i; i = i.parentNode) {
      let s = this.getDesc(i), o;
      if (s && (!t || s.node))
        if (n && (o = s.nodeDOM) && !(o.nodeType == 1 ? o.contains(e.nodeType == 1 ? e : e.parentNode) : o == e))
          n = !1;
        else
          return s;
    }
  }
  getDesc(e) {
    let t = e.pmViewDesc;
    for (let n = t; n; n = n.parent)
      if (n == this)
        return t;
  }
  posFromDOM(e, t, n) {
    for (let i = e; i; i = i.parentNode) {
      let s = this.getDesc(i);
      if (s)
        return s.localPosFromDOM(e, t, n);
    }
    return -1;
  }
  // Find the desc for the node after the given pos, if any. (When a
  // parent node overrode rendering, there might not be one.)
  descAt(e) {
    for (let t = 0, n = 0; t < this.children.length; t++) {
      let i = this.children[t], s = n + i.size;
      if (n == e && s != n) {
        for (; !i.border && i.children.length; )
          for (let o = 0; o < i.children.length; o++) {
            let l = i.children[o];
            if (l.size) {
              i = l;
              break;
            }
          }
        return i;
      }
      if (e < s)
        return i.descAt(e - n - i.border);
      n = s;
    }
  }
  domFromPos(e, t) {
    if (!this.contentDOM)
      return { node: this.dom, offset: 0, atom: e + 1 };
    let n = 0, i = 0;
    for (let s = 0; n < this.children.length; n++) {
      let o = this.children[n], l = s + o.size;
      if (l > e || o instanceof zi) {
        i = e - s;
        break;
      }
      s = l;
    }
    if (i)
      return this.children[n].domFromPos(i - this.children[n].border, t);
    for (let s; n && !(s = this.children[n - 1]).size && s instanceof vi && s.side >= 0; n--)
      ;
    if (t <= 0) {
      let s, o = !0;
      for (; s = n ? this.children[n - 1] : null, !(!s || s.dom.parentNode == this.contentDOM); n--, o = !1)
        ;
      return s && t && o && !s.border && !s.domAtom ? s.domFromPos(s.size, t) : { node: this.contentDOM, offset: s ? P(s.dom) + 1 : 0 };
    } else {
      let s, o = !0;
      for (; s = n < this.children.length ? this.children[n] : null, !(!s || s.dom.parentNode == this.contentDOM); n++, o = !1)
        ;
      return s && o && !s.border && !s.domAtom ? s.domFromPos(0, t) : { node: this.contentDOM, offset: s ? P(s.dom) : this.contentDOM.childNodes.length };
    }
  }
  // Used to find a DOM range in a single parent for a given changed
  // range.
  parseRange(e, t, n = 0) {
    if (this.children.length == 0)
      return { node: this.contentDOM, from: e, to: t, fromOffset: 0, toOffset: this.contentDOM.childNodes.length };
    let i = -1, s = -1;
    for (let o = n, l = 0; ; l++) {
      let a = this.children[l], c = o + a.size;
      if (i == -1 && e <= c) {
        let f = o + a.border;
        if (e >= f && t <= c - a.border && a.node && a.contentDOM && this.contentDOM.contains(a.contentDOM))
          return a.parseRange(e, t, f);
        e = o;
        for (let h = l; h > 0; h--) {
          let d = this.children[h - 1];
          if (d.size && d.dom.parentNode == this.contentDOM && !d.emptyChildAt(1)) {
            i = P(d.dom) + 1;
            break;
          }
          e -= d.size;
        }
        i == -1 && (i = 0);
      }
      if (i > -1 && (c > t || l == this.children.length - 1)) {
        t = c;
        for (let f = l + 1; f < this.children.length; f++) {
          let h = this.children[f];
          if (h.size && h.dom.parentNode == this.contentDOM && !h.emptyChildAt(-1)) {
            s = P(h.dom);
            break;
          }
          t += h.size;
        }
        s == -1 && (s = this.contentDOM.childNodes.length);
        break;
      }
      o = c;
    }
    return { node: this.contentDOM, from: e, to: t, fromOffset: i, toOffset: s };
  }
  emptyChildAt(e) {
    if (this.border || !this.contentDOM || !this.children.length)
      return !1;
    let t = this.children[e < 0 ? 0 : this.children.length - 1];
    return t.size == 0 || t.emptyChildAt(e);
  }
  domAfterPos(e) {
    let { node: t, offset: n } = this.domFromPos(e, 0);
    if (t.nodeType != 1 || n == t.childNodes.length)
      throw new RangeError("No node after pos " + e);
    return t.childNodes[n];
  }
  // View descs are responsible for setting any selection that falls
  // entirely inside of them, so that custom implementations can do
  // custom things with the selection. Note that this falls apart when
  // a selection starts in such a node and ends in another, in which
  // case we just use whatever domFromPos produces as a best effort.
  setSelection(e, t, n, i = !1) {
    let s = Math.min(e, t), o = Math.max(e, t);
    for (let u = 0, p = 0; u < this.children.length; u++) {
      let m = this.children[u], g = p + m.size;
      if (s > p && o < g)
        return m.setSelection(e - p - m.border, t - p - m.border, n, i);
      p = g;
    }
    let l = this.domFromPos(e, e ? -1 : 1), a = t == e ? l : this.domFromPos(t, t ? -1 : 1), c = n.root.getSelection(), f = n.domSelectionRange(), h = !1;
    if ((G || L) && e == t) {
      let { node: u, offset: p } = l;
      if (u.nodeType == 3) {
        if (h = !!(p && u.nodeValue[p - 1] == `
`), h && p == u.nodeValue.length)
          for (let m = u, g; m; m = m.parentNode) {
            if (g = m.nextSibling) {
              g.nodeName == "BR" && (l = a = { node: g.parentNode, offset: P(g) + 1 });
              break;
            }
            let x = m.pmViewDesc;
            if (x && x.node && x.node.isBlock)
              break;
          }
      } else {
        let m = u.childNodes[p - 1];
        h = m && (m.nodeName == "BR" || m.contentEditable == "false");
      }
    }
    if (G && f.focusNode && f.focusNode != a.node && f.focusNode.nodeType == 1) {
      let u = f.focusNode.childNodes[f.focusOffset];
      u && u.contentEditable == "false" && (i = !0);
    }
    if (!(i || h && L) && ve(l.node, l.offset, f.anchorNode, f.anchorOffset) && ve(a.node, a.offset, f.focusNode, f.focusOffset))
      return;
    let d = !1;
    if ((c.extend || e == t) && !(h && G)) {
      c.collapse(l.node, l.offset);
      try {
        e != t && c.extend(a.node, a.offset), d = !0;
      } catch {
      }
    }
    if (!d) {
      if (e > t) {
        let p = l;
        l = a, a = p;
      }
      let u = document.createRange();
      u.setEnd(a.node, a.offset), u.setStart(l.node, l.offset), c.removeAllRanges(), c.addRange(u);
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
  markDirty(e, t) {
    for (let n = 0, i = 0; i < this.children.length; i++) {
      let s = this.children[i], o = n + s.size;
      if (n == o ? e <= o && t >= n : e < o && t > n) {
        let l = n + s.border, a = o - s.border;
        if (e >= l && t <= a) {
          this.dirty = e == n || t == o ? Ne : fr, e == l && t == a && (s.contentLost || s.dom.parentNode != this.contentDOM) ? s.dirty = Q : s.markDirty(e - l, t - l);
          return;
        } else
          s.dirty = s.dom == s.contentDOM && s.dom.parentNode == this.contentDOM && !s.children.length ? Ne : Q;
      }
      n = o;
    }
    this.dirty = Ne;
  }
  markParentsDirty() {
    let e = 1;
    for (let t = this.parent; t; t = t.parent, e++) {
      let n = e == 1 ? Ne : fr;
      t.dirty < n && (t.dirty = n);
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
class vi extends pt {
  constructor(e, t, n, i) {
    let s, o = t.type.toDOM;
    if (typeof o == "function" && (o = o(n, () => {
      if (!s)
        return i;
      if (s.parent)
        return s.parent.posBeforeChild(s);
    })), !t.type.spec.raw) {
      if (o.nodeType != 1) {
        let l = document.createElement("span");
        l.appendChild(o), o = l;
      }
      o.hasAttribute("contenteditable") || (o.contentEditable = "false"), o.classList.add("ProseMirror-widget");
    }
    super(e, [], o, null), this.widget = t, this.widget = t, s = this;
  }
  matchesWidget(e) {
    return this.dirty == Y && e.type.eq(this.widget.type);
  }
  parseRule() {
    return { ignore: !0 };
  }
  stopEvent(e) {
    let t = this.widget.spec.stopEvent;
    return t ? t(e) : !1;
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
class Wo extends pt {
  constructor(e, t, n, i) {
    super(e, [], t, null), this.textDOM = n, this.text = i;
  }
  get size() {
    return this.text.length;
  }
  localPosFromDOM(e, t) {
    return e != this.textDOM ? this.posAtStart + (t ? this.size : 0) : this.posAtStart + t;
  }
  domFromPos(e) {
    return { node: this.textDOM, offset: e };
  }
  ignoreMutation(e) {
    return e.type === "characterData" && e.target.nodeValue == e.oldValue;
  }
}
class ye extends pt {
  constructor(e, t, n, i, s) {
    super(e, [], n, i), this.mark = t, this.spec = s;
  }
  static create(e, t, n, i) {
    let s = i.nodeViews[t.type.name], o = s && s(t, i, n);
    return (!o || !o.dom) && (o = ze.renderSpec(document, t.type.spec.toDOM(t, n), null, t.attrs)), new ye(e, t, o.dom, o.contentDOM || o.dom, o);
  }
  parseRule() {
    return this.dirty & Q || this.mark.type.spec.reparseInView ? null : { mark: this.mark.type.name, attrs: this.mark.attrs, contentElement: this.contentDOM };
  }
  matchesMark(e) {
    return this.dirty != Q && this.mark.eq(e);
  }
  markDirty(e, t) {
    if (super.markDirty(e, t), this.dirty != Y) {
      let n = this.parent;
      for (; !n.node; )
        n = n.parent;
      n.dirty < this.dirty && (n.dirty = this.dirty), this.dirty = Y;
    }
  }
  slice(e, t, n) {
    let i = ye.create(this.parent, this.mark, !0, n), s = this.children, o = this.size;
    t < o && (s = yn(s, t, o, n)), e > 0 && (s = yn(s, 0, e, n));
    for (let l = 0; l < s.length; l++)
      s[l].parent = i;
    return i.children = s, i;
  }
  ignoreMutation(e) {
    return this.spec.ignoreMutation ? this.spec.ignoreMutation(e) : super.ignoreMutation(e);
  }
  destroy() {
    this.spec.destroy && this.spec.destroy(), super.destroy();
  }
}
class be extends pt {
  constructor(e, t, n, i, s, o, l) {
    super(e, [], s, o), this.node = t, this.outerDeco = n, this.innerDeco = i, this.nodeDOM = l;
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
  static create(e, t, n, i, s, o) {
    let l = s.nodeViews[t.type.name], a, c = l && l(t, s, () => {
      if (!a)
        return o;
      if (a.parent)
        return a.parent.posBeforeChild(a);
    }, n, i), f = c && c.dom, h = c && c.contentDOM;
    if (t.isText) {
      if (!f)
        f = document.createTextNode(t.text);
      else if (f.nodeType != 3)
        throw new RangeError("Text must be rendered as a DOM text node");
    } else f || ({ dom: f, contentDOM: h } = ze.renderSpec(document, t.type.spec.toDOM(t), null, t.attrs));
    !h && !t.isText && f.nodeName != "BR" && (f.hasAttribute("contenteditable") || (f.contentEditable = "false"), t.type.spec.draggable && (f.draggable = !0));
    let d = f;
    return f = Vi(f, n, t), c ? a = new Jo(e, t, n, i, f, h || null, d, c) : t.isText ? new Jt(e, t, n, i, f, d) : new be(e, t, n, i, f, h || null, d);
  }
  parseRule(e) {
    if (this.node.type.spec.reparseInView)
      return null;
    let t = { node: this.node.type.name, attrs: this.node.attrs };
    if (this.node.type.whitespace == "pre" && (t.preserveWhitespace = "full"), !this.contentDOM)
      t.getContent = () => this.node.content;
    else if (!this.contentLost)
      t.contentElement = this.contentDOM;
    else {
      for (let n = this.children.length - 1; n >= 0; n--) {
        let i = this.children[n];
        if (this.dom.contains(i.dom.parentNode)) {
          t.contentElement = i.dom.parentNode;
          break;
        }
      }
      if (!t.contentElement) {
        let n = e && e.find((i) => i.nodeType == 1 && e.indexOf(i.parentNode) < 0 && this.dom.contains(i));
        n ? t.contentElement = n : t.getContent = () => y.empty;
      }
    }
    return t;
  }
  matchesNode(e, t, n) {
    return this.dirty == Y && e.eq(this.node) && Et(t, this.outerDeco) && n.eq(this.innerDeco);
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
  updateChildren(e, t) {
    let n = this.node.inlineContent, i = t, s = e.composing ? this.localCompositionInfo(e, t) : null, o = s && s.pos > -1 ? s : null, l = s && s.pos < 0, a = new $o(this, o && o.node, e);
    _o(this.node, this.innerDeco, (c, f, h) => {
      c.spec.marks ? a.syncToMarks(c.spec.marks, n, e, f) : c.type.side >= 0 && !h && a.syncToMarks(f == this.node.childCount ? M.none : this.node.child(f).marks, n, e, f), a.placeWidget(c, e, i);
    }, (c, f, h, d) => {
      a.syncToMarks(c.marks, n, e, d);
      let u;
      a.findNodeMatch(c, f, h, d) || l && e.state.selection.from > i && e.state.selection.to < i + c.nodeSize && (u = a.findIndexWithChild(s.node)) > -1 && a.updateNodeAt(c, f, h, u, e) || a.updateNextNode(c, f, h, e, d, i) || a.addNode(c, f, h, e, i), i += c.nodeSize;
    }), a.syncToMarks([], n, e, 0), this.node.isTextblock && a.addTextblockHacks(), a.destroyRest(), (a.changed || this.dirty == Ne) && (o && this.protectLocalComposition(e, o), Bi(this.contentDOM, this.children, e), He && Uo(this.dom));
  }
  localCompositionInfo(e, t) {
    let { from: n, to: i } = e.state.selection;
    if (!(e.state.selection instanceof O) || n < t || i > t + this.node.content.size)
      return null;
    let s = e.input.compositionNode;
    if (!s || !this.dom.contains(s.parentNode))
      return null;
    if (this.node.inlineContent) {
      let o = s.nodeValue, l = jo(this.node.content, o, n - t, i - t);
      return l < 0 ? null : { node: s, pos: l, text: o };
    } else
      return { node: s, pos: -1, text: "" };
  }
  protectLocalComposition(e, { node: t, pos: n, text: i }) {
    if (this.getDesc(t))
      return;
    let s = t;
    for (; s.parentNode != this.contentDOM; s = s.parentNode) {
      for (; s.previousSibling; )
        s.parentNode.removeChild(s.previousSibling);
      for (; s.nextSibling; )
        s.parentNode.removeChild(s.nextSibling);
      s.pmViewDesc && (s.pmViewDesc = void 0);
    }
    let o = new Wo(this, s, t, i);
    e.input.compositionNodes.push(o), this.children = yn(this.children, n, n + i.length, e, o);
  }
  // If this desc must be updated to match the given node decoration,
  // do so and return true.
  update(e, t, n, i) {
    return this.dirty == Q || !e.sameMarkup(this.node) ? !1 : (this.updateInner(e, t, n, i), !0);
  }
  updateInner(e, t, n, i) {
    this.updateOuterDeco(t), this.node = e, this.innerDeco = n, this.contentDOM && this.updateChildren(i, this.posAtStart), this.dirty = Y;
  }
  updateOuterDeco(e) {
    if (Et(e, this.outerDeco))
      return;
    let t = this.nodeDOM.nodeType != 1, n = this.dom;
    this.dom = Fi(this.dom, this.nodeDOM, gn(this.outerDeco, this.node, t), gn(e, this.node, t)), this.dom != n && (n.pmViewDesc = void 0, this.dom.pmViewDesc = this), this.outerDeco = e;
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
function hr(r, e, t, n, i) {
  Vi(n, e, r);
  let s = new be(void 0, r, e, t, n, n, n);
  return s.contentDOM && s.updateChildren(i, 0), s;
}
class Jt extends be {
  constructor(e, t, n, i, s, o) {
    super(e, t, n, i, s, null, o);
  }
  parseRule() {
    let e = this.nodeDOM.parentNode;
    for (; e && e != this.dom && !e.pmIsDeco; )
      e = e.parentNode;
    return { skip: e || !0 };
  }
  update(e, t, n, i) {
    return this.dirty == Q || this.dirty != Y && !this.inParent() || !e.sameMarkup(this.node) ? !1 : (this.updateOuterDeco(t), (this.dirty != Y || e.text != this.node.text) && e.text != this.nodeDOM.nodeValue && (this.nodeDOM.nodeValue = e.text, i.trackWrites == this.nodeDOM && (i.trackWrites = null)), this.node = e, this.dirty = Y, !0);
  }
  inParent() {
    let e = this.parent.contentDOM;
    for (let t = this.nodeDOM; t; t = t.parentNode)
      if (t == e)
        return !0;
    return !1;
  }
  domFromPos(e) {
    return { node: this.nodeDOM, offset: e };
  }
  localPosFromDOM(e, t, n) {
    return e == this.nodeDOM ? this.posAtStart + Math.min(t, this.node.text.length) : super.localPosFromDOM(e, t, n);
  }
  ignoreMutation(e) {
    return e.type != "characterData" && e.type != "selection";
  }
  slice(e, t, n) {
    let i = this.node.cut(e, t), s = document.createTextNode(i.text);
    return new Jt(this.parent, i, this.outerDeco, this.innerDeco, s, s);
  }
  markDirty(e, t) {
    super.markDirty(e, t), this.dom != this.nodeDOM && (e == 0 || t == this.nodeDOM.nodeValue.length) && (this.dirty = Q);
  }
  get domAtom() {
    return !1;
  }
  isText(e) {
    return this.node.text == e;
  }
}
class zi extends pt {
  parseRule() {
    return { ignore: !0 };
  }
  matchesHack(e) {
    return this.dirty == Y && this.dom.nodeName == e;
  }
  get domAtom() {
    return !0;
  }
  get ignoreForCoords() {
    return this.dom.nodeName == "IMG";
  }
}
class Jo extends be {
  constructor(e, t, n, i, s, o, l, a) {
    super(e, t, n, i, s, o, l), this.spec = a;
  }
  // A custom `update` method gets to decide whether the update goes
  // through. If it does, and there's a `contentDOM` node, our logic
  // updates the children.
  update(e, t, n, i) {
    if (this.dirty == Q)
      return !1;
    if (this.spec.update && (this.node.type == e.type || this.spec.multiType)) {
      let s = this.spec.update(e, t, n);
      return s && this.updateInner(e, t, n, i), s;
    } else return !this.contentDOM && !e.isLeaf ? !1 : super.update(e, t, n, i);
  }
  selectNode() {
    this.spec.selectNode ? this.spec.selectNode() : super.selectNode();
  }
  deselectNode() {
    this.spec.deselectNode ? this.spec.deselectNode() : super.deselectNode();
  }
  setSelection(e, t, n, i) {
    this.spec.setSelection ? this.spec.setSelection(e, t, n.root) : super.setSelection(e, t, n, i);
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
function Bi(r, e, t) {
  let n = r.firstChild, i = !1;
  for (let s = 0; s < e.length; s++) {
    let o = e[s], l = o.dom;
    if (l.parentNode == r) {
      for (; l != n; )
        n = dr(n), i = !0;
      n = n.nextSibling;
    } else
      i = !0, r.insertBefore(l, n);
    if (o instanceof ye) {
      let a = n ? n.previousSibling : r.lastChild;
      Bi(o.contentDOM, o.children, t), n = a ? a.nextSibling : r.firstChild;
    }
  }
  for (; n; )
    n = dr(n), i = !0;
  i && t.trackWrites == r && (t.trackWrites = null);
}
const tt = function(r) {
  r && (this.nodeName = r);
};
tt.prototype = /* @__PURE__ */ Object.create(null);
const we = [new tt()];
function gn(r, e, t) {
  if (r.length == 0)
    return we;
  let n = t ? we[0] : new tt(), i = [n];
  for (let s = 0; s < r.length; s++) {
    let o = r[s].type.attrs;
    if (o) {
      o.nodeName && i.push(n = new tt(o.nodeName));
      for (let l in o) {
        let a = o[l];
        a != null && (t && i.length == 1 && i.push(n = new tt(e.isInline ? "span" : "div")), l == "class" ? n.class = (n.class ? n.class + " " : "") + a : l == "style" ? n.style = (n.style ? n.style + ";" : "") + a : l != "nodeName" && (n[l] = a));
      }
    }
  }
  return i;
}
function Fi(r, e, t, n) {
  if (t == we && n == we)
    return e;
  let i = e;
  for (let s = 0; s < n.length; s++) {
    let o = n[s], l = t[s];
    if (s) {
      let a;
      l && l.nodeName == o.nodeName && i != r && (a = i.parentNode) && a.nodeName.toLowerCase() == o.nodeName || (a = document.createElement(o.nodeName), a.pmIsDeco = !0, a.appendChild(i), l = we[0]), i = a;
    }
    qo(i, l || we[0], o);
  }
  return i;
}
function qo(r, e, t) {
  for (let n in e)
    n != "class" && n != "style" && n != "nodeName" && !(n in t) && r.removeAttribute(n);
  for (let n in t)
    n != "class" && n != "style" && n != "nodeName" && t[n] != e[n] && r.setAttribute(n, t[n]);
  if (e.class != t.class) {
    let n = e.class ? e.class.split(" ").filter(Boolean) : [], i = t.class ? t.class.split(" ").filter(Boolean) : [];
    for (let s = 0; s < n.length; s++)
      i.indexOf(n[s]) == -1 && r.classList.remove(n[s]);
    for (let s = 0; s < i.length; s++)
      n.indexOf(i[s]) == -1 && r.classList.add(i[s]);
    r.classList.length == 0 && r.removeAttribute("class");
  }
  if (e.style != t.style) {
    if (e.style) {
      let n = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g, i;
      for (; i = n.exec(e.style); )
        r.style.removeProperty(i[1]);
    }
    t.style && (r.style.cssText += t.style);
  }
}
function Vi(r, e, t) {
  return Fi(r, r, we, gn(e, t, r.nodeType != 1));
}
function Et(r, e) {
  if (r.length != e.length)
    return !1;
  for (let t = 0; t < r.length; t++)
    if (!r[t].type.eq(e[t].type))
      return !1;
  return !0;
}
function dr(r) {
  let e = r.nextSibling;
  return r.parentNode.removeChild(r), e;
}
class $o {
  constructor(e, t, n) {
    this.lock = t, this.view = n, this.index = 0, this.stack = [], this.changed = !1, this.top = e, this.preMatch = Ko(e.node.content, e);
  }
  // Destroy and remove the children between the given indices in
  // `this.top`.
  destroyBetween(e, t) {
    if (e != t) {
      for (let n = e; n < t; n++)
        this.top.children[n].destroy();
      this.top.children.splice(e, t - e), this.changed = !0;
    }
  }
  // Destroy all remaining children in `this.top`.
  destroyRest() {
    this.destroyBetween(this.index, this.top.children.length);
  }
  // Sync the current stack of mark descs with the given array of
  // marks, reusing existing mark descs when possible.
  syncToMarks(e, t, n, i) {
    let s = 0, o = this.stack.length >> 1, l = Math.min(o, e.length);
    for (; s < l && (s == o - 1 ? this.top : this.stack[s + 1 << 1]).matchesMark(e[s]) && e[s].type.spec.spanning !== !1; )
      s++;
    for (; s < o; )
      this.destroyRest(), this.top.dirty = Y, this.index = this.stack.pop(), this.top = this.stack.pop(), o--;
    for (; o < e.length; ) {
      this.stack.push(this.top, this.index + 1);
      let a = -1, c = this.top.children.length;
      i < this.preMatch.index && (c = Math.min(this.index + 3, c));
      for (let f = this.index; f < c; f++) {
        let h = this.top.children[f];
        if (h.matchesMark(e[o]) && !this.isLocked(h.dom)) {
          a = f;
          break;
        }
      }
      if (a < 0 && this.index < this.top.children.length) {
        let f = this.top.children[this.index];
        f instanceof ye && f.dirty != Q && f.mark.type == e[o].type && f.spec.update && !this.isLocked(f.dom) && f.spec.update(e[o]) && (f.mark = e[o], a = this.index, this.changed = !0);
      }
      if (a > -1)
        a > this.index && (this.changed = !0, this.destroyBetween(this.index, a)), this.top = this.top.children[this.index];
      else {
        let f = ye.create(this.top, e[o], t, n);
        this.top.children.splice(this.index, 0, f), this.top = f, this.changed = !0;
      }
      this.index = 0, o++;
    }
  }
  // Try to find a node desc matching the given data. Skip over it and
  // return true when successful.
  findNodeMatch(e, t, n, i) {
    let s = -1, o;
    if (i >= this.preMatch.index && (o = this.preMatch.matches[i - this.preMatch.index]).parent == this.top && o.matchesNode(e, t, n))
      s = this.top.children.indexOf(o, this.index);
    else
      for (let l = this.index, a = Math.min(this.top.children.length, l + 5); l < a; l++) {
        let c = this.top.children[l];
        if (c.matchesNode(e, t, n) && !this.preMatch.matched.has(c)) {
          s = l;
          break;
        }
      }
    return s < 0 ? !1 : (this.destroyBetween(this.index, s), this.index++, !0);
  }
  updateNodeAt(e, t, n, i, s) {
    let o = this.top.children[i];
    return o.dirty == Q && o.dom == o.contentDOM && (o.dirty = Ne), o.update(e, t, n, s) ? (this.destroyBetween(this.index, i), this.index++, !0) : !1;
  }
  findIndexWithChild(e) {
    for (; ; ) {
      let t = e.parentNode;
      if (!t)
        return -1;
      if (t == this.top.contentDOM) {
        let n = e.pmViewDesc;
        if (n) {
          for (let i = this.index; i < this.top.children.length; i++)
            if (this.top.children[i] == n)
              return i;
        }
        return -1;
      }
      e = t;
    }
  }
  // Try to update the next node, if any, to the given data. Checks
  // pre-matches to avoid overwriting nodes that could still be used.
  updateNextNode(e, t, n, i, s, o) {
    for (let l = this.index; l < this.top.children.length; l++) {
      let a = this.top.children[l];
      if (a instanceof be) {
        let c = this.preMatch.matched.get(a);
        if (c != null && c != s)
          return !1;
        let f = a.dom, h, d = this.isLocked(f) && !(e.isText && a.node && a.node.isText && a.nodeDOM.nodeValue == e.text && a.dirty != Q && Et(t, a.outerDeco));
        if (!d && a.update(e, t, n, i))
          return this.destroyBetween(this.index, l), a.dom != f && (this.changed = !0), this.index++, !0;
        if (!d && (h = this.recreateWrapper(a, e, t, n, i, o)))
          return this.destroyBetween(this.index, l), this.top.children[this.index] = h, h.contentDOM && (h.dirty = Ne, h.updateChildren(i, o + 1), h.dirty = Y), this.changed = !0, this.index++, !0;
        break;
      }
    }
    return !1;
  }
  // When a node with content is replaced by a different node with
  // identical content, move over its children.
  recreateWrapper(e, t, n, i, s, o) {
    if (e.dirty || t.isAtom || !e.children.length || !e.node.content.eq(t.content) || !Et(n, e.outerDeco) || !i.eq(e.innerDeco))
      return null;
    let l = be.create(this.top, t, n, i, s, o);
    if (l.contentDOM) {
      l.children = e.children, e.children = [];
      for (let a of l.children)
        a.parent = l;
    }
    return e.destroy(), l;
  }
  // Insert the node as a newly created node desc.
  addNode(e, t, n, i, s) {
    let o = be.create(this.top, e, t, n, i, s);
    o.contentDOM && o.updateChildren(i, s + 1), this.top.children.splice(this.index++, 0, o), this.changed = !0;
  }
  placeWidget(e, t, n) {
    let i = this.index < this.top.children.length ? this.top.children[this.index] : null;
    if (i && i.matchesWidget(e) && (e == i.widget || !i.widget.type.toDOM.parentNode))
      this.index++;
    else {
      let s = new vi(this.top, e, t, n);
      this.top.children.splice(this.index++, 0, s), this.changed = !0;
    }
  }
  // Make sure a textblock looks and behaves correctly in
  // contentEditable.
  addTextblockHacks() {
    let e = this.top.children[this.index - 1], t = this.top;
    for (; e instanceof ye; )
      t = e, e = t.children[t.children.length - 1];
    (!e || // Empty textblock
    !(e instanceof Jt) || /\n$/.test(e.node.text) || this.view.requiresGeckoHackNode && /\s$/.test(e.node.text)) && ((L || z) && e && e.dom.contentEditable == "false" && this.addHackNode("IMG", t), this.addHackNode("BR", this.top));
  }
  addHackNode(e, t) {
    if (t == this.top && this.index < t.children.length && t.children[this.index].matchesHack(e))
      this.index++;
    else {
      let n = document.createElement(e);
      e == "IMG" && (n.className = "ProseMirror-separator", n.alt = ""), e == "BR" && (n.className = "ProseMirror-trailingBreak");
      let i = new zi(this.top, [], n, null);
      t != this.top ? t.children.push(i) : t.children.splice(this.index++, 0, i), this.changed = !0;
    }
  }
  isLocked(e) {
    return this.lock && (e == this.lock || e.nodeType == 1 && e.contains(this.lock.parentNode));
  }
}
function Ko(r, e) {
  let t = e, n = t.children.length, i = r.childCount, s = /* @__PURE__ */ new Map(), o = [];
  e: for (; i > 0; ) {
    let l;
    for (; ; )
      if (n) {
        let c = t.children[n - 1];
        if (c instanceof ye)
          t = c, n = c.children.length;
        else {
          l = c, n--;
          break;
        }
      } else {
        if (t == e)
          break e;
        n = t.parent.children.indexOf(t), t = t.parent;
      }
    let a = l.node;
    if (a) {
      if (a != r.child(i - 1))
        break;
      --i, s.set(l, i), o.push(l);
    }
  }
  return { index: i, matched: s, matches: o.reverse() };
}
function Ho(r, e) {
  return r.type.side - e.type.side;
}
function _o(r, e, t, n) {
  let i = e.locals(r), s = 0;
  if (i.length == 0) {
    for (let c = 0; c < r.childCount; c++) {
      let f = r.child(c);
      n(f, i, e.forChild(s, f), c), s += f.nodeSize;
    }
    return;
  }
  let o = 0, l = [], a = null;
  for (let c = 0; ; ) {
    let f, h;
    for (; o < i.length && i[o].to == s; ) {
      let g = i[o++];
      g.widget && (f ? (h || (h = [f])).push(g) : f = g);
    }
    if (f)
      if (h) {
        h.sort(Ho);
        for (let g = 0; g < h.length; g++)
          t(h[g], c, !!a);
      } else
        t(f, c, !!a);
    let d, u;
    if (a)
      u = -1, d = a, a = null;
    else if (c < r.childCount)
      u = c, d = r.child(c++);
    else
      break;
    for (let g = 0; g < l.length; g++)
      l[g].to <= s && l.splice(g--, 1);
    for (; o < i.length && i[o].from <= s && i[o].to > s; )
      l.push(i[o++]);
    let p = s + d.nodeSize;
    if (d.isText) {
      let g = p;
      o < i.length && i[o].from < g && (g = i[o].from);
      for (let x = 0; x < l.length; x++)
        l[x].to < g && (g = l[x].to);
      g < p && (a = d.cut(g - s), d = d.cut(0, g - s), p = g, u = -1);
    } else
      for (; o < i.length && i[o].to < p; )
        o++;
    let m = d.isInline && !d.isLeaf ? l.filter((g) => !g.inline) : l.slice();
    n(d, m, e.forChild(s, d), u), s = p;
  }
}
function Uo(r) {
  if (r.nodeName == "UL" || r.nodeName == "OL") {
    let e = r.style.cssText;
    r.style.cssText = e + "; list-style: square !important", window.getComputedStyle(r).listStyle, r.style.cssText = e;
  }
}
function jo(r, e, t, n) {
  for (let i = 0, s = 0; i < r.childCount && s <= n; ) {
    let o = r.child(i++), l = s;
    if (s += o.nodeSize, !o.isText)
      continue;
    let a = o.text;
    for (; i < r.childCount; ) {
      let c = r.child(i++);
      if (s += c.nodeSize, !c.isText)
        break;
      a += c.text;
    }
    if (s >= t) {
      if (s >= n && a.slice(n - e.length - l, n - l) == e)
        return n - e.length;
      let c = l < n ? a.lastIndexOf(e, n - l - 1) : -1;
      if (c >= 0 && c + e.length + l >= t)
        return l + c;
      if (t == n && a.length >= n + e.length - l && a.slice(n - l, n - l + e.length) == e)
        return n;
    }
  }
  return -1;
}
function yn(r, e, t, n, i) {
  let s = [];
  for (let o = 0, l = 0; o < r.length; o++) {
    let a = r[o], c = l, f = l += a.size;
    c >= t || f <= e ? s.push(a) : (c < e && s.push(a.slice(0, e - c, n)), i && (s.push(i), i = void 0), f > t && s.push(a.slice(t - c, a.size, n)));
  }
  return s;
}
function En(r, e = null) {
  let t = r.domSelectionRange(), n = r.state.doc;
  if (!t.focusNode)
    return null;
  let i = r.docView.nearestDesc(t.focusNode), s = i && i.size == 0, o = r.docView.posFromDOM(t.focusNode, t.focusOffset, 1);
  if (o < 0)
    return null;
  let l = n.resolve(o), a, c;
  if (Wt(t)) {
    for (a = o; i && !i.node; )
      i = i.parent;
    let h = i.node;
    if (i && h.isAtom && k.isSelectable(h) && i.parent && !(h.isInline && So(t.focusNode, t.focusOffset, i.dom))) {
      let d = i.posBefore;
      c = new k(o == d ? l : n.resolve(d));
    }
  } else {
    if (t instanceof r.dom.ownerDocument.defaultView.Selection && t.rangeCount > 1) {
      let h = o, d = o;
      for (let u = 0; u < t.rangeCount; u++) {
        let p = t.getRangeAt(u);
        h = Math.min(h, r.docView.posFromDOM(p.startContainer, p.startOffset, 1)), d = Math.max(d, r.docView.posFromDOM(p.endContainer, p.endOffset, -1));
      }
      if (h < 0)
        return null;
      [a, o] = d == r.state.selection.anchor ? [d, h] : [h, d], l = n.resolve(o);
    } else
      a = r.docView.posFromDOM(t.anchorNode, t.anchorOffset, 1);
    if (a < 0)
      return null;
  }
  let f = n.resolve(a);
  if (!c) {
    let h = e == "pointer" || r.state.selection.head < l.pos && !s ? 1 : -1;
    c = An(r, f, l, h);
  }
  return c;
}
function Li(r) {
  return r.editable ? r.hasFocus() : Ji(r) && document.activeElement && document.activeElement.contains(r.dom);
}
function ce(r, e = !1) {
  let t = r.state.selection;
  if (Wi(r, t), !Li(r))
    return;
  let n = r.input.mouseDown;
  if (!e && z && n) {
    let i = r.domSelectionRange(), s = r.domObserver.currentSelection;
    if (i.anchorNode && s.anchorNode && ve(i.anchorNode, i.anchorOffset, s.anchorNode, s.anchorOffset) && n.delaySelUpdate()) {
      r.domObserver.setCurSelection();
      return;
    }
  }
  if (r.domObserver.disconnectSelection(), r.cursorWrapper)
    Yo(r);
  else {
    let { anchor: i, head: s } = t, o, l;
    ur && !(t instanceof O) && (t.$from.parent.inlineContent || (o = pr(r, t.from)), !t.empty && !t.$from.parent.inlineContent && (l = pr(r, t.to))), r.docView.setSelection(i, s, r, e), ur && (o && mr(o), l && mr(l)), t.visible ? r.dom.classList.remove("ProseMirror-hideselection") : (r.dom.classList.add("ProseMirror-hideselection"), "onselectionchange" in document && Go(r));
  }
  r.domObserver.setCurSelection(), r.domObserver.connectSelection();
}
const ur = L || z && wi < 63;
function pr(r, e) {
  let { node: t, offset: n } = r.docView.domFromPos(e, 0), i = n < t.childNodes.length ? t.childNodes[n] : null, s = n ? t.childNodes[n - 1] : null;
  if (L && i && i.contentEditable == "false")
    return Xt(i);
  if ((!i || i.contentEditable == "false") && (!s || s.contentEditable == "false")) {
    if (i)
      return Xt(i);
    if (s)
      return Xt(s);
  }
}
function Xt(r) {
  return r.contentEditable = "true", L && r.draggable && (r.draggable = !1, r.wasDraggable = !0), r;
}
function mr(r) {
  r.contentEditable = "false", r.wasDraggable && (r.draggable = !0, r.wasDraggable = null);
}
function Go(r) {
  let e = r.dom.ownerDocument;
  e.removeEventListener("selectionchange", r.input.hideSelectionGuard);
  let t = r.domSelectionRange(), n = t.anchorNode, i = t.anchorOffset;
  e.addEventListener("selectionchange", r.input.hideSelectionGuard = () => {
    (t.anchorNode != n || t.anchorOffset != i) && (e.removeEventListener("selectionchange", r.input.hideSelectionGuard), setTimeout(() => {
      (!Li(r) || r.state.selection.visible) && r.dom.classList.remove("ProseMirror-hideselection");
    }, 20));
  });
}
function Yo(r) {
  let e = r.domSelection();
  if (!e)
    return;
  let t = r.cursorWrapper.dom, n = t.nodeName == "IMG";
  n ? e.collapse(t.parentNode, P(t) + 1) : e.collapse(t, 0), !n && !r.state.selection.visible && K && ge <= 11 && (t.disabled = !0, t.disabled = !1);
}
function Wi(r, e) {
  if (e instanceof k) {
    let t = r.docView.descAt(e.from);
    t != r.lastSelectedViewDesc && (gr(r), t && t.selectNode(), r.lastSelectedViewDesc = t);
  } else
    gr(r);
}
function gr(r) {
  r.lastSelectedViewDesc && (r.lastSelectedViewDesc.parent && r.lastSelectedViewDesc.deselectNode(), r.lastSelectedViewDesc = void 0);
}
function An(r, e, t, n) {
  return r.someProp("createSelectionBetween", (i) => i(r, e, t)) || O.between(e, t, n);
}
function yr(r) {
  return r.editable && !r.hasFocus() ? !1 : Ji(r);
}
function Ji(r) {
  let e = r.domSelectionRange();
  if (!e.anchorNode)
    return !1;
  try {
    return r.dom.contains(e.anchorNode.nodeType == 3 ? e.anchorNode.parentNode : e.anchorNode) && (r.editable || r.dom.contains(e.focusNode.nodeType == 3 ? e.focusNode.parentNode : e.focusNode));
  } catch {
    return !1;
  }
}
function Xo(r) {
  let e = r.docView.domFromPos(r.state.selection.anchor, 0), t = r.domSelectionRange();
  return ve(e.node, e.offset, t.anchorNode, t.anchorOffset);
}
function bn(r, e) {
  let { $anchor: t, $head: n } = r.selection, i = e > 0 ? t.max(n) : t.min(n), s = i.parent.inlineContent ? i.depth ? r.doc.resolve(e > 0 ? i.after() : i.before()) : null : i;
  return s && C.findFrom(s, e);
}
function he(r, e) {
  return r.dispatch(r.state.tr.setSelection(e).scrollIntoView()), !0;
}
function br(r, e, t) {
  let n = r.state.selection;
  if (n instanceof O)
    if (t.indexOf("s") > -1) {
      let { $head: i } = n, s = i.textOffset ? null : e < 0 ? i.nodeBefore : i.nodeAfter;
      if (!s || s.isText || !s.isLeaf)
        return !1;
      let o = r.state.doc.resolve(i.pos + s.nodeSize * (e < 0 ? -1 : 1));
      return he(r, new O(n.$anchor, o));
    } else if (n.empty) {
      if (r.endOfTextblock(e > 0 ? "forward" : "backward")) {
        let i = bn(r.state, e);
        return i && i instanceof k ? he(r, i) : !1;
      } else if (!(U && t.indexOf("m") > -1)) {
        let i = n.$head, s = i.textOffset ? null : e < 0 ? i.nodeBefore : i.nodeAfter, o;
        if (!s || s.isText)
          return !1;
        let l = e < 0 ? i.pos - s.nodeSize : i.pos;
        return s.isAtom || (o = r.docView.descAt(l)) && !o.contentDOM ? k.isSelectable(s) ? he(r, new k(e < 0 ? r.state.doc.resolve(i.pos - s.nodeSize) : i)) : ut ? he(r, new O(r.state.doc.resolve(e < 0 ? l : l + s.nodeSize))) : !1 : !1;
      }
    } else return !1;
  else {
    if (n instanceof k && n.node.isInline)
      return he(r, new O(e > 0 ? n.$to : n.$from));
    {
      let i = bn(r.state, e);
      return i ? he(r, i) : !1;
    }
  }
}
function At(r) {
  return r.nodeType == 3 ? r.nodeValue.length : r.childNodes.length;
}
function nt(r, e) {
  let t = r.pmViewDesc;
  return t && t.size == 0 && (e < 0 || r.nextSibling || r.nodeName != "BR");
}
function Fe(r, e) {
  return e < 0 ? Zo(r) : Qo(r);
}
function Zo(r) {
  let e = r.domSelectionRange(), t = e.focusNode, n = e.focusOffset;
  if (!t)
    return;
  let i, s, o = !1;
  for (G && t.nodeType == 1 && n < At(t) && nt(t.childNodes[n], -1) && (o = !0); ; )
    if (n > 0) {
      if (t.nodeType != 1)
        break;
      {
        let l = t.childNodes[n - 1];
        if (nt(l, -1))
          i = t, s = --n;
        else if (l.nodeType == 3)
          t = l, n = t.nodeValue.length;
        else
          break;
      }
    } else {
      if (qi(t))
        break;
      {
        let l = t.previousSibling;
        for (; l && nt(l, -1); )
          i = t.parentNode, s = P(l), l = l.previousSibling;
        if (l)
          t = l, n = At(t);
        else {
          if (t = t.parentNode, t == r.dom)
            break;
          n = 0;
        }
      }
    }
  o ? xn(r, t, n) : i && xn(r, i, s);
}
function Qo(r) {
  let e = r.domSelectionRange(), t = e.focusNode, n = e.focusOffset;
  if (!t)
    return;
  let i = At(t), s, o;
  for (; ; )
    if (n < i) {
      if (t.nodeType != 1)
        break;
      let l = t.childNodes[n];
      if (nt(l, 1))
        s = t, o = ++n;
      else
        break;
    } else {
      if (qi(t))
        break;
      {
        let l = t.nextSibling;
        for (; l && nt(l, 1); )
          s = l.parentNode, o = P(l) + 1, l = l.nextSibling;
        if (l)
          t = l, n = 0, i = At(t);
        else {
          if (t = t.parentNode, t == r.dom)
            break;
          n = i = 0;
        }
      }
    }
  s && xn(r, s, o);
}
function qi(r) {
  let e = r.pmViewDesc;
  return e && e.node && e.node.isBlock;
}
function el(r, e) {
  for (; r && e == r.childNodes.length && !dt(r); )
    e = P(r) + 1, r = r.parentNode;
  for (; r && e < r.childNodes.length; ) {
    let t = r.childNodes[e];
    if (t.nodeType == 3)
      return t;
    if (t.nodeType == 1 && t.contentEditable == "false")
      break;
    r = t, e = 0;
  }
}
function tl(r, e) {
  for (; r && !e && !dt(r); )
    e = P(r), r = r.parentNode;
  for (; r && e; ) {
    let t = r.childNodes[e - 1];
    if (t.nodeType == 3)
      return t;
    if (t.nodeType == 1 && t.contentEditable == "false")
      break;
    r = t, e = r.childNodes.length;
  }
}
function xn(r, e, t) {
  if (e.nodeType != 3) {
    let s, o;
    (o = el(e, t)) ? (e = o, t = 0) : (s = tl(e, t)) && (e = s, t = s.nodeValue.length);
  }
  let n = r.domSelection();
  if (!n)
    return;
  if (Wt(n)) {
    let s = document.createRange();
    s.setEnd(e, t), s.setStart(e, t), n.removeAllRanges(), n.addRange(s);
  } else n.extend && n.extend(e, t);
  r.domObserver.setCurSelection();
  let { state: i } = r;
  setTimeout(() => {
    r.state == i && ce(r);
  }, 50);
}
function xr(r, e) {
  let t = r.state.doc.resolve(e);
  if (!(z || Di) && t.parent.inlineContent) {
    let i = r.coordsAtPos(e);
    if (e > t.start()) {
      let s = r.coordsAtPos(e - 1), o = (s.top + s.bottom) / 2;
      if (o > i.top && o < i.bottom && Math.abs(s.left - i.left) > 1)
        return s.left < i.left ? "ltr" : "rtl";
    }
    if (e < t.end()) {
      let s = r.coordsAtPos(e + 1), o = (s.top + s.bottom) / 2;
      if (o > i.top && o < i.bottom && Math.abs(s.left - i.left) > 1)
        return s.left > i.left ? "ltr" : "rtl";
    }
  }
  return getComputedStyle(r.dom).direction == "rtl" ? "rtl" : "ltr";
}
function kr(r, e, t) {
  let n = r.state.selection;
  if (n instanceof O && !n.empty || t.indexOf("s") > -1 || U && t.indexOf("m") > -1)
    return !1;
  let { $from: i, $to: s } = n;
  if (!i.parent.inlineContent || r.endOfTextblock(e < 0 ? "up" : "down")) {
    let o = bn(r.state, e);
    if (o && o instanceof k)
      return he(r, o);
  }
  if (!i.parent.inlineContent) {
    let o = e < 0 ? i : s, l = n instanceof _ ? C.near(o, e) : C.findFrom(o, e);
    return l ? he(r, l) : !1;
  }
  return !1;
}
function Sr(r, e) {
  if (!(r.state.selection instanceof O))
    return !0;
  let { $head: t, $anchor: n, empty: i } = r.state.selection;
  if (!t.sameParent(n))
    return !0;
  if (!i)
    return !1;
  if (r.endOfTextblock(e > 0 ? "forward" : "backward"))
    return !0;
  let s = !t.textOffset && (e < 0 ? t.nodeBefore : t.nodeAfter);
  if (s && !s.isText) {
    let o = r.state.tr;
    return e < 0 ? o.delete(t.pos - s.nodeSize, t.pos) : o.delete(t.pos, t.pos + s.nodeSize), r.dispatch(o), !0;
  }
  return !1;
}
function Cr(r, e, t) {
  r.domObserver.stop(), e.contentEditable = t, r.domObserver.start();
}
function nl(r) {
  if (!L || r.state.selection.$head.parentOffset > 0)
    return !1;
  let { focusNode: e, focusOffset: t } = r.domSelectionRange();
  if (e && e.nodeType == 1 && t == 0 && e.firstChild && e.firstChild.contentEditable == "false") {
    let n = e.firstChild;
    Cr(r, n, "true"), setTimeout(() => Cr(r, n, "false"), 20);
  }
  return !1;
}
function rl(r) {
  let e = "";
  return r.ctrlKey && (e += "c"), r.metaKey && (e += "m"), r.altKey && (e += "a"), r.shiftKey && (e += "s"), e;
}
function il(r, e) {
  let t = e.keyCode, n = rl(e);
  if (t == 8 || U && t == 72 && n == "c")
    return Sr(r, -1) || Fe(r, -1);
  if (t == 46 && !e.shiftKey || U && t == 68 && n == "c")
    return Sr(r, 1) || Fe(r, 1);
  if (t == 13 || t == 27)
    return !0;
  if (t == 37 || U && t == 66 && n == "c") {
    let i = t == 37 ? xr(r, r.state.selection.from) == "ltr" ? -1 : 1 : -1;
    return br(r, i, n) || Fe(r, i);
  } else if (t == 39 || U && t == 70 && n == "c") {
    let i = t == 39 ? xr(r, r.state.selection.from) == "ltr" ? 1 : -1 : 1;
    return br(r, i, n) || Fe(r, i);
  } else {
    if (t == 38 || U && t == 80 && n == "c")
      return kr(r, -1, n) || Fe(r, -1);
    if (t == 40 || U && t == 78 && n == "c")
      return nl(r) || kr(r, 1, n) || Fe(r, 1);
    if (n == (U ? "m" : "c") && (t == 66 || t == 73 || t == 89 || t == 90))
      return !0;
  }
  return !1;
}
function In(r, e) {
  r.someProp("transformCopied", (u) => {
    e = u(e, r);
  });
  let t = [], { content: n, openStart: i, openEnd: s } = e;
  for (; i > 1 && s > 1 && n.childCount == 1 && n.firstChild.childCount == 1; ) {
    i--, s--;
    let u = n.firstChild;
    t.push(u.type.name, u.attrs != u.type.defaultAttrs ? u.attrs : null), n = u.content;
  }
  let o = r.someProp("clipboardSerializer") || ze.fromSchema(r.state.schema), l = ji(), a = l.createElement("div");
  a.appendChild(o.serializeFragment(n, { document: l }));
  let c = a.firstChild, f, h = 0;
  for (; c && c.nodeType == 1 && (f = Ui[c.nodeName.toLowerCase()]); ) {
    for (let u = f.length - 1; u >= 0; u--) {
      let p = l.createElement(f[u]);
      for (; a.firstChild; )
        p.appendChild(a.firstChild);
      a.appendChild(p), h++;
    }
    c = a.firstChild;
  }
  c && c.nodeType == 1 && c.setAttribute("data-pm-slice", `${i} ${s}${h ? ` -${h}` : ""} ${JSON.stringify(t)}`);
  let d = r.someProp("clipboardTextSerializer", (u) => u(e, r)) || e.content.textBetween(0, e.content.size, `

`);
  return { dom: a, text: d, slice: e };
}
function $i(r, e, t, n, i) {
  let s = i.parent.type.spec.code, o, l;
  if (!t && !e)
    return null;
  let a = !!e && (n || s || !t);
  if (a) {
    if (r.someProp("transformPastedText", (d) => {
      e = d(e, s || n, r);
    }), s)
      return l = new b(y.from(r.state.schema.text(e.replace(/\r\n?/g, `
`))), 0, 0), r.someProp("transformPasted", (d) => {
        l = d(l, r, !0);
      }), l;
    let h = r.someProp("clipboardTextParser", (d) => d(e, i, n, r));
    if (h)
      l = h;
    else {
      let d = i.marks(), { schema: u } = r.state, p = ze.fromSchema(u);
      o = document.createElement("div"), e.split(/(?:\r\n?|\n)+/).forEach((m) => {
        let g = o.appendChild(document.createElement("p"));
        m && g.appendChild(p.serializeNode(u.text(m, d)));
      });
    }
  } else
    r.someProp("transformPastedHTML", (h) => {
      t = h(t, r);
    }), o = al(t), ut && cl(o);
  let c = o && o.querySelector("[data-pm-slice]"), f = c && /^(\d+) (\d+)(?: -(\d+))? (.*)/.exec(c.getAttribute("data-pm-slice") || "");
  if (f && f[3])
    for (let h = +f[3]; h > 0; h--) {
      let d = o.firstChild;
      for (; d && d.nodeType != 1; )
        d = d.nextSibling;
      if (!d)
        break;
      o = d;
    }
  if (l || (l = (r.someProp("clipboardParser") || r.someProp("domParser") || qe.fromSchema(r.state.schema)).parseSlice(o, {
    preserveWhitespace: !!(a || f),
    context: i,
    ruleFromNode(d) {
      return d.nodeName == "BR" && !d.nextSibling && d.parentNode && !sl.test(d.parentNode.nodeName) ? { ignore: !0 } : null;
    }
  })), f)
    l = fl(Mr(l, +f[1], +f[2]), f[4]);
  else if (l = b.maxOpen(ol(l.content, i), !0), l.openStart || l.openEnd) {
    let h = 0, d = 0;
    for (let u = l.content.firstChild; h < l.openStart && !u.type.spec.isolating; h++, u = u.firstChild)
      ;
    for (let u = l.content.lastChild; d < l.openEnd && !u.type.spec.isolating; d++, u = u.lastChild)
      ;
    l = Mr(l, h, d);
  }
  return r.someProp("transformPasted", (h) => {
    l = h(l, r, a);
  }), l;
}
const sl = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var)$/i;
function ol(r, e) {
  if (r.childCount < 2)
    return r;
  for (let t = e.depth; t >= 0; t--) {
    let i = e.node(t).contentMatchAt(e.index(t)), s, o = [];
    if (r.forEach((l) => {
      if (!o)
        return;
      let a = i.findWrapping(l.type), c;
      if (!a)
        return o = null;
      if (c = o.length && s.length && Hi(a, s, l, o[o.length - 1], 0))
        o[o.length - 1] = c;
      else {
        o.length && (o[o.length - 1] = _i(o[o.length - 1], s.length));
        let f = Ki(l, a);
        o.push(f), i = i.matchType(f.type), s = a;
      }
    }), o)
      return y.from(o);
  }
  return r;
}
function Ki(r, e, t = 0) {
  for (let n = e.length - 1; n >= t; n--)
    r = e[n].create(null, y.from(r));
  return r;
}
function Hi(r, e, t, n, i) {
  if (i < r.length && i < e.length && r[i] == e[i]) {
    let s = Hi(r, e, t, n.lastChild, i + 1);
    if (s)
      return n.copy(n.content.replaceChild(n.childCount - 1, s));
    if (n.contentMatchAt(n.childCount).matchType(i == r.length - 1 ? t.type : r[i + 1]))
      return n.copy(n.content.append(y.from(Ki(t, r, i + 1))));
  }
}
function _i(r, e) {
  if (e == 0)
    return r;
  let t = r.content.replaceChild(r.childCount - 1, _i(r.lastChild, e - 1)), n = r.contentMatchAt(r.childCount).fillBefore(y.empty, !0);
  return r.copy(t.append(n));
}
function kn(r, e, t, n, i, s) {
  let o = e < 0 ? r.firstChild : r.lastChild, l = o.content;
  return r.childCount > 1 && (s = 0), i < n - 1 && (l = kn(l, e, t, n, i + 1, s)), i >= t && (l = e < 0 ? o.contentMatchAt(0).fillBefore(l, s <= i).append(l) : l.append(o.contentMatchAt(o.childCount).fillBefore(y.empty, !0))), r.replaceChild(e < 0 ? 0 : r.childCount - 1, o.copy(l));
}
function Mr(r, e, t) {
  return e < r.openStart && (r = new b(kn(r.content, -1, e, r.openStart, 0, r.openEnd), e, r.openEnd)), t < r.openEnd && (r = new b(kn(r.content, 1, t, r.openEnd, 0, 0), r.openStart, t)), r;
}
const Ui = {
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
function ji() {
  return document.implementation.createHTMLDocument("title");
}
let Ge = null;
function ll(r) {
  let e = window.trustedTypes;
  if (!e)
    return r;
  if (!Ge) {
    if (Ge = e.defaultPolicy)
      try {
        return Ge.createHTML(r);
      } catch {
      }
    Ge = e.createPolicy("ProseMirrorClipboard", { createHTML: (t) => t });
  }
  return Ge.createHTML(r);
}
function al(r) {
  let e = /^(\s*<meta [^>]*>)*/.exec(r);
  e && (r = r.slice(e[0].length));
  let t = ji(), n = t.body, i = /<([a-z][^>\s]+)/i.exec(r), s;
  if ((s = i && Ui[i[1].toLowerCase()]) && (r = s.map((o) => "<" + o + ">").join("") + r + s.map((o) => "</" + o + ">").reverse().join("")), n.innerHTML = ll(r), s)
    for (let o = 0; o < s.length; o++)
      n = n.querySelector(s[o]) || n;
  for (let o = 0; o < t.styleSheets.length; o++) {
    let l = t.styleSheets[o];
    for (let a = 0; a < l.rules.length; a++) {
      let c = l.rules[a];
      if (c instanceof CSSStyleRule) {
        let f = n.querySelectorAll(c.selectorText);
        for (let h = 0; h < f.length; h++)
          f[h].style.cssText += c.style.cssText;
      }
    }
  }
  return n;
}
function cl(r) {
  let e = r.querySelectorAll(z ? "span:not([class]):not([style])" : "span.Apple-converted-space");
  for (let t = 0; t < e.length; t++) {
    let n = e[t];
    n.childNodes.length == 1 && n.textContent == " " && n.parentNode && n.parentNode.replaceChild(r.ownerDocument.createTextNode(" "), n);
  }
}
function fl(r, e) {
  if (!r.size)
    return r;
  let t = r.content.firstChild.type.schema, n;
  try {
    n = JSON.parse(e);
  } catch {
    return r;
  }
  let { content: i, openStart: s, openEnd: o } = r;
  for (let l = n.length - 2; l >= 0; l -= 2) {
    let a = t.nodes[n[l]];
    if (!a || a.hasRequiredAttrs())
      break;
    try {
      a.checkAttrs(n[l + 1]);
    } catch {
      break;
    }
    i = y.from(a.create(n[l + 1], i)), s++, o++;
  }
  return new b(i, s, o);
}
const J = {}, q = {}, hl = { touchstart: !0, touchmove: !0 };
class dl {
  constructor() {
    this.shiftKey = !1, this.mouseDown = null, this.lastKeyCode = null, this.lastKeyCodeTime = 0, this.lastClick = { time: 0, x: 0, y: 0, type: "", button: 0 }, this.lastSelectionOrigin = null, this.lastSelectionTime = 0, this.lastIOSEnter = 0, this.lastIOSEnterFallbackTimeout = -1, this.lastFocus = 0, this.lastTouch = 0, this.lastChromeDelete = 0, this.composing = !1, this.compositionNode = null, this.composingTimeout = -1, this.compositionNodes = [], this.compositionEndedAt = -2e8, this.compositionID = 1, this.badSafariComposition = !1, this.compositionPendingChanges = 0, this.domChangeCount = 0, this.eventHandlers = /* @__PURE__ */ Object.create(null), this.hideSelectionGuard = null;
  }
}
function ul(r) {
  for (let e in J) {
    let t = J[e];
    r.dom.addEventListener(e, r.input.eventHandlers[e] = (n) => {
      ml(r, n) && !Rn(r, n) && (r.editable || !(n.type in q)) && t(r, n);
    }, hl[e] ? { passive: !0 } : void 0);
  }
  L && r.dom.addEventListener("input", () => null), Sn(r);
}
function ae(r, e) {
  r.input.lastSelectionOrigin = e, r.input.lastSelectionTime = Date.now();
}
function pl(r) {
  r.input.mouseDown && r.input.mouseDown.done(), r.domObserver.stop();
  for (let e in r.input.eventHandlers)
    r.dom.removeEventListener(e, r.input.eventHandlers[e]);
  clearTimeout(r.input.composingTimeout), clearTimeout(r.input.lastIOSEnterFallbackTimeout);
}
function Sn(r) {
  r.someProp("handleDOMEvents", (e) => {
    for (let t in e)
      r.input.eventHandlers[t] || r.dom.addEventListener(t, r.input.eventHandlers[t] = (n) => Rn(r, n));
  });
}
function Rn(r, e) {
  return r.someProp("handleDOMEvents", (t) => {
    let n = t[e.type];
    return n ? n(r, e) || e.defaultPrevented : !1;
  });
}
function ml(r, e) {
  if (!e.bubbles)
    return !0;
  if (e.defaultPrevented)
    return !1;
  for (let t = e.target; t != r.dom; t = t.parentNode)
    if (!t || t.nodeType == 11 || t.pmViewDesc && t.pmViewDesc.stopEvent(e))
      return !1;
  return !0;
}
function gl(r, e) {
  !Rn(r, e) && J[e.type] && (r.editable || !(e.type in q)) && J[e.type](r, e);
}
q.keydown = (r, e) => {
  let t = e;
  if (r.input.shiftKey = t.keyCode == 16 || t.shiftKey, !Zi(r) && (r.input.lastKeyCode = t.keyCode, r.input.lastKeyCodeTime = Date.now(), !(le && z && t.keyCode == 13)))
    if (t.keyCode != 229 && r.domObserver.forceFlush(), He && t.keyCode == 13 && !t.ctrlKey && !t.altKey && !t.metaKey) {
      let n = Date.now();
      r.input.lastIOSEnter = n, r.input.lastIOSEnterFallbackTimeout = setTimeout(() => {
        r.input.lastIOSEnter == n && (r.someProp("handleKeyDown", (i) => i(r, Me(13, "Enter"))), r.input.lastIOSEnter = 0);
      }, 200);
    } else r.someProp("handleKeyDown", (n) => n(r, t)) || il(r, t) ? t.preventDefault() : ae(r, "key");
};
q.keyup = (r, e) => {
  e.keyCode == 16 && (r.input.shiftKey = !1);
};
q.keypress = (r, e) => {
  let t = e;
  if (Zi(r) || !t.charCode || t.ctrlKey && !t.altKey || U && t.metaKey)
    return;
  if (r.someProp("handleKeyPress", (i) => i(r, t))) {
    t.preventDefault();
    return;
  }
  let n = r.state.selection;
  if (!(n instanceof O) || !n.$from.sameParent(n.$to)) {
    let i = String.fromCharCode(t.charCode), s = () => r.state.tr.insertText(i).scrollIntoView();
    !/[\r\n]/.test(i) && !r.someProp("handleTextInput", (o) => o(r, n.$from.pos, n.$to.pos, i, s)) && r.dispatch(s()), t.preventDefault();
  }
};
function mt(r) {
  return { left: r.clientX, top: r.clientY };
}
function yl(r, e) {
  let t = e.x - r.clientX, n = e.y - r.clientY;
  return t * t + n * n < 100;
}
function Pn(r, e, t, n, i) {
  if (n == -1)
    return !1;
  let s = r.state.doc.resolve(n);
  for (let o = s.depth + 1; o > 0; o--)
    if (r.someProp(e, (l) => o > s.depth ? l(r, t, s.nodeAfter, s.before(o), i, !0) : l(r, t, s.node(o), s.before(o), i, !1)))
      return !0;
  return !1;
}
function gt(r, e, t) {
  if (r.focused || r.focus(), r.state.selection.eq(e))
    return;
  let n = r.state.tr.setSelection(e);
  n.setMeta("pointer", !0), r.dispatch(n);
}
function bl(r, e) {
  if (e == -1)
    return !1;
  let t = r.state.doc.resolve(e), n = t.nodeAfter;
  return n && n.isAtom && k.isSelectable(n) ? (gt(r, new k(t)), !0) : !1;
}
function xl(r, e) {
  if (e == -1)
    return !1;
  let t = r.state.selection, n, i;
  t instanceof k && (n = t.node);
  let s = r.state.doc.resolve(e);
  for (let o = s.depth + 1; o > 0; o--) {
    let l = o > s.depth ? s.nodeAfter : s.node(o);
    if (k.isSelectable(l)) {
      n && t.$from.depth > 0 && o >= t.$from.depth && s.before(t.$from.depth + 1) == t.$from.pos ? i = s.before(t.$from.depth) : i = s.before(o);
      break;
    }
  }
  return i != null ? (gt(r, k.create(r.state.doc, i)), !0) : !1;
}
function kl(r, e, t, n, i) {
  return Pn(r, "handleClickOn", e, t, n) || r.someProp("handleClick", (s) => s(r, e, n)) || (i ? xl(r, t) : bl(r, t));
}
function Sl(r, e, t, n) {
  return Pn(r, "handleDoubleClickOn", e, t, n) || r.someProp("handleDoubleClick", (i) => i(r, e, n));
}
function Cl(r, e, t, n) {
  return Pn(r, "handleTripleClickOn", e, t, n) || r.someProp("handleTripleClick", (i) => i(r, e, n)) || Ml(r, t, n);
}
function Ml(r, e, t) {
  if (t.button != 0)
    return !1;
  let n = Gi(r, e, !0), i = r.state.doc;
  return n ? (gt(r, n), n instanceof O && i.eq(r.state.doc) && (r.input.mouseDown = new Nl(r, n)), !0) : !1;
}
function Gi(r, e, t) {
  let n = r.state.doc;
  if (e == -1)
    return n.inlineContent ? O.create(n, 0, n.content.size) : null;
  let i = n.resolve(e);
  for (let s = i.depth + 1; s > 0; s--) {
    let o = s > i.depth ? i.nodeAfter : i.node(s), l = i.before(s);
    if (o.inlineContent)
      return O.create(n, l + 1, l + 1 + o.content.size);
    if (t && k.isSelectable(o))
      return k.create(n, l);
  }
  return null;
}
function vn(r) {
  return It(r);
}
const Yi = U ? "metaKey" : "ctrlKey";
J.mousedown = (r, e) => {
  let t = e;
  r.input.shiftKey = t.shiftKey;
  let n = vn(r), i = Date.now(), s = "singleClick";
  i - r.input.lastClick.time < 500 && yl(t, r.input.lastClick) && !t[Yi] && r.input.lastClick.button == t.button && (r.input.lastClick.type == "singleClick" ? s = "doubleClick" : r.input.lastClick.type == "doubleClick" && (s = "tripleClick")), r.input.lastClick = { time: i, x: t.clientX, y: t.clientY, type: s, button: t.button }, r.input.mouseDown && r.input.mouseDown.done();
  let o = r.posAtCoords(mt(t));
  o && (s == "singleClick" ? r.input.mouseDown = new Ol(r, o, t, !!n) : (s == "doubleClick" ? Sl : Cl)(r, o.pos, o.inside, t) ? t.preventDefault() : ae(r, "pointer"));
};
class Xi {
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
class Ol extends Xi {
  constructor(e, t, n, i) {
    super(e), this.pos = t, this.event = n, this.flushed = i, this.delayedSelectionSync = !1, this.startDoc = e.state.doc, this.selectNode = !!n[Yi], this.allowDefault = n.shiftKey;
    let s, o;
    if (t.inside > -1)
      s = e.state.doc.nodeAt(t.inside), o = t.inside;
    else {
      let f = e.state.doc.resolve(t.pos);
      s = f.parent, o = f.depth ? f.before() : 0;
    }
    const l = i ? null : n.target, a = l ? e.docView.nearestDesc(l, !0) : null;
    this.target = a && a.nodeDOM.nodeType == 1 ? a.nodeDOM : null;
    let { selection: c } = e.state;
    n.button == 0 && (s.type.spec.draggable && s.type.spec.selectable !== !1 || c instanceof k && c.from <= o && c.to > o) && (this.mightDrag = {
      node: s,
      pos: o,
      addAttr: !!(this.target && !this.target.draggable),
      setUneditable: !!(this.target && G && !this.target.hasAttribute("contentEditable"))
    }), this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable) && (this.view.domObserver.stop(), this.mightDrag.addAttr && (this.target.draggable = !0), this.mightDrag.setUneditable && setTimeout(() => {
      this.view.input.mouseDown == this && this.target.setAttribute("contentEditable", "false");
    }, 20), this.view.domObserver.start()), ae(e, "pointer");
  }
  done() {
    super.done(), this.mightDrag && this.target && (this.view.domObserver.stop(), this.mightDrag.addAttr && this.target.removeAttribute("draggable"), this.mightDrag.setUneditable && this.target.removeAttribute("contentEditable"), this.view.domObserver.start()), this.delayedSelectionSync && setTimeout(() => {
      this.view.isDestroyed || ce(this.view);
    });
  }
  up(e) {
    if (this.done(), !this.view.dom.contains(e.target))
      return;
    let t = this.pos;
    this.view.state.doc != this.startDoc && (t = this.view.posAtCoords(mt(e))), this.updateAllowDefault(e), this.allowDefault || !t ? ae(this.view, "pointer") : kl(this.view, t.pos, t.inside, e, this.selectNode) ? e.preventDefault() : e.button == 0 && (this.flushed || // Safari ignores clicks on draggable elements
    L && this.mightDrag && !this.mightDrag.node.isAtom || // Chrome will sometimes treat a node selection as a
    // cursor, but still report that the node is selected
    // when asked through getSelection. You'll then get a
    // situation where clicking at the point where that
    // (hidden) cursor is doesn't change the selection, and
    // thus doesn't get a reaction from ProseMirror. This
    // works around that.
    z && !this.view.state.selection.visible && Math.min(Math.abs(t.pos - this.view.state.selection.from), Math.abs(t.pos - this.view.state.selection.to)) <= 2) ? (gt(this.view, C.near(this.view.state.doc.resolve(t.pos))), e.preventDefault()) : ae(this.view, "pointer");
  }
  move(e) {
    this.updateAllowDefault(e), ae(this.view, "pointer"), super.move(e);
  }
  updateAllowDefault(e) {
    !this.allowDefault && (Math.abs(this.event.x - e.clientX) > 4 || Math.abs(this.event.y - e.clientY) > 4) && (this.allowDefault = !0);
  }
  delaySelUpdate() {
    return this.allowDefault ? (this.delayedSelectionSync = !0, !0) : !1;
  }
}
class Nl extends Xi {
  constructor(e, t) {
    super(e), this.startSelection = t, this.startDoc = e.state.doc;
  }
  move(e) {
    if (e.buttons == 0 || this.view.isDestroyed || !this.view.state.doc.eq(this.startDoc)) {
      this.done();
      return;
    }
    e.preventDefault(), ae(this.view, "pointer");
    let t = this.view.posAtCoords(mt(e)), n = t && Gi(this.view, t.inside, !1);
    if (!n)
      return;
    let { doc: i } = this.view.state, s = this.startSelection, [o, l] = n.from < s.from ? [s.to, n.from] : [s.from, n.to];
    gt(this.view, O.create(i, o, l));
  }
}
J.touchstart = (r) => {
  r.input.lastTouch = Date.now(), vn(r), ae(r, "pointer");
};
J.touchmove = (r) => {
  r.input.lastTouch = Date.now(), ae(r, "pointer");
};
J.contextmenu = (r) => vn(r);
function Zi(r, e) {
  return r.composing ? !0 : L && Math.abs(Date.now() - r.input.compositionEndedAt) < 500 ? (r.input.compositionEndedAt = -2e8, !0) : !1;
}
const wl = le ? 5e3 : -1;
q.compositionstart = q.compositionupdate = (r) => {
  if (!r.composing) {
    r.domObserver.flush();
    let { state: e } = r, t = e.selection.$to;
    if (e.selection instanceof O && (e.storedMarks || !t.textOffset && t.parentOffset && t.nodeBefore.marks.some((n) => n.type.spec.inclusive === !1) || z && Di && Dl(r)))
      r.markCursor = r.state.storedMarks || t.marks(), It(r, !0), r.markCursor = null;
    else if (It(r, !e.selection.empty), G && e.selection.empty && t.parentOffset && !t.textOffset && t.nodeBefore.marks.length) {
      let n = r.domSelectionRange();
      for (let i = n.focusNode, s = n.focusOffset; i && i.nodeType == 1 && s != 0; ) {
        let o = s < 0 ? i.lastChild : i.childNodes[s - 1];
        if (!o)
          break;
        if (o.nodeType == 3) {
          let l = r.domSelection();
          l && l.collapse(o, o.nodeValue.length);
          break;
        } else
          i = o, s = -1;
      }
    }
    r.input.composing = !0;
  }
  Qi(r, wl);
};
function Dl(r) {
  let { focusNode: e, focusOffset: t } = r.domSelectionRange();
  if (!e || e.nodeType != 1 || t >= e.childNodes.length)
    return !1;
  let n = e.childNodes[t];
  return n.nodeType == 1 && n.contentEditable == "false";
}
q.compositionend = (r, e) => {
  r.composing && (r.input.composing = !1, r.input.compositionEndedAt = Date.now(), r.input.compositionPendingChanges = r.domObserver.pendingRecords().length ? r.input.compositionID : 0, r.input.compositionNode = null, r.input.badSafariComposition ? r.domObserver.forceFlush() : r.input.compositionPendingChanges && Promise.resolve().then(() => r.domObserver.flush()), r.input.compositionID++, Qi(r, 20));
};
function Qi(r, e) {
  clearTimeout(r.input.composingTimeout), e > -1 && (r.input.composingTimeout = setTimeout(() => It(r), e));
}
function es(r) {
  for (r.composing && (r.input.composing = !1, r.input.compositionEndedAt = Date.now()); r.input.compositionNodes.length > 0; )
    r.input.compositionNodes.pop().markParentsDirty();
}
function Tl(r) {
  let e = r.domSelectionRange();
  if (!e.focusNode)
    return null;
  let t = xo(e.focusNode, e.focusOffset), n = ko(e.focusNode, e.focusOffset);
  if (t && n && t != n) {
    let i = n.pmViewDesc, s = r.domObserver.lastChangedTextNode;
    if (t == s || n == s)
      return s;
    if (!i || !i.isText(n.nodeValue))
      return n;
    if (r.input.compositionNode == n) {
      let o = t.pmViewDesc;
      if (!(!o || !o.isText(t.nodeValue)))
        return n;
    }
  }
  return t || n;
}
function It(r, e = !1) {
  if (!(le && r.domObserver.flushingSoon >= 0)) {
    if (r.domObserver.forceFlush(), es(r), e || r.docView && r.docView.dirty) {
      let t = En(r), n = r.state.selection;
      return t && !t.eq(n) ? r.dispatch(r.state.tr.setSelection(t)) : (r.markCursor || e) && !n.$from.node(n.$from.sharedDepth(n.to)).inlineContent ? r.dispatch(r.state.tr.deleteSelection()) : r.updateState(r.state), !0;
    }
    return !1;
  }
}
function El(r, e) {
  if (!r.dom.parentNode)
    return;
  let t = r.dom.parentNode.appendChild(document.createElement("div"));
  t.appendChild(e), t.style.cssText = "position: fixed; left: -10000px; top: 10px";
  let n = getSelection(), i = document.createRange();
  i.selectNodeContents(e), r.dom.blur(), n.removeAllRanges(), n.addRange(i), setTimeout(() => {
    t.parentNode && t.parentNode.removeChild(t), r.focus();
  }, 50);
}
const ct = K && ge < 15 || He && Oo < 604;
J.copy = q.cut = (r, e) => {
  let t = e, n = r.state.selection, i = t.type == "cut";
  if (n.empty)
    return;
  let s = ct ? null : t.clipboardData, o = n.content(), { dom: l, text: a } = In(r, o);
  s ? (t.preventDefault(), s.clearData(), s.setData("text/html", l.innerHTML), s.setData("text/plain", a)) : El(r, l), i && r.dispatch(r.state.tr.deleteSelection().scrollIntoView().setMeta("uiEvent", "cut"));
};
function Al(r) {
  return r.openStart == 0 && r.openEnd == 0 && r.content.childCount == 1 ? r.content.firstChild : null;
}
function Il(r, e) {
  if (!r.dom.parentNode)
    return;
  let t = r.input.shiftKey || r.state.selection.$from.parent.type.spec.code, n = r.dom.parentNode.appendChild(document.createElement(t ? "textarea" : "div"));
  t || (n.contentEditable = "true"), n.style.cssText = "position: fixed; left: -10000px; top: 10px", n.focus();
  let i = r.input.shiftKey && r.input.lastKeyCode != 45;
  setTimeout(() => {
    r.focus(), n.parentNode && n.parentNode.removeChild(n), t ? ft(r, n.value, null, i, e) : ft(r, n.textContent, n.innerHTML, i, e);
  }, 50);
}
function ft(r, e, t, n, i) {
  let s = $i(r, e, t, n, r.state.selection.$from);
  if (r.someProp("handlePaste", (a) => a(r, i, s || b.empty)))
    return !0;
  if (!s)
    return !1;
  let o = Al(s), l = o ? r.state.tr.replaceSelectionWith(o, n) : r.state.tr.replaceSelection(s);
  return r.dispatch(l.scrollIntoView().setMeta("paste", !0).setMeta("uiEvent", "paste")), !0;
}
function ts(r) {
  let e = r.getData("text/plain") || r.getData("Text");
  if (e)
    return e;
  let t = r.getData("text/uri-list");
  return t ? t.replace(/\r?\n/g, " ") : "";
}
q.paste = (r, e) => {
  let t = e;
  if (r.composing && !le)
    return;
  let n = ct ? null : t.clipboardData, i = r.input.shiftKey && r.input.lastKeyCode != 45;
  n && ft(r, ts(n), n.getData("text/html"), i, t) ? t.preventDefault() : Il(r, t);
};
class ns {
  constructor(e, t, n) {
    this.slice = e, this.move = t, this.node = n;
  }
}
const Rl = U ? "altKey" : "ctrlKey";
function rs(r, e) {
  let t;
  return r.someProp("dragCopies", (n) => {
    t = t || n(e);
  }), t != null ? !t : !e[Rl];
}
J.dragstart = (r, e) => {
  let t = e, n = r.input.mouseDown;
  if (n && n.done(), !t.dataTransfer)
    return;
  let i = r.state.selection, s = i.empty ? null : r.posAtCoords(mt(t)), o;
  if (!(s && s.pos >= i.from && s.pos <= (i instanceof k ? i.to - 1 : i.to))) {
    if (n && n.mightDrag)
      o = k.create(r.state.doc, n.mightDrag.pos);
    else if (t.target && t.target.nodeType == 1) {
      let h = r.docView.nearestDesc(t.target, !0);
      h && h.node.type.spec.draggable && h != r.docView && (o = k.create(r.state.doc, h.posBefore));
    }
  }
  let l = (o || r.state.selection).content(), { dom: a, text: c, slice: f } = In(r, l);
  (!t.dataTransfer.files.length || !z || wi > 120) && t.dataTransfer.clearData(), t.dataTransfer.setData(ct ? "Text" : "text/html", a.innerHTML), t.dataTransfer.effectAllowed = "copyMove", ct || t.dataTransfer.setData("text/plain", c), r.dragging = new ns(f, rs(r, t), o);
};
J.dragend = (r) => {
  let e = r.dragging;
  window.setTimeout(() => {
    r.dragging == e && (r.dragging = null);
  }, 50);
};
q.dragover = q.dragenter = (r, e) => e.preventDefault();
q.drop = (r, e) => {
  try {
    Pl(r, e, r.dragging);
  } finally {
    r.dragging = null;
  }
};
function Pl(r, e, t) {
  if (!e.dataTransfer)
    return;
  let n = r.posAtCoords(mt(e));
  if (!n)
    return;
  let i = r.state.doc.resolve(n.pos), s = t && t.slice;
  s ? r.someProp("transformPasted", (u) => {
    s = u(s, r, !1);
  }) : s = $i(r, ts(e.dataTransfer), ct ? null : e.dataTransfer.getData("text/html"), !1, i);
  let o = !!(t && rs(r, e));
  if (r.someProp("handleDrop", (u) => u(r, e, s || b.empty, o))) {
    e.preventDefault();
    return;
  }
  if (!s)
    return;
  e.preventDefault();
  let l = s ? io(r.state.doc, i.pos, s) : i.pos;
  l == null && (l = i.pos);
  let a = r.state.tr;
  if (o) {
    let { node: u } = t;
    u ? u.replace(a) : a.deleteSelection();
  }
  let c = a.mapping.map(l), f = s.openStart == 0 && s.openEnd == 0 && s.content.childCount == 1, h = a.doc;
  if (f ? a.replaceRangeWith(c, c, s.content.firstChild) : a.replaceRange(c, c, s), a.doc.eq(h))
    return;
  let d = a.doc.resolve(c);
  if (f && k.isSelectable(s.content.firstChild) && d.nodeAfter && d.nodeAfter.sameMarkup(s.content.firstChild))
    a.setSelection(new k(d));
  else {
    let u = a.mapping.map(l);
    a.mapping.maps[a.mapping.maps.length - 1].forEach((p, m, g, x) => u = x), a.setSelection(An(r, d, a.doc.resolve(u)));
  }
  r.focus(), r.dispatch(a.setMeta("uiEvent", "drop"));
}
J.focus = (r) => {
  r.input.lastFocus = Date.now(), r.focused || (r.domObserver.stop(), r.dom.classList.add("ProseMirror-focused"), r.domObserver.start(), r.focused = !0, setTimeout(() => {
    r.docView && r.hasFocus() && !r.domObserver.currentSelection.eq(r.domSelectionRange()) && ce(r);
  }, 20));
};
J.blur = (r, e) => {
  let t = e;
  r.focused && (r.domObserver.stop(), r.dom.classList.remove("ProseMirror-focused"), r.domObserver.start(), t.relatedTarget && r.dom.contains(t.relatedTarget) && r.domObserver.currentSelection.clear(), r.focused = !1);
};
J.beforeinput = (r, e) => {
  if (le && e.inputType == "deleteContentBackward") {
    r.domObserver.flushSoon();
    let { domChangeCount: n } = r.input;
    setTimeout(() => {
      if (r.input.domChangeCount != n || (r.dom.blur(), r.focus(), r.someProp("handleKeyDown", (s) => s(r, Me(8, "Backspace")))))
        return;
      let { $cursor: i } = r.state.selection;
      i && i.pos > 0 && r.dispatch(r.state.tr.delete(i.pos - 1, i.pos).scrollIntoView());
    }, 50);
  }
};
for (let r in q)
  J[r] = q[r];
function ht(r, e) {
  if (r == e)
    return !0;
  for (let t in r)
    if (r[t] !== e[t])
      return !1;
  for (let t in e)
    if (!(t in r))
      return !1;
  return !0;
}
class Rt {
  constructor(e, t) {
    this.toDOM = e, this.spec = t || Ee, this.side = this.spec.side || 0;
  }
  map(e, t, n, i) {
    let { pos: s, deleted: o } = e.mapResult(t.from + i, this.side < 0 ? -1 : 1);
    return o ? null : new Z(s - n, s - n, this);
  }
  valid() {
    return !0;
  }
  eq(e) {
    return this == e || e instanceof Rt && (this.spec.key && this.spec.key == e.spec.key || this.toDOM == e.toDOM && ht(this.spec, e.spec));
  }
  destroy(e) {
    this.spec.destroy && this.spec.destroy(e);
  }
}
class xe {
  constructor(e, t) {
    this.attrs = e, this.spec = t || Ee;
  }
  map(e, t, n, i) {
    let s = e.map(t.from + i, this.spec.inclusiveStart ? -1 : 1) - n, o = e.map(t.to + i, this.spec.inclusiveEnd ? 1 : -1) - n;
    return s >= o ? null : new Z(s, o, this);
  }
  valid(e, t) {
    return t.from < t.to;
  }
  eq(e) {
    return this == e || e instanceof xe && ht(this.attrs, e.attrs) && ht(this.spec, e.spec);
  }
  static is(e) {
    return e.type instanceof xe;
  }
  destroy() {
  }
}
class zn {
  constructor(e, t) {
    this.attrs = e, this.spec = t || Ee;
  }
  map(e, t, n, i) {
    let s = e.mapResult(t.from + i, 1);
    if (s.deleted)
      return null;
    let o = e.mapResult(t.to + i, -1);
    return o.deleted || o.pos <= s.pos ? null : new Z(s.pos - n, o.pos - n, this);
  }
  valid(e, t) {
    let { index: n, offset: i } = e.content.findIndex(t.from), s;
    return i == t.from && !(s = e.child(n)).isText && i + s.nodeSize == t.to;
  }
  eq(e) {
    return this == e || e instanceof zn && ht(this.attrs, e.attrs) && ht(this.spec, e.spec);
  }
  destroy() {
  }
}
class Z {
  /**
  @internal
  */
  constructor(e, t, n) {
    this.from = e, this.to = t, this.type = n;
  }
  /**
  @internal
  */
  copy(e, t) {
    return new Z(e, t, this.type);
  }
  /**
  @internal
  */
  eq(e, t = 0) {
    return this.type.eq(e.type) && this.from + t == e.from && this.to + t == e.to;
  }
  /**
  @internal
  */
  map(e, t, n) {
    return this.type.map(e, this, t, n);
  }
  /**
  Creates a widget decoration, which is a DOM node that's shown in
  the document at the given position. It is recommended that you
  delay rendering the widget by passing a function that will be
  called when the widget is actually drawn in a view, but you can
  also directly pass a DOM node. `getPos` can be used to find the
  widget's current document position.
  */
  static widget(e, t, n) {
    return new Z(e, e, new Rt(t, n));
  }
  /**
  Creates an inline decoration, which adds the given attributes to
  each inline node between `from` and `to`.
  */
  static inline(e, t, n, i) {
    return new Z(e, t, new xe(n, i));
  }
  /**
  Creates a node decoration. `from` and `to` should point precisely
  before and after a node in the document. That node, and only that
  node, will receive the given attributes.
  */
  static node(e, t, n, i) {
    return new Z(e, t, new zn(n, i));
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
    return this.type instanceof xe;
  }
  /**
  @internal
  */
  get widget() {
    return this.type instanceof Rt;
  }
}
const Le = [], Ee = {};
class A {
  /**
  @internal
  */
  constructor(e, t) {
    this.local = e.length ? e : Le, this.children = t.length ? t : Le;
  }
  /**
  Create a set of decorations, using the structure of the given
  document. This will consume (modify) the `decorations` array, so
  you must make a copy if you want need to preserve that.
  */
  static create(e, t) {
    return t.length ? Pt(t, e, 0, Ee) : F;
  }
  /**
  Find all decorations in this set which touch the given range
  (including decorations that start or end directly at the
  boundaries) and match the given predicate on their spec. When
  `start` and `end` are omitted, all decorations in the set are
  considered. When `predicate` isn't given, all decorations are
  assumed to match.
  */
  find(e, t, n) {
    let i = [];
    return this.findInner(e ?? 0, t ?? 1e9, i, 0, n), i;
  }
  findInner(e, t, n, i, s) {
    for (let o = 0; o < this.local.length; o++) {
      let l = this.local[o];
      l.from <= t && l.to >= e && (!s || s(l.spec)) && n.push(l.copy(l.from + i, l.to + i));
    }
    for (let o = 0; o < this.children.length; o += 3)
      if (this.children[o] < t && this.children[o + 1] > e) {
        let l = this.children[o] + 1;
        this.children[o + 2].findInner(e - l, t - l, n, i + l, s);
      }
  }
  /**
  Map the set of decorations in response to a change in the
  document.
  */
  map(e, t, n) {
    return this == F || e.maps.length == 0 ? this : this.mapInner(e, t, 0, 0, n || Ee);
  }
  /**
  @internal
  */
  mapInner(e, t, n, i, s) {
    let o;
    for (let l = 0; l < this.local.length; l++) {
      let a = this.local[l].map(e, n, i);
      a && a.type.valid(t, a) ? (o || (o = [])).push(a) : s.onRemove && s.onRemove(this.local[l].spec);
    }
    return this.children.length ? vl(this.children, o || [], e, t, n, i, s) : o ? new A(o.sort(Ae), Le) : F;
  }
  /**
  Add the given array of decorations to the ones in the set,
  producing a new set. Consumes the `decorations` array. Needs
  access to the current document to create the appropriate tree
  structure.
  */
  add(e, t) {
    return t.length ? this == F ? A.create(e, t) : this.addInner(e, t, 0) : this;
  }
  addInner(e, t, n) {
    let i, s = 0;
    e.forEach((l, a) => {
      let c = a + n, f;
      if (f = ss(t, l, c)) {
        for (i || (i = this.children.slice()); s < i.length && i[s] < a; )
          s += 3;
        i[s] == a ? i[s + 2] = i[s + 2].addInner(l, f, c + 1) : i.splice(s, 0, a, a + l.nodeSize, Pt(f, l, c + 1, Ee)), s += 3;
      }
    });
    let o = is(s ? ls(t) : t, -n);
    for (let l = 0; l < o.length; l++)
      o[l].type.valid(e, o[l]) || o.splice(l--, 1);
    return new A(o.length ? this.local.concat(o).sort(Ae) : this.local, i || this.children);
  }
  /**
  Create a new set that contains the decorations in this set, minus
  the ones in the given array.
  */
  remove(e) {
    return e.length == 0 || this == F ? this : this.removeInner(e, 0);
  }
  removeInner(e, t) {
    let n = this.children, i = this.local;
    for (let s = 0; s < n.length; s += 3) {
      let o, l = n[s] + t, a = n[s + 1] + t;
      for (let f = 0, h; f < e.length; f++)
        (h = e[f]) && h.from > l && h.to < a && (e[f] = null, (o || (o = [])).push(h));
      if (!o)
        continue;
      n == this.children && (n = this.children.slice());
      let c = n[s + 2].removeInner(o, l + 1);
      c != F ? n[s + 2] = c : (n.splice(s, 3), s -= 3);
    }
    if (i.length) {
      for (let s = 0, o; s < e.length; s++)
        if (o = e[s])
          for (let l = 0; l < i.length; l++)
            i[l].eq(o, t) && (i == this.local && (i = this.local.slice()), i.splice(l--, 1));
    }
    return n == this.children && i == this.local ? this : i.length || n.length ? new A(i, n) : F;
  }
  forChild(e, t) {
    if (this == F)
      return this;
    if (t.isLeaf)
      return A.empty;
    let n, i;
    for (let l = 0; l < this.children.length; l += 3)
      if (this.children[l] >= e) {
        this.children[l] == e && (n = this.children[l + 2]);
        break;
      }
    let s = e + 1, o = s + t.content.size;
    for (let l = 0; l < this.local.length; l++) {
      let a = this.local[l];
      if (a.from < o && a.to > s && a.type instanceof xe) {
        let c = Math.max(s, a.from) - s, f = Math.min(o, a.to) - s;
        c < f && (i || (i = [])).push(a.copy(c, f));
      }
    }
    if (i) {
      let l = new A(i.sort(Ae), Le);
      return n ? new ue([l, n]) : l;
    }
    return n || F;
  }
  /**
  @internal
  */
  eq(e) {
    if (this == e)
      return !0;
    if (!(e instanceof A) || this.local.length != e.local.length || this.children.length != e.children.length)
      return !1;
    for (let t = 0; t < this.local.length; t++)
      if (!this.local[t].eq(e.local[t]))
        return !1;
    for (let t = 0; t < this.children.length; t += 3)
      if (this.children[t] != e.children[t] || this.children[t + 1] != e.children[t + 1] || !this.children[t + 2].eq(e.children[t + 2]))
        return !1;
    return !0;
  }
  /**
  @internal
  */
  locals(e) {
    return Bn(this.localsInner(e));
  }
  /**
  @internal
  */
  localsInner(e) {
    if (this == F)
      return Le;
    if (e.inlineContent || !this.local.some(xe.is))
      return this.local;
    let t = [];
    for (let n = 0; n < this.local.length; n++)
      this.local[n].type instanceof xe || t.push(this.local[n]);
    return t;
  }
  forEachSet(e) {
    e(this);
  }
}
A.empty = new A([], []);
A.removeOverlap = Bn;
const F = A.empty;
class ue {
  constructor(e) {
    this.members = e;
  }
  map(e, t) {
    const n = this.members.map((i) => i.map(e, t, Ee));
    return ue.from(n);
  }
  forChild(e, t) {
    if (t.isLeaf)
      return A.empty;
    let n = [];
    for (let i = 0; i < this.members.length; i++) {
      let s = this.members[i].forChild(e, t);
      s != F && (s instanceof ue ? n = n.concat(s.members) : n.push(s));
    }
    return ue.from(n);
  }
  eq(e) {
    if (!(e instanceof ue) || e.members.length != this.members.length)
      return !1;
    for (let t = 0; t < this.members.length; t++)
      if (!this.members[t].eq(e.members[t]))
        return !1;
    return !0;
  }
  locals(e) {
    let t, n = !0;
    for (let i = 0; i < this.members.length; i++) {
      let s = this.members[i].localsInner(e);
      if (s.length)
        if (!t)
          t = s;
        else {
          n && (t = t.slice(), n = !1);
          for (let o = 0; o < s.length; o++)
            t.push(s[o]);
        }
    }
    return t ? Bn(n ? t : t.sort(Ae)) : Le;
  }
  // Create a group for the given array of decoration sets, or return
  // a single set when possible.
  static from(e) {
    switch (e.length) {
      case 0:
        return F;
      case 1:
        return e[0];
      default:
        return new ue(e.every((t) => t instanceof A) ? e : e.reduce((t, n) => t.concat(n instanceof A ? n : n.members), []));
    }
  }
  forEachSet(e) {
    for (let t = 0; t < this.members.length; t++)
      this.members[t].forEachSet(e);
  }
}
function vl(r, e, t, n, i, s, o) {
  let l = r.slice();
  for (let c = 0, f = s; c < t.maps.length; c++) {
    let h = 0;
    t.maps[c].forEach((d, u, p, m) => {
      let g = m - p - (u - d);
      for (let x = 0; x < l.length; x += 3) {
        let N = l[x + 1];
        if (N < 0 || d > N + f - h)
          continue;
        let w = l[x] + f - h;
        u >= w ? l[x + 1] = d <= w ? -2 : -1 : d >= f && g && (l[x] += g, l[x + 1] += g);
      }
      h += g;
    }), f = t.maps[c].map(f, -1);
  }
  let a = !1;
  for (let c = 0; c < l.length; c += 3)
    if (l[c + 1] < 0) {
      if (l[c + 1] == -2) {
        a = !0, l[c + 1] = -1;
        continue;
      }
      let f = t.map(r[c] + s), h = f - i;
      if (h < 0 || h >= n.content.size) {
        a = !0;
        continue;
      }
      let d = t.map(r[c + 1] + s, -1), u = d - i, { index: p, offset: m } = n.content.findIndex(h), g = n.maybeChild(p);
      if (g && m == h && m + g.nodeSize == u) {
        let x = l[c + 2].mapInner(t, g, f + 1, r[c] + s + 1, o);
        x != F ? (l[c] = h, l[c + 1] = u, l[c + 2] = x) : (l[c + 1] = -2, a = !0);
      } else
        a = !0;
    }
  if (a) {
    let c = zl(l, r, e, t, i, s, o), f = Pt(c, n, 0, o);
    e = f.local;
    for (let h = 0; h < l.length; h += 3)
      l[h + 1] < 0 && (l.splice(h, 3), h -= 3);
    for (let h = 0, d = 0; h < f.children.length; h += 3) {
      let u = f.children[h];
      for (; d < l.length && l[d] < u; )
        d += 3;
      l.splice(d, 0, f.children[h], f.children[h + 1], f.children[h + 2]);
    }
  }
  return new A(e.sort(Ae), l);
}
function is(r, e) {
  if (!e || !r.length)
    return r;
  let t = [];
  for (let n = 0; n < r.length; n++) {
    let i = r[n];
    t.push(new Z(i.from + e, i.to + e, i.type));
  }
  return t;
}
function zl(r, e, t, n, i, s, o) {
  function l(a, c) {
    for (let f = 0; f < a.local.length; f++) {
      let h = a.local[f].map(n, i, c);
      h ? t.push(h) : o.onRemove && o.onRemove(a.local[f].spec);
    }
    for (let f = 0; f < a.children.length; f += 3)
      l(a.children[f + 2], a.children[f] + c + 1);
  }
  for (let a = 0; a < r.length; a += 3)
    r[a + 1] == -1 && l(r[a + 2], e[a] + s + 1);
  return t;
}
function ss(r, e, t) {
  if (e.isLeaf)
    return null;
  let n = t + e.nodeSize, i = null;
  for (let s = 0, o; s < r.length; s++)
    (o = r[s]) && o.from > t && o.to < n && ((i || (i = [])).push(o), r[s] = null);
  return i;
}
function ls(r) {
  let e = [];
  for (let t = 0; t < r.length; t++)
    r[t] != null && e.push(r[t]);
  return e;
}
function Pt(r, e, t, n) {
  let i = [], s = !1;
  e.forEach((l, a) => {
    let c = ss(r, l, a + t);
    if (c) {
      s = !0;
      let f = Pt(c, l, t + a + 1, n);
      f != F && i.push(a, a + l.nodeSize, f);
    }
  });
  let o = is(s ? ls(r) : r, -t).sort(Ae);
  for (let l = 0; l < o.length; l++)
    o[l].type.valid(e, o[l]) || (n.onRemove && n.onRemove(o[l].spec), o.splice(l--, 1));
  return o.length || i.length ? new A(o, i) : F;
}
function Ae(r, e) {
  return r.from - e.from || r.to - e.to;
}
function Bn(r) {
  let e = r;
  for (let t = 0; t < e.length - 1; t++) {
    let n = e[t];
    if (n.from != n.to)
      for (let i = t + 1; i < e.length; i++) {
        let s = e[i];
        if (s.from == n.from) {
          s.to != n.to && (e == r && (e = r.slice()), e[i] = s.copy(s.from, n.to), Or(e, i + 1, s.copy(n.to, s.to)));
          continue;
        } else {
          s.from < n.to && (e == r && (e = r.slice()), e[t] = n.copy(n.from, s.from), Or(e, i, n.copy(s.from, n.to)));
          break;
        }
      }
  }
  return e;
}
function Or(r, e, t) {
  for (; e < r.length && Ae(t, r[e]) > 0; )
    e++;
  r.splice(e, 0, t);
}
function Zt(r) {
  let e = [];
  return r.someProp("decorations", (t) => {
    let n = t(r.state);
    n && n != F && e.push(n);
  }), r.cursorWrapper && e.push(A.create(r.state.doc, [r.cursorWrapper.deco])), ue.from(e);
}
const Bl = {
  childList: !0,
  characterData: !0,
  characterDataOldValue: !0,
  attributes: !0,
  attributeOldValue: !0,
  subtree: !0
}, Fl = K && ge <= 11;
class Vl {
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
class Ll {
  constructor(e, t) {
    this.view = e, this.handleDOMChange = t, this.queue = [], this.flushingSoon = -1, this.observer = null, this.currentSelection = new Vl(), this.onCharData = null, this.suppressingSelectionUpdates = !1, this.lastChangedTextNode = null, this.observer = window.MutationObserver && new window.MutationObserver((n) => {
      for (let i = 0; i < n.length; i++)
        this.queue.push(n[i]);
      K && ge <= 11 && n.some((i) => i.type == "childList" && i.removedNodes.length || i.type == "characterData" && i.oldValue.length > i.target.nodeValue.length) ? this.flushSoon() : L && e.composing && n.some((i) => i.type == "childList" && i.target.nodeName == "TR") ? (e.input.badSafariComposition = !0, this.flushSoon()) : this.flush();
    }), Fl && (this.onCharData = (n) => {
      this.queue.push({ target: n.target, type: "characterData", oldValue: n.prevValue }), this.flushSoon();
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
    this.observer && (this.observer.takeRecords(), this.observer.observe(this.view.dom, Bl)), this.onCharData && this.view.dom.addEventListener("DOMCharacterDataModified", this.onCharData), this.connectSelection();
  }
  stop() {
    if (this.observer) {
      let e = this.observer.takeRecords();
      if (e.length) {
        for (let t = 0; t < e.length; t++)
          this.queue.push(e[t]);
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
    if (yr(this.view)) {
      if (this.suppressingSelectionUpdates)
        return ce(this.view);
      if (K && ge <= 11 && !this.view.state.selection.empty) {
        let e = this.view.domSelectionRange();
        if (e.focusNode && ve(e.focusNode, e.focusOffset, e.anchorNode, e.anchorOffset))
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
    let t = /* @__PURE__ */ new Set(), n;
    for (let s = e.focusNode; s; s = Ke(s))
      t.add(s);
    for (let s = e.anchorNode; s; s = Ke(s))
      if (t.has(s)) {
        n = s;
        break;
      }
    let i = n && this.view.docView.nearestDesc(n);
    if (i && i.ignoreMutation({
      type: "selection",
      target: n.nodeType == 3 ? n.parentNode : n
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
    let t = this.pendingRecords();
    t.length && (this.queue = []);
    let n = e.domSelectionRange(), i = !this.suppressingSelectionUpdates && !this.currentSelection.eq(n) && yr(e) && !this.ignoreSelectionChange(n), s = -1, o = -1, l = !1, a = [];
    if (e.editable)
      for (let f = 0; f < t.length; f++) {
        let h = this.registerMutation(t[f], a);
        h && (s = s < 0 ? h.from : Math.min(h.from, s), o = o < 0 ? h.to : Math.max(h.to, o), h.typeOver && (l = !0));
      }
    if (a.some((f) => f.nodeName == "BR") && (e.input.lastKeyCode == 8 || e.input.lastKeyCode == 46 || z && (e.composing || e.input.compositionEndedAt > Date.now() - 50) && t.some((f) => f.type == "childList" && f.removedNodes.length))) {
      for (let f of a)
        if (f.nodeName == "BR" && f.parentNode) {
          let h = f.nextSibling;
          for (; h && h.nodeType == 1; ) {
            if (h.contentEditable == "false") {
              f.parentNode.removeChild(f);
              break;
            }
            h = h.firstChild;
          }
        }
    } else if (G && a.length) {
      let f = a.filter((h) => h.nodeName == "BR");
      if (f.length == 2) {
        let [h, d] = f;
        h.parentNode && h.parentNode.parentNode == d.parentNode ? d.remove() : h.remove();
      } else {
        let { focusNode: h } = this.currentSelection;
        for (let d of f) {
          let u = d.parentNode;
          u && u.nodeName == "LI" && (!h || ql(e, h) != u) && d.remove();
        }
      }
    }
    let c = null;
    s < 0 && i && e.input.lastFocus > Date.now() - 200 && Math.max(e.input.lastTouch, e.input.lastClick.time) < Date.now() - 300 && Wt(n) && (c = En(e)) && c.eq(C.near(e.state.doc.resolve(0), 1)) ? (e.input.lastFocus = 0, ce(e), this.currentSelection.set(n), e.scrollToSelection()) : (s > -1 || i) && (s > -1 && (e.docView.markDirty(s, o), Wl(e)), e.input.badSafariComposition && (e.input.badSafariComposition = !1, $l(e, a)), this.handleDOMChange(s, o, l, a), e.docView && e.docView.dirty ? e.updateState(e.state) : this.currentSelection.eq(n) || ce(e), this.currentSelection.set(n));
  }
  registerMutation(e, t) {
    if (t.indexOf(e.target) > -1)
      return null;
    let n = this.view.docView.nearestDesc(e.target);
    if (e.type == "attributes" && (n == this.view.docView || e.attributeName == "contenteditable" || // Firefox sometimes fires spurious events for null/empty styles
    e.attributeName == "style" && !e.oldValue && !e.target.getAttribute("style")) || !n || n.ignoreMutation(e))
      return null;
    if (e.type == "childList") {
      for (let f = 0; f < e.addedNodes.length; f++) {
        let h = e.addedNodes[f];
        t.push(h), h.nodeType == 3 && (this.lastChangedTextNode = h);
      }
      if (n.contentDOM && n.contentDOM != n.dom && !n.contentDOM.contains(e.target))
        return { from: n.posBefore, to: n.posAfter };
      let i = e.previousSibling, s = e.nextSibling;
      if (K && ge <= 11 && e.addedNodes.length)
        for (let f = 0; f < e.addedNodes.length; f++) {
          let { previousSibling: h, nextSibling: d } = e.addedNodes[f];
          (!h || Array.prototype.indexOf.call(e.addedNodes, h) < 0) && (i = h), (!d || Array.prototype.indexOf.call(e.addedNodes, d) < 0) && (s = d);
        }
      let o = i && i.parentNode == e.target ? P(i) + 1 : 0, l = n.localPosFromDOM(e.target, o, -1), a = s && s.parentNode == e.target ? P(s) : e.target.childNodes.length, c = n.localPosFromDOM(e.target, a, 1);
      return { from: l, to: c };
    } else return e.type == "attributes" ? { from: n.posAtStart - n.border, to: n.posAtEnd + n.border } : (this.lastChangedTextNode = e.target, {
      from: n.posAtStart,
      to: n.posAtEnd,
      // An event was generated for a text change that didn't change
      // any text. Mark the dom change to fall back to assuming the
      // selection was typed over with an identical value if it can't
      // find another change.
      typeOver: e.target.nodeValue == e.oldValue
    });
  }
}
let Nr = /* @__PURE__ */ new WeakMap(), wr = !1;
function Wl(r) {
  if (!Nr.has(r) && (Nr.set(r, null), ["normal", "nowrap", "pre-line"].indexOf(getComputedStyle(r.dom).whiteSpace) !== -1)) {
    if (r.requiresGeckoHackNode = G, wr)
      return;
    console.warn("ProseMirror expects the CSS white-space property to be set, preferably to 'pre-wrap'. It is recommended to load style/prosemirror.css from the prosemirror-view package."), wr = !0;
  }
}
function Dr(r, e) {
  let t = e.startContainer, n = e.startOffset, i = e.endContainer, s = e.endOffset, o = r.domAtPos(r.state.selection.anchor);
  return ve(o.node, o.offset, i, s) && ([t, n, i, s] = [i, s, t, n]), { anchorNode: t, anchorOffset: n, focusNode: i, focusOffset: s };
}
function Jl(r, e) {
  if (e.getComposedRanges) {
    let i = e.getComposedRanges(r.root)[0];
    if (i)
      return Dr(r, i);
  }
  let t;
  function n(i) {
    i.preventDefault(), i.stopImmediatePropagation(), t = i.getTargetRanges()[0];
  }
  return r.dom.addEventListener("beforeinput", n, !0), document.execCommand("indent"), r.dom.removeEventListener("beforeinput", n, !0), t ? Dr(r, t) : null;
}
function ql(r, e) {
  for (let t = e.parentNode; t && t != r.dom; t = t.parentNode) {
    let n = r.docView.nearestDesc(t, !0);
    if (n && n.node.isBlock)
      return t;
  }
  return null;
}
function $l(r, e) {
  var t;
  let { focusNode: n, focusOffset: i } = r.domSelectionRange();
  for (let s of e)
    if (((t = s.parentNode) === null || t === void 0 ? void 0 : t.nodeName) == "TR") {
      let o = s.nextSibling;
      for (; o && o.nodeName != "TD" && o.nodeName != "TH"; )
        o = o.nextSibling;
      if (o) {
        let l = o;
        for (; ; ) {
          let a = l.firstChild;
          if (!a || a.nodeType != 1 || a.contentEditable == "false" || /^(BR|IMG)$/.test(a.nodeName))
            break;
          l = a;
        }
        l.insertBefore(s, l.firstChild), n == s && r.domSelection().collapse(s, i);
      } else
        s.parentNode.removeChild(s);
    }
}
function Kl(r, e, t, n) {
  let { node: i, fromOffset: s, toOffset: o, from: l, to: a } = r.docView.parseRange(e, t), c = r.domSelectionRange(), f, h = c.anchorNode;
  if (h && r.dom.contains(h.nodeType == 1 ? h : h.parentNode) && (f = [{ node: h, offset: c.anchorOffset }], Wt(c) || f.push({ node: c.focusNode, offset: c.focusOffset })), z && r.input.lastKeyCode === 8)
    for (let x = o; x > s; x--) {
      let N = i.childNodes[x - 1], w = N.pmViewDesc;
      if (N.nodeName == "BR" && !w) {
        o = x;
        break;
      }
      if (!w || w.size)
        break;
    }
  let d = r.state.doc, u = r.someProp("domParser") || qe.fromSchema(r.state.schema), p = d.resolve(l), m = null, g = u.parse(i, {
    topNode: p.parent,
    topMatch: p.parent.contentMatchAt(p.index()),
    topOpen: !0,
    from: s,
    to: o,
    preserveWhitespace: p.parent.type.whitespace == "pre" ? "full" : !0,
    findPositions: f,
    ruleFromNode: Hl(n),
    context: p
  });
  if (f && f[0].pos != null) {
    let x = f[0].pos, N = f[1] && f[1].pos;
    N == null && (N = x), m = { anchor: x + l, head: N + l };
  }
  return { doc: g, sel: m, from: l, to: a };
}
const Hl = (r) => (e) => {
  let t = e.pmViewDesc;
  if (t)
    return t.parseRule(r);
  if (e.nodeName == "BR" && e.parentNode) {
    if (L && /^(ul|ol)$/i.test(e.parentNode.nodeName)) {
      let n = document.createElement("div");
      return n.appendChild(document.createElement("li")), { skip: n };
    } else if (e.parentNode.lastChild == e || L && /^(tr|table)$/i.test(e.parentNode.nodeName))
      return { ignore: !0 };
  } else if (e.nodeName == "IMG" && e.getAttribute("mark-placeholder"))
    return { ignore: !0 };
  return null;
}, _l = /^(a|abbr|acronym|b|bd[io]|big|br|button|cite|code|data(list)?|del|dfn|em|i|img|ins|kbd|label|map|mark|meter|output|q|ruby|s|samp|small|span|strong|su[bp]|time|u|tt|var)$/i;
function Ul(r, e, t, n, i) {
  let s = r.input.compositionPendingChanges || (r.composing ? r.input.compositionID : 0);
  if (r.input.compositionPendingChanges = 0, e < 0) {
    let S = r.input.lastSelectionTime > Date.now() - 50 ? r.input.lastSelectionOrigin : null, T = En(r, S);
    if (T && !r.state.selection.eq(T)) {
      if (z && le && r.input.lastKeyCode === 13 && Date.now() - 100 < r.input.lastKeyCodeTime && r.someProp("handleKeyDown", (ys) => ys(r, Me(13, "Enter"))))
        return;
      let $ = r.state.tr.setSelection(T);
      S == "pointer" ? $.setMeta("pointer", !0) : S == "key" && $.scrollIntoView(), s && $.setMeta("composition", s), r.dispatch($);
    }
    return;
  }
  let o = r.state.doc.resolve(e), l = o.sharedDepth(t);
  e = o.before(l + 1), t = r.state.doc.resolve(t).after(l + 1);
  let a = r.state.selection, c = Kl(r, e, t, i), f = r.state.doc, h = f.slice(c.from, c.to), d, u;
  r.input.lastKeyCode === 8 && Date.now() - 100 < r.input.lastKeyCodeTime ? (d = r.state.selection.to, u = "end") : (d = r.state.selection.from, u = "start"), r.input.lastKeyCode = null;
  let p = Yl(h.content, c.doc.content, c.from, d, u);
  if (p && r.input.domChangeCount++, (He && r.input.lastIOSEnter > Date.now() - 225 || le) && i.some((S) => S.nodeType == 1 && !_l.test(S.nodeName)) && (!p || p.endA >= p.endB) && r.someProp("handleKeyDown", (S) => S(r, Me(13, "Enter")))) {
    r.input.lastIOSEnter = 0;
    return;
  }
  if (!p)
    if (n && a instanceof O && !a.empty && a.$head.sameParent(a.$anchor) && !r.composing && !(c.sel && c.sel.anchor != c.sel.head))
      p = { start: a.from, endA: a.to, endB: a.to };
    else {
      if (c.sel) {
        let S = Tr(r, r.state.doc, c.sel);
        if (S && !S.eq(r.state.selection)) {
          let T = r.state.tr.setSelection(S);
          s && T.setMeta("composition", s), r.dispatch(T);
        }
      }
      return;
    }
  r.state.selection.from < r.state.selection.to && p.start == p.endB && r.state.selection instanceof O && (p.start > r.state.selection.from && p.start <= r.state.selection.from + 2 && r.state.selection.from >= c.from ? p.start = r.state.selection.from : p.endA < r.state.selection.to && p.endA >= r.state.selection.to - 2 && r.state.selection.to <= c.to && (p.endB += r.state.selection.to - p.endA, p.endA = r.state.selection.to)), K && ge <= 11 && p.endB == p.start + 1 && p.endA == p.start && p.start > c.from && c.doc.textBetween(p.start - c.from - 1, p.start - c.from + 1) == "  " && (p.start--, p.endA--, p.endB--);
  let m = c.doc.resolveNoCache(p.start - c.from), g = c.doc.resolveNoCache(p.endB - c.from), x = f.resolve(p.start), N = m.sameParent(g) && m.parent.inlineContent && x.end() >= p.endA;
  if ((He && r.input.lastIOSEnter > Date.now() - 225 && (!N || i.some((S) => S.nodeName == "DIV" || S.nodeName == "P")) || !N && m.pos < c.doc.content.size && (!m.sameParent(g) || !m.parent.inlineContent) && m.pos < g.pos && !/\S/.test(c.doc.textBetween(m.pos, g.pos, "", ""))) && r.someProp("handleKeyDown", (S) => S(r, Me(13, "Enter")))) {
    r.input.lastIOSEnter = 0;
    return;
  }
  if (r.state.selection.anchor > p.start && Gl(f, p.start, p.endA, m, g) && r.someProp("handleKeyDown", (S) => S(r, Me(8, "Backspace")))) {
    le && z && r.domObserver.suppressSelectionUpdates();
    return;
  }
  z && p.endB == p.start && (r.input.lastChromeDelete = Date.now()), le && !N && m.start() != g.start() && g.parentOffset == 0 && m.depth == g.depth && c.sel && c.sel.anchor == c.sel.head && c.sel.head == p.endA && (p.endB -= 2, g = c.doc.resolveNoCache(p.endB - c.from), setTimeout(() => {
    r.someProp("handleKeyDown", function(S) {
      return S(r, Me(13, "Enter"));
    });
  }, 20));
  let w = p.start, Ce = p.endA, Ue = (S) => {
    let T = S || r.state.tr.replace(w, Ce, c.doc.slice(p.start - c.from, p.endB - c.from));
    if (c.sel) {
      let $ = Tr(r, T.doc, c.sel);
      $ && !(z && r.composing && $.empty && (p.start != p.endB || r.input.lastChromeDelete < Date.now() - 100) && ($.head == w || $.head == T.mapping.map(Ce) - 1) || K && $.empty && $.head == w) && T.setSelection($);
    }
    return s && T.setMeta("composition", s), T.scrollIntoView();
  }, yt;
  if (N)
    if (m.pos == g.pos) {
      K && ge <= 11 && m.parentOffset == 0 && (r.domObserver.suppressSelectionUpdates(), setTimeout(() => ce(r), 20));
      let S = Ue(r.state.tr.delete(w, Ce)), T = f.resolve(p.start).marksAcross(f.resolve(p.endA));
      T && S.ensureMarks(T), r.dispatch(S);
    } else if (
      // Adding or removing a mark
      p.endA == p.endB && (yt = jl(m.parent.content.cut(m.parentOffset, g.parentOffset), x.parent.content.cut(x.parentOffset, p.endA - x.start())))
    ) {
      let S = Ue(r.state.tr);
      yt.type == "add" ? S.addMark(w, Ce, yt.mark) : S.removeMark(w, Ce, yt.mark), r.dispatch(S);
    } else if (m.parent.child(m.index()).isText && m.index() == g.index() - (g.textOffset ? 0 : 1)) {
      let S = m.parent.textBetween(m.parentOffset, g.parentOffset), T = () => Ue(r.state.tr.insertText(S, w, Ce));
      r.someProp("handleTextInput", ($) => $(r, w, Ce, S, T)) || r.dispatch(T());
    } else
      r.dispatch(Ue());
  else
    r.dispatch(Ue());
}
function Tr(r, e, t) {
  return Math.max(t.anchor, t.head) > e.content.size ? null : An(r, e.resolve(t.anchor), e.resolve(t.head));
}
function jl(r, e) {
  let t = r.firstChild.marks, n = e.firstChild.marks, i = t, s = n, o, l, a;
  for (let f = 0; f < n.length; f++)
    i = n[f].removeFromSet(i);
  for (let f = 0; f < t.length; f++)
    s = t[f].removeFromSet(s);
  if (i.length == 1 && s.length == 0)
    l = i[0], o = "add", a = (f) => f.mark(l.addToSet(f.marks));
  else if (i.length == 0 && s.length == 1)
    l = s[0], o = "remove", a = (f) => f.mark(l.removeFromSet(f.marks));
  else
    return null;
  let c = [];
  for (let f = 0; f < e.childCount; f++)
    c.push(a(e.child(f)));
  if (y.from(c).eq(r))
    return { mark: l, type: o };
}
function Gl(r, e, t, n, i) {
  if (
    // The content must have shrunk
    t - e <= i.pos - n.pos || // newEnd must point directly at or after the end of the block that newStart points into
    Qt(n, !0, !1) < i.pos
  )
    return !1;
  let s = r.resolve(e);
  if (!n.parent.isTextblock) {
    let l = s.nodeAfter;
    return l != null && t == e + l.nodeSize;
  }
  if (s.parentOffset < s.parent.content.size || !s.parent.isTextblock)
    return !1;
  let o = r.resolve(Qt(s, !0, !0));
  return !o.parent.isTextblock || o.pos > t || Qt(o, !0, !1) < t ? !1 : n.parent.content.cut(n.parentOffset).eq(o.parent.content);
}
function Qt(r, e, t) {
  let n = r.depth, i = e ? r.end() : r.pos;
  for (; n > 0 && (e || r.indexAfter(n) == r.node(n).childCount); )
    n--, i++, e = !1;
  if (t) {
    let s = r.node(n).maybeChild(r.indexAfter(n));
    for (; s && !s.isLeaf; )
      s = s.firstChild, i++;
  }
  return i;
}
function Yl(r, e, t, n, i) {
  let s = r.findDiffStart(e, t), o = t + r.size, l = t + e.size;
  if (s == null)
    return null;
  let { a, b: c } = r.findDiffEnd(e, o, l);
  if (i == "end") {
    let f = Math.max(0, s - Math.min(a, c));
    n -= a + f - s;
  }
  if (a < s && o < l) {
    let f = n <= s && n >= a ? s - n : 0;
    s -= f, c = s + (c - a), a = s;
  } else if (c < s) {
    let f = n <= s && n >= c ? s - n : 0;
    s -= f, a = s + (a - c), c = s;
  }
  return { start: s, endA: a, endB: c };
}
class as {
  /**
  Create a view. `place` may be a DOM node that the editor should
  be appended to, a function that will place it into the document,
  or an object whose `mount` property holds the node to use as the
  document container. If it is `null`, the editor will not be
  added to the document.
  */
  constructor(e, t) {
    this._root = null, this.focused = !1, this.trackWrites = null, this.mounted = !1, this.markCursor = null, this.cursorWrapper = null, this.lastSelectedViewDesc = void 0, this.input = new dl(), this.prevDirectPlugins = [], this.pluginViews = [], this.requiresGeckoHackNode = !1, this.dragging = null, this._props = t, this.state = t.state, this.directPlugins = t.plugins || [], this.directPlugins.forEach(Pr), this.dispatch = this.dispatch.bind(this), this.dom = e && e.mount || document.createElement("div"), e && (e.appendChild ? e.appendChild(this.dom) : typeof e == "function" ? e(this.dom) : e.mount && (this.mounted = !0)), this.editable = Ir(this), Ar(this), this.nodeViews = Rr(this), this.docView = hr(this.state.doc, Er(this), Zt(this), this.dom, this), this.domObserver = new Ll(this, (n, i, s, o) => Ul(this, n, i, s, o)), this.domObserver.start(), ul(this), this.updatePluginViews();
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
      for (let t in e)
        this._props[t] = e[t];
      this._props.state = this.state;
    }
    return this._props;
  }
  /**
  Update the view's props. Will immediately cause an update to
  the DOM.
  */
  update(e) {
    e.handleDOMEvents != this._props.handleDOMEvents && Sn(this);
    let t = this._props;
    this._props = e, e.plugins && (e.plugins.forEach(Pr), this.directPlugins = e.plugins), this.updateStateInner(e.state, t);
  }
  /**
  Update the view by updating existing props object with the object
  given as argument. Equivalent to `view.update(Object.assign({},
  view.props, props))`.
  */
  setProps(e) {
    let t = {};
    for (let n in this._props)
      t[n] = this._props[n];
    t.state = this.state;
    for (let n in e)
      t[n] = e[n];
    this.update(t);
  }
  /**
  Update the editor's `state` prop, without touching any of the
  other props.
  */
  updateState(e) {
    this.updateStateInner(e, this._props);
  }
  updateStateInner(e, t) {
    var n;
    let i = this.state, s = !1, o = !1;
    e.storedMarks && this.composing && (es(this), o = !0), this.state = e;
    let l = i.plugins != e.plugins || this._props.plugins != t.plugins;
    if (l || this._props.plugins != t.plugins || this._props.nodeViews != t.nodeViews) {
      let u = Rr(this);
      Zl(u, this.nodeViews) && (this.nodeViews = u, s = !0);
    }
    (l || t.handleDOMEvents != this._props.handleDOMEvents) && Sn(this), this.editable = Ir(this), Ar(this);
    let a = Zt(this), c = Er(this), f = i.plugins != e.plugins && !i.doc.eq(e.doc) ? "reset" : e.scrollToSelection > i.scrollToSelection ? "to selection" : "preserve", h = s || !this.docView.matchesNode(e.doc, c, a);
    (h || !e.selection.eq(i.selection)) && (o = !0);
    let d = f == "preserve" && o && this.dom.style.overflowAnchor == null && Do(this);
    if (o) {
      this.domObserver.stop();
      let u = h && (K || z) && !this.composing && !i.selection.empty && !e.selection.empty && Xl(i.selection, e.selection);
      if (h) {
        let m = z ? this.trackWrites = this.domSelectionRange().focusNode : null;
        this.composing && (this.input.compositionNode = Tl(this)), (s || !this.docView.update(e.doc, c, a, this)) && (this.docView.updateOuterDeco(c), this.docView.destroy(), this.docView = hr(e.doc, c, a, this.dom, this)), m && (!this.trackWrites || !this.dom.contains(this.trackWrites)) && (u = !0);
      }
      let p = this.input.mouseDown;
      u || !(p && this.domObserver.currentSelection.eq(this.domSelectionRange()) && Xo(this) && p.delaySelUpdate()) ? ce(this, u) : (Wi(this, e.selection), this.domObserver.setCurSelection()), this.domObserver.start();
    }
    this.updatePluginViews(i), !((n = this.dragging) === null || n === void 0) && n.node && !i.doc.eq(e.doc) && this.updateDraggedNode(this.dragging, i), f == "reset" ? this.dom.scrollTop = 0 : f == "to selection" ? this.scrollToSelection() : d && To(d);
  }
  /**
  @internal
  */
  scrollToSelection() {
    let e = this.domSelectionRange().focusNode;
    if (!(!e || !this.dom.contains(e.nodeType == 1 ? e : e.parentNode))) {
      if (!this.someProp("handleScrollToSelection", (t) => t(this))) if (this.state.selection instanceof k) {
        let t = this.docView.domAfterPos(this.state.selection.from);
        t.nodeType == 1 && or(this, t.getBoundingClientRect(), e);
      } else
        or(this, this.coordsAtPos(this.state.selection.head, 1), e);
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
      for (let t = 0; t < this.directPlugins.length; t++) {
        let n = this.directPlugins[t];
        n.spec.view && this.pluginViews.push(n.spec.view(this));
      }
      for (let t = 0; t < this.state.plugins.length; t++) {
        let n = this.state.plugins[t];
        n.spec.view && this.pluginViews.push(n.spec.view(this));
      }
    } else
      for (let t = 0; t < this.pluginViews.length; t++) {
        let n = this.pluginViews[t];
        n.update && n.update(this, e);
      }
  }
  updateDraggedNode(e, t) {
    let n = e.node, i = -1;
    if (n.from < this.state.doc.content.size && this.state.doc.nodeAt(n.from) == n.node)
      i = n.from;
    else {
      let s = n.from + (this.state.doc.content.size - t.doc.content.size);
      (s > 0 && s < this.state.doc.content.size && this.state.doc.nodeAt(s)) == n.node && (i = s);
    }
    this.dragging = new ns(e.slice, e.move, i < 0 ? void 0 : k.create(this.state.doc, i));
  }
  someProp(e, t) {
    let n = this._props && this._props[e], i;
    if (n != null && (i = t ? t(n) : n))
      return i;
    for (let o = 0; o < this.directPlugins.length; o++) {
      let l = this.directPlugins[o].props[e];
      if (l != null && (i = t ? t(l) : l))
        return i;
    }
    let s = this.state.plugins;
    if (s)
      for (let o = 0; o < s.length; o++) {
        let l = s[o].props[e];
        if (l != null && (i = t ? t(l) : l))
          return i;
      }
  }
  /**
  Query whether the view has focus.
  */
  hasFocus() {
    if (K) {
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
    this.domObserver.stop(), this.editable && Eo(this.dom), ce(this), this.domObserver.start();
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
      for (let t = this.dom.parentNode; t; t = t.parentNode)
        if (t.nodeType == 9 || t.nodeType == 11 && t.host)
          return t.getSelection || (Object.getPrototypeOf(t).getSelection = () => t.ownerDocument.getSelection()), this._root = t;
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
    return vo(this, e);
  }
  /**
  Returns the viewport rectangle at a given document position.
  `left` and `right` will be the same number, as this returns a
  flat cursor-ish rectangle. If the position is between two things
  that aren't directly adjacent, `side` determines which element
  is used. When < 0, the element before the position is used,
  otherwise the element after.
  */
  coordsAtPos(e, t = 1) {
    return Ri(this, e, t);
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
  domAtPos(e, t = 0) {
    return this.docView.domFromPos(e, t);
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
    let t = this.docView.descAt(e);
    return t ? t.nodeDOM : null;
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
  posAtDOM(e, t, n = -1) {
    let i = this.docView.posFromDOM(e, t, n);
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
  endOfTextblock(e, t) {
    return Lo(this, t || this.state, e);
  }
  /**
  Run the editor's paste logic with the given HTML string. The
  `event`, if given, will be passed to the
  [`handlePaste`](https://prosemirror.net/docs/ref/#view.EditorProps.handlePaste) hook.
  */
  pasteHTML(e, t) {
    return ft(this, "", e, !1, t || new ClipboardEvent("paste"));
  }
  /**
  Run the editor's paste logic with the given plain-text input.
  */
  pasteText(e, t) {
    return ft(this, e, null, !0, t || new ClipboardEvent("paste"));
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
    return In(this, e);
  }
  /**
  Removes the editor from the DOM and destroys all [node
  views](https://prosemirror.net/docs/ref/#view.NodeView).
  */
  destroy() {
    this.docView && (pl(this), this.destroyPluginViews(), this.mounted ? (this.docView.update(this.state.doc, [], Zt(this), this), this.dom.textContent = "") : this.dom.parentNode && this.dom.parentNode.removeChild(this.dom), this.docView.destroy(), this.docView = null, yo());
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
    return gl(this, e);
  }
  /**
  @internal
  */
  domSelectionRange() {
    let e = this.domSelection();
    return e ? L && this.root.nodeType === 11 && Co(this.dom.ownerDocument) == this.dom && Jl(this, e) || e : { focusNode: null, focusOffset: 0, anchorNode: null, anchorOffset: 0 };
  }
  /**
  @internal
  */
  domSelection() {
    return this.root.getSelection();
  }
}
as.prototype.dispatch = function(r) {
  let e = this._props.dispatchTransaction;
  e ? e.call(this, r) : this.updateState(this.state.apply(r));
};
function Er(r) {
  let e = /* @__PURE__ */ Object.create(null);
  return e.class = "ProseMirror", e.contenteditable = String(r.editable), r.someProp("attributes", (t) => {
    if (typeof t == "function" && (t = t(r.state)), t)
      for (let n in t)
        n == "class" ? e.class += " " + t[n] : n == "style" ? e.style = (e.style ? e.style + ";" : "") + t[n] : !e[n] && n != "contenteditable" && n != "nodeName" && (e[n] = String(t[n]));
  }), e.translate || (e.translate = "no"), [Z.node(0, r.state.doc.content.size, e)];
}
function Ar(r) {
  if (r.markCursor) {
    let e = document.createElement("img");
    e.className = "ProseMirror-separator", e.setAttribute("mark-placeholder", "true"), e.setAttribute("alt", ""), r.cursorWrapper = { dom: e, deco: Z.widget(r.state.selection.from, e, { raw: !0, marks: r.markCursor }) };
  } else
    r.cursorWrapper = null;
}
function Ir(r) {
  return !r.someProp("editable", (e) => e(r.state) === !1);
}
function Xl(r, e) {
  let t = Math.min(r.$anchor.sharedDepth(r.head), e.$anchor.sharedDepth(e.head));
  return r.$anchor.start(t) != e.$anchor.start(t);
}
function Rr(r) {
  let e = /* @__PURE__ */ Object.create(null);
  function t(n) {
    for (let i in n)
      Object.prototype.hasOwnProperty.call(e, i) || (e[i] = n[i]);
  }
  return r.someProp("nodeViews", t), r.someProp("markViews", t), e;
}
function Zl(r, e) {
  let t = 0, n = 0;
  for (let i in r) {
    if (r[i] != e[i])
      return !0;
    t++;
  }
  for (let i in e)
    n++;
  return t != n;
}
function Pr(r) {
  if (r.spec.state || r.spec.filterTransaction || r.spec.appendTransaction)
    throw new RangeError("Plugins passed directly to the view must not have a state component");
}
const Ql = ["p", 0], ea = ["blockquote", 0], ta = ["hr"], na = ["pre", ["code", 0]], ra = ["br"], ia = {
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
      return Ql;
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
      return ea;
    }
  },
  /**
  A horizontal rule (`<hr>`).
  */
  horizontal_rule: {
    group: "block",
    parseDOM: [{ tag: "hr" }],
    toDOM() {
      return ta;
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
    toDOM(r) {
      return ["h" + r.attrs.level, 0];
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
      return na;
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
    parseDOM: [{ tag: "img[src]", getAttrs(r) {
      return {
        src: r.getAttribute("src"),
        title: r.getAttribute("title"),
        alt: r.getAttribute("alt")
      };
    } }],
    toDOM(r) {
      let { src: e, alt: t, title: n } = r.attrs;
      return ["img", { src: e, alt: t, title: n }];
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
      return ra;
    }
  }
}, sa = ["em", 0], oa = ["strong", 0], la = ["code", 0], aa = {
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
    parseDOM: [{ tag: "a[href]", getAttrs(r) {
      return { href: r.getAttribute("href"), title: r.getAttribute("title") };
    } }],
    toDOM(r) {
      let { href: e, title: t } = r.attrs;
      return ["a", { href: e, title: t }, 0];
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
      { style: "font-style=normal", clearMark: (r) => r.type.name == "em" }
    ],
    toDOM() {
      return sa;
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
      { tag: "b", getAttrs: (r) => r.style.fontWeight != "normal" && null },
      { style: "font-weight=400", clearMark: (r) => r.type.name == "strong" },
      { style: "font-weight", getAttrs: (r) => /^(bold(er)?|[5-9]\d{2,})$/.test(r) && null }
    ],
    toDOM() {
      return oa;
    }
  },
  /**
  Code font mark. Represented as a `<code>` element.
  */
  code: {
    code: !0,
    parseDOM: [{ tag: "code" }],
    toDOM() {
      return la;
    }
  }
}, vr = new oi({ nodes: ia, marks: aa }), ca = ["ol", 0], fa = ["ul", 0], ha = ["li", 0], da = {
  attrs: { order: { default: 1, validate: "number" } },
  parseDOM: [{ tag: "ol", getAttrs(r) {
    return { order: r.hasAttribute("start") ? +r.getAttribute("start") : 1 };
  } }],
  toDOM(r) {
    return r.attrs.order == 1 ? ca : ["ol", { start: r.attrs.order }, 0];
  }
}, ua = {
  parseDOM: [{ tag: "ul" }],
  toDOM() {
    return fa;
  }
}, pa = {
  parseDOM: [{ tag: "li" }],
  toDOM() {
    return ha;
  },
  defining: !0
};
function en(r, e) {
  let t = {};
  for (let n in r)
    t[n] = r[n];
  for (let n in e)
    t[n] = e[n];
  return t;
}
function ma(r, e, t) {
  return r.append({
    ordered_list: en(da, { content: "list_item+", group: t }),
    bullet_list: en(ua, { content: "list_item+", group: t }),
    list_item: en(pa, { content: e })
  });
}
function zr(r, e = null) {
  return function(t, n) {
    let { $from: i, $to: s } = t.selection, o = i.blockRange(s);
    if (!o)
      return !1;
    let l = n ? t.tr : null;
    return ga(l, o, r, e) ? (n && n(l.scrollIntoView()), !0) : !1;
  };
}
function ga(r, e, t, n = null) {
  let i = !1, s = e, o = e.$from.doc;
  if (e.depth >= 2 && e.$from.node(e.depth - 1).type.compatibleContent(t) && e.startIndex == 0) {
    if (e.$from.index(e.depth - 1) == 0)
      return !1;
    let a = o.resolve(e.start - 2);
    s = new Dt(a, a, e.depth), e.endIndex < e.parent.childCount && (e = new Dt(e.$from, o.resolve(e.$to.end(e.depth)), e.depth)), i = !0;
  }
  let l = pi(s, t, n, e);
  return l ? (r && ya(r, e, l, i, t), !0) : !1;
}
function ya(r, e, t, n, i) {
  let s = y.empty;
  for (let f = t.length - 1; f >= 0; f--)
    s = y.from(t[f].type.create(t[f].attrs, s));
  r.step(new B(e.start - (n ? 2 : 0), e.end, e.start, e.end, new b(s, 0, 0), t.length, !0));
  let o = 0;
  for (let f = 0; f < t.length; f++)
    t[f].type == i && (o = f + 1);
  let l = t.length - o, a = e.start + t.length - (n ? 2 : 0), c = e.parent;
  for (let f = e.startIndex, h = e.endIndex, d = !0; f < h; f++, d = !1)
    !d && We(r.doc, a, l) && (r.split(a, l), a += 2 * l), a += c.child(f).nodeSize;
  return r;
}
function ba(r, e) {
  return function(t, n) {
    let { $from: i, $to: s, node: o } = t.selection;
    if (o && o.isBlock || i.depth < 2 || !i.sameParent(s))
      return !1;
    let l = i.node(-1);
    if (l.type != r)
      return !1;
    if (i.parent.content.size == 0 && i.node(-1).childCount == i.indexAfter(-1)) {
      if (i.depth == 3 || i.node(-3).type != r || i.index(-2) != i.node(-2).childCount - 1)
        return !1;
      if (n) {
        let h = y.empty, d = i.index(-1) ? 1 : i.index(-2) ? 2 : 3;
        for (let x = i.depth - d; x >= i.depth - 3; x--)
          h = y.from(i.node(x).copy(h));
        let u = i.indexAfter(-1) < i.node(-2).childCount ? 1 : i.indexAfter(-2) < i.node(-3).childCount ? 2 : 3;
        h = h.append(y.from(r.createAndFill()));
        let p = i.before(i.depth - (d - 1)), m = t.tr.replace(p, i.after(-u), new b(h, 4 - d, 0)), g = -1;
        m.doc.nodesBetween(p, m.doc.content.size, (x, N) => {
          if (g > -1)
            return !1;
          x.isTextblock && x.content.size == 0 && (g = N + 1);
        }), g > -1 && m.setSelection(C.near(m.doc.resolve(g))), n(m.scrollIntoView());
      }
      return !0;
    }
    let a = s.pos == i.end() ? l.contentMatchAt(0).defaultType : null, c = t.tr.delete(i.pos, s.pos), f = a ? [null, { type: a }] : void 0;
    return We(c.doc, i.pos, 2, f) ? (n && n(c.split(i.pos, 2, f).scrollIntoView()), !0) : !1;
  };
}
function xa(r) {
  return function(e, t) {
    let { $from: n, $to: i } = e.selection, s = n.blockRange(i, (o) => o.childCount > 0 && o.firstChild.type == r);
    return s ? t ? n.node(s.depth - 1).type == r ? ka(e, t, r, s) : Sa(e, t, s) : !0 : !1;
  };
}
function ka(r, e, t, n) {
  let i = r.tr, s = n.end, o = n.$to.end(n.depth);
  s < o && (i.step(new B(s - 1, o, s, o, new b(y.from(t.create(null, n.parent.copy())), 1, 0), 1, !0)), n = new Dt(i.doc.resolve(n.$from.pos), i.doc.resolve(o), n.depth));
  const l = Vt(n);
  if (l == null)
    return !1;
  i.lift(n, l);
  let a = i.doc.resolve(i.mapping.map(s, -1) - 1);
  return Nn(i.doc, a.pos) && a.nodeBefore.type == a.nodeAfter.type && i.join(a.pos), e(i.scrollIntoView()), !0;
}
function Sa(r, e, t) {
  let n = r.tr, i = t.parent;
  for (let u = t.end, p = t.endIndex - 1, m = t.startIndex; p > m; p--)
    u -= i.child(p).nodeSize, n.delete(u - 1, u + 1);
  let s = n.doc.resolve(t.start), o = s.nodeAfter;
  if (n.mapping.map(t.end) != t.start + s.nodeAfter.nodeSize)
    return !1;
  let l = t.startIndex == 0, a = t.endIndex == i.childCount, c = s.node(-1), f = s.index(-1);
  if (!c.canReplace(f + (l ? 0 : 1), f + 1, o.content.append(a ? y.empty : y.from(i))))
    return !1;
  let h = s.pos, d = h + o.nodeSize;
  return n.step(new B(h - (l ? 1 : 0), d + (a ? 1 : 0), h + 1, d - 1, new b((l ? y.empty : y.from(i.copy(y.empty))).append(a ? y.empty : y.from(i.copy(y.empty))), l ? 0 : 1, a ? 0 : 1), l ? 0 : 1)), e(n.scrollIntoView()), !0;
}
function Ca(r) {
  return function(e, t) {
    let { $from: n, $to: i } = e.selection, s = n.blockRange(i, (c) => c.childCount > 0 && c.firstChild.type == r);
    if (!s)
      return !1;
    let o = s.startIndex;
    if (o == 0)
      return !1;
    let l = s.parent, a = l.child(o - 1);
    if (a.type != r)
      return !1;
    if (t) {
      let c = a.lastChild && a.lastChild.type == l.type, f = y.from(c ? r.create() : null), h = new b(y.from(r.create(null, y.from(l.type.create(null, f)))), c ? 3 : 1, 0), d = s.start, u = s.end;
      t(e.tr.step(new B(d - (c ? 3 : 1), u, d, u, h, 1, !0)).scrollIntoView());
    }
    return !0;
  };
}
const cs = (r, e) => r.selection.empty ? !1 : (e && e(r.tr.deleteSelection().scrollIntoView()), !0);
function Ma(r, e) {
  let { $cursor: t } = r.selection;
  return !t || (e ? !e.endOfTextblock("backward", r) : t.parentOffset > 0) ? null : t;
}
const Oa = (r, e, t) => {
  let n = Ma(r, t);
  if (!n)
    return !1;
  let i = fs(n);
  if (!i) {
    let o = n.blockRange(), l = o && Vt(o);
    return l == null ? !1 : (e && e(r.tr.lift(o, l).scrollIntoView()), !0);
  }
  let s = i.nodeBefore;
  if (ds(r, i, e, -1))
    return !0;
  if (n.parent.content.size == 0 && (_e(s, "end") || k.isSelectable(s)))
    for (let o = n.depth; ; o--) {
      let l = wn(r.doc, n.before(o), n.after(o), b.empty);
      if (l && l.slice.size < l.to - l.from) {
        if (e) {
          let a = r.tr.step(l);
          a.setSelection(_e(s, "end") ? C.findFrom(a.doc.resolve(a.mapping.map(i.pos, -1)), -1) : k.create(a.doc, i.pos - s.nodeSize)), e(a.scrollIntoView());
        }
        return !0;
      }
      if (o == 1 || n.node(o - 1).childCount > 1)
        break;
    }
  return s.isAtom && i.depth == n.depth - 1 ? (e && e(r.tr.delete(i.pos - s.nodeSize, i.pos).scrollIntoView()), !0) : !1;
};
function _e(r, e, t = !1) {
  for (let n = r; n; n = e == "start" ? n.firstChild : n.lastChild) {
    if (n.isTextblock)
      return !0;
    if (t && n.childCount != 1)
      return !1;
  }
  return !1;
}
const Na = (r, e, t) => {
  let { $head: n, empty: i } = r.selection, s = n;
  if (!i)
    return !1;
  if (n.parent.isTextblock) {
    if (t ? !t.endOfTextblock("backward", r) : n.parentOffset > 0)
      return !1;
    s = fs(n);
  }
  let o = s && s.nodeBefore;
  return !o || !k.isSelectable(o) ? !1 : (e && e(r.tr.setSelection(k.create(r.doc, s.pos - o.nodeSize)).scrollIntoView()), !0);
};
function fs(r) {
  if (!r.parent.type.spec.isolating)
    for (let e = r.depth - 1; e >= 0; e--) {
      if (r.index(e) > 0)
        return r.doc.resolve(r.before(e + 1));
      if (r.node(e).type.spec.isolating)
        break;
    }
  return null;
}
function wa(r, e) {
  let { $cursor: t } = r.selection;
  return !t || (e ? !e.endOfTextblock("forward", r) : t.parentOffset < t.parent.content.size) ? null : t;
}
const Da = (r, e, t) => {
  let n = wa(r, t);
  if (!n)
    return !1;
  let i = hs(n);
  if (!i)
    return !1;
  let s = i.nodeAfter;
  if (ds(r, i, e, 1))
    return !0;
  if (n.parent.content.size == 0 && (_e(s, "start") || k.isSelectable(s))) {
    let o = wn(r.doc, n.before(), n.after(), b.empty);
    if (o && o.slice.size < o.to - o.from) {
      if (e) {
        let l = r.tr.step(o);
        l.setSelection(_e(s, "start") ? C.findFrom(l.doc.resolve(l.mapping.map(i.pos)), 1) : k.create(l.doc, l.mapping.map(i.pos))), e(l.scrollIntoView());
      }
      return !0;
    }
  }
  return s.isAtom && i.depth == n.depth - 1 ? (e && e(r.tr.delete(i.pos, i.pos + s.nodeSize).scrollIntoView()), !0) : !1;
}, Ta = (r, e, t) => {
  let { $head: n, empty: i } = r.selection, s = n;
  if (!i)
    return !1;
  if (n.parent.isTextblock) {
    if (t ? !t.endOfTextblock("forward", r) : n.parentOffset < n.parent.content.size)
      return !1;
    s = hs(n);
  }
  let o = s && s.nodeAfter;
  return !o || !k.isSelectable(o) ? !1 : (e && e(r.tr.setSelection(k.create(r.doc, s.pos)).scrollIntoView()), !0);
};
function hs(r) {
  if (!r.parent.type.spec.isolating)
    for (let e = r.depth - 1; e >= 0; e--) {
      let t = r.node(e);
      if (r.index(e) + 1 < t.childCount)
        return r.doc.resolve(r.after(e + 1));
      if (t.type.spec.isolating)
        break;
    }
  return null;
}
const Ea = (r, e) => {
  let { $head: t, $anchor: n } = r.selection;
  return !t.parent.type.spec.code || !t.sameParent(n) ? !1 : (e && e(r.tr.insertText(`
`).scrollIntoView()), !0);
};
function Fn(r) {
  for (let e = 0; e < r.edgeCount; e++) {
    let { type: t } = r.edge(e);
    if (t.isTextblock && !t.hasRequiredAttrs())
      return t;
  }
  return null;
}
const Cn = (r, e) => {
  let { $head: t, $anchor: n } = r.selection;
  if (!t.parent.type.spec.code || !t.sameParent(n))
    return !1;
  let i = t.node(-1), s = t.indexAfter(-1), o = Fn(i.contentMatchAt(s));
  if (!o || !i.canReplaceWith(s, s, o))
    return !1;
  if (e) {
    let l = t.after(), a = r.tr.replaceWith(l, l, o.createAndFill());
    a.setSelection(C.near(a.doc.resolve(l), 1)), e(a.scrollIntoView());
  }
  return !0;
}, Aa = (r, e) => {
  let t = r.selection, { $from: n, $to: i } = t;
  if (t instanceof _ || n.parent.inlineContent || i.parent.inlineContent)
    return !1;
  let s = Fn(i.parent.contentMatchAt(i.indexAfter()));
  if (!s || !s.isTextblock)
    return !1;
  if (e) {
    let o = (!n.parentOffset && i.index() < i.parent.childCount ? n : i).pos, l = r.tr.insert(o, s.createAndFill());
    l.setSelection(O.create(l.doc, o + 1)), e(l.scrollIntoView());
  }
  return !0;
}, Ia = (r, e) => {
  let { $cursor: t } = r.selection;
  if (!t || t.parent.content.size)
    return !1;
  if (t.depth > 1 && t.after() != t.end(-1)) {
    let s = t.before();
    if (We(r.doc, s))
      return e && e(r.tr.split(s).scrollIntoView()), !0;
  }
  let n = t.blockRange(), i = n && Vt(n);
  return i == null ? !1 : (e && e(r.tr.lift(n, i).scrollIntoView()), !0);
};
function Ra(r) {
  return (e, t) => {
    if (e.selection instanceof k && e.selection.node.isBlock) {
      let { $from: u } = e.selection;
      return !u.parentOffset || !We(e.doc, u.pos) ? !1 : (t && t(e.tr.split(u.pos).scrollIntoView()), !0);
    }
    if (!e.selection.$from.depth)
      return !1;
    let n = e.tr;
    !e.selection.empty && (e.selection instanceof O || e.selection instanceof _) && n.deleteSelection();
    let { $from: i } = n.selection, s = n.steps.length, o = [], l, a, c = !1, f = !1;
    for (let u = i.depth; ; u--)
      if (i.node(u).isBlock) {
        c = i.end(u) == i.pos + (i.depth - u), f = i.start(u) == i.pos - (i.depth - u), a = Fn(i.node(u - 1).contentMatchAt(i.indexAfter(u - 1))), o.unshift(c && a ? { type: a } : null), l = u;
        break;
      } else {
        if (u == 1)
          return !1;
        o.unshift(null);
      }
    let h = i.pos, d = We(n.doc, h, o.length, o);
    if (d || (o[0] = a ? { type: a } : null, d = We(n.doc, h, o.length, o)), !d)
      return !1;
    if (n.split(h, o.length, o), !c && f && i.node(l).type != a) {
      let u = n.mapping.slice(s), p = u.map(i.before(l)), m = n.doc.resolve(p);
      a && i.node(l - 1).canReplaceWith(m.index(), m.index() + 1, a) && n.setNodeMarkup(u.map(i.before(l)), a);
    }
    return t && t(n.scrollIntoView()), !0;
  };
}
const Pa = Ra(), va = (r, e) => (e && e(r.tr.setSelection(new _(r.doc))), !0);
function za(r, e, t) {
  let n = e.nodeBefore, i = e.nodeAfter, s = e.index();
  return !n || !i || !n.type.compatibleContent(i.type) ? !1 : !n.content.size && e.parent.canReplace(s - 1, s) ? (t && t(r.tr.delete(e.pos - n.nodeSize, e.pos).scrollIntoView()), !0) : !e.parent.canReplace(s, s + 1) || !(i.isTextblock || Nn(r.doc, e.pos)) ? !1 : (t && t(r.tr.join(e.pos).scrollIntoView()), !0);
}
function ds(r, e, t, n) {
  let i = e.nodeBefore, s = e.nodeAfter, o, l, a = i.type.spec.isolating || s.type.spec.isolating;
  if (!a && za(r, e, t))
    return !0;
  let c = !a && e.parent.canReplace(e.index(), e.index() + 1);
  if (c && (o = (l = i.contentMatchAt(i.childCount)).findWrapping(s.type)) && l.matchType(o[0] || s.type).validEnd) {
    if (t) {
      let u = e.pos + s.nodeSize, p = y.empty;
      for (let x = o.length - 1; x >= 0; x--)
        p = y.from(o[x].create(null, p));
      p = y.from(i.copy(p));
      let m = r.tr.step(new B(e.pos - 1, u, e.pos, u, new b(p, 1, 0), o.length, !0)), g = m.doc.resolve(u + 2 * o.length);
      g.nodeAfter && g.nodeAfter.type == i.type && Nn(m.doc, g.pos) && m.join(g.pos), t(m.scrollIntoView());
    }
    return !0;
  }
  let f = s.type.spec.isolating || n > 0 && a ? null : C.findFrom(e, 1), h = f && f.$from.blockRange(f.$to), d = h && Vt(h);
  if (d != null && d >= e.depth)
    return t && t(r.tr.lift(h, d).scrollIntoView()), !0;
  if (c && _e(s, "start", !0) && _e(i, "end")) {
    let u = i, p = [];
    for (; p.push(u), !u.isTextblock; )
      u = u.lastChild;
    let m = s, g = 1;
    for (; !m.isTextblock; m = m.firstChild)
      g++;
    if (u.canReplace(u.childCount, u.childCount, m.content)) {
      if (t) {
        let x = y.empty;
        for (let w = p.length - 1; w >= 0; w--)
          x = y.from(p[w].copy(x));
        let N = r.tr.step(new B(e.pos - p.length, e.pos + s.nodeSize, e.pos + g, e.pos + s.nodeSize - g, new b(x, p.length, 0), 0, !0));
        t(N.scrollIntoView());
      }
      return !0;
    }
  }
  return !1;
}
function us(r) {
  return function(e, t) {
    let n = e.selection, i = r < 0 ? n.$from : n.$to, s = i.depth;
    for (; i.node(s).isInline; ) {
      if (!s)
        return !1;
      s--;
    }
    return i.node(s).isTextblock ? (t && t(e.tr.setSelection(O.create(e.doc, r < 0 ? i.start(s) : i.end(s)))), !0) : !1;
  };
}
const Ba = us(-1), Fa = us(1);
function Va(r, e = null) {
  return function(t, n) {
    let { $from: i, $to: s } = t.selection, o = i.blockRange(s), l = o && pi(o, r, e);
    return l ? (n && n(t.tr.wrap(o, l).scrollIntoView()), !0) : !1;
  };
}
function La(r, e, t, n) {
  for (let i = 0; i < e.length; i++) {
    let { $from: s, $to: o } = e[i], l = s.depth == 0 ? r.inlineContent && r.type.allowsMarkType(t) : !1;
    if (r.nodesBetween(s.pos, o.pos, (a, c) => {
      if (l)
        return !1;
      l = a.inlineContent && a.type.allowsMarkType(t);
    }), l)
      return !0;
  }
  return !1;
}
function rt(r, e = null, t) {
  return function(n, i) {
    let { empty: s, $cursor: o, ranges: l } = n.selection;
    if (s && !o || !La(n.doc, l, r))
      return !1;
    if (i)
      if (o)
        r.isInSet(n.storedMarks || o.marks()) ? i(n.tr.removeStoredMark(r)) : i(n.tr.addStoredMark(r.create(e)));
      else {
        let a, c = n.tr;
        a = !l.some((f) => n.doc.rangeHasMark(f.$from.pos, f.$to.pos, r));
        for (let f = 0; f < l.length; f++) {
          let { $from: h, $to: d } = l[f];
          if (!a)
            c.removeMark(h.pos, d.pos, r);
          else {
            let u = h.pos, p = d.pos, m = h.nodeAfter, g = d.nodeBefore, x = m && m.isText ? /^\s*/.exec(m.text)[0].length : 0, N = g && g.isText ? /\s*$/.exec(g.text)[0].length : 0;
            u + x < p && (u += x, p -= N), c.addMark(u, p, r.create(e));
          }
        }
        i(c.scrollIntoView());
      }
    return !0;
  };
}
function qt(...r) {
  return function(e, t, n) {
    for (let i = 0; i < r.length; i++)
      if (r[i](e, t, n))
        return !0;
    return !1;
  };
}
let tn = qt(cs, Oa, Na), Br = qt(cs, Da, Ta);
const oe = {
  Enter: qt(Ea, Aa, Ia, Pa),
  "Mod-Enter": Cn,
  Backspace: tn,
  "Mod-Backspace": tn,
  "Shift-Backspace": tn,
  Delete: Br,
  "Mod-Delete": Br,
  "Mod-a": va
}, ps = {
  "Ctrl-h": oe.Backspace,
  "Alt-Backspace": oe["Mod-Backspace"],
  "Ctrl-d": oe.Delete,
  "Ctrl-Alt-Backspace": oe["Mod-Delete"],
  "Alt-Delete": oe["Mod-Delete"],
  "Alt-d": oe["Mod-Delete"],
  "Ctrl-a": Ba,
  "Ctrl-e": Fa
};
for (let r in oe)
  ps[r] = oe[r];
const Wa = typeof navigator < "u" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : typeof os < "u" && os.platform ? os.platform() == "darwin" : !1, Ja = Wa ? ps : oe;
var vt = 200, I = function() {
};
I.prototype.append = function(e) {
  return e.length ? (e = I.from(e), !this.length && e || e.length < vt && this.leafAppend(e) || this.length < vt && e.leafPrepend(this) || this.appendInner(e)) : this;
};
I.prototype.prepend = function(e) {
  return e.length ? I.from(e).append(this) : this;
};
I.prototype.appendInner = function(e) {
  return new qa(this, e);
};
I.prototype.slice = function(e, t) {
  return e === void 0 && (e = 0), t === void 0 && (t = this.length), e >= t ? I.empty : this.sliceInner(Math.max(0, e), Math.min(this.length, t));
};
I.prototype.get = function(e) {
  if (!(e < 0 || e >= this.length))
    return this.getInner(e);
};
I.prototype.forEach = function(e, t, n) {
  t === void 0 && (t = 0), n === void 0 && (n = this.length), t <= n ? this.forEachInner(e, t, n, 0) : this.forEachInvertedInner(e, t, n, 0);
};
I.prototype.map = function(e, t, n) {
  t === void 0 && (t = 0), n === void 0 && (n = this.length);
  var i = [];
  return this.forEach(function(s, o) {
    return i.push(e(s, o));
  }, t, n), i;
};
I.from = function(e) {
  return e instanceof I ? e : e && e.length ? new ms(e) : I.empty;
};
var ms = /* @__PURE__ */ function(r) {
  function e(n) {
    r.call(this), this.values = n;
  }
  r && (e.__proto__ = r), e.prototype = Object.create(r && r.prototype), e.prototype.constructor = e;
  var t = { length: { configurable: !0 }, depth: { configurable: !0 } };
  return e.prototype.flatten = function() {
    return this.values;
  }, e.prototype.sliceInner = function(i, s) {
    return i == 0 && s == this.length ? this : new e(this.values.slice(i, s));
  }, e.prototype.getInner = function(i) {
    return this.values[i];
  }, e.prototype.forEachInner = function(i, s, o, l) {
    for (var a = s; a < o; a++)
      if (i(this.values[a], l + a) === !1)
        return !1;
  }, e.prototype.forEachInvertedInner = function(i, s, o, l) {
    for (var a = s - 1; a >= o; a--)
      if (i(this.values[a], l + a) === !1)
        return !1;
  }, e.prototype.leafAppend = function(i) {
    if (this.length + i.length <= vt)
      return new e(this.values.concat(i.flatten()));
  }, e.prototype.leafPrepend = function(i) {
    if (this.length + i.length <= vt)
      return new e(i.flatten().concat(this.values));
  }, t.length.get = function() {
    return this.values.length;
  }, t.depth.get = function() {
    return 0;
  }, Object.defineProperties(e.prototype, t), e;
}(I);
I.empty = new ms([]);
var qa = /* @__PURE__ */ function(r) {
  function e(t, n) {
    r.call(this), this.left = t, this.right = n, this.length = t.length + n.length, this.depth = Math.max(t.depth, n.depth) + 1;
  }
  return r && (e.__proto__ = r), e.prototype = Object.create(r && r.prototype), e.prototype.constructor = e, e.prototype.flatten = function() {
    return this.left.flatten().concat(this.right.flatten());
  }, e.prototype.getInner = function(n) {
    return n < this.left.length ? this.left.get(n) : this.right.get(n - this.left.length);
  }, e.prototype.forEachInner = function(n, i, s, o) {
    var l = this.left.length;
    if (i < l && this.left.forEachInner(n, i, Math.min(s, l), o) === !1 || s > l && this.right.forEachInner(n, Math.max(i - l, 0), Math.min(this.length, s) - l, o + l) === !1)
      return !1;
  }, e.prototype.forEachInvertedInner = function(n, i, s, o) {
    var l = this.left.length;
    if (i > l && this.right.forEachInvertedInner(n, i - l, Math.max(s, l) - l, o + l) === !1 || s < l && this.left.forEachInvertedInner(n, Math.min(i, l), s, o) === !1)
      return !1;
  }, e.prototype.sliceInner = function(n, i) {
    if (n == 0 && i == this.length)
      return this;
    var s = this.left.length;
    return i <= s ? this.left.slice(n, i) : n >= s ? this.right.slice(n - s, i - s) : this.left.slice(n, s).append(this.right.slice(0, i - s));
  }, e.prototype.leafAppend = function(n) {
    var i = this.right.leafAppend(n);
    if (i)
      return new e(this.left, i);
  }, e.prototype.leafPrepend = function(n) {
    var i = this.left.leafPrepend(n);
    if (i)
      return new e(i, this.right);
  }, e.prototype.appendInner = function(n) {
    return this.left.depth >= Math.max(this.right.depth, n.depth) + 1 ? new e(this.left, new e(this.right, n)) : new e(this, n);
  }, e;
}(I);
const $a = 500;
class X {
  constructor(e, t) {
    this.items = e, this.eventCount = t;
  }
  // Pop the latest event off the branch's history and apply it
  // to a document transform.
  popEvent(e, t) {
    if (this.eventCount == 0)
      return null;
    let n = this.items.length;
    for (; ; n--)
      if (this.items.get(n - 1).selection) {
        --n;
        break;
      }
    let i, s;
    t && (i = this.remapping(n, this.items.length), s = i.maps.length);
    let o = e.tr, l, a, c = [], f = [];
    return this.items.forEach((h, d) => {
      if (!h.step) {
        i || (i = this.remapping(n, d + 1), s = i.maps.length), s--, f.push(h);
        return;
      }
      if (i) {
        f.push(new ee(h.map));
        let u = h.step.map(i.slice(s)), p;
        u && o.maybeStep(u).doc && (p = o.mapping.maps[o.mapping.maps.length - 1], c.push(new ee(p, void 0, void 0, c.length + f.length))), s--, p && i.appendMap(p, s);
      } else
        o.maybeStep(h.step);
      if (h.selection)
        return l = i ? h.selection.map(i.slice(s)) : h.selection, a = new X(this.items.slice(0, n).append(f.reverse().concat(c)), this.eventCount - 1), !1;
    }, this.items.length, 0), { remaining: a, transform: o, selection: l };
  }
  // Create a new branch with the given transform added.
  addTransform(e, t, n, i) {
    let s = [], o = this.eventCount, l = this.items, a = !i && l.length ? l.get(l.length - 1) : null;
    for (let f = 0; f < e.steps.length; f++) {
      let h = e.steps[f].invert(e.docs[f]), d = new ee(e.mapping.maps[f], h, t), u;
      (u = a && a.merge(d)) && (d = u, f ? s.pop() : l = l.slice(0, l.length - 1)), s.push(d), t && (o++, t = void 0), i || (a = d);
    }
    let c = o - n.depth;
    return c > Ha && (l = Ka(l, c), o -= c), new X(l.append(s), o);
  }
  remapping(e, t) {
    let n = new lt();
    return this.items.forEach((i, s) => {
      let o = i.mirrorOffset != null && s - i.mirrorOffset >= e ? n.maps.length - i.mirrorOffset : void 0;
      n.appendMap(i.map, o);
    }, e, t), n;
  }
  addMaps(e) {
    return this.eventCount == 0 ? this : new X(this.items.append(e.map((t) => new ee(t))), this.eventCount);
  }
  // When the collab module receives remote changes, the history has
  // to know about those, so that it can adjust the steps that were
  // rebased on top of the remote changes, and include the position
  // maps for the remote changes in its array of items.
  rebased(e, t) {
    if (!this.eventCount)
      return this;
    let n = [], i = Math.max(0, this.items.length - t), s = e.mapping, o = e.steps.length, l = this.eventCount;
    this.items.forEach((d) => {
      d.selection && l--;
    }, i);
    let a = t;
    this.items.forEach((d) => {
      let u = s.getMirror(--a);
      if (u == null)
        return;
      o = Math.min(o, u);
      let p = s.maps[u];
      if (d.step) {
        let m = e.steps[u].invert(e.docs[u]), g = d.selection && d.selection.map(s.slice(a + 1, u));
        g && l++, n.push(new ee(p, m, g));
      } else
        n.push(new ee(p));
    }, i);
    let c = [];
    for (let d = t; d < o; d++)
      c.push(new ee(s.maps[d]));
    let f = this.items.slice(0, i).append(c).append(n), h = new X(f, l);
    return h.emptyItemCount() > $a && (h = h.compress(this.items.length - n.length)), h;
  }
  emptyItemCount() {
    let e = 0;
    return this.items.forEach((t) => {
      t.step || e++;
    }), e;
  }
  // Compressing a branch means rewriting it to push the air (map-only
  // items) out. During collaboration, these naturally accumulate
  // because each remote change adds one. The `upto` argument is used
  // to ensure that only the items below a given level are compressed,
  // because `rebased` relies on a clean, untouched set of items in
  // order to associate old items with rebased steps.
  compress(e = this.items.length) {
    let t = this.remapping(0, e), n = t.maps.length, i = [], s = 0;
    return this.items.forEach((o, l) => {
      if (l >= e)
        i.push(o), o.selection && s++;
      else if (o.step) {
        let a = o.step.map(t.slice(n)), c = a && a.getMap();
        if (n--, c && t.appendMap(c, n), a) {
          let f = o.selection && o.selection.map(t.slice(n));
          f && s++;
          let h = new ee(c.invert(), a, f), d, u = i.length - 1;
          (d = i.length && i[u].merge(h)) ? i[u] = d : i.push(h);
        }
      } else o.map && n--;
    }, this.items.length, 0), new X(I.from(i.reverse()), s);
  }
}
X.empty = new X(I.empty, 0);
function Ka(r, e) {
  let t;
  return r.forEach((n, i) => {
    if (n.selection && e-- == 0)
      return t = i, !1;
  }), r.slice(t);
}
class ee {
  constructor(e, t, n, i) {
    this.map = e, this.step = t, this.selection = n, this.mirrorOffset = i;
  }
  merge(e) {
    if (this.step && e.step && !e.selection) {
      let t = e.step.merge(this.step);
      if (t)
        return new ee(t.getMap().invert(), t, this.selection);
    }
  }
}
class de {
  constructor(e, t, n, i, s) {
    this.done = e, this.undone = t, this.prevRanges = n, this.prevTime = i, this.prevComposition = s;
  }
}
const Ha = 20;
function _a(r, e, t, n) {
  let i = t.getMeta(Ie), s;
  if (i)
    return i.historyState;
  t.getMeta(Ga) && (r = new de(r.done, r.undone, null, 0, -1));
  let o = t.getMeta("appendedTransaction");
  if (t.steps.length == 0)
    return r;
  if (o && o.getMeta(Ie))
    return o.getMeta(Ie).redo ? new de(r.done.addTransform(t, void 0, n, Ot(e)), r.undone, Fr(t.mapping.maps), r.prevTime, r.prevComposition) : new de(r.done, r.undone.addTransform(t, void 0, n, Ot(e)), null, r.prevTime, r.prevComposition);
  if (t.getMeta("addToHistory") !== !1 && !(o && o.getMeta("addToHistory") === !1)) {
    let l = t.getMeta("composition"), a = r.prevTime == 0 || !o && r.prevComposition != l && (r.prevTime < (t.time || 0) - n.newGroupDelay || !Ua(t, r.prevRanges)), c = o ? nn(r.prevRanges, t.mapping) : Fr(t.mapping.maps);
    return new de(r.done.addTransform(t, a ? e.selection.getBookmark() : void 0, n, Ot(e)), X.empty, c, t.time, l ?? r.prevComposition);
  } else return (s = t.getMeta("rebased")) ? new de(r.done.rebased(t, s), r.undone.rebased(t, s), nn(r.prevRanges, t.mapping), r.prevTime, r.prevComposition) : new de(r.done.addMaps(t.mapping.maps), r.undone.addMaps(t.mapping.maps), nn(r.prevRanges, t.mapping), r.prevTime, r.prevComposition);
}
function Ua(r, e) {
  if (!e)
    return !1;
  if (!r.docChanged)
    return !0;
  let t = !1;
  return r.mapping.maps[0].forEach((n, i) => {
    for (let s = 0; s < e.length; s += 2)
      n <= e[s + 1] && i >= e[s] && (t = !0);
  }), t;
}
function Fr(r) {
  let e = [];
  for (let t = r.length - 1; t >= 0 && e.length == 0; t--)
    r[t].forEach((n, i, s, o) => e.push(s, o));
  return e;
}
function nn(r, e) {
  if (!r)
    return null;
  let t = [];
  for (let n = 0; n < r.length; n += 2) {
    let i = e.map(r[n], 1), s = e.map(r[n + 1], -1);
    i <= s && t.push(i, s);
  }
  return t;
}
function ja(r, e, t) {
  let n = Ot(e), i = Ie.get(e).spec.config, s = (t ? r.undone : r.done).popEvent(e, n);
  if (!s)
    return null;
  let o = s.selection.resolve(s.transform.doc), l = (t ? r.done : r.undone).addTransform(s.transform, e.selection.getBookmark(), i, n), a = new de(t ? l : s.remaining, t ? s.remaining : l, null, 0, -1);
  return s.transform.setSelection(o).setMeta(Ie, { redo: t, historyState: a });
}
let rn = !1, Vr = null;
function Ot(r) {
  let e = r.plugins;
  if (Vr != e) {
    rn = !1, Vr = e;
    for (let t = 0; t < e.length; t++)
      if (e[t].spec.historyPreserveItems) {
        rn = !0;
        break;
      }
  }
  return rn;
}
const Ie = new Oi("history"), Ga = new Oi("closeHistory");
function Ya(r = {}) {
  return r = {
    depth: r.depth || 100,
    newGroupDelay: r.newGroupDelay || 500
  }, new Ci({
    key: Ie,
    state: {
      init() {
        return new de(X.empty, X.empty, null, 0, -1);
      },
      apply(e, t, n) {
        return _a(t, n, e, r);
      }
    },
    config: r,
    props: {
      handleDOMEvents: {
        beforeinput(e, t) {
          let n = t.inputType, i = n == "historyUndo" ? Vn : n == "historyRedo" ? zt : null;
          return !i || !e.editable ? !1 : (t.preventDefault(), i(e.state, e.dispatch));
        }
      }
    }
  });
}
function gs(r, e) {
  return (t, n) => {
    let i = Ie.getState(t);
    if (!i || (r ? i.undone : i.done).eventCount == 0)
      return !1;
    if (n) {
      let s = ja(i, t, r);
      s && n(e ? s.scrollIntoView() : s);
    }
    return !0;
  };
}
const Vn = gs(!1, !0), zt = gs(!0, !0);
var ke = {
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
}, Bt = {
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
}, Xa = typeof navigator < "u" && /Mac/.test(navigator.platform), Za = typeof navigator < "u" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
for (var v = 0; v < 10; v++) ke[48 + v] = ke[96 + v] = String(v);
for (var v = 1; v <= 24; v++) ke[v + 111] = "F" + v;
for (var v = 65; v <= 90; v++)
  ke[v] = String.fromCharCode(v + 32), Bt[v] = String.fromCharCode(v);
for (var sn in ke) Bt.hasOwnProperty(sn) || (Bt[sn] = ke[sn]);
function Qa(r) {
  var e = Xa && r.metaKey && r.shiftKey && !r.ctrlKey && !r.altKey || Za && r.shiftKey && r.key && r.key.length == 1 || r.key == "Unidentified", t = !e && r.key || (r.shiftKey ? Bt : ke)[r.keyCode] || r.key || "Unidentified";
  return t == "Esc" && (t = "Escape"), t == "Del" && (t = "Delete"), t == "Left" && (t = "ArrowLeft"), t == "Up" && (t = "ArrowUp"), t == "Right" && (t = "ArrowRight"), t == "Down" && (t = "ArrowDown"), t;
}
const ec = typeof navigator < "u" && /Mac|iP(hone|[oa]d)/.test(navigator.platform), tc = typeof navigator < "u" && /Win/.test(navigator.platform);
function nc(r) {
  let e = r.split(/-(?!$)/), t = e[e.length - 1];
  t == "Space" && (t = " ");
  let n, i, s, o;
  for (let l = 0; l < e.length - 1; l++) {
    let a = e[l];
    if (/^(cmd|meta|m)$/i.test(a))
      o = !0;
    else if (/^a(lt)?$/i.test(a))
      n = !0;
    else if (/^(c|ctrl|control)$/i.test(a))
      i = !0;
    else if (/^s(hift)?$/i.test(a))
      s = !0;
    else if (/^mod$/i.test(a))
      ec ? o = !0 : i = !0;
    else
      throw new Error("Unrecognized modifier name: " + a);
  }
  return n && (t = "Alt-" + t), i && (t = "Ctrl-" + t), o && (t = "Meta-" + t), s && (t = "Shift-" + t), t;
}
function rc(r) {
  let e = /* @__PURE__ */ Object.create(null);
  for (let t in r)
    e[nc(t)] = r[t];
  return e;
}
function on(r, e, t = !0) {
  return e.altKey && (r = "Alt-" + r), e.ctrlKey && (r = "Ctrl-" + r), e.metaKey && (r = "Meta-" + r), t && e.shiftKey && (r = "Shift-" + r), r;
}
function Lr(r) {
  return new Ci({ props: { handleKeyDown: ic(r) } });
}
function ic(r) {
  let e = rc(r);
  return function(t, n) {
    let i = Qa(n), s, o = e[on(i, n)];
    if (o && o(t.state, t.dispatch, t))
      return !0;
    if (i.length == 1 && i != " ") {
      if (n.shiftKey) {
        let l = e[on(i, n, !1)];
        if (l && l(t.state, t.dispatch, t))
          return !0;
      }
      if ((n.altKey || n.metaKey || n.ctrlKey) && // Ctrl-Alt may be used for AltGr on Windows
      !(tc && n.ctrlKey && n.altKey) && (s = ke[n.keyCode]) && s != i) {
        let l = e[on(s, n)];
        if (l && l(t.state, t.dispatch, t))
          return !0;
      }
    }
    return !1;
  };
}
const V = new oi({
  nodes: ma(vr.spec.nodes, "paragraph block*", "block"),
  marks: vr.spec.marks
}), sc = qe.fromSchema(V), oc = ze.fromSchema(V);
function Wr(r) {
  const e = document.createElement("div"), t = String(r ?? "");
  if (/<[a-z!][\s\S]*>/i.test(t))
    e.innerHTML = t;
  else {
    const n = t.split(/\n{2,}/);
    e.innerHTML = n.map((i) => `<p>${i.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`).join("") || "<p></p>";
  }
  return sc.parse(e);
}
function lc(r) {
  const e = document.createElement("div");
  return e.append(oc.serializeFragment(r.content)), e.innerHTML;
}
const Jr = [
  { icon: "format_bold", title: "Bold (Ctrl+B)", run: (r) => rt(V.marks.strong)(r), active: (r) => r.selection.$from.marks().some((e) => e.type === V.marks.strong) },
  { icon: "format_italic", title: "Italic (Ctrl+I)", run: (r) => rt(V.marks.em)(r), active: (r) => r.selection.$from.marks().some((e) => e.type === V.marks.em) },
  { icon: "code", title: "Code", run: (r) => rt(V.marks.code)(r), active: (r) => r.selection.$from.marks().some((e) => e.type === V.marks.code) },
  { sep: !0 },
  { icon: "format_list_bulleted", title: "Bullet list", run: (r) => zr(V.nodes.bullet_list)(r) },
  { icon: "format_list_numbered", title: "Numbered list", run: (r) => zr(V.nodes.ordered_list)(r) },
  { icon: "format_quote", title: "Quote", run: (r) => Va(V.nodes.blockquote)(r) },
  { sep: !0 },
  { icon: "undo", title: "Undo (Ctrl+Z)", run: (r) => Vn(r.state, r.dispatch) },
  { icon: "redo", title: "Redo (Ctrl+Y)", run: (r) => zt(r.state, r.dispatch) }
], ac = `
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
let qr = !1;
function cc() {
  if (qr) return;
  qr = !0;
  const r = document.createElement("style");
  r.textContent = ac, document.head.append(r);
}
class fc extends HTMLElement {
  connectedCallback() {
    if (this._built) return;
    this._built = !0, cc();
    const e = document.createElement("div");
    e.className = "rte-toolbar";
    for (const n of Jr) {
      if (n.sep) {
        e.append(Object.assign(document.createElement("span"), { className: "rte-sep" }));
        continue;
      }
      const i = document.createElement("button");
      i.type = "button", i.className = "rte-btn", i.title = n.title, i.append(Object.assign(document.createElement("span"), {
        className: "material-symbols-outlined",
        textContent: n.icon
      })), i.addEventListener("mousedown", (s) => s.preventDefault()), i.addEventListener("click", () => {
        n.run(this._view), this._view.focus(), this._syncToolbar();
      }), e.append(i);
    }
    const t = document.createElement("div");
    t.className = "rte-view", this.append(e, t), this._view = new as(t, {
      state: Oe.create({
        doc: Wr(this.getAttribute("value") ?? ""),
        plugins: [
          Ya(),
          Lr({
            "Mod-z": Vn,
            "Mod-y": zt,
            "Shift-Mod-z": zt,
            "Mod-b": rt(V.marks.strong),
            "Mod-i": rt(V.marks.em),
            Enter: ba(V.nodes.list_item),
            "Mod-[": xa(V.nodes.list_item),
            "Mod-]": Ca(V.nodes.list_item),
            "Mod-Enter": qt(Cn, (n, i) => Cn(n, i))
          }),
          Lr(Ja)
        ]
      }),
      dispatchTransaction: (n) => {
        const i = this._view;
        i.updateState(i.state.apply(n)), n.docChanged && this._emit(), this._syncToolbar();
      }
    }), this._syncToolbar();
  }
  disconnectedCallback() {
    this._view && (this._view.destroy(), this._view = null);
  }
  _syncToolbar() {
    if (!this._view) return;
    const e = this._view.state;
    for (const t of this.querySelectorAll(".rte-btn")) {
      const n = Jr[[...t.parentElement.children].indexOf(t)];
      n != null && n.active && t.classList.toggle("active", n.active(e));
    }
  }
  _emit() {
    this.dispatchEvent(new Event("input", { bubbles: !0 }));
  }
  get value() {
    return this._view ? lc(this._view.state.doc) : this.getAttribute("value") ?? "";
  }
  set value(e) {
    if (!this._view) {
      this.setAttribute("value", e ?? "");
      return;
    }
    if (e === this.value || this._view.hasFocus()) return;
    const t = Oe.create({
      doc: Wr(e),
      plugins: this._view.state.plugins
    });
    this._view.updateState(t);
  }
}
customElements.define("rich-text-editor", fc);
