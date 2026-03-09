import { MongoClient } from 'mongodb'
import { env } from '../config/index.js'

const mongoClient = new MongoClient(env.mongoUri)

export { mongoClient }
