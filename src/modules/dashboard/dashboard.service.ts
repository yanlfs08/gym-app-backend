// src/modules/dashboard/dashboard.service.ts
import { prisma } from '../../lib/prisma'

export class DashboardService {
  async getGymDashboard(gymId: string) {
    // Definir o início e fim do dia de hoje para os check-ins
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))
    
    // Obter o mês e ano atuais para o financeiro
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    // 1. Contagem de Utilizadores Ativos (Alunos e Personais)
    const [totalStudents, totalTrainers] = await Promise.all([
      prisma.user.count({
        where: { gymId, role: 'STUDENT', deletedAt: null }
      }),
      prisma.user.count({
        where: { gymId, role: 'TRAINER', deletedAt: null }
      })
    ])

    // 2. Check-ins de Hoje
    const checkInsToday = await prisma.checkIn.count({
      where: {
        student: { gymId }, // Garante que o aluno é desta academia
        timestamp: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    // 3. Resumo Financeiro do Mês Atual
    const currentMonthPayments = await prisma.payment.findMany({
      where: {
        student: { gymId },
        referenceMonth: currentMonth,
        referenceYear: currentYear
      },
      select: {
        total: true,
        paidAt: true
      }
    })

    // Calcula a receita esperada vs recebida
    const expectedRevenue = currentMonthPayments.reduce((acc, curr) => acc + curr.total, 0)
    const receivedRevenue = currentMonthPayments
      .filter(p => p.paidAt !== null)
      .reduce((acc, curr) => acc + curr.total, 0)

    // Retorna o objeto consolidado para o Frontend montar os gráficos
    return {
      metrics: {
        totalStudents,
        totalTrainers,
        checkInsToday,
      },
      finance: {
        referenceMonth: currentMonth,
        referenceYear: currentYear,
        expectedRevenue,
        receivedRevenue,
        pendingRevenue: expectedRevenue - receivedRevenue
      }
    }
  }
}