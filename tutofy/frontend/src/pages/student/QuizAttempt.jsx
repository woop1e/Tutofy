import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { quizzesAPI } from '../../api/quizzes';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const QuizAttempt = () => {
  const { isAuthenticated } = useAuth();
  const { id: courseId, quizId } = useParams();

  const [quiz,         setQuiz]         = useState(null);
  const [questions,    setQuestions]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const [attemptId,    setAttemptId]    = useState(null);
  const [answers,      setAnswers]      = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [result,       setResult]       = useState(null);

  const [timeLeft,     setTimeLeft]     = useState(null);
  const timerRef   = useRef(null);
  const submitRef  = useRef(null);
  const answersRef = useRef({});
  const attemptIdRef = useRef(null);
  const resultRef  = useRef(null);

  // keep refs in sync for use in event handlers that can't access state
  answersRef.current   = answers;
  attemptIdRef.current = attemptId;
  resultRef.current    = result;

  // Auto-submit when tab is closed via fetch + keepalive
  useEffect(() => {
    const handleUnload = () => {
      if (!attemptIdRef.current || resultRef.current) return;
      const token = localStorage.getItem('token');
      const answerList = Object.entries(answersRef.current).map(
        ([question_id, option_id]) => ({ question_id, option_id })
      );
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      fetch(`${base}/quizzes/attempts/${attemptIdRef.current}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ answers: answerList }),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener('pagehide', handleUnload);
    return () => window.removeEventListener('pagehide', handleUnload);
  }, []);

  // Load quiz and auto-start
  useEffect(() => {
    if (!quizId || !isAuthenticated) return;
    setLoading(true);
    Promise.all([
      quizzesAPI.getQuizForAttempt(quizId),
      quizzesAPI.getMyAttempts(quizId).catch(() => 0),
    ])
      .then(([res, used]) => {
        const q = res?.quiz || res;
        setQuiz(q);
        setQuestions(res?.questions || []);

        const maxAttempts    = q?.max_attempts ?? 0;
        const deadline       = q?.deadline ? new Date(q.deadline) : null;
        const deadlinePassed = deadline && new Date() > deadline;
        const noAttemptsLeft = maxAttempts > 0 && used >= maxAttempts;

        if (deadlinePassed) { setError('This quiz deadline has passed.'); return; }
        if (noAttemptsLeft) { setError('No attempts remaining.'); return; }

        // Auto-start attempt
        quizzesAPI.startQuizAttempt(quizId)
          .then(r => {
            const id = r?.attempt_id || r?.attemptId;
            setAttemptId(id);
            const limit = q?.time_limit_minutes ?? 0;
            if (limit > 0) setTimeLeft(limit * 60);
          })
          .catch(e => {
            const msg = e?.response?.data?.error || '';
            if (msg.toLowerCase().includes('deadline')) setError('This quiz deadline has passed.');
            else if (msg.toLowerCase().includes('attempts')) setError('No attempts remaining.');
            else setError(msg || 'Could not start quiz. Are you enrolled in this course?');
          });
      })
      .catch(() => setError('Failed to load quiz.'))
      .finally(() => setLoading(false));
  }, [quizId, isAuthenticated]);

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

  const pct = result ? (result.percentage ?? 0) : 0;

  if (loading) return (
    <div className="min-h-screen bg-[#f3f4f7] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#935bf5] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error && !attemptId) return (
    <div className="min-h-screen bg-[#f3f4f7] flex items-center justify-center p-6">
      <div className="bg-white rounded-[20px] border border-[#f0f0f5] p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 rounded-full bg-[rgba(242,69,69,0.08)] flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="#f24545" strokeWidth="2" className="w-8 h-8">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-[#0c0d12] text-[17px] font-bold mb-2">Quiz unavailable</p>
        <p className="text-[#6b6f7d] text-[13px]">{error}</p>
        <button onClick={() => window.close()} className="mt-5 text-[#6b6f7d] text-[13px] hover:text-[#0c0d12] transition-colors">
          Close tab
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f4f7] font-sans">
      {/* Top bar */}
      <div className="bg-white border-b border-[#f0f0f5] h-[56px] flex items-center px-6 gap-3 sticky top-0 z-10">
        <div className="w-8 h-8 rounded-[8px] bg-[rgba(147,91,245,0.1)] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 16 16" fill="none" stroke="#935bf5" strokeWidth="1.5" className="w-4 h-4">
            <path d="M8 14A6 6 0 108 2a6 6 0 000 12z"/>
            <path d="M6 6.5a2 2 0 114 0c0 1.5-2 1.5-2 2.5" strokeLinecap="round"/>
            <circle cx="8" cy="11.5" r="0.5" fill="#935bf5"/>
          </svg>
        </div>
        <p className="text-[#0c0d12] text-[14px] font-semibold flex-1 truncate">{quiz?.title || 'Quiz'}</p>

        {attemptId && !result && timeLeft !== null && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] font-mono text-[13px] font-semibold border ${
            timeLeft <= 60
              ? 'bg-[rgba(242,69,69,0.08)] text-[#f24545] border-[#f24545]/25'
              : 'bg-[#f0f0f5] text-[#0c0d12] border-[#e8eaef]'
          }`}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <circle cx="8" cy="8" r="6"/><path d="M8 5v3.5l2 1.5" strokeLinecap="round"/>
            </svg>
            {formatTime(timeLeft)}
          </div>
        )}
        {attemptId && !result && (
          <span className="text-[#6b6f7d] text-[12px]">
            {Object.keys(answers).length} / {questions.length} answered
          </span>
        )}
      </div>

      <div className="p-6 max-w-3xl mx-auto w-full">

        {/* Result screen */}
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
            <p className="text-[#0c0d12] text-[32px] font-bold mb-1">{Math.round(pct)}%</p>
            <p className="text-[#6b6f7d] text-[14px] mb-2">{result.score ?? 0} / {result.total ?? 0} correct</p>
            <p className={`text-[15px] font-semibold mb-6 ${pct >= 70 ? 'text-[#22be70]' : 'text-[#f24545]'}`}>
              {pct >= 70 ? 'Great job!' : 'Keep practicing!'}
            </p>
            <button onClick={() => window.close()}
              className="bg-[#0d9488] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[10px] hover:bg-[#0f766e] transition-colors">
              Close Tab
            </button>
          </div>
        )}

        {/* Starting spinner */}
        {!result && !attemptId && !error && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#935bf5] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Questions */}
        {!result && attemptId && (
          <div className="space-y-4">
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
  );
};

export default QuizAttempt;
