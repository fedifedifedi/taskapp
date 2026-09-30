import { describe, expect, it } from 'vitest';
import {
  createTaskSchema,
  listTasksQuerySchema,
  loginSchema,
  registerSchema,
  updateTaskSchema,
} from '../src/index.js';

describe('registerSchema', () => {
  const valid = { email: 'alice@example.com', name: 'Alice', password: 'Password1' };

  it("normalise l'email (espaces, majuscules) et le nom", () => {
    const result = registerSchema.parse({
      ...valid,
      email: '  Alice@Example.COM ',
      name: ' Alice ',
    });
    expect(result.email).toBe('alice@example.com');
    expect(result.name).toBe('Alice');
  });

  it.each([
    ['trop court', 'Pass1'],
    ['sans chiffre', 'Password'],
    ['sans lettre', '12345678'],
    ['trop long', `A1${'x'.repeat(127)}`],
  ])('rejette un mot de passe %s', (_label, password) => {
    expect(registerSchema.safeParse({ ...valid, password }).success).toBe(false);
  });

  it('rejette un email invalide et un nom vide', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'pas-un-email' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
  });

  it('rejette les champs inconnus (mass assignment)', () => {
    expect(registerSchema.safeParse({ ...valid, role: 'admin' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('exige un mot de passe non vide', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });
});

describe('createTaskSchema', () => {
  it('nettoie le titre et convertit une description vide en null', () => {
    expect(createTaskSchema.parse({ title: '  Titre ', description: '  ' })).toEqual({
      title: 'Titre',
      description: null,
    });
  });

  it.each([
    ['titre vide', { title: '   ' }],
    ['titre trop long', { title: 'x'.repeat(201) }],
    ['description trop longue', { title: 'ok', description: 'x'.repeat(2001) }],
    ['statut invalide', { title: 'ok', status: 'ARCHIVED' }],
    ['champ inconnu', { title: 'ok', userId: 'someone-else' }],
  ])('rejette : %s', (_label, input) => {
    expect(createTaskSchema.safeParse(input).success).toBe(false);
  });
});

describe('updateTaskSchema', () => {
  it('exige au moins un champ', () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(false);
  });

  it('accepte une modification partielle', () => {
    expect(updateTaskSchema.parse({ status: 'DONE' })).toEqual({ status: 'DONE' });
  });
});

describe('listTasksQuerySchema', () => {
  it('applique les valeurs par défaut', () => {
    expect(listTasksQuerySchema.parse({})).toEqual({ page: 1, limit: 20, sort: '-createdAt' });
  });

  it('convertit les paramètres de requête (chaînes) en nombres', () => {
    expect(listTasksQuerySchema.parse({ page: '2', limit: '5', status: 'DONE' })).toMatchObject({
      page: 2,
      limit: 5,
      status: 'DONE',
    });
  });

  it.each([{ page: '0' }, { limit: '101' }, { sort: 'password' }, { status: 'done' }])(
    'rejette %o',
    (query) => {
      expect(listTasksQuerySchema.safeParse(query).success).toBe(false);
    },
  );
});
