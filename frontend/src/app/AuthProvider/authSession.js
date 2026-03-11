import { resetAuthTokenProvider, setAuthTokenProvider } from '../../services/index.js'

const SESSION_STORAGE_KEYS = Object.freeze({
  accessToken: 'tripPlannerAccessToken',
  refreshToken: 'tripPlannerRefreshToken',
  currentUser: 'tripPlannerCurrentUser',
})

let inMemoryAccessToken = null

const getStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  return window.localStorage
}

const readSessionTokens = () => {
  const storage = getStorage()
  const accessToken = storage?.getItem(SESSION_STORAGE_KEYS.accessToken) || null
  const refreshToken = storage?.getItem(SESSION_STORAGE_KEYS.refreshToken) || null

  return {
    accessToken,
    refreshToken,
  }
}

const readStoredUser = () => {
  const storage = getStorage()
  const rawUser = storage?.getItem(SESSION_STORAGE_KEYS.currentUser)

  if (!rawUser) {
    return null
  }

  try {
    const parsed = JSON.parse(rawUser)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const setSessionTokens = ({ accessToken = null, refreshToken = null } = {}) => {
  const storage = getStorage()
  inMemoryAccessToken = accessToken || null

  if (!storage) {
    return
  }

  if (accessToken) {
    storage.setItem(SESSION_STORAGE_KEYS.accessToken, accessToken)
  } else {
    storage.removeItem(SESSION_STORAGE_KEYS.accessToken)
  }

  if (refreshToken) {
    storage.setItem(SESSION_STORAGE_KEYS.refreshToken, refreshToken)
  } else {
    storage.removeItem(SESSION_STORAGE_KEYS.refreshToken)
  }
}

const setStoredUser = (user = null) => {
  const storage = getStorage()

  if (!storage) {
    return
  }

  if (user && typeof user === 'object') {
    storage.setItem(SESSION_STORAGE_KEYS.currentUser, JSON.stringify(user))
    return
  }

  storage.removeItem(SESSION_STORAGE_KEYS.currentUser)
}

const clearSessionTokens = () => {
  inMemoryAccessToken = null

  const storage = getStorage()
  if (!storage) {
    return
  }

  storage.removeItem(SESSION_STORAGE_KEYS.accessToken)
  storage.removeItem(SESSION_STORAGE_KEYS.refreshToken)
  storage.removeItem(SESSION_STORAGE_KEYS.currentUser)
}

const getAccessToken = () => inMemoryAccessToken || readSessionTokens().accessToken

const applyAuthTokenProvider = () => {
  setAuthTokenProvider(() => getAccessToken())
}

const resetAuthTokenProviderToDefault = () => {
  resetAuthTokenProvider()
}

export {
  SESSION_STORAGE_KEYS,
  applyAuthTokenProvider,
  clearSessionTokens,
  getAccessToken,
  readSessionTokens,
  readStoredUser,
  resetAuthTokenProviderToDefault,
  setSessionTokens,
  setStoredUser,
}
