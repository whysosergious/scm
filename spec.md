# SCM Specification

## 1. Overview

SCM means **Static Content Manager**.

SCM is a local-first application for managing content for static websites. It is intended for developer blogs, regular blogs, portfolios, restaurant websites, and other sites that can be hosted by GitHub Pages or another static hosting provider.

The first version stores content as JSON files inside a target website repository. The user edits those files through a local web control panel. SCM then commits and pushes changes using Git.

The target website remains self-contained and independently deployable. SCM is only the local management tool.

## 2. Initial scope

The first version must support:

- Multiple configured website projects.
- A local checkout for each configured project.
- Project selection in the control panel.
- JSON content discovery.
- Editing arbitrary valid JSON.
- JSON syntax validation before saving.
- Git-based publishing.
- A static control-panel frontend.
- Configuration editing through the control panel at a basic level.

The first version must not require:

- A database.
- A production web server.
- A hosted CMS backend.
- Content schemas.
- A fixed post or project data model.
- Nested content directories.
- FTP or SFTP publishing.
- A rich-text editor.
- A build system for the target website.
- Shadow DOM for every frontend component.

## 3. Technology stack

### Backend

The backend must use:

- Rust.
- The current stable Rust toolchain where practical.
- Tokio for asynchronous runtime functionality.
- Actix Web as the HTTP framework.

The implementation must use the modern Actix Web and Tokio integration and must not use Actix actors as the application architecture. Actix Web is used for HTTP routing, request handling, middleware, and server operation; application state and services should use ordinary Rust structures, Tokio tasks, synchronization primitives, and asynchronous functions where appropriate.

Do not introduce `actix` actor traits, actor messages, actor mailboxes, or an actor-based application design unless a narrowly scoped dependency explicitly requires them.

### Frontend

The frontend must use:

- Standard HTML.
- Standard CSS.
- Vanilla JavaScript.
- JavaScript modules.
- Web Components through custom elements where useful.

Components should normally render into the regular document DOM. Shadow DOM must not be used automatically for every component. It should only be used when real DOM or style encapsulation is necessary.

The initial frontend may use a simple static structure and example data. It must later be connected to the Rust API without requiring a framework migration.

## 4. Repository structure

The SCM repository should have this general structure:

```text
scm/
├── Cargo.toml
├── scm-config.json
├── scm-config.example.json
├── .gitignore
├── src/
│   ├── main.rs
│   ├── config.rs
│   ├── setup.rs
│   ├── project.rs
│   ├── content.rs
│   ├── git.rs
│   └── http/
│       ├── mod.rs
│       └── routes.rs
├── web/
│   ├── index.html
│   ├── styles/
│   └── scripts/
└── projects/
```

`web/` contains the SCM control panel.

`projects/` contains local checkouts of configured target websites. It must be ignored by the SCM repository because each directory inside it is an independent Git repository.

The target website repositories must not be embedded as source code inside the SCM repository. They are managed working copies.

## 5. Configuration

The initial configuration file is `scm-config.json` at the SCM repository root.

Initial configuration format:

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

### Configuration fields

#### `config_version`

An integer identifying the configuration format version.

The first supported value is `1`.

#### `projects_dir`

A path to the directory containing local project checkouts.

The path is relative to the SCM application working directory. Absolute paths are not required in version one and should be rejected unless explicitly supported later.

#### `projects`

An array of configured target website projects.

#### Project `id`

A stable unique identifier for the project.

The ID is used for:

- Project selection.
- Local checkout directory naming.
- Internal references.
- Future API routes.

The ID must be safe for use as a directory name. It must not contain path separators, `..`, or other path traversal sequences.

#### Project `name`

A human-readable display name shown in the control panel.

The name may be changed without changing the local checkout directory.

#### Project `repo`

The Git repository URL used to clone the project.

The implementation should not assume that all repositories use HTTPS. SSH repository URLs may be supported by Git automatically, depending on the user’s local Git configuration.

#### Project `branch`

The Git branch SCM operates on for the target project.

The first version should require this value instead of assuming a branch name.

#### Project `content_dir`

A directory path relative to the root of the target repository.

For the example configuration, the effective path is:

```text
projects/wss-index/content/
```

The value must be relative and must not escape the target repository through path traversal.

## 6. Project lifecycle

At startup, SCM must:

1. Load `scm-config.json`.
2. Parse and validate the configuration.
3. Resolve the projects directory.
4. Make the configured project information available to the control panel.
5. Start the local HTTP server.

A project checkout should be initialized when required, preferably when the project is first selected or accessed.

For a project whose checkout does not exist:

```text
clone project.repo into projects_dir/project.id
```

For a project whose checkout already exists, SCM must verify that:

- The path is a directory.
- It is a Git working tree.
- A Git remote exists.
- The configured repository corresponds to the checkout’s remote.
- The configured branch can be used.

SCM must not silently reuse an existing directory with a different remote.

SCM must not automatically delete an existing checkout when a project is removed from the configuration.

Removing a project from `scm-config.json` and deleting its local files are separate operations.

## 7. Project selection state

The selected project is UI state and must not be stored in `scm-config.json`.

The control panel should store the selected project ID in browser `localStorage`.

Selection behavior:

```text
If projects is empty:
    display an import-project modal or equivalent empty state.

If projects is not empty:
    restore the selected project ID from localStorage.

If the stored project ID no longer exists:
    select the first project in the projects array.
```

Changing the display name must not invalidate the stored selection because selection uses the stable project ID.

## 8. Content discovery

SCM must discover content dynamically rather than using hardcoded content filenames.

For the selected project, SCM resolves:

```text
project checkout + content_dir
```

It then scans only the direct child entries of that directory.

A file is treated as a content entry when:

- It is a regular file.
- Its filename has the `.json` extension.
- It is directly inside `content_dir`.

Nested directories are ignored in version one.

Example:

```text
content/
├── posts.json          discovered
├── projects.json       discovered
├── pages.json          discovered
└── articles/
    └── archive.json    ignored in version one
```

If the configured content directory does not exist, SCM may offer to create it.

If the directory exists but contains no JSON files, the control panel should offer to create a JSON content file.

`posts.json` is the first expected content file for the initial website, but it is not hardcoded as the only supported file.

The initial implementation must allow any valid JSON root value, including:

- Object.
- Array.
- String.
- Number.
- Boolean.
- Null.

SCM must not assume that every content file contains a particular field structure.

## 9. JSON editing

The first editor is a basic JSON file editor.

It must:

- Load the complete selected JSON file.
- Display its contents for editing.
- Validate JSON syntax before saving.
- Refuse to save malformed JSON.
- Preserve fields and structures that SCM does not interpret.
- Write the complete updated JSON document back to the same file.

Version one does not define content schemas or fixed form fields.

There must be no automatic conversion of `posts.json` into a predefined post model.

Future versions may provide a dynamic visual editor with draggable fields and user-defined structures. That is outside the initial implementation.

## 10. Configuration editing

The control panel will eventually be able to edit the complete `scm-config.json` document.

The initial control panel may provide a simple static configuration editor, but all configuration changes must be validated before being written.

A configuration save must:

1. Parse the proposed JSON.
2. Validate the required configuration structure.
3. Validate project IDs and paths.
4. Validate that project IDs are unique.
5. Write the replacement safely.

SCM must not replace the active configuration with malformed JSON.

Configuration writes should be atomic: write a temporary file, flush/close it successfully, then replace the original configuration file.

Unknown future configuration properties should not be destroyed when the configuration is edited. The editor should preserve valid properties that are not currently understood.

## 11. Git publishing

Git is the first publishing mechanism.

The target project is a local Git checkout. SCM writes content files into that checkout and uses Git to publish changes.

The initial publishing flow is:

```text
Edit JSON content
    → validate JSON
    → save JSON locally
    → inspect Git status
    → stage relevant content changes
    → create a commit
    → push the configured branch
```

SCM should stage the configured content directory or explicit changed content files rather than blindly staging the entire target repository.

The first version should provide clear results for:

- No changes to publish.
- Successful commit and push.
- Commit failure.
- Push failure.
- Authentication failure.
- Remote changes that prevent pushing.
- Merge conflicts.
- Missing Git executable.
- Invalid target repository.

Local content must not be deleted or reverted automatically when a Git operation fails.

SCM must not store GitHub tokens or FTP credentials in the public target website.

Future versions may support FTP, SFTP, or other publishing providers through a configurable publishing abstraction. These providers are outside version one.

## 12. HTTP server

The Rust application must start a local HTTP server that serves:

- The control-panel frontend from `web/`.
- API routes for configuration, projects, content discovery, content loading, content saving, and Git operations as those features are implemented.

The server is a local development/control-panel server. It is not intended to be deployed as the public website backend.

The public target websites must remain static and self-contained.

Blocking filesystem or Git operations must not block the asynchronous runtime unnecessarily. Where required, use appropriate Tokio facilities such as blocking tasks or a dedicated controlled task boundary.

## 13. Frontend structure

The control panel begins as a single HTML sketch supplied by the project owner.

Before implementing the rest of the system, the frontend task is to dissect the sketch into:

- Shared stylesheet files.
- Layout sections.
- Reusable example components.
- JavaScript modules.
- Initial application state.

The visual appearance and interaction intent of the sketch should be preserved during decomposition.

A possible structure is:

```text
web/
├── index.html
├── styles/
│   ├── base.css
│   ├── layout.css
│   └── components.css
└── scripts/
    ├── main.js
    ├── state.js
    ├── api.js
    ├── components/
    └── views/
```

This structure is illustrative and may be adjusted based on the actual sketch.

The frontend should avoid introducing a framework or bundler unless a later requirement justifies it.

## 14. Initial control-panel areas

The static control panel should provide or represent these areas:

- Project selector.
- Empty-project state with an import-project action.
- Project information.
- Content-file list.
- JSON editor area.
- Save action.
- Git status area.
- Publish action.
- Configuration editor area.

These may initially use mock data and placeholder actions while the backend API is being developed.

## 15. Error and safety requirements

SCM must validate all paths derived from configuration or user input.

It must reject:

- Absolute paths where only relative paths are expected.
- `..` path traversal.
- Project IDs containing path separators.
- Duplicate project IDs.
- Content paths outside the target repository.
- Existing target directories that are not valid expected checkouts.

SCM should produce user-readable errors while retaining useful technical details for logs.

Errors should distinguish between:

- Invalid configuration.
- Invalid JSON content.
- Missing files or directories.
- Git failures.
- Filesystem failures.
- Network or remote failures.

## 16. Out of scope for version one

The following are intentionally postponed:

- Content schemas.
- Dynamic schema-driven forms.
- Draggable form-field design.
- Rich-text editing.
- Markdown conversion requirements.
- Recursive content discovery.
- Media management.
- Image upload processing.
- User authentication.
- Multi-user access.
- Remote/hosted SCM operation.
- FTP publishing.
- SFTP publishing.
- Deployment-provider plugins.
- Automatic npm or other package-manager installation.
- Automatic target-site builds.
- Production packaging.
- Public API authentication.

## 17. Initial success criteria

The first version is successful when a user can:

1. Start SCM with `cargo run`.
2. Load the local control panel from `web/`.
3. Import or configure a target website repository.
4. Have the repository cloned into the configured projects directory when needed.
5. Select the target project.
6. See direct `.json` files in its configured content directory.
7. Open and edit `posts.json`.
8. Save valid JSON.
9. Receive an error instead of saving invalid JSON.
10. View the target project’s Git status.
11. Commit and push the content change.
12. Keep the target website independently hostable as a static website.
