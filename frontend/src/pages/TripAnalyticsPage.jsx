import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useOutletContext } from 'react-router-dom'

import { AnalyticsPanel } from '../components/features/index.js'
import { Form, FormMessage, RHFTextField } from '../components/forms/index.js'
import {
  useCreateCurrencyConversion,
  useCreateReportSnapshot,
  useExpenseAnalytics,
  useReportSnapshotDownload,
  useReportSnapshots,
  useSettlementReport,
  useTripExchangeRates,
  useUpdateTripExchangeRate,
} from '../hooks/index.js'
import { Button } from '../components/ui/index.js'
import {
  currencyConversionSchema,
  exchangeRateSchema,
  reportSnapshotSchema,
} from '../validators/index.js'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from './PageStates.jsx'
import {
  canEditTripContent,
  formatDateLabel,
  formatDateTimeLabel,
  normalizeActorRole,
} from './tripPageUtils.js'

const getPrimaryError = (...errors) => errors.find(Boolean) || null

const TripAnalyticsPage = () => {
  const { tripId, trip } = useOutletContext()

  const expenseAnalyticsQuery = useExpenseAnalytics({ tripId })
  const exchangeRatesQuery = useTripExchangeRates({ tripId })
  const settlementQuery = useSettlementReport({ tripId })
  const snapshotsQuery = useReportSnapshots({ tripId })
  const updateExchangeRateMutation = useUpdateTripExchangeRate()
  const createConversionMutation = useCreateCurrencyConversion()
  const createSnapshotMutation = useCreateReportSnapshot()
  const snapshotDownloadMutation = useReportSnapshotDownload()
  const actorRole = normalizeActorRole(trip?.actorRole)
  const canEdit = canEditTripContent(actorRole)

  const exchangeRateForm = useForm({
    resolver: zodResolver(exchangeRateSchema),
    defaultValues: {
      baseCurrency: 'USD',
      quoteCurrency: 'INR',
      rate: 83,
      source: 'manual',
      asOf: new Date().toISOString().slice(0, 10),
    },
  })

  const conversionForm = useForm({
    resolver: zodResolver(currencyConversionSchema),
    defaultValues: {
      amount: 100,
      fromCurrency: 'USD',
      toCurrency: 'INR',
    },
  })

  const reportSnapshotForm = useForm({
    resolver: zodResolver(reportSnapshotSchema),
    defaultValues: {
      reportType: 'analytics',
      format: 'json',
    },
  })

  const isLoading =
    expenseAnalyticsQuery.isPending ||
    exchangeRatesQuery.isPending ||
    settlementQuery.isPending ||
    snapshotsQuery.isPending

  const combinedError = getPrimaryError(
    expenseAnalyticsQuery.error,
    exchangeRatesQuery.error,
    settlementQuery.error,
    snapshotsQuery.error,
  )

  const mappedTrendTimeline = useMemo(() => {
    const trend = expenseAnalyticsQuery.data?.analytics?.trend || []

    return trend.map((entry, index) => ({
      id: `trend-${entry.period || index}`,
      title: entry.period || `Period ${index + 1}`,
      subtitle: `Total spend ${Number(entry.total || 0).toFixed(0)}`,
      description: `Sequence index ${entry.periodIndex || index + 1}`,
      timeLabel: entry.period || 'N/A',
      status: index === trend.length - 1 ? 'active' : 'completed',
    }))
  }, [expenseAnalyticsQuery.data?.analytics?.trend])

  const mappedForecastTimeline = useMemo(() => {
    const forecast = expenseAnalyticsQuery.data?.analytics?.forecast || []

    return forecast.map((entry, index) => ({
      id: `forecast-${entry.periodIndex || index}`,
      title: `Projection ${entry.periodIndex || index + 1}`,
      subtitle: `Projected ${Number(entry.projectedTotal || 0).toFixed(0)}`,
      description: `Method ${entry.method || 'unknown'}`,
      timeLabel: `Period ${entry.periodIndex || index + 1}`,
      status: 'upcoming',
    }))
  }, [expenseAnalyticsQuery.data?.analytics?.forecast])

  const mappedExchangeRates = useMemo(() => {
    const exchangeRates = exchangeRatesQuery.data?.exchangeRates || []

    return exchangeRates.map((rate) => ({
      id: rate._id,
      pair: `${rate.baseCurrency}/${rate.quoteCurrency}`,
      rate: Number(rate.rate || 0).toFixed(4),
      source: rate.source || 'unknown',
      asOfLabel: formatDateLabel(rate.asOf),
    }))
  }, [exchangeRatesQuery.data?.exchangeRates])

  const mappedSettlements = useMemo(() => {
    const balances = settlementQuery.data?.settlement?.balances || []
    const currency = settlementQuery.data?.settlement?.currency || 'USD'

    return balances.map((balance) => ({
      userId: balance.userId,
      userName: `Member ${String(balance.userId || '').slice(-4).toUpperCase()}`,
      paid: Number(balance.paid || 0),
      owed: Number(balance.owed || 0),
      net: Number(balance.net || 0),
      currency,
    }))
  }, [settlementQuery.data?.settlement?.balances, settlementQuery.data?.settlement?.currency])

  const mappedSettlementTransfers = useMemo(() => {
    const transfers = settlementQuery.data?.settlement?.settlements || []
    const currency = settlementQuery.data?.settlement?.currency || 'USD'

    return transfers.map((transfer) => ({
      fromUser: `Member ${String(transfer.fromUserId || '').slice(-4).toUpperCase()}`,
      toUser: `Member ${String(transfer.toUserId || '').slice(-4).toUpperCase()}`,
      amount: Number(transfer.amount || 0),
      currency: transfer.currency || currency,
    }))
  }, [settlementQuery.data?.settlement?.currency, settlementQuery.data?.settlement?.settlements])

  const mappedSnapshots = useMemo(() => {
    const snapshots = snapshotsQuery.data?.snapshots || []

    return snapshots.map((snapshot) => ({
      id: snapshot._id,
      reportType: snapshot.reportType || 'unknown',
      format: snapshot.format || 'json',
      generatedAtLabel: formatDateTimeLabel(snapshot.generatedAt || snapshot.createdAt),
      createdByName: snapshot.createdBy ? `Member ${String(snapshot.createdBy).slice(-4).toUpperCase()}` : 'Unknown',
    }))
  }, [snapshotsQuery.data?.snapshots])
  const totalTrendPoints = mappedTrendTimeline.length + mappedForecastTimeline.length

  const triggerSnapshotDownload = (snapshotId) => {
    if (!snapshotId) {
      return
    }

    snapshotDownloadMutation.mutate(
      {
        tripId,
        snapshotId,
      },
      {
        onSuccess: (payload) => {
          const content = payload?.content
          const contentType = payload?.contentType || 'application/json'
          const isJson = contentType.includes('json')
          const blobContent =
            typeof content === 'string'
              ? content
              : isJson
                ? JSON.stringify(content, null, 2)
                : String(content || '')

          const blob = new Blob([blobContent], { type: contentType })
          const downloadUrl = URL.createObjectURL(blob)
          const anchor = document.createElement('a')
          anchor.href = downloadUrl
          anchor.download = `snapshot-${snapshotId}.${isJson ? 'json' : 'txt'}`
          document.body.appendChild(anchor)
          anchor.click()
          anchor.remove()
          URL.revokeObjectURL(downloadUrl)
        },
      },
    )
  }

  if (isLoading) {
    return (
      <PageLoadingState
        title="Loading analytics..."
        description="Fetching trend, settlement, currency, and reporting datasets."
      />
    )
  }

  if (combinedError) {
    return (
      <PageErrorState
        title="Unable to load analytics"
        description="One or more analytics endpoints failed."
        errorMessage={combinedError?.message}
        onRetry={() =>
          Promise.all([
            expenseAnalyticsQuery.refetch(),
            exchangeRatesQuery.refetch(),
            settlementQuery.refetch(),
            snapshotsQuery.refetch(),
          ])
        }
      />
    )
  }

  return (
    <div className="space-y-md">
      <section className="grid gap-sm sm:grid-cols-4">
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Trend Points</p>
          <p className="mt-2xs text-title font-semibold text-ink">{totalTrendPoints}</p>
        </article>
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Exchange Rates</p>
          <p className="mt-2xs text-title font-semibold text-ink">{mappedExchangeRates.length}</p>
        </article>
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Settlement Balances</p>
          <p className="mt-2xs text-title font-semibold text-ink">{mappedSettlements.length}</p>
        </article>
        <article className="rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Snapshots</p>
          <p className="mt-2xs text-title font-semibold text-ink">{mappedSnapshots.length}</p>
        </article>
      </section>

      {!canEdit ? (
        <PageEmptyState
          title="Read-only Analytics Actions"
          description={`Your current role is ${actorRole}. Owner/Editor can update exchange rates and generate snapshots.`}
        />
      ) : null}

      <section className="grid gap-md lg:grid-cols-3">
        <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
          <h3 className="text-title-sm font-semibold text-ink">Update Exchange Rate</h3>
          <Form
            methods={exchangeRateForm}
            onSubmit={(values) => {
              if (!canEdit) {
                return
              }
              updateExchangeRateMutation.mutate({ tripId, body: values })
            }}
            className="mt-sm space-y-sm"
          >
            <RHFTextField name="baseCurrency" label="Base Currency" required />
            <RHFTextField name="quoteCurrency" label="Quote Currency" required />
            <RHFTextField name="rate" label="Rate" type="number" required />
            <RHFTextField name="source" label="Source" required />
            <RHFTextField name="asOf" label="As Of" type="date" required />
            {updateExchangeRateMutation.error ? (
              <FormMessage>{updateExchangeRateMutation.error?.message}</FormMessage>
            ) : null}
            <Button type="submit" disabled={updateExchangeRateMutation.isPending || !canEdit}>
              {updateExchangeRateMutation.isPending ? 'Saving...' : 'Save Rate'}
            </Button>
          </Form>
        </article>

        <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
          <h3 className="text-title-sm font-semibold text-ink">Currency Conversion</h3>
          <Form
            methods={conversionForm}
            onSubmit={(values) => {
              if (!canEdit) {
                return
              }
              createConversionMutation.mutate({ tripId, body: values })
            }}
            className="mt-sm space-y-sm"
          >
            <RHFTextField name="amount" label="Amount" type="number" required />
            <RHFTextField name="fromCurrency" label="From" required />
            <RHFTextField name="toCurrency" label="To" required />
            {createConversionMutation.error ? (
              <FormMessage>{createConversionMutation.error?.message}</FormMessage>
            ) : null}
            <Button type="submit" disabled={createConversionMutation.isPending || !canEdit}>
              {createConversionMutation.isPending ? 'Converting...' : 'Convert'}
            </Button>
            {createConversionMutation.data?.conversion ? (
              <p className="text-body-sm text-ink-muted">
                Converted:{' '}
                <span className="font-medium text-ink">
                  {Number(createConversionMutation.data.conversion.convertedAmount || 0).toFixed(2)}{' '}
                  {createConversionMutation.data.conversion.toCurrency}
                </span>
              </p>
            ) : null}
          </Form>
        </article>

        <article className="rounded-xl border border-line bg-panel p-lg shadow-card">
          <h3 className="text-title-sm font-semibold text-ink">Report Snapshots</h3>
          <Form
            methods={reportSnapshotForm}
            onSubmit={(values) => {
              if (!canEdit) {
                return
              }
              createSnapshotMutation.mutate({ tripId, body: values })
            }}
            className="mt-sm space-y-sm"
          >
            <RHFTextField name="reportType" label="Report Type" required />
            <RHFTextField name="format" label="Format (json/csv)" required />
            {createSnapshotMutation.error ? (
              <FormMessage>{createSnapshotMutation.error?.message}</FormMessage>
            ) : null}
            <Button type="submit" disabled={createSnapshotMutation.isPending || !canEdit}>
              {createSnapshotMutation.isPending ? 'Creating...' : 'Create Snapshot'}
            </Button>
          </Form>

          <div className="mt-md space-y-xs">
            <p className="text-body-sm text-ink-muted">Download latest snapshot</p>
            <select
              className="h-10 w-full rounded-md border border-line bg-panel px-lg text-body-sm text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
              defaultValue=""
              disabled={!mappedSnapshots.length}
              onChange={(event) => triggerSnapshotDownload(event.target.value)}
            >
              <option value="">Select snapshot to download</option>
              {mappedSnapshots.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>
                  {snapshot.reportType} · {snapshot.generatedAtLabel}
                </option>
              ))}
            </select>
            {snapshotDownloadMutation.error ? (
              <FormMessage>{snapshotDownloadMutation.error?.message}</FormMessage>
            ) : null}
          </div>
        </article>
      </section>

      <AnalyticsPanel
        trendTimeline={mappedTrendTimeline}
        forecastTimeline={mappedForecastTimeline}
        exchangeRates={mappedExchangeRates}
        settlements={mappedSettlements}
        settlementTransfers={mappedSettlementTransfers}
        snapshots={mappedSnapshots}
      />
    </div>
  )
}

export default TripAnalyticsPage
