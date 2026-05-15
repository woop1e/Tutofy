import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { usersAPI } from '../../api/users';
import { mediaAPI } from '../../api/media';


const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-[#ebebf0] p-6 mb-5">
    <h3 className="text-[15px] font-bold text-[#181b26] mb-4">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, hint, children }) => (
  <div className="mb-4">
    <label className="block text-[13px] font-semibold text-[#4c5162] mb-1">{label}</label>
    {hint && <p className="text-[11px] text-[#8a90a1] mb-1">{hint}</p>}
    {children}
  </div>
);

const inputCls = "w-full border border-[#d2d4d9] rounded-[10px] px-3 py-2.5 text-[13px] text-[#181b26] focus:outline-none focus:border-[#4c6eff] bg-white";
const textareaCls = inputCls + " resize-none";

/* ── Reusable file upload button ── */
function UploadButton({ label, accept, uploading, onFile, icon }) {
  const ref = useRef();
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = ''; }}
      />
      <button
        type="button"
        onClick={() => ref.current.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 border border-[#d2d4d9] rounded-[10px] text-[12px] font-semibold text-[#4c5162] hover:border-[#4c6eff] hover:text-[#4c6eff] transition-colors disabled:opacity-40"
      >
        {uploading ? (
          <div className="w-3.5 h-3.5 border-2 border-[#4c6eff] border-t-transparent rounded-full animate-spin" />
        ) : icon || (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <path d="M8 10V3M5 6l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 13h12" strokeLinecap="round"/>
          </svg>
        )}
        {uploading ? 'Uploading...' : label}
      </button>
    </>
  );
}

const TutorProfileSetup = () => {
  const { user, isAuthenticated, role, isLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState('');
  const [profileStatus, setProfileStatus] = useState('pending');

  // Upload states
  const [photoUploading, setPhotoUploading]   = useState(false);
  const [certUploading, setCertUploading]     = useState(false);

  // Certificate documents (file uploads): [{name, url}]
  const [certDocs, setCertDocs] = useState([]);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    location: '',
    photo_url: '',
    bio: '',
    subjects: '',
    teaching_language: '',
    student_level: '',
    lesson_type: '',
    experience_years: '',
    hourly_price: '',
    education: '',
    certificates: '',    // text cert names (comma-separated)
    available_days: [],
    available_time_start: '09:00',
    available_time_end: '18:00',
    timezone: 'UTC+5',
  });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || role !== 'tutor')) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, role, navigate]);

  useEffect(() => {
    const uid = user?.user_id;
    if (!uid) { setLoading(false); return; }
    usersAPI.getTutorProfile(uid)
      .then((data) => {
        setProfileStatus(data.status || 'pending');

        // Certificates: separate text names from uploaded document URLs
        const allCerts = data.certificates || [];
        const textCerts = allCerts.filter((c) => !c.startsWith('http'));
        const urlCerts  = allCerts
          .filter((c) => c.startsWith('http'))
          .map((url) => ({ url, name: decodeURIComponent(url.split('/').pop().split('?')[0]) }));
        setCertDocs(urlCerts);

        setForm({
          name: data.name || '',
          phone: data.phone || '',
          location: data.location || '',
          photo_url: data.photo_url || '',
          bio: data.bio || '',
          subjects: (data.subjects || []).join(', '),
          teaching_language: data.teaching_language || '',
          student_level: data.student_level || '',
          lesson_type: data.lesson_type || '',
          experience_years: data.experience_years ? String(data.experience_years) : '',
          hourly_price: data.hourly_price ? String(data.hourly_price) : '',
          education: data.education || '',
          certificates: textCerts.join(', '),
          available_days: data.available_days || [],
          available_time_start: data.available_time_start || '09:00',
          available_time_end: data.available_time_end || '18:00',
          timezone: data.timezone || 'UTC+5',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  /* ── Upload profile photo to MinIO ── */
  const handlePhotoUpload = async (file) => {
    setPhotoUploading(true);
    setError('');
    try {
      const uploadRes = await mediaAPI.uploadFile(file, null, 'user_document');
      const fileId = uploadRes?.file_id;
      if (!fileId) throw new Error('No file ID returned');
      const urlRes = await mediaAPI.getDownloadURL(fileId);
      const url = urlRes?.url;
      if (!url) throw new Error('No URL returned');
      setForm((f) => ({ ...f, photo_url: url }));
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Unknown error';
      setError(`Photo upload failed: ${msg}`);
    } finally {
      setPhotoUploading(false);
    }
  };

  /* ── Upload certificate document to MinIO ── */
  const handleCertUpload = async (file) => {
    setCertUploading(true);
    setError('');
    try {
      const uploadRes = await mediaAPI.uploadFile(file, null, 'user_document');
      const fileId = uploadRes?.file_id;
      if (!fileId) throw new Error('No file ID returned');
      const urlRes = await mediaAPI.getDownloadURL(fileId);
      const url = urlRes?.url;
      if (!url) throw new Error('No URL returned');
      setCertDocs((prev) => [...prev, { url, name: file.name }]);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Unknown error';
      setError(`Certificate upload failed: ${msg}`);
    } finally {
      setCertUploading(false);
    }
  };

  const removeCertDoc = (index) => {
    setCertDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const uid = user?.user_id;
      const subjects      = form.subjects.split(',').map((s) => s.trim()).filter(Boolean);
      const textCerts     = form.certificates.split(',').map((s) => s.trim()).filter(Boolean);
      const docCertUrls   = certDocs.map((d) => d.url);
      const allCerts      = [...textCerts, ...docCertUrls];

      await usersAPI.updateTutorProfile(uid, {
        bio:                  form.bio,
        age:                  0,
        location:             form.location,
        photo_url:            form.photo_url,
        subjects,
        experience_years:     parseInt(form.experience_years) || 0,
        certificates:         allCerts,
        phone:                form.phone,
        teaching_language:    form.teaching_language,
        student_level:        form.student_level,
        lesson_type:          form.lesson_type,
        hourly_price:         parseInt(form.hourly_price) || 0,
        education:            form.education,
        available_days:       form.available_days,
        available_time_start: form.available_time_start,
        available_time_end:   form.available_time_end,
        timezone:             form.timezone,
      });
      setSaved(true);
      setProfileStatus('pending');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f5f6fa]">
        <TutorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#4c6eff] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6fa] font-sans">
      <TutorSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-[#ebebf0] px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-[#181b26] text-[22px] font-bold leading-none">My Profile</h1>
            <p className="text-[#8a90a1] text-[13px] mt-1">Complete your profile to appear in the marketplace</p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-[13px] font-semibold ${
            profileStatus === 'approved'
              ? 'bg-[#22be70]/10 text-[#22be70]'
              : profileStatus === 'rejected'
              ? 'bg-[#f24545]/10 text-[#f24545]'
              : 'bg-[#ff8032]/10 text-[#ff8032]'
          }`}>
            {profileStatus === 'approved' ? 'Approved — visible in marketplace'
              : profileStatus === 'rejected' ? 'Rejected — update and resubmit'
              : 'Pending admin review'}
          </div>
        </div>

        {/* Notice banners */}
        {profileStatus === 'pending' && (
          <div className="mx-8 mt-6 bg-[#ff8032]/8 border border-[#ff8032]/20 rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-[#ff8032] text-[18px] mt-0.5">⏳</span>
            <div>
              <p className="text-[#ff8032] text-[13px] font-semibold">Profile under review</p>
              <p className="text-[#ff8032]/80 text-[12px] mt-0.5">
                Your profile is waiting for admin approval. You will be notified once reviewed.
              </p>
            </div>
          </div>
        )}
        {profileStatus === 'rejected' && (
          <div className="mx-8 mt-6 bg-[#f24545]/8 border border-[#f24545]/20 rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-[#f24545] text-[18px] mt-0.5">✕</span>
            <div>
              <p className="text-[#f24545] text-[13px] font-semibold">Profile was not approved</p>
              <p className="text-[#f24545]/80 text-[12px] mt-0.5">
                Please update your profile and resubmit. Make sure all sections are fully completed.
              </p>
            </div>
          </div>
        )}
        {profileStatus === 'approved' && (
          <div className="mx-8 mt-6 bg-[#22be70]/8 border border-[#22be70]/20 rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-[#22be70] text-[18px] mt-0.5">✓</span>
            <div>
              <p className="text-[#22be70] text-[13px] font-semibold">Your profile is live in the marketplace</p>
              <p className="text-[#22be70]/80 text-[12px] mt-0.5">Students can find and contact you.</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-2xl">

            {/* Basic Info */}
            <Section title="Basic Information">
              {/* Profile photo */}
              <Field label="Profile Photo">
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="w-20 h-20 rounded-full border-2 border-[#ebebf0] overflow-hidden flex items-center justify-center bg-[#f5f6fa] flex-shrink-0">
                    {form.photo_url ? (
                      <img
                        src={form.photo_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <svg viewBox="0 0 32 32" fill="none" stroke="#b0b5c4" strokeWidth="1.5" className="w-8 h-8">
                        <circle cx="16" cy="12" r="5"/><path d="M4 28a12 12 0 0124 0"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <UploadButton
                      label="Upload photo"
                      accept="image/*"
                      uploading={photoUploading}
                      onFile={handlePhotoUpload}
                      icon={
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                          <circle cx="8" cy="8" r="6"/>
                          <path d="M8 5v6M5 8l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      }
                    />
                    {form.photo_url && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, photo_url: '' }))}
                        className="text-[11px] text-[#f24545] hover:underline text-left"
                      >
                        Remove photo
                      </button>
                    )}
                    <p className="text-[11px] text-[#8a90a1]">JPG, PNG or WEBP. Max 10 MB.</p>
                  </div>
                </div>
              </Field>

              <Field label="Full Name">
                <input className={inputCls} name="name" value={form.name} onChange={handleChange} placeholder="John Smith" />
              </Field>
              <Field label="Phone Number">
                <input className={inputCls} name="phone" value={form.phone} onChange={handleChange} placeholder="+7 700 000 0000" />
              </Field>
              <Field label="City / Country">
                <input className={inputCls} name="location" value={form.location} onChange={handleChange} placeholder="Almaty, Kazakhstan" />
              </Field>
            </Section>

            {/* Teaching Info */}
            <Section title="Teaching Information">
              <Field label="Short Bio / About You" hint="Tell students about yourself and your teaching style">
                <textarea className={textareaCls} rows={4} name="bio" value={form.bio} onChange={handleChange} placeholder="I'm a passionate math teacher with 5 years of experience..." />
              </Field>
              <Field label="Subjects" hint="Comma-separated list of subjects you teach">
                <input className={inputCls} name="subjects" value={form.subjects} onChange={handleChange} placeholder="Mathematics, Physics, Chemistry" />
              </Field>
              <Field label="Teaching Language">
                <input className={inputCls} name="teaching_language" value={form.teaching_language} onChange={handleChange} placeholder="English, Russian, Kazakh" />
              </Field>
              <Field label="Student Level">
                <select className={inputCls} name="student_level" value={form.student_level} onChange={handleChange}>
                  <option value="">Select level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="all">All levels</option>
                </select>
              </Field>
              <Field label="Lesson Format">
                <select className={inputCls} name="lesson_type" value={form.lesson_type} onChange={handleChange}>
                  <option value="">Select format</option>
                  <option value="individual">Individual lessons</option>
                  <option value="group">Group lessons</option>
                  <option value="both">Both individual and group</option>
                </select>
              </Field>
              <Field label="Years of Experience">
                <input className={inputCls} type="number" min="0" name="experience_years" value={form.experience_years} onChange={handleChange} placeholder="5" />
              </Field>
            </Section>

            {/* Pricing */}
            <Section title="Pricing">
              <Field label="Hourly Lesson Price (KZT)">
                <div className="relative">
                  <input className={inputCls + ' pr-14'} type="number" min="0" name="hourly_price" value={form.hourly_price} onChange={handleChange} placeholder="5000" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#8a90a1] font-medium">KZT</span>
                </div>
              </Field>
            </Section>

            {/* Verification */}
            <Section title="Education & Verification">
              <Field label="Education Background" hint="Degree, university, graduation year">
                <textarea className={textareaCls} rows={3} name="education" value={form.education} onChange={handleChange} placeholder="B.Sc. Mathematics, Nazarbayev University, 2018" />
              </Field>

              <Field label="Qualification Names" hint="Comma-separated list of certificates and qualifications">
                <input className={inputCls} name="certificates" value={form.certificates} onChange={handleChange} placeholder="IELTS 8.0, Cambridge C2, Microsoft Certified" />
              </Field>

              {/* Certificate document uploads */}
              <Field label="Certificate Documents" hint="Upload scanned certificates, diplomas, or credentials (PDF, JPG, PNG)">
                <div className="space-y-2">
                  {certDocs.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {certDocs.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 bg-[#f5f6fa] rounded-[8px] px-3 py-2">
                          <svg viewBox="0 0 16 16" fill="none" stroke="#4c6eff" strokeWidth="1.4" className="w-3.5 h-3.5 flex-shrink-0">
                            <path d="M4 2h6l3 3v9H4V2z" strokeLinejoin="round"/>
                            <path d="M10 2v3h3"/>
                          </svg>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12px] text-[#4c6eff] font-medium truncate flex-1 hover:underline"
                          >
                            {doc.name}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeCertDoc(i)}
                            className="text-[#8a90a1] hover:text-[#f24545] flex-shrink-0 ml-1"
                          >
                            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                              <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <UploadButton
                    label="Upload certificate"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    uploading={certUploading}
                    onFile={handleCertUpload}
                  />
                  <p className="text-[11px] text-[#8a90a1]">PDF, JPG, PNG accepted. Max 50 MB per file.</p>
                </div>
              </Field>
            </Section>

            {/* Submit */}
            {error && (
              <div className="mb-4 bg-[#f24545]/8 border border-[#f24545]/25 text-[#f24545] rounded-[10px] px-4 py-3 text-[13px]">
                {error}
              </div>
            )}
            {saved && (
              <div className="mb-4 bg-[#22be70]/8 border border-[#22be70]/25 text-[#22be70] rounded-[10px] px-4 py-3 text-[13px]">
                Profile saved successfully. It will be reviewed by an admin.
              </div>
            )}
            <button
              type="submit"
              disabled={saving || photoUploading || certUploading}
              className="w-full bg-[#4c6eff] text-white text-[14px] font-bold py-3 rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TutorProfileSetup;
