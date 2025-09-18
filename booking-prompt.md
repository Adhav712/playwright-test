i want to do these things in booking.com with playwright
in booking.com select place as mumbai
and date as today and tomorrow and select adult count as 1 and apply submit
then // Step 6: Sort by rating
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

Open Booking.com.

Select the place as Mumbai in the location search input.

Select the date as today and tomorrow on the date picker.

Set the adult count to 1.

Submit the search form.

Sort the results by rating.

Extract the star ratings by counting the number of star SVG icons within hotel rating elements ([data-testid="rating-stars"]).

Check if the extracted star ratings are in descending order.

Close the browser.
