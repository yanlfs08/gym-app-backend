// src/modules/workouts/workout.service.ts
import { prisma } from '../../lib/prisma'
import { CreateExerciseInput, CreateWorkoutSheetInput } from './workout.schema'

export class WorkoutService {
  // 1. Criar exercício agora isolado por academia (Multi-tenant)
  async createExercise(gymId: string, data: CreateExerciseInput) {
    const exercise = await prisma.exercise.create({
      data: {
        ...data,
        gymId, // 🔒 Injetamos a academia do utilizador autenticado
      },
    })
    return exercise
  }

  // 2. Listar fichas do aluno (App Mobile)
  async getStudentWorkoutSheets(gymId: string, studentId: string) {
    const sheets = await prisma.workoutSheet.findMany({
      where: {
        studentId,
        student: { gymId }, // 🔒 Garante que o aluno pertence a esta academia
      },
      orderBy: [
        { isPriority: 'desc' }, // Fichas do Personal aparecem primeiro
        { createdAt: 'desc' }, // Depois, as mais recentes
      ],
      include: {
        workouts: {
          include: {
            items: {
              include: { exercise: true }, // Traz os detalhes do exercício (como o vídeo)
            },
          },
        },
      },
    })

    return sheets
  }

  // 3. Criar Ficha de Treino (mantém-se igual, apenas listado aqui para referência)
  async createWorkoutSheet(gymId: string, creatorId: string, creatorRole: string, data: CreateWorkoutSheetInput) {
    let targetStudentId = creatorId

    if (creatorRole === 'TRAINER' || creatorRole === 'ADMIN') {
      if (!data.studentId) {
        throw new Error('Precisa de especificar para qual aluno é este treino.')
      }
      targetStudentId = data.studentId

      const student = await prisma.user.findFirst({
        where: { id: targetStudentId, gymId, role: 'STUDENT', deletedAt: null },
      })

      if (!student) {
        throw new Error('Aluno não encontrado na sua academia.')
      }
    } else if (creatorRole === 'STUDENT' && data.studentId && data.studentId !== creatorId) {
      throw new Error('Os alunos só podem criar fichas para si mesmos.')
    }

    const isPriority = creatorRole === 'TRAINER' || creatorRole === 'ADMIN'

    const workoutSheet = await prisma.workoutSheet.create({
      data: {
        name: data.name,
        studentId: targetStudentId,
        creatorId: creatorId,
        isPriority,
        workouts: {
          create: data.workouts.map((workout) => ({
            name: workout.name,
            items: {
              create: workout.items.map((item) => ({
                exerciseId: item.exerciseId,
                sets: item.sets,
                reps: item.reps,
                restSeconds: item.restSeconds,
              })),
            },
          })),
        },
      },
      include: {
        workouts: {
          include: {
            items: {
              include: { exercise: true },
            },
          },
        },
      },
    })

    return workoutSheet
  }
}
