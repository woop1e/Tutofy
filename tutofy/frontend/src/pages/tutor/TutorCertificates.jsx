import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { certificatesAPI } from '../../api/certificates';
import TopBarActions from '../../components/ui/TopBarActions';

function formatDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const TutorCertificates = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();
  const [certs,   setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState({});

  useEffect(() => {
    if (!isAuthenticated || role !== 'tutor') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  const load = useCallback(() => {
    certificatesAPI.getPendingCertificates()
      .then(res => setCerts(res?.certificates || []))
      .catch(() => setCerts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (certId, action) => {
    setActing(a => ({ ...a, [certId]: action }));
    try {
      if (action === 'approve') await certificatesAPI.approveCertificate(certId);
      else await certificatesAPI.rejectCertificate(certId);
      load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Action failed');
    } finally {
      setActing(a => ({ ...a, [certId]: null }));
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

  return (
    <div className="flex h-screen bg-[#f3f4f7] font-sans">
      <TutorSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-6 justify-between flex-shrink-0">
          <div>
            <h1 className="text-[#0c0d12] text-[16px] font-bold">Certificate Requests</h1>
            <p className="text-[#6b6f7d] text-[12px]">Review and approve student certificate applications</p>
          </div>
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
              <div className="w-16 h-16 rounded-full bg-[rgba(13,148,136,0.08)] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
                  <circle cx="16" cy="20" r="10" stroke="#0d9488" strokeWidth="1.5"/>
                  <path d="M12 8l4-6 4 6" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 8h12" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M13 20l2 2 4-4" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[#0c0d12] text-[16px] font-bold mb-1">No pending requests</p>
              <p className="text-[#6b6f7d] text-[13px]">Students who complete your courses will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl">
              {certs.map(cert => (
                <div key={cert.id} className="bg-white rounded-[16px] border border-[#f0f0f5] p-5 flex items-center gap-4 shadow-[0_2px_12px_0_rgba(0,0,0,0.04)]">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0d9488] to-[#935bf5] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[13px] font-bold">
                      {(cert.student_name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#0c0d12] text-[14px] font-semibold">{cert.student_name || 'Student'}</p>
                    <p className="text-[#6b6f7d] text-[12px] truncate">{cert.course_name || 'Course'}</p>
                    <p className="text-[#b0b5c4] text-[11px] mt-0.5">Requested {formatDate(cert.issued_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      disabled={!!acting[cert.id]}
                      onClick={() => act(cert.id, 'approve')}
                      className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white bg-[#22be70] hover:bg-[#1da862] disabled:opacity-50 transition-colors"
                    >
                      {acting[cert.id] === 'approve' ? '…' : 'Approve'}
                    </button>
                    <button
                      disabled={!!acting[cert.id]}
                      onClick={() => act(cert.id, 'reject')}
                      className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-[#ef4444] bg-[rgba(239,68,68,0.08)] hover:bg-[rgba(239,68,68,0.15)] disabled:opacity-50 transition-colors"
                    >
                      {acting[cert.id] === 'reject' ? '…' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorCertificates;
