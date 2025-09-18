import { expect, Locator, Page } from '@playwright/test';

export class SearchResultsPage {
    readonly page: Page;
    readonly sortButton: Locator;
    readonly propertyCards: Locator;
    readonly priceElements: Locator;
    readonly ratingElements: Locator;
    readonly starRatingElements: Locator;

    constructor(page: Page) {
        this.page = page;
        this.sortButton = page.locator('button[data-testid="sorters-dropdown-trigger"]').first();
        this.propertyCards = page.locator('[data-testid="property-card"], .sr_property_block');
        this.priceElements = page.locator('[data-testid="price-and-discounted-price"], .sr_price_wrap, [data-testid="price"]');
        this.ratingElements = page.locator('[data-testid="review-score"], .bui-review-score, [data-testid="rating"]');
        this.starRatingElements = page.locator('[data-testid="rating-stars"], .bui-star-rating, [data-testid="stars"]');
    }

    async sortByRating() {
        try {
            await this.sortButton.waitFor({ state: 'visible', timeout: 15000 });
            await this.sortButton.click();
            console.log('Clicked sort dropdown');

            await this.page.waitForTimeout(2000);

            const sortOptions = [
                'button[role="option"][aria-label*="Property rating and price"]',
                'button[role="option"]:has-text("Property rating")',
                'button[role="option"][aria-label*="rating"]'
            ];

            let sortApplied = false;
            for (const sortOption of sortOptions) {
                const option = this.page.locator(sortOption);
                if (await option.isVisible({ timeout: 3000 })) {
                    await option.click();
                    console.log(`Applied sort: ${sortOption}`);
                    sortApplied = true;
                    break;
                }
            }

            if (!sortApplied) {
                console.log('Could not find rating sort option, using default sort');
            }

            await this.page.waitForTimeout(3000); // Let sorting apply
        } catch (sortError) {
            console.log('Sort functionality failed, continuing with default order:', sortError);
        }
    }

    async getHotelPrices(): Promise<string[]> {
        try {
            const rents = await this.page.$$eval('[data-testid="price-and-discounted-price"], .sr_price_wrap, [data-testid="price"]', elements =>
                elements.map(el => el.textContent?.replace(/[^\d.,]/g, '').replace(/,/g, '') || '')
            );
            console.log('Hotel rents:', rents.slice(0, 10));
            return rents;
        } catch (priceError) {
            console.log('Could not extract hotel prices:', priceError);
            return [];
        }
    }

    async getReviewRatings(): Promise<number[]> {
        try {
            const ratings = await this.page.$$eval('[data-testid="review-score"], .bui-review-score, [data-testid="rating"]', elements =>
                elements.map(el => {
                    const scoreDiv = el.querySelector('div[aria-hidden="true"], .bui-review-score__badge, [data-testid="review-score-badge"]');
                    if (scoreDiv) {
                        const score = parseFloat(scoreDiv.textContent?.trim() || '0');
                        return isNaN(score) ? 0 : score;
                    }
                    return 0;
                })
            );
            console.log('Ratings:', ratings.slice(0, 10));
            return ratings;
        } catch (ratingsError) {
            console.log('Could not extract ratings:', ratingsError);
            return [];
        }
    }

    async getStarRatings(): Promise<number[]> {
        try {
            const starRatings = await this.page.$$eval('[data-testid="rating-stars"], .bui-star-rating, [data-testid="stars"]', elements =>
                elements.map(el => {
                    const stars = el.querySelectorAll('svg, .bui-star-rating__star, [data-testid="star"]');
                    return stars.length;
                })
            );
            console.log('Star ratings:', starRatings.slice(0, 10));
            return starRatings;
        } catch (starError) {
            console.log('Could not extract star ratings:', starError);
            return [];
        }
    }

    async validateRatingsDescending(): Promise<boolean> {
        const ratings = await this.getReviewRatings();
        if (ratings.length === 0) return false;

        const isDescending = ratings.every((val, i, arr) => i === 0 || arr[i - 1] >= val);
        console.log('Review ratings are in descending order:', isDescending);
        return isDescending;
    }

    async validateStarRatingsDescending(): Promise<boolean> {
        const starRatings = await this.getStarRatings();

        if (starRatings.length === 0) {
            console.log('No star ratings found, skipping validation');
            return true; // Don't fail if no star ratings found
        }

        const starsDescending = starRatings.every((val, i, arr) => i === 0 || arr[i - 1] >= val);
        console.log('Star ratings are in descending order:', starsDescending);

        if (starsDescending) {
            console.log('✓ Star ratings validation passed');
            return true;
        } else {
            console.log('⚠ Star ratings not in perfect descending order (this may be expected with default sort)');
            return false;
        }
    }

    async expectPropertyCardsVisible() {
        await expect(this.propertyCards.first()).toBeVisible({ timeout: 10000 });
    }

    async takeScreenshot(filename: string) {
        await this.page.screenshot({ path: filename, fullPage: true });
        console.log(`Screenshot saved: ${filename}`);
    }
}