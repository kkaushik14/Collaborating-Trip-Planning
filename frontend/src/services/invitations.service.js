import { apiRequest, ensureArray, ensureObject } from './service-utils.js'

const normalizeEntity = (value) => {
  const entity = ensureObject(value)
  return Object.keys(entity).length ? entity : null
}

const listMyInvitations = (options = {}) =>
  apiRequest(
    {
      path: '/api/v1/invitations/mine',
      method: 'GET',
      ...options,
    },
    {
      resource: 'invitations',
      operation: 'listMyInvitations',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          invitations: ensureArray(payload.invitations),
        }
      },
    },
  )

const createInvitationAcceptance = (body, options = {}) =>
  apiRequest(
    {
      path: '/api/v1/invitations/accept',
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'invitations',
      operation: 'createInvitationAcceptance',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          invitation: normalizeEntity(payload.invitation),
          member: normalizeEntity(payload.member),
        }
      },
    },
  )

export {
  createInvitationAcceptance,
  listMyInvitations,
}
