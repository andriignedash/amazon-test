export const SUPPORTED_SEARCH_QUERIES = ['screwdriver', 'hammer'] as const;

export type SearchQuery = (typeof SUPPORTED_SEARCH_QUERIES)[number];

export function getPrimarySearchQuery(
  rawValue = process.env.SEARCH_QUERY,
): SearchQuery {
  const normalized = (rawValue ?? SUPPORTED_SEARCH_QUERIES[0])
    .trim()
    .toLowerCase();

  if (!isSearchQuery(normalized)) {
    throw new Error(
      `Unsupported SEARCH_QUERY="${rawValue}". Use "screwdriver" or "hammer".`,
    );
  }

  return normalized;
}

export function getOrderedSearchQueries(
  rawValue = process.env.SEARCH_QUERY,
): readonly SearchQuery[] {
  const primary = getPrimarySearchQuery(rawValue);
  const secondary = SUPPORTED_SEARCH_QUERIES.find(
    (query) => query !== primary,
  );

  if (!secondary) {
    throw new Error('A secondary supported search query is not configured.');
  }

  return [primary, secondary];
}

function isSearchQuery(value: string): value is SearchQuery {
  return SUPPORTED_SEARCH_QUERIES.some((query) => query === value);
}
