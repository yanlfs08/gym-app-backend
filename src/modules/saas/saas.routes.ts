// src/modules/saas/saas.routes.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { verifyJwt } from '../../middlewares/verify-jwt'
import { verifyRole } from '../../middlewares/verify-role'
import { SaasService } from './saas.service'

const saasService = new SaasService()

export async function saasRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.addHook('onRequest', verifyJwt)

  // 1. Dashboard de Produto
  server.get('/dashboard/product', {
    preHandler: [verifyRole(['SUPER_ADMIN'])], // 🔒 Apenas VOCÊ pode ver isto
    schema: {
      summary: 'Visão Global de Produto para o Dono do SaaS',
      tags: ['SaaS Admin'],
      security: [{ bearerAuth: [] }],
    }
  }, async (request, reply) => {
    const metrics = await saasService.getProductMetrics()
    return reply.send(metrics)
  })

  // 2. Dashboard Financeiro
  server.get('/dashboard/finance', {
    preHandler: [verifyRole(['SUPER_ADMIN'])], // 🔒 Apenas VOCÊ pode ver isto
    schema: {
      summary: 'Visão Global Financeira (MRR) para o Dono do SaaS',
      tags: ['SaaS Admin'],
      security: [{ bearerAuth: [] }],
    }
  }, async (request, reply) => {
    const finance = await saasService.getFinancialMetrics()
    return reply.send(finance)
  })
}