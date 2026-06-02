import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { usersAPI } from '../../api/users';
import { mediaAPI } from '../../api/media';
import { authAPI } from '../../api/auth';

/* ── Constants ────────────────────────────────────────────── */
const SUBJECT_OPTIONS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Russian', 'Kazakh',
  'History', 'Geography', 'Computer Science', 'Python', 'JavaScript', 'AI / ML',
  'Economics', 'Music', 'Design', 'French', 'Spanish', 'Literature', 'Programming',
];

const LANGUAGE_OPTIONS = [
  'English', 'Russian', 'Kazakh', 'German', 'French', 'Spanish', 'Chinese', 'Arabic', 'Turkish',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ID_DOC_TYPES = [
  { value: 'passport',       label: 'Passport' },
  { value: 'id_card',        label: 'National ID Card (Удостоверение)' },
  { value: 'driver_license', label: "Driver's License" },
  { value: 'diploma',        label: 'Diploma / Degree' },
  { value: 'other',          label: 'Other Document' },
];
const ID_DOC_LABEL = Object.fromEntries(ID_DOC_TYPES.map(t => [t.value, t.label]));

/* ── ChipSelect ───────────────────────────────────────────── */
function ChipSelect({ label, required, hint, options, value, onChange, placeholder, allowCustom = true, error }) {
  const [query,   setQuery]   = useState('');
  const [open,    setOpen]    = useState(false);
  const inputRef  = useRef(null);

  const filtered = options.filter(
    o => !value.includes(o) && o.toLowerCase().includes(query.toLowerCase())
  );

  const add = (item) => {
    const t = item.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const remove = (item) => onChange(value.filter(x => x !== item));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim() && allowCustom) add(query.trim());
      else if (filtered.length > 0) add(filtered[0]);
    }
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Backspace' && !query && value.length) remove(value[value.length - 1]);
  };

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: hint ? 4 : 7 }}>
          {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      {hint && <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, marginTop: 0 }}>{hint}</p>}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
            minHeight: 44, padding: '6px 10px',
            border: `1.5px solid ${error ? 'var(--danger)' : open ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 10, background: 'white', cursor: 'text',
            transition: 'border-color 120ms',
          }}
          onClick={() => { inputRef.current?.focus(); setOpen(true); }}
        >
          {value.map(v => (
            <span key={v} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'var(--accent-soft)', color: 'var(--accent)',
              borderRadius: 99, padding: '3px 10px 3px 12px', fontSize: 12, fontWeight: 600,
            }}>
              {v}
              <button type="button"
                onClick={e => { e.stopPropagation(); remove(v); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: '0 2px', fontWeight: 700, fontSize: 15, lineHeight: 1 }}
              >
                x
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, minWidth: 100, flex: 1, color: 'var(--text)', fontFamily: 'inherit' }}
          />
        </div>

        {open && (filtered.length > 0 || (allowCustom && query.trim() && !value.includes(query.trim()))) && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
            background: 'white', border: '1px solid var(--border)', borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)', maxHeight: 200, overflowY: 'auto',
          }}>
            {filtered.slice(0, 8).map(o => (
              <button key={o} type="button" onMouseDown={e => { e.preventDefault(); add(o); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 13, color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {o}
              </button>
            ))}
            {allowCustom && query.trim() && !value.includes(query.trim()) &&
              !options.find(o => o.toLowerCase() === query.trim().toLowerCase()) && (
              <button type="button" onMouseDown={e => { e.preventDefault(); add(query.trim()); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 13, color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid var(--border)' }}
              >
                + Add "{query.trim()}"
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

/* ── UploadButton ─────────────────────────────────────────── */
function UploadButton({ label, accept, uploading, onFile }) {
  const ref = useRef();
  return (
    <>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = ''; }} />
      <button type="button" onClick={() => ref.current.click()} disabled={uploading}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
          border: '1px solid var(--border)', borderRadius: 10,
          fontSize: 12, fontWeight: 600, color: 'var(--text-2)',
          background: 'white', cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 120ms', opacity: uploading ? 0.6 : 1,
        }}
        onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
      >
        {uploading ? (
          <div style={{ width: 13, height: 13, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        ) : (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width={13} height={13}>
            <path d="M8 10V3M5 6l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 13h12" strokeLinecap="round"/>
          </svg>
        )}
        {uploading ? 'Uploading...' : label}
      </button>
    </>
  );
}

/* ── Section / Field ──────────────────────────────────────── */
const Section = ({ title, children }) => (
  <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 20px' }}>{title}</h3>
    {children}
  </div>
);

const Field = ({ label, hint, required, error, children, style }) => (
  <div style={{ marginBottom: 16, ...style }}>
    {label && (
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: hint ? 4 : 7 }}>
        {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
      </label>
    )}
    {hint && <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, marginTop: 0 }}>{hint}</p>}
    {children}
    {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--danger)' }}>{error}</p>}
  </div>
);

const getInputStyle = (hasError) => ({
  width: '100%', border: `1px solid ${hasError ? 'var(--danger)' : 'var(--border)'}`,
  borderRadius: 10, padding: '10px 12px', fontSize: 13, color: 'var(--text)',
  outline: 'none', background: 'white', fontFamily: 'inherit', boxSizing: 'border-box',
  transition: 'border-color 120ms',
});

/* ── Main component ───────────────────────────────────────── */
const TutorProfileSetup = () => {
  const { user, isAuthenticated, role, isLoading } = useAuth();
  const navigate = useNavigate();

  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState('');
  const [profileStatus, setProfileStatus] = useState('pending');
  const [isFirstTime,   setIsFirstTime]   = useState(false);
  const [fieldErrors,   setFieldErrors]   = useState({});

  const [photoUploading,  setPhotoUploading]  = useState(false);
  const [photoError,      setPhotoError]      = useState(false);
  const [googleConnected, setGoogleConnected] = useState(null);
  const [certUploading,   setCertUploading]   = useState(false);
  const [certDocs,        setCertDocs]        = useState([]);
  const [idDocs,          setIdDocs]          = useState([]);
  const [idDocUploading,  setIdDocUploading]  = useState(false);
  const [idDocType,       setIdDocType]       = useState('passport');

  const [subjects,  setSubjects]  = useState([]);
  const [languages, setLanguages] = useState([]);

  const [form, setForm] = useState({
    name: '', phone: '', location: '', photo_url: '', bio: '',
    student_level: '', lesson_type: '',
    experience_years: '', hourly_price: '', education: '', certificates: '',
    available_days: [], available_time_start: '09:00', available_time_end: '18:00', timezone: 'UTC+5',
  });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || role !== 'tutor')) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, role, navigate]);

  useEffect(() => {
    if (isLoading) return; // wait for auth context to finish loading from localStorage
    const uid = user?.user_id;
    if (!uid) { setLoading(false); return; }
    usersAPI.getTutorProfile(uid)
      .then(data => {
        setProfileStatus(data.status || 'pending');

        const allCerts  = data.certificates || [];
        const idDocItems = allCerts
          .filter(c => c.startsWith('idoc:'))
          .map(c => {
            const rest = c.slice(5);
            const sep  = rest.indexOf(':');
            const type = rest.slice(0, sep);
            const url  = rest.slice(sep + 1);
            return { type, url, name: decodeURIComponent(url.split('/').pop().split('?')[0]) };
          });
        setIdDocs(idDocItems);
        const textCerts = allCerts.filter(c => !c.startsWith('http') && !c.startsWith('idoc:'));
        const urlCerts  = allCerts
          .filter(c => c.startsWith('http'))
          .map(url => ({ url, name: decodeURIComponent(url.split('/').pop().split('?')[0]) }));
        setCertDocs(urlCerts);

        const subs  = data.subjects || [];
        const langs = data.teaching_language
          ? data.teaching_language.split(',').map(s => s.trim()).filter(Boolean)
          : [];
        setSubjects(subs);
        setLanguages(langs);
        // phone/student_level are required in the profile form but not collected during /become-tutor registration
        setIsFirstTime(!data.phone || !data.student_level);

        // Fall back to registration draft for fields not yet saved
        const draft = (() => {
          try { return JSON.parse(localStorage.getItem('pendingVerify') || 'null'); }
          catch { return null; }
        })();

        setForm({
          name:                 data.name || user?.name || '',
          phone:                data.phone || '',
          location:             data.location || '',
          photo_url:            data.photo_url || '',
          bio:                  data.bio || draft?.bio || '',
          student_level:        data.student_level || '',
          lesson_type:          data.lesson_type || '',
          experience_years:     data.experience_years ? String(data.experience_years) : (draft?.experience ? String(draft.experience) : ''),
          hourly_price:         data.hourly_price ? String(data.hourly_price) : (draft?.hourlyRate ? String(draft.hourlyRate) : ''),
          education:            data.education || '',
          certificates:         textCerts.join(', '),
          available_days:       data.available_days || [],
          available_time_start: data.available_time_start || '09:00',
          available_time_end:   data.available_time_end || '18:00',
          timezone:             data.timezone || 'UTC+5',
        });
        if (!subs.length && draft?.subjects?.length) setSubjects(draft.subjects);
      })
      .catch(() => {
        setIsFirstTime(true);
        setForm(f => ({ ...f, name: user?.name || '' }));
      })
      .finally(() => setLoading(false));
  }, [user, isLoading]);

  useEffect(() => {
    if (!user?.user_id) return;
    const check = () => {
      authAPI.getGoogleStatus()
        .then(d => setGoogleConnected(d.connected))
        .catch(() => setGoogleConnected(false));
    };
    check();
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(f => ({ ...f, [name]: '' }));
  };

  const toggleDay = day => {
    setForm(f => ({
      ...f,
      available_days: f.available_days.includes(day)
        ? f.available_days.filter(d => d !== day)
        : [...f.available_days, day],
    }));
  };

  const handlePhotoUpload = async file => {
    setPhotoUploading(true); setError('');
    try {
      const up  = await mediaAPI.uploadFile(file, null, 'user_document');
      if (!up?.file_id) throw new Error('No file ID');
      const dl  = await mediaAPI.getDownloadURL(up.file_id);
      if (!dl?.url) throw new Error('No URL');
      setForm(f => ({ ...f, photo_url: dl.url }));
      setPhotoError(false);
    } catch (err) {
      setError(`Photo upload failed: ${err?.message || 'Unknown error'}`);
    } finally { setPhotoUploading(false); }
  };

  const handleCertUpload = async file => {
    setCertUploading(true); setError('');
    try {
      const up  = await mediaAPI.uploadFile(file, null, 'user_document');
      if (!up?.file_id) throw new Error('No file ID');
      const dl  = await mediaAPI.getDownloadURL(up.file_id);
      if (!dl?.url) throw new Error('No URL');
      setCertDocs(prev => [...prev, { url: dl.url, name: file.name }]);
    } catch (err) {
      setError(`Certificate upload failed: ${err?.message || 'Unknown error'}`);
    } finally { setCertUploading(false); }
  };

  const removeCertDoc = i => setCertDocs(prev => prev.filter((_, idx) => idx !== i));

  const handleIdDocUpload = async file => {
    setIdDocUploading(true); setError('');
    try {
      const up = await mediaAPI.uploadFile(file, null, 'user_document');
      if (!up?.file_id) throw new Error('No file ID');
      const dl = await mediaAPI.getDownloadURL(up.file_id);
      if (!dl?.url) throw new Error('No URL');
      setIdDocs(prev => [...prev, { type: idDocType, url: dl.url, name: file.name }]);
    } catch (err) {
      setError(`Document upload failed: ${err?.message || 'Unknown error'}`);
    } finally { setIdDocUploading(false); }
  };

  const removeIdDoc = i => setIdDocs(prev => prev.filter((_, idx) => idx !== i));

  const validate = () => {
    const e = {};
    if (!form.name.trim())              e.name            = 'Full name is required';
    if (!form.phone.trim())             e.phone           = 'Phone number is required';
    if (!form.location.trim())          e.location        = 'City / country is required';
    if (!form.bio.trim())               e.bio             = 'Bio is required';
    else if (form.bio.trim().length < 20) e.bio           = 'At least 20 characters';
    if (subjects.length === 0)          e.subjects        = 'Select at least one subject';
    if (languages.length === 0)         e.languages       = 'Select at least one language';
    if (!form.student_level)            e.student_level   = 'Select a student level';
    if (!form.lesson_type)              e.lesson_type     = 'Select a lesson format';
    if (!form.experience_years)         e.experience_years = 'Years of experience is required';
    else if (isNaN(form.experience_years) || Number(form.experience_years) < 0) e.experience_years = 'Enter a valid number';
    if (!form.hourly_price)             e.hourly_price    = 'Hourly rate is required';
    else if (isNaN(form.hourly_price) || Number(form.hourly_price) <= 0) e.hourly_price = 'Enter a valid rate';
    if (!form.education.trim())         e.education       = 'Education background is required';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError('Please fill in all required fields before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true); setError(''); setSaved(false); setFieldErrors({});
    try {
      const uid       = user?.user_id;
      const textCerts = form.certificates.split(',').map(s => s.trim()).filter(Boolean);
      const allCerts  = [
        ...textCerts,
        ...certDocs.map(d => d.url),
        ...idDocs.map(d => `idoc:${d.type}:${d.url}`),
      ];

      await usersAPI.updateTutorProfile(uid, {
        bio:                  form.bio,
        age:                  0,
        location:             form.location,
        photo_url:            form.photo_url,
        subjects,
        experience_years:     parseInt(form.experience_years) || 0,
        certificates:         allCerts,
        phone:                form.phone,
        teaching_language:    languages.join(', '),
        student_level:        form.student_level,
        lesson_type:          form.lesson_type,
        hourly_price:         parseInt(form.hourly_price) || 0,
        education:            form.education,
        available_days:       form.available_days,
        available_time_start: form.available_time_start,
        available_time_end:   form.available_time_end,
        timezone:             form.timezone,
      });
      localStorage.removeItem('pendingVerify');
      setSaved(true);
      setIsFirstTime(false);
      setProfileStatus('pending');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <TutorSidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--accent-soft)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    </div>
  );

  const statusColor = profileStatus === 'approved' ? '#22c55e' : profileStatus === 'rejected' ? 'var(--danger)' : '#f59e0b';
  const statusBg    = profileStatus === 'approved' ? 'rgba(34,197,94,0.08)' : profileStatus === 'rejected' ? 'var(--danger-soft)' : 'rgba(245,158,11,0.08)';
  const statusBorder = profileStatus === 'approved' ? 'rgba(34,197,94,0.2)' : profileStatus === 'rejected' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <TutorSidebar />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>My Profile</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>Complete your profile to appear in the marketplace</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: isFirstTime ? 'rgba(13,148,136,0.08)' : statusBg, border: `1px solid ${isFirstTime ? 'rgba(13,148,136,0.2)' : statusBorder}`, fontSize: 13, fontWeight: 600, color: isFirstTime ? 'var(--accent)' : statusColor }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isFirstTime ? 'var(--accent)' : statusColor }} />
            {isFirstTime ? 'Profile not submitted yet'
              : profileStatus === 'approved' ? 'Approved - visible in marketplace'
              : profileStatus === 'rejected' ? 'Rejected - update and resubmit'
              : 'Pending admin review'}
          </div>
        </div>

        <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          <div style={{ maxWidth: 680 }}>

            {/* First-time instructions */}
            {isFirstTime && (
              <div style={{ background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6" width={18} height={18}>
                      <circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Welcome! Set up your tutor profile</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>Complete all required fields and submit for admin review</p>
                  </div>
                </div>
                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    'Add your profile photo and basic contact info',
                    'Select the subjects you teach and your teaching languages',
                    'Fill in your bio, experience, and hourly rate',
                    'Add your education background and upload certificates',
                    'Upload a government-issued identity document (passport or ID card)',
                    'Click "Submit for Review" at the bottom',
                  ].map((step, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--text-2)' }}>{step}</li>
                  ))}
                </ol>
                <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                  After submission an admin will review your profile. Once approved your profile goes live in the marketplace.
                </p>
              </div>
            )}

            {/* Status banners */}
            {!isFirstTime && profileStatus === 'pending' && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="#f59e0b" strokeWidth="1.6" width={18} height={18} style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="10" cy="10" r="8"/><path d="M10 6v4l2 2" strokeLinecap="round"/>
                </svg>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#b45309' }}>Profile under review</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#b45309', opacity: 0.8 }}>Your profile is waiting for admin approval. You will be notified once reviewed.</p>
                </div>
              </div>
            )}
            {profileStatus === 'rejected' && (
              <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="var(--danger)" strokeWidth="1.6" width={18} height={18} style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="10" cy="10" r="8"/><path d="M7 7l6 6M13 7l-6 6" strokeLinecap="round"/>
                </svg>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--danger)' }}>Profile was not approved</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--danger)', opacity: 0.8 }}>Please update your profile and resubmit. Make sure all sections are fully completed.</p>
                </div>
              </div>
            )}
            {profileStatus === 'approved' && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="#16a34a" strokeWidth="1.8" width={18} height={18} style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="10" cy="10" r="8"/><path d="M6.5 10.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#16a34a' }}>Your profile is live in the marketplace</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#16a34a', opacity: 0.8 }}>Students can find and contact you.</p>
                </div>
              </div>
            )}

            {/* Global error */}
            {error && (
              <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--danger)', marginBottom: 20 }}>
                {error}
              </div>
            )}
            {saved && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#16a34a', marginBottom: 20, fontWeight: 500 }}>
                Profile saved and submitted for review.
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Basic info */}
              <Section title="Basic Information">
                {/* Photo */}
                <Field label="Profile Photo">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-hover)', flexShrink: 0 }}>
                      {form.photo_url && !photoError ? (
                        <img src={form.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setPhotoError(true)} />
                      ) : (
                        <svg viewBox="0 0 32 32" fill="none" stroke="var(--muted)" strokeWidth="1.5" width={28} height={28}>
                          <circle cx="16" cy="12" r="5"/><path d="M4 28a12 12 0 0124 0"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <UploadButton label="Upload photo" accept="image/*" uploading={photoUploading} onFile={handlePhotoUpload} />
                      {form.photo_url && (
                        <button type="button" onClick={() => setForm(f => ({ ...f, photo_url: '' }))}
                          style={{ fontSize: 11, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                          Remove photo
                        </button>
                      )}
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>JPG, PNG or WEBP. Max 10 MB.</p>
                    </div>
                  </div>
                </Field>

                <Field label="Full Name" required error={fieldErrors.name}>
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="Jane Smith" style={getInputStyle(!!fieldErrors.name)}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                    onBlur={e => { e.target.style.borderColor = fieldErrors.name ? 'var(--danger)' : 'var(--border)'; }}
                  />
                </Field>
                <Field label="Phone Number" required error={fieldErrors.phone}>
                  <input name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+7 700 000 0000" style={getInputStyle(!!fieldErrors.phone)}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                    onBlur={e => { e.target.style.borderColor = fieldErrors.phone ? 'var(--danger)' : 'var(--border)'; }}
                  />
                </Field>
                <Field label="City / Country" required error={fieldErrors.location} style={{ marginBottom: 0 }}>
                  <input name="location" value={form.location} onChange={handleChange}
                    placeholder="Almaty, Kazakhstan" style={getInputStyle(!!fieldErrors.location)}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                    onBlur={e => { e.target.style.borderColor = fieldErrors.location ? 'var(--danger)' : 'var(--border)'; }}
                  />
                </Field>
              </Section>

              {/* Teaching Info */}
              <Section title="Teaching Information">
                <Field label="Short Bio" required hint="Tell students about yourself and your teaching style (min. 20 characters)" error={fieldErrors.bio}>
                  <textarea name="bio" value={form.bio} onChange={handleChange}
                    placeholder="I'm a passionate math teacher with 5 years of experience..." rows={4}
                    style={{ ...getInputStyle(!!fieldErrors.bio), resize: 'vertical' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                    onBlur={e => { e.target.style.borderColor = fieldErrors.bio ? 'var(--danger)' : 'var(--border)'; }}
                  />
                </Field>

                <Field label="Subjects You Teach" required error={fieldErrors.subjects} hint="Select from the list or type to add your own">
                  <ChipSelect
                    options={SUBJECT_OPTIONS}
                    value={subjects}
                    onChange={v => { setSubjects(v); if (fieldErrors.subjects) setFieldErrors(f => ({ ...f, subjects: '' })); }}
                    placeholder="Select or type a subject..."
                    error={fieldErrors.subjects}
                    allowCustom
                  />
                </Field>

                <Field label="Teaching Languages" required error={fieldErrors.languages} hint="Languages you teach in - select or add your own">
                  <ChipSelect
                    options={LANGUAGE_OPTIONS}
                    value={languages}
                    onChange={v => { setLanguages(v); if (fieldErrors.languages) setFieldErrors(f => ({ ...f, languages: '' })); }}
                    placeholder="Select or type a language..."
                    error={fieldErrors.languages}
                    allowCustom
                  />
                </Field>

                <Field label="Student Level" required error={fieldErrors.student_level}>
                  <select name="student_level" value={form.student_level} onChange={handleChange}
                    style={getInputStyle(!!fieldErrors.student_level)}>
                    <option value="">Select level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="all">All levels</option>
                  </select>
                </Field>

                <Field label="Lesson Format" required error={fieldErrors.lesson_type}>
                  <select name="lesson_type" value={form.lesson_type} onChange={handleChange}
                    style={getInputStyle(!!fieldErrors.lesson_type)}>
                    <option value="">Select format</option>
                    <option value="individual">Individual lessons</option>
                    <option value="group">Group lessons</option>
                    <option value="both">Both individual and group</option>
                  </select>
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 0 }}>
                  <Field label="Years of Experience" required error={fieldErrors.experience_years} style={{ marginBottom: 0 }}>
                    <input type="number" name="experience_years" value={form.experience_years} onChange={handleChange}
                      placeholder="5" min="0" style={getInputStyle(!!fieldErrors.experience_years)}
                      onWheel={e => e.target.blur()}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                      onBlur={e => { e.target.style.borderColor = fieldErrors.experience_years ? 'var(--danger)' : 'var(--border)'; }}
                    />
                  </Field>
                  <Field label="Hourly Rate (KZT)" required error={fieldErrors.hourly_price} style={{ marginBottom: 0 }}>
                    <div style={{ position: 'relative' }}>
                      <input type="number" name="hourly_price" value={form.hourly_price} onChange={handleChange}
                        placeholder="5000" min="1" style={{ ...getInputStyle(!!fieldErrors.hourly_price), paddingRight: 48 }}
                        onWheel={e => e.target.blur()}
                        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                        onBlur={e => { e.target.style.borderColor = fieldErrors.hourly_price ? 'var(--danger)' : 'var(--border)'; }}
                      />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--muted)', fontWeight: 500, pointerEvents: 'none' }}>KZT</span>
                    </div>
                    {fieldErrors.hourly_price && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--danger)' }}>{fieldErrors.hourly_price}</p>}
                  </Field>
                </div>
              </Section>

              {/* Availability */}
              <Section title="Availability">
                <Field label="Available Days" hint="Select the days you are available for lessons">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {DAYS.map(day => {
                      const sel = form.available_days.includes(day);
                      return (
                        <button key={day} type="button" onClick={() => toggleDay(day)}
                          style={{
                            padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                            background: sel ? 'var(--accent-soft)' : 'white',
                            color: sel ? 'var(--accent)' : 'var(--muted)',
                            transition: 'all 120ms',
                          }}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 0 }}>
                  <Field label="Start Time" style={{ marginBottom: 0 }}>
                    <input type="time" name="available_time_start" value={form.available_time_start} onChange={handleChange}
                      style={getInputStyle(false)} />
                  </Field>
                  <Field label="End Time" style={{ marginBottom: 0 }}>
                    <input type="time" name="available_time_end" value={form.available_time_end} onChange={handleChange}
                      style={getInputStyle(false)} />
                  </Field>
                  <Field label="Timezone" style={{ marginBottom: 0 }}>
                    <select name="timezone" value={form.timezone} onChange={handleChange} style={getInputStyle(false)}>
                      {['UTC+5', 'UTC+6', 'UTC+3', 'UTC+0', 'UTC+1', 'UTC+2', 'UTC+4', 'UTC+7', 'UTC+8'].map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Section>

              {/* Education & Verification */}
              <Section title="Education & Verification">
                <Field label="Education Background" required hint="Degree, university, graduation year" error={fieldErrors.education}>
                  <textarea name="education" value={form.education} onChange={handleChange} rows={3}
                    placeholder="B.Sc. Mathematics, Nazarbayev University, 2018"
                    style={{ ...getInputStyle(!!fieldErrors.education), resize: 'vertical' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                    onBlur={e => { e.target.style.borderColor = fieldErrors.education ? 'var(--danger)' : 'var(--border)'; }}
                  />
                </Field>

                <Field label="Qualification Names" hint="Comma-separated list of certificates and qualifications">
                  <input name="certificates" value={form.certificates} onChange={handleChange}
                    placeholder="IELTS 8.0, Cambridge C2, Microsoft Certified"
                    style={getInputStyle(false)}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                  />
                </Field>

                <Field label="Certificate Documents" hint="Upload scanned certificates, diplomas, or credentials (PDF, JPG, PNG)" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {certDocs.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 }}>
                        {certDocs.map((doc, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-hover)', borderRadius: 8, padding: '8px 12px' }}>
                            <svg viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.4" width={14} height={14} style={{ flexShrink: 0 }}>
                              <path d="M4 2h6l3 3v9H4V2z" strokeLinejoin="round"/><path d="M10 2v3h3"/>
                            </svg>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none' }}>
                              {doc.name}
                            </a>
                            <button type="button" onClick={() => removeCertDoc(i)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, display: 'flex' }}>
                              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width={13} height={13}>
                                <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <UploadButton label="Upload certificate" accept=".pdf,.jpg,.jpeg,.png,.webp" uploading={certUploading} onFile={handleCertUpload} />
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>PDF, JPG, PNG accepted. Max 50 MB per file.</p>
                  </div>
                </Field>
              </Section>

              {/* Identity Documents */}
              <Section title="Identity Documents">
                <p style={{ margin: '-8px 0 16px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>
                  Upload a government-issued identity document to verify your identity. This information is reviewed by admins only and is not shown publicly.
                </p>

                <Field label="Document Type" style={{ marginBottom: 12 }}>
                  <select value={idDocType} onChange={e => setIdDocType(e.target.value)} style={getInputStyle(false)}>
                    {ID_DOC_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>

                {idDocs.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {idDocs.map((doc, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)', borderRadius: 9, padding: '9px 12px' }}>
                        <svg viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.4" width={15} height={15} style={{ flexShrink: 0 }}>
                          <rect x="1" y="3" width="14" height="10" rx="1.5"/>
                          <circle cx="4.5" cy="8" r="1.5"/>
                          <path d="M8 6h4M8 8h4M8 10h3" strokeLinecap="round"/>
                        </svg>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 1px', fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {ID_DOC_LABEL[doc.type] || doc.type}
                          </p>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none', display: 'block' }}>
                            {doc.name}
                          </a>
                        </div>
                        <button type="button" onClick={() => removeIdDoc(i)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, display: 'flex', alignItems: 'center' }}>
                          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width={13} height={13}>
                            <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Field label="" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <UploadButton
                      label="Upload document"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      uploading={idDocUploading}
                      onFile={handleIdDocUpload}
                    />
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>
                      PDF, JPG or PNG. Max 50 MB. Visible to admins only.
                    </p>
                  </div>
                </Field>
              </Section>

              {/* Google Meet Integration */}
              <div style={{
                background: 'var(--surface)',
                border: `1px solid ${googleConnected ? '#bbf7d0' : 'var(--border)'}`,
                borderRadius: 14, padding: '20px 22px', marginBottom: 16,
                transition: 'border-color 200ms',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: googleConnected ? '#dcfce7' : '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 200ms' }}>
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                      <rect x="1" y="6" width="14" height="12" rx="2" fill="#0d9488"/>
                      <path d="M15 10l5-3v10l-5-3V10z" fill="#22be70"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Google Meet Integration</p>
                      {googleConnected && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#dcfce7', color: '#15803d',
                          fontSize: 11, fontWeight: 700, padding: '2px 8px',
                          borderRadius: 20, border: '1px solid #bbf7d0',
                        }}>
                          <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
                            <circle cx="8" cy="8" r="7" fill="#22c55e"/>
                            <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Connected
                        </span>
                      )}
                    </div>
                    {googleConnected ? (
                      <>
                        <p style={{ margin: '3px 0 12px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                          Your Google account is linked. Meet links will be generated automatically when you confirm lesson bookings.
                        </p>
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/auth/google/connect?token=${localStorage.getItem('token') || ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontSize: 12, color: 'var(--muted)',
                            textDecoration: 'underline', cursor: 'pointer',
                          }}
                        >
                          Reconnect with a different account
                        </a>
                      </>
                    ) : (
                      <>
                        <p style={{ margin: '3px 0 12px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                          Connect your Google account to automatically generate Meet links when you confirm a lesson booking.
                          Without it, you'll need to add a link manually.
                        </p>
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/auth/google/connect?token=${localStorage.getItem('token') || ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            background: 'white', border: '1.5px solid #dadce0',
                            borderRadius: 8, padding: '8px 16px',
                            fontSize: 13, fontWeight: 600, color: '#3c4043',
                            textDecoration: 'none', cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            transition: 'box-shadow 120ms',
                          }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Connect Google account
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={saving || photoUploading || certUploading || idDocUploading}
                style={{
                  width: '100%', background: saving ? 'var(--muted)' : 'var(--accent)',
                  color: 'white', border: 'none', borderRadius: 12,
                  padding: '14px', fontSize: 15, fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 120ms',
                }}>
                {saving ? 'Submitting...' : isFirstTime ? 'Submit for Review' : 'Save & Resubmit'}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfileSetup;
