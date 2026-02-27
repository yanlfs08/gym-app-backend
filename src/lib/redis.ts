// src/lib/redis.ts
import { Redis } from 'ioredis'
import { env } from '../env'

// Cria a instância de conexão com o Redis
export const redis = new Redis(env.REDIS_URL)

redis.on('connect', () => {
  console.log('📦 Redis conectado com sucesso!')
})

redis.on('error', (err) => {
  console.error('❌ Erro na conexão com o Redis:', err)
})