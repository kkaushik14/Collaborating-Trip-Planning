import { configureStore } from '@reduxjs/toolkit'

import { cartSlice } from './slices/cartSlice.js'
import { multiStepFormSlice } from './slices/multiStepFormSlice.js'

const appStore = configureStore({
  reducer: {
    cart: cartSlice.reducer,
    multiStepForm: multiStepFormSlice.reducer,
  },
  devTools: import.meta.env.DEV,
})

export { appStore }
