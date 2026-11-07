import { beforeAll, afterAll } from '@jest/globals'

// jsdom does not implement PointerEvent; Base UI distinguishes mouse/touch clicks.
const originalPointerEvent = globalThis.PointerEvent

beforeAll(() => {
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type, init = {}) {
      super(type, init)
      this.pointerType = init.pointerType || 'mouse'
      this.pointerId = init.pointerId || 1
      this.isPrimary = init.isPrimary ?? true
    }
  }
})

afterAll(() => { globalThis.PointerEvent = originalPointerEvent })
