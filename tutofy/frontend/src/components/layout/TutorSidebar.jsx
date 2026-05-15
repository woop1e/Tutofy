import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../ui/NotificationBell';

const menuItems = [
  {
    path: '/tutor/dashboard',
    label: 'Dashboard',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? '#4c6eff' : '#8a90a1'} strokeWidth="1.6" className="w-[18px] h-[18px]">
        <rect x="2" y="2" width="6" height="6" rx="1.5"/>
        <rect x="10" y="2" width="6" height="6" rx="1.5"/>
        <rect x="2" y="10" width="6" height="6" rx="1.5"/>
        <rect x="10" y="10" width="6" height="6" rx="1.5"/>
      </svg>
    ),
  },
  {
    path: '/tutor/courses',
    label: 'My Courses',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? '#4c6eff' : '#8a90a1'} strokeWidth="1.6" className="w-[18px] h-[18px]">
        <path d="M3 4a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"/>
        <path d="M6 8h6M6 11h4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    path: '/tutor/students',
    label: 'Students',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? '#4c6eff' : '#8a90a1'} strokeWidth="1.6" className="w-[18px] h-[18px]">
        <circle cx="7" cy="6" r="3"/>
        <path d="M1 16a6 6 0 0112 0"/>
        <circle cx="14" cy="7" r="2"/>
        <path d="M14 11a4 4 0 013 4"/>
      </svg>
    ),
  },
  {
    path: '/tutor/grading',
    label: 'Grading',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? '#4c6eff' : '#8a90a1'} strokeWidth="1.6" className="w-[18px] h-[18px]">
        <path d="M4 3h10a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/>
        <path d="M6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    path: '/tutor/schedule',
    label: 'Schedule',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? '#4c6eff' : '#8a90a1'} strokeWidth="1.6" className="w-[18px] h-[18px]">
        <rect x="2" y="3" width="14" height="13" rx="1.5"/>
        <path d="M6 2v3M12 2v3M2 8h14" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    path: '/tutor/messages',
    label: 'Messages',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? '#4c6eff' : '#8a90a1'} strokeWidth="1.6" className="w-[18px] h-[18px]">
        <path d="M3 4a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H7l-4 3V4z"/>
      </svg>
    ),
  },
  {
    path: '/tutor/profile',
    label: 'My Profile',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? '#4c6eff' : '#8a90a1'} strokeWidth="1.6" className="w-[18px] h-[18px]">
        <circle cx="9" cy="6" r="3"/>
        <path d="M3 16a6 6 0 0112 0"/>
      </svg>
    ),
  },
];

const TutorSidebar = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'T';

  return (
    <div className="w-[220px] min-h-screen bg-white border-r border-[#f0f0f5] flex flex-col flex-shrink-0">

      {/* Logo + bell */}
      <div className="px-6 pt-6 pb-5 flex items-center justify-between">
        <div>
          <Link to="/" className="text-[#4c6eff] text-[20px] font-bold block leading-none">Tutofy</Link>
          <p className="text-[#8a90a1] text-[11px] mt-1">Tutor portal</p>
        </div>
        <NotificationBell dark={false} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/tutor/dashboard' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-colors text-[13px] font-medium ${
                isActive
                  ? 'bg-[rgba(76,110,255,0.08)] text-[#4c6eff]'
                  : 'text-[#4c5162] hover:bg-[#f8f9fc] hover:text-[#181b26]'
              }`}
            >
              <span className="flex-shrink-0">{item.icon(isActive)}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user info + links */}
      <div className="px-4 py-5 border-t border-[#f0f0f5]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[rgba(76,110,255,0.12)] flex items-center justify-center flex-shrink-0">
            <span className="text-[#4c6eff] text-[12px] font-bold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[#181b26] text-[13px] font-semibold truncate">{user?.name || 'Tutor'}</p>
            <p className="text-[#8a90a1] text-[11px]">Tutor</p>
          </div>
        </div>

        {user?.user_id && (
          <Link
            to={`/tutors/${user.user_id}`}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[#8a90a1] text-[12px] hover:bg-[#f8f9fc] hover:text-[#4c5162] transition-colors mb-1"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
              <circle cx="8" cy="5" r="3"/>
              <path d="M2 14a6 6 0 0112 0"/>
            </svg>
            My Public Profile
          </Link>
        )}

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[#8a90a1] text-[12px] hover:bg-[#f8f9fc] hover:text-[#f24545] transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"/>
          </svg>
          Log out
        </button>
      </div>
    </div>
  );
};

export default TutorSidebar;
