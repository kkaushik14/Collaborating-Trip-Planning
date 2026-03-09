import mongoose from 'mongoose'
import { CHECKLIST_TYPES } from './model.constants.js'

const { Schema, model } = mongoose

const checklistItemSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
)

const checklistSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    type: {
      type: String,
      enum: CHECKLIST_TYPES,
      default: 'todo',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [checklistItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

checklistSchema.index({ trip: 1, type: 1, createdAt: -1 })

const Checklist = model('Checklist', checklistSchema)

export { Checklist }
