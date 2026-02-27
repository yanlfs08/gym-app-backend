// src/modules/payments/payment.service.ts
import { prisma } from '../../lib/prisma'
import { CreateCouponInput, CreatePaymentInput, ListPaymentsQuery } from './payment.schema'

export class PaymentService {
  // Lança uma nova cobrança (Pendente ou já Paga)
  async createCoupon(gymId: string, data: CreateCouponInput) {
    const existing = await prisma.coupon.findUnique({
      where: { gymId_code: { gymId, code: data.code } }
    })
    
    if (existing) throw new Error('Já existe um cupom com este código na sua academia.')

    return prisma.coupon.create({
      data: { gymId, ...data }
    })
  }

  // 2. Criar Pagamento com Lógica de Descontos
  async createPayment(gymId: string, data: CreatePaymentInput) {
    const student = await prisma.user.findFirst({
      where: { id: data.studentId, gymId, role: 'STUDENT', deletedAt: null }
    })
    if (!student) throw new Error('Aluno não encontrado na sua academia.')

    const existingPayment = await prisma.payment.findFirst({
      where: { studentId: data.studentId, referenceMonth: data.referenceMonth, referenceYear: data.referenceYear }
    })
    if (existingPayment) throw new Error('Já existe uma cobrança para este aluno neste mês/ano.')

    let finalDiscountAmount = 0
    let finalDiscountReason = null
    let usedCouponId = null

    // AVALIA ESTRATÉGIA 2: CUPOM DE DESCONTO
    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { gymId_code: { gymId, code: data.couponCode } }
      })

      if (!coupon || !coupon.isActive) throw new Error('Cupom inválido ou inativo.')
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error('Este cupom já expirou.')
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new Error('Este cupom esgotou o limite de usos.')

      // Calcula o desconto
      if (coupon.type === 'PERCENTAGE') {
        finalDiscountAmount = data.amount * (coupon.value / 100)
      } else {
        finalDiscountAmount = coupon.value
      }
      
      finalDiscountReason = `Cupom promocional: ${coupon.code}`
      usedCouponId = coupon.id

      // Incrementa o uso do cupom no banco
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } }
      })
    } 
    // AVALIA ESTRATÉGIA 1: DESCONTO DE BALCÃO (Manual)
    else if (data.manualDiscount && data.manualDiscount > 0) {
      if (data.manualDiscount >= data.amount) throw new Error('O desconto não pode ser maior que o valor da mensalidade.')
      
      finalDiscountAmount = data.manualDiscount
      finalDiscountReason = data.manualDiscountReason || 'Desconto manual concedido no balcão'
    }

    // Calcula o Total Final
    const totalToPay = data.amount - finalDiscountAmount

    const payment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        subtotal: data.amount,
        discountAmount: finalDiscountAmount,
        total: totalToPay,
        discountReason: finalDiscountReason,
        couponId: usedCouponId,
        referenceMonth: data.referenceMonth,
        referenceYear: data.referenceYear,
        paidAt: data.paidAt,
      }
    })

    return payment
  }

  // Marca uma cobrança pendente como paga
  async markAsPaid(gymId: string, paymentId: string, paidAt: Date) {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        student: { gymId } // 🔒 Garante que o pagamento é desta academia
      }
    })

    if (!payment) {
      throw new Error('Cobrança não encontrada.')
    }

    if (payment.paidAt) {
      throw new Error('Esta cobrança já foi marcada como paga anteriormente.')
    }

    return prisma.payment.update({
      where: { id: paymentId },
      data: { paidAt },
      include: { student: { select: { name: true } } }
    })
  }

  // Lista os pagamentos para o painel do ADMIN com filtros
  async getGymPayments(gymId: string, query: ListPaymentsQuery) {
    const { month, year, status, studentId } = query

    const whereCondition: any = {
      student: { gymId }
    }

    if (month) whereCondition.referenceMonth = month
    if (year) whereCondition.referenceYear = year
    if (studentId) whereCondition.studentId = studentId
    
    // Filtro de status (Pendente = paidAt é nulo)
    if (status === 'PAID') {
      whereCondition.paidAt = { not: null }
    } else if (status === 'PENDING') {
      whereCondition.paidAt = null
    }

    const payments = await prisma.payment.findMany({
      where: whereCondition,
      include: {
        student: { select: { id: true, name: true, email: true } }
      },
      orderBy: [
        { referenceYear: 'desc' },
        { referenceMonth: 'desc' },
        { student: { name: 'asc' } }
      ]
    })

    // Calcula os totais do período filtrado para o dashboard
    const totalAmount = payments.reduce((acc, curr) => acc + curr.total, 0)
    const paidAmount = payments.filter(p => p.paidAt !== null).reduce((acc, curr) => acc + curr.total, 0)
    const pendingAmount = totalAmount - paidAmount

    return {
      summary: {
        total: totalAmount,
        paid: paidAmount,
        pending: pendingAmount,
        count: payments.length
      },
      data: payments
    }
  }

  // Histórico de pagamentos para a App do Aluno
  async getStudentPayments(gymId: string, studentId: string) {
    return prisma.payment.findMany({
      where: {
        studentId,
        student: { gymId }
      },
      orderBy: [
        { referenceYear: 'desc' },
        { referenceMonth: 'desc' }
      ]
    })
  }
}