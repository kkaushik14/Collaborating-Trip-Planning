# UI Store (Context + useReducer)

This store is only for cross-cutting UI state:

- theme mode (`light`/`dark`)
- modal open/close state with payload
- toast queue lifecycle

Not allowed in this store:

- API payload caching
- backend entities (`trips`, `members`, `expenses`, etc.)

Server-state remains in TanStack Query.
