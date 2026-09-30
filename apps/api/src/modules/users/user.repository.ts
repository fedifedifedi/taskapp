import type { PrismaClient, User } from '../../generated/prisma/client.js';

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
}

export function createUserRepository(prisma: PrismaClient) {
  return {
    findById(id: string): Promise<User | null> {
      return prisma.user.findUnique({ where: { id } });
    },

    findByEmail(email: string): Promise<User | null> {
      return prisma.user.findUnique({ where: { email } });
    },

    create(data: CreateUserData): Promise<User> {
      return prisma.user.create({ data });
    },
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;
