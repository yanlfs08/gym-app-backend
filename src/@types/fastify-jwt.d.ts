// src/@types/fastify-jwt.d.ts

import '@fastify/jwt'

declare module '@fastify/jwt' {
  export interface FastifyJWT {
    // O payload que assinamos no auth.routes.ts
    payload: {
      gymId: string
      role: 'ADMIN' | 'TRAINER' | 'STUDENT'
    }
    // Como o Fastify irá expor esses dados no request.user
    user: {
      sub: string
      gymId: string
      role: 'ADMIN' | 'TRAINER' | 'STUDENT'
    }
  }
}
