import { useMemo, useState } from 'react'
import { FileTextIcon, ReceiptIcon, WalletCardsIcon } from 'lucide-react'

import {
  Button,
  Checkbox,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/index.js'
import { SegmentedBudgetProgress } from '@/components/organization/index.js'
import { Heading, Text } from '@/components/typography/index.js'
import { cn } from '@/lib/utils'

function formatCurrency(amount, currency) {
  const safeAmount = Number(amount || 0)

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(safeAmount)
  } catch {
    return `${safeAmount} ${currency || 'USD'}`
  }
}

function OrganizationPanel({
  checklists = [],
  attachments = [],
  reservations = [],
  expenses = [],
  budget = null,
  onChecklistToggle,
  canEdit = true,
  className,
}) {
  const [sheetItem, setSheetItem] = useState(null)

  const totalExpense = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses],
  )

  return (
    <section className={cn('space-y-lg', className)}>
      <header className="flex flex-wrap items-start justify-between gap-md">
        <div className="space-y-xs">
          <Heading level={2}>Organization</Heading>
          <Text tone="muted">
            Manage packing checklists, documents, reservations, and budget snapshots.
          </Text>
        </div>

        <span className="inline-flex items-center gap-xs rounded-full bg-panel-muted px-sm py-2xs text-caption text-ink-muted">
          <WalletCardsIcon className="size-3.5" />
          {budget?.currency || 'USD'} budget
        </span>
      </header>

      <div className="grid gap-lg xl:grid-cols-[1fr,1.1fr]">
        <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
          <Heading level={3} size="title-sm">
            Checklists
          </Heading>

          <div className="space-y-md">
            {checklists.map((checklist) => (
              <div key={checklist.id} className="rounded-md border border-line bg-panel-muted p-sm">
                <div className="mb-sm flex items-center justify-between gap-sm">
                  <Text weight="semibold">{checklist.title}</Text>
                  <span className="rounded-full bg-panel px-sm py-2xs text-caption text-ink-muted">
                    {checklist.type}
                  </span>
                </div>

                <ul className="space-y-xs">
                  {checklist.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-sm rounded-sm bg-panel px-sm py-xs">
                      <Checkbox
                        checked={item.isCompleted}
                        disabled={!canEdit}
                        onCheckedChange={(nextChecked) =>
                          onChecklistToggle?.(checklist.id, item.id, Boolean(nextChecked))
                        }
                      />
                      <Text
                        size="body-sm"
                        className={item.isCompleted ? 'text-ink-muted line-through' : ''}
                      >
                        {item.label}
                      </Text>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>

        <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
          <Heading level={3} size="title-sm">
            Budget Distribution
          </Heading>

          <SegmentedBudgetProgress
            currency={budget?.currency || 'USD'}
            total={budget?.totalBudget || 0}
            segments={budget?.segments || []}
          />

          <div className="grid gap-sm sm:grid-cols-3">
            <div className="rounded-md border border-line bg-panel-muted p-sm">
              <Text size="caption" tone="muted">
                Total Budget
              </Text>
              <Text weight="semibold">
                {formatCurrency(budget?.totalBudget || 0, budget?.currency)}
              </Text>
            </div>
            <div className="rounded-md border border-line bg-panel-muted p-sm">
              <Text size="caption" tone="muted">
                Total Spent
              </Text>
              <Text weight="semibold">{formatCurrency(totalExpense, budget?.currency)}</Text>
            </div>
            <div className="rounded-md border border-line bg-panel-muted p-sm">
              <Text size="caption" tone="muted">
                Remaining
              </Text>
              <Text weight="semibold">
                {formatCurrency((budget?.totalBudget || 0) - totalExpense, budget?.currency)}
              </Text>
            </div>
          </div>
        </article>
      </div>

      <div className="grid gap-lg lg:grid-cols-2">
        <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
          <header className="flex items-center justify-between gap-sm">
            <Heading level={3} size="title-sm">
              Attachments
            </Heading>
            <FileTextIcon className="size-4 text-ink-muted" />
          </header>

          <ul className="space-y-sm">
            {attachments.map((attachment) => (
              <li key={attachment.id} className="rounded-md border border-line bg-panel-muted p-sm">
                <Text weight="medium">{attachment.fileName}</Text>
                <Text size="caption" tone="muted">
                  {attachment.mimeType} - {attachment.sizeLabel}
                </Text>
                <div className="mt-sm">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={!attachment.url}
                    onClick={() => setSheetItem({ type: 'attachment', payload: attachment })}
                  >
                    View Details
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
          <header className="flex items-center justify-between gap-sm">
            <Heading level={3} size="title-sm">
              Manual Reservations
            </Heading>
            <ReceiptIcon className="size-4 text-ink-muted" />
          </header>

          <ul className="space-y-sm">
            {reservations.map((reservation) => (
              <li key={reservation.id} className="rounded-md border border-line bg-panel-muted p-sm">
                <Text weight="medium">{reservation.title}</Text>
                <Text size="caption" tone="muted">
                  {reservation.providerName} - {reservation.status}
                </Text>
                <div className="mt-sm">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setSheetItem({ type: 'reservation', payload: reservation })}
                  >
                    View Details
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
        <Heading level={3} size="title-sm">
          Expense Summary
        </Heading>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Paid By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.title}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{expense.paidByName}</TableCell>
                <TableCell>{expense.dateLabel}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(expense.amount, expense.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </article>

      <Sheet open={Boolean(sheetItem)} onOpenChange={(isOpen) => !isOpen && setSheetItem(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {sheetItem?.type === 'reservation' ? 'Reservation Detail' : 'Attachment Detail'}
            </SheetTitle>
            <SheetDescription>
              Presentational side sheet. Data is provided by props only.
            </SheetDescription>
          </SheetHeader>

          {sheetItem?.type === 'attachment' ? (
            <div className="space-y-sm">
              <Text weight="semibold">{sheetItem.payload.fileName}</Text>
              <Text tone="muted" size="body-sm">
                {sheetItem.payload.mimeType}
              </Text>
              <Text tone="muted" size="body-sm">
                Uploaded {sheetItem.payload.uploadedAtLabel}
              </Text>
              <Text tone="muted" size="body-sm">
                URL: {sheetItem.payload.url}
              </Text>
            </div>
          ) : null}

          {sheetItem?.type === 'reservation' ? (
            <div className="space-y-sm">
              <Text weight="semibold">{sheetItem.payload.title}</Text>
              <Text tone="muted" size="body-sm">
                Provider: {sheetItem.payload.providerName}
              </Text>
              <Text tone="muted" size="body-sm">
                Confirmation: {sheetItem.payload.confirmationCode}
              </Text>
              <Text tone="muted" size="body-sm">
                {sheetItem.payload.startLabel} - {sheetItem.payload.endLabel}
              </Text>
              <Text tone="muted" size="body-sm">
                {formatCurrency(sheetItem.payload.amount, sheetItem.payload.currency)}
              </Text>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  )
}

export { OrganizationPanel }
