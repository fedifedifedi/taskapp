import { expect, type Locator, type Page } from '@playwright/test';

export class RegisterPage {
  readonly heading: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Créer un compte' });
    this.name = page.getByLabel('Nom');
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Mot de passe');
    this.submit = page.getByRole('button', { name: 'Créer mon compte' });
  }

  async goto() {
    await this.page.goto('/register');
    await expect(this.heading).toBeVisible();
  }

  async register(user: { name: string; email: string; password: string }) {
    await this.name.fill(user.name);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.submit.click();
  }
}
