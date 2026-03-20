import { useEffect } from 'react'

const DEFAULT_SELECTOR = '[data-reveal]'
const DEFAULT_ROOT_MARGIN = '0px 0px -12% 0px'
const DEFAULT_THRESHOLD = 0.12

function useScrollReveal({
  selector = DEFAULT_SELECTOR,
  rootMargin = DEFAULT_ROOT_MARGIN,
  threshold = DEFAULT_THRESHOLD,
  maxDelayMs = 420,
  stepDelayMs = 70,
  enabled = true,
} = {}) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const targets = Array.from(document.querySelectorAll(selector))
    if (!targets.length) {
      return
    }

    targets.forEach((target, index) => {
      target.classList.add('reveal-section')
      const delay = Math.min(index * stepDelayMs, maxDelayMs)
      target.style.setProperty('--reveal-delay', `${delay}ms`)
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }

          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        })
      },
      {
        root: null,
        rootMargin,
        threshold,
      },
    )

    targets.forEach((target) => observer.observe(target))

    return () => observer.disconnect()
  }, [enabled, maxDelayMs, rootMargin, selector, stepDelayMs, threshold])
}

export default useScrollReveal
