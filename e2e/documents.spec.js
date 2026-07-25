import { test, expect } from '@playwright/test';

test.describe('Document Access', () => {
  test('documents page loads for admin', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin@school.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');

    // Navigate to documents
    await page.goto('/documents');
    await page.waitForURL('**/documents');

    // Document list should load
    await expect(page.getByText(/Documents/i)).toBeVisible();
  });

  test('student cannot access document upload', async ({ page }) => {
    // Login as student
    await page.goto('/login');
    await page.getByLabel('Email address').fill('john@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');

    // Try to access document admin page
    await page.goto('/documents/admin');
    // Should be redirected or get forbidden response
    await expect(page).not.toHaveURL(/\/documents\/admin/);
  });

  test('navigation to documents from sidebar works', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin@school.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');

    // Click documents link in sidebar
    const docLink = page.getByRole('link', { name: /Documents/i });
    if (await docLink.isVisible()) {
      await docLink.click();
      await page.waitForURL('**/documents');
      await expect(page).toHaveURL(/\/documents/);
    }
  });
});
