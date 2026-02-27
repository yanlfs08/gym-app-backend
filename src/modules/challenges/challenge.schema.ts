// src/modules/challenges/challenge.schema.ts
import { z } from 'zod'

export const createChallengeSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
  type: z.enum(['TOTAL_WEIGHT', 'CHECK_INS']),
  endDate: z.coerce.date().min(new Date(), 'A data de término deve ser no futuro'),
})

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>

export const joinChallengeSchema = z.object({
  inviteCode: z.string().optional(),
})