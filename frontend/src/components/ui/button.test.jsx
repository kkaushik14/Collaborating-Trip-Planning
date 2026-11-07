import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Button } from './button.jsx'

describe('Button', () => {
  test('renders content and default styling', () => {
    render(<Button>Save</Button>)

    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-[rgb(var(--color-action-primary))]', 'text-[rgb(var(--color-on-primary))]')
  })

  test('fires click handler when enabled', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()

    render(<Button onClick={onClick}>Create</Button>)
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('does not fire click handler when disabled', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()

    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Disabled' })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:bg-[rgb(var(--color-action-disabled))]', 'disabled:text-[rgb(var(--color-on-disabled))]', 'disabled:opacity-100')

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})
