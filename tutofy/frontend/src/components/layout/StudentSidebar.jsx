import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enrollmentsAPI } from '../../api/enrollments';
import { coursesAPI } from '../../api/courses';

const COLORS = ['#0d9488', '#7c3aed', '#0ea5e9', '#f59e0b', '#22c55e', '#f43f5e'];

const Icon = ({ name, size = 16, active }) => {
  const s = active ? 'var(--accent)' : 'var(--muted)';
  const icons = {
    home:       <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><path d="M2 8L9 2l7 6v8a1 1 0 01-1 1H3a1 1 0 01-1-1V8z" strokeLinecap="round" strokeLinejoin="round"/><rect x="6.5" y="11" width="5" height="5" rx=".5"/></svg>,
    book:       <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><path d="M3 3a1 1 0 011-1h10a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3z"/><path d="M6 7h6M6 10h4" strokeLinecap="round"/></svg>,
    clipboard:  <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><rect x="4" y="2" width="10" height="14" rx="1.5"/><path d="M6 6h6M6 9h6M6 12h4" strokeLinecap="round"/></svg>,
    chart:      <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><path d="M3 14V8M7 14V5M11 14v-4M15 14V7" strokeLinecap="round"/></svg>,
    award:      <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><circle cx="9" cy="8" r="5"/><path d="M6 13l-1 4 4-2 4 2-1-4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    message:    <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><path d="M3 3a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3V3z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    schedule:   <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><rect x="2" y="3" width="14" height="13" rx="1.5"/><path d="M6 2v3M12 2v3M2 8h14" strokeLinecap="round"/></svg>,
    chevron:    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width={10} height={10}><path d="M2 4l4 4 4-4"/></svg>,
    logout:     <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width={14} height={14}><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    search:     <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width={13} height={13}><circle cx="7" cy="7" r="4.5"/><path d="M12 12l-2-2" strokeLinecap="round"/></svg>,
  };
  return icons[name] || null;
};

const SECTIONS = [
  {
    label: 'Learn',
    items: [
      { path: '/student/dashboard',    label: 'Overview',      icon: 'home' },
      { path: '/student/courses',      label: 'My Courses',    icon: 'book', expandable: true },
      { path: '/student/assignments',  label: 'Homework',      icon: 'clipboard' },
      { path: '/student/schedule',     label: 'Schedule',      icon: 'schedule' },
    ],
  },
  {
    label: 'Discover',
    items: [
      { path: '/student/marketplace',  label: 'Find Tutors',   icon: 'search' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { path: '/student/progress',     label: 'Progress',      icon: 'chart' },
      { path: '/student/certificates', label: 'Certificates',  icon: 'award' },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/student/messages',     label: 'Messages',      icon: 'message' },
    ],
  },
];

const StudentSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [courses, setCourses] = useState([]);
  const [open, setOpen]       = useState(false);
  const [loaded, setLoaded]   = useState(false);

  const onCoursesSection = location.pathname.startsWith('/student/courses');
  const activeCourseId   = (() => {
    const parts = location.pathname.split('/').filter(Boolean);
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

  const isActive = (path) => {
    if (path === '/student/marketplace') {
      return location.pathname.startsWith('/student/marketplace') || location.pathname.startsWith('/student/tutors/');
    }
    return location.pathname === path ||
      (path !== '/student/dashboard' && location.pathname.startsWith(path));
  };

  return (
    <div className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Link to="/">
          <img src="/logo.svg" alt="tutofy" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16 }}>tutofy</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="sidebar-group-label">{section.label}</div>
            {section.items.map((item) => {
              const active = isActive(item.path);
              if (item.expandable) {
                return (
                  <div key={item.path}>
                    <div style={{ display: 'flex', alignItems: 'center', borderRadius: 'var(--r-md)', background: onCoursesSection ? 'var(--surface-hover)' : 'transparent' }}>
                      <Link
                        to={item.path}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: onCoursesSection ? 600 : 500, color: onCoursesSection ? 'var(--accent)' : 'var(--text-2)', textDecoration: 'none' }}
                      >
                        <Icon name={item.icon} active={onCoursesSection} />
                        {item.label}
                      </Link>
                      <button
                        onClick={() => setOpen(o => !o)}
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', marginRight: 4, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform var(--t-fast)' }}
                      >
                        <Icon name="chevron" />
                      </button>
                    </div>
                    {open && (
                      <div style={{ marginTop: 2, marginBottom: 2 }}>
                        {courses.length === 0 ? (
                          <p style={{ fontSize: 11, color: 'var(--muted)', paddingLeft: 38, paddingTop: 6, paddingBottom: 6 }}>No enrolled courses</p>
                        ) : courses.map(c => {
                          const courseActive = activeCourseId === c.courseId;
                          return (
                            <Link
                              key={c.courseId}
                              to={`/student/courses/${c.courseId}`}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                paddingLeft: 36, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                                borderRadius: 'var(--r-sm)',
                                fontSize: 12, fontWeight: courseActive ? 600 : 500,
                                color: courseActive ? 'var(--accent)' : 'var(--text-2)',
                                background: courseActive ? 'rgba(13,148,136,0.06)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'background var(--t-fast), color var(--t-fast)',
                              }}
                            >
                              <div style={{ width: 7, height: 7, borderRadius: '50%', background: courseActive ? 'var(--accent)' : c.color, flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link${active ? ' active' : ''}`}
                >
                  <Icon name={item.icon} active={active} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="sidebar-user">
        <div className="sidebar-user-row">
          <div className="sidebar-avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Student'}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>Student</p>
          </div>
        </div>

        <button className="sidebar-logout" onClick={() => { logout(); navigate('/login'); }}>
          <Icon name="logout" />
          Log out
        </button>
      </div>
    </div>
  );
};

export default StudentSidebar;
