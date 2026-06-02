﻿import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { lessonsAPI } from '../../api/lessons';
import { assignmentsAPI } from '../../api/assignments';
import { coursesAPI } from '../../api/courses';
import { enrollmentsAPI } from '../../api/enrollments';
import { quizzesAPI } from '../../api/quizzes';
import { mediaAPI } from '../../api/media';

// â"€â"€ date helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

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
  // Items with no date or with a sentinel date (year < 2020) go to General
  const withDate = items.filter(i => i._date && i._date.getFullYear() >= 2020);
  const noDate   = items.filter(i => !i._date || i._date.getFullYear() < 2020);
  const result   = [];

  // General always appears first
  result.push({ label: 'General', dateRange: '', weekMonday: null, items: noDate });

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
    result.push({ label: `Week ${n++}`, dateRange: `${fmt(ws)} - ${fmt(we)}`, weekMonday: ws, items: weekMap.get(key) });
  });
  return result;
}

// â"€â"€ icons â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const VideoIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="#0d9488" strokeWidth="1.5">
    <path d="M3 6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"/>
    <path d="M15 9l4-2v6l-4-2" stroke="#0d9488" strokeWidth="1.5"/>
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

const FileIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="#935bf5" strokeWidth="1.5">
    <path d="M11 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V8M11 2l6 6M11 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// â"€â"€ Add content modal â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const CONTENT_TYPES = [
  {
    id: 'lesson',    label: 'Live lesson',      sub: 'Zoom / Meet / Teams link',
    color: '#0d9488', icon: 'M3 7a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM15 10l4-2v6l-4-2',
  },
  {
    id: 'video',     label: 'Recorded video',   sub: 'YouTube / Vimeo link',
    color: '#ef4444', icon: 'M5 5l10 7-10 7V5z',
  },
  {
    id: 'homework',  label: 'Homework',         sub: 'File or text submission',
    color: '#22c55e', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    id: 'quiz',      label: 'Quiz',             sub: 'Create a quiz',
    color: '#0d9488', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
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
          <h3 className="text-[#0c0d12] text-[18px] font-bold">Add content</h3>
          <p className="text-[#6b6f7d] text-[13px] mt-0.5">Choose what to add</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#f0f0f5] flex items-center justify-center text-[#6b6f7d] hover:text-[#0c0d12] transition-colors">
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
            className="flex flex-col items-center gap-2.5 p-4 rounded-[14px] border-2 border-[#ebebf0] hover:border-[#0d9488]/50 hover:bg-[#f8f9ff] transition-colors group"
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
              <p className="text-[#0c0d12] text-[13px] font-semibold leading-tight">{ct.label}</p>
              <p className="text-[#6b6f7d] text-[11px] mt-0.5 leading-tight">{ct.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// â"€â"€ simple markdown renderer (no deps) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function renderMarkdown(text) {
  if (!text) return '';
  // 1. HTML-escape to prevent XSS
  let s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Block-level: headings, lists ←' collect list items into <ul>/<ol>
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
  // datetime-local gives YYYY-MM-DDTHH:MM - treat as local time, convert to UTC ISO
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString();
  return val + 'T00:00:00Z';
}

// â"€â"€ blank drafts â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const blankLesson = { title: '', description: '', video_link: '', scheduled_at: '', duration_minutes: '' };
const blankAssignment = { title: '', description: '', due_date: '', max_score: '', attachmentId: '', attachmentName: '' };
const blankNote = { title: '', description: '' };
const blankFile = { title: '', file: null };

// â"€â"€ shared input style â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const inputCls = 'w-full border border-[#e8eaef] rounded-[9px] px-3 py-2 text-[13px] text-[#0c0d12] placeholder-[#b0b5c4] focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[rgba(13,148,136,0.08)] transition-all bg-white';

// â"€â"€ forms (defined outside parent so they don't remount on every keystroke) â"€â"€â"€

const LessonForm = ({ draft, setDraft, saveError, saving, onSave, onCancel }) => (
  <div className="bg-[#f8f9fc] border-t border-[#f0f0f5] px-5 py-4">
    <p className="text-[#0c0d12] text-[13px] font-semibold mb-3">New Lesson</p>
    <div className="grid grid-cols-2 gap-3 mb-3">
      <div>
        <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">Title <span className="text-[#f24545]">*</span></label>
        <input className={inputCls} placeholder="Lesson title" value={draft.title}
          onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} />
      </div>
      <div>
        <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">Meeting / Video link</label>
        <input className={inputCls} placeholder="https://meet.google.com/..." value={draft.video_link}
          onChange={e => setDraft(p => ({ ...p, video_link: e.target.value }))} />
      </div>
      <div>
        <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">Date &amp; Time</label>
        <input type="datetime-local" className={inputCls} value={draft.scheduled_at}
          onChange={e => setDraft(p => ({ ...p, scheduled_at: e.target.value }))} />
      </div>
      <div>
        <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">Duration (min)</label>
        <input type="number" className={inputCls} placeholder="60" min="1" value={draft.duration_minutes}
          onChange={e => setDraft(p => ({ ...p, duration_minutes: e.target.value }))} />
      </div>
    </div>
    <div className="mb-3">
      <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">Description</label>
      <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Optional description"
        value={draft.description}
        onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} />
    </div>
    {saveError && <p className="text-[#f24545] text-[12px] mb-2">{saveError}</p>}
    <div className="flex items-center gap-2">
      <button onClick={onSave} disabled={saving}
        className="bg-[#0d9488] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:bg-[#0f766e] disabled:opacity-50 transition-colors flex items-center gap-1.5">
        {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
        Save lesson
      </button>
      <button onClick={onCancel} className="text-[#6b6f7d] text-[12px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#f0f0f5] transition-colors">
        Cancel
      </button>
    </div>
  </div>
);

const AssignmentForm = ({ draft, setDraft, editingId, saveError, saving, onSave, onCancel, onAttachFile, fileUploading }) => (
  <div className="bg-[#f8f9fc] border-t border-[#f0f0f5] px-5 py-4">
    <p className="text-[#0c0d12] text-[13px] font-semibold mb-3">
      {editingId ? 'Edit Assignment' : 'New Assignment'}
    </p>
    <div className="grid grid-cols-2 gap-3 mb-3">
      <div>
        <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">Title <span className="text-[#f24545]">*</span></label>
        <input className={inputCls} placeholder="Assignment title" value={draft.title}
          onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} />
      </div>
      <div>
        <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">Max score</label>
        <input type="number" className={inputCls} placeholder="100" min="0" value={draft.max_score}
          onChange={e => setDraft(p => ({ ...p, max_score: e.target.value }))} />
      </div>
      <div>
        <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">Due date</label>
        <input type="date" className={inputCls} value={draft.due_date}
          onChange={e => setDraft(p => ({ ...p, due_date: e.target.value }))} />
      </div>
    </div>
    <div className="mb-3">
      <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">Description</label>
      <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Instructions for students"
        value={draft.description}
        onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} />
    </div>
    <div className="mb-3">
      <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">Attachment (optional)</label>
      {draft.attachmentName ? (
        <div className="flex items-center gap-2 bg-white border border-[#e8eaef] rounded-[9px] px-3 py-2">
          <svg viewBox="0 0 16 16" fill="none" stroke="#935bf5" strokeWidth="1.4" className="w-4 h-4 flex-shrink-0">
            <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6M9 2l4 4M9 2v4h4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[12px] text-[#0c0d12] flex-1 truncate">{draft.attachmentName}</span>
          <button type="button" onClick={() => setDraft(p => ({ ...p, attachmentId: '', attachmentName: '' }))}
            className="text-[11px] text-[#6b6f7d] hover:text-[#f24545] transition-colors flex-shrink-0">Remove</button>
        </div>
      ) : (
        <label className="flex items-center gap-2 text-[12px] text-[#935bf5] font-semibold cursor-pointer px-3 py-2 border border-dashed border-[#935bf5]/40 rounded-[9px] hover:border-[#935bf5] hover:bg-[rgba(147,91,245,0.04)] transition-all w-fit">
          {fileUploading
            ? <div className="w-3 h-3 border-2 border-[#935bf5] border-t-transparent rounded-full animate-spin"/>
            : <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M10 9l-2-2-2 2M8 7v6M4 14H3a2 2 0 01-2-2V5a2 2 0 012-2h2l2-2h2l2 2h2a2 2 0 012 2v7a2 2 0 01-2 2h-1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>}
          <span>{fileUploading ? 'Uploading...' : 'Attach file'}</span>
          <input type="file" className="sr-only" disabled={fileUploading}
            onChange={e => { const f = e.target.files?.[0]; if (f) onAttachFile(f); e.target.value = ''; }} />
        </label>
      )}
    </div>
    {saveError && <p className="text-[#f24545] text-[12px] mb-2">{saveError}</p>}
    <div className="flex items-center gap-2">
      <button onClick={onSave} disabled={saving || fileUploading}
        className="bg-[#0d9488] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:bg-[#0f766e] disabled:opacity-50 transition-colors flex items-center gap-1.5">
        {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
        Save
      </button>
      <button onClick={onCancel} className="text-[#6b6f7d] text-[12px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#f0f0f5] transition-colors">
        Cancel
      </button>
    </div>
  </div>
);

const NoteForm = ({ draft, setDraft, saveError, saving, onSave, onCancel }) => (
  <div className="bg-[#f8f9fc] border-t border-[#f0f0f5] px-5 py-4">
    <p className="text-[#0c0d12] text-[13px] font-semibold mb-3">New Text / Note</p>
    <div className="mb-3">
      <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">Title <span className="text-[#f24545]">*</span></label>
      <input className={inputCls} placeholder="e.g. Required documents, Important requirements..." value={draft.title}
        onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} />
    </div>
    <div className="mb-2">
      <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">Content</label>
      <textarea className={inputCls + ' resize-y'} rows={10}
        placeholder={'Write your text here. Markdown supported:\n\n# Big heading\n## Section heading\n**bold text**\n*italic text*\n- bullet item\n1. numbered item\n`code`'}
        value={draft.description}
        onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} />
    </div>
    <div className="flex flex-wrap gap-2 mb-3 text-[11px] text-[#6b6f7d]">
      {[['#', 'H1'], ['##', 'H2'], ['**b**', 'Bold'], ['*i*', 'Italic'], ['- ', 'Bullet'], ['1. ', 'Numbered']].map(([syn, lbl]) => (
        <span key={lbl} className="bg-white border border-[#e8eaef] rounded px-1.5 py-0.5 font-mono">
          {syn} <span className="font-sans text-[#b0b5c4]">-&gt; {lbl}</span>
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
      <button onClick={onCancel} className="text-[#6b6f7d] text-[12px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#f0f0f5] transition-colors">
        Cancel
      </button>
    </div>
  </div>
);

const FileUploadForm = ({ draft, setDraft, saveError, saving, onSave, onCancel }) => (
  <div className="bg-[#f8f9fc] border-t border-[#f0f0f5] px-5 py-4">
    <p className="text-[#0c0d12] text-[13px] font-semibold mb-3">Upload File</p>
    <div className="mb-3">
      <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">Title <span className="text-[#f24545]">*</span></label>
      <input className={inputCls} placeholder="File title" value={draft.title}
        onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} />
    </div>
    <div className="mb-3">
      <label className="block text-[11px] text-[#6b6f7d] font-medium mb-1">File <span className="text-[#f24545]">*</span></label>
      {draft.file ? (
        <div className="flex items-center gap-2 bg-white border border-[#e8eaef] rounded-[9px] px-3 py-2">
          <FileIcon />
          <span className="text-[12px] text-[#0c0d12] flex-1 truncate">{draft.file.name}</span>
          <button type="button" onClick={() => setDraft(p => ({ ...p, file: null }))}
            className="text-[11px] text-[#6b6f7d] hover:text-[#f24545] transition-colors flex-shrink-0">Remove</button>
        </div>
      ) : (
        <label className="flex items-center gap-2 text-[12px] text-[#935bf5] font-semibold cursor-pointer px-3 py-2 border border-dashed border-[#935bf5]/40 rounded-[9px] hover:border-[#935bf5] hover:bg-[rgba(147,91,245,0.04)] transition-all w-fit">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <path d="M10 9l-2-2-2 2M8 7v6M4 14H3a2 2 0 01-2-2V5a2 2 0 012-2h2l2-2h2l2 2h2a2 2 0 012 2v7a2 2 0 01-2 2h-1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Choose file</span>
          <input type="file" className="sr-only"
            onChange={e => { const f = e.target.files?.[0]; if (f) setDraft(p => ({ ...p, file: f })); e.target.value = ''; }} />
        </label>
      )}
    </div>
    {saveError && <p className="text-[#f24545] text-[12px] mb-2">{saveError}</p>}
    <div className="flex items-center gap-2">
      <button onClick={onSave} disabled={saving || !draft.file}
        className="bg-[#935bf5] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5">
        {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
        Upload
      </button>
      <button onClick={onCancel} className="text-[#6b6f7d] text-[12px] font-medium px-4 py-2 rounded-[8px] hover:bg-[#f0f0f5] transition-colors">
        Cancel
      </button>
    </div>
  </div>
);

// â"€â"€ component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const TutorCourseView = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const { id: courseId } = useParams();

  const [course,      setCourse]      = useState(null);
  const [lessons,     setLessons]     = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes,     setQuizzes]     = useState([]);
  const [enrollCount,    setEnrollCount]    = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [completing,     setCompleting]     = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);

  // General (0) is open by default
  const [expandedWeeks, setExpandedWeeks] = useState(new Set([0, 1]));

  // inline add form: { weekIdx, type: 'lesson'|'assignment' } | null
  const [addingIn, setAddingIn] = useState(null);

  // inline edit for assignments
  const [editingId, setEditingId]   = useState(null);

  // form drafts
  const [lessonDraft,     setLessonDraft]     = useState(blankLesson);
  const [assignmentDraft, setAssignmentDraft] = useState(blankAssignment);
  const [noteDraft,       setNoteDraft]       = useState(blankNote);
  const [fileDraft,       setFileDraft]       = useState(blankFile);
  const [fileUploading,   setFileUploading]   = useState(false);

  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');
  const [deleting,   setDeleting]   = useState(null);

  // Add content modal
  const [showContentModal, setShowContentModal] = useState(false);
  const [pendingWeekIdx, setPendingWeekIdx]     = useState(null);

  // Empty week placeholders created by "+ Add Week" button
  const [pendingWeeks, setPendingWeeks] = useState([]);

  const handleContentSelect = useCallback((type) => {
    setShowContentModal(false);
    const targetIdx = pendingWeekIdx ?? 0;
    if (type === 'quiz') {
      navigate(`/tutor/courses/${courseId}/quizzes/new`);
    } else if (type === 'lesson' || type === 'video') {
      openAdd(targetIdx, 'lesson');
    } else if (type === 'homework') {
      openAdd(targetIdx, 'assignment');
    } else if (type === 'text') {
      openAdd(targetIdx, 'note');
    } else if (type === 'file') {
      openAdd(targetIdx, 'file');
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

  const courseStatus = course?.course_status || course?.status || (course?.is_published ? 'active' : 'draft');

  const handleCompleteCourse = async () => {
    setCompleting(true);
    try {
      const updated = await coursesAPI.completeCourse(courseId);
      setCourse(c => ({ ...c, course_status: 'completed', ...(updated || {}) }));
      setShowConfirm(false);
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to complete course');
    } finally {
      setCompleting(false);
    }
  };

  const toggleWeek = idx =>
    setExpandedWeeks(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; });

  // â"€â"€ add handlers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  const openAdd = (weekIdx, type) => {
    // Resolve the Monday for this weekIdx
    let monday = null;
    if (typeof weekIdx === 'number') {
      monday = weeks[weekIdx]?.weekMonday || null;
    } else if (typeof weekIdx === 'string' && weekIdx.startsWith('pw_')) {
      const pw = pendingWeeks.find(w => w.id === weekIdx);
      monday = pw?.weekMonday || null;
    }

    if (type === 'lesson') {
      setLessonDraft({ ...blankLesson, scheduled_at: monday ? toInputDate(monday) + 'T09:00' : '' });
    } else if (type === 'assignment') {
      setAssignmentDraft({ ...blankAssignment, due_date: monday ? toInputDate(monday) : '' });
    } else if (type === 'note') {
      setNoteDraft({ ...blankNote });
    } else if (type === 'file') {
      setFileDraft({ ...blankFile });
    }
    setAddingIn({ weekIdx, type });
    setSaveError('');
    if (typeof weekIdx === 'number') {
      setExpandedWeeks(prev => { const s = new Set(prev); s.add(weekIdx); return s; });
    }
  };

  const cancelAdd = () => { setAddingIn(null); setSaveError(''); };

  const clearPendingWeek = (weekIdx) => {
    if (typeof weekIdx === 'string' && weekIdx.startsWith('pw_')) {
      setPendingWeeks(prev => prev.filter(w => w.id !== weekIdx));
    }
  };

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
      if (newLesson?.id) {
        setLessons(prev => [...prev, {
          ...newLesson,
          video_link:  newLesson.video_link  ?? lessonDraft.video_link,
          description: newLesson.description ?? lessonDraft.description.trim(),
        }]);
      }
      clearPendingWeek(addingIn?.weekIdx);
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
      let description = assignmentDraft.description.trim();
      if (assignmentDraft.attachmentId) {
        description += `\n\n__file__:${assignmentDraft.attachmentId}:${assignmentDraft.attachmentName}`;
      }
      const created = await assignmentsAPI.createAssignment({
        course_id:   courseId,
        title:       assignmentDraft.title.trim(),
        description,
        due_date:    assignmentDraft.due_date || undefined,
        max_score:   assignmentDraft.max_score ? parseFloat(assignmentDraft.max_score) : undefined,
      });
      const newA = created?.assignment || created;
      if (newA?.id) setAssignments(prev => [...prev, { ...newA, description }]);
      clearPendingWeek(addingIn?.weekIdx);
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
      // General (weekIdx === 0) uses a sentinel date so groupIntoWeeks keeps it there.
      // Specific weeks use their Monday so the note appears in the correct week.
      let scheduledAt = '2000-01-01T00:00:00Z';
      const wi = addingIn?.weekIdx;
      if (typeof wi === 'number' && wi > 0) {
        const monday = weeks[wi]?.weekMonday;
        scheduledAt = monday ? monday.toISOString() : new Date().toISOString();
      } else if (typeof wi === 'string' && wi.startsWith('pw_')) {
        const pw = pendingWeeks.find(w => w.id === wi);
        scheduledAt = pw?.weekMonday ? pw.weekMonday.toISOString() : new Date().toISOString();
      }
      const created = await lessonsAPI.createLesson({
        course_id:        courseId,
        title:            noteDraft.title.trim(),
        description:      noteDraft.description.trim(),
        video_link:       '',
        scheduled_at:     scheduledAt,
        duration_minutes: 1,
        status:           'published',
      });
      const newLesson = created?.lesson || created;
      if (newLesson?.id) {
        // API response may omit description/video_link — preserve from draft so body shows immediately
        setLessons(prev => [...prev, {
          ...newLesson,
          video_link:  newLesson.video_link  ?? '',
          description: newLesson.description ?? noteDraft.description.trim(),
        }]);
      }
      clearPendingWeek(addingIn?.weekIdx);
      setAddingIn(null);
    } catch (e) {
      setSaveError(e.response?.data?.error || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const saveFile = async () => {
    if (!fileDraft.title.trim()) { setSaveError('Title is required'); return; }
    if (!fileDraft.file) { setSaveError('Please select a file'); return; }
    setSaving(true); setSaveError('');
    try {
      const uploadRes = await mediaAPI.uploadFile(fileDraft.file, courseId, 'course_material');
      const mediaId = uploadRes?.file_id || uploadRes;
      const description = `FILE:${mediaId}:${fileDraft.file.name}`;

      let scheduledAt = '2000-01-01T00:00:00Z';
      const wi = addingIn?.weekIdx;
      if (typeof wi === 'number' && wi > 0) {
        const monday = weeks[wi]?.weekMonday;
        scheduledAt = monday ? monday.toISOString() : new Date().toISOString();
      } else if (typeof wi === 'string' && wi.startsWith('pw_')) {
        const pw = pendingWeeks.find(w => w.id === wi);
        scheduledAt = pw?.weekMonday ? pw.weekMonday.toISOString() : new Date().toISOString();
      }

      const created = await lessonsAPI.createLesson({
        course_id:        courseId,
        title:            fileDraft.title.trim(),
        description,
        video_link:       '',
        scheduled_at:     scheduledAt,
        duration_minutes: 1,
        status:           'published',
      });
      const newLesson = created?.lesson || created;
      if (newLesson?.id) {
        setLessons(prev => [...prev, { ...newLesson, video_link: '', description }]);
      }
      clearPendingWeek(addingIn?.weekIdx);
      setAddingIn(null);
    } catch (e) {
      setSaveError(e.response?.data?.error || 'Failed to upload file');
    } finally {
      setSaving(false);
    }
  };

  const handleAttachFile = async (file) => {
    setFileUploading(true);
    try {
      const uploadRes = await mediaAPI.uploadFile(file, courseId, 'course_material');
      const mediaId = uploadRes?.file_id || uploadRes;
      setAssignmentDraft(p => ({ ...p, attachmentId: mediaId, attachmentName: file.name }));
    } catch {
      setSaveError('Failed to upload attachment');
    } finally {
      setFileUploading(false);
    }
  };

  // â"€â"€ edit assignment â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  const openEdit = (assignment) => {
    let description = assignment.description || '';
    let attachmentId = '';
    let attachmentName = '';
    const fileMatch = description.match(/\n\n__file__:([^:]+):(.+)$/);
    if (fileMatch) {
      attachmentId = fileMatch[1];
      attachmentName = fileMatch[2];
      description = description.slice(0, fileMatch.index);
    }
    setAssignmentDraft({
      title:         assignment.title || '',
      description,
      due_date:      toInputDate(assignment.due_date),
      max_score:     assignment.max_score != null ? String(assignment.max_score) : '',
      attachmentId,
      attachmentName,
    });
    setEditingId(assignment.id);
    setSaveError('');
  };

  const cancelEdit = () => { setEditingId(null); setSaveError(''); };

  const saveEdit = async () => {
    if (!assignmentDraft.title.trim()) { setSaveError('Title is required'); return; }
    setSaving(true); setSaveError('');
    try {
      let description = assignmentDraft.description.trim();
      if (assignmentDraft.attachmentId) {
        description += `\n\n__file__:${assignmentDraft.attachmentId}:${assignmentDraft.attachmentName}`;
      }
      await assignmentsAPI.updateAssignment(editingId, {
        title:       assignmentDraft.title.trim(),
        description,
        due_date:    assignmentDraft.due_date || undefined,
        max_score:   assignmentDraft.max_score ? parseFloat(assignmentDraft.max_score) : undefined,
      });
      setAssignments(prev => prev.map(a =>
        a.id === editingId
          ? { ...a,
              title:       assignmentDraft.title.trim(),
              description,
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

  // â"€â"€ delete â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

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

  // â"€â"€ loading â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  if (loading) return (
    <div className="flex min-h-screen bg-[#f3f4f7]">
      <TutorSidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  // â"€â"€ render â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <TutorSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/tutor/courses" className="text-[#6b6f7d] text-[13px] hover:text-[#0c0d12] transition-colors flex-shrink-0 flex items-center gap-1">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M10 13L5 8l5-5"/>
              </svg>
              My Courses
            </Link>
            <div className="w-px h-4 bg-[#e8eaef]" />
            <p className="text-[#0c0d12] text-[14px] font-semibold truncate">{course?.title || 'Course'}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to={`/tutor/courses/${courseId}/students`}
              className="text-[#6b6f7d] text-[12px] font-medium px-3.5 py-2 rounded-[8px] border border-[#e8eaef] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                <circle cx="6" cy="5" r="3"/><path d="M11 7a2 2 0 110 4"/><path d="M1 14a5 5 0 0110 0"/><path d="M14 14a3 3 0 00-3-3"/>
              </svg>
              Students
            </Link>
            <Link to={`/tutor/courses/${courseId}/attendance`}
              className="text-[#6b6f7d] text-[12px] font-medium px-3.5 py-2 rounded-[8px] border border-[#e8eaef] hover:border-[#22be70] hover:text-[#22be70] transition-colors flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                <path d="M2 3h12M2 7h12M2 11h7"/><path d="M12 10l1.5 1.5L16 9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Attendance
            </Link>
            <Link to={`/tutor/courses/${courseId}/edit`}
              className="bg-[#0d9488] text-white text-[12px] font-semibold px-3.5 py-2 rounded-[8px] hover:bg-[#0f766e] transition-colors flex items-center gap-1.5">
              <PencilIcon />
              Edit Course
            </Link>
            {courseStatus !== 'completed' && (
              <button
                onClick={() => setShowConfirm(true)}
                className="text-[#935bf5] text-[12px] font-semibold px-3.5 py-2 rounded-[8px] border border-[#935bf5]/30 hover:bg-[#935bf5]/08 transition-colors"
              >
                Complete Course
              </button>
            )}
          </div>
        </div>

        {/* Complete Course confirmation modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-xl">
              <h3 className="text-[#0c0d12] text-[17px] font-bold mb-2">Complete this course?</h3>
              <p className="text-[#6b6f7d] text-[13px] leading-relaxed mb-2">
                This course will be marked as <strong>completed</strong>.
              </p>
              <p className="text-[#6b6f7d] text-[13px] leading-relaxed mb-6">
                Students who satisfy the completion requirements (attendance {course?.completion_attendance_pct || 0}%, grade {course?.completion_grade_pct || 0}%) will automatically receive certificates.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold text-[#6b6f7d] border border-[#e8eaef] hover:border-[#0d9488] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteCourse}
                  disabled={completing}
                  className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold text-white bg-[#935bf5] hover:bg-[#7c3aed] disabled:opacity-50 transition-colors"
                >
                  {completing ? 'Completing…' : 'Yes, Complete Course'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main scroll area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Course header */}
          <div className="bg-white rounded-[16px] border border-[#f0f0f5] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-[#0c0d12] text-[20px] font-bold">{course?.title || 'Course'}</h1>
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                    courseStatus === 'completed'
                      ? 'bg-[rgba(147,91,245,0.12)] text-[#935bf5]'
                      : courseStatus === 'active' || courseStatus === 'published'
                        ? 'bg-[rgba(34,190,112,0.12)] text-[#22be70]'
                        : 'bg-[#f0f0f5] text-[#6b6f7d]'
                  }`}>
                    {courseStatus === 'active' ? 'Active' : courseStatus === 'completed' ? 'Completed' : courseStatus === 'published' ? 'Active' : 'Draft'}
                  </span>
                </div>
                {course?.description && (
                  <p className="text-[#6b6f7d] text-[13px] leading-relaxed max-w-xl mb-4">{course.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-5 text-[12px] text-[#6b6f7d]">
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
                    <div className="w-8 h-8 rounded-[8px] bg-[rgba(13,148,136,0.08)] flex items-center justify-center flex-shrink-0">
                      <CalendarIcon />
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

                {open && (
                  <div className="border-t border-[#f0f0f5]">

                    {/* Attendance shortcut - only in General section */}
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
                          <p className="text-[#0c0d12] text-[13px] font-semibold">Attendance</p>
                          <p className="text-[#6b6f7d] text-[11px] mt-0.5">Mark student attendance per lesson</p>
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

                      const isFileLesson = isLesson && (item.description || '').startsWith('FILE:');
                      const fileMatch = isFileLesson ? (item.description || '').match(/^FILE:([^:]+):(.+)$/) : null;
                      const fileMediaId = fileMatch?.[1];
                      const fileOriginalName = fileMatch?.[2];

                      const lessonUrl = (item.video_link ?? '') || (item.video_url ?? '');
                      const isLiveLesson = isLesson && !isFileLesson && /zoom|teams|meet/i.test(lessonUrl);
                      const isVideoLesson = isLesson && !isFileLesson && !isLiveLesson && lessonUrl !== '';
                      const isNoteLesson = isLesson && !isFileLesson && lessonUrl === '';

                      const iconBg = isLiveLesson  ? 'bg-[rgba(24,95,165,0.08)]'
                                   : isVideoLesson ? 'bg-[rgba(107,78,255,0.08)]'
                                   : isNoteLesson  ? 'bg-[#f3f4f7]'
                                   : isFileLesson  ? 'bg-[rgba(147,91,245,0.08)]'
                                   : isQuiz        ? 'bg-[rgba(147,91,245,0.08)]'
                                   :                 'bg-[rgba(255,166,26,0.1)]';

                      return (
                        <div key={item.id} className={!isLast ? 'border-b border-[#f0f0f5]' : ''}>
                          {/* File items */}
                          {isFileLesson ? (
                            <div className="flex items-center gap-4 px-5 py-3.5 group">
                              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 bg-[rgba(147,91,245,0.08)]">
                                <FileIcon />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[#0c0d12] text-[13px] font-semibold truncate">{item.title}</p>
                                {fileOriginalName && <p className="text-[#6b6f7d] text-[11px] mt-0.5 truncate">{fileOriginalName}</p>}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await mediaAPI.getDownloadURL(fileMediaId);
                                      window.open(res.url, '_blank');
                                    } catch {}
                                  }}
                                  className="flex items-center gap-1 text-[#935bf5] text-[11px] font-medium px-2.5 py-1.5 rounded-[6px] hover:bg-[rgba(147,91,245,0.06)] transition-colors">
                                  Download
                                </button>
                                <button
                                  onClick={() => deleteLesson(item.id)}
                                  disabled={deleting === item.id}
                                  className="flex items-center gap-1 text-[#6b6f7d] hover:text-[#f24545] text-[11px] font-medium px-2.5 py-1.5 rounded-[6px] hover:bg-[rgba(242,69,69,0.06)] transition-colors disabled:opacity-40">
                                  <TrashIcon />
                                  Delete
                                </button>
                              </div>
                            </div>
                          ) : isNoteLesson ? (
                            <div className="px-5 py-4 group">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[#0c0d12] text-[15px] font-bold leading-snug mb-2">{item.title}</p>
                                  {item.description && (
                                    <div
                                      className="prose-note text-[#383a44] text-[13px] leading-relaxed"
                                      dangerouslySetInnerHTML={{ __html: renderMarkdown(item.description) }}
                                    />
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-0.5">
                                  <button
                                    onClick={() => deleteLesson(item.id)}
                                    disabled={deleting === item.id}
                                    className="p-1.5 rounded-[6px] hover:bg-[#fff0f0] text-[#6b6f7d] hover:text-[#e53e3e] transition-colors disabled:opacity-40"
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
                                <p className="text-[#0c0d12] text-[13px] font-semibold truncate">{item.title}</p>
                                {isQuiz && (
                                  <span className="text-[10px] bg-[rgba(147,91,245,0.1)] text-[#935bf5] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Quiz</span>
                                )}
                                {isLiveLesson && (
                                  <span className="text-[10px] bg-[rgba(24,95,165,0.1)] text-[#185FA5] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Live</span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-0.5 text-[11px] text-[#6b6f7d]">
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
                                  className="flex items-center gap-1 text-[#6b6f7d] hover:text-[#0d9488] text-[11px] font-medium px-2.5 py-1.5 rounded-[6px] hover:bg-[rgba(13,148,136,0.06)] transition-colors">
                                  <PencilIcon />
                                  {isEditingThis ? 'Cancel' : 'Edit'}
                                </button>
                              )}
                              <button
                                onClick={() => isLesson ? deleteLesson(item.id) : isQuiz ? deleteQuiz(item.id) : deleteAssignment(item.id)}
                                disabled={deleting === item.id}
                                className="flex items-center gap-1 text-[#6b6f7d] hover:text-[#f24545] text-[11px] font-medium px-2.5 py-1.5 rounded-[6px] hover:bg-[rgba(242,69,69,0.06)] transition-colors disabled:opacity-40">
                                <TrashIcon />
                                Delete
                              </button>
                            </div>
                          </div>
                          )}

                          {/* Inline edit form for assignment */}
                          {!isNoteLesson && !isFileLesson && isEditingThis && (
                            <AssignmentForm draft={assignmentDraft} setDraft={setAssignmentDraft} editingId={editingId} saveError={saveError} saving={saving} onSave={saveEdit} onCancel={cancelEdit} onAttachFile={handleAttachFile} fileUploading={fileUploading} />
                          )}
                        </div>
                      );
                    })}

                    {/* Add content button */}
                    {!isAddHere && (
                      <div className="flex items-center gap-2 px-5 py-3 border-t border-[#f0f0f5]">
                        <button
                          onClick={() => { setPendingWeekIdx(wi); setShowContentModal(true); }}
                          className="flex items-center gap-1.5 text-[#0d9488] text-[12px] font-semibold px-3 py-1.5 rounded-[7px] hover:bg-[rgba(13,148,136,0.07)] transition-colors"
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
                      <AssignmentForm draft={assignmentDraft} setDraft={setAssignmentDraft} editingId={editingId} saveError={saveError} saving={saving} onSave={saveAssignment} onCancel={cancelAdd} onAttachFile={handleAttachFile} fileUploading={fileUploading} />
                    )}
                    {isAddHere && addingIn.type === 'note' && (
                      <NoteForm draft={noteDraft} setDraft={setNoteDraft} saveError={saveError} saving={saving} onSave={saveNote} onCancel={cancelAdd} />
                    )}
                    {isAddHere && addingIn.type === 'file' && (
                      <FileUploadForm draft={fileDraft} setDraft={setFileDraft} saveError={saveError} saving={saving} onSave={saveFile} onCancel={cancelAdd} />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pending (empty) weeks created by "+ Add Week" */}
          {pendingWeeks.map((pw) => {
            const we = new Date(pw.weekMonday.getTime() + 6 * 24 * 3600 * 1000);
            const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const open = expandedWeeks.has(pw.id);
            const isAddHere = addingIn?.weekIdx === pw.id;
            return (
              <div key={pw.id} className="bg-white rounded-[16px] border border-[#f0f0f5] overflow-hidden">
                <button onClick={() => toggleWeek(pw.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f8f9fc] transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[rgba(13,148,136,0.08)] flex items-center justify-center flex-shrink-0">
                      <CalendarIcon />
                    </div>
                    <div>
                      <p className="text-[#0c0d12] text-[14px] font-bold leading-tight">{pw.label}</p>
                      <p className="text-[#6b6f7d] text-[11px] mt-0.5">{fmt(pw.weekMonday)} - {fmt(we)}</p>
                    </div>
                    <span className="text-[11px] text-[#6b6f7d] bg-[#f0f0f5] px-2 py-0.5 rounded-full">0 items</span>
                  </div>
                  <ChevronDown open={open} />
                </button>

                {open && (
                  <div className="border-t border-[#f0f0f5]">
                    {!isAddHere && (
                      <div className="flex items-center gap-2 px-5 py-3">
                        <button
                          onClick={() => { setPendingWeekIdx(pw.id); setShowContentModal(true); }}
                          className="flex items-center gap-1.5 text-[#0d9488] text-[12px] font-semibold px-3 py-1.5 rounded-[7px] hover:bg-[rgba(13,148,136,0.07)] transition-colors"
                        >
                          <PlusIcon /> Add content
                        </button>
                      </div>
                    )}
                    {isAddHere && addingIn.type === 'lesson' && (
                      <LessonForm draft={lessonDraft} setDraft={setLessonDraft} saveError={saveError} saving={saving} onSave={saveLesson} onCancel={cancelAdd} />
                    )}
                    {isAddHere && addingIn.type === 'assignment' && (
                      <AssignmentForm draft={assignmentDraft} setDraft={setAssignmentDraft} editingId={editingId} saveError={saveError} saving={saving} onSave={saveAssignment} onCancel={cancelAdd} onAttachFile={handleAttachFile} fileUploading={fileUploading} />
                    )}
                    {isAddHere && addingIn.type === 'note' && (
                      <NoteForm draft={noteDraft} setDraft={setNoteDraft} saveError={saveError} saving={saving} onSave={saveNote} onCancel={cancelAdd} />
                    )}
                    {isAddHere && addingIn.type === 'file' && (
                      <FileUploadForm draft={fileDraft} setDraft={setFileDraft} saveError={saveError} saving={saving} onSave={saveFile} onCancel={cancelAdd} />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Week button */}
          <div className="pb-2">
            <button
              onClick={() => {
                const allWeekMondaysWithPending = [
                  ...weeks.filter(w => w.weekMonday).map(w => w.weekMonday),
                  ...pendingWeeks.map(w => w.weekMonday),
                ];
                const base = allWeekMondaysWithPending.length > 0
                  ? allWeekMondaysWithPending[allWeekMondaysWithPending.length - 1]
                  : getMonday(new Date());
                const nextMonday = new Date(base);
                nextMonday.setDate(base.getDate() + 7);
                const totalWeekCount = weeks.filter(w => w.weekMonday).length + pendingWeeks.length + 1;
                const id = `pw_${Date.now()}`;
                setPendingWeeks(prev => [...prev, { id, weekMonday: nextMonday, label: `Week ${totalWeekCount}` }]);
                setExpandedWeeks(prev => { const s = new Set(prev); s.add(id); return s; });
              }}
              className="flex items-center gap-2 text-[#0d9488] text-[13px] font-semibold px-4 py-2.5 rounded-[10px] border border-dashed border-[#0d9488]/40 hover:border-[#0d9488] hover:bg-[rgba(13,148,136,0.04)] transition-all w-full justify-center"
            >
              <PlusIcon /> Add Week
            </button>
          </div>

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
