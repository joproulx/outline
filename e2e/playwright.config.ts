import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for Outline E2E Tests
 *
 * This configuration is completely isolated from the main codebase.
 * Tests are located in /e2e/tests/ directory.
 */
export default defineConfig({
  // Test directory (isolated from main app)
  testDir: "./tests",

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    // Use line reporter for CI/automated runs (no HTML server)
    ["line"],
    // Generate HTML report but don't auto-serve it
    ["html", { open: "never" }],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for your application
    baseURL: "https://localhost:3000",

    // Run tests in headless mode (no browser window)
    headless: true,

    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true,

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Take screenshot on failure
    screenshot: "only-on-failure",
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run your local dev server before starting the tests
  // Commented out for manual testing - start server separately with 'yarn dev'
  // webServer: {
  //   command: 'yarn dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // },
});
