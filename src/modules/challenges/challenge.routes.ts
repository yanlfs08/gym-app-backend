// src/modules/challenges/challenge.routes.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { verifyJwt } from '../../middlewares/verify-jwt'
import { ChallengeService } from './challenge.service'
import { createChallengeSchema, joinChallengeSchema } from './challenge.schema'
import { z } from 'zod'

const challengeService = new ChallengeService()

export async function challengeRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.addHook('onRequest', verifyJwt)

  // 1. Criar Desafio (Qualquer um pode criar)
  server.post('/', {
    schema: {
      summary: 'Cria um novo desafio (Público ou Privado)',
      tags: ['Challenges'],
      security: [{ bearerAuth: [] }],
      body: createChallengeSchema,
    },
  }, async (request, reply) => {
    try {
      const challenge = await challengeService.createChallenge(
        request.user.gymId,
        request.user.sub,
        request.body
      )
      return reply.status(201).send(challenge)
    } catch (error: any) {
      return reply.status(400).send({ error: error.message })
    }
  })

  // 2. Listar Desafios Públicos
  server.get('/public', {
    schema: {
      summary: 'Lista os desafios públicos ativos da academia',
      tags: ['Challenges'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const challenges = await challengeService.listPublicChallenges(request.user.gymId)
    return reply.send(challenges)
  })

  // 3. Entrar no Desafio
  server.post('/:id/join', {
    schema: {
      summary: 'Entra em um desafio (Requer inviteCode se for privado)',
      tags: ['Challenges'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string() }),
      body: joinChallengeSchema,
    },
  }, async (request, reply) => {
    try {
      const result = await challengeService.joinChallenge(
        request.user.gymId,
        request.user.sub,
        request.params.id,
        request.body.inviteCode
      )
      return reply.send(result)
    } catch (error: any) {
      return reply.status(400).send({ error: error.message })
    }
  })

  // 4. Sair do Desafio
  server.post('/:id/leave', {
    schema: {
      summary: 'Sai de um desafio',
      tags: ['Challenges'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string() }),
    },
  }, async (request, reply) => {
    await challengeService.leaveChallenge(request.user.sub, request.params.id)
    return reply.send({ message: 'Você saiu do desafio.' })
  })

  // 5. Excluir Desafio (Admin ou Criador)
  server.delete('/:id', {
    schema: {
      summary: 'Exclui o desafio (Apenas Admin ou o Criador)',
      tags: ['Challenges'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string() }),
    },
  }, async (request, reply) => {
    try {
      await challengeService.deleteChallenge(
        request.user.gymId,
        request.user.sub,
        request.user.role,
        request.params.id
      )
      return reply.send({ message: 'Desafio excluído com sucesso.' })
    } catch (error: any) {
      return reply.status(403).send({ error: error.message })
    }
  })

  // 6. Ranking do Desafio
  server.get('/:id/ranking', {
    schema: {
      summary: 'Retorna o ranking atualizado do desafio (Cargas ou Check-ins)',
      tags: ['Challenges'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string() }),
    },
  }, async (request, reply) => {
    try {
      const ranking = await challengeService.getChallengeRanking(request.user.gymId, request.params.id)
      return reply.send(ranking)
    } catch (error: any) {
      return reply.status(400).send({ error: error.message })
    }
  })
}