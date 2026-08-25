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

## Explicitly out of scope

Schemas/schema-driven validation, rich-text editing, multi-select drag,
keyboard-based drag alternatives, undo/redo history (Cancel = restore from
disk remains the only revert), media/images, auth — unless the owner asks.
