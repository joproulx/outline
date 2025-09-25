# E2E Tests for Outline

This directory contains end-to-end tests using Playwright, completely isolated from the main codebase.

## Setup (One-time)

The tests are already configured! Playwright and browsers are installed.

If you see browser dependency warnings, install them with:
```bash
sudo npx playwright install-deps
```

## Running Tests

```bash
# Run all e2e tests (headless mode - no browser window)
yarn test:e2e

# Run tests with visible browser (for watching/debugging)
yarn test:e2e:headed

# Run tests with UI (interactive mode)
yarn test:e2e:ui

# Debug tests (step through with DevTools)
yarn test:e2e:debug

# View HTML test report (after running tests)
yarn test:e2e:report

# Run specific test file
cd e2e && npx playwright test tasks.spec.ts
```

## Test Structure

- `playwright.config.ts` - Test configuration (isolated from main app)
- `tests/` - Test files
  - `tasks.spec.ts` - Task page functionality and regression tests

## What These Tests Cover

1. **Basic Smoke Tests**: Verify pages load without errors
2. **Regression Prevention**: Catch counter vs display mismatches  
3. **User Workflows**: Test critical user interactions
4. **Cross-browser Compatibility**: Currently configured for Chromium

## Development

- Tests run against `http://localhost:3000` (your dev server)
- Tests automatically start the dev server if not running
- Each test is independent and isolated
- Tests use real browser interactions

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run E2E tests
  run: yarn test:e2e
```

## Debugging Failed Tests

1. Check screenshots in `test-results/` directory
2. Use `yarn test:e2e:ui` for interactive debugging
3. Use `yarn test:e2e:debug` to step through tests
4. Check the HTML report: `npx playwright show-report`