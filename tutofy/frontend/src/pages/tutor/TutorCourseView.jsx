import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { lessonsAPI } from '../../api/lessons';
import { assignmentsAPI } from '../../api/assignments';
import { coursesAPI } from '../../api/courses';
import { enrollmentsAPI } from '../../api/enrollments';
import { quizzesAPI } from '../../api/quizzes';

// ── date helpers ──────────────────────────────────────────────────────────────

function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'object' && val.seconds != null) return new Date(Number(val.seconds) * 1000);
  const d = new Date(String(val).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(val) {
  const d = parseDate(val);
  if (!d) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toInputDate(val) {
  const d = parseDate(val);
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

function getMonday(d) {
  const copy = new Date(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1));
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function groupIntoWeeks(items) {
  const withDate = items.filter(i => i._date);
  const noDate   = items.filter(i => !i._date);
  const result   = [];

  if (noDate.length) result.push({ label: 'General', dateRange: '', weekMonday: null, items: noDate });
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
    result.push({ label: `Week ${n++}`, dateRange: `${fmt(ws)} – ${fmt(we)}`, weekMonday: ws, items: weekMap.get(key) });
  });
  return result;
}

// ── icons ─────────────────────────────────────────────────────────────────────

const VideoIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="#4c6eff" strokeWidth="1.5">
    <path d="M3 6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"/>
    <path d="M15 9l4-2v6l-4-2" stroke="#4c6eff" strokeWidth="1.5"/>
  </svg>
);

const DocIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="#ffa61a" strokeWidth="1.5">
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

const CalendarIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
    <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 2v2M11 2v2M2 7h12"/>
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
    <path d="M8 3v10M3 8h10"/>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
    <path d="M3 5h10M6 5V3h4v2M6 8v5M10 8v5M4 5l1 8h6l1-8"/>
  </svg>
);

const PencilIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
    <path d="M11 2l3 3-9 9H2v-3l9-9z"/>
  </svg>
);

const QuizIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="#935bf5" strokeWidth="1.5">
    <path d="M10 18a8 8 0 100-16 8 8 0 000 16z"/>
    <path d="M7.5 8a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5" strokeLinecap="round"/>
    <circle cx="10" cy="14" r="0.5" fill="#935bf5"/>
  </svg>
);

// ── Add content modal ─────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  {
    id: 'lesson',    label: 'Live lesson',      sub: 'Zoom / Meet / Teams link',
    color: '#4c6eff', icon: 'M3 7a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM15 10l4-2v6l-4-2',
  },
  {
    id: 'video',     label: 'Recorded video',   sub: 'YouTube / Vimeo link',
    color: '#f24545', icon: 'M5 5l10 7-10 7V5z',
  },
  {
    id: 'homework',  label: 'Homework',         sub: 'File or text submission',
    color: '#22be70', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    id: 'quiz',      label: 'Quiz',             sub: 'Create a quiz',
    color: '#4c6eff', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    id: 'text',      label: 'Text / note',      sub: 'Reading material',
    color: '#ffa61a', icon: 'M4 6h16M4 10h16M4 14h10',
  },
  {
    id: 'file',      label: 'File',             sub: 'Upload a file',
    color: '#935bf5', icon: 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
];

const AddContentModal = ({ onClose, onSelect }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]" onClick={onClose}>
    <div
      className="bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] w-[520px] p-7"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[#181b26] text-[18px] font-bold">Add content</h3>
          <p className="text-[#8a90a1] text-[13px] mt-0.5">Choose what to add</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#f0f0f5] flex items-center justify-center text-[#8a90a1] hover:text-[#181b26] transition-colors">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
            <path d="M2 2l10 10M12 2L2 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {CONTENT_TYPES.map((ct) => (
          <button
            key={ct.id}
            onClick={() => onSelect(ct.id)}
            className="flex flex-col items-center gap-2.5 p-4 rounded-[14px] border-2 border-[#ebebf0] hover:border-[#4c6eff]/50 hover:bg-[#f8f9ff] transition-colors group"
          >
            <div
              className="w-12 h-12 rounded-[12px] flex items-center justify-center"
              style={{ background: ct.color + '18' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke={ct.color} strokeWidth="1.5" className="w-6 h-6">
                <path d={ct.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[#181b26] text-[13px] font-semibold leading-tight">{ct.label}</p>
              <p className="text-[#8a90a1] text-[11px] mt-0.5 leading-tight">{ct.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ── simple markdown renderer (no deps) ───────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  // 1. HTML-escape to prevent XSS
  let s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Block-level: headings, lists → collect list items into <ul>/<ol>
  const lines = s.split('\n');
  const out = [];
  let inUl = false, inOl = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    const ul = line.match(/^[•\-\*] (.+)/);
    const ol = line.match(/^\d+\. (.+)/);

    if (h3) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (inOl) { out.push('</ol>'); inOl = false; }
      out.push(`<h3>${h3[1]}</h3>`);
    } else if (h2) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (inOl) { out.push('</ol>'); inOl = false; }
      out.push(`<h2>${h2[1]}</h2>`);
    } else if (h1) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (inOl) { out.push('</ol>'); inOl = false; }
      out.push(`<h1>${h1[1]}</h1>`);
    } else if (ul) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push(`<li>${ul[1]}</li>`);
    } else if (ol) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol>'); inOl = true; }
      out.push(`<li>${ol[1]}</li>`);
    } else {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (inOl) { out.push('</ol>'); inOl = false; }
      out.push(line === '' ? '<br/>' : `<p>${line}</p>`);
    }
  }
  if (inUl) out.push('</ul>');
  if (inOl) out.push('</ol>');

  // 3. Inline: **bold**, *italic*, `code`
  let html = out.join('');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  return html;
}

function toRFC3339(val) {
  if (!val) return undefined;
  // datetime-local gives YYYY-MM-DDTHH:MM — treat as local time, convert to UTC ISO
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString();
  return val + 'T00:00:00Z';
}

// ── blank drafts ──────────────────────────────────────────────────────────────

const blankLesson = { title: '', description: '', video_link: '', scheduled_at: '', duration_minutes: '' };
const blankAssignment = { title: '', description: '', due_date: '', max_score: '' };
const blankNote = { title: '', description: '' };

// ── shared input style ────────────────────────────────────────────────────────

const inputCls = 'w-full border border-[#e8eaef] rounded-[9px] px-3 py-2 text-[13px] text-[#181b26] placeholder-[#b0b5c4] focus:outline-none focus:border-[#4c6eff] focus:ring-2 focus:ring-[rgba(76,110,255,0.08)] transition-all bg-white';

// ── forms (defined outside parent so they don't remount on every keystroke) ───

const LessonForm = ({ draft, setDraft, saveError, saving, onSave, onCancel }) => (
  <div className="bg-[#f8f9fc] border-t border-[#f0f0f5] px-5 py-4">
    <p className="text-[#181b26] text-[13px] font-semibold mb-3">New Lesson</p>
    <div className="grid grid-cols-2 gap-3 mb-3">
      <div>
        <label className="block text-[11px] text-[#8a90a1] font-medium mb-1">Title <span className="text-[#f24545]">*</span></label>
        <input className={inputCls} placeholder="Lesson title" value={draft.title}
          onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} />
      </div>
      <div>
        <label className="block text-[11px] text-[#8a90a1] font-medium mb-1">Meeting / Video link</label>
        <input className={inputCls} placeholder="https://meet.google.com/..." value={draft.video_link}
          onChange={e => setDraft(p => ({ ...p, video_link: e.target.value }))} />
      </div>
      <div>
        <label className="block text-[11px] text-[#8a90a1] font-medium mb-1">Date &amp; Time</label>
        <input type="datetime-local" className={inputCls} value={draft.scheduled_at}
          onChange={e => setDraft(p => ({ ...p, scheduled_at: e.target.value }))} />
      </div>
      <div>
        <label className="block text-[11px] text-[#8a90a1] font-medium mb-1">Duration (min)</label>
        <input type="number" className={inputCls} placeholder="60" min="1" value={draft.duration_minutes}
          onChange={e => setDraft(p => ({ ...p, duration_minutes: e.target.value }))} />
      </div>
    </div>
    <div className="mb-3">
      <label className="block text-[11px] text-[#8a90a1] font-medium mb-1">Description</label>
      <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Optional description"
        value={draft.description}
        onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} />
    </div>
    {saveError && <p className="text-[#f24545] text-[12px] mb-2">{saveError}</p>}
    <div className="flex items-center gap-2">
      <button onClick={onSave} disabled={saving}
        className="bg-[#4c6eff] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:bg-[#3a56e0] disabled:opacity-50 transition-colors flex items-center gap-1.5">
        {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
        Save lesson
      </button>
      <button onClick={onCancel} className="text-[#8a90a1] text-[12px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#f0f0f5] transition-colors">
        Cancel
      </button>
    </div>
  </div>
);

const AssignmentForm = ({ draft, setDraft, editingId, saveError, saving, onSave, onCancel }) => (
  <div className="bg-[#f8f9fc] border-t border-[#f0f0f5] px-5 py-4">
    <p className="text-[#181b26] text-[13px] font-semibold mb-3">
      {editingId ? 'Edit Assignment' : 'New Assignment'}
    </p>
    <div className="grid grid-cols-2 gap-3 mb-3">
      <div>
        <label className="block text-[11px] text-[#8a90a1] font-medium mb-1">Title <span className="text-[#f24545]">*</span></label>
        <input className={inputCls} placeholder="Assignment title" value={draft.title}
          onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} />
      </div>
      <div>
        <label className="block text-[11px] text-[#8a90a1] font-medium mb-1">Max score</label>
        <input type="number" className={inputCls} placeholder="100" min="0" value={draft.max_score}
          onChange={e => setDraft(p => ({ ...p, max_score: e.target.value }))} />
      </div>
      <div>
        <label className="block text-[11px] text-[#8a90a1] font-medium mb-1">Due date</label>
        <input type="date" className={inputCls} value={draft.due_date}
          onChange={e => setDraft(p => ({ ...p, due_date: e.target.value }))} />
      </div>
    </div>
    <div className="mb-3">
      <label className="block text-[11px] text-[#8a90a1] font-medium mb-1">Description</label>
      <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Instructions for students"
        value={draft.description}
        onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} />
    </div>
    {saveError && <p className="text-[#f24545] text-[12px] mb-2">{saveError}</p>}
    <div className="flex items-center gap-2">
      <button onClick={onSave} disabled={saving}
        className="bg-[#4c6eff] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:bg-[#3a56e0] disabled:opacity-50 transition-colors flex items-center gap-1.5">
        {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
        Save
      </button>
      <button onClick={onCancel} className="text-[#8a90a1] text-[12px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#f0f0f5] transition-colors">
        Cancel
      </button>
    </div>
  </div>
);

const NoteForm = ({ draft, setDraft, saveError, saving, onSave, onCancel }) => (
  <div className="bg-[#f8f9fc] border-t border-[#f0f0f5] px-5 py-4">
    <p className="text-[#181b26] text-[13px] font-semibold mb-3">New Text / Note</p>
    <div className="mb-3">
      <label className="block text-[11px] text-[#8a90a1] font-medium mb-1">Title <span className="text-[#f24545]">*</span></label>
      <input className={inputCls} placeholder="e.g. Required documents, Important requirements…" value={draft.title}
        onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} />
    </div>
    <div className="mb-2">
      <label className="block text-[11px] text-[#8a90a1] font-medium mb-1">Content</label>
      <textarea className={inputCls + ' resize-y'} rows={10}
        placeholder={'Write your text here. Markdown supported:\n\n# Big heading\n## Section heading\n**bold text**\n*italic text*\n- bullet item\n1. numbered item\n`code`'}
        value={draft.description}
        onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} />
    </div>
    <div className="flex flex-wrap gap-2 mb-3 text-[11px] text-[#8a90a1]">
      {[['#', 'H1'], ['##', 'H2'], ['**b**', 'Bold'], ['*i*', 'Italic'], ['- ', 'Bullet'], ['1. ', 'Numbered']].map(([syn, lbl]) => (
        <span key={lbl} className="bg-white border border-[#e8eaef] rounded px-1.5 py-0.5 font-mono">
          {syn} <span className="font-sans text-[#b0b5c4]">→ {lbl}</span>
        </span>
      ))}
    </div>
    {saveError && <p className="text-[#f24545] text-[12px] mb-2">{saveError}</p>}
    <div className="flex items-center gap-2">
      <button onClick={onSave} disabled={saving}
        className="bg-[#ffa61a] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5">
        {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
        Save note
      </button>
      <button onClick={onCancel} className="text-[#8a90a1] text-[12px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#f0f0f5] transition-colors">
        Cancel
      </button>
    </div>
  </div>
);

// ── component ─────────────────────────────────────────────────────────────────

const TutorCourseView = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const { id: courseId } = useParams();

  const [course,      setCourse]      = useState(null);
  const [lessons,     setLessons]     = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes,     setQuizzes]     = useState([]);
  const [enrollCount, setEnrollCount] = useState(0);
  const [loading,     setLoading]     = useState(true);

  // which week section is open
  const [expandedWeeks, setExpandedWeeks] = useState(new Set([0]));

  // inline add form: { weekIdx, type: 'lesson'|'assignment' } | null
  const [addingIn, setAddingIn] = useState(null);

  // inline edit for assignments
  const [editingId, setEditingId]   = useState(null);

  // form drafts
  const [lessonDraft,     setLessonDraft]     = useState(blankLesson);
  const [assignmentDraft, setAssignmentDraft] = useState(blankAssignment);
  const [noteDraft,       setNoteDraft]       = useState(blankNote);

  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');
  const [deleting,   setDeleting]   = useState(null);

  // Add content modal
  const [showContentModal, setShowContentModal] = useState(false);
  const [pendingWeekIdx, setPendingWeekIdx]     = useState(null);

  const handleContentSelect = useCallback((type) => {
    setShowContentModal(false);
    if (type === 'quiz') {
      navigate(`/tutor/courses/${courseId}/quizzes/new`);
    } else if (type === 'lesson' || type === 'video') {
      openAdd(pendingWeekIdx ?? 'new', 'lesson');
    } else if (type === 'homework') {
      openAdd(pendingWeekIdx ?? 'new', 'assignment');
    } else if (type === 'text') {
      openAdd(pendingWeekIdx ?? 'new', 'note');
    }
  }, [pendingWeekIdx, courseId, navigate]);

  useEffect(() => {
    if (!isAuthenticated || role !== 'tutor') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    Promise.all([
      coursesAPI.getCourseById(courseId).catch(() => null),
      lessonsAPI.getCourseLessons(courseId).catch(() => ({})),
      assignmentsAPI.getCourseAssignments(courseId).catch(() => ({})),
      enrollmentsAPI.getCourseEnrollments(courseId).catch(() => []),
      quizzesAPI.getCourseQuizzes(courseId).catch(() => ({})),
    ]).then(([cRes, lRes, aRes, eRes, qRes]) => {
      setCourse(cRes?.course || cRes);
      const ls = lRes?.lessons || lRes || [];
      setLessons(Array.isArray(ls) ? ls : []);
      const as = aRes?.assignments || aRes || [];
      setAssignments(Array.isArray(as) ? as : []);
      const es = Array.isArray(eRes) ? eRes : eRes?.enrollments || [];
      setEnrollCount(es.length);
      const qs = qRes?.quizzes || qRes || [];
      setQuizzes(Array.isArray(qs) ? qs : []);
    }).finally(() => setLoading(false));
  }, [courseId]);

  const allItems = useMemo(() => {
    const items = [
      ...lessons.map(l => ({ ...l, _type: 'lesson',     _date: parseDate(l.scheduled_at) })),
      ...assignments.map(a => ({ ...a, _type: 'assignment', _date: parseDate(a.due_date) })),
      ...quizzes.map(q => ({ ...q, _type: 'quiz', _date: null })),
    ];
    return items.sort((a, b) => {
      if (!a._date && !b._date) return 0;
      if (!a._date) return 1;
      if (!b._date) return -1;
      return a._date - b._date;
    });
  }, [lessons, assignments, quizzes]);

  const weeks = useMemo(() => groupIntoWeeks(allItems), [allItems]);

  const toggleWeek = idx =>
    setExpandedWeeks(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; });

  // ── add handlers ────────────────────────────────────────────────────────────

  const openAdd = (weekIdx, type) => {
    const week = weeks[weekIdx];
    if (type === 'lesson') {
      setLessonDraft({
        ...blankLesson,
        scheduled_at: week?.weekMonday ? toInputDate(week.weekMonday) + 'T09:00' : '',
      });
    } else if (type === 'assignment') {
      setAssignmentDraft({
        ...blankAssignment,
        due_date: week?.weekMonday ? toInputDate(week.weekMonday) : '',
      });
    } else if (type === 'note') {
      setNoteDraft({ ...blankNote });
    }
    setAddingIn({ weekIdx, type });
    setSaveError('');
    setExpandedWeeks(prev => { const s = new Set(prev); s.add(weekIdx); return s; });
  };

  const cancelAdd = () => { setAddingIn(null); setSaveError(''); };

  const saveLesson = async () => {
    if (!lessonDraft.title.trim()) { setSaveError('Title is required'); return; }
    setSaving(true); setSaveError('');
    try {
      const created = await lessonsAPI.createLesson({
        course_id:        courseId,
        title:            lessonDraft.title.trim(),
        description:      lessonDraft.description.trim(),
        video_link:       lessonDraft.video_link.trim(),
        scheduled_at:     toRFC3339(lessonDraft.scheduled_at),
        duration_minutes: lessonDraft.duration_minutes ? parseInt(lessonDraft.duration_minutes) : undefined,
        status:           'published',
      });
      const newLesson = created?.lesson || created;
      if (newLesson?.id) setLessons(prev => [...prev, newLesson]);
      setAddingIn(null);
    } catch (e) {
      setSaveError(e.response?.data?.error || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const saveAssignment = async () => {
    if (!assignmentDraft.title.trim()) { setSaveError('Title is required'); return; }
    setSaving(true); setSaveError('');
    try {
      const created = await assignmentsAPI.createAssignment({
        course_id:   courseId,
        title:       assignmentDraft.title.trim(),
        description: assignmentDraft.description.trim(),
        due_date:    assignmentDraft.due_date || undefined,
        max_score:   assignmentDraft.max_score ? parseFloat(assignmentDraft.max_score) : undefined,
      });
      const newA = created?.assignment || created;
      if (newA?.id) setAssignments(prev => [...prev, newA]);
      setAddingIn(null);
    } catch (e) {
      setSaveError(e.response?.data?.error || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    if (!noteDraft.title.trim()) { setSaveError('Title is required'); return; }
    setSaving(true); setSaveError('');
    try {
      // Notes are stored as lessons: no video_link, no scheduled_at shown to user.
      // Backend requires scheduled_at > 0 and duration_minutes > 0, so we send current time.
      const created = await lessonsAPI.createLesson({
        course_id:        courseId,
        title:            noteDraft.title.trim(),
        description:      noteDraft.description.trim(),
        video_link:       '',
        scheduled_at:     new Date().toISOString(),
        duration_minutes: 1,
        status:           'published',
      });
      const newLesson = created?.lesson || created;
      if (newLesson?.id) setLessons(prev => [...prev, newLesson]);
      setAddingIn(null);
    } catch (e) {
      setSaveError(e.response?.data?.error || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  // ── edit assignment ──────────────────────────────────────────────────────────

  const openEdit = (assignment) => {
    setAssignmentDraft({
      title:       assignment.title || '',
      description: assignment.description || '',
      due_date:    toInputDate(assignment.due_date),
      max_score:   assignment.max_score != null ? String(assignment.max_score) : '',
    });
    setEditingId(assignment.id);
    setSaveError('');
  };

  const cancelEdit = () => { setEditingId(null); setSaveError(''); };

  const saveEdit = async () => {
    if (!assignmentDraft.title.trim()) { setSaveError('Title is required'); return; }
    setSaving(true); setSaveError('');
    try {
      await assignmentsAPI.updateAssignment(editingId, {
        title:       assignmentDraft.title.trim(),
        description: assignmentDraft.description.trim(),
        due_date:    assignmentDraft.due_date || undefined,
        max_score:   assignmentDraft.max_score ? parseFloat(assignmentDraft.max_score) : undefined,
      });
      setAssignments(prev => prev.map(a =>
        a.id === editingId
          ? { ...a,
              title:       assignmentDraft.title.trim(),
              description: assignmentDraft.description.trim(),
              due_date:    assignmentDraft.due_date || a.due_date,
              max_score:   assignmentDraft.max_score ? parseFloat(assignmentDraft.max_score) : a.max_score,
            }
          : a
      ));
      setEditingId(null);
    } catch (e) {
      setSaveError(e.response?.data?.error || 'Failed to update assignment');
    } finally {
      setSaving(false);
    }
  };

  // ── delete ───────────────────────────────────────────────────────────────────

  const deleteLesson = async (id) => {
    if (!window.confirm('Delete this lesson?')) return;
    setDeleting(id);
    try {
      await lessonsAPI.deleteLesson(id);
      setLessons(prev => prev.filter(l => l.id !== id));
    } catch { }
    finally { setDeleting(null); }
  };

  const deleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    setDeleting(id);
    try {
      await assignmentsAPI.deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch { }
    finally { setDeleting(null); }
  };

  const deleteQuiz = async (id) => {
    if (!window.confirm('Delete this quiz?')) return;
    setDeleting(id);
    try {
      await quizzesAPI.deleteQuiz(id);
      setQuizzes(prev => prev.filter(q => q.id !== id));
    } catch { }
    finally { setDeleting(null); }
  };

  // ── loading ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex min-h-screen bg-[#f3f4f7]">
      <TutorSidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#4c6eff] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <TutorSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/tutor/courses" className="text-[#8a90a1] text-[13px] hover:text-[#181b26] transition-colors flex-shrink-0 flex items-center gap-1">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M10 13L5 8l5-5"/>
              </svg>
              My Courses
            </Link>
            <div className="w-px h-4 bg-[#e8eaef]" />
            <p className="text-[#181b26] text-[14px] font-semibold truncate">{course?.title || 'Course'}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to={`/tutor/courses/${courseId}/students`}
              className="text-[#8a90a1] text-[12px] font-medium px-3.5 py-2 rounded-[8px] border border-[#e8eaef] hover:border-[#4c6eff] hover:text-[#4c6eff] transition-colors flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                <circle cx="6" cy="5" r="3"/><path d="M11 7a2 2 0 110 4"/><path d="M1 14a5 5 0 0110 0"/><path d="M14 14a3 3 0 00-3-3"/>
              </svg>
              Students
            </Link>
            <Link to={`/tutor/courses/${courseId}/attendance`}
              className="text-[#8a90a1] text-[12px] font-medium px-3.5 py-2 rounded-[8px] border border-[#e8eaef] hover:border-[#22be70] hover:text-[#22be70] transition-colors flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                <path d="M2 3h12M2 7h12M2 11h7"/><path d="M12 10l1.5 1.5L16 9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Attendance
            </Link>
            <Link to={`/tutor/courses/${courseId}/edit`}
              className="bg-[#4c6eff] text-white text-[12px] font-semibold px-3.5 py-2 rounded-[8px] hover:bg-[#3a56e0] transition-colors flex items-center gap-1.5">
              <PencilIcon />
              Edit Course
            </Link>
          </div>
        </div>

        {/* Main scroll area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Course header */}
          <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-[#181b26] text-[20px] font-bold">{course?.title || 'Course'}</h1>
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                    course?.status === 'published'
                      ? 'bg-[rgba(34,190,112,0.12)] text-[#22be70]'
                      : 'bg-[#f0f0f5] text-[#8a90a1]'
                  }`}>
                    {course?.status || 'draft'}
                  </span>
                </div>
                {course?.description && (
                  <p className="text-[#8a90a1] text-[13px] leading-relaxed max-w-xl mb-4">{course.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-5 text-[12px] text-[#8a90a1]">
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                      <path d="M15 10l-4.553 2.276A1 1 0 019 11.277V4.723a1 1 0 011.447-.894L15 6M2 4a2 2 0 012-2h5a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z"/>
                    </svg>
                    {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                      <path d="M4 2h6l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
                      <path d="M9 2v3h3"/>
                    </svg>
                    {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
                  </span>
                  {quizzes.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                        <circle cx="8" cy="8" r="6"/><path d="M6 6.5a2 2 0 114 0c0 1.5-2 1.5-2 3" strokeLinecap="round"/><circle cx="8" cy="12" r="0.5" fill="currentColor"/>
                      </svg>
                      {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                      <circle cx="6" cy="5" r="3"/><path d="M1 14a5 5 0 0110 0"/>
                    </svg>
                    {enrollCount} student{enrollCount !== 1 ? 's' : ''}
                  </span>
                  {course?.subject && (
                    <span className="flex items-center gap-1.5">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                        <path d="M8 2l6 3-6 3-6-3 6-3zM2 8l6 3 6-3M2 12l6 3 6-3"/>
                      </svg>
                      {course.subject}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Empty state */}
          {weeks.length === 0 && (
            <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-14 text-center">
              <div className="w-12 h-12 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-6 h-6">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <p className="text-[#181b26] text-[15px] font-semibold mb-1">No content yet</p>
              <p className="text-[#8a90a1] text-[13px] mb-4">Add lessons and assignments to build your course week by week.</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => { setPendingWeekIdx(-1); setShowContentModal(true); }}
                  className="bg-[#4c6eff] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:bg-[#3a56e0] transition-colors flex items-center gap-1.5"
                >
                  <PlusIcon /> Add content
                </button>
              </div>
              {/* Inline form when empty state */}
              {addingIn?.weekIdx === -1 && addingIn.type === 'lesson' && (
                <LessonForm draft={lessonDraft} setDraft={setLessonDraft} saveError={saveError} saving={saving} onSave={saveLesson} onCancel={cancelAdd} />
              )}
              {addingIn?.weekIdx === -1 && addingIn.type === 'assignment' && (
                <AssignmentForm draft={assignmentDraft} setDraft={setAssignmentDraft} editingId={editingId} saveError={saveError} saving={saving} onSave={saveAssignment} onCancel={cancelAdd} />
              )}
              {addingIn?.weekIdx === -1 && addingIn.type === 'note' && (
                <NoteForm draft={noteDraft} setDraft={setNoteDraft} saveError={saveError} saving={saving} onSave={saveNote} onCancel={cancelAdd} />
              )}
            </div>
          )}

          {/* Week sections */}
          {weeks.map((week, wi) => {
            const open       = expandedWeeks.has(wi);
            const isAddHere  = addingIn?.weekIdx === wi;

            return (
              <div key={wi} className="bg-white rounded-[16px] border border-[#f0f0f5] overflow-hidden">

                {/* Week header */}
                <button onClick={() => toggleWeek(wi)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f8f9fc] transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[rgba(76,110,255,0.08)] flex items-center justify-center flex-shrink-0">
                      <CalendarIcon />
                    </div>
                    <div>
                      <p className="text-[#181b26] text-[14px] font-bold leading-tight">{week.label}</p>
                      {week.dateRange && <p className="text-[#8a90a1] text-[11px] mt-0.5">{week.dateRange}</p>}
                    </div>
                    <span className="text-[11px] text-[#8a90a1] bg-[#f0f0f5] px-2 py-0.5 rounded-full">
                      {week.items.length} item{week.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <ChevronDown open={open} />
                </button>

                {open && (
                  <div className="border-t border-[#f0f0f5]">

                    {/* Attendance shortcut — only in General section */}
                    {week.label === 'General' && (
                      <Link
                        to={`/tutor/courses/${courseId}/attendance`}
                        className="flex items-center gap-4 px-5 py-3.5 border-b border-[#f0f0f5] hover:bg-[#f8fbff] transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-[10px] bg-[rgba(34,190,112,0.1)] flex items-center justify-center flex-shrink-0">
                          <svg viewBox="0 0 16 16" fill="none" stroke="#22be70" strokeWidth="1.4" className="w-4 h-4">
                            <path d="M2 3h12M2 7h12M2 11h7"/>
                            <path d="M12 10l1.5 1.5L16 9" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#181b26] text-[13px] font-semibold">Attendance</p>
                          <p className="text-[#8a90a1] text-[11px] mt-0.5">Mark student attendance per lesson</p>
                        </div>
                        <span className="text-[11px] font-semibold text-[#22be70] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          Open
                          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                            <path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </Link>
                    )}

                    {/* Items */}
                    {week.items.map((item, ii) => {
                      const isLesson     = item._type === 'lesson';
                      const isQuiz       = item._type === 'quiz';
                      const isAssignment = item._type === 'assignment';
                      const isLast       = ii === week.items.length - 1 && !isAddHere;
                      const isEditingThis = editingId === item.id;

                      const lessonUrl = item.video_link || item.video_url || '';
                      const isLiveLesson = isLesson && /zoom|teams|meet/i.test(lessonUrl);
                      const isVideoLesson = isLesson && !isLiveLesson && (lessonUrl !== '');
                      const isNoteLesson = isLesson && lessonUrl === '';

                      const iconBg = isLiveLesson  ? 'bg-[rgba(24,95,165,0.08)]'
                                   : isVideoLesson ? 'bg-[rgba(107,78,255,0.08)]'
                                   : isNoteLesson  ? 'bg-[#f3f4f7]'
                                   : isQuiz        ? 'bg-[rgba(147,91,245,0.08)]'
                                   :                 'bg-[rgba(255,166,26,0.1)]';

                      return (
                        <div key={item.id} className={!isLast ? 'border-b border-[#f0f0f5]' : ''}>
                          {/* Note items: full-width Moodle-style content block */}
                          {isNoteLesson ? (
                            <div className="px-5 py-4 group">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[#181b26] text-[15px] font-bold leading-snug mb-2">{item.title}</p>
                                  {item.description && (
                                    <div
                                      className="prose-note text-[#4c5162] text-[13px] leading-relaxed"
                                      dangerouslySetInnerHTML={{ __html: renderMarkdown(item.description) }}
                                    />
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-0.5">
                                  <button
                                    onClick={() => deleteLesson(item.id)}
                                    disabled={deleting === item.id}
                                    className="p-1.5 rounded-[6px] hover:bg-[#fff0f0] text-[#8a90a1] hover:text-[#e53e3e] transition-colors disabled:opacity-40"
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                          /* Row for lessons, quizzes, assignments */
                          <div className="flex items-center gap-4 px-5 py-3.5 group">
                            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                              {isLesson ? <VideoIcon /> : isQuiz ? <QuizIcon /> : <DocIcon />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[#181b26] text-[13px] font-semibold truncate">{item.title}</p>
                                {isQuiz && (
                                  <span className="text-[10px] bg-[rgba(147,91,245,0.1)] text-[#935bf5] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Quiz</span>
                                )}
                                {isLiveLesson && (
                                  <span className="text-[10px] bg-[rgba(24,95,165,0.1)] text-[#185FA5] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Live</span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-0.5 text-[11px] text-[#8a90a1]">
                                {isLesson && item._date && (
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon />
                                    {formatDate(item.scheduled_at)}
                                  </span>
                                )}
                                {isLesson && item.duration_minutes && (
                                  <span>{item.duration_minutes} min</span>
                                )}
                                {isAssignment && item._date && (
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon />
                                    Due {formatDate(item.due_date)}
                                  </span>
                                )}
                                {isAssignment && item.max_score != null && (
                                  <span>{item.max_score} pts</span>
                                )}
                              </div>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              {isAssignment && (
                                <button onClick={() => isEditingThis ? cancelEdit() : openEdit(item)}
                                  className="flex items-center gap-1 text-[#8a90a1] hover:text-[#4c6eff] text-[11px] font-medium px-2.5 py-1.5 rounded-[6px] hover:bg-[rgba(76,110,255,0.06)] transition-colors">
                                  <PencilIcon />
                                  {isEditingThis ? 'Cancel' : 'Edit'}
                                </button>
                              )}
                              <button
                                onClick={() => isLesson ? deleteLesson(item.id) : isQuiz ? deleteQuiz(item.id) : deleteAssignment(item.id)}
                                disabled={deleting === item.id}
                                className="flex items-center gap-1 text-[#8a90a1] hover:text-[#f24545] text-[11px] font-medium px-2.5 py-1.5 rounded-[6px] hover:bg-[rgba(242,69,69,0.06)] transition-colors disabled:opacity-40">
                                <TrashIcon />
                                Delete
                              </button>
                            </div>
                          </div>
                          )}

                          {/* Inline edit form for assignment */}
                          {!isNoteLesson && isEditingThis && (
                            <AssignmentForm draft={assignmentDraft} setDraft={setAssignmentDraft} editingId={editingId} saveError={saveError} saving={saving} onSave={saveEdit} onCancel={cancelEdit} />
                          )}
                        </div>
                      );
                    })}

                    {/* Add content button */}
                    {!isAddHere && (
                      <div className="flex items-center gap-2 px-5 py-3 border-t border-[#f0f0f5]">
                        <button
                          onClick={() => { setPendingWeekIdx(wi); setShowContentModal(true); }}
                          className="flex items-center gap-1.5 text-[#4c6eff] text-[12px] font-semibold px-3 py-1.5 rounded-[7px] hover:bg-[rgba(76,110,255,0.07)] transition-colors"
                        >
                          <PlusIcon /> Add content
                        </button>
                      </div>
                    )}

                    {/* Inline add forms */}
                    {isAddHere && addingIn.type === 'lesson' && (
                      <LessonForm draft={lessonDraft} setDraft={setLessonDraft} saveError={saveError} saving={saving} onSave={saveLesson} onCancel={cancelAdd} />
                    )}
                    {isAddHere && addingIn.type === 'assignment' && (
                      <AssignmentForm draft={assignmentDraft} setDraft={setAssignmentDraft} editingId={editingId} saveError={saveError} saving={saving} onSave={saveAssignment} onCancel={cancelAdd} />
                    )}
                    {isAddHere && addingIn.type === 'note' && (
                      <NoteForm draft={noteDraft} setDraft={setNoteDraft} saveError={saveError} saving={saving} onSave={saveNote} onCancel={cancelAdd} />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add to a new week (when content exists) */}
          {weeks.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#f0f0f5] px-5 py-4">
              <p className="text-[#8a90a1] text-[12px] mb-3">Add new content (set a date to place it in the correct week)</p>
              <button
                onClick={() => { setPendingWeekIdx('new'); setShowContentModal(true); }}
                className="flex items-center gap-1.5 text-[#4c6eff] text-[12px] font-semibold px-3 py-1.5 rounded-[7px] border border-[#e8eaef] hover:border-[#4c6eff] hover:bg-[rgba(76,110,255,0.04)] transition-colors"
              >
                <PlusIcon /> Add content
              </button>
              {addingIn?.weekIdx === 'new' && addingIn.type === 'lesson' && (
                <div className="mt-3"><LessonForm draft={lessonDraft} setDraft={setLessonDraft} saveError={saveError} saving={saving} onSave={saveLesson} onCancel={cancelAdd} /></div>
              )}
              {addingIn?.weekIdx === 'new' && addingIn.type === 'assignment' && (
                <div className="mt-3"><AssignmentForm draft={assignmentDraft} setDraft={setAssignmentDraft} editingId={editingId} saveError={saveError} saving={saving} onSave={saveAssignment} onCancel={cancelAdd} /></div>
              )}
              {addingIn?.weekIdx === 'new' && addingIn.type === 'note' && (
                <div className="mt-3"><NoteForm draft={noteDraft} setDraft={setNoteDraft} saveError={saveError} saving={saving} onSave={saveNote} onCancel={cancelAdd} /></div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Add content modal */}
      {showContentModal && (
        <AddContentModal
          onClose={() => setShowContentModal(false)}
          onSelect={handleContentSelect}
        />
      )}
    </div>
  );
};

export default TutorCourseView;
