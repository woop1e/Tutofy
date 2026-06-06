﻿import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { lessonsAPI } from '../../api/lessons';
import TopBarActions from '../../components/ui/TopBarActions';
import { usersAPI } from '../../api/users';

/* â"€â"€ Constants â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
const HOURS     = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00 - 21:00
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* â"€â"€ Helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
function startOfWeek(d) {
  const date = new Date(d);
  const day  = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

function fmtTime(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseTS(ts) {
  if (!ts) return null;
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

/* Parse stored availability into slot objects [{id,day,start,end}].
   New format: available_time_start is JSON array of slots.
   Legacy fallback: available_days[] + available_time_start/end strings. */
function parseProfileSlots(profile) {
  if (!profile) return [];
  try {
    const parsed = JSON.parse(profile.available_time_start);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.day) return parsed;
  } catch {}
  const days  = profile.available_days || [];
  const start = profile.available_time_start || '';
  const end   = profile.available_time_end   || '';
  if (days.length > 0 && start && end && !start.startsWith('[')) {
    return days.map((day, i) => ({ id: `legacy-${i}`, day, start, end }));
  }
  return [];
}

function timeToMinutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); }
function slotsOverlap(aStart, aEnd, bStart, bEnd) {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(aEnd) > timeToMinutes(bStart);
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const STATUS_AWAITING_PAYMENT = 5;
const STATUS_PAYMENT_EXPIRED = 6;

function lessonColor(lesson) {
  const isGroup = lesson.course_id || (lesson.title || '').toLowerCase().includes('group');
  const statusNum = parseInt(lesson.status, 10);
  if (!isGroup && statusNum === STATUS_AWAITING_PAYMENT) {
    return { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', dot: '#f59e0b' };
  }
  if (!isGroup && statusNum === STATUS_PAYMENT_EXPIRED) {
    return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', dot: '#ef4444' };
  }
  if (isGroup) return { bg: '#fff7ed', border: '#ff8032', text: '#c05e1a', dot: '#ff8032' };
  return { bg: '#eff3ff', border: '#0d9488', text: '#2d4db8', dot: '#0d9488' };
}

function extractStudentName(lesson) {
  const title = lesson.title || '';
  if (title.startsWith('Lesson with ')) return title.slice('Lesson with '.length);
  if (title.startsWith('Individual lesson with ')) return title.slice('Individual lesson with '.length);
  return title;
}

/* â"€â"€ Mini Calendar â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
function MiniCalendar({ today, selected, onSelect }) {
  const [view, setView] = useState(() => new Date(selected));

  const firstDay  = new Date(view.getFullYear(), view.getMonth(), 1);
  const startMon  = startOfWeek(firstDay);
  const cells     = Array.from({ length: 42 }, (_, i) => addDays(startMon, i));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setView(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="w-6 h-6 rounded hover:bg-[#f0f0f5] flex items-center justify-center text-[#6b6f7d]">"¹</button>
        <span className="text-[13px] font-bold text-[#0c0d12]">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </span>
        <button onClick={() => setView(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="w-6 h-6 rounded hover:bg-[#f0f0f5] flex items-center justify-center text-[#6b6f7d]">"º</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#6b6f7d] py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, i) => {
          const isToday   = sameDay(cell, today);
          const isSel     = sameDay(cell, selected);
          const isMonth   = cell.getMonth() === view.getMonth();
          return (
            <button
              key={i}
              onClick={() => onSelect(cell)}
              className={`h-6 w-full text-[11px] rounded-full transition-colors
                ${isToday && !isSel ? 'font-bold text-[#0d9488]' : ''}
                ${isSel ? 'bg-[#0d9488] text-white font-bold' : ''}
                ${!isSel && isMonth ? 'hover:bg-[#f0f2ff] text-[#0c0d12]' : ''}
                ${!isMonth ? 'text-[#c8ccdd]' : ''}
              `}
            >
              {cell.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* â"€â"€ Attendance status pill â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
const ATT_OPTS = [
  { v: 'present', label: 'Present', color: '#22c55e' },
  { v: 'absent',  label: 'Absent',  color: '#ef4444' },
  { v: 'excused', label: 'Excused', color: '#ffa61a' },
];

/* â"€â"€ Combined Lesson Detail Modal â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
function LessonDetailModal({ lesson, onSave, onClose }) {
  const navigate = useNavigate();
  const [tab, setTab]       = useState('link'); // 'link' | 'attendance'
  const [link, setLink]     = useState(lesson.video_link || '');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Attendance state
  const [attRecords,    setAttRecords]    = useState([]);
  const [attMap,        setAttMap]        = useState({});
  const [savedAttMap,   setSavedAttMap]   = useState({});
  const [loadingAtt,    setLoadingAtt]    = useState(false);
  const [savingAtt,     setSavingAtt]     = useState(false);
  const [attMsg,        setAttMsg]        = useState('');

  const isGroup  = !!lesson.course_id;
  const isPast   = parseTS(lesson.scheduled_at) < new Date();

  // Load attendance records
  useEffect(() => {
    setLoadingAtt(true);
    lessonsAPI.getAttendance(lesson.id)
      .then(data => {
        const records = data?.records || [];
        setAttRecords(records);
        const map = {};
        records.forEach(r => { map[r.student_id] = r.status || (r.attended ? 'present' : 'absent'); });
        setAttMap(map);
        setSavedAttMap({ ...map });
      })
      .catch(() => { setAttRecords([]); })
      .finally(() => setLoadingAtt(false));
  }, [lesson.id]);

  const handleSaveLink = async () => {
    setSaving(true); setError('');
    try {
      await lessonsAPI.setMeetingLink(lesson.id, link);
      onSave(lesson.id, link);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save. Try again.');
    } finally { setSaving(false); }
  };

  const handleSaveAttendance = async () => {
    setSavingAtt(true); setAttMsg('');
    try {
      const records = Object.entries(attMap).map(([student_id, status]) => ({ student_id, status }));
      await lessonsAPI.markAttendance(lesson.id, records);
      setSavedAttMap({ ...attMap });
      setAttMsg('Saved!');
      setTimeout(() => setAttMsg(''), 2500);
    } catch { setAttMsg('Failed to save.'); }
    finally { setSavingAtt(false); }
  };

  const attIsDirty = JSON.stringify(attMap) !== JSON.stringify(savedAttMap);

  const TABS = [
    { id: 'link',       label: 'Meeting Link' },
    { id: 'attendance', label: 'Attendance' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-start justify-between mb-1">
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-[#0c0d12] truncate">{lesson.title}</p>
              <p className="text-[12px] text-[#6b6f7d]">
                {lesson._startTime ? `${lesson._startTime} - ${lesson._endTime}` : ''}
              </p>
            </div>
            <button onClick={onClose} className="text-[#6b6f7d] hover:text-[#0c0d12] ml-3 flex-shrink-0">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          {/* Tab bar */}
          <div className="flex gap-1 mt-3 border-b border-[#f0f0f5]">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-[12px] font-semibold border-b-2 transition-colors -mb-px ${
                  tab === t.id
                    ? 'border-[#0d9488] text-[#0d9488]'
                    : 'border-transparent text-[#6b6f7d] hover:text-[#0c0d12]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Meeting Link */}
        {tab === 'link' && (
          <div className="px-6 pb-5 pt-3">
            <label className="block text-[12px] font-semibold text-[#383a44] mb-1.5">
              Zoom / Google Meet / Teams link
            </label>
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://zoom.us/j/... or meet.google.com/..."
              className="w-full border border-[#d2d4d9] rounded-[10px] px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#0d9488] mb-3"
            />
            {error && <p className="text-[12px] text-[#f24545] mb-3">{error}</p>}
            {link && (
              <a href={link} target="_blank" rel="noreferrer"
                className="block text-center text-[12px] font-semibold text-[#22be70] border border-[#22be70]/30 rounded-[8px] py-2 mb-3 hover:bg-[#22be70]/5 transition-colors">
                Open link →
              </a>
            )}
            <div className="flex gap-2">
              <button onClick={handleSaveLink} disabled={saving}
                className="flex-1 bg-[#0d9488] text-white text-[13px] font-bold py-2.5 rounded-[10px] hover:opacity-90 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save link'}
              </button>
              <button onClick={onClose}
                className="px-4 border border-[#d2d4d9] text-[#383a44] text-[13px] rounded-[10px] hover:border-[#0d9488]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tab: Attendance */}
        {tab === 'attendance' && (
          <div className="px-6 pb-5 pt-3">
            {isGroup ? (
              <div className="text-center py-6">
                <p className="text-[13px] text-[#383a44] mb-3">
                  This is a group lesson. Manage attendance from the course attendance page.
                </p>
                <button
                  onClick={() => { onClose(); navigate(`/tutor/courses/${lesson.course_id}/attendance`); }}
                  className="bg-[#0d9488] text-white text-[12px] font-bold px-5 py-2.5 rounded-[9px] hover:opacity-90"
                >
                  Open Attendance Page
                </button>
              </div>
            ) : loadingAtt ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-3 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : attRecords.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-2">
                  <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-6 h-6"><rect x="4" y="2" width="12" height="16" rx="1.5"/><path d="M7 2h6v3H7z"/><path d="M7 9h6M7 12h6M7 15h4" strokeLinecap="round"/></svg>
                </div>
                <p className="text-[13px] font-semibold text-[#0c0d12] mb-1">No attendance records</p>
                <p className="text-[12px] text-[#6b6f7d]">
                  Attendance is recorded when a student books this lesson.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {attRecords.map(rec => {
                    const status = attMap[rec.student_id] || 'absent';
                    return (
                      <div key={rec.student_id} className="flex items-center justify-between gap-3">
                        <span className="text-[13px] font-medium text-[#0c0d12] truncate flex-1">
                          {rec.student_name || rec.student_id}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {ATT_OPTS.map(opt => (
                            <button key={opt.v}
                              onClick={() => setAttMap(prev => ({ ...prev, [rec.student_id]: opt.v }))}
                              className="px-2.5 py-1 rounded-full text-[11px] font-bold transition-all"
                              style={status === opt.v
                                ? { backgroundColor: opt.color, color: '#fff' }
                                : { backgroundColor: opt.color + '18', color: opt.color, opacity: 0.7 }
                              }
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[#f0f0f5]">
                  {attMsg && (
                    <span className={`text-[12px] font-semibold ${attMsg === 'Saved!' ? 'text-[#22be70]' : 'text-[#f24545]'}`}>
                      {attMsg}
                    </span>
                  )}
                  <button onClick={handleSaveAttendance} disabled={savingAtt || !attIsDirty}
                    className="ml-auto bg-[#0d9488] text-white text-[12px] font-bold px-4 py-2 rounded-[9px] hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
                    {savingAtt ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                    Save attendance
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* â"€â"€ Add Slot Modal â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
function AddSlotModal({ existingSlots, profile, userId, onSave, onClose }) {
  const [day,       setDay]       = useState(DAY_FULL[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime,   setEndTime]   = useState('10:00');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const daySlots = existingSlots.filter(s => s.day === day);

  const handleSave = async () => {
    if (startTime >= endTime) { setError('End time must be after start time.'); return; }
    const conflict = daySlots.some(s => slotsOverlap(startTime, endTime, s.start, s.end));
    if (conflict) { setError('This time slot overlaps with an existing availability.'); return; }
    setSaving(true); setError('');
    try {
      const newSlot = { id: String(Date.now()), day, start: startTime, end: endTime };
      const updated = [...existingSlots, newSlot];
      const uniqueDays = [...new Set(updated.map(s => s.day))];
      await usersAPI.updateTutorProfile(userId, {
        bio:                  profile?.bio                  || '',
        age:                  profile?.age                  || 0,
        location:             profile?.location             || '',
        photo_url:            profile?.photo_url            || '',
        subjects:             profile?.subjects             || [],
        experience_years:     profile?.experience_years     || 0,
        certificates:         profile?.certificates         || [],
        phone:                profile?.phone                || '',
        teaching_language:    profile?.teaching_language    || '',
        student_level:        profile?.student_level        || '',
        lesson_type:          profile?.lesson_type          || '',
        hourly_price:         profile?.hourly_price         || 0,
        education:            profile?.education            || '',
        available_days:       uniqueDays,
        available_time_start: JSON.stringify(updated),
        available_time_end:   '',
        timezone:             profile?.timezone             || '',
        keep_status:          true,
      });
      onSave(updated);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[440px] mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] font-bold text-[#0c0d12]">Add Availability Slot</h3>
          <button onClick={onClose} className="text-[#6b6f7d] hover:text-[#0c0d12]">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Day picker */}
        <div className="mb-4">
          <p className="text-[12px] font-semibold text-[#383a44] mb-2">Day</p>
          <div className="flex flex-wrap gap-2">
            {DAY_FULL.map(d => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border transition-colors ${
                  day === d
                    ? 'bg-[#22be70] text-white border-[#22be70]'
                    : 'bg-white text-[#383a44] border-[#d2d4d9] hover:border-[#22be70]'
                }`}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Existing slots for selected day */}
        {daySlots.length > 0 && (
          <div className="mb-4 bg-[#f5f6fa] rounded-[10px] p-3">
            <p className="text-[11px] font-semibold text-[#6b6f7d] uppercase tracking-wide mb-2">Existing slots on {day}</p>
            <div className="flex flex-wrap gap-2">
              {daySlots.map(s => (
                <span key={s.id} className="text-[11px] bg-[#22be70]/15 text-[#22be70] font-semibold px-2 py-0.5 rounded-full">
                  {s.start} - {s.end}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Time range */}
        <div className="mb-5">
          <p className="text-[12px] font-semibold text-[#383a44] mb-2">Time range</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-[11px] text-[#6b6f7d] mb-1">From</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full border border-[#d2d4d9] rounded-[10px] px-3 py-2 text-[13px] focus:outline-none focus:border-[#22be70]" />
            </div>
            <div className="text-[#6b6f7d] text-[14px] mt-4">""</div>
            <div className="flex-1">
              <label className="block text-[11px] text-[#6b6f7d] mb-1">To</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full border border-[#d2d4d9] rounded-[10px] px-3 py-2 text-[13px] focus:outline-none focus:border-[#22be70]" />
            </div>
          </div>
        </div>

        {error && <p className="text-[12px] text-[#f24545] mb-3">{error}</p>}

        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-[#22be70] text-white text-[13px] font-bold py-2.5 rounded-[10px] hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving…' : 'Add Slot'}
          </button>
          <button onClick={onClose} className="px-4 border border-[#d2d4d9] text-[#383a44] text-[13px] rounded-[10px] hover:border-[#0d9488]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* â"€â"€ Lesson Card (inside calendar cell) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
function LessonCard({ lesson, onClick }) {
  const c         = lessonColor(lesson);
  const start     = parseTS(lesson.scheduled_at);
  if (!start) return null;
  const end       = new Date(start.getTime() + (lesson.duration_minutes || 60) * 60000);
  const top       = ((start.getHours() - 7) + start.getMinutes() / 60) * 64;
  const height    = Math.max((lesson.duration_minutes || 60) / 60 * 64, 32);
  const isGroup   = lesson.course_id || (lesson.title || '').toLowerCase().includes('group');
  const typeLabel = isGroup ? 'Group' : 'Individual';
  const name      = extractStudentName(lesson);
  const statusNum = parseInt(lesson.status, 10);

  let statusBadge = null;
  if (!isGroup) {
    if (statusNum === STATUS_AWAITING_PAYMENT) {
      statusBadge = <span className="text-[9px] font-bold" style={{ color: '#f59e0b' }}>Awaiting payment</span>;
    } else if (statusNum === STATUS_PAYMENT_EXPIRED) {
      statusBadge = <span className="text-[9px] font-bold" style={{ color: '#ef4444' }}>Payment expired</span>;
    } else if (lesson.video_link) {
      statusBadge = <span className="text-[9px] text-[#22be70] font-semibold">Link set</span>;
    } else {
      statusBadge = <span className="text-[9px] text-[#f24545] font-semibold">No link</span>;
    }
  } else if (lesson.video_link) {
    statusBadge = <span className="text-[9px] text-[#22be70] font-semibold">Link set</span>;
  } else {
    statusBadge = <span className="text-[9px] text-[#f24545] font-semibold">No link</span>;
  }

  return (
    <div
      onClick={() => onClick(lesson)}
      className="absolute left-1 right-1 rounded-[8px] px-2 py-1 cursor-pointer border overflow-hidden hover:shadow-md transition-shadow z-10"
      style={{ top, height, backgroundColor: c.bg, borderColor: c.border }}
    >
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span className="text-[10px] font-bold truncate" style={{ color: c.text }}>
          {fmtTime(start)} - {fmtTime(end)}
        </span>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 leading-none"
          style={{ backgroundColor: c.border + '25', color: c.text }}
        >
          {typeLabel}
        </span>
      </div>
      <p className="text-[11px] font-bold truncate" style={{ color: c.text }}>{name}</p>
      {statusBadge}
    </div>
  );
}

/* â"€â"€ Availability Block â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
function AvailBlock({ slot, startH, endH, onDelete }) {
  const top    = (startH - 7) * 64;
  const height = Math.max((endH - startH) * 64, 24);
  return (
    <div
      className="absolute left-1 right-1 rounded-[8px] group"
      style={{ top, height, backgroundColor: 'rgba(34,190,112,0.10)', border: '1px solid rgba(34,190,112,0.3)' }}
    >
      <div className="flex items-start justify-between px-2 pt-1">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-[#22be70]">Available</p>
          <p className="text-[9px] text-[#22be70]/70">{slot.start} - {slot.end}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(slot.id); }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-4 h-4 rounded-full bg-[#f24545] text-white text-[10px] leading-none flex items-center justify-center hover:bg-[#d93535] transition-all mt-0.5"
          title="Remove slot"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* â"€â"€ Main Component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
const TutorSchedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today    = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const [weekStart, setWeekStart]     = useState(() => startOfWeek(new Date()));
  const [lessons, setLessons]         = useState([]);
  const [profile, setProfile]         = useState(null);
  const [availSlots, setAvailSlots]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [scheduleError, setScheduleError] = useState(false);
  const [modalLesson, setModalLesson] = useState(null);
  const [showAvail, setShowAvail]     = useState(false);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const from = useMemo(() => weekStart.toISOString(), [weekStart]);
  const to   = useMemo(() => {
    const end = addDays(weekStart, 6);
    end.setHours(23, 59, 59, 999);
    return end.toISOString();
  }, [weekStart]);

  const load = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    setScheduleError(false);
    try {
      const [schedResult, prof] = await Promise.all([
        lessonsAPI.getSchedule(from, to).catch((e) => { console.error('schedule API error:', e); return null; }),
        usersAPI.getTutorProfile(user.user_id).catch(() => null),
      ]);
      if (schedResult === null) {
        setScheduleError(true);
        setLessons([]);
      } else {
        setLessons(schedResult?.lessons || []);
      }
      setProfile(prof);
      setAvailSlots(parseProfileSlots(prof));
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, from, to]);

  useEffect(() => { load(); }, [load]);

  /* Group availability slots by day name */
  const availMap = useMemo(() => {
    const map = {};
    availSlots.forEach(slot => {
      if (!map[slot.day]) map[slot.day] = [];
      map[slot.day].push(slot);
    });
    return map;
  }, [availSlots]);

  /* Save slot array to backend */
  const saveSlots = useCallback(async (slots) => {
    if (!user?.user_id || !profile) return;
    const uniqueDays = [...new Set(slots.map(s => s.day))];
    await usersAPI.updateTutorProfile(user.user_id, {
      bio:                  profile.bio                  || '',
      age:                  profile.age                  || 0,
      location:             profile.location             || '',
      photo_url:            profile.photo_url            || '',
      subjects:             profile.subjects             || [],
      experience_years:     profile.experience_years     || 0,
      certificates:         profile.certificates         || [],
      phone:                profile.phone                || '',
      teaching_language:    profile.teaching_language    || '',
      student_level:        profile.student_level        || '',
      lesson_type:          profile.lesson_type          || '',
      hourly_price:         profile.hourly_price         || 0,
      education:            profile.education            || '',
      available_days:       uniqueDays,
      available_time_start: JSON.stringify(slots),
      available_time_end:   '',
      timezone:             profile.timezone             || '',
      keep_status:          true,
    });
  }, [user?.user_id, profile]);

  /* Delete a single slot by id, then persist */
  const handleDeleteSlot = useCallback(async (slotId) => {
    const prev    = availSlots;
    const updated = availSlots.filter(s => s.id !== slotId);
    setAvailSlots(updated);
    try { await saveSlots(updated); } catch { setAvailSlots(prev); }
  }, [availSlots, saveSlots]);

  /* Upcoming lessons (future, sorted) */
  const upcoming = useMemo(() => {
    const now = new Date();
    return lessons
      .filter(l => {
        const s = parseTS(l.scheduled_at);
        return s && s > now;
      })
      .sort((a, b) => parseTS(a.scheduled_at) - parseTS(b.scheduled_at))
      .slice(0, 5);
  }, [lessons]);

  /* Get lessons for a specific day */
  const lessonsForDay = useCallback((day) => {
    return lessons.filter(l => {
      const s = parseTS(l.scheduled_at);
      return s && sameDay(s, day);
    });
  }, [lessons]);

  /* Update video link in local state after modal save */
  const handleLinkSaved = (lessonId, link) => {
    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, video_link: link } : l));
  };

  /* Called by AddSlotModal after a new slot is saved */
  const handleSlotAdded = useCallback((updatedSlots) => {
    setAvailSlots(updatedSlots);
  }, []);

  const openModal = (lesson) => {
    const start = parseTS(lesson.scheduled_at);
    const end   = start ? new Date(start.getTime() + (lesson.duration_minutes || 60) * 60000) : null;
    setModalLesson({
      ...lesson,
      _startTime: start ? fmtTime(start) : '',
      _endTime:   end   ? fmtTime(end)   : '',
    });
  };

  const monthLabel = `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`;
  const weekLabel  = weekDays[0].getMonth() === weekDays[6].getMonth()
    ? `${weekDays[0].getDate()} - ${weekDays[6].getDate()} ${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`
    : `${weekDays[0].getDate()} ${MONTHS[weekDays[0].getMonth()]} - ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()]} ${weekDays[0].getFullYear()}`;

  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const nowTop = (nowH - 7) * 64;

  return (
    <div className="flex h-screen bg-[#f5f6fa] font-sans">
      <TutorSidebar />

      {modalLesson && (
        <LessonDetailModal
          lesson={modalLesson}
          onSave={handleLinkSaved}
          onClose={() => setModalLesson(null)}
        />
      )}

      {showAvail && (
        <AddSlotModal
          existingSlots={availSlots}
          profile={profile}
          userId={user?.user_id}
          onSave={handleSlotAdded}
          onClose={() => setShowAvail(false)}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-[#ebebf0] px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-[22px] font-bold text-[#0c0d12] leading-none">Schedule</h1>
            <p className="text-[#6b6f7d] text-[13px] mt-1">Manage your availability and lessons.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAvail(true)}
              className="flex items-center gap-2 border border-[#d2d4d9] text-[#383a44] text-[12px] font-semibold px-3 py-2 rounded-[8px] hover:border-[#22be70] hover:text-[#22be70] transition-colors"
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M7 2v10M2 7h10" strokeLinecap="round"/>
              </svg>
              Add availability
            </button>
            <TopBarActions />
            <div className="w-9 h-9 rounded-full bg-[rgba(13,148,136,0.12)] flex items-center justify-center">
              <span className="text-[#0d9488] text-[12px] font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Calendar area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Week nav */}
            <div className="bg-white border-b border-[#ebebf0] px-6 py-3 flex items-center gap-4 flex-shrink-0">
              <button
                onClick={() => setWeekStart(new Date(today))}
                className="text-[12px] font-semibold text-[#0d9488] border border-[#0d9488]/30 px-3 py-1.5 rounded-[7px] hover:bg-[#0d9488]/5"
              >
                Today
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWeekStart(d => addDays(d, -7))}
                  className="w-7 h-7 rounded-[6px] hover:bg-[#f0f0f5] flex items-center justify-center text-[#6b6f7d]"
                >
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                    <path d="M8 2L4 6l4 4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => setWeekStart(d => addDays(d, 7))}
                  className="w-7 h-7 rounded-[6px] hover:bg-[#f0f0f5] flex items-center justify-center text-[#6b6f7d]"
                >
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                    <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <span className="text-[14px] font-bold text-[#0c0d12]">{weekLabel}</span>
            </div>

            {/* Day headers */}
            <div className="bg-white border-b border-[#ebebf0] flex-shrink-0">
              <div className="flex">
                <div className="w-14 flex-shrink-0" />
                {weekDays.map((day, i) => {
                  const isToday = sameDay(day, today);
                  return (
                    <div key={i} className="flex-1 py-2.5 text-center border-l border-[#f0f0f5] first:border-l-0">
                      <p className={`text-[11px] font-semibold ${isToday ? 'text-[#0d9488]' : 'text-[#6b6f7d]'}`}>
                        {DAY_NAMES[i]}
                      </p>
                      <div className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center text-[14px] font-bold ${
                        isToday ? 'bg-[#0d9488] text-white' : 'text-[#0c0d12]'
                      }`}>
                        {day.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid scroll area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {scheduleError && (
                <div className="mx-6 mt-4 bg-[rgba(242,69,69,0.08)] border border-[#f24545]/20 text-[#f24545] rounded-[10px] px-4 py-3 text-[13px] flex items-center gap-2">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
                    <circle cx="8" cy="8" r="6.5"/><path d="M8 5v3M8 11v.5" strokeLinecap="round"/>
                  </svg>
                  Could not load schedule - check that the lesson service is running.
                  <button onClick={load} className="ml-auto text-[12px] font-semibold underline hover:no-underline">Retry</button>
                </div>
              )}
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-7 h-7 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex relative" style={{ minHeight: `${HOURS.length * 64}px` }}>
                  {/* Time column */}
                  <div className="w-14 flex-shrink-0 relative">
                    {HOURS.map(h => (
                      <div key={h} className="absolute w-full flex justify-end pr-2" style={{ top: (h - 7) * 64 - 8 }}>
                        <span className="text-[10px] text-[#6b6f7d]">{String(h).padStart(2,'0')}:00</span>
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day, dayIdx) => {
                    const dayFull    = DAY_FULL[dayIdx];
                    const dayLessons = lessonsForDay(day);
                    const isToday   = sameDay(day, today);

                    return (
                      <div
                        key={dayIdx}
                        className="flex-1 relative border-l border-[#f0f0f5] first:border-l-0"
                        style={{ minHeight: `${HOURS.length * 64}px` }}
                      >
                        {/* Hour lines */}
                        {HOURS.map(h => (
                          <div
                            key={h}
                            className="absolute w-full border-t border-[#f0f0f5]"
                            style={{ top: (h - 7) * 64 }}
                          />
                        ))}

                        {/* Today line */}
                        {isToday && nowTop >= 0 && nowTop <= HOURS.length * 64 && (
                          <div
                            className="absolute left-0 right-0 z-20 flex items-center"
                            style={{ top: nowTop }}
                          >
                            <div className="w-2 h-2 rounded-full bg-[#0d9488] -ml-1 flex-shrink-0" />
                            <div className="flex-1 h-px bg-[#0d9488]" />
                          </div>
                        )}

                        {/* Availability blocks (one per slot) */}
                        {(availMap[dayFull] || []).map(slot => {
                          const startH = parseInt(slot.start.split(':')[0], 10);
                          const endH   = parseInt(slot.end.split(':')[0],   10);
                          return (
                            <AvailBlock
                              key={slot.id}
                              slot={slot}
                              startH={startH}
                              endH={endH}
                              onDelete={handleDeleteSlot}
                            />
                          );
                        })}

                        {/* Lesson cards */}
                        {dayLessons.map(lesson => (
                          <LessonCard
                            key={lesson.id}
                            lesson={lesson}
                            onClick={openModal}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="bg-white border-t border-[#ebebf0] px-6 py-3 flex items-center gap-6 flex-shrink-0">
              {[
                { dot: '#0d9488', label: 'Individual lesson' },
                { dot: '#f59e0b', label: 'Awaiting payment' },
                { dot: '#ff8032', label: 'Group lesson' },
                { dot: '#22c55e', label: 'Available' },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
                  <span className="text-[11px] text-[#6b6f7d]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-[260px] flex-shrink-0 border-l border-[#ebebf0] bg-white flex flex-col overflow-y-auto">
            {/* Mini Calendar */}
            <div className="p-5 border-b border-[#ebebf0]">
              <MiniCalendar
                today={today}
                selected={weekStart}
                onSelect={(d) => setWeekStart(startOfWeek(d))}
              />
            </div>

            {/* Upcoming meetings */}
            <div className="p-5 flex-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-[#0c0d12]">Upcoming Lessons</p>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-[12px] text-[#6b6f7d]">No upcoming lessons this week.</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(lesson => {
                    const start = parseTS(lesson.scheduled_at);
                    const end   = start ? new Date(start.getTime() + (lesson.duration_minutes || 60) * 60000) : null;
                    const c     = lessonColor(lesson);
                    const isToday2 = start && sameDay(start, today);
                    return (
                      <div key={lesson.id} className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.bg }}>
                          <span className="text-[11px] font-bold" style={{ color: c.text }}>
                            {(lesson.title || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-[#0c0d12] truncate">{lesson.title}</p>
                          <p className="text-[11px] text-[#6b6f7d]">
                            {isToday2 ? 'Today' : start ? `${DAY_NAMES[(start.getDay() + 6) % 7]}, ${start.getDate()} ${MONTHS[start.getMonth()].slice(0,3)}` : ''}
                            {start && end ? `, ${fmtTime(start)} - ${fmtTime(end)}` : ''}
                          </p>
                        </div>
                        {(() => {
                          const sn = parseInt(lesson.status, 10);
                          if (sn === STATUS_AWAITING_PAYMENT) {
                            return (
                              <span className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-[6px] bg-[#fef3c7] text-[#92400e]">
                                Unpaid
                              </span>
                            );
                          }
                          if (sn === STATUS_PAYMENT_EXPIRED) {
                            return (
                              <span className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-[6px] bg-[#fee2e2] text-[#991b1b]">
                                Expired
                              </span>
                            );
                          }
                          return (
                            <button
                              onClick={() => openModal(lesson)}
                              className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-[6px] ${
                                lesson.video_link
                                  ? 'bg-[#0d9488] text-white hover:opacity-90'
                                  : 'border border-[#d2d4d9] text-[#383a44] hover:border-[#0d9488] hover:text-[#0d9488]'
                              }`}
                            >
                              {lesson.video_link ? 'Join' : 'Link'}
                            </button>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Marketplace visibility card */}
            <div className="px-5 pt-4 border-t border-[#ebebf0]">
              <div className={`rounded-[10px] px-3 py-2.5 flex items-center gap-2.5 mb-4 ${
                availSlots.length > 0
                  ? 'bg-[#f0fdf4] border border-[#bbf7d0]'
                  : 'bg-[#fff8f0] border border-[#ff8032]/30'
              }`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${availSlots.length > 0 ? 'bg-[#22c55e]' : 'bg-[#ff8032]'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-bold ${availSlots.length > 0 ? 'text-[#15803d]' : 'text-[#c05e1a]'}`}>
                    {availSlots.length > 0 ? 'Visible in Marketplace' : 'Not visible in Marketplace'}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${availSlots.length > 0 ? 'text-[#15803d]/70' : 'text-[#c05e1a]/80'}`}>
                    {availSlots.length > 0
                      ? 'Students can find and book you.'
                      : 'Add availability to appear in search results.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Availability slots summary */}
            <div className="px-5 pb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-[#6b6f7d] uppercase tracking-wider">Availability</p>
                <button onClick={() => setShowAvail(true)} className="text-[11px] text-[#22be70] font-semibold hover:underline">
                  + Add slot
                </button>
              </div>
              {availSlots.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-[#d2d4d9] p-4 text-center">
                  <svg viewBox="0 0 20 20" fill="none" stroke="#b0b3bc" strokeWidth="1.4" width={28} height={28} className="mx-auto mb-2">
                    <rect x="2" y="3" width="16" height="14" rx="2"/>
                    <path d="M6 2v3M14 2v3M2 8h16" strokeLinecap="round"/>
                  </svg>
                  <p className="text-[12px] font-semibold text-[#383a44] mb-1">No availability configured</p>
                  <p className="text-[11px] text-[#6b6f7d] mb-3 leading-snug">
                    Set your teaching hours so students can book lessons with you.
                  </p>
                  <button
                    onClick={() => setShowAvail(true)}
                    className="text-[11px] font-bold text-white bg-[#0d9488] px-3 py-1.5 rounded-[7px] hover:opacity-90"
                  >
                    Add Availability
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {availSlots.map(slot => (
                    <div key={slot.id} className="flex items-center justify-between group">
                      <div>
                        <span className="text-[11px] font-semibold text-[#0c0d12]">{slot.day.slice(0, 3)}</span>
                        <span className="text-[11px] text-[#383a44] ml-1.5">{slot.start} - {slot.end}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded-full bg-[#f24545]/10 text-[#f24545] text-[10px] flex items-center justify-center hover:bg-[#f24545] hover:text-white transition-all flex-shrink-0"
                        title="Remove slot"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default TutorSchedule;
