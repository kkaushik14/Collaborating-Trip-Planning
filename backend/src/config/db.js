import mongoose from 'mongoose'
import { env } from './env.js'

let connectionPromise

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.mongoUri, {
      dbName: env.mongoDbName,
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).finally(() => { connectionPromise = undefined })
  }
  await connectionPromise
  return mongoose.connection
}

export { connectDatabase }
