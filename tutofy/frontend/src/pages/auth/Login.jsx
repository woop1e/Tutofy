import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../api/auth';
import CheckEmailScreen from './CheckEmailScreen';

const Login = () => {
  const [formData,     setFormData]     = useState({ email: '', password: '' });
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [verifyEmail,  setVerifyEmail]  = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login(formData);
      login(response.token);
      const decoded = JSON.parse(atob(response.token.split('.')[1]));
      if (decoded.role === 'tutor') {
        navigate('/tutor/dashboard', { replace: true });
      } else if (decoded.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        navigate(redirect || '/student/dashboard', { replace: true });
      }
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'EMAIL_NOT_VERIFIED') {
        setVerifyEmail(formData.email);
        return;
      }
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifyEmail) return <CheckEmailScreen email={verifyEmail} />;

  return (
    <div className="page-fade" style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Left — quote panel */}
      <div style={{
        flex: 1,
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px 56px',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/logo.svg" alt="tutofy" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 17 }}>tutofy</span>
        </Link>

        {/* Quote */}
        <div>
          <p style={{
            fontSize: 22, fontWeight: 600, lineHeight: 1.45,
            color: 'var(--text)', marginBottom: 16, letterSpacing: '-0.02em',
          }}>
            "Tutofy turned three weekends of frustration into the breakthrough I needed."
          </p>
          <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>
            — Maya R., Engineering student at AITU
          </p>

          {/* Trust stats */}
          <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
            {[['2 000+', 'Expert tutors'], ['50K', 'Active students'], ['4.9', 'Avg rating']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{n}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--muted)' }}>© 2026 Tutofy. All rights reserved.</p>
      </div>

      {/* Right — form */}
      <div style={{
        width: 480,
        flexShrink: 0,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 52px',
      }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>
            Welcome back
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            Sign in to continue where you left off.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && (
            <div style={{
              background: 'var(--danger-soft)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--danger)',
              borderRadius: 'var(--r-md)',
              padding: '11px 14px',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <div>
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
              Remember me
            </label>
            <a style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'var(--muted)' : 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--r-md)',
              padding: '13px',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background var(--t-fast)',
              marginTop: 4,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
            Don't have an account?{' '}
            <Link to={`/register${window.location.search}`} style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
            Want to teach?{' '}
            <Link to="/become-tutor" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
              Become a tutor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
