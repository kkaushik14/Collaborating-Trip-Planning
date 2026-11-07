import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useOutletContext } from 'react-router-dom'

import { AnalyticsPanel } from '../components/features/index.js'
import { FormMessage, RHFTextField } from '../components/forms/index.js'
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
  PageForm,
  PageSelectField,
} from './PageStates.jsx'
import {
  canEditTripContent,
  formatDateLabel,
  formatDateTimeLabel,
  getTripCurrency,
  normalizeActorRole,
} from './tripPageUtils.js'

const getPrimaryError = (...errors) => errors.find(Boolean) || null
const editableExchangeRateSchema = exchangeRateSchema.omit({ asOf: true })

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
  const [selectedSnapshotId, setSelectedSnapshotId] = useState('')
  const exchangeRateDefaultValues = {
    baseCurrency: getTripCurrency(trip),
    quoteCurrency: getTripCurrency(trip) === 'USD' ? 'INR' : 'USD',
    rate: '',
    source: 'manual',
  }
  const conversionDefaultValues = {
    amount: 100,
    fromCurrency: getTripCurrency(trip),
    toCurrency: getTripCurrency(trip) === 'USD' ? 'INR' : 'USD',
  }
  const reportSnapshotDefaultValues = {
    reportType: 'analytics',
    format: 'json',
  }

  const exchangeRateForm = useForm({
    resolver: zodResolver(editableExchangeRateSchema),
    defaultValues: exchangeRateDefaultValues,
  })

  const conversionForm = useForm({
    resolver: zodResolver(currencyConversionSchema),
    defaultValues: conversionDefaultValues,
  })

  const reportSnapshotForm = useForm({
    resolver: zodResolver(reportSnapshotSchema),
    defaultValues: reportSnapshotDefaultValues,
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
      description: 'Recorded trip expenses for this period.',
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
      description: 'Estimate based on past expenses, not a spending limit.',
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
    if (!snapshotId || snapshotDownloadMutation.isPending) {
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
          anchor.download = `snapshot-${snapshotId}.${isJson ? 'json' : contentType.includes('csv') ? 'csv' : 'txt'}`
          document.body.appendChild(anchor)
          anchor.click()
          anchor.remove()
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
        },
      },
    )
  }

  if (isLoading) {
    return (
      <PageLoadingState
        title="Loading analytics..."
        description="Fetching spending trends, balances, exchange rates, and reports."
      />
    )
  }

  if (combinedError) {
    return (
      <PageErrorState
        title="Unable to load analytics"
        description="Some analytics details are unavailable right now."
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
    <div className="min-w-0 max-w-full space-y-md">
      <section className="grid gap-sm sm:grid-cols-2 xl:grid-cols-4">
        <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Trend Points</p>
          <p className="mt-2xs text-title font-semibold text-ink">{totalTrendPoints}</p>
        </article>
        <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Exchange Rates</p>
          <p className="mt-2xs text-title font-semibold text-ink">{mappedExchangeRates.length}</p>
        </article>
        <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Settlement Balances</p>
          <p className="mt-2xs text-title font-semibold text-ink">{mappedSettlements.length}</p>
        </article>
        <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card">
          <p className="text-caption text-ink-muted">Snapshots</p>
          <p className="mt-2xs text-title font-semibold text-ink">{mappedSnapshots.length}</p>
        </article>
      </section>

      {!canEdit ? (
        <PageEmptyState
          title="Exchange rates are read-only"
          description="Only owners and editors can update exchange rates. You can still convert currency and create or download reports."
        />
      ) : null}

      <section className="grid gap-md xl:grid-cols-3">
        <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card sm:p-lg">
          <h2 className="text-title-sm font-semibold text-ink">Update Exchange Rate</h2>
          <PageForm
            methods={exchangeRateForm}
            disabled={!canEdit || updateExchangeRateMutation.isPending}
            onSubmit={(values) => {
              if (!canEdit) {
                return
              }
              updateExchangeRateMutation.mutate(
                { tripId, body: values },
                {
                  onSuccess: () => {
                    exchangeRateForm.reset(values)
                  },
                },
              )
            }}
            persistKey={`trip:${tripId}:analytics:update-rate`}
            className="mt-sm space-y-sm"
          >
            <RHFTextField name="baseCurrency" label="Base Currency" required />
            <RHFTextField name="quoteCurrency" label="Quote Currency" required />
            <RHFTextField name="rate" label="Rate" type="number" step="any" required />
            <RHFTextField name="source" label="Source" required />
            <p className="text-body-sm text-ink-muted">Enter the rate you want to use. It is dated when saved; live rates are not fetched automatically.</p>
            {updateExchangeRateMutation.error ? (
              <FormMessage>{updateExchangeRateMutation.error?.message}</FormMessage>
            ) : null}
            <Button type="submit" disabled={updateExchangeRateMutation.isPending || !canEdit}>
              {updateExchangeRateMutation.isPending ? 'Saving...' : 'Save Rate'}
            </Button>
          </PageForm>
        </article>

        <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card sm:p-lg">
          <h2 className="text-title-sm font-semibold text-ink">Currency Conversion</h2>
          <PageForm
            methods={conversionForm}
            disabled={createConversionMutation.isPending}
            onSubmit={(values) => {
              createConversionMutation.mutate(
                { tripId, body: values },
                {
                  onSuccess: () => {
                    conversionForm.reset(values)
                  },
                },
              )
            }}
            persistKey={`trip:${tripId}:analytics:convert-currency`}
            className="mt-sm space-y-sm"
          >
            <RHFTextField name="amount" label="Amount" type="number" min="0" step="0.01" required />
            <RHFTextField name="fromCurrency" label="From" required />
            <RHFTextField name="toCurrency" label="To" required />
            {createConversionMutation.error ? (
              <FormMessage>{createConversionMutation.error?.message}</FormMessage>
            ) : null}
            <Button type="submit" disabled={createConversionMutation.isPending}>
              {createConversionMutation.isPending ? 'Converting...' : 'Convert'}
            </Button>
            {createConversionMutation.data?.conversion ? (
              <p role="status" className="text-body-sm text-ink-muted">
                Converted:{' '}
                <span className="font-medium text-ink">
                  {Number(createConversionMutation.data.conversion.convertedAmount || 0).toFixed(2)}{' '}
                  {createConversionMutation.data.conversion.toCurrency}
                </span>
              </p>
            ) : null}
          </PageForm>
        </article>

        <article className="min-w-0 break-words rounded-xl border border-line bg-panel p-md shadow-card sm:p-lg">
          <h2 className="text-title-sm font-semibold text-ink">Report Snapshots</h2>
          <PageForm
            methods={reportSnapshotForm}
            disabled={createSnapshotMutation.isPending}
            onSubmit={(values) => {
              createSnapshotMutation.mutate(
                { tripId, body: values },
                {
                  onSuccess: () => {
                    reportSnapshotForm.reset(reportSnapshotDefaultValues)
                  },
                },
              )
            }}
            persistKey={`trip:${tripId}:analytics:create-snapshot`}
            className="mt-sm space-y-sm"
          >
            <PageSelectField name="reportType" label="Report Type" options={['analytics', 'settlement', 'budget', 'expenses']} />
            <PageSelectField name="format" label="Format" options={['json', 'csv']} />
            {createSnapshotMutation.error ? (
              <FormMessage>{createSnapshotMutation.error?.message}</FormMessage>
            ) : null}
            <Button type="submit" disabled={createSnapshotMutation.isPending}>
              {createSnapshotMutation.isPending ? 'Creating...' : 'Create Snapshot'}
            </Button>
          </PageForm>

          <div className="mt-md space-y-xs">
            <label htmlFor="snapshot-download" className="text-body-sm text-ink-muted">Report to download</label>
            <select
              id="snapshot-download"
              className="h-10 w-full rounded-md border border-line-strong bg-panel px-lg text-body-sm text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
              value={selectedSnapshotId}
              disabled={!mappedSnapshots.length || snapshotDownloadMutation.isPending}
              onChange={(event) => setSelectedSnapshotId(event.target.value)}
            >
              <option value="">Select snapshot to download</option>
              {mappedSnapshots.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>
                  {snapshot.reportType} · {snapshot.generatedAtLabel}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" disabled={!mappedSnapshots.some((snapshot) => snapshot.id === selectedSnapshotId) || snapshotDownloadMutation.isPending} onClick={() => triggerSnapshotDownload(selectedSnapshotId)}>
              {snapshotDownloadMutation.isPending ? 'Downloading...' : 'Download Report'}
            </Button>
            {!mappedSnapshots.length ? <p className="text-body-sm text-ink-muted">Create a snapshot above to save and download a report.</p> : null}
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
