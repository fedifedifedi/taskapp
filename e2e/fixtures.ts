import { test as base, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { TasksPage } from './pages/TasksPage.js';

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

type Fixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  tasksPage: TasksPage;
  /** Identifiants uniques par test : les tests peuvent s'exécuter en parallèle. */
  newUser: TestUser;
  /** Utilisateur inscrit via l'API, avec la session déjà ouverte dans le navigateur. */
  authenticatedUser: TestUser;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  tasksPage: async ({ page }, use) => use(new TasksPage(page)),

  // Playwright impose la déstructuration du premier argument, même sans dépendance.
  // eslint-disable-next-line no-empty-pattern
  newUser: async ({}, use) => {
    const id = randomUUID().slice(0, 8);
    await use({ name: `E2E ${id}`, email: `e2e.${id}@example.com`, password: 'Password1' });
  },

  authenticatedUser: async ({ page, newUser }, use) => {
    // page.request partage les cookies du navigateur : le cookie httpOnly est posé directement.
    const res = await page.request.post('/api/v1/auth/register', { data: newUser });
    expect(res.status()).toBe(201);
    await use(newUser);
  },
});

export { expect };

/** Crée des tâches via l'API (préparation rapide, hors du parcours testé). */
export async function seedTasks(
  page: Page,
  tasks: { title: string; status?: 'TODO' | 'IN_PROGRESS' | 'DONE'; description?: string }[],
) {
  for (const task of tasks) {
    const res = await page.request.post('/api/v1/tasks', { data: task });
    expect(res.status()).toBe(201);
  }
}
