﻿import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { enrollmentsAPI } from '../../api/enrollments';
import NotificationBell from '../../components/ui/NotificationBell';
import { coursesAPI } from '../../api/courses';
import { lessonsAPI } from '../../api/lessons';
import { progressAPI } from '../../api/progress';

const COLORS = ['#0d9488', '#935bf5', '#00beb7', '#ff8032', '#22c55e'];

function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'object' && val.seconds != null) return new Date(Number(val.seconds) * 1000);
  const d = new Date(String(val).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

function isDateToday(d) {
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

const ProgressBar = ({ value, color }) => (
  <div className="w-full bg-[#f0f0f5] rounded-full h-[6px]">
    <div className="h-[6px] rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }} />
  </div>
);

const courseBadge = (progress, lessonCount, startDate) => {
  if (progress >= 100) return { label: 'Completed',  bg: '#edfbf4',                  color: '#22c55e' };
  if (progress > 0)    return { label: 'In Progress', bg: 'rgba(13,148,136,0.08)',    color: '#0d9488' };
  if (startDate) {
    const d = parseDate(startDate);
    if (d && d > new Date()) return { label: 'Upcoming',   bg: 'rgba(147,91,245,0.08)', color: '#935bf5' };
  }
  if (lessonCount > 0) return { label: 'Available',  bg: 'rgba(255,128,50,0.08)',    color: '#ff8032' };
  return                      { label: 'Not Started', bg: '#f8f9fc',                  color: '#6b6f7d' };
};

const TabBtn = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-[10px] text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
      active ? 'bg-[#0d9488] text-white' : 'bg-white text-[#6b6f7d] border border-[#f0f0f5] hover:text-[#0c0d12]'
    }`}
  >
    {children}
    {count > 0 && (
      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
        active ? 'bg-white/20 text-white' : 'bg-[#f0f0f5] text-[#6b6f7d]'
      }`}>{count}</span>
    )}
  </button>
);

const MyCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.user_id;

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [lessonCounts, setLessonCounts]       = useState({});
  const [firstLessons, setFirstLessons]       = useState({});
  const [privateLessons, setPrivateLessons]   = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [tab, setTab]                         = useState('all');

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        const [enrRes, coursesRes, privateRes] = await Promise.all([
          enrollmentsAPI.getUserEnrollments(userId).catch(() => ({})),
          coursesAPI.getAllCourses().catch(() => ({})),
          lessonsAPI.getStudentLessons(userId).catch(() => ({})),
        ]);

        const enrollments = enrRes?.enrollments || [];
        const allCourses  = coursesRes?.courses  || [];

        // Individual lessons = lessons without a course_id
        const allStudentLessons = privateRes?.lessons || (Array.isArray(privateRes) ? privateRes : []);
        setPrivateLessons(allStudentLessons.filter(l => !l.course_id && !l.courseId));

        const joined = enrollments.map((enr, i) => ({
          ...enr,
          course:   allCourses.find(c => c.id === enr.course_id) || {},
          progress: enr.progress || 0,
          color:    COLORS[i % COLORS.length],
        }));
        setEnrolledCourses(joined);

        const courseIds = enrollments.map(e => e.course_id).filter(Boolean);
        if (courseIds.length) {
          const [counts, progressResults] = await Promise.all([
            Promise.all(
              courseIds.map(id =>
                lessonsAPI.getCourseLessons(id)
                  .then(r => {
                    const arr = Array.isArray(r?.lessons || r) ? (r?.lessons || r) : [];
                    const sorted = [...arr].sort((a, b) => {
                      const ms = v => {
                        if (!v) return 0;
                        if (typeof v === 'object' && v.seconds != null) return Number(v.seconds) * 1000;
                        return new Date(String(v).replace(' ', 'T')).getTime() || 0;
                      };
                      return ms(a.scheduled_at) - ms(b.scheduled_at);
                    });
                    return { id, count: sorted.length, firstId: sorted[0]?.id || null };
                  })
                  .catch(() => ({ id, count: 0, firstId: null }))
              )
            ),
            Promise.all(
              courseIds.map(id =>
                progressAPI.getStudentCourseProgress(userId, id)
                  .then(r => ({ id, pct: Math.round(r?.percentage ?? r?.available_pct ?? 0) }))
                  .catch(() => ({ id, pct: 0 }))
              )
            ),
          ]);
          setLessonCounts(Object.fromEntries(counts.map(c => [c.id, c.count])));
          setFirstLessons(Object.fromEntries(counts.map(c => [c.id, c.firstId])));

          const progressMap = Object.fromEntries(progressResults.map(p => [p.id, p.pct]));
          setEnrolledCourses(prev => prev.map(e => ({ ...e, progress: progressMap[e.course_id] ?? e.progress })));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Group individual lessons by tutor to form "private tutoring" cards
  const privateTutors = useMemo(() => {
    const map = {};
    privateLessons.forEach(l => {
      const tid = l.tutor_id || 'unknown';
      if (!map[tid]) map[tid] = { tutor_id: tid, lessons: [], nextLesson: null };
      map[tid].lessons.push(l);
      const d = parseDate(l.scheduled_at);
      if (d && d > new Date()) {
        const cur = map[tid].nextLesson ? parseDate(map[tid].nextLesson.scheduled_at) : null;
        if (!cur || d < cur) map[tid].nextLesson = l;
      }
    });
    return Object.values(map);
  }, [privateLessons]);

  const stats = useMemo(() => {
    const completed  = enrolledCourses.filter(e => e.progress >= 100).length;
    const inProgress = enrolledCourses.filter(e => e.progress > 0 && e.progress < 100).length;
    const avg = enrolledCourses.length
      ? Math.round(enrolledCourses.reduce((s, e) => s + e.progress, 0) / enrolledCourses.length)
      : 0;
    return [
      { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M8 3v14M4 7h4M4 11h4" strokeLinecap="round"/></svg>, label: 'Courses',         value: enrolledCourses.length, color: '#0d9488' },
      { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M10 3L2 7l8 4 8-4-8-4z"/><path d="M2 7v6M6 9.5v4a4 4 0 008 0v-4" strokeLinecap="round"/></svg>, label: 'Private Tutors',  value: privateTutors.length,   color: '#935bf5' },
      { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><circle cx="10" cy="10" r="8"/><path d="M6 10l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Completed',       value: completed,               color: '#22c55e' },
      { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M3 17V9M7 17V5M11 17v-6M15 17V7" strokeLinecap="round"/></svg>, label: 'Avg Progress',    value: `${avg}%`,              color: '#ff8032' },
    ];
  }, [enrolledCourses, privateTutors]);

  const displayItems = useMemo(() => {
    if (tab === 'courses')   return { courses: enrolledCourses, tutors: [] };
    if (tab === 'private')   return { courses: [], tutors: privateTutors };
    if (tab === 'completed') return { courses: enrolledCourses.filter(e => e.progress >= 100), tutors: [] };
    return { courses: enrolledCourses, tutors: privateTutors };
  }, [tab, enrolledCourses, privateTutors]);

  const hasAny = enrolledCourses.length > 0 || privateTutors.length > 0;

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-7 justify-between flex-shrink-0">
          <div>
            <p className="text-[#0c0d12] text-[17px] font-bold leading-tight">Learning</p>
            <p className="text-[#6b6f7d] text-[12px]">Manage your courses and private lessons</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="w-9 h-9 rounded-full bg-[rgba(13,148,136,0.12)] flex items-center justify-center">
              <span className="text-[#0d9488] text-[12px] font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(s => (
              <div key={s.label} className="bg-white rounded-[16px] border border-[#f0f0f5] p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-[#0c0d12] text-[22px] font-bold leading-none">{s.value}</p>
                  <p className="text-[#6b6f7d] text-[11px] mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <TabBtn active={tab === 'all'}       onClick={() => setTab('all')}>All</TabBtn>
            <TabBtn active={tab === 'courses'}   onClick={() => setTab('courses')}   count={enrolledCourses.length}>Courses</TabBtn>
            <TabBtn active={tab === 'private'}   onClick={() => setTab('private')}   count={privateTutors.length}>Private Lessons</TabBtn>
            <TabBtn active={tab === 'completed'} onClick={() => setTab('completed')}>Completed</TabBtn>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !hasAny ? (
            <div className="bg-white rounded-[20px] border border-[#f0f0f5] p-14 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M8 3v14M4 7h4M4 11h4" strokeLinecap="round"/></svg>
              </div>
              <p className="text-[#0c0d12] text-[17px] font-bold mb-2">Start learning today</p>
              <p className="text-[#6b6f7d] text-[14px] mb-6">
                Enroll in a course or book a private lesson to begin your learning journey.
              </p>
              <Link to="/tutors"
                className="inline-block bg-[#0d9488] text-white font-semibold text-[14px] px-6 py-3 rounded-[10px] hover:bg-[#0f766e] transition-colors">
                Find a Tutor →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Group course cards */}
              {displayItems.courses.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {displayItems.courses.map(enr => {
                    const { color, course, progress } = enr;
                    const count      = lessonCounts[enr.course_id] || 0;
                    const badge      = courseBadge(progress, count, course?.start_date);
                    const title      = course?.title || 'Course';
                    const firstId    = firstLessons[enr.course_id];
                    const href       = firstId
                      ? `/student/courses/${enr.course_id}/lessons/${firstId}`
                      : `/student/courses/${enr.course_id}`;

                    return (
                      <div key={enr.id || enr.course_id}
                        className="bg-white rounded-[16px] border border-[#f0f0f5] p-5 hover:border-[#0d9488]/30 hover:shadow-[0_4px_20px_0_rgba(13,148,136,0.08)] transition-all">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 text-white font-bold text-[16px]"
                            style={{ backgroundColor: color }}>
                            {title[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="text-[#0c0d12] text-[14px] font-bold truncate">{title}</h3>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(13,148,136,0.08)] text-[#0d9488]">
                                  Group
                                </span>
                                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                  style={{ backgroundColor: badge.bg, color: badge.color }}>
                                  {badge.label}
                                </span>
                              </div>
                            </div>
                            <p className="text-[#6b6f7d] text-[12px]">
                              {count > 0 ? `${count} lesson${count !== 1 ? 's' : ''}` : 'No lessons yet'}
                              {course?.tutor_name ? ` · ${course.tutor_name}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[#6b6f7d] text-[12px]">Progress</span>
                            <span className="text-[12px] font-semibold" style={{ color }}>{progress}%</span>
                          </div>
                          <ProgressBar value={progress} color={color} />
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-[#6b6f7d] text-[12px] truncate pr-3">
                            {course?.description
                              ? course.description.slice(0, 50) + (course.description.length > 50 ? '…' : '')
                              : 'Continue your learning journey'}
                          </p>
                          <Link to={`/student/courses/${enr.course_id}`}
                            className="text-[12px] font-semibold px-4 py-1.5 rounded-[8px] flex-shrink-0 transition-colors"
                            style={{ backgroundColor: `${color}18`, color }}>
                            {progress > 0 ? 'Continue →' : 'Start →'}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Divider when both sections show */}
              {tab === 'all' && displayItems.courses.length > 0 && displayItems.tutors.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#f0f0f5]" />
                  <span className="text-[12px] text-[#6b6f7d] font-medium px-2">Private Lessons</span>
                  <div className="h-px flex-1 bg-[#f0f0f5]" />
                </div>
              )}

              {/* Private tutoring cards */}
              {displayItems.tutors.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {displayItems.tutors.map((tutorGroup) => {
                    const next     = tutorGroup.nextLesson;
                    const nextDate = next ? parseDate(next.scheduled_at) : null;
                    const count    = tutorGroup.lessons.length;
                    const color    = '#935bf5';

                    // Sort lessons: upcoming first, then past
                    const sortedLessons = [...tutorGroup.lessons].sort((a, b) => {
                      const da = parseDate(a.scheduled_at), db = parseDate(b.scheduled_at);
                      return (da?.getTime() || 0) - (db?.getTime() || 0);
                    });

                    return (
                      <div key={tutorGroup.tutor_id}
                        className="bg-white rounded-[16px] border border-[#f0f0f5] p-5 hover:border-[#935bf5]/30 hover:shadow-[0_4px_20px_0_rgba(147,91,245,0.08)] transition-all">

                        {/* Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 text-white font-bold text-[16px]"
                            style={{ backgroundColor: color }}>
                            T
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="text-[#0c0d12] text-[14px] font-bold truncate">Private Tutoring</h3>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(147,91,245,0.1)] text-[#935bf5] flex-shrink-0">
                                Private
                              </span>
                            </div>
                            <p className="text-[#6b6f7d] text-[12px]">
                              {count} session{count !== 1 ? 's' : ''} booked
                            </p>
                          </div>
                        </div>

                        {/* Lesson list */}
                        <div className="space-y-2 mb-4">
                          {sortedLessons.slice(0, 3).map(lesson => {
                            const d        = parseDate(lesson.scheduled_at);
                            const hasLink  = !!(lesson.video_link);
                            const isPast   = d && d < new Date();
                            const isNow    = d && isDateToday(d);
                            const isDone   = lesson.status === 2 || lesson.status === 'completed';
                            const isCxl    = lesson.status === 3 || lesson.status === 'cancelled';

                            const statusCfg = isDone ? { label: 'Completed', bg: 'rgba(34,190,112,0.1)',   fg: '#22c55e' }
                              : isCxl        ? { label: 'Cancelled',  bg: 'rgba(242,69,69,0.1)',   fg: '#ef4444' }
                              : hasLink      ? { label: 'Link ready', bg: 'rgba(34,190,112,0.1)',   fg: '#22c55e' }
                              : isPast       ? { label: 'Pending link',bg: 'rgba(255,128,50,0.1)', fg: '#ff8032' }
                              :                { label: 'Pending link',bg: 'rgba(255,128,50,0.1)', fg: '#ff8032' };

                            return (
                              <div key={lesson.id}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-[10px]"
                                style={{ backgroundColor: 'rgba(147,91,245,0.04)', border: '1px solid rgba(147,91,245,0.1)' }}>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-[#0c0d12] truncate">{lesson.title || 'Private lesson'}</p>
                                  <p className="text-[11px] text-[#6b6f7d] mt-0.5">
                                    {d
                                      ? `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                                      : 'Time not set'}
                                    {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ''}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: statusCfg.bg, color: statusCfg.fg }}>
                                    {statusCfg.label}
                                  </span>
                                  {hasLink && (isNow || !isPast) && !isDone && !isCxl && (
                                    <a href={lesson.video_link} target="_blank" rel="noopener noreferrer"
                                      className="text-[11px] font-semibold px-2.5 py-1 rounded-[7px] border transition-colors"
                                      style={{ borderColor: '#22c55e', color: '#22c55e' }}>
                                      Join
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {sortedLessons.length > 3 && (
                            <p className="text-[11px] text-[#6b6f7d] text-center pt-1">
                              +{sortedLessons.length - 3} more session{sortedLessons.length - 3 !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Link to="/student/messages"
                            className="flex-1 text-center text-[12px] font-semibold px-3 py-1.5 rounded-[8px] border border-[#f0f0f5] text-[#383a44] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors">
                            Message
                          </Link>
                          <Link to="/tutors"
                            className="flex-1 text-center text-[12px] font-semibold px-3 py-1.5 rounded-[8px] transition-colors"
                            style={{ backgroundColor: 'rgba(147,91,245,0.08)', color }}>
                            Book lesson →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state for specific tab */}
              {displayItems.courses.length === 0 && displayItems.tutors.length === 0 && (
                <div className="bg-white rounded-[20px] border border-[#f0f0f5] p-12 text-center">
                  <p className="text-[#6b6f7d] text-[14px] mb-4">
                    {tab === 'completed' ? 'No completed courses yet - keep going!'
                      : tab === 'private' ? 'No private lessons booked yet.'
                      : 'Nothing here yet.'}
                  </p>
                  {tab !== 'completed' && (
                    <Link to="/tutors" className="text-[#0d9488] text-[13px] font-semibold hover:underline">
                      Find a tutor →
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CTA banner */}
          {!loading && hasAny && (
            <div className="bg-gradient-to-r from-[#0d9488] to-[#7a5af8] rounded-[20px] p-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-white text-[16px] font-bold mb-1">Want to learn more?</p>
                <p className="text-white/75 text-[13px]">Browse our marketplace and find your next tutor or course.</p>
              </div>
              <Link to="/tutors"
                className="bg-white text-[#0d9488] font-bold text-[13px] px-5 py-2.5 rounded-[10px] hover:bg-gray-50 transition-colors flex-shrink-0">
                Find a Tutor →
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MyCourses;
