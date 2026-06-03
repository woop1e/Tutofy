/**
 * Direct API test — bypasses the UI entirely.
 * Tests whether scheduled_at is saved and returned by the backend.
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:8080';
const TUTOR_EMAIL    = process.env.TUTOR_EMAIL    || 'dabdukhamitova@gmail.com';
const TUTOR_PASSWORD = process.env.TUTOR_PASSWORD || '12345678';

let token  = '';
let courseId = '';

test.describe('Quiz API – scheduled_at backend check', () => {

  test.beforeAll(async ({ request }) => {
    // Login
    const res = await request.post(`${BASE}/auth/login`, {
      data: { email: TUTOR_EMAIL, password: TUTOR_PASSWORD },
    });
    expect(res.ok(), `Login failed: ${await res.text()}`).toBeTruthy();
    const body = await res.json();
    token = body.token;
    console.log('✓ token obtained');

    // Get first enrolled/owned course
    const coursesRes = await request.get(`${BASE}/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const coursesBody = await coursesRes.json();
    const courses = coursesBody.courses || coursesBody;
    console.log('Courses count:', Array.isArray(courses) ? courses.length : Object.keys(coursesBody));
    if (Array.isArray(courses) && courses.length > 0) {
      courseId = courses[0].id;
    }
    console.log('Course ID:', courseId);
  });

  test('POST /quizzes with scheduled_at → response must contain scheduled_at', async ({ request }) => {
    if (!courseId) {
      console.log('⚠ No course found – skipping. Create a course first.');
      test.skip();
    }

    const scheduledAt = '2026-06-09T00:00:00Z';

    // Create quiz with scheduled_at
    const createRes = await request.post(`${BASE}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        course_id: courseId,
        title: `Playwright test quiz ${Date.now()}`,
        time_limit_minutes: 30,
        max_attempts: 1,
        scheduled_at: scheduledAt,
      },
    });

    const createBody = await createRes.json();
    console.log('Create response status:', createRes.status());
    console.log('Create response body:', JSON.stringify(createBody));

    expect(createRes.status()).toBe(201);

    const quizId = createBody.id || createBody.quiz?.id;
    console.log('Quiz ID:', quizId);

    // ASSERT: response has scheduled_at
    const returnedScheduledAt = createBody.scheduled_at || createBody.quiz?.scheduled_at;
    console.log('scheduled_at in response:', returnedScheduledAt);

    if (!returnedScheduledAt) {
      console.log('✗ FAIL: backend did not return scheduled_at in create response');
      console.log('  This means either:');
      console.log('  1. gRPC did not transmit the scheduled_at field');
      console.log('  2. DB migration did not add the column');
      console.log('  3. parseDeadline still fails');
    } else {
      console.log('✓ PASS: backend returned scheduled_at:', returnedScheduledAt);
    }

    expect(returnedScheduledAt).toBeTruthy();
    expect(returnedScheduledAt).toContain('2026-06-09');

    // Also verify via GET /courses/:id/quizzes
    const listRes = await request.get(`${BASE}/courses/${courseId}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listBody = await listRes.json();
    const quizzes = listBody.quizzes || listBody;
    console.log('GET /courses/:id/quizzes count:', Array.isArray(quizzes) ? quizzes.length : '?');

    const ourQuiz = Array.isArray(quizzes)
      ? quizzes.find((q: any) => q.id === quizId)
      : null;
    console.log('Our quiz in list:', JSON.stringify(ourQuiz));

    if (ourQuiz) {
      console.log('scheduled_at from GET:', ourQuiz.scheduled_at);
      expect(ourQuiz.scheduled_at).toContain('2026-06-09');
      console.log('✓ PASS: GET also returns scheduled_at correctly');
    }
  });

  test('DB migration check – column exists', async ({ request }) => {
    // Create quiz WITHOUT scheduled_at and one WITH – compare responses
    if (!courseId) { test.skip(); }

    const withoutRes = await request.post(`${BASE}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { course_id: courseId, title: 'No scheduled_at quiz' },
    });
    const without = await withoutRes.json();
    console.log('Without scheduled_at → response:', JSON.stringify(without));

    const withRes = await request.post(`${BASE}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { course_id: courseId, title: 'With scheduled_at quiz', scheduled_at: '2026-06-16T00:00:00Z' },
    });
    const withBody = await withRes.json();
    console.log('With scheduled_at → response:', JSON.stringify(withBody));

    // Key difference: with scheduled_at should have it in response, without should not
    expect(without.scheduled_at || '').toBe('');
    expect(withBody.scheduled_at || '').toContain('2026-06-16');
  });

});
