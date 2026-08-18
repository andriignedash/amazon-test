import { expect, type Locator, type Page } from '@playwright/test';
import type { Product } from '../models/Product';

export class CartSidePanel {
  private readonly cartCount: Locator;
  private readonly panel: Locator;

  public constructor(private readonly page: Page) {
    this.cartCount = page.locator('#nav-cart-count');
    this.panel = page
      .getByRole('dialog')
      .filter({
        has: page.getByRole('heading', { name: /subtotal/i }),
      })
      .or(
        page
          .locator('#attach-desktop-sideSheet, [data-feature-id="ewc-content"]')
          .filter({ hasText: /added to cart|subtotal/i }),
      )
      .first();
  }

  public async assertContains(product: Product): Promise<void> {
    await expect(this.cartCount, 'Mini-cart should contain one item').toHaveText('1');
    await expect(this.panel, 'The added-to-cart side panel should open').toBeVisible({
      timeout: 15_000,
    });

    const titleFragment = product.title.slice(0, 45);
    const productIdentity = this.panel
      .locator(`a[href*="${product.asin}"]`)
      .or(this.panel.getByText(titleFragment, { exact: false }))
      .first();
    await expect(
      productIdentity,
      'Side panel should contain the selected product title',
    ).toBeVisible();

    await expect(
      this.panel,
      `Side panel should contain product price ${product.price.toFixed(2)}`,
    ).toContainText(pricePattern(product.price));
  }

  public async openCart(): Promise<void> {
    const panelCartLink = this.panel.getByRole('link', { name: /go to cart/i });
    const cartLink = (await panelCartLink.isVisible().catch(() => false))
      ? panelCartLink
      : this.page.locator('#nav-cart').first();
    await Promise.all([
      this.page.waitForURL(/\/(gp\/cart|cart)/i, { timeout: 30_000 }),
      cartLink.click(),
    ]);
    await this.page.waitForLoadState('domcontentloaded');
  }
}

function pricePattern(price: number): RegExp {
  const [whole = '0', fraction = '00'] = price.toFixed(2).split('.');
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '[.,]?');
  return new RegExp(`(?:USD|EUR|\\$|€)?\\s*${groupedWhole}[.,]${fraction}`);
}
