import { cn } from './utils.js'

test('retains token typography alongside text color and merges size overrides', () => {
  expect(cn('text-body text-ink', 'text-caption text-primary')).toBe('text-caption text-primary')
  expect(cn('text-display text-ink')).toBe('text-display text-ink')
})
