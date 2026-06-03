/**
 * Validation tests for quiz service.
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:8080';
const TUTOR_EMAIL    = process.env.TUTOR_EMAIL    || 'dabdukhamitova@gmail.com';
const TUTOR_PASSWORD = process.env.TUTOR_PASSWORD || '12345678';

let token    = '';
let courseId = '';

test.describe('Quiz Service – validation checks', () => {

  test.beforeAll(async ({ request }) => {
    const res  = await request.post(`${BASE}/auth/login`, { data: { email: TUTOR_EMAIL, password: TUTOR_PASSWORD } });
    const body = await res.json();
    token    = body.token;
    const cr = await request.get(`${BASE}/courses`, { headers: { Authorization: `Bearer ${token}` } });
    const cb = await cr.json();
    courseId = (cb.courses || cb)[0]?.id;
    console.log('courseId:', courseId);
  });

  // ── CreateQuiz validations ────────────────────────────────────────────────

  test('CreateQuiz: rejects empty title', async ({ request }) => {
    const res = await request.post(`${BASE}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { course_id: courseId, title: '   ' },
    });
    expect(res.status()).not.toBe(201);
    console.log('empty title →', res.status(), await res.text());
  });

  test('CreateQuiz: rejects negative time_limit_minutes', async ({ request }) => {
    const res = await request.post(`${BASE}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { course_id: courseId, title: 'Bad Quiz', time_limit_minutes: -5 },
    });
    expect(res.status()).not.toBe(201);
    console.log('negative time_limit →', res.status(), await res.text());
  });

  test('CreateQuiz: rejects negative max_attempts', async ({ request }) => {
    const res = await request.post(`${BASE}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { course_id: courseId, title: 'Bad Quiz', max_attempts: -1 },
    });
    expect(res.status()).not.toBe(201);
    console.log('negative max_attempts →', res.status(), await res.text());
  });

  test('CreateQuiz: 0 time_limit_minutes is allowed (means no limit)', async ({ request }) => {
    const res = await request.post(`${BASE}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { course_id: courseId, title: 'No time limit quiz', time_limit_minutes: 0, max_attempts: 0 },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    console.log('✓ 0 time_limit and max_attempts accepted');
  });

  // ── AddQuestion validations ───────────────────────────────────────────────

  test('AddQuestion: rejects question for non-existent quiz', async ({ request }) => {
    const res = await request.post(`${BASE}/quizzes/non-existent-id/questions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { text: 'What is 2+2?' },
    });
    expect(res.status()).toBe(404);
    console.log('✓ non-existent quiz →', res.status());
  });

  test('AddQuestion: rejects empty text', async ({ request }) => {
    // Create a quiz first
    const qr = await request.post(`${BASE}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { course_id: courseId, title: 'Validation test quiz' },
    });
    const q = await qr.json();
    const quizId = q.id;

    const res = await request.post(`${BASE}/quizzes/${quizId}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { text: '  ' },
    });
    expect(res.status()).not.toBe(201);
    console.log('✓ empty question text →', res.status());
  });

  // ── AddOption validations ─────────────────────────────────────────────────

  test('AddOption: rejects option for non-existent question', async ({ request }) => {
    const res = await request.post(`${BASE}/questions/non-existent-id/options`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { text: 'Some option', is_correct: false },
    });
    expect(res.status()).toBe(404);
    console.log('✓ non-existent question →', res.status());
  });

  // ── UpdateQuizSettings validations ───────────────────────────────────────

  test('UpdateQuizSettings: rejects negative time_limit', async ({ request }) => {
    const qr = await request.post(`${BASE}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { course_id: courseId, title: 'Settings test quiz' },
    });
    const q = await qr.json();

    const res = await request.put(`${BASE}/quizzes/${q.id}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { time_limit_minutes: -10, max_attempts: 1 },
    });
    expect(res.status()).not.toBe(200);
    console.log('✓ negative time_limit in settings →', res.status());
  });

  // ── Full happy-path validation ────────────────────────────────────────────

  test('full valid quiz creation flow works end-to-end', async ({ request }) => {
    // 1. Create quiz
    const qr = await request.post(`${BASE}/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { course_id: courseId, title: 'Full flow quiz', time_limit_minutes: 30, max_attempts: 2 },
    });
    expect(qr.status()).toBe(201);
    const quiz = await qr.json();
    console.log('✓ quiz created:', quiz.id);

    // 2. Add question
    const qq = await request.post(`${BASE}/quizzes/${quiz.id}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { text: 'What is the capital of France?', position: 1 },
    });
    expect(qq.status()).toBe(201);
    const question = await qq.json();
    console.log('✓ question created:', question.id);

    // 3. Add correct option
    const oRight = await request.post(`${BASE}/questions/${question.id}/options`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { text: 'Paris', is_correct: true },
    });
    expect(oRight.status()).toBe(201);
    const rightOption = await oRight.json();
    console.log('✓ correct option:', rightOption.id);

    // 4. Add wrong option
    const oWrong = await request.post(`${BASE}/questions/${question.id}/options`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { text: 'London', is_correct: false },
    });
    expect(oWrong.status()).toBe(201);
    console.log('✓ wrong option added');

    // 5. Verify quiz has question in GET
    const listQ = await request.get(`${BASE}/quizzes/${quiz.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listQ.status()).toBe(200);
    const detail = await listQ.json();
    console.log('✓ quiz detail has', detail.questions?.length, 'questions');
    expect(detail.questions?.length).toBe(1);
    expect(detail.questions[0].options?.length).toBe(2);
    console.log('✓ PASS: full flow completed successfully');
  });

});
