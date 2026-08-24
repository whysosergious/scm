# AGENTS.md

## What this is

SCM ("Static Content Manager"): a local Actix Web + Tokio server for managing JSON content of static websites via Git. `spec.md` is the authoritative product spec — read it before adding features. The crate is still named `wss_serve` in `Cargo.toml` (legacy); don't rename it unprompted. `README.md` is empty.

Current state: only the HTTP skeleton exists (`src/main.rs`, `src/http/routes.rs`). The modules sketched in spec.md §4 (`config.rs`, `project.rs`, `content.rs`, `git.rs`) do not exist yet; no code reads `scm-config.json` yet.

## Commands

- Copy `.env.template` to `.env` before running (sets `HOST=127.0.0.1`, `PORT=8080`).
- `cargo run` from the repo root. Paths are resolved relative to CWD: dotenv loads `./.env`, and the server reads `./web/` and `./project/` — running from another directory breaks routing silently.
- Verification is `cargo check` (fast) or `cargo build`. No tests, clippy/format config, pre-commit hooks, or CI exist.

## Routes and runtime behavior

- `GET /` serves `web/main.html`; `GET /web/*` serves static files from `web/`.
- `GET /project/{path}` serves files under `./project/` — note singular, distinct from `projects_dir: "projects"` in `scm-config.json`.
- Under `/project/`, `.ts`/`.tsx`/`.jsx` files are transpiled to JS on every request with the embedded oxc crates (parse → semantic → transform → codegen). Parse/semantic/transform errors are only printed to stderr — broken source still returns 200 with whatever was emitted. No watcher/build step despite `notify` being a dependency.
- `main.rs` force-sets `RUST_LOG=info` after `dotenv()`, overriding anything set in `.env`.

## Hard constraints from spec.md

- Never introduce actix actors (actor traits/messages/mailboxes). App state = ordinary structs, Tokio tasks, async fns.
- Blocking filesystem/Git work must go through Tokio blocking facilities, not stall the runtime.
- Frontend (`web/`): standard HTML/CSS, vanilla JS ES modules, custom elements where useful. No framework, no bundler, no npm. No automatic Shadow DOM — render into the document DOM unless real encapsulation is required.
- v1 scope limits: no DB, no content schemas or fixed post model, no auth, content discovery scans only direct children of `content_dir` (no recursion), publishing is the git flow (stage content dir → commit → push configured branch).
- Path safety applies to all new code: reject absolute paths where relative is expected, reject `..` traversal and path separators in project IDs, write config atomically (temp file → replace), never auto-revert/delete local content when a Git operation fails.

## Repo quirks

- `.gitignore` ignores `*.lock`, so `Cargo.lock` is untracked — don't commit it.
- `projects/` holds independent clones of target website repos (separate Git repositories nested inside this tree). They must never be committed to this repo; removing a project from config must not delete its checkout.
