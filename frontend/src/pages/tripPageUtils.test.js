import { canEditTripContent, canManageTripCollaboration, getActivityLocationLabel, getTripCurrency, toDateInputValue } from './tripPageUtils.js'

test('date input values use local calendar fields instead of UTC serialization', () => {
  const localDate = {
    getFullYear: () => 2026,
    getMonth: () => 10,
    getDate: () => 8,
    toISOString: () => '2026-11-07T20:00:00.000Z',
  }
  expect(toDateInputValue(localDate)).toBe('2026-11-08')
})

test('permissions fail closed and normalize roles', () => {
  expect(canEditTripContent(' editor ')).toBe(true)
  expect(canEditTripContent('MEMBER')).toBe(false)
  expect(canManageTripCollaboration('EDITOR')).toBe(false)
  expect(canManageTripCollaboration('OWNER')).toBe(true)
})

test('uses actual trip settings and renders structured locations as text', () => {
  expect(getTripCurrency({ settings: { currency: 'INR' }, currency: 'USD' })).toBe('INR')
  expect(getActivityLocationLabel({ location: { name: 'Museum' } })).toBe('Museum')
  expect(getActivityLocationLabel({ location: {} })).toBe('TBD')
})
