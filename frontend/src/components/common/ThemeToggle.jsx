import { MoonStarIcon, SunIcon } from 'lucide-react'

import { Button } from '@/components/ui/button.jsx'

function ThemeToggle({ theme, onToggle, disabled = false, className }) {
  const isDark = theme === 'dark'
  const Icon = isDark ? MoonStarIcon : SunIcon

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      role="switch"
      aria-label="Dark mode"
      aria-checked={isDark}
      disabled={disabled}
      onClick={onToggle}
      className={className}
    >
      <Icon aria-hidden="true" />
      {isDark ? 'Dark' : 'Light'}
    </Button>
  )
}

export default ThemeToggle
