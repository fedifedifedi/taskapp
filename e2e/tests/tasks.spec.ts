import { expect, seedTasks, test } from '../fixtures.js';

test.describe('Gestion des tâches', () => {
  // Chaque test démarre connecté avec un nouvel utilisateur (aucune donnée partagée).
  test.beforeEach(async ({ authenticatedUser: _user }) => {});

  test('crée des tâches avec différents statuts', async ({ tasksPage }) => {
    await tasksPage.goto();

    await tasksPage.createTask('Rédiger le README', { description: 'Installation et API' });
    await tasksPage.createTask('Configurer la CI', { status: 'En cours' });
    await tasksPage.createTask('Choisir la stack', { status: 'Terminée' });

    await expect(tasksPage.items).toHaveCount(3);
    await expect(tasksPage.heading).toContainText('(3)');
    await expect(tasksPage.task('Rédiger le README')).toContainText('Installation et API');
    await expect(tasksPage.task('Configurer la CI')).toContainText('En cours');
    await expect(tasksPage.task('Choisir la stack')).toContainText('terminée le');
    // Le formulaire est réinitialisé après la création.
    await expect(tasksPage.createForm.getByLabel('Titre')).toHaveValue('');
  });

  test('refuse un titre vide', async ({ tasksPage }) => {
    await tasksPage.goto();
    await tasksPage.createForm.getByLabel('Titre').fill('   ');
    await tasksPage.createForm.getByRole('button', { name: 'Ajouter la tâche' }).click();

    await expect(tasksPage.createForm.getByText('Le titre est requis')).toBeVisible();
    await expect(tasksPage.items).toHaveCount(0);
  });

  test('marque une tâche comme terminée puis la rouvre', async ({ page, tasksPage }) => {
    await seedTasks(page, [{ title: 'Écrire les tests' }]);
    await tasksPage.goto();
    const checkbox = tasksPage.completionCheckbox('Écrire les tests');

    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await expect(tasksPage.task('Écrire les tests')).toContainText('Terminée');
    await expect(tasksPage.task('Écrire les tests')).toContainText('terminée le');

    // L'état est bien persisté côté serveur.
    await page.reload();
    await expect(tasksPage.completionCheckbox('Écrire les tests')).toBeChecked();

    await tasksPage.completionCheckbox('Écrire les tests').uncheck();
    await expect(tasksPage.task('Écrire les tests')).toContainText('À faire');
    await expect(tasksPage.task('Écrire les tests')).not.toContainText('terminée le');
  });

  test('filtre les tâches par statut', async ({ page, tasksPage }) => {
    await seedTasks(page, [
      { title: 'Tâche à faire', status: 'TODO' },
      { title: 'Tâche en cours', status: 'IN_PROGRESS' },
      { title: 'Tâche terminée 1', status: 'DONE' },
      { title: 'Tâche terminée 2', status: 'DONE' },
    ]);
    await tasksPage.goto();
    await expect(tasksPage.items).toHaveCount(4);

    await tasksPage.filterBy('Terminée');
    await expect(page).toHaveURL(/status=DONE/);
    await expect(tasksPage.items).toHaveCount(2);

    await tasksPage.filterBy('En cours');
    await expect(tasksPage.items).toHaveCount(1);
    await expect(tasksPage.task('Tâche en cours')).toBeVisible();

    await tasksPage.filterBy('À faire');
    await expect(tasksPage.items).toHaveCount(1);
    await expect(tasksPage.task('Tâche à faire')).toBeVisible();

    await tasksPage.filterBy('Toutes');
    await expect(tasksPage.items).toHaveCount(4);
  });

  test('conserve le filtre au rechargement de la page', async ({ page, tasksPage }) => {
    await seedTasks(page, [
      { title: 'Tâche à faire', status: 'TODO' },
      { title: 'Tâche en cours', status: 'IN_PROGRESS' },
    ]);
    await tasksPage.goto('?status=IN_PROGRESS');
    await expect(tasksPage.items).toHaveCount(1);

    await page.reload();
    await expect(tasksPage.items).toHaveCount(1);
    await expect(tasksPage.task('Tâche en cours')).toBeVisible();
    await expect(
      tasksPage.filters.getByRole('button', { name: 'En cours', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('modifie le titre et la description', async ({ page, tasksPage }) => {
    await seedTasks(page, [{ title: 'Configurer la CI' }]);
    await tasksPage.goto();

    await tasksPage.editTask('Configurer la CI', {
      title: 'Configurer GitHub Actions',
      description: 'lint, tests, e2e',
    });

    await expect(tasksPage.task('Configurer GitHub Actions')).toContainText('lint, tests, e2e');
    await expect(tasksPage.task('Configurer la CI')).toHaveCount(0);
  });

  test('supprime une tâche après confirmation', async ({ page, tasksPage }) => {
    await seedTasks(page, [{ title: 'À garder' }, { title: 'À supprimer' }]);
    await tasksPage.goto();

    // Annuler ne supprime rien.
    await page.getByRole('button', { name: 'Supprimer « À supprimer »' }).click();
    await tasksPage.task('À supprimer').getByRole('button', { name: 'Annuler' }).click();
    await expect(tasksPage.items).toHaveCount(2);

    await tasksPage.deleteTask('À supprimer');
    await expect(tasksPage.items).toHaveCount(1);
    await expect(tasksPage.task('À garder')).toBeVisible();

    await page.reload();
    await expect(tasksPage.items).toHaveCount(1);
  });
});
