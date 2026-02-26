import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import cors from '@fastify/cors'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { env } from './env'
import { authRoutes } from './modules/auth/auth.routes'

export const app = fastify()

// Compiladores do Zod para o Fastify
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

// Middlewares e Plugins
app.register(cors, { origin: '*' }) // Em produção, restrinja isso!
app.register(fastifyJwt, { secret: env.JWT_SECRET })

// Registro de Rotas
app.register(authRoutes, { prefix: '/api/auth' })

// Global Error Handler
app.setErrorHandler((error, _, reply) => {
  if (error.validation) {
    return reply.status(400).send({ error: 'Erro de validação', details: error.validation })
  }
  console.error(error)
  return reply.status(500).send({ error: 'Erro interno do servidor.' })
})
