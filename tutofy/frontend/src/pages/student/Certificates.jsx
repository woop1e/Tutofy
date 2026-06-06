import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { certificatesAPI } from '../../api/certificates';
import TopBarActions from '../../components/ui/TopBarActions';

function formatDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const STATUS_PENDING  = 0;
const STATUS_APPROVED = 1;
const STATUS_REJECTED = 2;

function openCertificatePDF(cert) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Certificate – ${cert.course_name || 'Course'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Inter, sans-serif; background: #fff; display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .cert { width:794px; min-height:562px; border:3px solid #0d9488; border-radius:16px; padding:60px 72px; position:relative; overflow:hidden; }
  .bg1 { position:absolute; top:-80px; right:-80px; width:320px; height:320px; border-radius:50%; background:rgba(13,148,136,0.06); }
  .bg2 { position:absolute; bottom:-100px; left:-60px; width:280px; height:280px; border-radius:50%; background:rgba(147,91,245,0.05); }
  .top { display:flex; justify-content:space-between; align-items:center; margin-bottom:36px; }
  .brand { font-size:22px; font-weight:800; color:#0d9488; letter-spacing:-0.5px; }
  .badge { background:linear-gradient(135deg,#0d9488,#935bf5); border-radius:50%; width:56px; height:56px; display:flex; align-items:center; justify-content:center; }
  .badge svg { width:32px; height:32px; }
  .label { font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#6b6f7d; margin-bottom:12px; }
  h1 { font-size:36px; font-weight:800; color:#0c0d12; letter-spacing:-1px; line-height:1.1; margin-bottom:8px; }
  .sub { font-size:15px; color:#6b6f7d; margin-bottom:36px; }
  .course { font-size:22px; font-weight:700; color:#0d9488; margin-bottom:32px; }
  .row { display:flex; gap:48px; margin-bottom:36px; }
  .field label { font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#b0b5c4; margin-bottom:4px; }
  .field p { font-size:15px; font-weight:600; color:#0c0d12; }
  .line { border:none; border-top:1.5px solid #f0f0f5; margin:24px 0; }
  .footer { display:flex; justify-content:space-between; align-items:flex-end; }
  .sig label { font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#b0b5c4; margin-bottom:4px; }
  .sig p { font-size:14px; font-weight:700; color:#0c0d12; }
  .id { font-size:10px; color:#b0b5c4; font-family:monospace; }
  @media print { body { background:#fff; } .cert { border-color:#0d9488; } }
</style>
</head>
<body>
<div class="cert">
  <div class="bg1"></div><div class="bg2"></div>
  <div class="top">
    <span class="brand">Tutofy</span>
    <div class="badge">
      <svg viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="20" r="10" fill="rgba(255,255,255,0.25)" stroke="white" stroke-width="1.5"/>
        <path d="M12 8l4-6 4 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 8h12" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M13 20l2 2 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
  <p class="label">Certificate of Completion</p>
  <h1>This certifies that</h1>
  <h1 style="color:#0d9488">${cert.student_name || 'Student'}</h1>
  <p class="sub">has successfully completed the course</p>
  <p class="course">${cert.course_name || 'Course'}</p>
  <hr class="line"/>
  <div class="row">
    <div class="field"><label>Instructor</label><p>${cert.tutor_name || '—'}</p></div>
    <div class="field"><label>Date Issued</label><p>${formatDate(cert.issued_at)}</p></div>
  </div>
  <div class="footer">
    <div class="sig"><label>Verified by Tutofy</label><p>${cert.tutor_name || 'Instructor'}</p></div>
    <span class="id">ID: ${(cert.id || '').toUpperCase()}</span>
  </div>
</div>
<script>window.onload = () => { window.print(); }<\/script>
</body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}

const statusMeta = {
  [STATUS_PENDING]:  { label: 'Pending approval', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  [STATUS_APPROVED]: { label: 'Approved',         color: '#22be70', bg: 'rgba(34,190,112,0.10)' },
  [STATUS_REJECTED]: { label: 'Rejected',          color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
};

const CertificateCard = ({ cert }) => {
  const meta = statusMeta[cert.status] ?? statusMeta[STATUS_PENDING];
  const approved = cert.status === STATUS_APPROVED;

  return (
    <div className="bg-white rounded-[20px] border border-[#f0f0f5] overflow-hidden hover:shadow-[0_4px_24px_0_rgba(0,0,0,0.07)] transition-shadow">
      <div className="relative h-[120px] bg-gradient-to-br from-[#0d9488] to-[#935bf5] flex items-center justify-center overflow-hidden">
        <div className="absolute w-[200px] h-[200px] rounded-full border border-white/10 top-[-60px] right-[-60px]" />
        <div className="absolute w-[140px] h-[140px] rounded-full border border-white/10 top-[-30px] right-[-30px]" />
        <div className="relative z-10 flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <circle cx="16" cy="20" r="10" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.5"/>
              <path d="M12 8l4-6 4 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 8h12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M13 20l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white/80 text-[10px] font-semibold tracking-widest uppercase">Certificate</span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-[#0c0d12] text-[15px] font-bold leading-snug mb-1 line-clamp-2">
          {cert.course_name || 'Course'}
        </h3>
        <p className="text-[#6b6f7d] text-[12px] mb-3">Instructor: {cert.tutor_name || '—'}</p>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full"
            style={{ color: meta.color, background: meta.bg }}>
            {meta.label}
          </span>
          {cert.issued_at && (
            <span className="text-[11px] text-[#b0b5c4]">{formatDate(cert.issued_at)}</span>
          )}
        </div>

        {approved && (
          <button
            onClick={() => openCertificatePDF(cert)}
            className="w-full py-2 rounded-[10px] text-[13px] font-semibold text-white bg-[#0d9488] hover:bg-[#0b7a72] transition-colors"
          >
            Download PDF
          </button>
        )}
      </div>
    </div>
  );
};

const Certificates = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();
  const [certs,     setCerts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [requesting, setRequesting] = useState({});

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  const load = useCallback(() => {
    if (!user?.user_id) return;
    certificatesAPI.getUserCertificates(user.user_id)
      .then(res => setCerts(res?.certificates || []))
      .catch(() => setCerts([]))
      .finally(() => setLoading(false));
  }, [user?.user_id]);

  useEffect(() => { load(); }, [load]);

  const handleRequest = async (courseId) => {
    setRequesting(r => ({ ...r, [courseId]: true }));
    try {
      await certificatesAPI.requestCertificate(courseId);
      load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to request certificate');
    } finally {
      setRequesting(r => ({ ...r, [courseId]: false }));
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S';

  return (
    <div className="flex h-screen bg-[#f3f4f7] font-sans">
      <StudentSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-6 justify-between flex-shrink-0">
          <h1 className="text-[#0c0d12] text-[16px] font-bold">My Certificates</h1>
          <div className="flex items-center gap-2">
            <TopBarActions />
            <div className="w-9 h-9 rounded-full bg-[rgba(13,148,136,0.12)] flex items-center justify-center">
              <span className="text-[#0d9488] text-[12px] font-bold">{initials}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : certs.length === 0 ? (
            <div className="bg-white rounded-[20px] border border-[#f0f0f5] p-16 text-center">
              <div className="w-20 h-20 rounded-full bg-[rgba(13,148,136,0.08)] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                  <circle cx="20" cy="26" r="12" stroke="#0d9488" strokeWidth="1.8"/>
                  <path d="M15 10l5-7 5 7" stroke="#0d9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 10h14" stroke="#0d9488" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M17 26l2 2 4-4" stroke="#0d9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[#0c0d12] text-[18px] font-bold mb-2">No certificates yet</p>
              <p className="text-[#6b6f7d] text-[14px] max-w-sm mx-auto leading-relaxed">
                Complete a course 100% and request a certificate. Your tutor will review and approve it.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[#6b6f7d] text-[13px] mb-5">
                {certs.length} certificate{certs.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {certs.map(cert => (
                  <CertificateCard
                    key={cert.id}
                    cert={cert}
                    onRequest={handleRequest}
                    requesting={!!requesting[cert.course_id]}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Certificates;
