import { expect, type Locator, type Page } from '@playwright/test';
import type { Product } from '../models/Product';
import { parsePrice } from '../utils/productUtils';

export class CartPage {
  private readonly activeCart: Locator;
  private readonly subtotal: Locator;

  public constructor(page: Page) {
    this.activeCart = page
      .locator('#sc-active-cart')
      .or(page.locator('[data-name="Active Items"]'))
      .first();
    this.subtotal = page
      .locator(
        '#sc-subtotal-amount-activecart .a-size-medium, [data-name="Subtotals"] .a-price .a-offscreen',
      )
      .first();
  }

  public async assertSingleProductSubtotal(product: Product): Promise<void> {
    await expect(this.activeCart, 'Active shopping cart should be visible').toBeVisible();

    const cartText = normalize(await this.activeCart.innerText());
    const titleFragment = normalize(product.title).slice(0, 45);
    expect(cartText, 'Cart should contain the selected product title').toContain(
      titleFragment,
    );

    await expect(this.subtotal, 'Cart subtotal should be visible').toBeVisible();
    const subtotalText = await this.subtotal.textContent();
    const subtotal = parsePrice(subtotalText);

    expect(subtotal, 'Cart subtotal should be parseable').not.toBeNull();
    expect(subtotal, 'Cart subtotal should equal selected product price').toBeCloseTo(
      product.price,
      2,
    );
  }
}

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}
