﻿import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { usersAPI } from '../../api/users';

const ROLE_STYLE = {
  tutor:   'bg-[#935bf5]/10 text-[#935bf5]',
  student: 'bg-[#22be70]/10 text-[#22be70]',
  admin:   'bg-red-100 text-red-500',
};

const AdminUsers = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [confirm, setConfirm]   = useState(null); // user to confirm delete

  useEffect(() => {
    if (!isAuthenticated || role !== 'admin') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    usersAPI.getAllUsers()
      .then((d) => setUsers(d?.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter) list = list.filter((u) => u.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, roleFilter, search]);

  const handleDelete = async (user) => {
    setDeleting(user.id);
    try {
      await usersAPI.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch {
    } finally {
      setDeleting(null);
      setConfirm(null);
    }
  };

  const tutorCount   = users.filter((u) => u.role === 'tutor').length;
  const studentCount = users.filter((u) => u.role === 'student').length;

  return (
    <div className="flex min-h-screen bg-[#f5f6fa] font-sans">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b border-[#ebebf0] px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-[#0c0d12] text-[22px] font-bold leading-none">Users</h1>
            <p className="text-[#6b6f7d] text-[13px] mt-1">
              {users.length} total · {tutorCount} tutors · {studentCount} students
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-[#ebebf0] px-8 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="relative flex-1 max-w-xs">
            <svg viewBox="0 0 16 16" fill="none" stroke="#8a90a1" strokeWidth="1.4" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 h-9 border border-[#d2d4d9] rounded-[8px] text-[13px] focus:outline-none focus:border-[#0d9488] bg-white"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 border border-[#d2d4d9] rounded-[8px] text-[13px] text-[#0c0d12] bg-white focus:outline-none focus:border-[#0d9488]"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="tutor">Tutors</option>
            <option value="admin">Admins</option>
          </select>
          <p className="text-[12px] text-[#6b6f7d] ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Table */}
        <div className="flex-1 p-8 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#ebebf0] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f0f0f5]">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#6b6f7d] uppercase tracking-wide">User</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#6b6f7d] uppercase tracking-wide">Email</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#6b6f7d] uppercase tracking-wide">Role</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#6b6f7d] uppercase tracking-wide">ID</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[#6b6f7d] text-[13px]">
                        No users found
                      </td>
                    </tr>
                  ) : filtered.map((u) => (
                    <tr key={u.id} className="border-b border-[#f8f9fc] last:border-0 hover:bg-[#f8f9fc] transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0d9488]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#0d9488] text-[11px] font-bold">
                              {(u.name || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[13px] font-medium text-[#0c0d12]">{u.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[13px] text-[#383a44]">{u.email || '-'}</td>
                      <td className="px-6 py-3">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${ROLE_STYLE[u.role] || 'bg-[#f0f0f5] text-[#6b6f7d]'}`}>
                          {u.role || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[11px] text-[#b0b5c4] font-mono">{u.id?.slice(0, 8)}…</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => setConfirm(u)}
                          disabled={deleting === u.id}
                          className="text-[12px] text-[#f24545] hover:underline disabled:opacity-40 font-medium"
                        >
                          {deleting === u.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-7 w-[400px] shadow-2xl">
            <h3 className="text-[17px] font-bold text-[#0c0d12] mb-2">Delete user?</h3>
            <p className="text-[13px] text-[#383a44] mb-6">
              Are you sure you want to delete <strong>{confirm.name || confirm.email}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 border border-[#d2d4d9] text-[#383a44] text-[13px] font-semibold py-2.5 rounded-[10px] hover:bg-[#f8f9fc] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirm)}
                disabled={deleting === confirm.id}
                className="flex-1 bg-[#f24545] text-white text-[13px] font-semibold py-2.5 rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleting === confirm.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
