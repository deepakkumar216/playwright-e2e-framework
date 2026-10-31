import { test, expect } from '@fixtures';
import { ERRORS, PRODUCTS, TAX_RATE, randomCustomer, type CustomerInfo } from '@data/saucedemo';

const round2 = (n: number) => Math.round(n * 100) / 100;

test.describe('Checkout', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test('completes a purchase with correct totals @smoke', async ({ inventoryPage, cartPage, checkoutPage }) => {
    const basket = [PRODUCTS.backpack, PRODUCTS.fleeceJacket, PRODUCTS.onesie];

    await test.step('add items to the cart', async () => {
      await inventoryPage.addToCart(...basket);
      await inventoryPage.header.openCart();
      await cartPage.expectItems(basket.map((p) => p.name));
    });

    await test.step('enter customer details', async () => {
      await cartPage.checkout();
      await checkoutPage.fillInformation(randomCustomer());
    });

    await test.step('verify the order summary', async () => {
      const expectedSubtotal = round2(basket.reduce((sum, p) => sum + p.price, 0));
      const expectedTax = round2(expectedSubtotal * TAX_RATE);

      await expect(checkoutPage.itemNames).toHaveText(basket.map((p) => p.name));
      expect(await checkoutPage.amount(checkoutPage.subtotal)).toBe(expectedSubtotal);
      expect(await checkoutPage.amount(checkoutPage.tax)).toBe(expectedTax);
      expect(await checkoutPage.amount(checkoutPage.total)).toBe(round2(expectedSubtotal + expectedTax));
    });

    await test.step('finish and confirm', async () => {
      await checkoutPage.finish();
      await checkoutPage.expectOrderComplete();
      await inventoryPage.header.expectCartCount(0);
    });
  });

  const missingFields: { field: keyof CustomerInfo; error: string }[] = [
    { field: 'firstName', error: ERRORS.firstNameRequired },
    { field: 'lastName', error: ERRORS.lastNameRequired },
    { field: 'postalCode', error: ERRORS.postalCodeRequired },
  ];

  for (const { field, error } of missingFields) {
    test(`requires ${field}`, async ({ page, inventoryPage, cartPage, checkoutPage }) => {
      await inventoryPage.addToCart(PRODUCTS.bikeLight);
      await inventoryPage.header.openCart();
      await cartPage.checkout();

      const info: Partial<CustomerInfo> = randomCustomer();
      delete info[field];
      await checkoutPage.fillInformation(info);

      await expect(checkoutPage.error).toHaveText(error);
      await expect(page).toHaveURL(/checkout-step-one\.html/);
    });
  }

  test('continue shopping from the cart keeps items', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(PRODUCTS.redTShirt);
    await inventoryPage.header.openCart();
    await cartPage.continueShoppingButton.click();
    await inventoryPage.expectLoaded();
    await inventoryPage.header.expectCartCount(1);
  });
});
