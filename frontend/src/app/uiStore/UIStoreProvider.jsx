import { createContext, useMemo, useReducer } from 'react'

import { initialUIState } from './initialState.js'
import { UI_ACTION_TYPES } from './uiActionTypes.js'
import { uiReducer } from './uiReducer.js'

const UIStoreContext = createContext(null)

const UIStoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialUIState)

  const actions = useMemo(
    () => ({
      setTheme: (theme) =>
        dispatch({
          type: UI_ACTION_TYPES.SET_THEME,
          payload: { theme },
        }),

      toggleTheme: () =>
        dispatch({
          type: UI_ACTION_TYPES.TOGGLE_THEME,
        }),

      openModal: (modalKey, payload = {}) =>
        dispatch({
          type: UI_ACTION_TYPES.OPEN_MODAL,
          payload: { modalKey, payload },
        }),

      closeModal: (modalKey) =>
        dispatch({
          type: UI_ACTION_TYPES.CLOSE_MODAL,
          payload: { modalKey },
        }),

      closeAllModals: () =>
        dispatch({
          type: UI_ACTION_TYPES.CLOSE_ALL_MODALS,
        }),

      addToast: (toastPayload) =>
        dispatch({
          type: UI_ACTION_TYPES.ADD_TOAST,
          payload: toastPayload,
        }),

      dismissToast: (id) =>
        dispatch({
          type: UI_ACTION_TYPES.DISMISS_TOAST,
          payload: { id },
        }),

      clearToasts: () =>
        dispatch({
          type: UI_ACTION_TYPES.CLEAR_TOASTS,
        }),
    }),
    [],
  )

  const value = useMemo(
    () => ({
      state,
      dispatch,
      ...actions,
    }),
    [actions, state],
  )

  return <UIStoreContext.Provider value={value}>{children}</UIStoreContext.Provider>
}

export { UIStoreContext, UIStoreProvider }
