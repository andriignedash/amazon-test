export interface Product {
  readonly asin: string;
  readonly title: string;
  readonly price: number;
  readonly displayedPrice: string;
  readonly rating: number | null;
  readonly reviewCount: number | null;
  readonly url: string;
  readonly resultPosition: number;
}

export interface QualifiedProduct extends Product {
  readonly rating: number;
  readonly reviewCount: number;
}

export interface SearchPageSnapshot {
  readonly resultCardCount: number;
  readonly organicProductCount: number;
  readonly skippedProductCount: number;
  readonly products: readonly Product[];
}

export interface PriceLimits {
  readonly currency: string;
  readonly cheapestOrganicPrice: number;
  readonly mostExpensiveOrganicPrice: number;
  readonly lower: number;
  readonly upper: number;
}

export interface PriceAssertionStatistics {
  belowOrEqualLowerLimit: number;
  aboveOrEqualUpperLimit: number;
  withinLimits: number;
  assertionFailures: number;
}
