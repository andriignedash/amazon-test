import { expect, test } from '@playwright/test';
import type { Product } from '../../src/models/Product';
import {
  calculatePriceLimits,
  parsePrice,
  parseRating,
  parseReviewCount,
  selectTopQualifiedProducts,
} from '../../src/utils/productUtils';

test.describe('product utilities', () => {
  test('parses US and European price formats', () => {
    expect(parsePrice('$1,234.56')).toBe(1234.56);
    expect(parsePrice('1.234,56 €')).toBe(1234.56);
    expect(parsePrice('$19.99')).toBe(19.99);
    expect(parsePrice(undefined)).toBeNull();
  });

  test('parses ratings and review counts', () => {
    expect(parseRating('4.7 out of 5 stars')).toBe(4.7);
    expect(parseRating('4,5 von 5 Sternen')).toBe(4.5);
    expect(parseReviewCount('1,234 ratings')).toBe(1234);
    expect(parseReviewCount('2.5K')).toBe(2500);
    expect(parseReviewCount('1.2M')).toBe(1_200_000);
  });

  test('filters by rating and reviews, then sorts by price', () => {
    const products = [
      product('a', 30, 4.6, 500),
      product('b', 10, 4.4, 1_000),
      product('c', 20, 4.8, 99),
      product('d', 15, 4.5, 100),
    ];

    expect(selectTopQualifiedProducts(products)).toEqual([
      products[3],
      products[0],
    ]);
  });

  test('calculates lower and upper assertion limits', () => {
    expect(calculatePriceLimits([product('a', 10), product('b', 100)])).toEqual({
      currency: '$',
      cheapestOrganicPrice: 10,
      mostExpensiveOrganicPrice: 100,
      lower: 11,
      upper: 65,
    });
  });
});

function product(
  asin: string,
  price: number,
  rating: number | null = 4.5,
  reviewCount: number | null = 100,
): Product {
  return {
    asin,
    title: `Product ${asin}`,
    price,
    displayedPrice: `$${price.toFixed(2)}`,
    rating,
    reviewCount,
    url: `https://www.amazon.com/dp/${asin}`,
    resultPosition: 1,
  };
}
