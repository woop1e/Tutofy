﻿import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { coursesAPI } from '../../api/courses';
import { lessonsAPI } from '../../api/lessons';
import { enrollmentsAPI } from '../../api/enrollments';

// â"€â"€ helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function parseTS(ts) {
  if (!ts) return null;
  if (typeof ts === 'object' && ts.seconds != null) return new Date(Number(ts.seconds) * 1000);
  return new Date(String(ts).replace(' ', 'T'));
}

function fmtDate(val) {
  const d = parseTS(val);
  if (!d || isNaN(d)) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtTime(val) {
  const d = parseTS(val);
  if (!d || isNaN(d)) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const ACCENT = ['#0d9488', '#935bf5', '#ff8032', '#22c55e', '#ef4444', '#00beb7'];
function avatarColor(id) { return ACCENT[(id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENT.length]; }
function initials(name) { return (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(); }

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', bg: '#22c55e', light: 'rgba(34,190,112,0.1)', text: '#22c55e' },
  { value: 'absent',  label: 'Absent',  bg: '#ef4444', light: 'rgba(242,69,69,0.1)',  text: '#ef4444' },
  { value: 'excused', label: 'Excused', bg: '#ffa61a', light: 'rgba(255,166,26,0.1)', text: '#c07800' },
];

function StatusPill({ value, onChange }) {
  const active = STATUS_OPTIONS.find(o => o.value === value) || STATUS_OPTIONS[1];
  return (
    <div className="flex items-center gap-1">
      {STATUS_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="px-2.5 py-1 rounded-full text-[11px] font-bold transition-all"
          style={value === opt.value
            ? { backgroundColor: opt.bg, color: '#fff' }
            : { backgroundColor: opt.light, color: opt.text, opacity: 0.6 }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// â"€â"€ component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const CourseAttendance = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course,    setCourse]    = useState(null);
  const [lessons,   setLessons]   = useState([]);
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  const [selectedId,          setSelectedId]          = useState('');
  const [attendance,          setAttendance]          = useState({});
  const [savedAttendance,     setSavedAttendance]     = useState({});
  const [loadingAttendance,   setLoadingAttendance]   = useState(false);
  const [saving,              setSaving]              = useState(false);
  const [saveMsg,             setSaveMsg]             = useState('');

  // Load course, lessons, students
  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      coursesAPI.getCourseById(courseId).catch(() => null),
      lessonsAPI.getCourseLessons(courseId).catch(() => ({})),
      enrollmentsAPI.getCourseEnrollments(courseId).catch(() => []),
    ]).then(([cRes, lRes, eRes]) => {
      setCourse(cRes?.course || cRes);
      const ls = lRes?.lessons || lRes || [];
      const sorted = (Array.isArray(ls) ? ls : []).sort((a, b) => {
        const da = parseTS(a.scheduled_at), db = parseTS(b.scheduled_at);
        return (da || 0) - (db || 0);
      });
      setLessons(sorted);
      if (sorted.length > 0) setSelectedId(sorted[0].id);
      const es = Array.isArray(eRes) ? eRes : eRes?.enrollments || [];
      setStudents(es);
    }).finally(() => setLoading(false));
  }, [courseId]);

  // Load attendance when lesson or students change
  useEffect(() => {
    if (!selectedId || students.length === 0) { setAttendance({}); return; }
    setLoadingAttendance(true);
    lessonsAPI.getAttendance(selectedId)
      .then(data => {
        const records = data?.records || [];
        const map = {};
        students.forEach(s => { map[s.student_id] = 'absent'; });
        records.forEach(r => { map[r.student_id] = r.status || (r.attended ? 'present' : 'absent'); });
        setAttendance(map);
        setSavedAttendance({ ...map });
      })
      .catch(() => {
        const map = {};
        students.forEach(s => { map[s.student_id] = 'absent'; });
        setAttendance(map);
        setSavedAttendance({ ...map });
      })
      .finally(() => setLoadingAttendance(false));
  }, [selectedId, students]);

  const selectedLesson = useMemo(() => lessons.find(l => l.id === selectedId), [lessons, selectedId]);

  const markAll = (status) => {
    const map = {};
    students.forEach(s => { map[s.student_id] = status; });
    setAttendance(map);
  };

  const reset = () => setAttendance({ ...savedAttendance });

  const isDirty = useMemo(() =>
    JSON.stringify(attendance) !== JSON.stringify(savedAttendance),
    [attendance, savedAttendance]
  );

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const records = Object.entries(attendance).map(([student_id, status]) => ({ student_id, status }));
      await lessonsAPI.markAttendance(selectedId, records);
      setSavedAttendance({ ...attendance });
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch {
      setSaveMsg('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount  = Object.values(attendance).filter(s => s === 'absent').length;
  const excusedCount = Object.values(attendance).filter(s => s === 'excused').length;

  if (loading) return (
    <div className="flex min-h-screen bg-[#f3f4f7]">
      <TutorSidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <TutorSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/tutor/courses/${courseId}`}
              className="text-[#6b6f7d] text-[13px] hover:text-[#0c0d12] transition-colors flex-shrink-0 flex items-center gap-1">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M10 13L5 8l5-5"/>
              </svg>
              {course?.title || 'Course'}
            </Link>
            <div className="w-px h-4 bg-[#e8eaef]" />
            <p className="text-[#0c0d12] text-[14px] font-semibold">Attendance</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Header + lesson selector */}
          <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-[#0c0d12] text-[20px] font-bold">{course?.title || 'Course'}</h1>
                <p className="text-[#6b6f7d] text-[13px] mt-0.5">Select a lesson to view and mark attendance</p>
              </div>

              {/* Lesson selector */}
              {lessons.length > 0 ? (
                <select
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  className="border border-[#e8eaef] rounded-[10px] px-3 py-2 text-[13px] text-[#0c0d12] focus:outline-none focus:border-[#0d9488] bg-white min-w-[260px]"
                >
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                      {l.scheduled_at ? ` - ${fmtDate(l.scheduled_at)} ${fmtTime(l.scheduled_at)}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-[#6b6f7d] text-[13px]">No lessons yet</p>
              )}
            </div>

            {/* Stats bar */}
            {students.length > 0 && selectedId && (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#f0f0f5]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22be70]" />
                  <span className="text-[12px] text-[#0c0d12] font-semibold">{presentCount}</span>
                  <span className="text-[12px] text-[#6b6f7d]">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f24545]" />
                  <span className="text-[12px] text-[#0c0d12] font-semibold">{absentCount}</span>
                  <span className="text-[12px] text-[#6b6f7d]">Absent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffa61a]" />
                  <span className="text-[12px] text-[#0c0d12] font-semibold">{excusedCount}</span>
                  <span className="text-[12px] text-[#6b6f7d]">Excused</span>
                </div>
              </div>
            )}
          </div>

          {/* No lesson or no students */}
          {!selectedId && (
            <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-14 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><rect x="4" y="2" width="12" height="16" rx="1.5"/><path d="M7 2h6v3H7z"/><path d="M7 9h6M7 12h6M7 15h4" strokeLinecap="round"/></svg>
              </div>
              <p className="text-[#0c0d12] text-[16px] font-semibold mb-1">No lessons to track</p>
              <p className="text-[#6b6f7d] text-[13px]">Add lessons to the course first.</p>
            </div>
          )}

          {selectedId && students.length === 0 && (
            <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-14 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><circle cx="7" cy="7" r="3"/><path d="M1 18a6 6 0 0112 0"/><circle cx="14" cy="8" r="2.5"/><path d="M14 13a4 4 0 013.5 4"/></svg>
              </div>
              <p className="text-[#0c0d12] text-[16px] font-semibold mb-1">No students enrolled</p>
              <p className="text-[#6b6f7d] text-[13px]">Students will appear here once they enroll in this course.</p>
            </div>
          )}

          {/* Attendance table */}
          {selectedId && students.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#f0f0f5] overflow-hidden">

              {/* Actions */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#f0f0f5]">
                <button onClick={() => markAll('present')}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-[7px] bg-[rgba(34,190,112,0.1)] text-[#22be70] hover:bg-[rgba(34,190,112,0.2)] transition-colors">
                  Mark all Present
                </button>
                <button onClick={() => markAll('absent')}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-[7px] bg-[rgba(242,69,69,0.08)] text-[#f24545] hover:bg-[rgba(242,69,69,0.15)] transition-colors">
                  Mark all Absent
                </button>
                <button onClick={reset} disabled={!isDirty}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-[7px] border border-[#e8eaef] text-[#6b6f7d] hover:border-[#0d9488] hover:text-[#0d9488] disabled:opacity-40 transition-colors">
                  Reset
                </button>
                <div className="ml-auto flex items-center gap-2">
                  {saveMsg && (
                    <span className={`text-[12px] font-semibold ${saveMsg === 'Saved!' ? 'text-[#22be70]' : 'text-[#f24545]'}`}>
                      {saveMsg}
                    </span>
                  )}
                  <button onClick={save} disabled={saving || !isDirty}
                    className="bg-[#0d9488] text-white text-[12px] font-bold px-4 py-2 rounded-[8px] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5">
                    {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                    Save attendance
                  </button>
                </div>
              </div>

              {/* Student list */}
              {loadingAttendance ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-3 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_220px] px-5 py-2.5 text-[11px] font-semibold text-[#6b6f7d] uppercase tracking-wide border-b border-[#f0f0f5]">
                    <span>Student</span>
                    <span>Status</span>
                  </div>
                  <div className="divide-y divide-[#f0f0f5]">
                    {students.map((enr, i) => {
                      const sid   = enr.student_id;
                      const name  = enr.student_name || `Student ${i + 1}`;
                      const color = avatarColor(sid);
                      const status = attendance[sid] || 'absent';
                      return (
                        <div key={sid || i} className="grid grid-cols-[1fr_220px] px-5 py-3.5 items-center hover:bg-[#fafafa] transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: color + '22' }}>
                              <span className="text-[12px] font-bold" style={{ color }}>{initials(name)}</span>
                            </div>
                            <button
                              onClick={() => sid && navigate(`/tutor/students/${sid}`)}
                              className="text-[13px] font-semibold text-[#0c0d12] truncate hover:text-[#0d9488] transition-colors text-left"
                            >
                              {name}
                            </button>
                          </div>
                          <StatusPill
                            value={status}
                            onChange={val => setAttendance(prev => ({ ...prev, [sid]: val }))}
                          />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseAttendance;
