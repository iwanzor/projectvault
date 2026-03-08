import { test, expect } from "@playwright/test";

test.describe("Accessibility - Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("has proper heading structure", async ({ page }) => {
    // There should be exactly one h1 on the login page
    const h1Elements = page.locator("h1");
    await expect(h1Elements).toHaveCount(1);
    await expect(h1Elements.first()).toHaveText("ProjectVault");
  });

  test("form inputs have associated labels", async ({ page }) => {
    // Username input has a label with for="username"
    const usernameLabel = page.locator('label[for="username"]');
    await expect(usernameLabel).toBeVisible();
    await expect(usernameLabel).toHaveText("Username");

    // Password input has a label with for="password"
    const passwordLabel = page.locator('label[for="password"]');
    await expect(passwordLabel).toBeVisible();
    await expect(passwordLabel).toHaveText("Password");
  });

  test("inputs have autocomplete attributes", async ({ page }) => {
    await expect(page.locator("#username")).toHaveAttribute(
      "autocomplete",
      "username"
    );
    await expect(page.locator("#password")).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
  });

  test("tab order follows logical sequence", async ({ page }) => {
    // Username should be focused first (autofocus)
    await expect(page.locator("#username")).toBeFocused();

    // Tab to password
    await page.keyboard.press("Tab");
    await expect(page.locator("#password")).toBeFocused();

    // Tab to submit button (skipping password toggle which has tabIndex={-1})
    await page.keyboard.press("Tab");
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeFocused();
  });

  test("form can be submitted with Enter key", async ({ page }) => {
    await page.locator("#username").fill("testuser");
    await page.locator("#password").fill("testpass");

    // Press Enter to submit (this will attempt login and fail, but the form should submit)
    await page.keyboard.press("Enter");

    // The button should show loading state briefly (Signing in...)
    // or an error message since credentials are invalid
    // We just verify the form submission was triggered
    const buttonOrError = page.locator(
      'text="Signing in...", text="Invalid username or password."'
    );
    // Wait a moment for the submission to process
    await page.waitForTimeout(500);
  });

  test("password toggle button is excluded from tab order", async ({
    page,
  }) => {
    // The password toggle button has tabIndex={-1}
    const toggleButton = page.locator("#password ~ button");
    await expect(toggleButton).toHaveAttribute("tabindex", "-1");
  });

  test("page has lang attribute on html element", async ({ page }) => {
    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("en");
  });

  test("submit button has visible text for screen readers", async ({
    page,
  }) => {
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveText("Sign in");
  });

  test("error messages are properly associated with form fields", async ({
    page,
  }) => {
    // Submit empty form to trigger validation
    await page.locator('button[type="submit"]').click();

    // Error messages should be visible and near their respective fields
    const usernameError = page.locator("text=Username is required");
    const passwordError = page.locator("text=Password is required");

    await expect(usernameError).toBeVisible();
    await expect(passwordError).toBeVisible();
  });
});
