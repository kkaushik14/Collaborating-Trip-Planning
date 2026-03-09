# Client Store (Redux Toolkit)

This Redux store is intentionally minimal and only for complex client-side flows:

- cart-like transient state
- multi-step form progress/draft state

Not allowed:

- duplicating backend API responses
- storing TanStack Query server-state in Redux

Server-state stays in TanStack Query. Redux here is for ephemeral/cross-cutting client logic only.
