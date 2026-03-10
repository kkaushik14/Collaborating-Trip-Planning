import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider, QueryProvider, ReduxStoreProvider, UIStoreProvider } from './app/index.js'
import { ToastViewport } from './components/common/index.js'
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
              <ToastViewport />
            </AuthProvider>
          </UIStoreProvider>
        </ReduxStoreProvider>
      </QueryProvider>
    </TooltipProvider>
  </StrictMode>,
)
