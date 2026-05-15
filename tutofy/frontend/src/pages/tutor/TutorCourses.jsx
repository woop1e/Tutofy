import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { coursesAPI } from '../../api/courses';
import { enrollmentsAPI } from '../../api/enrollments';
import { lessonsAPI } from '../../api/lessons';
import { assignmentsAPI } from '../../api/assignments';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'object' && val.seconds != null) return new Date(Number(val.seconds) * 1000);
  const d = new Date(String(val).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

function fmtUpcoming(val) {
  const d = parseDate(val);
  if (!d) return null;
  const now = new Date();
  const diff = d - now;
  if (diff < 0) return null;
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${day}, ${time}`;
}

function formatPrice(price) {
  if (!price || price === 0) return 'Free';
  return new Intl.NumberFormat('ru-KZ').format(price) + ' ₸';
}

const GRADIENTS = [
  ['#4c6eff', '#935bf5'],
  ['#22be70', '#00beb7'],
  ['#ff8032', '#f24545'],
  ['#935bf5', '#4c6eff'],
  ['#00beb7', '#185FA5'],
  ['#f24545', '#ff8032'],
];
function courseGrad(id) {
  const n = (id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENTS[n % GRADIENTS.length];
}

function getStatus(course) {
  if (course.is_published) return { label: 'Active', color: '#22be70', bg: 'rgba(34,190,112,0.18)' };
  return { label: 'Draft', color: '#8a90a1', bg: 'rgba(138,144,161,0.18)' };
}

// ── icons ─────────────────────────────────────────────────────────────────────

const StudentsIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
    <circle cx="6" cy="5" r="2.5"/><path d="M1 13a5 5 0 0110 0"/>
    <circle cx="12" cy="6" r="2"/><path d="M11 13a4 4 0 014 0" strokeLinecap="round"/>
  </svg>
);
const CalIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
    <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 2v2M11 2v2M2 7h12"/>
  </svg>
);
const AssignIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
    <path d="M4 2h8l2 2v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
    <path d="M6 7h4M6 10h3" strokeLinecap="round"/>
  </svg>
);

// ── CourseCard ────────────────────────────────────────────────────────────────

const CourseCard = ({ course, extra, onDelete, deleting }) => {
  const [c1, c2] = courseGrad(course.id);
  const status = getStatus(course);
  const initials = (course.title || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const students = extra?.students ?? null;
  const upcoming = extra?.upcoming ? fmtUpcoming(extra.upcoming.scheduled_at) : null;
  const assignments = extra?.assignments ?? null;

  return (
    <div className="bg-white rounded-[18px] border border-[#f0f0f5] overflow-hidden flex flex-col hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] transition-shadow duration-200">

      {/* Cover */}
      <div className="h-[120px] relative flex items-center justify-center flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
        <span className="text-[52px] font-black select-none"
          style={{ color: 'rgba(255,255,255,0.18)', lineHeight: 1 }}>{initials}</span>

        {/* Status */}
        <span className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: status.bg, color: '#fff', backdropFilter: 'blur(4px)' }}>
          {status.label}
        </span>

        {/* Edit shortcut */}
        <Link to={`/tutor/courses/${course.id}/edit`}
          className="absolute top-3 left-3 w-7 h-7 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center transition-colors"
          title="Edit course info">
          <svg viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.4" className="w-3.5 h-3.5">
            <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">

        {/* Title */}
        <h3 className="text-[#181b26] text-[14px] font-bold leading-snug mb-2 line-clamp-2">{course.title}</h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {course.subject && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(76,110,255,0.08)] text-[#4c6eff]">
              {course.subject}
            </span>
          )}
          {course.level && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f3f4f7] text-[#8a90a1] capitalize">
              {course.level}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-0 mb-3 rounded-[10px] bg-[#f8f9fc] overflow-hidden border border-[#f0f0f5]">
          {[
            { icon: <StudentsIcon />, value: students !== null ? students : '—', label: 'Students' },
            { icon: <CalIcon />,      value: upcoming || '—',                   label: 'Next lesson', small: !!upcoming },
            { icon: <AssignIcon />,   value: assignments !== null ? assignments : '—', label: 'Assignments' },
          ].map((s, i) => (
            <div key={i} className={`py-2.5 px-1 text-center ${i > 0 ? 'border-l border-[#f0f0f5]' : ''}`}>
              <div className="flex justify-center text-[#8a90a1] mb-1">{s.icon}</div>
              <p className={`text-[#181b26] font-bold leading-tight ${s.small ? 'text-[10px]' : 'text-[15px]'}`}>
                {s.value}
              </p>
              <p className="text-[#b0b5c4] text-[9px] mt-0.5 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Price */}
        <p className="text-[#181b26] text-[15px] font-bold mb-3">{formatPrice(course.price)}</p>

        {/* Buttons */}
        <div className="flex gap-2 mt-auto">
          <Link to={`/tutor/courses/${course.id}`}
            className="flex-1 text-center bg-[#4c6eff] text-white text-[12px] font-semibold py-2 rounded-[8px] hover:opacity-90 transition-opacity">
            View
          </Link>
          <button
            onClick={() => onDelete(course.id)}
            disabled={deleting === course.id}
            className="text-[12px] font-semibold text-[#f24545] border border-[rgba(242,69,69,0.3)] px-3 py-2 rounded-[8px] hover:bg-[rgba(242,69,69,0.06)] disabled:opacity-40 transition-colors">
            {deleting === course.id ? '…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── main page ─────────────────────────────────────────────────────────────────

const TutorCourses = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();

  const [courses,     setCourses]     = useState([]);
  const [extraData,   setExtraData]   = useState({});
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState('all');
  const [deleting,    setDeleting]    = useState(null);

  useEffect(() => {
    if (!isAuthenticated || role !== 'tutor') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  // Load courses
  useEffect(() => {
    const userId = user?.user_id;
    if (!userId) { setLoading(false); return; }
    coursesAPI.getAllCourses()
      .then(res => {
        const all = res?.courses || [];
        setCourses(all.filter(c => c.tutor_id === userId || !c.tutor_id));
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [user]);

  // Load per-course extra data after courses are fetched
  useEffect(() => {
    if (courses.length === 0) return;
    Promise.all(courses.map(async c => {
      const [enrRes, lessonRes, assignRes] = await Promise.allSettled([
        enrollmentsAPI.getCourseEnrollments(c.id),
        lessonsAPI.getCourseLessons(c.id),
        assignmentsAPI.getCourseAssignments(c.id),
      ]);

      const students = enrRes.status === 'fulfilled'
        ? (Array.isArray(enrRes.value) ? enrRes.value.length : (enrRes.value?.enrollments?.length ?? 0))
        : 0;

      const allLessons = lessonRes.status === 'fulfilled'
        ? (Array.isArray(lessonRes.value) ? lessonRes.value : lessonRes.value?.lessons || [])
        : [];
      const now = new Date();
      const upcoming = allLessons
        .map(l => ({ ...l, _d: parseDate(l.scheduled_at) }))
        .filter(l => l._d && l._d > now)
        .sort((a, b) => a._d - b._d)[0] || null;

      const allAssignments = assignRes.status === 'fulfilled'
        ? (Array.isArray(assignRes.value) ? assignRes.value : assignRes.value?.assignments || [])
        : [];
      // count ungraded: assignments without a graded submission
      const ungraded = allAssignments.filter(a => !a.graded_count || a.graded_count < (students || 1)).length;

      return { courseId: c.id, students, upcoming, assignments: allAssignments.length, ungraded };
    })).then(results => {
      const map = {};
      results.forEach(r => { map[r.courseId] = r; });
      setExtraData(map);
    });
  }, [courses]);

  const filtered = useMemo(() => {
    let r = courses;
    if (statusFilter === 'active') r = r.filter(c => c.is_published);
    if (statusFilter === 'draft')  r = r.filter(c => !c.is_published);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(c => (c.title || '').toLowerCase().includes(q) || (c.subject || '').toLowerCase().includes(q));
    }
    return r;
  }, [courses, statusFilter, search]);

  const handleDelete = async (courseId) => {
    if (!window.confirm('Delete this course? This cannot be undone.')) return;
    setDeleting(courseId);
    try {
      await coursesAPI.deleteCourse(courseId);
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch {}
    finally { setDeleting(null); }
  };

  const activeCount = courses.filter(c => c.is_published).length;
  const draftCount  = courses.filter(c => !c.is_published).length;
  const totalStudents = Object.values(extraData).reduce((s, d) => s + (d.students || 0), 0);

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <TutorSidebar />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-7 justify-between flex-shrink-0">
          <div>
            <p className="text-[#181b26] text-[20px] font-bold">My Courses</p>
            <p className="text-[#8a90a1] text-[12px]">{courses.length} courses · {totalStudents} students total</p>
          </div>
          <Link to="/tutor/courses/new"
            className="bg-[#4c6eff] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-[0_4px_14px_rgba(76,110,255,0.3)]">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
              <path d="M7 2v10M2 7h10" strokeLinecap="round"/>
            </svg>
            New Course
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total courses', value: courses.length, color: '#4c6eff', icon: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4z M7 9h6M7 12h4' },
              { label: 'Active',        value: activeCount,    color: '#22be70', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Drafts',        value: draftCount,     color: '#ffa61a', icon: 'M11 5H6a2 2 0 00-2 2v11m0 0a2 2 0 002 2h11a2 2 0 002-2V9m-3-7l3 3m0 0v6m0-6H9' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-[14px] border border-[#f0f0f5] p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: s.color + '18' }}>
                  <svg viewBox="0 0 20 20" fill="none" stroke={s.color} strokeWidth="1.5" className="w-5 h-5">
                    <path d={s.icon} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[22px] font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[#8a90a1] text-[12px] mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex bg-white border border-[#e8eaef] rounded-[10px] overflow-hidden">
              {[
                { key: 'all',    label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'draft',  label: 'Draft' },
              ].map(f => (
                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                  className={`px-4 py-2 text-[12px] font-medium transition-colors ${
                    statusFilter === f.key
                      ? 'bg-[#4c6eff] text-white'
                      : 'text-[#8a90a1] hover:text-[#181b26]'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-white border border-[#e8eaef] rounded-[10px] px-3 h-[36px] w-[260px]">
              <svg viewBox="0 0 16 16" fill="none" stroke="#8a90a1" strokeWidth="1.4" className="w-4 h-4 flex-shrink-0 mr-2">
                <circle cx="7" cy="7" r="5"/><path d="M11 11l3 3" strokeLinecap="round"/>
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search courses…"
                className="flex-1 bg-transparent text-[12px] text-[#181b26] placeholder-[#b0b5c4] outline-none" />
            </div>

            <span className="text-[#8a90a1] text-[12px] ml-auto">{filtered.length} results</span>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-[#4c6eff] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-[18px] border border-[#f0f0f5] p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.4" className="w-7 h-7">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"/><path d="M7 9h6M7 12h4" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-[#181b26] text-[16px] font-bold mb-1">
                {courses.length === 0 ? "No courses yet" : "No courses match your filter"}
              </p>
              <p className="text-[#8a90a1] text-[13px] mb-5">
                {courses.length === 0 ? "Create your first course to get started" : "Try adjusting the search or filter"}
              </p>
              {courses.length === 0 && (
                <Link to="/tutor/courses/new"
                  className="inline-block bg-[#4c6eff] text-white text-[13px] font-semibold px-6 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity">
                  + Create your first course
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {filtered.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  extra={extraData[course.id] || null}
                  onDelete={handleDelete}
                  deleting={deleting}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorCourses;
