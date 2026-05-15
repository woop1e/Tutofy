import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { coursesAPI } from '../../api/courses';
import { usersAPI } from '../../api/users';

const AdminCourses = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses]     = useState([]);
  const [usersMap, setUsersMap]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [acting, setActing]       = useState(null);
  const [confirm, setConfirm]     = useState(null);

  useEffect(() => {
    if (!isAuthenticated || role !== 'admin') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    Promise.all([
      coursesAPI.getAllCourses().catch(() => ({})),
      usersAPI.getAllUsers().catch(() => ({})),
    ]).then(([cRes, uRes]) => {
      setCourses(cRes?.courses || []);
      const map = {};
      (uRes?.users || []).forEach((u) => { map[u.id] = u; });
      setUsersMap(map);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = courses;
    if (statusFilter === 'published') list = list.filter((c) => c.is_published);
    if (statusFilter === 'draft')     list = list.filter((c) => !c.is_published);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => (c.title || '').toLowerCase().includes(q));
    }
    return list;
  }, [courses, statusFilter, search]);

  const handlePublish = async (course) => {
    setActing(course.id);
    try {
      await coursesAPI.publishCourse(course.id);
      setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, is_published: true } : c));
    } catch {}
    finally { setActing(null); }
  };

  const handleDelete = async (course) => {
    setActing(course.id);
    try {
      await coursesAPI.deleteCourse(course.id);
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
    } catch {}
    finally { setActing(null); setConfirm(null); }
  };

  const published = courses.filter((c) => c.is_published).length;

  return (
    <div className="flex min-h-screen bg-[#f5f6fa] font-sans">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="bg-white border-b border-[#ebebf0] px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-[#181b26] text-[22px] font-bold leading-none">Courses</h1>
            <p className="text-[#8a90a1] text-[13px] mt-1">
              {courses.length} total · {published} published · {courses.length - published} drafts
            </p>
          </div>
        </div>

        <div className="bg-white border-b border-[#ebebf0] px-8 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="relative flex-1 max-w-xs">
            <svg viewBox="0 0 16 16" fill="none" stroke="#8a90a1" strokeWidth="1.4" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-9 pr-3 h-9 border border-[#d2d4d9] rounded-[8px] text-[13px] focus:outline-none focus:border-[#4c6eff] bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 border border-[#d2d4d9] rounded-[8px] text-[13px] text-[#181b26] bg-white focus:outline-none focus:border-[#4c6eff]"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <p className="text-[12px] text-[#8a90a1] ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        </div>

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
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#8a90a1] uppercase tracking-wide">Course</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#8a90a1] uppercase tracking-wide">Tutor</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#8a90a1] uppercase tracking-wide">Price</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#8a90a1] uppercase tracking-wide">Status</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#8a90a1] uppercase tracking-wide">Students</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-[#8a90a1] text-[13px]">No courses found</td>
                    </tr>
                  ) : filtered.map((c) => {
                    const tutor = usersMap[c.tutor_id];
                    return (
                      <tr key={c.id} className="border-b border-[#f8f9fc] last:border-0 hover:bg-[#f8f9fc] transition-colors">
                        <td className="px-6 py-3">
                          <div>
                            <p className="text-[13px] font-semibold text-[#181b26] truncate max-w-[220px]">{c.title}</p>
                            <p className="text-[11px] text-[#8a90a1] truncate max-w-[220px]">{c.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-[13px] text-[#4c5162]">{tutor?.name || '—'}</p>
                          <p className="text-[11px] text-[#b0b5c4]">{tutor?.email || ''}</p>
                        </td>
                        <td className="px-6 py-3 text-[13px] text-[#4c5162]">
                          {c.price > 0 ? `$${c.price}` : <span className="text-[#22be70] font-medium">Free</span>}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                            c.is_published ? 'bg-[#22be70]/10 text-[#22be70]' : 'bg-[#f0f0f5] text-[#8a90a1]'
                          }`}>
                            {c.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-[13px] text-[#4c5162]">
                          {c.max_students > 0 ? `— / ${c.max_students}` : '—'}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3 justify-end">
                            {!c.is_published && (
                              <button
                                onClick={() => handlePublish(c)}
                                disabled={acting === c.id}
                                className="text-[12px] text-[#4c6eff] hover:underline font-medium disabled:opacity-40"
                              >
                                Publish
                              </button>
                            )}
                            <button
                              onClick={() => setConfirm(c)}
                              disabled={acting === c.id}
                              className="text-[12px] text-[#f24545] hover:underline font-medium disabled:opacity-40"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-7 w-[420px] shadow-2xl">
            <h3 className="text-[17px] font-bold text-[#181b26] mb-2">Delete course?</h3>
            <p className="text-[13px] text-[#4c5162] mb-6">
              Are you sure you want to delete <strong>"{confirm.title}"</strong>? All enrollments and lessons will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 border border-[#d2d4d9] text-[#4c5162] text-[13px] font-semibold py-2.5 rounded-[10px] hover:bg-[#f8f9fc] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirm)}
                disabled={acting === confirm.id}
                className="flex-1 bg-[#f24545] text-white text-[13px] font-semibold py-2.5 rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {acting === confirm.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
