import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../app/QueryProvider/index.js'
import { createInvitationAcceptance, listMyInvitations } from '../services/index.js'
import { createMutationConfig, invalidateQueryScopes } from './hook-utils.js'

const useMyInvitations = ({ queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.invitations.mine(),
    queryFn: () => listMyInvitations(requestOptions),
    ...queryOptions,
  })

const useCreateInvitationAcceptance = ({ mutationOptions = {}, requestOptions = {} } = {}) => {
  const queryClient = useQueryClient()

  return useMutation(
    createMutationConfig({
      mutationFn: (body) => createInvitationAcceptance(body, requestOptions),
      mutationOptions,
      onSuccess: async (data) => {
        const tripId = data?.invitation?.trip
        const keys = [queryKeys.invitations.mine(), queryKeys.trips.root()]

        if (tripId) {
          keys.push(queryKeys.collaboration.members(tripId))
        }

        await invalidateQueryScopes(queryClient, keys)
      },
    }),
  )
}

export {
  useCreateInvitationAcceptance,
  useMyInvitations,
}
