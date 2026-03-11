import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder
}

if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder
}

beforeEach(() => {
  if (typeof window !== 'undefined') {
    window.sessionStorage?.clear()
    window.localStorage?.clear()
  }
})
