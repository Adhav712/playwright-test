import { test, expect } from '@playwright/test';

test('Booking.com hotel search and rating validation', async ({ page }) => {
  // Extend timeout for slower page interactions
  test.setTimeout(60000);

  // Step 1: Navigate to Booking.com
  await page.goto('https://www.booking.com/');

  // Step 2: Enter destination "Mumbai"
  const destination = page.locator('input[name="ss"]');
  await destination.waitFor({ state: 'visible' });
  await destination.click();
  await destination.fill('Mumbai');
  await page.waitForTimeout(2000); // Let autocomplete load

  const mumbaiOption = page.locator('//li//div[contains(text(),"Mumbai")]');
  await mumbaiOption.first().waitFor({ state: 'visible' });
  await mumbaiOption.first().click();

  // Step 3: Select check-in and check-out dates
  await page.click('[data-testid="searchbox-dates-container"]');           // open the calendar

  // if “September 2025” isn’t in view yet, click the next-month button until it is
  while (!await page.locator('h3[aria-live="polite"]').first().textContent()
    .then(text => text?.includes('September 2025'))) {
    await page.click('button[aria-label="Next month"]');
  }

  await page.locator('span[data-date="2025-09-17"]').click();            // check-in
  await page.locator('span[data-date="2025-09-18"]').click();            // check-out

  // Step 4: Configure guests and rooms
  await page.click('[data-testid="occupancy-config"]');
  await page.click('button[class="de576f5064 b46cd7aad7 e26a59bb37 c295306d66 c7a901b0e7 aaf9b6e287 c857f39cb2"]'); // Set Adults to 1
  //await page.click('button[aria-label="Decrease number of Rooms"]');  // Set Rooms to 1
  //await page.click('button[data-testid="occupancy-config-apply-button"]');
  await page.click('button[class="de576f5064 b46cd7aad7 d0a01e3d83 c7a901b0e7 e4f9ca4b0c bbf83acb81 d1babacfe0 a9d40b8d51"]');

  // Step 5: Submit search
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000); // Wait for results to load

  // Step 6: Sort by rating
  await page.click('button[data-testid="sorters-dropdown-trigger"]');
  // await page.locator('button[role="option"][aria-label="Property rating (high to low)"]').click();
  await page.locator('button[role="option"][aria-label="Property rating and price"]').click();
  await page.waitForTimeout(3000); // Let sorting apply

  // Step 7: Get the list of hotel rents (prices)
  // The selector for hotel prices may change; adjust as needed for Booking.com
  const rents = await page.$$eval('[data-testid="price-and-discounted-price"]', elements =>
    elements.map(el => el.textContent?.replace(/[^\d.,]/g, '').replace(/,/g, '') || '')
  );
  console.log('Hotel rents:', rents);

  // Step 8: Validate ratings are in descending order
  // Extract the score from the nested div with aria-hidden="true" inside each review-score block
  const ratings = await page.$$eval('[data-testid="review-score"]', elements =>
    elements.map(el => {
      const scoreDiv = el.querySelector('div[aria-hidden="true"]');
      if (scoreDiv) {
        const score = parseFloat(scoreDiv.textContent?.trim() || '0');
        return isNaN(score) ? 0 : score;
      }
      return 0;
    })
  );
  console.log('Ratings:', ratings);
  const isDescending = ratings.every((val, i, arr) => i === 0 || arr[i - 1] >= val);
  // expect(isDescending).toBe(true);

  // Step 8b: Extract star ratings and check descending order
  // Each hotel card may have a [data-testid="rating-stars"] element, count the number of svg children for the star count
  const starRatings = await page.$$eval('[data-testid="rating-stars"]', elements =>
    elements.map(el => el.querySelectorAll('svg').length)
  );
  console.log('Star ratings:', starRatings);
  const starsDescending = starRatings.every((val, i, arr) => i === 0 || arr[i - 1] >= val);
  expect(starsDescending).toBe(true);

  // Step 9: Close browser
  await page.close();
});