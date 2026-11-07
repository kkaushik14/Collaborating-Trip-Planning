const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Collaborating Trip Planning API',
    version: '1.0.0',
    description: 'Backend APIs for trip planning, collaboration, and organization',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current deployment',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email', maxLength: 254 } },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string', pattern: '^[a-f0-9]{64}$', minLength: 64, maxLength: 64, writeOnly: true },
          password: {
            type: 'string', format: 'password', minLength: 8, maxLength: 128, writeOnly: true,
            description: 'At least 8 characters and at most 72 UTF-8 bytes (bcrypt limit). Not trimmed.',
          },
        },
      },
      PasswordRecoveryResponse: {
        type: 'object',
        properties: {
          statusCode: { type: 'integer', example: 200 },
          success: { type: 'boolean', example: true },
          data: { nullable: true, example: null, description: 'Always null; no tokens or account details returned.' },
          message: { type: 'string' },
        },
      },
      CreateTripRequest: {
        type: 'object',
        required: ['title', 'startDate', 'endDate'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          travelerCount: { type: 'integer', minimum: 1 },
          settings: {
            type: 'object',
            properties: {
              currency: { type: 'string' },
              timezone: { type: 'string' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access token',
      },
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Request a password reset email',
        externalDocs: {
          description: 'OWASP Forgot Password Cheat Sheet',
          url: 'https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html',
        },
        security: [],
        description: 'Email is trimmed and lowercased. All valid requests return the same 200 response for active, inactive, unknown and throttled accounts, including mail failures. Delivery is background best-effort work, not a durable queue. Only the registered active account receives a link at configured frontendBaseUrl + /reset-password?token=...; request headers never choose the URL. The 256-bit random token is stored only as a SHA-256 hash and expires after 30 minutes. Requests within a 60-second per-account cooldown are ignored; a later request replaces the old link. Both recovery endpoints share an in-memory per-IP limit (AUTH_RATE_LIMIT_MAX per RATE_LIMIT_WINDOW_MS, default 20 per 15 minutes) in addition to the API limit. Multi-instance deployments need a shared rate-limit store and trusted proxy configuration.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } },
        },
        responses: {
          200: {
            description: 'Generic acknowledgment; never includes a reset token or confirms delivery.',
            content: { 'application/json': {
              schema: { $ref: '#/components/schemas/PasswordRecoveryResponse' },
              example: { statusCode: 200, success: true, data: null, message: 'If an active account exists for that email, a password reset link will be sent.' },
            } },
          },
          400: { description: 'Missing or invalid email.' },
          429: { description: 'Too many requests. Retry after the Retry-After interval.' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        summary: 'Consume a password reset token and change the password',
        security: [],
        description: 'Send token and password in the JSON body, never the URL. Atomically checks the hash, expiry, active account and unchanged registered email, hashes the new password, consumes the token, clears the refresh session and increments the credential version. Only one concurrent reset can succeed. All previous access and refresh tokens (including legacy tokens without a version) are rejected on subsequent authentication; already-authorized in-flight requests are not cancelled. Does not automatically sign in or issue tokens. Shares the forgot-password per-IP rate limit. Configure HTTPS FRONTEND_BASE_URL and SMTP in production; development JSON mail transport does not deliver mail and reset contents are never logged.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } },
        },
        responses: {
          200: {
            description: 'Password changed. Sign in again with the new password.',
            content: { 'application/json': {
              schema: { $ref: '#/components/schemas/PasswordRecoveryResponse' },
              example: { statusCode: 200, success: true, data: null, message: 'Password reset successfully. Please log in.' },
            } },
          },
          400: { description: 'Malformed input, invalid, expired, replaced or consumed token, inactive account, or changed email. Does not identify the account.' },
          429: { description: 'Too many requests. Retry after the Retry-After interval.' },
          500: { description: 'Recovery could not be processed. No secrets are included in error responses.' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout user',
        security: [{ bearerAuth: [] }],
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user',
        security: [{ bearerAuth: [] }],
      },
      patch: {
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  mobileNumber: { type: 'string', nullable: true },
                  avatarUrl: { type: 'string', format: 'uri', nullable: true },
                  themePreference: { type: 'string', enum: ['light', 'dark'] },
                },
              },
            },
          },
        },
      },
    },
    '/invitations/mine': {
      get: {
        summary: 'List pending invitations for current user',
        security: [{ bearerAuth: [] }],
      },
    },
    '/invitations/accept': {
      post: {
        summary: 'Accept trip invitation',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips': {
      get: {
        summary: 'List my trips',
        security: [{ bearerAuth: [] }],
      },
      post: {
        summary: 'Create trip',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTripRequest' },
            },
          },
        },
      },
    },
    '/trips/{tripId}': {
      get: {
        summary: 'Get trip by id',
        security: [{ bearerAuth: [] }],
      },
      patch: {
        summary: 'Update trip',
        security: [{ bearerAuth: [] }],
      },
      put: {
        summary: 'Update trip',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/days': {
      get: {
        summary: 'List itinerary days',
        security: [{ bearerAuth: [] }],
      },
      post: {
        summary: 'Create itinerary day',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/days/{dayId}/activities': {
      get: {
        summary: 'List day activities',
        security: [{ bearerAuth: [] }],
      },
      post: {
        summary: 'Add activity',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/days/{dayId}/activities/reorder': {
      patch: {
        summary: 'Reorder day activities',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/invitations': {
      get: {
        summary: 'List trip invitations',
        security: [{ bearerAuth: [] }],
      },
      post: {
        summary: 'Invite member',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/members': {
      get: {
        summary: 'List trip members',
        description: 'Each member retains user as an ID string for compatibility. userId is a display profile containing only _id, name, email and avatarUrl; deleted users return only _id. Passwords, password-reset state, refresh hashes and credential versions are never populated.',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/members/me/comment-email-preference': {
      patch: {
        summary: 'Update current member comment email preference',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['commentEmailOptIn'],
                properties: {
                  commentEmailOptIn: {
                    oneOf: [
                      { type: 'string', enum: ['true', 'false'] },
                      { type: 'boolean' },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
    '/trips/{tripId}/members/{memberId}/role': {
      patch: {
        summary: 'Update member role',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/members/{memberId}': {
      delete: {
        summary: 'Deactivate member',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/members/{memberId}/reactivate': {
      post: {
        summary: 'Reactivate member',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/ownership/transfer': {
      post: {
        summary: 'Transfer trip ownership',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/comments': {
      get: {
        summary: 'List comments',
        security: [{ bearerAuth: [] }],
      },
      post: {
        summary: 'Create comment',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/checklists': {
      get: {
        summary: 'List checklists',
        security: [{ bearerAuth: [] }],
      },
      post: {
        summary: 'Create checklist',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/checklists/{checklistId}/items': {
      post: {
        summary: 'Add checklist item',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/checklists/{checklistId}/items/{itemId}': {
      patch: {
        summary: 'Update checklist item',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/attachments': {
      get: {
        summary: 'List attachments',
        security: [{ bearerAuth: [] }],
      },
      post: {
        summary: 'Create attachment metadata',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/attachments/upload': {
      post: {
        summary: 'Upload attachment file',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/reservations': {
      get: {
        summary: 'List reservations',
        security: [{ bearerAuth: [] }],
      },
      post: {
        summary: 'Create reservation',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/expenses': {
      get: {
        summary: 'List expenses',
        security: [{ bearerAuth: [] }],
      },
      post: {
        summary: 'Create expense',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/budget': {
      put: {
        summary: 'Create or update trip budget',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/budget/summary': {
      get: {
        summary: 'Get budget summary',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/organization/overview': {
      get: {
        summary: 'Get organization overview',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/exchange-rates': {
      get: {
        summary: 'List trip exchange rates',
        security: [{ bearerAuth: [] }],
      },
      put: {
        summary: 'Create or update trip exchange rate',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/currency/convert': {
      post: {
        summary: 'Preview currency conversion for trip rate table',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/analytics/expenses': {
      get: {
        summary: 'Get expense trend analytics and forecast',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/settlement': {
      get: {
        summary: 'Get settlement report per member',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/reports/snapshots': {
      get: {
        summary: 'List generated report snapshots',
        security: [{ bearerAuth: [] }],
      },
      post: {
        summary: 'Create report snapshot',
        security: [{ bearerAuth: [] }],
      },
    },
    '/trips/{tripId}/reports/snapshots/{snapshotId}': {
      get: {
        summary: 'Get report snapshot details or download payload',
        security: [{ bearerAuth: [] }],
      },
    },
  },
}

export { openApiSpec }
