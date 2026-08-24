# SCM Implementation Plan

Derived from `spec.md` (authoritative). Current state: HTTP skeleton only (`src/main.rs`, `src/http/routes.rs`); nothing reads `scm-config.json` yet; `web/main.html` is an unsplit static sketch with inline CSS/JS.

## Standing constraints (apply to every phase)

- No Actix actors — app state = ordinary structs (behind `Arc<RwLock<_>>` where shared), Tokio tasks, async fns (spec §3).
- All blocking fs/Git work goes through `tokio::task::spawn_blocking`; never block the runtime (spec §12).
- Path safety everywhere: reject absolute paths where relative expected, reject `..`, path separators in IDs/filenames; content paths must stay inside the checkout (spec §15).
- Atomic writes for config (temp file in same dir → flush → rename) and content saves (spec §10).
- Never auto-delete/revert local checkouts or content when a Git op fails; removing a project from config never deletes files (spec §6, §11).
- Frontend: vanilla ES modules, custom elements where useful, no Shadow DOM by default, no framework/bundler/npm (spec §3, §13).
- Keep crate name `wss_serve`; run everything from repo root (CWD-relative paths).

## Target module layout (spec §4)

```
src/
├── main.rs          startup only: dotenv → load config → build state → serve
├── config.rs        types + load/validate/save scm-config.json
├── setup.rs         bootstrap: resolve dirs, initial state
├── project.rs       checkout lifecycle: clone-on-demand, verify existing
├── content.rs       discovery + load/save JSON files
├── git.rs           thin wrapper over git CLI (tokio::process)
├── error.rs         ScmError enum + category → HTTP response mapping
├── paths.rs         shared path-safety helpers (validate_relative, safe_join, valid_id/filename)
└── http/
    ├── mod.rs
    ├── routes.rs    static routes + /api/*
    └── api.rs       API handlers (split out so routes.rs stays readable)
```

---

## Phase 0 — Groundwork

- [ ] Add missing dependency: `serde_json = "1"` (not in Cargo.toml yet — needed by nearly every later phase).
- [ ] Create `src/error.rs`: one error type with a category discriminant matching spec §15 (config / invalid-json / not-found / git / filesystem / network-remote), user-readable message + technical detail for logs; implement `ResponseError` mapping categories to status codes (400 invalid config/json, 404 missing, 409 git conflicts/remote mismatch, 500 fs/internal, 502 push/network).
- [ ] Create `src/paths.rs` pure helpers (unit-testable, no I/O):
  - `validate_relative(path)` — reject absolute, empty, any `ParentDir` component.
  - `valid_project_id(id)` — non-empty, `[A-Za-z0-9_-]+`, no separators, not `.` or `..`.
  - `valid_content_filename(name)` — single component, no `/` `\` `..`, leading dot rejected.
  - `safe_join(base, rel) -> Option<PathBuf>` — join then verify result `starts_with(base)` after normalization.
- [ ] Add small `#[cfg(test)]` unit tests for these helpers (pure functions; no framework needed).
- [ ] Optional cleanup (ask owner before removing): audit unused legacy deps from the old dev-server purpose — `actix-ws`, `rmp-serde`, `notify`, `once_cell`, `lazy_static`, `regex`, oxc crates (oxc stack is only used by the `/project/*` route the new frontend won't call).

**Done when:** `cargo check` passes; helper tests pass via `cargo test`.

## Phase 1 — Frontend decomposition (static refactor, no behavior change)

Per spec §13 this precedes wiring the frontend to anything.

- [ ] Rename `web/main.html` → `web/index.html` (update `GET /` handler and the `find_preferred_index` candidate order accordingly).
- [ ] Extract inline `<style>` into:
  - `web/styles/base.css` — `:root` design tokens, resets, typography.
  - `web/styles/layout.css` — `.app-container`, `.sidebar`, `.main-content`, `.header`, `.canvas`.
  - `web/styles/components.css` — buttons, inputs/selects, field items, nested containers, add-section, action bar.
- [ ] Move the sidebar-toggle script into `web/scripts/main.js` as an ES module; link with `<script type="module">`. No bundler.
- [ ] Preserve the sketch's visual appearance exactly (spec §13) — pure cut/paste of rules, no rewrites.

**Done when:** page looks identical served at `/`; zero inline styles/scripts left in HTML.

## Phase 2 — Config module (`src/config.rs`)

- [ ] Types mirroring spec §5:

```rust
struct AppConfig { config_version: u32, projects_dir: String, projects: Vec<ProjectConfig>,
                   /* preserve unknown keys */ }
struct ProjectConfig { id, name, repo, branch, content_dir }  // all String
```

  Use `#[serde(flatten)] extra: serde_json::Map<String, Value>` on both structs so unknown top-level and per-project keys survive round-trips (spec §10 "preserve valid properties that are not currently understood").
- [ ] `load()` — read `scm-config.json` from CWD, parse, validate, return typed struct; distinct errors: unreadable file vs malformed JSON vs failed validation.
- [ ] Validation rules (all enforced):
  - `config_version == 1` else explicit error.
  - `projects_dir`: relative, no `..` (use `paths.rs`).
  - Per project: `valid_project_id(id)`; unique ids; `name`, `repo`, `branch` non-empty; `content_dir` relative, no `..`.
- [ ] `save(&self)` — atomic write: temp file sibling → write+flush → rename over original (never leave malformed config on disk).
- [ ] Wire into `main.rs`: load at startup, fail fast with readable message if invalid; hold in shared state `Arc<RwLock<AppState>>` where `AppState { config: AppConfig, ... }` (plain struct — no actor).

**Done when:** server refuses to start on bad config with clear message; starts cleanly with current `scm-config.json`.

## Phase 3 — Git module (`src/git.rs`)

Thin wrapper over the **git CLI** via `tokio::process::Command` (CLI choice is required by spec §11's "Missing Git executable" error case). Every fn takes the checkout path; every call wrapped in `spawn_blocking`.

- [ ] Core plumbing: `run(dir, args) -> Result<Output>` capturing stdout/stderr; map spawn `NotFound` → "Git executable not found" error category.
- [ ] Read ops: `is_work_tree(dir)` (`git rev-parse --is-inside-work-tree`), `remote_url(dir)` (`git remote get-url origin`), `branch_exists(dir, branch)` (local ref, then `origin/<branch>` fallback), `status_porcelain(dir)` (`git status --porcelain=v1 -b`).
- [ ] Mutating ops: `clone(repo, dest_dir, branch)` (`git clone --branch <b> <repo> <dir>`), `stage(dir, pathspecs...)` (`git add -- <content_dir>` — stage content dir only, never whole repo, spec §11), `commit(dir, msg)`, `push(dir, branch)` (`git push origin <branch>`).
- [ ] Never implement destructive commands (reset/clean/checkout -- .) — spec §11 forbids auto-revert.
- [ ] Remote comparison helper: normalize URLs (trim trailing `/` and `.git`) before equality check (used by Phase 4).

**Done when:** each function compiles and behaves correctly against a throwaway local repo (`git init --bare /tmp/opencode/scm-test.git` + clone).

## Phase 4 — Project lifecycle (`src/setup.rs`, `src/project.rs`)

- [ ] `setup.rs` bootstrap in order (spec §6): load config → validate → resolve `projects_dir` against CWD (reject absolute) → create dir if absent → construct `AppState` → hand to HttpServer.
- [ ] `project.rs` functions (all blocking parts via `spawn_blocking`):
  - `ensure_checkout(state, id)`:
    - If dir missing → `git::clone(repo, projects_dir/id, branch)`.
    - If dir exists → verify (spec §6): is directory, is work tree, remote exists and matches configured `repo` (normalized compare), configured branch usable (local or on origin). Any mismatch → hard error naming the mismatch; **never** silently reuse, **never** delete.
  - `checkout_status(state, id) -> CheckoutStatus { exists, is_git, remote_matches, branch_ready }` for UI display.
  - Removal support: `remove_from_config(state, id)` mutates config + saves — no filesystem touch (spec §6).
- [ ] Clone happens lazily on first selection/access, not eagerly at startup (spec §6).

**Done when:** with empty `projects/`, triggering ensure_checkout clones into `projects/wss-index`; pointing config at a dir with a different remote yields a clear 409-style error and leaves files untouched.

## Phase 5 — Content module (`src/content.rs`)

- [ ] `list_files(checkout, content_dir) -> Vec<ContentFile>` (spec §8):
  - Resolve `checkout.join(content_dir)` through `safe_join` (traversal-proof).
  - Scan **direct children only**, keep regular files ending `.json`; ignore dirs, symlinks-to-dirs, nested paths. Use symlink-aware metadata so a symlink doesn't masquerade as a regular file.
- [ ] `load_file(...) -> String` — read full raw text (frontend renders/parses it; don't pretty-print or reorder keys server-side).
- [ ] `save_file(..., body)` — sequence per spec §9: validate filename (`paths.rs`) → `safe_join` → parse body with `serde_json::Value` (any root type allowed: object/array/string/number/bool/null) → refuse with `invalid-json` error if parse fails → atomic write (temp + rename) back to same file.
- [ ] `create_file(..., name, initial_json)` — same validation, default `{}`; backs the "offer to create" flows for missing dir / empty dir (spec §8).
- [ ] `ensure_content_dir(checkout, content_dir)` — create dir if missing (still traversal-checked).

**Done when:** round-trip save/load preserves arbitrary JSON byte-for-byte semantics; saving `{invalid` returns 400 with category `invalid-json`; `name=../../etc/passwd` style requests are rejected before any I/O.

## Phase 6 — HTTP API (`src/http/api.rs` + routes registration)

All endpoints under `/api/*`, JSON in/out, errors shaped as `{ "error": { "category": "...", "message": "...", "detail": "..." } }`. Handlers stay thin: extract → validate → call module fns → serialize.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/config` | current config (as stored) |
| PUT | `/api/config` | validate full document → atomic save → update in-memory state (spec §10 steps 1–5) |
| GET | `/api/projects` | configured projects + live `checkout_status` each |
| POST | `/api/projects` | import: validate fields → generate slug id if absent → append → atomic save → optional immediate clone (spec §14 empty-state/import modal) |
| DELETE | `/api/projects/{id}` | remove from config only; disk untouched |
| POST | `/api/projects/{id}/checkout` | `ensure_checkout` (clone-or-verify) |
| GET | `/api/projects/{id}/content` | list `.json` entries |
| POST | `/api/projects/{id}/content` | create file `{ name, initial? }` |
| GET | `/api/projects/{id}/content/{name}` | load one file |
| PUT | `/api/projects/{id}/content/{name}` | validate + save |
| POST | `/api/projects/{id}/ensure-content-dir` | create missing content dir |
| GET | `/api/projects/{id}/git/status` | parsed porcelain status (branch + changed files) |
| POST | `/api/projects/{id}/publish` | stage content dir → commit → push |

- [ ] Publish handler returns a discriminated result covering every case in spec §11: `no_changes`, `committed_and_pushed`, `commit_failed(msg)`, `push_failed(msg)`, `auth_failed`, `remote_rejected` (non-fast-forward), `merge_conflict`, `git_missing`, `invalid_repo`. Commit message supplied by client with backend default `"Update content"`.
- [ ] Config PUT implementation detail: operate on `serde_json::Map` — take known fields, validate them, merge untouched unknown keys back, write atomically (this is what makes preservation trivially correct).
- [ ] Decide fate of legacy `/project/{path}` transpile route: new frontend won't use it. Propose removal (plus oxc deps) in cleanup phase — needs owner approval since it deletes existing behavior.
- [ ] Register handlers in `routes.rs`; static routes unchanged (`/`, `/web/*`).

**Done when:** every endpoint answers correctly via curl smoke tests, including failure shapes (bad JSON body → 400 `invalid-json`; unknown id → 404; publish on clean repo → `no_changes`).

## Phase 7 — Frontend state + API wiring

- [ ] `web/scripts/api.js` — fetch wrappers for every endpoint above; unwraps the standard error shape into typed rejections.
- [ ] `web/scripts/state.js` — tiny pub/sub store; selected project persisted in `localStorage` key `scm:selected-project-id`; selection rules exactly per spec §7: empty projects → import modal; stored id gone → first project; id-based so renaming a project never breaks selection.
- [ ] Custom elements (light DOM, no Shadow DOM): `<project-selector>`, `<import-project-modal>`, `<project-info>`, `<content-list>`, `<json-editor>`, `<git-status-panel>`, `<publish-button>`, `<config-editor>`, plus a shared error/toast element rendering the error category.
- [ ] Replace the sketch's hardcoded example markup with dynamic rendering driven by state + api; visuals stay identical.
- [ ] JSON editor v1 (spec §9): plain textarea (mono font) loading the complete file; client-side `JSON.parse` pre-check disables Save on syntax error; server-side validation remains authoritative; Save shows returned category errors; success reloads content list.

**Done when:** full manual flow works against the running server: select project (auto-clones) → see `.json` list → open/edit/save file → refresh shows saved data.

## Phase 8 — Publishing UX + config editor

- [ ] `<git-status-panel>`: branch name + changed-file list from `GET /git/status`; refresh after save and after publish.
- [ ] `<publish-button>`: confirm dialog → `POST /publish` → render outcome distinctly per §11 case (no changes / pushed / commit failed / push failed / auth / conflict...). On failure: show error, keep local content intact, offer retry — never revert (spec §11).
- [ ] `<import-project-modal>`: form fields name / repo URL / branch / content dir (+ optional id); calls `POST /api/projects`; shows clone progress/result.
- [ ] `<config-editor>` v1 (spec §10 "basic level"): loads raw pretty-printed `GET /api/config` into a textarea; Validate button runs client parse; Save sends whole doc to `PUT /api/config` and surfaces validation errors verbatim.
- [ ] Empty states per spec §14: no projects → import modal; content dir missing → offer create; dir exists but zero `.json` → offer create file.

**Done when:** all nine panel areas from spec §14 exist and are reachable in the UI.

## Phase 9 — Cleanup + end-to-end verification

- [ ] Remove dead code/deps pending owner decision from Phase 0/6 (legacy `/project/*` route, oxc stack, unused crates); re-run `cargo check`.
- [ ] Security pass: attempt `..`/absolute/separator injection against every path-taking endpoint (config fields, project id, content name) — all must be rejected pre-I/O; confirm no endpoint can escape `projects/<id>/<content_dir>`; confirm config/content writes are atomic (no partial file observable).
- [ ] End-to-end walkthrough using a disposable target repo (local bare repo via `file://` remote, or a throwaway private GitHub repo — do NOT point at the real site during testing). Walk all 12 success criteria from spec §17 and tick them off:
  1. `cargo run` starts SCM
  2. control panel loads from `web/`
  3. import target repo
  4. auto-clone into `projects/<id>`
  5. select project
  6. direct `.json` files listed
  7. edit `posts.json`
  8. valid JSON saves
  9. invalid JSON → error, not saved
  10. git status visible
  11. commit + push succeeds
  12. target site still builds/serves as plain static site
- [ ] Final constraint sweep: grep for actor traits/messages (must be none), confirm every blocking call sits inside `spawn_blocking`, confirm frontend has zero framework/bundler traces and no automatic Shadow DOM.

---

## Explicitly out of scope (do not build, spec §16)

Schemas/schema-driven forms, rich text/markdown, recursive discovery, media/images, auth/multi-user, FTP/SFTP/deploy plugins, hosted deployment, npm automation, production packaging.
