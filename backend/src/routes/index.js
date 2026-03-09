import express from 'express'

import { authRouter } from './auth.routes.js'
import { healthRouter } from './health.routes.js'
import { invitationRouter } from './invitation.routes.js'
import { tripRouter } from './trip.routes.js'

const apiRouter = express.Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/invitations', invitationRouter)
apiRouter.use('/trips', tripRouter)

export { apiRouter, authRouter, healthRouter, invitationRouter, tripRouter }
