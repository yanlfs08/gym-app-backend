// src/modules/assessments/assessment.routes.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { verifyJwt } from '../../middlewares/verify-jwt'
import { verifyRole } from '../../middlewares/verify-role'
import { AssessmentService } from './assessment.service'
import { createAssessmentSchema } from './assessment.schema'

const assessmentService = new AssessmentService()

export async function assessmentRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.addHook('onRequest', verifyJwt)

  // 1. Criar Avaliação (Apenas ADMIN e TRAINER)
  server.post(
    '/',
    {
      preHandler: [verifyRole(['ADMIN', 'TRAINER'])],
      schema: {
        summary: 'Registra uma avaliação física e calcula o BF%',
        tags: ['Assessments'],
        security: [{ bearerAuth: [] }],
        body: createAssessmentSchema,
      },
    },
    async (request, reply) => {
      try {
        const assessment = await assessmentService.createAssessment(
          request.user.gymId,
          request.user.sub, // ID de quem está avaliando
          request.body,
        )
        return reply.status(201).send(assessment)
      } catch (error: any) {
        return reply.status(400).send({ error: error.message })
      }
    },
  )

  // 2. Listar Avaliações do Próprio Aluno
  server.get(
    '/me',
    {
      schema: {
        summary: 'Lista o histórico de avaliações do utilizador autenticado',
        tags: ['Assessments'],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const history = await assessmentService.getStudentHistory(request.user.gymId, request.user.sub)
        return reply.send(history)
      } catch (error: any) {
        return reply.status(400).send({ error: error.message })
      }
    },
  )
}
