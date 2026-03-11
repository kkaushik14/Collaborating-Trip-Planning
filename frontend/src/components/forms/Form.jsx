import { useEffect, useMemo, useRef } from 'react'
import { FormProvider } from 'react-hook-form'

import { cn } from '@/lib/utils'
import { readFormDraft, writeFormDraft } from './form-utils.js'

const getPersistedFormValues = ({ values, ignoreFields = [] }) => {
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return values
  }

  if (!Array.isArray(ignoreFields) || !ignoreFields.length) {
    return values
  }

  return Object.entries(values).reduce((accumulator, [key, value]) => {
    if (ignoreFields.includes(key)) {
      return accumulator
    }

    accumulator[key] = value
    return accumulator
  }, {})
}

function Form({
  methods,
  onSubmit,
  className,
  children,
  noValidate = true,
  persistKey = '',
  persistIgnoreFields = [],
  ...props
}) {
  const isHydratedRef = useRef(false)
  const safePersistKey = String(persistKey || '').trim()
  const shouldPersist = Boolean(safePersistKey)
  const ignoredDraftFields = useMemo(
    () =>
      Array.isArray(persistIgnoreFields)
        ? persistIgnoreFields.map((field) => String(field || '').trim()).filter(Boolean)
        : [],
    [persistIgnoreFields],
  )

  useEffect(() => {
    if (!shouldPersist) {
      return
    }

    const storedDraft = readFormDraft(safePersistKey)
    if (storedDraft && typeof storedDraft === 'object' && !Array.isArray(storedDraft)) {
      methods.reset({
        ...methods.getValues(),
        ...storedDraft,
      })
    }

    isHydratedRef.current = true
  }, [methods, safePersistKey, shouldPersist])

  useEffect(() => {
    if (!shouldPersist || !isHydratedRef.current) {
      return
    }

    const subscription = methods.watch((values) => {
      const nextValues = getPersistedFormValues({
        values,
        ignoreFields: ignoredDraftFields,
      })
      writeFormDraft(safePersistKey, nextValues)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [ignoredDraftFields, methods, safePersistKey, shouldPersist])

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
