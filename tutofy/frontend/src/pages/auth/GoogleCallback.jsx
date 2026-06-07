import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../api/auth.js';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('connecting');
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const userId = params.get('state');

    if (!code || !userId) {
      setStatus('error');
      return;
    }

    authAPI.exchangeGoogleCode(code, userId)
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/tutor/profile'), 1500);
      })
      .catch(() => {
        setStatus('error');
      });
  }, [navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '40px 32px', background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 360, width: '100%' }}>
        {status === 'connecting' && (
          <>
            <div style={{ width: 48, height: 48, border: '4px solid #0d9488', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ margin: 0, fontSize: 16, color: '#444' }}>Connecting Google account…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width={24} height={24}>
                <path d="M5 12l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#0c0d12' }}>Google account connected!</p>
            <p style={{ margin: 0, fontSize: 13, color: '#6b6f7d' }}>Redirecting back to your profile…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width={24} height={24}>
                <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16v.5" strokeLinecap="round" />
              </svg>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0c0d12' }}>Connection failed</p>
            <button onClick={() => navigate('/tutor/profile')} style={{ padding: '10px 24px', background: '#0d9488', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Back to profile
            </button>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
