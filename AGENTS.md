# AGENTS.md

## What this is

SCM ("Static Content Manager"): a local Actix Web + Tokio server for managing JSON content of static websites via Git. `spec.md` is the authoritative product spec — read it before adding features. The crate is still named `wss_serve` in `Cargo.toml` (legacy); don't rename it unprompted. `README.md` is empty.

Current state: v1 backend and frontend are implemented per `TODO.md` (all phases). Backend modules: `error.rs` (`ScmError`, category + status → JSON error shape), `paths.rs` (path-safety helpers, unit-tested), `config.rs` (load/validate/atomic-save `scm-config.json`, unknown keys preserved via `#[serde(flatten)]`), `git.rs` (git CLI wrapper over `tokio::process`), `project.rs` (clone-on-demand checkout lifecycle + verification), `content.rs` (direct-children `.json` discovery/load/save), `setup.rs` (`AppState`: `Arc<RwLock<AppConfig>>` — no actors). API lives in `src/http/api.rs`; frontend is decomposed under `web/{styles,scripts}` with `scripts/main.js` booting a small pub/sub store (`state.js`) + fetch layer (`api.js`). The file editor (`components/json-editor.js`) is tabbed **Form | JSON** per `spec.md` §9: `json-model.js` is an order-preserving tree model (own JSON parser — `JSON.parse` reorders integer-like keys; serialization emits from the tree for the same reason), `components/form-editor.js` renders recursive property forms (title-inputs, type dropdown, resizable textarea for strings, toggle/number value inputs, index badges for array entries, per-row clone/collapse/delete cluster on the right, "(n items)" counts), `components/dnd.js` does cross-parent pointer drag & drop with FLIP animations and a cycle guard. The legacy `/project/*` oxc-transpile route and its deps were removed (owner-approved).

## Commands

- Copy `.env.template` to `.env` before running (sets `HOST=127.0.0.1`, `PORT=8080`).
- `cargo run` from the repo root. Paths are resolved relative to CWD: dotenv loads `./.env`, the server reads `./web/`, `./scm-config.json` and `projects_dir` from it — running from another directory breaks routing silently.
- Verification: `cargo check` (fast), `cargo build`, and `cargo test` (unit tests in `paths.rs`, `config.rs`, `git.rs`, `http/api.rs`; git tests drive throwaway bare repos in `/tmp`).

## Routes and runtime behavior

- `GET /` serves `web/index.html`; `GET /web/*` serves static files from `web/`.
- JSON API under `/api`: config get/put; projects list/import/delete; `{id}/checkout`, `{id}/ensure-content-dir`, `{id}/content` (+`/{name}` get/put), `{id}/git/status`, `{id}/publish`. Errors use `{"error":{category,message,detail}}`; publish returns HTTP 200 with a discriminated `outcome` field covering spec §11 cases.
- Publishing stages only the configured content dir; local content is never reverted on failure.
- `main.rs` force-sets `RUST_LOG=info` after `dotenv()`, overriding anything set in `.env`.

## Hard constraints from spec.md

- Never introduce actix actors (actor traits/messages/mailboxes). App state = ordinary structs, Tokio tasks, async fns.
- Blocking filesystem/Git work must go through Tokio blocking facilities, not stall the runtime.
- Frontend (`web/`): standard HTML/CSS, vanilla JS ES modules, custom elements where useful. No framework, no bundler, no npm. No automatic Shadow DOM — render into the document DOM unless real encapsulation is required.
- v1 scope limits: no DB, no content schemas or fixed post model, no auth, content discovery scans only direct children of `content_dir` (no recursion), publishing is the git flow (stage content dir → commit → push configured branch).
- Path safety applies to all new code: reject absolute paths where relative is expected, reject `..` traversal and path separators in project IDs, write config atomically (temp file → replace), never auto-revert/delete local content when a Git operation fails.

## Repo quirks

- `.gitignore` ignores `*.lock`, so `Cargo.lock` is untracked — don't commit it.
- Rich text editor: source + npm project in `editor-src/` (ProseMirror incl. prosemirror-markdown, vite). Build once with `cd editor-src && npm install && npm run build`; output `web/scripts/vendor/rich-editor.bundle.js` is committed and lazy-imported at runtime — never run npm/vite to launch the frontend. String values autodetect their format (HTML vs Markdown vs plain) and the rich editor round-trips whichever format it detected; mode state is keyed by property path, not node id.
- `serde_json` is built with `preserve_order` (IndexMap): without it, every content/config save silently alphabetized JSON keys and destroyed document order. Don't remove the feature.
- API responses send `Cache-Control: no-store` (main.rs wrap_fn) — the panel must always reflect disk; browsers otherwise heuristically cache `GET /api/...` and show stale files after edits.
- `projects/` holds independent clones of target website repos (separate Git repositories nested inside this tree). They must never be committed to this repo; removing a project from config must not delete its checkout.
