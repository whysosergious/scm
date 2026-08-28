// <code-editor> custom element — CodeMirror 6 bundle entry point.
// Self-contained code editor with statusline, settings panel, theme/language switching.

import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars,
  drawSelection, dropCursor, highlightActiveLine, rectangularSelection, crosshairCursor,
  placeholder as cmPlaceholder } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentOnInput, bracketMatching, foldGutter, foldKeymap, indentUnit,
  syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { lintGutter, lintKeymap } from '@codemirror/lint';
import { tags as t } from '@lezer/highlight';

// Languages — official
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { php } from '@codemirror/lang-php';
import { sql } from '@codemirror/lang-sql';
import { liquid } from '@codemirror/lang-liquid';
import { sass } from '@codemirror/lang-sass';
import { less } from '@codemirror/lang-less';
import { wast } from '@codemirror/lang-wast';
import { angular } from '@codemirror/lang-angular';
import { vue } from '@codemirror/lang-vue';

// Languages — community
import { svelte } from '@replit/codemirror-lang-svelte';
import { nix } from '@replit/codemirror-lang-nix';
import { csharp } from '@replit/codemirror-lang-csharp';
import { elixir } from 'codemirror-lang-elixir';
import { hcl } from 'codemirror-lang-hcl';
import { latex } from 'codemirror-lang-latex';
import { sparql } from 'codemirror-lang-sparql';
import { graphql } from 'cm6-graphql';
import { astro } from '@fazelstudio/codemirror-lang-astro';
import { prisma } from '@fazelstudio/codemirror-lang-prisma';
import { clojure } from '@nextjournal/lang-clojure';

// Themes — official
import { oneDark } from '@codemirror/theme-one-dark';

// Themes — @ddietr
import { tokyoNight } from '@ddietr/codemirror-themes/tokyo-night';
import { tokyoNightStorm } from '@ddietr/codemirror-themes/tokyo-night-storm';
import { tokyoNightDay } from '@ddietr/codemirror-themes/tokyo-night-day';
import { dracula } from '@ddietr/codemirror-themes/dracula';
import { githubLight } from '@ddietr/codemirror-themes/github-light';
import { githubDark } from '@ddietr/codemirror-themes/github-dark';
import { aura } from '@ddietr/codemirror-themes/aura';
import { materialLight } from '@ddietr/codemirror-themes/material-light';
import { materialDark } from '@ddietr/codemirror-themes/material-dark';
import { solarizedLight } from '@ddietr/codemirror-themes/solarized-light';
import { solarizedDark } from '@ddietr/codemirror-themes/solarized-dark';

// Themes — @catppuccin
import { catppuccinMocha, catppuccinMacchiato, catppuccinFrappe, catppuccinLatte } from '@catppuccin/codemirror';

// Themes — @fsegurai
import { monokai } from '@fsegurai/codemirror-theme-monokai';
import { nord } from '@fsegurai/codemirror-theme-nord';
import { synthwave84 } from '@fsegurai/codemirror-theme-synthwave-84';
import { gruvboxDark } from '@fsegurai/codemirror-theme-gruvbox-dark';
import { gruvboxLight } from '@fsegurai/codemirror-theme-gruvbox-light';
import { palenight } from '@fsegurai/codemirror-theme-palenight';
import { volcano } from '@fsegurai/codemirror-theme-volcano';
import { highContrastDark } from '@fsegurai/codemirror-theme-high-contrast-dark';
import { highContrastLight } from '@fsegurai/codemirror-theme-high-contrast-light';
import { catppuccinMocha as fsegCatppuccinMocha } from '@fsegurai/codemirror-theme-catppuccin-mocha';

// Community extensions
import { abbreviationTracker } from '@emmetio/codemirror6-plugin';
import { vim } from '@replit/codemirror-vim';
import { emacs } from '@replit/codemirror-emacs';
import { vscodeKeymap } from '@replit/codemirror-vscode-keymap';
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import { colorView } from '@uiw/codemirror-extensions-color';
import { hyperLinkExtension } from '@uiw/codemirror-extensions-hyper-link';
import { zebraStripes } from '@uiw/codemirror-extensions-zebra-stripes';
import { lineNumbersRelative } from '@uiw/codemirror-extensions-line-numbers-relative';
import rainbowBrackets from 'rainbowbrackets';

// ── Registries ────────────────────────────────────────────────────

const LANGUAGES = {
  html:       () => html(),
  css:        () => css(),
  javascript: () => javascript(),
  json:       () => json(),
  xml:        () => xml(),
  markdown:   () => markdown(),
  python:     () => python(),
  rust:       () => rust(),
  cpp:        () => cpp(),
  java:       () => java(),
  php:        () => php(),
  sql:        () => sql(),
  liquid:     () => liquid(),
  sass:       () => sass(),
  less:       () => less(),
  wast:       () => wast(),
  angular:    () => angular(),
  vue:        () => vue(),
  svelte:     () => svelte(),
  nix:        () => nix(),
  csharp:     () => csharp(),
  elixir:     () => elixir(),
  hcl:        () => hcl(),
  graphql:    () => graphql(),
  latex:      () => latex(),
  sparql:     () => sparql(),
  astro:      () => astro(),
  prisma:     () => prisma(),
  clojure:    () => clojure(),
  plaintext:  () => [],
};

const LANG_LABELS = {
  html: 'HTML', css: 'CSS', javascript: 'JavaScript', json: 'JSON', xml: 'XML',
  markdown: 'Markdown', python: 'Python', rust: 'Rust', cpp: 'C++', java: 'Java',
  php: 'PHP', sql: 'SQL', liquid: 'Liquid', sass: 'Sass', less: 'Less',
  wast: 'WebAssembly', angular: 'Angular', vue: 'Vue', svelte: 'Svelte',
  nix: 'Nix', csharp: 'C#', elixir: 'Elixir', hcl: 'HCL', graphql: 'GraphQL',
  latex: 'LaTeX', sparql: 'SPARQL', astro: 'Astro', prisma: 'Prisma',
  clojure: 'Clojure', plaintext: 'Plain Text',
};

const THEMES = {
  // @ddietr
  'tokyo-night':       tokyoNight,
  'tokyo-night-storm': tokyoNightStorm,
  'tokyo-night-day':   tokyoNightDay,
  'one-dark':          oneDark,
  'dracula':           dracula,
  'github-dark':       githubDark,
  'github-light':      githubLight,
  'material-dark':     materialDark,
  'material-light':    materialLight,
  'solarized-dark':    solarizedDark,
  'solarized-light':   solarizedLight,
  'aura':              aura,
  // @catppuccin
  'catppuccin-mocha':     catppuccinMocha,
  'catppuccin-macchiato': catppuccinMacchiato,
  'catppuccin-frappe':    catppuccinFrappe,
  'catppuccin-latte':     catppuccinLatte,
  // @fsegurai
  'monokai':           monokai,
  'nord':              nord,
  'synthwave-84':      synthwave84,
  'gruvbox-dark':      gruvboxDark,
  'gruvbox-light':     gruvboxLight,
  'palenight':         palenight,
  'volcano':           volcano,
  'high-contrast-dark':  highContrastDark,
  'high-contrast-light': highContrastLight,
};

const THEME_LABELS = {
  'tokyo-night': 'Tokyo Night', 'tokyo-night-storm': 'Tokyo Night Storm',
  'tokyo-night-day': 'Tokyo Night Day', 'one-dark': 'One Dark',
  'dracula': 'Dracula', 'github-dark': 'GitHub Dark', 'github-light': 'GitHub Light',
  'material-dark': 'Material Dark', 'material-light': 'Material Light',
  'solarized-dark': 'Solarized Dark', 'solarized-light': 'Solarized Light',
  'aura': 'Aura',
  'catppuccin-mocha': 'Catppuccin Mocha', 'catppuccin-macchiato': 'Catppuccin Macchiato',
  'catppuccin-frappe': 'Catppuccin Frappe', 'catppuccin-latte': 'Catppuccin Latte',
  'monokai': 'Monokai', 'nord': 'Nord', 'synthwave-84': 'Synthwave \'84',
  'gruvbox-dark': 'Gruvbox Dark', 'gruvbox-light': 'Gruvbox Light',
  'palenight': 'Palenight', 'volcano': 'Volcano',
  'high-contrast-dark': 'High Contrast Dark', 'high-contrast-light': 'High Contrast Light',
};

const KB_SETS = {
  default: keymap.of(defaultKeymap),
  vim:     vim(),
  emacs:   emacs(),
  vscode:  keymap.of(vscodeKeymap),
};
const KB_LABELS = { default: 'Default', vim: 'Vim', emacs: 'Emacs', vscode: 'VS Code' };

// ── localStorage ──────────────────────────────────────────────────

const LS = {
  get(k, fb) { try { return localStorage.getItem(k) ?? fb; } catch { return fb; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  bool(k, fb) { const v = this.get(k, null); return v === null ? fb : v === 'true'; },
  num(k, fb) { const n = parseInt(this.get(k, String(fb)), 10); return isNaN(n) ? fb : n; },
};

// ── Custom theme ──────────────────────────────────────────────────

const CT_DEFAULTS = {
  bg: '#1a1b26', fg: '#a9b1d6', caret: '#c0caf5', selection: '#33467c',
  gutterBg: '#1a1b26', gutterFg: '#3b4261', lineHi: '#1a1b2620',
  keyword: '#bb9af7', string: '#9ece6a', comment: '#565f89', number: '#ff9e64',
  variable: '#c0caf5', func: '#7aa2f7', type: '#2ac3de', operator: '#89ddff',
};

function buildCustomTheme(c) {
  c = { ...CT_DEFAULTS, ...c };
  return [
    EditorView.theme({
      '&': { backgroundColor: c.bg, color: c.fg },
      '.cm-content': { caretColor: c.caret },
      '.cm-cursor': { borderLeftColor: c.caret },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: c.selection },
      '.cm-activeLine': { backgroundColor: c.lineHi },
      '.cm-gutters': { backgroundColor: c.gutterBg, color: c.gutterFg, border: 'none' },
      '.cm-activeLineGutter': { backgroundColor: c.gutterBg + '40' },
    }),
    syntaxHighlighting(HighlightStyle.define([
      { tag: t.keyword, color: c.keyword },
      { tag: t.controlKeyword, color: c.keyword },
      { tag: t.operatorKeyword, color: c.keyword },
      { tag: t.definitionKeyword, color: c.keyword },
      { tag: t.moduleKeyword, color: c.keyword },
      { tag: t.operator, color: c.operator },
      { tag: t.string, color: c.string },
      { tag: t.regexp, color: c.string },
      { tag: t.number, color: c.number },
      { tag: t.bool, color: c.number },
      { tag: t.null, color: c.number },
      { tag: t.comment, color: c.comment, fontStyle: 'italic' },
      { tag: t.lineComment, color: c.comment, fontStyle: 'italic' },
      { tag: t.blockComment, color: c.comment, fontStyle: 'italic' },
      { tag: t.definition(t.variableName), color: c.func },
      { tag: t.function(t.variableName), color: c.func },
      { tag: t.definition(t.propertyName), color: c.func },
      { tag: t.propertyName, color: c.func },
      { tag: t.variableName, color: c.variable },
      { tag: t.typeName, color: c.type },
      { tag: t.className, color: c.type },
      { tag: t.namespace, color: c.type },
      { tag: t.tagName, color: c.keyword },
      { tag: t.attributeName, color: c.func },
      { tag: t.attributeValue, color: c.string },
      { tag: t.self, color: c.keyword },
    ])),
  ];
}

// ── CSS ───────────────────────────────────────────────────────────

const CSS = `
:host { display: block; min-height: 120px; height: 350px; max-height: 70vh; position: relative; }

/* ── Editor area ── */
.ce-editor { position: absolute; inset: 0 0 28px 0; overflow: auto; }
.ce-editor .cm-editor .cm-content span[data-color] {
  display: inline-block !important; width: 14px !important; height: 14px !important;
  border-radius: 3px !important; margin-top: 0 !important; margin-right: 4px !important;
  outline: 1px solid var(--color-outline-variant, #313244) !important; outline-offset: 1px;
  overflow: hidden; vertical-align: middle;
}
.ce-editor .cm-editor .cm-content span[data-color] input[type="color"] {
  height: 14px !important; padding: 0 !important; border: none !important; background: transparent !important;
}
.ce-editor .cm-editor .cm-content span[data-color] input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 1px !important;
}
.ce-editor .cm-editor .cm-content span[data-color] input[type="color"]::-webkit-color-swatch {
  border: none !important; border-radius: 2px !important;
}

.ce-editor .cm-editor { height: 100%; }
.ce-editor .cm-editor .cm-scroller { overflow: auto; }
.ce-editor .cm-editor:focus-within { outline: none; }

/* ── Statusline ── */
.ce-statusline {
  position: absolute; bottom: 0; left: 0; right: 0;
  display: flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 10px;
  background: var(--color-surface, #1e1e2e);
  border-top: 1px solid var(--color-outline-variant, #313244);
  font-size: 11px; color: var(--color-on-surface-variant, #a6adc8);
  user-select: none;
}
.ce-statusline .ce-sl-left { display: flex; align-items: center; gap: 8px; flex: 1; }
.ce-statusline .ce-sl-right { display: flex; align-items: center; gap: 4px; }
.ce-sl-lang {
  cursor: pointer; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;
  padding: 1px 4px; border-radius: 2px;
}
.ce-sl-lang:hover { background: var(--color-surface-variant, #313244); }
.ce-sl-cursor { font-variant-numeric: tabular-nums; }
.ce-sl-gear {
  background: none; border: none; color: var(--color-on-surface-variant, #a6adc8);
  cursor: pointer; padding: 2px 4px; border-radius: 2px; display: flex; align-items: center;
  font-size: 14px; line-height: 1;
}
.ce-sl-gear:hover { background: var(--color-surface-variant, #313244); color: var(--color-on-surface, #cdd6f4); }

/* Language picker */
.ce-lang-picker {
  position: absolute; bottom: 28px; left: 10px; z-index: 100;
  background: var(--color-surface, #1e1e2e); color: var(--color-on-surface, #cdd6f4);
  border: 1px solid var(--color-outline-variant, #313244); border-radius: 4px;
  padding: 4px 0; min-width: 160px; max-height: 260px; overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4); font-size: 12px;
}
.ce-lang-picker::-webkit-scrollbar { width: 5px; }
.ce-lang-picker::-webkit-scrollbar-thumb { background: var(--color-outline-variant, #313244); border-radius: 2px; }
.ce-lang-opt {
  display: block; width: 100%; padding: 5px 12px; border: none; background: none;
  color: inherit; text-align: left; cursor: pointer; font-size: 12px; font-family: inherit;
}
.ce-lang-opt:hover { background: var(--color-surface-variant, #313244); }
.ce-lang-opt.active { color: var(--color-primary, #89b4fa); font-weight: 600; }

/* ── Settings overlay ── */
.ce-settings-overlay { position: fixed; inset: 0; z-index: 9998; }
.ce-settings-panel {
  position: fixed; bottom: 32px; right: 8px; z-index: 9999;
  width: 320px; max-height: 65vh; overflow-y: auto;
  background: var(--color-surface, #1e1e2e); color: var(--color-on-surface, #cdd6f4);
  border: 1px solid var(--color-outline-variant, #313244); border-radius: 5px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5); font-size: 12px;
}
.ce-settings-panel::-webkit-scrollbar { width: 5px; }
.ce-settings-panel::-webkit-scrollbar-thumb { background: var(--color-outline-variant, #313244); border-radius: 2px; }
.ce-s-section {
  padding: 10px 14px 6px; font-size: 10px; text-transform: uppercase;
  letter-spacing: 1px; color: var(--color-on-surface-variant, #a6adc8); font-weight: 600;
}
.ce-s-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 14px; gap: 10px;
}
.ce-s-row label { color: var(--color-on-surface-variant, #a6adc8); font-size: 12px; white-space: nowrap; }
.ce-s-row select, .ce-s-row input[type="number"] {
  background: var(--color-background, #181825); color: var(--color-on-surface, #cdd6f4);
  border: 1px solid var(--color-outline-variant, #313244); border-radius: 3px;
  padding: 5px 8px; font-size: 12px; outline: none; font-family: inherit;
}
.ce-s-row select { flex: 1; min-width: 0; cursor: pointer; }
.ce-s-row select:focus, .ce-s-row input:focus { border-color: var(--color-primary, #89b4fa); }
.ce-s-row input[type="number"] { width: 60px; text-align: center; }
.ce-s-row input[type="checkbox"] {
  width: 16px; height: 16px; accent-color: var(--color-primary, #89b4fa); cursor: pointer;
}
.ce-s-divider { height: 0; border-top: 1px solid var(--color-outline-variant, #313244); margin: 4px 0; }
.ce-ct-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px;
  padding: 6px 14px 10px;
}
.ce-ct-row { display: flex; align-items: center; gap: 6px; }
.ce-ct-row label { flex: 1; font-size: 11px; color: var(--color-on-surface-variant, #a6adc8); }
.ce-ct-row input[type="color"] {
  width: 28px; height: 22px; border: 1px solid var(--color-outline-variant, #313244);
  border-radius: 2px; padding: 1px; cursor: pointer; background: transparent;
}
.ce-s-actions { display: flex; gap: 6px; padding: 8px 14px 12px; }
.ce-s-actions button {
  flex: 1; padding: 7px 10px; border-radius: 6px; font-size: 12px; cursor: pointer;
  border: 1px solid var(--color-outline-variant, #313244);
  background: var(--color-background, #181825); color: var(--color-on-surface, #cdd6f4);
  font-family: inherit; font-weight: 500;
}
.ce-s-actions button:hover { background: var(--color-surface-variant, #313244); }
.ce-s-actions .ce-primary {
  background: var(--color-primary, #89b4fa); color: var(--color-on-primary, #1e1e2e);
  border-color: var(--color-primary, #89b4fa);
}
.ce-s-actions .ce-primary:hover { filter: brightness(1.1); }
`;

let cssInjected = false;
let cssText = '';
function injectCSS() {
  if (cssInjected) return; cssInjected = true; cssText = CSS;
}

// ── Helpers ────────────────────────────────────────────────────────

function $(tag, attrs, ...ch) {
  const e = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v);
  });
  for (const c of ch) { if (c != null) e.append(typeof c === 'string' ? document.createTextNode(c) : c); }
  return e;
}

// ── Settings Panel ────────────────────────────────────────────────

function buildSettings(ed) {
  const p = $('div', { class: 'ce-settings-panel' });
  function sec(t) { return $('div', { class: 'ce-s-section' }, t); }
  function row(lbl, ctrl) { return $('div', { class: 'ce-s-row' }, $('label', null, lbl), ctrl); }
  function sel(opts, val, cb) {
    const s = $('select');
    for (const [k, l] of Object.entries(opts)) s.append($('option', { value: k }, l));
    s.value = val; s.addEventListener('change', () => cb(s.value)); return s;
  }
  function tog(lbl, checked, cb) {
    const inp = $('input', { type: 'checkbox' }); inp.checked = checked;
    inp.addEventListener('change', () => cb(inp.checked)); return row(lbl, inp);
  }

  const themeCtrl = sel(THEME_LABELS, ed._theme, v => ed.setTheme(v));
  themeCtrl.append($('option', { value: 'custom' }, 'Custom'));

  p.append(
    sec('Theme'), row('Theme', themeCtrl),
    sec('Language'), row('Language', sel(LANG_LABELS, ed._language, v => ed.setLanguage(v))),
    $('div', { class: 'ce-s-divider' }),
    sec('Editor'),
    row('Keybindings', sel(KB_LABELS, ed._keybindings, v => { ed._keybindings = v; LS.set('scm:cm-keybindings', v); ed._rebuildKB(); })),
    row('Font size', (() => { const i = $('input', { type: 'number', min: '10', max: '28', value: String(ed._fontSize) }); i.addEventListener('change', () => { ed._fontSize = parseInt(i.value, 10) || 14; LS.set('scm:cm-font-size', String(ed._fontSize)); ed._applyFont(); }); return i; })()),
    row('Tab size', (() => { const i = $('input', { type: 'number', min: '1', max: '8', value: String(ed._tabSize) }); i.addEventListener('change', () => { ed._tabSize = parseInt(i.value, 10) || 2; LS.set('scm:cm-tab-size', String(ed._tabSize)); ed._reconfigureIndent(); }); return i; })()),
    tog('Line numbers', ed._lineNumbers, v => { ed._lineNumbers = v; LS.set('scm:cm-line-numbers', String(v)); ed._reconfGutters(); }),
    tog('Word wrap', ed._wordWrap, v => { ed._wordWrap = v; LS.set('scm:cm-word-wrap', String(v)); ed._reconfWrap(); }),
    tog('Emmet', ed._emmet, v => { ed._emmet = v; LS.set('scm:cm-emmet', String(v)); ed._rebuildExtras(); }),
    tog('Indent guides', ed._indentMarkers, v => { ed._indentMarkers = v; LS.set('scm:cm-indent-markers', String(v)); ed._rebuildExtras(); }),
    tog('Color picker', ed._colorExt, v => { ed._colorExt = v; LS.set('scm:cm-color-ext', String(v)); ed._rebuildExtras(); }),
    tog('Rainbow brackets', ed._rainbowBrackets, v => { ed._rainbowBrackets = v; LS.set('scm:cm-rainbow', String(v)); ed._rebuildExtras(); }),
    tog('Zebra stripes', ed._zebraStripes, v => { ed._zebraStripes = v; LS.set('scm:cm-zebra', String(v)); ed._rebuildExtras(); }),
    tog('Clickable links', ed._hyperLinks, v => { ed._hyperLinks = v; LS.set('scm:cm-hyperlinks', String(v)); ed._rebuildExtras(); }),
    $('div', { class: 'ce-s-divider' }),
    sec('Custom theme'),
    buildCustomThemeUI(ed),
  );
  return p;
}

function buildCustomThemeUI(ed) {
  const grid = $('div', { class: 'ce-ct-grid' });
  const labels = {
    bg: 'Background', fg: 'Foreground', caret: 'Cursor', selection: 'Selection',
    gutterBg: 'Gutter bg', gutterFg: 'Gutter fg', lineHi: 'Line highlight',
    keyword: 'Keyword', string: 'String', comment: 'Comment', number: 'Number',
    variable: 'Variable', func: 'Function', type: 'Type', operator: 'Operator',
  };
  const saved = JSON.parse(LS.get('scm:cm-custom-theme', '{}'));
  const state = { ...CT_DEFAULTS, ...saved };

  for (const [k, lbl] of Object.entries(labels)) {
    const picker = $('input', { type: 'color', value: state[k] });
    picker.addEventListener('input', () => { state[k] = picker.value; if (ed._theme === 'custom') ed._applyCustom(state); });
    grid.append($('div', { class: 'ce-ct-row' }, $('label', null, lbl), picker));
  }

  const saveBtn = $('button', { class: 'ce-primary' }, 'Save custom');
  saveBtn.addEventListener('click', () => { LS.set('scm:cm-custom-theme', JSON.stringify(state)); if (ed._theme === 'custom') ed._applyCustom(state); });
  const resetBtn = $('button', null, 'Reset');
  resetBtn.addEventListener('click', () => {
    Object.assign(state, CT_DEFAULTS);
    grid.querySelectorAll('input[type="color"]').forEach((p, i) => { p.value = state[Object.keys(labels)[i]]; });
    LS.set('scm:cm-custom-theme', JSON.stringify(state));
    if (ed._theme === 'custom') ed._applyCustom(state);
  });

  const wrap = $('div');
  wrap.append(grid, $('div', { class: 'ce-s-actions' }, resetBtn, saveBtn));
  return wrap;
}

// ── <code-editor> ─────────────────────────────────────────────────

class CodeEditor extends HTMLElement {
  constructor() {
    super();
    this._view = null;
    this._suppressInput = false;
    this._themeComp = new Compartment();
    this._langComp = new Compartment();
    this._kbComp = new Compartment();
    this._lnComp = new Compartment();
    this._wrapComp = new Compartment();
    this._indentComp = new Compartment();
    this._emmetComp = new Compartment();
    this._fontComp = new Compartment();
    this._extrasComp = new Compartment();
    this._settingsOverlay = null;
    this._settingsPanel = null;

    this._theme = LS.get('scm:cm-theme', 'tokyo-night');
    this._language = LS.get('scm:cm-language', 'html');
    this._keybindings = LS.get('scm:cm-keybindings', 'default');
    this._fontSize = LS.num('scm:cm-font-size', 14);
    this._tabSize = LS.num('scm:cm-tab-size', 2);
    this._lineNumbers = LS.bool('scm:cm-line-numbers', true);
    this._wordWrap = LS.bool('scm:cm-word-wrap', false);
    this._emmet = LS.bool('scm:cm-emmet', true);
    this._indentMarkers = LS.bool('scm:cm-indent-markers', true);
    this._colorExt = LS.bool('scm:cm-color-ext', true);
    this._rainbowBrackets = LS.bool('scm:cm-rainbow', true);
    this._zebraStripes = LS.bool('scm:cm-zebra', false);
    this._hyperLinks = LS.bool('scm:cm-hyperlinks', true);
  }

  connectedCallback() {
    injectCSS();
    this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = cssText;
    this.shadowRoot.append(style);
    this._render();
  }

  disconnectedCallback() {
    if (this._view) { this._view.destroy(); this._view = null; }
    this._closeSettings(); this._closeLangPicker();
  }

  get value() { return this._view ? this._view.state.doc.toString() : ''; }
  set value(v) {
    if (!this._view) return;
    if (v === this._view.state.doc.toString()) return;
    this._suppressInput = true;
    this._view.dispatch({ changes: { from: 0, to: this._view.state.doc.length, insert: v } });
    this._suppressInput = false;
  }

  setLanguage(lang) {
    if (!LANGUAGES[lang]) return;
    this._language = lang; LS.set('scm:cm-language', lang);
    if (this._view) this._view.dispatch({ effects: this._langComp.reconfigure(LANGUAGES[lang]()) });
    this._syncSlLang();
  }

  setTheme(theme) {
    if (!THEMES[theme] && theme !== 'custom') return;
    this._theme = theme; LS.set('scm:cm-theme', theme);
    if (this._view) {
      const ext = theme === 'custom' ? buildCustomTheme(JSON.parse(LS.get('scm:cm-custom-theme', '{}'))) : THEMES[theme];
      this._view.dispatch({ effects: this._themeComp.reconfigure(ext) });
    }
  }

  // ── Internal ──

  _render() {
    const editor = $('div', { class: 'ce-editor' });
    const statusline = $('div', { class: 'ce-statusline' });

    const slLang = $('span', { class: 'ce-sl-lang' }, LANG_LABELS[this._language] || this._language);
    slLang.addEventListener('click', (e) => { e.stopPropagation(); this._toggleLangPicker(); });
    const slCursor = $('span', { class: 'ce-sl-cursor' }, '1:1');
    const slLeft = $('div', { class: 'ce-sl-left' }, slLang, slCursor);

    const gearBtn = $('button', { class: 'ce-sl-gear', title: 'Settings' }, '\u2699');
    gearBtn.addEventListener('click', (e) => { e.stopPropagation(); this._toggleSettings(); });
    const slRight = $('div', { class: 'ce-sl-right' }, gearBtn);

    statusline.append(slLeft, slRight);
    this.shadowRoot.append(editor, statusline);

    this._slLang = slLang;
    this._slCursor = slCursor;
    this._langPicker = null;

    this._buildEditor(editor);
  }

  _buildEditor(parent) {
    const initialDoc = this.getAttribute('value') || '';
    const langFn = LANGUAGES[this._language] || LANGUAGES.html;
    const themeExt = this._theme === 'custom' ? buildCustomTheme(JSON.parse(LS.get('scm:cm-custom-theme', '{}'))) : (THEMES[this._theme] || tokyoNight);
    const kbExt = KB_SETS[this._keybindings] || KB_SETS.default;

    const extensions = [
      this._themeComp.of(themeExt),
      this._langComp.of(langFn()),
      this._kbComp.of(kbExt),
      this._lnComp.of(this._lineNumbers ? lineNumbers() : []),
      this._wrapComp.of(this._wordWrap ? EditorView.lineWrapping : []),
      this._indentComp.of(this._indentMarkers ? indentationMarkers() : []),
      this._emmetComp.of(this._emmet ? abbreviationTracker() : []),
      this._fontComp.of(EditorView.theme({
        '.cm-content': { fontSize: this._fontSize + 'px', lineHeight: '1.6' },
        '.cm-gutters': { fontSize: (this._fontSize - 1) + 'px' },
      })),
      this._extrasComp.of(this._buildExtras()),
      history(), drawSelection(), dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(), bracketMatching(), closeBrackets(),
      autocompletion(), rectangularSelection(), crosshairCursor(),
      highlightActiveLine(), highlightSelectionMatches(), highlightSpecialChars(),
      foldGutter(), lintGutter(),
      indentUnit.of('  '.repeat(Math.min(this._tabSize, 2))),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap,
        ...historyKeymap, ...foldKeymap, ...completionKeymap, ...lintKeymap, indentWithTab]),
      EditorView.updateListener.of((u) => {
        if (u.docChanged && !this._suppressInput) {
          this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        }
        if (u.selectionSet || u.docChanged) this._updateCursor();
      }),
    ];

    this._view = new EditorView({ state: EditorState.create({ doc: initialDoc, extensions }), parent });
    this._updateCursor();
  }

  _buildExtras() {
    const exts = [];
    if (this._colorExt) exts.push(colorView());
    if (this._rainbowBrackets) exts.push(rainbowBrackets());
    if (this._zebraStripes) exts.push(zebraStripes());
    if (this._hyperLinks) exts.push(hyperLinkExtension());
    return exts;
  }

  _updateCursor() {
    if (!this._view || !this._slCursor) return;
    const pos = this._view.state.selection.main.head;
    const line = this._view.state.doc.lineAt(pos);
    this._slCursor.textContent = `${line.number}:${pos - line.from + 1}`;
  }

  _syncSlLang() { if (this._slLang) this._slLang.textContent = LANG_LABELS[this._language] || this._language; }
  _rebuildKB() { if (this._view) this._view.dispatch({ effects: this._kbComp.reconfigure(KB_SETS[this._keybindings] || KB_SETS.default) }); }
  _reconfigureIndent() { if (this._view) this._view.dispatch({ effects: this._indentComp.reconfigure(indentUnit.of('  '.repeat(Math.min(this._tabSize, 2)))) }); }
  _reconfGutters() { if (this._view) this._view.dispatch({ effects: this._lnComp.reconfigure(this._lineNumbers ? lineNumbers() : []) }); }
  _reconfWrap() { if (this._view) this._view.dispatch({ effects: this._wrapComp.reconfigure(this._wordWrap ? EditorView.lineWrapping : []) }); }
  _rebuildExtras() { if (this._view) this._view.dispatch({ effects: this._extrasComp.reconfigure(this._buildExtras()) }); }
  _applyFont() {
    if (!this._view) return;
    this._view.dispatch({ effects: this._fontComp.reconfigure(EditorView.theme({
      '.cm-content': { fontSize: this._fontSize + 'px', lineHeight: '1.6' },
      '.cm-gutters': { fontSize: (this._fontSize - 1) + 'px' },
    })) });
  }
  _applyCustom(colors) { if (this._view) this._view.dispatch({ effects: this._themeComp.reconfigure(buildCustomTheme(colors)) }); }

  _toggleSettings() {
    this._closeLangPicker();
    if (this._settingsPanel) { this._closeSettings(); return; }
    this._settingsOverlay = $('div', { class: 'ce-settings-overlay' });
    this._settingsOverlay.addEventListener('click', () => this._closeSettings());
    this._settingsPanel = buildSettings(this);
    this._settingsPanel.addEventListener('click', (e) => e.stopPropagation());
    this._settingsOverlay.append(this._settingsPanel);
    this.shadowRoot.append(this._settingsOverlay);
  }

  _closeSettings() {
    if (this._settingsOverlay) { this._settingsOverlay.remove(); this._settingsOverlay = null; }
    this._settingsPanel = null;
  }

  _toggleLangPicker() {
    this._closeSettings();
    if (this._langPicker) { this._closeLangPicker(); return; }
    this._langPicker = $('div', { class: 'ce-lang-picker' });
    this._langPicker.addEventListener('click', (e) => e.stopPropagation());
    for (const [k, lbl] of Object.entries(LANG_LABELS)) {
      const btn = $('button', { class: 'ce-lang-opt' + (k === this._language ? ' active' : '') }, lbl);
      btn.addEventListener('click', () => { this.setLanguage(k); this._closeLangPicker(); });
      this._langPicker.append(btn);
    }
    this.shadowRoot.append(this._langPicker);
    this._langPickerOutside = (e) => { if (!e.composedPath().some(n => n === this._langPicker || n === this.shadowRoot)) this._closeLangPicker(); };
    setTimeout(() => document.addEventListener('mousedown', this._langPickerOutside), 0);
  }

  _closeLangPicker() {
    if (this._langPickerOutside) { document.removeEventListener('mousedown', this._langPickerOutside); this._langPickerOutside = null; }
    if (this._langPicker) { this._langPicker.remove(); this._langPicker = null; }
  }
}

customElements.define('code-editor', CodeEditor);
