import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useOutletContext } from 'react-router-dom'

import { OrganizationPanel } from '../components/features/index.js'
import { Form, FormMessage, RHFTextField, RHFTextareaField } from '../components/forms/index.js'
import {
  useAttachments,
  useChecklists,
  useCreateAttachment,
  useCreateAttachmentUpload,
  useCreateChecklist,
  useCreateChecklistItem,
  useCreateExpense,
  useCreateReservation,
  useExpenses,
  useReservations,
  useTripBudgetSummary,
  useUpdateTripBudget,
  useUpdateChecklistItem,
} from '../hooks/index.js'
import { Button } from '../components/ui/index.js'
import {
  attachmentMetadataSchema,
  budgetSchema,
  checklistItemSchema,
  checklistSchema,
  expenseSchema,
  reservationSchema,
} from '../validators/index.js'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from './PageStates.jsx'
import {
  canEditTripContent,
  formatCurrency,
  formatDateLabel,
  formatDateTimeLabel,
  formatFileSize,
  normalizeActorRole,
} from './tripPageUtils.js'

const BUDGET_TONES = ['primary', 'warning', 'success', 'neutral', 'danger']

const getPrimaryError = (...errors) => errors.find(Boolean) || null

const TripOrganizationPage = () => {
  const { tripId, trip } = useOutletContext()

  const checklistsQuery = useChecklists({ tripId })
  const attachmentsQuery = useAttachments({ tripId })
  const reservationsQuery = useReservations({ tripId })
  const expensesQuery = useExpenses({ tripId })
  const budgetQuery = useTripBudgetSummary({ tripId })
  const updateChecklistItemMutation = useUpdateChecklistItem()
  const createChecklistMutation = useCreateChecklist()
  const createChecklistItemMutation = useCreateChecklistItem()
  const createAttachmentMutation = useCreateAttachment()
  const createAttachmentUploadMutation = useCreateAttachmentUpload()
  const createReservationMutation = useCreateReservation()
  const createExpenseMutation = useCreateExpense()
  const updateTripBudgetMutation = useUpdateTripBudget()
  const [selectedChecklistId, setSelectedChecklistId] = useState('')
  const actorRole = normalizeActorRole(trip?.actorRole)
  const canEdit = canEditTripContent(actorRole)
  const checklistDefaultValues = {
    title: '',
    type: 'todo',
  }
  const checklistItemDefaultValues = {
    label: '',
    isCompleted: false,
    sortOrder: 0,
  }
  const attachmentMetaDefaultValues = {
    fileName: '',
    mimeType: '',
    sizeBytes: 1,
    url: '',
  }
  const reservationDefaultValues = {
    title: '',
    reservationType: 'hotel',
    providerName: '',
    confirmationCode: '',
    startDateTime: '',
    endDateTime: '',
    amount: 0,
    currency: 'USD',
    notes: '',
  }
  const expenseDefaultValues = {
    title: '',
    category: 'food',
    amount: 0,
    currency: 'USD',
    expenseDate: '',
    notes: '',
  }
  const budgetDefaultValues = {
    currency: 'USD',
    totalBudget: 1000,
  }

  const checklistForm = useForm({
    resolver: zodResolver(checklistSchema),
    defaultValues: checklistDefaultValues,
  })

  const checklistItemForm = useForm({
    resolver: zodResolver(checklistItemSchema),
    defaultValues: checklistItemDefaultValues,
  })

  const attachmentMetaForm = useForm({
    resolver: zodResolver(attachmentMetadataSchema),
    defaultValues: attachmentMetaDefaultValues,
  })

  const reservationForm = useForm({
    resolver: zodResolver(reservationSchema),
    defaultValues: reservationDefaultValues,
  })

  const expenseForm = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: expenseDefaultValues,
  })

  const budgetForm = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: budgetDefaultValues,
  })

  const isLoading =
    checklistsQuery.isPending ||
    attachmentsQuery.isPending ||
    reservationsQuery.isPending ||
    expensesQuery.isPending ||
    budgetQuery.isPending

  const combinedError = getPrimaryError(
    checklistsQuery.error,
    attachmentsQuery.error,
    reservationsQuery.error,
    expensesQuery.error,
    budgetQuery.error,
  )

  const mappedChecklists = useMemo(() => {
    const checklists = checklistsQuery.data?.checklists || []

    return checklists.map((checklist) => ({
      id: checklist._id,
      title: checklist.title || 'Untitled Checklist',
      type: checklist.type || 'general',
      items: (checklist.items || []).map((item) => ({
        id: item._id,
        label: item.label || 'Untitled Item',
        isCompleted: Boolean(item.isCompleted),
      })),
    }))
  }, [checklistsQuery.data?.checklists])

  const mappedAttachments = useMemo(() => {
    const attachments = attachmentsQuery.data?.attachments || []

    return attachments.map((attachment) => ({
      id: attachment._id,
      fileName: attachment.fileName || 'Unknown file',
      mimeType: attachment.mimeType || 'application/octet-stream',
      sizeLabel: formatFileSize(attachment.sizeBytes),
      uploadedAtLabel: formatDateLabel(attachment.createdAt),
      url: attachment.url || '',
    }))
  }, [attachmentsQuery.data?.attachments])

  const mappedReservations = useMemo(() => {
    const reservations = reservationsQuery.data?.reservations || []

    return reservations.map((reservation) => ({
      id: reservation._id,
      title: reservation.title || 'Untitled Reservation',
      providerName: reservation.providerName || 'Unknown Provider',
      status: reservation.status || 'unknown',
      confirmationCode: reservation.confirmationCode || 'N/A',
      startLabel: formatDateTimeLabel(reservation.startDateTime),
      endLabel: formatDateTimeLabel(reservation.endDateTime),
      amount: Number(reservation.amount || 0),
      currency: reservation.currency || 'USD',
    }))
  }, [reservationsQuery.data?.reservations])

  const mappedExpenses = useMemo(() => {
    const expenses = expensesQuery.data?.expenses || []

    return expenses.map((expense) => ({
      id: expense._id,
      title: expense.title || 'Untitled Expense',
      category: expense.category || 'general',
      paidByName: expense.paidBy ? `Member ${String(expense.paidBy).slice(-4)}` : 'Unknown',
      amount: Number(expense.amount || 0),
      currency: expense.currency || 'USD',
      dateLabel: formatDateLabel(expense.expenseDate || expense.createdAt),
    }))
  }, [expensesQuery.data?.expenses])

  const mappedBudget = useMemo(() => {
    const budget = budgetQuery.data?.budget || {}
    const summary = budget.summary || budgetQuery.data?.summary || {}
    const spentByCategory = summary.spentByCategory || {}

    return {
      currency: budget.currency || 'USD',
      totalBudget: Number(budget.totalBudget || 0),
      segments: Object.entries(spentByCategory).map(([category, value], index) => ({
        id: `segment-${category}`,
        label: category,
        value: Number(value || 0),
        tone: BUDGET_TONES[index % BUDGET_TONES.length],
      })),
    }
  }, [budgetQuery.data?.budget, budgetQuery.data?.summary])
  const completedChecklistItems = mappedChecklists.reduce(
    (count, checklist) => count + checklist.items.filter((item) => item.isCompleted).length,
    0,
  )
  const totalChecklistItems = mappedChecklists.reduce(
    (count, checklist) => count + checklist.items.length,
    0,
  )
  const totalExpenses = mappedExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)

  if (isLoading) {
    return (
      <PageLoadingState
        title="Loading organization data..."
        description="Fetching checklists, files, reservations, and budget."
      />
    )
  }

  if (combinedError) {
    return (
      <PageErrorState
        title="Unable to load organization section"
        description="Some organization details could not be loaded."
        errorMessage={combinedError?.message}
        onRetry={() =>
          Promise.all([
            checklistsQuery.refetch(),
            attachmentsQuery.refetch(),
            reservationsQuery.refetch(),
            expensesQuery.refetch(),
            budgetQuery.refetch(),
          ])
        }
      />
    )
  }

  return (
    <div className="space-y-md">
      <section className="grid gap-sm sm:grid-cols-3">
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Checklist Progress</p>
          <p className="mt-2xs text-title font-semibold text-ink">
            {completedChecklistItems}/{totalChecklistItems || 0}
          </p>
        </article>
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Attachments</p>
          <p className="mt-2xs text-title font-semibold text-ink">{mappedAttachments.length}</p>
        </article>
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Total Expenses</p>
          <p className="mt-2xs text-title font-semibold text-ink">
            {formatCurrency(totalExpenses, mappedBudget.currency)}
          </p>
        </article>
      </section>

      {!canEdit ? (
        <PageEmptyState
          title="Read-only Organization Access"
          description={`Your current role is ${actorRole}. Owners and editors can create and update organization details.`}
        />
      ) : null}

      <section className="grid gap-md lg:grid-cols-2">
        <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
          <h3 className="text-title-sm font-semibold text-ink">Create Checklist</h3>
          <Form
            methods={checklistForm}
            onSubmit={(values) => {
              if (!canEdit) {
                return
              }
              createChecklistMutation.mutate(
                { tripId, body: values },
                {
                  onSuccess: () => {
                    checklistForm.reset(checklistDefaultValues)
                  },
                },
              )
            }}
            persistKey={`trip:${tripId}:organization:create-checklist`}
            className="mt-sm space-y-sm"
          >
            <RHFTextField name="title" label="Title" required />
            <RHFTextField name="type" label="Type" required />
            {createChecklistMutation.error ? (
              <FormMessage>{createChecklistMutation.error?.message}</FormMessage>
            ) : null}
            <Button type="submit" disabled={createChecklistMutation.isPending || !canEdit}>
              {createChecklistMutation.isPending ? 'Creating...' : 'Create Checklist'}
            </Button>
          </Form>
        </article>

        <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
          <h3 className="text-title-sm font-semibold text-ink">Add Checklist Item</h3>
          <Form
            methods={checklistItemForm}
            onSubmit={(values) => {
              if (!canEdit) {
                return
              }
              const checklistId = selectedChecklistId || mappedChecklists[0]?.id
              if (!checklistId) {
                return
              }
              createChecklistItemMutation.mutate(
                {
                  tripId,
                  checklistId,
                  body: {
                    label: values.label,
                  },
                },
                {
                  onSuccess: () => {
                    checklistItemForm.reset(checklistItemDefaultValues)
                  },
                },
              )
            }}
            persistKey={`trip:${tripId}:organization:create-checklist-item`}
            className="mt-sm space-y-sm"
          >
            <div className="space-y-xs">
              <label className="text-body-sm font-medium text-ink" htmlFor="checklist-id">
                Checklist
              </label>
              <select
                id="checklist-id"
                className="h-10 w-full rounded-md border border-line bg-panel px-lg text-body-sm text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                value={selectedChecklistId || mappedChecklists[0]?.id || ''}
                disabled={!canEdit || !mappedChecklists.length}
                onChange={(event) => setSelectedChecklistId(event.target.value)}
              >
                {mappedChecklists.map((checklist) => (
                  <option key={checklist.id} value={checklist.id}>
                    {checklist.title}
                  </option>
                ))}
              </select>
            </div>
            <RHFTextField name="label" label="Item Label" required />
            {createChecklistItemMutation.error ? (
              <FormMessage>{createChecklistItemMutation.error?.message}</FormMessage>
            ) : null}
            <Button type="submit" disabled={createChecklistItemMutation.isPending || !canEdit}>
              {createChecklistItemMutation.isPending ? 'Adding...' : 'Add Item'}
            </Button>
          </Form>
        </article>
      </section>

      <section className="grid gap-md lg:grid-cols-2">
        <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
          <h3 className="text-title-sm font-semibold text-ink">Create Attachment Metadata</h3>
          <Form
            methods={attachmentMetaForm}
            onSubmit={(values) => {
              if (!canEdit) {
                return
              }
              createAttachmentMutation.mutate(
                { tripId, body: values },
                {
                  onSuccess: () => {
                    attachmentMetaForm.reset(attachmentMetaDefaultValues)
                  },
                },
              )
            }}
            persistKey={`trip:${tripId}:organization:create-attachment-meta`}
            className="mt-sm space-y-sm"
          >
            <RHFTextField name="fileName" label="File Name" required />
            <RHFTextField name="mimeType" label="MIME Type" required />
            <RHFTextField name="sizeBytes" label="File Size (bytes)" type="number" required />
            <RHFTextField name="url" label="File URL" required />
            {createAttachmentMutation.error ? (
              <FormMessage>{createAttachmentMutation.error?.message}</FormMessage>
            ) : null}
            <Button type="submit" disabled={createAttachmentMutation.isPending || !canEdit}>
              {createAttachmentMutation.isPending ? 'Creating...' : 'Create Metadata'}
            </Button>
          </Form>
        </article>

        <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
          <h3 className="text-title-sm font-semibold text-ink">Upload Attachment</h3>
          <p className="mt-xs text-body-sm text-ink-muted">
            Upload tickets, documents, or images to keep trip records in one place.
          </p>
          <div className="mt-sm space-y-sm">
            <input
              type="file"
              className="w-full rounded-md border border-line bg-panel px-md py-sm text-body-sm text-ink"
              disabled={!canEdit}
              onChange={(event) => {
                if (!canEdit) {
                  return
                }

                const file = event.target.files?.[0]
                if (!file) {
                  return
                }

                const formData = new FormData()
                formData.append('file', file)
                formData.append('targetType', 'trip')
                createAttachmentUploadMutation.mutate({ tripId, formData })
              }}
            />
            {createAttachmentUploadMutation.error ? (
              <FormMessage>{createAttachmentUploadMutation.error?.message}</FormMessage>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-md lg:grid-cols-2">
        <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
          <h3 className="text-title-sm font-semibold text-ink">Create Reservation</h3>
          <Form
            methods={reservationForm}
            onSubmit={(values) => {
              if (!canEdit) {
                return
              }
              createReservationMutation.mutate(
                { tripId, body: values },
                {
                  onSuccess: () => {
                    reservationForm.reset({
                      ...reservationDefaultValues,
                      reservationType: values.reservationType || reservationDefaultValues.reservationType,
                      currency: values.currency || reservationDefaultValues.currency,
                    })
                  },
                },
              )
            }}
            persistKey={`trip:${tripId}:organization:create-reservation`}
            className="mt-sm space-y-sm"
          >
            <RHFTextField name="title" label="Title" required />
            <RHFTextField name="reservationType" label="Type" required />
            <RHFTextField name="providerName" label="Provider" />
            <RHFTextField name="confirmationCode" label="Confirmation" />
            <RHFTextField name="startDateTime" label="Start" type="datetime-local" required />
            <RHFTextField name="endDateTime" label="End" type="datetime-local" required />
            <RHFTextField name="amount" label="Amount" type="number" />
            <RHFTextField name="currency" label="Currency" />
            <RHFTextareaField name="notes" label="Notes" rows={2} />
            {createReservationMutation.error ? (
              <FormMessage>{createReservationMutation.error?.message}</FormMessage>
            ) : null}
            <Button type="submit" disabled={createReservationMutation.isPending || !canEdit}>
              {createReservationMutation.isPending ? 'Creating...' : 'Create Reservation'}
            </Button>
          </Form>
        </article>

        <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
          <h3 className="text-title-sm font-semibold text-ink">Create Expense</h3>
          <Form
            methods={expenseForm}
            onSubmit={(values) => {
              if (!canEdit) {
                return
              }
              createExpenseMutation.mutate(
                { tripId, body: values },
                {
                  onSuccess: () => {
                    expenseForm.reset({
                      ...expenseDefaultValues,
                      category: values.category || expenseDefaultValues.category,
                      currency: values.currency || expenseDefaultValues.currency,
                    })
                  },
                },
              )
            }}
            persistKey={`trip:${tripId}:organization:create-expense`}
            className="mt-sm space-y-sm"
          >
            <RHFTextField name="title" label="Title" required />
            <RHFTextField name="category" label="Category" required />
            <RHFTextField name="amount" label="Amount" type="number" required />
            <RHFTextField name="currency" label="Currency" required />
            <RHFTextField name="expenseDate" label="Expense Date" type="date" required />
            <RHFTextareaField name="notes" label="Notes" rows={2} />
            {createExpenseMutation.error ? (
              <FormMessage>{createExpenseMutation.error?.message}</FormMessage>
            ) : null}
            <Button type="submit" disabled={createExpenseMutation.isPending || !canEdit}>
              {createExpenseMutation.isPending ? 'Creating...' : 'Create Expense'}
            </Button>
          </Form>
        </article>
      </section>

      <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
        <h3 className="text-title-sm font-semibold text-ink">Update Trip Budget</h3>
        <Form
          methods={budgetForm}
          onSubmit={(values) => {
            if (!canEdit) {
              return
            }
            updateTripBudgetMutation.mutate(
              { tripId, body: values },
              {
                onSuccess: () => {
                  budgetForm.reset({
                    currency: values.currency || budgetDefaultValues.currency,
                    totalBudget: Number(values.totalBudget || budgetDefaultValues.totalBudget),
                  })
                },
              },
            )
          }}
          persistKey={`trip:${tripId}:organization:update-budget`}
          className="mt-sm grid gap-sm sm:grid-cols-3"
        >
          <RHFTextField name="currency" label="Currency" required />
          <RHFTextField name="totalBudget" label="Total Budget" type="number" required />
          <div className="sm:pt-lg">
            <Button type="submit" disabled={updateTripBudgetMutation.isPending || !canEdit}>
              {updateTripBudgetMutation.isPending ? 'Updating...' : 'Update Budget'}
            </Button>
          </div>
          {updateTripBudgetMutation.error ? (
            <div className="sm:col-span-3">
              <FormMessage>{updateTripBudgetMutation.error?.message}</FormMessage>
            </div>
          ) : null}
        </Form>
      </article>

      {updateChecklistItemMutation.error ? (
        <PageErrorState
          title="Checklist update failed"
          description="Could not persist checklist item status."
          errorMessage={updateChecklistItemMutation.error?.message}
          onRetry={() => updateChecklistItemMutation.reset()}
        />
      ) : null}

      <OrganizationPanel
        checklists={mappedChecklists}
        attachments={mappedAttachments}
        reservations={mappedReservations}
        expenses={mappedExpenses}
        budget={mappedBudget}
        canEdit={canEdit}
        onChecklistToggle={(checklistId, itemId, nextChecked) =>
          canEdit
            ? updateChecklistItemMutation.mutate({
                tripId,
                checklistId,
                itemId,
                body: {
                  isCompleted: nextChecked,
                },
              })
            : null
        }
      />
    </div>
  )
}

export default TripOrganizationPage
