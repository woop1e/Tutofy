﻿import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { lessonsAPI } from '../../api/lessons';
import { assignmentsAPI } from '../../api/assignments';
import { coursesAPI } from '../../api/courses';
import { submissionsAPI } from '../../api/submissions';
import { mediaAPI } from '../../api/media';
import { progressAPI } from '../../api/progress';

function getVideoEmbed(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (yt) return { type: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}` };
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}` };
  if (/zoom\.us|teams\.microsoft\.com|meet\.google\.com/i.test(url)) return { type: 'meeting', url };
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return { type: 'video', url };
  return { type: 'link', url };
}

function formatDuration(mins) {
  if (!mins) return '';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60 ? ` ${mins % 60}m` : ''}`.trim();
}

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

const STATUS_LABELS = {
  0: 'Planned', planned: 'Planned',
  1: 'Completed', completed: 'Completed',
  2: 'Cancelled', cancelled: 'Cancelled',
};
const STATUS_STYLES = {
  0: 'bg-[rgba(13,148,136,0.08)] text-[#0d9488]', planned: 'bg-[rgba(13,148,136,0.08)] text-[#0d9488]',
  1: 'bg-[#edfbf4] text-[#22be70]', completed: 'bg-[#edfbf4] text-[#22be70]',
  2: 'bg-[#fff0f0] text-[#f24545]', cancelled: 'bg-[#fff0f0] text-[#f24545]',
};

function sortByDate(list) {
  return [...list].sort((a, b) => {
    const da = parseDate(a.scheduled_at) || new Date(0);
    const db = parseDate(b.scheduled_at) || new Date(0);
    return da - db;
  });
}

const CheckIcon = () => (
  <svg viewBox="0 0 10 10" fill="none" className="w-[10px] h-[10px]">
    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 10 10" fill="none" className="w-[10px] h-[10px]">
    <rect x="2" y="5" width="6" height="4" rx="0.8" stroke="#b0b5c4" strokeWidth="0.9"/>
    <path d="M3.5 5V3.5a1.5 1.5 0 013 0V5" stroke="#b0b5c4" strokeWidth="0.9"/>
  </svg>
);

const LessonView = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();
  const { id: courseId, lessonId } = useParams();

  const [lessons, setLessons] = useState([]);
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [answers, setAnswers] = useState({});
  const [files, setFiles] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [submitted, setSubmitted] = useState({});
  const [submitError, setSubmitError] = useState({});
  const [completedSet, setCompletedSet] = useState(() => {
    try {
      const stored = localStorage.getItem(`progress_${courseId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    Promise.all([
      lessonsAPI.getCourseLessons(courseId).catch(() => ({})),
      coursesAPI.getCourseById(courseId).catch(() => null),
      assignmentsAPI.getCourseAssignments(courseId).catch(() => ({})),
    ]).then(([lessonsRes, courseRes, assignRes]) => {
      const rawLessons = lessonsRes?.lessons || lessonsRes || [];
      setLessons(sortByDate(Array.isArray(rawLessons) ? rawLessons : []));
      setCourse(courseRes?.course || courseRes);
      const rawAssign = assignRes?.assignments || assignRes || [];
      setAssignments(Array.isArray(rawAssign) ? rawAssign : []);
    }).finally(() => setLoading(false));
  }, [courseId]);

  const currentIndex = useMemo(() => lessons.findIndex((l) => l.id === lessonId), [lessons, lessonId]);
  const currentLesson = currentIndex >= 0 ? lessons[currentIndex] : lessons[0] || null;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const completedCount = lessons.filter((l) => completedSet.has(l.id)).length;
  const totalPlanned = course?.total_lessons || 0;
  const availablePct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const overallPct = totalPlanned > 0 ? Math.round((completedCount / totalPlanned) * 100) : availablePct;
  const progress = overallPct;
  const videoInfo = useMemo(() => getVideoEmbed(currentLesson?.video_link), [currentLesson]);
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'S';
  const isCurrentDone = currentLesson ? completedSet.has(currentLesson.id) : false;

  const handleMarkComplete = async () => {
    if (!currentLesson || !courseId || isCurrentDone) return;
    setMarkingComplete(true);
    try {
      await progressAPI.markLessonComplete(currentLesson.id, courseId);
      setCompletedSet((prev) => {
        const next = new Set([...prev, currentLesson.id]);
        try { localStorage.setItem(`progress_${courseId}`, JSON.stringify([...next])); } catch {}
        return next;
      });
    } catch (e) {
      console.error('Failed to mark lesson complete:', e);
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    const content = (answers[assignmentId] || '').trim();
    const file = files[assignmentId];
    if (!content && !file) return;
    setSubmitting(assignmentId);
    setSubmitError((prev) => ({ ...prev, [assignmentId]: null }));
    try {
      let fileId = '';
      if (file) {
        setUploadProgress((prev) => ({ ...prev, [assignmentId]: true }));
        try {
          const uploadRes = await mediaAPI.uploadFile(file, courseId, 1);
          fileId = uploadRes?.file_id || uploadRes?.fileId || '';
        } catch (uploadErr) {
          console.warn('File upload failed, submitting without attachment:', uploadErr);
          setSubmitError((prev) => ({ ...prev, [assignmentId]: 'File upload failed - submitting text answer only.' }));
        }
        setUploadProgress((prev) => ({ ...prev, [assignmentId]: false }));
      }
      if (!content && !fileId) {
        setSubmitError((prev) => ({ ...prev, [assignmentId]: 'File upload failed and no text answer provided.' }));
        return;
      }
      await submissionsAPI.submitAssignment({ assignment_id: assignmentId, content, file_id: fileId });
      setSubmitted((prev) => ({ ...prev, [assignmentId]: true }));
    } catch (e) {
      console.error(e);
      setSubmitError((prev) => ({ ...prev, [assignmentId]: 'Submission failed. Please try again.' }));
      setUploadProgress((prev) => ({ ...prev, [assignmentId]: false }));
    } finally {
      setSubmitting(null);
    }
  };

  const handleFileChange = (assignmentId, e) => {
    const file = e.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [assignmentId]: file }));
  };

  const removeFile = (assignmentId) => {
    setFiles((prev) => ({ ...prev, [assignmentId]: null }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f3f4f7]">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-6 justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/student/courses" className="text-[#6b6f7d] text-[13px] hover:text-[#0c0d12] transition-colors flex-shrink-0 flex items-center gap-1">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M10 13L5 8l5-5"/>
              </svg>
              My Courses
            </Link>
            <div className="w-px h-4 bg-[#e8eaef] flex-shrink-0" />
            <p className="text-[#0c0d12] text-[14px] font-semibold truncate">{course?.title || `Course`}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-[12px] text-[#6b6f7d]">
              <div className="w-28 bg-[#f0f0f5] rounded-full h-[5px]">
                <div className="h-[5px] rounded-full bg-[#0d9488]" style={{ width: `${overallPct}%` }} />
              </div>
              <span>{overallPct}%</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[rgba(13,148,136,0.12)] flex items-center justify-center">
              <span className="text-[#0d9488] text-[12px] font-bold">{initials}</span>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left lesson sidebar */}
          <div className="w-[256px] flex-shrink-0 bg-white border-r border-[#f0f0f5] flex flex-col overflow-hidden">
            {/* Course progress header */}
            <div className="px-4 py-4 border-b border-[#f0f0f5] flex-shrink-0">
              <p className="text-[#0c0d12] text-[13px] font-bold leading-snug line-clamp-2 mb-3">
                {course?.title || 'Course'}
              </p>
              {totalPlanned > 0 ? (
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-[#6b6f7d] mb-1">
                      <span>Overall</span>
                      <span className="font-semibold text-[#0d9488]">{overallPct}%</span>
                    </div>
                    <div className="w-full bg-[#f0f0f5] rounded-full h-[4px]">
                      <div className="h-[4px] rounded-full bg-[#0d9488] transition-all" style={{ width: `${overallPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-[#6b6f7d] mb-1">
                      <span>Uploaded ({completedCount}/{lessons.length})</span>
                      <span className="font-semibold text-[#935bf5]">{availablePct}%</span>
                    </div>
                    <div className="w-full bg-[#f0f0f5] rounded-full h-[4px]">
                      <div className="h-[4px] rounded-full bg-[#935bf5] transition-all" style={{ width: `${availablePct}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-[11px] text-[#6b6f7d] mb-1.5">
                    <span>{completedCount} of {lessons.length} completed</span>
                    <span className="font-semibold text-[#0d9488]">{availablePct}%</span>
                  </div>
                  <div className="w-full bg-[#f0f0f5] rounded-full h-[5px]">
                    <div className="h-[5px] rounded-full bg-[#0d9488] transition-all" style={{ width: `${availablePct}%` }} />
                  </div>
                </>
              )}
            </div>

            {/* Lessons list */}
            <div className="flex-1 overflow-y-auto py-2">
              {lessons.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[#6b6f7d] text-[12px]">No lessons yet</p>
                </div>
              ) : (
                lessons.map((lesson, idx) => {
                  const isCurrent = lesson.id === lessonId;
                  const isDone = completedSet.has(lesson.id);
                  return (
                    <Link
                      key={lesson.id}
                      to={`/student/courses/${courseId}/lessons/${lesson.id}`}
                      className={`flex items-start gap-3 px-4 py-3 border-r-2 transition-colors ${
                        isCurrent
                          ? 'bg-[rgba(13,148,136,0.07)] border-[#0d9488]'
                          : 'border-transparent hover:bg-[#f8f9fc]'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{
                        backgroundColor: isDone ? '#22c55e' : isCurrent ? '#0d9488' : 'transparent',
                        border: isDone || isCurrent ? 'none' : '2px solid #d0d3de',
                      }}>
                        {isDone ? <CheckIcon /> : isCurrent ? (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        ) : <LockIcon />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[12px] font-medium leading-snug ${
                          isCurrent ? 'text-[#0d9488]' : isDone ? 'text-[#0c0d12]' : 'text-[#6b6f7d]'
                        }`}>
                          {idx + 1}. {lesson.title}
                        </p>
                        {lesson.duration_minutes > 0 && (
                          <p className="text-[11px] text-[#b0b5c4] mt-0.5">{formatDuration(lesson.duration_minutes)}</p>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Main scrollable area */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex gap-4 p-5">

              {/* Center column */}
              <div className="flex-1 min-w-0 space-y-4">

                {/* Video player — only shown when there is a video/link */}
                {videoInfo && (
                  <div className="bg-[#0d0e12] rounded-[16px] overflow-hidden w-full" style={{ aspectRatio: '16/9' }}>
                    {videoInfo.type === 'iframe' ? (
                      <iframe
                        src={videoInfo.src}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        title={currentLesson?.title || 'Lesson video'}
                      />
                    ) : videoInfo.type === 'video' ? (
                      <video controls className="w-full h-full object-contain">
                        <source src={videoInfo.url} />
                        Your browser does not support the video tag.
                      </video>
                    ) : videoInfo.type === 'meeting' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white" stroke="currentColor" strokeWidth="1.5">
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                          </svg>
                        </div>
                        <div className="text-center px-6">
                          <p className="text-white font-semibold mb-1">Live Session</p>
                          <p className="text-white/50 text-[13px] mb-4">This lesson is a live video conference</p>
                          <a href={videoInfo.url} target="_blank" rel="noopener noreferrer"
                            className="inline-block bg-[#0d9488] text-white px-7 py-2.5 rounded-[10px] text-[14px] font-semibold hover:bg-[#0f766e] transition-colors">
                            Join Meeting →
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white/60" stroke="currentColor" strokeWidth="1.5">
                            <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-white/60 text-[13px] mb-3">External resource</p>
                          <a href={videoInfo.url} target="_blank" rel="noopener noreferrer"
                            className="inline-block bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors">
                            Open Resource →
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Note/text content — shown when there is no video */}
                {!videoInfo && currentLesson?.description && (
                  <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-[10px] bg-[rgba(13,148,136,0.08)] flex items-center justify-center">
                        <svg viewBox="0 0 20 20" fill="none" stroke="#0d9488" strokeWidth="1.4" className="w-4 h-4">
                          <path d="M4 3h9l4 4v11a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 8h8M6 11h8M6 14h5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <p className="text-[#0c0d12] text-[14px] font-bold">Note</p>
                    </div>
                    <p className="text-[#383a44] text-[14px] leading-relaxed whitespace-pre-wrap">{currentLesson.description}</p>
                  </div>
                )}

                {/* Lesson info + tabs */}
                <div className="bg-white rounded-[16px] border border-[#f0f0f5] overflow-hidden">
                  <div className="p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h1 className="text-[#0c0d12] text-[18px] font-bold leading-tight">
                        {currentLesson?.title || 'Lesson'}
                      </h1>
                      {currentLesson?.status != null && STATUS_LABELS[currentLesson.status] && (
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[currentLesson.status] || 'bg-[rgba(13,148,136,0.08)] text-[#0d9488]'}`}>
                          {STATUS_LABELS[currentLesson.status]}
                        </span>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6b6f7d] mb-4">
                      {currentLesson?.duration_minutes > 0 && (
                        <span className="flex items-center gap-1">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                            <circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.5l2 2"/>
                          </svg>
                          {formatDuration(currentLesson.duration_minutes)}
                        </span>
                      )}
                      {currentLesson?.scheduled_at && (
                        <span className="flex items-center gap-1">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                            <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 2v2M11 2v2M2 7h12"/>
                          </svg>
                          {formatDate(currentLesson.scheduled_at)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                          <path d="M2 12L6 4l4 8M4.5 9h5M10 4c1 0 4 .5 4 4s-3 4-4 4"/>
                        </svg>
                        Lesson {currentIndex + 1} of {lessons.length}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mb-5 space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-[12px] mb-1.5">
                          <span className="text-[#6b6f7d]">{totalPlanned > 0 ? 'Overall progress' : 'Course progress'}</span>
                          <span className="text-[#0d9488] font-semibold">{overallPct}%</span>
                        </div>
                        <div className="w-full bg-[#f0f0f5] rounded-full h-[6px]">
                          <div className="h-[6px] rounded-full bg-[#0d9488] transition-all" style={{ width: `${overallPct}%` }} />
                        </div>
                      </div>
                      {totalPlanned > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-[#6b6f7d]">Available content</span>
                            <span className="text-[#935bf5] font-semibold">{availablePct}%</span>
                          </div>
                          <div className="w-full bg-[#f0f0f5] rounded-full h-[4px]">
                            <div className="h-[4px] rounded-full bg-[#935bf5] transition-all" style={{ width: `${availablePct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-0 border-b border-[#f0f0f5] -mx-5 px-5">
                      {[
                        { key: 'overview', label: 'Overview' },
                        { key: 'assignment', label: assignments.length > 0 ? `Assignments (${assignments.length})` : 'Assignments' },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
                            activeTab === tab.key
                              ? 'border-[#0d9488] text-[#0d9488]'
                              : 'border-transparent text-[#6b6f7d] hover:text-[#0c0d12]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab content */}
                  <div className="px-5 pb-5">
                    {activeTab === 'overview' && (
                      <div className="space-y-4 pt-1">
                        {currentLesson?.video_link && (
                          <div className="bg-[#f8f9fc] rounded-[10px] p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-[8px] bg-[rgba(13,148,136,0.1)] flex items-center justify-center flex-shrink-0">
                              <svg viewBox="0 0 16 16" fill="none" stroke="#0d9488" strokeWidth="1.4" className="w-4 h-4">
                                <path d="M8.5 2.5h4a1 1 0 011 1v8a1 1 0 01-1 1h-8a1 1 0 01-1-1V7M2.5 2.5l5 5M5 2.5h-2.5v2.5"/>
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[#0c0d12] text-[12px] font-semibold">Resource Link</p>
                              <a href={currentLesson.video_link} target="_blank" rel="noopener noreferrer"
                                className="text-[#0d9488] text-[11px] hover:underline truncate block max-w-[400px]">
                                {currentLesson.video_link}
                              </a>
                            </div>
                          </div>
                        )}
                        <p className="text-[#6b6f7d] text-[13px] leading-relaxed">
                          {currentLesson
                            ? `This lesson covers "${currentLesson.title}". Follow along with the video above or join the live session using the link provided.`
                            : 'Lesson content will appear here.'}
                        </p>
                      </div>
                    )}

                    {activeTab === 'assignment' && (
                      <div className="pt-1">
                        {assignments.length === 0 ? (
                          <div className="py-10 text-center">
                            <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-3">
                              <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><path d="M4 2h9l4 4v13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M13 2v4h4M7 9h6M7 12h6M7 15h3" strokeLinecap="round"/></svg>
                            </div>
                            <p className="text-[#0c0d12] text-[14px] font-semibold mb-1">No assignments yet</p>
                            <p className="text-[#6b6f7d] text-[13px]">The tutor hasn't posted any assignments for this course.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {assignments.map((asgn) => (
                              <div key={asgn.id} className="border border-[#f0f0f5] rounded-[14px] p-4">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <h3 className="text-[#0c0d12] text-[14px] font-bold leading-snug">{asgn.title}</h3>
                                  {asgn.due_date && (
                                    <span className="text-[11px] bg-[rgba(255,166,26,0.1)] text-[#ffa61a] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
                                      Due {formatDate(asgn.due_date)}
                                    </span>
                                  )}
                                </div>
                                {asgn.description && (
                                  <p className="text-[#6b6f7d] text-[13px] leading-relaxed mb-3">{asgn.description}</p>
                                )}
                                {asgn.max_score != null && (
                                  <p className="text-[12px] text-[#6b6f7d] mb-3">Max score: <span className="text-[#0c0d12] font-semibold">{asgn.max_score} pts</span></p>
                                )}

                                {submitted[asgn.id] ? (
                                  <div className="bg-[#edfbf4] rounded-[12px] p-4 flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#22be70] flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <CheckIcon />
                                    </div>
                                    <div>
                                      <p className="text-[#22be70] text-[13px] font-semibold">Assignment submitted!</p>
                                      <p className="text-[#22be70]/70 text-[12px] mt-0.5">Your answer has been sent to the tutor for review.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-[#0c0d12] text-[12px] font-semibold mb-2">Your Answer</p>
                                    <textarea
                                      value={answers[asgn.id] || ''}
                                      onChange={(e) => setAnswers((prev) => ({ ...prev, [asgn.id]: e.target.value }))}
                                      placeholder="Type your answer here... (optional if uploading a file)"
                                      rows={4}
                                      className="w-full border border-[#e8eaef] rounded-[10px] px-3 py-2.5 text-[13px] text-[#0c0d12] placeholder-[#b0b5c4] resize-none focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[rgba(13,148,136,0.1)] transition-all"
                                    />

                                    {/* File upload */}
                                    <div className="mt-3">
                                      <p className="text-[#0c0d12] text-[12px] font-semibold mb-2">
                                        Attach File <span className="text-[#6b6f7d] font-normal">(optional)</span>
                                      </p>
                                      {files[asgn.id] ? (
                                        <div className="flex items-center gap-3 bg-[#f8f9fc] border border-[#e8eaef] rounded-[10px] px-3 py-2.5">
                                          <div className="w-8 h-8 rounded-[8px] bg-[rgba(13,148,136,0.1)] flex items-center justify-center flex-shrink-0">
                                            <svg viewBox="0 0 16 16" fill="none" stroke="#0d9488" strokeWidth="1.4" className="w-4 h-4">
                                              <path d="M4 2h6l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
                                              <path d="M10 2v3h3"/>
                                            </svg>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[#0c0d12] text-[12px] font-medium truncate">{files[asgn.id].name}</p>
                                            <p className="text-[#6b6f7d] text-[11px]">
                                              {files[asgn.id].size < 1024 * 1024
                                                ? `${(files[asgn.id].size / 1024).toFixed(1)} KB`
                                                : `${(files[asgn.id].size / (1024 * 1024)).toFixed(1)} MB`}
                                            </p>
                                          </div>
                                          <button
                                            onClick={() => removeFile(asgn.id)}
                                            className="w-6 h-6 rounded-full bg-[#f0f0f5] hover:bg-[#fee2e2] flex items-center justify-center flex-shrink-0 transition-colors"
                                            title="Remove file"
                                          >
                                            <svg viewBox="0 0 10 10" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-3 h-3">
                                              <path d="M2 2l6 6M8 2L2 8"/>
                                            </svg>
                                          </button>
                                        </div>
                                      ) : (
                                        <label className="flex flex-col items-center gap-2 border-2 border-dashed border-[#e8eaef] rounded-[10px] p-4 cursor-pointer hover:border-[#0d9488] hover:bg-[rgba(13,148,136,0.02)] transition-colors group">
                                          <div className="w-9 h-9 rounded-full bg-[rgba(13,148,136,0.08)] group-hover:bg-[rgba(13,148,136,0.14)] flex items-center justify-center transition-colors">
                                            <svg viewBox="0 0 20 20" fill="none" stroke="#0d9488" strokeWidth="1.5" className="w-5 h-5">
                                              <path d="M10 13V7M7 10l3-3 3 3"/>
                                              <path d="M3 15a4 4 0 010-8 5 5 0 019.9-1A4 4 0 0117 15H3z"/>
                                            </svg>
                                          </div>
                                          <div className="text-center">
                                            <p className="text-[#0c0d12] text-[12px] font-semibold">Click to upload a file</p>
                                            <p className="text-[#6b6f7d] text-[11px] mt-0.5">PDF, DOCX, TXT, PNG, JPG, ZIP - up to 32 MB</p>
                                          </div>
                                          <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
                                            onChange={(e) => handleFileChange(asgn.id, e)}
                                          />
                                        </label>
                                      )}
                                    </div>

                                    {submitError[asgn.id] && (
                                      <p className="text-[#f24545] text-[12px] mt-2 flex items-center gap-1.5">
                                        <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
                                          <circle cx="7" cy="7" r="6.5" fill="#fee2e2" stroke="#f24545" strokeWidth="0.8"/>
                                          <path d="M7 4v4M7 9.5v.5" stroke="#f24545" strokeWidth="1.2" strokeLinecap="round"/>
                                        </svg>
                                        {submitError[asgn.id]}
                                      </p>
                                    )}

                                    <button
                                      onClick={() => handleSubmit(asgn.id)}
                                      disabled={
                                        submitting === asgn.id ||
                                        (!(answers[asgn.id] || '').trim() && !files[asgn.id])
                                      }
                                      className="w-full mt-3 bg-[#0d9488] text-white text-[13px] font-semibold py-2.5 rounded-[10px] hover:bg-[#0f766e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                    >
                                      {submitting === asgn.id ? (
                                        <>
                                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          {uploadProgress[asgn.id] ? 'Uploading file...' : 'Submitting...'}
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
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mark as Complete */}
                <div className="flex justify-center">
                  {isCurrentDone ? (
                    <div className="flex items-center gap-2 bg-[#edfbf4] text-[#22be70] text-[13px] font-semibold px-5 py-2.5 rounded-[10px]">
                      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                        <circle cx="8" cy="8" r="7" fill="#22be70"/>
                        <path d="M5 8l2.5 2.5L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Lesson completed
                    </div>
                  ) : (
                    <button
                      onClick={handleMarkComplete}
                      disabled={markingComplete}
                      className="flex items-center gap-2 bg-[#0d9488] text-white text-[13px] font-semibold px-6 py-2.5 rounded-[10px] hover:bg-[#0f766e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {markingComplete ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                          <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.3"/>
                          <path d="M5 8l2.5 2.5L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      Mark as Complete
                    </button>
                  )}
                </div>

                {/* Prev / Next navigation */}
                <div className="flex items-center justify-between gap-3">
                  {prevLesson ? (
                    <Link
                      to={`/student/courses/${courseId}/lessons/${prevLesson.id}`}
                      className="flex items-center gap-2 bg-white border border-[#e8eaef] text-[#383a44] text-[13px] font-semibold px-4 py-2.5 rounded-[10px] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors"
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                        <path d="M10 13L5 8l5-5"/>
                      </svg>
                      Previous
                    </Link>
                  ) : <div />}

                  {nextLesson ? (
                    <Link
                      to={`/student/courses/${courseId}/lessons/${nextLesson.id}`}
                      className="flex items-center gap-2 bg-[#0d9488] text-white text-[13px] font-semibold px-5 py-2.5 rounded-[10px] hover:bg-[#0f766e] transition-colors"
                    >
                      Next Lesson
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                        <path d="M6 3l5 5-5 5"/>
                      </svg>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 bg-[#edfbf4] text-[#22be70] text-[13px] font-semibold px-5 py-2.5 rounded-[10px]">
                      <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                        <circle cx="8" cy="8" r="7" fill="#22be70"/>
                        <path d="M5 8l2.5 2.5L11 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Course Complete!
                    </div>
                  )}
                </div>

              </div>

              {/* Right details panel */}
              <div className="w-[220px] flex-shrink-0 space-y-4 hidden xl:block">

                <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-4 sticky top-0">
                  <p className="text-[#0c0d12] text-[13px] font-bold mb-4">Lesson Details</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[#6b6f7d]">Duration</span>
                      <span className="text-[#0c0d12] font-semibold">{formatDuration(currentLesson?.duration_minutes)}</span>
                    </div>
                    <div className="w-full h-px bg-[#f0f0f5]" />
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[#6b6f7d]">Progress</span>
                      <span className="text-[#0c0d12] font-semibold">
                        {completedCount}/{totalPlanned > 0 ? totalPlanned : lessons.length}
                        {totalPlanned > 0 && <span className="text-[#6b6f7d] font-normal"> planned</span>}
                      </span>
                    </div>
                    <div className="w-full h-px bg-[#f0f0f5]" />
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[#6b6f7d]">Assignments</span>
                      <span className="text-[#0c0d12] font-semibold">{assignments.length}</span>
                    </div>
                    {currentLesson?.scheduled_at && (
                      <>
                        <div className="w-full h-px bg-[#f0f0f5]" />
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-[#6b6f7d]">Date</span>
                          <span className="text-[#0c0d12] font-semibold">{formatDate(currentLesson.scheduled_at)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-4">
                  <p className="text-[#0c0d12] text-[13px] font-bold mb-3">All Lessons</p>
                  <div className="space-y-2">
                    {lessons.map((lesson, idx) => {
                      const isDone = idx < currentIndex;
                      const isCur = lesson.id === lessonId;
                      return (
                        <div key={lesson.id} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{
                            backgroundColor: isDone ? '#22c55e' : isCur ? '#0d9488' : '#e8eaef'
                          }} />
                          <p className={`text-[11px] truncate ${
                            isCur ? 'text-[#0d9488] font-semibold' : isDone ? 'text-[#383a44]' : 'text-[#6b6f7d]'
                          }`}>
                            {lesson.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView;
