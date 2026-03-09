import mongoose from 'mongoose'
import { COMMENT_TARGET_TYPES } from './model.constants.js'

const { Schema, model } = mongoose

const commentSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: COMMENT_TARGET_TYPES,
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
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

commentSchema.index({ trip: 1, targetType: 1, day: 1, createdAt: -1 })
commentSchema.index({ trip: 1, targetType: 1, activity: 1, createdAt: -1 })

commentSchema.pre('validate', function validateCommentTarget() {
  if (this.targetType === 'day' && !this.day) {
    throw new Error('Comment targetType "day" requires day reference')
  }

  if (this.targetType === 'activity' && !this.activity) {
    throw new Error('Comment targetType "activity" requires activity reference')
  }
})

const Comment = model('Comment', commentSchema)

export { Comment }
