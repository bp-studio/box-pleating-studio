
# E2E

This section contains end-to-end tests for BP Studio.

We use [Playwright](https://playwright.dev/) to perform E2E tests.
One can use the [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
extension to run all tests.
Alternatively, run `pnpm e2e` in the console to run all tests.

Unfortunately, Playwright focuses only on the latest browsers, and even if we downgrade Playwright,
the oldest supported Safari version is just v14.1 ([source](https://playwright.dev/docs/release-notes)),
which is way newer than the targeted v11.1.

Therefore, to automate compatibility tests,
we use [Selenium](https://www.selenium.dev/) + [BrowserStack](https://www.browserstack.com/) instead.
This part is located in a separate private repo.
