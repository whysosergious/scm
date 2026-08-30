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

- Standard HTML, standard CSS, vanilla JavaScript ES modules with JSDoc typing.
- Custom elements where useful; light DOM only — no automatic Shadow DOM.
- No framework and no runtime bundler. The **single exception** is the rich text editor: ProseMirror is pre-built with vite from `web/editor-src/` into a self-contained, committed ES bundle (`web/scripts/vendor/rich-editor.bundle.js`) that the app lazy-imports at runtime. npm/vite are never needed to launch the frontend — only when changing the editor component.
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
│   ├── pages.rs            # page discovery + load/save (mirrors content.rs)
│   ├── pages_gen.rs        # static HTML generation from page tree
│   ├── pages_import.rs     # HTML → page JSON import (html5ever)
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
│   ├── editor-src/         # npm project for the rich editor (build-time only)
│   └── scripts/
│       ├── main.js         # bootstrap: store subscription → view rendering
│       ├── state.js        # tiny pub/sub store + selection rules
│       ├── api.js          # fetch wrappers, unwraps the error shape
│       ├── dom.js          # light-DOM helpers
│       ├── json-model.js   # order-preserving JSON tree model (own parser)
│       ├── page-model.js   # page tree model: nodes, nesting, validation
│       ├── components/     # form-editor, json-editor, dnd, panels, toast,
│       │                   # pages-list, page-editor, page-canvas,
│       │                   # page-palette, page-inspector
│       └── vendor/         # committed rich-editor.bundle.js (ProseMirror)
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
      "content_dir": "content",
      "media_dir": "./public/media/"
    }
  ]
}
```

### `config_version`

An integer identifying the configuration format version. The only supported value is `1`; anything else is rejected with an explicit error.

### `projects_dir`

Path to the directory containing local project checkouts, relative to the SCM working directory. Absolute paths and `..` traversal are rejected.

#### Project `media_dir`

Target-checkout-relative folder for uploaded media. Defaults to `./public/media/` when absent. Must be a relative path (same rules as `content_dir`). Resolved against the target project checkout so media files are versioned and published with it. See §18 for the full media management specification.

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

| Type    | Control                                     |
| ------- | ------------------------------------------- |
| String  | one of three switchable modes, below        |
| Number  | `<input type="number" step="any">`          |
| Boolean | toggle switch                               |
| Null    | disabled note reading `null`                |
| Object  | recursive nested container + "Add property" |
| Array   | recursive nested container + "Add entry"    |

Value areas are direct children of the row element and span its full width. Typing updates the model without re-rendering. Empty containers show muted hints.

### 9.5 String editor modes

A compact three-button switcher sits above every string value control:

| Mode       | Icon          | Control                                                                      | Value semantics             |
| ---------- | ------------- | ---------------------------------------------------------------------------- | --------------------------- |
| Text input | `text_fields` | single-line `<input type="text">`                                            | raw string                  |
| Text field | `wrap_text`   | auto-growing, vertically resizable textarea (themed corner grip)             | raw string (multi-line)     |
| Rich text  | `edit_note`   | ProseMirror WYSIWYG with toolbar (bold/italic/code, lists, quote, undo/redo) | HTML **or** Markdown string |

Rules:

- The mode is **autodetected** for untouched properties: HTML-looking values and Markdown-marked values (headings, list markers, `**bold**`, inline code, links, fences) open in rich mode; multi-line plain text or strings longer than 100 characters open as a text field; everything else as a text input. Single-underscore emphasis is deliberately NOT a markdown marker (false-positives on URLs and snake_case). Once the user switches modes manually, the choice is remembered per property path (in-memory, per session).
- The rich editor autodetects the **storage format** and round-trips it: HTML values parse/serialize as HTML; everything else (including plain text) as CommonMark Markdown. Raw HTML inside Markdown is treated as literal text.
- Switching modes never destroys data: the raw string carries over.
- The value is always a plain JSON string, so static sites consume it directly and no server-side changes are required.

### 9.5.1 Rich text editor features

Toolbar (format-aware — HTML-only controls are hidden in Markdown mode):

- Undo/redo; block types: paragraph, headings 1–4 (also `Ctrl+Alt+0..4`).
- Marks: bold, italic, underline (HTML), strikethrough (`~~…~~` round-trips in Markdown via a custom markdown-it rule), inline code.
- Blocks: bullet & ordered lists, blockquote, code block, horizontal rule, hard line break (`Shift+Enter`).
- **Links** (`Ctrl+K`): prompt for URL, remove by clearing it.
- **Images**: insert by URL + alt text; rendered between paragraphs, selectable, round-trips as `<img src alt>` (HTML) or `![alt](src)` (Markdown).
- Text alignment (left/center/right/justify) — HTML format only.
- Markdown-style input rules while typing (`# `, `> `, `- `, `1. `, ` ` ```), smart quotes, ellipsis and em-dash replacement; `linkify` for bare URLs.
- Placeholder text for empty documents; live word/character count.

### 9.5.2 Images — current approach and roadmap

Current, two insert paths:

- **By URL** — prompt for URL + alt text; for external or already-hosted images.
- **By upload** — a file picker uploads the image via `POST /api/projects/{id}/media?filename=…` into the checkout's `media_dir` folder (created on demand; name deduplicated as `name-2.ext`, `name-3.ext`, …; extension allow-list: png jpg jpeg gif webp svg avif ico bmp; max 20 MB). The editor inserts the site-relative URL `/<media_dir>/<name>.ext`, so the target website renders the image directly and the file is versioned with the content — publishing stages `media_dir` together with the content directory.

Future options: paste/drop upload routed through the same endpoint; external embeds (YouTube/Vimeo etc.) as a separate node type.

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

Publishing stages **the configured content directory**, **media directory** (when present), and **the pages directory** (when present), then commits and pushes the configured branch:

```text
Edit content → validate JSON → save locally → stage content dir
(+ media_dir when present; + public/images for backwards compatibility)
(+ pages/ when present; + root index.html when generated)
→ commit (default message "Update content") → push origin <branch>
```

The publish endpoint returns HTTP 200 with a discriminated `outcome` covering every case: `no_changes`, `committed_and_pushed`, `commit_failed`, `push_failed`, `auth_failed`, `remote_rejected` (non-fast-forward), `merge_conflict`, `git_missing`, `invalid_repo`. The UI renders each outcome distinctly and offers retry. Local content is never deleted or reverted when a Git operation fails.

## 12. HTTP server

The Rust application serves the control panel from `web/` and a JSON API under `/api`:

| Method   | Path                                       | Purpose                                           |
| -------- | ------------------------------------------ | ------------------------------------------------- |
| GET      | `/api/config`                              | current configuration (as stored)                 |
| POST     | `/api/config`                              | validate full document → atomic save → swap state |
| GET      | `/api/projects`                            | configured projects + live checkout status        |
| POST     | `/api/projects`                            | import project (optional immediate clone)         |
| DELETE   | `/api/projects/{id}`                       | remove from config only; disk untouched           |
| POST     | `/api/projects/{id}/checkout`              | clone-or-verify checkout                          |
| POST     | `/api/projects/{id}/ensure-content-dir`    | create missing content dir                        |
| GET/POST | `/api/projects/{id}/content`               | list `.json` entries / create file                |
| GET/PUT  | `/api/projects/{id}/content/{name}`        | load raw / validate + save                        |
| GET      | `/api/projects/{id}/git/status`            | parsed porcelain status                           |
| GET      | `/api/projects/{id}/media`                 | list media files                                  |
| GET      | `/api/projects/{id}/media/{name}`          | serve media file (raw)                            |
| POST     | `/api/projects/{id}/media`                 | upload media (raw bytes, dedup)                   |
| POST     | `/api/projects/{id}/media/{name}/rename`   | rename media (409 on conflict)                    |
| DELETE   | `/api/projects/{id}/media/{name}`          | delete media file                                 |
| GET      | `/api/projects/{id}/pages`                 | list page JSON files                              |
| GET      | `/api/projects/{id}/pages/{name}`          | load page JSON                                    |
| POST     | `/api/projects/{id}/pages`                 | create page                                       |
| PUT      | `/api/projects/{id}/pages/{name}`          | save page JSON                                    |
| DELETE   | `/api/projects/{id}/pages/{name}`          | delete non-index page                             |
| POST     | `/api/projects/{id}/pages/{name}/generate` | generate static HTML                              |
| POST     | `/api/projects/{id}/pages/import`          | import HTML into page JSON                        |
| GET      | `/api/projects/{id}/pages/{name}/preview`  | serve generated HTML                              |
| POST     | `/api/projects/{id}/publish`               | stage → commit → push                             |

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
    ├── page-model.js  # page tree model: nodes, nesting, validation
    ├── components/    # project-selector, import-modal, content-list,
    │                  # project-info, git-status, json-editor (tabs),
    │                  # form-editor, dnd, config-editor, toast,
    │                  # pages-list, page-editor, page-canvas,
    │                  # page-palette, page-inspector
    └── vendor/        # rich-editor.bundle.js (committed build output)
```

Layout: fixed-viewport flex — sidebar (collapsible, with a hover fly-out for the file list when collapsed), header, and a canvas that is the only scrolling element. Custom scrollbars match the theme. The visual language follows the original control-panel sketch.

## 14. Control-panel areas

- Project selector (header dropdown with per-project checkout badges, import, remove-from-config).
- Empty-project state with an import-project modal.
- Project information (repo/branch/content dir, checkout status, publish action).
- Content-file list (collapsible "Content" category in the sidebar; hover fly-out when the sidebar is collapsed; "+ Add" button).
- Page-file list (collapsible "Pages" category in the sidebar, separate from Content; index.json protected from deletion; "+ Add" button; click opens the visual page editor).
- Page editor (toolbar + component palette + canvas + inspector; completely separate from the JSON content editor).
- JSON editor area (Form | JSON tabs).
- Save action (dirty tracking, Cancel restores disk state).
- Git status area (header summary + per-project status panel with refresh).
- Publish action with confirm dialog and per-outcome toasts.
- Configuration editor (Settings view).

## 15. Error and safety requirements

SCM validates all paths derived from configuration or user input and rejects: absolute paths where relative is expected, `..` traversal, path separators in project ids and content filenames, duplicate project ids, content paths outside the target repository, and existing target directories that are not valid checkouts.

Errors are user-readable with technical detail kept for the log, shaped as `{"error": {category, message, detail}}` and distinguished between: invalid configuration, invalid JSON content, missing files/directories, Git failures, filesystem failures, network/remote failures. All writes (config and content) are atomic. Local content is never auto-reverted or deleted when a Git operation fails.

## 16. Out of scope

Still postponed: content schemas and schema-driven validation, multi-select drag, keyboard-based drag alternatives, undo/redo history for form edits (Cancel restores from disk), full file explorer, image upload processing (format conversion, resizing), user authentication, multi-user access, remote/hosted SCM operation, FTP/SFTP publishing, deployment-provider plugins, automatic npm installs on the target site, automatic target-site builds, production packaging, public API authentication. For the page editor specifically: responsive breakpoint editing, forms, navigation builders, SEO/accessibility scoring, rich-text editing inside page components, arbitrary HTML components, framework-specific output.

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
13. See a "Pages" sidebar list separate from Content, with index.json protected from deletion.
14. Open the visual page editor and build pages from Box, Text, and Image components.
15. Nest and reorder components with enforced HTML nesting rules.
16. Edit component content, element types, and CSS properties through the inspector.
17. Generate static HTML from page JSON and preview it.
18. Import an existing HTML page into the page editor.
19. Publish generated pages through the existing Git workflow.

## 18. Media management

### 18.1 Configuration

Each project entry gains an optional `media_dir` property (default `"./public/media/"`). Must be a relative path (same rules as `content_dir`). Resolved against the target project checkout so media files are versioned and published with it.

### 18.2 Backend API

All under `/api/projects/{id}/media`, operating strictly inside `<checkout>/<media_dir>` (traversal-proof; names are validated single path components with an image extension allow-list: png, jpg, jpeg, gif, webp, svg, avif, ico, bmp).

| Method | Path                   | Purpose                                         | Response                                                |
| ------ | ---------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| GET    | `/media`               | list files                                      | `{ media_dir, files: [{ name, size, url, modified }] }` |
| GET    | `/media/{name}`        | serve raw file (correct image content-type)     | binary                                                  |
| POST   | `/media?filename=…`    | upload (raw bytes, ≤20 MB, dedup `name-2.ext`…) | `201 { url, file }`                                     |
| POST   | `/media/{name}/rename` | rename; body `{name}`; 409 on conflict          | `{ renamed, url }`                                      |
| DELETE | `/media/{name}`        | delete file                                     | `{ deleted }`                                           |

Notes:

- `url` in listings is the site-relative URL (`/<media_dir>/<name>`, normalized without `./` and trailing slash) — this is what content embeds and what "copy link" puts on the clipboard.
- The former `/assets` upload endpoint is superseded by `POST …/media`.
- Publishing stages `media_dir` (when present) in addition to the content directory and the legacy `public/images` folder for backwards compatibility.
- Non-image files inside `media_dir` are ignored by listings; they are never deleted or moved by SCM.

### 18.3 Control panel

**Navigation**: the sidebar gains a **Media** button above the Content category. Clicking it switches the canvas to the media manager view. Clicking a content file or Settings switches away.

**Media manager view**:

- **Upload** button at the top (file picker; multiple files allowed; dedup rules apply).
- **View mode toggle** with four modes, persisted in `localStorage` (key `scm:media-view`):
  1. `grid-sm` — small grid (compact thumbnails)
  2. `grid-lg` — large grid (big thumbnails)
  3. `list-md` — list with medium previews
  4. `list-sm` — list with minimal previews (tiny thumbnail, row-oriented)
- Each item shows a preview, file name, size, and three actions: **copy link** (site-relative URL → clipboard), **rename** (inline prompt; 409 on duplicate), **delete** (confirm dialog).
- Empty state: hint + upload button.

**Viewer (lightbox)**: clicking an item opens a full-screen viewer:

- Large centered preview over a dimmed backdrop.
- Left/right arrow buttons navigate to the previous/next media item (wrapping); keyboard arrow keys do the same.
- `×` button and `Esc` close; swipe gestures: left/right navigate, up/down close.
- Bottom bar repeats rename / copy link / delete for the open item.
- Navigation order follows the current list order.
- Closing the viewer after rename/delete refreshes the grid.

### 18.4 Rich editor integration

The ProseMirror "insert image (upload)" button uploads into `media_dir` through the same endpoint and embeds the returned site-relative URL. The "copy link" URL matches what the editor embeds, so pasted links resolve.

### 18.5 Acceptance criteria

1. `media_dir` defaults to `./public/media/` and is validated when present.
2. Uploads land in `<checkout>/<media_dir>` with dedup and are published.
3. The sidebar Media button opens the manager; the four view modes work and persist across reloads.
4. Copy link puts the site-relative URL on the clipboard.
5. Rename rejects duplicates (409 surfaced inline); delete removes the file.
6. The viewer opens on click, navigates with arrows/keys/swipe, closes with ×/Esc/down-swipe, and offers rename/copy link/delete.
7. Closing the viewer after rename or delete refreshes the grid.

## 19. Page editing

SCM provides a visual page editor for building static HTML pages from structured components.

### 19.1 Purpose and scope

The editor operates on the currently selected project, using its content directory, media directory, pages directory, and publish path. It must use existing project/path resolution — no second config system.

Must support: page list, index page (non-deletable), create/delete pages, visual canvas with tree, add/nest/reorder components, drag-and-drop, select and edit properties/CSS, reusable classes, save JSON, generate HTML, preview, import HTML.

Not in scope: content schemas, raw HTML components, responsive breakpoints, animations, forms, auth, collaboration.

### 19.2 Technology

**Backend:** Rust, Tokio, Actix Web. No actors. Blocking work through Tokio blocking facilities. HTML import uses `html5ever`.

**Frontend:** HTML, CSS, vanilla JS, ES modules, custom elements. No framework, no bundler, no npm. Regular DOM (Shadow DOM only when encapsulation is needed).

### 19.3 Storage

Pages live under `project/pages/`. JSON is source of truth; HTML is generated output.

```text
pages/index.json   → project/index.html
pages/contact.json → project/pages/contact.html
```

The sidebar has a **Pages** list separate from the generic **Content** list. Both page JSON source files and generated HTML are committed to the target repository.

### 19.4 Page discovery

Scans direct `.json` children of `pages/`. No recursion in v1. Selection stored in localStorage.

### 19.5 Index page

`index.json` maps to root `index.html`. Non-deletable, auto-created if missing.

### 19.6 Document model

```json
{
  "version": 1,
  "title": "Home",
  "meta": { "description": "", "og_image": "" },
  "head": [
    { "type": "stylesheet", "href": "/css/main.css" },
    { "type": "style", "css": ".hero { padding: 4rem; }" },
    { "type": "meta", "name": "author", "content": "Jane" },
    { "type": "script", "src": "/js/app.js", "defer": true }
  ],
  "classes": [],
  "root": {
    "id": "root", "type": "box",
    "props": { "element": "main" },
    "styles": {}, "classes": [], "children": []
  }
}
```

Node fields: `id` (unique), `type` (`box`|`text`|`image`), `props`, `styles`, `classes`, `children`. Unknown properties preserved on load/save.

### 19.7 Components

**Box:** Groups children. Element options: `div`, `section`, `header`, `main`, `footer`, `article`, `aside`, `nav`, `svg`, `video`, `audio`, plus all standard HTML elements. Default: `div`.

**Text:** Display text. Element options: `p`, `h1`–`h6`, `span`, `blockquote`, `a`, `button`, `li`, plus all standard inline/phrasing elements. Text escaped during generation.

**Image:** `src` (media-relative), `alt` (required), optional title/width/height/loading.

**SVG:** Stored as box with `element: svg` and `innerHTML` containing the full `<svg>...</svg>` markup (preserved via XMLSerializer). Rendered in canvas via namespace-aware creation.

**Nesting rules:**

| Parent | Allowed children |
|---|---|
| Flow container (`div`, `section`, etc.) | Box, Text(`span`), Image, SVG |
| Phrasing container (`p`, `h1`–`h3`, `blockquote`) | Text(`span`) only |
| Inline (`span`, `a`) | Text(`span`) only |
| SVG | Leaf (no child nodes) |
| Image | No children |

Cycle guard: a node cannot be dropped inside itself or descendants. Invalid drops rejected with visual indicator.

### 19.8 Head elements

The `head` array stores elements for `<head>`. Types: `stylesheet` (href, media), `style` (css), `meta` (name/property/charset + content), `script` (src or js, defer/async). Order preserved; emitted as-is during generation.

Legacy `meta.description`/`meta.og_image` generate corresponding meta tags; deduplicated against `head` entries.

### 19.9 Visual editor layout

```text
┌──────────────────────────────────────────────────┐
│ Toolbar                                          │
├────────────┬──────────┬──────────────┬───────────┤
│ Palette    │ Tree     │ Canvas       │ Inspector │
│            │ <head>   │ (iframe)     │           │
│ Box        │ <body>   │              │ selected  │
│ Text       │  tree    │              │ element   │
│ Image      │          │              │ props     │
│ SVG        │          │              │           │
└────────────┴──────────┴──────────────┴───────────┘
```

Canvas: same-origin `<iframe>` for full HTML document isolation. Transparent overlay in parent handles all interaction via coordinate-mapped hit-testing. Pointer events for drag-and-drop across iframe boundary.

Inspector: node inspector (type, ID, element selector, content/src/alt fields, CSS properties, assigned classes, class management), body inspector (body classes/styles/attrs), head inspector (type-specific fields per §19.8). SVG nodes show a CodeMirror markup editor.

### 19.10 Drag and drop

Pointer events (not HTML DnD API) for cross-frame support. Palette→canvas drag, canvas reorder, nesting enforcement per §19.7. Drop indicators at valid positions only. Collapsed containers auto-expand on hover during drag.

### 19.11 Styling

Inline styles + reusable class assignments. Extensible CSS property list. Classes defined in document `classes` array with name, label, description, styles.

### 19.12 HTML generation

Recursive tree rendering. Escapes text/attributes. Generates valid nesting, assigned classes, inline styles, class CSS. Head elements emitted in order. Output mapped by filename (`index.json` → root, others → `pages/`).

### 19.13 HTML import

Converts external HTML pages into a `PageDocument` entirely on the client side.

#### Parsing strategy

The parser inserts the imported HTML into a hidden same-origin iframe (`sandbox="allow-same-origin"` — blocks scripts, allows CSS), writes the HTML via `document.open()`/`write()`/`close()`, listens for the `load` event, then waits one animation frame for styles to compute. For URL imports, a `<base href>` is injected for the original URL so relative paths resolve.

#### Head collection

Before walking the body, extract from `iframe.contentDocument.head`:

| Source element | HeadElement mapping |
|---|---|
| `<link rel="stylesheet">` | `{ type: 'stylesheet', href, media }` |
| `<style>` | `{ type: 'style', css: textContent }` |
| `<meta name="...">` | `{ type: 'meta', name, content }` |
| `<meta property="...">` | `{ type: 'meta', property, content }` |
| `<meta charset="...">` | `{ type: 'meta', charset }` |
| `<script src="...">` | `{ type: 'script', src, defer, async }` |
| `<script>...</script>` | `{ type: 'script', js: textContent }` |
| `<title>` | Sets `doc.title` |

Cross-origin `<link>` elements are reported as warnings.

#### Element mapping

| HTML element | PageNode type | Element |
|---|---|---|
| `div`, `section`, `main`, `header`, `footer`, `article`, `aside`, `nav` | box | same tag |
| `ul`, `ol`, `li` | box | same tag |
| `p`, `h1`–`h6`, `span`, `blockquote`, `a`, `button` | text | same tag |
| `img` | image | — |
| `video`, `audio` | box | same tag |
| `svg` | box | `svg` (innerHTML via XMLSerializer) |
| `br` | box | `br` |
| `hr` | box | `div` |
| `table`, `form`, `input`, `select`, `textarea`, `iframe`, `script`, `style`, `noscript` | — | skip, report |
| Unknown custom elements | box or text | depends on children |
| Unknown non-void elements | box | same tag |

#### Node processing

1. **ID**: use element's `id` if valid (alphanumeric + hyphens), otherwise generate `nN`.
2. **Inline styles**: extract from `style` attribute into `node.styles`.
3. **Computed styles**: diff against browser defaults and parent inherited values; merge shorthand properties; skip properties already in inline styles.
4. **Attributes**: extract `href`, `target`, `src`, `alt`, `controls`, `autoplay`, `loop`, `muted`, `poster`, `width`, `height`, `loading`, `rel`. Skip `class`, `id`, `style`.
5. **Classes**: split `class` on whitespace → `node.classes`.
6. **Children**: recurse into child elements.

#### CSS extraction

Only import properties the editor supports: `display`, `position`, `top/right/bottom/left`, `z-index`, `width`, `height`, `min/max-width/height`, `margin`, `padding`, `background-*`, `color`, `font-*`, `line-height`, `text-align`, `text-decoration`, `border`, `border-radius`, `box-shadow`, `flex-*`, `justify-content`, `align-items`, `grid-template-columns`, `opacity`, `overflow`, `cursor`. Unsupported properties are reported as warnings.

Shorthand merging: if all longhand properties of a shorthand share the same value, replace with the shorthand (e.g. `margin-top/right/bottom/left: 1rem` → `margin: 1rem`).

#### Text handling

Whitespace-only text nodes between block elements are discarded. Text inside supported text elements becomes the `value` prop. Text-only box children are wrapped in child Text nodes.

#### Whitespace normalization

`mergeWhitespaceNodes()` post-processes box children: whitespace-only text normalized to single space, merged into adjacent text siblings, dropped around block elements. `&nbsp;` (`\u00A0`) normalized to space.

#### Import report

```text
{ warnings: string[], errors: string[], stats: { total, boxes, texts, images } }
```

Categories: `[unsupported element]`, `[unsupported attribute]`, `[unsupported style]`, `[cross-origin stylesheet]`, `[fragment]`.

#### Image resolution

All `img[src]` values are resolved against the iframe's `<base href>`. The integration layer converts to project-relative media paths before saving.

### 19.14 Import modal

Three-tab dialog: **Paste** (textarea), **Upload** (file input, `.html`/`.htm`), **From URL** (text input + Fetch button).

```text
┌─ Import HTML ──────────────────────────────────┐
│  [Paste] [Upload] [From URL]                   │
│  ┌─ tab content ──────────────────────────────┐│
│  │ (textarea / file input / url input)         ││
│  └────────────────────────────────────────────┘│
│  ┌─ preview ─────────────────────────────────┐  │
│  │ 12 boxes, 34 texts, 5 images              │  │
│  │ 3 warnings: [unsupported element] <table>  │  │
│  └───────────────────────────────────────────┘  │
│  Page title: [_______________]                  │
│              [Cancel]  [Import]                 │
└─────────────────────────────────────────────────┘
```

Behavior: debounced parse (200ms) on input; preview shows stats and warnings; Import returns `PageDocument` to page editor (dirty confirmation if needed); empty input disables Import; >5MB warns but allows; network errors show toast.

### 19.15 Media integration

Image component integrates with existing media manager (§18). Source stored as website-relative path.

### 19.16 Save, generate, and preview

Save writes JSON. Generate creates HTML. Preview serves generated HTML. Publish is separate Git operation. Unsaved-changes indicator.

### 19.17 API

Pages CRUD under `/api/projects/{id}/pages`. Generation, import, preview endpoints. Reuses media and git/status endpoints. Backend validates before saving. Frontend manages in-memory tree.

### 19.18 Safety

No path traversal, no filesystem access through paths, no raw HTML injection, atomic writes, no writing outside project. No deleting `index.json`.

### 19.19 Key rules

- Page documents are structured JSON trees, not arbitrary HTML.
- Nesting is enforced: a `div` cannot be dropped inside a `p`; a `span` can be inside a `p`.
- The visual editor canvas renders nodes close to their generated output.
- Generated HTML contains real content without requiring JavaScript.
- The page editor and the JSON content editor are completely separate editors that share no code paths.

### 19.20 Acceptance criteria

1. User can select a project and open the page editor.
2. Page list shows all pages; index.json is non-deletable.
3. Components can be added, nested, and reordered via drag-and-drop.
4. Nesting rules are enforced with visual indicators.
5. Node properties, CSS, and classes can be edited through the inspector.
6. Reusable classes can be defined and assigned.
7. Page JSON is saved and can be generated to static HTML.
8. HTML import preserves structure with warnings for unsupported content.
9. Head elements can be managed (stylesheets, scripts, meta).
10. SVG components render correctly in canvas.
11. Generated pages publish through the existing Git workflow.
