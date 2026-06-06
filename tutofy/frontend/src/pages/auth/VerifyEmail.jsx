import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../api/auth';
import { usersAPI } from '../../api/users';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found in the link.');
      return;
    }

    authAPI.verifyEmail(token)
      .then(async (res) => {
        const pending = (() => {
          try { return JSON.parse(localStorage.getItem('pendingVerify') || 'null'); }
          catch { return null; }
        })();

        // Decode role directly from JWT — don't rely on localStorage
        let tokenRole = 'student';
        try {
          const decoded = JSON.parse(atob(res.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
          tokenRole = decoded.role || 'student';
        } catch {}

        login(res.token, pending?.name || '');

        // If tutor registration — apply saved profile data.
        if ((pending?.role === 'tutor' || tokenRole === 'tutor') && res.token) {
          try {
            const decoded = JSON.parse(atob(res.token.split('.')[1]));
            const userId = decoded.user_id || decoded.id || decoded.sub;
            if (userId && (pending.bio || pending.subjects?.length || pending.hourlyRate)) {
              await usersAPI.updateTutorProfile(userId, {
                bio:              pending.bio || '',
                subjects:         pending.subjects || [],
                experience_years: pending.experience || 0,
                hourly_price:     pending.hourlyRate || 0,
              });
            }
            // Only clear after successful save — profile page can still read it as fallback
            localStorage.removeItem('pendingVerify');
          } catch {
            // Keep pendingVerify in localStorage so profile page can pre-fill from it
          }
        } else {
          localStorage.removeItem('pendingVerify');
        }

        setStatus('success');

        // Always show the onboarding tour on first dashboard visit after verification.
        if (pending?.role === 'tutor' || tokenRole === 'tutor') {
          localStorage.removeItem('tutofy_tutor_tour_seen');
          localStorage.removeItem('tutofy_tutor_tour_done');
        } else {
          localStorage.removeItem('tutofy_student_tour_seen');
          localStorage.removeItem('tutofy_student_tour_done');
        }

        const parentToken = localStorage.getItem('pendingParentInvite');
        if (parentToken) {
          localStorage.removeItem('pendingParentInvite');
          setTimeout(() => navigate(`/join-parent?token=${parentToken}`, { replace: true }), 1500);
        } else {
          const role = pending?.role || tokenRole;
          const dest = role === 'tutor' ? '/tutor/dashboard'
                     : role === 'parent' ? '/parent/dashboard'
                     : '/student/dashboard';
          setTimeout(() => navigate(dest, { replace: true }), 2000);
        }
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'The verification link is invalid or has expired.');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>

        {status === 'verifying' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '4px solid var(--accent)', borderTopColor: 'transparent', margin: '0 auto 24px', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: 16, color: 'var(--muted)' }}>Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,190,112,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg viewBox="0 0 28 28" fill="none" stroke="#22be70" strokeWidth="2" width={32} height={32}>
                <path d="M5 14l7 7L23 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={{ margin: '0 0 12px', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Email verified!
            </h1>
            <p style={{ fontSize: 15, color: 'var(--muted)' }}>Redirecting you to your dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg viewBox="0 0 28 28" fill="none" stroke="#ef4444" strokeWidth="2" width={32} height={32}>
                <path d="M7 7l14 14M21 7L7 21" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={{ margin: '0 0 12px', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Verification failed
            </h1>
            <p style={{ margin: '0 0 32px', fontSize: 15, color: 'var(--muted)', lineHeight: 1.6 }}>{errorMsg}</p>
            <Link to="/login"
              style={{ display: 'inline-block', background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: 'var(--r-md)', padding: '12px 28px', fontSize: 14, fontWeight: 700 }}>
              Back to Login
            </Link>
          </>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
