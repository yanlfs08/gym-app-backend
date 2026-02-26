import { z } from 'zod'

// Schema para o dono da academia se cadastrar (SaaS Onboarding)
export const registerGymSchema = z.object({
  gymName: z.string().min(3, 'Nome da academia deve ter pelo menos 3 caracteres'),
  cnpj: z.string().optional(),
  adminName: z.string().min(2, 'Nome é obrigatório'),
  adminEmail: z.string().email('Email inválido'),
  adminPassword: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

export type RegisterGymInput = z.infer<typeof registerGymSchema>

// Schema para Login (usado por Admin, Personal ou Aluno)
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha inválida'),
})

export type LoginInput = z.infer<typeof loginSchema>
