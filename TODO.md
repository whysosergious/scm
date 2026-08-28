# TODO — CodeMirror 6 Integration

## Goal
Bundle CodeMirror 6 as a self-contained vendor JS file (same pattern as ProseMirror/rich-editor), expose a `<code-editor>` custom element with full language/theme/plugin support, and wire it into the HTML import modal.

---

## Phase 1: Project Scaffolding

### 1.1 Create `web/codemirror-src/`
```
web/codemirror-src/
  package.json
  vite.config.js
  src/
    main.js          # single entry point (custom element + registry)
```

### 1.2 `package.json` — dependencies

**Core:**
- `codemirror` — basicSetup bundle
- `@codemirror/state`
- `@codemirror/view`
- `@codemirror/commands`
- `@codemirror/search`
- `@codemirror/autocomplete`
- `@codemirror/language`
- `@codemirror/lint`

**Language support (official — all):**
- `@codemirror/lang-javascript`
- `@codemirror/lang-html`
- `@codemirror/lang-css`
- `@codemirror/lang-json`
- `@codemirror/lang-xml`
- `@codemirror/lang-markdown`
- `@codemirror/lang-python`
- `@codemirror/lang-rust`
- `@codemirror/lang-cpp`
- `@codemirror/lang-java`
- `@codemirror/lang-php`
- `@codemirror/lang-sql`
- `@codemirror/lang-swift`
- `@codemirror/lang-kotlin`
- `@codemirror/lang-angular`
- `@codemirror/lang-vue`
- `@codemirror/lang-liquid`
- `@codemirror/lang-sass`
- `@codemirror/lang-less`
- `@codemirror/lang-wast`
- `@codemirror/lang-gherkin`

**Themes:**
- `@codemirror/theme-one-dark` — One Dark
- `@ddietr/codemirror-themes` — bulk collection: material (light/dark), solarized (light/dark), dracula, github (light/dark), aura, tokyo night / storm / day

**Community extensions:**
- `@emmetio/codemirror6-plugin` — Emmet abbreviation expansion
- `@replit/codemirror-vim` — Vim keybindings
- `@replit/codemirror-emacs` — Emacs keybindings
- `@replit/codemirror-vscode-keymap` — VS Code keybindings
- `@replit/codemirror-indentation-markers` — indentation guides

**Dev:**
- `vite` — bundler (same as prosemirror setup)

### 1.3 `vite.config.js`
Same pattern as `web/editor-src/vite.config.js`:
- Library mode, entry `src/main.js`
- ES module format
- Output to `../scripts/vendor/`
- Filename: `code-editor.bundle.js`
- `minify: false`, `emptyOutDir: false`, `manualChunks: undefined`

---

## Phase 2: `<code-editor>` Custom Element (`src/main.js`)

### 2.1 Architecture
Single file, same pattern as `web/editor-src/src/main.js`. Registers `<code-editor>` custom element.

**Attributes / properties:**
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | `''` | Document content |
| `language` | string | `'html'` | Language mode key |
| `theme` | string | `'tokyo-night'` | Theme key |
| `tab-size` | number | `2` | Tab width |
| `line-numbers` | boolean | `true` | Show line numbers |
| `word-wrap` | boolean | `false` | Line wrapping |
| `font-size` | number | `14` | Font size in px |

**Events:**
- `input` — fired on content change (same as ProseMirror `<rich-text-editor>`)
- `settingschange` — fired when theme/language/options change

**API:**
- `el.value` getter/setter — serialize/deserialize editor content
- `el.setLanguage(lang)` — switch language at runtime
- `el.setTheme(theme)` — switch theme at runtime

### 2.2 Internal structure
```
┌─────────────────────────────────┐
│  [Theme ▾] [Lang ▾] [⚙ Options]│  ← toolbar row
├─────────────────────────────────┤
│                                 │
│  CodeMirror EditorView          │
│                                 │
└─────────────────────────────────┘
```

### 2.3 Theme registry
Object mapping theme keys → CodeMirror `Extension`:
```js
const THEMES = {
  'tokyo-night':      tokyNight,       // @ddietr — DEFAULT
  'tokyo-night-storm': tokyNightStorm,
  'tokyo-night-day':  tokyNightDay,
  'one-dark':         oneDark,         // @codemirror/theme-one-dark
  'dracula':          dracula,
  'github-dark':      githubDark,
  'github-light':     githubLight,
  'material-dark':    materialDark,
  'material-light':   materialLight,
  'material-ocean':   materialOcean,   // (if available in @ddietr)
  'solarized-dark':   solarizedDark,
  'solarized-light':  solarizedLight,
  'aura':             aura,
  'monokai':          monokai,         // custom or @fsegurai
  'nord':             nord,
  // ... all themes from packages
  'custom':           buildCustomTheme, // function from user color picks
};
```

### 2.4 Language registry
Object mapping language keys → factory functions:
```js
const LANGUAGES = {
  'html':     () => html(),
  'css':      () => css(),
  'javascript': () => javascript(),
  'json':     () => json(),
  'xml':      () => xml(),
  'markdown': () => markdown(),
  'python':   () => python(),
  'rust':     () => rust(),
  'cpp':      () => cpp(),
  'java':     () => java(),
  'php':      () => php(),
  'sql':      () => sql(),
  'swift':    () => swift(),
  'kotlin':   () => kotlin(),
  'angular':  () => angular(),
  'vue':      () => vue(),
  'liquid':   () => liquid(),
  'sass':     () => sass(),
  'less':     () => less(),
  'wast':     () => wast(),
  'gherkin':  () => gherkin(),
  'plaintext': () => [], // no language support
};
```

### 2.5 Options panel
A floating popover panel (toggled by ⚙ button in toolbar):

**Controls:**
| Control | Type | Persisted |
|---------|------|-----------|
| Theme | dropdown | localStorage |
| Language | dropdown | — (per-use) |
| Keybindings | dropdown (Default/Vim/Emacs/VS Code) | localStorage |
| Font size | number input or slider (10–24px) | localStorage |
| Tab size | dropdown (2/4/8) | localStorage |
| Line numbers | checkbox | localStorage |
| Word wrap | checkbox | localStorage |
| Emmet | checkbox (on/off) | localStorage |
| Indentation markers | checkbox | localStorage |

**Custom theme section** (at bottom of panel):
- 8 color pickers: background, foreground, cursor, selection, gutter-bg, gutter-fg, keyword, string
- Live preview — changes apply immediately
- "Save as custom" button → persists to localStorage as `scm:cm-custom-theme`
- "Reset" button → clears custom theme

### 2.6 Persistence
localStorage keys:
- `scm:cm-theme` — selected theme key
- `scm:cm-language` — selected language key (optional)
- `scm:cm-keybindings` — selected keybinding set
- `scm:cm-font-size` — font size
- `scm:cm-tab-size` — tab size
- `scm:cm-line-numbers` — boolean
- `scm:cm-word-wrap` — boolean
- `scm:cm-emmet` — boolean
- `scm:cm-indent-markers` — boolean
- `scm:cm-custom-theme` — JSON of custom color picks

---

## Phase 3: Build

```bash
cd web/codemirror-src && npm install && npm run build
```

Output: `web/scripts/vendor/code-editor.bundle.js`

---

## Phase 4: Integration

### 4.1 HTML import modal (`web/scripts/components/page-import-modal.js`)
Replace the `<textarea class="value-input">` with:
```js
const editor = el('code-editor', {
  language: 'html',
  'tab-size': 2,
  style: { height: '300px', width: '100%' },
});
```
- On file load: `editor.value = htmlContent;`
- On submit: `const html = editor.value.trim();`
- Lazy-load the bundle (same pattern as rich-editor): `await import('../vendor/code-editor.bundle.js');`

### 4.2 Inspector `<style>` textarea
Optionally replace the CSS textarea in the inspector with `<code-editor language="css">` — but this can be Phase 5.

---

## Phase 5: Verification
- `node --check web/scripts/main.js` (no syntax errors)
- `cd web/codemirror-src && npm run build` succeeds
- `<code-editor>` renders in the import modal
- Theme switching works
- Language switching works
- Options persist across reload
- Custom theme builder works
- Content round-trips correctly via `.value`

---

## Notes
- Bundle will be larger than the ProseMirror one (~20+ language grammars). This is expected and acceptable — it's lazy-loaded only when the import modal opens.
- Tokyo Night is default theme. Theme selection persists.
- The options panel is self-contained within the custom element — no external UI dependencies.
- The `@ddietr/codemirror-themes` package provides the bulk of themes from a single dependency.
- Custom theme builder uses `EditorView.theme()` + `syntaxHighlighting(HighlightStyle.define())` at runtime.
