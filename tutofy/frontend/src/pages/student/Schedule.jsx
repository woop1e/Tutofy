﻿import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { enrollmentsAPI } from '../../api/enrollments';
import { coursesAPI } from '../../api/courses';

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

  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
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
    ]).then(([enrRes, coursesRes]) => {
      setEnrollments(enrRes?.enrollments || []);
      setCourses(coursesRes?.courses   || []);
    }).finally(() => setLoading(false));
  }, [user]);

  const weekDates = getWeekDates(weekOffset);
  const todayDay = new Date().getDay();
  const activeIdx = (todayDay + 6) % 7;

  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  const sessions = enrollments.map((enr, i) => {
    const course = courses.find((c) => c.id === enr.course_id) || {};
    return {
      id: enr.id || i,
      course_id: enr.course_id,
      tutorName: course.tutor_name || 'Tutor',
      tutorInitials: (course.tutor_name || 'TU').slice(0, 2).toUpperCase(),
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
          <div className="flex items-center gap-3">
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
                ←'
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
