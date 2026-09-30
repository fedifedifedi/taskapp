import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly heading: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly registerLink: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Connexion' });
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Mot de passe');
    this.submit = page.getByRole('button', { name: 'Se connecter' });
    this.registerLink = page.getByRole('link', { name: 'Créer un compte' });
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.heading).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/login$/);
    await expect(this.heading).toBeVisible();
  }
}
