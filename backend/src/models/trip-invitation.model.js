import mongoose from 'mongoose'
import { INVITABLE_ROLES, INVITATION_STATUS } from './model.constants.js'

const { Schema, model } = mongoose

const tripInvitationSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    role: {
      type: String,
      enum: INVITABLE_ROLES,
      required: true,
      default: 'VIEWER',
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: INVITATION_STATUS,
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

tripInvitationSchema.index({ trip: 1, email: 1, status: 1 })

const TripInvitation = model('TripInvitation', tripInvitationSchema)

export { TripInvitation }
