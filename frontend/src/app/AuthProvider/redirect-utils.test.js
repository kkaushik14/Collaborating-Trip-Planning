import { buildAuthRouteSearch, getRedirectPathFromLocation } from './redirect-utils.js'

test.each(['//evil.test', '/\\evil.test', '/login?next=/trips', '/reset-password?token=secret', '/forgot-password', 'https://evil.test'])('rejects unsafe or looping redirect %s', (path) => {
  expect(getRedirectPathFromLocation({ search: `?next=${encodeURIComponent(path)}` })).toBe('/trips')
  expect(buildAuthRouteSearch(path)).toBe('')
})

test('preserves an internal invitation redirect', () => {
  const path = '/invitations/accept?token=invitation#details'
  expect(getRedirectPathFromLocation({ search: `?next=${encodeURIComponent(path)}` })).toBe(path)
})
