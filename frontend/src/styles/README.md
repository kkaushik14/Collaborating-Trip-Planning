# Shared theme and responsive audit

`tokens.css` owns semantic colors for both themes. `tokens.js` mirrors the default palette and supplies spacing, typography, radius, and breakpoint references to Tailwind. Keep Montserrat, copper accents, near-black/charcoal dark surfaces with subtle navy decoration, and the light-theme brown action palette.

## Dark surfaces

Canvas is `#0A0B0F`, panel is `#11131A`, and raised/muted panel is `#1A1D27`. Hero gradient endpoints use the same near-black/charcoal palette instead of saturated navy. The secondary glow and neutral accent retain `#272D58`; primary copper actions are unchanged. Light-theme overrides are unchanged.

Muted text/icons use `#BEBCC4` (RGB 190 188 196), with a minimum 8.95:1 contrast on these three surfaces. Standard opaque borders have a minimum 3.04:1 contrast, and strong control borders have a minimum 5.35:1. Border opacity modifiers lower the rendered contrast, so essential control boundaries should use opaque tokens. Disabled surfaces are charcoal rather than blue, with 5.38:1 text contrast.

## Action tokens

Use `--color-action-primary`, `--color-action-primary-hover`, and `--color-on-primary` together for primary actions. Do not infer their foreground from `ink-inverse` or reuse the old dark brown fill in dark mode. `--color-primary` is the accessible accent for text, icons, and focus indicators.

Dark primary actions use bright copper so enabled controls do not resemble disabled controls. Disabled controls use opaque `--color-action-disabled` and `--color-on-disabled` tokens, plus native disabled semantics, rather than reducing the opacity of the enabled action.

Measured sRGB contrast ratios:

| Pair | Dark | Light |
| --- | ---: | ---: |
| Primary action text/fill | 7.40:1 | 5.58:1 |
| Primary hover text/fill | 9.26:1 | 7.32:1 |
| Disabled text/fill | 5.38:1 | 4.32:1 |
| Enabled/disabled fills | 5.56:1 | 4.95:1 |
| Enabled fill/panel | 7.76:1 | 6.36:1 |
| Disabled fill/panel | 1.39:1 | 1.28:1 |

Disabled controls are exempt from the normal text-contrast requirement. Tests require at least 4.5:1 for enabled foregrounds on standard surfaces and primary action labels, and 3:1 for strong control boundaries. These numeric checks do not replace browser checks for gradients, overlays, opacity, or user-provided colors.

## Shared behavior

- Native controls use root `color-scheme`; strong input borders and opaque focus indicators preserve visibility in both themes.
- Dialogs/sheets bound height to dynamic viewport size and scroll internally. Floating popups use Base UI available-space variables.
- Cards and form wrappers allow their grid/flex tracks to shrink. Tables expose named, keyboard-reachable horizontal scroll regions.
- Reduced-motion preferences suppress both utility animations and transitions.
- The main layout includes a skip link and labeled navigation. Auth forms retain a visible top-level heading on mobile.

## Verification and handoff

Regression suites cover token contrast/parity, persistent themes and blocked storage, duplicate field names across separate forms, checkbox label/keyboard behavior, menu/dialog/tab keyboard flows, table scrolling semantics, toast timers/live regions, honest footer destinations, and collaboration controls.

No browser tooling was used for this subtask. The main agent owns actual desktop/mobile/zoom checks, native picker appearance, screen-reader checks, public-page theme wiring, page copy, and deployment. The existing auth shell's "real time" marketing copy was flagged to the main agent rather than changed as part of styling work.
