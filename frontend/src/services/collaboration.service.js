import { apiRequest, ensureArray, ensureObject } from './service-utils.js'

const normalizeEntity = (value) => {
  const entity = ensureObject(value)
  return Object.keys(entity).length ? entity : null
}

const createTripInvitation = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/invitations`,
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'collaboration',
      operation: 'createTripInvitation',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          invitation: normalizeEntity(payload.invitation),
          inviteToken: payload.inviteToken || null,
          inviteUrl: payload.inviteUrl || null,
        }
      },
    },
  )

const listTripInvitations = (tripId, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/invitations`,
      method: 'GET',
      ...options,
    },
    {
      resource: 'collaboration',
      operation: 'listTripInvitations',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          invitations: ensureArray(payload.invitations),
        }
      },
    },
  )

const listTripMembers = (tripId, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/members`,
      method: 'GET',
      ...options,
    },
    {
      resource: 'collaboration',
      operation: 'listTripMembers',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          members: ensureArray(payload.members),
        }
      },
    },
  )

const updateTripMemberRole = (tripId, memberId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/members/${memberId}/role`,
      method: 'PATCH',
      body,
      ...options,
    },
    {
      resource: 'collaboration',
      operation: 'updateTripMemberRole',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          member: normalizeEntity(payload.member),
        }
      },
    },
  )

const deleteTripMember = (tripId, memberId, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/members/${memberId}`,
      method: 'DELETE',
      ...options,
    },
    {
      resource: 'collaboration',
      operation: 'deleteTripMember',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          member: normalizeEntity(payload.member),
        }
      },
    },
  )

const createTripMemberReactivation = (tripId, memberId, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/members/${memberId}/reactivate`,
      method: 'POST',
      ...options,
    },
    {
      resource: 'collaboration',
      operation: 'createTripMemberReactivation',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          member: normalizeEntity(payload.member),
        }
      },
    },
  )

const createTripOwnershipTransfer = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/ownership/transfer`,
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'collaboration',
      operation: 'createTripOwnershipTransfer',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          trip: normalizeEntity(payload.trip),
          previousOwnerMember: normalizeEntity(payload.previousOwnerMember),
          newOwnerMember: normalizeEntity(payload.newOwnerMember),
        }
      },
    },
  )

const createTripComment = (tripId, body, options = {}) =>
  apiRequest(
    {
      path: `/api/v1/trips/${tripId}/comments`,
      method: 'POST',
      body,
      ...options,
    },
    {
      resource: 'collaboration',
      operation: 'createTripComment',
      defaultData: {},
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          comment: normalizeEntity(payload.comment),
        }
      },
    },
  )

const listTripComments = async (tripId, query = {}, options = {}) => {
  const response = await apiRequest(
    {
      path: `/api/v1/trips/${tripId}/comments`,
      method: 'GET',
      query,
      ...options,
    },
    {
      resource: 'collaboration',
      operation: 'listTripComments',
      defaultData: {},
      includeEnvelope: true,
      normalize: (value) => {
        const payload = ensureObject(value)
        return {
          comments: ensureArray(payload.comments),
        }
      },
    },
  )

  return {
    comments: response.data.comments,
    meta: response.meta,
  }
}

export {
  createTripComment,
  createTripInvitation,
  createTripMemberReactivation,
  createTripOwnershipTransfer,
  deleteTripMember,
  listTripComments,
  listTripInvitations,
  listTripMembers,
  updateTripMemberRole,
}
