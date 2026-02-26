// src/modules/auth/auth.service.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  it('deve lançar erro se tentar logar com email inexistente', async () => {
    const authService = new AuthService()

    // Mock do prisma para simular que o usuário não existe
    vi.mock('../../lib/prisma', () => ({
      prisma: { user: { findUnique: vi.fn().mockResolvedValue(null) } },
    }))

    await expect(authService.authenticate({ email: 'fake@email.com', password: '123' })).rejects.toThrow(
      'Credenciais inválidas.',
    )
  })
})
