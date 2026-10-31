import { test, expect } from '@fixtures';
import { PRODUCTS } from '@data/saucedemo';

// Baselines are kept per OS. Regenerate them with `npm run test:visual:update`.
test.describe('Visual regression @visual', () => {
  test('inventory page', async ({ page, inventoryPage }) => {
    await inventoryPage.goto();
    await expect(page).toHaveScreenshot('inventory.png', { fullPage: true });
  });

  test('cart with items', async ({ page, inventoryPage, cartPage }) => {
    await inventoryPage.goto();
    await inventoryPage.addToCart(PRODUCTS.backpack, PRODUCTS.bikeLight);
    await cartPage.goto();
    await expect(page).toHaveScreenshot('cart.png');
  });

  test('login page', async ({ browser }) => {
    // Use a fresh context with no saved session
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page).toHaveScreenshot('login.png');
    await context.close();
  });

  test('product card component', async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await expect(inventoryPage.items.first()).toHaveScreenshot('product-card.png');
  });
});
