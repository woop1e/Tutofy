import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enrollmentsAPI } from '../../api/enrollments';
import { coursesAPI } from '../../api/courses';
import NotificationBell from '../ui/NotificationBell';

const NAV_BOTTOM = [
  { path: '/student/assignments', label: 'Homework', icon: active => (
    <svg viewBox="0 0 20 20" fill="none" className="w-[18px] h-[18px]" stroke={active ? '#4c6eff' : '#8a90a1'} strokeWidth="1.6">
      <rect x="4" y="2" width="12" height="16" rx="2"/><path d="M7 7h6M7 10h6M7 13h4"/>
    </svg>
  )},
  { path: '/student/messages', label: 'Messages', icon: active => (
    <svg viewBox="0 0 20 20" fill="none" className="w-[18px] h-[18px]" stroke={active ? '#4c6eff' : '#8a90a1'} strokeWidth="1.6">
      <path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-4 3V5a1 1 0 011-1z"/>
    </svg>
  )},
  { path: '/student/progress', label: 'Progress', icon: active => (
    <svg viewBox="0 0 20 20" fill="none" className="w-[18px] h-[18px]" stroke={active ? '#4c6eff' : '#8a90a1'} strokeWidth="1.6">
      <path d="M3 15l4-5 3 3 4-6 3 3"/>
    </svg>
  )},
];

const COLORS = ['#4c6eff', '#935bf5', '#00beb7', '#ff8032', '#22be70', '#f24545'];

const StudentSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [courses,     setCourses]     = useState([]);
  const [open,        setOpen]        = useState(false);
  const [loaded,      setLoaded]      = useState(false);

  const onCoursesSection = location.pathname.startsWith('/student/courses');
  const activeCourseId   = (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    // /student/courses/:id  → parts = ['student','courses',':id',...]
    return parts[1] === 'courses' && parts[2] ? parts[2] : null;
  })();

  useEffect(() => { if (onCoursesSection) setOpen(true); }, [onCoursesSection]);

  useEffect(() => {
    if (!user?.user_id || loaded) return;
    setLoaded(true);
    Promise.all([
      enrollmentsAPI.getUserEnrollments(user.user_id).catch(() => ({})),
      coursesAPI.getAllCourses().catch(() => ({})),
    ]).then(([eRes, cRes]) => {
      const enrollments = eRes?.enrollments || [];
      const all         = cRes?.courses     || [];
      setCourses(enrollments.map((e, i) => ({
        courseId: e.course_id,
        title:    all.find(c => c.id === e.course_id)?.title || 'Course',
        color:    COLORS[i % COLORS.length],
      })));
    });
  }, [user?.user_id, loaded]);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'S';

  const navLink = ({ path, label, icon }) => {
    const active = location.pathname === path ||
      (path !== '/student/dashboard' && location.pathname.startsWith(path));
    return (
      <Link key={path} to={path}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-colors text-[13px] font-medium ${
          active ? 'bg-[rgba(76,110,255,0.08)] text-[#4c6eff]' : 'text-[#4c5162] hover:bg-[#f8f9fc] hover:text-[#181b26]'
        }`}>
        <span className="flex-shrink-0">{icon(active)}</span>
        {label}
      </Link>
    );
  };

  return (
    <div className="w-[220px] min-h-screen bg-white border-r border-[#f0f0f5] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5">
        <Link to="/" className="text-[#4c6eff] text-[20px] font-bold block leading-none">Tutofy</Link>
        <p className="text-[#8a90a1] text-[11px] mt-1">Student portal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">

        {/* Dashboard */}
        {(() => {
          const active = location.pathname === '/student/dashboard';
          return (
            <Link to="/student/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-colors text-[13px] font-medium ${
                active ? 'bg-[rgba(76,110,255,0.08)] text-[#4c6eff]' : 'text-[#4c5162] hover:bg-[#f8f9fc] hover:text-[#181b26]'
              }`}>
              <svg viewBox="0 0 20 20" fill="none" className="w-[18px] h-[18px]" stroke={active ? '#4c6eff' : '#8a90a1'} strokeWidth="1.6">
                <rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/>
                <rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/>
              </svg>
              Dashboard
            </Link>
          );
        })()}

        {/* My Courses — expandable */}
        <div>
          <div className={`flex items-center rounded-[10px] transition-colors ${
            onCoursesSection ? 'bg-[rgba(76,110,255,0.08)]' : 'hover:bg-[#f8f9fc]'
          }`}>
            <Link to="/student/courses"
              className={`flex items-center gap-3 px-3 py-2.5 flex-1 min-w-0 text-[13px] font-medium ${
                onCoursesSection ? 'text-[#4c6eff]' : 'text-[#4c5162]'
              }`}>
              <span className="flex-shrink-0">
                <svg viewBox="0 0 20 20" fill="none" className="w-[18px] h-[18px]"
                  stroke={onCoursesSection ? '#4c6eff' : '#8a90a1'} strokeWidth="1.6">
                  <path d="M3 5h14M3 10h14M3 15h8"/>
                  <rect x="12" y="12" width="6" height="6" rx="1" fill={onCoursesSection ? '#4c6eff' : 'none'}/>
                </svg>
              </span>
              Learning
            </Link>
            <button onClick={() => setOpen(o => !o)}
              className="w-8 h-8 flex items-center justify-center text-[#8a90a1] hover:text-[#4c6eff] transition-colors flex-shrink-0 mr-1">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
                className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                <path d="M2 4l4 4 4-4"/>
              </svg>
            </button>
          </div>

          {open && (
            <div className="mt-0.5 mb-0.5 space-y-px">
              {courses.length === 0 ? (
                <p className="text-[11px] text-[#b0b5c4] pl-10 py-1.5">No enrolled courses</p>
              ) : courses.map(c => {
                const active = activeCourseId === c.courseId;
                return (
                  <Link key={c.courseId} to={`/student/courses/${c.courseId}`}
                    className={`flex items-center gap-2.5 pl-9 pr-3 py-2 rounded-[8px] text-[12px] font-medium transition-colors ${
                      active
                        ? 'bg-[rgba(76,110,255,0.06)] text-[#4c6eff]'
                        : 'text-[#4c5162] hover:bg-[#f8f9fc] hover:text-[#181b26]'
                    }`}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: active ? '#4c6eff' : c.color }} />
                    <span className="truncate">{c.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Other nav items */}
        {NAV_BOTTOM.map(item => navLink(item))}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-5 border-t border-[#f0f0f5]">
        <div className="flex items-center justify-between mb-3">
          <NotificationBell dark={false} />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[rgba(76,110,255,0.12)] flex items-center justify-center flex-shrink-0">
            <span className="text-[#4c6eff] text-[12px] font-bold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[#181b26] text-[13px] font-semibold truncate">{user?.name || 'Student'}</p>
            <p className="text-[#8a90a1] text-[11px]">Student</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[#8a90a1] text-[12px] hover:bg-[#f8f9fc] hover:text-[#f24545] transition-colors">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"/>
          </svg>
          Log out
        </button>
      </div>
    </div>
  );
};

export default StudentSidebar;
