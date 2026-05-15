import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { coursesAPI } from '../../api/courses';
import { enrollmentsAPI } from '../../api/enrollments';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'object' && val.seconds != null) return new Date(Number(val.seconds) * 1000);
  const d = new Date(String(val).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(val) {
  const d = parseDate(val);
  if (!d) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── shared field styles ───────────────────────────────────────────────────────

const INP = 'w-full bg-[#f8f9fc] border border-[#e8eaef] rounded-[9px] px-3.5 py-2.5 text-[13px] text-[#181b26] placeholder-[#b0b3bb] outline-none focus:border-[#4c6eff] focus:bg-white transition-colors';
const LBL = 'block text-[#4c5162] text-[12px] font-medium mb-1.5';

const Field = ({ label, children }) => (
  <div><label className={LBL}>{label}</label>{children}</div>
);

// ── component ─────────────────────────────────────────────────────────────────

const EditCourse = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate   = useNavigate();
  const { id: courseId } = useParams();

  const [activeTab, setActiveTab] = useState('info');
  const [loading,   setLoading]   = useState(true);

  // course info form
  const [form,     setForm]     = useState({
    title: '', description: '', subject: '', level: 'beginner',
    price: '', max_students: '5', status: 'draft',
  });
  const [saving,    setSaving]   = useState(false);
  const [saveError, setSaveError]= useState('');
  const [saveOk,    setSaveOk]   = useState(false);

  // students tab
  const [enrollments,    setEnrollments]    = useState([]);
  const [enrollLoading,  setEnrollLoading]  = useState(false);

  useEffect(() => {
    if (!isAuthenticated || role !== 'tutor') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  // Load course info
  useEffect(() => {
    if (!courseId) return;
    coursesAPI.getCourseById(courseId)
      .then(res => {
        const c = res?.course || res;
        if (c) {
          setForm({
            title:        c.title        || '',
            description:  c.description  || '',
            subject:      c.subject      || '',
            level:        c.level        || 'beginner',
            price:        c.price != null ? String(c.price) : '',
            max_students: c.max_students != null ? String(c.max_students) : '5',
            status:       c.is_published ? 'published' : 'draft',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  // Lazy-load students when tab opens
  useEffect(() => {
    if (activeTab !== 'students' || enrollments.length > 0) return;
    setEnrollLoading(true);
    enrollmentsAPI.getCourseEnrollments(courseId)
      .then(res => {
        const es = Array.isArray(res) ? res : res?.enrollments || [];
        setEnrollments(es);
      })
      .catch(() => setEnrollments([]))
      .finally(() => setEnrollLoading(false));
  }, [activeTab, courseId, enrollments.length]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setSaveError('Title is required'); return; }
    setSaving(true); setSaveError(''); setSaveOk(false);
    try {
      await coursesAPI.updateCourse(courseId, {
        ...form,
        price:        form.price        ? parseFloat(form.price)     : 0,
        max_students: form.max_students ? parseInt(form.max_students): 5,
      });
      if (form.status === 'published') await coursesAPI.publishCourse(courseId);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-[#f3f4f7]">
      <TutorSidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#4c6eff] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const tabs = [
    { key: 'info',     label: 'Course info' },
    { key: 'students', label: `Students (${enrollments.length})` },
  ];

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <TutorSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/tutor/courses/${courseId}`}
              className="text-[#8a90a1] text-[13px] hover:text-[#181b26] transition-colors flex items-center gap-1 flex-shrink-0">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M10 13L5 8l5-5"/>
              </svg>
              Back to course
            </Link>
            <div className="w-px h-4 bg-[#e8eaef]" />
            <p className="text-[#181b26] text-[14px] font-semibold truncate">{form.title || 'Edit Course'}</p>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
              form.status === 'published'
                ? 'bg-[rgba(34,190,112,0.12)] text-[#22be70]'
                : 'bg-[#f0f0f5] text-[#8a90a1]'
            }`}>{form.status}</span>
          </div>
          {activeTab === 'info' && (
            <button onClick={handleSave} disabled={saving}
              className="bg-[#4c6eff] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5">
              {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-[#f0f0f5] px-6 flex gap-0 flex-shrink-0">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-3.5 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-[#4c6eff] text-[#4c6eff]'
                  : 'border-transparent text-[#8a90a1] hover:text-[#181b26]'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ═══ COURSE INFO ═══════════════════════════════════════════════════ */}
          {activeTab === 'info' && (
            <div className="max-w-[600px] mx-auto p-6 space-y-4">

              {saveError && (
                <div className="bg-[#fee2e2] text-[#f24545] rounded-[10px] px-4 py-3 text-[13px]">{saveError}</div>
              )}
              {saveOk && (
                <div className="bg-[#edfbf4] text-[#22be70] rounded-[10px] px-4 py-3 text-[13px] flex items-center gap-2">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
                    <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Changes saved
                </div>
              )}

              {/* Basic info */}
              <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-5 space-y-4">
                <p className="text-[#181b26] text-[13px] font-semibold">Basic information</p>

                <Field label={<>Course title <span className="text-[#f24545]">*</span></>}>
                  <input className={INP} placeholder="Enter course title" value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </Field>

                <Field label="Description">
                  <textarea className={INP + ' resize-none'} rows={3} placeholder="What will students learn?"
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Subject">
                    <input className={INP} placeholder="e.g. English, Math, Python" value={form.subject}
                      onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
                  </Field>
                  <Field label="Level">
                    <select className={INP} value={form.level}
                      onChange={e => setForm(p => ({ ...p, level: e.target.value }))}>
                      {['beginner', 'intermediate', 'advanced'].map(l => (
                        <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Pricing & capacity */}
              <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-5 space-y-4">
                <p className="text-[#181b26] text-[13px] font-semibold">Pricing &amp; capacity</p>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Price (KZT)">
                    <div className="relative">
                      <input type="number" className={INP + ' pr-8'} placeholder="0 for free" min="0"
                        value={form.price}
                        onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a90a1] text-[12px] font-semibold">₸</span>
                    </div>
                  </Field>
                  <Field label="Max students">
                    <input type="number" className={INP} placeholder="5" min="1" max="100"
                      value={form.max_students}
                      onChange={e => setForm(p => ({ ...p, max_students: e.target.value }))} />
                  </Field>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-5">
                <p className="text-[#181b26] text-[13px] font-semibold mb-3">Visibility</p>
                <div className="flex gap-3">
                  {[
                    { value: 'draft',     label: 'Draft',     desc: 'Not visible to students', color: '#8a90a1', bg: '#f3f4f7' },
                    { value: 'published', label: 'Active',    desc: 'Visible on marketplace',  color: '#22be70', bg: 'rgba(34,190,112,0.08)' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setForm(p => ({ ...p, status: opt.value }))}
                      className={`flex-1 rounded-[10px] p-3 text-left border-2 transition-all ${
                        form.status === opt.value ? 'border-current' : 'border-[#e8eaef] hover:border-[#c8cadd]'
                      }`}
                      style={form.status === opt.value ? { borderColor: opt.color, backgroundColor: opt.bg } : {}}>
                      <p className="text-[13px] font-semibold" style={{ color: form.status === opt.value ? opt.color : '#181b26' }}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-[#8a90a1] mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* View content note */}
              <div className="bg-[rgba(76,110,255,0.06)] border border-[rgba(76,110,255,0.15)] rounded-[12px] px-4 py-3 flex items-start gap-3">
                <svg viewBox="0 0 16 16" fill="none" stroke="#4c6eff" strokeWidth="1.4" className="w-4 h-4 flex-shrink-0 mt-0.5">
                  <circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5.5h.01" strokeLinecap="round"/>
                </svg>
                <p className="text-[#4c6eff] text-[12px]">
                  To add or edit lessons, assignments and quizzes, go to{' '}
                  <Link to={`/tutor/courses/${courseId}`} className="font-semibold underline">
                    Course View
                  </Link>.
                </p>
              </div>
            </div>
          )}

          {/* ═══ STUDENTS ══════════════════════════════════════════════════════ */}
          {activeTab === 'students' && (
            <div className="max-w-[600px] mx-auto p-6">
              <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-5">
                <p className="text-[#181b26] text-[14px] font-semibold mb-4">
                  Enrolled students {enrollments.length > 0 && `(${enrollments.length})`}
                </p>

                {enrollLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-7 h-7 border-[3px] border-[#4c6eff] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-11 h-11 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-3">
                      <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.4" className="w-5 h-5">
                        <circle cx="7" cy="6" r="3.5"/><path d="M1 17a6 6 0 0112 0"/>
                      </svg>
                    </div>
                    <p className="text-[#8a90a1] text-[13px]">No students enrolled yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {enrollments.map((enr, i) => {
                      const name = enr.user_name || enr.name || enr.student_name || `Student ${i + 1}`;
                      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                      const since = enr.enrolled_at ? formatDate(enr.enrolled_at) : null;
                      return (
                        <div key={enr.id || enr.user_id || i}
                          className="flex items-center gap-3 p-3 rounded-[10px] bg-[#f8f9fc]">
                          <div className="w-9 h-9 rounded-full bg-[rgba(76,110,255,0.12)] flex items-center justify-center flex-shrink-0">
                            <span className="text-[#4c6eff] text-[12px] font-semibold">{initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#181b26] text-[13px] font-medium truncate">{name}</p>
                            {since && <p className="text-[#8a90a1] text-[11px]">Enrolled {since}</p>}
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(34,190,112,0.12)] text-[#22be70]">
                            Active
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EditCourse;
