import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currency: 'USD',
  items: [],
  lastUpdatedAt: null,
}

const touch = (state) => {
  state.lastUpdatedAt = new Date().toISOString()
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartCurrency: (state, action) => {
      state.currency = action.payload || 'USD'
      touch(state)
    },

    addCartItem: (state, action) => {
      const item = action.payload || {}
      const itemId = item.id

      if (!itemId) {
        return
      }

      const existing = state.items.find((entry) => entry.id === itemId)
      const quantityToAdd = Number(item.quantity || 1)

      if (existing) {
        existing.quantity += quantityToAdd
        touch(state)
        return
      }

      state.items.push({
        id: itemId,
        name: item.name || '',
        unitPrice: Number(item.unitPrice || 0),
        quantity: quantityToAdd,
      })
      touch(state)
    },

    updateCartItemQuantity: (state, action) => {
      const itemId = action.payload?.id
      const nextQuantity = Number(action.payload?.quantity)

      if (!itemId || !Number.isFinite(nextQuantity)) {
        return
      }

      if (nextQuantity <= 0) {
        state.items = state.items.filter((entry) => entry.id !== itemId)
        touch(state)
        return
      }

      const existing = state.items.find((entry) => entry.id === itemId)
      if (!existing) {
        return
      }

      existing.quantity = nextQuantity
      touch(state)
    },

    removeCartItem: (state, action) => {
      const itemId = action.payload
      state.items = state.items.filter((entry) => entry.id !== itemId)
      touch(state)
    },

    clearCart: (state) => {
      state.items = []
      touch(state)
    },
  },
})

const selectCart = (state) => state.cart
const selectCartItems = (state) => state.cart.items
const selectCartTotalAmount = (state) =>
  state.cart.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
const selectCartItemCount = (state) =>
  state.cart.items.reduce((count, item) => count + item.quantity, 0)

const { addCartItem, clearCart, removeCartItem, setCartCurrency, updateCartItemQuantity } =
  cartSlice.actions

export {
  addCartItem,
  cartSlice,
  clearCart,
  removeCartItem,
  selectCart,
  selectCartItemCount,
  selectCartItems,
  selectCartTotalAmount,
  setCartCurrency,
  updateCartItemQuantity,
}
