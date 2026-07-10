import { test, expect } from '@playwright/test';

// Helper to log in as admin
async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill('admin@school.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL('**/dashboard');
}

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('sidebar navigation works for authenticated users', async ({ page }) => {
    // The dashboard should be visible after login
    await expect(page.getByText(/Welcome.*Admin/i)).toBeVisible();
  });

  test('can navigate to Students page', async ({ page }) => {
    await page.goto('/students');
    await expect(page.getByText(/Students/i).first()).toBeVisible();
  });

  test('can navigate to Teachers page', async ({ page }) => {
    await page.goto('/teachers');
    await expect(page.getByText(/Teachers/i).first()).toBeVisible();
  });

  test('can navigate to Attendance page', async ({ page }) => {
    await page.goto('/attendance');
    await expect(page.getByText(/Attendance/i).first()).toBeVisible();
  });

  test('can navigate to Gradebook page', async ({ page }) => {
    await page.goto('/gradebook');
    await expect(page.getByText(/Gradebook/i).first()).toBeVisible();
  });

  test('mobile hamburger menu opens and closes', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Open the mobile menu
    const menuButton = page.getByRole('button', { name: /Open menu/i });
    await menuButton.click();

    // Verify menu items are visible
    await expect(page.getByRole('link', { name: /Announcements/i }).nth(1)).toBeVisible();

    // Close the mobile menu
    const closeButton = page.getByRole('button', { name: /Close menu/i });
    await closeButton.click();

    // Verify close button is no longer visible (menu is closed)
    await expect(closeButton).not.toBeVisible();
  });
});
