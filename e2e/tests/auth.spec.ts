import { expect, seedTasks, test } from '../fixtures.js';

test.describe('Authentification', () => {
  test('redirige vers /login une page protégée sans session', async ({ page, loginPage }) => {
    await page.goto('/tasks');
    await loginPage.expectVisible();
  });

  test("affiche les erreurs de validation du formulaire d'inscription", async ({
    loginPage,
    registerPage,
  }) => {
    await loginPage.goto();
    await loginPage.registerLink.click();
    await registerPage.submit.click();

    await expect(registerPage.page.getByText('Le nom est requis')).toBeVisible();
    await expect(registerPage.page.getByText("L'email est invalide")).toBeVisible();
    await expect(registerPage.email).toHaveAttribute('aria-invalid', 'true');
  });

  test("l'inscription ouvre la session et mène à la liste des tâches", async ({
    registerPage,
    tasksPage,
    newUser,
  }) => {
    await registerPage.goto();
    await registerPage.register(newUser);

    await tasksPage.expectVisible();
    await expect(tasksPage.currentUser).toHaveText(newUser.name);
    await expect(tasksPage.emptyState).toBeVisible();
  });

  test('la déconnexion ferme la session', async ({
    page,
    tasksPage,
    loginPage,
    authenticatedUser: _user,
  }) => {
    await tasksPage.goto();
    await tasksPage.logout();
    await loginPage.expectVisible();

    await page.goto('/tasks');
    await loginPage.expectVisible();
  });

  test('refuse un mauvais mot de passe', async ({ page, loginPage, authenticatedUser }) => {
    await page.context().clearCookies();
    await loginPage.goto();
    await loginPage.login(authenticatedUser.email, 'WrongPass1');

    await expect(page.getByRole('alert')).toHaveText('Email ou mot de passe incorrect');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('la reconnexion retrouve les tâches existantes', async ({
    page,
    loginPage,
    tasksPage,
    authenticatedUser,
  }) => {
    await seedTasks(page, [{ title: 'Tâche persistante' }, { title: 'Autre tâche' }]);
    await page.context().clearCookies();

    await loginPage.goto();
    await loginPage.login(authenticatedUser.email, authenticatedUser.password);

    await tasksPage.expectVisible();
    await expect(tasksPage.items).toHaveCount(2);
    await expect(tasksPage.task('Tâche persistante')).toBeVisible();
  });

  test("le cookie de session est httpOnly et n'est pas lisible en JavaScript", async ({
    page,
    tasksPage,
    authenticatedUser: _user,
  }) => {
    await tasksPage.goto();

    const cookies = await page.context().cookies();
    const session = cookies.find((cookie) => cookie.name === 'taskapp_session');
    expect(session).toMatchObject({ httpOnly: true, sameSite: 'Lax' });
    expect(await page.evaluate(() => document.cookie)).not.toContain('taskapp_session');
  });
});
