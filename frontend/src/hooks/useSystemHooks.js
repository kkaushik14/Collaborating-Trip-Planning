import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '../app/QueryProvider/index.js'
import {
  getApiDocsPage,
  getHealth,
  getMetrics,
  getOpenApiSpec,
  getServiceBanner,
  getUploadedFile,
  getVersionedHealth,
} from '../services/index.js'

const useServiceBanner = ({ queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.system.banner(),
    queryFn: () => getServiceBanner(requestOptions),
    ...queryOptions,
  })

const useHealth = ({ queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.system.health(),
    queryFn: () => getHealth(requestOptions),
    ...queryOptions,
  })

const useVersionedHealth = ({ queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.system.versionedHealth(),
    queryFn: () => getVersionedHealth(requestOptions),
    ...queryOptions,
  })

const useMetrics = ({ queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.system.metrics(),
    queryFn: () => getMetrics(requestOptions),
    ...queryOptions,
  })

const useOpenApiSpec = ({ queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.system.openApi(),
    queryFn: () => getOpenApiSpec(requestOptions),
    ...queryOptions,
  })

const useApiDocsPage = ({ queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.system.docs(),
    queryFn: () => getApiDocsPage(requestOptions),
    ...queryOptions,
  })

const useUploadedFile = ({ fileName, queryOptions = {}, requestOptions = {} } = {}) =>
  useQuery({
    queryKey: queryKeys.system.uploadFile(fileName || 'unknown'),
    queryFn: () => getUploadedFile(fileName, requestOptions),
    enabled: Boolean(fileName) && (queryOptions.enabled ?? true),
    ...queryOptions,
  })

export {
  useApiDocsPage,
  useHealth,
  useMetrics,
  useOpenApiSpec,
  useServiceBanner,
  useUploadedFile,
  useVersionedHealth,
}
