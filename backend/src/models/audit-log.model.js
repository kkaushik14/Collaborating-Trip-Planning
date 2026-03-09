import mongoose from 'mongoose'

const { Schema, model } = mongoose

const auditLogSchema = new Schema(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    method: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    statusCode: {
      type: Number,
      required: true,
      index: true,
    },
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    requestId: {
      type: String,
      default: '',
      index: true,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

auditLogSchema.index({ createdAt: -1 })

const AuditLog = model('AuditLog', auditLogSchema)

export { AuditLog }
