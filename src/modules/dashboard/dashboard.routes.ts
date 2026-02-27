// src/modules/dashboard/dashboard.routes.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { verifyJwt } from '../../middlewares/verify-jwt'
import { verifyRole } from '../../middlewares/verify-role'
import { DashboardService } from './dashboard.service'

const dashboardService = new DashboardService()

export async function dashboardRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.addHook('onRequest', verifyJwt)

  server.get('/', {
    preHandler: [verifyRole(['ADMIN'])], // 🔒 Apenas o Dono pode ver os números da empresa
    schema: {
      summary: 'Retorna os indicadores principais da academia (Dashboard)',
      tags: ['Dashboard'],
      security: [{ bearerAuth: [] }],
    }
  }, async (request, reply) => {
    try {
      const dashboardData = await dashboardService.getGymDashboard(request.user.gymId)
      return reply.send(dashboardData)
    } catch (error: any) {
      return reply.status(500).send({ error: 'Erro ao carregar o dashboard.' })
    }
  })
}