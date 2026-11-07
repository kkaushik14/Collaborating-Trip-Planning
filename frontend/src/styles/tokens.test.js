import fs from 'node:fs'
import path from 'node:path'
import { designTokens } from './tokens.js'

const css = fs.readFileSync(path.join(__dirname, 'tokens.css'), 'utf8')
const parseColors = (block) => Object.fromEntries(
  [...block.matchAll(/--color-([\w-]+):\s*(\d+) (\d+) (\d+)/g)]
    .map(([, name, ...rgb]) => [name, rgb.map(Number)]),
)
const dark = parseColors(css.split(":root[data-theme='light']")[0])
const light = { ...dark, ...parseColors(css.split(":root[data-theme='light']")[1]) }
const luminance = (color) => color.map((value) => {
  const s = value / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0)
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05)

describe.each([['dark', dark], ['light', light]])('%s tokens', (_theme, colors) => {
  test.each(['canvas', 'panel', 'panel-muted'])('readable foregrounds on %s', (surface) => {
    for (const foreground of ['ink', 'ink-muted', 'primary', 'success', 'danger', 'warning']) {
      expect(contrast(colors[foreground], colors[surface])).toBeGreaterThanOrEqual(4.5)
    }
    expect(contrast(colors['line-strong'], colors[surface])).toBeGreaterThanOrEqual(3)
  })

  test('filled primary and destructive controls have readable labels', () => {
    for (const background of ['action-primary', 'action-primary-hover']) {
      expect(contrast(colors['on-primary'], colors[background])).toBeGreaterThanOrEqual(4.5)
    }
    expect(contrast(colors['ink-inverse'], colors.danger)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(colors['ink-inverse'], colors.primary)).toBeGreaterThanOrEqual(4.5)
  })

  test('enabled action fill is clearly separated from disabled fill', () => {
    expect(contrast(colors['action-primary'], colors['action-disabled'])).toBeGreaterThanOrEqual(3)
    expect(contrast(colors['on-disabled'], colors['action-disabled'])).toBeGreaterThanOrEqual(3)
  })
})

test('JS palette mirrors the default CSS tokens; native controls declare both schemes', () => {
  for (const [name, value] of Object.entries(designTokens.colors)) {
    const cssName = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    expect(dark[cssName].join(' ')).toBe(value)
  }
  expect(css).toMatch(/color-scheme: dark/)
  expect(css).toMatch(/color-scheme: light/)
})

test('dark surfaces stay near-black with subtle navy confined to accents', () => {
  expect(dark.canvas).toEqual([10, 11, 15])
  expect(dark.panel).toEqual([17, 19, 26])
  expect(dark['panel-muted']).toEqual([26, 29, 39])
  expect(dark.neutral).toEqual([39, 45, 88])
  const darkCss = css.split(":root[data-theme='light']")[0]
  expect(darkCss).toMatch(/--gradient-hero-start: 17 19 26/)
  expect(darkCss).toMatch(/--gradient-hero-end: 10 11 15/)
  expect(darkCss).toMatch(/--gradient-glow-secondary: 39 45 88/)
})

test.each(['canvas', 'panel', 'panel-muted'])('dark muted content and boundaries remain legible on %s', (surface) => {
  expect(contrast(dark['ink-muted'], dark[surface])).toBeGreaterThanOrEqual(7)
  expect(contrast(dark.line, dark[surface])).toBeGreaterThanOrEqual(3)
  expect(contrast(dark['line-strong'], dark[surface])).toBeGreaterThanOrEqual(3)
  expect(contrast(dark['action-primary'], dark[surface])).toBeGreaterThanOrEqual(3)
})

test('dark disabled labels stay readable without resembling enabled copper actions', () => {
  expect(contrast(dark['on-disabled'], dark['action-disabled'])).toBeGreaterThanOrEqual(4.5)
  expect(contrast(dark['action-primary'], dark['action-disabled'])).toBeGreaterThanOrEqual(5)
})

test('light surfaces and foregrounds retain their existing palette', () => {
  expect(light).toMatchObject({
    canvas: [249, 245, 243],
    panel: [255, 255, 255],
    'panel-muted': [243, 238, 248],
    ink: [37, 28, 30],
    'ink-muted': [104, 91, 104],
    'action-primary': [124, 86, 80],
    'on-primary': [245, 239, 236],
    'action-disabled': [232, 225, 231],
    'on-disabled': [111, 101, 115],
    line: [215, 204, 220],
    'line-strong': [130, 113, 141],
  })
})
