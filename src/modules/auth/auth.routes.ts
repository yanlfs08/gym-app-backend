import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { AuthService } from './auth.service'
import { loginSchema, registerGymSchema } from './auth.schema'
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
}
