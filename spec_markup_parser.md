# HTML Import / Markup Parser Specification

## 1. Purpose

Convert external HTML pages and components into the page editor's JSON document model (`PageDocument` / `PageNode` tree) entirely on the client side.

The parser inserts the imported HTML into a hidden iframe, lets the browser render it, then walks the live DOM tree to extract structure, content, computed styles, and head elements. This leverages the browser's own HTML parser and CSS cascade, giving accurate results for malformed HTML and complex stylesheets without reimplementing a CSS engine.

Future goal: expose the parser as a browser extension for one-click import from any website.

## 2. Scope

### In scope

- Parse a complete HTML document (from paste, file upload, or URL fetch).
- Produce a `PageDocument` compatible with `page-model.js`.
- Map HTML elements to Box, Text, and Image nodes.
- Extract computed styles that differ from browser defaults.
- Capture inline `style` attributes as node styles.
- Import `<link>`, `<style>`, `<meta>`, `<script>` into the `head` array.
- Resolve relative image `src` URLs against the document base.
- Preserve `class` attributes as class assignments.
- Preserve `id` attributes where they don't collide with generated node IDs.
- Produce an import report listing unsupported elements, attributes, and styles.
- Handle cross-origin stylesheets gracefully (skip, report).
- Handle malformed HTML (browser parser recovers automatically).

### Out of scope (v1)

- Two-way round-trip fidelity (import → edit → generate will lose some detail).
- Preserving CSS specificity order across stylesheets.
- Importing JavaScript behavior or event handlers.
- Importing CSS animations/transitions as editable properties.
- Selective import (choosing which parts of the DOM to keep).
- Importing into an existing page (always produces a new `PageDocument`).

## 3. Architecture

### Module: `web/scripts/page-html-import.js`

Pure logic module, no UI. Exports:

```js
/**
 * Parse HTML text into a PageDocument.
 * @param {string} html - Full HTML document string.
 * @param {Object} [options] - Parse options.
 * @param {string} [options.baseUrl] - Base URL for resolving relative paths.
 * @returns {Promise<{doc: PageDocument, report: ImportReport}>}
 */
export async function importHtml(html, options = {})

/**
 * Parse HTML from a File object.
 * @param {File} file - HTML file.
 * @param {Object} [options] - Parse options.
 * @returns {Promise<{doc: PageDocument, report: ImportReport}>}
 */
export async function importHtmlFile(file, options = {})

/**
 * Parse HTML from a URL (fetches with CORS).
 * @param {string} url - URL to fetch.
 * @returns {Promise<{doc: PageDocument, report: ImportReport}>}
 */
export async function importHtmlUrl(url)
```

### Module: `web/scripts/components/page-import-modal.js`

UI modal. Opens a dialog with three tabs: Paste HTML, Upload File, From URL. Calls `page-html-import.js` and returns the resulting `PageDocument` to the page editor.

### Integration point: `page-editor.js` toolbar menu

Add an "Import HTML" menu item under a new `IMPORT` section in the burger menu. On click, opens the import modal. On success, replaces the current page document with the imported one (with dirty-state confirmation).

## 4. Iframe parsing strategy

### 4.1 Create hidden iframe

```
<iframe style="position:absolute;left:-9999px;width:0;height:0;opacity:0"
        sandbox="allow-same-origin">
</iframe>
```

- `sandbox="allow-same-origin"`: allows CSS to load but blocks scripts.
- Hidden offscreen: zero visual impact.
- Same-origin: computed styles are accessible.

### 4.2 Load HTML

For paste/file: write HTML into `iframe.contentDocument` via `document.open()`/`document.write()`/`document.close()`, set `<base href>` if `baseUrl` is provided.

For URL: fetch the HTML, inject `<base href>` for the original URL, write into iframe.

### 4.3 Wait for load

Listen for the iframe `load` event. Then wait one animation frame (`requestAnimationFrame`) to ensure styles are fully computed.

### 4.4 Collect head elements

Before walking the body, extract from `iframe.contentDocument.head`:

| Source HTML element | HeadElement mapping |
|---|---|
| `<link rel="stylesheet" href="..." media="...">` | `{ type: 'stylesheet', href, media }` |
| `<style>...</style>` | `{ type: 'style', css: textContent }` |
| `<meta name="..." content="...">` | `{ type: 'meta', name, content }` |
| `<meta property="..." content="...">` | `{ type: 'meta', property, content }` |
| `<meta charset="...">` | `{ type: 'meta', charset }` |
| `<script src="..." defer async>` | `{ type: 'script', src, defer, async }` |
| `<script>...</script>` | `{ type: 'script', js: textContent }` |
| `<title>...</title>` | Sets `doc.title` |

Cross-origin `<link>` elements will fail to parse in the iframe. Report them as warnings.

### 4.5 Walk body DOM tree

Recursive walk of `iframe.contentDocument.body`. For each DOM node:

#### DOM node type → PageNode mapping

| HTML element | PageNode type | Element |
|---|---|---|
| `div`, `section`, `main`, `header`, `footer`, `article`, `aside`, `nav` | box | same tag |
| `ul`, `ol` | box | same tag |
| `p`, `h1`–`h6`, `span`, `blockquote`, `a`, `button` | text | same tag |
| `img` | image | — |
| `video`, `audio` | box | same tag (v1: treated as containers) |
| `table`, `form`, `input`, `select`, `textarea`, `svg`, `iframe`, `script`, `style`, `noscript` | — | skip, add to report |
| Unknown custom elements | — | skip, add to report |
| `br` | — | skip (line breaks captured in text content) |
| `hr` | box | `div` (semantic divider → generic container) |

#### Text nodes (`nodeType === 3`)

- Accumulate text into the parent element's text content.
- If the parent is a supported text element, the text becomes the `value` prop.
- If the parent is a supported box element with only text children and no element children, wrap in a child Text node.
- Whitespace-only text nodes between block elements are discarded.

#### Element processing

For each supported element:

1. **Determine type** from the mapping above.
2. **Generate node ID**: use the element's `id` attribute if present and valid (alphanumeric + hyphens), otherwise generate `node-N`.
3. **Set name** from the element's `id` or a default (`"parsed block"`).
4. **Extract inline styles** from the `style` attribute into `node.styles`.
5. **Extract computed styles**:
   - Get `el.computedStyleMap()` (or fallback `getComputedStyle(el)`).
   - Create a default element of the same tag, append to body, get its computed styles.
   - For each property, if the computed value differs from the default AND from the inherited parent's value, record it.
   - Merge shorthand properties (from `shorthandProperties` map).
   - Skip properties that are already captured in inline styles.
   - Convert to camelCase keys.
6. **Extract attributes** into `node.attrs`:
   - `href`, `target`, `src`, `alt`, `controls`, `autoplay`, `loop`, `muted`, `poster`, `width`, `height`, `loading`, `rel`.
   - Skip `class` (handled separately), `id` (used for node ID), `style` (already extracted).
7. **Extract classes**: split `class` attribute on whitespace → `node.classes`.
8. **Process children**: recurse into child elements, collecting child PageNodes.
9. **Media elements** (`video`, `audio`): set `src` and `alt` (poster for video) as props, no children.

### 4.6 Compute import report

```js
/**
 * @typedef {Object} ImportReport
 * @property {string[]} warnings - Non-fatal issues (unsupported elements, dropped attrs).
 * @property {string[]} errors - Fatal issues (shouldn't occur with browser parser).
 * @property {{total: number, boxes: number, texts: number, images: number}} stats - Node counts.
 */
```

Report entries are categorized:
- `[unsupported element] <tag>` — element was skipped.
- `[unsupported attribute] <attr> on <tag>` — attribute was dropped.
- `[unsupported style] <prop>: <val> on <tag>` — CSS property not in editor's supported set.
- `[cross-origin stylesheet] <href>` — stylesheet couldn't be read.
- `[fragment] <tag>` — element kept but representation is lossy.

### 4.7 Cleanup

Remove the iframe from the DOM after parsing completes.

## 5. CSS extraction details

### 5.1 Computed style diffing

The key insight from the previous parser: only record styles that **differ from browser defaults** and **differ from the parent's inherited styles**. This produces a minimal, clean representation.

Process:
1. Create a "zero" element of the same tag, append to body.
2. Get its computed style map — these are the browser defaults.
3. For the actual element, get its computed style map.
4. For each property, if `actual[key] !== default[key]` AND `actual[key] !== inherited[key]`, record it.
5. Remove the zero element after processing each tag type (cache per tag).

### 5.2 Shorthand merging

Apply the `shorthandProperties` map from the user's previous parser:
- If all longhand properties of a shorthand have the same value, replace with the shorthand.
- Example: `margin-top: 1rem; margin-right: 1rem; margin-bottom: 1rem; margin-left: 1rem` → `margin: 1rem`.

### 5.3 Value deduplication

Group repeated values across properties into CSS custom properties:
- If `color: red` and `background-color: red`, create `--ag-cp1: red` and reference `var(--ag-cp1)` for both.
- This is optional and controlled by a flag (off by default for import, since inline styles don't benefit from this).

### 5.4 Supported CSS properties (editor subset)

Only import properties that the editor can display in the inspector:

```
display, position, top, right, bottom, left, z-index,
width, height, min-width, max-width, min-height, max-height,
margin, padding,
background-color, background-image, background-size, background-position, background-repeat,
color, font-family, font-size, font-weight, font-style, line-height, text-align, text-decoration,
border, border-radius, box-shadow,
flex-direction, justify-content, align-items,
grid-template-columns,
opacity, overflow, cursor
```

Properties outside this set are reported as `[unsupported style]` warnings.

## 6. Image resolution

All `img[src]` values are resolved against the document's base URL (the iframe's `<base href>` or the original URL). The resolved absolute URL is stored temporarily; the modal or editor must then convert it to a project-relative media path before saving (this is handled at the integration layer, not in the parser).

## 7. Import modal UI

### Layout

```
┌─ Import HTML ──────────────────────────────────┐
│                                                   │
│  [Paste] [Upload] [From URL]                     │
│                                                   │
│  ┌─ tab content ──────────────────────────────┐  │
│  │ (textarea / file input / url input)         │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ Import preview ───────────────────────────┐  │
│  │ 12 boxes, 34 texts, 5 images               │  │
│  │ 3 warnings: [unsupported element] <table>   │  │
│  │              [unsupported element] <form>    │  │
│  │              [unsupported style] ...         │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  Page title: [_______________]                    │
│                                                   │
│              [Cancel]  [Import]                   │
└───────────────────────────────────────────────────┘
```

### Behavior

1. User opens modal from the page editor toolbar menu "Import HTML".
2. Modal shows three tabs. Default: Paste.
3. **Paste tab**: large textarea for raw HTML.
4. **Upload tab**: file input accepting `.html`, `.htm`.
5. **From URL tab**: text input for URL, "Fetch" button.
6. On input, a debounced parse runs in the background (200ms).
7. Preview shows stats and warnings.
8. User can edit the page title before importing.
9. "Import" button returns the `PageDocument` to the page editor.
10. Page editor replaces the current document (with dirty confirmation if needed).
11. "Cancel" closes the modal without changes.

### Error states

- Empty input: disabled Import button.
- Parse error (shouldn't happen with browser parser): show error toast.
- Very large HTML (>5MB): warn, allow proceeding.
- Network error on URL fetch: show error toast.

## 8. Future: Browser extension

The parser module (`page-html-import.js`) will be extracted as a standalone extension:

- Content script injects into any page.
- Extracts DOM tree + computed styles + stylesheets.
- Sends structured data to SCM via `chrome.runtime.sendMessage`.
- SCM backend receives and converts to `PageDocument`.

The iframe-based approach is compatible with this: the extension can use the same DOM walking logic on the live page's DOM (no iframe needed since the page is already rendered).

## 9. Testing strategy

- Unit: feed known HTML strings, verify output structure.
- Visual: import sample pages (landing page, blog post, component library).
- Round-trip: import → generate HTML → diff with original (expect structural similarity, not byte-identical).
- Edge cases: empty HTML, nested tables, SVG, forms, custom elements, base64 images, relative URLs.
