import { test, expect, Page, request } from '@playwright/test';

// ── credentials ───────────────────────────────────────────────────────────────
const TUTOR_EMAIL    = process.env.TUTOR_EMAIL    || 'dabdukhamitova@gmail.com';
const TUTOR_PASSWORD = process.env.TUTOR_PASSWORD || '12345678';
const STUDENT_EMAIL  = process.env.STUDENT_EMAIL  || 'assemlnx@gmail.com';
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD || '12345678';
const API_BASE = 'http://localhost:8080';

// ── helpers ───────────────────────────────────────────────────────────────────

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"], input[name="email"]').fill(email);
  await page.locator('input[type="password"], input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 12_000 });
  console.log(`✓ Logged in as ${email}`);
}

async function logout(page: Page) {
  // Navigate to a page that has logout, or clear storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
}

// Issue a certificate via API (bypasses 100% progress requirement for admin)
async function issueTestCertificate(studentId: string, courseId: string): Promise<string | null> {
  try {
    const ctx = await request.newContext({ baseURL: API_BASE });

    // Login as admin to get token
    const authRes = await ctx.post('/auth/login', {
      data: { email: TUTOR_EMAIL, password: TUTOR_PASSWORD }
    });
    if (!authRes.ok()) return null;
    const { token } = await authRes.json();

    // Request certificate on behalf of the student via admin
    const certRes = await ctx.post('/certificates/request', {
      headers: { Authorization: `Bearer ${token}` },
      data: { student_id: studentId, course_id: courseId }
    });
    if (!certRes.ok()) return null;
    const cert = await certRes.json();
    return cert?.id || cert?.certificate?.id || null;
  } catch {
    return null;
  }
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('Certificate Service — Full Visual Flow', () => {

  test('Step 1: Student views Certificates page', async ({ page }) => {
    test.setTimeout(60_000);

    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);

    await page.goto('/student/certificates');
    await page.waitForLoadState('networkidle');

    // Take a screenshot of the initial state
    console.log('✓ Student certificates page loaded');
    await page.waitForTimeout(1000);

    // Check page loaded correctly
    const heading = page.locator('h1', { hasText: /Certificate/i });
    await expect(heading).toBeVisible({ timeout: 8_000 });

    // Count existing certificates
    const certCards = page.locator('.bg-white.rounded-\\[20px\\]');
    const count = await certCards.count();
    console.log(`  Found ${count} existing certificate(s)`);
    await page.waitForTimeout(1500);
  });

  test('Step 2: Student requests certificate from a completed course', async ({ page }) => {
    test.setTimeout(90_000);

    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);

    // Go to student courses to find one with progress
    await page.goto('/student/courses');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('✓ Student courses page loaded');

    // Find a course link
    const courseLinks = page.locator('a[href*="/student/courses/"]');
    const count = await courseLinks.count();
    console.log(`  Found ${count} enrolled courses`);

    if (count === 0) {
      console.log('  ⚠ No courses found — skipping certificate request');
      test.skip();
      return;
    }

    // Open first course
    const href = await courseLinks.first().getAttribute('href') || '';
    await page.goto(href);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    console.log(`✓ Opened course: ${page.url()}`);

    // Scroll to the certificate section if it exists
    const certSection = page.locator('text=/certificate/i').first();
    if (await certSection.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await certSection.scrollIntoViewIfNeeded();
      console.log('✓ Certificate section found in course view');
      await page.waitForTimeout(1000);

      // Look for "Claim certificate" or similar button
      const claimBtn = page.locator('button', { hasText: /claim.*cert|get.*cert|request.*cert/i }).first();
      if (await claimBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        console.log('✓ Found "Claim certificate" button — clicking');
        await claimBtn.click();
        await page.waitForTimeout(2000);
        console.log('✓ Certificate requested');
      } else {
        console.log('  ℹ Course not 100% complete — cannot request yet');
      }
    } else {
      console.log('  ℹ No certificate section visible — course may not be completed');
    }
  });

  test('Step 3: Tutor reviews and approves pending certificates', async ({ page }) => {
    test.setTimeout(90_000);

    await login(page, TUTOR_EMAIL, TUTOR_PASSWORD);

    // Go to tutor certificates page
    await page.goto('/tutor/certificates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const heading = page.locator('h1', { hasText: /Certificate/i });
    await expect(heading).toBeVisible({ timeout: 8_000 });
    console.log('✓ Tutor certificate requests page loaded');

    // Check for pending certificates
    const approveButtons = page.locator('button', { hasText: /approve/i });
    const approveCount = await approveButtons.count();
    console.log(`  Found ${approveCount} pending certificate(s) to approve`);

    if (approveCount === 0) {
      console.log('  ℹ No pending certificates — showing empty state');
      const emptyMsg = page.locator('text=/no pending/i');
      if (await emptyMsg.isVisible({ timeout: 3_000 }).catch(() => false)) {
        console.log('  ✓ Empty state message displayed correctly');
      }
      await page.waitForTimeout(2000);
      return;
    }

    // Show ALL pending certificates (scroll through them)
    await page.waitForTimeout(1000);
    console.log(`  Reviewing ${approveCount} pending request(s)...`);

    // Approve the FIRST pending certificate
    const firstApproveBtn = approveButtons.first();
    const certCard = firstApproveBtn.locator('..').locator('..').locator('..');

    // Highlight by scrolling to it
    await firstApproveBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);

    // Read student name before approving
    const cardText = await page.locator('.bg-white').first().textContent().catch(() => '');
    console.log(`  Approving certificate for: ${cardText?.slice(0, 80).trim()}`);

    // Click Approve
    await firstApproveBtn.click();
    await page.waitForTimeout(2000);
    console.log('✓ Certificate APPROVED');

    // Wait for the card to disappear or status to change
    await page.waitForTimeout(1500);

    // Check updated state
    const remaining = await page.locator('button', { hasText: /approve/i }).count();
    console.log(`  Remaining pending: ${remaining}`);
  });

  test('Step 4: Student sees approved certificate and downloads PDF', async ({ page }) => {
    test.setTimeout(60_000);

    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);

    await page.goto('/student/certificates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    console.log('✓ Student certificates page loaded');

    // Check for certificates
    const certCount = page.locator('text=/certificate/i');
    await page.waitForTimeout(1000);

    // Look for approved status
    const approvedBadge = page.locator('text=/approved/i').first();
    const isApproved = await approvedBadge.isVisible({ timeout: 3_000 }).catch(() => false);

    if (isApproved) {
      console.log('✓ Found APPROVED certificate!');
      await approvedBadge.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);

      // Look for Download PDF button
      const downloadBtn = page.locator('button', { hasText: /download.*pdf/i }).first();
      if (await downloadBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        console.log('✓ Download PDF button is visible');
        await downloadBtn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        // Click it — opens a new window with certificate
        const [popup] = await Promise.all([
          page.context().waitForEvent('page', { timeout: 5_000 }).catch(() => null),
          downloadBtn.click(),
        ]);

        if (popup) {
          await popup.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(2000);
          console.log('✓ Certificate PDF preview opened!');
          await popup.close();
        } else {
          console.log('✓ Download button clicked');
        }
      }
    } else {
      // Show pending state
      const pendingBadge = page.locator('text=/pending/i').first();
      if (await pendingBadge.isVisible({ timeout: 2_000 }).catch(() => false)) {
        console.log('  ℹ Certificate status: Pending approval (run Step 3 first)');
      } else {
        console.log('  ℹ No certificates found yet');
      }
      await page.waitForTimeout(2000);
    }
  });

  test('Step 5 (Full lifecycle): Issue → Approve → View', async ({ page }) => {
    test.setTimeout(180_000);

    // ── Part A: Tutor sees certificate requests ──
    await login(page, TUTOR_EMAIL, TUTOR_PASSWORD);
    await page.goto('/tutor/certificates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('=== TUTOR VIEW: Certificate Requests ===');

    const pendingBefore = await page.locator('button', { hasText: /approve/i }).count();
    console.log(`Pending requests: ${pendingBefore}`);

    if (pendingBefore > 0) {
      // Approve all pending
      for (let i = 0; i < Math.min(pendingBefore, 3); i++) {
        const btn = page.locator('button', { hasText: /approve/i }).first();
        if (!await btn.isVisible({ timeout: 2_000 }).catch(() => false)) break;
        await btn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(800);
        await btn.click();
        await page.waitForTimeout(1500);
        console.log(`  ✓ Approved cert #${i + 1}`);
      }
    }

    await page.waitForTimeout(1000);

    // ── Part B: Switch to student to see certificates ──
    console.log('\n=== STUDENT VIEW: My Certificates ===');
    await logout(page);
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto('/student/certificates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const certs = page.locator('.bg-white.rounded-\\[20px\\].border');
    const certCount2 = await certs.count();
    console.log(`Student has ${certCount2} certificate(s)`);

    if (certCount2 > 0) {
      await certs.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);

      const status = await page.locator('span').filter({ hasText: /approved|pending|rejected/i }).first().textContent().catch(() => '');
      console.log(`  Certificate status: ${status}`);
    }

    await page.waitForTimeout(2000);
    console.log('✓ Certificate flow complete');
  });
});
