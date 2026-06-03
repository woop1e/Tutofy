import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { quizzesAPI } from '../../api/quizzes';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function scoreColor(pct) {
  if (pct >= 80) return '#22c55e';
  if (pct >= 60) return '#f59e0b';
  return '#f24545';
}

const QuizResults = () => {
  const { id: courseId, quizId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState({ key: 'completed_at', dir: 'desc' });

  useEffect(() => {
    if (!isAuthenticated || role !== 'tutor') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    Promise.all([
      quizzesAPI.getQuizForAttempt(quizId).catch(() => null),
      quizzesAPI.getQuizAttempts(quizId).catch(() => []),
    ]).then(([q, a]) => {
      setQuiz(q);
      setAttempts(Array.isArray(a) ? a : []);
    }).catch(() => setError('Failed to load results'))
      .finally(() => setLoading(false));
  }, [quizId]);

  const sorted = [...attempts].sort((a, b) => {
    const { key, dir } = sort;
    const va = key === 'percentage' ? (a.percentage ?? 0)
             : key === 'score'      ? (a.score ?? 0)
             : (a[key] ?? '');
    const vb = key === 'percentage' ? (b.percentage ?? 0)
             : key === 'score'      ? (b.score ?? 0)
             : (b[key] ?? '');
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return dir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (key) => {
    setSort(prev => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'desc' }
    );
  };

  const SortArrow = ({ k }) => {
    if (sort.key !== k) return <span className="text-[#c4c8d4]">↕</span>;
    return <span className="text-[#0d9488]">{sort.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  const avgPct = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length)
    : 0;
  const passCount = attempts.filter(a => (a.percentage || 0) >= 70).length;

  return (
    <div className="flex min-h-screen bg-[#f5f6fa] font-sans">
      <TutorSidebar />
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <div className="bg-white border-b border-[#ebebf0] h-[60px] flex items-center px-6 gap-4 flex-shrink-0">
          <Link to={`/tutor/courses/${courseId}`}
            className="flex items-center gap-1.5 text-[#6b6f7d] text-[13px] hover:text-[#0c0d12] transition-colors">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
              <path d="M10 13L5 8l5-5" strokeLinecap="round"/>
            </svg>
            Back
          </Link>
          <div className="w-px h-5 bg-[#e8eaef]" />
          <div>
            <h1 className="text-[#0c0d12] text-[16px] font-bold leading-tight truncate">
              {quiz?.title || 'Quiz Results'}
            </h1>
            <p className="text-[#6b6f7d] text-[11px]">Student submissions</p>
          </div>
          <Link to={`/tutor/courses/${courseId}/quizzes/${quizId}/edit`}
            className="ml-auto flex items-center gap-1.5 text-[13px] font-semibold text-[#0d9488] px-3 py-1.5 rounded-[8px] hover:bg-[rgba(13,148,136,0.08)] transition-colors">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M11 2l3 3-8 8H3v-3l8-8z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit quiz
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[900px] mx-auto space-y-5">

            {error && (
              <div className="bg-[#f24545]/10 border border-[#f24545]/25 text-[#f24545] rounded-[10px] px-4 py-3 text-[13px]">
                {error}
              </div>
            )}

            {/* Stats row */}
            {!loading && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total submissions', value: attempts.length, color: '#0d9488' },
                  { label: 'Average score',     value: `${avgPct}%`,    color: scoreColor(avgPct) },
                  { label: 'Passed (≥70%)',     value: `${passCount} / ${attempts.length}`, color: '#935bf5' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-[14px] border border-[#f0f0f5] p-5 flex items-center gap-4">
                    <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <div>
                      <p className="text-[#0c0d12] text-[22px] font-bold leading-none">{s.value}</p>
                      <p className="text-[#6b6f7d] text-[11px] mt-1">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-[16px] border border-[#ebebf0] overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-7 h-7 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : attempts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-7 h-7">
                      <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="text-[#6b6f7d] text-[14px] font-medium">No submissions yet</p>
                  <p className="text-[#b0b5c4] text-[12px] mt-1">Students haven't taken this quiz yet.</p>
                </div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#f0f0f5]">
                      <th className="text-left text-[#6b6f7d] font-semibold px-5 py-3 text-[11px] uppercase tracking-wide">Student</th>
                      <th className="text-center text-[#6b6f7d] font-semibold px-4 py-3 text-[11px] uppercase tracking-wide cursor-pointer select-none hover:text-[#0d9488]"
                          onClick={() => toggleSort('score')}>
                        Score <SortArrow k="score" />
                      </th>
                      <th className="text-center text-[#6b6f7d] font-semibold px-4 py-3 text-[11px] uppercase tracking-wide cursor-pointer select-none hover:text-[#0d9488]"
                          onClick={() => toggleSort('percentage')}>
                        % <SortArrow k="percentage" />
                      </th>
                      <th className="text-right text-[#6b6f7d] font-semibold px-5 py-3 text-[11px] uppercase tracking-wide cursor-pointer select-none hover:text-[#0d9488]"
                          onClick={() => toggleSort('completed_at')}>
                        Submitted <SortArrow k="completed_at" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((a, i) => {
                      const pct = Math.round(a.percentage || 0);
                      const color = scoreColor(pct);
                      return (
                        <tr key={a.attempt_id} className={`border-b border-[#f8f8f9] hover:bg-[#fafbff] transition-colors ${i === sorted.length - 1 ? 'border-b-0' : ''}`}>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-[#0c0d12]">
                              {a.student_name || 'Student'}
                            </p>
                            <p className="text-[#b0b5c4] text-[10px] mt-0.5 font-mono">
                              {a.student_id?.slice(0, 8)}…
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="font-semibold text-[#0c0d12]">{a.score}</span>
                            <span className="text-[#b0b5c4]"> / {a.total}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[12px] font-bold"
                              style={{ backgroundColor: color + '18', color }}>
                              {pct}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right text-[#6b6f7d]">
                            {fmtDate(a.completed_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
