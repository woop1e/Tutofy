﻿﻿import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { quizzesAPI } from '../../api/quizzes';
import TopBarActions from '../../components/ui/TopBarActions';

/* â"€â"€ question type definitions â"€â"€ */
const QUESTION_TYPES = [
  { type: 'multiple_choice', label: 'Multiple choice', sub: 'One correct answer', icon: 'M3 7h14M3 11h10M3 15h7' },
  { type: 'multiple_response', label: 'Multiple response', sub: 'Multiple correct answers', icon: 'M5 7h11M5 11h11M5 15h11' },
  { type: 'true_false', label: 'True / False', sub: 'Select True or False', icon: 'M7 10l3 3 5-5' },
  { type: 'fill_blank', label: 'Fill in the blank', sub: 'Short answer text', icon: 'M3 12h18M6 8l3 4-3 4' },
  { type: 'matching', label: 'Matching', sub: 'Match items', icon: 'M4 7h4M4 12h4M4 17h4M12 7h4M12 12h4M12 17h4M8 7l4 5M8 12l4-5' },
  { type: 'ordering', label: 'Ordering', sub: 'Put items in order', icon: 'M5 7h11M5 11h8M5 15h5' },
  { type: 'short_answer', label: 'Short answer', sub: 'Write a short answer', icon: 'M4 6h16M4 10h10M4 14h7' },
];

/* â"€â"€ helpers â"€â"€ */
const inputCls = 'w-full border border-[#e2e4ea] rounded-[9px] px-3 py-2.5 text-[14px] text-[#0c0d12] placeholder-[#b0b5c4] focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[rgba(13,148,136,0.08)] transition-all bg-white';

const blankOptions = (type) => {
  if (type === 'true_false') return [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }];
  if (type === 'multiple_choice' || type === 'multiple_response')
    return [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }];
  if (type === 'matching') return [{ text: '', match: '' }, { text: '', match: '' }, { text: '', match: '' }];
  if (type === 'ordering') return [{ text: '' }, { text: '' }, { text: '' }];
  return [];
};

const blankQuestion = (type, position) => ({
  _id: Date.now() + Math.random(),
  type,
  text: '',
  points: 10,
  position,
  options: blankOptions(type),
  correctText: '', // for fill_blank / short_answer
});

/* â"€â"€ QuestionEditor â"€â"€ */
const QuestionEditor = ({ q, idx, onChange, onDelete }) => {
  const update = (patch) => onChange({ ...q, ...patch });
  const updateOption = (oi, patch) =>
    update({ options: q.options.map((o, i) => (i === oi ? { ...o, ...patch } : o)) });
  const addOption = () => update({ options: [...q.options, { text: '', isCorrect: false }] });
  const removeOption = (oi) => update({ options: q.options.filter((_, i) => i !== oi) });

  const setCorrect = (oi) => {
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      update({ options: q.options.map((o, i) => ({ ...o, isCorrect: i === oi })) });
    } else {
      updateOption(oi, { isCorrect: !q.options[oi].isCorrect });
    }
  };

  const typeMeta = QUESTION_TYPES.find((t) => t.type === q.type);

  return (
    <div className="border border-[#0d9488]/30 rounded-[12px] bg-[#fafbff] p-5">
      {/* Question header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="w-7 h-7 rounded-full bg-[#0d9488] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">
          {idx + 1}
        </span>
        <span className="text-[11px] font-semibold text-[#0d9488] bg-[#eef0ff] px-2.5 py-1 rounded-full">
          {typeMeta?.label}
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <label className="text-[11px] text-[#6b6f7d]">Points</label>
          <input
            type="number"
            min="1"
            value={q.points}
            onChange={(e) => update({ points: parseInt(e.target.value) || 10 })}
            className="w-16 border border-[#e2e4ea] rounded-[7px] px-2 py-1 text-[13px] text-[#0c0d12] focus:outline-none focus:border-[#0d9488] text-center"
          />
          <button
            onClick={onDelete}
            className="ml-2 text-[#6b6f7d] hover:text-[#f24545] transition-colors"
            title="Delete question"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-4 h-4">
              <path d="M3 5h10M6 5V3h4v2M6 8v5M10 8v5M4 5l1 8h6l1-8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Question text */}
      <textarea
        rows={2}
        value={q.text}
        onChange={(e) => update({ text: e.target.value })}
        placeholder="Enter your question here..."
        className={inputCls + ' resize-none mb-4'}
      />

      {/* Options by type */}
      {(q.type === 'multiple_choice' || q.type === 'multiple_response') && (
        <div className="space-y-2">
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrect(oi)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${opt.isCorrect ? 'border-[#22be70] bg-[#22be70]' : 'border-[#d2d4d9] hover:border-[#0d9488]'
                  }`}
              >
                {opt.isCorrect && (
                  <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8" className="w-3 h-3">
                    <path d="M2 5l2.5 2.5L8 3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <input
                value={opt.text}
                onChange={(e) => updateOption(oi, { text: e.target.value })}
                placeholder={`Option ${oi + 1}`}
                className="flex-1 border border-[#e2e4ea] rounded-[8px] px-3 py-2 text-[13px] text-[#0c0d12] placeholder-[#b0b5c4] focus:outline-none focus:border-[#0d9488] bg-white"
              />
              {q.options.length > 2 && (
                <button onClick={() => removeOption(oi)} className="text-[#c4c8d4] hover:text-[#f24545] transition-colors flex-shrink-0">
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                    <path d="M2 2l8 8M10 2L2 10" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addOption}
            className="flex items-center gap-1.5 text-[#0d9488] text-[12px] font-medium mt-1 hover:opacity-80"
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3 h-3">
              <path d="M6 2v8M2 6h8" strokeLinecap="round" />
            </svg>
            Add option
          </button>
        </div>
      )}

      {q.type === 'true_false' && (
        <div className="flex items-center gap-3">
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              type="button"
              onClick={() => setCorrect(oi)}
              className={`flex-1 py-2.5 rounded-[9px] text-[14px] font-semibold border-2 transition-colors ${opt.isCorrect
                ? 'border-[#22be70] bg-[#22be70]/10 text-[#22be70]'
                : 'border-[#e2e4ea] text-[#6b6f7d] hover:border-[#0d9488]'
                }`}
            >
              {opt.text}
            </button>
          ))}
        </div>
      )}

      {(q.type === 'fill_blank' || q.type === 'short_answer') && (
        <div>
          <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1.5">
            {q.type === 'fill_blank' ? 'Correct answer (for auto-grading)' : 'Sample answer / keywords'}
          </label>
          <input
            value={q.correctText}
            onChange={(e) => update({ correctText: e.target.value })}
            placeholder={q.type === 'fill_blank' ? 'Type the correct word or phrase...' : 'Key points expected...'}
            className={inputCls}
          />
        </div>
      )}

      {q.type === 'matching' && (
        <div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <span className="text-[11px] text-[#6b6f7d] font-medium pl-1">Term</span>
            <span className="text-[11px] text-[#6b6f7d] font-medium pl-1">Definition</span>
          </div>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="grid grid-cols-2 gap-2 items-center">
                <input
                  value={opt.text}
                  onChange={(e) => updateOption(oi, { text: e.target.value })}
                  placeholder={`Term ${oi + 1}`}
                  className="border border-[#e2e4ea] rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-[#0d9488] bg-white"
                />
                <div className="flex items-center gap-2">
                  <input
                    value={opt.match || ''}
                    onChange={(e) => updateOption(oi, { match: e.target.value })}
                    placeholder={`Definition ${oi + 1}`}
                    className="flex-1 border border-[#e2e4ea] rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-[#0d9488] bg-white"
                  />
                  {q.options.length > 2 && (
                    <button onClick={() => removeOption(oi)} className="text-[#c4c8d4] hover:text-[#f24545] flex-shrink-0">
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                        <path d="M2 2l8 8M10 2L2 10" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => update({ options: [...q.options, { text: '', match: '' }] })}
            className="flex items-center gap-1.5 text-[#0d9488] text-[12px] font-medium mt-2 hover:opacity-80"
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3 h-3">
              <path d="M6 2v8M2 6h8" strokeLinecap="round" />
            </svg>
            Add pair
          </button>
        </div>
      )}

      {q.type === 'ordering' && (
        <div>
          <p className="text-[11px] text-[#6b6f7d] font-medium mb-2">Items in correct order (top = first)</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#f0f0f5] text-[#6b6f7d] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {oi + 1}
                </span>
                <input
                  value={opt.text}
                  onChange={(e) => updateOption(oi, { text: e.target.value })}
                  placeholder={`Item ${oi + 1}`}
                  className="flex-1 border border-[#e2e4ea] rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-[#0d9488] bg-white"
                />
                {q.options.length > 2 && (
                  <button onClick={() => removeOption(oi)} className="text-[#c4c8d4] hover:text-[#f24545]">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                      <path d="M2 2l8 8M10 2L2 10" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => update({ options: [...q.options, { text: '' }] })}
            className="flex items-center gap-1.5 text-[#0d9488] text-[12px] font-medium mt-2 hover:opacity-80"
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3 h-3">
              <path d="M6 2v8M2 6h8" strokeLinecap="round" />
            </svg>
            Add item
          </button>
        </div>
      )}
    </div>
  );
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const CreateQuiz = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scheduledAt = searchParams.get('scheduled_at') || null;
  const { isAuthenticated, role } = useAuth();

  const [info, setInfo] = useState({
    title: '',
    description: '',
    timeLimitMinutes: 30,
    totalPoints: 100,
    passingScore: 70,
    maxAttempts: 1,
    deadline: '',
  });
  const [questions, setQuestions] = useState([]);
  const [lastType, setLastType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addQuestion = (type) => {
    const q = blankQuestion(type, questions.length + 1);
    setQuestions((prev) => [...prev, q]);
    setLastType(type);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
  };

  const updateQuestion = (idx, updated) =>
    setQuestions((prev) => prev.map((q, i) => (i === idx ? updated : q)));

  const deleteQuestion = (idx) =>
    setQuestions((prev) => prev.filter((_, i) => i !== idx));

  /* â"€â"€ save to backend â"€â"€ */
  const handleSave = async (addToCourse = true) => {
    if (!info.title.trim()) { setError('Quiz title is required'); return; }
    if (questions.length === 0) { setError('Add at least one question'); return; }

    setSaving(true);
    setError('');
    console.log('[CreateQuiz] scheduledAt from URL:', scheduledAt);
    try {
      /* 1. create quiz */
      const payload = {
        course_id: courseId,
        title: info.title.trim(),
        description: info.description.trim(),
        time_limit_minutes: info.timeLimitMinutes,
        passing_score: info.passingScore,
        max_attempts: info.maxAttempts,
        deadline: info.deadline ? new Date(info.deadline).toISOString() : null,
        scheduled_at: scheduledAt ? `${scheduledAt}T00:00:00Z` : null,
      };
      console.log('[CreateQuiz] sending payload:', JSON.stringify(payload));
      const quizRes = await quizzesAPI.createQuiz(payload);
      console.log('[CreateQuiz] response:', JSON.stringify(quizRes));
      const quizId = quizRes?.quiz?.id || quizRes?.id;
      if (!quizId) throw new Error('Quiz creation failed');

      /* 2. add questions + options sequentially */
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qRes = await quizzesAPI.addQuestion(quizId, {
          text: q.text || `Question ${i + 1}`,
          position: i + 1,
        });
        const questionId = qRes?.id || qRes?.question?.id;
        if (!questionId) continue;

        /* 3. add options */
        if (q.type === 'multiple_choice' || q.type === 'multiple_response' || q.type === 'true_false') {
          for (const opt of q.options) {
            if (!opt.text.trim()) continue;
            await quizzesAPI.addOption(questionId, {
              text: opt.text.trim(),
              is_correct: !!opt.isCorrect,
            });
          }
        } else if (q.type === 'fill_blank' || q.type === 'short_answer') {
          if (q.correctText?.trim()) {
            await quizzesAPI.addOption(questionId, {
              text: q.correctText.trim(),
              is_correct: true,
            });
          }
        } else if (q.type === 'matching') {
          for (const opt of q.options) {
            if (!opt.text.trim()) continue;
            await quizzesAPI.addOption(questionId, {
              text: `${opt.text.trim()} ← ${opt.match?.trim() || ''}`,
              is_correct: true,
            });
          }
        } else if (q.type === 'ordering') {
          for (let oi = 0; oi < q.options.length; oi++) {
            const opt = q.options[oi];
            if (!opt.text.trim()) continue;
            await quizzesAPI.addOption(questionId, {
              text: opt.text.trim(),
              is_correct: true, // correct order = position
            });
          }
        }
      }

      navigate(`/tutor/courses/${courseId}`);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const totalPts = questions.reduce((s, q) => s + (q.points || 0), 0);

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  return (
    <div className="flex h-screen bg-[#f5f6fa] font-sans">
      <TutorSidebar />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* â"€â"€ Top bar â"€â"€ */}
        <div className="bg-white border-b border-[#ebebf0] h-[60px] flex items-center px-6 gap-4 flex-shrink-0">
          <Link
            to={`/tutor/courses/${courseId}`}
            className="flex items-center gap-1.5 text-[#6b6f7d] text-[13px] hover:text-[#0c0d12] transition-colors flex-shrink-0"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
              <path d="M10 13L5 8l5-5" strokeLinecap="round" />
            </svg>
            Back
          </Link>
          <div className="w-px h-5 bg-[#e8eaef]" />
          <h1 className="text-[#0c0d12] text-[16px] font-bold">Create Quiz</h1>
          <span className="text-[11px] font-semibold text-[#6b6f7d] bg-[#f0f0f5] px-2.5 py-1 rounded-full">Draft</span>

          <div className="ml-auto flex items-center gap-2">
            <TopBarActions />
            <button className="border border-[#d2d4d9] text-[#383a44] text-[13px] font-semibold px-4 py-2 rounded-[9px] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors">
              Preview quiz
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="border border-[#d2d4d9] text-[#383a44] text-[13px] font-semibold px-4 py-2 rounded-[9px] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="bg-[#0d9488] text-white text-[13px] font-semibold px-4 py-2 rounded-[9px] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Save &amp; add to course
            </button>
          </div>
        </div>

        {/* â"€â"€ Body â"€â"€ */}
        <div className="flex-1 flex gap-0 overflow-hidden">

          {/* â"€â"€ Left: quiz form â"€â"€ */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-[700px] space-y-5">

              {/* Quiz information */}
              <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6">
                <h2 className="text-[#0c0d12] text-[15px] font-bold mb-4">Quiz information</h2>

                <div className="mb-4">
                  <label className="block text-[12px] text-[#6b6f7d] font-medium mb-1.5">Quiz title</label>
                  <input
                    value={info.title}
                    onChange={(e) => setInfo((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Vocabulary Quiz - Unit 1"
                    className={inputCls}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-[12px] text-[#6b6f7d] font-medium mb-1.5">
                    Description <span className="text-[#c4c8d4]">(optional)</span>
                  </label>
                  <textarea
                    value={info.description}
                    onChange={(e) => setInfo((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Add a short description for this quiz..."
                    rows={2}
                    className={inputCls + ' resize-none'}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[12px] text-[#6b6f7d] font-medium mb-1.5">Time limit (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      value={info.timeLimitMinutes}
                      onChange={(e) => setInfo((p) => ({ ...p, timeLimitMinutes: parseInt(e.target.value) || 30 }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#6b6f7d] font-medium mb-1.5">Total points</label>
                    <input
                      type="number"
                      readOnly
                      value={totalPts || info.totalPoints}
                      className={inputCls + ' bg-[#f8f9fb] cursor-default'}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#6b6f7d] font-medium mb-1.5">Passing score (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={info.passingScore}
                      onChange={(e) => setInfo((p) => ({ ...p, passingScore: parseInt(e.target.value) || 70 }))}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] text-[#6b6f7d] font-medium mb-1.5">
                      Max attempts
                      <span className="text-[#c4c8d4] font-normal ml-1">(retakes)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={info.maxAttempts}
                      onChange={(e) => setInfo((p) => ({ ...p, maxAttempts: parseInt(e.target.value) || 1 }))}
                      className={inputCls}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[12px] text-[#6b6f7d] font-medium mb-1.5">
                      Deadline <span className="text-[#c4c8d4] font-normal">(optional)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={info.deadline}
                      onChange={(e) => setInfo((p) => ({ ...p, deadline: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[#0c0d12] text-[15px] font-bold flex items-center gap-2">
                    Questions
                    {questions.length > 0 && (
                      <span className="w-6 h-6 rounded-full bg-[#0d9488] text-white text-[11px] font-bold flex items-center justify-center">
                        {questions.length}
                      </span>
                    )}
                  </h2>
                </div>

                {error && (
                  <div className="bg-[#f24545]/10 border border-[#f24545]/25 text-[#f24545] rounded-[9px] px-4 py-3 text-[13px] mb-4">
                    {error}
                  </div>
                )}

                {questions.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-full bg-[#f0f2ff] flex items-center justify-center mx-auto mb-3">
                      <svg viewBox="0 0 20 20" fill="none" stroke="#0d9488" strokeWidth="1.5" className="w-6 h-6">
                        <path d="M10 4v12M4 10h12" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-[#6b6f7d] text-[13px]">No questions yet. Choose a type from the right panel.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, idx) => (
                      <QuestionEditor
                        key={q._id}
                        q={q}
                        idx={idx}
                        onChange={(updated) => updateQuestion(idx, updated)}
                        onDelete={() => deleteQuestion(idx)}
                      />
                    ))}
                  </div>
                )}

                {questions.length > 0 && (
                  <div className="mt-5 flex items-center gap-3">
                    {/* Smart button: adds same type as last question */}
                    <button
                      onClick={() => addQuestion(lastType)}
                      className="flex items-center gap-2 bg-[#0d9488] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity shadow-[0px_4px_12px_0px_rgba(76,110,255,0.25)]"
                    >
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                        <path d="M7 2v10M2 7h10" strokeLinecap="round" />
                      </svg>
                      Add {QUESTION_TYPES.find(t => t.type === lastType)?.label || 'question'}
                    </button>
                    {/* Secondary: pick a different type */}
                    <div className="relative group">
                      <button className="flex items-center gap-1.5 text-[#6b6f7d] text-[12px] font-medium px-3 py-2.5 rounded-[10px] border border-[#e2e4ea] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors">
                        Different type
                        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                          <path d="M2 4l3 3 3-3" strokeLinecap="round" />
                        </svg>
                      </button>
                      {/* Dropdown on hover */}
                      <div className="absolute bottom-full left-0 mb-1.5 w-[220px] bg-white border border-[#e2e4ea] rounded-[12px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.1)] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1.5">
                        {QUESTION_TYPES.filter(t => t.type !== lastType).map(qt => (
                          <button
                            key={qt.type}
                            onClick={() => addQuestion(qt.type)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#f5f6ff] transition-colors text-left"
                          >
                            <div className="w-7 h-7 rounded-[7px] bg-[#f0f2ff] flex items-center justify-center flex-shrink-0">
                              <svg viewBox="0 0 20 20" fill="none" stroke="#0d9488" strokeWidth="1.4" className="w-3.5 h-3.5">
                                <path d={qt.icon} strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-[#0c0d12] text-[12px] font-semibold">{qt.label}</p>
                              <p className="text-[#6b6f7d] text-[11px]">{qt.sub}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* â"€â"€ Right: question type panel â"€â"€ */}
          <div
            id="qtype-panel"
            className="w-[260px] flex-shrink-0 border-l border-[#ebebf0] bg-white overflow-y-auto"
          >
            <div className="p-5">
              <h3 className="text-[#0c0d12] text-[14px] font-bold mb-4">Add question</h3>
              <div className="space-y-2">
                {QUESTION_TYPES.map((qt) => (
                  <button
                    key={qt.type}
                    onClick={() => addQuestion(qt.type)}
                    className="w-full flex items-center gap-3 p-3 rounded-[10px] border border-[#ebebf0] hover:border-[#0d9488]/40 hover:bg-[#f8f9ff] transition-colors text-left group"
                  >
                    <div className="w-9 h-9 rounded-[8px] bg-[#f0f2ff] flex items-center justify-center flex-shrink-0 group-hover:bg-[#0d9488]/15 transition-colors">
                      <svg viewBox="0 0 20 20" fill="none" stroke="#0d9488" strokeWidth="1.4" className="w-4.5 h-4.5">
                        <path d={qt.icon} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#0c0d12] text-[13px] font-semibold leading-tight">{qt.label}</p>
                      <p className="text-[#6b6f7d] text-[11px] mt-0.5">{qt.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div >
  );
};

export default CreateQuiz;
