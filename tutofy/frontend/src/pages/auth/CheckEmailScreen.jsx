import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';

const CheckEmailScreen = ({ email }) => {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    setLoading(true);
    try {
      await authAPI.resendVerification(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg viewBox="0 0 28 28" fill="none" stroke="var(--accent)" strokeWidth="1.6" width={32} height={32}>
            <rect x="3" y="6" width="22" height="16" rx="2"/>
            <path d="M3 8l11 8 11-8" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Check your email
        </h1>
        <p style={{ margin: '0 0 8px', fontSize: 15, color: 'var(--muted)', lineHeight: 1.6 }}>
          We sent a verification link to
        </p>
        <p style={{ margin: '0 0 32px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{email}</p>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          Click the link in the email to verify your account and start using Tutofy. The link expires in 24 hours.
        </p>
        {sent ? (
          <p style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>Email resent!</p>
        ) : (
          <button onClick={resend} disabled={loading}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', textDecoration: 'underline' }}>
            {loading ? 'Sending…' : "Didn't receive it? Resend"}
          </button>
        )}
        <div style={{ marginTop: 32 }}>
          <Link to="/login" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckEmailScreen;
