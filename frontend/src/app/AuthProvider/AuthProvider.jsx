import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../QueryProvider/index.js'
import {
  createUserSession,
  deleteUserSession,
  getUserProfile,
  updateUserSession,
} from '../../services/index.js'
import {
  applyAuthTokenProvider,
  clearSessionTokens,
  readSessionTokens,
  resetAuthTokenProviderToDefault,
  setSessionTokens,
} from './authSession.js'

const AuthContext = createContext(null)

const isUnauthorizedError = (error) => Number(error?.status) === 401

const AuthProvider = ({ children }) => {
  const initialTokens = readSessionTokens()
  const queryClient = useQueryClient()
  const refreshPromiseRef = useRef(null)

  const [accessToken, setAccessToken] = useState(initialTokens.accessToken)
  const [refreshToken, setRefreshToken] = useState(initialTokens.refreshToken)
  const [currentUser, setCurrentUser] = useState(null)
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
    }

    setAuthError(null)
  }, [])

  const clearSession = useCallback(() => {
    clearSessionTokens()

    setAccessToken(null)
    setRefreshToken(null)
    setCurrentUser(null)

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
          setIsInitializing(false)
          setAuthError(null)
        }
        return
      }

      if (!isCancelled) {
        setIsInitializing(true)
      }

      try {
        await loadCurrentUser()
        if (!isCancelled) {
          setAuthError(null)
        }
      } catch (error) {
        if (!isUnauthorizedError(error) || !refreshToken) {
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
        } catch (refreshError) {
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
  }, [accessToken, clearSession, loadCurrentUser, refreshSession, refreshToken])

  const isAuthenticated = Boolean(accessToken && currentUser)

  const authValue = useMemo(
    () => ({
      signIn,
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
      signOut,
    ],
  )

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
