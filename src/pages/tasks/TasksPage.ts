import { expect, type Locator, type Page } from '@playwright/test';

export class TasksPage {
  readonly heading: Locator;
  readonly currentUser: Locator;
  readonly newTaskInput: Locator;
  readonly addButton: Locator;
  readonly error: Locator;
  readonly items: Locator;
  readonly titles: Locator;
  readonly emptyState: Locator;
  readonly remaining: Locator;
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'My Tasks' });
    this.currentUser = page.getByTestId('current-user');
    this.newTaskInput = page.getByLabel('New task');
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.error = page.getByTestId('task-error');
    this.items = page.getByTestId('task-item');
    this.titles = page.getByTestId('task-title');
    this.emptyState = page.getByTestId('empty-state');
    this.remaining = page.getByTestId('remaining-count');
    this.logoutButton = page.getByRole('button', { name: 'Log out' });
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.heading).toBeVisible();
  }

  item(title: string): Locator {
    return this.items.filter({ has: this.page.getByTestId('task-title').getByText(title, { exact: true }) });
  }

  async addTask(title: string) {
    await this.newTaskInput.fill(title);
    await this.addButton.click();
  }

  async toggle(title: string) {
    await this.item(title).getByTestId('task-toggle').click();
  }

  async delete(title: string) {
    await this.item(title).getByTestId('task-delete').click();
  }
}
