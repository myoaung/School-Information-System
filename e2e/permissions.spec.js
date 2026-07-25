import { test, expect } from '@playwright/test';

test.describe('Role-Based Permissions', () => {
  test('student sees limited navigation', async ({ page }) => {
    // Login as student
    await page.goto('/login');
    await page.getByLabel('Email address').fill('john@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');

    // Student dashboard should load
    await expect(page.getByText(/Welcome/i)).toBeVisible();

    // Admin-only links should not be visible
    const adminLinks = page.getByRole('link', { name: /Settings|Users|Finance/i });
    await expect(adminLinks).toHaveCount(0);
  });

  test('admin sees full navigation', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin@school.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');

    // Admin dashboard should load
    await expect(page.getByText(/Admin/i)).toBeVisible();
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    // Try accessing protected route
    await page.goto('/students');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('student cannot access admin routes directly', async ({ page }) => {
    // Login as student
    await page.goto('/login');
    await page.getByLabel('Email address').fill('john@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');

    // Try to access settings/admin route
    await page.goto('/settings');
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});
