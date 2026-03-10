import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'

import { AnalyticsPanel } from '../components/features/index.js'
import {
  useExpenseAnalytics,
  useReportSnapshots,
  useSettlementReport,
  useTripExchangeRates,
} from '../hooks/index.js'
import {
  PageErrorState,
  PageLoadingState,
} from './PageStates.jsx'
import { formatDateLabel, formatDateTimeLabel } from './tripPageUtils.js'

const getPrimaryError = (...errors) => errors.find(Boolean) || null

const TripAnalyticsPage = () => {
  const { tripId } = useOutletContext()

  const expenseAnalyticsQuery = useExpenseAnalytics({ tripId })
  const exchangeRatesQuery = useTripExchangeRates({ tripId })
  const settlementQuery = useSettlementReport({ tripId })
  const snapshotsQuery = useReportSnapshots({ tripId })

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
    <AnalyticsPanel
      trendTimeline={mappedTrendTimeline}
      forecastTimeline={mappedForecastTimeline}
      exchangeRates={mappedExchangeRates}
      settlements={mappedSettlements}
      settlementTransfers={mappedSettlementTransfers}
      snapshots={mappedSnapshots}
    />
  )
}

export default TripAnalyticsPage
