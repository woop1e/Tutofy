import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { usersAPI } from '../../api/users';
import { coursesAPI } from '../../api/courses';
import { enrollmentsAPI } from '../../api/enrollments';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm border border-[#f0f0f5]">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[28px] font-bold text-[#181b26] leading-none">{value ?? '—'}</p>
      <p className="text-[13px] text-[#8a90a1] mt-1">{label}</p>
      {sub && <p className="text-[11px] text-[#b0b5c4] mt-0.5">{sub}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== 'admin') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    Promise.all([
      usersAPI.getAllUsers().catch(() => ({})),
      coursesAPI.getAllCourses().catch(() => ({})),
    ]).then(([uRes, cRes]) => {
      setUsers(uRes?.users || []);
      setCourses(cRes?.courses || []);
    }).finally(() => setLoading(false));
  }, []);

  const tutors    = users.filter((u) => u.role === 'tutor');
  const students  = users.filter((u) => u.role === 'student');
  const published = courses.filter((c) => c.is_published);

  const recentUsers   = [...users].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 5);
  const recentCourses = [...courses].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 5);

  return (
    <div className="flex min-h-screen bg-[#f5f6fa] font-sans">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b border-[#ebebf0] px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-[#181b26] text-[22px] font-bold leading-none">Dashboard</h1>
            <p className="text-[#8a90a1] text-[13px] mt-1">Platform overview</p>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-5 mb-8">
                <StatCard
                  label="Total Users"
                  value={users.length}
                  color="bg-[#4c6eff]/10"
                  icon={<svg viewBox="0 0 20 20" fill="none" stroke="#4c6eff" strokeWidth="1.5" className="w-6 h-6"><circle cx="8" cy="7" r="3"/><path d="M2 18a6 6 0 0112 0"/><circle cx="15" cy="8" r="2"/><path d="M15 12a4 4 0 013 5"/></svg>}
                />
                <StatCard
                  label="Tutors"
                  value={tutors.length}
                  color="bg-[#935bf5]/10"
                  icon={<svg viewBox="0 0 20 20" fill="none" stroke="#935bf5" strokeWidth="1.5" className="w-6 h-6"><circle cx="10" cy="7" r="4"/><path d="M3 18a7 7 0 0114 0"/></svg>}
                />
                <StatCard
                  label="Students"
                  value={students.length}
                  color="bg-[#22be70]/10"
                  icon={<svg viewBox="0 0 20 20" fill="none" stroke="#22be70" strokeWidth="1.5" className="w-6 h-6"><path d="M10 2l8 4-8 4-8-4 8-4z"/><path d="M4 10v5l6 3 6-3v-5"/></svg>}
                />
                <StatCard
                  label="Courses"
                  value={courses.length}
                  sub={`${published.length} published`}
                  color="bg-[#ff8032]/10"
                  icon={<svg viewBox="0 0 20 20" fill="none" stroke="#ff8032" strokeWidth="1.5" className="w-6 h-6"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 9h6M7 12h4" strokeLinecap="round"/></svg>}
                />
              </div>

              {/* Tables row */}
              <div className="grid grid-cols-2 gap-6">
                {/* Recent users */}
                <div className="bg-white rounded-2xl border border-[#ebebf0] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#f0f0f5] flex items-center justify-between">
                    <h2 className="text-[15px] font-bold text-[#181b26]">Recent Users</h2>
                    <button onClick={() => navigate('/admin/users')} className="text-[12px] text-[#4c6eff] hover:underline">View all</button>
                  </div>
                  <div>
                    {recentUsers.length === 0 ? (
                      <p className="text-[#8a90a1] text-[13px] text-center py-8">No users yet</p>
                    ) : recentUsers.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 px-6 py-3 border-b border-[#f8f9fc] last:border-0 hover:bg-[#f8f9fc] transition-colors">
                        <div className="w-8 h-8 rounded-full bg-[#4c6eff]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#4c6eff] text-[11px] font-bold">
                            {(u.name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[#181b26] truncate">{u.name || 'Unknown'}</p>
                          <p className="text-[11px] text-[#8a90a1] truncate">{u.email}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          u.role === 'tutor'
                            ? 'bg-[#935bf5]/10 text-[#935bf5]'
                            : u.role === 'admin'
                            ? 'bg-red-100 text-red-500'
                            : 'bg-[#22be70]/10 text-[#22be70]'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent courses */}
                <div className="bg-white rounded-2xl border border-[#ebebf0] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#f0f0f5] flex items-center justify-between">
                    <h2 className="text-[15px] font-bold text-[#181b26]">Recent Courses</h2>
                    <button onClick={() => navigate('/admin/courses')} className="text-[12px] text-[#4c6eff] hover:underline">View all</button>
                  </div>
                  <div>
                    {recentCourses.length === 0 ? (
                      <p className="text-[#8a90a1] text-[13px] text-center py-8">No courses yet</p>
                    ) : recentCourses.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 px-6 py-3 border-b border-[#f8f9fc] last:border-0 hover:bg-[#f8f9fc] transition-colors">
                        <div className="w-8 h-8 rounded-[8px] bg-[#ff8032]/10 flex items-center justify-center flex-shrink-0">
                          <svg viewBox="0 0 16 16" fill="none" stroke="#ff8032" strokeWidth="1.4" className="w-4 h-4">
                            <rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 7h6M5 10h4" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[#181b26] truncate">{c.title}</p>
                          <p className="text-[11px] text-[#8a90a1]">{c.price > 0 ? `$${c.price}` : 'Free'}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          c.is_published ? 'bg-[#22be70]/10 text-[#22be70]' : 'bg-[#f0f0f5] text-[#8a90a1]'
                        }`}>
                          {c.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
