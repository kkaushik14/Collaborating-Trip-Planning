import { Component } from 'react'

class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-canvas p-lg text-ink">
          <section className="w-full max-w-xl rounded-xl border border-line bg-panel p-xl">
            <h1 className="text-title font-semibold">Something went wrong</h1>
            <p className="mt-md text-ink-muted">We couldn't display this page. Your saved trips are still available. Reload the page to try again.</p>
            <button type="button" className="mt-lg rounded-md bg-[rgb(var(--color-action-primary))] px-lg py-md font-semibold text-[rgb(var(--color-on-primary))] hover:bg-[rgb(var(--color-action-primary-hover))]" onClick={() => window.location.reload()}>Reload page</button>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}

export { AppErrorBoundary }
