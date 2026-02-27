// src/modules/users/user.service.ts
import { prisma } from '../../lib/prisma'
import { CreateUserInput, UpdateUserInput, ListUsersQuery } from './user.schema'
import bcrypt from 'bcryptjs'

export class UserService {
  // CRÍTICO: Sempre passamos o gymId para isolar os dados
  async createUser(gymId: string, data: CreateUserInput) {
    const userExists = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (userExists) {
      throw new Error('E-mail já está em uso.')
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        gymId,
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return user
  }

  async listUsers(gymId: string, query: ListUsersQuery) {
    const { page, limit, search, role } = query
    const skip = (page - 1) * limit

    // Constrói a query de forma dinâmica garantindo o Multi-tenant e o Soft Delete
    const whereCondition = {
      gymId,
      deletedAt: null, // Ignora usuários deletados logicamente
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereCondition }),
    ])

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async updateUser(gymId: string, userId: string, data: UpdateUserInput) {
    // 1. Garante que o usuário existe e pertence a esta academia
    const user = await prisma.user.findFirst({
      where: { id: userId, gymId, deletedAt: null },
    })

    if (!user) throw new Error('Usuário não encontrado.')

    // 2. Se for trocar o e-mail, verifica se já não tem outro usando
    if (data.email && data.email !== user.email) {
      const emailInUse = await prisma.user.findUnique({ where: { email: data.email } })
      if (emailInUse) throw new Error('Este e-mail já está em uso.')
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true },
    })

    return updatedUser
  }

  async softDeleteUser(gymId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, gymId, deletedAt: null },
    })

    if (!user) throw new Error('Usuário não encontrado.')

    // Exclusão Lógica: Apenas preenchemos o deletedAt
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    })

    return { success: true }
  }
}
