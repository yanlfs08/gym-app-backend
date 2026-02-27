// src/modules/challenges/challenge.service.ts
import { prisma } from '../../lib/prisma'
import { CreateChallengeInput } from './challenge.schema'
import crypto from 'crypto' 

export class ChallengeService {
  async createChallenge(gymId: string, creatorId: string, data: CreateChallengeInput) {
    // Se for privado, gera um código de 8 caracteres
    const inviteCode = data.isPublic ? null : crypto.randomBytes(4).toString('hex')

    const challenge = await prisma.challenge.create({
      data: {
        gymId,
        creatorId,
        title: data.title,
        description: data.description,
        isPublic: data.isPublic,
        inviteCode,
        endDate: data.endDate,
        // Já coloca o criador como o primeiro participante
        participants: {
          create: { studentId: creatorId }
        }
      },
    })

    return challenge
  }

  async listPublicChallenges(gymId: string) {
    return prisma.challenge.findMany({
      where: { 
        gymId, 
        isPublic: true,
        endDate: { gte: new Date() } // Apenas desafios que ainda não acabaram
      },
      include: {
        creator: { select: { name: true } },
        _count: { select: { participants: true } } // Traz o número de participantes
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async joinChallenge(gymId: string, studentId: string, challengeId: string, inviteCode?: string) {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId }
    })

    if (!challenge || challenge.gymId !== gymId) {
      throw new Error('Desafio não encontrado.')
    }

    if (challenge.endDate < new Date()) {
      throw new Error('Este desafio já foi encerrado.')
    }

    if (!challenge.isPublic && challenge.inviteCode !== inviteCode) {
      throw new Error('Código de convite inválido para este desafio privado.')
    }

    // Tenta entrar (o Prisma vai falhar se já estiver dentro graças ao @@unique)
    try {
      await prisma.challengeParticipant.create({
        data: { challengeId, studentId }
      })
      return { success: true, message: 'Você entrou no desafio!' }
    } catch (error) {
      throw new Error('Você já está participando deste desafio.')
    }
  }

  async leaveChallenge(studentId: string, challengeId: string) {
    await prisma.challengeParticipant.deleteMany({
      where: { challengeId, studentId }
    })
    return { success: true }
  }

  async deleteChallenge(gymId: string, userId: string, userRole: string, challengeId: string) {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId }
    })

    if (!challenge || challenge.gymId !== gymId) {
      throw new Error('Desafio não encontrado.')
    }

    // 🔒 Regra de Negócio: Apenas o ADMIN ou o CRIADOR podem deletar
    if (userRole !== 'ADMIN' && challenge.creatorId !== userId) {
      throw new Error('Você não tem permissão para excluir este desafio.')
    }

    await prisma.challenge.delete({
      where: { id: challengeId }
    })

    return { success: true }
  }

  async getChallengeRanking(gymId: string, challengeId: string) {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        participants: {
          include: { student: { select: { id: true, name: true } } }
        }
      }
    })

    if (!challenge || challenge.gymId !== gymId) {
      throw new Error('Desafio não encontrado.')
    }

    const participantIds = challenge.participants.map(p => p.studentId)

    // RANKING POR CHECK-INS
    if (challenge.type === 'CHECK_INS') {
      const checkInsCount = await prisma.checkIn.groupBy({
        by: ['studentId'],
        where: {
          studentId: { in: participantIds },
          timestamp: { gte: challenge.startDate, lte: challenge.endDate }
        },
        _count: { id: true }
      })

      const ranking = challenge.participants.map(p => {
        const stats = checkInsCount.find(c => c.studentId === p.studentId)
        return {
          studentId: p.studentId,
          name: p.student.name,
          score: stats?._count.id || 0,
          details: null
        }
      }).sort((a, b) => b.score - a.score)

      return { challenge: challenge.title, type: challenge.type, ranking }
    }

    // RANKING POR CARGA TOTAL (Com agrupamento por músculo)
    if (challenge.type === 'TOTAL_WEIGHT') {
      const logs = await prisma.workoutLog.findMany({
        where: {
          studentId: { in: participantIds },
          completedAt: { gte: challenge.startDate, lte: challenge.endDate }
        },
        include: {
          workoutItem: {
            include: { exercise: { select: { muscleGroup: true } } }
          }
        }
      })

      const ranking = challenge.participants.map(p => {
        // Filtra os logs apenas deste aluno
        const studentLogs = logs.filter(l => l.studentId === p.studentId)
        
        // Calcula a carga total e separa por grupo muscular
        const muscleGroupStats: Record<string, number> = {}
        let totalWeight = 0

        studentLogs.forEach(log => {
          const weight = log.weightUsed
          const muscle = log.workoutItem.exercise.muscleGroup

          totalWeight += weight
          
          if (!muscleGroupStats[muscle]) muscleGroupStats[muscle] = 0
          muscleGroupStats[muscle] += weight
        })

        return {
          studentId: p.studentId,
          name: p.student.name,
          score: totalWeight, // Carga Total
          details: {
            muscleGroups: muscleGroupStats
          }
        }
      }).sort((a, b) => b.score - a.score) // Ordena do maior peso para o menor

      return { challenge: challenge.title, type: challenge.type, ranking }
    }
  }
}