// src/modules/checkins/checkin.service.ts
import { prisma } from '../../lib/prisma'
import { getDistanceInMeters } from '../../utils/geo'
import { GeolocationCheckInInput } from './checkin.schema'

export class CheckInService {
  async createManualCheckIn(gymId: string, studentId: string) {
    // 1. Verifica se o aluno pertence à academia
    const student = await prisma.user.findFirst({
      where: { id: studentId, gymId, deletedAt: null }
    })
    if (!student) throw new Error('Aluno não encontrado.')

    // 2. Define o início e o fim do dia atual para bloquear duplicações
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    // 3. Procura se já existe um check-in hoje
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        studentId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    if (existingCheckIn) {
      throw new Error('Você já realizou o check-in hoje. Volte amanhã!')
    }

    // 4. Cria o check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        studentId,
        method: 'MANUAL',
      }
    })

    return checkIn
  }

  async createGeolocationCheckIn(gymId: string, studentId: string, data: GeolocationCheckInInput) {
    const gym = await prisma.gym.findUnique({ where: { id: gymId } })

    if (!gym || !gym.latitude || !gym.longitude) {
      throw new Error('A localização desta academia não está configurada no sistema.')
    }

    // Calcula a distância usando Haversine
    const distance = getDistanceInMeters(
      data.userLatitude,
      data.userLongitude,
      gym.latitude,
      gym.longitude
    )

    const MAX_DISTANCE_IN_METERS = 100 // 100 metros de raio da academia

    if (distance > MAX_DISTANCE_IN_METERS) {
      throw new Error(`Estás muito longe da academia! Tente novamente quando estiver lá. (Distância: ${Math.round(distance)}m)`)
    }

    // Mesma validação de 1 check-in por dia
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        studentId,
        timestamp: { gte: startOfDay, lte: endOfDay }
      }
    })

    if (existingCheckIn) {
      throw new Error('Você já realizou o check-in hoje. Volte amanhã!')
    }

    // Salva o check-in com o método GEOLOCATION
    const checkIn = await prisma.checkIn.create({
      data: {
        studentId,
        method: 'GEOLOCATION',
      }
    })

    return {
      checkIn,
      distance: Math.round(distance)
    }
  }
}