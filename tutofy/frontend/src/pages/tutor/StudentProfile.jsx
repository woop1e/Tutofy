import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { usersAPI } from '../../api/users';

/* ── constants ────────────────────────────────────────────────────────────── */
const COLORS = ['#4c6eff', '#935bf5', '#00beb7', '#ff8032', '#22be70', '#f24545'];
const TABS   = ['Overview', 'Courses', 'Assignments', 'Attendance', 'Notes'];

/* ── helpers ──────────────────────────────────────────────────────────────── */
function avatarColor(id) { return COLORS[(id?.charCodeAt(0) || 0) % COLORS.length]; }
function initials(name)  { return (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(); }

function parseTS(ts) {
  if (!ts) return null;
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
  return new Date(ts);
}
function fmtDate(ts) {
  const d = parseTS(ts);
  if (!d || isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateTime(ts) {
  const d = parseTS(ts);
  if (!d || isNaN(d)) return '—';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Progress ring ────────────────────────────────────────────────────────── */
function Ring({ pct, size = 64, color = '#4c6eff', strokeWidth = 6 }) {
  const r      = (size - strokeWidth) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct || 0)) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f7" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────────── */
function EmptyState({ icon, title, text }) {
  return (
    <div className="bg-white rounded-[16px] border border-[#ebebf0] p-14 text-center">
      <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <p className="text-[#181b26] text-[15px] font-semibold mb-1">{title}</p>
      <p className="text-[#8a90a1] text-[13px]">{text}</p>
    </div>
  );
}

/* ── Overview tab ─────────────────────────────────────────────────────────── */
function OverviewTab({ courses, assignments, lessons, avgProgress, avgGrade, attendPct }) {
  const now      = new Date();
  const upcoming = lessons.filter(l => { const d = parseTS(l.scheduled_at); return d && d > now; }).slice(0, 4);
  const recent   = assignments.filter(a => a.submitted).slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Stat rings */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Avg Progress', pct: avgProgress, value: `${avgProgress}%`, color: '#4c6eff', sub: 'across your courses' },
          { label: 'Avg Grade',    pct: avgGrade ?? 0, value: avgGrade !== null ? `${Math.round(avgGrade)}%` : '—', color: '#935bf5', sub: 'your assignments' },
          { label: 'Attendance',   pct: attendPct, value: `${attendPct}%`, color: '#00beb7', sub: 'your lessons' },
        ].map(({ label, pct, value, color, sub }) => (
          <div key={label} className="bg-white rounded-[16px] border border-[#ebebf0] p-5 flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <Ring pct={pct} color={color} size={60} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-bold text-[#181b26]">{value}</span>
              </div>
            </div>
            <div>
              <p className="text-[#181b26] text-[14px] font-bold">{label}</p>
              <p className="text-[#8a90a1] text-[11px]">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Enrolled courses preview */}
      {courses.length > 0 && (
        <div className="bg-white rounded-[16px] border border-[#ebebf0] p-5">
          <p className="text-[#181b26] text-[13px] font-bold mb-3">Enrolled in your courses</p>
          <div className="space-y-3">
            {courses.slice(0, 3).map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                  {(c.title || 'C')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[#181b26] text-[13px] font-medium">{c.title}</p>
                    <span className="text-[11px] font-semibold" style={{ color: COLORS[i % COLORS.length] }}>
                      {c.progress_pct || 0}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#f3f4f7] rounded-full">
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${c.progress_pct || 0}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Upcoming lessons */}
        <div className="bg-white rounded-[16px] border border-[#ebebf0] p-5">
          <p className="text-[#181b26] text-[13px] font-bold mb-3">Upcoming Lessons</p>
          {upcoming.length === 0 ? (
            <p className="text-[#8a90a1] text-[12px]">No upcoming lessons.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map(l => (
                <div key={l.id} className="flex items-start gap-2.5 p-2.5 bg-[#f8f9fc] rounded-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4c6eff] flex-shrink-0 mt-1.5" />
                  <div className="min-w-0">
                    <p className="text-[#181b26] text-[12px] font-medium truncate">{l.title}</p>
                    <p className="text-[#8a90a1] text-[11px]">{fmtDateTime(l.scheduled_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent submissions */}
        <div className="bg-white rounded-[16px] border border-[#ebebf0] p-5">
          <p className="text-[#181b26] text-[13px] font-bold mb-3">Recent Submissions</p>
          {recent.length === 0 ? (
            <p className="text-[#8a90a1] text-[12px]">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map(a => (
                <div key={a.id} className="flex items-center justify-between p-2.5 bg-[#f8f9fc] rounded-[10px]">
                  <p className="text-[#181b26] text-[12px] font-medium truncate flex-1 mr-2">{a.title}</p>
                  {a.grade !== null && a.grade !== undefined ? (
                    <span className="text-[11px] font-bold bg-[#f0f9f4] text-[#22be70] px-2 py-0.5 rounded-full flex-shrink-0">
                      {Math.round(a.grade)}/{a.max_grade || 100}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#8a90a1] bg-[#f3f4f7] px-2 py-0.5 rounded-full flex-shrink-0">No grade</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Courses tab ──────────────────────────────────────────────────────────── */
function CoursesTab({ courses }) {
  if (courses.length === 0) {
    return <EmptyState icon={<svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M8 3v14M4 7h4M4 11h4" strokeLinecap="round"/></svg>} title="No courses" text="This student is not enrolled in any of your courses." />;
  }
  return (
    <div className="space-y-3">
      {courses.map((c, i) => {
        const color = COLORS[i % COLORS.length];
        const pct   = c.progress_pct || 0;
        return (
          <div key={c.id} className="bg-white rounded-[16px] border border-[#ebebf0] p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[12px] flex items-center justify-center text-white text-[18px] font-bold flex-shrink-0"
                style={{ backgroundColor: color }}>
                {(c.title || 'C')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-[#181b26] text-[14px] font-bold">{c.title}</h3>
                  <div className="flex items-center gap-2">
                    {pct >= 100 && (
                      <span className="text-[11px] font-semibold text-[#22be70] bg-[#f0f9f4] px-2 py-0.5 rounded-full">Completed</span>
                    )}
                    <span className="text-[14px] font-bold" style={{ color }}>{pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-[#f3f4f7] rounded-full mb-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <p className="text-[#8a90a1] text-[12px]">
                  {c.completed_lessons || 0} of {c.total_lessons || 0} lessons completed
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Assignments tab ──────────────────────────────────────────────────────── */
function AssignmentsTab({ assignments }) {
  if (assignments.length === 0) {
    return <EmptyState icon={<svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><path d="M4 2h9l4 4v13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M13 2v4h4M7 9h6M7 12h6M7 15h3" strokeLinecap="round"/></svg>} title="No assignments" text="No assignments from your courses yet." />;
  }
  return (
    <div className="bg-white rounded-[16px] border border-[#ebebf0] overflow-hidden">
      <div className="grid grid-cols-[2fr_1fr_90px_80px_90px] px-5 py-3 border-b border-[#ebebf0] text-[#8a90a1] text-[11px] font-semibold uppercase tracking-wide">
        <span>Assignment</span>
        <span>Course</span>
        <span>Status</span>
        <span>Grade</span>
        <span>Due</span>
      </div>
      <div className="divide-y divide-[#f5f6fa]">
        {assignments.map(a => (
          <div key={a.id} className="grid grid-cols-[2fr_1fr_90px_80px_90px] px-5 py-4 items-center hover:bg-[#f8f9fc] transition-colors">
            <div className="pr-3 min-w-0">
              <p className="text-[#181b26] text-[13px] font-semibold truncate">{a.title}</p>
              {a.feedback && <p className="text-[#8a90a1] text-[11px] truncate mt-0.5">{a.feedback}</p>}
            </div>
            <p className="text-[#8a90a1] text-[12px] truncate pr-3">{a.course_title || '—'}</p>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit ${
              a.submitted ? 'bg-[#f0f9f4] text-[#22be70]' : 'bg-[#fef2f2] text-[#f24545]'
            }`}>
              {a.submitted ? 'Submitted' : 'Pending'}
            </span>
            <span className="text-[#181b26] text-[13px] font-bold">
              {a.grade !== null && a.grade !== undefined
                ? <>{Math.round(a.grade)}<span className="text-[#8a90a1] text-[11px] font-normal">/{a.max_grade || 100}</span></>
                : <span className="text-[#8a90a1]">—</span>
              }
            </span>
            <span className="text-[#8a90a1] text-[11px]">
              {a.due_date ? new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Attendance tab ───────────────────────────────────────────────────────── */
function AttendanceTab({ lessons, summary }) {
  const attended = summary.attended || 0;
  const total    = summary.total    || 0;
  const missed   = total - attended;
  const pct      = summary.pct      || 0;
  const now      = new Date();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Lessons Attended', value: attended, color: '#22be70', bg: 'bg-[#f0f9f4]', textColor: 'text-[#22be70]' },
          { label: 'Lessons Missed',   value: missed,   color: '#f24545', bg: 'bg-[#fef2f2]', textColor: 'text-[#f24545]' },
          { label: 'Attendance Rate',  value: `${pct}%`, color: '#4c6eff', bg: 'bg-[#f0f2ff]', textColor: 'text-[#4c6eff]' },
        ].map(({ label, value, bg, textColor }) => (
          <div key={label} className={`${bg} rounded-[16px] border border-[#ebebf0] p-5 text-center`}>
            <p className={`text-[32px] font-bold ${textColor}`}>{value}</p>
            <p className="text-[#8a90a1] text-[12px] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Attendance bar */}
      {total > 0 && (
        <div className="bg-white rounded-[16px] border border-[#ebebf0] p-5">
          <p className="text-[#181b26] text-[13px] font-bold mb-3">Attendance Overview</p>
          <div className="flex h-3 rounded-full overflow-hidden mb-2">
            <div className="bg-[#22be70] transition-all" style={{ width: `${pct}%` }} />
            <div className="bg-[#fef2f2] flex-1" />
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-[#22be70]"><span className="w-2 h-2 rounded-full bg-[#22be70]" /> Attended ({attended})</span>
            <span className="flex items-center gap-1 text-[#f24545]"><span className="w-2 h-2 rounded-full bg-[#fef2f2] border border-[#f24545]" /> Missed ({missed})</span>
          </div>
        </div>
      )}

      {/* Lesson list */}
      {lessons.length > 0 && (
        <div className="bg-white rounded-[16px] border border-[#ebebf0] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#ebebf0]">
            <p className="text-[#181b26] text-[13px] font-bold">All Lessons</p>
          </div>
          <div className="divide-y divide-[#f5f6fa]">
            {lessons.map(l => {
              const d      = parseTS(l.scheduled_at);
              const isPast = d && d < now;
              return (
                <div key={l.id} className="flex items-center gap-3 px-5 py-4">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    !isPast ? 'bg-[#4c6eff]' : l.attended ? 'bg-[#22be70]' : 'bg-[#f24545]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#181b26] text-[13px] font-medium truncate">{l.title}</p>
                    <p className="text-[#8a90a1] text-[11px]">{fmtDate(l.scheduled_at)}</p>
                  </div>
                  {l.course_title && (
                    <span className="text-[11px] bg-[#f0f2ff] text-[#4c6eff] px-2 py-0.5 rounded-full flex-shrink-0">{l.course_title}</span>
                  )}
                  {isPast ? (
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                      l.attended ? 'bg-[#f0f9f4] text-[#22be70]' : 'bg-[#fef2f2] text-[#f24545]'
                    }`}>
                      {l.attended ? 'Present' : 'Absent'}
                    </span>
                  ) : (
                    <span className="text-[11px] bg-[#f0f2ff] text-[#4c6eff] px-2.5 py-1 rounded-full font-semibold flex-shrink-0">Upcoming</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lessons.length === 0 && <EmptyState icon={<svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><rect x="2" y="4" width="16" height="14" rx="1.5"/><path d="M6 2v4M14 2v4M2 9h16" strokeLinecap="round"/></svg>} title="No lessons yet" text="Lessons will appear here once you schedule them for this student." />}
    </div>
  );
}

/* ── Notes tab ────────────────────────────────────────────────────────────── */
function NotesTab({ note, setNote, onSave, saved }) {
  return (
    <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[#181b26] text-[14px] font-bold">Private Notes</p>
          <p className="text-[#8a90a1] text-[12px] mt-0.5">Only visible to you — not shared with the student.</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-[#22be70] text-[12px] font-semibold flex items-center gap-1">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Saved
            </span>
          )}
          <button
            onClick={onSave}
            className="bg-[#4c6eff] text-white text-[13px] font-semibold px-4 py-2 rounded-[8px] hover:opacity-90 transition-opacity"
          >
            Save notes
          </button>
        </div>
      </div>

      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Add private notes about this student — learning goals, observations, areas to improve, session summaries..."
        rows={12}
        className="w-full border border-[#d2d4d9] rounded-[12px] px-4 py-3 text-[13px] text-[#181b26] placeholder-[#c8ccdd] resize-none focus:outline-none focus:border-[#4c6eff] leading-relaxed"
      />
      <div className="flex items-center gap-1.5 mt-2">
        <svg viewBox="0 0 14 14" fill="none" stroke="#8a90a1" strokeWidth="1.2" className="w-3 h-3 flex-shrink-0">
          <rect x="1" y="1" width="12" height="12" rx="2"/><path d="M4 7h6M4 9.5h4" strokeLinecap="round"/>
        </svg>
        <p className="text-[#8a90a1] text-[11px]">Notes are saved locally in your browser. Only you can see them.</p>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
const StudentProfile = () => {
  const { studentId }  = useParams();
  const navigate       = useNavigate();
  const { user }       = useAuth();

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [tab,      setTab]      = useState('Overview');

  const noteKey  = `note_${user?.user_id}_${studentId}`;
  const [note,     setNote]     = useState(() => localStorage.getItem(noteKey) || '');
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    usersAPI.getStudentProfile(studentId)
      .then(data => setProfile(data))
      .catch(e => setError(e?.response?.data?.error || 'Failed to load student profile'))
      .finally(() => setLoading(false));
  }, [studentId]);

  const saveNote = () => {
    localStorage.setItem(noteKey, note);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f5f6fa] font-sans">
        <TutorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#4c6eff] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen bg-[#f5f6fa] font-sans">
        <TutorSidebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-[#f24545] text-[15px] font-semibold">{error || 'Student not found'}</p>
          <button onClick={() => navigate(-1)} className="text-[#4c6eff] text-[13px] hover:underline">← Back to students</button>
        </div>
      </div>
    );
  }

  const {
    student         = {},
    courses         = [],
    assignments     = [],
    grades_summary  = {},
    lessons         = [],
    attendance_summary = {},
  } = profile;

  const avgGrade   = grades_summary.average ?? null;
  const attendPct  = attendance_summary.pct ?? 0;
  const avgProgress = courses.length > 0
    ? Math.round(courses.reduce((s, c) => s + (c.progress_pct || 0), 0) / courses.length)
    : 0;
  const color = avatarColor(student.id);

  return (
    <div className="flex min-h-screen bg-[#f5f6fa] font-sans">
      <TutorSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top breadcrumb bar */}
        <div className="bg-white border-b border-[#ebebf0] px-8 h-[60px] flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate('/tutor/students')}
            className="text-[#8a90a1] text-[13px] hover:text-[#181b26] transition-colors"
          >
            Students
          </button>
          <span className="text-[#d2d4d9]">/</span>
          <span className="text-[#181b26] text-[13px] font-medium truncate">{student.name}</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[960px] mx-auto px-8 py-6">

            {/* ── Hero card ── */}
            <div className="bg-white rounded-[20px] border border-[#ebebf0] p-6 mb-5">
              <div className="flex items-start gap-5">
                <div
                  className="w-[80px] h-[80px] rounded-[18px] flex items-center justify-center text-white text-[28px] font-bold flex-shrink-0 select-none"
                  style={{ backgroundColor: color }}
                >
                  {initials(student.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-[#181b26] text-[20px] font-bold mb-0.5">{student.name || 'Unknown Student'}</h1>
                  <p className="text-[#8a90a1] text-[13px] mb-3">{student.email || ''}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#f0f2ff] text-[#4c6eff] text-[11px] font-semibold px-3 py-1 rounded-full">
                      {courses.length <= 1 ? 'Individual Student' : 'Group Student'}
                    </span>
                    <span className="bg-[#f0f9f4] text-[#22be70] text-[11px] font-semibold px-3 py-1 rounded-full">
                      {courses.length} course{courses.length !== 1 ? 's' : ''} with you
                    </span>
                    {assignments.filter(a => a.submitted && (a.grade === null || a.grade === undefined)).length > 0 && (
                      <span className="bg-[#fff7ed] text-[#ff8032] text-[11px] font-semibold px-3 py-1 rounded-full">
                        {assignments.filter(a => a.submitted && (a.grade === null || a.grade === undefined)).length} ungraded
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-4 gap-0 mt-5 pt-5 border-t border-[#ebebf0]">
                {[
                  { label: 'Avg Progress', value: `${avgProgress}%`, color: '#4c6eff' },
                  { label: 'Avg Grade',    value: avgGrade !== null ? `${Math.round(avgGrade)}%` : '—', color: '#935bf5' },
                  { label: 'Attendance',   value: `${attendPct}%`, color: '#00beb7' },
                  { label: 'Courses',      value: String(courses.length), color: '#22be70' },
                ].map(({ label, value, color: c }, i) => (
                  <div key={label} className={`text-center px-4 ${i > 0 ? 'border-l border-[#ebebf0]' : ''}`}>
                    <p className="text-[24px] font-bold leading-none" style={{ color: c }}>{value}</p>
                    <p className="text-[#8a90a1] text-[11px] mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Tab bar ── */}
            <div className="flex items-center gap-1 bg-white rounded-[14px] border border-[#ebebf0] p-1.5 mb-5">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 text-[13px] font-semibold py-2 rounded-[10px] transition-colors ${
                    tab === t
                      ? 'bg-[#4c6eff] text-white shadow-sm'
                      : 'text-[#8a90a1] hover:text-[#181b26] hover:bg-[#f5f6fa]'
                  }`}
                >
                  {t}
                  {t === 'Assignments' && assignments.length > 0 && (
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-white/20' : 'bg-[#f3f4f7]'}`}>
                      {assignments.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab content ── */}
            {tab === 'Overview' && (
              <OverviewTab
                courses={courses} assignments={assignments} lessons={lessons}
                avgProgress={avgProgress} avgGrade={avgGrade} attendPct={attendPct}
              />
            )}
            {tab === 'Courses'     && <CoursesTab courses={courses} />}
            {tab === 'Assignments' && <AssignmentsTab assignments={assignments} />}
            {tab === 'Attendance'  && <AttendanceTab lessons={lessons} summary={attendance_summary} />}
            {tab === 'Notes'       && <NotesTab note={note} setNote={setNote} onSave={saveNote} saved={noteSaved} />}

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
