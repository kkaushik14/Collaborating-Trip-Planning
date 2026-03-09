import express from 'express'

import { getHealth } from '../controllers/index.js'

const healthRouter = express.Router()

healthRouter.get('/', getHealth)

export { healthRouter }
