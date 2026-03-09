import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import multer from 'multer'

import { env } from '../config/index.js'

const ensureUploadDirectory = () => {
  fs.mkdirSync(env.uploadDir, { recursive: true })
}

const sanitizeFileName = (fileName) => {
  const ext = path.extname(fileName)
  const name = path.basename(fileName, ext).replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
  return `${name}${ext.toLowerCase()}`
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    ensureUploadDirectory()
    callback(null, env.uploadDir)
  },
  filename: (_req, file, callback) => {
    const id = crypto.randomBytes(8).toString('hex')
    const safeName = sanitizeFileName(file.originalname)
    callback(null, `${Date.now()}-${id}-${safeName}`)
  },
})

const allowedMimeTypePattern = /^(image\/|application\/pdf$)/

const fileFilter = (_req, file, callback) => {
  if (!allowedMimeTypePattern.test(file.mimetype)) {
    callback(new Error('Only image and PDF files are allowed'))
    return
  }

  callback(null, true)
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

const uploadSingleAttachment = upload.single('file')

export { uploadSingleAttachment }
