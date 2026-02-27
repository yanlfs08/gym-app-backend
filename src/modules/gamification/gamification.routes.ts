// src/modules/gamification/gamification.routes.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { verifyJwt } from '../../middlewares/verify-jwt'
import { GamificationService } from './gamification.service'
import { createWorkoutLogSchema } from './gamification.schema'
import { z } from 'zod'

const gamificationService = new GamificationService()

export async function gamificationRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.addHook('onRequest', verifyJwt)

  // 1. Registrar Carga e Ganhar Pontos (Apenas o Aluno faz isso)
  server.post('/logs', {
    schema: {
      summary: 'Registra a carga de um exercício e gera pontos (Gamificação)',
      tags: ['Gamification'],
      security: [{ bearerAuth: [] }],
      body: createWorkoutLogSchema,
    },
  }, async (request, reply) => {
    try {
      // Impede que um personal "treine" no lugar do aluno
      if (request.user.role !== 'STUDENT') {
        return reply.status(403).send({ error: 'Apenas alunos podem registrar cargas e ganhar pontos.' })
      }

      const result = await gamificationService.logExerciseAndReward(
        request.user.gymId,
        request.user.sub,
        request.body
      )
      return reply.status(201).send(result)
    } catch (error: any) {
      return reply.status(400).send({ error: error.message })
    }
  })

  // 2. Leaderboard (Ranking da Academia)
  server.get('/ranking', {
    schema: {
      summary: 'Lista o Top 10 de alunos com mais pontos na academia',
      tags: ['Gamification'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const ranking = await gamificationService.getGymRanking(request.user.gymId)
      return reply.send(ranking)
    } catch (error: any) {
      return reply.status(400).send({ error: error.message })
    }
  })
}