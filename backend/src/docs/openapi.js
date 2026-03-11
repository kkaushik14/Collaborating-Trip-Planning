const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Collaborating Trip Planning API',
    version: '1.0.0',
    description: 'Backend APIs for trip planning, collaboration, and organization',
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local',
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
