import { useAuth } from '../app/AuthProvider/index.js'
import { useUIStore } from '../app/uiStore/index.js'

// Signed-in profile preferences continue to be managed by the account menu.
const usePublicTheme = () => {
  const { isAuthenticated } = useAuth()
  const { state, toggleTheme } = useUIStore()
  return { theme: state.theme, onToggle: isAuthenticated ? undefined : toggleTheme }
}

export { usePublicTheme }
