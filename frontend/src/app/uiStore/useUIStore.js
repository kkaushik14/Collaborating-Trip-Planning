import { useContext } from 'react'

import { UIStoreContext } from './UIStoreProvider.jsx'

const useUIStore = () => {
  const context = useContext(UIStoreContext)

  if (!context) {
    throw new Error('useUIStore must be used within a UIStoreProvider')
  }

  return context
}

export { useUIStore }
