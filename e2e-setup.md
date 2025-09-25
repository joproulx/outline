# Playwright Configuration for Outline E2E Tests

## Installation (One-time setup)

```bash
# 1. Install Playwright (dev dependency only)
yarn add -D @playwright/test

# 2. Install browsers (optional - CI can handle this)  
npx playwright install

# 3. Run tests
yarn test:e2e
```

## File Structure (Completely Isolated)

```
/e2e/
├── playwright.config.ts       # Test configuration
├── tests/
│   ├── tasks.spec.ts         # Task-related E2E tests
│   ├── auth.spec.ts          # Authentication tests  
│   └── smoke.spec.ts         # Basic smoke tests
├── fixtures/
│   ├── test-data.json        # Test data
│   └── helpers.ts            # Test utilities
└── README.md                 # E2E testing docs
```

## Benefits of This Approach:

✅ **Zero Impact on Main Code**: No changes to app/, server/, shared/
✅ **Independent Versioning**: Playwright updates don't affect main dependencies  
✅ **Optional Testing**: Team members can skip E2E tests if needed
✅ **CI Flexibility**: Can enable/disable E2E tests per environment
✅ **Easy Removal**: Delete /e2e folder to completely remove

## Team Adoption:

- **Backend Developers**: Don't need to run E2E tests
- **Frontend Developers**: Can run for UI validation  
- **QA/DevOps**: Primary users for regression testing
- **CI/CD**: Automated on PRs/releases only

## Resource Usage:

- **Development**: 0 impact (only when actively running tests)
- **CI**: Runs in parallel with existing tests  
- **Production**: 0 impact (dev dependency only)