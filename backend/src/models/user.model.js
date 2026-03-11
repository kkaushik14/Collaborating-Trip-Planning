import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const { Schema, model } = mongoose

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    emailUpdateCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 2,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    avatarUrl: {
      type: String,
      default: null,
      trim: true,
    },
    mobileNumber: {
      type: String,
      default: null,
      trim: true,
      maxlength: 32,
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return
  }

  this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.isPasswordCorrect = async function isPasswordCorrect(password) {
  return bcrypt.compare(password, this.password)
}

const User = model('User', userSchema)

export { User }
