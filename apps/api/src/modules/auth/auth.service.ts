import type { LoginInput, RegisterInput, UserDto } from '@taskapp/shared';
import { ConflictError, UnauthorizedError } from '../../lib/errors.js';
import { hashPassword, simulatePasswordVerification, verifyPassword } from '../../lib/password.js';
import { toUserDto } from '../users/user.mapper.js';
import type { UserRepository } from '../users/user.repository.js';

const INVALID_CREDENTIALS = 'Email ou mot de passe incorrect';

export function createAuthService(users: UserRepository) {
  return {
    async register(input: RegisterInput): Promise<UserDto> {
      const existing = await users.findByEmail(input.email);
      if (existing) {
        throw new ConflictError('Un compte existe déjà avec cet email');
      }
      const user = await users.create({
        email: input.email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
      });
      return toUserDto(user);
    },

    async login(input: LoginInput): Promise<UserDto> {
      const user = await users.findByEmail(input.email);
      if (!user) {
        await simulatePasswordVerification(input.password);
        throw new UnauthorizedError(INVALID_CREDENTIALS);
      }
      const valid = await verifyPassword(user.passwordHash, input.password);
      if (!valid) {
        throw new UnauthorizedError(INVALID_CREDENTIALS);
      }
      return toUserDto(user);
    },

    async getCurrentUser(userId: string): Promise<UserDto> {
      const user = await users.findById(userId);
      if (!user) {
        throw new UnauthorizedError('Session invalide');
      }
      return toUserDto(user);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
