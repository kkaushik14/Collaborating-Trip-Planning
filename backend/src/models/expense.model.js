import mongoose from 'mongoose'
import { EXPENSE_CATEGORIES, SPLIT_TYPES } from './model.constants.js'

const { Schema, model } = mongoose

const expenseSplitSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    weight: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
  },
)

const expenseSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    day: {
      type: Schema.Types.ObjectId,
      ref: 'ItineraryDay',
      default: null,
      index: true,
    },
    activity: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      default: null,
      index: true,
    },
    reservation: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      default: null,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: true,
      default: 'other',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    normalizedAmount: {
      type: Number,
      min: 0,
      default: 0,
      index: true,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: 'USD',
    },
    normalizedCurrency: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: 'USD',
      index: true,
    },
    exchangeRateApplied: {
      type: Number,
      min: 0.000001,
      default: 1,
    },
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    splitType: {
      type: String,
      enum: SPLIT_TYPES,
      default: 'none',
    },
    splitBetween: {
      type: [expenseSplitSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: '',
    },
    receiptAttachment: {
      type: Schema.Types.ObjectId,
      ref: 'Attachment',
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

expenseSchema.index({ trip: 1, expenseDate: -1 })
expenseSchema.index({ trip: 1, category: 1, expenseDate: -1 })

const Expense = model('Expense', expenseSchema)

export { Expense }
