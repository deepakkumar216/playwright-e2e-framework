import { test, expect } from '@fixtures';
import { ERRORS, PASSWORD, USERS } from '@data/saucedemo';

// These tests exercise login itself, so they start logged out.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard user can log in @smoke', async ({ loginPage, inventoryPage }) => {
    await loginPage.login(USERS.standard, PASSWORD);
    await inventoryPage.expectLoaded();
    await expect(inventoryPage.items).toHaveCount(6);
  });

  const invalidLogins = [
    { name: 'locked-out user', username: USERS.lockedOut, password: PASSWORD, error: ERRORS.lockedOut },
    { name: 'wrong password', username: USERS.standard, password: 'wrong', error: ERRORS.badCredentials },
    { name: 'unknown user', username: 'nobody', password: PASSWORD, error: ERRORS.badCredentials },
    { name: 'empty username', username: '', password: PASSWORD, error: ERRORS.usernameRequired },
    { name: 'empty password', username: USERS.standard, password: '', error: ERRORS.passwordRequired },
  ];

  for (const { name, username, password, error } of invalidLogins) {
    test(`rejects ${name}`, async ({ page, loginPage }) => {
      await loginPage.login(username, password);
      await loginPage.expectError(error);
      await expect(page).not.toHaveURL(/inventory/);
    });
  }

  test('protected pages redirect to login when logged out', async ({ page, loginPage }) => {
    await page.goto('/inventory.html');
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.error).toContainText("You can only access '/inventory.html' when you are logged in");
  });

  test('user can log out @smoke', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.login(USERS.standard, PASSWORD);
    await inventoryPage.header.logout();
    await expect(loginPage.loginButton).toBeVisible();
    await page.goto('/inventory.html');
    await expect(loginPage.error).toBeVisible();
  });
});
