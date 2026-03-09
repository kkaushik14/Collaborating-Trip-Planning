import mongoose from 'mongoose'

const { Schema, model } = mongoose

const itineraryDaySchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 140,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: '',
    },
    activityOrder: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Activity',
      },
    ],
  },
  {
    timestamps: true,
  },
)

itineraryDaySchema.index({ trip: 1, dayNumber: 1 }, { unique: true })
itineraryDaySchema.index({ trip: 1, date: 1 }, { unique: true })

const ItineraryDay = model('ItineraryDay', itineraryDaySchema)

export { ItineraryDay }
