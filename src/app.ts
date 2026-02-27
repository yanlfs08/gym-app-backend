import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import cors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod'
import { env } from './env'

//importações de rotas
import { authRoutes } from './modules/auth/auth.routes'
import { userRoutes } from './modules/users/user.routes'
import { workoutRoutes } from './modules/workouts/workout.routes'
import { assessmentRoutes } from './modules/assessments/assessment.routes'
import { challengeRoutes } from './modules/challenges/challenge.routes'
import { gamificationRoutes } from './modules/gamification/gamification.routes'
import { checkInRoutes } from './modules/checkins/checkin.routes'
import { paymentRoutes } from './modules/payments/payment.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'

export const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

// ---------------------------------------------------------
// Segurança (Helmet e Rate Limit)
// ---------------------------------------------------------
app.register(fastifyRateLimit, {
  max: 50,
  timeWindow: '1 minute',
})

app.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Regras flexíveis para permitir que o CSS e o JS do Swagger carreguem
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
    },
  },
})

// Middlewares Básicos
app.register(cors, { origin: '*' })
app.register(fastifyJwt, { secret: env.JWT_SECRET })

// ---------------------------------------------------------
// Configuração do Swagger
// ---------------------------------------------------------
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Gym App API',
      description: 'API para Gestão de Academias',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

// Registro de Rotas
app.register(authRoutes, { prefix: '/api/auth' })
app.register(userRoutes, { prefix: '/api/users' })
app.register(workoutRoutes, { prefix: '/api/workouts' })
app.register(assessmentRoutes, { prefix: '/api/assessments' })
app.register(gamificationRoutes, { prefix: '/api/gamification' })
app.register(challengeRoutes, { prefix: '/api/challenges' })
app.register(checkInRoutes, { prefix: '/api/checkins' })
app.register(paymentRoutes, { prefix: '/api/payments' })
app.register(dashboardRoutes, { prefix: '/api/dashboard' })

// Global Error Handler
app.setErrorHandler((error: any, _, reply) => {
  if (error.validation) {
    return reply.status(400).send({ error: 'Erro de validação', details: error.validation })
  }

  if (error.statusCode === 429) {
    return reply.status(429).send({ error: 'Muitas requisições. Tente novamente mais tarde.' })
  }
  console.error(error)
  return reply.status(500).send({ error: 'Erro interno do servidor.' })
})
