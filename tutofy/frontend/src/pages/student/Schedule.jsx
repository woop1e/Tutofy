﻿import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { enrollmentsAPI } from '../../api/enrollments';
import { coursesAPI } from '../../api/courses';
import { lessonsAPI } from '../../api/lessons';
import { usersAPI } from '../../api/users';
import NotificationBell from '../../components/ui/NotificationBell';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ACCENT_COLORS = [
  'border-[#ef4444]',
  'border-[#ffa61a]',
  'border-primary',
  'border-purple',
  'border-teal',
];

function getWeekDates(offset = 0) {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const Schedule = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();

  const [enrollments, setEnrollments]       = useState([]);
  const [courses, setCourses]               = useState([]);
  const [myLessons, setMyLessons]           = useState([]);
  const [usersMap, setUsersMap]             = useState({});
  const [tutorProfileMap, setTutorProfileMap] = useState({});
  const [loading, setLoading]               = useState(true);
  const [view, setView] = useState('Week');
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    const userId = user?.user_id;
    if (!userId) { setLoading(false); return; }
    Promise.all([
      enrollmentsAPI.getUserEnrollments(userId).catch(() => ({})),
      coursesAPI.getAllCourses().catch(() => ({})),
      lessonsAPI.getStudentLessons(userId).catch(() => ({})),
      usersAPI.getAllUsers().catch(() => ({})),
    ]).then(async ([enrRes, coursesRes, lessonsRes, usersRes]) => {
      setEnrollments(enrRes?.enrollments || []);
      setCourses(coursesRes?.courses   || []);
      const lessons = lessonsRes?.lessons || (Array.isArray(lessonsRes) ? lessonsRes : []);
      setMyLessons(lessons);
      const uMap = {};
      (usersRes?.users || []).forEach(u => { uMap[u.id] = u; });
      setUsersMap(uMap);

      // Fetch tutor profiles for individual lessons so we have hourly_price
      const tutorIds = [...new Set(lessons.map(l => l.tutor_id).filter(Boolean))];
      const profiles = await Promise.all(
        tutorIds.map(id => usersAPI.getTutorProfile(id).catch(() => null))
      );
      const tpMap = {};
      tutorIds.forEach((id, i) => { if (profiles[i]) tpMap[id] = profiles[i]; });
      setTutorProfileMap(tpMap);
    }).finally(() => setLoading(false));
  }, [user]);

  const weekDates = getWeekDates(weekOffset);
  const todayDay = new Date().getDay();
  const activeIdx = (todayDay + 6) % 7;

  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  const sessions = enrollments.map((enr, i) => {
    const course = courses.find((c) => c.id === enr.course_id) || {};
    const tutorName = usersMap[course.tutor_id]?.name || course.tutor_name || '';
    const tutorInitials = tutorName
      ? tutorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      : 'TU';
    return {
      id: enr.id || i,
      course_id: enr.course_id,
      tutorName,
      tutorInitials,
      courseName: course.title || `Course ${i + 1}`,
      topic: course.description || 'Session',
      colorIdx: i % ACCENT_COLORS.length,
    };
  });

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white h-[68px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)] flex items-center px-7 justify-between flex-shrink-0">
          <div>
            <p className="text-dark text-[20px] font-bold">Schedule</p>
            <p className="text-muted text-[13px]">Manage your upcoming sessions</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-[12px] font-semibold">
                {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'S'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="bg-white shadow-[0px_1px_4px_0px_rgba(0,0,0,0.04)] flex items-end px-7 flex-shrink-0">
          {['Today', 'Week', 'Month'].map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`px-5 py-3.5 text-[15px] relative transition-colors ${
                view === tab ? 'text-primary font-semibold' : 'text-muted hover:text-body'
              }`}
            >
              {tab}
              {view === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6">
          {/* Week navigation */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-body text-[15px] font-medium">{weekLabel}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-body hover:text-primary transition-colors"
              >
                ←
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="px-4 py-1.5 bg-white rounded-[8px] shadow-sm text-body text-[13px] font-medium hover:text-primary transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setWeekOffset((o) => o + 1)}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-body hover:text-primary transition-colors"
              >
                →
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04)] grid grid-cols-7 mb-4 overflow-hidden">
            {DAYS.map((day, i) => {
              const date = weekDates[i];
              const isToday = weekOffset === 0 && i === activeIdx;
              return (
                <div key={day} className={`py-3 text-center ${isToday ? 'bg-primary' : ''}`}>
                  <p className={`text-[11px] font-medium mb-1 ${isToday ? 'text-[#e5e5ff]' : 'text-muted'}`}>
                    {day}
                  </p>
                  <p className={`text-[16px] ${isToday ? 'font-bold text-white' : 'font-semibold text-dark'}`}>
                    {date.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Individual Lessons */}
          {!loading && myLessons.length > 0 && (
            <div className="mb-5">
              <h2 className="text-dark text-[16px] font-bold mb-3">Individual Lessons</h2>
              <div className="space-y-3">
                {myLessons.map((lesson) => {
                  const start = lesson.scheduled_at ? new Date(
                    typeof lesson.scheduled_at === 'object' && lesson.scheduled_at.seconds
                      ? lesson.scheduled_at.seconds * 1000
                      : lesson.scheduled_at
                  ) : null;
                  const end = start ? new Date(start.getTime() + (lesson.duration_minutes || 60) * 60000) : null;
                  const statusRaw = (lesson.status || '').toString().toLowerCase();
                  const statusNum = parseInt(lesson.status, 10);
                  const isPending       = statusRaw.includes('pending')  || statusNum === 4;
                  const isAwaitPay      = statusRaw.includes('awaiting') || statusNum === 5;
                  const isPlanned       = statusRaw.includes('planned')  || statusNum === 1;
                  const isExpired       = statusNum === 6;

                  const payDeadline = lesson.payment_deadline
                    ? new Date(
                        typeof lesson.payment_deadline === 'object' && lesson.payment_deadline.seconds
                          ? lesson.payment_deadline.seconds * 1000
                          : lesson.payment_deadline
                      )
                    : null;
                  const msLeft = payDeadline ? payDeadline.getTime() - Date.now() : null;
                  const hoursLeft = msLeft !== null ? Math.floor(msLeft / 3600000) : null;
                  const minsLeft  = msLeft !== null ? Math.floor((msLeft % 3600000) / 60000) : null;
                  const deadlineCountdown = (isAwaitPay && msLeft !== null && msLeft > 0)
                    ? (hoursLeft > 0 ? `Pay within ${hoursLeft}h ${minsLeft}m` : `Pay within ${minsLeft}m`)
                    : null;

                  // Join button: only for confirmed (status 1) + video_link + starts within 15 min
                  const nowMs = Date.now();
                  const joinWindowStart = start ? start.getTime() - 15 * 60 * 1000 : null;
                  const canJoin = isPlanned && !!lesson.video_link && joinWindowStart !== null
                    && nowMs >= joinWindowStart && end && nowMs <= end.getTime();

                  const statusLabel = isPending  ? 'Awaiting confirmation'
                    : isAwaitPay ? 'Payment required'
                    : isExpired  ? 'Payment expired'
                    : isPlanned  ? 'Confirmed'
                    : lesson.status_name || lesson.status || 'Booked';

                  const borderColor = isExpired ? '#ef4444' : isAwaitPay ? '#f59e0b' : '#0d9488';
                  const iconColor   = borderColor;
                  const statusColor = isPending  ? 'bg-[#ff8032]/10 text-[#ff8032]'
                    : isAwaitPay ? 'bg-[#f59e0b]/10 text-[#92400e]'
                    : isExpired  ? 'bg-[#ef4444]/10 text-[#ef4444]'
                    : 'bg-[#22be70]/10 text-[#22be70]';

                  return (
                    <div key={lesson.id} className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] p-5 flex items-center gap-4 border-l-4" style={{ borderColor }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconColor + '20' }}>
                        <svg viewBox="0 0 20 20" fill="none" stroke={iconColor} strokeWidth="1.5" className="w-6 h-6">
                          <rect x="1" y="4" width="10" height="8" rx="1.5"/><path d="M11 7l4-2v6l-4-2"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-dark text-[15px] font-semibold truncate">{lesson.title || 'Individual lesson'}</p>
                        {start && (
                          <p className="text-muted text-[13px] mt-0.5">
                            {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })},&nbsp;
                            {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            {end && ` – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`inline-block text-[11px] font-semibold px-3 py-1 rounded-full ${statusColor}`}>
                            {statusLabel}
                          </span>
                          {deadlineCountdown && (
                            <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full bg-[#f59e0b]/10 text-[#92400e]">
                              {deadlineCountdown}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isExpired ? (
                          <span className="text-[13px] font-semibold px-5 py-2.5 rounded-[10px] bg-[#ef4444]/10 text-[#ef4444]">
                            Expired
                          </span>
                        ) : canJoin ? (
                          <a
                            href={lesson.video_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#22be70] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity"
                          >
                            Join
                          </a>
                        ) : isAwaitPay ? (
                          <Link
                            to={(() => {
                              const lessonPrice = lesson.price || tutorProfileMap[lesson.tutor_id]?.hourly_price || 0;
                              return `/payment?lesson_mode=true&lesson_id=${lesson.id}&amount=${lessonPrice}&title=${encodeURIComponent(lesson.title || '')}`;
                            })()}
                            className="bg-[#f59e0b] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity"
                          >
                            Pay
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sessions List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><rect x="2" y="4" width="16" height="14" rx="1.5"/><path d="M6 2v4M14 2v4M2 9h16" strokeLinecap="round"/></svg>
              </div>
              <p className="text-dark text-[17px] font-semibold mb-2">No sessions scheduled</p>
              <p className="text-muted text-[14px] mb-6">
                Enroll in courses to see your upcoming sessions here
              </p>
              <Link
                to="/tutors"
                className="bg-primary text-white text-[14px] font-semibold px-6 py-3 rounded-[10px] hover:opacity-90 transition-opacity"
              >
                Find a Tutor
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] p-5 flex items-center gap-4 border-l-4 ${ACCENT_COLORS[session.colorIdx]}`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-[14px] font-bold">{session.tutorInitials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-dark text-[15px] font-semibold">{session.tutorName}</p>
                    <p className="text-muted text-[13px]">{session.courseName}</p>
                    <p className="text-body text-[13px] mt-0.5 truncate">{session.topic}</p>
                    <span className="mt-2 inline-block bg-primary/10 text-primary text-[11px] font-medium px-3 py-1 rounded-full">
                      Enrolled
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    <Link
                      to={`/student/courses/${session.course_id}`}
                      className="bg-primary text-white text-[13px] font-semibold px-5 py-2.5 rounded-[10px] shadow-[0px_4px_12px_0px_rgba(76,110,255,0.25)] hover:opacity-90 transition-opacity"
                    >
                      View Course
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
