import { QueryClientProvider } from '@tanstack/react-query'

import { queryClient } from './queryClient.js'

const QueryProvider = ({ children, client = queryClient }) => {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export { QueryProvider }
