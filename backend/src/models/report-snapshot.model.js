import mongoose from 'mongoose'

const { Schema, model } = mongoose

const reportSnapshotSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    reportType: {
      type: String,
      required: true,
      enum: ['analytics', 'settlement', 'budget', 'expenses'],
      index: true,
    },
    format: {
      type: String,
      required: true,
      enum: ['json', 'csv'],
      default: 'json',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    filters: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

reportSnapshotSchema.index({ trip: 1, reportType: 1, createdAt: -1 })

const ReportSnapshot = model('ReportSnapshot', reportSnapshotSchema)

export { ReportSnapshot }
