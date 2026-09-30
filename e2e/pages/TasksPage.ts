import { expect, type Locator, type Page } from '@playwright/test';

export type TaskStatusLabel = 'À faire' | 'En cours' | 'Terminée';
export type FilterLabel = 'Toutes' | TaskStatusLabel;

const STATUS_VALUES: Record<TaskStatusLabel, string> = {
  'À faire': 'TODO',
  'En cours': 'IN_PROGRESS',
  Terminée: 'DONE',
};

export class TasksPage {
  readonly heading: Locator;
  readonly createForm: Locator;
  readonly items: Locator;
  readonly emptyState: Locator;
  readonly currentUser: Locator;
  readonly logoutButton: Locator;
  readonly filters: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /Mes tâches/ });
    this.createForm = page.getByRole('form', { name: 'Ajouter la tâche' });
    this.items = page.getByTestId('task-item');
    this.emptyState = page.getByText('Aucune tâche pour le moment');
    this.currentUser = page.getByTestId('current-user');
    this.logoutButton = page.getByRole('button', { name: 'Se déconnecter' });
    this.filters = page.getByRole('navigation', { name: 'Filtrer par statut' });
  }

  async goto(query = '') {
    await this.page.goto(`/tasks${query}`);
    await this.expectVisible();
  }

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/tasks/);
    await expect(this.heading).toBeVisible();
  }

  task(title: string): Locator {
    return this.items.filter({ has: this.page.getByRole('heading', { name: title, exact: true }) });
  }

  async createTask(
    title: string,
    options: { description?: string; status?: TaskStatusLabel } = {},
  ) {
    await this.createForm.getByLabel('Titre').fill(title);
    if (options.description) {
      await this.createForm.getByLabel('Description (optionnelle)').fill(options.description);
    }
    if (options.status) {
      await this.createForm.getByLabel('Statut').selectOption(STATUS_VALUES[options.status]);
    }
    await this.createForm.getByRole('button', { name: 'Ajouter la tâche' }).click();
    await expect(this.task(title)).toBeVisible();
  }

  async filterBy(label: FilterLabel) {
    await this.filters.getByRole('button', { name: label, exact: true }).click();
    await expect(this.filters.getByRole('button', { name: label, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }

  completionCheckbox(title: string): Locator {
    return this.task(title).getByRole('checkbox');
  }

  async editTask(title: string, changes: { title?: string; description?: string }) {
    await this.page.getByRole('button', { name: `Modifier « ${title} »` }).click();
    const form = this.page.getByRole('form', { name: 'Enregistrer' });
    if (changes.title !== undefined) await form.getByLabel('Titre').fill(changes.title);
    if (changes.description !== undefined) {
      await form.getByLabel('Description (optionnelle)').fill(changes.description);
    }
    await form.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(form).toBeHidden();
  }

  async deleteTask(title: string) {
    await this.page.getByRole('button', { name: `Supprimer « ${title} »` }).click();
    await this.task(title).getByRole('button', { name: 'Confirmer' }).click();
    await expect(this.task(title)).toHaveCount(0);
  }

  async logout() {
    await this.logoutButton.click();
  }
}
