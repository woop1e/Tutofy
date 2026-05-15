import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { coursesAPI } from '../../api/courses';
import { enrollmentsAPI } from '../../api/enrollments';
import { assignmentsAPI } from '../../api/assignments';
import { submissionsAPI } from '../../api/submissions';
import { lessonsAPI } from '../../api/lessons';
import { usersAPI } from '../../api/users';

/* ── colour helpers ── */
const COLORS = ['#4c6eff', '#935bf5', '#00beb7', '#ff8032', '#22be70', '#f24545'];
const avatarColor = (id) => COLORS[(id?.charCodeAt(0) || 0) % COLORS.length];
const getInitials = (name) =>
  (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

/* ── time helpers ── */
const parseTS = (ts) => {
  if (!ts) return null;
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
  return new Date(ts);
};

const fmtTime = (d) => {
  if (!d) return '';
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};
const fmtDayLabel = (d) => {
  const today = new Date();
  const tom = new Date(); tom.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tom.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* ── tiny icon components ── */
const Icon = ({ d, ...p }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5" {...p}>
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Meeting Link Modal ── */
function MeetingLinkModal({ lesson, onSave, onClose }) {
  const [link, setLink]     = useState(lesson.video_link || '');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await lessonsAPI.setMeetingLink(lesson.id, link);
      onSave(lesson.id, link);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[420px] mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-[#181b26]">Add Meeting Link</h3>
          <button onClick={onClose} className="text-[#8a90a1] hover:text-[#181b26]">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <p className="text-[13px] font-semibold text-[#181b26] mb-1">{lesson.title}</p>
        {lesson._timeLabel && <p className="text-[12px] text-[#8a90a1] mb-4">{lesson._timeLabel}</p>}
        <div className="mb-4">
          <label className="block text-[12px] font-semibold text-[#4c5162] mb-1">Zoom / Google Meet / Teams link</label>
          <input
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://zoom.us/j/... or meet.google.com/..."
            className="w-full border border-[#d2d4d9] rounded-[10px] px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#4c6eff]"
          />
        </div>
        {error && <p className="text-[12px] text-[#f24545] mb-3">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !link.trim()}
            className="flex-1 bg-[#4c6eff] text-white text-[13px] font-bold py-2.5 rounded-[10px] hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save link'}
          </button>
          <button onClick={onClose} className="px-4 border border-[#d2d4d9] text-[#4c5162] text-[13px] rounded-[10px] hover:border-[#4c6eff]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
const TutorDashboard = () => {
  const { isAuthenticated, role, user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses]           = useState([]);
  const [lessons, setLessons]           = useState([]);
  const [ungraded, setUngraded]         = useState([]);
  const [usersMap, setUsersMap]         = useState({});
  const [totalStudents, setTotalStudents] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [dayFilter, setDayFilter]       = useState(7);
  const [profileStatus, setProfileStatus] = useState(null);
  const [modalLesson, setModalLesson]   = useState(null);

  const handleLinkSaved = (lessonId, link) => {
    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, video_link: link } : l));
  };

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || role !== 'tutor')) navigate('/login', { replace: true });
  }, [isLoading, isAuthenticated, role, navigate]);

  useEffect(() => {
    const uid = user?.user_id;
    if (!uid) { setLoading(false); return; }

    (async () => {
      try {
        /* 1. courses + users + profile in parallel */
        const [coursesRes, usersRes, profileRes] = await Promise.all([
          coursesAPI.getAllCourses().catch(() => ({})),
          usersAPI.getAllUsers().catch(() => ({})),
          usersAPI.getTutorProfile(uid).catch(() => null),
        ]);
        if (profileRes) setProfileStatus(profileRes.status || 'pending');
        const tutorCourses = (coursesRes?.courses || []).filter((c) => c.tutor_id === uid);
        setCourses(tutorCourses);

        const uMap = {};
        (usersRes?.users || []).forEach((u) => { uMap[u.id] = u; });
        setUsersMap(uMap);

        /* 2. per-course: enrollments + lessons + assignments */
        const courseData = await Promise.all(
          tutorCourses.slice(0, 10).map(async (course) => {
            const [enrRes, lRes, aRes] = await Promise.all([
              enrollmentsAPI.getCourseEnrollments(course.id).catch(() => ({ enrollments: [] })),
              lessonsAPI.getCourseLessons(course.id).catch(() => ({ lessons: [] })),
              assignmentsAPI.getCourseAssignments(course.id).catch(() => []),
            ]);
            const enrollments = enrRes?.enrollments || (Array.isArray(enrRes) ? enrRes : []);
            const courseLessons = (lRes?.lessons || []).map((l) => ({
              ...l,
              courseTitle: course.title,
              type: 'group',
            }));
            const assignments = Array.isArray(aRes) ? aRes : (aRes?.assignments || []);
            return { course, lessons: courseLessons, assignments, enrollmentCount: enrollments.length };
          })
        );

        /* total unique students across all courses */
        const total = courseData.reduce((s, d) => s + d.enrollmentCount, 0);
        setTotalStudents(total);

        /* upcoming lessons: course-based + individual booked */
        const now = new Date();
        const from = now.toISOString();
        const toDate = new Date(now); toDate.setDate(now.getDate() + 30);
        const scheduleRes = await lessonsAPI.getSchedule(from, toDate.toISOString()).catch(() => ({ lessons: [] }));
        const scheduleLessons = (scheduleRes?.lessons || []).map((l) => ({
          ...l,
          courseTitle: l.course_id ? undefined : 'Individual lesson',
          type: l.course_id ? 'group' : 'individual',
        }));
        // Merge: schedule has all tutor lessons (course + individual); prefer schedule data.
        const lessonById = {};
        courseData.flatMap((d) => d.lessons).forEach((l) => { lessonById[l.id] = l; });
        scheduleLessons.forEach((l) => { lessonById[l.id] = l; });
        const allLessons = Object.values(lessonById)
          .filter((l) => { const d = parseTS(l.scheduled_at); return d && d >= now; })
          .sort((a, b) => parseTS(a.scheduled_at) - parseTS(b.scheduled_at));
        setLessons(allLessons);

        /* 3. ungraded submissions */
        const allAssignments = courseData.flatMap((d) =>
          d.assignments.map((a) => ({ ...a, courseTitle: d.course.title }))
        );
        const subResults = await Promise.all(
          allAssignments.slice(0, 20).map(async (a) => {
            const res = await submissionsAPI.getAssignmentSubmissions(a.id).catch(() => ({ submissions: [] }));
            const subs = res?.submissions || (Array.isArray(res) ? res : []);
            return subs
              .filter((s) => s.grade == null)
              .map((s) => ({
                assignmentId: a.id,
                assignmentTitle: a.title,
                courseName: a.courseTitle,
                studentId: s.student_id,
                studentName: uMap[s.student_id]?.name || 'Student',
                submittedAt: s.submitted_at || s.created_at,
              }));
          })
        );
        setUngraded(subResults.flat());
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  /* ── derived ── */
  const filteredLessons = useMemo(() => {
    const cut = new Date();
    cut.setDate(cut.getDate() + dayFilter);
    return lessons.filter((l) => (parseTS(l.scheduled_at) || 0) <= cut);
  }, [lessons, dayFilter]);

  const pendingLinks = useMemo(
    () => lessons.filter((l) => !l.video_link).slice(0, 5),
    [lessons]
  );

  /* ── schedule (today's time grid) ── */
  const today = new Date();
  const SCHEDULE_HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 9–19

  const lessonByHour = useMemo(() => {
    const map = {};
    lessons.forEach((l) => {
      const d = parseTS(l.scheduled_at);
      if (!d) return;
      const key = `${d.toDateString()}_${d.getHours()}`;
      map[key] = l;
    });
    return map;
  }, [lessons]);

  const daySlots = SCHEDULE_HOURS.map((h) => ({
    hour: h,
    lesson: lessonByHour[`${today.toDateString()}_${h}`] || null,
  }));

  /* ── week header ── */
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const firstName = user?.name?.split(' ')[0] || 'Tutor';

  /* ══════════════════════════════════════════ */
  return (
    <div className="flex min-h-screen bg-[#f5f6fa] font-sans">
      <TutorSidebar />

      {modalLesson && (
        <MeetingLinkModal
          lesson={modalLesson}
          onSave={handleLinkSaved}
          onClose={() => setModalLesson(null)}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* ── Header ── */}
        <div className="bg-white border-b border-[#ebebf0] px-8 py-6">
          <h1 className="text-[#181b26] text-[24px] font-bold leading-none">Dashboard</h1>
          <p className="text-[#8a90a1] text-[14px] mt-1">Welcome back, {firstName}!</p>
        </div>

        {/* ── Profile status banner ── */}
        {profileStatus && profileStatus !== 'approved' && (
          <div className={`mx-6 mt-4 rounded-2xl px-5 py-3 flex items-center gap-3 ${
            profileStatus === 'rejected'
              ? 'bg-[#f24545]/8 border border-[#f24545]/20'
              : 'bg-[#ff8032]/8 border border-[#ff8032]/20'
          }`}>
            <span className={`text-[16px] ${profileStatus === 'rejected' ? 'text-[#f24545]' : 'text-[#ff8032]'}`}>
              {profileStatus === 'rejected' ? '✕' : '⏳'}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-semibold ${profileStatus === 'rejected' ? 'text-[#f24545]' : 'text-[#ff8032]'}`}>
                {profileStatus === 'rejected'
                  ? 'Your profile was not approved — please update and resubmit'
                  : 'Complete your profile to appear in the marketplace'}
              </p>
              <p className={`text-[11px] mt-0.5 ${profileStatus === 'rejected' ? 'text-[#f24545]/70' : 'text-[#ff8032]/70'}`}>
                {profileStatus === 'rejected'
                  ? 'Update your profile details so an admin can re-review your application.'
                  : 'Your profile is pending admin review. Students cannot find you in the marketplace yet.'}
              </p>
            </div>
            <Link to="/tutor/profile" className={`flex-shrink-0 px-4 py-2 rounded-[8px] text-[12px] font-bold text-white ${profileStatus === 'rejected' ? 'bg-[#f24545]' : 'bg-[#ff8032]'}`}>
              {profileStatus === 'rejected' ? 'Update Profile' : 'Complete Profile'}
            </Link>
          </div>
        )}

        <div className="flex-1 p-6 flex gap-6 min-h-0">

          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Students', value: totalStudents ?? '—', color: '#4c6eff',
                  icon: 'M9 7a4 4 0 11-8 0 4 4 0 018 0zM1 18a8 8 0 1116 0',
                },
                {
                  label: 'Active Courses', value: courses.length || '—', color: '#935bf5',
                  icon: 'M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zM7 9h6M7 12h4',
                },
                {
                  label: 'Ungraded Assignments', value: ungraded.length, color: '#ff8032',
                  icon: 'M5 3h10a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1zM7 9h6M7 13h4',
                },
                {
                  label: 'Upcoming Meetings', value: filteredLessons.length, color: '#22be70',
                  icon: 'M6 2v4M14 2v4M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
                },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-[14px] border border-[#ebebf0] p-5 flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{ background: s.color + '18', color: s.color }}
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                      <path d={s.icon} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#181b26] text-[22px] font-bold leading-none">{s.value}</p>
                    <p className="text-[#8a90a1] text-[12px] mt-1">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Upcoming Lessons */}
            <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#181b26] text-[16px] font-bold">Upcoming Lessons</h2>
                <Link to="/tutor/courses" className="text-[#4c6eff] text-[13px] font-medium flex items-center gap-0.5">
                  View all <span className="text-[16px] leading-none">›</span>
                </Link>
              </div>

              {/* Day tabs */}
              <div className="flex items-center gap-2 mb-4">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDayFilter(d)}
                    className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors ${
                      dayFilter === d
                        ? 'bg-[#eef0ff] text-[#4c6eff]'
                        : 'text-[#8a90a1] hover:text-[#181b26] hover:bg-[#f5f6fa]'
                    }`}
                  >
                    {d} days
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-4 border-[#4c6eff] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredLessons.length === 0 ? (
                <p className="text-[#8a90a1] text-[13px] text-center py-10">
                  No upcoming lessons in the next {dayFilter} days
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredLessons.slice(0, 6).map((lesson) => {
                    const start = parseTS(lesson.scheduled_at);
                    const end = start ? new Date(start.getTime() + (lesson.duration_minutes || 60) * 60000) : null;
                    const isToday = !!start && start.toDateString() === today.toDateString();
                    const color = avatarColor(lesson.courseTitle || lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-4 p-4 rounded-[12px] border border-[#ebebf0] hover:border-[#4c6eff]/30 transition-colors"
                      >
                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                          style={{ background: color }}
                        >
                          {(lesson.courseTitle || 'L').slice(0, 1).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[#181b26] text-[14px] font-semibold truncate">
                            {lesson.title || lesson.courseTitle}
                          </p>
                          <p className="text-[#8a90a1] text-[12px] flex items-center gap-1 mt-0.5">
                            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3 h-3">
                              <circle cx="7" cy="7" r="5.5" /><path d="M7 4v3l2 1.5" />
                            </svg>
                            {fmtDayLabel(start)}, {fmtTime(start)} – {fmtTime(end)}
                          </p>
                        </div>

                        <span
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                            lesson.type === 'individual'
                              ? 'bg-[#181b26] text-white'
                              : 'bg-[#f0f0f5] text-[#4c5162]'
                          }`}
                        >
                          {lesson.type === 'individual' ? 'individual' : 'group'}
                        </span>

                        <button
                          className={`text-[13px] font-semibold px-4 py-2 rounded-[9px] flex items-center gap-1.5 transition-opacity hover:opacity-85 ${
                            isToday
                              ? 'bg-[#22be70] text-white'
                              : 'bg-[#eef0ff] text-[#4c6eff]'
                          }`}
                        >
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                            <rect x="1" y="4" width="10" height="8" rx="1.5" />
                            <path d="M11 7l4-2v6l-4-2" />
                          </svg>
                          {isToday ? 'Join' : 'Start'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pending Lesson Links */}
            {!loading && pendingLinks.length > 0 && (
              <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[#181b26] text-[16px] font-bold">Pending Lesson Links</h2>
                  <span className="text-[#8a90a1] text-[12px]">Lessons without meeting links</span>
                </div>
                <div className="space-y-3">
                  {pendingLinks.map((lesson) => {
                    const start = parseTS(lesson.scheduled_at);
                    const end = start ? new Date(start.getTime() + (lesson.duration_minutes || 60) * 60000) : null;
                    const color = avatarColor(lesson.courseTitle || lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-4 p-4 rounded-[12px] border border-[#ebebf0]"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                          style={{ background: color }}
                        >
                          {(lesson.courseTitle || 'L').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#181b26] text-[14px] font-semibold truncate">
                            {lesson.title || lesson.courseTitle}
                          </p>
                          <p className="text-[12px] flex items-center gap-2 mt-0.5">
                            <span className="text-[#8a90a1]">
                              {fmtDayLabel(start)}, {fmtTime(start)} – {fmtTime(end)}
                            </span>
                            <span className="text-[#f24545] font-medium">• Link not created</span>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const s = parseTS(lesson.scheduled_at);
                            const e = s ? new Date(s.getTime() + (lesson.duration_minutes || 60) * 60000) : null;
                            setModalLesson({ ...lesson, _timeLabel: s && e ? `${fmtDayLabel(s)}, ${fmtTime(s)} – ${fmtTime(e)}` : '' });
                          }}
                          className="bg-[#4c6eff] text-white text-[13px] font-semibold px-4 py-2 rounded-[9px] hover:opacity-90 transition-opacity"
                        >
                          Create link
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ungraded Assignments */}
            <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#181b26] text-[16px] font-bold">Ungraded Assignments</h2>
                <Link to="/tutor/grading" className="text-[#4c6eff] text-[13px] font-medium">
                  View all
                </Link>
              </div>

              {loading ? (
                <p className="text-center py-6 text-[#8a90a1] text-[13px]">Loading…</p>
              ) : ungraded.length === 0 ? (
                <p className="text-[#8a90a1] text-[13px] text-center py-8">All assignments are graded ✓</p>
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr>
                        {['Student', 'Course', 'Assignment', 'Submitted', ''].map((h) => (
                          <th
                            key={h}
                            className="text-left text-[#8a90a1] text-[12px] font-medium pb-3 pr-4 last:pr-0"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ungraded.slice(0, 6).map((item, i) => (
                        <tr key={i} className="border-t border-[#f0f0f5]">
                          <td className="py-3 pr-4 text-[#181b26] text-[13px] font-semibold whitespace-nowrap">
                            {item.studentName}
                          </td>
                          <td className="py-3 pr-4 text-[#4c5162] text-[13px] whitespace-nowrap">
                            {item.courseName}
                          </td>
                          <td className="py-3 pr-4 text-[#4c5162] text-[13px]">{item.assignmentTitle}</td>
                          <td className="py-3 pr-4 text-[#8a90a1] text-[12px] whitespace-nowrap">
                            {item.submittedAt
                              ? new Date(item.submittedAt).toLocaleDateString('en-US', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="py-3">
                            <Link
                              to="/tutor/grading"
                              className="bg-[#4c6eff] text-white text-[12px] font-semibold px-3 py-1.5 rounded-[8px] hover:opacity-90 transition-opacity"
                            >
                              Grade
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ungraded.length > 6 && (
                    <div className="mt-4 pt-4 border-t border-[#f0f0f5] text-center">
                      <Link to="/tutor/grading" className="text-[#4c6eff] text-[13px] font-medium">
                        View all ungraded assignments ({ungraded.length}) ›
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Schedule column (sticky) ── */}
          <div className="w-[270px] flex-shrink-0">
            <div className="bg-white rounded-[16px] border border-[#ebebf0] p-5 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#181b26] text-[15px] font-bold">My Schedule</h2>
                <button className="text-[#4c6eff] text-[12px] font-medium hover:opacity-80">
                  View full calendar
                </button>
              </div>

              {/* Week mini-calendar */}
              <div className="grid grid-cols-7 gap-0.5 mb-5">
                {weekDays.map((d, i) => {
                  const isToday = d.toDateString() === today.toDateString();
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <span className="text-[#8a90a1] text-[10px]">{DAY_LABELS[i]}</span>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold mt-0.5 ${
                          isToday ? 'bg-[#4c6eff] text-white' : 'text-[#181b26]'
                        }`}
                      >
                        {d.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Today's time slots */}
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {daySlots.map(({ hour, lesson }) => (
                  <div key={hour} className="flex items-start gap-2">
                    <span className="text-[#8a90a1] text-[11px] w-9 pt-1.5 flex-shrink-0 tabular-nums">
                      {hour}:00
                    </span>
                    {lesson ? (
                      <div className="flex-1 bg-[#eef0ff] border border-[#4c6eff]/25 rounded-[8px] px-2.5 py-2">
                        <div className="text-[9px] font-bold text-[#4c6eff] uppercase tracking-wide">Booked</div>
                        <div className="text-[#181b26] text-[11px] font-semibold mt-0.5 truncate">
                          {lesson.title || lesson.courseTitle}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 bg-[#f8f9fb] rounded-[8px] px-2.5 py-2">
                        <span className="text-[#c4c8d4] text-[11px]">Free</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Create meeting link */}
              <button
                onClick={() => navigate('/tutor/schedule')}
                className="w-full mt-4 bg-[#4c6eff] text-white text-[13px] font-semibold py-2.5 rounded-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <rect x="1" y="4" width="10" height="8" rx="1.5" />
                  <path d="M11 7l4-2v6l-4-2" />
                </svg>
                Manage schedule →
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;
