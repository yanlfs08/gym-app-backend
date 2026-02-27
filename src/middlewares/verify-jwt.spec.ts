// src/middlewares/verify-jwt.spec.ts
import { describe, it, expect } from 'vitest'
import fastify from 'fastify'
import { verifyJwt } from './verify-jwt'
import fastifyJwt from '@fastify/jwt'

describe('Verify JWT Middleware', () => {
  it('deve retornar erro 401 se o token não for fornecido', async () => {
    const app = fastify()
    app.register(fastifyJwt, { secret: 'test-secret' })

    app.get('/test', { onRequest: [verifyJwt] }, async () => {
      return { success: true }
    })

    const response = await app.inject({
      method: 'GET',
      url: '/test',
    })

    expect(response.statusCode).toEqual(401)
    expect(JSON.parse(response.payload)).toEqual({ error: 'Não autorizado. Token inválido ou ausente.' })
  })
})
