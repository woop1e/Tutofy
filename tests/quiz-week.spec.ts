import { test, expect, Page } from '@playwright/test';

// ── credentials ──────────────────────────────────────────────────────────────
const TUTOR_EMAIL    = process.env.TUTOR_EMAIL    || 'dabdukhamitova@gmail.com';
const TUTOR_PASSWORD = process.env.TUTOR_PASSWORD || '12345678';

// ── helpers ───────────────────────────────────────────────────────────────────

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('input[name="email"], input[type="email"]').fill(email);
  await page.locator('input[name="password"], input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  // wait for redirect away from /login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10_000 });
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('Quiz saved to correct week', () => {

  test('quiz created from a week appears in that week, not in General', async ({ page }) => {
    test.setTimeout(90_000);

    // 1. Login
    await login(page, TUTOR_EMAIL, TUTOR_PASSWORD);
    console.log('✓ logged in');

    // 2. Go to tutor courses page
    await page.goto('/tutor/courses');
    await page.waitForLoadState('networkidle');

    // 3. Pick first REAL course — find links that are exactly /tutor/courses/:uuid
    const courseLinks = page.locator('a[href*="/tutor/courses/"]');
    const linkCount = await courseLinks.count();
    let courseId = '';
    for (let i = 0; i < linkCount; i++) {
      const href = await courseLinks.nth(i).getAttribute('href') || '';
      // Match /tutor/courses/<uuid> — uuid has dashes and hex chars
      const m = href.match(/\/tutor\/courses\/([0-9a-f-]{36})(?:\/|$)/);
      if (m) { courseId = m[1]; break; }
    }
    console.log('Found course ID:', courseId);
    expect(courseId, 'No real course found — create a course first').toBeTruthy();
    await page.goto(`/tutor/courses/${courseId}`);
    await page.waitForLoadState('networkidle');
    console.log('✓ opened course:', page.url());

    // 4. Expand all weeks — click any collapsed week header
    // The weeks are accordion-style; make sure we can see General section
    const generalHeader = page.locator('text=General').first();
    await expect(generalHeader).toBeVisible({ timeout: 8_000 });

    // 5. Click "+ Add Week" to create a new week
    const addWeekBtn = page.locator('button', { hasText: 'Add Week' });
    await expect(addWeekBtn).toBeVisible({ timeout: 5_000 });
    await addWeekBtn.click();
    console.log('✓ added a new week');

    // 6. Find the newly created week section (last week)
    // The pending week has an "Add content" button
    await page.waitForTimeout(300);
    const addContentButtons = page.locator('button', { hasText: 'Add content' });
    const btnCount = await addContentButtons.count();
    console.log('Add content buttons found:', btnCount);
    expect(btnCount).toBeGreaterThan(0);

    // Click the LAST "Add content" button (the new week)
    await addContentButtons.nth(btnCount - 1).click();
    console.log('✓ clicked Add content in new week');

    // 7. Content modal — select "Quiz"
    const quizOption = page.locator('button, [role="button"]').filter({ hasText: /^quiz$/i }).first();
    const quizOption2 = page.locator('text=Quiz').first();
    await expect(quizOption2).toBeVisible({ timeout: 5_000 });
    await quizOption2.click();
    console.log('✓ selected Quiz in modal');

    // 8. Should navigate to /quizzes/new?scheduled_at=...
    await page.waitForURL(url => url.pathname.includes('/quizzes/new'), { timeout: 8_000 });
    const currentUrl = page.url();
    console.log('✓ on quiz creation page:', currentUrl);

    // ASSERT: URL contains scheduled_at
    expect(currentUrl).toContain('scheduled_at=');
    const scheduledAt = new URL(currentUrl).searchParams.get('scheduled_at');
    console.log('✓ scheduled_at in URL:', scheduledAt);
    expect(scheduledAt).toBeTruthy();

    // 9. Fill in quiz title
    const quizTitle = `Test Quiz ${Date.now()}`;
    // Find the first text input in the quiz info card
    await page.locator('input[placeholder*="Vocabulary"], input[placeholder*="title"], input[placeholder*="quiz"]').first().fill(quizTitle);

    // 10. Add one question — click "Multiple choice" in the right panel
    await page.locator('button', { hasText: 'Multiple choice' }).first().click();
    await page.waitForTimeout(500);

    // Fill question text (first textarea in the question editor)
    const allTextareas = page.locator('textarea');
    if (await allTextareas.count() > 0) {
      await allTextareas.first().fill('What is 2+2?');
    }
    // Fill first option
    const optionInputs = page.locator('input[placeholder]').filter({ hasNot: page.locator('[type="number"]') });
    if (await optionInputs.count() > 1) {
      await optionInputs.nth(1).fill('4');
    }

    // 11. Save the quiz
    const saveBtn = page.locator('button', { hasText: /Save.*add|Save.*course/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5_000 });

    // Intercept the API request to verify scheduled_at is sent
    const [request] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/quizzes') && req.method() === 'POST'),
      saveBtn.click(),
    ]);
    const reqBody = request.postDataJSON();
    console.log('✓ API request body:', JSON.stringify(reqBody));

    // ASSERT: scheduled_at is in request body
    expect(reqBody.scheduled_at).toBeTruthy();
    expect(reqBody.scheduled_at).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00Z$/);
    console.log('✓ scheduled_at in request:', reqBody.scheduled_at);

    // 12. Wait for redirect back to course page
    await page.waitForURL(url => url.pathname.includes('/tutor/courses/') && !url.pathname.includes('/quizzes'), { timeout: 15_000 });
    await page.waitForLoadState('networkidle');
    console.log('✓ back on course page');

    // 13. Reload to get fresh data and capture the quizzes response
    const quizzesRespPromise = page.waitForResponse(
      resp => resp.url().includes('/quizzes') && resp.status() === 200,
      { timeout: 8_000 }
    ).catch(() => null);
    await page.reload();
    await page.waitForLoadState('networkidle');
    const quizzesResp = await quizzesRespPromise;
    if (quizzesResp) {
      const data = await quizzesResp.json().catch(() => null);
      console.log('GET /quizzes response:', JSON.stringify(data));
    }

    // 14. Expand ALL week sections (they may be collapsed)
    await page.waitForTimeout(500);
    // Click every collapsed week header to expand
    const weekHeaders = page.locator('button').filter({ hasText: /Week \d+|General/ });
    const headerCount = await weekHeaders.count();
    console.log('Week headers found:', headerCount);
    for (let i = 0; i < headerCount; i++) {
      await weekHeaders.nth(i).click().catch(() => {});
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(300);

    // 15. Take a screenshot to see current state
    await page.screenshot({ path: 'tests/quiz-week-result.png', fullPage: true });
    console.log('✓ screenshot saved');

    // 16. Find our quiz on the page (try both exact and partial match)
    const quizOnPage = page.locator(`text="${quizTitle}"`).first();
    const quizOnPage2 = page.getByText(quizTitle, { exact: false }).first();
    const isVisible = await quizOnPage2.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log('Quiz visible:', isVisible);

    if (!isVisible) {
      // Print all text on the page for debugging
      const bodyText = await page.locator('body').textContent();
      console.log('Page contains quiz title?', bodyText?.includes(quizTitle));
      console.log('Page text sample:', bodyText?.slice(0, 500));
    }

    await expect(quizOnPage2).toBeVisible({ timeout: 5_000 });
    console.log('✓ quiz found on page');

    // 17. Verify the quiz is NOT in General — use page text structure
    const bodyText = await page.locator('body').textContent() || '';
    // Find index of "General" section and our quiz title
    const generalIdx = bodyText.indexOf('General');
    const quizIdx    = bodyText.indexOf(quizTitle);
    // Find index of first "Week " after General
    const weekAfterGeneral = bodyText.indexOf('Week ', generalIdx + 1);
    console.log(`Positions — General:${generalIdx}, first Week after General:${weekAfterGeneral}, quiz:${quizIdx}`);
    // The quiz should appear AFTER the first "Week " heading, not before it (i.e. not in General)
    expect(quizIdx).toBeGreaterThan(weekAfterGeneral);
    console.log('✓ PASS: quiz is in a Week section, NOT in General');
  });

  test('debug: verify URL param and API call', async ({ page }) => {
    // Simpler focused test — just checks that scheduled_at flows from URL to API

    await login(page, TUTOR_EMAIL, TUTOR_PASSWORD);

    // Navigate directly to quiz creation with a known scheduled_at
    await page.goto('/tutor/courses');
    await page.waitForLoadState('networkidle');

    const firstCourse = page.locator('a[href*="/tutor/courses/"]').first();
    await expect(firstCourse).toBeVisible({ timeout: 10_000 });
    const href = await firstCourse.getAttribute('href');
    const courseId = href?.split('/').at(-1);
    console.log('Course ID:', courseId);

    // Navigate directly with scheduled_at param
    const testDate = '2026-06-09';
    await page.goto(`/tutor/courses/${courseId}/quizzes/new?scheduled_at=${testDate}`);
    await page.waitForLoadState('networkidle');

    // Check the URL param is present
    expect(page.url()).toContain(`scheduled_at=${testDate}`);
    console.log('✓ URL has scheduled_at:', testDate);

    // Fill quiz
    await page.locator('input[placeholder*="title"], input[placeholder*="Quiz"]').fill('Debug Quiz');
    await page.locator('button', { hasText: 'Multiple choice' }).first().click();
    await page.waitForTimeout(200);

    // Intercept API call
    const [request] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/quizzes') && req.method() === 'POST', { timeout: 10_000 }),
      page.locator('button', { hasText: /Save.*add|Save.*course/i }).first().click(),
    ]);

    const body = request.postDataJSON();
    console.log('Request scheduled_at:', body.scheduled_at);

    expect(body.scheduled_at).toBe(`${testDate}T00:00:00Z`);
    console.log('✓ PASS: scheduled_at correctly sent in API request');

    // Check the API response
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/quizzes') && resp.method() === 'POST', { timeout: 10_000 }),
      page.waitForURL(url => url.pathname.includes('/tutor/courses/') && !url.pathname.includes('/quizzes'), { timeout: 10_000 }),
    ]).catch(() => [null]);

    if (response) {
      const respData = await response.json().catch(() => null);
      console.log('Response scheduled_at:', respData?.scheduled_at);
      if (respData?.scheduled_at) {
        console.log('✓ PASS: backend returns scheduled_at');
      } else {
        console.log('✗ FAIL: backend did NOT return scheduled_at — check migration!');
      }
    }
  });

});
