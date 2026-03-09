import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  App,
  AuthProvider,
  QueryProvider,
  ReduxStoreProvider,
  UIStoreProvider,
} from './app/index.js'
import { TooltipProvider } from './components/ui/index.js'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TooltipProvider delay={200}>
      <QueryProvider>
        <ReduxStoreProvider>
          <UIStoreProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </UIStoreProvider>
        </ReduxStoreProvider>
      </QueryProvider>
    </TooltipProvider>
  </StrictMode>,
)
