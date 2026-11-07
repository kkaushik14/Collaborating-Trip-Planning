import crypto from 'node:crypto'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import mongoose from 'mongoose'

const getBucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'attachments' })

const storeUploadedFile = async (file) => {
  if (!file.buffer) {
    return { storageProvider: 'local', storageKey: file.filename, url: `/uploads/${file.filename}` }
  }
  const storageKey = crypto.randomUUID()
  const stream = getBucket().openUploadStream(storageKey, { metadata: { mimeType: file.mimetype } })
  try {
    await pipeline(Readable.from(file.buffer), stream)
  } catch (error) {
    await stream.abort().catch(() => {})
    throw error
  }
  return { storageProvider: 'gridfs', storageKey, url: `/uploads/${storageKey}` }
}

const removeStoredFile = async ({ storageProvider, storageKey }) => {
  if (storageProvider !== 'gridfs') return
  const bucket = getBucket()
  const file = await bucket.find({ filename: storageKey }).next()
  if (file) await bucket.delete(file._id)
}

const serveStoredFile = async (req, res, next) => {
  try {
    const bucket = getBucket()
    const file = await bucket.find({ filename: req.params.fileName }).next()
    if (!file) return res.status(404).json({ success: false, message: 'File not found', data: null })
    res.setHeader('Content-Type', file.metadata?.mimeType || 'application/octet-stream')
    res.setHeader('Content-Length', file.length)
    res.setHeader('Content-Disposition', 'attachment')
    res.setHeader('Cache-Control', 'private, no-store')
    await pipeline(bucket.openDownloadStream(file._id), res)
  } catch (error) {
    if (res.headersSent) return res.destroy(error)
    next(error)
  }
}

export { storeUploadedFile, removeStoredFile, serveStoredFile }
