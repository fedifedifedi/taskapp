import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeEach } from 'vitest';
import { createApp } from '../../src/app.js';
import { createPrismaClient } from '../../src/lib/prisma.js';

export const prisma = createPrismaClient();
export const app: Express = createApp({ prisma, webDistDir: '/nonexistent' });

export const DEFAULT_PASSWORD = 'Password1';

let userCounter = 0;

/** Base vide avant chaque test : chaque test est indépendant. */
export function useCleanDatabase() {
  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "tasks", "users" CASCADE');
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });
}

/** Crée un utilisateur et renvoie un agent Supertest qui conserve son cookie de session. */
export async function createAuthenticatedAgent(name = 'User') {
  userCounter += 1;
  const agent = request.agent(app);
  const email = `${name.toLowerCase()}.${userCounter}@example.com`;
  const res = await agent
    .post('/api/v1/auth/register')
    .send({ email, name, password: DEFAULT_PASSWORD })
    .expect(201);
  return { agent, user: res.body.data as { id: string; email: string }, email };
}

export async function createTask(
  agent: ReturnType<typeof request.agent>,
  body: Record<string, unknown> = { title: 'Une tâche' },
) {
  const res = await agent.post('/api/v1/tasks').send(body).expect(201);
  return res.body.data as {
    id: string;
    title: string;
    description: string | null;
    status: string;
    dueDate: string | null;
    completedAt: string | null;
  };
}
