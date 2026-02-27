// src/modules/assessments/assessment.schema.ts
import { z } from 'zod'

export const createAssessmentSchema = z.object({
  studentId: z.string().cuid('ID do aluno inválido'),
  weight: z.number().positive('Peso (kg) deve ser positivo'),
  height: z.number().positive('Altura (cm ou m) deve ser positiva'),

  // Dados necessários para a fórmula de Jackson & Pollock
  age: z.number().int().positive('A idade é obrigatória para o cálculo'),
  gender: z.enum(['MALE', 'FEMALE'], { required_error: 'O gênero é obrigatório para o cálculo' }),

  notes: z.string().optional(),

  // Dobras cutâneas em milímetros (mm)
  chestFold: z.number().nonnegative().optional(),
  axillaryFold: z.number().nonnegative().optional(),
  tricepsFold: z.number().nonnegative().optional(),
  subscapularFold: z.number().nonnegative().optional(),
  abdomenFold: z.number().nonnegative().optional(),
  suprailiacFold: z.number().nonnegative().optional(),
  thighFold: z.number().nonnegative().optional(),
})

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>
