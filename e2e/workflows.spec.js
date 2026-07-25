import { test, expect } from '@playwright/test';

test.describe('Core Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each workflow
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin@school.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');
  });

  test('admin can create a new class', async ({ page }) => {
    await page.goto('/classes');
    await page.waitForURL('**/classes');

    // Click add class button
    await page.getByRole('button', { name: /Add Class/i }).click();

    // Fill class form
    await page.getByLabel(/Class Name/i).fill('Test Class E2E');
    await page.getByLabel(/Section/i).fill('A');
    await page.getByRole('button', { name: /Save/i }).click();

    // Verify class appears
    await expect(page.getByText('Test Class E2E')).toBeVisible();
  });

  test('admin can view students list', async ({ page }) => {
    await page.goto('/students');
    await page.waitForURL('**/students');

    // Student table should be visible
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('admin can navigate through dashboard cards', async ({ page }) => {
    // Dashboard should show summary cards
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard');

    // Check for common dashboard elements
    await expect(page.getByText(/Students/i)).toBeVisible();
  });

  test('attendance page loads for admin', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForURL('**/attendance');

    // Attendance interface should be visible
    await expect(page.getByText(/Attendance/i)).toBeVisible();
  });
});
