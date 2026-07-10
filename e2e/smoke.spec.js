import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SchoolHub|School Information/i);
  });

  test('homepage shows SchoolHub branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /SchoolHub/i }).first()).toBeVisible();
  });

  test('navigation links are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Announcements/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Classes/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Curriculum/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Contact/i }).first()).toBeVisible();
  });

  test('can navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Login/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('can navigate to announcements page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Announcements/i }).first().click();
    await expect(page).toHaveURL(/\/announcements/);
  });
});
