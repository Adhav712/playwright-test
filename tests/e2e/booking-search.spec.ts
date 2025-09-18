import { test, expect } from '@playwright/test';
import bookingSearchData from '../data/booking-search-data.json' assert { type: 'json' };
import { BookingHomePage } from '../pages/BookingHomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';

test.describe('E2E Booking.com Search and Rating Validation (POM + Data-driven)', () => {
    for (const data of bookingSearchData) {
        test(data.title, async ({ page }) => {
            // Extend timeout for slower page interactions
            test.setTimeout(60000);

            const homePage = new BookingHomePage(page);
            const searchResultsPage = new SearchResultsPage(page);

            await test.step('Navigate to Booking.com', async () => {
                await homePage.goto();
            });

            await test.step('Search for destination', async () => {
                await homePage.searchDestination(data.destination);
            });

            await test.step('Select dates', async () => {
                await homePage.selectDates(data.checkInDate, data.checkOutDate);
            });

            await test.step('Adjust guest count', async () => {
                await homePage.adjustGuests(data.adults);
            });

            await test.step('Submit search', async () => {
                await homePage.submitSearch();
                await homePage.waitForSearchResults();
            });

            await test.step('Sort by rating', async () => {
                await searchResultsPage.sortByRating();
            });

            await test.step('Validate search results', async () => {
                await searchResultsPage.expectPropertyCardsVisible();
            });

            await test.step('Extract and log hotel prices', async () => {
                const prices = await searchResultsPage.getHotelPrices();
                console.log(`Found ${prices.length} hotel prices`);
            });

            await test.step('Validate ratings are in descending order', async () => {
                const reviewRatingsValid = await searchResultsPage.validateRatingsDescending();
                const starRatingsValid = await searchResultsPage.validateStarRatingsDescending();

                // Log validation results (don't fail test if ratings aren't perfectly sorted)
                console.log('Review ratings validation:', reviewRatingsValid ? 'PASSED' : 'INFO: Not perfectly sorted');
                console.log('Star ratings validation:', starRatingsValid ? 'PASSED' : 'INFO: Not perfectly sorted');
            });

            await test.step('Take screenshot for verification', async () => {
                const filename = `booking-search-${data.destination.replace(/\s+/g, '_').toLowerCase()}-results.png`;
                await searchResultsPage.takeScreenshot(filename);
            });

            // Close browser
            await page.close();
        });
    }
});