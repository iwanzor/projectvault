import { test, expect } from "@playwright/test";

test.describe("Authentication Redirects", () => {
  // These tests verify that the middleware redirects unauthenticated users
  // to the login page. They do NOT require a database since the middleware
  // only checks the JWT token (which won't exist for unauthenticated users).

  test("visiting / without auth redirects to /login", async ({ page }) => {
    await page.goto("/");

    // Should be redirected to login with callbackUrl=/
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /setup without auth redirects to /login with callbackUrl", async ({
    page,
  }) => {
    await page.goto("/setup");

    await expect(page).toHaveURL(/\/login/);
    // The middleware sets callbackUrl as a search parameter
    const url = new URL(page.url());
    expect(url.searchParams.get("callbackUrl")).toBe("/setup");
  });

  test("visiting /sales/quotations without auth redirects to /login", async ({
    page,
  }) => {
    await page.goto("/sales/quotations");

    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("callbackUrl")).toBe("/sales/quotations");
  });

  test("visiting /admin/users without auth redirects to /login", async ({
    page,
  }) => {
    await page.goto("/admin/users");

    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("callbackUrl")).toBe("/admin/users");
  });

  test("visiting /projects without auth redirects to /login", async ({
    page,
  }) => {
    await page.goto("/projects");

    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("callbackUrl")).toBe("/projects");
  });

  test("visiting /accounting/lpo without auth redirects to /login", async ({
    page,
  }) => {
    await page.goto("/accounting/lpo");

    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("callbackUrl")).toBe("/accounting/lpo");
  });

  test("visiting /warehouse/physical-stock without auth redirects to /login", async ({
    page,
  }) => {
    await page.goto("/warehouse/physical-stock");

    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("callbackUrl")).toBe(
      "/warehouse/physical-stock"
    );
  });

  test("/login page is accessible without auth (no redirect loop)", async ({
    page,
  }) => {
    await page.goto("/login");

    // Should stay on /login, not redirect
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("h1")).toHaveText("ProjectVault");
  });
});
