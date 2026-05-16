import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../api/auth';

/* ─── helpers ─────────────────────────────────────────── */
function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', '#ef4444', '#f59e0b', '#0d9488', '#22c55e'];

/* ─── data ─────────────────────────────────────────────── */
const SUBJECTS = [
  { id: 'Mathematics', abbr: 'M',  label: 'Mathematics' },
  { id: 'Python',      abbr: 'Py', label: 'Python'       },
  { id: 'English',     abbr: 'En', label: 'English'      },
  { id: 'Physics',     abbr: 'Ph', label: 'Physics'      },
  { id: 'Chemistry',   abbr: 'Ch', label: 'Chemistry'    },
  { id: 'Biology',     abbr: 'Bi', label: 'Biology'      },
  { id: 'Geography',   abbr: 'Ge', label: 'Geography'    },
  { id: 'AI/ML',       abbr: 'AI', label: 'AI / ML'      },
  { id: 'Spanish',     abbr: 'Es', label: 'Spanish'      },
  { id: 'French',      abbr: 'Fr', label: 'French'       },
  { id: 'History',     abbr: 'Hi', label: 'History'      },
  { id: 'Music',       abbr: 'Mu', label: 'Music'        },
  { id: 'Economics',   abbr: 'Ec', label: 'Economics'    },
  { id: 'Design',      abbr: 'De', label: 'Design'       },
];

const LEVELS = [
  {
    id: 'beginner', label: 'Beginner',
    desc: 'I am just getting started and want to learn the fundamentals from scratch.',
    icon: (
      <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width={22} height={22}>
        <path d="M11 2L3 6.5l8 4 8-4L11 2z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 6.5v4l8 4 8-4v-4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'intermediate', label: 'Intermediate',
    desc: 'I know the basics and want to deepen my understanding and tackle harder problems.',
    icon: (
      <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width={22} height={22}>
        <path d="M3 17V9M7 17V5M11 17v-6M15 17V7M19 17V3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'advanced', label: 'Advanced',
    desc: 'I am preparing for exams, competitions or specialised topics.',
    icon: (
      <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" width={22} height={22}>
        <polygon points="11,2 13.9,8.09 20.5,9.04 16,13.4 17.18,20 11,16.81 4.82,20 6,13.4 1.5,9.04 8.1,8.09"/>
      </svg>
    ),
  },
];

/* ─── step config ────────────────────────────────────────── */
// step 0 = role, 1 = subjects, 2 = level, 3 = account
const TOTAL_STEPS = 4;

/* ─── component ─────────────────────────────────────────── */
const RegisterStudent = () => {
  const [step,    setStep]    = useState(0);
  const [role,    setRole]    = useState('');          // 'student' | 'tutor'
  const [subjects, setSubjects] = useState([]);
  const [level,   setLevel]   = useState('');
  const [form,    setForm]    = useState({ name: '', email: '', password: '', terms: false });
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [stepErr, setStepErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const { login } = useAuth();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const toggleSubject = (id) => {
    setSubjects(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    setStepErr('');
  };

  const validate = (data = form) => {
    const e = {};
    if (!data.name.trim())         e.name     = 'Full name is required';
    if (!data.email)               e.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email';
    if (!data.password)            e.password = 'Password is required';
    else if (data.password.length < 8) e.password = 'At least 8 characters';
    if (!data.terms)               e.terms    = 'You must agree to the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canContinue = () => {
    setStepErr('');
    if (step === 0 && !role)             { setStepErr('Please choose how you want to use Tutofy'); return false; }
    if (step === 1 && !subjects.length)  { setStepErr('Please select at least one subject');       return false; }
    if (step === 2 && !level)            { setStepErr('Please select your current level');          return false; }
    return true;
  };

  const next = async () => {
    if (!canContinue()) return;

    /* role selected → tutor: hand off to the tutor registration flow */
    if (step === 0 && role === 'tutor') {
      navigate('/become-tutor');
      return;
    }

    if (step === 3) {
      setTouched({ name: true, email: true, password: true, terms: true });
      if (!validate()) return;
      setLoading(true); setApiErr('');
      try {
        const finalRole = role === 'tutor' ? 'tutor' : 'student';
        const res = await authAPI.register({
          name:     form.name.trim(),
          email:    form.email,
          password: form.password,
          role:     finalRole,
        });
        login(res.token, form.name.trim());
        const dest = redirectTo || (finalRole === 'tutor' ? '/tutor/dashboard' : '/student/dashboard');
        navigate(dest, { replace: true });
      } catch (err) {
        setApiErr(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep(s => s + 1);
  };

  const back = () => {
    setStepErr('');
    if (step === 0) navigate('/');
    else setStep(s => s - 1);
  };

  const strength = pwStrength(form.password);

  /* ── step content ── */
  const renderContent = () => {
    /* STEP 0 — Role */
    if (step === 0) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            {
              id: 'student',
              icon: <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" width={28} height={28}><path d="M14 3L4 8.5l10 5 10-5L14 3z" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 8.5v5l10 5 10-5v-5" strokeLinecap="round"/></svg>,
              title: 'I want to learn',
              desc: 'Find a tutor, enroll in courses, take lessons, and get graded on assignments.',
            },
            {
              id: 'tutor',
              icon: <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" width={28} height={28}><rect x="4" y="7" width="20" height="14" rx="2"/><path d="M9 7V5a1 1 0 011-1h8a1 1 0 011 1v2M14 13v3M12 15h4" strokeLinecap="round"/></svg>,
              title: 'I want to teach',
              desc: 'Create courses, schedule lessons, grade student work, and earn from your expertise.',
            },
          ].map(r => {
            const sel = role === r.id;
            return (
              <button key={r.id} onClick={() => { setRole(r.id); setStepErr(''); }}
                style={{
                  padding: '28px 24px', borderRadius: 16, textAlign: 'left', cursor: 'pointer',
                  border: sel ? '2px solid var(--accent)' : '2px solid var(--border)',
                  background: sel ? 'var(--accent-soft)' : 'var(--surface)',
                  transition: 'all var(--t-base)',
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                  background: sel ? 'var(--accent)' : 'var(--surface-hover)',
                  color: sel ? '#fff' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background var(--t-base), color var(--t-base)',
                }}>
                  {r.icon}
                </div>
                <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>{r.title}</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>{r.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    );

    /* STEP 1 — Subjects */
    if (step === 1) return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {SUBJECTS.map(s => {
          const sel = subjects.includes(s.id);
          return (
            <button key={s.id} onClick={() => toggleSubject(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                border: sel ? '2px solid var(--accent)' : '2px solid var(--border)',
                background: sel ? 'var(--accent-soft)' : 'var(--surface)',
                transition: 'all var(--t-fast)',
              }}>
              <span style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, letterSpacing: '-0.02em',
                background: sel ? 'var(--accent)' : 'var(--surface-hover)',
                color: sel ? '#fff' : 'var(--muted)',
                transition: 'background var(--t-fast), color var(--t-fast)',
              }}>{s.abbr}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: sel ? 'var(--accent)' : 'var(--text)' }}>{s.label}</span>
            </button>
          );
        })}
      </div>
    );

    /* STEP 2 — Level */
    if (step === 2) return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {LEVELS.map(l => {
          const sel = level === l.id;
          return (
            <button key={l.id} onClick={() => { setLevel(l.id); setStepErr(''); }}
              style={{
                padding: '24px 20px', borderRadius: 16, textAlign: 'left', cursor: 'pointer',
                border: sel ? '2px solid var(--accent)' : '2px solid var(--border)',
                background: sel ? 'var(--accent-soft)' : 'var(--surface)',
                transition: 'all var(--t-base)',
              }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, marginBottom: 14,
                background: sel ? 'var(--accent)' : 'var(--surface-hover)',
                color: sel ? '#fff' : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background var(--t-base), color var(--t-base)',
              }}>
                {l.icon}
              </div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{l.label}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>{l.desc}</p>
            </button>
          );
        })}
      </div>
    );

    /* STEP 3 — Account */
    if (step === 3) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 440, margin: '0 auto', width: '100%' }}>
        {apiErr && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', borderRadius: 10, padding: '11px 14px', fontSize: 13 }}>
            {apiErr}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7 }}>Full name</label>
          <input
            className="form-input"
            name="name" value={form.name} placeholder="Alex Rivera"
            onChange={e => { setForm(p => ({ ...p, name: e.target.value })); if (touched.name) validate({ ...form, name: e.target.value }); }}
            onBlur={() => { setTouched(p => ({ ...p, name: true })); validate(form); }}
          />
          {touched.name && errors.name && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--danger)' }}>{errors.name}</p>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7 }}>Email</label>
          <input
            className="form-input"
            type="email" name="email" value={form.email} placeholder="you@example.com"
            onChange={e => { setForm(p => ({ ...p, email: e.target.value })); if (touched.email) validate({ ...form, email: e.target.value }); }}
            onBlur={() => { setTouched(p => ({ ...p, email: true })); validate(form); }}
          />
          {touched.email && errors.email && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--danger)' }}>{errors.email}</p>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7 }}>Password</label>
          <input
            className="form-input"
            type="password" name="password" value={form.password} placeholder="At least 8 characters"
            onChange={e => { setForm(p => ({ ...p, password: e.target.value })); if (touched.password) validate({ ...form, password: e.target.value }); }}
            onBlur={() => { setTouched(p => ({ ...p, password: true })); validate(form); }}
          />
          {form.password && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? STRENGTH_COLOR[strength] : 'var(--border)', transition: 'background var(--t-base)' }} />
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 11, color: STRENGTH_COLOR[strength] || 'var(--muted)', fontWeight: 600 }}>{STRENGTH_LABEL[strength]}</p>
            </div>
          )}
          {touched.password && errors.password && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--danger)' }}>{errors.password}</p>}
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text-2)' }}>
          <input type="checkbox" checked={form.terms} style={{ accentColor: 'var(--accent)', marginTop: 2, flexShrink: 0 }}
            onChange={e => { setForm(p => ({ ...p, terms: e.target.checked })); if (touched.terms) validate({ ...form, terms: e.target.checked }); }}
          />
          <span>
            I agree to Tutofy's{' '}
            <a style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
            {' '}and{' '}
            <a style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>.
          </span>
        </label>
        {touched.terms && errors.terms && <p style={{ margin: '-8px 0 0', fontSize: 12, color: 'var(--danger)' }}>{errors.terms}</p>}
      </div>
    );
  };

  /* ── headings ── */
  const headings = [
    { title: 'How will you use Tutofy?',                          sub: 'You can switch or do both later. This sets your default workspace.' },
    { title: role === 'tutor' ? 'What do you teach?'             : 'What do you want to learn?',
      sub:  role === 'tutor' ? 'Pick your areas of expertise — students will find you by subject.'
                              : "Pick everything that interests you — we'll match you with the right tutors." },
    { title: "What's your level?",                                sub: 'This helps us match tutors and lesson plans to your starting point.' },
    { title: 'Create your account',                               sub: "You're almost there — just a few details." },
  ];
  const { title, sub } = headings[step] || {};
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="page-fade" style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* thin progress bar */}
      <div style={{ height: 3, background: 'var(--border)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div style={{ height: '100%', background: 'var(--accent)', width: `${progress}%`, transition: 'width var(--t-slow)' }} />
      </div>

      {/* topbar */}
      <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/logo.svg" alt="tutofy" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16 }}>tutofy</span>
        </Link>
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>Step {step + 1} of {TOTAL_STEPS}</span>
      </div>

      {/* main */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 32px 120px' }}>
        {/* heading */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ margin: '0 0 10px', fontSize: 32, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>{title}</h1>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--muted)' }}>{sub}</p>
        </div>

        {/* step error */}
        {stepErr && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
            {stepErr}
          </div>
        )}

        {/* content */}
        {renderContent()}
      </div>

      {/* bottom nav — fixed */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px',
      }}>
        <button onClick={back}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-xs)' }}>
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width={12} height={12}><path d="M8 2L4 6l4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>

        <button onClick={next} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 28px', borderRadius: 'var(--r-md)', border: 'none', background: loading ? 'var(--muted)' : 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background var(--t-fast)' }}>
          {loading ? 'Creating…' : step === 3 ? 'Create account' : 'Continue'}
          {!loading && <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width={12} height={12}><path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>
      </div>

      {step === 0 && (
        <div style={{ textAlign: 'center', position: 'fixed', bottom: 72, left: 0, right: 0, fontSize: 13, color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </div>
      )}
    </div>
  );
};

export default RegisterStudent;
