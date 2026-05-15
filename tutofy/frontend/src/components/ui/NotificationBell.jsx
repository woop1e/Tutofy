import React, { useEffect, useRef, useState, useCallback } from 'react';
import { notificationsAPI } from '../../api/notifications';

const TYPE_ICON = {
  1: ( // GRADE
    <svg viewBox="0 0 16 16" fill="none" stroke="#935bf5" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
      <path d="M3 3h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z"/>
      <path d="M5 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  2: ( // ENROLLMENT
    <svg viewBox="0 0 16 16" fill="none" stroke="#22be70" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
      <circle cx="7" cy="5" r="3"/><path d="M1 14a6 6 0 0110 0"/><path d="M13 7l1.5 1.5L17 6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  3: ( // NEW_LESSON
    <svg viewBox="0 0 16 16" fill="none" stroke="#4c6eff" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
      <rect x="2" y="2" width="12" height="12" rx="1.5"/>
      <path d="M5 6h6M5 9h4" strokeLinecap="round"/>
    </svg>
  ),
  4: ( // NEW_MESSAGE
    <svg viewBox="0 0 16 16" fill="none" stroke="#00beb7" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
      <path d="M2 3h12a1 1 0 011 1v6a1 1 0 01-1 1H5l-4 3V4a1 1 0 011-1z"/>
    </svg>
  ),
  5: ( // ASSIGNMENT
    <svg viewBox="0 0 16 16" fill="none" stroke="#ff8032" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
      <rect x="3" y="1" width="10" height="14" rx="1.5"/>
      <path d="M5 6h6M5 9h6M5 12h3" strokeLinecap="round"/>
    </svg>
  ),
  6: ( // COURSE_DONE
    <svg viewBox="0 0 16 16" fill="none" stroke="#22be70" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
      <circle cx="8" cy="8" r="6"/>
      <path d="M5 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg viewBox="0 0 16 16" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
    <path d="M8 1a5 5 0 015 5v3l1.5 2H1.5L3 9V6a5 5 0 015-5zM6.5 13a1.5 1.5 0 003 0"/>
  </svg>
);

function fmtTime(ts) {
  if (!ts) return '';
  // protobuf Timestamp serialized by encoding/json → {seconds, nanos}
  let d;
  if (typeof ts === 'string') {
    d = new Date(ts);
  } else if (ts && typeof ts === 'object' && ts.seconds != null) {
    d = new Date(Number(ts.seconds) * 1000);
  } else {
    return '';
  }
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = now - d;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const POLL_MS = 30_000;

const NotificationBell = ({ dark = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const fetchNotifications = useCallback(() => {
    notificationsAPI.getNotifications()
      .then((data) => setNotifications(data?.notifications || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_MS);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (n) => {
    if (n.is_read) return;
    try {
      await notificationsAPI.markNotificationRead(n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
      );
    } catch {}
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => notificationsAPI.markNotificationRead(n.id).catch(() => {})));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const bellColor = dark ? 'text-white/70 hover:text-white' : 'text-[#8a90a1] hover:text-[#4c6eff]';
  const badgeBg = dark ? 'bg-red-500' : 'bg-red-500';

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-lg transition-colors ${bellColor}`}
        aria-label="Notifications"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
          <path d="M10 2a6 6 0 016 6v4l1.5 2.5h-15L4 12V8a6 6 0 016-6zM8 17a2 2 0 004 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className={`absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full ${badgeBg} text-white text-[10px] font-bold leading-none`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#f0f0f5] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f5]">
            <span className="text-[13px] font-semibold text-[#181b26]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-[#4c6eff] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-[#8a90a1]">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#f8f9fc] transition-colors border-b border-[#f8f9fc] last:border-0 ${
                    !n.is_read ? 'bg-[rgba(76,110,255,0.03)]' : ''
                  }`}
                >
                  <div className="mt-0.5">
                    {TYPE_ICON[n.type] || DEFAULT_ICON}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] leading-snug ${n.is_read ? 'text-[#4c5162]' : 'text-[#181b26] font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-[11px] text-[#b0b5c4] mt-0.5">{fmtTime(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-[#4c6eff] flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
