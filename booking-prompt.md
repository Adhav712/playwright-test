Page Object Model (POM)
✅Data‑driven tests (from JSON)
✅Allure reporting
📁 Project Structure

playwright-pom-allure/

├─ package.json

├─ tsconfig.json

├─ playwright.config.ts

├─ README.md

├─ tests/

│  ├─ e2e/

│  │  └─ buy-product.spec.ts

│  ├─ data/

│  │  └─ purchase-data.json

│  └─ pages/

│     ├─ LoginPage.ts

│     ├─ ProductsPage.ts

│     ├─ CartPage.ts

│     └─ CheckoutPage.ts

└─ .gitignore

🚀 1) Initialize & Install

# Create project

mkdir playwright-pom-allure && cd

npm init -y

 

# Install Playwright Test + browsers

npm i -D @playwright/test

npx playwright install --with-deps

 

# TypeScript (Playwright already ships types, but TS config is good)

npm i -D typescript

 

# Allure reporter + CLI

npm i -D allure-playwright allure-commandline

⚙️ 2) package.json

{

 "name": "playwright-pom-allure",

 "version": "1.0.0",

 "private": true,

 "type": "module",

 "scripts": {

   "test": "playwright test",

   "test:headed": "playwright test --headed",

   "test:ui": "playwright test --ui",

   "allure:generate": "allure generate -c allure-results -o allure-report",

   "allure:open": "allure open allure-report",

   "allure:clean": "rimraf allure-results allure-report"

 },

 "devDependencies": {

   "@playwright/test": "^1.47.0",

   "allure-commandline": "^2.29.0",

   "allure-playwright": "^2.13.0",

   "typescript": "^5.5.0",

   "rimraf": "^6.0.0"

 }

}

If playwright isn’t on PATH, use npx playwright … in scripts.

🧠 3) tsconfig.json

{

 "compilerOptions": {

   "target": "ES2020",

   "lib": ["ES2020", "DOM"],

   "module": "ESNext",

   "moduleResolution": "Node",

   "types": ["@playwright/test"],

   "allowJs": false,

   "strict": true,

   "skipLibCheck": true,

   "esModuleInterop": true,

   "resolveJsonModule": true,

   "outDir": "dist"

 },

 "include": ["tests/**/*.ts", "playwright.config.ts"]

}

🧾 4) playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

 

export default defineConfig({

 testDir: './tests',

 timeout: 60_000,

 expect: { timeout: 10_000 },

 fullyParallel: true,

 retries: 0,

 reporter: [

   ['list'],

   // Allure reporter writes to ./allure-results

   ['allure-playwright', { detail: true, outputFolder: 'allure-results', suiteTitle: false }],

   ['html', { open: 'never' }]

 ],

 use: {

   baseURL: 'https://www.saucedemo.com',

   headless: true,

   screenshot: 'only-on-failure',

   video: 'retain-on-failure',

   trace: 'on-first-retry',

   viewport: { width: 1280, height: 800 }

 },

 projects: [

   {

     name: 'chromium',

     use: { ...devices['Desktop Chrome'] }

   }

   // You can add firefox/webkit if needed; Allure will keep separate runs per project.

 ]

});

🧱 5) Page Objects (POM)

tests/pages/LoginPage.ts

import { expect, Locator, Page } from '@playwright/test';

 

export class LoginPage {

 readonly page: Page;

 readonly usernameInput: Locator;

 readonly passwordInput: Locator;

 readonly loginButton: Locator;

 readonly errorMessage: Locator;

 

 constructor(page: Page) {

   this.page = page;

   this.usernameInput = page.getByPlaceholder('Username').or(page.locator('[data-test="username"]'));

   this.passwordInput = page.getByPlaceholder('Password').or(page.locator('[data-test="password"]'));

   this.loginButton = page.getByRole('button', { name: /login/i }).or(page.locator('[data-test="login-button"]'));

   this.errorMessage = page.locator('[data-test="error"]');

 }

 

 async goto() {

   await this.page.goto('/');

   await expect(this.usernameInput).toBeVisible();

 }

 

 async login(username: string, password: string) {

   await this.usernameInput.fill(username);

   await this.passwordInput.fill(password);

   await this.loginButton.click();

 }

 

 async expectLoggedIn() {

   // On success, inventory page shows products grid

   await expect(this.page.locator('.inventory_list')).toBeVisible();

 }

 

 async expectLoginErrorContains(text: RegExp | string) {

   await expect(this.errorMessage).toContainText(text);

 }

}

tests/pages/ProductsPage.ts

import { expect, Locator, Page } from '@playwright/test';

 

export class ProductsPage {

 readonly page: Page;

 readonly inventoryList: Locator;

 readonly cartLink: Locator;

 readonly cartBadge: Locator;

 

 constructor(page: Page) {

   this.page = page;

   this.inventoryList = page.locator('.inventory_list');

   this.cartLink = page.locator('.shopping_cart_link');

   this.cartBadge = page.locator('.shopping_cart_badge');

 }

 

 async addProductToCart(productName: string) {

   const card = this.page.locator('.inventory_item').filter({ hasText: productName });

   await expect(card).toBeVisible();

   const addButton = card.getByRole('button', { name: /add to cart/i });

   await addButton.click();

 }

 

 async openCart() {

   await this.cartLink.click();

 }

 

 async expectCartCount(count: number) {

   if (count === 0) {

     await expect(this.cartBadge).toHaveCount(0);

   } else {

     await expect(this.cartBadge).toHaveText(String(count));

   }

 }

}

tests/pages/CartPage.ts

import { expect, Locator, Page } from '@playwright/test';

 

export class CartPage {

 readonly page: Page;

 readonly items: Locator;

 readonly checkoutButton: Locator;

 

 constructor(page: Page) {

   this.page = page;

   this.items = page.locator('.cart_item');

   this.checkoutButton = page.locator('[data-test="checkout"]');

 }

 

 async expectItemInCart(productName: string) {

   await expect(this.page.locator('.cart_item .inventory_item_name', { hasText: productName })).toBeVisible();

 }

 

 async proceedToCheckout() {

   await this.checkoutButton.click();

 }

}

tests/pages/CheckoutPage.ts

import { expect, Locator, Page } from '@playwright/test';

 

export class CheckoutPage {

 readonly page: Page;

 readonly firstName: Locator;

 readonly lastName: Locator;

 readonly postalCode: Locator;

 readonly continueBtn: Locator;

 readonly finishBtn: Locator;

 readonly confirmationHeader: Locator;

 

 constructor(page: Page) {

   this.page = page;

   this.firstName = page.locator('[data-test="firstName"]');

   this.lastName = page.locator('[data-test="lastName"]');

   this.postalCode = page.locator('[data-test="postalCode"]');

   this.continueBtn = page.locator('[data-test="continue"]');

   this.finishBtn = page.locator('[data-test="finish"]');

   this.confirmationHeader = page.locator('[data-test="complete-header"]');

 }

 

 async fillAddress(first: string, last: string, zip: string) {

   await this.firstName.fill(first);

   await this.lastName.fill(last);

   await this.postalCode.fill(zip);

   await this.continueBtn.click();

 }

 

 async finishOrder() {

   await this.finishBtn.click();

 }

 

 async expectOrderReceived() {

   // Header usually: "Thank you for your order!"

   await expect(this.confirmationHeader.or(this.page.getByText(/thank you for your order!?/i))).toBeVisible();

 }

}

📊 6) Data-Driven Input

tests/data/purchase-data.json

[

 {

   "title": "standard user buys a backpack",

   "username": "standard_user",

   "password": "secret_sauce",

   "products": ["Sauce Labs Backpack"],

   "address": { "firstName": "Lakshmi", "lastName": "J.", "postalCode": "641001" }

 },

 {

   "title": "standard user buys two items",

   "username": "standard_user",

   "password": "secret_sauce",

   "products": ["Sauce Labs Bike Light", "Sauce Labs Bolt T-Shirt"],

   "address": { "firstName": "Cognizant", "lastName": "QA", "postalCode": "560001" }

 }

]

You can add more users (e.g., performance_glitch_user) or more products from the site’s catalog.

🧪 7) Data‑Driven E2E Test

tests/e2e/buy-product.spec.ts

import { test, expect } from '@playwright/test';

import purchaseData from '../data/purchase-data.json' assert { type: 'json' };

import { LoginPage } from '../pages/LoginPage';

import { ProductsPage } from '../pages/ProductsPage';

import { CartPage } from '../pages/CartPage';

import { CheckoutPage } from '../pages/CheckoutPage';

 

test.describe('E2E Purchase Flow (POM + Data-driven)', () =&gt; {

 for (const data of purchaseData) {

   test(data.title, async ({ page }) =&gt; {

     const login = new LoginPage(page);

     const products = new ProductsPage(page);

     const cart = new CartPage(page);

     const checkout = new CheckoutPage(page);

 

     await test.step('Login', async () =&gt; {

       await login.goto();

       await login.login(data.username, data.password);

       await login.expectLoggedIn();

     });

 

     await test.step('Add products to cart', async () =&gt; {

       for (const name of data.products) {

         await products.addProductToCart(name);

       }

       await products.expectCartCount(data.products.length);

     });

 

     await test.step('Go to Cart and validate items', async () =&gt; {

       await products.openCart();

       for (const name of data.products) {

         await cart.expectItemInCart(name);

       }

     });

 

     await test.step('Checkout: address and finish', async () =&gt; {

       await cart.proceedToCheckout();

       await checkout.fillAddress(

         data.address.firstName,

         data.address.lastName,

         data.address.postalCode

       );

       // On overview page now

       await checkout.finishOrder();

       await checkout.expectOrderReceived();

     });

 

     // Optional proof

     await page.screenshot({ path: `order-success-${data.title.replace(/\s+/g, '_')}.png`, fullPage: true });

   });

 }

});

🧪 8) Run Tests & Allure

# Run tests

npm run test

 

# Generate &amp; open Allure report

npm run allure:generate

npm run allure:open

Allure artifacts will be stored under:

allure-results/ (raw results from reporter)
allure-report/ (generated HTML you can open/share)
 
