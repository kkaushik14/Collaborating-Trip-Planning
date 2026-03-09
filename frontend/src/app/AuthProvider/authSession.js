import { resetAuthTokenProvider, setAuthTokenProvider } from '../../services/index.js'

const SESSION_STORAGE_KEYS = Object.freeze({
  accessToken: 'tripPlannerAccessToken',
  refreshToken: 'tripPlannerRefreshToken',
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

const clearSessionTokens = () => {
  inMemoryAccessToken = null

  const storage = getStorage()
  if (!storage) {
    return
  }

  storage.removeItem(SESSION_STORAGE_KEYS.accessToken)
  storage.removeItem(SESSION_STORAGE_KEYS.refreshToken)
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
  resetAuthTokenProviderToDefault,
  setSessionTokens,
}
