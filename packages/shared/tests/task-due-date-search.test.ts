import { describe, expect, it } from 'vitest';
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from '../src/index.js';

describe('dueDate', () => {
  it('accepte une date AAAA-MM-JJ et convertit une chaîne vide en null', () => {
    expect(createTaskSchema.parse({ title: 't', dueDate: '2026-10-15' }).dueDate).toBe(
      '2026-10-15',
    );
    expect(updateTaskSchema.parse({ dueDate: '' })).toEqual({ dueDate: null });
    expect(updateTaskSchema.parse({ dueDate: null })).toEqual({ dueDate: null });
  });

  it.each(['2026-02-30', '15/10/2026', '2026-10-15T10:00:00Z', 42])('rejette %s', (dueDate) => {
    expect(createTaskSchema.safeParse({ title: 't', dueDate }).success).toBe(false);
  });
});

describe('q (recherche)', () => {
  it('nettoie la recherche et ignore une valeur vide', () => {
    expect(listTasksQuerySchema.parse({ q: '  ci  ' }).q).toBe('ci');
    expect(listTasksQuerySchema.parse({ q: '   ' }).q).toBeUndefined();
  });

  it('accepte le tri par échéance', () => {
    expect(listTasksQuerySchema.parse({ sort: '-dueDate' }).sort).toBe('-dueDate');
  });
});
