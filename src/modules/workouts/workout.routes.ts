// src/modules/workouts/workout.routes.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { verifyJwt } from '../../middlewares/verify-jwt'
import { verifyRole } from '../../middlewares/verify-role'
import { WorkoutService } from './workout.service'
import { createExerciseSchema, createWorkoutSheetSchema } from './workout.schema'

const workoutService = new WorkoutService()

export async function workoutRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.addHook('onRequest', verifyJwt)

  // ---------------------------------------------------------
  // 1. Cadastrar Exercício (Agora passa o gymId)
  // ---------------------------------------------------------
  server.post(
    '/exercises',
    {
      preHandler: [verifyRole(['ADMIN', 'TRAINER'])],
      schema: {
        summary: 'Cadastra um novo exercício no catálogo da academia',
        tags: ['Workouts'],
        security: [{ bearerAuth: [] }],
        body: createExerciseSchema,
      },
    },
    async (request, reply) => {
      try {
        // 🔒 Passamos o gymId para isolar o catálogo
        const exercise = await workoutService.createExercise(request.user.gymId, request.body)
        return reply.status(201).send(exercise)
      } catch (error: any) {
        return reply.status(400).send({ error: error.message })
      }
    },
  )

  // ---------------------------------------------------------
  // 2. Criar Ficha de Treino
  // ---------------------------------------------------------
  server.post(
    '/sheets',
    {
      schema: {
        summary: 'Cria uma ficha de treino com divisões e exercícios',
        tags: ['Workouts'],
        security: [{ bearerAuth: [] }],
        body: createWorkoutSheetSchema,
      },
    },
    async (request, reply) => {
      try {
        const sheet = await workoutService.createWorkoutSheet(
          request.user.gymId,
          request.user.sub,
          request.user.role,
          request.body,
        )
        return reply.status(201).send(sheet)
      } catch (error: any) {
        return reply.status(400).send({ error: error.message })
      }
    },
  )

  // ---------------------------------------------------------
  // 3. Listar Fichas do Aluno Autenticado (NOVO)
  // ---------------------------------------------------------
  server.get(
    '/sheets/me',
    {
      schema: {
        summary: 'Lista as fichas de treino do utilizador autenticado',
        description: 'As fichas criadas pelos personais aparecem com prioridade no topo da lista.',
        tags: ['Workouts'],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        // Busca as fichas passando o ID da academia e o ID do aluno (sub)
        const sheets = await workoutService.getStudentWorkoutSheets(request.user.gymId, request.user.sub)
        return reply.send(sheets)
      } catch (error: any) {
        return reply.status(400).send({ error: error.message })
      }
    },
  )
}
