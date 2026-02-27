// src/middlewares/verify-jwt.ts

import type { FastifyReply, FastifyRequest } from 'fastify'

export async function verifyJwt(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Verifica o token no cabeçalho Authorization e injeta os dados em request.user
    await request.jwtVerify()
  } catch (err) {
    return reply.status(401).send({ error: 'Não autorizado. Token inválido ou ausente.' })
  }
}
