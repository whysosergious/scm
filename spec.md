# SCM Specification

## 1. Overview

SCM means **Static Content Manager**.

SCM is a local-first application for managing content for static websites. It is intended for developer blogs, regular blogs, portfolios, restaurant websites, and other sites that can be hosted by GitHub Pages or another static hosting provider.

Content is stored as JSON files inside the target website repository. The user edits those files through a local web control panel that offers both structured form editing (with a rich text editor for prose) and raw JSON editing. SCM then commits and pushes changes using Git.

The target website remains self-contained and independently deployable. SCM is only the local management tool.

## 2. Scope

The first version supports:

- Multiple configured website projects.
- A local checkout for each configured project (clone-on-demand).
- Project selection in the control panel (persisted per browser).
- JSON content discovery (direct children of `content_dir`).
- Editing arbitrary valid JSON through recursive property forms or raw JSON.
- Three editor modes for string values: single-line input, resizable text field, rich text (ProseMirror with HTML or Markdown storage).
- JSON syntax validation before saving.
- Drag-and-drop sorting of properties and entries, including across containers.
- Git-based publishing (stage content dir → commit → push).
- A static control-panel frontend (vanilla ES modules; the rich text editor ships as a pre-built bundle).
- Configuration editing through the control panel.

The first version does not require:

- A database.
- A production web server.
- A hosted CMS backend.
- Content schemas or a fixed post/project data model.
- Nested content directories.
- FTP or SFTP publishing.
- A build system for the target website.

## 3. Technology stack

### Backend

- Rust (current stable where practical).
- Tokio for asynchronous runtime functionality.
- Actix Web as the HTTP framework.
- Modern Actix Web/Tokio integration; **no Actix actors** — application state is ordinary Rust structures (`Arc<RwLock<_>>`), Tokio tasks, and async functions.
- Blocking filesystem/Git work goes through Tokio blocking facilities (`spawn_blocking`, `tokio::fs`, `tokio::process`).
- Git is driven through the `git` CLI so a missing executable is a detectable, user-facing failure.
- `serde_json` is built with the `preserve_order` feature: JSON key order survives every save (without it, saves silently alphabetize keys and destroy document order).

### Frontend

- Standard HTML, standard CSS, vanilla JavaScript ES modules.
- Custom elements where useful; light DOM only — no automatic Shadow DOM.
- No framework and no runtime bundler. The **single exception** is the rich text editor: ProseMirror is pre-built with vite from `editor-src/` into a self-contained, committed ES bundle (`web/scripts/vendor/rich-editor.bundle.js`) that the app lazy-imports at runtime. npm/vite are never needed to launch the frontend — only when changing the editor component.
- The control panel is a fixed-viewport layout: only the canvas scrolls; sidebar and header stay put. Scrollbars are styled to match the theme.

## 4. Repository structure

```text
scm/
├── Cargo.toml              # crate is still named wss_serve (legacy)
├── scm-config.json         # live configuration (created/edited via panel)
├── .env                    # HOST/PORT (copy .env.template)
├── spec.md                 # this document
├── src/
│   ├── main.rs             # startup only: dotenv → load config → serve
│   ├── config.rs           # types + load/validate/atomic-save scm-config.json
│   ├── setup.rs            # AppState (Arc<RwLock<AppConfig>>) + bootstrap
│   ├── project.rs          # checkout lifecycle: clone-on-demand, verify
│   ├── content.rs          # discovery + load/save JSON files
│   ├── git.rs              # thin wrapper over git CLI (tokio::process)
│   ├── error.rs            # ScmError: category + status → JSON error shape
│   ├── paths.rs            # shared path-safety helpers (unit-tested)
│   └── http/
│       ├── mod.rs
│       ├── routes.rs       # static routes + /api scope registration
│       └── api.rs          # API handlers
├── web/
│   ├── index.html
│   ├── styles/             # base.css, layout.css, components.css
│   └── scripts/
│       ├── main.js         # bootstrap: store subscription → view rendering
│       ├── state.js        # tiny pub/sub store + selection rules
│       ├── api.js          # fetch wrappers, unwraps the error shape
│       ├── dom.js          # light-DOM helpers
│       ├── json-model.js   # order-preserving JSON tree model (own parser)
│       ├── components/     # form-editor, json-editor, dnd, panels, toast…
│       └── vendor/         # committed rich-editor.bundle.js (ProseMirror)
├── editor-src/             # npm project for the rich editor (build-time only)
├── tools/e2e/              # headless regression suite + harness docs
└── projects/               # local checkouts of target repos (git-ignored)
```

`projects/` holds independent clones of the target website repositories (separate Git repositories nested inside this tree). They must never be committed to the SCM repository, and removing a project from the configuration must not delete its checkout.

## 5. Configuration

The configuration file is `scm-config.json` at the SCM repository root.

```json
{
  "config_version": 1,
  "projects_dir": "projects",
  "projects": [
    {
      "id": "wss-index",
      "name": "WSS Index",
      "repo": "https://github.com/whysosergious/wss-index.git",
      "branch": "main",
      "content_dir": "content"
    }
  ]
}
```

### `config_version`

An integer identifying the configuration format version. The only supported value is `1`; anything else is rejected with an explicit error.

### `projects_dir`

Path to the directory containing local project checkouts, relative to the SCM working directory. Absolute paths and `..` traversal are rejected.

### `projects`

An array of configured target website projects.

#### Project `id`

Stable unique identifier used for selection, checkout directory naming, and API routes. Must be safe as a directory name: non-empty ASCII letters/digits/`_`/`-`, no separators, no `..`.

#### Project `name`

Human-readable display name. May change without affecting the checkout directory or the stored selection.

#### Project `repo`

Git repository URL. HTTPS and SSH both work through the user's local Git configuration.

#### Project `branch`

The branch SCM operates on. Required — no default is assumed.

#### Project `content_dir`

Directory path relative to the target repository root. Must be relative and must not escape the checkout through traversal.

### Validation and persistence

Every save validates the complete document: version, relative paths, project id format, uniqueness of ids, non-empty name/repo/branch. Writes are atomic: temp file in the same directory → flush/sync → rename. Unknown top-level and per-project keys are preserved across round-trips (`#[serde(flatten)]`).

## 6. Project lifecycle

At startup, SCM:

1. Loads `scm-config.json`.
2. Parses and validates it; refuses to start with a readable error otherwise.
3. Resolves the projects directory.
4. Makes the configuration available to the control panel.
5. Starts the local HTTP server.

A checkout is initialized lazily — when a project is first selected/accessed:

- If the checkout directory does not exist: `git clone --branch <branch> <repo> projects/<id>`.
- If it exists, SCM verifies: it is a directory, it is a Git working tree, an `origin` remote exists and matches the configured repository (normalized comparison: trailing `/`, trailing `.git`, case), and the configured branch exists locally or on origin. Any mismatch is a hard error naming the problem — SCM never silently reuses a wrong checkout and never deletes one.

Removing a project from the configuration never touches its files on disk.

## 7. Project selection state

The selected project is UI state, stored in browser `localStorage` (key `scm:selected-project-id`), never in `scm-config.json`.

Selection rules:

```text
If projects is empty:      show the import-project modal / empty state.
If the stored id exists:   select it.
Otherwise:                 select the first project in the array.
```

Selection uses the stable id, so renaming a project never breaks it. Selecting a project whose checkout is missing triggers the clone automatically.

## 8. Content discovery

SCM resolves `checkout + content_dir` (traversal-checked) and scans only its direct child entries. A file is a content entry when it is a regular file (symlinks excluded) with the `.json` extension. Nested directories are ignored.

If the content directory is missing, the UI offers to create it. If it contains no JSON files, the UI offers to create one. Any valid JSON root value is allowed: object, array, string, number, boolean, null.

## 9. JSON editing

The editor opens a file in one of two tabs — **Form** (default) and **JSON** — sharing one action bar (Cancel / Save) and one dirty/save flow. The backend stays authoritative: saves validate JSON server-side, writes are atomic.

### 9.1 Modes

- Switching **JSON → Form** requires the textarea to contain valid JSON; otherwise an inline error is shown and the view stays on JSON.
- Switching **Form → JSON** serializes the current form state to pretty JSON (2-space) live.
- Saving serializes from whichever mode is active; Cancel restores the on-disk state in both modes.

### 9.2 Data model

Forms render from an explicit tree model (`web/scripts/json-model.js`), never from `JSON.parse` output — JS objects reorder integer-like keys, which would destroy document order. The module contains its own small recursive-descent JSON parser and emits serialization text directly from the tree.

```text
Node { id, key, type, value, children }
type: "string" | "number" | "boolean" | "object" | "array" | "null"
```

Ids are stable per parse and drive drag-and-drop keys and collapse state. Model operations are pure: `parse`, `serialize`, `renameKey` (rejects empty/duplicate), `uniqueKey`, `convertType` (smart coercion table), `moveNode` (post-removal index semantics, cycle guard), `cloneNode` (deep copy, fresh ids, unique derived key), `removeNode`, `addChild`, `nodePath`.

### 9.3 Property row anatomy

```text
[drag handle] [name/title] [type ▾]        [clone] [chevron] [×]
              [value input | nested children …]
              [add property / add entry]
```

- **Name**: an input styled as plain bold text; the editing affordance appears on focus. Commits on Enter/blur; empty or duplicate keys are rejected inline and Escape restores the previous key.
- **Array entries** show immutable `[n]` index badges as plain text; badges re-index automatically after any add/delete/clone/move.
- **Type selector**: text with a dropdown affordance; options are exactly String, Number, Boolean, Object, Array, Null. Switching applies smart coercion (best-effort conversion, e.g. `"42"`→42, object→array drops keys, array→object re-keys by index) with lossless-where-trivial, empty-default otherwise.
- **Right-side action cluster**: Clone (deep copy inserted directly below the original; object copies get `name2`-style keys and focused renaming), chevron (collapse/expand), delete `×` (immediate; Cancel restores from disk).

### 9.4 Value controls

| Type | Control |
|---|---|
| String | one of three switchable modes, below |
| Number | `<input type="number" step="any">` |
| Boolean | toggle switch |
| Null | disabled note reading `null` |
| Object | recursive nested container + "Add property" |
| Array | recursive nested container + "Add entry" |

Value areas are direct children of the row element and span its full width. Typing updates the model without re-rendering. Empty containers show muted hints.

### 9.5 String editor modes

A compact three-button switcher sits above every string value control:

| Mode | Icon | Control | Value semantics |
|---|---|---|---|
| Text input | `text_fields` | single-line `<input type="text">` | raw string |
| Text field | `wrap_text` | auto-growing, vertically resizable textarea (themed corner grip) | raw string (multi-line) |
| Rich text | `edit_note` | ProseMirror WYSIWYG with toolbar (bold/italic/code, lists, quote, undo/redo) | HTML **or** Markdown string |

Rules:

- The mode is **autodetected** for untouched properties: HTML-looking values and Markdown-marked values (headings, list markers, `**bold**`, inline code, links, fences) open in rich mode; multi-line plain text or strings longer than 100 characters open as a text field; everything else as a text input. Single-underscore emphasis is deliberately NOT a markdown marker (false-positives on URLs and snake_case). Once the user switches modes manually, the choice is remembered per property path (in-memory, per session).
- The rich editor autodetects the **storage format** and round-trips it: HTML values parse/serialize as HTML; everything else (including plain text) as CommonMark Markdown. Raw HTML inside Markdown is treated as literal text.
- Switching modes never destroys data: the raw string carries over.
- The value is always a plain JSON string, so static sites consume it directly and no server-side changes are required.

### 9.6 Collapse

Every non-root row collapses via its chevron to a single head row. Collapsed object/array rows show `(n items)` with the direct child count. Collapse state is per node id and resets when the file is reloaded or re-parsed from the JSON tab. Newly added nodes render expanded, with object copies/names focused for immediate renaming.

### 9.7 Drag & drop sorting

- Initiation: pointerdown on the drag handle only, with a movement threshold; pointer capture is used throughout.
- Scope: **cross-parent moves are allowed**. Drop targets are the gaps between sibling rows in every currently expanded children list, plus empty lists. Excluded automatically: the dragged node's own gap, any container inside the dragged subtree (cycle guard), and the root.
- Visuals: the source row is hidden while dragging — the dashed insertion placeholder is the only gap — and displaced rows reflow instantly so drop-target geometry is always exact. Animations respect `prefers-reduced-motion`.
- Collapsed containers become droppable by hovering them ~400 ms, which auto-expands them mid-drag.
- Commit: `moveNode` applies the cycle guard and the key rules (named property → array drops the key; array entry → object generates a unique `item`-style key); Escape or pointercancel aborts.
- Implementation is dependency-free: pointer events + layout measurements, no libraries.

## 10. Configuration editing

The control panel edits the complete `scm-config.json` as raw pretty JSON: client-side Validate (syntax), then Save sends the whole document to `PUT /api/config`, which validates (schema, ids, paths, uniqueness), writes atomically, and swaps the in-memory state. Validation errors surface verbatim. Unknown keys survive every round-trip.

## 11. Git publishing

Publishing stages **only the configured content directory**, then commits and pushes the configured branch:

```text
Edit content → validate JSON → save locally → stage content dir
→ commit (default message "Update content") → push origin <branch>
```

The publish endpoint returns HTTP 200 with a discriminated `outcome` covering every case: `no_changes`, `committed_and_pushed`, `commit_failed`, `push_failed`, `auth_failed`, `remote_rejected` (non-fast-forward), `merge_conflict`, `git_missing`, `invalid_repo`. The UI renders each outcome distinctly and offers retry. Local content is never deleted or reverted when a Git operation fails.

## 12. HTTP server

The Rust application serves the control panel from `web/` and a JSON API under `/api`:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/config` | current configuration (as stored) |
| POST | `/api/config` | validate full document → atomic save → swap state |
| GET | `/api/projects` | configured projects + live checkout status |
| POST | `/api/projects` | import project (optional immediate clone) |
| DELETE | `/api/projects/{id}` | remove from config only; disk untouched |
| POST | `/api/projects/{id}/checkout` | clone-or-verify checkout |
| POST | `/api/projects/{id}/ensure-content-dir` | create missing content dir |
| GET/POST | `/api/projects/{id}/content` | list `.json` entries / create file |
| GET/PUT | `/api/projects/{id}/content/{name}` | load raw / validate + save |
| GET | `/api/projects/{id}/git/status` | parsed porcelain status |
| POST | `/api/projects/{id}/publish` | stage → commit → push |

Errors use `{"error": {category, message, detail}}` with categories `config`, `invalid-json`, `not-found`, `git`, `filesystem`, `network-remote`, `internal`. API responses carry `Cache-Control: no-store` so the panel always reflects disk.

The server is a local development/control-panel server, not a public website backend.

## 13. Frontend structure

```text
web/
├── index.html
├── styles/            # base.css (tokens/resets), layout.css, components.css
└── scripts/
    ├── main.js        # bootstrap + render loop
    ├── state.js       # pub/sub store, selection rules, refresh helpers
    ├── api.js         # fetch wrappers
    ├── dom.js         # light-DOM helpers
    ├── json-model.js  # order-preserving JSON tree model
    ├── components/    # project-selector, import-modal, content-list,
    │                  # project-info, git-status, json-editor (tabs),
    │                  # form-editor, dnd, config-editor, toast
    └── vendor/        # rich-editor.bundle.js (committed build output)
```

Layout: fixed-viewport flex — sidebar (collapsible, with a hover fly-out for the file list when collapsed), header, and a canvas that is the only scrolling element. Custom scrollbars match the theme. The visual language follows the original control-panel sketch.

## 14. Control-panel areas

- Project selector (header dropdown with per-project checkout badges, import, remove-from-config).
- Empty-project state with an import-project modal.
- Project information (repo/branch/content dir, checkout status, publish action).
- Content-file list (collapsible "Content" category in the sidebar; hover fly-out when the sidebar is collapsed; "+ Add" button).
- JSON editor area (Form | JSON tabs).
- Save action (dirty tracking, Cancel restores disk state).
- Git status area (header summary + per-project status panel with refresh).
- Publish action with confirm dialog and per-outcome toasts.
- Configuration editor (Settings view).

## 15. Error and safety requirements

SCM validates all paths derived from configuration or user input and rejects: absolute paths where relative is expected, `..` traversal, path separators in project ids and content filenames, duplicate project ids, content paths outside the target repository, and existing target directories that are not valid checkouts.

Errors are user-readable with technical detail kept for the log, shaped as `{"error": {category, message, detail}}` and distinguished between: invalid configuration, invalid JSON content, missing files/directories, Git failures, filesystem failures, network/remote failures. All writes (config and content) are atomic. Local content is never auto-reverted or deleted when a Git operation fails.

## 16. Out of scope

Still postponed: content schemas and schema-driven validation, multi-select drag, keyboard-based drag alternatives, undo/redo history for form edits (Cancel restores from disk), media/image management, image upload processing, user authentication, multi-user access, remote/hosted SCM operation, FTP/SFTP publishing, deployment-provider plugins, automatic npm installs on the target site, automatic target-site builds, production packaging, public API authentication.

## 17. Success criteria

The first version is successful when a user can:

1. Start SCM with `cargo run`.
2. Load the local control panel from `web/`.
3. Import or configure a target website repository.
4. Have the repository cloned into the configured projects directory when needed.
5. Select the target project.
6. See direct `.json` files in its configured content directory.
7. Open a file and edit it through property forms — rename, change types, clone, delete, collapse, drag within and across containers.
8. Toggle a string property between text input, text field, and rich text (ProseMirror), with HTML/Markdown autodetected and round-tripped losslessly.
9. Switch to the raw JSON view and see form edits reflected; invalid JSON blocks both saving and switching back.
10. Save valid JSON; receive an error instead of saving invalid JSON; Cancel restores the on-disk state.
11. View the target project's Git status and commit + push content changes.
12. Keep the target website independently hostable as a static website.
