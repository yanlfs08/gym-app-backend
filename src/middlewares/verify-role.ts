// src/middlewares/verify-role.ts
import { FastifyReply, FastifyRequest } from 'fastify'

// Recebe um array de cargos permitidos
export function verifyRole(allowedRoles: Array<'ADMIN' | 'TRAINER' | 'STUDENT' | 'SUPER_ADMIN'>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { role } = request.user

    if (!allowedRoles.includes(role)) {
      return reply.status(403).send({
        error: 'Acesso negado. Você não tem permissão para executar esta ação.',
      })
    }
  }
}
