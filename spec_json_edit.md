# SCM JSON Form Editor Specification

Derived from the owner's feature request ("edit each JSON file with forms").
This document amends `spec.md`: §16 excluded schema-driven forms and draggable
form-field design from version one. Per owner decision, the form-based JSON
editor described here **is now in scope**. Everything not covered here still
follows `spec.md`.

## 1. Purpose

The control panel gains a structured way to edit arbitrary JSON content files
as nested forms instead of raw text. The plain-text editor remains available;
both operate on the same file through the same save endpoint. There are still
no schemas: forms are derived purely from the parsed document.

## 2. Editor modes

The file editor provides two modes shown as tabs above the editing surface:

- **Form** (default when opening a file): structured, recursive property forms.
- **JSON**: the existing plain-text textarea editor.

Rules:

- Switching **JSON → Form** requires the textarea to contain valid JSON. If it
  does not parse, an inline error is shown and the view stays on JSON.
- Switching **Form → JSON** serializes the current form state into pretty-
  printed JSON (2-space indent) and fills the textarea live.
- Both modes share the same action bar (Cancel / Save), dirty tracking, and
  save flow (`PUT /api/projects/{id}/content/{name}`). The backend is
  unchanged and remains authoritative; saving still validates JSON server-side.

## 3. Data model

Forms render from an explicit tree model (`web/scripts/json-model.js`), never
directly from `JSON.parse` output:

```text
Node {
  id:       stable number assigned at parse time,
  key:      property name (objects only; empty for array entries),
  type:     "string" | "number" | "boolean" | "object" | "array" | "null",
  value:    primitive for scalar types, ignored otherwise,
  children: ordered array of Nodes for object/array, [] otherwise
}
```

Why a tree: JS objects reorder integer-like keys (`"1"`, `"42"`); explicit
ordered children preserve document order exactly. Stable ids give reliable
drag-and-drop keys and per-node UI state (collapse).

Model operations (pure, no DOM):

- `parse(text) → root` — throws on invalid JSON.
- `serialize(root) → text` — canonical pretty JSON + trailing newline.
- `renameKey(objectNode, oldKey, newKey) → {ok, error?}` — rejects empty names
  and duplicates within the same object (case-sensitive).
- `uniqueKey(objectNode, base)` — `base`, `base2`, `base3`, …
- `convertType(node, newType)` — smart coercion, see §9.
- `moveNode(root, node, targetParent, index)` — cross-parent move with cycle
  guard: the target parent may not be the node itself or any of its
  descendants. Moving a named property into an array clears its key; moving an
  entry out of an array into an object assigns a unique generated key.
- `childCount(node)` — for the "(n items)" display.

## 4. Property row anatomy

Every object property and array entry renders as a row reusing the visual
language of the original control-panel sketch (`.field-item`,
`.drag-handle`, `.nested-container`, `.add-section`):

```
[drag handle] [name/title] [type ▾]        [clone] [chevron] [×]
              [value input | nested children …]
              [add property / add entry]
```

- **Drag handle** (`drag_indicator`): initiates drag-and-drop (§8). Not a
  click target for anything else.
- **Name**: an `<input>` permanently present but styled as a plain bold title
  (transparent background, no border). It reads as text; the editing
  affordance appears only on focus. Rename commits on Enter or blur;
  duplicates/empty names are rejected with an inline highlight and the
  previous key is restored on Escape.
- **Array entries** have no name input. They show an immutable index badge
  `[0]`, `[1]`, … as plain text. Badges re-index automatically from list
  order after any add/delete/clone/move.
- **Type selector**: renders as plain text (current type) with a small
  `arrow_drop_down` glyph — visually matching the header project selector.
  Clicking opens a menu with exactly: String, Number, Boolean, Object, Array,
  Null. Choosing converts the value per §9 and re-renders.
- **Right-side action cluster**, in order: **Clone** (`content_copy` icon),
  **chevron** (expand/collapse, §6), **delete `×`**.
- **Delete `×`**: removes the property/entry from its parent immediately
  (no confirm dialog; Cancel restores the file from disk state).
- **Clone**: deep-copies the property/entry and inserts the copy directly
  below the original in the same parent. Copies get fresh node ids; object
  copies receive a unique key derived from the original (`name` → `name2`)
  and are focused for immediate rename; array copies need no key.

### Value inputs (expanded rows)

| Type | Control |
|---|---|
| String | one of three switchable editor modes, see below |
| Number | `<input type="number" step="any">` (floats/exponents allowed) |
| Boolean | toggle switch |
| Null | disabled note reading `null` |
| Object | nested container listing child rows recursively + "Add property" |
| Array | nested container listing entry rows recursively + "Add entry" |

Value areas are direct children of the row element so nested containers and
inputs span the full width of the row, not just the head columns.

### String editor modes

A compact three-button switcher sits above every string value control:

| Mode | Icon | Control | Value semantics |
|---|---|---|---|
| Text input | `text_fields` | single-line `<input type="text">` | raw string |
| Text field | `wrap_text` | auto-growing, vertically resizable textarea | raw string (multi-line) |
| Rich text | `edit_note` | ProseMirror WYSIWYG with toolbar (bold/italic/code, lists, quote, undo/redo) | HTML string (`<p>…</p>`) |

Rules:

- The mode is **UI state per property** (not stored in the document). The
  default is heuristic: HTML-looking values open in rich mode, multi-line
  values in text-field mode, everything else as a text input.
- Switching modes never destroys data: the raw string carries over. Moving
  plain text into rich mode renders it as paragraphs (`\n\n` splits, `\n`
  becomes `<br>`); leaving rich mode exposes the HTML source to the plain
  controls.
- The value is always a plain JSON string, so static sites consume the HTML
  directly and no server-side changes are required.
- The ProseMirror editor ships as a **pre-built, self-contained ES bundle**
  (`web/scripts/vendor/rich-editor.bundle.js`) that the app lazy-imports on
  first use. Build tooling (vite + npm) lives in `editor-src/` and is only
  needed when changing the editor component — never to launch the app.

Value areas are direct children of the row element so nested containers and
inputs span the full width of the row, not just the head columns.

Typing in a value control updates the model directly and marks the document
dirty without re-rendering (keeps focus/IME behavior intact).

## 5. Nesting

- Nested structures render recursively into bordered sub-containers
  (`.nested-container`), visually matching the sketch's depth styling.
- Object children are named property rows; array children are entry rows with
  index badges. Arrays may contain values of any type, including objects and
  arrays (arbitrary nesting).
- An **empty** object/array renders a muted hint ("No properties yet" /
  "No items yet") plus its add button.
- The **root** may be any type (spec.md §8 allows any root): object roots show
  their property list, array roots show their entry list, scalar roots render
  a single value card with a type selector and no name/delete/handle.

## 6. Collapse

- Every non-root row can collapse to a single head row:
  handle · chevron · name/index · type · count · ×.
- Collapsed object/array rows show `(n items)` where n = direct child count.
- Collapse state is per node (tracked by node id) and resets when the file is
  reloaded or re-parsed from the JSON tab.
- Newly added nodes render expanded with their name input focused (objects).

## 7. Addition, cloning & deletion

- Each expanded object offers "Add property" (`.add-section` style); each
  expanded array offers "Add entry". A small inline type selector accompanies
  the add action, mirroring the sketch; defaults to String.
- New object properties get a unique generated name (`property`, `property2`,
  …) and are focused for immediate renaming.
- **Cloning** (§4): the copy appears directly beneath the original with a
  unique derived key for objects; descendants are deep-copied with fresh ids.
- Deletion via the row's `×` updates indices/counters everywhere.

## 8. Drag & drop sorting

- Initiation: pointerdown on the drag handle only; a small movement threshold
  distinguishes drag from click. Pointer capture is used throughout.
- Scope: **cross-parent moves allowed**. Drop targets are the gaps between
  sibling rows in every currently *expanded* children list, plus empty-list
  targets. Excluded automatically: the dragged node's own position, any
  container inside the dragged subtree (cycle guard), and the root.
- Visuals: while dragging, the source row is **hidden** (the dashed insertion
  placeholder is the only gap), displaced rows reflow instantly so drop-target
  geometry stays exact. All animations respect `prefers-reduced-motion`.
- Collapsed containers become droppable by hovering them ~400 ms, which
  auto-expands them mid-drag.
- Commit: on release, the model performs `moveNode` (§8 rules: cycle guard,
  key clearing/generation across container types) and the form re-renders.
  Escape or losing the pointer cancels and restores the pre-drag layout.
- Implementation is dependency-free (no libraries/npm): pointer events +
  FLIP, per spec.md §3 constraints.

## 9. Type conversion (smart coercion)

When the type selector changes a node's type, the value converts best-effort:

| From ↓ / To → | string | number | boolean | object | array | null |
|---|---|---|---|---|---|---|
| string | – | numeric parse, else 0 | `"true"`/non-empty → true, `"false"`/`""` → false | `{}` | `[]` | `null` |
| number | decimal string | – | ≠ 0 | `{}` | `[]` | `null` |
| boolean | `"true"`/`"false"` | 1 / 0 | – | `{}` | `[]` | `null` |
| object | JSON text of object | 0 (unless parseable) | non-empty → true | – | **values only**, keys dropped | `null` |
| array | JSON text of array | 0 (unless parseable) | non-empty → true | keyed by index `"0","1",…` | – | `null` |
| null | `""` | 0 | false | `{}` | `[]` | – |

Lossy conversions are intentional and documented (owner-approved policy);
the JSON tab always shows the resulting document before saving.

## 10. Validation & errors

- Renaming to an empty or duplicate key is rejected inline; the input regains
  focus and highlights; Escape restores the prior key.
- Invalid number input (blocked mostly by the control itself) disables Save
  with the standard inline error treatment.
- Malformed JSON in the JSON tab keeps the existing behavior: Save disabled,
  switch to Form refused.
- Dirty semantics identical to today: any model/text divergence enables
  Cancel/Save; saving serializes from whichever mode is active.

## 11. Acceptance criteria

1. Opening a file lands on Form mode showing rows parsed from the document.
2. Name inputs look like titles; focusing/editing renames the property; Enter
   or blur commits; duplicate/empty renames are rejected inline.
3. The type control reads as text with a dropdown affordance; its menu offers
   exactly String, Number, Boolean, Object, Array, Null.
4. String values render one of three switchable modes (single-line input,
   auto-growing text field, ProseMirror rich text) selected via the compact
   switcher; number/boolean/null render a number input / toggle / disabled
   note respectively, on a full-width row beneath the head row.
5. Object/array values render nested rows recursively plus an add button;
   array entries use immutable `[n]` badges that re-index automatically.
6. Any row collapses via the chevron (right-side action cluster) to one head
   row; collapsed nestables show "(n items)".
7. Every row has functional Clone and delete `×` buttons; cloning inserts a
   deep copy directly beneath the original (unique key for objects);
   deletion re-indexes arrays.
8. Rows are sortable by dragging their handle, including into other expanded
   containers; cycles are impossible; animations play (unless reduced motion).
9. Dropping named properties into arrays drops the name; pulling entries into
   objects generates a unique renameable key.
10. Form edits appear in the JSON tab and vice versa (validity-gated).
11. Saving persists either mode's output; Cancel restores the on-disk state.
12. No frameworks/bundlers/npm introduced; light DOM only; backend unchanged.
