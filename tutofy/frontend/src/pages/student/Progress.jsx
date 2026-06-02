﻿import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { enrollmentsAPI } from '../../api/enrollments';
import NotificationBell from '../../components/ui/NotificationBell';
import { coursesAPI } from '../../api/courses';
import { progressAPI } from '../../api/progress';
import { lessonsAPI } from '../../api/lessons';

const COURSE_COLORS = [
  { bar: '#0d9488', bg: 'rgba(13,148,136,0.1)',   text: '#0d9488' },
  { bar: '#935bf5', bg: 'rgba(147,91,245,0.1)',   text: '#935bf5' },
  { bar: '#00beb7', bg: 'rgba(0,190,183,0.1)',    text: '#00beb7' },
  { bar: '#ff8032', bg: 'rgba(255,128,50,0.1)',   text: '#ff8032' },
  { bar: '#22c55e', bg: 'rgba(34,190,112,0.1)',   text: '#22c55e' },
];

const ProgressRing = ({ value, size = 80, strokeWidth = 7, color = '#0d9488' }) => {
  const r    = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f7" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={circ - (value / 100) * circ}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
};

const Progress = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();

  const [enrollments,   setEnrollments]   = useState([]);
  const [courses,       setCourses]       = useState([]);
  const [progressData,  setProgressData]  = useState({});
  const [privateLessons, setPrivateLessons] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    const userId = user?.user_id;
    if (!userId) { setLoading(false); return; }

    Promise.all([
      enrollmentsAPI.getUserEnrollments(userId).catch(() => ({})),
      coursesAPI.getAllCourses().catch(() => ({})),
      lessonsAPI.getStudentLessons(userId).catch(() => ({})),
    ]).then(async ([enrRes, coursesRes, privateRes]) => {
      const enrs = enrRes?.enrollments || [];
      const crss = coursesRes?.courses   || [];
      setEnrollments(enrs);
      setCourses(crss);

      // Individual lessons only
      const all = privateRes?.lessons || (Array.isArray(privateRes) ? privateRes : []);
      setPrivateLessons(all.filter(l => !l.course_id && !l.courseId));

      const progressMap = {};
      await Promise.all(
        enrs.map(async enr => {
          try {
            progressMap[enr.course_id] = await progressAPI.getStudentCourseProgress(userId, enr.course_id);
          } catch {
            progressMap[enr.course_id] = null;
          }
        })
      );
      setProgressData(progressMap);
    }).finally(() => setLoading(false));
  }, [user]);

  const enriched = useMemo(() =>
    enrollments.map((enr, i) => {
      const course             = courses.find(c => c.id === enr.course_id) || {};
      const pd                 = progressData[enr.course_id];
      const lessonsCompleted   = pd?.completed_lessons ?? 0;
      const totalLessons       = pd?.total_lessons ?? 0;
      const totalPlanned       = pd?.total_planned_lessons ?? 0;
      const availablePct       = pd?.available_pct ?? 0;
      const overallPct         = pd?.overall_pct ?? 0;
      const progress           = pd
        ? (totalPlanned > 0 ? overallPct : availablePct)
        : (enr.progress ?? 0);
      return { ...enr, course, progress, availablePct, overallPct, lessonsCompleted, totalLessons, totalPlanned, colorIdx: i % COURSE_COLORS.length };
    }),
  [enrollments, courses, progressData]);

  const avgProgress          = enriched.length > 0
    ? Math.round(enriched.reduce((a, e) => a + e.progress, 0) / enriched.length)
    : 0;
  const completedCount       = enriched.filter(e => e.progress >= 100).length;
  const inProgressCount      = enriched.filter(e => e.progress > 0 && e.progress < 100).length;
  const totalLessonsCompleted = enriched.reduce((a, e) => a + e.lessonsCompleted, 0);

  // Private lesson stats
  const privateCompleted = privateLessons.filter(l => l.status === 2 || l.status === 'completed').length;

  const stats = [
    { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M8 3v14M4 7h4M4 11h4" strokeLinecap="round"/></svg>, label: 'Courses enrolled',    value: enriched.length,      color: '#0d9488' },
    { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M10 3L2 7l8 4 8-4-8-4z"/><path d="M2 7v6M6 9.5v4a4 4 0 008 0v-4" strokeLinecap="round"/></svg>, label: 'Private sessions',    value: privateLessons.length, color: '#935bf5' },
    { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><circle cx="10" cy="10" r="8"/><path d="M6 10l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Courses completed',   value: completedCount,        color: '#22c55e' },
    { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M2 4a1 1 0 011-1h5a3 3 0 013 3v11a3 3 0 00-3-3H3a1 1 0 01-1-1V4zM18 4a1 1 0 00-1-1h-5a3 3 0 00-3 3v11a3 3 0 013-3h5a1 1 0 001-1V4z"/></svg>, label: 'Lessons done',        value: totalLessonsCompleted || '-', color: '#ff8032' },
  ];

  const hasAnything = enriched.length > 0 || privateLessons.length > 0;

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-7 justify-between flex-shrink-0">
          <div>
            <p className="text-[#0c0d12] text-[17px] font-bold">My Progress</p>
            <p className="text-[#6b6f7d] text-[12px]">Track your overall learning journey</p>
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

        <div className="flex-1 p-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-5 mb-6">
            {stats.map(stat => (
              <div key={stat.label} className="bg-white rounded-[14px] border border-[#f0f0f5] p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-[22px] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${stat.color}18`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-[22px] font-bold leading-none mb-1" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[#6b6f7d] text-[12px]">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !hasAnything ? (
            <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><path d="M3 17V9M7 17V5M11 17v-6M15 17V7" strokeLinecap="round"/></svg>
              </div>
              <p className="text-[#0c0d12] text-[17px] font-semibold mb-2">No progress yet</p>
              <p className="text-[#6b6f7d] text-[14px] mb-6">Enroll in a course or book a private lesson to start tracking</p>
              <Link to="/tutors"
                className="bg-[#0d9488] text-white text-[14px] font-semibold px-6 py-3 rounded-[10px] hover:opacity-90 transition-opacity">
                Find a Tutor
              </Link>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Course progress section */}
              {enriched.length > 0 && (
                <div className="grid grid-cols-3 gap-6">
                  {/* Overall ring */}
                  <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-6 flex flex-col items-center justify-center">
                    <p className="text-[#0c0d12] text-[15px] font-semibold mb-5">Course Progress</p>
                    <div className="relative w-20 h-20 mb-4">
                      <ProgressRing value={avgProgress} color="#0d9488" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[#0c0d12] text-[16px] font-bold">{avgProgress}%</span>
                      </div>
                    </div>
                    <p className="text-[#6b6f7d] text-[13px]">Across {enriched.length} course{enriched.length !== 1 ? 's' : ''}</p>
                    <div className="mt-5 w-full space-y-2">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#6b6f7d]">Completed</span>
                        <span className="text-[#22be70] font-semibold">{completedCount}</span>
                      </div>
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#6b6f7d]">In Progress</span>
                        <span className="text-[#0d9488] font-semibold">{inProgressCount}</span>
                      </div>
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#6b6f7d]">Not Started</span>
                        <span className="text-[#6b6f7d] font-semibold">{enriched.length - completedCount - inProgressCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Course list */}
                  <div className="col-span-2 bg-white rounded-[16px] border border-[#f0f0f5] p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-[#0c0d12] text-[15px] font-semibold">Course breakdown</h2>
                      <Link to="/student/courses" className="text-[#0d9488] text-[12px] font-medium hover:underline">View courses →</Link>
                    </div>
                    <div className="space-y-4">
                      {enriched.map(enr => {
                        const c       = COURSE_COLORS[enr.colorIdx];
                        const initial = (enr.course?.title || 'CO').slice(0, 2).toUpperCase();
                        const showDual = enr.totalPlanned > 0;
                        return (
                          <div key={enr.id} className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: c.bg }}>
                              <span className="text-[12px] font-bold" style={{ color: c.text }}>{initial}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[#0c0d12] text-[13px] font-semibold truncate mr-2">
                                  {enr.course?.title || `Course ${enr.colorIdx + 1}`}
                                </p>
                                <span className="text-[12px] font-bold flex-shrink-0" style={{ color: c.text }}>
                                  {Math.round(enr.progress)}%
                                </span>
                              </div>

                              {showDual ? (
                                <div className="space-y-1.5">
                                  <div>
                                    <div className="flex justify-between text-[10px] text-[#6b6f7d] mb-0.5">
                                      <span>Overall progress</span>
                                      <span>{Math.round(enr.overallPct)}% of {enr.totalPlanned} lessons</span>
                                    </div>
                                    <div className="w-full bg-[#f3f4f7] rounded-full h-[5px]">
                                      <div className="h-[5px] rounded-full transition-all"
                                        style={{ width: `${Math.min(100, enr.overallPct)}%`, backgroundColor: c.bar }} />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-[10px] text-[#6b6f7d] mb-0.5">
                                      <span>Available content</span>
                                      <span>{enr.lessonsCompleted}/{enr.totalLessons} uploaded</span>
                                    </div>
                                    <div className="w-full bg-[#f3f4f7] rounded-full h-[5px]">
                                      <div className="h-[5px] rounded-full transition-all"
                                        style={{ width: `${Math.min(100, enr.availablePct)}%`, backgroundColor: '#935bf5' }} />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="w-full bg-[#f3f4f7] rounded-full h-[6px]">
                                    <div className="h-[6px] rounded-full transition-all"
                                      style={{ width: `${Math.min(100, enr.availablePct)}%`, backgroundColor: c.bar }} />
                                  </div>
                                  {enr.totalLessons > 0 && (
                                    <p className="text-[#6b6f7d] text-[11px] mt-1">
                                      {enr.lessonsCompleted} of {enr.totalLessons} lessons completed
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5"
                              style={
                                enr.progress >= 100
                                  ? { backgroundColor: 'rgba(34,190,112,0.15)', color: '#22c55e' }
                                  : enr.progress > 0
                                  ? { backgroundColor: 'rgba(13,148,136,0.1)',   color: '#0d9488' }
                                  : { backgroundColor: '#f8f9fc',                color: '#6b6f7d' }
                              }>
                              {enr.progress >= 100 ? 'Done' : enr.progress > 0 ? 'Active' : 'New'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Private lessons section */}
              {privateLessons.length > 0 && (
                <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[#0c0d12] text-[15px] font-semibold">Private lessons</h2>
                    <Link to="/student/courses" className="text-[#0d9488] text-[12px] font-medium hover:underline">View all →</Link>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="px-4 py-3 rounded-[10px] border border-[#f0f0f5] bg-[var(--bg)]">
                      <p className="text-[22px] font-bold text-[#935bf5] leading-none">{privateLessons.length}</p>
                      <p className="text-[#6b6f7d] text-[12px] mt-1">Sessions booked</p>
                    </div>
                    <div className="px-4 py-3 rounded-[10px] border border-[#f0f0f5] bg-[var(--bg)]">
                      <p className="text-[22px] font-bold text-[#22be70] leading-none">{privateCompleted}</p>
                      <p className="text-[#6b6f7d] text-[12px] mt-1">Completed</p>
                    </div>
                    <div className="px-4 py-3 rounded-[10px] border border-[#f0f0f5] bg-[var(--bg)]">
                      <p className="text-[22px] font-bold text-[#ff8032] leading-none">
                        {privateLessons.filter(l => {
                          const d = l.scheduled_at ? new Date(String(l.scheduled_at).replace(' ', 'T')) : null;
                          return d && d > new Date();
                        }).length}
                      </p>
                      <p className="text-[#6b6f7d] text-[12px] mt-1">Upcoming</p>
                    </div>
                  </div>
                  {/* TODO: enrich private lesson cards with tutor names via user service */}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Progress;
