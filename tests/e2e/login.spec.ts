import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("loads and displays the login form", async ({ page }) => {
    // ProjectVault branding
    await expect(page.locator("h1")).toHaveText("ProjectVault");
    await expect(page.locator("text=Sign in to your account")).toBeVisible();
  });

  test("shows username and password input fields", async ({ page }) => {
    const usernameInput = page.locator("#username");
    const passwordInput = page.locator("#password");

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await expect(usernameInput).toHaveAttribute("type", "text");
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("shows placeholder text in inputs", async ({ page }) => {
    await expect(page.locator("#username")).toHaveAttribute(
      "placeholder",
      "Enter your username"
    );
    await expect(page.locator("#password")).toHaveAttribute(
      "placeholder",
      "Enter your password"
    );
  });

  test("has a Sign in button", async ({ page }) => {
    const signInButton = page.locator('button[type="submit"]');
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toHaveText("Sign in");
    await expect(signInButton).toBeEnabled();
  });

  test("shows validation error when submitting empty username", async ({
    page,
  }) => {
    // Fill password but leave username empty
    await page.locator("#password").fill("somepassword");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator("text=Username is required")).toBeVisible();
  });

  test("shows validation error when submitting empty password", async ({
    page,
  }) => {
    // Fill username but leave password empty
    await page.locator("#username").fill("someuser");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator("text=Password is required")).toBeVisible();
  });

  test("shows both validation errors when submitting empty form", async ({
    page,
  }) => {
    await page.locator('button[type="submit"]').click();

    await expect(page.locator("text=Username is required")).toBeVisible();
    await expect(page.locator("text=Password is required")).toBeVisible();
  });

  test("password toggle shows and hides password", async ({ page }) => {
    const passwordInput = page.locator("#password");
    await passwordInput.fill("secret123");

    // Initially password is hidden
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click the toggle button (the button inside the password field container)
    const toggleButton = page.locator("#password ~ button");
    await toggleButton.click();

    // Password should now be visible
    await expect(passwordInput).toHaveAttribute("type", "text");

    // Click again to hide
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("displays BGERP copyright footer", async ({ page }) => {
    const currentYear = new Date().getFullYear().toString();
    await expect(page.locator(`text=BGERP`)).toBeVisible();
    await expect(page.locator(`text=${currentYear}`)).toBeVisible();
  });

  test("username field has autofocus", async ({ page }) => {
    const usernameInput = page.locator("#username");
    await expect(usernameInput).toBeFocused();
  });

  test("has proper form labels", async ({ page }) => {
    const usernameLabel = page.locator('label[for="username"]');
    const passwordLabel = page.locator('label[for="password"]');

    await expect(usernameLabel).toHaveText("Username");
    await expect(passwordLabel).toHaveText("Password");
  });
});
