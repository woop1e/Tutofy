import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'ru', label: 'Рус', full: 'Русский' },
  { code: 'kz', label: 'Қаз', full: 'Қазақша' },
  { code: 'en', label: 'Eng', full: 'English' },
];

// topbar — compact dropdown button next to notification bell
// sidebar — full-width button in sidebar footer
export default function LanguageSwitcher({ variant = 'sidebar', collapsed }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const change = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('tutofy_lang', code);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (variant === 'topbar') {
    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 10px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'white',
            fontSize: 12, fontWeight: 700, color: 'var(--text-2)',
            cursor: 'pointer', letterSpacing: '0.03em', transition: 'all 120ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width={13} height={13}>
            <circle cx="8" cy="8" r="6"/>
            <path d="M8 2a9 9 0 010 12M8 2a9 9 0 000 12M2 8h12" strokeLinecap="round"/>
          </svg>
          {current.label}
          <svg viewBox="0 0 8 5" fill="none" stroke="currentColor" strokeWidth="1.6" width={7} height={7}>
            <path d="M1 1l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            zIndex: 400, overflow: 'hidden', minWidth: 120,
          }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => change(l.code)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 8, width: '100%', padding: '9px 14px',
                  fontSize: 13, fontWeight: l.code === i18n.language ? 600 : 400,
                  color: l.code === i18n.language ? 'var(--accent)' : 'var(--text)',
                  background: l.code === i18n.language ? 'var(--accent-soft)' : 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => { if (l.code !== i18n.language) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={e => { if (l.code !== i18n.language) e.currentTarget.style.background = 'none'; }}
              >
                <span>{l.full}</span>
                {l.code === i18n.language && (
                  <svg viewBox="0 0 10 8" fill="none" stroke="var(--accent)" strokeWidth="2" width={10} height={10}>
                    <path d="M1 4l2.5 2.5L9 1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // sidebar variant
  if (collapsed) {
    return (
      <div ref={ref} style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <button onClick={() => setOpen(o => !o)}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', fontSize: 10, fontWeight: 700, color: 'var(--muted)', cursor: 'pointer' }}>
          {current.code.toUpperCase()}
        </button>
        {open && (
          <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: 'white', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 300, overflow: 'hidden', minWidth: 72 }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => change(l.code)}
                style={{ display: 'block', width: '100%', padding: '7px 10px', fontSize: 12, fontWeight: l.code === i18n.language ? 700 : 500, color: l.code === i18n.language ? 'var(--accent)' : 'var(--text)', background: l.code === i18n.language ? 'var(--accent-soft)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative', padding: '0 8px', marginBottom: 4 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--muted)', transition: 'all 120ms' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width={13} height={13}>
          <circle cx="8" cy="8" r="6"/><path d="M8 2a9 9 0 010 12M8 2a9 9 0 000 12M2 8h12" strokeLinecap="round"/>
        </svg>
        {current.label}
        <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" width={8} height={8} style={{ marginLeft: 'auto' }}>
          <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', bottom: '110%', left: 8, right: 8, background: 'white', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 300, overflow: 'hidden' }}>
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => change(l.code)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', fontSize: 13, fontWeight: l.code === i18n.language ? 600 : 400, color: l.code === i18n.language ? 'var(--accent)' : 'var(--text)', background: l.code === i18n.language ? 'var(--accent-soft)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => { if (l.code !== i18n.language) e.currentTarget.style.background = 'var(--surface-hover)'; }}
              onMouseLeave={e => { if (l.code !== i18n.language) e.currentTarget.style.background = 'none'; }}
            >
              {l.code === i18n.language && <svg viewBox="0 0 10 8" fill="none" stroke="var(--accent)" strokeWidth="2" width={10} height={10}><path d="M1 4l2.5 2.5L9 1" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              <span style={{ marginLeft: l.code === i18n.language ? 0 : 18 }}>{l.full}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
