// src/modules/checkins/checkin.routes.ts
import { FastifyInstance } from 'fastify'
import { verifyJwt } from '../../middlewares/verify-jwt'
import { verifyRole } from '../../middlewares/verify-role'
import { CheckInService } from './checkin.service'
import { geolocationCheckInSchema } from './checkin.schema'


const checkInService = new CheckInService()

export async function checkInRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt)

  app.post('/', {
    preHandler: [verifyRole(['STUDENT'])],
    schema: {
      summary: 'Realiza o check-in manual diário do aluno',
      tags: ['Check-ins'],
      security: [{ bearerAuth: [] }],
    }
  }, async (request, reply) => {
    try {
      const checkIn = await checkInService.createManualCheckIn(request.user.gymId, request.user.sub)
      return reply.status(201).send({ message: 'Check-in realizado com sucesso!', checkIn })
    } catch (error: any) {
      return reply.status(400).send({ error: error.message })
    }
  })

  app.post('/geo', {
    preHandler: [verifyRole(['STUDENT'])],
    schema: {
      summary: 'Realiza o check-in validando a distância da academia (Max 100m)',
      tags: ['Check-ins'],
      security: [{ bearerAuth: [] }],
      body: geolocationCheckInSchema
    }
  }, async (request, reply) => {
    try {
      const result = await checkInService.createGeolocationCheckIn(
        request.user.gymId, 
        request.user.sub,
        request.body as { userLatitude: number; userLongitude: number }
      )
      return reply.status(201).send({ 
        message: 'Check-in validado pela localização com sucesso!', 
        ...result 
      })
    } catch (error: any) {
      return reply.status(400).send({ error: error.message })
    }
  })
}