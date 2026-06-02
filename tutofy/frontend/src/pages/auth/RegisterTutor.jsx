import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../api/auth';
import { mediaAPI } from '../../api/media';
import { usersAPI } from '../../api/users';
import CheckEmailScreen from './CheckEmailScreen';

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
  { id: 'Python',      abbr: 'Py', label: 'Python'      },
  { id: 'English',     abbr: 'En', label: 'English'     },
  { id: 'Physics',     abbr: 'Ph', label: 'Physics'     },
  { id: 'Chemistry',   abbr: 'Ch', label: 'Chemistry'   },
  { id: 'Biology',     abbr: 'Bi', label: 'Biology'     },
  { id: 'Geography',   abbr: 'Ge', label: 'Geography'   },
  { id: 'AI/ML',       abbr: 'AI', label: 'AI / ML'     },
  { id: 'Spanish',     abbr: 'Es', label: 'Spanish'     },
  { id: 'French',      abbr: 'Fr', label: 'French'      },
  { id: 'History',     abbr: 'Hi', label: 'History'     },
  { id: 'Music',       abbr: 'Mu', label: 'Music'       },
  { id: 'Economics',   abbr: 'Ec', label: 'Economics'   },
  { id: 'Design',      abbr: 'De', label: 'Design'      },
];

const TOTAL_STEPS = 4;

/* ─── component ─────────────────────────────────────────── */
const RegisterTutor = () => {
  const [step,     setStep]     = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [form,     setForm]     = useState({
    bio: '', experience: '', hourlyRate: '',
    name: '', email: '', password: '', confirmPassword: '',
    certificate: null,
  });
  const [errors,   setErrors]   = useState({});
  const [touched,  setTouched]  = useState({});
  const [stepErr,  setStepErr]  = useState('');
  const [loading,     setLoading]     = useState(false);
  const [apiErr,      setApiErr]      = useState('');
  const [done,        setDone]        = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');

  const fileRef    = useRef(null);
  const { login, user } = useAuth();
  const navigate   = useNavigate();

  const toggleSubject = (id) => {
    setSubjects(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    setStepErr('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (touched[name]) validateFields({ ...form, [name]: value });
  };

  const handleBlur = (name) => {
    setTouched(p => ({ ...p, [name]: true }));
    validateFields(form);
  };

  const validateFields = (data = form) => {
    const e = {};
    if (step === 1) {
      if (!data.bio.trim())                 e.bio        = 'Bio is required';
      else if (data.bio.trim().length < 20) e.bio        = 'At least 20 characters';
      if (!data.experience)                 e.experience = 'Years of experience is required';
      else if (isNaN(data.experience) || Number(data.experience) < 0) e.experience = 'Enter a valid number';
      if (!data.hourlyRate)                 e.hourlyRate = 'Hourly rate is required';
      else if (isNaN(data.hourlyRate) || Number(data.hourlyRate) <= 0) e.hourlyRate = 'Enter a valid rate';
    }
    if (step === 2) {
      if (!data.name.trim())               e.name            = 'Full name is required';
      if (!data.email)                     e.email           = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email';
      if (!data.password)                  e.password        = 'Password is required';
      else if (data.password.length < 8)   e.password        = 'At least 8 characters';
      if (!data.confirmPassword)           e.confirmPassword = 'Please confirm your password';
      else if (data.password !== data.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const touchAll = () => {
    if (step === 1) setTouched({ bio: true, experience: true, hourlyRate: true });
    if (step === 2) setTouched({ name: true, email: true, password: true, confirmPassword: true });
  };

  const canContinue = () => {
    setStepErr('');
    if (step === 0 && !subjects.length) { setStepErr('Pick at least one subject you teach'); return false; }
    if (step === 1) { touchAll(); return validateFields(form); }
    if (step === 2) { touchAll(); return validateFields(form); }
    return true;
  };

  const next = async () => {
    if (!canContinue()) return;

    /* step 2 → register account + update tutor profile */
    if (step === 2) {
      setLoading(true);
      setApiErr('');
      try {
        const res = await authAPI.register({
          name:     form.name.trim(),
          email:    form.email,
          password: form.password,
          role:     'tutor',
        });

        if (res.needs_verification) {
          localStorage.setItem('pendingVerify', JSON.stringify({
            name:       form.name.trim(),
            email:      form.email,
            role:       'tutor',
            bio:        form.bio.trim(),
            subjects,
            experience: parseInt(form.experience, 10) || 0,
            hourlyRate: parseFloat(form.hourlyRate) || 0,
          }));
          setVerifyEmail(form.email);
          return;
        }

        login(res.token, form.name.trim());

        /* update tutor profile (non-blocking if it fails) */
        try {
          const decoded = JSON.parse(atob(res.token.split('.')[1]));
          const userId  = decoded.user_id || decoded.id || decoded.sub;
          await usersAPI.updateTutorProfile(userId, {
            bio:              form.bio.trim(),
            subjects:         subjects,
            experience_years: parseInt(form.experience, 10) || 0,
            hourly_rate:      parseFloat(form.hourlyRate) || 0,
          });
        } catch {
          /* profile can be updated later from dashboard */
        }

        setStep(3);
      } catch (err) {
        setApiErr(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    /* step 3 → optional certificate upload then done */
    if (step === 3) {
      if (form.certificate) {
        setLoading(true);
        try {
          await mediaAPI.uploadFile(form.certificate, null, 'user_document');
        } catch {
          /* certificate can be uploaded later from dashboard */
        } finally {
          setLoading(false);
        }
      }
      setDone(true);
      return;
    }

    setStep(s => s + 1);
  };

  const back = () => {
    setStepErr('');
    setApiErr('');
    if (step === 0) navigate('/');
    else setStep(s => s - 1);
  };

  const strength  = pwStrength(form.password);
  const progress  = ((step + 1) / TOTAL_STEPS) * 100;

  const headings = [
    { title: 'What do you teach?',        sub: 'Pick your areas of expertise — students will find you by subject.'              },
    { title: 'Your teaching profile',     sub: 'Help students understand your background and what makes you a great tutor.'     },
    { title: 'Create your account',       sub: 'Almost there — set up your login credentials.'                                  },
    { title: 'Your credentials',          sub: 'Upload a certificate or qualification to build student trust. This is optional.' },
  ];

  if (verifyEmail) return <CheckEmailScreen email={verifyEmail} />;

  /* ── success screen ── */
  if (done) return (
    <div className="page-fade" style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32 }}>
          ✓
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', margin: '0 0 12px' }}>
          You're all set!
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 32px' }}>
          Your tutor account has been created. Head to your dashboard to start building courses and connecting with students.
        </p>
        <button
          onClick={() => navigate('/tutor/dashboard', { replace: true })}
          style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );

  /* ── step content ── */
  const renderContent = () => {

    /* STEP 0 — Subjects grid */
    if (step === 0) return (
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

    /* STEP 1 — Teaching profile */
    if (step === 1) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 560, margin: '0 auto', width: '100%' }}>
        {apiErr && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', borderRadius: 10, padding: '11px 14px', fontSize: 13 }}>
            {apiErr}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7 }}>About you</label>
          <textarea
            className="form-input"
            name="bio"
            value={form.bio}
            placeholder="Tell students about your background and teaching style… (min. 20 characters)"
            rows={4}
            style={{ resize: 'none' }}
            onChange={handleChange}
            onBlur={() => handleBlur('bio')}
          />
          {touched.bio && errors.bio && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--danger)' }}>{errors.bio}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7 }}>Years of experience</label>
            <input
              className="form-input"
              type="number"
              name="experience"
              value={form.experience}
              placeholder="e.g. 5"
              min="0"
              onChange={handleChange}
              onBlur={() => handleBlur('experience')}
            />
            {touched.experience && errors.experience && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--danger)' }}>{errors.experience}</p>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7 }}>Hourly rate (KZT)</label>
            <input
              className="form-input"
              type="number"
              name="hourlyRate"
              value={form.hourlyRate}
              placeholder="e.g. 5000"
              min="1"
              onChange={handleChange}
              onBlur={() => handleBlur('hourlyRate')}
            />
            {touched.hourlyRate && errors.hourlyRate && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--danger)' }}>{errors.hourlyRate}</p>}
          </div>
        </div>
      </div>
    );

    /* STEP 2 — Account */
    if (step === 2) return (
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
            name="name"
            value={form.name}
            placeholder="Jane Smith"
            onChange={handleChange}
            onBlur={() => handleBlur('name')}
          />
          {touched.name && errors.name && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--danger)' }}>{errors.name}</p>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7 }}>Email</label>
          <input
            className="form-input"
            type="email"
            name="email"
            value={form.email}
            placeholder="you@example.com"
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
          />
          {touched.email && errors.email && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--danger)' }}>{errors.email}</p>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7 }}>Password</label>
          <input
            className="form-input"
            type="password"
            name="password"
            value={form.password}
            placeholder="At least 8 characters"
            onChange={handleChange}
            onBlur={() => handleBlur('password')}
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

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 7 }}>Confirm password</label>
          <input
            className="form-input"
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            placeholder="Repeat your password"
            onChange={handleChange}
            onBlur={() => handleBlur('confirmPassword')}
          />
          {touched.confirmPassword && errors.confirmPassword && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--danger)' }}>{errors.confirmPassword}</p>}
        </div>
      </div>
    );

    /* STEP 3 — Certificate */
    if (step === 3) return (
      <div style={{ maxWidth: 480, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 16,
            padding: '48px 32px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color var(--t-base), background var(--t-base)',
            background: form.certificate ? 'var(--accent-soft)' : 'var(--surface)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = form.certificate ? 'var(--accent-soft)' : 'var(--surface-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = form.certificate ? 'var(--accent)' : 'var(--border)'; e.currentTarget.style.background = form.certificate ? 'var(--accent-soft)' : 'var(--surface)'; }}
          {...(form.certificate ? { style: { border: '2px dashed var(--accent)', borderRadius: 16, padding: '48px 32px', textAlign: 'center', cursor: 'pointer', background: 'var(--accent-soft)' } } : {})}
        >
          {form.certificate ? (
            <div>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 20 }}>✓</div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>{form.certificate.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>Click to change</p>
            </div>
          ) : (
            <div>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={22} height={22} style={{ color: 'var(--muted)' }}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Click to upload</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>PDF, JPG or PNG · up to 10 MB</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const f = e.target.files[0]; if (f) setForm(p => ({ ...p, certificate: f })); }} style={{ display: 'none' }} />
        <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
          Certificate is optional — you can add it later from your dashboard.
        </p>
      </div>
    );
  };

  const { title, sub } = headings[step] || {};

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

        {renderContent()}
      </div>

      {/* bottom nav */}
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
          {loading ? 'Please wait…' : step === 3 ? (form.certificate ? 'Upload & Finish' : 'Skip & Finish') : step === 2 ? 'Create account' : 'Continue'}
          {!loading && <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width={12} height={12}><path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>
      </div>

      {/* sign-in hint on step 0 */}
      {step === 0 && (
        <div style={{ textAlign: 'center', position: 'fixed', bottom: 72, left: 0, right: 0, fontSize: 13, color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          {' · '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Student registration</Link>
        </div>
      )}
    </div>
  );
};

export default RegisterTutor;
