import { test } from '@playwright/test';
import { getPrimarySearchQuery } from '../src/config/searchQueries';
import { AmazonHomePage } from '../src/pages/AmazonHomePage';
import { CartPage } from '../src/pages/CartPage';
import { CartSidePanel } from '../src/pages/CartSidePanel';
import { SearchResultsPage } from '../src/pages/SearchResultsPage';
import { logger } from '../src/utils/logger';

test.describe('Optional Amazon cart flow', () => {
  test('adds the second directly purchasable organic product', async ({ page }) => {
    const query = getPrimarySearchQuery();
    const homePage = new AmazonHomePage(page);
    const searchResultsPage = new SearchResultsPage(page);
    const cartSidePanel = new CartSidePanel(page);
    const cartPage = new CartPage(page);

    await homePage.open();
    await homePage.searchFor(query);

    const product = await test.step(
      'Add the second organic non-configurable result',
      () => searchResultsPage.addSecondDirectPurchaseProduct(),
    );

    logger.info('Added product to cart', {
      title: product.title,
      price: product.displayedPrice,
      url: product.url,
    });

    await test.step('Validate mini-cart and side panel', () =>
      cartSidePanel.assertContains(product),
    );
    await test.step('Open cart', () => cartSidePanel.openCart());
    await test.step('Validate cart subtotal', () =>
      cartPage.assertSingleProductSubtotal(product),
    );
  });
});
