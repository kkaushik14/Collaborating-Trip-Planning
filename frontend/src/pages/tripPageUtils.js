const formatDateLabel = (value, options = {}) => {
  if (!value) {
    return 'TBD'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'TBD'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    ...options,
  }).format(date)
}

const formatDateTimeLabel = (value) => {
  if (!value) {
    return 'TBD'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'TBD'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatTimeLabel = (value) => {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const formatFileSize = (bytes) => {
  const parsed = Number(bytes || 0)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return '0 B'
  }

  if (parsed < 1024) {
    return `${parsed} B`
  }

  if (parsed < 1024 * 1024) {
    return `${(parsed / 1024).toFixed(1)} KB`
  }

  return `${(parsed / (1024 * 1024)).toFixed(1)} MB`
}

const formatCurrency = (amount, currency = 'USD', maximumFractionDigits = 0) => {
  const safeAmount = Number(amount || 0)

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits,
    }).format(safeAmount)
  } catch {
    return `${safeAmount} ${currency}`
  }
}

const getActivityLocationLabel = (activity = {}) =>
  activity.locationName || activity.address || activity.location || 'TBD'

const mapTripSummary = (trip = {}) => ({
  title: trip.title || 'Untitled Trip',
  dateRangeLabel: `${formatDateLabel(trip.startDate)} - ${formatDateLabel(trip.endDate)}`,
  travelerCount: Number(trip.travelerCount || 0),
})

const fallbackMemberName = (id) => {
  if (!id) {
    return 'Unknown Member'
  }

  return `Member ${String(id).slice(-4).toUpperCase()}`
}

export {
  fallbackMemberName,
  formatCurrency,
  formatDateLabel,
  formatDateTimeLabel,
  formatFileSize,
  formatTimeLabel,
  getActivityLocationLabel,
  mapTripSummary,
}
