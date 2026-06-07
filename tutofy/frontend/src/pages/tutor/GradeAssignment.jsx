import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { gradingAPI } from '../../api/grading';
import TopBarActions from '../../components/ui/TopBarActions';

const GradeAssignment = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ grade: '', feedback: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || role !== 'tutor') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (!id) return;
    gradingAPI.getAssignmentGrades(id)
      .then((data) => setGrades(data?.grades || []))
      .catch(() => setGrades([]))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const gradeVal = parseInt(form.grade, 10);
    if (isNaN(gradeVal) || gradeVal < 0 || gradeVal > 100) {
      setError('Grade must be a number between 0 and 100');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await gradingAPI.submitGrade({
        assignment_id: id,
        grade: gradeVal,
        feedback: form.feedback.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit grade. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f4f7] font-sans">
      <TutorSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white h-[68px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)] flex items-center px-7 justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/tutor/grading')}
              className="text-muted text-[13px] hover:text-body transition-colors"
            >
              ← Back to Grading
            </button>
            <div className="w-px h-5 bg-border" />
            <div>
              <p className="text-dark text-[17px] font-bold">Grade Assignment</p>
              <p className="text-muted text-[12px]">Assignment #{id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TopBarActions />
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-[12px] font-semibold">
                {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'T'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-[600px] mx-auto">
            {submitted ? (
              <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><circle cx="10" cy="10" r="8"/><path d="M6 10l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="text-dark text-[20px] font-bold mb-2">Grade Submitted!</p>
                <p className="text-muted text-[14px] mb-6">The student will be notified of their grade.</p>
                <button
                  onClick={() => navigate('/tutor/grading')}
                  className="bg-primary text-white text-[14px] font-semibold px-8 py-3 rounded-[10px] shadow-[0px_4px_12px_0px_rgba(76,110,255,0.3)] hover:opacity-90 transition-opacity"
                >
                  Back to Grading
                </button>
              </div>
            ) : (
              <>
                {/* Submission info */}
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : grades.length > 0 && (
                  <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] p-5 mb-5">
                    <h2 className="text-dark text-[15px] font-semibold mb-4">Existing Grades</h2>
                    <div className="space-y-3">
                      {grades.map((g, i) => (
                        <div key={g.id || i} className="flex items-center justify-between p-3 bg-[#f3f4f7] rounded-[10px]">
                          <div>
                            <p className="text-dark text-[13px] font-medium">{g.student_name || `Student ${i + 1}`}</p>
                            {g.feedback && <p className="text-muted text-[12px] mt-0.5">{g.feedback}</p>}
                          </div>
                          <span className="text-dark text-[16px] font-bold">{g.grade}/100</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grade Form */}
                <form onSubmit={handleSubmit}>
                  <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] p-6">
                    <h2 className="text-dark text-[15px] font-semibold mb-5">Submit Grade</h2>

                    {error && (
                      <div className="bg-[#f24545]/10 border border-[#f24545]/30 text-[#f24545] rounded-[10px] px-4 py-3 text-[13px] mb-5">
                        {error}
                      </div>
                    )}

                    <div className="space-y-5">
                      <div>
                        <label className="block text-body text-[13px] font-medium mb-2">
                          Grade (0–100) <span className="text-[#f24545]">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={form.grade}
                          onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))}
                          placeholder="e.g. 85"
                          className="w-full bg-[#f3f4f7] border border-light-muted rounded-[10px] px-4 py-3 text-[14px] text-body placeholder-muted outline-none focus:border-primary focus:bg-white transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-body text-[13px] font-medium mb-2">Feedback (optional)</label>
                        <textarea
                          value={form.feedback}
                          onChange={(e) => setForm((p) => ({ ...p, feedback: e.target.value }))}
                          placeholder="Provide constructive feedback to the student..."
                          rows={5}
                          className="w-full bg-[#f3f4f7] border border-light-muted rounded-[10px] px-4 py-3 text-[14px] text-body placeholder-muted outline-none focus:border-primary focus:bg-white transition-colors resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => navigate('/tutor/grading')}
                        className="px-6 py-3 rounded-[10px] border border-light-muted text-body text-[14px] font-medium hover:bg-surface transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !form.grade}
                        className="bg-primary text-white text-[14px] font-semibold px-8 py-3 rounded-[10px] shadow-[0px_4px_12px_0px_rgba(76,110,255,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Grade'}
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeAssignment;
