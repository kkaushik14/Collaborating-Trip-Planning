# UI Store (Context + useReducer)

This store is only for cross-cutting UI state:

- theme mode (`light`/`dark`)
- modal open/close state with payload
- toast queue lifecycle

Toast rendering:
- Toast records are rendered by `frontend/src/components/common/ToastViewport.jsx`.
- `ToastViewport` is mounted globally in `frontend/src/main.jsx` so notifications persist across route transitions.

Not allowed in this store:

- API payload caching
- backend entities (`trips`, `members`, `expenses`, etc.)

Server-state remains in TanStack Query.

## Theme lifecycle

- The UI provider initializes `light` or `dark` from `localStorage['tripPlanner.theme']`.
- Invalid/missing values fall back to dark. Blocked storage does not break rendering or toggling.
- The provider applies `data-theme` on the document root before React paints, including public routes. CSS tokens set the corresponding native `color-scheme`.
- Valid storage events synchronize other tabs. `MainLayout` hydrates valid authenticated profile preferences and retains its existing profile mutation/rollback flow.
- `ThemeToggle` is presentational (`theme`, `onToggle`, `disabled`); public pages own state wiring. `AuthPageShell` accepts optional `theme`, `onToggle`, and `themeToggleDisabled` props.
- This does not add an HTML bootstrap script; the initial HTML can still show the default dark background before React loads. Avoid claiming zero pre-hydration theme flash.

## Toast lifecycle

- `durationMs: 0` keeps a toast until explicitly dismissed. Missing/invalid durations use 4000 ms.
- Timers pause on hover or focus and resume the remaining duration.
- Visual surfaces are opaque, and separate persistent polite/assertive live regions announce notifications without nesting live regions.
