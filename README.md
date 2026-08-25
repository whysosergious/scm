# SCM — Static Content Manager

A local-first control panel for managing the JSON content of static websites.
SCM clones your website repository, lets you edit `.json` content files through
structured forms (or raw JSON), and publishes changes with Git — commit and
push, straight from the browser. The target website stays self-contained and
statically hostable.

Built with Rust (Actix Web + Tokio) and vanilla HTML/CSS/JS ES modules.

## Features

- **Multiple projects** — import target website repositories; checkouts are
  cloned lazily into `projects/` and verified on every use (remote + branch).
- **Form editor** — recursive property forms rendered from any JSON document:
  rename, change types (with smart coercion), clone, delete, collapse, and
  drag-and-drop reorder — including across containers.
- **Three string editor modes** — single-line input, auto-growing text field,
  and a rich text editor (ProseMirror) with autodetected HTML/Markdown
  round-tripping.
- **Raw JSON mode** — plain-text editing with syntax validation; form edits
  and JSON edits stay in sync.
- **Git publishing** — one click stages the content directory, commits, and
  pushes; clear outcomes for every failure case (auth, non-fast-forward,
  conflicts, …). Local content is never reverted on failure.
- **Config editing** — the full `scm-config.json` editable in the panel with
  validation and atomic writes; unknown keys are preserved.
- **Safety** — path-traversal protection everywhere, atomic file writes,
  JSON key order preserved (`serde_json/preserve_order`), API responses
  never cached.

## Quickstart

```bash
cp .env.template .env        # HOST=127.0.0.1, PORT=8080
cargo run                    # from the repo root (paths are CWD-relative)
```

Open http://127.0.0.1:8080/ and use the project dropdown in the header →
**Import project…** — enter your repository URL, branch, and content
directory. The repo is cloned into `projects/<id>` on first selection.

Requires: Rust (stable) and Git on `PATH`. Node/npm are **not** needed to run.

## Usage

- **Sidebar** — the collapsible *Content* category lists the `.json` files of
  the selected project; `+ Add` creates a new one (offering to create the
  content directory first if it is missing). Collapse the sidebar with the
  arrow in its header; hovering the folder icon then shows the file list as a
  fly-out.
- **Editor tabs** — *Form* (default) renders recursive property forms;
  *JSON* shows the raw file. Both tabs share Save/Cancel; switching
  JSON → Form is blocked while the text is invalid.
- **Form editing** — property names edit in place; the type dropdown covers
  String/Number/Boolean/Object/Array/Null with smart conversion; rows can be
  cloned, deleted, collapsed, and dragged within or across containers.
- **String modes** — every string property has a small switcher:
  single-line input, resizable text field, or rich text. The mode is
  autodetected from the value (HTML/Markdown → rich editor, long or
  multi-line text → text field) and your manual choice is remembered.
- **Publish** — asks for a commit message and reports the outcome (pushed,
  nothing to do, auth failed, remote rejected, …).
- **Settings** — raw `scm-config.json` editor with Validate/Save.

## Configuration

`scm-config.json` (repo root):

```json
{
  "config_version": 1,
  "projects_dir": "projects",
  "projects": [
    {
      "id": "wss-index",
      "name": "WSS Index",
      "repo": "https://github.com/you/site.git",
      "branch": "main",
      "content_dir": "content"
    }
  ]
}
```

Unknown extra keys are preserved across edits. See `spec.md` for the full
validation rules and runtime behavior.

## API overview

All endpoints are JSON under `/api` (errors shaped as
`{"error": {category, message, detail}}`):

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/config` | read / validate + save configuration |
| GET/POST | `/api/projects` | list (with checkout status) / import |
| DELETE | `/api/projects/{id}` | remove from config (files kept) |
| POST | `/api/projects/{id}/checkout` | clone-or-verify |
| POST | `/api/projects/{id}/ensure-content-dir` | create content dir |
| GET/POST | `/api/projects/{id}/content` | list / create `.json` file |
| GET/PUT | `/api/projects/{id}/content/{name}` | load / save |
| GET | `/api/projects/{id}/git/status` | parsed status |
| POST | `/api/projects/{id}/publish` | stage → commit → push |

## Development

```bash
cargo check          # fast type check
cargo test           # unit tests (paths, config, git, status parsing)
```

The frontend is plain ES modules served from `web/` — no build step, no
framework, no Shadow DOM.

### Rich text editor

The ProseMirror-based editor lives in `editor-src/` as an isolated npm
project. Its build output is committed, so npm/vite are only needed when
changing the editor component:

```bash
cd editor-src
npm install
npm run build        # -> web/scripts/vendor/rich-editor.bundle.js
```

The app lazy-imports that bundle at runtime; never run npm/vite to launch
the frontend.

### Headless e2e suite

`tools/e2e/` contains the full regression suite (sidebar, form editing,
markdown/HTML modes, drag & drop, persistence) plus step-by-step harness
instructions in `tools/e2e/README.md`.

## Repository layout

```text
src/          Rust backend (config, git, content, project, http API)
web/          control panel (styles, scripts, vendor bundle)
editor-src/   ProseMirror editor source + build (build-time only)
tools/e2e/    headless regression suite
projects/     local checkouts of target repos (git-ignored)
spec.md       product specification
```
