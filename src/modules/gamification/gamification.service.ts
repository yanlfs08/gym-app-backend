// src/modules/gamification/gamification.service.ts
import { prisma } from '../../lib/prisma'
import { CreateWorkoutLogInput } from './gamification.schema'

export class GamificationService {
  // Registra a carga e dá pontos ao aluno
  async logExerciseAndReward(gymId: string, studentId: string, data: CreateWorkoutLogInput) {
    // 1. Validar se o item de treino realmente pertence à ficha deste aluno nesta academia
    const item = await prisma.workoutItem.findFirst({
      where: {
        id: data.workoutItemId,
        workout: {
          sheet: {
            studentId,
            student: { gymId } // 🔒 Segurança Multi-tenant
          }
        }
      }
    })

    if (!item) {
      throw new Error('Exercício não encontrado na sua ficha de treino.')
    }

    // 2. Transação: Salva o log e dá a recompensa (+10 pontos por exercício)
    const [log, updatedUser] = await prisma.$transaction([
      prisma.workoutLog.create({
        data: {
          studentId,
          workoutItemId: data.workoutItemId,
          weightUsed: data.weightUsed,
          notes: data.notes,
        }
      }),
      prisma.user.update({
        where: { id: studentId },
        data: {
          points: { increment: 10 } // Prisma faz o incremento atômico e seguro
        },
        select: { points: true, currentStreak: true }
      })
    ])

    return {
      log,
      reward: {
        pointsEarned: 10,
        newTotalPoints: updatedUser.points
      }
    }
  }

  // Busca o Top 10 da Academia
  async getGymRanking(gymId: string) {
    const ranking = await prisma.user.findMany({
      where: {
        gymId,
        role: 'STUDENT',
        deletedAt: null // Não mostrar alunos inativos
      },
      orderBy: { points: 'desc' }, // Ordem decrescente
      take: 10, // Top 10
      select: {
        id: true,
        name: true,
        points: true,
        currentStreak: true
      }
    })

    return ranking
  }
}