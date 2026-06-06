import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { parentAPI } from '../../api/parent';

const ParentDashboard = () => {
  const { user, logout } = useAuth();

  const [children,  setChildren]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [overview,  setOverview]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [ovLoading, setOvLoading] = useState(false);

  useEffect(() => {
    parentAPI.getMyChildren()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setChildren(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setOvLoading(true);
    setOverview(null);
    parentAPI.getChildOverview(selected.student_id)
      .then(setOverview)
      .catch(() => setOverview(null))
      .finally(() => setOvLoading(false));
  }, [selected]);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: '#111827', letterSpacing: '-0.02em' }}>Tutofy</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>{user?.name || user?.email || 'Parent'}</span>
          <button onClick={logout} style={{ fontSize: 13, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
            Log out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Parent Dashboard</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 32px' }}>Monitor your children's lesson attendance and course progress.</p>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #0d9488', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && children.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" width={28} height={28}>
                <circle cx="9" cy="7" r="4"/><path d="M2 21c0-4 3.1-7 7-7" strokeLinecap="round"/>
                <circle cx="17" cy="9" r="3"/><path d="M13 21c0-3 1.8-5 4-5s4 2 4 5" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No children linked yet</p>
            <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>
              Ask your child to send you an invite from their Settings page on Tutofy.
            </p>
          </div>
        )}

        {!loading && children.length > 0 && (
          <>
            {children.length > 1 && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                {children.map(c => (
                  <button key={c.id} onClick={() => setSelected(c)}
                    style={{ padding: '8px 18px', borderRadius: 10, border: `2px solid ${selected?.id === c.id ? '#0d9488' : '#e5e7eb'}`, background: selected?.id === c.id ? '#f0fdfa' : '#fff', color: selected?.id === c.id ? '#0d9488' : '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    {c.student_name || c.student_id}
                  </button>
                ))}
              </div>
            )}

            {selected && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="1.8" width={24} height={24}>
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{selected.student_name || 'Student'}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>Linked since {selected.created_at || '—'}</p>
                </div>
              </div>
            )}

            {ovLoading && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', border: '3px solid #0d9488', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}

            {!ovLoading && overview && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                  <StatCard label="Courses Enrolled" value={overview.courses?.length ?? 0} color="#0d9488" />
                  <StatCard label="Lessons Attended" value={overview.total_attended ?? 0} color="#7c3aed" />
                  <StatCard label="Total Lessons" value={overview.total_lessons ?? 0} color="#0ea5e9" />
                  <StatCard label="Overall Attendance" value={`${overview.overall_attendance_pct ?? 0}%`} color={attendanceColor(overview.overall_attendance_pct)} />
                </div>

                {overview.courses?.length > 0 ? (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6' }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Attendance by Course</p>
                    </div>
                    {overview.courses.map((c, i) => (
                      <div key={c.course_id} style={{ padding: '14px 24px', borderBottom: i < overview.courses.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>Course {i + 1}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>{c.course_id}</p>
                        </div>
                        <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>{c.attended_lessons}/{c.total_lessons} lessons</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: attendanceColor(c.attendance_pct), minWidth: 40, textAlign: 'right', flexShrink: 0 }}>{c.attendance_pct}%</span>
                        <div style={{ width: 80, height: 6, background: '#f3f4f6', borderRadius: 4, flexShrink: 0, overflow: 'hidden' }}>
                          <div style={{ width: `${c.attendance_pct}%`, height: '100%', background: attendanceColor(c.attendance_pct), borderRadius: 4 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 24px', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: 14, color: '#9ca3af' }}>No courses enrolled yet.</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '18px 20px' }}>
      <p style={{ margin: '0 0 6px', fontSize: 12, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  );
}

function attendanceColor(pct) {
  if (pct >= 75) return '#16a34a';
  if (pct >= 50) return '#d97706';
  return '#dc2626';
}

export default ParentDashboard;
