import { FormProvider } from 'react-hook-form'

import { cn } from '@/lib/utils'

function Form({
  methods,
  onSubmit,
  className,
  children,
  noValidate = true,
  ...props
}) {
  return (
    <FormProvider {...methods}>
      <form
        className={cn('space-y-md', className)}
        noValidate={noValidate}
        onSubmit={methods.handleSubmit(onSubmit)}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  )
}

export { Form }
