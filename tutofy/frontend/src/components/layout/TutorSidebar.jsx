import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Icon = ({ name, size = 16, active }) => {
  const s = active ? 'var(--accent)' : 'var(--muted)';
  const icons = {
    home:     <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><path d="M2 8L9 2l7 6v8a1 1 0 01-1 1H3a1 1 0 01-1-1V8z" strokeLinecap="round" strokeLinejoin="round"/><rect x="6.5" y="11" width="5" height="5" rx=".5"/></svg>,
    book:     <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><path d="M3 3a1 1 0 011-1h10a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3z"/><path d="M6 7h6M6 10h4" strokeLinecap="round"/></svg>,
    users:    <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><circle cx="7" cy="6" r="3"/><path d="M1 16a6 6 0 0112 0"/><circle cx="14" cy="7" r="2"/><path d="M14 11a4 4 0 013 4"/></svg>,
    grade:    <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><rect x="3" y="2" width="12" height="14" rx="1.5"/><path d="M6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    schedule: <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><rect x="2" y="3" width="14" height="13" rx="1.5"/><path d="M6 2v3M12 2v3M2 8h14" strokeLinecap="round"/></svg>,
    message:  <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><path d="M3 3a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3V3z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    user:     <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><circle cx="9" cy="6" r="3"/><path d="M3 16a6 6 0 0112 0"/></svg>,
    chart:    <svg viewBox="0 0 18 18" fill="none" stroke={s} strokeWidth="1.6" width={size} height={size}><path d="M3 14V8M7 14V5M11 14v-4M15 14V7" strokeLinecap="round"/></svg>,
    logout:   <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width={14} height={14}><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    link:     <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width={13} height={13}><circle cx="8" cy="5" r="3"/><path d="M2 14a6 6 0 0112 0"/></svg>,
    plus:     <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" width={12} height={12}><path d="M7 2v10M2 7h10" strokeLinecap="round"/></svg>,
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

const SECTIONS = [
  {
    label: 'Teach',
    items: [
      { path: '/tutor/dashboard', label: 'Overview',   icon: 'home' },
      { path: '/tutor/courses',   label: 'Courses',    icon: 'book' },
      { path: '/tutor/students',  label: 'Students',   icon: 'users' },
      { path: '/tutor/grading',   label: 'Grading',    icon: 'grade' },
    ],
  },
  {
    label: 'Schedule',
    items: [
      { path: '/tutor/schedule',  label: 'Schedule',   icon: 'schedule' },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/tutor/messages',  label: 'Messages',   icon: 'message' },
      { path: '/tutor/profile',   label: 'My Profile', icon: 'user' },
    ],
  },
];

const TutorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar_collapsed') === 'true'
  );

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar_collapsed', String(next));
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'T';

  const isActive = (path) =>
    location.pathname === path ||
    (path !== '/tutor/dashboard' && location.pathname.startsWith(path));

  return (
    <div className={collapsed ? 'app-sidebar collapsed' : 'app-sidebar'}>
      {/* Logo row */}
      <div className="sidebar-logo">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
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
              return (
                <Link
                  key={item.path}
                  to={item.path}
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
          <div className="sidebar-avatar" title={collapsed ? (user?.name || 'Tutor') : undefined}>{initials}</div>
          <div className="sidebar-text" style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Tutor'}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>Tutor</p>
          </div>
        </div>

        {!collapsed && (
          <>
            <Link
              to="/tutor/public-profile"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--muted)', textDecoration: 'none', transition: 'background var(--t-fast)', marginBottom: 2 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icon name="link" />
              Public profile
            </Link>

            <Link
              to="/tutor/courses/new"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', background: 'var(--accent-soft)', marginBottom: 6, transition: 'background var(--t-fast)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,148,136,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-soft)'}
            >
              <Icon name="plus" />
              New course
            </Link>
          </>
        )}

        <button className="sidebar-logout" onClick={() => { logout(); navigate('/login'); }} title={collapsed ? 'Log out' : undefined}>
          <Icon name="logout" />
          <span className="sidebar-text">Log out</span>
        </button>
      </div>
    </div>
  );
};

export default TutorSidebar;
