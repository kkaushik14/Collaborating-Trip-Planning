const designTokens = Object.freeze({
  breakpoints: {
    sm: '40rem',
    md: '48rem',
    lg: '64rem',
    xl: '80rem',
    '2xl': '96rem',
  },

  spacing: {
    0: '0rem',
    '2xs': '0.125rem',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
    '4xl': '4rem',
  },

  fontSize: {
    caption: ['0.75rem', { lineHeight: '1rem' }],
    'body-sm': ['0.875rem', { lineHeight: '1.25rem' }],
    body: ['1rem', { lineHeight: '1.5rem' }],
    'title-sm': ['1.125rem', { lineHeight: '1.5rem' }],
    title: ['1.25rem', { lineHeight: '1.75rem' }],
    display: ['1.5rem', { lineHeight: '2rem' }],
  },

  fontFamily: {
    sans: ['"Inter"', '"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
  },

  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
  },

  shadows: {
    card: '0 1px 2px 0 rgb(15 23 42 / 0.08), 0 1px 3px 0 rgb(15 23 42 / 0.08)',
  },

  colors: {
    // Directly mapped from the provided CSV (category examples):
    // primary: #3B82F6, neutral: #64748B, success: #22C55E, danger: #EF4444, warning: #F59E0B
    primary: '59 130 246',
    neutral: '100 116 139',
    success: '34 197 94',
    danger: '239 68 68',
    warning: '245 158 11',

    // Minimal semantic surfaces and text tokens for application layout.
    canvas: '248 250 252',
    panel: '255 255 255',
    panelMuted: '241 245 249',
    ink: '15 23 42',
    inkMuted: '71 85 105',
    inkInverse: '255 255 255',
    line: '203 213 225',
    lineStrong: '148 163 184',
  },
})

export { designTokens }
