import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../ui/NotificationBell';

const NAV = [
  {
    path: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5"/>
        <rect x="2" y="10" width="6" height="6" rx="1.5"/><rect x="10" y="10" width="6" height="6" rx="1.5"/>
      </svg>
    ),
  },
  {
    path: '/admin/users',
    label: 'Users',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <circle cx="7" cy="6" r="3"/><path d="M1 16a6 6 0 0112 0"/>
        <circle cx="14" cy="7" r="2"/><path d="M14 11a4 4 0 013 4"/>
      </svg>
    ),
  },
  {
    path: '/admin/courses',
    label: 'Courses',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path d="M3 4a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"/>
        <path d="M6 8h6M6 11h4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    path: '/admin/payments',
    label: 'Payments',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <rect x="2" y="4" width="14" height="10" rx="1.5"/>
        <path d="M2 8h14" strokeLinecap="round"/>
        <path d="M5 12h2M9 12h1" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    path: '/admin/tutors',
    label: 'Tutor Applications',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <circle cx="9" cy="6" r="3"/>
        <path d="M3 16a6 6 0 0112 0"/>
        <path d="M13 10l2 2 3-3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  return (
    <div className="w-[220px] min-h-screen bg-[#0f1117] flex flex-col flex-shrink-0">
      <div className="px-6 pt-7 pb-4">
        <p className="text-white text-xl font-bold">Tutofy</p>
        <p className="text-white/40 text-[11px] mt-0.5">Admin Panel</p>
      </div>

      <div className="px-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-red-400 text-sm font-bold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-[13px] font-semibold truncate">{user?.name || 'Admin'}</p>
            <p className="text-red-400/80 text-[11px]">Administrator</p>
          </div>
        </div>
      </div>

      <div className="mx-6 h-px bg-white/10 mb-3" />

      <nav className="flex-1 px-3">
        {NAV.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] mb-1 transition-colors text-[13px] ${
                isActive
                  ? 'bg-red-500/20 text-red-400 font-semibold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="w-4 flex items-center justify-center flex-shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6">
        <div className="mx-3 h-px bg-white/10 mb-3" />
        <div className="flex justify-center mb-2">
          <NotificationBell dark={true} />
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-white/50 hover:text-white text-[13px] transition-colors rounded-[10px] hover:bg-white/10"
        >
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
            <path d="M7 3H4a1 1 0 00-1 1v10a1 1 0 001 1h3M12 12l3-3-3-3M7 9h8"/>
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
