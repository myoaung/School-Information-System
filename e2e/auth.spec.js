import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
  });

  test('can login with admin credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin@school.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Welcome.*Admin/i)).toBeVisible();
  });

  test('login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin@school.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('can logout from dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin@school.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');

    // Open user menu and click logout
    await page.getByRole('button', { name: /Admin User/i }).click();
    await page.getByRole('button', { name: /Logout/i }).click();
    await page.waitForURL('**/');
    expect(page.url()).toContain('/');
  });

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login/);
  });
});
