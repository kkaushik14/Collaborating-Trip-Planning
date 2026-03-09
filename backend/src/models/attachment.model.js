import mongoose from 'mongoose'
import {
  ATTACHMENT_TARGET_TYPES,
  STORAGE_PROVIDERS,
} from './model.constants.js'

const { Schema, model } = mongoose

const attachmentSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ATTACHMENT_TARGET_TYPES,
      required: true,
      default: 'trip',
      index: true,
    },
    day: {
      type: Schema.Types.ObjectId,
      ref: 'ItineraryDay',
      default: null,
    },
    activity: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      default: null,
    },
    reservation: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      default: null,
    },
    expense: {
      type: Schema.Types.ObjectId,
      ref: 'Expense',
      default: null,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 1,
    },
    storageProvider: {
      type: String,
      enum: STORAGE_PROVIDERS,
      default: 'local',
    },
    storageKey: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    url: {
      type: String,
      trim: true,
      default: '',
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

attachmentSchema.index({ trip: 1, targetType: 1, createdAt: -1 })

const Attachment = model('Attachment', attachmentSchema)

export { Attachment }
