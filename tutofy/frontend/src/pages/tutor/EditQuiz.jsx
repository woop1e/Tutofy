import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { quizzesAPI } from '../../api/quizzes';

const inputCls = 'w-full border border-[#e2e4ea] rounded-[9px] px-3 py-2.5 text-[14px] text-[#0c0d12] placeholder-[#b0b5c4] focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[rgba(13,148,136,0.08)] transition-all bg-white';

const TrashIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = ({ checked }) => (
  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
    checked ? 'bg-[#0d9488] border-[#0d9488]' : 'border-[#d2d4d9] bg-white'
  }`}>
    {checked && (
      <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
        <path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )}
  </div>
);

const EditQuiz = () => {
  const { id: courseId, quizId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // id of item being saved
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || role !== 'tutor') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    quizzesAPI.getQuizForAttempt(quizId)
      .then(data => {
        setQuiz(data);
        setQuestions((data.questions || []).map(q => ({
          ...q,
          _editText: q.text,
          options: (q.options || []).map(o => ({ ...o, _editText: o.text, _editCorrect: o.is_correct })),
        })));
      })
      .catch(() => setError('Failed to load quiz'))
      .finally(() => setLoading(false));
  }, [quizId]);

  // ── Question actions ──────────────────────────────────────────────────────

  const saveQuestion = useCallback(async (q) => {
    if (!q._editText?.trim()) return;
    setSaving(q.id);
    try {
      await quizzesAPI.updateQuestion(q.id, { text: q._editText.trim(), position: q.position });
      setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, text: x._editText } : x));
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save question');
    } finally {
      setSaving(null);
    }
  }, []);

  const deleteQuestion = useCallback(async (questionId) => {
    setSaving(questionId);
    try {
      await quizzesAPI.deleteQuestion(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete question');
    } finally {
      setSaving(null);
    }
  }, []);

  const addQuestion = useCallback(async () => {
    const text = 'New question';
    const position = questions.length + 1;
    setSaving('new-q');
    try {
      const res = await quizzesAPI.addQuestion(quizId, { text, position });
      const newQ = { id: res.id, quiz_id: quizId, text, position, options: [], _editText: text };
      setQuestions(prev => [...prev, newQ]);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to add question');
    } finally {
      setSaving(null);
    }
  }, [quizId, questions.length]);

  // ── Option actions ────────────────────────────────────────────────────────

  const saveOption = useCallback(async (questionId, opt) => {
    if (!opt._editText?.trim()) return;
    setSaving(opt.id);
    try {
      await quizzesAPI.updateOption(opt.id, { text: opt._editText.trim(), is_correct: opt._editCorrect });
      setQuestions(prev => prev.map(q => q.id === questionId
        ? { ...q, options: q.options.map(o => o.id === opt.id ? { ...o, text: o._editText, is_correct: o._editCorrect } : o) }
        : q
      ));
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save option');
    } finally {
      setSaving(null);
    }
  }, []);

  const deleteOption = useCallback(async (questionId, optionId) => {
    setSaving(optionId);
    try {
      await quizzesAPI.deleteOption(optionId);
      setQuestions(prev => prev.map(q => q.id === questionId
        ? { ...q, options: q.options.filter(o => o.id !== optionId) }
        : q
      ));
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete option');
    } finally {
      setSaving(null);
    }
  }, []);

  const addOption = useCallback(async (questionId) => {
    setSaving('new-opt-' + questionId);
    try {
      const res = await quizzesAPI.addOption(questionId, { text: 'New option', is_correct: false });
      const newOpt = { id: res.id, question_id: questionId, text: 'New option', is_correct: false, _editText: 'New option', _editCorrect: false };
      setQuestions(prev => prev.map(q => q.id === questionId
        ? { ...q, options: [...q.options, newOpt] }
        : q
      ));
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to add option');
    } finally {
      setSaving(null);
    }
  }, []);

  const setCorrect = useCallback((questionId, optionId) => {
    setQuestions(prev => prev.map(q => q.id === questionId
      ? { ...q, options: q.options.map(o => ({ ...o, _editCorrect: o.id === optionId })) }
      : q
    ));
  }, []);

  if (loading) return (
    <div className="flex min-h-screen bg-[#f5f6fa]">
      <TutorSidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

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
          <h1 className="text-[#0c0d12] text-[16px] font-bold truncate">{quiz?.title || 'Edit Quiz'}</h1>
          <Link to={`/tutor/courses/${courseId}/quizzes/${quizId}/results`}
            className="ml-auto flex items-center gap-1.5 text-[13px] font-semibold text-[#935bf5] px-3 py-1.5 rounded-[8px] hover:bg-[rgba(147,91,245,0.08)] transition-colors">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M3 12V5M7 12V2M11 12V7M15 12V9" strokeLinecap="round"/>
            </svg>
            View results
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[760px] mx-auto space-y-4">

            {error && (
              <div className="bg-[#f24545]/10 border border-[#f24545]/25 text-[#f24545] rounded-[10px] px-4 py-3 text-[13px]">
                {error}
                <button onClick={() => setError('')} className="ml-3 underline">Dismiss</button>
              </div>
            )}

            {questions.length === 0 && !loading && (
              <div className="bg-white rounded-[16px] border border-[#ebebf0] p-10 text-center text-[#6b6f7d] text-[14px]">
                No questions yet.
              </div>
            )}

            {questions.map((q, qi) => (
              <div key={q.id} className="bg-white rounded-[16px] border border-[#ebebf0] overflow-hidden">
                {/* Question header */}
                <div className="flex items-start gap-3 p-5 border-b border-[#f0f0f5]">
                  <span className="w-7 h-7 rounded-full bg-[#0d9488] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {qi + 1}
                  </span>
                  <textarea
                    className={inputCls + ' resize-none min-h-[60px]'}
                    value={q._editText}
                    onChange={e => setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, _editText: e.target.value } : x))}
                    placeholder="Question text..."
                    rows={2}
                  />
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => saveQuestion(q)}
                      disabled={saving === q.id || q._editText === q.text}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-[7px] bg-[#0d9488] text-white hover:opacity-90 transition-opacity disabled:opacity-40">
                      {saving === q.id ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      disabled={saving === q.id}
                      className="p-1.5 text-[#6b6f7d] hover:text-[#f24545] hover:bg-[rgba(242,69,69,0.06)] rounded-[7px] transition-colors disabled:opacity-40">
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="p-4 space-y-2">
                  {q.options.map(o => (
                    <div key={o.id} className="flex items-center gap-2.5">
                      <button onClick={() => setCorrect(q.id, o.id)} title="Mark as correct">
                        <CheckIcon checked={o._editCorrect} />
                      </button>
                      <input
                        className={inputCls + ' flex-1'}
                        value={o._editText}
                        onChange={e => setQuestions(prev => prev.map(x => x.id === q.id
                          ? { ...x, options: x.options.map(op => op.id === o.id ? { ...op, _editText: e.target.value } : op) }
                          : x
                        ))}
                        placeholder="Option text..."
                      />
                      <button
                        onClick={() => saveOption(q.id, o)}
                        disabled={saving === o.id || (o._editText === o.text && o._editCorrect === o.is_correct)}
                        className="text-[11px] font-semibold px-2.5 py-1.5 rounded-[7px] bg-[rgba(13,148,136,0.08)] text-[#0d9488] hover:bg-[rgba(13,148,136,0.15)] transition-colors disabled:opacity-40 flex-shrink-0">
                        {saving === o.id ? '...' : 'Save'}
                      </button>
                      <button
                        onClick={() => deleteOption(q.id, o.id)}
                        disabled={saving === o.id}
                        className="p-1.5 text-[#6b6f7d] hover:text-[#f24545] hover:bg-[rgba(242,69,69,0.06)] rounded-[7px] transition-colors disabled:opacity-40 flex-shrink-0">
                        <TrashIcon />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => addOption(q.id)}
                    disabled={saving?.toString().startsWith('new-opt-' + q.id)}
                    className="flex items-center gap-1.5 text-[#0d9488] text-[12px] font-semibold px-3 py-1.5 rounded-[7px] hover:bg-[rgba(13,148,136,0.07)] transition-colors mt-1 disabled:opacity-40">
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                      <path d="M7 2v10M2 7h10" strokeLinecap="round"/>
                    </svg>
                    Add option
                  </button>
                </div>
              </div>
            ))}

            {/* Add question */}
            <button
              onClick={addQuestion}
              disabled={saving === 'new-q'}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] border-2 border-dashed border-[#0d9488]/40 text-[#0d9488] text-[13px] font-semibold hover:border-[#0d9488] hover:bg-[rgba(13,148,136,0.03)] transition-all disabled:opacity-50">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                <path d="M7 2v10M2 7h10" strokeLinecap="round"/>
              </svg>
              {saving === 'new-q' ? 'Adding...' : 'Add question'}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EditQuiz;
