import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { usersAPI } from '../../api/users';
import { mediaAPI } from '../../api/media';
import { parentAPI } from '../../api/parent';
import { useTranslation } from 'react-i18next';
import TopBarActions from '../../components/ui/TopBarActions';

const NOTIF_TRANS_KEYS = [
  'settings.lessonReminders',
  'settings.assignmentReminders',
  'settings.quizReminders',
  'settings.messageNotifications',
  'settings.courseAnnouncements',
  'settings.paymentNotifications',
  'settings.certificateNotifications',
  'settings.emailNotifications',
];
const NOTIF_STORAGE_KEYS = [
  'Upcoming lesson reminders',
  'Assignment reminders',
  'Quiz reminders',
  'New message notifications',
  'Course announcements',
  'Payment notifications',
  'Certificate notifications',
  'Email notifications',
];

function ls(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      style={{ width: 40, height: 22, borderRadius: 11, background: checked ? '#0d9488' : '#d1d5db', position: 'relative', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background .2s' }}>
      <span style={{ position: 'absolute', top: 2, left: checked ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
    </button>
  );
}

const CARD_ICONS = {
  profile: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width={18} height={18}>
      <circle cx="10" cy="7" r="3.5"/>
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" strokeLinecap="round"/>
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width={18} height={18}>
      <path d="M10 2.5A5.5 5.5 0 004.5 8v3l-1.5 2.5h14L15.5 11V8A5.5 5.5 0 0010 2.5z" strokeLinejoin="round"/>
      <path d="M8 15.5a2 2 0 004 0" strokeLinecap="round"/>
    </svg>
  ),
  security: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width={18} height={18}>
      <path d="M10 2l6.5 2.5v5c0 4-2.5 7-6.5 8.5C3.5 16.5 1 13.5 1 9.5v-5L10 2z" strokeLinejoin="round"/>
      <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  family: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width={18} height={18}>
      <circle cx="7" cy="6" r="2.5"/>
      <path d="M2 17c0-2.761 2.239-5 5-5s5 2.239 5 5" strokeLinecap="round"/>
      <circle cx="15" cy="7" r="2"/>
      <path d="M13 17c0-2.209 1.343-4 3-4s3 1.791 3 4" strokeLinecap="round"/>
    </svg>
  ),
};

function Card({ title, icon, children }) {
  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7eb] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#f3f4f6] flex items-center gap-3">
        <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>{CARD_ICONS[icon]}</span>
        <p className="text-[15px] font-bold text-[#111827]">{title}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#f3f4f6] last:border-0">
      <div>
        <p className="text-[13px] text-[#111827] font-medium">{label}</p>
        {sub && <p className="text-[11px] text-[#6b7280] mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

const StudentSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const uid = user?.user_id;
  const photoInputRef = useRef();

  // Profile
  const [name,     setName]    = useState(user?.name || '');
  const [phone,    setPhone]   = useState(() => ls(`st_phone_${uid}`, ''));
  const [city,     setCity]    = useState(() => ls(`st_city_${uid}`, ''));
  const [bio,      setBio]     = useState(() => ls(`st_bio_${uid}`, ''));
  const [photoUrl,     setPhotoUrl]     = useState(() => ls(`st_photo_${uid}`, ''));
  const [previewUrl,   setPreviewUrl]   = useState(''); // object URL for local preview
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [imgError,     setImgError]     = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState(() => ls('st_notifs', {}));
  const notifOn  = k => notifs[k] !== false;
  const toggleNotif = k => setNotifs(p => ({ ...p, [k]: !notifOn(k) }));

  // Security
  const [showPwd, setShowPwd] = useState(false);
  const [oldPwd,  setOldPwd]  = useState('');
  const [newPwd,  setNewPwd]  = useState('');
  const [pwdMsg,  setPwdMsg]  = useState('');

  // Family / parent access
  const [parentLinks,    setParentLinks]    = useState([]);
  const [parentEmail,    setParentEmail]    = useState('');
  const [parentInviting, setParentInviting] = useState(false);
  const [parentMsg,      setParentMsg]      = useState('');

  // Email from backend
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!uid) return;
    usersAPI.getUserById(uid)
      .then(u => {
        if (u?.email) setEmail(u.email);
        if (u?.name) setName(u.name);
        if (u?.photo_url) {
          setPhotoUrl(u.photo_url);
          localStorage.setItem(`st_photo_${uid}`, JSON.stringify(u.photo_url));
        }
      })
      .catch(() => {});
    parentAPI.getMyParents()
      .then(d => setParentLinks(d?.links || []))
      .catch(() => {});
  }, [uid]);

  const handleInviteParent = async () => {
    if (!parentEmail.trim()) return;
    setParentInviting(true);
    setParentMsg('');
    try {
      await parentAPI.inviteParent(parentEmail.trim());
      const d = await parentAPI.getMyParents();
      setParentLinks(d?.links || []);
      setParentEmail('');
      setParentMsg('Invitation sent!');
    } catch (err) {
      const detail = err?.response?.data?.error || err?.message || 'unknown';
      setParentMsg(`Error (${err?.response?.status ?? 'network'}): ${detail}`);
    } finally {
      setParentInviting(false);
    }
  };

  const handleRemoveParentLink = async (id) => {
    await parentAPI.removeLink(id).catch(() => {});
    setParentLinks(prev => prev.filter(l => l.id !== id));
  };

  // UI
  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState(null);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setImgError(false);
    // Only create object URL for formats browsers can display
    const ext = file.name.split('.').pop().toLowerCase();
    const supported = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    if (supported.includes(ext)) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(''); // unsupported format (e.g. HEIC) — show file icon instead
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const errs = [];

    // Upload photo first, then save name + photo_url to backend
    let newPhotoUrl = photoUrl;
    if (photoFile) {
      setPhotoLoading(true);
      try {
        const up = await mediaAPI.uploadFile(photoFile, null, 'user_document');
        const id = up?.file_id || up?.id;
        if (id) {
          const dl = await mediaAPI.getDownloadURL(id);
          const url = dl?.url;
          if (url) {
            newPhotoUrl = url;
            setPhotoUrl(url);
            setPreviewUrl('');
            localStorage.setItem(`st_photo_${uid}`, JSON.stringify(url));
          }
        }
        setPhotoFile(null);
      } catch { /* keep local preview */ }
      setPhotoLoading(false);
    }

    // Save name + photo_url to backend
    usersAPI.updateUser(uid, { name, photo_url: newPhotoUrl }).catch(() => {});

    localStorage.setItem('user_name', name);
    localStorage.setItem(`st_phone_${uid}`, JSON.stringify(phone));
    localStorage.setItem(`st_city_${uid}`,  JSON.stringify(city));
    localStorage.setItem(`st_bio_${uid}`,   JSON.stringify(bio));
    localStorage.setItem('st_notifs',        JSON.stringify(notifs));

    setSaving(false);
    showToast('success', 'Settings saved!');
  };

  const handleChangePwd = () => {
    if (!oldPwd || !newPwd) { setPwdMsg('Please fill in both fields.'); return; }
    if (newPwd.length < 8)  { setPwdMsg('New password must be at least 8 characters.'); return; }
    setPwdMsg('Password change is not yet available. Please contact support.');
  };

  const initials = (name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-[#f9fafb] font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div className="bg-white border-b border-[#e5e7eb] px-8 h-[64px] flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[18px] font-bold text-[#111827]">Settings</p>
            <p className="text-[12px] text-[#6b7280]">Manage your account preferences</p>
          </div>
          <div className="flex items-center gap-2">
            <TopBarActions />
            <button
              onClick={() => {
                localStorage.removeItem('tutofy_student_tour_seen');
                localStorage.removeItem('tutofy_student_tour_done');
                navigate('/student/dashboard');
              }}
              className="flex items-center gap-2 border border-[#e5e7eb] text-[#6b7280] text-[13px] font-medium px-4 py-2 rounded-[10px] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors"
              title="Restart the platform onboarding tour"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width={13} height={13}>
                <path d="M2 8a6 6 0 1 0 1-3.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 4.5V8h3.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('settings.restartTour')}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-[#0d9488] text-white text-[13px] font-semibold px-4 py-2 rounded-[10px] hover:bg-[#0b7a72] disabled:opacity-60 transition-colors">
              {saving
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M13 4l-7 7-3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
              {t('settings.saveChanges')}
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-8 mt-4 px-4 py-3 rounded-[10px] text-[13px] flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a]' :
            'bg-[#fffbeb] border border-[#fde68a] text-[#92400e]'
          }`}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
              {toast.type === 'success'
                ? <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M8 5v4M8 11h.01" strokeLinecap="round"/>}
            </svg>
            {toast.msg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[700px] mx-auto space-y-5">

            {/* Profile */}
            <Card title={t('settings.profileSettings')} icon="profile">
              {/* Photo + name row */}
              <div className="flex items-center gap-5 pb-5 mb-5 border-b border-[#f3f4f6]">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#ccfbf1] flex-shrink-0 flex items-center justify-center">
                  {previewUrl && !imgError ? (
                    <img src={previewUrl} alt="" className="w-full h-full object-cover"
                      onError={() => setImgError(true)} />
                  ) : photoUrl && !imgError ? (
                    <img src={photoUrl} alt="" className="w-full h-full object-cover"
                      onError={() => setImgError(true)} />
                  ) : photoFile ? (
                    // Unsupported format (e.g. HEIC) — show file icon
                    <div className="flex flex-col items-center justify-center gap-1">
                      <svg viewBox="0 0 20 20" fill="none" stroke="#0d9488" strokeWidth="1.5" className="w-7 h-7">
                        <path d="M5 3h8l4 4v11a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z"/>
                        <path d="M13 3v4h4" strokeLinecap="round"/>
                      </svg>
                      <span className="text-[8px] text-[#0d9488] font-bold uppercase">
                        {photoFile.name.split('.').pop()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#0d9488] text-[20px] font-bold">{initials}</span>
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#111827] mb-1.5">Profile photo</p>
                  <button onClick={() => photoInputRef.current?.click()} disabled={photoLoading}
                    className="px-3 py-1.5 border border-[#d1d5db] rounded-[8px] text-[12px] font-medium text-[#374151] hover:bg-[#f3f4f6] disabled:opacity-50 transition-colors">
                    {photoLoading ? 'Uploading...' : 'Change photo'}
                  </button>
                  {photoFile && (
                    <div className="mt-1">
                      <p className="text-[11px] text-[#6b7280] truncate max-w-[200px]">{photoFile.name}</p>
                      {!['jpg','jpeg','png','gif','webp'].includes(photoFile.name.split('.').pop().toLowerCase()) && (
                        <p className="text-[10px] text-[#f59e0b] mt-0.5">Preview not available for this format. File will be uploaded on save.</p>
                      )}
                    </div>
                  )}
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">{t('settings.fullName')}</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                    className="w-full border border-[#d1d5db] rounded-[8px] px-3 py-2 text-[13px] text-[#111827] focus:outline-none focus:border-[#0d9488] bg-white" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">Email</label>
                  <input value={email} disabled
                    className="w-full border border-[#e5e7eb] rounded-[8px] px-3 py-2 text-[13px] text-[#9ca3af] bg-[#f9fafb] cursor-not-allowed" placeholder="Loading..." />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">{t('settings.phoneNumber')}</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 777 123 45 67"
                    className="w-full border border-[#d1d5db] rounded-[8px] px-3 py-2 text-[13px] text-[#111827] focus:outline-none focus:border-[#0d9488] bg-white" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">City</label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Almaty"
                    className="w-full border border-[#d1d5db] rounded-[8px] px-3 py-2 text-[13px] text-[#111827] focus:outline-none focus:border-[#0d9488] bg-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 200))} rows={3}
                    placeholder="Tell us a bit about yourself..."
                    className="w-full border border-[#d1d5db] rounded-[8px] px-3 py-2 text-[13px] text-[#111827] focus:outline-none focus:border-[#0d9488] resize-none bg-white" />
                  <p className="text-[11px] text-[#9ca3af] text-right">{bio.length}/200</p>
                </div>
              </div>
            </Card>

            {/* Notifications */}
            <Card title={t('settings.notifications')} icon="notifications">
              {NOTIF_STORAGE_KEYS.map((k, i) => (
                <Row key={k} label={t(NOTIF_TRANS_KEYS[i])}>
                  <Toggle checked={notifOn(k)} onChange={() => toggleNotif(k)} />
                </Row>
              ))}
            </Card>

            {/* Family Access */}
            <Card title={t('settings.familyAccess')} icon="family">
              <p className="text-[12px] text-[#6b7280] mb-4">
                Parents can view your progress, schedule, and homework — read only. Enter their email, then copy and send them the invite link.
              </p>

              {/* Invite input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={parentEmail}
                  onChange={e => setParentEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInviteParent()}
                  placeholder="parent@example.com"
                  className="flex-1 border border-[#d1d5db] rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-[#0d9488] bg-white"
                />
                <button
                  onClick={handleInviteParent}
                  disabled={parentInviting || !parentEmail.trim()}
                  className="px-4 py-2 bg-[#0d9488] text-white text-[12px] font-semibold rounded-[8px] hover:bg-[#0b7a72] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {parentInviting ? '…' : t('settings.sendInvite')}
                </button>
              </div>

              {parentMsg && (
                <p className={`text-[12px] mb-3 font-medium ${parentMsg.includes('sent') ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                  {parentMsg}
                </p>
              )}

              {/* Existing links */}
              {parentLinks.length > 0 && (
                <div className="space-y-2">
                  {parentLinks.map(lnk => (
                    <div key={lnk.id} className="flex items-center justify-between py-2.5 px-3 rounded-[10px] bg-[#f9fafb] border border-[#e5e7eb]">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`flex-shrink-0 w-2 h-2 rounded-full ${lnk.status === 'accepted' ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'}`} />
                        <span className="text-[13px] text-[#111827] truncate">{lnk.parent_email}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${lnk.status === 'accepted' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fef3c7] text-[#d97706]'}`}>
                          {lnk.status === 'accepted' ? 'Accepted' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {lnk.status === 'pending' && lnk.token && (
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/join-parent?token=${lnk.token}`;
                              navigator.clipboard.writeText(url);
                              setParentMsg(t('settings.linkCopied'));
                              setTimeout(() => setParentMsg(''), 3000);
                            }}
                            className="text-[11px] font-semibold px-2 py-1 rounded-[6px] bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7] transition-colors"
                            title="Copy invite link"
                          >
                            Copy link
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveParentLink(lnk.id)}
                          className="text-[#9ca3af] hover:text-[#dc2626] transition-colors p-1"
                          title="Remove"
                        >
                          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width={13} height={13}>
                            <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {parentLinks.length === 0 && (
                <p className="text-[12px] text-[#9ca3af] text-center py-2">{t('settings.noParentsYet')}</p>
              )}
            </Card>

            {/* Security */}
            <Card title={t('settings.security')} icon="security">
              <Row label="Password" sub="Change your account password">
                <button onClick={() => { setShowPwd(p => !p); setPwdMsg(''); setOldPwd(''); setNewPwd(''); }}
                  className="px-3 py-1.5 border border-[#d1d5db] rounded-[8px] text-[12px] font-medium text-[#374151] hover:bg-[#f3f4f6] transition-colors">
                  {showPwd ? t('common.cancel') : t('settings.changePassword')}
                </button>
              </Row>

              {showPwd && (
                <div className="mt-4 space-y-3 p-4 bg-[#f9fafb] rounded-[12px]">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">{t('settings.currentPassword')}</label>
                    <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="••••••••"
                      className="w-full border border-[#d1d5db] rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-[#0d9488] bg-white" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">{t('settings.newPassword')}</label>
                    <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 characters"
                      className="w-full border border-[#d1d5db] rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-[#0d9488] bg-white" />
                  </div>
                  {pwdMsg && <p className="text-[12px] text-[#dc2626]">{pwdMsg}</p>}
                  <button onClick={handleChangePwd}
                    className="px-4 py-2 bg-[#0d9488] text-white text-[12px] font-semibold rounded-[8px] hover:bg-[#0b7a72] transition-colors">
                    {t('settings.updatePassword')}
                  </button>
                </div>
              )}

            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSettings;
