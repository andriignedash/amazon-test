import { expect, test } from '@playwright/test';
import { getOrderedSearchQueries } from '../src/config/searchQueries';
import type { QualifiedProduct } from '../src/models/Product';
import { AmazonHomePage } from '../src/pages/AmazonHomePage';
import { SearchResultsPage } from '../src/pages/SearchResultsPage';
import {
  calculatePriceLimits,
  formatPrice,
  selectTopQualifiedProducts,
} from '../src/utils/productUtils';
import { validatePricesWithoutStopping } from '../src/utils/priceAssertions';

test.describe('Amazon organic product search', () => {
  test.describe.configure({ mode: 'serial' });

  for (const query of getOrderedSearchQueries()) {
    test(`logs the ten cheapest highly rated ${query} products`, async ({ page }) => {
      const homePage = new AmazonHomePage(page);
      const searchResultsPage = new SearchResultsPage(page);

      await test.step('Open Amazon and search', async () => {
        await homePage.open();
        await homePage.searchFor(query);
      });

      const snapshot = await test.step(
        'Collect organic products from the first result page',
        () => searchResultsPage.collectOrganicProducts(),
      );

      expect(
        snapshot.products.length,
        'At least one priced organic product should be collected',
      ).toBeGreaterThan(0);

      const qualifiedProducts = selectTopQualifiedProducts(
        snapshot.products,
        Number.MAX_SAFE_INTEGER,
      );
      const topTen = qualifiedProducts.slice(0, 10);
      const priceLimits = calculatePriceLimits(snapshot.products);

      expect(
        qualifiedProducts.length,
        'The first page should contain at least ten products matching rating and review criteria',
      ).toBeGreaterThanOrEqual(10);

      logProducts(query, topTen);

      const assertionStatistics = await test.step(
        'Validate every selected product without stopping after failures',
        () => validatePricesWithoutStopping(topTen, priceLimits),
      );

      console.log(`\nStatistics for "${query}"`);
      console.table({
        'All product cards on first page': snapshot.resultCardCount,
        'Organic product cards': snapshot.organicProductCount,
        'Organic products parsed': snapshot.products.length,
        'Cards skipped due to missing/invalid data': snapshot.skippedProductCount,
        'Products matching rating/review criteria': qualifiedProducts.length,
        'Top products validated': topTen.length,
        'Products cheaper than/equal to lower assertion':
          assertionStatistics.belowOrEqualLowerLimit,
        'Products more expensive than/equal to upper assertion':
          assertionStatistics.aboveOrEqualUpperLimit,
        'Products within both limits': assertionStatistics.withinLimits,
        'Non-fatal assertion failures': assertionStatistics.assertionFailures,
      });
      console.table({
        'Cheapest organic product': formatPrice(
          priceLimits.cheapestOrganicPrice,
          priceLimits.currency,
        ),
        'Most expensive organic product': formatPrice(
          priceLimits.mostExpensiveOrganicPrice,
          priceLimits.currency,
        ),
        'Lower limit (cheapest × 1.10)': formatPrice(
          priceLimits.lower,
          priceLimits.currency,
        ),
        'Upper limit (most expensive × 0.65)': formatPrice(
          priceLimits.upper,
          priceLimits.currency,
        ),
      });
    });
  }
});

function logProducts(
  query: string,
  products: readonly QualifiedProduct[],
): void {
  console.log(`\nTop ${products.length} cheapest qualified products for "${query}"`);
  console.table(
    products.map((product, index) => ({
      Rank: index + 1,
      Title: product.title,
      Price: product.displayedPrice,
      Rating: product.rating,
      Reviews: product.reviewCount,
      URL: product.url,
    })),
  );
}
