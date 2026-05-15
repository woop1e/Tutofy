import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../api/auth';
import { mediaAPI } from '../../api/media';
import { usersAPI } from '../../api/users';

function Field({ label, error, hint, children }) {
  return (
    <div>
      <label className="block text-[#4c5162] text-[13px] font-semibold mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-[#9b9fb0] mt-1">{hint}</p>}
      {error && <p className="text-[#f24545] text-[12px] mt-1 font-medium">{error}</p>}
    </div>
  );
}

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
const STEP_LABELS = ['Account', 'Teaching Info', 'Certificate'];

const STEP_TITLES = ['Account Details', 'Teaching Info', 'Certificate', 'Welcome!'];
const STEP_SUBS = [
  'Create your tutor account',
  'Tell students about your expertise',
  'Upload your credentials (optional)',
  '',
];

const STEP_FIELDS = {
  0: ['name', 'email', 'password', 'confirmPassword'],
  1: ['bio', 'subjects', 'experience', 'hourlyRate'],
};

const RegisterTutor = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    bio: '', subjects: '', experience: '', hourlyRate: '',
    certificate: null,
  });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const fileRef = useRef(null);
  const { login, user } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (touched[name]) validateStep(step, { ...formData, [name]: value });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    validateStep(step, formData);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) setFormData(p => ({ ...p, certificate: file }));
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

  const validateStep = (s, data = formData) => {
    const errs = {};
    if (s === 0) {
      if (!data.name.trim())               errs.name = 'Full name is required';
      else if (data.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!data.email)                      errs.email = 'Email is required';
      else if (!emailRe.test(data.email))   errs.email = 'Enter a valid email address';
      if (!data.password)                   errs.password = 'Password is required';
      else if (data.password.length < 8)    errs.password = 'Password must be at least 8 characters';
      if (!data.confirmPassword)            errs.confirmPassword = 'Please confirm your password';
      else if (data.password !== data.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    if (s === 1) {
      if (!data.bio.trim())                errs.bio = 'Bio is required';
      else if (data.bio.trim().length < 20) errs.bio = 'Bio must be at least 20 characters';
      if (!data.subjects.trim())           errs.subjects = 'Enter at least one subject';
      if (!data.experience)                errs.experience = 'Years of experience is required';
      else if (isNaN(data.experience) || Number(data.experience) < 0) errs.experience = 'Enter a valid number';
      if (!data.hourlyRate)                errs.hourlyRate = 'Hourly rate is required';
      else if (isNaN(data.hourlyRate) || Number(data.hourlyRate) <= 0) errs.hourlyRate = 'Enter a valid rate';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const touchAllForStep = (s) => {
    const fields = STEP_FIELDS[s];
    if (!fields) return;
    const t = {};
    fields.forEach(f => (t[f] = true));
    setTouched(p => ({ ...p, ...t }));
  };

  const next = async () => {
    touchAllForStep(step);
    if (!validateStep(step)) return;

    if (step === 0) {
      setLoading(true);
      setApiError('');
      try {
        const response = await authAPI.register({
          name: formData.name.trim(),
          email: formData.email,
          password: formData.password,
          role: 'tutor',
        });
        login(response.token, formData.name.trim());
        setStep(1);
      } catch (err) {
        setApiError(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 1) {
      setLoading(true);
      setApiError('');
      try {
        const userId = user?.user_id || user?.id || user?.sub;
        await usersAPI.updateTutorProfile(userId, {
          bio: formData.bio.trim(),
          subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
          experience_years: parseInt(formData.experience, 10) || 0,
        });
      } catch {
        // non-blocking — profile can be updated later from dashboard
      } finally {
        setLoading(false);
      }
    }

    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (formData.certificate) {
      setLoading(true);
      setApiError('');
      try {
        await mediaAPI.uploadFile(formData.certificate, null, 'user_document');
      } catch {
        // non-blocking — certificate can be uploaded later from dashboard
      } finally {
        setLoading(false);
      }
    }
    window.open('/tutor/dashboard', '_blank', 'noopener,noreferrer');
    setStep(3);
  };

  const strength = pwStrength(formData.password);

  const renderStep = () => {
    if (step === 0) return (
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

    if (step === 1) return (
      <div className="space-y-4">
        <Field label="About you" error={touched.bio && errors.bio}>
          <textarea name="bio" value={formData.bio}
            onChange={handleChange} onBlur={handleBlur}
            placeholder="Tell students about your background and teaching style… (min. 20 characters)"
            rows={4} className={inputCls('bio') + ' resize-none'} />
        </Field>

        <Field label="Subjects you teach" error={touched.subjects && errors.subjects}
          hint="Separate multiple subjects with commas">
          <input type="text" name="subjects" value={formData.subjects}
            onChange={handleChange} onBlur={handleBlur}
            placeholder="e.g. Math, Physics, English" className={inputCls('subjects')} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Years of experience" error={touched.experience && errors.experience}>
            <input type="number" name="experience" value={formData.experience}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="e.g. 5" min="0" className={inputCls('experience')} />
          </Field>
          <Field label="Hourly rate ($)" error={touched.hourlyRate && errors.hourlyRate}>
            <input type="number" name="hourlyRate" value={formData.hourlyRate}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="e.g. 30" min="1" className={inputCls('hourlyRate')} />
          </Field>
        </div>
      </div>
    );

    if (step === 2) return (
      <div className="space-y-5">
        <div>
          <p className="text-[#4c5162] text-[13px] font-semibold mb-1">Teaching Certificate</p>
          <p className="text-[#9b9fb0] text-[12px] mb-3">Upload your teaching certificate or relevant qualification</p>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-[#d5d8e3] rounded-[14px] p-8 text-center cursor-pointer hover:border-[#4c6eff] hover:bg-[#f5f6ff] transition-colors"
          >
            {formData.certificate ? (
              <div>
                <p className="text-[#4c6eff] font-semibold text-[14px]">✓ {formData.certificate.name}</p>
                <p className="text-[#9b9fb0] text-[12px] mt-1">Click to change</p>
              </div>
            ) : (
              <div>
                <p className="text-3xl mb-2">📄</p>
                <p className="text-[#4c5162] text-[14px] font-medium">Click to upload</p>
                <p className="text-[#9b9fb0] text-[12px] mt-1">PDF, JPG or PNG · up to 10 MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="hidden" />
        </div>

        {apiError && (
          <div className="bg-[#f24545]/10 border border-[#f24545]/30 text-[#f24545] rounded-[10px] px-4 py-3 text-[13px]">
            {apiError}
          </div>
        )}

        <p className="text-[#9b9fb0] text-[12px]">Certificate is optional — you can add it later from your dashboard.</p>
      </div>
    );

    if (step === 3) return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-[#22be70]/15 flex items-center justify-center text-3xl mx-auto mb-5">
          ✓
        </div>
        <h3 className="text-[20px] font-bold text-[#181b26] mb-2">You're all set!</h3>
        <p className="text-[#8a90a1] text-[14px] mb-8 leading-relaxed">
          Your tutor account has been created. Open your LMS to start building courses and connecting with students.
        </p>
        <button
          onClick={() => window.open('/tutor/dashboard', '_blank', 'noopener,noreferrer')}
          className="w-full bg-[#4c6eff] text-white text-[15px] font-bold py-3.5 rounded-[12px] shadow-[0px_4px_16px_0px_rgba(76,110,255,0.35)] hover:opacity-90 transition-opacity"
        >
          Open Tutor LMS →
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f3f4f7] font-sans flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[960px] grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">

        {/* Left panel */}
        <div className="bg-dark rounded-[28px] text-white p-12 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-52 h-52 rounded-full bg-purple/20 blur-3xl" />
          <div className="relative z-10">
            <Link to="/" className="text-primary text-[22px] font-bold">Tutofy</Link>
            <p className="text-white/50 text-[12px] mt-0.5 mb-10">Tutor Portal</p>
            <h1 className="text-[32px] font-bold leading-tight mb-4">
              Share your knowledge.<br />
              Grow your income.
            </h1>
            <p className="text-white/70 text-[15px] mb-10">
              Join thousands of tutors on Tutofy. Create courses, manage students, and build your teaching career.
            </p>
            <div className="space-y-4">
              {[
                { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M8 3v14M4 7h4M4 11h4" strokeLinecap="round"/></svg>, text: 'Create and publish courses' },
                { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H7l-4 4V4z"/></svg>, text: 'Message students directly' },
                { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M3 17V9M7 17V5M11 17v-6M15 17V7" strokeLinecap="round"/></svg>, text: 'Track student progress' },
                { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M14 3l3 3L7 16H4v-3L14 3z" strokeLinejoin="round"/></svg>, text: 'Grade assignments' },
              ].map((item) => (
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
          {step < 3 && (
            <div className="flex items-center gap-1 mb-6">
              {STEP_LABELS.map((label, i) => (
                <React.Fragment key={label}>
                  <div className={`flex items-center gap-1.5 ${i <= step ? 'text-[#4c6eff]' : 'text-[#c5c8d6]'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors ${
                      i < step
                        ? 'bg-[#4c6eff] border-[#4c6eff] text-white'
                        : i === step
                        ? 'border-[#4c6eff] text-[#4c6eff] bg-white'
                        : 'border-[#d5d8e3] text-[#c5c8d6] bg-white'
                    }`}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span className="text-[11px] font-medium hidden sm:block">{label}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`flex-1 h-px mx-1 transition-colors ${i < step ? 'bg-[#4c6eff]' : 'bg-[#e3e3ed]'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          <h2 className="text-[#181b26] text-[22px] font-bold mb-1">{STEP_TITLES[step]}</h2>
          {STEP_SUBS[step] && (
            <p className="text-[#8a90a1] text-[13px] mb-6">{STEP_SUBS[step]}</p>
          )}

          {renderStep()}

          {step < 3 && (
            <div className={`mt-6 flex gap-3 ${step > 0 ? '' : ''}`}>
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-3 rounded-[12px] border border-[#e3e3ed] text-[#4c5162] text-[14px] font-semibold hover:bg-[#f3f4f7] transition-colors"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={step === 2 ? handleSubmit : next}
                disabled={loading}
                className="flex-1 bg-[#4c6eff] text-white text-[15px] font-bold py-3.5 rounded-[12px] shadow-[0px_4px_16px_0px_rgba(76,110,255,0.35)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Creating account…' : step === 2 ? 'Create Account →' : 'Next →'}
              </button>
            </div>
          )}

          {step === 0 && (
            <div className="mt-6 pt-6 border-t border-[#f3f4f7] text-center space-y-2">
              <p className="text-[#8a90a1] text-[13px]">
                Already have an account?{' '}
                <a href="/login" target="_blank" rel="noopener noreferrer"
                  className="text-[#4c6eff] font-bold hover:underline">Sign in</a>
              </p>
              <p className="text-[#8a90a1] text-[13px]">
                Looking to learn?{' '}
                <Link to="/register" className="text-[#4c6eff] font-bold hover:underline">Student registration</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterTutor;
