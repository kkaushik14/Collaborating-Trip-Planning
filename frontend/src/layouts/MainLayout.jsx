import { APP_TITLE } from '../config/index.js'

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-layout items-center justify-between px-xl py-lg">
          <h1 className="text-title-sm font-semibold tracking-tight">{APP_TITLE}</h1>
          <span className="rounded-full bg-primary/15 px-md py-xs text-caption font-medium text-primary">
            Initialized
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-layout px-xl py-3xl">{children}</main>
    </div>
  )
}

export default MainLayout
