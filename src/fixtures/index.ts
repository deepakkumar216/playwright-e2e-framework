import { test as base, expect } from '@playwright/test';
import { LoginPage } from '@pages/saucedemo/LoginPage';
import { InventoryPage } from '@pages/saucedemo/InventoryPage';
import { CartPage } from '@pages/saucedemo/CartPage';
import { CheckoutPage } from '@pages/saucedemo/CheckoutPage';
import { TasksLoginPage } from '@pages/tasks/TasksLoginPage';
import { TasksPage } from '@pages/tasks/TasksPage';
import { TasksApiClient, type Credentials } from '@api/TasksApiClient';
import { uniqueUser } from '@data/tasks';

type Fixtures = {
  // saucedemo page objects
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;

  // tasks app
  tasksLoginPage: TasksLoginPage;
  /** Credentials of a freshly registered user (created through the API). */
  tasksUser: Credentials;
  /** API client already logged in as tasksUser; use it to seed or verify data. */
  tasksApi: TasksApiClient;
  /** Tasks page opened as tasksUser. Login is skipped by injecting the API token into localStorage. */
  tasksPage: TasksPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),

  tasksLoginPage: async ({ page }, use) => use(new TasksLoginPage(page)),

  tasksUser: async ({}, use) => use(uniqueUser()),

  tasksApi: async ({ request, tasksUser }, use) => {
    const api = new TasksApiClient(request);
    await api.register(tasksUser);
    await use(api);
  },

  tasksPage: async ({ page, tasksApi, tasksUser }, use) => {
    // API login, then hand the session to the browser. This is faster and less brittle than typing into the form.
    const token = tasksApi.authToken;
    await page.addInitScript(
      ([t, u]) => {
        window.localStorage.setItem('token', t);
        window.localStorage.setItem('username', u);
      },
      [token, tasksUser.username] as const,
    );
    const tasksPage = new TasksPage(page);
    await use(tasksPage);
  },
});

export { expect };
