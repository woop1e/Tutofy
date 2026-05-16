﻿import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { quizzesAPI } from '../../api/quizzes';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const QuizAttempt = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const { id: courseId, quizId } = useParams();

  const [quiz, setQuiz]             = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // attempt state
  const [attemptId, setAttemptId]   = useState(null);
  const [starting, setStarting]     = useState(false);
  const [answers, setAnswers]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);

  // timer
  const [timeLeft, setTimeLeft]     = useState(null);
  const timerRef                    = useRef(null);
  const submitRef                   = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  // Load quiz metadata + attempts count without starting an attempt
  useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    Promise.all([
      quizzesAPI.getQuizForAttempt(quizId),
      quizzesAPI.getMyAttempts(quizId).catch(() => 0),
    ])
      .then(([res, used]) => {
        setQuiz(res?.quiz || res);
        setQuestions(res?.questions || []);
        setAttemptsUsed(used);
      })
      .catch(() => setError('Failed to load quiz.'))
      .finally(() => setLoading(false));
  }, [quizId]);

  // Keep latest submitQuiz reachable from timer without stale closure
  const submitQuiz = useCallback(async (auto = false) => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const answerList = Object.entries(answers).map(([question_id, option_id]) => ({ question_id, option_id }));
      const res = await quizzesAPI.submitQuizAttempt(attemptId, answerList);
      setResult(res);
      clearInterval(timerRef.current);
    } catch (e) {
      if (!auto) setError(e?.response?.data?.error || 'Submission failed.');
      setSubmitting(false);
    }
  }, [attemptId, submitting, answers]);

  submitRef.current = submitQuiz;

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft !== null && timeLeft > 0 ? 'active' : 'inactive']); // eslint-disable-line

  const startAttempt = async () => {
    if (attemptId || starting) return;
    setStarting(true);
    setError('');
    try {
      const res = await quizzesAPI.startQuizAttempt(quizId);
      const id = res?.attempt_id || res?.attemptId;
      setAttemptId(id);
      const limit = quiz?.time_limit_minutes ?? 0;
      if (limit > 0) setTimeLeft(limit * 60);
    } catch (e) {
      const msg = e?.response?.data?.error || '';
      if (msg.toLowerCase().includes('deadline')) {
        setError('This quiz deadline has passed.');
      } else if (msg.toLowerCase().includes('attempts')) {
        setError('No attempts remaining.');
      } else {
        setError(msg || 'Could not start quiz. Are you enrolled in this course?');
      }
    } finally {
      setStarting(false);
    }
  };

  // â"€â"€ derived â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const maxAttempts   = quiz?.max_attempts ?? 0;
  const deadline      = quiz?.deadline ? new Date(quiz.deadline) : null;
  const deadlinePassed = deadline && new Date() > deadline;
  const noAttemptsLeft = maxAttempts > 0 && attemptsUsed >= maxAttempts;
  const canStart      = !deadlinePassed && !noAttemptsLeft;

  // â"€â"€ Loading â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  if (loading) return (
    <div className="flex min-h-screen bg-[#f3f4f7]">
      <StudentSidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  // â"€â"€ Result screen â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const pct = result ? (result.percentage ?? 0) : 0;

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <StudentSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-6 gap-3 flex-shrink-0">
          <button
            onClick={() => navigate(`/student/courses/${courseId}`)}
            className="text-[#6b6f7d] text-[13px] hover:text-[#0c0d12] transition-colors flex items-center gap-1"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <path d="M10 13L5 8l5-5"/>
            </svg>
            Back to course
          </button>
          <div className="w-px h-4 bg-[#e8eaef]" />
          <p className="text-[#0c0d12] text-[14px] font-semibold truncate">{quiz?.title || 'Quiz'}</p>

          {/* Live timer in topbar during quiz */}
          {attemptId && !result && timeLeft !== null && (
            <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] font-mono text-[13px] font-semibold border ${
              timeLeft <= 60
                ? 'bg-[rgba(242,69,69,0.08)] text-[#f24545] border-[#f24545]/25'
                : 'bg-[#f0f0f5] text-[#0c0d12] border-[#e8eaef]'
            }`}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <circle cx="8" cy="8" r="6"/>
                <path d="M8 5v3.5l2 1.5" strokeLinecap="round"/>
              </svg>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">

          {/* â"€â"€ Result screen â"€â"€ */}
          {result && (
            <div className="bg-white rounded-[20px] border border-[#f0f0f5] p-10 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                pct >= 70 ? 'bg-[rgba(34,190,112,0.12)]' : 'bg-[rgba(242,69,69,0.08)]'
              }`}>
                {pct >= 70 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#22be70" strokeWidth="2" className="w-10 h-10">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#f24545" strokeWidth="2" className="w-10 h-10">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <p className="text-[#0c0d12] text-[28px] font-bold mb-1">{Math.round(pct)}%</p>
              <p className="text-[#6b6f7d] text-[14px] mb-2">
                {result.score ?? 0} / {result.total ?? 0} correct
              </p>
              <p className={`text-[15px] font-semibold mb-6 ${pct >= 70 ? 'text-[#22be70]' : 'text-[#f24545]'}`}>
                {pct >= 70 ? 'Great job!' : 'Keep practicing!'}
              </p>
              <button
                onClick={() => navigate(`/student/courses/${courseId}`)}
                className="bg-[#0d9488] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[10px] hover:bg-[#0f766e] transition-colors"
              >
                Back to Course
              </button>
            </div>
          )}

          {/* â"€â"€ Pre-start screen â"€â"€ */}
          {!result && !attemptId && (
            <div className="bg-white rounded-[20px] border border-[#f0f0f5] p-10 text-center">
              <div className="w-16 h-16 rounded-[16px] bg-[rgba(147,91,245,0.1)] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#935bf5" strokeWidth="1.5" className="w-8 h-8">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="M9.5 9a2.5 2.5 0 115 0c0 2-2.5 2.5-2.5 4" strokeLinecap="round"/>
                  <circle cx="12" cy="17" r="0.5" fill="#935bf5"/>
                </svg>
              </div>
              <h1 className="text-[#0c0d12] text-[22px] font-bold mb-2">{quiz?.title}</h1>
              <p className="text-[#6b6f7d] text-[14px] mb-5">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </p>

              {/* Settings badges */}
              {(quiz?.time_limit_minutes > 0 || maxAttempts > 0 || deadline) && (
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {quiz?.time_limit_minutes > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(13,148,136,0.08)] text-[#0d9488] text-[12px] font-medium border border-[#0d9488]/20">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                        <circle cx="8" cy="8" r="6"/>
                        <path d="M8 5v3.5l2 1.5" strokeLinecap="round"/>
                      </svg>
                      {quiz.time_limit_minutes} min limit
                    </span>
                  )}
                  {maxAttempts > 0 ? (
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border ${
                      noAttemptsLeft
                        ? 'bg-[rgba(242,69,69,0.08)] text-[#f24545] border-[#f24545]/25'
                        : 'bg-[#f5f6fa] text-[#383a44] border-[#e8eaef]'
                    }`}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                        <path d="M3 8c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5" strokeLinecap="round"/>
                        <path d="M3 8H1M3 8l2-2M3 8l2 2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {attemptsUsed} / {maxAttempts} attempts used
                    </span>
                  ) : attemptsUsed > 0 ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f6fa] text-[#383a44] text-[12px] font-medium border border-[#e8eaef]">
                      {attemptsUsed} attempt{attemptsUsed !== 1 ? 's' : ''} taken · unlimited
                    </span>
                  ) : null}
                  {deadline && (
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border ${
                      deadlinePassed
                        ? 'bg-[rgba(242,69,69,0.08)] text-[#f24545] border-[#f24545]/25'
                        : 'bg-[#f5f6fa] text-[#383a44] border-[#e8eaef]'
                    }`}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                        <rect x="2" y="3" width="12" height="11" rx="2"/>
                        <path d="M5 1v3M11 1v3M2 7h12" strokeLinecap="round"/>
                      </svg>
                      {deadlinePassed ? 'Deadline passed' : `Due ${deadline.toLocaleString()}`}
                    </span>
                  )}
                </div>
              )}

              {/* Block messages */}
              {deadlinePassed && (
                <div className="mb-5 px-4 py-3 bg-[rgba(242,69,69,0.08)] border border-[#f24545]/25 rounded-[10px] text-[#f24545] text-[13px]">
                  This quiz deadline has passed. You can no longer start this quiz.
                </div>
              )}
              {!deadlinePassed && noAttemptsLeft && (
                <div className="mb-5 px-4 py-3 bg-[rgba(242,69,69,0.08)] border border-[#f24545]/25 rounded-[10px] text-[#f24545] text-[13px]">
                  No attempts remaining. You have used all {maxAttempts} allowed attempt{maxAttempts !== 1 ? 's' : ''}.
                </div>
              )}

              {error && <p className="text-[#f24545] text-[13px] mb-4">{error}</p>}

              <button
                onClick={startAttempt}
                disabled={!canStart || starting}
                className="bg-[#935bf5] text-white text-[14px] font-semibold px-7 py-3 rounded-[12px] hover:bg-[#7c42e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {starting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {canStart ? 'Start Quiz' : 'Quiz Unavailable'}
              </button>
            </div>
          )}

          {/* â"€â"€ Quiz in progress â"€â"€ */}
          {!result && attemptId && (
            <div className="space-y-4">
              <div className="bg-white rounded-[16px] border border-[#f0f0f5] px-6 py-4 flex items-center justify-between">
                <h1 className="text-[#0c0d12] text-[17px] font-bold">{quiz?.title}</h1>
                <span className="text-[#6b6f7d] text-[13px]">
                  {Object.keys(answers).length} / {questions.length} answered
                </span>
              </div>

              {questions.map((q, qi) => (
                <div key={q.id} className="bg-white rounded-[16px] border border-[#f0f0f5] p-6">
                  <p className="text-[#0c0d12] text-[14px] font-semibold mb-4">
                    <span className="text-[#935bf5] mr-2">{qi + 1}.</span>
                    {q.text}
                  </p>
                  <div className="space-y-2">
                    {(q.options || []).map(opt => {
                      const isSelected = answers[q.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                          className={`w-full text-left px-4 py-3 rounded-[10px] border-2 text-[13px] transition-all ${
                            isSelected
                              ? 'border-[#935bf5] bg-[rgba(147,91,245,0.06)] text-[#935bf5] font-semibold'
                              : 'border-[#e8eaef] text-[#0c0d12] hover:border-[#935bf5]/40 hover:bg-[rgba(147,91,245,0.02)]'
                          }`}
                        >
                          {opt.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {error && <p className="text-[#f24545] text-[13px]">{error}</p>}

              <div className="flex items-center justify-between pt-2 pb-6">
                <p className="text-[#6b6f7d] text-[13px]">
                  {questions.length - Object.keys(answers).length} question{questions.length - Object.keys(answers).length !== 1 ? 's' : ''} remaining
                </p>
                <button
                  onClick={() => submitQuiz(false)}
                  disabled={submitting || Object.keys(answers).length === 0}
                  className="bg-[#935bf5] text-white text-[13px] font-semibold px-6 py-2.5 rounded-[10px] hover:bg-[#7c42e0] disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Submit Quiz
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;
