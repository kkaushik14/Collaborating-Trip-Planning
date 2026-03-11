import { apiRequest, ensureObject } from './service-utils.js'

const normalizeEntity = (value) => {
  const entity = ensureObject(value)
  return Object.keys(entity).length ? entity : null
}

const normalizeAuthResponse = (value) => {
  const payload = ensureObject(value)
  return {
    user: normalizeEntity(payload.user),
    tokens: normalizeEntity(payload.tokens),
  }
}

const normalizeRefreshResponse = (value) => {
  const payload = ensureObject(value)
  return {
    tokens: normalizeEntity(payload.tokens),
  }
}

const normalizeCurrentUserResponse = (value) => {
  const payload = ensureObject(value)
  return {
    user: normalizeEntity(payload.user),
  }
}

const normalizeProfileUpdateResponse = (value) => {
  const payload = ensureObject(value)
  return {
    user: normalizeEntity(payload.user),
  }
}

const createUserAccount = (body, options = {}) =>
  apiRequest(
    {
      path: '/api/v1/auth/register',
      method: 'POST',
      body,
      skipAuth: true,
      ...options,
    },
    {
      resource: 'auth',
      operation: 'createUserAccount',
      defaultData: {},
      normalize: normalizeAuthResponse,
    },
  )

const createUserSession = (body, options = {}) =>
  apiRequest(
    {
      path: '/api/v1/auth/login',
      method: 'POST',
      body,
      skipAuth: true,
      ...options,
    },
    {
      resource: 'auth',
      operation: 'createUserSession',
      defaultData: {},
      normalize: normalizeAuthResponse,
    },
  )

const updateUserSession = (body, options = {}) =>
  apiRequest(
    {
      path: '/api/v1/auth/refresh',
      method: 'POST',
      body,
      skipAuth: true,
      ...options,
    },
    {
      resource: 'auth',
      operation: 'updateUserSession',
      defaultData: {},
      normalize: normalizeRefreshResponse,
    },
  )

const deleteUserSession = (options = {}) =>
  apiRequest(
    {
      path: '/api/v1/auth/logout',
      method: 'POST',
      ...options,
    },
    {
      resource: 'auth',
      operation: 'deleteUserSession',
      defaultData: null,
      normalize: () => ({ success: true }),
    },
  )

const getUserProfile = (options = {}) =>
  apiRequest(
    {
      path: '/api/v1/auth/me',
      method: 'GET',
      ...options,
    },
    {
      resource: 'auth',
      operation: 'getUserProfile',
      defaultData: {},
      normalize: normalizeCurrentUserResponse,
    },
  )

const updateUserProfile = (body, options = {}) =>
  apiRequest(
    {
      path: '/api/v1/auth/me',
      method: 'PATCH',
      body,
      ...options,
    },
    {
      resource: 'auth',
      operation: 'updateUserProfile',
      defaultData: {},
      normalize: normalizeProfileUpdateResponse,
    },
  )

export {
  createUserAccount,
  createUserSession,
  deleteUserSession,
  getUserProfile,
  updateUserProfile,
  updateUserSession,
}
