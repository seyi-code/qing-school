import { test, expect } from "@playwright/test";

/**
 * Staging smoke: login → fees page loads (tenant-aware).
 * Requires SMOKE_EMAIL + SMOKE_PASSWORD.
 */
test.describe("staging fees", () => {
  test("fees page reachable after login", async ({ page }) => {
    const email = process.env.SMOKE_EMAIL || "admin@kms.sch.ng";
    const password = process.env.SMOKE_PASSWORD;
    test.skip(!password, "Set SMOKE_PASSWORD to run authenticated E2E");

    await page.goto("/login");
    await page.locator('input[type="email"], input[name="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password!);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/dashboard|portal|platform/, { timeout: 30_000 });

    await page.goto("/fees");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).toContainText(/fee|invoice|payment|naira|₦|balance/i);
  });
});
