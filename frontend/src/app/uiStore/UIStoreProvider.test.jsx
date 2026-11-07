import { StrictMode } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { UIStoreProvider } from './UIStoreProvider.jsx'
import { useUIStore } from './useUIStore.js'
import { THEME_STORAGE_KEY } from './theme.js'
import { buildToastRecord, uiReducer } from './uiReducer.js'
import { initialUIState } from './initialState.js'
import { UI_ACTION_TYPES } from './uiActionTypes.js'

function ThemeControl() {
  const { state, toggleTheme } = useUIStore()
  return <button onClick={toggleTheme}>{state.theme}</button>
}

afterEach(() => {
  jest.restoreAllMocks()
  document.documentElement.removeAttribute('data-theme')
})

test('restores and persists theme without an authenticated layout, including remounts', async () => {
  localStorage.setItem(THEME_STORAGE_KEY, 'light')
  const user = userEvent.setup()
  const { unmount } = render(<StrictMode><UIStoreProvider><ThemeControl /></UIStoreProvider></StrictMode>)
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  await user.click(screen.getByRole('button', { name: 'light' }))
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  unmount()
  render(<UIStoreProvider><ThemeControl /></UIStoreProvider>)
  expect(screen.getByRole('button', { name: 'dark' })).toBeInTheDocument()
})

test('invalid stored values fall back safely and cross-tab preferences are validated', () => {
  localStorage.setItem(THEME_STORAGE_KEY, 'invalid')
  render(<UIStoreProvider><ThemeControl /></UIStoreProvider>)
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'light' })))
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'invalid' })))
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
})

test('blocked storage does not prevent theme changes', async () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  const user = userEvent.setup()
  render(<UIStoreProvider><ThemeControl /></UIStoreProvider>)
  await user.click(screen.getByRole('button', { name: 'dark' }))
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
})

test('reducer rejects unsupported themes', () => {
  expect(uiReducer(initialUIState, { type: UI_ACTION_TYPES.SET_THEME, payload: { theme: 'sepia' } }).theme).toBe('dark')
})

test.each([[undefined, 4000], [null, 4000], [0, 0], [-1, 4000], ['invalid', 4000], [2500, 2500]])(
  'normalizes toast duration %p to %p', (durationMs, expected) => {
    expect(buildToastRecord({ durationMs }).durationMs).toBe(expected)
  },
)
