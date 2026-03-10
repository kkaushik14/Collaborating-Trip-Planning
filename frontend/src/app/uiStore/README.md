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
