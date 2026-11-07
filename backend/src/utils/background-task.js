import { waitUntil } from '@vercel/functions'
import { env } from '../config/index.js'

// Vercel can suspend execution after the response unless this work is registered.
const keepAlive = (promise) => {
  if (env.isVercel) waitUntil(promise)
  return promise
}

export { keepAlive }
