﻿import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { enrollmentsAPI } from '../../api/enrollments';
import { coursesAPI } from '../../api/courses';
import { assignmentsAPI } from '../../api/assignments';
import { submissionsAPI } from '../../api/submissions';
import { mediaAPI } from '../../api/media';

function formatDeadline(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d - now;
  if (diff < 0) return { label: 'Overdue', color: '#ef4444', bg: '#fff0f0' };
  if (diff < 86400000) return { label: 'Due today', color: '#ff8032', bg: '#fff5ee' };
  if (diff < 3 * 86400000) return { label: `Due ${d.toLocaleDateString('en-GB', { weekday: 'short' })}`, color: '#ffa61a', bg: '#fffbf0' };
  return { label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), color: '#6b6f7d', bg: '#f8f9fc' };
}

const isPastDeadline = (dateStr) => dateStr && new Date(dateStr) < new Date();

const COLORS = ['#0d9488', '#935bf5', '#00beb7', '#ff8032', '#22c55e'];

const Assignments = () => {
  const { user } = useAuth();
  const userId = user?.user_id;

  const [assignments, setAssignments]   = useState([]);
  const [courseMap, setCourseMap]       = useState({});
  const [submissions, setSubmissions]   = useState({});   // assignmentId ←' submission
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('pending');
  const [submitting, setSubmitting]     = useState(null);
  const [textInput, setTextInput]       = useState({});
  const [fileInput, setFileInput]       = useState({});   // assignmentId ←' File
  const [uploadErr, setUploadErr]       = useState({});
  const [editing, setEditing]           = useState({});   // assignmentId ←' bool
  const fileRefs = useRef({});

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetchAll = async () => {
      try {
        const [enrRes, coursesRes] = await Promise.all([
          enrollmentsAPI.getUserEnrollments(userId).catch(() => ({})),
          coursesAPI.getAllCourses().catch(() => ({})),
        ]);

        const enrollments = enrRes?.enrollments || [];
        const allCourses  = coursesRes?.courses   || [];

        const map = {};
        allCourses.forEach((c, i) => { map[c.id] = { ...c, color: COLORS[i % COLORS.length] }; });
        setCourseMap(map);

        const courseIds = enrollments.map((e) => e.course_id).filter(Boolean);
        if (!courseIds.length) { setLoading(false); return; }

        const results = await Promise.all(
          courseIds.map((id) =>
            assignmentsAPI.getCourseAssignments(id)
              .then((r) => (r?.assignments || []).map((a) => ({ ...a, courseId: id })))
              .catch(() => [])
          )
        );
        const flat = results.flat();
        setAssignments(flat);

        // Load existing submissions for each assignment
        const subResults = await Promise.all(
          flat.map((a) =>
            submissionsAPI.getMySubmission(a.id)
              .then((sub) => ({ id: a.id, sub }))
              .catch(() => ({ id: a.id, sub: null }))
          )
        );
        const subMap = {};
        subResults.forEach(({ id, sub }) => { if (sub?.assignment_id) subMap[id] = sub; });
        setSubmissions(subMap);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [userId]);

  const stats = useMemo(() => {
    const submitted = Object.keys(submissions).length;
    const total     = assignments.length;
    const overdue   = assignments.filter((a) => !submissions[a.id] && isPastDeadline(a.due_date)).length;
    const graded    = assignments.filter((a) => submissions[a.id]?.status === 'graded').length;
    return [
      { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="4" y="2" width="12" height="16" rx="1.5"/><path d="M7 2h6v3H7z"/><path d="M7 9h6M7 12h6M7 15h4" strokeLinecap="round"/></svg>, label: 'Total',     value: total,     color: '#0d9488' },
      { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M10 3v10M6 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 17h12" strokeLinecap="round"/></svg>, label: 'Submitted', value: submitted, color: '#935bf5' },
      { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><circle cx="10" cy="10" r="8"/><path d="M6 10l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Graded',    value: graded,    color: '#22c55e' },
      { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><circle cx="10" cy="10" r="8"/><path d="M10 6v4M10 14h.01" strokeLinecap="round"/></svg>, label: 'Overdue',   value: overdue,   color: '#ef4444' },
    ];
  }, [assignments, submissions]);

  const filtered = useMemo(() => {
    let list = assignments;
    if (filter === 'pending')   list = assignments.filter((a) => !submissions[a.id]);
    if (filter === 'submitted') list = assignments.filter((a) => !!submissions[a.id]);
    if (filter === 'overdue')   list = assignments.filter((a) => !submissions[a.id] && isPastDeadline(a.due_date));
    return [...list].sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    });
  }, [assignments, submissions, filter]);

  const handleSubmit = async (assignmentId, courseId) => {
    const text = textInput[assignmentId]?.trim() || '';
    const file = fileInput[assignmentId];
    if (!text && !file) return;
    setSubmitting(assignmentId);
    setUploadErr((p) => ({ ...p, [assignmentId]: '' }));

    try {
      let fileId = '';
      if (file) {
        const res = await mediaAPI.uploadFile(file, courseId, 'assignment');
        fileId = res?.file_id || res?.id || '';
      }

      const sub = await submissionsAPI.submitAssignment({
        assignment_id: assignmentId,
        content: text,
        file_id: fileId,
      });

      setSubmissions((p) => ({ ...p, [assignmentId]: sub }));
      setTextInput((p) => ({ ...p, [assignmentId]: '' }));
      setFileInput((p) => ({ ...p, [assignmentId]: null }));
      setEditing((p) => ({ ...p, [assignmentId]: false }));
    } catch (err) {
      setUploadErr((p) => ({
        ...p,
        [assignmentId]: err?.response?.data?.error || err?.response?.data?.message || 'Submission failed. Try again.',
      }));
    } finally {
      setSubmitting(null);
    }
  };

  const startEdit = (assignmentId) => {
    const sub = submissions[assignmentId];
    setTextInput((p) => ({ ...p, [assignmentId]: sub?.content || '' }));
    setEditing((p) => ({ ...p, [assignmentId]: true }));
  };

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-7 justify-between flex-shrink-0">
          <div>
            <p className="text-[#0c0d12] text-[17px] font-bold leading-tight">Homework</p>
            <p className="text-[#6b6f7d] text-[12px]">Assignments from your tutors</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[rgba(13,148,136,0.12)] flex items-center justify-center">
            <span className="text-[#0d9488] text-[12px] font-bold">
              {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'S'}
            </span>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-[16px] border border-[#f0f0f5] p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-[#0c0d12] text-[22px] font-bold leading-none">{s.value}</p>
                  <p className="text-[#6b6f7d] text-[11px] mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            {[
              { key: 'pending',   label: 'Pending' },
              { key: 'submitted', label: 'Submitted' },
              { key: 'overdue',   label: 'Overdue' },
              { key: 'all',       label: 'All' },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-[10px] text-[13px] font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-[#0d9488] text-white'
                    : 'bg-white text-[#6b6f7d] border border-[#f0f0f5] hover:text-[#0c0d12]'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-[20px] border border-[#f0f0f5] p-14 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><circle cx="10" cy="10" r="8"/><path d="M6 10l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className="text-[#0c0d12] text-[17px] font-bold mb-2">
                {filter === 'pending' ? 'All caught up!' : 'No assignments here'}
              </p>
              <p className="text-[#6b6f7d] text-[14px]">
                {filter === 'pending' ? 'No pending assignments. Great work!' : 'Switch filter to see other assignments.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => {
                const deadline  = formatDeadline(a.due_date);
                const course    = courseMap[a.courseId] || {};
                const color     = course.color || '#0d9488';
                const initial   = (course.title || 'C')[0].toUpperCase();
                const sub       = submissions[a.id];
                const isSubmitted = !!sub;
                const isEditing   = editing[a.id];
                const canEdit     = isSubmitted && !isPastDeadline(a.due_date) && sub?.status !== 'graded';
                const showForm    = !isSubmitted || isEditing;
                const file        = fileInput[a.id];

                return (
                  <div key={a.id} className="bg-white rounded-[16px] border border-[#f0f0f5] p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 text-white font-bold text-[14px]"
                        style={{ backgroundColor: color }}>
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h3 className="text-[#0c0d12] text-[14px] font-bold">{a.title}</h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isSubmitted && (
                              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(13,148,136,0.08)] text-[#0d9488]">
                                âœ" Submitted
                              </span>
                            )}
                            {deadline && !isSubmitted && (
                              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                style={{ color: deadline.color, backgroundColor: deadline.bg }}>
                                {deadline.label}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[#6b6f7d] text-[12px] mb-1">{course.title || `Course ${a.courseId}`}</p>

                        {a.description && (
                          <p className="text-[#383a44] text-[13px] mt-2 leading-relaxed">{a.description}</p>
                        )}
                        {a.max_score && (
                          <p className="text-[#6b6f7d] text-[12px] mt-1">Max score: {a.max_score} pts</p>
                        )}

                        {/* Already submitted - show content + edit button */}
                        {isSubmitted && !isEditing && (
                          <div className="mt-3">
                            {sub.content && (
                              <div className="bg-[var(--bg)] rounded-[10px] px-4 py-3 text-[13px] text-[#383a44] leading-relaxed">
                                {sub.content}
                              </div>
                            )}
                            {sub.file_id && (
                              <p className="text-[#0d9488] text-[12px] mt-1 font-medium">ðŸ"Ž File attached</p>
                            )}
                            {canEdit && (
                              <button onClick={() => startEdit(a.id)}
                                className="mt-2 text-[12px] text-[#0d9488] font-semibold hover:underline">
                                Edit submission ←'
                              </button>
                            )}
                          </div>
                        )}

                        {/* Submit / Edit form */}
                        {showForm && (
                          <div className="mt-4 space-y-2">
                            {uploadErr[a.id] && (
                              <div className="text-[#f24545] text-[12px] bg-[#fff0f0] rounded-[8px] px-3 py-2">
                                {uploadErr[a.id]}
                              </div>
                            )}

                            <textarea
                              rows={3}
                              value={textInput[a.id] || ''}
                              onChange={(e) => setTextInput((p) => ({ ...p, [a.id]: e.target.value }))}
                              placeholder="Write your answer or paste a link to your work..."
                              className="w-full border border-[#f0f0f5] rounded-[10px] px-4 py-3 text-[13px] text-[#0c0d12] placeholder-[#8a90a1] outline-none focus:border-[#0d9488] resize-none transition-colors"
                            />

                            {/* File upload */}
                            <div
                              onClick={() => {
                                if (!fileRefs.current[a.id]) fileRefs.current[a.id] = document.createElement('input');
                                const inp = fileRefs.current[a.id];
                                inp.type = 'file';
                                inp.accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.txt';
                                inp.onchange = (e) => {
                                  const f = e.target.files[0];
                                  if (f) setFileInput((p) => ({ ...p, [a.id]: f }));
                                };
                                inp.click();
                              }}
                              className="flex items-center gap-2 border border-dashed border-[#d5d8e3] rounded-[10px] px-4 py-2.5 cursor-pointer hover:border-[#0d9488] hover:bg-[#f5f6ff] transition-colors"
                            >
                              <span className="text-[16px]">ðŸ"Ž</span>
                              <span className="text-[13px] text-[#6b6f7d]">
                                {file ? file.name : 'Attach a file (optional)'}
                              </span>
                              {file && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setFileInput((p) => ({ ...p, [a.id]: null })); }}
                                  className="ml-auto text-[#f24545] text-[11px] font-semibold hover:underline"
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {isEditing && (
                                <button onClick={() => setEditing((p) => ({ ...p, [a.id]: false }))}
                                  className="px-4 py-2 rounded-[10px] border border-[#f0f0f5] text-[13px] text-[#6b6f7d] hover:bg-[var(--bg)]">
                                  Cancel
                                </button>
                              )}
                              <button
                                onClick={() => handleSubmit(a.id, a.courseId)}
                                disabled={(!textInput[a.id]?.trim() && !file) || submitting === a.id}
                                className="bg-[#0d9488] text-white text-[13px] font-semibold px-5 py-2 rounded-[10px] hover:bg-[#0f766e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {submitting === a.id
                                  ? 'Submitting...'
                                  : isEditing ? 'Update ←' : 'Submit ←'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Assignments;
