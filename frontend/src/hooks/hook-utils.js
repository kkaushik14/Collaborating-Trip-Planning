const snapshotQueries = (queryClient, queryKeys = []) =>
  queryKeys.map((queryKey) => ({
    queryKey,
    data: queryClient.getQueryData(queryKey),
  }))

const restoreSnapshots = (queryClient, snapshots = []) => {
  for (const snapshot of snapshots) {
    queryClient.setQueryData(snapshot.queryKey, snapshot.data)
  }
}

const invalidateQueryScopes = async (queryClient, queryKeys = []) =>
  Promise.all(
    queryKeys.map((queryKey) =>
      queryClient.invalidateQueries({
        queryKey,
        exact: false,
      }),
    ),
  )

const createMutationConfig = ({
  mutationFn,
  mutationOptions = {},
  onMutate,
  onError,
  onSuccess,
  onSettled,
}) => {
  const {
    onMutate: userOnMutate,
    onError: userOnError,
    onSuccess: userOnSuccess,
    onSettled: userOnSettled,
    ...restMutationOptions
  } = mutationOptions

  return {
    ...restMutationOptions,
    mutationFn,
    onMutate: async (variables) => {
      const internalContext = typeof onMutate === 'function' ? await onMutate(variables) : undefined
      const userContext = typeof userOnMutate === 'function' ? await userOnMutate(variables) : undefined

      return {
        internalContext,
        userContext,
      }
    },
    onError: async (error, variables, context) => {
      if (typeof onError === 'function') {
        await onError(error, variables, context?.internalContext)
      }

      if (typeof userOnError === 'function') {
        await userOnError(error, variables, context?.userContext)
      }
    },
    onSuccess: async (data, variables, context) => {
      if (typeof onSuccess === 'function') {
        await onSuccess(data, variables, context?.internalContext)
      }

      if (typeof userOnSuccess === 'function') {
        await userOnSuccess(data, variables, context?.userContext)
      }
    },
    onSettled: async (data, error, variables, context) => {
      if (typeof onSettled === 'function') {
        await onSettled(data, error, variables, context?.internalContext)
      }

      if (typeof userOnSettled === 'function') {
        await userOnSettled(data, error, variables, context?.userContext)
      }
    },
  }
}

export {
  createMutationConfig,
  invalidateQueryScopes,
  restoreSnapshots,
  snapshotQueries,
}
