import { test, expect } from "@playwright/test";

test.describe("Navigation (Authenticated)", () => {
  // All tests in this suite require an authenticated session.
  // Since we do not have a running database or a way to mock auth
  // for E2E tests, these tests are skipped.
  // They document what SHOULD be tested once a test database is available.

  test.skip("sidebar renders with Dashboard link", async ({ page }) => {
    // Requires auth: the dashboard layout checks session and renders sidebar
    await page.goto("/");
    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page.locator("text=ProjectVault")).toBeVisible();
  });

  test.skip("sidebar shows all top-level module sections", async ({
    page,
  }) => {
    // Requires auth with full admin permissions to see all modules
    await page.goto("/");
    const sidebar = page.locator("aside");
    await expect(sidebar.locator("text=Dashboard")).toBeVisible();
    await expect(sidebar.locator("text=Sales")).toBeVisible();
    await expect(sidebar.locator("text=Setup")).toBeVisible();
    await expect(sidebar.locator("text=Projects")).toBeVisible();
    await expect(sidebar.locator("text=Accounting")).toBeVisible();
    await expect(sidebar.locator("text=Warehouse")).toBeVisible();
    await expect(sidebar.locator("text=Reports")).toBeVisible();
    await expect(sidebar.locator("text=Admin")).toBeVisible();
  });

  test.skip("clicking a module expands its submenu", async ({ page }) => {
    // Requires auth: sidebar only renders when authenticated
    await page.goto("/");
    const salesButton = page.locator("aside button", { hasText: "Sales" });
    await salesButton.click();
    await expect(page.locator("text=Quotations")).toBeVisible();
    await expect(page.locator("text=Currency Preview")).toBeVisible();
  });

  test.skip("clicking a submenu item navigates to the correct page", async ({
    page,
  }) => {
    // Requires auth: sidebar navigation only works for authenticated users
    await page.goto("/");

    // Expand Sales
    await page.locator("aside button", { hasText: "Sales" }).click();
    await page.locator("a", { hasText: "Quotations" }).click();

    await expect(page).toHaveURL("/sales/quotations");
  });

  test.skip("dashboard page shows welcome message", async ({ page }) => {
    // Requires auth: dashboard page is behind auth layout
    await page.goto("/");
    await expect(page.locator("text=Welcome to ProjectVault")).toBeVisible();
    await expect(
      page.locator("text=Your enterprise resource planning dashboard")
    ).toBeVisible();
  });

  test.skip("dashboard shows stat cards", async ({ page }) => {
    // Requires auth: dashboard page is behind auth layout
    await page.goto("/");
    await expect(page.locator("text=Active Quotations")).toBeVisible();
    await expect(page.locator("text=Active Projects")).toBeVisible();
    await expect(page.locator("text=Products")).toBeVisible();
    await expect(page.locator("text=Customers")).toBeVisible();
  });

  test.skip("dashboard shows quick action links", async ({ page }) => {
    // Requires auth: dashboard page is behind auth layout
    await page.goto("/");
    await expect(page.locator("text=Quick Actions")).toBeVisible();
    await expect(page.locator("text=New Quotation")).toBeVisible();
    await expect(page.locator("text=View Projects")).toBeVisible();
    await expect(page.locator("text=Manage Items")).toBeVisible();
    await expect(page.locator("text=Sales Reports")).toBeVisible();
  });

  test.skip("sidebar collapse toggle works", async ({ page }) => {
    // Requires auth: sidebar only renders when authenticated
    await page.goto("/");

    const sidebar = page.locator("aside");
    // Initially expanded (w-64)
    await expect(sidebar.locator("text=Collapse")).toBeVisible();

    // Click collapse
    await sidebar.locator("text=Collapse").click();

    // Sidebar should be collapsed - text labels hidden
    await expect(sidebar.locator("text=Collapse")).not.toBeVisible();
  });

  test.skip("placeholder pages show Coming Soon badge", async ({ page }) => {
    // Requires auth: all dashboard pages are behind auth
    // Navigate to a placeholder page (e.g., /setup/items)
    await page.goto("/setup/items");
    await expect(page.locator("text=Coming Soon")).toBeVisible();
  });

  test.skip("header is visible on dashboard pages", async ({ page }) => {
    // Requires auth: header only renders inside authenticated layout
    await page.goto("/");
    const header = page.locator("header");
    await expect(header).toBeVisible();
  });

  test.skip("breadcrumbs update on navigation", async ({ page }) => {
    // Requires auth: breadcrumbs only render inside authenticated layout
    await page.goto("/");

    // Expand Sales and navigate to quotations
    await page.locator("aside button", { hasText: "Sales" }).click();
    await page.locator("a", { hasText: "Quotations" }).click();

    // Breadcrumbs should reflect the current path
    await expect(page.locator("text=Quotations")).toBeVisible();
  });

  test.skip("non-admin users cannot see Admin section", async ({ page }) => {
    // Requires auth with a non-admin user
    // The sidebar filters navigation items based on user permissions
    await page.goto("/");
    const sidebar = page.locator("aside");
    await expect(sidebar.locator("text=Admin")).not.toBeVisible();
  });
});
