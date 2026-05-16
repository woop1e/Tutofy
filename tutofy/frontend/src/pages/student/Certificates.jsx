import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { certificatesAPI } from '../../api/certificates';
import { coursesAPI } from '../../api/courses';

function formatDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const CertificateCard = ({ cert, courseName }) => (
  <div className="bg-white rounded-[20px] border border-[#f0f0f5] overflow-hidden hover:shadow-[0_4px_24px_0_rgba(76,110,255,0.10)] transition-shadow">
    {/* Decorative header */}
    <div className="relative h-[120px] bg-gradient-to-br from-[#0d9488] to-[#935bf5] flex items-center justify-center overflow-hidden">
      {/* Background rings */}
      <div className="absolute w-[200px] h-[200px] rounded-full border border-white/10 top-[-60px] right-[-60px]" />
      <div className="absolute w-[140px] h-[140px] rounded-full border border-white/10 top-[-30px] right-[-30px]" />
      <div className="absolute w-[160px] h-[160px] rounded-full border border-white/10 bottom-[-80px] left-[-40px]" />
      {/* Medal icon */}
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

    {/* Info */}
    <div className="p-5">
      <h3 className="text-[#0c0d12] text-[15px] font-bold leading-snug mb-1 line-clamp-2">
        {courseName || 'Course'}
      </h3>
      <p className="text-[#6b6f7d] text-[12px] mb-4">Course completion certificate</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-[#6b6f7d]">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3.5 h-3.5">
            <rect x="1" y="2" width="12" height="11" rx="1.5"/>
            <path d="M4 1.5v1M10 1.5v1M1 5.5h12"/>
          </svg>
          {formatDate(cert.issued_at)}
        </div>
        <span className="text-[10px] text-[#b0b5c4] font-mono">#{(cert.id || '').slice(-8).toUpperCase()}</span>
      </div>

      <div className="mt-4 pt-4 border-t border-[#f0f0f5] flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#22be70]">
          <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
            <circle cx="7" cy="7" r="6" fill="#22be70"/>
            <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Completed
        </div>
      </div>
    </div>
  </div>
);

const Certificates = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();

  const [certs,    setCerts]    = useState([]);
  const [courses,  setCourses]  = useState({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (!user?.user_id) return;
    certificatesAPI.getUserCertificates(user.user_id)
      .then(async (res) => {
        const list = res?.certificates || [];
        setCerts(list);
        // fetch course names for all certs
        const ids = [...new Set(list.map(c => c.course_id).filter(Boolean))];
        const entries = await Promise.all(
          ids.map(id => coursesAPI.getCourseById(id)
            .then(r => [id, r?.course?.title || r?.title || 'Course'])
            .catch(() => [id, 'Course'])
          )
        );
        setCourses(Object.fromEntries(entries));
      })
      .catch(() => setCerts([]))
      .finally(() => setLoading(false));
  }, [user?.user_id]);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S';

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-6 justify-between flex-shrink-0">
          <h1 className="text-[#0c0d12] text-[16px] font-bold">My Certificates</h1>
          <div className="w-9 h-9 rounded-full bg-[rgba(13,148,136,0.12)] flex items-center justify-center">
            <span className="text-[#0d9488] text-[12px] font-bold">{initials}</span>
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
                Complete a course to earn your first certificate. Keep learning!
              </p>
            </div>
          ) : (
            <>
              <p className="text-[#6b6f7d] text-[13px] mb-5">
                {certs.length} certificate{certs.length !== 1 ? 's' : ''} earned
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {certs.map((cert) => (
                  <CertificateCard
                    key={cert.id}
                    cert={cert}
                    courseName={courses[cert.course_id]}
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
