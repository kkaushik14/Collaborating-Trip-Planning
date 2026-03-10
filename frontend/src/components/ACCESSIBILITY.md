# Component Accessibility & UX Checklist

This checklist is mandatory for all component work under `frontend/src/components/`.

Source rules (from provided sheet):
- Semantic HTML: use meaningful elements.
- ARIA: add only when needed for context (for example, decorative icons use `aria-hidden="true"`).
- Focus: `document.activeElement` should be predictable.
- Keyboard: flows must work with keyboard only (minimum: `Tab` and `Enter`).

## Manual Enforcement Workflow

For every component create/update:
1. Implement UI.
2. Run the checklist below while testing manually in browser.
3. Copy the sign-off template (last section) into PR notes or task notes.
4. Do not mark component done until all required boxes are checked.

## Global Checklist (Apply To Every Component)

### Semantic HTML
- [ ] Correct native element is used (`button`, `a`, `input`, `label`, `table`, `th`, etc.) instead of generic `div`/`span`.
- [ ] Headings follow logical order and do not skip levels in page context.
- [ ] Forms use explicit labels (`label` + `htmlFor` / `id`).
- [ ] Lists/tables are represented with real list/table semantics.

### ARIA
- [ ] No unnecessary ARIA on native semantic controls.
- [ ] Decorative icons/images have `aria-hidden="true"` (or empty alt for decorative images).
- [ ] Icon-only controls have an accessible name (`aria-label` or visible/sr-only text).
- [ ] Dynamic UI state is exposed where needed (`aria-expanded`, `aria-controls`, `aria-selected`, `aria-invalid`).

### Focus
- [ ] Focus ring is visible and consistent with design tokens.
- [ ] Focus order is logical and matches visual order.
- [ ] On open/close of overlay components (Dialog/Sheet/Popover), focus is moved and restored predictably.
- [ ] No keyboard trap unless intentional modal trap is active.

### Keyboard
- [ ] Entire interaction works without mouse.
- [ ] `Tab` / `Shift+Tab` navigate all interactive elements in order.
- [ ] `Enter` activates primary controls.
- [ ] `Space` activates buttons/checkboxes/toggles where expected.
- [ ] `Escape` closes dismissible overlays.

### UX Baseline
- [ ] Interactive target sizes are practical for click/tap.
- [ ] Error/help/status text is clear and located near related control.
- [ ] Loading/disabled states are visually and semantically clear.
- [ ] Color is not the only way to convey critical meaning.

## Component-Type Specific Checks

### Button / Link
- [ ] Action uses `button`; navigation uses `a`.
- [ ] Disabled state is semantic (`disabled` for button, not only CSS).
- [ ] Link text communicates destination.

### Input / Textarea / Checkbox
- [ ] Every control has label text.
- [ ] Validation state uses semantic attributes (`aria-invalid`) and visible message.
- [ ] Checkbox state is keyboard-toggleable and announced correctly.

### Dialog / Sheet / Popover / Tooltip / Dropdown
- [ ] Trigger is keyboard accessible.
- [ ] Open state moves focus into component.
- [ ] Close returns focus to trigger.
- [ ] Background interaction is blocked for modal dialogs/sheets.
- [ ] Tooltip content is supplemental, not the only place critical info exists.

### Tabs
- [ ] Active tab has clear selected state.
- [ ] Tab buttons are keyboard reachable and announce selected state.
- [ ] Tab panel content is associated with correct tab.

### Table
- [ ] Header cells use `th` and correct scope/context.
- [ ] Column meanings are understandable without visual styling alone.

### Drag & Drop (Sortable Activity List)
- [ ] Reorder flow still has a keyboard-usable alternative path.
- [ ] Drag handle has accessible name.
- [ ] Reordered result is visually obvious.

## Manual Sign-Off Template

Paste this for each component PR/update:

```md
Component: <name>
Path: <file path>

- [ ] Semantic HTML verified
- [ ] ARIA verified
- [ ] Focus behavior verified
- [ ] Keyboard behavior verified (Tab + Enter minimum)
- [ ] UX baseline verified

Notes:
- Keyboard test result:
- Focus behavior notes:
- Known limitation (if any):
```
