import { DEFAULT_THEME, initialUIState } from './initialState.js'

const THEME_STORAGE_KEY = 'tripPlanner.theme'
const isTheme = (theme) => theme === 'light' || theme === 'dark'

function initializeUIState() {
  let theme = DEFAULT_THEME
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(saved)) theme = saved
  } catch {
    // Storage can be unavailable in private/embedded contexts and during SSR.
  }
  return { ...initialUIState, theme }
}

export { initializeUIState, isTheme, THEME_STORAGE_KEY }
