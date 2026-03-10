import { useEffect, useMemo, useRef } from 'react'
import { XIcon } from 'lucide-react'

import { useUIStore } from '@/hooks/useUIStore.js'
import { cn } from '@/lib/utils'

const toneClassMap = Object.freeze({
  info: 'border-line bg-panel text-ink',
  success: 'border-success/40 bg-success/15 text-ink',
  warning: 'border-warning/40 bg-warning/15 text-ink',
  error: 'border-danger/40 bg-danger/15 text-ink',
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
      className="pointer-events-none fixed right-lg top-lg z-[90] flex w-full max-w-sm flex-col gap-sm"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <article
          key={toast.id}
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto rounded-lg border p-sm shadow-card',
            toneClassMap[toast.type] || toneClassMap.info,
          )}
        >
          <div className="flex items-start justify-between gap-sm">
            <div className="min-w-0">
              {toast.title ? (
                <p className="text-body-sm font-semibold">{toast.title}</p>
              ) : null}
              {toast.message ? (
                <p className="mt-2xs text-caption text-ink-muted">{toast.message}</p>
              ) : null}
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
      ))}
    </section>
  )
}

export default ToastViewport
