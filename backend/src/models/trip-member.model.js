import mongoose from 'mongoose'
import { TRIP_ROLES } from './model.constants.js'

const { Schema, model } = mongoose

const tripMemberSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: TRIP_ROLES,
      required: true,
      default: 'VIEWER',
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

tripMemberSchema.index({ trip: 1, user: 1 }, { unique: true })
tripMemberSchema.index(
  { trip: 1, role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: 'OWNER', isActive: true },
  },
)

const TripMember = model('TripMember', tripMemberSchema)

export { TripMember }
