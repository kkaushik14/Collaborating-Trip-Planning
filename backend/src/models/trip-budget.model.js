import mongoose from 'mongoose'
import { EXPENSE_CATEGORIES } from './model.constants.js'

const { Schema, model } = mongoose

const budgetCategorySchema = new Schema(
  {
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: true,
    },
    limit: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
)

const tripBudgetSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      unique: true,
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
    totalBudget: {
      type: Number,
      min: 0,
      default: 0,
    },
    categoryLimits: {
      type: [budgetCategorySchema],
      default: [],
    },
    summary: {
      spentTotal: {
        type: Number,
        min: 0,
        default: 0,
      },
      remaining: {
        type: Number,
        default: 0,
      },
      spentByCategory: {
        type: Map,
        of: Number,
        default: {},
      },
      lastCalculatedAt: {
        type: Date,
        default: null,
      },
    },
    alertThresholds: {
      warningPercent: {
        type: Number,
        min: 0,
        default: 80,
      },
      criticalPercent: {
        type: Number,
        min: 0,
        default: 100,
      },
    },
  },
  {
    timestamps: true,
  },
)

tripBudgetSchema.pre('save', function syncRemainingBudget() {
  const spentTotal = this.summary?.spentTotal || 0
  const totalBudget = this.totalBudget || 0
  this.summary.remaining = totalBudget - spentTotal
})

const TripBudget = model('TripBudget', tripBudgetSchema)

export { TripBudget }
