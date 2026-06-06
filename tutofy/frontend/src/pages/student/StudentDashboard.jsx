﻿import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBarActions from '../../components/ui/TopBarActions';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import StudentTour from '../../components/onboarding/StudentTour';
import { enrollmentsAPI } from '../../api/enrollments';
import { coursesAPI } from '../../api/courses';
import { assignmentsAPI } from '../../api/assignments';
import { lessonsAPI } from '../../api/lessons';
import { notificationsAPI } from '../../api/notifications';
import { progressAPI } from '../../api/progress';

const COLORS = ['#0d9488', '#7c3aed', '#0ea5e9', '#f59e0b', '#22c55e'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeek(offset = 0) {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const mon = new Date(today);
  mon.setDate(today.getDate() - dow + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function isToday(d) {
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'object' && val.seconds != null) return new Date(Number(val.seconds) * 1000);
  const s = typeof val === 'string' ? val.replace(' ', 'T') : String(val);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function assignmentStatus(a) {
  if (a.graded)    return 'graded';
  if (a.submitted) return 'submitted';
  if (a.due_date && new Date(a.due_date) < new Date()) return 'overdue';
  return 'pending';
}

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick}
    className="px-3 py-1 rounded-[8px] text-[12px] font-medium transition-colors"
    style={active
      ? { backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }
      : { color: 'var(--muted)' }}>
    {children}
  </button>
);

const ProgressBar = ({ value, color }) => (
  <div className="flex-1 bg-[#f0f0f5] rounded-full" style={{ height: 4 }}>
    <div className="rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color, height: 4 }} />
  </div>
);

const CircleIcon = ({ done, color }) => (
  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
    style={done ? { backgroundColor: color || '#22c55e' } : { border: '2px solid #d2d4d9' }}>
    {done && (
      <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
        <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </div>
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userId = user?.user_id;

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [privateLessons,  setPrivateLessons]  = useState([]);
  const [assignments,     setAssignments]     = useState([]);
  const [lessons,         setLessons]         = useState([]);
  const [unreadCount,     setUnreadCount]     = useState(0);
  const [loading,         setLoading]         = useState(true);
  const [hwTab,           setHwTab]           = useState('upcoming');
  const [filterMode,      setFilterMode]      = useState('day');
  const [showTour,        setShowTour]        = useState(
    () => localStorage.getItem('tutofy_student_tour_seen') !== 'true'
  );
  const [selectedDay,     setSelectedDay]     = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [weekOffset,      setWeekOffset]      = useState(0);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetchAll = async () => {
      try {
        const [enrRes, coursesRes, notifsRes, privateRes] = await Promise.all([
          enrollmentsAPI.getUserEnrollments(userId).catch(() => ({})),
          coursesAPI.getAllCourses().catch(() => ({})),
          notificationsAPI.getNotifications().catch(() => ({})),
          lessonsAPI.getStudentLessons(userId).catch(() => ({})),
        ]);

        const enrollments = enrRes?.enrollments || [];
        const allCourses  = coursesRes?.courses  || [];
        const notifs      = notifsRes?.notifications || (Array.isArray(notifsRes) ? notifsRes : []);
        setUnreadCount(notifs.filter(n => !n.is_read).length);

        // Individual (private) lessons - no course_id
        const allStudentLessons = privateRes?.lessons || (Array.isArray(privateRes) ? privateRes : []);
        setPrivateLessons(allStudentLessons.filter(l => !l.course_id && !l.courseId));

        if (enrollments.length > 0) {
          const courseIds = enrollments.map(e => e.course_id).filter(Boolean);

          const progressResults = await Promise.all(
            courseIds.map(id =>
              progressAPI.getStudentCourseProgress(userId, id).catch(() => null)
            )
          );

          const joined = enrollments.map((enr, i) => {
            const pd = progressResults[i];
            const overallPct   = pd?.overall_pct   ?? 0;
            const availablePct = pd?.available_pct ?? 0;
            const totalPlanned = pd?.total_planned_lessons ?? 0;
            const progress = pd
              ? (totalPlanned > 0 ? overallPct : availablePct)
              : (enr.progress ?? 0);
            return {
              ...enr,
              course:   allCourses.find(c => c.id === enr.course_id) || {},
              progress: Math.round(progress),
              color:    COLORS[i % COLORS.length],
            };
          });
          setEnrolledCourses(joined);
          const [assignmentArrays, lessonArrays] = await Promise.all([
            Promise.all(courseIds.map(id =>
              assignmentsAPI.getCourseAssignments(id)
                .then(r => (r?.assignments || []).map(a => ({ ...a, courseId: id })))
                .catch(() => [])
            )),
            Promise.all(courseIds.map(id =>
              lessonsAPI.getCourseLessons(id)
                .then(r => (r?.lessons || r || []).map(l => ({ ...l, courseId: id })))
                .catch(() => [])
            )),
          ]);
          setAssignments(assignmentArrays.flat());
          setLessons(lessonArrays.flat());
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [userId]);

  const firstName = user?.name?.split(' ')[0] || 'Student';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? t('dashboard.goodMorning') : hour < 18 ? t('dashboard.goodAfternoon') : t('dashboard.goodEvening');
  const todayStr  = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const initials  = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S';
  const weekDates = useMemo(() => getWeek(weekOffset), [weekOffset]);

  const allScheduleItems = useMemo(() => {
    const items = [];

    // Homework deadlines
    assignments.filter(a => a.due_date && !a.graded).forEach(a => {
      const date = parseDate(a.due_date);
      if (!date) return;
      const enr = enrolledCourses.find(e => e.course_id === a.courseId);
      items.push({
        type:    'homework',
        date,
        title:   a.title,
        sub:     enr?.course?.title || 'Course',
        status:  assignmentStatus(a),
        color:   '#ff8032',
        id:      `hw-${a.id}`,
      });
    });

    // Group course lessons
    lessons.forEach(lesson => {
      const date = parseDate(lesson.scheduled_at);
      if (!date) return;
      const cid = lesson.course_id || lesson.courseId;
      const enr = enrolledCourses.find(e => e.course_id === cid);
      items.push({
        type:      'group-lesson',
        date,
        title:     lesson.title || 'Online lesson',
        sub:       `${enr?.course?.title || 'Course'} · ${lesson.duration_minutes || 60} min`,
        status:    isToday(date) ? 'today' : 'upcoming',
        color:     enr?.color || '#0d9488',
        id:        `lesson-${lesson.id}`,
        courseId:  cid,
        videoLink: lesson.video_link,
        duration:  lesson.duration_minutes || 60,
      });
    });

    // Private / individual lessons
    privateLessons.forEach(lesson => {
      const date = parseDate(lesson.scheduled_at);
      if (!date) return;
      items.push({
        type:        'private-lesson',
        date,
        title:       lesson.title || 'Private lesson',
        sub:         `Private · ${lesson.duration_minutes || 60} min`,
        status:      isToday(date) ? 'today' : 'upcoming',
        color:       '#935bf5',
        id:          `private-${lesson.id}`,
        videoLink:   lesson.video_link,
        hasLink:     !!(lesson.video_link),
        lessonStatus: lesson.status,
        duration:    lesson.duration_minutes || 60,
      });
    });

    return items.sort((a, b) => a.date - b.date);
  }, [assignments, lessons, privateLessons, enrolledCourses]);

  const daysWithEvents = useMemo(() => {
    const set = new Set();
    allScheduleItems.forEach(it => {
      const d = new Date(it.date); d.setHours(0, 0, 0, 0);
      set.add(d.getTime());
    });
    return set;
  }, [allScheduleItems]);

  const scheduleItems = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (filterMode === '7days') {
      const end = new Date(now); end.setDate(now.getDate() + 7); end.setHours(23, 59, 59, 999);
      return allScheduleItems.filter(it => it.date >= now && it.date <= end);
    }
    if (filterMode === 'month') {
      const end = new Date(now); end.setMonth(now.getMonth() + 1); end.setHours(23, 59, 59, 999);
      return allScheduleItems.filter(it => it.date >= now && it.date <= end);
    }
    if (filterMode === '3months') {
      const end = new Date(now); end.setMonth(now.getMonth() + 3); end.setHours(23, 59, 59, 999);
      return allScheduleItems.filter(it => it.date >= now && it.date <= end);
    }
    const dayStart = new Date(selectedDay); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(selectedDay); dayEnd.setHours(23, 59, 59, 999);
    return allScheduleItems.filter(it => it.date >= dayStart && it.date <= dayEnd);
  }, [allScheduleItems, selectedDay, filterMode]);

  const upcomingHw = useMemo(
    () => assignments.filter(a => !a.graded).sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0)).slice(0, 5),
    [assignments]
  );
  const pastHw = useMemo(() => assignments.filter(a => a.graded).slice(0, 5), [assignments]);
  const hwList = hwTab === 'upcoming' ? upcomingHw : pastHw;

  // Private tutors grouped for "Active learning" section
  const privateTutors = useMemo(() => {
    const map = {};
    privateLessons.forEach(l => {
      const tid = l.tutor_id || 'unknown';
      if (!map[tid]) map[tid] = { tutor_id: tid, count: 0, nextLesson: null };
      map[tid].count++;
      const d = parseDate(l.scheduled_at);
      if (d && d > new Date()) {
        const cur = map[tid].nextLesson ? parseDate(map[tid].nextLesson.scheduled_at) : null;
        if (!cur || d < cur) map[tid].nextLesson = l;
      }
    });
    return Object.values(map);
  }, [privateLessons]);

  const noEnrollment   = enrolledCourses.length === 0;
  const noLearning     = noEnrollment && privateTutors.length === 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <StudentSidebar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--accent-soft)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <StudentSidebar />

      {showTour && <StudentTour onDismiss={() => setShowTour(false)} />}

      <div className="app-page-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <div className="app-topbar">
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {greeting}, {firstName}!
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{todayStr}</p>
          </div>
          <div className="topbar-right">
            <TopBarActions />
            <div className="sidebar-avatar">{initials}</div>
          </div>
        </div>

        {/* Content */}
        <div className="page-fade" style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>

          {/* Start learning banner */}
          {noLearning && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderRadius: 'var(--r-xl)', background: 'var(--accent)', gap: 16 }}>
              <div>
                <p style={{ margin: '0 0 4px', color: '#fff', fontSize: 15, fontWeight: 700 }}>{t('dashboard.startLearning')}</p>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{t('dashboard.startLearningDesc')}</p>
              </div>
              <Link to="/marketplace"
                style={{ background: '#fff', color: 'var(--accent)', fontSize: 13, fontWeight: 700, padding: '9px 18px', borderRadius: 'var(--r-md)', textDecoration: 'none', flexShrink: 0 }}>
                Find a tutor →
              </Link>
            </div>
          )}

          {/* Schedule */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 20 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t('dashboard.schedule')}</h2>
              <div className="flex items-center gap-1">
                {[
                  { key: '7days',   label: t('dashboard.sevenDays') },
                  { key: 'month',   label: t('dashboard.month') },
                  { key: '3months', label: t('dashboard.threeMonths') },
                ].map(({ key, label }) => (
                  <button key={key}
                    onClick={() => setFilterMode(filterMode === key ? 'day' : key)}
                    className="px-3 py-1 rounded-[8px] text-[12px] font-medium transition-colors"
                    style={filterMode === key
                      ? { backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }
                      : { color: 'var(--muted)' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[#6b6f7d] text-[12px] mb-3">
              {filterMode === 'day'
                ? selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : filterMode === '7days'   ? 'Next 7 days'
                : filterMode === 'month'   ? 'Next 30 days'
                : 'Next 3 months'}
            </p>

            {/* Week strip */}
            <div className="flex items-center gap-2 mb-5">
              <button
                onClick={() => setWeekOffset(o => o - 1)}
                className="flex-shrink-0 flex items-center justify-center rounded-[8px] transition-colors"
                style={{ width: 28, height: 28, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
              >
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" width={10} height={10}>
                  <path d="M8 2L4 6l4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {weekDates.map((d, i) => {
                  const today   = isToday(d);
                  const selDay  = new Date(selectedDay); selDay.setHours(0, 0, 0, 0);
                  const thisDay = new Date(d);            thisDay.setHours(0, 0, 0, 0);
                  const isSelected = filterMode === 'day' && thisDay.getTime() === selDay.getTime();
                  const hasDot  = daysWithEvents.has(thisDay.getTime());
                  return (
                    <button key={i}
                      onClick={() => { const nd = new Date(d); nd.setHours(0, 0, 0, 0); setSelectedDay(nd); setFilterMode('day'); }}
                      className="flex flex-col items-center py-2 rounded-[10px] transition-all relative"
                      style={isSelected ? { backgroundColor: 'var(--accent)' } : today ? { backgroundColor: 'var(--accent-soft)' } : {}}>
                      <span className="text-[11px] font-medium mb-1" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--muted)' }}>
                        {DAYS_SHORT[i]}
                      </span>
                      <span className="text-[15px] font-semibold" style={{ color: isSelected ? '#fff' : today ? 'var(--accent)' : 'var(--text)' }}>
                        {d.getDate()}
                      </span>
                      {hasDot && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full"
                          style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--accent)' }} />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setWeekOffset(o => o + 1)}
                className="flex-shrink-0 flex items-center justify-center rounded-[8px] transition-colors"
                style={{ width: 28, height: 28, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
              >
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" width={10} height={10}>
                  <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Schedule rows */}
            {scheduleItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#6b6f7d] text-[13px]">
                  {t('dashboard.noEvents')}
                </p>
                {noLearning && (
                  <Link to="/marketplace" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginTop: 4, display: 'block' }}>
                    Browse tutors →
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {scheduleItems.map(item => {
                  const todayItem = isToday(item.date);

                  // Type badge
                  const typeBadge =
                    item.type === 'private-lesson' ? { label: t('dashboard.private'),   bg: 'rgba(147,91,245,0.1)',  fg: '#935bf5' }
                    : item.type === 'group-lesson' ? { label: t('dashboard.group'),     bg: 'var(--accent-soft)',    fg: 'var(--accent)' }
                    : null;

                  // Status badge for homework
                  const hwBadge =
                    item.type === 'homework'
                      ? item.status === 'overdue'   ? { label: t('dashboard.overdue'),   bg: '#fff0f0', fg: '#ef4444' }
                        : item.status === 'submitted' ? { label: t('dashboard.submitted'), bg: '#edfbf4', fg: '#22c55e' }
                        : { label: t('dashboard.dueSoon'),  bg: '#fff5ee', fg: '#ff8032' }
                      : null;

                  // Action button for lessons — active 5 min before start until end
                  const isLesson = item.type === 'group-lesson' || item.type === 'private-lesson';
                  const nowMs = Date.now();
                  const lessonEnd = isLesson ? item.date.getTime() + (item.duration || 60) * 60000 : 0;
                  const joinWindowStart = isLesson ? item.date.getTime() - 5 * 60 * 1000 : 0;
                  const canJoin = isLesson && item.videoLink
                    && nowMs >= joinWindowStart && nowMs <= lessonEnd;
                  const isSoon   = isLesson && todayItem && nowMs < joinWindowStart;
                  const isPast   = isLesson && lessonEnd > 0 && nowMs > lessonEnd;

                  return (
                    <div key={item.id} className="flex items-center rounded-[10px] overflow-hidden" style={{ backgroundColor: '#f8f9fc' }}>
                      <div className="w-[3px] self-stretch flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="flex items-center gap-3 flex-1 px-4 py-3">
                        <div className="flex-shrink-0" style={{ width: 52 }}>
                          <p className="text-[11px] font-medium" style={{ color: todayItem ? 'var(--accent)' : 'var(--muted)' }}>
                            {todayItem ? 'Today' : item.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-[13px] font-semibold text-[#0c0d12]">
                            {item.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {typeBadge && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: typeBadge.bg, color: typeBadge.fg }}>
                                {typeBadge.label}
                              </span>
                            )}
                            <p className="text-[13px] font-semibold text-[#0c0d12] truncate">{item.title}</p>
                          </div>
                          <p className="text-[12px] text-[#6b6f7d] truncate">{item.sub}</p>
                        </div>
                        {/* Lesson action */}
                        {isLesson && (
                          canJoin ? (
                            <a href={item.videoLink} target="_blank" rel="noopener noreferrer"
                              className="flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-[8px] border transition-colors"
                              style={{ borderColor: '#22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}>
                              {t('dashboard.join')}
                            </a>
                          ) : item.type === 'private-lesson' && !item.hasLink ? (
                            <span className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-[8px]"
                              style={{ backgroundColor: 'rgba(255,128,50,0.1)', color: '#ff8032' }}>
                              {t('dashboard.pendingLink')}
                            </span>
                          ) : isSoon ? (
                            <span className="flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-[8px] border"
                              style={{ borderColor: 'var(--border-strong)', color: 'var(--muted)' }}>
                              {t('dashboard.soon')}
                            </span>
                          ) : isPast ? (
                            <span className="flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-[8px]"
                              style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--muted)' }}>
                              {t('dashboard.past_label')}
                            </span>
                          ) : !todayItem ? (
                            <span className="flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-[8px] border"
                              style={{ borderColor: 'var(--border-strong)', color: 'var(--muted)' }}>
                              {t('dashboard.upcoming_label')}
                            </span>
                          ) : null
                        )}
                        {/* Homework badge */}
                        {hwBadge && (
                          <span className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: hwBadge.bg, color: hwBadge.fg }}>
                            {hwBadge.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom row */}
          <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Active learning */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 20 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t('dashboard.activeLearning')}</h2>
                <Link to="/student/courses" style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  {t('dashboard.viewAll')}
                </Link>
              </div>

              {noLearning ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <svg viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="1.6" width={20} height={20}>
                      <path d="M3 5h14M3 10h14M3 15h8"/>
                    </svg>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>{t('dashboard.noCourses')}</p>
                  <Link to="/marketplace" style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                    Browse tutors →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group courses */}
                  {enrolledCourses.slice(0, 3).map(enr => {
                    const title = enr.course?.title || 'Course';
                    return (
                      <Link key={enr.id || enr.course_id} to={`/student/courses/${enr.course_id}`}
                        className="flex items-center gap-3 group">
                        <div className="flex-shrink-0 flex items-center justify-center text-white text-[13px] font-bold"
                          style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: enr.color }}>
                          {title[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: 'var(--accent-soft)', color: 'var(--accent)' }}>Group</span>
                            <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                              {title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <ProgressBar value={enr.progress} color={enr.color} />
                            <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: enr.color }}>
                              {enr.progress}%
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}

                  {/* Private tutors */}
                  {privateTutors.slice(0, 2).map(pt => {
                    const next     = pt.nextLesson;
                    const nextDate = next ? parseDate(next.scheduled_at) : null;
                    const hasLink  = !!(next?.video_link);
                    return (
                      <div key={pt.tutor_id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 flex items-center justify-center text-white text-[13px] font-bold"
                          style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#935bf5' }}>
                          T
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[rgba(147,91,245,0.1)] text-[#935bf5]">Private</span>
                            <p className="text-[13px] font-semibold text-[#0c0d12] truncate">Private Tutoring</p>
                          </div>
                          {nextDate ? (
                            <p className="text-[11px] text-[#6b6f7d]">
                              {nextDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                              {' · '}
                              {nextDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          ) : (
                            <p className="text-[11px] text-[#6b6f7d]">{pt.count} session{pt.count !== 1 ? 's' : ''} booked</p>
                          )}
                          {next && (
                            <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={hasLink
                                ? { backgroundColor: 'rgba(34,190,112,0.1)', color: '#22c55e' }
                                : { backgroundColor: 'rgba(255,128,50,0.1)', color: '#ff8032' }}>
                              {hasLink ? t('dashboard.linkReady') : t('dashboard.pendingLink')}
                            </span>
                          )}
                        </div>
                        {next && hasLink && nextDate && (() => {
                          const nowMs = Date.now();
                          const lessonEnd = nextDate.getTime() + (next.duration_minutes || 60) * 60000;
                          const joinWindowStart = nextDate.getTime() - 5 * 60 * 1000;
                          const canJoinNow = nowMs >= joinWindowStart && nowMs <= lessonEnd;
                          return canJoinNow ? (
                            <a href={next.video_link} target="_blank" rel="noopener noreferrer"
                              className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-[8px] border"
                              style={{ borderColor: '#22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}>
                              Join
                            </a>
                          ) : null;
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Homework */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 20 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t('dashboard.homework')}</h2>
                <div className="flex items-center gap-1">
                  <TabBtn active={hwTab === 'upcoming'} onClick={() => setHwTab('upcoming')}>{t('dashboard.upcoming')}</TabBtn>
                  <TabBtn active={hwTab === 'past'}     onClick={() => setHwTab('past')}>{t('dashboard.past')}</TabBtn>
                </div>
              </div>

              {noEnrollment ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-10 h-10 rounded-[10px] bg-[rgba(255,128,50,0.1)] flex items-center justify-center mb-3">
                    <svg viewBox="0 0 20 20" fill="none" stroke="#ff8032" strokeWidth="1.6" className="w-5 h-5">
                      <rect x="4" y="2" width="12" height="16" rx="2"/><path d="M7 7h6M7 10h6M7 13h4"/>
                    </svg>
                  </div>
                  <p className="text-[#6b6f7d] text-[13px]">{t('dashboard.noHomeworkYet')}</p>
                </div>
              ) : hwList.length === 0 ? (
                <p className="text-[#6b6f7d] text-[13px] text-center py-8">
                  {hwTab === 'upcoming' ? t('dashboard.noHomework') : t('dashboard.noGraded')}
                </p>
              ) : (
                <div className="space-y-2">
                  {hwList.map(a => {
                    const status = assignmentStatus(a);
                    const isDone = status === 'graded' || status === 'submitted';
                    const enr    = enrolledCourses.find(e => e.course_id === a.courseId);
                    const color  = enr?.color || '#0d9488';
                    const dueText = a.due_date
                      ? `Due ${new Date(a.due_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`
                      : '';

                    return (
                      <div key={a.id} className="flex items-start gap-3 px-3 py-2.5 rounded-[10px]" style={{ backgroundColor: '#f8f9fc' }}>
                        <CircleIcon done={isDone} color={color} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium"
                            style={{ color: isDone ? 'var(--muted)' : 'var(--text)', textDecoration: isDone ? 'line-through' : 'none' }}>
                            {a.title}
                          </p>
                          <p className="text-[11px] mt-0.5"
                            style={{ color: status === 'overdue' ? 'var(--danger)' : status === 'graded' ? 'var(--success)' : 'var(--muted)' }}>
                            {status === 'graded'
                              ? `Graded${a.score !== undefined ? ` · ${a.score}/100` : ''}`
                              : status === 'submitted'
                              ? 'Submitted · awaiting grade'
                              : dueText}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <Link to="/student/assignments" style={{ display: 'block', textAlign: 'center', fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', marginTop: 12 }}>
                    {t('dashboard.viewAllHomework')}
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
