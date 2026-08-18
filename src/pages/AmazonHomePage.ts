import { expect, type Locator, type Page } from '@playwright/test';

export class AmazonHomePage {
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;

  public constructor(private readonly page: Page) {
    this.searchInput = page.locator('#twotabsearchtextbox');
    this.searchButton = page.locator('#nav-search-submit-button');
  }

  public async open(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.ensureAmazonIsAvailable();
    await this.acceptCookiesIfShown();
    await expect(this.searchInput, 'Amazon search input should be visible').toBeVisible();
  }

  public async searchFor(query: string): Promise<void> {
    await this.searchInput.fill(query);

    await Promise.all([
      this.page.waitForURL((url) => url.searchParams.get('k') === query, {
        timeout: 30_000,
      }),
      this.searchButton.click(),
    ]);

    await this.page.waitForLoadState('domcontentloaded');
    await this.ensureAmazonIsAvailable();
  }

  private async acceptCookiesIfShown(): Promise<void> {
    const acceptButton = this.page
      .locator('#sp-cc-accept')
      .or(this.page.getByRole('button', { name: /accept( all)? cookies/i }))
      .first();

    if (await acceptButton.isVisible().catch(() => false)) {
      await acceptButton.click();
    }
  }

  private async ensureAmazonIsAvailable(): Promise<void> {
    const blockedByUrl = /validateCaptcha|\/errors\/validateCaptcha/i.test(
      this.page.url(),
    );
    const captchaVisible = await this.page
      .locator('#captchacharacters, form[action*="validateCaptcha"]')
      .first()
      .isVisible()
      .catch(() => false);

    if (blockedByUrl || captchaVisible) {
      throw new Error(
        'Amazon returned a CAPTCHA/robot-check page. Retry later or run headed with HEADLESS=false.',
      );
    }
  }
}
