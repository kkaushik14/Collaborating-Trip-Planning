import express from 'express'

import { acceptInvitation, listMyInvitations } from '../controllers/index.js'
import { authenticate } from '../middlewares/index.js'
import { collaborationSchemas, validateRequest } from '../validators/index.js'

const invitationRouter = express.Router()

invitationRouter.use(authenticate)

invitationRouter.get('/mine', listMyInvitations)
invitationRouter.post(
  '/accept',
  validateRequest({ body: collaborationSchemas.acceptInvitation }),
  acceptInvitation,
)

export { invitationRouter }
