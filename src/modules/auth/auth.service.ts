import { prisma } from '../../lib/prisma'
import type { RegisterGymInput, LoginInput, ChangePasswordInput } from './auth.schema'
import bcrypt from 'bcryptjs'
import { getCoordinatesFromAddress } from '../../utils/geo'

export class AuthService {
  // Registra a Academia E o primeiro usuário Admin numa transação só
  async registerGymWithAdmin(data: RegisterGymInput) {
    // 1. Verificar se o email já existe
    const userExists = await prisma.user.findUnique({
      where: { email: data.adminEmail },
    })

    if (userExists) {
      throw new Error('Email já está em uso.')
    }

    const cnpj = data.cnpj?.trim() || null

    if (cnpj) {
      const gymExists = await prisma.gym.findUnique({
        where: { cnpj },
      })

      if (gymExists) {
        throw new Error('CNPJ já cadastrado.')
      }
    }

    // 2. Hash da senha
    const passwordHash = await bcrypt.hash(data.adminPassword, 10)

    const coords = await getCoordinatesFromAddress(data.address)

    // 3. Criar a Academia e o Admin juntos (Transaction)
    const { gym, admin } = await prisma.$transaction(async (tx) => {
      const newGym = await tx.gym.create({
        data: {
          name: data.gymName,
          cnpj,
          address: data.address,
          latitude: coords?.lat, // Salva a Latitude
          longitude: coords?.lon // Salva a Longitude
        },
      })

      const newAdmin = await tx.user.create({
        data: {
          gymId: newGym.id,
          name: data.adminName,
          email: data.adminEmail,
          passwordHash,
          role: 'ADMIN', // Usando o Enum definido no Prisma
        },
      })

      return { gym: newGym, admin: newAdmin }
    })

    return {
      gymId: gym.id,
      userId: admin.id,
      email: admin.email,
    }
  }

  // Autenticação multi-tenant
  async authenticate(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (!user) {
      throw new Error('Credenciais inválidas.')
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash)

    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas.')
    }

    // Retornamos os dados essenciais para assinar o JWT
    return {
      id: user.id,
      gymId: user.gymId, // CRÍTICO: Identificador do Tenant
      role: user.role, // CRÍTICO: Para controle de acesso RBAC
    }
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('Utilizador não encontrado.')
    }

    // Valida se a senha atual está correta
    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash)

    if (!isPasswordValid) {
      throw new Error('A senha atual está incorreta.')
    }

    // Gera o hash da nova senha
    const newPasswordHash = await bcrypt.hash(data.newPassword, 10)

    // Atualiza a senha no banco de dados
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    })

    return { success: true }
  }
}
