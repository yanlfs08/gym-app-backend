// src/modules/saas/saas.service.ts
import { prisma } from '../../lib/prisma'

export class SaasService {
  
  // ==========================================
  // VISÃO 1: PRODUTO E ENGAJAMENTO
  // ==========================================
  async getProductMetrics() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // 1. Crescimento Básico
    const [totalGyms, newGymsThisMonth, totalStudents] = await Promise.all([
      prisma.gym.count(),
      prisma.gym.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { role: 'STUDENT', deletedAt: null } })
    ])

    // 2. Ranking: Top 5 Academias com mais alunos
    const topGyms = await prisma.gym.findMany({
      take: 5,
      include: {
        _count: {
          select: { users: { where: { role: 'STUDENT', deletedAt: null } } }
        }
      },
      orderBy: {
        users: { _count: 'desc' }
      }
    })

    // 3. Risco de Churn (Academias sem NENHUM check-in nos últimos 7 dias)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    // Busca academias ativas e cruza com a data do último check-in
    const allGyms = await prisma.gym.findMany({
      select: { 
        id: true, 
        name: true,
        users: {
          select: {
            checkIns: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    const churnRiskGyms = allGyms.filter(gym => {
      // Extrai a data do último check-in de qualquer aluno desta academia
      const checkIns = gym.users.flatMap(u => u.checkIns)
      if (checkIns.length === 0) return true // Nunca usaram o sistema

      const lastCheckInDate = checkIns.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
      return lastCheckInDate < sevenDaysAgo
    }).map(g => g.name)

    return {
      growth: { totalGyms, newGymsThisMonth, totalStudents },
      topGyms: topGyms.map(g => ({ name: g.name, studentCount: g._count.users })),
      churnRisk: { count: churnRiskGyms.length, gyms: churnRiskGyms }
    }
  }

  // ==========================================
  // VISÃO 2: FINANCEIRO DO SAAS
  // ==========================================
  async getFinancialMetrics() {
    // Busca todas as assinaturas do SaaS
    const subscriptions = await prisma.gymSubscription.findMany()

    // MRR (Monthly Recurring Revenue) - O Santo Graal do SaaS!
    const mrr = subscriptions
      .filter(sub => sub.status === 'ACTIVE')
      .reduce((acc, curr) => acc + curr.price, 0)

    // Receita Inadimplente (Atrasada)
    const overdueRevenue = subscriptions
      .filter(sub => sub.status === 'OVERDUE')
      .reduce((acc, curr) => acc + curr.price, 0)

    // Contagem por status
    const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length
    const overdueCount = subscriptions.filter(s => s.status === 'OVERDUE').length
    const canceledCount = subscriptions.filter(s => s.status === 'CANCELED').length

    return {
      mrr,
      overdueRevenue,
      subscriptions: {
        active: activeCount,
        overdue: overdueCount,
        canceled: canceledCount
      }
    }
  }
}