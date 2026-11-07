import { StrictMode } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'

import { UIStoreProvider } from '@/app/uiStore/UIStoreProvider.jsx'
import { useUIStore } from '@/app/uiStore/useUIStore.js'
import ToastViewport from './ToastViewport.jsx'

function Notifications() {
  const { addToast } = useUIStore()
  return <>
    <button onClick={() => addToast({ title: 'Saved', message: 'Changes saved', durationMs: 2000 })}>Notify</button>
    <button onClick={() => addToast({ title: 'Failed', type: 'error', durationMs: 0 })}>Persistent</button>
    <ToastViewport />
  </>
}

beforeEach(() => jest.useFakeTimers())
afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers() })
const setup = () => render(<StrictMode><UIStoreProvider><Notifications /></UIStoreProvider></StrictMode>)

test('live regions exist before notifications arrive and use opaque surfaces', () => {
  setup()
  expect(screen.getByRole('status')).toBeEmptyDOMElement()
  expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  fireEvent.click(screen.getByText('Notify'))
  expect(screen.getByRole('status')).toHaveTextContent('Saved Changes saved')
  expect(screen.getByRole('article')).toHaveClass('bg-panel')
  act(() => jest.advanceTimersByTime(2000))
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
})

test('pauses auto-dismiss on hover and focus, then resumes remaining duration', () => {
  setup()
  fireEvent.click(screen.getByText('Notify'))
  const article = screen.getByRole('article')
  act(() => jest.advanceTimersByTime(500))
  fireEvent.mouseEnter(article)
  act(() => jest.advanceTimersByTime(5000))
  expect(article).toBeInTheDocument()
  const dismiss = within(article).getByRole('button')
  act(() => dismiss.focus())
  fireEvent.mouseLeave(article)
  act(() => jest.advanceTimersByTime(5000))
  expect(article).toBeInTheDocument()
  act(() => dismiss.blur())
  act(() => jest.advanceTimersByTime(1499))
  expect(article).toBeInTheDocument()
  act(() => jest.advanceTimersByTime(1))
  expect(article).not.toBeInTheDocument()
})

test('duration zero persists until explicit dismissal', () => {
  setup()
  fireEvent.click(screen.getByText('Persistent'))
  act(() => jest.advanceTimersByTime(60000))
  expect(screen.getByRole('alert')).toHaveTextContent('Failed')
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification: Failed' }))
  expect(screen.getByRole('alert')).toBeEmptyDOMElement()
})
