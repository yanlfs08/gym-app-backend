import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { AuthService } from './auth.service'
import { loginSchema, registerGymSchema, changePasswordSchema } from './auth.schema'
import { verifyJwt } from '../../middlewares/verify-jwt'
import { z } from 'zod'

const authService = new AuthService()

export async function authRoutes(app: FastifyInstance) {
  // Informa ao Fastify para usar o Zod para os tipos de Request/Response
  const server = app.withTypeProvider<ZodTypeProvider>()

  // Rota: Cadastro de Academia (SaaS Onboarding)
  server.post(
    '/register-gym',
    {
      schema: {
        summary: 'Cadastra uma nova academia e seu administrador',
        tags: ['Auth'],
        body: registerGymSchema,
        response: {
          201: z.object({ message: z.string(), gymId: z.string() }),
          400: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await authService.registerGymWithAdmin(request.body)
        return reply.status(201).send({
          message: 'Academia registrada com sucesso.',
          gymId: result.gymId,
        })
      } catch (error: any) {
        // Tratamento de erro simplificado. Em prod, usaríamos um ErrorHandler global.
        return reply.status(400).send({ error: error.message })
      }
    },
  )

  // Rota: Login (Gera o JWT Multi-tenant)
  server.post(
    '/login',
    {
      schema: {
        summary: 'Autentica um usuário (Admin, Personal ou Aluno)',
        tags: ['Auth'],
        body: loginSchema,
        response: {
          200: z.object({ token: z.string() }),
          401: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      try {
        const user = await authService.authenticate(request.body)

        // Assinatura do JWT contendo o Tenant (gymId) e a Permissão (role)
        const token = await reply.jwtSign(
          {
            gymId: user.gymId,
            role: user.role,
          },
          {
            sign: { sub: user.id, expiresIn: '7d' },
          },
        )

        return reply.status(200).send({ token })
      } catch (error: any) {
        return reply.status(401).send({ error: error.message })
      }
    },
  )

  server.post(
    '/change-password',
    {
      onRequest: [verifyJwt], // 🔒 Protege a rota, injetando request.user
      schema: {
        summary: 'Altera a senha do utilizador autenticado',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        body: changePasswordSchema,
        response: {
          200: z.object({ message: z.string() }),
          400: z.object({ error: z.string() }),
          401: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      try {
        // request.user.sub contém o ID do utilizador injetado pelo verifyJwt
        const userId = request.user.sub

        await authService.changePassword(userId, request.body)

        return reply.status(200).send({ message: 'Senha alterada com sucesso.' })
      } catch (error: any) {
        // Se a senha atual for inválida ou o usuário não existir
        return reply.status(400).send({ error: error.message })
      }
    },
  )
}
