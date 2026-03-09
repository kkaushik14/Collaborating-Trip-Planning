import mongoose from 'mongoose'

const { Schema, model } = mongoose

const activitySchema = new Schema(
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
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: '',
    },
    locationName: {
      type: String,
      trim: true,
      maxlength: 180,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    position: {
      type: Number,
      min: 0,
      default: 0,
      index: true,
    },
    estimatedCost: {
      amount: {
        type: Number,
        min: 0,
        default: 0,
      },
      currency: {
        type: String,
        trim: true,
        uppercase: true,
        minlength: 3,
        maxlength: 3,
        default: 'USD',
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
)

activitySchema.index({ day: 1, position: 1 })
activitySchema.index({ trip: 1, day: 1, startTime: 1 })

activitySchema.pre('validate', function validateActivityTimes() {
  if (this.startTime && this.endTime && this.endTime < this.startTime) {
    throw new Error('Activity endTime must be greater than or equal to startTime')
  }
})

const Activity = model('Activity', activitySchema)

export { Activity }
