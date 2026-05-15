import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../api/auth';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Left Panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #4c6eff 0%, #3a56e8 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
          top: -100, right: -100,
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300,
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
          bottom: -80, left: -60,
        }} />

        {/* Logo */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: 0 }}>Tutofy</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0' }}>EdTech Platform</p>
        </div>

        <h1 style={{
          color: '#fff', fontSize: 40, fontWeight: 800,
          lineHeight: 1.2, margin: '0 0 20px', maxWidth: 440,
        }}>
          Sign in and continue learning
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.7)', fontSize: 16,
          lineHeight: 1.6, margin: '0 0 48px', maxWidth: 400,
        }}>
          Access your courses, schedule lessons, submit assignments, and track progress in one place.
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:20,height:20}}><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M8 3v14M4 7h4M4 11h4" strokeLinecap="round"/></svg>, text: 'Access all your enrolled courses' },
            { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:20,height:20}}><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H7l-4 4V4z"/></svg>, text: 'Chat with your tutors directly' },
            { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:20,height:20}}><path d="M3 17V9M7 17V5M11 17v-6M15 17V7" strokeLinecap="round"/></svg>, text: 'Track your learning progress' },
            { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:20,height:20}}><rect x="4" y="9" width="12" height="9" rx="1.5"/><path d="M7 9V6a3 3 0 016 0v3" strokeLinecap="round"/></svg>, text: 'Secure JWT authentication' },
          ].map((item) => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.9)', flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, margin: 0 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        width: 480,
        flexShrink: 0,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px',
      }}>
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ color: '#181b26', fontSize: 26, fontWeight: 800, margin: '0 0 8px' }}>
            Welcome back
          </h2>
          <p style={{ color: '#8a90a1', fontSize: 14, margin: 0 }}>
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'rgba(242,69,69,0.08)',
              border: '1px solid rgba(242,69,69,0.25)',
              color: '#f24545',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 13,
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#4c5162', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#f3f4f7', border: '1.5px solid #f3f4f7',
                borderRadius: 10, padding: '12px 16px',
                fontSize: 14, color: '#181b26',
                outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#4c6eff'}
              onBlur={(e) => e.target.style.borderColor = '#f3f4f7'}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', color: '#4c5162', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#f3f4f7', border: '1.5px solid #f3f4f7',
                borderRadius: 10, padding: '12px 16px',
                fontSize: 14, color: '#181b26',
                outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#4c6eff'}
              onBlur={(e) => e.target.style.borderColor = '#f3f4f7'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#8a90a1' : '#4c6eff',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0px 4px 16px rgba(76,110,255,0.35)',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: 28, paddingTop: 28,
          borderTop: '1px solid #f3f4f7',
          textAlign: 'center',
        }}>
          <p style={{ color: '#8a90a1', fontSize: 13, margin: '0 0 10px' }}>
            Don't have an account?{' '}
            <Link
              to={`/register${window.location.search}`}
              style={{ color: '#4c6eff', fontWeight: 700, textDecoration: 'none' }}
            >
              Sign up as student
            </Link>
          </p>
          <p style={{ color: '#8a90a1', fontSize: 13, margin: 0 }}>
            Want to teach?{' '}
            <Link to="/become-tutor" style={{ color: '#4c6eff', fontWeight: 700, textDecoration: 'none' }}>
              Become a tutor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
