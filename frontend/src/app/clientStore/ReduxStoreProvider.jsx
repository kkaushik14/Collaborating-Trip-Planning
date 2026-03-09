import { Provider } from 'react-redux'

import { appStore } from './store.js'

const ReduxStoreProvider = ({ children, store = appStore }) => {
  return <Provider store={store}>{children}</Provider>
}

export { ReduxStoreProvider }
