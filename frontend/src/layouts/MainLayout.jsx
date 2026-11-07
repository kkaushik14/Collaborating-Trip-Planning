import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LogOutIcon,
  MenuIcon,
  MoonStarIcon,
  SettingsIcon,
  SunIcon,
  UserCircle2Icon,
} from 'lucide-react'

import { useAuth } from '../app/AuthProvider/index.js'
import { SiteFooter, ThemeToggle, UserProfileSettingsDialog } from '../components/common/index.js'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/index.js'
import { APP_TITLE } from '../config/site.js'
import { useUpdateUserProfile, useUIStore } from '../hooks/index.js'

const NAV_LINKS = [
  { to: '/trips', label: 'Trips' },
  { to: '/invitations', label: 'Invitations' },
]

const getUserInitials = (name = '', email = '') => {
  const source = String(name || email || 'U')
  return source
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join('')
}

const MainLayout = ({ children }) => {
  const { currentUser, setCurrentUserProfile, signOut } = useAuth()
  const { addToast, setTheme, state } = useUIStore()
  const updateUserProfileMutation = useUpdateUserProfile()
  const updateThemePreferenceMutation = useUpdateUserProfile()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const currentTheme = state.theme === 'light' ? 'light' : 'dark'
  const isDarkTheme = currentTheme === 'dark'

  useEffect(() => {
    const userTheme = currentUser?.themePreference
    if (userTheme === 'light' || userTheme === 'dark') {
      setTheme(userTheme)
      return
    }
  }, [currentUser?._id, currentUser?.themePreference, setTheme])

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      navigate('/login', { replace: true })
    } finally {
      setIsSigningOut(false)
    }
  }

  const userInitials = useMemo(
    () => getUserInitials(currentUser?.name, currentUser?.email),
    [currentUser?.email, currentUser?.name],
  )

  const handleThemeToggle = async () => {
    const previousTheme = currentTheme
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'

    setTheme(nextTheme)

    try {
      const response = await updateThemePreferenceMutation.mutateAsync({
        themePreference: nextTheme,
      })
      const nextUser = response?.user

      if (nextUser) {
        setCurrentUserProfile(nextUser)
        setTheme(nextUser.themePreference === 'light' || nextUser.themePreference === 'dark'
          ? nextUser.themePreference
          : nextTheme)
      } else if (currentUser) {
        setCurrentUserProfile({ ...currentUser, themePreference: nextTheme })
      }

      addToast({
        type: 'info',
        title: `Theme: ${nextTheme === 'dark' ? 'Dark' : 'Light'}`,
        message: 'Your display preference has been saved.',
        durationMs: 2500,
      })
    } catch (error) {
      setTheme(previousTheme)
      addToast({
        type: 'error',
        title: 'Theme update failed',
        message: error?.message || 'We could not save your theme preference. Please try again.',
        durationMs: 3500,
      })
    }
  }

  const handleProfileSave = async (payload) => {
    const response = await updateUserProfileMutation.mutateAsync(payload)
    const nextUser = response?.user

    if (nextUser) {
      setCurrentUserProfile(nextUser)
    }

    addToast({
      type: 'success',
      title: 'Profile updated',
      message: 'Your profile details were saved successfully.',
      durationMs: 3200,
    })
  }

  const handleProfileNoChanges = () => {
    addToast({
      type: 'info',
      title: 'No changes detected',
      message: 'Edit a field and save to apply updates.',
      durationMs: 2600,
    })
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-lg focus:top-lg focus:z-[100] focus:rounded-md focus:bg-panel focus:p-md">
        Skip to content
      </a>
      <header className="border-b border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-layout items-center justify-between gap-md px-lg py-md sm:px-xl">
          <div className="flex min-w-0 items-center gap-sm sm:gap-lg">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger
                type="button"
                aria-label="Open menu"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-panel text-ink transition-colors hover:bg-panel-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
              >
                <MenuIcon className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="gap-md">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>
                    Quick access to navigation and your account settings.
                  </SheetDescription>
                </SheetHeader>

                <div className="rounded-lg border border-line bg-panel-muted p-md">
                  <div className="flex items-center gap-sm">
                    <Avatar>
                      {currentUser?.avatarUrl ? (
                        <AvatarImage src={currentUser.avatarUrl} alt={currentUser?.name || 'User avatar'} />
                      ) : null}
                      <AvatarFallback>{userInitials || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-semibold text-ink">
                        {currentUser?.name || 'User'}
                      </p>
                      <p className="truncate text-caption text-ink-muted">
                        {currentUser?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                </div>

                <nav aria-label="Mobile navigation" className="space-y-xs">
                  {NAV_LINKS.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        [
                          'block rounded-md px-md py-sm text-body-sm font-medium transition-colors',
                          isActive ? 'bg-panel-muted text-ink' : 'text-ink-muted hover:bg-panel-muted',
                        ].join(' ')
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>

                <div className="mt-auto space-y-sm border-t border-line pt-md">
                  <div className="flex items-center justify-between rounded-md border border-line bg-panel-muted px-md py-sm">
                    <div className="flex items-center gap-xs text-body-sm text-ink">
                      {isDarkTheme ? <MoonStarIcon className="size-4" /> : <SunIcon className="size-4" />}
                      Theme
                    </div>
                    <ThemeToggle
                      theme={currentTheme}
                      disabled={updateThemePreferenceMutation.isPending}
                      onToggle={() => {
                        void handleThemeToggle()
                      }}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setIsProfileDialogOpen(true)
                    }}
                  >
                    <SettingsIcon className="size-4" />
                    Profile Settings
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    <LogOutIcon className="size-4" />
                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/trips" className="min-w-0 break-words text-body-sm font-semibold tracking-tight text-ink sm:text-title-sm">
              {APP_TITLE}
            </Link>
            <nav aria-label="Main navigation" className="hidden shrink-0 items-center gap-xs md:flex">
              {NAV_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'rounded-md px-md py-sm text-body-sm font-medium transition-colors',
                      isActive ? 'bg-panel-muted text-ink' : 'text-ink-muted hover:bg-panel-muted',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-sm">
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Account menu"
                  openOnHover
                  delay={100}
                  closeDelay={150}
                  className="inline-flex items-center rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Avatar title={currentUser?.name || currentUser?.email || 'User'}>
                    {currentUser?.avatarUrl ? (
                      <AvatarImage src={currentUser.avatarUrl} alt={currentUser?.name || 'User avatar'} />
                    ) : null}
                    <AvatarFallback>{userInitials || 'U'}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64"
                >
                  <DropdownMenuLabel>
                    <div className="space-y-1">
                      <p className="truncate text-body-sm font-semibold text-ink">
                        {currentUser?.name || 'User'}
                      </p>
                      <p className="truncate text-caption font-normal text-ink-muted">
                        {currentUser?.email || 'No email'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setIsProfileDialogOpen(true)
                    }}
                  >
                    <UserCircle2Icon className="size-4" />
                    User Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      void handleSignOut()
                    }}
                    disabled={isSigningOut}
                  >
                    <LogOutIcon className="size-4" />
                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={isDarkTheme}
                    disabled={updateThemePreferenceMutation.isPending}
                    onCheckedChange={() => { void handleThemeToggle() }}
                  >
                    <MoonStarIcon className="size-4" />
                    Dark mode
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <p className="px-md pb-sm text-caption text-ink-muted">
                    Your theme is saved to your profile.
                  </p>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <UserProfileSettingsDialog
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
        currentUser={currentUser}
        isSaving={updateUserProfileMutation.isPending}
        onNoChanges={handleProfileNoChanges}
        onSave={async (payload) => {
          try {
            await handleProfileSave(payload)
            setIsProfileDialogOpen(false)
          } catch (error) {
            addToast({
              type: 'error',
              title: 'Profile update failed',
              message: error?.message || 'We could not update your profile. Please try again.',
              durationMs: 4200,
            })
          }
        }}
      />

      <main id="main-content" tabIndex={-1} className="mx-auto min-w-0 max-w-layout px-lg py-2xl sm:px-xl sm:py-3xl">{children}</main>
      <SiteFooter mode="app" />
    </div>
  )
}

export default MainLayout
