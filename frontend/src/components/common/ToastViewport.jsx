import { useEffect, useRef, useState } from 'react'
import { AlertTriangleIcon, CircleXIcon, CircleCheckBigIcon, InfoIcon, XIcon } from 'lucide-react'

import { useUIStore } from '@/hooks/useUIStore.js'
import { cn } from '@/lib/utils'

const toneClassMap = Object.freeze({
  info: 'border-line',
  success: 'border-success',
  warning: 'border-warning',
  error: 'border-danger',
})

const iconMap = Object.freeze({
  info: InfoIcon,
  success: CircleCheckBigIcon,
  warning: AlertTriangleIcon,
  error: CircleXIcon,
})

function ToastItem({ toast, dismissToast }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const remainingMs = useRef(toast.durationMs)
  const paused = hovered || focused
  const Icon = iconMap[toast.type] || iconMap.info

  useEffect(() => {
    // Zero means a persistent notification, dismissed explicitly by the user.
    if (paused || toast.durationMs === 0) return
    const startedAt = Date.now()
    const timer = setTimeout(() => dismissToast(toast.id), remainingMs.current)
    return () => {
      clearTimeout(timer)
      remainingMs.current = Math.max(0, remainingMs.current - (Date.now() - startedAt))
    }
  }, [dismissToast, paused, toast.durationMs, toast.id])

  return (
    <article
      className={cn('toast-card toast-enter bg-panel text-ink [overflow-wrap:anywhere]', toneClassMap[toast.type] || toneClassMap.info)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      <div className="flex items-start justify-between gap-sm">
        <div className="flex min-w-0 items-start gap-xs">
          <Icon className="mt-[0.125rem] size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            {toast.title ? <p className="text-body-sm font-semibold">{toast.title}</p> : null}
            {toast.message ? <p className="mt-2xs text-caption text-ink-muted">{toast.message}</p> : null}
          </div>
        </div>
        <button
          type="button"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-panel-muted hover:text-ink"
          aria-label={toast.title ? `Dismiss notification: ${toast.title}` : 'Dismiss notification'}
          onClick={() => dismissToast(toast.id)}
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </article>
  )
}

function ToastViewport() {
  const { state: { toasts }, dismissToast } = useUIStore()

  return (
    <>
      {/* These regions exist before a notification arrives; avoid nested live regions. */}
      <div role="status" aria-atomic="true" className="sr-only">
        {toasts.filter((toast) => toast.type !== 'error').map((toast) => (
          <p key={toast.id}>{toast.title} {toast.message}</p>
        ))}
      </div>
      <div role="alert" aria-atomic="true" className="sr-only">
        {toasts.filter((toast) => toast.type === 'error').map((toast) => (
          <p key={toast.id}>{toast.title} {toast.message}</p>
        ))}
      </div>
      <section
        className={cn(
          'fixed left-sm right-sm top-sm z-[90] flex max-h-[calc(100dvh-2rem)] w-auto flex-col gap-sm overflow-y-auto overscroll-contain sm:left-auto sm:right-lg sm:top-lg sm:w-full sm:max-w-sm',
          toasts.length ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-label="Notifications"
      >
        {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} dismissToast={dismissToast} />)}
      </section>
    </>
  )
}

export default ToastViewport
