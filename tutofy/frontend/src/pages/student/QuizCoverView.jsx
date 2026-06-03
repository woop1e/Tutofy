import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { lessonsAPI } from '../../api/lessons';
import { coursesAPI } from '../../api/courses';
import { quizzesAPI } from '../../api/quizzes';

function parseDate(val) {
  if (!val) return null;
  const s = String(val).replace(' ', 'T');
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(val) {
  const d = parseDate(val);
  if (!d) return null;
  return d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const CheckIcon = () => (
  <svg viewBox="0 0 10 10" fill="none" className="w-[10px] h-[10px]">
    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 10 10" fill="none" className="w-[10px] h-[10px]">
    <rect x="2" y="5" width="6" height="4" rx="0.8" stroke="#b0b5c4" strokeWidth="0.9"/>
    <path d="M3.5 5V3.5a1.5 1.5 0 013 0V5" stroke="#b0b5c4" strokeWidth="0.9"/>
  </svg>
);

const QuizCoverView = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const { id: courseId, quizId } = useParams();

  const [course,       setCourse]       = useState(null);
  const [lessons,      setLessons]      = useState([]);
  const [quizzes,      setQuizzes]      = useState([]);
  const [quiz,          setQuiz]          = useState(null);
  const [questions,     setQuestions]     = useState([]);
  const [attemptsUsed,  setAttemptsUsed]  = useState(0);
  const [attemptResults, setAttemptResults] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (!courseId || !quizId) return;
    setLoading(true);
    Promise.all([
      coursesAPI.getCourseById(courseId).catch(() => null),
      lessonsAPI.getCourseLessons(courseId).catch(() => ({})),
      quizzesAPI.getCourseQuizzes(courseId).catch(() => ({})),
      quizzesAPI.getQuizForAttempt(quizId).catch(() => null),
      quizzesAPI.getMyAttemptResults(quizId).catch(() => ({})),
    ]).then(([courseRes, lessonsRes, quizzesRes, quizRes, attRes]) => {
      setCourse(courseRes?.course || courseRes);
      const rawL = lessonsRes?.lessons || lessonsRes || [];
      setLessons(Array.isArray(rawL) ? rawL : []);
      const rawQ = quizzesRes?.quizzes || quizzesRes || [];
      setQuizzes(Array.isArray(rawQ) ? rawQ : []);
      setQuiz(quizRes?.quiz || quizRes);
      setQuestions(quizRes?.questions || []);
      setAttemptsUsed(attRes?.attempts_used ?? 0);
      setAttemptResults(attRes?.results || []);
    }).finally(() => setLoading(false));
  }, [courseId, quizId]);

  // General items (no date or sentinel year ≤ 2000) first, then weekly items by date
  const itemSortDate = (item) => {
    const d = parseDate(item.scheduled_at);
    if (!d || d.getFullYear() <= 2000) return new Date(0); // General → front
    return d;
  };
  const allItems = useMemo(() => {
    const items = [
      ...lessons.map(l => ({ ...l, _type: 'lesson' })),
      ...quizzes.map(q => ({ ...q, _type: 'quiz' })),
    ];
    return items.sort((a, b) => itemSortDate(a) - itemSortDate(b));
  }, [lessons, quizzes]);

  const itemUrl = (item) => item?._type === 'quiz'
    ? `/student/courses/${courseId}/quizzes/${item.id}`
    : `/student/courses/${courseId}/lessons/${item.id}`;

  const currentIndex = useMemo(() => allItems.findIndex(i => i.id === quizId), [allItems, quizId]);
  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  const maxAttempts    = quiz?.max_attempts ?? 0;
  const deadline       = quiz?.deadline ? new Date(quiz.deadline) : null;
  const deadlinePassed = deadline && new Date() > deadline;
  const noAttemptsLeft = maxAttempts > 0 && attemptsUsed >= maxAttempts;
  const canStart       = !deadlinePassed && !noAttemptsLeft;

  // Auto-scroll sidebar to current item
  const sidebarRef = useRef(null);
  const activeItemRef = useRef(null);
  useEffect(() => {
    if (activeItemRef.current && sidebarRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [quizId, allItems.length]);

  const handleStartQuiz = () => {
    window.open(`/student/courses/${courseId}/quizzes/${quizId}/attempt`, '_blank');
  };

  if (loading) return (
    <div className="flex min-h-screen bg-[#f3f4f7]">
      <StudentSidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#935bf5] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-6 justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/student/courses" className="text-[#6b6f7d] text-[13px] hover:text-[#0c0d12] transition-colors flex-shrink-0 flex items-center gap-1">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M10 13L5 8l5-5"/></svg>
              My Courses
            </Link>
            <div className="w-px h-4 bg-[#e8eaef]" />
            <p className="text-[#0c0d12] text-[14px] font-semibold truncate">{course?.title || 'Course'}</p>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar — same as LessonView */}
          <div className="w-[256px] flex-shrink-0 bg-white border-r border-[#f0f0f5] flex flex-col overflow-hidden">
            <div className="px-4 py-4 border-b border-[#f0f0f5] flex-shrink-0">
              <p className="text-[#0c0d12] text-[13px] font-bold leading-snug line-clamp-2">{course?.title || 'Course'}</p>
            </div>
            <div ref={sidebarRef} className="flex-1 overflow-y-auto py-2">
              {allItems.map((item, idx) => {
                const isQuizItem = item._type === 'quiz';
                const isCurrent  = item.id === quizId;
                return (
                  <Link
                    key={item.id}
                    ref={isCurrent ? activeItemRef : null}
                    to={itemUrl(item)}
                    className={`flex items-start gap-3 px-4 py-3 border-r-2 transition-colors ${
                      isCurrent ? 'bg-[rgba(147,91,245,0.07)] border-[#935bf5]' : 'border-transparent hover:bg-[#f8f9fc]'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{
                      backgroundColor: isQuizItem ? 'transparent' : 'transparent',
                      border: isQuizItem ? '2px solid #935bf5' : '2px solid #d0d3de',
                    }}>
                      {isQuizItem ? (
                        <svg viewBox="0 0 10 10" fill="none" className="w-[10px] h-[10px]">
                          <path d="M3.5 3.5a1.5 1.5 0 013 0c0 1-1.5 1-1.5 2" stroke="#935bf5" strokeWidth="1" strokeLinecap="round"/>
                          <circle cx="5" cy="7" r="0.5" fill="#935bf5"/>
                        </svg>
                      ) : <LockIcon />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[12px] font-medium leading-snug ${
                        isCurrent ? 'text-[#935bf5]' : isQuizItem ? 'text-[#935bf5]/70' : 'text-[#6b6f7d]'
                      }`}>
                        {idx + 1}. {item.title}
                      </p>
                      <p className="text-[11px] text-[#b0b5c4] mt-0.5">{isQuizItem ? 'Quiz' : 'Lesson'}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Center — quiz cover */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">

              {/* Cover card */}
              <div className="bg-white rounded-[20px] border border-[#f0f0f5] p-10 text-center">
                <div className="w-20 h-20 rounded-[20px] bg-[rgba(147,91,245,0.1)] flex items-center justify-center mx-auto mb-5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#935bf5" strokeWidth="1.5" className="w-10 h-10">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M9.5 9a2.5 2.5 0 115 0c0 2-2.5 2.5-2.5 4" strokeLinecap="round"/>
                    <circle cx="12" cy="17" r="0.5" fill="#935bf5"/>
                  </svg>
                </div>

                <h1 className="text-[#0c0d12] text-[24px] font-bold mb-2">{quiz?.title || 'Quiz'}</h1>
                <p className="text-[#6b6f7d] text-[14px] mb-6">
                  {questions.length} question{questions.length !== 1 ? 's' : ''}
                </p>

                {/* Badges */}
                {(quiz?.time_limit_minutes > 0 || maxAttempts > 0 || deadline) && (
                  <div className="flex flex-wrap justify-center gap-2 mb-7">
                    {quiz?.time_limit_minutes > 0 && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(13,148,136,0.08)] text-[#0d9488] text-[12px] font-medium border border-[#0d9488]/20">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                          <circle cx="8" cy="8" r="6"/><path d="M8 5v3.5l2 1.5" strokeLinecap="round"/>
                        </svg>
                        {quiz.time_limit_minutes} min limit
                      </span>
                    )}
                    {maxAttempts > 0 ? (
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border ${
                        noAttemptsLeft ? 'bg-[rgba(242,69,69,0.08)] text-[#f24545] border-[#f24545]/25' : 'bg-[#f5f6fa] text-[#383a44] border-[#e8eaef]'
                      }`}>
                        {attemptsUsed} / {maxAttempts} attempts used
                      </span>
                    ) : attemptsUsed > 0 ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f6fa] text-[#383a44] text-[12px] font-medium border border-[#e8eaef]">
                        {attemptsUsed} attempt{attemptsUsed !== 1 ? 's' : ''} taken · unlimited
                      </span>
                    ) : null}
                    {deadline && (
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border ${
                        deadlinePassed ? 'bg-[rgba(242,69,69,0.08)] text-[#f24545] border-[#f24545]/25' : 'bg-[#f5f6fa] text-[#383a44] border-[#e8eaef]'
                      }`}>
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                          <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 1v3M11 1v3M2 7h12" strokeLinecap="round"/>
                        </svg>
                        {deadlinePassed ? 'Deadline passed' : `Due ${formatDate(quiz.deadline)}`}
                      </span>
                    )}
                  </div>
                )}

                {/* Previous results */}
                {attemptResults.length > 0 && (() => {
                  const best = attemptResults.reduce((a, b) => (b.percentage > a.percentage ? b : a));
                  const latest = attemptResults[0];
                  const pct = Math.round(best.percentage ?? 0);
                  const passed = pct >= 70;
                  return (
                    <div className={`mb-6 rounded-[14px] border px-5 py-4 ${
                      passed ? 'bg-[rgba(34,190,112,0.06)] border-[#22be70]/25' : 'bg-[rgba(147,91,245,0.06)] border-[#935bf5]/25'
                    }`}>
                      <p className="text-[#6b6f7d] text-[11px] font-medium uppercase tracking-wider mb-2">
                        {attemptResults.length > 1 ? 'Best result' : 'Your result'}
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <p className={`text-[36px] font-bold leading-none ${passed ? 'text-[#22be70]' : 'text-[#935bf5]'}`}>
                            {pct}%
                          </p>
                          <p className="text-[#6b6f7d] text-[12px] mt-1">
                            {best.score ?? 0} / {best.total ?? 0} correct
                          </p>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          passed ? 'bg-[rgba(34,190,112,0.12)]' : 'bg-[rgba(147,91,245,0.1)]'
                        }`}>
                          {passed ? (
                            <svg viewBox="0 0 20 20" fill="none" stroke="#22be70" strokeWidth="2" className="w-6 h-6">
                              <path d="M16 5L8 13l-4-4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 20 20" fill="none" stroke="#935bf5" strokeWidth="2" className="w-6 h-6">
                              <path d="M10 6v4M10 13v.5" strokeLinecap="round"/>
                              <circle cx="10" cy="10" r="8"/>
                            </svg>
                          )}
                        </div>
                      </div>
                      {attemptResults.length > 1 && (
                        <p className="text-[#6b6f7d] text-[11px] mt-2 text-center">
                          {attemptResults.length} attempt{attemptResults.length !== 1 ? 's' : ''} total
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Block messages */}
                {deadlinePassed && (
                  <div className="mb-5 px-4 py-3 bg-[rgba(242,69,69,0.08)] border border-[#f24545]/25 rounded-[10px] text-[#f24545] text-[13px]">
                    This quiz deadline has passed.
                  </div>
                )}
                {!deadlinePassed && noAttemptsLeft && (
                  <div className="mb-5 px-4 py-3 bg-[rgba(242,69,69,0.08)] border border-[#f24545]/25 rounded-[10px] text-[#f24545] text-[13px]">
                    No attempts remaining.
                  </div>
                )}

                {canStart && (
                  <p className="text-[#6b6f7d] text-[12px] mb-4">
                    The quiz will open in a new tab. Closing the tab will auto-submit your answers.
                  </p>
                )}

                <button
                  onClick={handleStartQuiz}
                  disabled={!canStart}
                  className="bg-[#935bf5] text-white text-[15px] font-semibold px-8 py-3.5 rounded-[12px] hover:bg-[#7c42e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 mx-auto"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                    <polygon points="4,2 13,8 4,14" fill="white" stroke="none"/>
                  </svg>
                  {canStart ? 'Start Quiz' : 'Quiz Unavailable'}
                </button>
              </div>

              {/* Prev / Next */}
              <div className="flex items-center justify-between gap-3">
                {prevItem ? (
                  <Link to={itemUrl(prevItem)}
                    className="flex items-center gap-2 bg-white border border-[#e8eaef] text-[#383a44] text-[13px] font-semibold px-4 py-2.5 rounded-[10px] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M10 13L5 8l5-5"/></svg>
                    Previous
                  </Link>
                ) : <div />}
                {nextItem ? (
                  <Link to={itemUrl(nextItem)}
                    className="flex items-center gap-2 bg-[#0d9488] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[10px] hover:bg-[#0f766e] transition-colors">
                    {nextItem._type === 'quiz' ? 'Next: Quiz' : 'Next Lesson'}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M6 3l5 5-5 5"/></svg>
                  </Link>
                ) : <div />}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCoverView;
