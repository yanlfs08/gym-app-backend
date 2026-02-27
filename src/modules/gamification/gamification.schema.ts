// src/modules/gamification/gamification.schema.ts
import { z } from 'zod'

export const createWorkoutLogSchema = z.object({
  workoutItemId: z.string().cuid('ID do item de treino inválido'),
  weightUsed: z.number().nonnegative('A carga não pode ser negativa'),
  notes: z.string().optional(),
})

export type CreateWorkoutLogInput = z.infer<typeof createWorkoutLogSchema>