import { createContext, useEffect, useLayoutEffect, useMemo, useReducer } from 'react'

import { initialUIState } from './initialState.js'
import { UI_ACTION_TYPES } from './uiActionTypes.js'
import { uiReducer } from './uiReducer.js'
import { initializeUIState, isTheme, THEME_STORAGE_KEY } from './theme.js'

const UIStoreContext = createContext(null)

const UIStoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialUIState, initializeUIState)

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, state.theme)
    } catch {
      // Theme changes still work when storage is blocked or full.
    }
  }, [state.theme])

  useEffect(() => {
    const syncTheme = (event) => {
      if (event.key === THEME_STORAGE_KEY && isTheme(event.newValue)) {
        dispatch({ type: UI_ACTION_TYPES.SET_THEME, payload: { theme: event.newValue } })
      }
    }
    window.addEventListener('storage', syncTheme)
    return () => window.removeEventListener('storage', syncTheme)
  }, [])

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
