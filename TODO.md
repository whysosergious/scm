# Page Editor TODO

All items from the original plan have been implemented.

---

## Completed

### P0: Unsaved-changes guards ✓

- `beforeunload` handler warns on tab close/refresh when dirty
- Page switch in sidebar prompts save/discard/cancel
- Project switch prompts save/discard/cancel
- Dirty state tracked globally via `state.pageDirty`

### P1: Reusable class management UI ✓

- Create class with name (auto-generated default)
- Rename class (updates all node references)
- Edit class styles (full CSS property picker, same as node styles)
- Edit class label and description
- Delete class (removes from nodes that use it)
- Assign/remove class from node (checkboxes in inspector)

### P2: HTML import UI ✓

- "Import HTML" button in the page editor toolbar
- Modal with textarea for pasting HTML or file picker
- Calls existing `api.importPage()` backend
- Shows warnings from the import process
- Auto-opens the imported page on success

### P3: DOM tree keyboard navigation ✓

- Arrow Up/Down: move focus between visible tree items
- Arrow Right: expand collapsed node or move to first child
- Arrow Left: collapse expanded node or move to parent
- Enter: select focused node/head element
- Delete/Backspace: remove focused node (with confirm)
- Visual focus indicator (outline, separate from selection highlight)
- Persistent collapsed state across re-renders

### P5: Non-drag add controls ✓

- "+" button on tree nodes (visible on hover) for adding children

### Canvas UX improvements ✓

- BM buttons (d/p/m) always on element right edge, uppercase monospace
- BM panels moved from canvas overlay to inspector (under Styles)
- Escape key exits active BM mode or deselects node
- Click on canvas background deselects node
- Transform control frame with 8 handles around element when BM mode active

---

## In progress

### Canvas UX remaining

- P7: Drop zones visible only during dragging, proximity-based (non-text only)

---

## Removed (out of scope)

### P4: html5ever parser upgrade

Deferred — current byte-level parser handles well-formed HTML. Can be revisited later.

### P6: Responsive styles

Deferred — explicitly out of scope for v1 per spec §15.
