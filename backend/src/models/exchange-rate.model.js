import mongoose from 'mongoose'

const { Schema, model } = mongoose

const exchangeRateSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    baseCurrency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      index: true,
    },
    quoteCurrency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      index: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0.000001,
    },
    source: {
      type: String,
      trim: true,
      default: 'manual',
    },
    asOf: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

exchangeRateSchema.index({ trip: 1, baseCurrency: 1, quoteCurrency: 1 }, { unique: true })

const ExchangeRate = model('ExchangeRate', exchangeRateSchema)

export { ExchangeRate }
