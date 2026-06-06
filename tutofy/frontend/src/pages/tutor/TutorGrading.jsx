﻿import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { coursesAPI } from '../../api/courses';
import { assignmentsAPI } from '../../api/assignments';
import { submissionsAPI } from '../../api/submissions';
import { gradingAPI } from '../../api/grading';
import { usersAPI } from '../../api/users';
import { mediaAPI } from '../../api/media';
import TopBarActions from '../../components/ui/TopBarActions';

/* â"€â"€ helpers â"€â"€ */
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

function GradingDownloadButton({ id, name }) {
  const [loading, setLoading] = React.useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        try { const res = await mediaAPI.getDownloadURL(id); window.open(res.url, '_blank'); } catch {}
        setLoading(false);
      }}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#e8eaef] bg-[#f8f9fc] hover:bg-[#f0f2ff] hover:border-[#0d9488] transition-colors text-left disabled:opacity-60"
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="#6b6f7d" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0"><path d="M5 3h8l4 4v11a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M13 3v4h4M7 11h6M7 14h4" strokeLinecap="round"/></svg>
      <span className="text-[12px] text-[#0c0d12] font-medium truncate flex-1">{name}</span>
      {loading
        ? <div className="w-3.5 h-3.5 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin flex-shrink-0" />
        : <svg viewBox="0 0 16 16" fill="none" stroke="#0d9488" strokeWidth="1.5" className="w-3.5 h-3.5 flex-shrink-0"><path d="M8 3v7M5 7l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13h10" strokeLinecap="round"/></svg>
      }
    </button>
  );
}
const COLORS = ['#0d9488', '#935bf5', '#00beb7', '#ff8032', '#22c55e', '#ef4444'];
const avatarColor = (s) => COLORS[(s?.charCodeAt(0) || 0) % COLORS.length];
const getInitials = (name) =>
  (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const relativeTime = (iso) => {
  if (!iso) return '-';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* â"€â"€ Star rating (cosmetic) â"€â"€ */
const StarRow = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-[#383a44] text-[13px]">{label}</span>
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-[18px] transition-colors ${n <= value ? 'text-[#fbbf24]' : 'text-[#d1d5db]'}`}
        >
          ★
        </button>
      ))}
    </div>
  </div>
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const TutorGrading = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();

  /* â"€â"€ data â"€â"€ */
  const [courses, setCourses]       = useState([]);
  const [assignments, setAssignments] = useState([]); // [{...assignment, courseTitle}]
  const [submissions, setSubmissions] = useState([]); // for selected assignment
  const [usersMap, setUsersMap]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [subLoading, setSubLoading] = useState(false);

  /* â"€â"€ selection â"€â"€ */
  const [selAssignment, setSelAssignment] = useState(null);
  const [selSubIdx, setSelSubIdx]         = useState(0);
  const [tab, setTab]                     = useState('students'); // students | submissions

  /* â"€â"€ filters â"€â"€ */
  const [filterCourse, setFilterCourse]   = useState('');
  const [filterStatus, setFilterStatus]   = useState('');  // '' | 'submitted' | 'not_submitted'
  const [filterGrading, setFilterGrading] = useState('');  // '' | 'graded' | 'ungraded'

  /* â"€â"€ grade form â"€â"€ */
  const [score, setScore]         = useState('');
  const [feedback, setFeedback]   = useState('');
  const [rubric, setRubric]       = useState({ content: 0, structure: 0, grammar: 0, vocab: 0 });
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState('');

  useEffect(() => {
    if (!isAuthenticated || role !== 'tutor') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  /* â"€â"€ initial load â"€â"€ */
  useEffect(() => {
    const uid = user?.user_id;
    if (!uid) { setLoading(false); return; }

    (async () => {
      try {
        const [coursesRes, usersRes] = await Promise.all([
          coursesAPI.getAllCourses().catch(() => ({})),
          usersAPI.getAllUsers().catch(() => ({})),
        ]);
        const tutorCourses = (coursesRes?.courses || []).filter((c) => c.tutor_id === uid);
        setCourses(tutorCourses);

        const uMap = {};
        (usersRes?.users || []).forEach((u) => { uMap[u.id] = u; });
        setUsersMap(uMap);

        /* assignments for all courses */
        const aResults = await Promise.all(
          tutorCourses.map(async (c) => {
            const res = await assignmentsAPI.getCourseAssignments(c.id).catch(() => []);
            const list = Array.isArray(res) ? res : (res?.assignments || []);
            return list.map((a) => ({ ...a, courseTitle: c.title, courseId: c.id }));
          })
        );
        const allAssignments = aResults.flat();
        setAssignments(allAssignments);

        if (allAssignments.length > 0) {
          setSelAssignment(allAssignments[0]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  /* â"€â"€ filtered assignments list for the left sidebar selector â"€â"€ */
  const filteredAssignments = useMemo(() => {
    let list = assignments;
    if (filterCourse) list = list.filter((a) => a.courseId === filterCourse);
    return list;
  }, [assignments, filterCourse]);

  /* â"€â"€ load submissions + grades when selected assignment changes â"€â"€ */
  useEffect(() => {
    setSubLoading(true);
    setSelSubIdx(0);
    setScore('');
    setFeedback('');
    setRubric({ content: 0, structure: 0, grammar: 0, vocab: 0 });
    setSaveMsg('');

    const toLoad = selAssignment ? [selAssignment] : filteredAssignments;
    if (toLoad.length === 0) {
      setSubmissions([]);
      setSubLoading(false);
      return;
    }

    Promise.all(
      toLoad.map(async (asgn) => {
        const [subRes, gradeRes] = await Promise.all([
          submissionsAPI.getAssignmentSubmissions(asgn.id).catch(() => ({})),
          gradingAPI.getAssignmentGrades(asgn.id).catch(() => ({})),
        ]);
        const subs  = subRes?.submissions  || (Array.isArray(subRes)  ? subRes  : []);
        const grades = gradeRes?.grades    || (Array.isArray(gradeRes) ? gradeRes : []);
        const gradeMap = {};
        grades.forEach((g) => { gradeMap[g.student_id] = g; });
        return subs.map((s) => {
          const g = gradeMap[s.student_id];
          return g
            ? { ...s, grade: g.grade ?? 0, feedback: g.feedback ?? '', graded: true, _assignment: asgn }
            : { ...s, graded: false, _assignment: asgn };
        });
      })
    ).then(async (results) => {
      const merged = results.flat();
      setSubmissions(merged);

      setUsersMap(prev => {
        const missing = [...new Set(merged.map(s => s.student_id).filter(id => id && !prev[id]))];
        if (missing.length === 0) return prev;
        Promise.all(missing.map(id => usersAPI.getUserById(id).catch(() => null)))
          .then(results => {
            const extra = {};
            results.forEach(u => { if (u?.id) extra[u.id] = u; });
            setUsersMap(p => ({ ...p, ...extra }));
          });
        return prev;
      });
    }).catch(() => setSubmissions([]))
      .finally(() => setSubLoading(false));
  }, [selAssignment, filteredAssignments]);

  /* â"€â"€ pre-fill grade form when switching submission â"€â"€ */
  const selSub = submissions[selSubIdx] || null;
  const activeAssignment = selAssignment || selSub?._assignment || null;
  useEffect(() => {
    if (!selSub) return;
    setScore(selSub.graded ? String(selSub.grade) : '');
    setFeedback(selSub.feedback || '');
    setSaveMsg('');
  }, [selSubIdx, submissions]);

  /* â"€â"€ filtered submissions for student list â"€â"€ */
  const filteredSubs = useMemo(() => {
    let list = submissions;
    if (filterStatus === 'submitted') list = list.filter((s) => s.content || s.file_id);
    if (filterStatus === 'not_submitted') list = list.filter((s) => !s.content && !s.file_id);
    if (filterGrading === 'graded') list = list.filter((s) => s.graded);
    if (filterGrading === 'ungraded') list = list.filter((s) => !s.graded);
    return list;
  }, [submissions, filterStatus, filterGrading]);

  /* â"€â"€ grade submit â"€â"€ */
  const handleGrade = useCallback(async (andNext = false) => {
    if (!selSub || !score) return;
    const gradeVal = parseInt(score, 10);
    if (isNaN(gradeVal) || gradeVal < 0 || gradeVal > 100) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await gradingAPI.submitGrade({
        assignment_id: selSub._assignment?.id || selAssignment?.id,
        student_id: selSub.student_id,
        grade: gradeVal,
        feedback: feedback.trim(),
      });
      /* update local state */
      setSubmissions((prev) =>
        prev.map((s, i) =>
          i === selSubIdx
            ? { ...s, grade: gradeVal, feedback: feedback.trim(), graded: true }
            : s
        )
      );
      setSaveMsg('Saved!');
      if (andNext && selSubIdx < filteredSubs.length - 1) {
        setSelSubIdx((i) => i + 1);
      }
    } catch {
      setSaveMsg('Error saving');
    } finally {
      setSaving(false);
    }
  }, [selSub, selAssignment, selSubIdx, score, feedback, filteredSubs.length]);

  const studentName = (sub) => usersMap[sub?.student_id]?.name || sub?.student_id || 'Student';
  const hasContent = (sub) => sub?.content || sub?.file_id;
  const isGraded = (sub) => sub?.graded === true;

  const handleDownloadFile = useCallback(async (fileId) => {
    try {
      const res = await mediaAPI.getDownloadURL(fileId);
      const url = res?.url || res?.Url;
      if (url) window.open(url, '_blank');
      else alert('Download link unavailable.');
    } catch {
      alert('Failed to get download link. Please try again.');
    }
  }, []);

  const totalGraded = submissions.filter((s) => s.graded).length;

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  return (
    <div className="flex h-screen bg-[#f5f6fa] font-sans">
      <TutorSidebar />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* â"€â"€ Top bar â"€â"€ */}
        <div className="bg-white border-b border-[#ebebf0] px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-[#0c0d12] text-[22px] font-bold leading-none">Grading</h1>
            <p className="text-[#6b6f7d] text-[13px] mt-1">Review and grade student assignments</p>
          </div>
          <TopBarActions />
        </div>

        {/* â"€â"€ Filter row â"€â"€ */}
        <div className="bg-white border-b border-[#ebebf0] px-8 py-3 flex items-center gap-3 flex-wrap flex-shrink-0">
          {/* Course */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-[#6b6f7d] font-medium">Course</label>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="h-[34px] px-3 pr-7 border border-[#d2d4d9] rounded-[8px] text-[13px] text-[#0c0d12] bg-white focus:outline-none focus:border-[#0d9488] min-w-[150px]"
            >
              <option value="">All Courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {/* Assignment */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-[#6b6f7d] font-medium">Assignment</label>
            <select
              value={selAssignment?.id || ''}
              onChange={(e) => {
                if (!e.target.value) { setSelAssignment(null); return; }
                const a = assignments.find((x) => x.id === e.target.value);
                if (a) setSelAssignment(a);
              }}
              className="h-[34px] px-3 pr-7 border border-[#d2d4d9] rounded-[8px] text-[13px] text-[#0c0d12] bg-white focus:outline-none focus:border-[#0d9488] min-w-[180px]"
            >
              <option value="">All Assignments</option>
              {filteredAssignments.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>

          {/* Submission Status */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-[#6b6f7d] font-medium">Submission Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-[34px] px-3 pr-7 border border-[#d2d4d9] rounded-[8px] text-[13px] text-[#0c0d12] bg-white focus:outline-none focus:border-[#0d9488] min-w-[150px]"
            >
              <option value="">All Submissions</option>
              <option value="submitted">Submitted</option>
              <option value="not_submitted">Not Submitted</option>
            </select>
          </div>

          {/* Grading Status */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-[#6b6f7d] font-medium">Grading Status</label>
            <select
              value={filterGrading}
              onChange={(e) => setFilterGrading(e.target.value)}
              className="h-[34px] px-3 pr-7 border border-[#d2d4d9] rounded-[8px] text-[13px] text-[#0c0d12] bg-white focus:outline-none focus:border-[#0d9488] min-w-[130px]"
            >
              <option value="">All</option>
              <option value="ungraded">Ungraded</option>
              <option value="graded">Graded</option>
            </select>
          </div>

          <button className="flex items-center gap-1.5 border border-[#d2d4d9] text-[#383a44] text-[13px] font-medium px-3 h-[34px] rounded-[8px] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors mt-4">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
            </svg>
            Filters
          </button>
        </div>

        {/* â"€â"€ Three-column body â"€â"€ */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex min-h-0 overflow-hidden">

            {/* â"€â"€ Left: student list â"€â"€ */}
            <div className="w-[280px] flex-shrink-0 border-r border-[#ebebf0] bg-white flex flex-col">
              {/* Tabs */}
              <div className="flex border-b border-[#ebebf0] flex-shrink-0">
                {['students', 'submissions'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-3 text-[13px] font-semibold capitalize transition-colors ${
                      tab === t
                        ? 'text-[#0d9488] border-b-2 border-[#0d9488]'
                        : 'text-[#6b6f7d] hover:text-[#0c0d12]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Count + sort */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f0f0f5] flex-shrink-0">
                <span className="text-[#6b6f7d] text-[12px]">
                  {filteredSubs.length} student{filteredSubs.length !== 1 ? 's' : ''}
                </span>
                <button className="text-[#6b6f7d] text-[11px] flex items-center gap-1 hover:text-[#0c0d12]">
                  Newest First
                  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3 h-3">
                    <path d="M2 4l3-3 3 3M2 6l3 3 3-3" />
                  </svg>
                </button>
              </div>

              {/* Student rows */}
              <div className="flex-1 overflow-y-auto">
                {subLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-5 h-5 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredSubs.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <p className="text-[#6b6f7d] text-[13px]">No submissions yet</p>
                  </div>
                ) : (
                  filteredSubs.map((sub, idx) => {
                    const name = studentName(sub);
                    const graded = isGraded(sub);
                    const submitted = hasContent(sub);
                    const isActive = idx === selSubIdx;
                    return (
                      <button
                        key={sub.id || idx}
                        onClick={() => setSelSubIdx(idx)}
                        className={`w-full text-left px-4 py-3.5 border-b border-[#f0f0f5] flex items-start gap-3 transition-colors ${
                          isActive ? 'bg-[#eef0ff]' : 'hover:bg-[#f8f9fb]'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0 mt-0.5"
                          style={{ background: avatarColor(name) }}
                        >
                          {getInitials(name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-[13px] font-semibold truncate ${isActive ? 'text-[#0d9488]' : 'text-[#0c0d12]'}`}>
                              {name}
                            </p>
                            <span className="text-[#6b6f7d] text-[11px] flex-shrink-0">
                              {relativeTime(sub.submitted_at || sub.created_at)}
                            </span>
                          </div>
                          <p className="text-[#6b6f7d] text-[11px] truncate mt-0.5">
                            {sub._assignment?.title || selAssignment?.title || '-'}
                          </p>
                          <div className="mt-1.5">
                            {submitted ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#22be70]/15 text-[#22be70]">
                                Submitted
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f0f0f5] text-[#6b6f7d]">
                                Not Submitted
                              </span>
                            )}
                            {graded && (
                              <span className="ml-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0d9488]/12 text-[#0d9488]">
                                {sub.grade}/100
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Showing count */}
              {filteredSubs.length > 0 && (
                <div className="px-4 py-3 border-t border-[#f0f0f5] flex-shrink-0">
                  <p className="text-[#6b6f7d] text-[11px]">
                    Showing 1 to {filteredSubs.length} of {filteredSubs.length} students
                  </p>
                </div>
              )}
            </div>

            {/* â"€â"€ Center: assignment & submission â"€â"€ */}
            <div className="flex-1 min-w-0 overflow-y-auto p-6">
              {!selSub && !subLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-[#f0f2ff] flex items-center justify-center mx-auto mb-4">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="1.5" className="w-8 h-8">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-[#0c0d12] text-[16px] font-semibold">Select a student to review</p>
                    <p className="text-[#6b6f7d] text-[13px] mt-1">Choose from the list on the left</p>
                  </div>
                </div>
              ) : selSub ? (
                <div className="max-w-[680px]">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[#0c0d12] text-[18px] font-bold">Assignment &amp; Submission</h2>
                    <button className="flex items-center gap-1.5 text-[#0d9488] text-[13px] font-medium hover:opacity-80">
                      View Original Assignment
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                        <path d="M4 2h8v8M12 2L4 10" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Assignment title + meta */}
                  <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6 mb-4">
                    <h3 className="text-[#0c0d12] text-[20px] font-bold mb-3">
                      {activeAssignment?.title || 'Assignment'}
                    </h3>
                    <div className="flex items-center gap-4 text-[12px] text-[#6b6f7d] flex-wrap">
                      {activeAssignment?.due_at && (
                        <span>
                          Due:{' '}
                          <span className="text-[#383a44]">
                            {new Date(activeAssignment.due_at).toLocaleDateString('en-US', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </span>
                        </span>
                      )}
                      <span>Max Score: <span className="text-[#383a44]">100</span></span>
                      {selSub?.submitted_at && (
                        <span>
                          Submitted:{' '}
                          <span className="text-[#383a44]">
                            {new Date(selSub.submitted_at).toLocaleDateString('en-US', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Instructions */}
                  {activeAssignment?.description && (() => {
                    const { plain, files } = parseAssignmentDescription(activeAssignment.description);
                    return (plain || files.length > 0) ? (
                      <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6 mb-4">
                        <h4 className="text-[#0c0d12] text-[14px] font-bold mb-3">Instructions</h4>
                        {plain && <p className="text-[#383a44] text-[14px] leading-[1.7] mb-3">{plain}</p>}
                        {files.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[#6b6f7d] text-[11px] font-semibold uppercase tracking-wide mb-1">Attached files</p>
                            {files.map(f => <GradingDownloadButton key={f.id} id={f.id} name={f.name} />)}
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}

                  {/* Student submission */}
                  <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6 mb-4">
                    <h4 className="text-[#0c0d12] text-[14px] font-bold mb-4">Student Submission</h4>
                    {hasContent(selSub) ? (
                      <>
                        {selSub.content ? (
                          <div className="text-[#383a44] text-[14px] leading-[1.8] whitespace-pre-wrap">
                            {selSub.content}
                          </div>
                        ) : (
                          <p className="text-[#6b6f7d] text-[13px] italic">No text content - file submitted below.</p>
                        )}

                        {/* Submitted file */}
                        {selSub.file_id && (
                          <div className="mt-5">
                            <h4 className="text-[#0c0d12] text-[13px] font-bold mb-3">Submitted Files (1)</h4>
                            <div className="flex items-center gap-3 p-3 border border-[#ebebf0] rounded-[10px]">
                              <div className="w-9 h-9 bg-[#eef0ff] rounded-[8px] flex items-center justify-center flex-shrink-0">
                                <svg viewBox="0 0 16 16" fill="none" stroke="#0d9488" strokeWidth="1.4" className="w-4 h-4">
                                  <path d="M4 2h6l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" /><path d="M10 2v4h3" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[#0c0d12] text-[13px] font-medium truncate">
                                  {selSub.file_name || `submission_${selSub.file_id?.slice(0, 8)}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDownloadFile(selSub.file_id)}
                                  title="Download file"
                                  className="text-[#6b6f7d] hover:text-[#0d9488] transition-colors"
                                >
                                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                    <path d="M8 2v8M4 7l4 4 4-4M2 13h12" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-[#6b6f7d] text-[13px]">Student has not submitted yet</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* â"€â"€ Right: Grade & Feedback â"€â"€ */}
            <div className="w-[300px] flex-shrink-0 border-l border-[#ebebf0] bg-white flex flex-col overflow-y-auto">
              <div className="p-5 flex-1">
                <h2 className="text-[#0c0d12] text-[16px] font-bold mb-5">Grade &amp; Feedback</h2>

                {/* Navigation */}
                {filteredSubs.length > 0 && (
                  <div className="flex items-center justify-between mb-5 bg-[#f8f9fb] rounded-[10px] px-3 py-2">
                    <button
                      disabled={selSubIdx === 0}
                      onClick={() => setSelSubIdx((i) => i - 1)}
                      className="text-[#0d9488] text-[12px] font-medium disabled:text-[#c4c8d4] flex items-center gap-1"
                    >
                      <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                        <path d="M6 2L3 5l3 3" strokeLinecap="round" />
                      </svg>
                      Previous
                    </button>
                    <span className="text-[#6b6f7d] text-[12px]">
                      {selSubIdx + 1} of {filteredSubs.length}
                    </span>
                    <button
                      disabled={selSubIdx >= filteredSubs.length - 1}
                      onClick={() => setSelSubIdx((i) => i + 1)}
                      className="text-[#0d9488] text-[12px] font-medium disabled:text-[#c4c8d4] flex items-center gap-1"
                    >
                      Next
                      <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                        <path d="M4 2l3 3-3 3" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Score */}
                <div className="mb-5">
                  <label className="block text-[#0c0d12] text-[13px] font-semibold mb-2">Score</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="0"
                      className="w-[80px] h-[44px] border border-[#d2d4d9] rounded-[10px] px-3 text-[20px] font-bold text-[#0c0d12] text-center focus:outline-none focus:border-[#0d9488]"
                    />
                    <span className="text-[#6b6f7d] text-[16px] font-medium">/ 100</span>
                  </div>
                </div>

                {/* Feedback */}
                <div className="mb-5">
                  <label className="block text-[#0c0d12] text-[13px] font-semibold mb-2">Feedback</label>
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 border border-[#d2d4d9] border-b-0 rounded-t-[10px] px-2 py-1.5 bg-[#f8f9fb]">
                    {['B', 'I', 'U'].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        className={`w-7 h-7 rounded flex items-center justify-center text-[13px] text-[#383a44] hover:bg-[#ebebf0] transition-colors ${fmt === 'B' ? 'font-bold' : fmt === 'I' ? 'italic' : 'underline'}`}
                      >
                        {fmt}
                      </button>
                    ))}
                    <div className="w-px h-4 bg-[#d2d4d9] mx-0.5" />
                    <button className="w-7 h-7 rounded flex items-center justify-center text-[#383a44] hover:bg-[#ebebf0]">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                        <path d="M2 4h10M2 7h10M2 10h6" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button className="w-7 h-7 rounded flex items-center justify-center text-[#383a44] hover:bg-[#ebebf0]">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                        <path d="M6 7a2 2 0 004 0 2 2 0 00-4 0zM2 7h4M10 7h2M4 5l2 2M10 5l-2 2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Write feedback for the student..."
                    rows={5}
                    maxLength={1000}
                    className="w-full border border-[#d2d4d9] rounded-b-[10px] px-3 py-2.5 text-[13px] text-[#383a44] placeholder-[#c4c8d4] focus:outline-none focus:border-[#0d9488] resize-none"
                  />
                  <p className="text-[#c4c8d4] text-[11px] text-right mt-0.5">
                    {feedback.length}/1000
                  </p>
                </div>

                {/* Rubric */}
                <div className="mb-5">
                  <h3 className="text-[#0c0d12] text-[13px] font-bold mb-1">
                    Rubric{' '}
                    <span className="text-[#6b6f7d] font-normal">(Optional)</span>
                  </h3>
                  <div className="divide-y divide-[#f0f0f5]">
                    <StarRow label="Content & Ideas" value={rubric.content} onChange={(v) => setRubric((r) => ({ ...r, content: v }))} />
                    <StarRow label="Structure & Organization" value={rubric.structure} onChange={(v) => setRubric((r) => ({ ...r, structure: v }))} />
                    <StarRow label="Grammar & Mechanics" value={rubric.grammar} onChange={(v) => setRubric((r) => ({ ...r, grammar: v }))} />
                    <StarRow label="Vocabulary" value={rubric.vocab} onChange={(v) => setRubric((r) => ({ ...r, vocab: v }))} />
                  </div>
                </div>

                {/* Save message */}
                {saveMsg && (
                  <p className={`text-[12px] font-medium mb-3 ${saveMsg === 'Saved!' ? 'text-[#22be70]' : 'text-[#f24545]'}`}>
                    {saveMsg}
                  </p>
                )}

                {/* Quick Actions */}
                <div>
                  <h3 className="text-[#0c0d12] text-[13px] font-bold mb-3">Quick Actions</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGrade(false)}
                      disabled={saving || !score}
                      className="flex-1 border border-[#d2d4d9] text-[#383a44] text-[12px] font-semibold py-2.5 rounded-[9px] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors disabled:opacity-40"
                    >
                      {saving ? '...' : 'Save Draft'}
                    </button>
                    <button
                      onClick={() => {
                        if (selSubIdx < filteredSubs.length - 1) setSelSubIdx((i) => i + 1);
                      }}
                      className="flex-1 border border-[#d2d4d9] text-[#383a44] text-[12px] font-semibold py-2.5 rounded-[9px] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => handleGrade(true)}
                      disabled={saving || !score}
                      className="flex-1 bg-[#0d9488] text-white text-[12px] font-semibold py-2.5 rounded-[9px] hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      {saving ? '…' : 'Grade & Next'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default TutorGrading;
