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
    'title-sm': ['1.25rem', { lineHeight: '1.75rem' }],
    title: ['1.5rem', { lineHeight: '2rem' }],
    display: ['2.5rem', { lineHeight: '3rem' }],
  },

  fontFamily: {
    sans: ['"Montserrat"', '"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
  },

  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
  },

  shadows: {
    card: '0 20px 38px -24px rgb(5 9 20 / 0.7), 0 14px 22px -18px rgb(13 28 58 / 0.7)',
  },

  colors: {
    // Primary token set used by Tailwind theme and CSS custom properties.
    primary: '24 201 255',
    neutral: '106 124 153',
    success: '52 211 153',
    danger: '244 63 94',
    warning: '250 204 21',

    // Semantic surfaces and text tokens.
    canvas: '4 10 24',
    panel: '9 19 40',
    panelMuted: '16 31 59',
    ink: '236 244 255',
    inkMuted: '156 177 211',
    inkInverse: '3 11 30',
    line: '41 65 106',
    lineStrong: '62 95 144',
  },
})

export { designTokens }
