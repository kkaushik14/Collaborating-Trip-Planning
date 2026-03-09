import mongoose from 'mongoose'
import { env } from './env.js'

const connectDatabase = async () => {
  try {
    await mongoose.connect(env.mongoUri, {
      dbName: env.mongoDbName,
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    console.log(`MongoDB connected: ${env.mongoDbName}`)
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    throw error
  }
}

export { connectDatabase }
