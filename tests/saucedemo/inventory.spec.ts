import { test, expect } from '@fixtures';
import { PRODUCTS } from '@data/saucedemo';
import type { SortOption } from '@pages/saucedemo/InventoryPage';

test.describe('Inventory', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test('lists all six products with prices @smoke', async ({ inventoryPage }) => {
    await expect(inventoryPage.items).toHaveCount(6);
    const names = await inventoryPage.names();
    expect(names.sort()).toEqual(Object.values(PRODUCTS).map((p) => p.name).sort());
  });

  const sortCases: { option: SortOption; label: string; key: 'names' | 'prices'; desc: boolean }[] = [
    { option: 'az', label: 'Name (A to Z)', key: 'names', desc: false },
    { option: 'za', label: 'Name (Z to A)', key: 'names', desc: true },
    { option: 'lohi', label: 'Price (low to high)', key: 'prices', desc: false },
    { option: 'hilo', label: 'Price (high to low)', key: 'prices', desc: true },
  ];

  for (const { option, label, key, desc } of sortCases) {
    test(`sorts by ${label}`, async ({ inventoryPage }) => {
      await inventoryPage.sortBy(option);
      const actual: (string | number)[] = key === 'names' ? await inventoryPage.names() : await inventoryPage.prices();
      const expected = [...actual].sort((a, b) =>
        typeof a === 'number' ? (a as number) - (b as number) : String(a).localeCompare(String(b)),
      );
      if (desc) expected.reverse();
      expect(actual).toEqual(expected);
    });
  }

  test('adding and removing items updates the cart badge', async ({ inventoryPage }) => {
    const { header } = inventoryPage;
    await header.expectCartCount(0);

    await inventoryPage.addToCart(PRODUCTS.backpack, PRODUCTS.bikeLight, PRODUCTS.onesie);
    await header.expectCartCount(3);
    await expect(inventoryPage.removeButton(PRODUCTS.backpack)).toBeVisible();

    await inventoryPage.removeFromCart(PRODUCTS.bikeLight);
    await header.expectCartCount(2);
  });

  test('cart contents survive a page reload', async ({ page, inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(PRODUCTS.fleeceJacket, PRODUCTS.boltTShirt);
    await page.reload();
    await inventoryPage.header.expectCartCount(2);
    await inventoryPage.header.openCart();
    await cartPage.expectItems([PRODUCTS.fleeceJacket.name, PRODUCTS.boltTShirt.name]);
  });
});
