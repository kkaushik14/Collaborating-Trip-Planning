import mongoose from 'mongoose'
import { RESERVATION_STATUS, RESERVATION_TYPES } from './model.constants.js'

const { Schema, model } = mongoose

const reservationSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    reservationType: {
      type: String,
      enum: RESERVATION_TYPES,
      required: true,
      default: 'other',
      index: true,
    },
    status: {
      type: String,
      enum: RESERVATION_STATUS,
      default: 'planned',
      index: true,
    },
    providerName: {
      type: String,
      trim: true,
      maxlength: 180,
      default: '',
    },
    confirmationCode: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      default: null,
    },
    location: {
      name: {
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
    },
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
    notes: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: '',
    },
    attachmentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
      },
    ],
  },
  {
    timestamps: true,
  },
)

reservationSchema.index({ trip: 1, reservationType: 1, startDateTime: 1 })

reservationSchema.pre('validate', function validateReservationDates() {
  if (this.startDateTime && this.endDateTime && this.endDateTime < this.startDateTime) {
    throw new Error('Reservation endDateTime must be greater than or equal to startDateTime')
  }
})

const Reservation = model('Reservation', reservationSchema)

export { Reservation }
