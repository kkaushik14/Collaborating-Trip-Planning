import mongoose from 'mongoose'

const isTransactionUnsupportedError = (error) => {
  const message = error?.message || ''
  return (
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set') ||
    message.includes('NoSuchTransaction')
  )
}

const runInTransaction = async (work) => {
  const session = await mongoose.startSession()

  try {
    let result

    await session.withTransaction(async () => {
      result = await work(session)
    })

    return result
  } catch (error) {
    if (isTransactionUnsupportedError(error)) {
      return work(null)
    }

    throw error
  } finally {
    await session.endSession()
  }
}

export { runInTransaction }
