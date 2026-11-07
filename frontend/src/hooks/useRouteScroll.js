import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const useRouteScroll = () => {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  useEffect(() => {
    // Preserve browser-back restoration and same-page anchors.
    if (navigationType !== 'POP' && !hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [pathname, hash, navigationType])
}

export { useRouteScroll }
