import { describe, expect, it, vi } from 'vitest';
import type { User } from '../../src/generated/prisma/client.js';
import { ConflictError, UnauthorizedError } from '../../src/lib/errors.js';
import { hashPassword } from '../../src/lib/password.js';
import { createAuthService } from '../../src/modules/auth/auth.service.js';
import type { UserRepository } from '../../src/modules/users/user.repository.js';

function makeUser(overrides: Partial<User> = {}): User {
  const date = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'alice@example.com',
    name: 'Alice',
    passwordHash: 'hash',
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

function makeRepository(existing: User | null) {
  return {
    findById: vi.fn().mockResolvedValue(existing),
    findByEmail: vi.fn().mockResolvedValue(existing),
    create: vi.fn(async (data) => makeUser(data)),
  } satisfies UserRepository;
}

const credentials = { email: 'alice@example.com', password: 'Password1' };

describe('AuthService', () => {
  it('inscrit un utilisateur avec un mot de passe haché (argon2id)', async () => {
    const repository = makeRepository(null);
    const user = await createAuthService(repository).register({ ...credentials, name: 'Alice' });

    const { passwordHash } = repository.create.mock.calls[0]![0];
    expect(passwordHash).toMatch(/^\$argon2id\$/);
    expect(passwordHash).not.toContain(credentials.password);
    expect(user).not.toHaveProperty('passwordHash');
  });

  it("refuse l'inscription si l'email existe déjà", async () => {
    const service = createAuthService(makeRepository(makeUser()));
    await expect(service.register({ ...credentials, name: 'Alice' })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('connecte un utilisateur avec le bon mot de passe', async () => {
    const user = makeUser({ passwordHash: await hashPassword(credentials.password) });
    const result = await createAuthService(makeRepository(user)).login(credentials);
    expect(result.id).toBe(user.id);
  });

  it('renvoie la même erreur pour un mauvais mot de passe et un email inconnu', async () => {
    const user = makeUser({ passwordHash: await hashPassword('AnotherPass1') });
    const wrongPassword = createAuthService(makeRepository(user)).login(credentials);
    const unknownEmail = createAuthService(makeRepository(null)).login(credentials);

    const errors = await Promise.all([
      wrongPassword.catch((error: unknown) => error),
      unknownEmail.catch((error: unknown) => error),
    ]);
    for (const error of errors) {
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect((error as Error).message).toBe('Email ou mot de passe incorrect');
    }
  });

  it("rejette la session d'un utilisateur supprimé", async () => {
    const service = createAuthService(makeRepository(null));
    await expect(service.getCurrentUser('missing')).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
