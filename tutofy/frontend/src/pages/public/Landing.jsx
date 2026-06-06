import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../api/users';
import { coursesAPI } from '../../api/courses';

const COLORS = ['#0d9488', '#7c3aed', '#0ea5e9', '#f59e0b', '#22c55e', '#f43f5e'];
const SUBJECT_TILES = [
  { mark: '∑', label: 'Math',        n: 124 },
  { mark: '<>', label: 'Programming', n: 98  },
  { mark: 'A', label: 'Languages',   n: 214 },
  { mark: '⚗', label: 'Science',     n: 76  },
  { mark: '$', label: 'Business',    n: 62  },
  { mark: '◈', label: 'Design',      n: 45  },
];

function tutorExtras(id) {
  const seed = id ? id.charCodeAt(0) + (id.charCodeAt(1) || 0) : 42;
  return {
    rating:    parseFloat((4.5 + (seed % 5) * 0.1).toFixed(1)),
    reviews:   8  + (seed % 40),
    hourlyRate:[3000,4000,5000,6000,7000,8000,5500,4500][seed % 8],
  };
}

function avatarColor(id) { return COLORS[(id?.charCodeAt(0) || 0) % COLORS.length]; }

const Stars = ({ n }) => (
  <span style={{ color: 'var(--warning)', fontSize: 13, letterSpacing: 1 }}>
    {'★'.repeat(Math.floor(n))}{'☆'.repeat(5 - Math.floor(n))}
  </span>
);

const Landing = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [tutors,  setTutors]  = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersAPI.getAllUsers().catch(() => ({})),
      coursesAPI.getAllCourses().catch(() => ({})),
    ]).then(([uRes, cRes]) => {
      const allUsers   = uRes?.users   || [];
      const allCourses = cRes?.courses || [];
      setTutors(allUsers.filter(u => u.role === 'tutor'));
      setCourses(allCourses);
    }).finally(() => setLoading(false));
  }, []);

  const enrichedTutors = tutors.slice(0, 6).map(t => {
    const myCourses = courses.filter(c => c.tutor_id === t.id);
    const extras    = tutorExtras(t.id);
    const color     = avatarColor(t.id);
    const initials  = t.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
    const subjects  = [...new Set(myCourses.map(c => c.subject).filter(Boolean))].slice(0, 2);
    return { ...t, extras, color, initials, subjects };
  });

  const fallback = [
    { id: null, initials: 'AJ', name: 'Alice Johnson', subjects: ['English','IELTS'],   color: '#0d9488', extras: { rating: 4.9, reviews: 34, hourlyRate: 5000 } },
    { id: null, initials: 'EA', name: 'Edil Abenov',   subjects: ['Business English'], color: '#7c3aed', extras: { rating: 4.8, reviews: 21, hourlyRate: 4000 } },
    { id: null, initials: 'SW', name: 'Sara Williams', subjects: ['Math','Calculus'],   color: '#0ea5e9', extras: { rating: 5.0, reviews: 45, hourlyRate: 6000 } },
    { id: null, initials: 'TB', name: 'Timur Bekov',   subjects: ['Python','React'],   color: '#f59e0b', extras: { rating: 4.7, reviews: 18, hourlyRate: 7000 } },
    { id: null, initials: 'AD', name: 'Assem D.',      subjects: ['Russian','English'], color: '#22c55e', extras: { rating: 4.9, reviews: 29, hourlyRate: 3500 } },
    { id: null, initials: 'MK', name: 'Maria Kim',     subjects: ['Design','UX'],      color: '#f43f5e', extras: { rating: 4.8, reviews: 12, hourlyRate: 5500 } },
  ];

  const displayTutors = (!loading && enrichedTutors.length > 0) ? enrichedTutors : fallback;
  const dashLink = isAuthenticated ? (role === 'tutor' ? '/tutor/dashboard' : role === 'admin' ? '/admin/dashboard' : '/tutors') : null;
  const dashLabel = role === 'student' ? 'Find tutors →' : 'Dashboard →';

  /* shared inner container style */
  const section = { maxWidth: 1200, margin: '0 auto', padding: '0 40px', width: '100%' };

  return (
    <div className="page-fade" style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Topnav ── */}
      <header className="topnav">
        <div className="topnav-inner">
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <img src="/logo.svg" alt="tutofy" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16 }}>tutofy</span>
          </Link>

          {/* Nav center */}
          <nav className="topnav-links" style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1, justifyContent: 'center' }}>
            <Link to="/tutors" style={{ color: 'var(--text-2)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color='var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--text-2)'}>
              Find tutors
            </Link>
            <Link to="/become-tutor" style={{ color: 'var(--text-2)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color='var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--text-2)'}>
              Become a tutor
            </Link>
            <a
              href="#how-it-works"
              onClick={e => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ color: 'var(--text-2)', fontSize: 14, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color='var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--text-2)'}>
              How it works
            </a>
          </nav>

          {/* Auth right */}
          <div className="topnav-cta-group" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {isAuthenticated ? (
              <>
                <Link to="/tutors" style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500, textDecoration: 'none', padding: '7px 12px' }}>Find tutors</Link>
                <Link to={dashLink} style={{ background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 'var(--r-md)', textDecoration: 'none' }}>
                  {dashLabel}
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none', padding: '7px 12px' }}>Sign in</Link>
                <Link to="/register" style={{ background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 'var(--r-md)', textDecoration: 'none' }}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ background: 'var(--surface)', padding: '80px 0 72px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...section, textAlign: 'center', boxSizing: 'border-box' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--accent-soft)', color: 'var(--accent)',
            fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 99,
            marginBottom: 28, letterSpacing: 0.02,
          }}>
            ⚡ New: Group classes are now live
          </span>

          <h1 className="landing-hero-title" style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 20px', maxWidth: 740, marginLeft: 'auto', marginRight: 'auto' }}>
            Live 1-on-1 learning with{' '}
            <span style={{ color: 'var(--accent)' }}>experts</span>{' '}
            you can trust
          </h1>

          <p style={{ fontSize: 18, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 40, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Tutofy connects serious learners with vetted tutors across 40+ subjects. Pick a course, book a lesson, see real progress.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 56 }}>
            <Link to="/tutors"
              style={{ background: 'var(--accent)', color: '#fff', fontSize: 16, fontWeight: 700, padding: '14px 32px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 8px 24px rgba(13,148,136,0.35)', transition: 'background var(--t-fast)' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--accent-hover)'}
              onMouseLeave={e => e.currentTarget.style.background='var(--accent)'}>
              Find tutor
            </Link>
            <Link to="/become-tutor"
              style={{ background: 'var(--surface)', color: 'var(--text-2)', fontSize: 16, fontWeight: 600, padding: '13px 32px', borderRadius: 12, textDecoration: 'none', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-xs)', transition: 'border-color var(--t-fast), box-shadow var(--t-fast)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-strong)'; e.currentTarget.style.boxShadow='var(--shadow-sm)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='var(--shadow-xs)'; }}>
              Become tutor
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48 }}>
            {[['2,000+','Expert tutors'],['50K','Active students'],['4.9','Average rating'],['98%','Satisfaction']].map(([v,l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular subjects ── */}
      <section style={{ padding: '64px 0' }}>
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Popular subjects</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Browse the most-requested topics this week</p>
            </div>
            <Link to="/tutors" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              All subjects →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {SUBJECT_TILES.map(s => (
              <Link key={s.label} to={`/tutors?subject=${encodeURIComponent(s.label)}`}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '20px 12px', textAlign: 'center', textDecoration: 'none', transition: 'border-color var(--t-base), box-shadow var(--t-base)', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(13,148,136,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='none'; }}>
                <div style={{ fontSize: 22, marginBottom: 8, color: 'var(--accent)' }}>{s.mark}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ background: 'var(--surface)', padding: '64px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...section, textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>How it works</h2>
          <p style={{ margin: '0 0 48px', fontSize: 14, color: 'var(--muted)' }}>From signup to first lesson in under five minutes</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 860, margin: '0 auto' }}>
            {[
              { n: '1', title: 'Find your tutor', desc: 'Filter by subject, price and availability. Read student reviews.' },
              { n: '2', title: 'Book a trial lesson', desc: 'Pick a time that works for you. Your first 30-minute lesson is risk-free.' },
              { n: '3', title: 'Learn and track progress', desc: 'Meet over video, get graded homework, watch your scores improve.' },
            ].map(s => (
              <div key={s.n} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-2xl)', padding: '28px 24px', textAlign: 'left', position: 'relative' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  {s.n}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top-rated tutors ── */}
      <section style={{ padding: '64px 0' }}>
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Top-rated tutors</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Hand-picked from the highest-rated profiles this month</p>
            </div>
            <Link to="/tutors" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Browse all →
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--accent-soft)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {displayTutors.slice(0, 6).map(tutor => {
                const { extras, color, initials, subjects } = tutor;
                return (
                  <div key={tutor.id || tutor.name}
                    className="app-card"
                    style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: color, color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tutor.name}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(subjects?.length > 0 ? subjects : ['Online Tutor']).map(s => (
                            <span key={s} className="badge badge-gray" style={{ fontSize: 10 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                      <Stars n={extras.rating} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{extras.rating}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>({extras.reviews})</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{extras.hourlyRate.toLocaleString()}</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}> KZT / lesson</span>
                      </div>
                      <Link
                        to={tutor.id ? (isAuthenticated ? `/tutors/${tutor.id}` : `/register?redirect=/tutors/${tutor.id}`) : '/tutors'}
                        style={{ background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 'var(--r-md)', textDecoration: 'none' }}>
                        {isAuthenticated ? 'View' : 'Book trial'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section style={{ padding: '64px 0' }}>
        <div style={section}>
          <div style={{ background: 'var(--accent)', borderRadius: 'var(--r-2xl)', padding: '48px 52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Start learning today</h2>
              <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.75)' }}>Risk-free trial lesson. Cancel anytime.</p>
            </div>
            <Link to={isAuthenticated && role === 'student' ? '/tutors' : '/register'}
              style={{ background: '#fff', color: 'var(--accent)', fontSize: 15, fontWeight: 700, padding: '14px 28px', borderRadius: 'var(--r-lg)', textDecoration: 'none', flexShrink: 0, transition: 'opacity var(--t-fast)' }}
              onMouseEnter={e => e.currentTarget.style.opacity='.9'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              Get started →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--text)', padding: '52px 0 32px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ ...section, display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <img src="/logo.svg" alt="tutofy" style={{ width: 26, height: 26, borderRadius: '50%' }} />
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>tutofy</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', maxWidth: 240 }}>Live 1-on-1 learning with vetted experts. Built for serious learners.</p>
            </div>
            <div style={{ display: 'flex', gap: 48 }}>
              {[
                { title: 'Product', links: [['Find tutor','/tutors'],['Become tutor','/become-tutor']] },
                { title: 'Company', links: [['Sign in','/login'],['Create account','/register']] },
              ].map(col => (
                <div key={col.title}>
                  <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{col.title}</p>
                  {col.links.map(([label, href]) => (
                    <div key={label} style={{ marginBottom: 8 }}>
                      <Link to={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}
                        onMouseEnter={e => e.target.style.color='#fff'}
                        onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.65)'}>
                        {label}
                      </Link>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>© 2026 Tutofy. All rights reserved.</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Terms · Privacy · Cookies</p>
          </div>
        </div>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Landing;
