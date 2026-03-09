import { QueryClient } from '@tanstack/react-query'

const DEFAULT_QUERY_STALE_TIME_MS = 30 * 1000
const DEFAULT_QUERY_GC_TIME_MS = 5 * 60 * 1000

const shouldRetryQuery = (failureCount, error) => {
  const status = Number(error?.status || 0)

  if (status >= 400 && status < 500) {
    return false
  }

  return failureCount < 2
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_QUERY_STALE_TIME_MS,
        gcTime: DEFAULT_QUERY_GC_TIME_MS,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  })

const queryClient = createQueryClient()

export { createQueryClient, queryClient }
