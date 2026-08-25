# SCM Page Editor Specification

## 1. Purpose

SCM must provide a basic visual page editor for static websites.

The editor allows users to build pages from reusable components, arrange components through drag and drop, nest components, edit content and CSS properties, and generate static HTML files for deployment.

Generated pages must be usable without the SCM application running. The primary page structure, text, and images must be present in generated HTML rather than being created only at runtime by JavaScript.

The first version supports three component types:

- Box/container.
- Text.
- Image.

The first version is intentionally simple and does not provide schemas, rich text, arbitrary HTML, or a complete responsive design system.

## 2. Existing SCM integration

The page editor is part of the existing SCM application.

Existing functionality includes:

- Rust backend.
- Tokio runtime.
- Modern Actix Web HTTP server.
- Local control panel under `web/`.
- Multiple selectable target website projects.
- `scm-config.json`.
- Local project checkouts under the configured projects directory.
- A JSON editor.
- A media manager.
- A configured `media_dir` property.

The editor operates on the currently selected project.

The selected project provides:

- The local target repository.
- The configured content directory.
- The configured media directory.
- The pages directory.
- The location where generated static HTML is written.

The page editor must use the existing project and path resolution systems. It must not create a second incompatible configuration system.

## 3. Initial scope

The first version must support:

- A selectable list of pages.
- A non-deletable index page.
- Creating additional pages.
- Editing a page as a structured JSON document.
- A visual canvas for the page tree.
- Adding Box, Text, and Image components.
- Dragging and dropping components.
- Reordering sibling components.
- Nesting components inside containers.
- Selecting components.
- Editing component properties.
- Editing a limited set of CSS properties.
- Assigning reusable CSS classes.
- Saving page JSON.
- Generating static HTML from page JSON.
- Previewing generated output.
- Importing existing supported HTML into a page JSON document.

## 4. Out of scope

The following are not part of the initial version:

- Content schemas.
- Schema-driven forms.
- Rich-text editing.
- Raw HTML components.
- Arbitrary JavaScript components.
- Full responsive breakpoint editing.
- Animation and transition editing.
- Forms.
- Navigation builders.
- SEO scoring.
- Accessibility scoring.
- Collaboration.
- Authentication.
- Remote editing.
- FTP/SFTP publishing.
- Framework-specific output.
- Automatic target-site builds.
- Perfect byte-for-byte HTML round-tripping.
- Recursive page discovery.

## 5. Technology stack

### Backend

Use:

- Rust.
- The stable Rust toolchain where practical.
- Tokio for asynchronous runtime functionality.
- Modern Actix Web integration.
- Ordinary async functions, application state, and Tokio tasks.

Actix Web is used as the HTTP framework. Tokio is used as the asynchronous runtime and task system.

The application must not use Actix actors as its application architecture. Do not introduce actor traits, actor messages, actor mailboxes, or actor-based application state unless a narrowly scoped dependency explicitly requires them.

Blocking filesystem, parsing, and generation work must not unnecessarily block Actix/Tokio worker threads. Use an appropriate controlled blocking-task boundary when required.

### Frontend

Use:

- HTML.
- CSS.
- Vanilla JavaScript.
- Native ES modules.
- Native Web Components where useful.

Do not introduce:

- React.
- Vue.
- Svelte.
- Angular.
- TypeScript.
- JSX.
- A frontend framework.
- A CSS framework.
- A bundler unless explicitly required later.

Use the regular document DOM. Do not use Shadow DOM for every component. Use Shadow DOM only when there is a specific need for DOM or style encapsulation.

## 6. Project and page storage

The selected target project contains generic content, media, page source documents, and generated output.

Recommended structure:

```text
project/
├── content/
│   └── posts.json
├── pages/
│   ├── index.json
│   └── contact.json
├── media/
└── ...
```

The actual generic content directory and media directory must come from the selected project configuration.

The pages directory is initially `pages/` relative to the target project repository root. If page-directory configuration is added later, it must be introduced deliberately and documented separately.

Page JSON files are source documents.

Generated HTML files are deployment output:

```text
pages/index.json   →   index.html
pages/contact.json →   pages/contact.html
```

The generated HTML must be written into the target project repository because it is the static site output served by GitHub Pages or another static host.

The JSON page document is the source of truth. Generated HTML must not be treated as the editable source document.

## 7. Page discovery and selection

The control panel must provide a Pages list separate from the generic Content list.

The Pages list must scan only direct child `.json` files in the project’s pages directory.

Nested directories are ignored in version one.

Example:

```text
pages/
├── index.json          discovered
├── contact.json        discovered
├── about.json          discovered
└── nested/
    └── ignored.json    ignored in version one
```

The Pages list may display the generated HTML filename while internally referring to the JSON source filename.

Page selection must support:

- Selecting an existing page.
- Opening the index page by default when no page is selected.
- Creating a new page.
- Importing an existing HTML page.
- Deleting non-index pages.

The page selection state may be stored in browser `localStorage`, separately from `scm-config.json`.

## 8. Index page rules

`index.json` is the special page source document.

It maps to the target repository root:

```text
pages/index.json → index.html
```

The index page:

- Must be available in the Pages list.
- Must be created if it does not exist and the user chooses to initialize it.
- Must not be deletable through the control panel.
- Must not generate `pages/index.html`.

Every other direct JSON file maps to a same-named HTML file inside the target repository’s `pages/` directory:

```text
pages/contact.json → pages/contact.html
pages/about.json   → pages/about.html
```

The source filename determines the generated output filename in version one. The page document’s `slug` must not override the filename mapping.

## 9. Page document model

Pages must be stored as structured JSON trees rather than arbitrary HTML strings.

Initial page structure:

```json
{
  "version": 1,
  "title": "Home",
  "meta": {
    "description": "",
    "og_image": ""
  },
  "classes": [],
  "root": {
    "id": "root",
    "type": "box",
    "props": {
      "element": "main"
    },
    "styles": {},
    "classes": [],
    "children": []
  }
}
```

A page node contains:

- `id`.
- `type`.
- `props`.
- `styles`.
- `classes`.
- `children`.

The page root is a node or root container that owns the page tree.

Each node ID must be unique within the page document.

The page document must be serializable to JSON and validated before saving.

Unknown future properties should not be discarded when the page is loaded and saved, where preservation is practical. The initial editor must not silently destroy data it does not understand.

## 10. Component model

### Box/container

Purpose:

- Group child components.
- Provide a layout and styling boundary.
- Support nesting.

Properties:

- Semantic HTML element.
- Optional ID.
- Optional class list.
- Styles.
- Children.

Initial semantic element options:

- `div`.
- `section`.
- `header`.
- `main`.
- `footer`.
- `article`.
- `aside`.

The default element is `div`.

A Box may contain Box, Text (with element `span`), and Image children.

A Box may **not** contain Text nodes whose element is `p`, `h1`, `h2`, `h3`, or `blockquote` — these are block-level elements that must not appear as direct children of another block container in valid HTML. Use a Box with `section`/`div` to wrap them, or change the Text element to `span`.

### Text

Purpose:

- Display textual content.

Properties:

- Text value.
- Semantic HTML element.
- Optional ID.
- Optional class list.
- Styles.

Initial semantic element options:

- `p`.
- `h1`.
- `h2`.
- `h3`.
- `span`.
- `blockquote`.

Text must be escaped during HTML generation.

The initial version must not support arbitrary raw HTML inside a Text component.

### Image

Purpose:

- Display an image from the selected project's media directory or another approved website-relative source.

Properties:

- `src`.
- `alt`.
- Optional `title`.
- Optional width.
- Optional height.
- Optional loading mode.
- Optional link target if explicitly supported.
- Optional ID.
- Optional class list.
- Styles.

`alt` is required.

The editor should allow the user to select an image through the existing media manager.

The stored source must be a website-relative path, not an absolute local filesystem path.

Example:

```json
{
  "src": "./media/logo.png",
  "alt": "Company logo"
}
```

Generated HTML must not expose local filesystem paths.

### Nesting rules

The editor enforces valid HTML nesting through a parent→child compatibility matrix. Drop targets that violate the matrix are rejected with a visual indicator.

#### Parent element categories

| Parent element | Category | Allowed children |
|---|---|---|
| `div`, `section`, `header`, `main`, `footer`, `article`, `aside` | Flow container | Box, Text (element=`span`), Image |
| `p`, `h1`, `h2`, `h3`, `blockquote` | Phrasing container | Text (element=`span`) only |
| `span` | Phrasing inline | Text (element=`span`) only |

#### Rules

1. **Box (flow container) parents** accept Box, Text with `span`, and Image children.
2. **Text with `p`/`h1`/`h2`/`h3`/`blockquote`** parents accept only Text with `span` as children. They cannot contain Box, Image, or other block-level Text elements.
3. **Text with `span`** parents accept only Text with `span` as children.
4. **Image** nodes accept no children (self-closing element).
5. A node may never be dropped inside itself or one of its descendants (cycle guard).
6. The **root** node is always a Box and is not itself draggable or deletable.

#### Drop indicator

During a drag operation:

- Valid drop targets highlight with a visible border or background.
- Invalid drop targets (where the child element would be invalid) show no highlight or a rejection indicator (dimmed / no-entry cursor).
- The drop placeholder only appears at valid positions.

This ensures the user always sees exactly where a component can land before releasing the mouse.

#### Element reassignment on reparent

When a node is moved into a new parent, its element may need to change to remain valid:

- A Text node with element `p` dropped into a Box (flow container) keeps `p` — this is valid HTML (`<div><p>...</p></div>`).
- A Text node with element `p` dropped into a `span` Text parent must change to `span` — `p` inside `span` is invalid.
- A Box node dropped into a Text parent with element `p` is always rejected — block elements inside phrasing content are invalid.

The editor does not silently reassign elements. If a move would produce invalid nesting, it is rejected entirely.

## 11. Visual editor

The initial editor should have three primary areas:

```text
┌─────────────────────────────────────────────┐
│ Toolbar                                     │
├──────────────┬────────────────┬─────────────┤
│ Components   │ Canvas         │ Inspector    │
│ palette      │                │              │
│              │                │              │
│ Box          │                │ selected     │
│ Text         │                │ component    │
│ Image        │                │ properties   │
└──────────────┴────────────────┴─────────────┘
```

### Toolbar

The toolbar should provide:

- Page selector or page name.
- Save page.
- Generate static HTML.
- Preview generated page.
- Unsaved-changes indicator.

Git publishing remains a separate SCM operation.

### Component palette

The palette lists Box, Text, and Image.

A component should be addable by:

- Dragging it onto the canvas.
- Using an add button.
- Using a keyboard-accessible control.

Drag and drop is the preferred initial interaction, but the editor must not depend exclusively on drag and drop.

### Canvas

The canvas must support:

- Selecting a component.
- Adding components.
- Reordering siblings.
- Moving a component into a valid parent.
- Nesting components per the rules in §10.
- Removing a component.
- Showing the selected component.
- Showing valid drop targets (highlighted borders/backgrounds).
- Showing invalid drop targets (dimmed, no-entry cursor).
- Showing an empty Box state ("Drop components here").
- Rendering Box, Text, and Image nodes as close to their generated output as practical.

The canvas is an editing representation. It should render nodes as close to their final HTML output as practical (Box as a labeled bordered container, Text as its element with content preview, Image as a thumbnail or placeholder), but it does not need to be a perfect browser preview in the initial version.

### Inspector

The inspector displays properties for the selected component.

It must update when selection changes.

The initial inspector supports:

- Component-specific properties.
- Basic CSS properties.
- Component ID.
- Assigned reusable classes.
- Delete action.

## 12. Drag and drop

The initial implementation may use the browser HTML Drag and Drop API.

Drag and drop must support:

- Dragging a component type from the palette.
- Dragging an existing node to reorder it.
- Dragging an existing node into a valid parent (respecting nesting rules from §10).
- Displaying a drop indicator at valid positions only.
- Rejecting invalid nesting per the parent→child compatibility matrix (§10).
- Preventing a node from being dropped inside itself or one of its descendants.
- Showing a rejection visual (dimmed, no-entry cursor) when hovering an invalid target.

The editor must also provide non-drag controls for adding components (keyboard-accessible add buttons).

The implementation should keep tree operations separate from pointer or drag event handling.

## 13. Styling model

Each node may have:

- Inline styles.
- Reusable class assignments.

The first version should expose a limited, explicit list of CSS properties rather than arbitrary CSS text.

Recommended initial property subset:

- `display`.
- `width`.
- `max-width`.
- `min-height`.
- `margin`.
- `padding`.
- `gap`.
- `color`.
- `background-color`.
- `font-size`.
- `font-weight`.
- `line-height`.
- `text-align`.
- `border`.
- `border-radius`.
- `box-shadow`.
- `flex-direction`.
- `justify-content`.
- `align-items`.
- `grid-template-columns`.

The property list should be implemented as a definition list so it can be extended later.

The initial version does not need to support a complete CSS parser.

Invalid or unsafe values must not produce broken generated output.

## 14. Reusable classes

The page document must be able to define reusable CSS classes:

```json
{
  "classes": [
    {
      "name": "hero-section",
      "label": "Hero section",
      "description": "Main hero layout",
      "styles": {
        "padding": "4rem",
        "background-color": "#111111"
      }
    }
  ]
}
```

A node may use one or more class names through its `classes` property.

The generated page must include CSS for classes used by the page.

Class styles must not be duplicated into every node’s inline styles merely because a class is assigned.

Initial class functionality:

- Create class.
- Rename class.
- Edit class styles.
- Assign class to a node.
- Remove class from a node.
- Delete unused class.

Class names must be validated before generation.

## 15. Responsive styles

The initial implementation supports base styles only.

Do not implement a complete breakpoint editor in version one.

Responsive styles may be added later through a structure such as:

```json
{
  "styles": {
    "base": {
      "padding": "1rem"
    },
    "tablet": {
      "padding": "2rem"
    },
    "desktop": {
      "padding": "4rem"
    }
  }
}
```

## 16. Static HTML generation

The generator converts a page JSON document into a complete static HTML file.

The generated document must contain:

- `<!doctype html>`.
- `html`.
- `head`.
- Character encoding metadata.
- Responsive viewport metadata.
- Page title.
- Meta description when provided.
- Generated CSS.
- `body`.
- Recursively rendered component HTML.

The generated page must contain the actual page content without requiring JavaScript to construct it.

The generator must:

- Recursively render the page tree.
- Escape text content.
- Escape HTML attributes.
- Generate valid element nesting.
- Generate node IDs where valid.
- Generate assigned classes.
- Generate supported inline styles.
- Generate reusable class CSS.
- Preserve selected semantic elements.
- Generate image `alt` attributes.
- Avoid local filesystem paths.

The generator must report or reject:

- Unknown component types.
- Missing required properties.
- Duplicate node IDs.
- Invalid class names.
- Unsafe image paths.
- Invalid page structure.
- Unsupported semantic elements.

## 17. Generated output mapping

The output path is determined by the source JSON filename.

```text
pages/index.json   →   project/index.html
pages/contact.json →   project/pages/contact.html
pages/about.json   →   project/pages/about.html
```

Only `index.json` receives special root-level output handling.

Generated non-index pages must be written under the target project’s `pages/` directory.

The generator must create the output directory when necessary.

Generated files should be treated as target-site files that may be staged and published through Git.

## 18. HTML import

SCM must support importing an existing HTML page and converting it into a page JSON document.

The importer must:

1. Read an HTML file.
2. Parse it into an HTML DOM tree.
3. Convert supported elements into SCM nodes.
4. Convert supported text into Text nodes.
5. Convert supported containers into Box nodes.
6. Convert `img` elements into Image nodes.
7. Preserve IDs and classes where possible.
8. Convert supported inline CSS properties where possible.
9. Save the resulting page document as JSON.
10. Produce an import report containing unsupported elements, attributes, and styles.

Use a standards-oriented HTML5 parser compatible with Rust. `html5ever` or an appropriate higher-level crate built on it may be used after checking compatibility with the existing dependency set. HTML5-oriented parsers can recover from malformed HTML rather than treating every parsing issue as a fatal error, so the importer must report recovery and unsupported-content limitations to the user. [web:183][web:186][web:189]

The importer does not need to provide perfect byte-for-byte round-tripping.

It must not silently discard unsupported content.

### Initial HTML mappings

- `div`, `section`, `main`, `header`, `footer`, `article`, `aside` → Box.
- `p`, `h1`, `h2`, `h3`, `span`, `blockquote` → Text.
- `img` → Image.
- Text nodes → Text content.
- `class` → assigned class information.
- `id` → node ID where valid.
- Supported declarations in `style` → node styles.

Initially report or reject unsupported elements such as:

- `script`.
- `video`.
- `audio`.
- `form`.
- `input`.
- `table`.
- `svg`.
- `iframe`.
- Unsupported custom elements.
- Arbitrary raw HTML.

### Mixed content rule

If a supported element contains only text, create a Text component.

If it contains nested supported elements, create a Box or appropriate container and recursively convert its children.

If it contains unsupported content, preserve what can be represented and include the unsupported content in the import report.

## 19. Media integration

The Image component must integrate with the existing media manager.

The editor should allow the user to:

- Browse available media.
- Select an existing image.
- Preview the image.
- Set or edit alternative text.
- Clear the selected image.

The source stored in the page JSON must be a target-site-relative path.

Absolute local filesystem paths must never be stored in page documents or generated HTML.

The path must respect the selected project’s configured `media_dir`.

## 20. Save and preview behavior

The editor must distinguish between:

```text
Save page document
Generate static HTML
Preview generated page
Publish through Git
```

Initial behavior:

- Save writes the page JSON source document.
- Generate creates or updates the mapped HTML output.
- Preview displays the generated static HTML.
- Publish remains a separate Git operation.

The UI must indicate unsaved changes.

Switching pages or projects with unsaved changes must warn the user or provide an explicit save/discard choice.

## 21. API responsibilities

The Rust backend exposes endpoints under `/api/projects/{id}/pages` for page CRUD, following existing API conventions (JSON responses, `{"error":{category,message,detail}}` error shape, `Cache-Control: no-store`).

### Page CRUD

| Method | Path | Purpose | Response |
|---|---|---|---|
| GET | `/api/projects/{id}/pages` | list page JSON files in `pages/` | `{ files: [{name}] }` |
| GET | `/api/projects/{id}/pages/{name}` | load page JSON (raw text) | raw JSON body |
| POST | `/api/projects/{id}/pages` | create new page (body: `{name, initial?}`) | `{ created, name }` |
| PUT | `/api/projects/{id}/pages/{name}` | save page JSON (body: raw JSON text) | `{ saved, name }` |
| DELETE | `/api/projects/{id}/pages/{name}` | delete non-index page | `{ deleted }` |

### Generation and import

| Method | Path | Purpose | Response |
|---|---|---|---|
| POST | `/api/projects/{id}/pages/{name}/generate` | generate static HTML from page JSON | `{ generated, output }` |
| POST | `/api/projects/{id}/pages/import` | import HTML into page JSON (body: `{html}`) | `{ page, warnings, saved_as }` |
| GET | `/api/projects/{id}/pages/{name}/preview` | serve generated HTML for preview | HTML body |

### Reused existing endpoints

- `GET /api/projects/{id}/media` — list media (Image picker uses it).
- `GET /api/projects/{id}/git/status` — git status (page changes show in status).
- `POST /api/projects/{id}/publish` — publish (pathspecs updated to include `pages/` and root `index.html`).

The frontend manages the current in-memory page tree; the backend is the authority for filesystem reads and writes.

The backend must validate page documents (structure, unique IDs, required props, safe paths) before saving them.

## 22. Error handling

The editor must show user-readable errors for:

- Invalid page JSON.
- Missing page files.
- Invalid page structure.
- Unsupported component types.
- Duplicate node IDs.
- Invalid nesting (node dropped into incompatible parent).
- Failed media loading.
- Invalid image paths.
- Failed HTML import.
- Unsupported imported HTML.
- Failed static generation.
- Filesystem errors.
- Git errors.

Technical details may be logged during development, but the UI should show concise explanations.

Import errors should distinguish between:

- Fatal parse/read errors.
- Recoverable unsupported elements.
- Dropped or transformed styles.
- Successfully imported content.

## 23. Safety requirements

The editor and generator must prevent:

- Arbitrary filesystem access through page or image paths.
- Path traversal.
- Raw HTML injection from text fields.
- Invalid generated HTML where detectable.
- Writing outside the selected target project.
- Writing outside configured content, pages, media, and generated locations.
- Silent overwriting of unrelated files.
- Deleting `index.json` or root `index.html` through the page-delete action.

Page documents and generated files must be written atomically.

## 24. Implementation phases

### Phase one: page resources

- Add page discovery (list `pages/` direct children).
- Add page selection (sidebar "Pages" list).
- Add index-page special handling (auto-create, non-deletable).
- Add page creation and non-index deletion rules.
- Confirm paths against the selected project.

### Phase two: page document model

- Define the page JSON structure (version, title, meta, classes, root).
- Define Box, Text, and Image node shapes.
- Define parent→child nesting matrix (§10).
- Define tree validation (unique IDs, valid nesting, required props).
- Define serialization and unknown-key preservation rules.

### Phase three: basic editor

- Add component palette (Box, Text, Image).
- Add canvas with node rendering.
- Add selection.
- Add nested Boxes.
- Add Text editing (element selector, content input).
- Add Image selection (media picker).
- Add delete and reorder operations.
- Add keyboard-accessible add controls.

### Phase four: drag and drop with nesting enforcement

- Implement palette→canvas drag (HTML Drag and Drop API).
- Implement canvas-internal reorder drag (pointer events).
- Implement drop indicator at valid positions only.
- Implement rejection indicator at invalid positions.
- Implement cycle guard (no drop into self/descendants).
- Implement nesting matrix validation per §10.

### Phase five: inspector and classes

- Add component-specific property inputs (element, content, src, alt).
- Add CSS property inputs (extensible definition list).
- Add node ID display.
- Add reusable class creation, editing, assignment, and deletion.

### Phase six: static generation

- Implement recursive HTML generation from page tree.
- Implement metadata generation (title, description, viewport).
- Implement CSS generation (inline styles + reusable classes).
- Implement filename-based output mapping (index → root, others → pages/).
- Implement validation (unknown types, duplicate IDs, missing props, unsafe paths).
- Add preview.

### Phase seven: HTML import

- Add html5ever dependency.
- Implement HTML parser and element conversion.
- Implement class, ID, and style preservation.
- Implement import warnings for unsupported content.
- Save imported page JSON.

### Phase eight: SCM integration

- Connect page saving to the selected project's checkout.
- Connect media selection to `media_dir`.
- Update publish pathspecs to include `pages/` and root `index.html`.
- Add Git status visibility for page changes.

## 25. Initial success criteria

The first page-editor version is successful when a user can:

1. Select a target project.
2. See its available page JSON files in a sidebar "Pages" list.
3. Open `index.json` (auto-selected if no page is chosen).
4. Create a Box, Text, or Image node via palette drag or add button.
5. Nest and reorder nodes.
6. Drop nodes only into valid parents per the nesting matrix (§10).
7. See rejection indicators when hovering invalid drop targets.
8. Select a node and see its properties in the inspector.
9. Edit its content, element type, or supported CSS styles.
10. Assign a reusable class.
11. Save the page JSON.
12. Generate root `index.html` from `pages/index.json`.
13. Create `contact.json` and generate `pages/contact.html`.
14. Preview the generated static page.
15. Import a supported existing HTML page into JSON.
16. Receive warnings for unsupported imported HTML.
17. Confirm that generated pages contain real HTML content without requiring JavaScript.
18. Keep the index page protected from deletion.
19. Publish the generated files through the existing Git workflow.
