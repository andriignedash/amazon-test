import type {
  PriceLimits,
  Product,
  QualifiedProduct,
} from '../models/Product';

const CURRENCY_CHARACTERS = /[^\d.,\s]/g;

export function parsePrice(rawValue: string | null | undefined): number | null {
  if (!rawValue) {
    return null;
  }

  const cleaned = rawValue
    .replace(/\u00a0/g, ' ')
    .replace(CURRENCY_CHARACTERS, '')
    .trim()
    .replace(/\s+/g, '');

  if (!cleaned) {
    return null;
  }

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized = cleaned;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? /\./g : /,/g;
    normalized = cleaned
      .replace(thousandsSeparator, '')
      .replace(decimalSeparator, '.');
  } else if (lastComma >= 0) {
    normalized = normalizeSingleSeparator(cleaned, ',');
  } else if (lastDot >= 0) {
    normalized = normalizeSingleSeparator(cleaned, '.');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function parseRating(rawValue: string | null | undefined): number | null {
  if (!rawValue) {
    return null;
  }

  const match = rawValue.replace(',', '.').match(/\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const rating = Number(match[0]);
  return Number.isFinite(rating) && rating >= 0 && rating <= 5
    ? rating
    : null;
}

export function parseReviewCount(
  rawValue: string | null | undefined,
): number | null {
  if (!rawValue) {
    return null;
  }

  const compactMatch = rawValue
    .trim()
    .toLowerCase()
    .replace(',', '.')
    .match(/([\d.]+)\s*([km])\b/);

  if (compactMatch?.[1] && compactMatch[2]) {
    const value = Number(compactMatch[1]);
    const multiplier = compactMatch[2] === 'm' ? 1_000_000 : 1_000;
    return Number.isFinite(value) ? Math.round(value * multiplier) : null;
  }

  const digits = rawValue.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  const count = Number(digits);
  return Number.isSafeInteger(count) ? count : null;
}

export function selectTopQualifiedProducts(
  products: readonly Product[],
  limit = 10,
): QualifiedProduct[] {
  return products
    .filter((product): product is QualifiedProduct => {
      return (
        product.rating !== null &&
        product.rating >= 4.5 &&
        product.reviewCount !== null &&
        product.reviewCount >= 100
      );
    })
    .sort((left, right) => left.price - right.price)
    .slice(0, limit);
}

export function calculatePriceLimits(
  products: readonly Product[],
): PriceLimits {
  if (products.length === 0) {
    throw new Error('No priced organic products were collected from the page.');
  }

  const prices = products.map((product) => product.price);
  const cheapestOrganicPrice = Math.min(...prices);
  const mostExpensiveOrganicPrice = Math.max(...prices);
  const currency = extractCurrency(
    products.find((product) => product.price === cheapestOrganicPrice)
      ?.displayedPrice ?? '',
  );

  return {
    currency,
    cheapestOrganicPrice,
    mostExpensiveOrganicPrice,
    lower: cheapestOrganicPrice * 1.1,
    upper: mostExpensiveOrganicPrice * 0.65,
  };
}

export function formatPrice(value: number, currency = ''): string {
  const amount = value.toFixed(2);
  return currency ? `${currency} ${amount}` : amount;
}

function extractCurrency(displayedPrice: string): string {
  const match = displayedPrice.match(/(?:USD|EUR|GBP|CAD|AUD|JPY|[$€£¥])/i);
  return match?.[0]?.toUpperCase() ?? '';
}

function normalizeSingleSeparator(value: string, separator: ',' | '.'): string {
  const pieces = value.split(separator);
  if (pieces.length === 1) {
    return value;
  }

  const finalPiece = pieces.at(-1) ?? '';
  const separatorIsDecimal = finalPiece.length === 1 || finalPiece.length === 2;

  if (!separatorIsDecimal) {
    return pieces.join('');
  }

  return `${pieces.slice(0, -1).join('')}.${finalPiece}`;
}
