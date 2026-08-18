import { expect } from '@playwright/test';
import type {
  PriceAssertionStatistics,
  PriceLimits,
  QualifiedProduct,
} from '../models/Product';
import { logger } from './logger';
import { formatPrice } from './productUtils';

export function validatePricesWithoutStopping(
  products: readonly QualifiedProduct[],
  limits: PriceLimits,
): PriceAssertionStatistics {
  const statistics: PriceAssertionStatistics = {
    belowOrEqualLowerLimit: 0,
    aboveOrEqualUpperLimit: 0,
    withinLimits: 0,
    assertionFailures: 0,
  };

  for (const [index, product] of products.entries()) {
    const isBelowOrEqualLowerLimit = product.price <= limits.lower;
    const isAboveOrEqualUpperLimit = product.price >= limits.upper;

    logger.info(`Validating product ${index + 1}/${products.length}`, {
      asin: product.asin,
      price: product.displayedPrice,
    });

    if (isBelowOrEqualLowerLimit) {
      statistics.belowOrEqualLowerLimit += 1;
      statistics.assertionFailures += 1;
      logger.error('Non-fatal lower price assertion failed', {
        asin: product.asin,
        price: product.displayedPrice,
        lowerLimit: formatPrice(limits.lower, limits.currency),
      });
    }

    expect.soft(
      product.price,
      `${product.title}: price must be above ${formatPrice(limits.lower, limits.currency)}`,
    ).toBeGreaterThan(limits.lower);

    if (isAboveOrEqualUpperLimit) {
      statistics.aboveOrEqualUpperLimit += 1;
      statistics.assertionFailures += 1;
      logger.error('Non-fatal upper price assertion failed', {
        asin: product.asin,
        price: product.displayedPrice,
        upperLimit: formatPrice(limits.upper, limits.currency),
      });
    }

    expect.soft(
      product.price,
      `${product.title}: price must be below ${formatPrice(limits.upper, limits.currency)}`,
    ).toBeLessThan(limits.upper);

    if (!isBelowOrEqualLowerLimit && !isAboveOrEqualUpperLimit) {
      statistics.withinLimits += 1;
    }
  }

  return statistics;
}
