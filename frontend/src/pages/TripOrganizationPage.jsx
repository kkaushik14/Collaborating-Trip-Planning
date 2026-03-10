import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'

import { OrganizationPanel } from '../components/features/index.js'
import {
  useAttachments,
  useChecklists,
  useExpenses,
  useReservations,
  useTripBudgetSummary,
  useUpdateChecklistItem,
} from '../hooks/index.js'
import {
  PageErrorState,
  PageLoadingState,
} from './PageStates.jsx'
import {
  formatDateLabel,
  formatDateTimeLabel,
  formatFileSize,
} from './tripPageUtils.js'

const BUDGET_TONES = ['primary', 'warning', 'success', 'neutral', 'danger']

const getPrimaryError = (...errors) => errors.find(Boolean) || null

const TripOrganizationPage = () => {
  const { tripId } = useOutletContext()

  const checklistsQuery = useChecklists({ tripId })
  const attachmentsQuery = useAttachments({ tripId })
  const reservationsQuery = useReservations({ tripId })
  const expensesQuery = useExpenses({ tripId })
  const budgetQuery = useTripBudgetSummary({ tripId })
  const updateChecklistItemMutation = useUpdateChecklistItem()

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
        description="One or more organization endpoints failed."
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
        onChecklistToggle={(checklistId, itemId, nextChecked) =>
          updateChecklistItemMutation.mutate({
            tripId,
            checklistId,
            itemId,
            body: {
              isCompleted: nextChecked,
            },
          })
        }
      />
    </div>
  )
}

export default TripOrganizationPage
