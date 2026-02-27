// src/modules/users/user.routes.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { verifyJwt } from '../../middlewares/verify-jwt'
import { verifyRole } from '../../middlewares/verify-role'
import { UserService } from './user.service'
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from './user.schema'
import { prisma } from '../../lib/prisma'

const userService = new UserService()

export async function userRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>()

  // Protege TODAS as rotas deste plugin com o JWT
  server.addHook('onRequest', verifyJwt)

  // 1. Obter próprio perfil (Livre para qualquer um autenticado)
  server.get(
    '/me',
    {
      schema: {
        summary: 'Obtém o perfil do utilizador autenticado',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({ id: z.string(), name: z.string(), email: z.string(), role: z.string(), gymId: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const user = await prisma.user.findFirst({
        where: { id: request.user.sub, gymId: request.user.gymId, deletedAt: null },
      })
      if (!user) return reply.status(404).send({ error: 'Usuário não encontrado.' })
      return reply.send({ id: user.id, name: user.name, email: user.email, role: user.role, gymId: user.gymId })
    },
  )

  // 2. Listar Usuários (Somente ADMIN e TRAINER)
  server.get(
    '/',
    {
      preHandler: [verifyRole(['ADMIN', 'TRAINER'])],
      schema: {
        summary: 'Lista usuários da academia (Paginado)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        querystring: listUsersQuerySchema,
      },
    },
    async (request, reply) => {
      const result = await userService.listUsers(request.user.gymId, request.query)
      return reply.send(result)
    },
  )

  // 3. Criar Usuário (Somente ADMIN)
  server.post(
    '/',
    {
      preHandler: [verifyRole(['ADMIN'])],
      schema: {
        summary: 'Cria um novo usuário na academia',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        body: createUserSchema,
      },
    },
    async (request, reply) => {
      try {
        const user = await userService.createUser(request.user.gymId, request.body)
        return reply.status(201).send(user)
      } catch (error: any) {
        return reply.status(400).send({ error: error.message })
      }
    },
  )

  // 4. Atualizar Usuário (Somente ADMIN)
  server.patch(
    '/:id',
    {
      preHandler: [verifyRole(['ADMIN'])],
      schema: {
        summary: 'Atualiza dados de um usuário',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        params: z.object({ id: z.string() }),
        body: updateUserSchema,
      },
    },
    async (request, reply) => {
      try {
        const user = await userService.updateUser(request.user.gymId, request.params.id, request.body)
        return reply.send(user)
      } catch (error: any) {
        return reply.status(400).send({ error: error.message })
      }
    },
  )

  // 5. Deletar Usuário (Soft Delete) (Somente ADMIN)
  server.delete(
    '/:id',
    {
      preHandler: [verifyRole(['ADMIN'])],
      schema: {
        summary: 'Remove um usuário da academia (Soft Delete)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        params: z.object({ id: z.string() }),
      },
    },
    async (request, reply) => {
      try {
        await userService.softDeleteUser(request.user.gymId, request.params.id)
        return reply.status(204).send()
      } catch (error: any) {
        return reply.status(400).send({ error: error.message })
      }
    },
  )
}
