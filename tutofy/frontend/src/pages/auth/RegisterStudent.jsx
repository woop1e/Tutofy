import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../api/auth';

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
const STRENGTH_COLOR = ['', '#f24545', '#ffb732', '#4c6eff', '#22be70'];
const STEP_LABELS    = ['Learn', 'Level', 'Goal', 'Format', 'Schedule', 'Profile'];

const LEFT = [
  { title: 'Find the perfect tutor',     sub: 'Access tutors in every subject, from mathematics to music.' },
  { title: "We'll match you perfectly",  sub: 'Beginner or advanced — we find the right tutor for your level.' },
  { title: 'Achieve your goals faster',  sub: 'Set a clear goal and let our tutors guide you step by step.' },
  { title: 'Learn your way',             sub: 'Private lessons, group classes, or self-paced — your choice.' },
  { title: 'Flexible to your schedule',  sub: 'Morning, afternoon or evening — a tutor is always available.' },
  { title: "You're almost there!",        sub: 'Create your free account and start your learning journey today.' },
];

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'History', 'Geography', 'Literature', 'Programming', 'Music',
  'Art & Design', 'Languages', 'Business', 'Science',
];

const LEVELS = [
  {
    value: 'beginner', label: 'Beginner', desc: 'Just starting out — no prior knowledge needed',
    icon: (a) => (
      <svg viewBox="0 0 22 22" fill="none" stroke={a ? 'white' : '#8a90a1'} strokeWidth="1.6" className="w-5 h-5">
        <path d="M11 2L3 6.5l8 4 8-4L11 2z"/>
        <path d="M3 6.5v4l8 4 8-4v-4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: 'intermediate', label: 'Intermediate', desc: 'Some experience — ready to level up',
    icon: (a) => (
      <svg viewBox="0 0 22 22" fill="none" stroke={a ? 'white' : '#8a90a1'} strokeWidth="1.6" className="w-5 h-5">
        <path d="M3 17V9M7 17V5M11 17v-6M15 17V7M19 17V3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: 'advanced', label: 'Advanced', desc: 'Strong foundation — looking to master the subject',
    icon: (a) => (
      <svg viewBox="0 0 22 22" fill="none" stroke={a ? 'white' : '#8a90a1'} strokeWidth="1.6" className="w-5 h-5">
        <polygon points="11,2 13.9,8.09 20.5,9.04 16,13.4 17.18,20 11,16.81 4.82,20 6,13.4 1.5,9.04 8.1,8.09"/>
      </svg>
    ),
  },
];

const GOALS = [
  {
    value: 'exam', label: 'Pass an exam',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? 'white' : '#8a90a1'} strokeWidth="1.5" className="w-4 h-4">
        <rect x="2" y="2" width="14" height="14" rx="1.5"/><path d="M5 9l2.5 2.5L13 6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: 'skills', label: 'Improve skills',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? 'white' : '#8a90a1'} strokeWidth="1.5" className="w-4 h-4">
        <path d="M3 15V8M7 15V4M11 15v-6M15 15V6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: 'certificate', label: 'Get certified',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? 'white' : '#8a90a1'} strokeWidth="1.5" className="w-4 h-4">
        <circle cx="9" cy="8" r="4"/><path d="M6 13.5l-2 3 2-1 1 2 2-4M12 13.5l2 3-2-1-1 2-2-4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: 'fun', label: 'Learn for fun',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? 'white' : '#8a90a1'} strokeWidth="1.5" className="w-4 h-4">
        <circle cx="9" cy="9" r="7"/><path d="M6 10.5s1 1.5 3 1.5 3-1.5 3-1.5" strokeLinecap="round"/><circle cx="7" cy="8" r="0.8" fill={a ? 'white' : '#8a90a1'}/><circle cx="11" cy="8" r="0.8" fill={a ? 'white' : '#8a90a1'}/>
      </svg>
    ),
  },
  {
    value: 'career', label: 'Career change',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? 'white' : '#8a90a1'} strokeWidth="1.5" className="w-4 h-4">
        <rect x="2" y="6" width="14" height="10" rx="1.5"/><path d="M6 6V4a1 1 0 011-1h4a1 1 0 011 1v2M9 10v3M7.5 11.5h3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: 'academic', label: 'Academic help',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? 'white' : '#8a90a1'} strokeWidth="1.5" className="w-4 h-4">
        <path d="M3 4a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"/><path d="M6 8h6M6 11h4" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const FORMATS = [
  {
    value: 'one-on-one', label: '1-on-1 lessons', desc: 'Private sessions with a tutor',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? 'white' : '#8a90a1'} strokeWidth="1.5" className="w-4 h-4">
        <circle cx="9" cy="6" r="3"/><path d="M3 16a6 6 0 0112 0"/>
      </svg>
    ),
  },
  {
    value: 'group', label: 'Group classes', desc: 'Learn together with others',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? 'white' : '#8a90a1'} strokeWidth="1.5" className="w-4 h-4">
        <circle cx="6" cy="6" r="2.5"/><path d="M1 15a5 5 0 0110 0"/><circle cx="13" cy="6" r="2"/><path d="M13 10a4 4 0 013 4"/>
      </svg>
    ),
  },
  {
    value: 'self-paced', label: 'Self-paced', desc: 'Learn at your own speed',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? 'white' : '#8a90a1'} strokeWidth="1.5" className="w-4 h-4">
        <circle cx="9" cy="9" r="7"/><path d="M9 5v4l3 2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: 'any', label: 'Any format', desc: 'Open to all options',
    icon: (a) => (
      <svg viewBox="0 0 18 18" fill="none" stroke={a ? 'white' : '#8a90a1'} strokeWidth="1.5" className="w-4 h-4">
        <path d="M3 9h12M9 3l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = [
  { value: 'morning',   label: 'Morning',   desc: '6 AM – 12 PM' },
  { value: 'afternoon', label: 'Afternoon', desc: '12 PM – 6 PM' },
  { value: 'evening',   label: 'Evening',   desc: '6 PM – 10 PM' },
];

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[#4c5162] text-[13px] font-semibold mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[#f24545] text-[12px] mt-1 font-medium">{error}</p>}
    </div>
  );
}

const RegisterStudent = () => {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState({
    subjects: [], level: '', goals: [], format: '', days: [], times: [],
  });
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors]     = useState({});
  const [touched, setTouched]   = useState({});
  const [stepError, setStepError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState('');
  const { login } = useAuth();

  const toggle = (field, value) => {
    setPrefs(p => ({
      ...p,
      [field]: p[field].includes(value) ? p[field].filter(v => v !== value) : [...p[field], value],
    }));
    setStepError('');
  };

  const pick = (field, value) => {
    setPrefs(p => ({ ...p, [field]: value }));
    setStepError('');
  };

  const inputCls = (field) => {
    const hasError = touched[field] && errors[field];
    const isOk = touched[field] && !errors[field] && formData[field];
    return (
      'w-full bg-[#f3f4f7] border rounded-[10px] px-4 py-3 text-[14px] text-[#181b26] ' +
      'outline-none transition-colors placeholder:text-[#9b9fb0] ' +
      (hasError ? 'border-[#f24545] ' : isOk ? 'border-[#22be70] ' : 'border-[#f3f4f7] ') +
      'focus:border-[#4c6eff] focus:bg-white'
    );
  };

  const validateProfile = (data = formData) => {
    const errs = {};
    if (!data.name.trim())               errs.name = 'Full name is required';
    else if (data.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email)                     errs.email = 'Email is required';
    else if (!re.test(data.email))       errs.email = 'Enter a valid email address';
    if (!data.password)                  errs.password = 'Password is required';
    else if (data.password.length < 8)   errs.password = 'Password must be at least 8 characters';
    if (!data.confirmPassword)           errs.confirmPassword = 'Please confirm your password';
    else if (data.password !== data.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (touched[name]) validateProfile({ ...formData, [name]: value });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    validateProfile(formData);
  };

  const canProceed = () => {
    switch (step) {
      case 0: if (!prefs.subjects.length) { setStepError('Please select at least one subject'); return false; } break;
      case 1: if (!prefs.level)           { setStepError('Please select your current level');   return false; } break;
      case 2: if (!prefs.goals.length)    { setStepError('Please select at least one goal');    return false; } break;
      case 3: if (!prefs.format)          { setStepError('Please select a lesson format');      return false; } break;
      case 4: break; // optional
    }
    return true;
  };

  const next = async () => {
    setStepError('');
    if (step < 5 && !canProceed()) return;

    if (step === 5) {
      setTouched({ name: true, email: true, password: true, confirmPassword: true });
      if (!validateProfile()) return;
      setLoading(true);
      setApiError('');
      try {
        const res = await authAPI.register({
          name: formData.name.trim(),
          email: formData.email,
          password: formData.password,
          role: 'student',
        });
        login(res.token, formData.name.trim());
        setStep(6);
      } catch (err) {
        setApiError(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep(s => s + 1);
  };

  const strength = pwStrength(formData.password);

  const renderStep = () => {
    /* ── Step 0: Subjects ── */
    if (step === 0) return (
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map(s => {
          const sel = prefs.subjects.includes(s);
          return (
            <button key={s} type="button" onClick={() => toggle('subjects', s)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border-2 transition-all ${
                sel
                  ? 'bg-[#4c6eff] border-[#4c6eff] text-white'
                  : 'bg-white border-[#e3e3ed] text-[#4c5162] hover:border-[#4c6eff] hover:text-[#4c6eff]'
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
    );

    /* ── Step 1: Level ── */
    if (step === 1) return (
      <div className="space-y-3">
        {LEVELS.map(l => {
          const sel = prefs.level === l.value;
          return (
            <button key={l.value} type="button" onClick={() => pick('level', l.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-[12px] border-2 transition-all text-left ${
                sel ? 'border-[#4c6eff] bg-[rgba(76,110,255,0.04)]' : 'border-[#f0f0f5] bg-white hover:border-[#d5d8e3]'
              }`}
            >
              <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${sel ? 'bg-[#4c6eff]' : 'bg-[#f3f4f7]'}`}>
                {l.icon(sel)}
              </div>
              <div className="flex-1">
                <p className={`text-[14px] font-semibold ${sel ? 'text-[#4c6eff]' : 'text-[#181b26]'}`}>{l.label}</p>
                <p className="text-[12px] text-[#8a90a1]">{l.desc}</p>
              </div>
              {sel && (
                <div className="w-5 h-5 rounded-full bg-[#4c6eff] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8" className="w-3 h-3">
                    <path d="M2 5l2 2L8 3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    );

    /* ── Step 2: Goals ── */
    if (step === 2) return (
      <div className="grid grid-cols-2 gap-2.5">
        {GOALS.map(g => {
          const sel = prefs.goals.includes(g.value);
          return (
            <button key={g.value} type="button" onClick={() => toggle('goals', g.value)}
              className={`flex items-center gap-2.5 p-3.5 rounded-[12px] border-2 transition-all text-left ${
                sel ? 'border-[#4c6eff] bg-[rgba(76,110,255,0.04)]' : 'border-[#f0f0f5] bg-white hover:border-[#d5d8e3]'
              }`}
            >
              <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 ${sel ? 'bg-[#4c6eff]' : 'bg-[#f3f4f7]'}`}>
                {g.icon(sel)}
              </div>
              <span className={`text-[12px] font-semibold leading-tight ${sel ? 'text-[#4c6eff]' : 'text-[#181b26]'}`}>{g.label}</span>
            </button>
          );
        })}
      </div>
    );

    /* ── Step 3: Format ── */
    if (step === 3) return (
      <div className="grid grid-cols-2 gap-2.5">
        {FORMATS.map(f => {
          const sel = prefs.format === f.value;
          return (
            <button key={f.value} type="button" onClick={() => pick('format', f.value)}
              className={`flex flex-col items-start gap-2.5 p-4 rounded-[12px] border-2 transition-all text-left ${
                sel ? 'border-[#4c6eff] bg-[rgba(76,110,255,0.04)]' : 'border-[#f0f0f5] bg-white hover:border-[#d5d8e3]'
              }`}
            >
              <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${sel ? 'bg-[#4c6eff]' : 'bg-[#f3f4f7]'}`}>
                {f.icon(sel)}
              </div>
              <div>
                <p className={`text-[12px] font-semibold ${sel ? 'text-[#4c6eff]' : 'text-[#181b26]'}`}>{f.label}</p>
                <p className="text-[11px] text-[#8a90a1] mt-0.5">{f.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    );

    /* ── Step 4: Schedule ── */
    if (step === 4) return (
      <div className="space-y-5">
        <div>
          <p className="text-[12px] font-semibold text-[#4c5162] mb-2.5">Available days</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(d => {
              const sel = prefs.days.includes(d);
              return (
                <button key={d} type="button" onClick={() => toggle('days', d)}
                  className={`w-12 h-10 rounded-[9px] text-[12px] font-semibold border-2 transition-all ${
                    sel ? 'border-[#4c6eff] bg-[#4c6eff] text-white' : 'border-[#f0f0f5] bg-white text-[#4c5162] hover:border-[#d5d8e3]'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-[#4c5162] mb-2.5">Preferred time of day</p>
          <div className="grid grid-cols-3 gap-2.5">
            {TIMES.map(t => {
              const sel = prefs.times.includes(t.value);
              return (
                <button key={t.value} type="button" onClick={() => toggle('times', t.value)}
                  className={`p-3.5 rounded-[12px] border-2 transition-all text-center ${
                    sel ? 'border-[#4c6eff] bg-[rgba(76,110,255,0.04)]' : 'border-[#f0f0f5] bg-white hover:border-[#d5d8e3]'
                  }`}
                >
                  <p className={`text-[12px] font-semibold ${sel ? 'text-[#4c6eff]' : 'text-[#181b26]'}`}>{t.label}</p>
                  <p className="text-[10px] text-[#8a90a1] mt-0.5">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-[11px] text-[#b0b5c4]">This step is optional — you can update your availability later.</p>
      </div>
    );

    /* ── Step 5: Profile ── */
    if (step === 5) return (
      <div className="space-y-4">
        {apiError && (
          <div className="bg-[#f24545]/10 border border-[#f24545]/30 text-[#f24545] rounded-[10px] px-4 py-3 text-[13px]">
            {apiError}
          </div>
        )}
        <Field label="Full Name" error={touched.name && errors.name}>
          <input type="text" name="name" value={formData.name}
            onChange={handleChange} onBlur={handleBlur}
            placeholder="Jane Smith" className={inputCls('name')} />
        </Field>
        <Field label="Email address" error={touched.email && errors.email}>
          <input type="email" name="email" value={formData.email}
            onChange={handleChange} onBlur={handleBlur}
            placeholder="you@example.com" className={inputCls('email')} />
        </Field>
        <Field label="Password" error={touched.password && errors.password}>
          <input type="password" name="password" value={formData.password}
            onChange={handleChange} onBlur={handleBlur}
            placeholder="Min. 8 characters" className={inputCls('password')} />
          {formData.password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex-1 h-1 rounded-full transition-colors duration-300"
                    style={{ background: i <= strength ? STRENGTH_COLOR[strength] : '#e3e3ed' }} />
                ))}
              </div>
              <p className="text-[11px] mt-1 font-semibold" style={{ color: STRENGTH_COLOR[strength] }}>
                {STRENGTH_LABEL[strength]}{strength < 3 && ' — add uppercase, numbers or symbols'}
              </p>
            </div>
          )}
        </Field>
        <Field label="Confirm Password" error={touched.confirmPassword && errors.confirmPassword}>
          <input type="password" name="confirmPassword" value={formData.confirmPassword}
            onChange={handleChange} onBlur={handleBlur}
            placeholder="Repeat your password" className={inputCls('confirmPassword')} />
        </Field>
      </div>
    );

    /* ── Step 6: Success ── */
    if (step === 6) return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-[#22be70]/15 flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 32 32" fill="none" stroke="#22be70" strokeWidth="2.5" className="w-8 h-8">
            <circle cx="16" cy="16" r="14"/>
            <path d="M10 16l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="text-[20px] font-bold text-[#181b26] mb-2">You're all set!</h3>
        <p className="text-[#8a90a1] text-[14px] mb-8 leading-relaxed">
          Your student account is ready. Start exploring tutors and courses that match your goals.
        </p>
        <button
          onClick={() => window.location.href = '/tutors'}
          className="w-full bg-[#4c6eff] text-white text-[15px] font-bold py-3.5 rounded-[12px] shadow-[0px_4px_16px_0px_rgba(76,110,255,0.35)] hover:opacity-90 transition-opacity"
        >
          Explore Tutors →
        </button>
      </div>
    );
  };

  const leftContent = LEFT[Math.min(step, 5)];

  return (
    <div className="min-h-screen bg-[#f3f4f7] font-sans flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[960px] grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">

        {/* Left panel */}
        <div className="bg-dark rounded-[28px] text-white p-12 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-52 h-52 rounded-full bg-[#22be70]/20 blur-3xl" />
          <div className="relative z-10">
            <Link to="/" className="text-[#4c6eff] text-[22px] font-bold">Tutofy</Link>
            <p className="text-white/50 text-[12px] mt-0.5 mb-10">For Students</p>
            <h1 className="text-[32px] font-bold leading-tight mb-4">{leftContent.title}</h1>
            <p className="text-white/70 text-[15px] mb-10">{leftContent.sub}</p>
            <div className="space-y-4">
              {[
                { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M8 3v14M4 7h4M4 11h4" strokeLinecap="round"/></svg>, text: 'Access thousands of courses' },
                { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H7l-4 4V4z"/></svg>, text: 'Chat directly with your tutors' },
                { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M3 17V9M7 17V5M11 17v-6M15 17V7" strokeLinecap="round"/></svg>, text: 'Track your progress in real time' },
                { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M10 3L2 7l8 4 8-4-8-4z"/><path d="M2 7v6M6 9.5v4a4 4 0 008 0v-4" strokeLinecap="round"/></svg>, text: 'Earn certificates' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0">
                    {item.icon}
                  </div>
                  <p className="text-white/80 text-[14px]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="bg-white rounded-[28px] shadow-[0px_4px_24px_0px_rgba(0,0,0,0.08)] p-8">

          {/* Step indicator */}
          {step < 6 && (
            <div className="flex items-center gap-1 mb-6">
              {STEP_LABELS.map((label, i) => (
                <React.Fragment key={label}>
                  <div className={`flex items-center gap-1 ${i <= step ? 'text-[#4c6eff]' : 'text-[#c5c8d6]'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors flex-shrink-0 ${
                      i < step
                        ? 'bg-[#4c6eff] border-[#4c6eff] text-white'
                        : i === step
                        ? 'border-[#4c6eff] text-[#4c6eff] bg-white'
                        : 'border-[#d5d8e3] text-[#c5c8d6] bg-white'
                    }`}>
                      {i < step ? (
                        <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8" className="w-3 h-3">
                          <path d="M2 5l2 2L8 3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className="text-[10px] font-medium hidden sm:block">{label}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`flex-1 h-px mx-0.5 transition-colors ${i < step ? 'bg-[#4c6eff]' : 'bg-[#e3e3ed]'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Title */}
          {step < 6 && (
            <>
              <h2 className="text-[#181b26] text-[20px] font-bold mb-1">
                {step === 0 && 'What do you want to learn?'}
                {step === 1 && 'What is your current level?'}
                {step === 2 && 'What is your goal?'}
                {step === 3 && 'What lesson format do you prefer?'}
                {step === 4 && 'When are you available?'}
                {step === 5 && 'Complete your profile'}
              </h2>
              <p className="text-[#8a90a1] text-[13px] mb-5">
                {step === 0 && 'Select all subjects you want to study'}
                {step === 1 && 'We\'ll match you with the right tutors'}
                {step === 2 && 'You can pick more than one'}
                {step === 3 && 'Choose how you prefer to learn'}
                {step === 4 && 'Let tutors know when you\'re free'}
                {step === 5 && 'Create your account to get started'}
              </p>
            </>
          )}

          {renderStep()}

          {/* Step error */}
          {stepError && (
            <p className="text-[#f24545] text-[12px] mt-3 font-medium">{stepError}</p>
          )}

          {/* Navigation buttons */}
          {step < 6 && (
            <div className="mt-6 flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => { setStep(s => s - 1); setStepError(''); }}
                  className="flex-1 py-3 rounded-[12px] border border-[#e3e3ed] text-[#4c5162] text-[14px] font-semibold hover:bg-[#f3f4f7] transition-colors"
                >
                  ← Back
                </button>
              )}
              <button
                type="button"
                onClick={next}
                disabled={loading}
                className="flex-1 bg-[#4c6eff] text-white text-[15px] font-bold py-3.5 rounded-[12px] shadow-[0px_4px_16px_0px_rgba(76,110,255,0.35)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Creating account…' : step === 5 ? 'Create Account →' : 'Next →'}
              </button>
            </div>
          )}

          {/* Bottom links */}
          {step === 0 && (
            <div className="mt-6 pt-6 border-t border-[#f3f4f7] text-center space-y-2">
              <p className="text-[#8a90a1] text-[13px]">
                Already have an account?{' '}
                <Link to="/login" className="text-[#4c6eff] font-bold hover:underline">Sign in</Link>
              </p>
              <p className="text-[#8a90a1] text-[13px]">
                Want to teach?{' '}
                <Link to="/become-tutor" className="text-[#4c6eff] font-bold hover:underline">Become a tutor</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;
