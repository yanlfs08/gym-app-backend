// src/modules/payments/payment.routes.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { verifyJwt } from '../../middlewares/verify-jwt'
import { verifyRole } from '../../middlewares/verify-role'
import { PaymentService } from './payment.service'
import { createPaymentSchema, listPaymentsQuerySchema, markAsPaidSchema, createCouponSchema } from './payment.schema'
import { z } from 'zod'

const paymentService = new PaymentService()

export async function paymentRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>()

  server.addHook('onRequest', verifyJwt)

  // 1. Criar Cobrança (Apenas ADMIN)
  server.post('/', {
    preHandler: [verifyRole(['ADMIN'])],
    schema: {
      summary: 'Lança uma cobrança de mensalidade para um aluno',
      tags: ['Payments'],
      security: [{ bearerAuth: [] }],
      body: createPaymentSchema,
    },
  }, async (request, reply) => {
    try {
      const payment = await paymentService.createPayment(request.user.gymId, request.body)
      return reply.status(201).send(payment)
    } catch (error: any) {
      return reply.status(400).send({ error: error.message })
    }
  })

  // 2. Marcar como Pago (Apenas ADMIN)
  server.patch('/:id/pay', {
    preHandler: [verifyRole(['ADMIN'])],
    schema: {
      summary: 'Marca uma cobrança pendente como paga',
      tags: ['Payments'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string() }),
      body: markAsPaidSchema,
    },
  }, async (request, reply) => {
    try {
      const payment = await paymentService.markAsPaid(
        request.user.gymId, 
        request.params.id, 
        request.body.paidAt
      )
      return reply.send(payment)
    } catch (error: any) {
      return reply.status(400).send({ error: error.message })
    }
  })

  // 3. Listar Pagamentos da Academia (Painel do ADMIN)
  server.get('/', {
    preHandler: [verifyRole(['ADMIN'])],
    schema: {
      summary: 'Lista todas as cobranças da academia com filtros e resumo financeiro',
      tags: ['Payments'],
      security: [{ bearerAuth: [] }],
      querystring: listPaymentsQuerySchema,
    },
  }, async (request, reply) => {
    const result = await paymentService.getGymPayments(request.user.gymId, request.query)
    return reply.send(result)
  })

  // 4. Listar Pagamentos do Aluno Autenticado (App do Aluno)
  server.get('/me', {
    preHandler: [verifyRole(['STUDENT'])],
    schema: {
      summary: 'Lista o histórico de pagamentos do próprio aluno',
      tags: ['Payments'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const payments = await paymentService.getStudentPayments(request.user.gymId, request.user.sub)
    return reply.send(payments)
  })

  // 5. Criar Cupom (Apenas ADMIN)
  server.post('/coupons', {
    preHandler: [verifyRole(['ADMIN'])],
    schema: {
      summary: 'Cria um cupom de desconto promocional',
      tags: ['Payments'],
      security: [{ bearerAuth: [] }],
      body: createCouponSchema,
    },
  }, async (request, reply) => {
    try {
      const coupon = await paymentService.createCoupon(request.user.gymId, request.body)
      return reply.status(201).send(coupon)
    } catch (error: any) {
      return reply.status(400).send({ error: error.message })
    }
  })
}