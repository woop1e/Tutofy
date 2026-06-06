import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { parentAPI } from '../../api/parent';
import { useAuth } from '../../contexts/AuthContext';

const JoinParent = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [invite, setInvite]     = useState(null);
  const [status, setStatus]     = useState('loading'); // loading | ready | accepting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No invite token found in this link.');
      return;
    }
    parentAPI.getInviteInfo(token)
      .then(data => {
        setInvite(data);
        setStatus('ready');
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('This invite link is invalid or has already been used.');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = async () => {
    if (!user) {
      localStorage.setItem('pendingParentInvite', token);
      navigate('/login');
      return;
    }
    setStatus('accepting');
    try {
      await parentAPI.acceptInvite(token);
      setStatus('success');
      setTimeout(() => navigate('/parent/dashboard', { replace: true }), 2000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error || 'Failed to accept the invite. It may have already been used.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>

        {status === 'loading' && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--accent)', borderTopColor: 'transparent', margin: '0 auto 24px', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: 15, color: 'var(--muted)' }}>Loading invite info…</p>
          </>
        )}

        {(status === 'ready' || status === 'accepting') && invite && (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(13,148,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg viewBox="0 0 28 28" fill="none" stroke="#0d9488" strokeWidth="2" width={32} height={32}>
                <circle cx="10" cy="9" r="4"/><path d="M2 23c0-4 3.6-7 8-7" strokeLinecap="round"/>
                <circle cx="20" cy="11" r="3"/><path d="M14 23c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Parent Invite
            </h1>
            <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 8 }}>
              <strong style={{ color: 'var(--text)' }}>{invite.student_name || 'A student'}</strong> has invited you to follow their progress on Tutofy.
            </p>
            {invite.status === 'accepted' ? (
              <p style={{ fontSize: 14, color: '#16a34a', fontWeight: 600, margin: '24px 0' }}>This invite has already been accepted.</p>
            ) : (
              <>
                {!user && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
                    You need to log in or create an account first. We'll bring you back here after.
                  </p>
                )}
                <button
                  onClick={handleAccept}
                  disabled={status === 'accepting'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 32px', fontSize: 15, fontWeight: 700, cursor: status === 'accepting' ? 'not-allowed' : 'pointer', opacity: status === 'accepting' ? 0.7 : 1 }}>
                  {status === 'accepting' && <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />}
                  {user ? 'Accept Invite' : 'Log in to Accept'}
                </button>
              </>
            )}
            <div style={{ marginTop: 24 }}>
              <Link to="/" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Back to home</Link>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg viewBox="0 0 28 28" fill="none" stroke="#22c55e" strokeWidth="2" width={32} height={32}>
                <path d="M5 14l7 7L23 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>Linked successfully!</h1>
            <p style={{ fontSize: 15, color: 'var(--muted)' }}>Redirecting to your dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg viewBox="0 0 28 28" fill="none" stroke="#ef4444" strokeWidth="2" width={32} height={32}>
                <path d="M7 7l14 14M21 7L7 21" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>Link failed</h1>
            <p style={{ margin: '0 0 32px', fontSize: 15, color: 'var(--muted)', lineHeight: 1.6 }}>{errorMsg}</p>
            <Link to="/login" style={{ display: 'inline-block', background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700 }}>
              Go to Login
            </Link>
          </>
        )}

      </div>
    </div>
  );
};

export default JoinParent;
