import { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm } from 'react-hook-form'

import { RHFTextField } from './RHFTextField.jsx'
import { RHFTextareaField } from './RHFTextareaField.jsx'
import { RHFCheckboxField } from './RHFCheckboxField.jsx'
import '../test-platform.js'

function ExampleForm({ Field = RHFTextField, error, ...props }) {
  const form = useForm({ defaultValues: { title: Field === RHFCheckboxField ? false : '' } })
  useEffect(() => {
    if (error) form.setError('title', { message: error })
  }, [error, form])
  return <FormProvider {...form}><form><Field name="title" label="Title" {...props} /></form></FormProvider>
}

describe('field associations', () => {
  test.each([RHFTextField, RHFTextareaField, RHFCheckboxField])(
    '%p keeps same-named fields in two forms independently labeled and described',
    (Field) => {
      render(<>
        <ExampleForm Field={Field} description="Day title" error="Day title required" />
        <ExampleForm Field={Field} description="Activity title" error="Activity title required" />
      </>)
      const fields = screen.getAllByLabelText('Title', { exact: true })
      expect(fields).toHaveLength(2)
      expect(fields[0].id).not.toBe(fields[1].id)
      expect(fields[0]).toHaveAccessibleName('Title')
      expect(fields[1]).toHaveAccessibleName('Title')
      expect(fields[0]).toHaveAccessibleDescription('Day title Day title required')
      expect(fields[1]).toHaveAccessibleDescription('Activity title Activity title required')
      expect(fields[0]).toHaveAttribute('aria-invalid', 'true')
      expect(fields[1]).toHaveAttribute('aria-invalid', 'true')
    },
  )

  test('a hidden required label still names the control', () => {
    render(<ExampleForm hideLabel required type="password" label="Password" />)
    // Accessible-name queries ignore the decorative, aria-hidden required marker.
    expect(screen.getByLabelText('Password', { exact: true })).toHaveAccessibleName('Password')
    expect(screen.getByLabelText('Password', { exact: true })).toBeRequired()
  })

  test('explicit IDs and external help text remain associated', () => {
    render(<><p id="extra">External hint</p><ExampleForm id="custom" inputId="preferred" description="Local hint" aria-describedby="extra" /></>)
    const input = screen.getByLabelText('Title', { exact: true })
    expect(input).toHaveAttribute('id', 'preferred')
    expect(input).toHaveAccessibleDescription('External hint Local hint')
  })

  test('checkbox exposes required state and toggles using the keyboard', async () => {
    const user = userEvent.setup()
    render(<ExampleForm Field={RHFCheckboxField} required />)
    const checkbox = screen.getByRole('checkbox', { name: 'Title' })
    await user.tab()
    expect(checkbox).toHaveFocus()
    await user.keyboard(' ')
    expect(checkbox).toBeChecked()
    expect(checkbox).toHaveAttribute('data-checked')
    expect(checkbox).toHaveClass('data-[checked]:bg-primary')
  })
})
