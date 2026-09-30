import { expect, seedTasks, test } from '../fixtures.js';

test.describe('Recherche, échéances, tableau de bord et thème', () => {
  test.beforeEach(async ({ authenticatedUser: _user }) => {});

  test('recherche une tâche par titre ou description', async ({ page, tasksPage }) => {
    await seedTasks(page, [
      { title: 'Configurer la CI' },
      { title: 'README', description: 'Documenter Docker' },
      { title: 'Préparer la démo' },
    ]);
    await tasksPage.goto();
    await expect(tasksPage.items).toHaveCount(3);

    await tasksPage.searchInput.fill('docker');
    await expect(page).toHaveURL(/q=docker/);
    await expect(tasksPage.items).toHaveCount(1);
    await expect(tasksPage.task('README')).toBeVisible();

    await tasksPage.searchInput.fill('introuvable');
    await expect(page.getByText('Aucune tâche ne correspond à « introuvable »')).toBeVisible();

    await page.getByRole('button', { name: 'Effacer la recherche' }).click();
    await expect(tasksPage.items).toHaveCount(3);
  });

  test("affiche l'échéance et signale les tâches en retard", async ({ page, tasksPage }) => {
    await tasksPage.goto();
    await tasksPage.createTask('Tâche en retard', { dueDate: '2020-01-15' });
    await tasksPage.createTask('Tâche future', { dueDate: '2099-12-31' });

    const lateBadge = tasksPage.task('Tâche en retard').getByTestId('due-badge');
    await expect(lateBadge).toHaveAttribute('data-state', 'overdue');
    await expect(lateBadge).toContainText('En retard');
    await expect(tasksPage.task('Tâche future').getByTestId('due-badge')).toContainText(
      '31 déc. 2099',
    );

    // Une tâche terminée n'est plus signalée en retard.
    await tasksPage.completionCheckbox('Tâche en retard').check();
    await expect(lateBadge).not.toHaveAttribute('data-state', 'overdue');

    // L'échéance peut être supprimée en modification.
    await tasksPage.editTask('Tâche future', { dueDate: '' });
    await expect(tasksPage.task('Tâche future').getByTestId('due-badge')).toHaveCount(0);
    await page.reload();
    await expect(tasksPage.task('Tâche future').getByTestId('due-badge')).toHaveCount(0);
  });

  test("trie les tâches par date d'échéance", async ({ page, tasksPage }) => {
    await seedTasks(page, [
      { title: 'Sans échéance' },
      { title: 'Dans un mois', dueDate: '2099-02-01' },
      { title: 'Demain', dueDate: '2099-01-01' },
    ]);
    await tasksPage.goto();

    await tasksPage.sortSelect.selectOption({ label: 'Échéance la plus proche' });
    await expect(page).toHaveURL(/sort=dueDate/);
    await expect
      .poll(() => tasksPage.titles())
      .toEqual(['Demain', 'Dans un mois', 'Sans échéance']);
  });

  test('le tableau de bord suit la progression et filtre au clic', async ({ page, tasksPage }) => {
    await seedTasks(page, [
      { title: 'A', status: 'TODO' },
      { title: 'B', status: 'TODO' },
      { title: 'C', status: 'IN_PROGRESS' },
      { title: 'D', status: 'DONE' },
    ]);
    await tasksPage.goto();

    await expect(tasksPage.stat('TOTAL')).toContainText('4');
    await expect(tasksPage.stat('TODO')).toContainText('2');
    await expect(tasksPage.progressBar).toHaveAttribute('aria-valuenow', '25');

    await tasksPage.completionCheckbox('A').check();
    await expect(tasksPage.stat('DONE')).toContainText('2');
    await expect(tasksPage.progressBar).toHaveAttribute('aria-valuenow', '50');

    await tasksPage.stat('IN_PROGRESS').click();
    await expect(page).toHaveURL(/status=IN_PROGRESS/);
    await expect(tasksPage.items).toHaveCount(1);
    await expect(tasksPage.task('C')).toBeVisible();
  });

  test('bascule en mode sombre et mémorise le choix', async ({ page, tasksPage }) => {
    await tasksPage.goto();
    const html = page.locator('html');

    await tasksPage.setTheme('Thème sombre');
    await expect(html).toHaveClass(/dark/);
    await page.reload();
    await expect(html).toHaveClass(/dark/);

    await tasksPage.setTheme('Thème clair');
    await expect(html).not.toHaveClass(/dark/);
  });
});
