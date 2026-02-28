// prisma/seed.ts
import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'
async function main() {
  console.log('🌱 Iniciando o Seed do Banco de Dados...')

  // 1. Limpar o banco de dados (CUIDADO: Isso apaga tudo para recriar do zero)
  await prisma.workoutLog.deleteMany()
  await prisma.workoutItem.deleteMany()
  await prisma.workout.deleteMany()
  await prisma.workoutSheet.deleteMany()
  await prisma.physicalAssessment.deleteMany()
  await prisma.checkIn.deleteMany()
  await prisma.challengeParticipant.deleteMany()
  await prisma.challenge.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.user.deleteMany()
  await prisma.gymSubscription.deleteMany()
  await prisma.gym.deleteMany()

  // 2. Senha padrão para todos os testes: '123456'
  const passwordHash = await bcrypt.hash('123456', 10)

  // 3. Criar Super Admin (Dono do SaaS)
  await prisma.user.create({
    data: {
      name: 'Super Admin SaaS',
      email: 'super@admin.com',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  })

  // 4. Criar 5 Academias e suas Assinaturas
  const gyms = []
  for (let i = 1; i <= 5; i++) {
    const gym = await prisma.gym.create({
      data: {
        name: `Academia Fitness Master ${i}`,
        cnpj: `00.000.000/000${i}-00`,
        address: `Rua das Flores, ${100 * i}, São Paulo`,
        latitude: -23.55052 + (i * 0.001),
        longitude: -46.633309 + (i * 0.001),
        subscription: {
          create: {
            planName: i % 2 === 0 ? 'Plano Pro' : 'Plano Básico',
            price: i % 2 === 0 ? 199.90 : 99.90,
            status: i === 5 ? 'OVERDUE' : 'ACTIVE', // A 5ª academia está inadimplente
            expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          }
        }
      },
    })
    gyms.push(gym)
  }

  const mainGym = gyms[0] // Vamos focar em popular a Academia 1

  // 5. Criar Equipe da Academia 1
  const admin = await prisma.user.create({
    data: { name: 'Dono da Academia 1', email: 'admin@gym1.com', passwordHash, role: 'ADMIN', gymId: mainGym.id }
  })

  const trainer = await prisma.user.create({
    data: { name: 'Personal Silva', email: 'personal@gym1.com', passwordHash, role: 'TRAINER', gymId: mainGym.id }
  })

  // 6. Criar 5 Alunos na Academia 1
  const students = []
  for (let i = 1; i <= 5; i++) {
    const student = await prisma.user.create({
      data: {
        name: `Aluno Teste ${i}`,
        email: `student${i}@gym1.com`,
        passwordHash,
        role: 'STUDENT',
        gymId: mainGym.id,
        points: i * 50, // Pontuações diferentes para o Ranking
        currentStreak: i,
      }
    })
    students.push(student)
  }

  // 7. Criar 5 Exercícios no Catálogo
  const exercisesData = [
    { name: 'Supino Reto', muscleGroup: 'CHEST' },
    { name: 'Agachamento Livre', muscleGroup: 'LEGS' },
    { name: 'Puxada Frontal', muscleGroup: 'BACK' },
    { name: 'Desenvolvimento', muscleGroup: 'SHOULDERS' },
    { name: 'Rosca Direta', muscleGroup: 'ARMS' },
  ]
  
  const exercises = []
  for (const ex of exercisesData) {
    const exercise = await prisma.exercise.create({
      data: { ...ex, gymId: mainGym.id, muscleGroup: ex.muscleGroup as any }
    })
    exercises.push(exercise)
  }

  // 8. Criar Fichas de Treino, Splits e Logs para os 5 Alunos
  for (let i = 0; i < 5; i++) {
    const student = students[i]
    
    // Ficha
    const sheet = await prisma.workoutSheet.create({
      data: {
        studentId: student.id,
        creatorId: trainer.id,
        name: `Ficha de Hipertrofia v${i + 1}`,
        isPriority: true,
        workouts: {
          create: {
            name: 'Treino A - Full Body',
            items: {
              create: [
                { exerciseId: exercises[0].id, sets: 4, reps: '10-12', restSeconds: 60 },
                { exerciseId: exercises[1].id, sets: 4, reps: '10-12', restSeconds: 90 }
              ]
            }
          }
        }
      },
      include: { workouts: { include: { items: true } } }
    })

    // Log de Gamificação (Registrando que treinaram hoje)
    const workoutItemId = sheet.workouts[0].items[0].id
    await prisma.workoutLog.create({
      data: {
        studentId: student.id,
        workoutItemId,
        weightUsed: 20 + (i * 5), // Pesos variados
      }
    })

    // Check-in
    await prisma.checkIn.create({
      data: { studentId: student.id, method: 'GEOLOCATION' }
    })

    // Avaliação Física
    await prisma.physicalAssessment.create({
      data: {
        studentId: student.id,
        trainerId: trainer.id,
        weight: 70 + i,
        height: 175,
        bodyFatPercentage: 15 + i,
        muscleMass: 35 + i,
      }
    })

    // Pagamento (Mês Atual)
    await prisma.payment.create({
      data: {
        studentId: student.id,
        subtotal: 100,
        total: 100,
        referenceMonth: new Date().getMonth() + 1,
        referenceYear: new Date().getFullYear(),
        paidAt: i < 3 ? new Date() : null, // 3 pagaram, 2 estão pendentes
      }
    })
  }

  // 9. Criar Cupons e Desafios
  await prisma.coupon.createMany({
    data: [
      { gymId: mainGym.id, code: 'BORA10', type: 'PERCENTAGE', value: 10 },
      { gymId: mainGym.id, code: 'VERAO50', type: 'FIXED', value: 50 },
      { gymId: mainGym.id, code: 'VIP100', type: 'PERCENTAGE', value: 100 },
      { gymId: mainGym.id, code: 'FALHA30', type: 'FIXED', value: 30 },
      { gymId: mainGym.id, code: 'NATAL25', type: 'PERCENTAGE', value: 25 },
    ]
  })

  const challenge = await prisma.challenge.create({
    data: {
      gymId: mainGym.id,
      creatorId: admin.id,
      title: 'Desafio Monstro do Mês',
      type: 'TOTAL_WEIGHT',
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      participants: {
        create: students.map(s => ({ studentId: s.id }))
      }
    }
  })

  console.log('✅ Banco de dados populado com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })