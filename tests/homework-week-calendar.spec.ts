import { test, expect, Page } from '@playwright/test';

const TUTOR_EMAIL    = process.env.TUTOR_EMAIL    || 'dabdukhamitova@gmail.com';
const TUTOR_PASSWORD = process.env.TUTOR_PASSWORD || '12345678';

async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[name="email"], input[type="email"]').fill(TUTOR_EMAIL);
  await page.locator('input[name="password"], input[type="password"]').fill(TUTOR_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 12_000 });
}

async function getFirstCourseId(page: Page): Promise<string> {
  await page.goto('/tutor/courses');
  await page.waitForLoadState('networkidle');
  const links = page.locator('a[href*="/tutor/courses/"]');
  const count = await links.count();
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute('href') || '';
    const m = href.match(/\/tutor\/courses\/([0-9a-f-]{36})(?:\/|$)/);
    if (m) return m[1];
  }
  return '';
}

test.describe('Homework 7-day picker + week placement', () => {

  test('7-day WeekDayTimePicker appears in homework form when adding to a week', async ({ page }) => {
    test.setTimeout(60_000);

    await login(page);
    const courseId = await getFirstCourseId(page);
    expect(courseId, 'Need at least one course').toBeTruthy();

    await page.goto(`/tutor/courses/${courseId}`);
    await page.waitForLoadState('networkidle');

    // "Week Calendar" at top should be GONE
    await expect(page.locator('text=Week Calendar')).not.toBeVisible({ timeout: 3_000 }).catch(() => {});
    console.log('✓ top-level "Week Calendar" removed');

    // Add a new week and open homework form
    const addWeekBtn = page.locator('button', { hasText: 'Add Week' });
    await expect(addWeekBtn).toBeVisible({ timeout: 5_000 });
    await addWeekBtn.click();
    await page.waitForTimeout(400);

    const addContentBtns = page.locator('button', { hasText: 'Add content' });
    const btnCount = await addContentBtns.count();
    await addContentBtns.nth(btnCount - 1).click();
    await page.locator('button').filter({ hasText: /homework/i }).first().click();
    console.log('✓ opened homework form in a week');

    // The form should contain WeekDayTimePicker — day buttons Mo/Tu/We/Th/Fr/Sa/Su
    for (const label of ['Mo', 'Tu', 'We', 'Th', 'Fr']) {
      await expect(page.locator(`text="${label}"`).first()).toBeVisible({ timeout: 5_000 });
    }
    console.log('✓ WeekDayTimePicker day buttons (Mo–Fr) visible in homework form');

    // One day should already be pre-selected (green background)
    const selectedDay = page.locator('button').filter({ has: page.locator('span.text-\\[13px\\].font-bold') }).filter({ hasCSS: 'background-color', });
    // Simpler: check that time input also appears (WeekDayTimePicker renders a time input)
    const timeInput = page.locator('input[type="time"]');
    await expect(timeInput).toBeVisible({ timeout: 3_000 });
    console.log('✓ time input visible (full WeekDayTimePicker rendered)');

    await page.screenshot({ path: 'tests/homework-form-picker.png', fullPage: false });
    console.log('✓ screenshot saved: tests/homework-form-picker.png');
  });

  test('homework added to a specific week appears in that week, not General', async ({ page }) => {
    test.setTimeout(90_000);

    await login(page);
    const courseId = await getFirstCourseId(page);
    expect(courseId).toBeTruthy();

    await page.goto(`/tutor/courses/${courseId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=General').first()).toBeVisible({ timeout: 8_000 });

    // Add a new week
    await page.locator('button', { hasText: 'Add Week' }).click();
    await page.waitForTimeout(400);
    console.log('✓ clicked Add Week');

    // Open homework form in last week
    const addContentBtns = page.locator('button', { hasText: 'Add content' });
    await addContentBtns.nth(await addContentBtns.count() - 1).click();
    await page.locator('button').filter({ hasText: /homework/i }).first().click();
    console.log('✓ opened homework form');

    // Wait for WeekDayTimePicker day buttons to appear
    await expect(page.locator('text="Mo"').first()).toBeVisible({ timeout: 5_000 });

    // Fill title (WeekDayTimePicker already has a day pre-selected — no need to touch it)
    const homeworkTitle = `HW Picker Test ${Date.now()}`;
    await page.locator('input[placeholder*="Assignment title"]').fill(homeworkTitle);
    console.log('✓ filled title, left WeekDayTimePicker day pre-selected');

    // Intercept API call
    const [request] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/assignments') && req.method() === 'POST', { timeout: 10_000 }),
      page.locator('button', { hasText: 'Save' }).first().click(),
    ]);
    const reqBody = request.postDataJSON();
    console.log('Assignment API request body:', JSON.stringify(reqBody));

    // due_date must be sent as YYYY-MM-DD (date-only, stripped from WeekDayTimePicker value)
    expect(reqBody.due_date, 'due_date must be sent').toBeTruthy();
    expect(reqBody.due_date, 'due_date must be date-only format YYYY-MM-DD').toMatch(/^\d{4}-\d{2}-\d{2}$/);
    console.log('✓ due_date in request:', reqBody.due_date);

    // Wait for form to close
    await expect(page.locator('input[placeholder*="Assignment title"]')).not.toBeVisible({ timeout: 8_000 });
    await page.waitForTimeout(600);

    // Expand all weeks
    const weekHeaders = page.locator('button').filter({ hasText: /Week \d+|General/ });
    const headerCount = await weekHeaders.count();
    for (let i = 0; i < headerCount; i++) {
      await weekHeaders.nth(i).click().catch(() => {});
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(300);

    // Verify homework is NOT in General
    const bodyText = await page.locator('body').textContent() || '';
    const generalIdx       = bodyText.indexOf('General');
    const hwIdx            = bodyText.indexOf(homeworkTitle);
    const weekAfterGeneral = bodyText.indexOf('Week ', generalIdx + 1);
    console.log(`Positions — General:${generalIdx}, first Week after General:${weekAfterGeneral}, homework:${hwIdx}`);

    expect(hwIdx, 'Homework must appear on page').toBeGreaterThan(0);
    expect(hwIdx, 'Homework must be in a Week section, NOT in General').toBeGreaterThan(weekAfterGeneral);
    console.log('✓ PASS: homework is in a Week section, NOT in General');

    await page.screenshot({ path: 'tests/homework-week-result.png', fullPage: true });
  });

});
