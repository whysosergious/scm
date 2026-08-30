# TODO — SCM Page Editor

## Completed

- Page model, canvas, tree, palette, inspector, box model
- Same-origin iframe canvas with pointer event delegation
- Drag-and-drop across iframe boundary
- Targeted DOM patching (patchNode/patchBodyAttrs) for performance
- SVG component (import, render, CodeMirror editor, selection outline)
- HTML import with full fidelity (parser, modal, all standard elements, SVG innerHTML)
- Whitespace handling (normalize, merge, drop around blocks, nbsp normalization)
- CodeMirror 6 vendor bundle (languages, themes, SVG editor)
- Head element management (stylesheet, style, meta, script)
- Body inspector (classes, styles, attributes)
- Class assignment and management
- Tree keyboard navigation
- Implicit `<body>` and root nodes
- Index page non-deletable

## Remaining (if needed)

- External script loading in canvas (defer/async) — works for Tailwind CDN, other scripts need testing
- SVG selection via elementFromPoint (unsolved — pointer-events CSS insufficient)
- Editor-src npm project cleanup (ProseMirror source still in web/editor-src/)

## Bugs / Improvements

- SVG not selectable by click in canvas (pointer-events:all applied but elementFromPoint misses)
