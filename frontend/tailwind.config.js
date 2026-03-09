import { designTokens } from './src/styles/tokens.js'
import defaultTheme from 'tailwindcss/defaultTheme'

const toColor = (cssVar) => `rgb(var(${cssVar}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind v3+ uses `content` as purge paths.
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    screens: designTokens.breakpoints,
    spacing: {
      ...defaultTheme.spacing,
      ...designTokens.spacing,
    },
    fontSize: {
      ...defaultTheme.fontSize,
      ...designTokens.fontSize,
    },
    borderRadius: {
      ...defaultTheme.borderRadius,
      ...designTokens.radius,
    },
    fontFamily: {
      ...defaultTheme.fontFamily,
      ...designTokens.fontFamily,
    },
    extend: {
      maxWidth: {
        layout: '72rem',
      },
      boxShadow: designTokens.shadows,
      colors: {
        // Authoritative design token palette
        primary: toColor('--color-primary'),
        neutral: toColor('--color-neutral'),
        success: toColor('--color-success'),
        danger: toColor('--color-danger'),
        warning: toColor('--color-warning'),
        canvas: toColor('--color-canvas'),
        panel: toColor('--color-panel'),
        'panel-muted': toColor('--color-panel-muted'),
        ink: toColor('--color-ink'),
        'ink-muted': toColor('--color-ink-muted'),
        'ink-inverse': toColor('--color-ink-inverse'),
        line: toColor('--color-line'),
        'line-strong': toColor('--color-line-strong'),

        // Compatibility aliases used by base UI components.
        background: toColor('--color-canvas'),
        foreground: toColor('--color-ink'),
        border: toColor('--color-line'),
        input: toColor('--color-line'),
        ring: toColor('--color-primary'),
        muted: toColor('--color-panel-muted'),
        'muted-foreground': toColor('--color-ink-muted'),
        accent: toColor('--color-panel-muted'),
        'accent-foreground': toColor('--color-ink'),
        popover: toColor('--color-panel'),
        'popover-foreground': toColor('--color-ink'),
        secondary: toColor('--color-neutral'),
        'secondary-foreground': toColor('--color-ink-inverse'),
        destructive: toColor('--color-danger'),
        'destructive-foreground': toColor('--color-ink-inverse'),
        'primary-foreground': toColor('--color-ink-inverse'),
      },
    },
  },
  plugins: [],
}
