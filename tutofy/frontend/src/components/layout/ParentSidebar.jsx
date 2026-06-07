import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ParentSidebar({ linkedChildren, activeChildId, onSelectChild }) {
  const location = useNavigate ? useLocation() : { pathname: '' };
  const navigate  = useNavigate();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const initials = (user?.name || 'P').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      icon: (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width={16} height={16}>
          <path d="M2 8L9 2l7 6v8a1 1 0 01-1 1H3a1 1 0 01-1-1V8z" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="6.5" y="11" width="5" height="5" rx=".5"/>
        </svg>
      ),
      label: 'Dashboard',
      path: '/parent/dashboard',
    },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: collapsed ? 64 : 220,
      minWidth: collapsed ? 64 : 220,
      background: 'white',
      borderRight: '1px solid var(--border)',
      transition: 'width 200ms, min-width 200ms',
      flexShrink: 0,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>

      {/* Logo + collapse */}
      <div style={{ padding: collapsed ? '18px 0' : '18px 16px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', borderBottom: '1px solid var(--border)' }}>
        {!collapsed && (
          <Link to="/parent/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/logo.svg" alt="tutofy" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>tutofy</span>
          </Link>
        )}
        {collapsed && (
          <img src="/logo.svg" alt="tutofy" style={{ width: 28, height: 28, borderRadius: '50%' }} />
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 4 }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width={13} height={13}>
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{ position: 'absolute', top: 18, left: 50, background: 'white', border: '1px solid var(--border)', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width={11} height={11}>
              <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {!collapsed && (
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 8px 8px', margin: 0 }}>Menu</p>
        )}
        {navItems.map(item => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 0' : '9px 10px',
                borderRadius: 8, textDecoration: 'none', marginBottom: 2,
                justifyContent: collapsed ? 'center' : undefined,
                background: active ? 'var(--accent-soft)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--muted)',
                transition: 'background 120ms',
              }}
              title={collapsed ? item.label : undefined}
            >
              <span style={{ color: active ? 'var(--accent)' : 'var(--muted)', display: 'flex', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{item.label}</span>}
            </Link>
          );
        })}

        {/* Children list */}
        {!collapsed && linkedChildren && linkedChildren.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 8px 8px', margin: 0 }}>My Children</p>
            {linkedChildren.map(child => (
              <button key={child.student_id} onClick={() => onSelectChild && onSelectChild(child.student_id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 8, width: '100%',
                  border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                  background: activeChildId === child.student_id ? 'var(--accent-soft)' : 'transparent',
                  color: activeChildId === child.student_id ? 'var(--accent)' : 'var(--text)',
                  transition: 'background 120ms',
                }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {(child.student_name || 'S')[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.student_name || 'Student'}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: collapsed ? '12px 0' : '12px 12px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : undefined }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
          {initials}
        </div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Parent'}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>Parent</p>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 4 }} title="Log out">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width={14} height={14}>
                <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
