# Query Provider

This folder is the central server-state entry point for frontend.

- `QueryProvider.jsx`: wraps React app with TanStack `QueryClientProvider`.
- `queryClient.js`: shared `QueryClient` instance and default query/mutation behavior.
- `queryKeys.js`: authoritative query-key factory for all resources.
- `CACHE_INVALIDATION.md`: mutation-to-invalidation matrix.

Root integration is in `frontend/src/main.jsx`:

```jsx
<QueryProvider>
  <App />
</QueryProvider>
```
