import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { coursesAPI } from '../../api/courses';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

const INP = 'w-full bg-[#f3f4f7] border border-light-muted rounded-[10px] px-4 py-3 text-[14px] text-body placeholder-muted outline-none focus:border-primary focus:bg-white transition-colors';
const LBL = 'block text-body text-[13px] font-medium mb-2';

const CreateCourse = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    subject: '',
    level: 'beginner',
    status: 'draft',
    max_students: '5',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Course title is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const created = await coursesAPI.createCourse({
        ...form,
        price: form.price ? parseFloat(form.price) : 0,
        max_students: form.max_students ? parseInt(form.max_students) : 5,
        tutor_id: user?.user_id,
      });
      const newId = created?.id || created?.course_id || created?.Id;
      if (newId && form.status === 'published') {
        await coursesAPI.publishCourse(newId).catch(() => {});
      }
      if (newId) {
        navigate(`/tutor/courses/${newId}/edit`);
      } else {
        navigate('/tutor/courses');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <TutorSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white h-[68px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)] flex items-center px-7 justify-between flex-shrink-0">
          <div>
            <p className="text-dark text-[20px] font-bold">Create Group Course</p>
            <p className="text-muted text-[13px]">Set up a weekly course for a small group of students</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-muted text-[13px] font-medium px-4 py-2 rounded-[8px] hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-[12px] font-semibold">
                {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'T'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-[680px] mx-auto">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-[#f24545]/10 border border-[#f24545]/30 text-[#f24545] rounded-[12px] px-5 py-4 text-[13px] mb-5">
                  {error}
                </div>
              )}

              <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] p-6 mb-5">
                <h2 className="text-dark text-[15px] font-semibold mb-5">Course details</h2>
                <div className="space-y-5">
                  <div>
                    <label className={LBL}>
                      Course title <span className="text-[#f24545]">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. Advanced Python Programming"
                      className={INP}
                      required
                    />
                  </div>

                  <div>
                    <label className={LBL}>Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe what students will learn, how sessions are structured..."
                      rows={4}
                      className={INP + ' resize-none'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LBL}>Subject</label>
                      <input
                        type="text"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        placeholder="e.g. Math, Python, English"
                        className={INP}
                      />
                    </div>
                    <div>
                      <label className={LBL}>Total course price ($)</label>
                      <input
                        type="number"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        placeholder="0 for free"
                        min="0"
                        step="0.01"
                        className={INP}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={LBL}>Max students</label>
                      <input
                        type="number"
                        name="max_students"
                        value={form.max_students}
                        onChange={handleChange}
                        placeholder="5"
                        min="2"
                        max="20"
                        className={INP}
                      />
                    </div>
                    <div>
                      <label className={LBL}>Level</label>
                      <select name="level" value={form.level} onChange={handleChange} className={INP}>
                        {LEVELS.map((l) => (
                          <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={LBL}>Status</label>
                      <select name="status" value={form.status} onChange={handleChange} className={INP}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 rounded-[10px] border border-light-muted text-body text-[14px] font-medium hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-white text-[14px] font-semibold px-8 py-3 rounded-[10px] shadow-[0px_4px_12px_0px_rgba(76,110,255,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;
