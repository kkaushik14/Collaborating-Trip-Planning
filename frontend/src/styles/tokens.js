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
    card: '0 20px 38px -24px rgb(20 17 35 / 0.55), 0 14px 22px -18px rgb(39 45 88 / 0.45)',
  },

  colors: {
    // Primary token set used by Tailwind theme and CSS custom properties.
    primary: '222 164 139',
    primaryStrong: '204 145 119',
    actionPrimary: '215 154 119',
    actionPrimaryHover: '231 176 140',
    onPrimary: '32 22 21',
    actionDisabled: '44 47 60',
    onDisabled: '166 163 177',
    neutral: '39 45 88',
    success: '95 190 139',
    danger: '235 124 144',
    warning: '214 164 89',

    // Semantic surfaces and text tokens.
    canvas: '10 11 15',
    panel: '17 19 26',
    panelMuted: '26 29 39',
    ink: '245 239 236',
    inkMuted: '190 188 196',
    inkInverse: '32 22 21',
    line: '100 104 121',
    lineStrong: '139 145 164',
    overlay: '17 19 38',
  },
})

export { designTokens }
