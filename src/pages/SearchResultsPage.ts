import { expect, type Locator, type Page } from '@playwright/test';
import type { Product, SearchPageSnapshot } from '../models/Product';
import { errorMessage, logger } from '../utils/logger';
import { parsePrice, parseRating, parseReviewCount } from '../utils/productUtils';

export class SearchResultsPage {
  private readonly resultCards: Locator;

  public constructor(private readonly page: Page) {
    this.resultCards = page.locator(
      '[data-component-type="s-search-result"][data-asin]:not([data-asin=""])',
    );
  }

  public async waitUntilLoaded(): Promise<void> {
    await expect(
      this.resultCards.first(),
      'At least one Amazon search result should be visible',
    ).toBeVisible({ timeout: 30_000 });
  }

  public async collectOrganicProducts(): Promise<SearchPageSnapshot> {
    await this.waitUntilLoaded();

    const resultCardCount = await this.resultCards.count();
    const products: Product[] = [];
    let organicProductCount = 0;
    let skippedProductCount = 0;

    for (let index = 0; index < resultCardCount; index += 1) {
      const card = this.resultCards.nth(index);

      try {
        if (await this.isPromoted(card)) {
          continue;
        }

        organicProductCount += 1;
        const product = await this.extractProduct(card, index + 1);
        if (product) {
          products.push(product);
        } else {
          skippedProductCount += 1;
        }
      } catch (error) {
        skippedProductCount += 1;
        logger.error('Unable to process a result card; continuing', {
          resultPosition: index + 1,
          error: errorMessage(error),
        });
      }
    }

    return {
      resultCardCount,
      organicProductCount,
      skippedProductCount,
      products,
    };
  }

  public async addSecondDirectPurchaseProduct(): Promise<Product> {
    await this.waitUntilLoaded();

    const cardCount = await this.resultCards.count();
    let directPurchasePosition = 0;

    for (let index = 0; index < cardCount; index += 1) {
      const card = this.resultCards.nth(index);

      try {
        if (await this.isPromoted(card)) {
          continue;
        }

        const addButton = card
          .getByRole('button', { name: /^add to cart$/i })
          .or(card.locator('input[name="submit.addToCart"]'))
          .first();

        if (!(await addButton.isVisible().catch(() => false))) {
          continue;
        }

        const product = await this.extractProduct(card, index + 1);
        if (!product) {
          continue;
        }

        directPurchasePosition += 1;
        if (directPurchasePosition !== 2) {
          continue;
        }

        await addButton.click();
        return product;
      } catch (error) {
        logger.error('Unable to process a direct-purchase card; continuing', {
          resultPosition: index + 1,
          error: errorMessage(error),
        });
      }
    }

    throw new Error(
      'The first results page did not contain two organic, non-configurable products with direct Add to Cart buttons.',
    );
  }

  private async extractProduct(
    card: Locator,
    resultPosition: number,
  ): Promise<Product | null> {
    const asin = (await card.getAttribute('data-asin'))?.trim() ?? '';
    const titleHeading = card.locator('h2').first();
    const titleLink = card
      .locator('[data-cy="title-recipe"] a[href], a[href]:has(h2)')
      .first();
    const title = (await this.firstText(titleHeading, 'aria-label')) ?? '';
    const href =
      (await titleLink.count()) > 0
        ? await titleLink.getAttribute('href')
        : null;
    const priceText = await this.firstText(
      card.locator('.a-price:not(.a-text-price) .a-offscreen'),
    );

    if (!asin || !title || !href || !priceText) {
      logger.warn('Skipping an organic card with required product data missing', {
        resultPosition,
        asin: asin || null,
        hasTitle: Boolean(title),
        hasUrl: Boolean(href),
        hasPrice: Boolean(priceText),
      });
      return null;
    }

    const price = parsePrice(priceText);
    if (price === null) {
      logger.warn('Skipping an organic card with an unparseable price', {
        resultPosition,
        asin,
        priceText,
      });
      return null;
    }

    const ratingText = await this.firstText(
      card.locator(
        '[data-cy="reviews-block"] [aria-label*="out of 5 stars" i], [data-cy="reviews-block"] .a-icon-alt',
      ),
      'aria-label',
    );
    const reviewText = await this.firstText(
      card.locator(
        '[data-cy="reviews-block"] a[aria-label$="ratings" i], [data-cy="reviews-block"] a[aria-label$="rating" i], [data-cy="reviews-block"] a[href*="#customerReviews"]',
      ),
      'aria-label',
    );

    return {
      asin,
      title,
      price,
      displayedPrice: priceText.replace(/\s+/g, ' ').trim(),
      rating: parseRating(ratingText),
      reviewCount: parseReviewCount(reviewText),
      url: new URL(href, this.page.url()).href,
      resultPosition,
    };
  }

  private async isPromoted(card: Locator): Promise<boolean> {
    const sponsoredMarker = card
      .locator(
        '[data-component-type="sp-sponsored-result"], .puis-sponsored-label-text, [aria-label^="Sponsored" i], [aria-label^="Gesponsert" i]',
      )
      .or(card.getByText(/^(Sponsored|Gesponsert)$/i, { exact: true }))
      .first();

    return sponsoredMarker.isVisible().catch(() => false);
  }

  private async firstText(
    locator: Locator,
    attributeFallback?: string,
  ): Promise<string | null> {
    const first = locator.first();
    if ((await first.count()) === 0) {
      return null;
    }

    if (attributeFallback) {
      const attribute = (await first.getAttribute(attributeFallback))?.trim();
      if (attribute) {
        return attribute;
      }
    }

    const text = (await first.textContent())?.trim();
    if (text) {
      return text;
    }

    return null;
  }
}
