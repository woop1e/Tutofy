import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { coursesAPI } from '../../api/courses';
import NotificationBell from '../../components/ui/NotificationBell';
import { enrollmentsAPI } from '../../api/enrollments';
import { lessonsAPI } from '../../api/lessons';
import { messagingAPI } from '../../api/messaging';

const ACCENT = [
  { bg: 'bg-primary/20',     text: 'text-primary' },
  { bg: 'bg-purple/20',      text: 'text-purple' },
  { bg: 'bg-teal/20',        text: 'text-teal' },
  { bg: 'bg-orange/20',      text: 'text-orange' },
  { bg: 'bg-[#22be70]/20',   text: 'text-[#22be70]' },
];

const initials = (name) =>
  (name || '??').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const TutorStudents = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();

  // Core data
  const [students, setStudents]         = useState([]); // [{id, name}]
  const [enrollmentMap, setEnrollmentMap] = useState({}); // {student_id → [course]}
  const [lessonMap, setLessonMap]       = useState({}); // {student_id → lesson}
  const [courses, setCourses]           = useState([]);
  const [loading, setLoading]           = useState(true);

  const [search, setSearch]             = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');

  useEffect(() => {
    if (!isAuthenticated || role !== 'tutor') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    const tutorId = user?.user_id;
    if (!tutorId) { setLoading(false); return; }

    const p1 = messagingAPI.getMyStudents()
      .then((res) => setStudents(res?.students || []))
      .catch(() => {});

    const p2 = coursesAPI.getAllCourses()
      .then(async (res) => {
        const all = res?.courses || [];
        const tutorCourses = all.filter((c) => c.tutor_id === tutorId);
        setCourses(tutorCourses);

        // Build enrollment map: student_id → array of courses
        const map = {};
        await Promise.all(
          tutorCourses.map(async (c) => {
            try {
              const data = await enrollmentsAPI.getCourseEnrollments(c.id);
              const list = data?.enrollments || (Array.isArray(data) ? data : []);
              for (const e of list) {
                const sid = e.user_id || e.student_id;
                if (!sid) continue;
                if (!map[sid]) map[sid] = [];
                map[sid].push(c);
              }
            } catch { /* ignore */ }
          })
        );
        setEnrollmentMap(map);
      })
      .catch(() => {});

    const p3 = lessonsAPI.getTutorIndividualLessons()
      .then((res) => {
        const lessons = res?.lessons || [];
        // Keep most recent lesson per student
        const map = {};
        for (const l of lessons) {
          const sid = l.student_id;
          if (!sid) continue;
          const existing = map[sid];
          if (!existing || new Date(l.scheduled_at) > new Date(existing.scheduled_at)) {
            map[sid] = l;
          }
        }
        setLessonMap(map);
      })
      .catch(() => {});

    Promise.all([p1, p2, p3]).finally(() => setLoading(false));
  }, [user]);

  // Merge: each student gets course list + individual lesson
  const allStudents = useMemo(() => {
    return students.map((s) => ({
      ...s,
      courses: enrollmentMap[s.id] || [],
      lesson:  lessonMap[s.id] || null,
    }));
  }, [students, enrollmentMap, lessonMap]);

  const filtered = useMemo(() => {
    let result = allStudents;
    if (selectedCourse === 'private') {
      result = result.filter((s) => s.courses.length === 0 && s.lesson);
    } else if (selectedCourse !== 'all') {
      result = result.filter((s) => s.courses.some((c) => String(c.id) === selectedCourse));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.courses.some((c) => c.title?.toLowerCase().includes(q))
      );
    }
    return result;
  }, [allStudents, selectedCourse, search]);

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <TutorSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white h-[68px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)] flex items-center px-7 justify-between flex-shrink-0">
          <div>
            <p className="text-dark text-[20px] font-bold">My Students</p>
            <p className="text-muted text-[13px]">Course enrollments & private lessons</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="w-9 h-9 rounded-full bg-[rgba(13,148,136,0.12)] flex items-center justify-center">
              <span className="text-[#0d9488] text-[12px] font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center bg-white border border-light-muted rounded-[10px] px-3 h-[40px] w-[300px] shadow-sm">
              <svg viewBox="0 0 16 16" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-4 h-4 mr-2 flex-shrink-0">
                <circle cx="7" cy="7" r="5"/><path d="M11 11l3 3" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="flex-1 bg-transparent text-[13px] text-body placeholder-muted outline-none"
              />
            </div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-white border border-light-muted rounded-[10px] px-4 h-[40px] text-[13px] text-body outline-none shadow-sm"
            >
              <option value="all">All Students</option>
              <option value="private">Private Lessons Only</option>
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.title}</option>
              ))}
            </select>
            <span className="text-muted text-[13px] ml-auto">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <p className="text-dark text-[17px] font-semibold mb-2">No students yet</p>
              <p className="text-muted text-[14px]">
                {allStudents.length === 0
                  ? 'Students will appear here once they enroll in a course or book a private lesson'
                  : 'No students match your search'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_1fr_150px_120px_100px] px-5 py-3 border-b border-border text-muted text-[12px] font-medium uppercase tracking-wide">
                <span>Student</span>
                <span>Type / Course</span>
                <span>Next / Last Lesson</span>
                <span>Status</span>
                <span />
              </div>

              <div className="divide-y divide-border">
                {filtered.map((s, i) => {
                  const c = ACCENT[i % ACCENT.length];
                  const hasPrivateLesson = !!s.lesson;
                  const isEnrolled = s.courses.length > 0;

                  // Lesson status
                  let lessonStatus = null;
                  if (hasPrivateLesson) {
                    const st = s.lesson.status;
                    const isCompleted = st === 'LESSON_STATUS_COMPLETED' || st === 2 || st === 'completed';
                    const isCancelled = st === 'LESSON_STATUS_CANCELLED' || st === 3 || st === 'cancelled';
                    if (isCancelled)      lessonStatus = { bg: 'bg-red-50',          text: 'text-red-500',     label: 'Cancelled' };
                    else if (isCompleted) lessonStatus = { bg: 'bg-[#22be70]/10',    text: 'text-[#22be70]',   label: 'Completed' };
                    else if (s.lesson.video_link) lessonStatus = { bg: 'bg-[#22be70]/10', text: 'text-[#22be70]', label: 'Link ready' };
                    else                  lessonStatus = { bg: 'bg-orange-50',        text: 'text-orange-500',  label: 'Pending link' };
                  }

                  return (
                    <div key={s.id} className="grid grid-cols-[1fr_1fr_150px_120px_100px] px-5 py-4 items-center hover:bg-surface transition-colors">

                      {/* Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                          <span className={`${c.text} text-[12px] font-bold`}>{initials(s.name)}</span>
                        </div>
                        <p className="text-dark text-[13px] font-medium truncate">{s.name || 'Student'}</p>
                      </div>

                      {/* Type / courses */}
                      <div className="flex flex-wrap gap-1.5 min-w-0 pr-3">
                        {isEnrolled ? (
                          s.courses.map((co) => (
                            <span key={co.id} className="bg-primary/10 text-primary text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap truncate max-w-[160px]">
                              {co.title}
                            </span>
                          ))
                        ) : (
                          <span className="bg-[#00beb7]/10 text-[#00beb7] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                            Private lesson
                          </span>
                        )}
                      </div>

                      {/* Lesson date */}
                      <p className="text-body text-[12px] pr-2">
                        {hasPrivateLesson
                          ? formatDate(s.lesson.scheduled_at)
                          : '—'}
                      </p>

                      {/* Status */}
                      <div>
                        {hasPrivateLesson && lessonStatus ? (
                          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${lessonStatus.bg} ${lessonStatus.text}`}>
                            {lessonStatus.label}
                          </span>
                        ) : isEnrolled ? (
                          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                            Enrolled
                          </span>
                        ) : null}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2">
                        {hasPrivateLesson && !s.lesson?.video_link &&
                          !(s.lesson?.status === 'LESSON_STATUS_COMPLETED' || s.lesson?.status === 2) &&
                          !(s.lesson?.status === 'LESSON_STATUS_CANCELLED' || s.lesson?.status === 3) && (
                          <button
                            onClick={() => navigate('/tutor/schedule')}
                            className="text-[11px] font-semibold text-[#00beb7] border border-[#00beb7]/30 rounded-[8px] px-2.5 py-1.5 hover:bg-[#00beb7]/10 transition-colors whitespace-nowrap"
                          >
                            Add link
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/tutor/students/${s.id}`)}
                          className="text-[12px] font-semibold text-primary border border-primary/30 rounded-[8px] px-3 py-1.5 hover:bg-primary/10 transition-colors whitespace-nowrap"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorStudents;
