import { test, expect } from "@playwright/test";

/**
 * Basic E2E Test for Tasks Page
 *
 * This test validates that the tasks page loads correctly and displays
 * the basic task functionality. It serves as a smoke test for the task
 * feature and helps catch the counter vs display regression issue.
 */

test.describe("Tasks Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the tasks page
    // Note: This assumes you have authentication setup or test data
    // You may need to add login steps here depending on your app setup
    await page.goto("/tasks");
  });

  test("should load tasks page successfully", async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that we're on the tasks page
    await expect(page).toHaveURL(/.*tasks/);

    // Check that the page title contains "Tasks" (adjust based on your app)
    await expect(page).toHaveTitle(/.*Tasks.*|.*Outline.*/);

    // Verify the main tasks container is present
    const tasksContainer = page.locator(
      '[data-testid="tasks-container"], .tasks-container, main'
    );
    await expect(tasksContainer).toBeVisible();
  });

  test("should display task list interface", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Look for common task list elements
    // Note: You may need to adjust these selectors based on your actual DOM structure

    // Check for task list or empty state
    const taskList = page.locator(
      '[data-testid="task-list"], .task-list, [class*="task"]'
    );
    const emptyState = page.locator(
      '[data-testid="empty-state"], .empty-state, [class*="empty"]'
    );

    // Either task list or empty state should be visible
    await expect(taskList.or(emptyState)).toBeVisible();
  });

  test("should have consistent task counter and display", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // This test specifically addresses the regression where counter shows
    // a number but task list is empty

    // Look for task counter in sidebar or header
    const taskCounter = page.locator(
      '[data-testid="task-counter"], .task-counter, [class*="count"]'
    );

    // Look for actual task items
    const taskItems = page.locator(
      '[data-testid="task-item"], .task-item, [class*="task-item"]'
    );

    // If we can find a counter, validate it matches displayed tasks
    if (await taskCounter.isVisible()) {
      const counterText = await taskCounter.textContent();
      const counterNumber = parseInt(counterText?.match(/\d+/)?.[0] || "0");

      const actualTaskCount = await taskItems.count();

      // The key regression test: counter should match actual displayed tasks
      expect(actualTaskCount).toBe(counterNumber);
    }
  });

  test("should allow basic task interactions", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Look for create task button or form
    const createButton = page.locator(
      '[data-testid="create-task"], [class*="create"], button:has-text("Add"), button:has-text("New"), button:has-text("Create")'
    );

    if (await createButton.isVisible()) {
      // Test that create task button is clickable
      await expect(createButton).toBeEnabled();

      // Optional: Test clicking the button opens a form
      await createButton.click();

      // Look for task form or modal
      const taskForm = page.locator(
        '[data-testid="task-form"], form, [class*="form"], [class*="modal"]'
      );
      await expect(taskForm).toBeVisible();
    }
  });

  test("should handle empty task state gracefully", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // This test ensures the page handles empty task lists properly
    // without showing confusing counter/display mismatches

    const taskItems = page.locator(
      '[data-testid="task-item"], .task-item, [class*="task-item"]'
    );
    const taskCount = await taskItems.count();

    if (taskCount === 0) {
      // When there are no tasks, there should be an empty state or clear messaging
      const emptyState = page.locator(
        '[data-testid="empty-state"], .empty-state, [class*="empty"], [class*="no-tasks"]'
      );
      const emptyMessage = page.locator(
        "text=/no tasks/i, text=/empty/i, text=/get started/i"
      );

      // Either empty state component or empty message should be visible
      await expect(emptyState.or(emptyMessage)).toBeVisible();

      // Any counter should show 0 or be hidden
      const counters = page.locator(
        '[data-testid="task-counter"], .task-counter, [class*="count"]'
      );

      for (let i = 0; i < (await counters.count()); i++) {
        const counter = counters.nth(i);
        if (await counter.isVisible()) {
          const counterText = await counter.textContent();
          const counterNumber = parseInt(counterText?.match(/\d+/)?.[0] || "0");
          expect(counterNumber).toBe(0);
        }
      }
    }
  });
});
