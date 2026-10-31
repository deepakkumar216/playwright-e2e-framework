import { test as setup } from '@fixtures';
import { PASSWORD, USERS } from '@data/saucedemo';
import { SAUCE_AUTH_FILE } from '../../src/config';

// Log in once through the UI and save the session. Every saucedemo spec starts already logged in.
setup('authenticate as standard_user', async ({ page, loginPage, inventoryPage }) => {
  await loginPage.goto();
  await loginPage.login(USERS.standard, PASSWORD);
  await inventoryPage.expectLoaded();
  await page.context().storageState({ path: SAUCE_AUTH_FILE });
});
