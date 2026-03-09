import { ReportSnapshot } from '../models/index.js'

const toCsv = (value) => {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

const rowsToCsv = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return ''
  }

  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]

  for (const row of rows) {
    const line = headers.map((header) => toCsv(row[header])).join(',')
    lines.push(line)
  }

  return lines.join('\n')
}

const normalizeReportPayload = ({ reportType, data, format }) => {
  if (format === 'json') {
    return data
  }

  if (reportType === 'analytics') {
    return {
      csv: rowsToCsv(data.trend || []),
      section: 'trend',
    }
  }

  if (reportType === 'settlement') {
    return {
      balancesCsv: rowsToCsv(data.balances || []),
      settlementsCsv: rowsToCsv(data.settlements || []),
      section: 'settlement',
    }
  }

  if (reportType === 'budget') {
    return {
      csv: rowsToCsv([
        {
          totalBudget: data.budget?.totalBudget || 0,
          spentTotal: data.summary?.spentTotal || 0,
          remaining: data.summary?.remaining || 0,
          utilizationPercent: data.utilizationPercent || 0,
        },
      ]),
      section: 'budget',
    }
  }

  return {
    csv: rowsToCsv(data.expenses || []),
    section: 'expenses',
  }
}

const createReportSnapshot = async ({
  tripId,
  actorId,
  reportType,
  format,
  filters,
  data,
}) => {
  const payload = normalizeReportPayload({ reportType, data, format })

  return ReportSnapshot.create({
    trip: tripId,
    reportType,
    format,
    createdBy: actorId,
    filters: filters || {},
    payload,
    generatedAt: new Date(),
  })
}

const listReportSnapshots = async ({ tripId, reportType }) => {
  const query = { trip: tripId }

  if (reportType) {
    query.reportType = reportType
  }

  return ReportSnapshot.find(query)
    .sort({ createdAt: -1 })
    .lean()
}

const getReportSnapshotById = async ({ tripId, snapshotId }) => {
  return ReportSnapshot.findOne({
    _id: snapshotId,
    trip: tripId,
  }).lean()
}

export {
  createReportSnapshot,
  getReportSnapshotById,
  listReportSnapshots,
}
