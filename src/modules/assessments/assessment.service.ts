// src/modules/assessments/assessment.service.ts
import { prisma } from '../../lib/prisma'
import { CreateAssessmentInput } from './assessment.schema'

export class AssessmentService {
  async createAssessment(gymId: string, trainerId: string, data: CreateAssessmentInput) {
    // 1. Validação de Segurança (Multi-tenant)
    const student = await prisma.user.findFirst({
      where: { id: data.studentId, gymId, role: 'STUDENT', deletedAt: null },
    })

    if (!student) {
      throw new Error('Aluno não encontrado na sua academia.')
    }

    // 2. Cálculo do Percentual de Gordura (Jackson & Pollock 7 Dobras)
    let bodyFatPercentage: number | null = null
    let muscleMass: number | null = null

    // Verifica se todas as 7 dobras foram preenchidas
    const {
      chestFold,
      axillaryFold,
      tricepsFold,
      subscapularFold,
      abdomenFold,
      suprailiacFold,
      thighFold,
      age,
      gender,
      weight,
    } = data

    if (
      chestFold !== undefined &&
      axillaryFold !== undefined &&
      tricepsFold !== undefined &&
      subscapularFold !== undefined &&
      abdomenFold !== undefined &&
      suprailiacFold !== undefined &&
      thighFold !== undefined
    ) {
      const sumFolds =
        chestFold + axillaryFold + tricepsFold + subscapularFold + abdomenFold + suprailiacFold + thighFold
      let bodyDensity = 0

      // Fórmula de Densidade Corporal
      if (gender === 'MALE') {
        bodyDensity = 1.112 - 0.00043499 * sumFolds + 0.00000055 * Math.pow(sumFolds, 2) - 0.00028826 * age
      } else {
        bodyDensity = 1.097 - 0.00046971 * sumFolds + 0.00000056 * Math.pow(sumFolds, 2) - 0.00012828 * age
      }

      // Equação de Siri para o % de Gordura
      if (bodyDensity > 0) {
        bodyFatPercentage = (4.95 / bodyDensity - 4.5) * 100
        // Arredonda para 2 casas decimais
        bodyFatPercentage = parseFloat(bodyFatPercentage.toFixed(2))

        // Calcula a Massa Magra (Peso total - Peso da gordura)
        const fatWeight = weight * (bodyFatPercentage / 100)
        muscleMass = parseFloat((weight - fatWeight).toFixed(2))
      }
    }

    // 3. Persistência
    const assessment = await prisma.physicalAssessment.create({
      data: {
        studentId: data.studentId,
        trainerId,
        weight: data.weight,
        height: data.height,
        notes: data.notes,
        chestFold,
        axillaryFold,
        tricepsFold,
        subscapularFold,
        abdomenFold,
        suprailiacFold,
        thighFold,
        bodyFatPercentage,
        muscleMass,
      },
    })

    return assessment
  }

  // Busca o histórico de avaliações do aluno logado
  async getStudentHistory(gymId: string, studentId: string) {
    const assessments = await prisma.physicalAssessment.findMany({
      where: {
        studentId,
        student: { gymId }, // Isolamento de dados
      },
      orderBy: { date: 'desc' },
      include: {
        trainer: { select: { name: true } }, // Traz o nome do personal que avaliou
      },
    })

    return assessments
  }
}
