// src/modules/users/user.schema.ts
import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['ADMIN', 'TRAINER', 'STUDENT','SUPER_ADMIN']),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'TRAINER', 'STUDENT','SUPER_ADMIN']).optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

// Schema para a query da URL (Paginação e Busca)
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'TRAINER', 'STUDENT','SUPER_ADMIN']).optional(),
})

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>