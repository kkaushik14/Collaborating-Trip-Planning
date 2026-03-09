import mongoose from 'mongoose'
import { TRIP_STATUS, TRIP_VISIBILITY } from './model.constants.js'

const { Schema, model } = mongoose

const tripSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 140,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    travelerCount: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: TRIP_STATUS,
      default: 'draft',
      index: true,
    },
    visibility: {
      type: String,
      enum: TRIP_VISIBILITY,
      default: 'private',
    },
    settings: {
      currency: {
        type: String,
        trim: true,
        uppercase: true,
        minlength: 3,
        maxlength: 3,
        default: 'USD',
      },
      timezone: {
        type: String,
        trim: true,
        default: 'UTC',
      },
    },
  },
  {
    timestamps: true,
  },
)

tripSchema.index({ owner: 1, startDate: 1, endDate: 1 })

tripSchema.pre('validate', function validateTripDates() {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    throw new Error('Trip endDate must be greater than or equal to startDate')
  }
})

const Trip = model('Trip', tripSchema)

export { Trip }
