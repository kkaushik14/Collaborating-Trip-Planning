import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOutIcon } from 'lucide-react'

import { useAuth } from '../app/AuthProvider/index.js'
import { Button } from '../components/ui/index.js'
import { APP_TITLE } from '../config/index.js'

const MainLayout = ({ children }) => {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      navigate('/login', { replace: true })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-layout flex-wrap items-center justify-between gap-md px-lg py-md sm:px-xl">
          <div className="flex items-center gap-lg">
            <Link to="/trips" className="text-title-sm font-semibold tracking-tight text-ink">
              {APP_TITLE}
            </Link>
            <nav className="flex items-center gap-xs">
              <NavLink
                to="/trips"
                className={({ isActive }) =>
                  [
                    'rounded-md px-md py-sm text-body-sm font-medium transition-colors',
                    isActive ? 'bg-panel-muted text-ink' : 'text-ink-muted hover:bg-panel-muted',
                  ].join(' ')
                }
              >
                Trips
              </NavLink>
              <NavLink
                to="/invitations"
                className={({ isActive }) =>
                  [
                    'rounded-md px-md py-sm text-body-sm font-medium transition-colors',
                    isActive ? 'bg-panel-muted text-ink' : 'text-ink-muted hover:bg-panel-muted',
                  ].join(' ')
                }
              >
                Invitations
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-sm">
            <div className="hidden rounded-full bg-panel-muted px-md py-xs text-caption text-ink-muted sm:block">
              {currentUser?.name || currentUser?.email || 'Authenticated User'}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOutIcon className="size-4" />
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-layout px-lg py-2xl sm:px-xl sm:py-3xl">{children}</main>
      <footer className="border-t border-line bg-panel/85">
        <div className="mx-auto flex max-w-layout flex-wrap items-center justify-between gap-sm px-lg py-md text-caption text-ink-muted sm:px-xl">
          <span>{APP_TITLE}</span>
          <span>All modules are connected to backend APIs</span>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout
