import { render, screen } from '@testing-library/react'
import { AnalyticsPanel } from './AnalyticsPanel.jsx'

test('analytics cards can shrink around their horizontally scrollable tables', () => {
  render(<AnalyticsPanel />)
  for (const card of screen.getAllByRole('article')) {
    expect(card).toHaveClass('min-w-0')
  }
  for (const table of screen.getAllByRole('table')) {
    expect(table.parentElement).toHaveClass('overflow-x-auto', 'max-w-full')
  }
})
