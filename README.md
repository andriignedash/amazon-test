# Amazon product search — Playwright + TypeScript

This project automates Amazon product search with Playwright and the Page Object
Model. It runs the required scenario for both supported queries (`screwdriver`
and `hammer`), finds organic products on the first result page, filters them by
rating/review count, sorts them by price, prints the cheapest ten, and validates
their prices without stopping after an individual failure.

The optional direct-add-to-cart scenario is implemented as a separate test.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Internet access to `https://www.amazon.com`

## Setup

```bash
npm install
npx playwright install chromium
```

No source changes, credentials, or Amazon account are required.

## Run the required search tests

```bash
npm test
```

The first query defaults to `screwdriver`; the second run automatically uses
`hammer`. To reverse the order, pass the supported search query as an environment
parameter:

```bash
SEARCH_QUERY=hammer npm test
```

Only `screwdriver` and `hammer` are accepted. The test intentionally treats each
price-bound assertion as non-fatal: a failed assertion is written to the console,
statistics are still printed, and the next product is processed. After every
selected product is checked, any soft assertion failures mark the test as failed.

## Run the optional cart test

```bash
npm run test:cart
```

The test selects the second organic result that exposes a direct **Add to Cart**
button (that is, a product that does not require configuration), verifies the
mini-cart count and the product information in the side panel, opens the cart,
and compares the subtotal with the selected product price.

## Other commands

```bash
npm run test:unit       # deterministic parser/filter unit tests
npm run test:all        # required search tests plus optional cart test
npm run typecheck       # strict TypeScript check
npm run report          # open the latest HTML Playwright report
```

Useful environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SEARCH_QUERY` | `screwdriver` | First query; the other supported query runs second |
| `AMAZON_BASE_URL` | `https://www.amazon.com` | Amazon host used by Playwright |
| `HEADLESS` | `true` | Set to `false` to watch the browser |
| `SLOW_MO` | `0` | Delay each browser action by the specified milliseconds |

Examples:

```bash
HEADLESS=false SLOW_MO=150 npm test
AMAZON_BASE_URL=https://www.amazon.com npm run test:cart
```

## Project structure

```text
src/
  config/          validated runtime input
  models/          product and statistics types
  pages/           Page Object Model classes
  utils/           price parsing, filtering, assertions, and logging
tests/
  search-products.spec.ts
  add-to-cart.spec.ts
  unit/
```

## Stability notes

- Product cards are scoped by Amazon's semantic `data-component-type` and
  `data-asin` attributes; product fields are resolved inside each card.
- Sponsored cards are excluded using component metadata and accessible labels.
- Result/card processing is isolated so one malformed dynamic card is logged and
  skipped instead of terminating the test.
- Navigation waits use URLs and visible page landmarks rather than fixed sleeps.
- Tests run serially with one worker to reduce load on the live storefront.
- A clear error is reported when Amazon serves a CAPTCHA or robot-check page.

Amazon is a live third-party website. Inventory, prices, experiments, localized
markup, bot protection, and the number of qualifying products can change between
runs. Traces, screenshots, and videos are retained for failed test runs under
`test-results/`; the HTML report is written to `playwright-report/`.
