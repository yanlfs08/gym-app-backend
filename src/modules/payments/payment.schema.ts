// src/modules/payments/payment.schema.ts
import { z } from 'zod'

export const createCouponSchema = z.object({
  code: z.string().min(3, 'O código deve ter pelo menos 3 caracteres').toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive('O valor do desconto deve ser maior que zero'),
  expiresAt: z.coerce.date().optional(),
  maxUses: z.number().int().positive().optional(),
})
export type CreateCouponInput = z.infer<typeof createCouponSchema>

export const createPaymentSchema = z.object({
  studentId: z.string().cuid('ID do aluno inválido'),
  amount: z.number().positive('O valor subtotal deve ser maior que zero'),
  referenceMonth: z.number().int().min(1).max(12),
  referenceYear: z.number().int().min(2024),
  paidAt: z.coerce.date().optional(),
  couponCode: z.string().optional(), 
  manualDiscount: z.number().nonnegative().optional(), 
  manualDiscountReason: z.string().optional(),
})
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>

export const markAsPaidSchema = z.object({
  paidAt: z.coerce.date().default(new Date()),
})

// Schema para filtrar a lista no painel do ADMIN
export const listPaymentsQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().optional(),
  status: z.enum(['PAID', 'PENDING']).optional(),
  studentId: z.string().cuid().optional(),
})

export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>