import { useEffect, useMemo, useRef } from 'react'
import { AlertTriangleIcon, CircleXIcon, CircleCheckBigIcon, InfoIcon, XIcon } from 'lucide-react'

import { useUIStore } from '@/hooks/useUIStore.js'
import { cn } from '@/lib/utils'

const toneClassMap = Object.freeze({
  info: 'toast-card border-line bg-panel text-ink',
  success: 'toast-card border-success/40 bg-success/12 text-ink',
  warning: 'toast-card border-warning/40 bg-warning/12 text-ink',
  error: 'toast-card border-danger/40 bg-danger/12 text-ink',
})

const iconMap = Object.freeze({
  info: InfoIcon,
  success: CircleCheckBigIcon,
  warning: AlertTriangleIcon,
  error: CircleXIcon,
})

function ToastViewport() {
  const {
    state: { toasts },
    dismissToast,
  } = useUIStore()
  const timeoutMapRef = useRef(new Map())
  const toastIds = useMemo(() => new Set(toasts.map((toast) => toast.id)), [toasts])

  useEffect(() => {
    for (const toast of toasts) {
      if (timeoutMapRef.current.has(toast.id)) {
        continue
      }

      const timerId = setTimeout(() => {
        dismissToast(toast.id)
        timeoutMapRef.current.delete(toast.id)
      }, Math.max(1000, Number(toast.durationMs || 4000)))

      timeoutMapRef.current.set(toast.id, timerId)
    }

    for (const [toastId, timerId] of timeoutMapRef.current.entries()) {
      if (toastIds.has(toastId)) {
        continue
      }

      clearTimeout(timerId)
      timeoutMapRef.current.delete(toastId)
    }
  }, [dismissToast, toastIds, toasts])

  useEffect(
    () => () => {
      for (const timerId of timeoutMapRef.current.values()) {
        clearTimeout(timerId)
      }
      timeoutMapRef.current.clear()
    },
    [],
  )

  if (!toasts.length) {
    return null
  }

  return (
    <section
      className="pointer-events-none fixed left-sm right-sm top-sm z-[90] flex w-auto flex-col gap-sm sm:left-auto sm:right-lg sm:top-lg sm:w-full sm:max-w-sm"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type] || iconMap.info

        return (
          <article
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={cn('toast-enter', toneClassMap[toast.type] || toneClassMap.info)}
          >
            <div className="flex items-start justify-between gap-sm">
              <div className="min-w-0">
                <div className="flex items-start gap-xs">
                  <Icon className="mt-[0.125rem] size-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    {toast.title ? (
                      <p className="text-body-sm font-semibold">{toast.title}</p>
                    ) : null}
                    {toast.message ? (
                      <p className="mt-2xs text-caption text-ink-muted">{toast.message}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex size-6 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-panel-muted hover:text-ink"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
              >
                <XIcon className="size-4" />
              </button>
            </div>
          </article>
        )
      })}
    </section>
  )
}

export default ToastViewport
