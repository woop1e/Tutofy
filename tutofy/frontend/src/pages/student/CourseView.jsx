﻿import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { lessonsAPI } from '../../api/lessons';
import TopBarActions from '../../components/ui/TopBarActions';
import { assignmentsAPI } from '../../api/assignments';
import { coursesAPI } from '../../api/courses';
import { submissionsAPI } from '../../api/submissions';
import { mediaAPI } from '../../api/media';
import { quizzesAPI } from '../../api/quizzes';
import { reviewsAPI } from '../../api/reviews';
import { progressAPI } from '../../api/progress';
import { certificatesAPI } from '../../api/certificates';

function parseAssignmentDescription(text) {
  if (!text) return { plain: '', files: [] };
  const fileRegex = /\n\n__file__:([^:\n]+):(.+)/g;
  const files = [];
  let match;
  while ((match = fileRegex.exec(text)) !== null) {
    files.push({ id: match[1].trim(), name: match[2].trim() });
  }
  const plain = text.replace(/\n\n__file__:[^:\n]+:.+/g, '').trim();
  return { plain, files };
}

function AttachmentDownloadButton({ id, name }) {
  const [loading, setLoading] = React.useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        try {
          const res = await mediaAPI.getDownloadURL(id);
          window.open(res.url, '_blank');
        } catch {}
        setLoading(false);
      }}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#e8eaef] bg-[#f8f9fc] hover:bg-[#f0f2ff] hover:border-[#0d9488] transition-colors w-full text-left disabled:opacity-60"
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="#6b6f7d" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
        <path d="M5 3h8l4 4v11a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z"/>
        <path d="M13 3v4h4M7 11h6M7 14h4" strokeLinecap="round"/>
      </svg>
      <span className="text-[12px] text-[#0c0d12] font-medium truncate flex-1">{name}</span>
      {loading
        ? <div className="w-3.5 h-3.5 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin flex-shrink-0" />
        : <svg viewBox="0 0 16 16" fill="none" stroke="#0d9488" strokeWidth="1.5" className="w-3.5 h-3.5 flex-shrink-0"><path d="M8 3v7M5 7l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13h10" strokeLinecap="round"/></svg>
      }
    </button>
  );
}

// â"€â"€ helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'object' && val.seconds != null) return new Date(Number(val.seconds) * 1000);
  const s = String(val).replace(' ', 'T');
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(val) {
  const d = parseDate(val);
  if (!d) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isNoteLesson(item) {
  if (!item || item._type !== 'lesson') return false;
  return !item.video_link && !!item.course_id;
}

function formatDuration(mins) {
  if (!mins) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function getMonday(d) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(m.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

function groupIntoWeeks(items) {
  // Treat items with no date OR sentinel dates (year ≤ 2000) as "General" section
  const withDate = items.filter(i => i._date && i._date.getFullYear() > 2000);
  const noDate   = items.filter(i => !i._date || i._date.getFullYear() <= 2000);
  const result   = [];

  if (noDate.length) result.push({ label: 'General', dateRange: '', items: noDate });
  if (!withDate.length) return result;

  const weekStart = getMonday(withDate[0]._date);
  const MS_WEEK   = 7 * 24 * 3600 * 1000;
  const weekMap   = new Map();

  withDate.forEach(item => {
    const key = Math.max(0, Math.floor((item._date - weekStart) / MS_WEEK));
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key).push(item);
  });

  let n = 1;
  [...weekMap.keys()].sort((a, b) => a - b).forEach(key => {
    const ws  = new Date(weekStart.getTime() + key * MS_WEEK);
    const we  = new Date(ws.getTime() + 6 * 24 * 3600 * 1000);
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    result.push({ label: `Week ${n++}`, dateRange: `${fmt(ws)} - ${fmt(we)}`, items: weekMap.get(key) });
  });
  return result;
}

// â"€â"€ icons â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const VideoIcon = ({ color = '#0d9488' }) => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke={color} strokeWidth="1.5">
    <path d="M3 6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"/>
    <path d="M15 9l4-2v6l-4-2" stroke={color} strokeWidth="1.5"/>
  </svg>
);

const DocIcon = ({ color = '#ffa61a' }) => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke={color} strokeWidth="1.5">
    <path d="M5 2h8l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z"/>
    <path d="M13 2v4h4M7 9h6M7 12h6M7 15h4" strokeLinecap="round"/>
  </svg>
);

const ChevronDown = ({ open }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"
    className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
    <path d="M4 6l4 4 4-4"/>
  </svg>
);

const QuizIcon = ({ color = '#935bf5' }) => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke={color} strokeWidth="1.5">
    <path d="M10 18a8 8 0 100-16 8 8 0 000 16z"/>
    <path d="M7.5 8a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5" strokeLinecap="round"/>
    <circle cx="10" cy="14" r="0.5" fill={color}/>
  </svg>
);

const CheckCircle = () => (
  <div className="w-5 h-5 rounded-full bg-[#22be70] flex items-center justify-center flex-shrink-0">
    <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const StarIcon = ({ filled, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill={filled ? '#fbbf24' : 'none'}
    stroke={filled ? '#fbbf24' : '#d1d5db'} strokeWidth="1.5">
    <path d="M10 2l2.4 5 5.6.8-4 3.9 1 5.5L10 14.5l-5 2.7 1-5.5L2 7.8l5.6-.8z"/>
  </svg>
);

// â"€â"€ component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const CourseView = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();
  const { id: courseId } = useParams();

  const [course,      setCourse]      = useState(null);
  const [lessons,     setLessons]     = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes,     setQuizzes]     = useState([]);
  const [loading,     setLoading]     = useState(true);

  const [expandedWeeks,  setExpandedWeeks]  = useState(new Set([0]));
  const [expandedItem,   setExpandedItem]   = useState(null);

  const [answers,        setAnswers]        = useState({});
  const [files,          setFiles]          = useState({});
  const [submitting,     setSubmitting]     = useState(null);
  const [submitted,      setSubmitted]      = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [submitError,    setSubmitError]    = useState({});

  const [completionPct,    setCompletionPct]    = useState(0);
  const [certificate,      setCertificate]      = useState(null);
  const [certIssuing,      setCertIssuing]      = useState(false);
  const [certError,        setCertError]        = useState('');

  const [reviews,          setReviews]          = useState([]);
  const [courseRating,     setCourseRating]     = useState(null);
  const [reviewText,       setReviewText]       = useState('');
  const [reviewRating,     setReviewRating]     = useState(0);
  const [hoverRating,      setHoverRating]      = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted,  setReviewSubmitted]  = useState(false);
  const [reviewError,      setReviewError]      = useState('');

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    Promise.all([
      coursesAPI.getCourseById(courseId).catch(() => null),
      lessonsAPI.getCourseLessons(courseId).catch(() => ({})),
      assignmentsAPI.getCourseAssignments(courseId).catch(() => ({})),
      quizzesAPI.getCourseQuizzes(courseId).catch(() => ({})),
      reviewsAPI.getCourseReviews(courseId).catch(() => ({})),
      reviewsAPI.getCourseRating(courseId).catch(() => null),
    ]).then(([cRes, lRes, aRes, qRes, rvRes, ratingRes]) => {
      setCourse(cRes?.course || cRes);
      const ls = lRes?.lessons || lRes || [];
      setLessons(Array.isArray(ls) ? ls : []);
      const as = aRes?.assignments || aRes || [];
      setAssignments(Array.isArray(as) ? as : []);
      const qs = qRes?.quizzes || qRes || [];
      setQuizzes(Array.isArray(qs) ? qs : []);
      const rv = rvRes?.reviews || rvRes || [];
      setReviews(Array.isArray(rv) ? rv : []);
      if (ratingRes) setCourseRating(ratingRes);
    }).finally(() => setLoading(false));
  }, [courseId]);

  const handleReviewSubmit = async () => {
    if (reviewRating === 0) { setReviewError('Please select a star rating.'); return; }
    if (!reviewText.trim()) { setReviewError('Please write a review.'); return; }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      await reviewsAPI.submitReview({ course_id: courseId, rating: reviewRating, body: reviewText.trim() });
      setReviewSubmitted(true);
      const [rvRes, ratingRes] = await Promise.all([
        reviewsAPI.getCourseReviews(courseId).catch(() => ({})),
        reviewsAPI.getCourseRating(courseId).catch(() => null),
      ]);
      const rv = rvRes?.reviews || rvRes || [];
      setReviews(Array.isArray(rv) ? rv : []);
      if (ratingRes) setCourseRating(ratingRes);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || '';
      if (msg.toLowerCase().includes('already')) setReviewError('You have already reviewed this course.');
      else if (msg.toLowerCase().includes('complet')) setReviewError('Complete the course before leaving a review.');
      else if (msg.toLowerCase().includes('enroll')) setReviewError('You must be enrolled to leave a review.');
      else setReviewError('Could not submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    if (!courseId || !user?.user_id) return;
    progressAPI.getStudentCourseProgress(user.user_id, courseId)
      .then(res => setCompletionPct(res?.completion_pct ?? res?.completionPct ?? 0))
      .catch(() => {});
    certificatesAPI.getCertificate(user.user_id, courseId)
      .then(res => { if (res?.id) setCertificate(res); })
      .catch(() => {});
  }, [courseId, user?.user_id]);

  const handleGetCertificate = async () => {
    setCertIssuing(true);
    setCertError('');
    try {
      const res = await certificatesAPI.issueCertificate(user.user_id, courseId);
      setCertificate(res);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || '';
      if (msg.toLowerCase().includes('not complet')) setCertError('Complete all lessons first.');
      else setCertError('Could not issue certificate. Try again later.');
    } finally {
      setCertIssuing(false);
    }
  };

  const allItems = useMemo(() => {
    const items = [
      ...lessons.map(l => ({ ...l, _type: 'lesson',     _date: parseDate(l.scheduled_at) })),
      ...assignments.map(a => ({ ...a, _type: 'assignment', _date: parseDate(a.due_date) })),
      ...quizzes.map(q => ({ ...q, _type: 'quiz', _date: parseDate(q.scheduled_at) })),
    ];
    return items.sort((a, b) => {
      if (!a._date && !b._date) return 0;
      if (!a._date) return 1;
      if (!b._date) return -1;
      return a._date - b._date;
    });
  }, [lessons, assignments, quizzes]);

  const weeks = useMemo(() => groupIntoWeeks(allItems), [allItems]);

  const firstLesson = useMemo(() => lessons
    .slice().sort((a, b) => {
      const da = parseDate(a.scheduled_at) || new Date(0);
      const db = parseDate(b.scheduled_at) || new Date(0);
      return da - db;
    })[0], [lessons]);

  const toggleWeek = idx =>
    setExpandedWeeks(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; });

  const toggleItem = id =>
    setExpandedItem(prev => prev === id ? null : id);

  const handleSubmit = async (assignmentId) => {
    const content = (answers[assignmentId] || '').trim();
    const file    = files[assignmentId];
    if (!content && !file) return;
    setSubmitting(assignmentId);
    setSubmitError(p => ({ ...p, [assignmentId]: null }));
    try {
      let fileId = '';
      if (file) {
        setUploadProgress(p => ({ ...p, [assignmentId]: true }));
        try {
          const up = await mediaAPI.uploadFile(file, courseId, 1);
          fileId = up?.file_id || up?.fileId || '';
        } catch (uploadErr) {
          console.warn('File upload failed, submitting without attachment:', uploadErr);
          setSubmitError(p => ({ ...p, [assignmentId]: 'File upload failed - submitting text answer only.' }));
        }
        setUploadProgress(p => ({ ...p, [assignmentId]: false }));
      }
      if (!content && !fileId) {
        setSubmitError(p => ({ ...p, [assignmentId]: 'File upload failed and no text answer provided.' }));
        return;
      }
      await submissionsAPI.submitAssignment({ assignment_id: assignmentId, content, file_id: fileId });
      setSubmitted(p => ({ ...p, [assignmentId]: true }));
      setExpandedItem(null);
    } catch (e) {
      console.error(e);
      setSubmitError(p => ({ ...p, [assignmentId]: 'Submission failed. Please try again.' }));
      setUploadProgress(p => ({ ...p, [assignmentId]: false }));
    } finally {
      setSubmitting(null);
    }
  };

  const removeFile  = id => setFiles(p => ({ ...p, [id]: null }));
  const pickFile    = (id, e) => { const f = e.target.files?.[0]; if (f) setFiles(p => ({ ...p, [id]: f })); };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S';

  // nav between items inside the flat list
  const itemIndex = id => allItems.findIndex(i => i.id === id);
  const prevItem  = id => { const i = itemIndex(id); return i > 0 ? allItems[i - 1] : null; };
  const nextItem  = id => { const i = itemIndex(id); return i < allItems.length - 1 ? allItems[i + 1] : null; };

  const goToItem = item => {
    if (!item) return;
    if (item._type === 'lesson')     navigate(`/student/courses/${courseId}/lessons/${item.id}`);
    else { setExpandedItem(item.id); }
  };

  if (loading) return (
    <div className="flex h-screen bg-[#f3f4f7]">
      <StudentSidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f3f4f7] font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/student/courses" className="text-[#6b6f7d] text-[13px] hover:text-[#0c0d12] transition-colors flex-shrink-0 flex items-center gap-1">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M10 13L5 8l5-5"/>
              </svg>
              My Courses
            </Link>
            <div className="w-px h-4 bg-[#e8eaef] flex-shrink-0" />
            <p className="text-[#0c0d12] text-[14px] font-semibold truncate">{course?.title || 'Course'}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <TopBarActions />
            <div className="w-9 h-9 rounded-full bg-[rgba(13,148,136,0.12)] flex items-center justify-center">
              <span className="text-[#0d9488] text-[12px] font-bold">{initials}</span>
            </div>
          </div>
        </div>

        {/* Main scroll area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Course header card */}
          <div className="bg-white rounded-[20px] border border-[#f0f0f5] p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-[#0c0d12] text-[22px] font-bold leading-tight mb-1">
                  {course?.title || 'Course'}
                </h1>
                {course?.description && (
                  <p className="text-[#6b6f7d] text-[13px] leading-relaxed max-w-xl">{course.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-[12px] text-[#6b6f7d]">
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                      <path d="M15 10l-4.553 2.276A1 1 0 019 11.277V4.723a1 1 0 011.447-.894L15 6M2 4a2 2 0 012-2h5a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z"/>
                    </svg>
                    {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                      <path d="M4 2h6l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
                      <path d="M9 2v3h3M6 8h4M6 11h4" strokeLinecap="round"/>
                    </svg>
                    {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                      <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 2v2M11 2v2M2 7h12"/>
                    </svg>
                    {weeks.length} week{weeks.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {firstLesson && (
                <Link
                  to={`/student/courses/${courseId}/lessons/${firstLesson.id}`}
                  className="flex-shrink-0 bg-[#0d9488] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[10px] hover:bg-[#0f766e] transition-colors flex items-center gap-2"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                    <polygon points="4,2 13,8 4,14" fill="white" stroke="none"/>
                  </svg>
                  Start Learning
                </Link>
              )}
            </div>
          </div>

          {/* Certificate banner — shown when course is 100% complete */}
          {completionPct >= 100 && (
            <div className={`rounded-[20px] overflow-hidden ${certificate ? 'bg-gradient-to-br from-[#0d9488] to-[#059669]' : 'bg-gradient-to-br from-[#0d9488] to-[#935bf5]'}`}>
              {/* Decorative rings */}
              <div className="relative px-6 py-5 flex items-center gap-4">
                <div className="absolute w-[200px] h-[200px] rounded-full border border-white/10 top-[-80px] right-[-40px] pointer-events-none" />
                <div className="absolute w-[140px] h-[140px] rounded-full border border-white/10 bottom-[-60px] right-[60px] pointer-events-none" />

                {/* Medal */}
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
                    <circle cx="16" cy="20" r="10" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.5"/>
                    <path d="M12 8l4-6 4 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 8h12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M13 20l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  {certificate ? (
                    <>
                      <p className="text-white text-[15px] font-bold leading-tight">Certificate Earned!</p>
                      <p className="text-white/70 text-[12px] mt-0.5">
                        Issued {new Date(certificate.issued_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        {' '}· #{(certificate.id || '').slice(-8).toUpperCase()}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-white text-[15px] font-bold leading-tight">Course Complete — 100%</p>
                      <p className="text-white/70 text-[12px] mt-0.5">You've finished all lessons. Claim your certificate!</p>
                    </>
                  )}
                  {certError && <p className="text-red-200 text-[11px] mt-1">{certError}</p>}
                </div>

                {/* Action */}
                {certificate ? (
                  <Link
                    to="/student/certificates"
                    className="flex-shrink-0 bg-white text-[#0d9488] text-[13px] font-bold px-4 py-2 rounded-[10px] hover:bg-white/90 transition-colors whitespace-nowrap"
                  >
                    View Certificate
                  </Link>
                ) : (
                  <button
                    onClick={handleGetCertificate}
                    disabled={certIssuing}
                    className="flex-shrink-0 bg-white text-[#0d9488] text-[13px] font-bold px-4 py-2 rounded-[10px] hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center gap-2"
                  >
                    {certIssuing ? (
                      <><div className="w-3.5 h-3.5 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin" />Issuing...</>
                    ) : 'Get Certificate'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {weeks.length === 0 && !loading && (
            <div className="bg-white rounded-[20px] border border-[#f0f0f5] p-14 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M8 3v14M4 7h4M4 11h4" strokeLinecap="round"/></svg>
              </div>
              <p className="text-[#0c0d12] text-[16px] font-bold mb-1">No content yet</p>
              <p className="text-[#6b6f7d] text-[13px]">The tutor hasn't added any lessons or assignments to this course yet.</p>
            </div>
          )}

          {/* Course rating summary */}
          {courseRating && (courseRating.count > 0 || reviews.length > 0) && (
            <div className="bg-white rounded-[16px] border border-[#f0f0f5] px-6 py-4 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                {[1,2,3,4,5].map(s => (
                  <StarIcon key={s} filled={s <= Math.round(courseRating.average || 0)} size={20} />
                ))}
              </div>
              <span className="text-[#0c0d12] text-[18px] font-bold">{(courseRating.average || 0).toFixed(1)}</span>
              <span className="text-[#6b6f7d] text-[13px]">{courseRating.count} review{courseRating.count !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Week sections */}
          {weeks.map((week, wi) => {
            const open = expandedWeeks.has(wi);
            return (
              <div key={wi} className="bg-white rounded-[16px] border border-[#f0f0f5] overflow-hidden">

                {/* Week header */}
                <button
                  onClick={() => toggleWeek(wi)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f8f9fc] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[rgba(13,148,136,0.08)] flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 16 16" fill="none" stroke="#0d9488" strokeWidth="1.4" className="w-4 h-4">
                        <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 2v2M11 2v2M2 7h12"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[#0c0d12] text-[14px] font-bold leading-tight">{week.label}</p>
                      {week.dateRange && <p className="text-[#6b6f7d] text-[11px] mt-0.5">{week.dateRange}</p>}
                    </div>
                    <span className="text-[11px] text-[#6b6f7d] bg-[#f0f0f5] px-2 py-0.5 rounded-full">
                      {week.items.length} item{week.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <ChevronDown open={open} />
                </button>

                {/* Items list */}
                {open && (
                  <div className="border-t border-[#f0f0f5]">
                    {week.items.map((item, ii) => {
                      const isLesson     = item._type === 'lesson';
                      const isAssignment = item._type === 'assignment';
                      const isQuiz       = item._type === 'quiz';
                      const isExpanded   = expandedItem === item.id;
                      const isDone       = submitted[item.id];
                      const isLast       = ii === week.items.length - 1;

                      const isNote   = isNoteLesson(item);
                      const iconBg = (isLesson && !isNote) ? 'bg-[rgba(13,148,136,0.08)]'
                                   : isNote   ? 'bg-[rgba(107,111,125,0.08)]'
                                   : isQuiz   ? 'bg-[rgba(147,91,245,0.08)]'
                                   :            'bg-[rgba(255,166,26,0.1)]';

                      return (
                        <div key={item.id} className={!isLast ? 'border-b border-[#f0f0f5]' : ''}>

                          {/* Item row */}
                          <div
                            onClick={() => {
                              if (isLesson) navigate(`/student/courses/${courseId}/lessons/${item.id}`);
                              else if (isQuiz) navigate(`/student/courses/${courseId}/quizzes/${item.id}`);
                              else toggleItem(item.id);
                            }}
                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f8f9fc] cursor-pointer transition-colors group"
                          >
                            {/* Type icon */}
                            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                              {isNote ? (
                                <svg viewBox="0 0 20 20" fill="none" stroke="#6b6f7d" strokeWidth="1.5" className="w-5 h-5">
                                  <path d="M4 6h12M4 10h12M4 14h7" strokeLinecap="round"/>
                                </svg>
                              ) : isLesson ? <VideoIcon /> : isQuiz ? <QuizIcon /> : <DocIcon />}
                            </div>

                            {/* Title + meta */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[#0c0d12] text-[13px] font-semibold truncate group-hover:text-[#0d9488] transition-colors">
                                  {item.title}
                                </p>
                                {isQuiz && (
                                  <span className="text-[10px] bg-[rgba(147,91,245,0.1)] text-[#935bf5] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Quiz</span>
                                )}
                                {isDone && (
                                  <span className="text-[10px] bg-[#edfbf4] text-[#22be70] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                                    Submitted
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-0.5 text-[11px] text-[#6b6f7d]">
                                {isLesson && !isNoteLesson(item) && (
                                  <>
                                    <span className="flex items-center gap-1">
                                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-3 h-3">
                                        <circle cx="6" cy="6" r="5"/><path d="M6 4v2.5l1.5 1.5"/>
                                      </svg>
                                      {formatDuration(item.duration_minutes) || 'Video'}
                                    </span>
                                    {item._date && (
                                      <span className="flex items-center gap-1">
                                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-3 h-3">
                                          <rect x="1" y="2" width="10" height="9" rx="1.5"/>
                                          <path d="M4 1.5v1M8 1.5v1M1 5h10"/>
                                        </svg>
                                        {formatDate(item.scheduled_at)}
                                      </span>
                                    )}
                                  </>
                                )}
                                {isLesson && isNoteLesson(item) && (
                                  <span className="flex items-center gap-1">
                                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-3 h-3">
                                      <path d="M2 3h8M2 6h8M2 9h5" strokeLinecap="round"/>
                                    </svg>
                                    Reading material
                                  </span>
                                )}
                                {isAssignment && (
                                  <>
                                    {item._date && (
                                      <span className="flex items-center gap-1">
                                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-3 h-3">
                                          <rect x="1" y="2" width="10" height="9" rx="1.5"/>
                                          <path d="M4 1.5v1M8 1.5v1M1 5h10"/>
                                        </svg>
                                        Due {formatDate(item.due_date)}
                                      </span>
                                    )}
                                    {item.max_score != null && (
                                      <span>{item.max_score} pts</span>
                                    )}
                                  </>
                                )}
                                {isQuiz && <span>Tap to start</span>}
                              </div>
                            </div>

                            {/* Right indicator */}
                            <div className="flex-shrink-0 flex items-center gap-2">
                              {isDone && <CheckCircle />}
                              {(isLesson || isQuiz) && (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                  isQuiz
                                    ? 'bg-[rgba(147,91,245,0.08)] group-hover:bg-[rgba(147,91,245,0.16)]'
                                    : 'bg-[rgba(13,148,136,0.08)] group-hover:bg-[rgba(13,148,136,0.16)]'
                                }`}>
                                  <svg viewBox="0 0 12 12" fill="none" stroke={isQuiz ? '#935bf5' : '#0d9488'} strokeWidth="1.5" className="w-3 h-3">
                                    <path d="M4 2l4 4-4 4"/>
                                  </svg>
                                </div>
                              )}
                              {isAssignment && (
                                <ChevronDown open={isExpanded} />
                              )}
                            </div>
                          </div>

                          {/* Expanded assignment panel */}
                          {isAssignment && isExpanded && (
                            <div className="bg-[#fafbff] border-t border-[#f0f0f5] px-5 py-5">

                              {/* Assignment detail */}
                              <div className="mb-4">
                                {(() => {
                                  const { plain, files } = parseAssignmentDescription(item.description);
                                  return (
                                    <>
                                      {plain && <p className="text-[#383a44] text-[13px] leading-relaxed mb-3">{plain}</p>}
                                      {files.length > 0 && (
                                        <div className="mb-3 space-y-1.5">
                                          <p className="text-[#6b6f7d] text-[11px] font-semibold uppercase tracking-wide mb-1">Attached by tutor</p>
                                          {files.map(f => <AttachmentDownloadButton key={f.id} id={f.id} name={f.name} />)}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                                <div className="flex flex-wrap gap-2">
                                  {item._date && (
                                    <span className="text-[11px] bg-[rgba(255,166,26,0.12)] text-[#ffa61a] font-semibold px-2.5 py-1 rounded-full">
                                      Due {formatDate(item.due_date)}
                                    </span>
                                  )}
                                  {item.max_score != null && (
                                    <span className="text-[11px] bg-[rgba(13,148,136,0.08)] text-[#0d9488] font-semibold px-2.5 py-1 rounded-full">
                                      {item.max_score} pts
                                    </span>
                                  )}
                                </div>
                              </div>

                              {submitted[item.id] ? (
                                <div className="bg-[#edfbf4] rounded-[12px] p-4 flex items-start gap-3">
                                  <CheckCircle />
                                  <div>
                                    <p className="text-[#22be70] text-[13px] font-semibold">Assignment submitted!</p>
                                    <p className="text-[#22be70]/70 text-[12px] mt-0.5">Sent to the tutor for review.</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {/* Text answer */}
                                  <div>
                                    <p className="text-[#0c0d12] text-[12px] font-semibold mb-1.5">Your Answer</p>
                                    <textarea
                                      value={answers[item.id] || ''}
                                      onChange={e => setAnswers(p => ({ ...p, [item.id]: e.target.value }))}
                                      placeholder="Type your answer here... (optional if uploading a file)"
                                      rows={3}
                                      className="w-full border border-[#e8eaef] rounded-[10px] px-3 py-2.5 text-[13px] text-[#0c0d12] placeholder-[#b0b5c4] resize-none focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[rgba(13,148,136,0.08)] transition-all bg-white"
                                    />
                                  </div>

                                  {/* File upload */}
                                  <div>
                                    <p className="text-[#0c0d12] text-[12px] font-semibold mb-1.5">
                                      Attach File <span className="text-[#6b6f7d] font-normal">(optional)</span>
                                    </p>
                                    {files[item.id] ? (
                                      <div className="flex items-center gap-3 bg-white border border-[#e8eaef] rounded-[10px] px-3 py-2.5">
                                        <div className="w-8 h-8 rounded-[8px] bg-[rgba(13,148,136,0.08)] flex items-center justify-center flex-shrink-0">
                                          <svg viewBox="0 0 16 16" fill="none" stroke="#0d9488" strokeWidth="1.4" className="w-4 h-4">
                                            <path d="M4 2h6l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
                                            <path d="M10 2v3h3"/>
                                          </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[#0c0d12] text-[12px] font-medium truncate">{files[item.id].name}</p>
                                          <p className="text-[#6b6f7d] text-[11px]">
                                            {files[item.id].size < 1048576
                                              ? `${(files[item.id].size / 1024).toFixed(1)} KB`
                                              : `${(files[item.id].size / 1048576).toFixed(1)} MB`}
                                          </p>
                                        </div>
                                        <button onClick={() => removeFile(item.id)}
                                          className="w-6 h-6 rounded-full bg-[#f0f0f5] hover:bg-[#fee2e2] flex items-center justify-center flex-shrink-0 transition-colors">
                                          <svg viewBox="0 0 10 10" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-3 h-3">
                                            <path d="M2 2l6 6M8 2L2 8"/>
                                          </svg>
                                        </button>
                                      </div>
                                    ) : (
                                      <label className="flex items-center gap-3 border-2 border-dashed border-[#e8eaef] rounded-[10px] px-4 py-3 cursor-pointer hover:border-[#0d9488] hover:bg-[rgba(13,148,136,0.02)] transition-colors group">
                                        <div className="w-8 h-8 rounded-full bg-[rgba(13,148,136,0.08)] group-hover:bg-[rgba(13,148,136,0.14)] flex items-center justify-center flex-shrink-0 transition-colors">
                                          <svg viewBox="0 0 16 16" fill="none" stroke="#0d9488" strokeWidth="1.4" className="w-4 h-4">
                                            <path d="M8 10V5M6 7l2-2 2 2"/>
                                            <path d="M3 12a3 3 0 010-6 4 4 0 017.9-1A3 3 0 0113 12H3z"/>
                                          </svg>
                                        </div>
                                        <div>
                                          <p className="text-[#0c0d12] text-[12px] font-semibold">Click to upload a file</p>
                                          <p className="text-[#6b6f7d] text-[11px]">PDF, DOCX, TXT, PNG, JPG, ZIP - up to 32 MB</p>
                                        </div>
                                        <input type="file" className="hidden"
                                          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
                                          onChange={e => pickFile(item.id, e)} />
                                      </label>
                                    )}
                                  </div>

                                  {submitError[item.id] && (
                                    <p className="text-[#f24545] text-[12px] flex items-center gap-1.5">
                                      <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
                                        <circle cx="7" cy="7" r="6.5" fill="#fee2e2" stroke="#f24545" strokeWidth="0.8"/>
                                        <path d="M7 4v3.5M7 9v.5" stroke="#f24545" strokeWidth="1.2" strokeLinecap="round"/>
                                      </svg>
                                      {submitError[item.id]}
                                    </p>
                                  )}

                                  {/* Submit + nav */}
                                  <div className="flex items-center gap-2 pt-1">
                                    {/* Prev item */}
                                    {prevItem(item.id) && (
                                      <button
                                        onClick={() => goToItem(prevItem(item.id))}
                                        title="Previous item"
                                        className="w-9 h-9 rounded-[8px] border border-[#e8eaef] flex items-center justify-center text-[#6b6f7d] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors flex-shrink-0"
                                      >
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                          <path d="M10 13L5 8l5-5"/>
                                        </svg>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleSubmit(item.id)}
                                      disabled={submitting === item.id || (!(answers[item.id] || '').trim() && !files[item.id])}
                                      className="flex-1 bg-[#0d9488] text-white text-[13px] font-semibold py-2.5 rounded-[10px] hover:bg-[#0f766e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                    >
                                      {submitting === item.id ? (
                                        <>
                                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          {uploadProgress[item.id] ? 'Uploading...' : 'Submitting...'}
                                        </>
                                      ) : (
                                        <>
                                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                            <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3M8 2v8M5 5l3-3 3 3"/>
                                          </svg>
                                          Submit Assignment
                                        </>
                                      )}
                                    </button>

                                    {/* Next item */}
                                    {nextItem(item.id) && (
                                      <button
                                        onClick={() => goToItem(nextItem(item.id))}
                                        title="Next item"
                                        className="w-9 h-9 rounded-[8px] border border-[#e8eaef] flex items-center justify-center text-[#6b6f7d] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors flex-shrink-0"
                                      >
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                          <path d="M6 3l5 5-5 5"/>
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {/* Reviews section */}
          <div className="bg-white rounded-[20px] border border-[#f0f0f5] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#f0f0f5]">
              <h2 className="text-[#0c0d12] text-[16px] font-bold">Reviews</h2>
            </div>

            {/* Write a review form — only after 100% completion */}
            <div className="px-6 py-5 border-b border-[#f0f0f5]">
              {completionPct < 100 ? (
                <div className="flex items-center gap-3 py-2">
                  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 flex-shrink-0 text-[#b0b5c4]">
                    <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <p className="text-[#6b6f7d] text-[13px]">Complete the course to leave a review ({Math.round(completionPct)}% done)</p>
                </div>
              ) : reviewSubmitted ? (
                <div className="flex items-start gap-3 bg-[#edfbf4] rounded-[12px] p-4">
                  <div className="w-5 h-5 rounded-full bg-[#22be70] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#22be70] text-[13px] font-semibold">Review submitted!</p>
                    <p className="text-[#22be70]/70 text-[12px] mt-0.5">Thank you for your feedback.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[#0c0d12] text-[13px] font-semibold">Leave a Review</p>
                  {/* Star picker */}
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <StarIcon filled={s <= (hoverRating || reviewRating)} size={26} />
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span className="ml-2 text-[#6b6f7d] text-[12px]">
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="Share your experience with this course..."
                    rows={3}
                    className="w-full border border-[#e8eaef] rounded-[10px] px-3 py-2.5 text-[13px] text-[#0c0d12] placeholder-[#b0b5c4] resize-none focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[rgba(13,148,136,0.08)] transition-all bg-white"
                  />
                  {reviewError && (
                    <p className="text-[#f24545] text-[12px] flex items-center gap-1.5">
                      <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
                        <circle cx="7" cy="7" r="6.5" fill="#fee2e2" stroke="#f24545" strokeWidth="0.8"/>
                        <path d="M7 4v3.5M7 9v.5" stroke="#f24545" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {reviewError}
                    </p>
                  )}
                  <button
                    onClick={handleReviewSubmit}
                    disabled={reviewSubmitting}
                    className="bg-[#0d9488] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[10px] hover:bg-[#0f766e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {reviewSubmitting ? (
                      <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                    ) : 'Submit Review'}
                  </button>
                </div>
              )}
            </div>

            {/* Existing reviews list */}
            {reviews.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-[#6b6f7d] text-[13px]">No reviews yet. Be the first to leave one!</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f0f5]">
                {reviews.map((rv, i) => (
                  <div key={rv.id || i} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <StarIcon key={s} filled={s <= (rv.rating || 0)} size={14} />
                        ))}
                      </div>
                      {rv.created_at && (
                        <span className="text-[#b0b5c4] text-[11px]">
                          {new Date(rv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {rv.body && <p className="text-[#383a44] text-[13px] leading-relaxed">{rv.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CourseView;
