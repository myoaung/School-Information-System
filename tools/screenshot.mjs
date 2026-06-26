import puppeteer from 'puppeteer-core';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(__dirname, '..', 'screenshots');

const VIEWPORT = { width: 1280, height: 800 };
const BASE = 'https://schoolhub-mu.vercel.app';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // 1. Home page (not logged in)
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: join(SCREENSHOT_DIR, '01-home.png'), fullPage: true });
  console.log('✅ 01-home.png');

  // 2. Login page
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: join(SCREENSHOT_DIR, '02-login.png'), fullPage: true });
  console.log('✅ 02-login.png');

  // 3. Login as student
  await page.type('input[type="email"]', 'student@school.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // 4. Dashboard (after login)
  await page.screenshot({ path: join(SCREENSHOT_DIR, '03-dashboard.png'), fullPage: true });
  console.log('✅ 03-dashboard.png');

  // 5. Announcements page
  await page.goto(`${BASE}/announcements`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: join(SCREENSHOT_DIR, '04-announcements.png'), fullPage: true });
  console.log('✅ 04-announcements.png');

  // 6. Classes page
  await page.goto(`${BASE}/classes`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: join(SCREENSHOT_DIR, '05-classes.png'), fullPage: true });
  console.log('✅ 05-classes.png');

  // 7. Contact page
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: join(SCREENSHOT_DIR, '06-contact.png'), fullPage: true });
  console.log('✅ 06-contact.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to screenshots/');
}

run().catch(err => {
  console.error('Screenshot failed:', err);
  process.exit(1);
});
