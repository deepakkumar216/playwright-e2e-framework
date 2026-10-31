import { expect, type Locator, type Page } from '@playwright/test';
import { HeaderComponent } from './HeaderComponent';
import type { Product } from '@data/saucedemo';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  readonly header: HeaderComponent;
  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly sortSelect: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.sortSelect = page.getByTestId('product-sort-container');
  }

  async goto() {
    await this.page.goto('/inventory.html');
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/inventory\.html/);
    await expect(this.title).toHaveText('Products');
  }

  async sortBy(option: SortOption) {
    await this.sortSelect.selectOption(option);
  }

  async names(): Promise<string[]> {
    return this.itemNames.allInnerTexts();
  }

  async prices(): Promise<number[]> {
    const texts = await this.itemPrices.allInnerTexts();
    return texts.map((t) => Number(t.replace('$', '')));
  }

  async addToCart(...products: Product[]) {
    for (const p of products) {
      await this.page.getByTestId(`add-to-cart-${p.id}`).click();
    }
  }

  async removeFromCart(...products: Product[]) {
    for (const p of products) {
      await this.page.getByTestId(`remove-${p.id}`).click();
    }
  }

  removeButton(product: Product): Locator {
    return this.page.getByTestId(`remove-${product.id}`);
  }
}
