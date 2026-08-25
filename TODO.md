# SCM Implementation Plan

Derived from `spec.md` (authoritative product spec; the JSON editor spec was merged into it as §9)
(form-based JSON editor, owner-approved scope amendment). Backend v1 and the
frontend wiring of phases 0–9 are **complete**; this file now tracks the form
editor work.

## Status

- [x] Phases 0–9 of the original plan: backend modules (`error`, `paths`,
      `config`, `git`, `project`, `content`, `setup`), HTTP API under `/api`,
      frontend decomposition + state/api wiring, publishing UX, config editor,
      empty states, security pass, headless e2e verification.
- [x] Phases J0–J4 below: JSON form editor per `spec.md` §9.
- [ ] Phase J5 polish items (partially done: Esc-cancel rename, focus
      management, empty hints, reduced-motion already implemented).
- [ ] Phases P0–P8 below: visual page editor per `spec_page_editor.md`.

## Standing constraints (apply to every phase)

- No Actix actors — app state = ordinary structs (behind `Arc<RwLock<_>>` where shared), Tokio tasks, async fns (spec §3).
- All blocking fs/Git work goes through `tokio::task::spawn_blocking`; never block the runtime (spec §12).
- Path safety everywhere: reject absolute paths where relative expected, reject `..`, path separators in IDs/filenames; content paths must stay inside the checkout (spec §15).
- Atomic writes for config (temp file in same dir → flush → rename) and content saves (spec §10).
- Never auto-delete/revert local checkouts or content when a Git op fails; removing a project from config never deletes files (spec §6, §11).
- Frontend: vanilla ES modules, custom elements where useful, no Shadow DOM by default, no framework/bundler/npm (spec §3, §13).
- Keep crate name `wss_serve`; run everything from repo root (CWD-relative paths).
- Form editor is frontend-only: no backend/API changes required.

## Target additions for the form editor

```
web/scripts/
├── json-model.js        J0  pure tree model: parse/serialize/coerce/move/rename
├── components/
│   ├── form-editor.js   J1  recursive form renderer
│   ├── dnd.js           J2  cross-parent pointer drag & drop (FLIP)
│   └── json-editor.js   J3  becomes tabbed container (Form | JSON)
web/styles/components.css    appended styles using existing tokens only
```

---

## Phase J0 — Spec + data model

- [x] Write the editor spec (done — merged into `spec.md` §9; — modes, tree model, row anatomy,
      nesting/index badges, collapse+counts, delete/add, cross-parent DnD with
      cycle guard and key-across-containers rules, coercion table,
      validation, acceptance criteria).
- [x] `web/scripts/json-model.js`: pure functions, zero DOM:
  - `parse(text) → root` / `serialize(root) → text` (pretty 2-space + `\n`),
    stable numeric node ids assigned at parse time.
  - Node shape `{id, key, type, value, children}`; types string/number/
    boolean/object/array/null; ordered children preserve document order
    (integer-like keys included).
  - `renameKey` (reject empty/duplicate), `uniqueKey`, `convertType`
    (coercion table from spec §9), `moveNode` (cycle guard; named→array drops
    key; entry→object generates unique key), `childCount`.
- [x] Syntax-checked via `node --check`; node test script covers round-trip, coercion table, move rules.

**Done when:** model round-trips arbitrary documents byte-order-stable and
all operations behave per spec §3/§8/§9.

## Phase J1 — Static form renderer

- [x] `components/form-editor.js`: recursive renderer into light DOM reusing
      sketch classes (`.field-item`, `.drag-handle`, `.nested-container`,
      `.add-section`):
  - Row anatomy per spec §4: handle, chevron, title-input (borderless bold,
    commit on Enter/blur, inline dup/empty rejection, Esc restores),
    text-style type dropdown menu (6 types), delete ✕.
  - Array entries: immutable `[n]` index badges instead of name inputs.
  - Value controls per type matrix (text field, number step=any, toggle
    switch, null note); typing mutates model without re-render.
  - Recursive nested containers; add-property / add-entry sections with
    inline type chooser; unique generated names focused for rename.
  - Collapse per node id; collapsed nestables show `(n items)`; empty
    containers show muted hints. Root object/array/scalar all supported.
- [x] CSS additions appended to `components.css` (tokens only): tabs,
      title-input, type dropdown, index badge, toggle switch, count note,
      chevron rotation.

**Done when:** every fixture document renders correctly and all acceptance
criteria except DnD (§11.1–7, 10–12) hold in manual/headless checks.

## Phase J2 — Drag & drop sorting

- [x] `components/dnd.js`: pointer-based (no libraries):
  - Handle-only initiation with movement threshold; setPointerCapture.
  - Global drop-slot registry built from rendered expanded lists (gaps +
    empty lists); dragged subtree's containers excluded (cycle guard at
    registry time, enforced again in `moveNode`).
  - Dashed insertion placeholder; source row dimmed; FLIP animation for
    displaced siblings; `prefers-reduced-motion` disables transitions.
  - Collapsed container hover ~400 ms auto-expands mid-drag.
  - Commit → `model.moveNode` → single re-render; Escape/pointercancel
    aborts and restores layout.

**Done when:** sibling reorder, cross-object move, entry↔property moves, and
cycle exclusion all behave per spec §8.

## Phase J3 — Tabbed integration

- [x] Rework `json-editor.js` into the mode container: tabs `Form | JSON`
      (form default when parse succeeds), one shared action bar.
  - Form→JSON live serialization; JSON→Form gated on valid parse with
    inline error otherwise.
  - Save path unified: serialize from active mode → existing PUT flow;
    dirty tracking compares against on-disk text; Cancel restores disk
    state and re-parses the tree.
- [x] Stale-response guard kept when switching files mid-load.

**Done when:** acceptance criteria §11.10–11 hold; previous e2e save/cancel
behavior unchanged for JSON tab.

## Phase J4 — Verification

- [x] Extend headless Chrome e2e harness (fresh fixture each run — recreate
      bare origin + seed so edits are genuinely new):
  - basics: render rows from fixture; rename; duplicate-key rejection;
    type switch coercion (number→boolean etc.); collapse shows `(n items)`;
    add property/entry; delete re-indexes.
  - DnD: synthetic PointerEvent drag — sibling reorder changes serialized
    order; cross-parent move incl. entry→object generated key; invalid drop
    (into own descendant) is a no-op.
  - round-trip: Form edit → JSON tab reflects it → Save → server GET shows
    persisted doc; Cancel restores original.
- [x] Backend suite green: `cargo check`, `cargo test` (15 tests).
- [x] Constraint sweep: no npm/bundler/framework traces, no Shadow DOM, light-DOM only, animations honor reduced-motion.

**Done when:** all 12 acceptance criteria of `spec.md` §9.11 verified
headlessly plus full manual smoke at `/`.

## Phase J5 — Polish

- [ ] Focus management: new nodes focus their name input; Esc cancels an
      in-progress rename draft; drag cancels cleanly on blur/Escape.
- [ ] Empty-state hints for scalar roots; long-name ellipsis; keyboard focus
      order sanity across a row.
- [ ] Update AGENTS.md current-state section after merge-worthy state.

**Done when:** UX rough edges from J1/J2 addressed; docs reflect reality.

---

## Media management (per spec.md §18)

- [x] M1 — config `media_dir` (default `./public/media/`, validated) + backend:
  list / serve / upload / rename / delete under `/api/projects/{id}/media`;
  uploads land in `media_dir`; publish stages it; `/assets` superseded.
- [x] M2 — sidebar **Media** button + manager view: upload button, four view
  modes (small grid / large grid / list-medium / list-small, persisted),
  item actions (copy link, rename w/ 409 handling, delete).
- [x] M3 — lightbox viewer: arrows + keyboard + swipe navigation, ×/Esc/up-
  swipe close, bottom action bar; ProseMirror upload switched to `media_dir`.
- [ ] M4 — e2e phases (upload/list/rename/delete/viewer) + docs sync.

---

## Visual page editor (per spec_page_editor.md)

Target file layout:
```
src/
├── pages.rs              P0  page discovery + load/save (mirrors content.rs)
├── pages_gen.rs          P5  static HTML generation from page tree
├── pages_import.rs       P6  HTML → page JSON import (html5ever)
├── http/api.rs               register page endpoints
└── http/routes.rs            register page routes

web/scripts/
├── page-model.js         P1  page tree model: nodes, nesting, validation
├── components/
│   ├── pages-list.js     P2  sidebar "Pages" category (mirrors content-list.js)
│   ├── page-editor.js    P3  toolbar + canvas + inspector container
│   ├── page-canvas.js    P3  visual tree rendering + drop indicators
│   ├── page-palette.js   P3  component palette (Box, Text, Image)
│   └── page-inspector.js P4  property panel + CSS inputs + class assignment
web/styles/components.css    append page-editor styles
```

---

## Phase P0 — Backend page resources

- [ ] `src/pages.rs`: page discovery + CRUD, mirroring `content.rs`:
  - `list_pages(checkout)` — scan `<checkout>/pages/` for direct-child `.json`
  - `load_page(checkout, name)` — read page JSON as text
  - `create_page(checkout, name, initial?)` — create with default template
  - `save_page(checkout, name, body)` — validate + atomic write
  - `delete_page(checkout, name)` — reject deletion of `index.json`
  - `ensure_pages_dir(checkout)` — create `pages/` if missing
- [ ] API handlers in `src/http/api.rs`:
  - `GET /api/projects/{id}/pages` — list pages
  - `GET /api/projects/{id}/pages/{name}` — load page
  - `POST /api/projects/{id}/pages` — create page
  - `PUT /api/projects/{id}/pages/{name}` — save page
  - `DELETE /api/projects/{id}/pages/{name}` — delete non-index page
- [ ] Register in `src/http/routes.rs`
- [ ] Unit tests for pages.rs

**Done when:** pages can be listed, created, loaded, saved, deleted via API; index.json is protected.

---

## Phase P1 — Page document model (frontend)

- [ ] `web/scripts/page-model.js`: pure functions, zero DOM:
  - `createEmptyPage(title)` — default document with root Box
  - `validatePage(doc)` — structure validation, unique IDs, required props
  - `findPageNode(root, id)`, `findPageParent(root, id)`
  - `addPageNode(root, parentId, type, index)` — add Box/Text/Image
  - `movePageNode(root, nodeId, targetParentId, index)` — with cycle guard + nesting validation
  - `removePageNode(root, nodeId)` — remove node
  - `clonePageNode(root, nodeId)` — deep clone with new IDs
  - `generateId()` — unique node ID
  - Nesting matrix: parent→child compatibility per spec §10
  - `canNest(parentType, parentElement, childType, childElement)` — check if child is valid inside parent

**Done when:** model operations enforce nesting rules, cycle guard works, all node types supported.

---

## Phase P2 — Page discovery & sidebar

- [ ] `web/scripts/api.js`: add page API wrappers:
  - `listPages(id)`, `loadPage(id, name)`, `createPage(id, name)`,
    `savePage(id, name, text)`, `deletePage(id, name)`
- [ ] `web/scripts/state.js`: extend state:
  - `state.pages: []`, `state.selectedPage: null`, `state.view: 'page-editor'`
  - `refreshPages()`, `setPageSelection(name)`
- [ ] `web/scripts/components/pages-list.js`: sidebar "Pages" category:
  - Collapsible header (mirrors content-list.js structure)
  - File list of discovered `.json` pages
  - Add button (creates new page, opens in editor)
  - `index.json` shown with special badge, non-deletable
  - Delete button with confirmation for non-index pages
  - Fly-out for collapsed sidebar mode
- [ ] `web/index.html`: add `#pages-nav` div in sidebar
- [ ] `web/scripts/main.js`: wire pages nav, handle `state.view === 'page-editor'`

**Done when:** Pages list appears in sidebar, pages can be created/opened/deleted, index.json is protected.

---

## Phase P3 — Visual page editor (canvas + palette + toolbar)

- [ ] `web/scripts/components/page-palette.js`:
  - Box, Text, Image draggable items
  - "Add Box", "Add Text", "Add Image" buttons (keyboard-accessible)
  - Drag source data for palette→canvas drops
- [ ] `web/scripts/components/page-canvas.js`:
  - Renders page tree as nested visual blocks
  - Box = bordered container with element label
  - Text = element label with content preview
  - Image = thumbnail or placeholder with alt text
  - Click to select node
  - Drop targets: valid positions only (nesting matrix enforced)
  - Drop indicators at valid positions, rejection at invalid positions
  - Empty container placeholder ("Drop components here")
  - Palette→canvas drag (HTML Drag and Drop API)
  - Canvas-internal reorder drag (pointer events)
  - Cycle guard: prevent dropping into self/descendants
  - Keyboard: Enter to add child to selected Box, Delete to remove
- [ ] `web/scripts/components/page-editor.js`:
  - Toolbar: page name, save, generate, preview, unsaved indicator
  - Three-column layout: palette | canvas | inspector
  - Load page from API, manage dirty state, save flow
  - Stale-response guard when switching pages mid-load

**Done when:** pages render on canvas, components can be added/moved/deleted, nesting rules enforced visually.

---

## Phase P4 — Inspector and CSS properties

- [ ] `web/scripts/components/page-inspector.js`:
  - Component type label and ID display
  - Box: element dropdown (div/section/header/main/footer/article/aside)
  - Text: element dropdown (p/h1/h2/h3/span/blockquote) + content textarea
  - Image: src field + media picker button + alt input
  - CSS property inputs (extensible definition list, ~20 properties)
  - Reusable class assignment (checkboxes)
  - Delete button
- [ ] CSS property definition list (extensible, spec §13):
  - display, width, max-width, min-height, margin, padding, gap,
    color, background-color, font-size, font-weight, line-height,
    text-align, border, border-radius, box-shadow, flex-direction,
    justify-content, align-items, grid-template-columns

**Done when:** selecting a node shows its properties, CSS can be edited, element types can be changed.

---

## Phase P5 — Reusable classes

- [ ] Document-level class management in page-editor.js:
  - Create class (name, label, description, styles)
  - Rename class
  - Edit class styles
  - Assign class to node (toggle)
  - Remove class from node
  - Delete unused class
- [ ] Class name validation (valid CSS identifier)
- [ ] Generator emits CSS for classes used by the page

**Done when:** classes can be created, assigned, edited, and appear in generated output.

---

## Phase P6 — Static HTML generation

- [ ] `src/pages_gen.rs`: recursive HTML generator:
  - Parse and validate page JSON document
  - Generate CSS from inline styles + reusable classes
  - Generate HTML recursively: Box→element, Text→element+escaped content, Image→img
  - Output mapping: index.json→root index.html, others→pages/*.html
  - Validation: unknown types, duplicate IDs, missing required props, unsafe paths
  - Atomic file writes
- [ ] API endpoint: `POST /api/projects/{id}/pages/{name}/generate`
- [ ] Preview endpoint: `GET /api/projects/{id}/pages/{name}/preview`
- [ ] Unit tests for generator

**Done when:** pages generate valid static HTML, preview works, all validation rules enforced.

---

## Phase P7 — HTML import

- [ ] Add `html5ever` dependency to `Cargo.toml`
- [ ] `src/pages_import.rs`: HTML parser + converter:
  - Parse HTML with html5ever
  - Element mapping per spec §18
  - Class, ID, style preservation
  - Import warnings for unsupported content
- [ ] API endpoint: `POST /api/projects/{id}/pages/import`
- [ ] Frontend import UI (toolbar button, file picker, warnings display)
- [ ] Unit tests for importer

**Done when:** HTML files can be imported into page JSON with warnings.

---

## Phase P8 — SCM integration

- [ ] Update publish pathspecs to include `pages/` and root `index.html`
- [ ] Media integration: Image src picker uses existing media list
- [ ] Git status reflects page changes
- [ ] AGENTS.md update

**Done when:** page changes appear in Git status, publish stages pages, media picker works for images.

---

## Explicitly out of scope

Schemas/schema-driven validation, rich-text editing, multi-select drag,
keyboard-based drag alternatives, undo/redo history (Cancel = restore from
disk remains the only revert), media/images, auth — unless the owner asks.
