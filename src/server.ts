import { app } from './app'
import { env } from './env'

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log(`🚀 API rodando na porta ${env.PORT} - Modo: ${env.NODE_ENV}`)
})
