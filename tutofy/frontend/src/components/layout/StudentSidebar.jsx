import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enrollmentsAPI } from '../../api/enrollments';
import { coursesAPI } from '../../api/courses';
import { usersAPI } from '../../api/users';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../ui/LanguageSwitcher';

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
    settings:   <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><circle cx="9" cy="9" r="2.5"/><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.42 1.42M13.36 13.36l1.42 1.42M14.78 3.22l-1.42 1.42M4.64 13.36l-1.42 1.42" strokeLinecap="round"/></svg>,
  };
  return icons[name] || null;
};

const ChevronLeft = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width={13} height={13}>
    <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width={13} height={13}>
    <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SECTIONS_DEF = [
  {
    key: 'learn',
    items: [
      { path: '/student/dashboard',    key: 'overview',      icon: 'home' },
      { path: '/student/courses',      key: 'myCourses',     icon: 'book', expandable: true, tourId: 'student-tour-courses' },
      { path: '/student/assignments',  key: 'homework',      icon: 'clipboard', tourId: 'student-tour-homework' },
      { path: '/student/schedule',     key: 'schedule',      icon: 'schedule',  tourId: 'student-tour-schedule' },
    ],
  },
  {
    key: 'discover',
    items: [
      { path: '/student/marketplace',  key: 'findTutors',    icon: 'search',    tourId: 'student-tour-find-tutors' },
    ],
  },
  {
    key: 'insights',
    items: [
      { path: '/student/progress',     key: 'progress',      icon: 'chart',     tourId: 'student-tour-progress' },
      { path: '/student/certificates', key: 'certificates',  icon: 'award',     tourId: 'student-tour-certificates' },
    ],
  },
  {
    key: 'account',
    items: [
      { path: '/student/messages',     key: 'messages',      icon: 'message',   tourId: 'student-tour-messages' },
      { path: '/student/settings',     key: 'settings',      icon: 'settings' },
    ],
  },
];

const StudentSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const SECTIONS = SECTIONS_DEF.map(s => ({
    label: t(`nav.${s.key}`),
    items: s.items.map(i => ({ ...i, label: t(`nav.${i.key}`) })),
  }));

  const [collapsed,   setCollapsed]   = useState(
    () => localStorage.getItem('sidebar_collapsed') === 'true'
  );
  const [courses,    setCourses]    = useState([]);
  const [open,       setOpen]       = useState(false);
  const [loaded,     setLoaded]     = useState(false);
  const [photoUrl,   setPhotoUrl]   = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar_collapsed', String(next));
  };

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const onCoursesSection = location.pathname.startsWith('/student/courses');
  const activeCourseId   = (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts[1] === 'courses' && parts[2] ? parts[2] : null;
  })();

  useEffect(() => { if (onCoursesSection) setOpen(true); }, [onCoursesSection]);

  useEffect(() => {
    if (!user?.user_id) return;
    try {
      const cached = JSON.parse(localStorage.getItem(`st_photo_${user.user_id}`) || 'null');
      if (cached) setPhotoUrl(cached);
    } catch {}
    usersAPI.getUserById(user.user_id)
      .then(u => { if (u?.photo_url) setPhotoUrl(u.photo_url); })
      .catch(() => {});
  }, [user?.user_id]);

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
    <>
      {/* Mobile hamburger */}
      {!mobileOpen && (
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" width={18} height={18}>
            <path d="M2 4h14M2 9h14M2 14h14" strokeLinecap="round"/>
          </svg>
        </button>
      )}
      {/* Mobile overlay backdrop */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
    <div className={`${collapsed ? 'app-sidebar collapsed' : 'app-sidebar'}${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Logo row */}
      <div className="sidebar-logo">
        <Link to="/">
          <img src="/logo.svg" alt="tutofy" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
          <span className="sidebar-text" style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16 }}>tutofy</span>
        </Link>
        <button className="sidebar-toggle" onClick={toggleCollapsed} title="Collapse sidebar">
          <ChevronLeft />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {/* Expand button — only visible when collapsed */}
        <button className="sidebar-expand-btn" onClick={toggleCollapsed} title="Expand sidebar">
          <ChevronRight />
        </button>

        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="sidebar-group-label">{section.label}</div>
            {section.items.map((item) => {
              const active = isActive(item.path);

              if (item.expandable && !collapsed) {
                return (
                  <div key={item.path}>
                    <div style={{ display: 'flex', alignItems: 'center', borderRadius: 'var(--r-md)', background: onCoursesSection ? 'var(--surface-hover)' : 'transparent' }}>
                      <Link
                        to={item.path}
                        id={item.tourId}
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
                  id={item.tourId}
                  className={`sidebar-link${active ? ' active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon name={item.icon} active={active} />
                  <span className="sidebar-text">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="sidebar-user">
        <div className="sidebar-user-row">
          <div className="sidebar-avatar" title={collapsed ? (user?.name || 'Student') : undefined}
            style={{ padding: 0, overflow: 'hidden' }}>
            {photoUrl
              ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onError={() => setPhotoUrl('')} />
              : initials
            }
          </div>
          <div className="sidebar-text" style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Student'}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>{t('dashboard.student')}</p>
          </div>
        </div>

        <button className="sidebar-logout" onClick={() => { logout(); navigate('/login'); }} title={collapsed ? t('nav.logOut') : undefined}>
          <Icon name="logout" />
          <span className="sidebar-text">{t('nav.logOut')}</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default StudentSidebar;
