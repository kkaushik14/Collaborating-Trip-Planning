import { ArrowRightIcon, TrendingUpIcon } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/index.js'
import { Timeline } from '@/components/timeline/index.js'
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

function AnalyticsPanel({
  trendTimeline = [],
  forecastTimeline = [],
  exchangeRates = [],
  settlements = [],
  settlementTransfers = [],
  snapshots = [],
  className,
}) {
  return (
    <section className={cn('space-y-lg', className)}>
      <header className="space-y-xs">
        <Heading level={2}>Analytics & Reports</Heading>
        <Text tone="muted">
          Trends, forecasting, exchange rates, settlement reports, and export snapshots.
        </Text>
      </header>

      <div className="grid gap-lg xl:grid-cols-2">
        <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
          <Heading level={3} size="title-sm">
            Expense Trend Timeline
          </Heading>
          <Timeline items={trendTimeline} />
        </article>

        <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
          <Heading level={3} size="title-sm">
            Forecast Projection
          </Heading>
          <Timeline items={forecastTimeline} />
        </article>
      </div>

      <div className="grid gap-lg xl:grid-cols-2">
        <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
          <header className="flex items-center justify-between gap-sm">
            <Heading level={3} size="title-sm">
              Exchange Rates
            </Heading>
            <TrendingUpIcon className="size-4 text-ink-muted" />
          </header>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pair</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>As Of</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exchangeRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{rate.pair}</TableCell>
                  <TableCell>{rate.rate}</TableCell>
                  <TableCell>{rate.source}</TableCell>
                  <TableCell>{rate.asOfLabel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </article>

        <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
          <Heading level={3} size="title-sm">
            Report Snapshots
          </Heading>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.map((snapshot) => (
                <TableRow key={snapshot.id}>
                  <TableCell>{snapshot.reportType}</TableCell>
                  <TableCell>{snapshot.format}</TableCell>
                  <TableCell>{snapshot.generatedAtLabel}</TableCell>
                  <TableCell>{snapshot.createdByName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </article>
      </div>

      <div className="grid gap-lg xl:grid-cols-2">
        <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
          <Heading level={3} size="title-sm">
            Settlement Balances
          </Heading>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Owed</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((balance) => (
                <TableRow key={balance.userId}>
                  <TableCell>{balance.userName}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(balance.paid, balance.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(balance.owed, balance.currency)}
                  </TableCell>
                  <TableCell className={cn('text-right', balance.net >= 0 ? 'text-success' : 'text-danger')}>
                    {formatCurrency(balance.net, balance.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </article>

        <article className="space-y-md rounded-lg border border-line bg-panel p-lg shadow-card">
          <Heading level={3} size="title-sm">
            Suggested Settlements
          </Heading>

          <ul className="space-y-sm">
            {settlementTransfers.map((transfer, index) => (
              <li key={`${transfer.fromUser}-${transfer.toUser}-${index}`} className="rounded-md border border-line bg-panel-muted p-sm">
                <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center gap-xs text-body-sm text-ink">
                    {transfer.fromUser}
                    <ArrowRightIcon className="size-4 text-ink-muted" />
                    {transfer.toUser}
                  </span>
                  <Text weight="semibold">
                    {formatCurrency(transfer.amount, transfer.currency)}
                  </Text>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}

export { AnalyticsPanel }
