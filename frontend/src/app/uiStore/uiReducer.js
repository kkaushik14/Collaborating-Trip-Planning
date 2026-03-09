import { DEFAULT_THEME } from './initialState.js'
import { UI_ACTION_TYPES } from './uiActionTypes.js'

const buildToastRecord = (payload = {}) => {
  const fallbackId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const generatedId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : fallbackId

  return {
    id: payload.id || generatedId,
    type: payload.type || 'info',
    title: payload.title || '',
    message: payload.message || '',
    durationMs: Number(payload.durationMs || 4000),
    createdAt: payload.createdAt || new Date().toISOString(),
  }
}

const uiReducer = (state, action) => {
  switch (action.type) {
    case UI_ACTION_TYPES.SET_THEME: {
      const nextTheme = action.payload?.theme
      return {
        ...state,
        theme: nextTheme || DEFAULT_THEME,
      }
    }

    case UI_ACTION_TYPES.TOGGLE_THEME: {
      return {
        ...state,
        theme: state.theme === 'dark' ? 'light' : 'dark',
      }
    }

    case UI_ACTION_TYPES.OPEN_MODAL: {
      const modalKey = action.payload?.modalKey
      if (!modalKey) {
        return state
      }

      return {
        ...state,
        modals: {
          ...state.modals,
          [modalKey]: {
            isOpen: true,
            payload: action.payload?.payload || {},
          },
        },
      }
    }

    case UI_ACTION_TYPES.CLOSE_MODAL: {
      const modalKey = action.payload?.modalKey
      if (!modalKey) {
        return state
      }

      const previousModal = state.modals[modalKey]
      if (!previousModal) {
        return state
      }

      return {
        ...state,
        modals: {
          ...state.modals,
          [modalKey]: {
            ...previousModal,
            isOpen: false,
            payload: {},
          },
        },
      }
    }

    case UI_ACTION_TYPES.CLOSE_ALL_MODALS: {
      const nextModals = Object.keys(state.modals).reduce((accumulator, modalKey) => {
        accumulator[modalKey] = {
          ...state.modals[modalKey],
          isOpen: false,
          payload: {},
        }
        return accumulator
      }, {})

      return {
        ...state,
        modals: nextModals,
      }
    }

    case UI_ACTION_TYPES.ADD_TOAST: {
      const toast = buildToastRecord(action.payload)
      return {
        ...state,
        toasts: [...state.toasts, toast],
      }
    }

    case UI_ACTION_TYPES.DISMISS_TOAST: {
      const toastId = action.payload?.id
      if (!toastId) {
        return state
      }

      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== toastId),
      }
    }

    case UI_ACTION_TYPES.CLEAR_TOASTS: {
      return {
        ...state,
        toasts: [],
      }
    }

    default:
      return state
  }
}

export { buildToastRecord, uiReducer }
