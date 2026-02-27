// src/modules/workouts/workout.schema.ts
import { z } from 'zod'

// --- SCHEMA DE EXERCÍCIOS ---
export const createExerciseSchema = z.object({
  name: z.string().min(2, 'Nome do exercício é obrigatório'),
  description: z.string().optional(),
  videoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  muscleGroup: z.enum(['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'CARDIO']),
})
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>

// --- SCHEMA DA FICHA DE TREINO (ANINHADO) ---
const workoutItemSchema = z.object({
  exerciseId: z.string().cuid('ID do exercício inválido'),
  sets: z.number().int().positive('Número de séries deve ser positivo'),
  reps: z.string().min(1, 'Repetições são obrigatórias (ex: "10-12" ou "Falha")'),
  restSeconds: z.number().int().nonnegative('Descanso não pode ser negativo'),
})

const workoutSplitSchema = z.object({
  name: z.string().min(1, 'Nome do treino (Ex: Treino A) é obrigatório'),
  items: z.array(workoutItemSchema).min(1, 'O treino precisa ter pelo menos um exercício'),
})

export const createWorkoutSheetSchema = z.object({
  // studentId é opcional no payload porque se for o próprio ALUNO criando, pegamos do token
  studentId: z.string().cuid('ID do aluno inválido').optional(),
  name: z.string().min(2, 'Nome da ficha (Ex: Hipertrofia) é obrigatório'),
  workouts: z.array(workoutSplitSchema).min(1, 'A ficha precisa ter pelo menos uma divisão (Treino A)'),
})
export type CreateWorkoutSheetInput = z.infer<typeof createWorkoutSheetSchema>
