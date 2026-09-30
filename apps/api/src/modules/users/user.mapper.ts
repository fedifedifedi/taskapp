import type { UserDto } from '@taskapp/shared';
import type { User } from '../../generated/prisma/client.js';

/** Ne jamais renvoyer l'entité brute : elle contient le hash du mot de passe. */
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}
