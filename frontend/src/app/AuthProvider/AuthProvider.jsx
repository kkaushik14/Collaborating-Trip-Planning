import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../QueryProvider/index.js'
import {
  createUserAccount,
  createUserSession,
  deleteUserSession,
  getUserProfile,
  updateUserSession,
} from '../../services/index.js'
import {
  applyAuthTokenProvider,
  clearSessionTokens,
  readStoredUser,
  readSessionTokens,
  resetAuthTokenProviderToDefault,
  setSessionTokens,
  setStoredUser,
} from './authSession.js'
import { clearAllFormDrafts } from '../../components/forms/form-utils.js'

const AuthContext = createContext(null)

const isUnauthorizedError = (error) => Number(error?.status) === 401
const isRetryableAuthError = (error) =>
  Number(error?.status) === 429 || Boolean(error?.isNetworkError) || Boolean(error?.isTimeout)

const REFRESH_BURST_WINDOW_MS = 15_000
const REFRESH_BURST_THRESHOLD = 5
const REFRESH_BURST_DELAY_MS = 2_000
const REFRESH_BURST_SESSION_KEY = 'tripPlannerRefreshBursts'

const sleep = (durationMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })

const getRefreshBurstDelayMs = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return 0
  }

  const now = Date.now()
  const raw = window.sessionStorage.getItem(REFRESH_BURST_SESSION_KEY)
  let timestamps = []

  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        timestamps = parsed
      }
    } catch {
      timestamps = []
    }
  }

  const nextTimestamps = [...timestamps, now].filter((value) =>
    Number.isFinite(value) && now - Number(value) <= REFRESH_BURST_WINDOW_MS,
  )

  window.sessionStorage.setItem(REFRESH_BURST_SESSION_KEY, JSON.stringify(nextTimestamps))
  return nextTimestamps.length >= REFRESH_BURST_THRESHOLD ? REFRESH_BURST_DELAY_MS : 0
}

const AuthProvider = ({ children }) => {
  const initialTokens = readSessionTokens()
  const initialStoredUser = readStoredUser()
  const queryClient = useQueryClient()
  const refreshPromiseRef = useRef(null)

  const [accessToken, setAccessToken] = useState(initialTokens.accessToken)
  const [refreshToken, setRefreshToken] = useState(initialTokens.refreshToken)
  const [currentUser, setCurrentUser] = useState(initialStoredUser)
  const [isInitializing, setIsInitializing] = useState(true)
  const [authError, setAuthError] = useState(null)

  const applySession = useCallback((tokens = {}, user = undefined) => {
    const nextAccessToken = tokens.accessToken || null
    const nextRefreshToken = tokens.refreshToken || null

    setSessionTokens({
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
    })

    setAccessToken(nextAccessToken)
    setRefreshToken(nextRefreshToken)

    if (user !== undefined) {
      setCurrentUser(user)
      setStoredUser(user || null)
    }

    setAuthError(null)
  }, [])

  const clearSession = useCallback(() => {
    clearSessionTokens()
    clearAllFormDrafts()

    setAccessToken(null)
    setRefreshToken(null)
    setCurrentUser(null)
    setStoredUser(null)

    queryClient.removeQueries({ queryKey: queryKeys.auth.root(), exact: false })
    queryClient.removeQueries({ queryKey: queryKeys.invitations.root(), exact: false })
    queryClient.removeQueries({ queryKey: queryKeys.trips.root(), exact: false })
    queryClient.removeQueries({ queryKey: ['itinerary'], exact: false })
    queryClient.removeQueries({ queryKey: ['collaboration'], exact: false })
    queryClient.removeQueries({ queryKey: ['organization'], exact: false })
    queryClient.removeQueries({ queryKey: ['analytics'], exact: false })
  }, [queryClient])

  const refreshSession = useCallback(async () => {
    if (!refreshToken) {
      throw new Error('Refresh token is not available')
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    refreshPromiseRef.current = (async () => {
      const refreshed = await updateUserSession({ refreshToken })
      const nextTokens = refreshed?.tokens || {}

      if (!nextTokens.accessToken || !nextTokens.refreshToken) {
        throw new Error('Refresh response did not include required tokens')
      }

      applySession(nextTokens)
      return nextTokens
    })()
      .finally(() => {
        refreshPromiseRef.current = null
      })

    return refreshPromiseRef.current
  }, [applySession, refreshToken])

  const loadCurrentUser = useCallback(async () => {
    const profile = await getUserProfile()
    setCurrentUser(profile?.user || null)
    setStoredUser(profile?.user || null)
    queryClient.setQueryData(queryKeys.auth.me(), profile)
    return profile?.user || null
  }, [queryClient])

  const signIn = useCallback(
    async (credentials) => {
      const response = await createUserSession(credentials)
      const tokens = response?.tokens || {}
      const user = response?.user || null

      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error('Sign in response did not include required tokens')
      }

      applySession(tokens, user)
      queryClient.setQueryData(queryKeys.auth.me(), { user })

      return {
        user,
        tokens,
      }
    },
    [applySession, queryClient],
  )

  const signUp = useCallback(
    async (registrationInput) => {
      const response = await createUserAccount(registrationInput)
      const tokens = response?.tokens || {}
      const user = response?.user || null

      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error('Sign up response did not include required tokens')
      }

      applySession(tokens, user)
      queryClient.setQueryData(queryKeys.auth.me(), { user })

      return {
        user,
        tokens,
      }
    },
    [applySession, queryClient],
  )

  const signOut = useCallback(async () => {
    try {
      if (accessToken) {
        await deleteUserSession()
      }
    } catch {
      // Ignore network/session termination failures and always clear client state.
    } finally {
      clearSession()
    }
  }, [accessToken, clearSession])

  useEffect(() => {
    applyAuthTokenProvider()

    return () => {
      resetAuthTokenProviderToDefault()
    }
  }, [])

  useEffect(() => {
    setSessionTokens({
      accessToken,
      refreshToken,
    })
  }, [accessToken, refreshToken])

  useEffect(() => {
    let isCancelled = false

    const bootstrapSession = async () => {
      if (!accessToken) {
        if (!isCancelled) {
          setCurrentUser(null)
          setStoredUser(null)
          setIsInitializing(false)
          setAuthError(null)
        }
        return
      }

      if (!isCancelled) {
        setIsInitializing(true)
      }

      const burstDelayMs = getRefreshBurstDelayMs()
      if (burstDelayMs > 0) {
        await sleep(burstDelayMs)
      }

      try {
        await loadCurrentUser()
        if (!isCancelled) {
          setAuthError(null)
        }
      } catch (initialError) {
        let error = initialError

        if (isRetryableAuthError(error)) {
          await sleep(2_000)
          try {
            await loadCurrentUser()
            if (!isCancelled) {
              setAuthError(null)
            }
            return
          } catch (retryError) {
            error = retryError
          }
        }

        if (!isUnauthorizedError(error) || !refreshToken) {
          const hasCachedUser = Boolean(readStoredUser())

          if (isRetryableAuthError(error) && hasCachedUser) {
            if (!isCancelled) {
              setAuthError(null)
            }
            return
          }

          if (!isCancelled) {
            clearSession()
            setAuthError(error)
          }
          return
        }

        try {
          await refreshSession()
          await loadCurrentUser()
          if (!isCancelled) {
            setAuthError(null)
          }
        } catch (initialRefreshError) {
          let refreshError = initialRefreshError

          if (isRetryableAuthError(refreshError)) {
            await sleep(2_000)

            try {
              await refreshSession()
              await loadCurrentUser()
              if (!isCancelled) {
                setAuthError(null)
              }
              return
            } catch (retryRefreshError) {
              refreshError = retryRefreshError
            }
          }

          const latestStoredTokens = readSessionTokens()
          const hasRotatedRefreshToken = Boolean(
            latestStoredTokens.refreshToken && latestStoredTokens.refreshToken !== refreshToken,
          )

          if (isUnauthorizedError(refreshError) && hasRotatedRefreshToken) {
            try {
              applySession({
                accessToken: latestStoredTokens.accessToken,
                refreshToken: latestStoredTokens.refreshToken,
              })
              await loadCurrentUser()
              if (!isCancelled) {
                setAuthError(null)
              }
              return
            } catch (retryWithLatestStoredTokenError) {
              refreshError = retryWithLatestStoredTokenError
            }
          }

          const hasCachedUser = Boolean(readStoredUser())
          if (isRetryableAuthError(refreshError) && hasCachedUser) {
            if (!isCancelled) {
              setAuthError(null)
            }
            return
          }

          if (!isCancelled) {
            clearSession()
            setAuthError(refreshError)
          }
        }
      } finally {
        if (!isCancelled) {
          setIsInitializing(false)
        }
      }
    }

    bootstrapSession()

    return () => {
      isCancelled = true
    }
  }, [accessToken, applySession, clearSession, loadCurrentUser, refreshSession, refreshToken])

  const isAuthenticated = Boolean(accessToken && currentUser)

  const authValue = useMemo(
    () => ({
      signIn,
      signUp,
      signOut,
      refreshSession,
      currentUser,
      isAuthenticated,
      isInitializing,
      authError,
      accessToken,
      refreshToken,
    }),
    [
      accessToken,
      authError,
      currentUser,
      isAuthenticated,
      isInitializing,
      refreshSession,
      refreshToken,
      signIn,
      signUp,
      signOut,
    ],
  )

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
