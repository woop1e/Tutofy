import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import TutorTour from '../../components/onboarding/TutorTour';
import { coursesAPI } from '../../api/courses';
import { enrollmentsAPI } from '../../api/enrollments';
import { assignmentsAPI } from '../../api/assignments';
import { submissionsAPI } from '../../api/submissions';
import { lessonsAPI } from '../../api/lessons';
import { usersAPI } from '../../api/users';
import TopBarActions from '../../components/ui/TopBarActions';

const STATUS_AWAITING_PAYMENT = 5;
const STATUS_PAYMENT_EXPIRED = 6;

const COLORS = ['#0d9488', '#7c3aed', '#0ea5e9', '#ff8032', '#22c55e', '#ef4444'];
const avatarColor = (id) => COLORS[(id?.charCodeAt(0) || 0) % COLORS.length];
const getInitials = (name) =>
  (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const parseTS = (ts) => {
  if (!ts) return null;
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
  return new Date(ts);
};

const fmtTime = (d) => {
  if (!d) return '';
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};
const fmtDayLabel = (d) => {
  const today = new Date();
  const tom = new Date(); tom.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tom.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const Icon = ({ d, ...p }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5" {...p}>
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function MeetingLinkModal({ lesson, onSave, onClose }) {
  const [link, setLink]     = useState(lesson.video_link || '');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await lessonsAPI.setMeetingLink(lesson.id, link);
      onSave(lesson.id, link);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[420px] mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-[#0c0d12]">Add Meeting Link</h3>
          <button onClick={onClose} className="text-[#6b6f7d] hover:text-[#0c0d12]">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <p className="text-[13px] font-semibold text-[#0c0d12] mb-1">{lesson.title}</p>
        {lesson._timeLabel && <p className="text-[12px] text-[#6b6f7d] mb-4">{lesson._timeLabel}</p>}
        <div className="mb-4">
          <label className="block text-[12px] font-semibold text-[#383a44] mb-1">Zoom / Google Meet / Teams link</label>
          <input
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://zoom.us/j/... or meet.google.com/..."
            className="w-full border border-[#d2d4d9] rounded-[10px] px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#0d9488]"
          />
        </div>
        {error && <p className="text-[12px] text-[#f24545] mb-3">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !link.trim()}
            className="flex-1 bg-[#0d9488] text-white text-[13px] font-bold py-2.5 rounded-[10px] hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save link'}
          </button>
          <button onClick={onClose} className="px-4 border border-[#d2d4d9] text-[#383a44] text-[13px] rounded-[10px] hover:border-[#0d9488]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const TutorDashboard = () => {
  const { isAuthenticated, role, user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses]           = useState([]);
  const [lessons, setLessons]           = useState([]);
  const [ungraded, setUngraded]         = useState([]);
  const [usersMap, setUsersMap]         = useState({});
  const [totalStudents, setTotalStudents] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [dayFilter, setDayFilter]       = useState(7);
  const [profileStatus, setProfileStatus] = useState(null);
  const [isFirstTime, setIsFirstTime]   = useState(false);
  const [profileData,  setProfileData]  = useState(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => localStorage.getItem('tutor_onboarding_dismissed') === 'true'
  );
  const [showTour, setShowTour] = useState(
    () => localStorage.getItem('tutofy_tutor_tour_seen') !== 'true'
  );
  const [modalLesson, setModalLesson]   = useState(null);

  // Show tour for brand-new tutors even if the flag was set during a previous test run.
  // isFirstTime = true means the profile is still blank → guaranteed first-time user.
  useEffect(() => {
    if (isFirstTime && localStorage.getItem('tutofy_tutor_tour_done') !== 'true') {
      setShowTour(true);
    }
  }, [isFirstTime]);
  const [bookingRequests, setBookingRequests]   = useState([]);
  const [awaitingPayment, setAwaitingPayment]   = useState([]);
  const [reqLoading, setReqLoading]             = useState(false);
  const [reqAction, setReqAction]               = useState({});   // { [id]: 'confirming'|'declining'|'done'|'error' }

  const handleLinkSaved = (lessonId, link) => {
    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, video_link: link } : l));
  };

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || role !== 'tutor')) navigate('/login', { replace: true });
  }, [isLoading, isAuthenticated, role, navigate]);

  useEffect(() => {
    const uid = user?.user_id;
    if (!uid) { setLoading(false); return; }

    (async () => {
      try {
        const [coursesRes, profileRes] = await Promise.all([
          coursesAPI.getAllCourses().catch(() => ({})),
          usersAPI.getTutorProfile(uid).catch(() => null),
        ]);
        if (profileRes) {
          setProfileStatus(profileRes.status || 'pending');
          setIsFirstTime(!profileRes.phone || !profileRes.student_level);
          setProfileData(profileRes);
        }
        const tutorCourses = (coursesRes?.courses || []).filter((c) => c.tutor_id === uid);
        setCourses(tutorCourses);

        const courseData = await Promise.all(
          tutorCourses.slice(0, 10).map(async (course) => {
            const [enrRes, lRes, aRes] = await Promise.all([
              enrollmentsAPI.getCourseEnrollments(course.id).catch(() => ({ enrollments: [] })),
              lessonsAPI.getCourseLessons(course.id).catch(() => ({ lessons: [] })),
              assignmentsAPI.getCourseAssignments(course.id).catch(() => []),
            ]);
            const enrollments = enrRes?.enrollments || (Array.isArray(enrRes) ? enrRes : []);
            const courseLessons = (lRes?.lessons || []).map((l) => ({
              ...l,
              courseTitle: course.title,
              type: 'group',
            }));
            const assignments = Array.isArray(aRes) ? aRes : (aRes?.assignments || []);
            return { course, lessons: courseLessons, assignments, enrollmentCount: enrollments.length };
          })
        );

        const total = courseData.reduce((s, d) => s + d.enrollmentCount, 0);
        setTotalStudents(total);

        const now = new Date();
        const from = now.toISOString();
        const toDate = new Date(now); toDate.setDate(now.getDate() + 30);
        const scheduleRes = await lessonsAPI.getSchedule(from, toDate.toISOString()).catch(() => ({ lessons: [] }));
        const scheduleLessons = (scheduleRes?.lessons || []).map((l) => ({
          ...l,
          courseTitle: l.course_id ? undefined : 'Individual lesson',
          type: l.course_id ? 'group' : 'individual',
        }));
        const lessonById = {};
        courseData.flatMap((d) => d.lessons).forEach((l) => { lessonById[l.id] = l; });
        scheduleLessons.forEach((l) => { lessonById[l.id] = l; });
        const allLessons = Object.values(lessonById)
          .filter((l) => {
            const d = parseTS(l.scheduled_at);
            if (!d) return false;
            const lessonEnd = new Date(d.getTime() + (l.duration_minutes || 60) * 60000);
            return lessonEnd >= now;
          })
          .sort((a, b) => parseTS(a.scheduled_at) - parseTS(b.scheduled_at));
        setLessons(allLessons);

        // Fetch student info for individual lessons (tutor can't call getAllUsers — admin only)
        // Exclude the tutor's own ID — if student_id equals the tutor's ID it's a data error.
        const tutorOwnId = uid;
        const studentIds = [...new Set(allLessons.map(l => l.student_id).filter(id => id && id !== tutorOwnId))];
        const studentResults = await Promise.all(
          studentIds.map(id => usersAPI.getUserById(id).catch(() => null))
        );
        const uMap = {};
        studentIds.forEach((id, i) => { if (studentResults[i]) uMap[id] = studentResults[i]; });
        setUsersMap(uMap);

        const allAssignments = courseData.flatMap((d) =>
          d.assignments.map((a) => ({ ...a, courseTitle: d.course.title }))
        );
        const subResults = await Promise.all(
          allAssignments.slice(0, 20).map(async (a) => {
            const res = await submissionsAPI.getAssignmentSubmissions(a.id).catch(() => ({ submissions: [] }));
            const subs = res?.submissions || (Array.isArray(res) ? res : []);
            return subs
              .filter((s) => s.grade == null)
              .map((s) => ({
                assignmentId: a.id,
                assignmentTitle: a.title,
                courseName: a.courseTitle,
                studentId: s.student_id,
                studentName: uMap[s.student_id]?.name || 'Student',
                submittedAt: s.submitted_at || s.created_at,
              }));
          })
        );
        setUngraded(subResults.flat());
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user?.user_id) return;
    setReqLoading(true);
    lessonsAPI.getTutorIndividualLessons()
      .then(async (res) => {
        const all = res?.lessons || (Array.isArray(res) ? res : []);
        setBookingRequests(all.filter((l) => {
          const s = (l.status || '').toString().toLowerCase();
          return s === 'pending_confirmation' || s.includes('pending') || parseInt(l.status, 10) === 4;
        }));
        setAwaitingPayment(all.filter((l) => {
          const n = parseInt(l.status, 10);
          return n === STATUS_AWAITING_PAYMENT;
        }));
        // Fetch student names for booking/payment lessons
        const tutorOwnId = user.user_id;
        const ids = [...new Set(all.map(l => l.student_id).filter(id => id && id !== tutorOwnId))];
        if (ids.length > 0) {
          const results = await Promise.all(ids.map(id => usersAPI.getUserById(id).catch(() => null)));
          setUsersMap(prev => {
            const next = { ...prev };
            ids.forEach((id, i) => { if (results[i]) next[id] = results[i]; });
            return next;
          });
        }
      })
      .catch(() => {})
      .finally(() => setReqLoading(false));
  }, [user?.user_id]);

  const handleConfirm = async (lessonId) => {
    setReqAction((p) => ({ ...p, [lessonId]: 'confirming' }));
    try {
      await lessonsAPI.confirmLesson(lessonId);
      setBookingRequests((p) => p.filter((l) => l.id !== lessonId));
      setReqAction((p) => ({ ...p, [lessonId]: 'done' }));
    } catch {
      setReqAction((p) => ({ ...p, [lessonId]: 'error' }));
    }
  };

  const handleDecline = async (lessonId) => {
    setReqAction((p) => ({ ...p, [lessonId]: 'declining' }));
    try {
      await lessonsAPI.declineLesson(lessonId);
      setBookingRequests((p) => p.filter((l) => l.id !== lessonId));
    } catch {
      setReqAction((p) => ({ ...p, [lessonId]: 'error' }));
    }
  };

  const filteredLessons = useMemo(() => {
    const cut = new Date();
    cut.setDate(cut.getDate() + dayFilter);
    return lessons.filter((l) => !l.course_id && (parseTS(l.scheduled_at) || 0) <= cut);
  }, [lessons, dayFilter]);

  const today = new Date();
  const SCHEDULE_HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 9-19

  const lessonByHour = useMemo(() => {
    const map = {};
    lessons.forEach((l) => {
      const d = parseTS(l.scheduled_at);
      if (!d) return;
      const key = `${d.toDateString()}_${d.getHours()}`;
      map[key] = l;
    });
    return map;
  }, [lessons]);

  const daySlots = SCHEDULE_HOURS.map((h) => ({
    hour: h,
    lesson: lessonByHour[`${today.toDateString()}_${h}`] || null,
  }));

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const firstName = user?.name?.split(' ')[0] || 'Tutor';

  return (
    <div className="flex h-screen bg-[var(--bg)] font-sans">
      <TutorSidebar />

      {showTour && <TutorTour onDismiss={() => setShowTour(false)} />}

      {modalLesson && (
        <MeetingLinkModal
          lesson={modalLesson}
          onSave={handleLinkSaved}
          onClose={() => setModalLesson(null)}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-[#ebebf0] px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-[#0c0d12] text-[22px] font-bold leading-none">Dashboard</h1>
            <p className="text-[#6b6f7d] text-[13px] mt-1">Welcome back, {firstName}!</p>
          </div>
          <div className="flex items-center gap-2">
            <TopBarActions />
            <div className="w-9 h-9 rounded-full bg-[rgba(13,148,136,0.12)] flex items-center justify-center">
              <span className="text-[#0d9488] text-[12px] font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T'}
              </span>
            </div>
          </div>
        </div>

        {/* Post-approval next-step banner — shown when approved but availability not yet configured */}
        {profileStatus === 'approved' && profileData && !loading && (() => {
          const hasSchedule = !!(profileData?.available_time_start &&
                                 profileData?.available_time_start !== '' &&
                                 profileData?.available_time_start !== '09:00');
          if (hasSchedule) return null;
          return (
            <div className="mx-6 mt-4 rounded-2xl px-5 py-4 flex items-center gap-4 bg-[#0d9488]/8 border border-[#0d9488]/20">
              {/* Checkmark icon */}
              <div className="w-10 h-10 rounded-full bg-[#0d9488] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" width={18} height={18}>
                  <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[#0d9488] leading-snug">
                  Your profile has been approved!
                </p>
                <p className="text-[12px] text-[#0d9488]/80 mt-0.5 leading-snug">
                  Next step: configure your availability so students can find and book lessons with you.
                </p>
              </div>
              <Link
                to="/tutor/schedule"
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-bold text-white bg-[#0d9488] hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width={14} height={14}>
                  <rect x="1" y="2" width="14" height="12" rx="1.5"/>
                  <path d="M5 1v3M11 1v3M1 7h14" strokeLinecap="round"/>
                </svg>
                Set Availability
              </Link>
            </div>
          );
        })()}

        {/* Profile status banner */}
        {profileStatus && profileStatus !== 'approved' && (
          <div className={`mx-6 mt-4 rounded-2xl px-5 py-3 flex items-center gap-3 ${
            profileStatus === 'rejected'
              ? 'bg-[#f24545]/8 border border-[#f24545]/20'
              : 'bg-[#ff8032]/8 border border-[#ff8032]/20'
          }`}>
            <span className={`flex-shrink-0 ${profileStatus === 'rejected' ? 'text-[#f24545]' : 'text-[#ff8032]'}`}>
              {profileStatus === 'rejected' ? (
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width={18} height={18}>
                  <circle cx="10" cy="10" r="8"/><path d="M7 7l6 6M13 7l-6 6" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width={18} height={18}>
                  <circle cx="10" cy="10" r="8"/><path d="M10 6v4l2 2" strokeLinecap="round"/>
                </svg>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-semibold ${profileStatus === 'rejected' ? 'text-[#f24545]' : 'text-[#ff8032]'}`}>
                {profileStatus === 'rejected'
                  ? 'Your profile was not approved - please update and resubmit'
                  : isFirstTime
                    ? 'Set up your tutor profile to start teaching'
                    : 'Your profile is under review'}
              </p>
              <p className={`text-[11px] mt-0.5 ${profileStatus === 'rejected' ? 'text-[#f24545]/70' : 'text-[#ff8032]/70'}`}>
                {profileStatus === 'rejected'
                  ? 'Update your profile details so an admin can re-review your application.'
                  : isFirstTime
                    ? 'Fill in all required fields and submit your profile for admin review to appear in the marketplace.'
                    : 'Your profile is waiting for admin approval. You will be notified once reviewed.'}
              </p>
            </div>
            <Link to="/tutor/profile" className={`flex-shrink-0 px-4 py-2 rounded-[8px] text-[12px] font-bold text-white ${profileStatus === 'rejected' ? 'bg-[#f24545]' : 'bg-[#ff8032]'}`}>
              {profileStatus === 'rejected' ? 'Update Profile' : isFirstTime ? 'Fill in Profile' : 'View Profile'}
            </Link>
          </div>
        )}

        {/* Setup checklist — marketplace readiness (3 steps) */}
        {!onboardingDismissed && (() => {
          const isApproved  = profileStatus === 'approved';
          const hasSchedule = !!(profileData?.available_time_start &&
                                 profileData?.available_time_start !== '' &&
                                 profileData?.available_time_start !== '09:00');
          const hasCourse   = courses.length > 0;
          const allDone     = isApproved && hasSchedule && hasCourse;
          if (allDone) return null;

          const steps = [
            {
              done: isApproved,
              label: 'Get profile approved',
              desc: profileStatus === 'rejected'
                ? 'Your profile was rejected. Update and resubmit for review.'
                : profileData?.bio
                  ? 'Your profile is under admin review. You will be notified once approved.'
                  : 'Complete your professional profile and submit for admin review.',
              link: '/tutor/profile',
              cta: profileStatus === 'rejected' ? 'Update profile' : 'View profile',
            },
            {
              done: hasSchedule,
              label: 'Set your availability',
              desc: 'Configure when you are available for lessons. Students can only book you once availability is set.',
              link: '/tutor/schedule',
              cta: 'Set Availability',
            },
            {
              done: hasCourse,
              label: 'Create your first course',
              desc: 'Build a group course with lessons, assignments and quizzes for your students.',
              link: '/tutor/courses/new',
              cta: 'Create course',
            },
          ];
          const completedCount = steps.filter(s => s.done).length;
          return (
            <div className="mx-6 mt-4 bg-white rounded-[16px] border border-[#ebebf0] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#f5f6fa]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0d9488] flex items-center justify-center text-white text-[12px] font-bold">
                    {completedCount}/{steps.length}
                  </div>
                  <div>
                    <p className="text-[#0c0d12] text-[14px] font-bold">Tutor Setup Progress</p>
                    <p className="text-[#6b6f7d] text-[11px]">Complete these steps to appear in the marketplace</p>
                  </div>
                </div>
                <button
                  onClick={() => { setOnboardingDismissed(true); localStorage.setItem('tutor_onboarding_dismissed','true'); }}
                  className="text-[#6b6f7d] text-[11px] hover:text-[#0c0d12] px-2 py-1"
                >
                  Dismiss
                </button>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-[#f3f4f7]">
                <div className="h-1 bg-[#0d9488] transition-all"
                  style={{ width: `${(completedCount / steps.length) * 100}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-0 divide-x divide-[#f5f6fa]">
                {steps.map((step, i) => (
                  <div key={i} className={`p-4 flex items-start gap-3 ${step.done ? 'opacity-60' : ''}`}>
                    {step.done ? (
                      <div className="w-7 h-7 rounded-full bg-[#0d9488] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="1.8" width={10} height={10}>
                          <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-[#d2d4d9] flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold text-[#6b6f7d]">
                        {i + 1}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold mb-0.5 ${step.done ? 'text-[#6b6f7d] line-through' : 'text-[#0c0d12]'}`}>
                        {step.label}
                      </p>
                      <p className="text-[11px] text-[#6b6f7d] leading-snug mb-2">{step.desc}</p>
                      {!step.done && (
                        <Link to={step.link}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0d9488] hover:underline">
                          {step.cta} →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Warning: approved but no availability configured */}
              {isApproved && !hasSchedule && (
                <div className="mx-4 mb-4 mt-1 bg-[#fff8f0] border border-[#ff8032]/30 rounded-[12px] px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <svg viewBox="0 0 20 20" fill="none" stroke="#ff8032" strokeWidth="1.6" width={18} height={18} className="flex-shrink-0">
                      <path d="M10 3l8 14H2L10 3z" strokeLinejoin="round"/><path d="M10 9v4M10 15v.5" strokeLinecap="round"/>
                    </svg>
                    <p className="text-[12px] text-[#c05e1a] font-medium leading-snug">
                      Students cannot book lessons until you configure your availability.
                    </p>
                  </div>
                  <Link to="/tutor/schedule"
                    className="flex-shrink-0 text-[11px] font-bold text-white bg-[#ff8032] px-3 py-1.5 rounded-[7px] hover:opacity-90 whitespace-nowrap">
                    Set Availability
                  </Link>
                </div>
              )}
            </div>
          );
        })()}

        <div className="flex-1 p-6 flex gap-6 min-h-0 overflow-y-auto">

          {/* Main column */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Stat cards */}
            <div id="tour-stats" className="grid grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Students', value: totalStudents ?? '-', color: '#0d9488',
                  icon: 'M7 7a3 3 0 006 0a3 3 0 00-6 0M3 19a7 7 0 0114 0',
                },
                {
                  label: 'Active Courses', value: courses.length || '-', color: '#7c3aed',
                  icon: 'M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zM7 9h6M7 12h4',
                },
                {
                  label: 'Ungraded Assignments', value: ungraded.length, color: '#ff8032',
                  icon: 'M5 3h10a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1zM7 9h6M7 13h4',
                },
                {
                  label: 'Upcoming Meetings', value: filteredLessons.length, color: '#22c55e',
                  icon: 'M6 2v4M14 2v4M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
                },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-[14px] border border-[#ebebf0] p-5 flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{ background: s.color + '18', color: s.color }}
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                      <path d={s.icon} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#0c0d12] text-[22px] font-bold leading-none">{s.value}</p>
                    <p className="text-[#6b6f7d] text-[12px] mt-1">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Booking Requests */}
            {(reqLoading || bookingRequests.length > 0) && (
              <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[#0c0d12] text-[16px] font-bold">Booking Requests</h2>
                    {bookingRequests.length > 0 && (
                      <span className="bg-[#ff8032] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {bookingRequests.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[#6b6f7d] text-[12px]">Awaiting your confirmation</span>
                </div>

                {reqLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-[3px] border-[#0d9488] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookingRequests.map((req) => {
                      const start = parseTS(req.scheduled_at);
                      const end   = start ? new Date(start.getTime() + (req.duration_minutes || 60) * 60000) : null;
                      const action = reqAction[req.id];
                      return (
                        <div key={req.id} className="flex items-center gap-4 p-4 rounded-[12px] border border-[#ff8032]/30 bg-[#fff8f4]">
                          <div className="w-10 h-10 rounded-full bg-[#ff8032]/15 flex items-center justify-center flex-shrink-0">
                            <svg viewBox="0 0 20 20" fill="none" stroke="#ff8032" strokeWidth="1.5" className="w-5 h-5">
                              <circle cx="8" cy="6" r="3"/><path d="M2 18a6 6 0 0112 0"/>
                              <path d="M15 8l2 2 3-3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[#0c0d12] text-[14px] font-semibold truncate">
                              {usersMap[req.student_id]?.name || req.description || 'Individual lesson'}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              {start && (
                                <span className="text-[#6b6f7d] text-[12px] flex items-center gap-1">
                                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3 h-3">
                                    <rect x="1" y="2" width="12" height="11" rx="1.5"/><path d="M4 1.5v1M10 1.5v1M1 5.5h12"/>
                                  </svg>
                                  {fmtDayLabel(start)}, {fmtTime(start)} – {fmtTime(end)}
                                </span>
                              )}
                              {req.duration_minutes > 0 && (
                                <span className="text-[#6b6f7d] text-[12px]">{req.duration_minutes} min</span>
                              )}
                            </div>
                          </div>

                          {action === 'error' && (
                            <span className="text-[#f24545] text-[12px]">Error, try again</span>
                          )}

                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleDecline(req.id)}
                              disabled={action === 'confirming' || action === 'declining'}
                              className="px-3 py-2 rounded-[9px] border border-[#f24545]/40 text-[#f24545] text-[12px] font-semibold hover:bg-[#f24545]/8 disabled:opacity-50 transition-colors"
                            >
                              {action === 'declining' ? '...' : 'Decline'}
                            </button>
                            <button
                              onClick={() => handleConfirm(req.id)}
                              disabled={action === 'confirming' || action === 'declining'}
                              className="px-4 py-2 rounded-[9px] bg-[#0d9488] text-white text-[12px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                              {action === 'confirming' ? '...' : 'Confirm'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Awaiting Payment */}
            {!reqLoading && awaitingPayment.length > 0 && (
              <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[#0c0d12] text-[16px] font-bold">Awaiting Student Payment</h2>
                    <span className="bg-[#f59e0b] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {awaitingPayment.length}
                    </span>
                  </div>
                  <span className="text-[#6b6f7d] text-[12px]">Students must pay before the deadline</span>
                </div>
                <div className="space-y-3">
                  {awaitingPayment.map((lesson) => {
                    const start = parseTS(lesson.scheduled_at);
                    const end   = start ? new Date(start.getTime() + (lesson.duration_minutes || 60) * 60000) : null;
                    return (
                      <div key={lesson.id} className="flex items-center gap-4 p-4 rounded-[12px] border border-[#f59e0b]/30 bg-[#fffbeb]">
                        <div className="w-10 h-10 rounded-full bg-[#f59e0b]/15 flex items-center justify-center flex-shrink-0">
                          <svg viewBox="0 0 20 20" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="w-5 h-5">
                            <circle cx="10" cy="10" r="8"/><path d="M10 6v4l2 2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#0c0d12] text-[14px] font-semibold truncate">
                            {usersMap[lesson.student_id]?.name || lesson.description || 'Individual lesson'}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {start && (
                              <span className="text-[#6b6f7d] text-[12px]">
                                {fmtDayLabel(start)}, {fmtTime(start)} – {fmtTime(end)}
                              </span>
                            )}
                            <span className="text-[#f59e0b] text-[12px] font-semibold">Awaiting payment</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Lessons */}
            <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#0c0d12] text-[16px] font-bold">Upcoming Lessons</h2>
                <Link to="/tutor/courses" className="text-[#0d9488] text-[13px] font-medium flex items-center gap-0.5">
                  View all
                </Link>
              </div>

              {/* Day tabs */}
              <div className="flex items-center gap-2 mb-4">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDayFilter(d)}
                    className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors ${
                      dayFilter === d
                        ? 'bg-[#eef0ff] text-[#0d9488]'
                        : 'text-[#6b6f7d] hover:text-[#0c0d12] hover:bg-[var(--bg)]'
                    }`}
                  >
                    {d} days
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredLessons.length === 0 ? (
                <p className="text-[#6b6f7d] text-[13px] text-center py-10">
                  No upcoming lessons in the next {dayFilter} days
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredLessons.slice(0, 6).map((lesson) => {
                    const start = parseTS(lesson.scheduled_at);
                    const end   = start ? new Date(start.getTime() + (lesson.duration_minutes || 60) * 60000) : null;
                    const isLessonToday = !!start && start.toDateString() === today.toDateString();
                    const color = avatarColor(lesson.courseTitle || lesson.id);

                    const nowMs = Date.now();
                    const joinWindowStart = start ? start.getTime() - 5 * 60 * 1000 : null;
                    const lessonStatusNum = parseInt(lesson.status, 10);
                    const isPaid = lessonStatusNum !== STATUS_AWAITING_PAYMENT && lessonStatusNum !== STATUS_PAYMENT_EXPIRED;
                    const canJoin = isLessonToday && joinWindowStart !== null && end
                      && nowMs >= joinWindowStart && nowMs <= end.getTime() && !!lesson.video_link && isPaid;
                    const isSoon = isLessonToday && joinWindowStart !== null && nowMs < joinWindowStart;

                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-4 p-4 rounded-[12px] border border-[#ebebf0] hover:border-[#0d9488]/30 transition-colors"
                      >
                        {(() => {
                          const studentData = usersMap[lesson.student_id];
                          const studentName = studentData?.name;
                          const displayName = studentName || lesson.description || null;
                          const photoUrl = studentData?.photo_url;
                          const initials = displayName
                            ? displayName.split(/\s+/).map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
                            : '?';
                          const fallbackStyle = { background: avatarColor(lesson.student_id || lesson.id) };
                          return (
                            <>
                              {photoUrl && (
                                <img
                                  src={photoUrl}
                                  alt={displayName || ''}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextSibling.style.display = 'flex';
                                  }}
                                />
                              )}
                              <div
                                className="w-10 h-10 rounded-full items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                                style={{ ...fallbackStyle, display: photoUrl ? 'none' : 'flex' }}
                              >
                                {initials}
                              </div>
                            </>
                          );
                        })()}

                        <div className="flex-1 min-w-0">
                          {(() => {
                            const studentName = usersMap[lesson.student_id]?.name;
                            return (
                              <>
                                <p className="text-[#0c0d12] text-[14px] font-semibold truncate">
                                  {studentName || lesson.description || 'Individual lesson'}
                                </p>
                                <p className="text-[#6b6f7d] text-[11px] truncate">Individual lesson</p>
                              </>
                            );
                          })()}
                          <p className="text-[#6b6f7d] text-[12px] flex items-center gap-1 mt-0.5">
                            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3 h-3">
                              <circle cx="7" cy="7" r="5.5" /><path d="M7 4v3l2 1.5" />
                            </svg>
                            {fmtDayLabel(start)}, {fmtTime(start)} – {fmtTime(end)}
                          </p>
                        </div>

                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#0d9488]/10 text-[#0d9488]">
                          individual
                        </span>

                        {canJoin ? (
                          <a
                            href={lesson.video_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[13px] font-semibold px-4 py-2 rounded-[9px] flex items-center gap-1.5 bg-[#22be70] text-white hover:opacity-85 transition-opacity"
                          >
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                              <rect x="1" y="4" width="10" height="8" rx="1.5" />
                              <path d="M11 7l4-2v6l-4-2" />
                            </svg>
                            Join
                          </a>
                        ) : (
                          <span className="text-[13px] font-semibold px-4 py-2 rounded-[9px] bg-[#eef0ff] text-[#0d9488] select-none">
                            {isSoon ? 'Soon' : isLessonToday ? 'Today' : fmtDayLabel(start)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ungraded Assignments */}
            <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#0c0d12] text-[16px] font-bold">Ungraded Assignments</h2>
                <Link to="/tutor/grading" className="text-[#0d9488] text-[13px] font-medium">
                  View all
                </Link>
              </div>

              {loading ? (
                <p className="text-center py-6 text-[#6b6f7d] text-[13px]">Loading...</p>
              ) : ungraded.length === 0 ? (
                <p className="text-[#6b6f7d] text-[13px] text-center py-8">All assignments are graded</p>
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr>
                        {['Student', 'Course', 'Assignment', 'Submitted', ''].map((h) => (
                          <th
                            key={h}
                            className="text-left text-[#6b6f7d] text-[12px] font-medium pb-3 pr-4 last:pr-0"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ungraded.slice(0, 6).map((item, i) => (
                        <tr key={i} className="border-t border-[#f0f0f5]">
                          <td className="py-3 pr-4 text-[#0c0d12] text-[13px] font-semibold whitespace-nowrap">
                            {item.studentName}
                          </td>
                          <td className="py-3 pr-4 text-[#383a44] text-[13px] whitespace-nowrap">
                            {item.courseName}
                          </td>
                          <td className="py-3 pr-4 text-[#383a44] text-[13px]">{item.assignmentTitle}</td>
                          <td className="py-3 pr-4 text-[#6b6f7d] text-[12px] whitespace-nowrap">
                            {item.submittedAt
                              ? new Date(item.submittedAt).toLocaleDateString('en-US', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                })
                              : '-'}
                          </td>
                          <td className="py-3">
                            <Link
                              to="/tutor/grading"
                              className="bg-[#0d9488] text-white text-[12px] font-semibold px-3 py-1.5 rounded-[8px] hover:opacity-90 transition-opacity"
                            >
                              Grade
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ungraded.length > 6 && (
                    <div className="mt-4 pt-4 border-t border-[#f0f0f5] text-center">
                      <Link to="/tutor/grading" className="text-[#0d9488] text-[13px] font-medium">
                        View all ungraded assignments ({ungraded.length})
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Schedule column (sticky) */}
          <div className="w-[270px] flex-shrink-0">
            <div className="bg-white rounded-[16px] border border-[#ebebf0] p-5 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#0c0d12] text-[15px] font-bold">My Schedule</h2>
                <button
                  onClick={() => navigate('/tutor/schedule')}
                  className="text-[#0d9488] text-[12px] font-medium hover:opacity-80">
                  View full calendar
                </button>
              </div>

              {/* Week mini-calendar */}
              <div className="grid grid-cols-7 gap-0.5 mb-5">
                {weekDays.map((d, i) => {
                  const isToday = d.toDateString() === today.toDateString();
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <span className="text-[#6b6f7d] text-[10px]">{DAY_LABELS[i]}</span>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold mt-0.5 ${
                          isToday ? 'bg-[#0d9488] text-white' : 'text-[#0c0d12]'
                        }`}
                      >
                        {d.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Today's time slots */}
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {daySlots.map(({ hour, lesson }) => (
                  <div key={hour} className="flex items-start gap-2">
                    <span className="text-[#6b6f7d] text-[11px] w-9 pt-1.5 flex-shrink-0 tabular-nums">
                      {hour}:00
                    </span>
                    {lesson ? (
                      <div className="flex-1 bg-[#eef0ff] border border-[#0d9488]/25 rounded-[8px] px-2.5 py-2">
                        <div className="text-[9px] font-bold text-[#0d9488] uppercase tracking-wide">Booked</div>
                        <div className="text-[#0c0d12] text-[11px] font-semibold mt-0.5 truncate">
                          {lesson.title || lesson.courseTitle}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 bg-[#f8f9fb] rounded-[8px] px-2.5 py-2">
                        <span className="text-[#c4c8d4] text-[11px]">Free</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Manage schedule */}
              <button
                onClick={() => navigate('/tutor/schedule')}
                className="w-full mt-4 bg-[#0d9488] text-white text-[13px] font-semibold py-2.5 rounded-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <rect x="1" y="4" width="10" height="8" rx="1.5" />
                  <path d="M11 7l4-2v6l-4-2" />
                </svg>
                Manage schedule
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;
