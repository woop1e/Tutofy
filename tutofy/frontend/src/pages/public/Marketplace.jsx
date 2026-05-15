import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usersAPI } from '../../api/users';
import { enrollmentsAPI } from '../../api/enrollments';
import { useAuth } from '../../contexts/AuthContext';

const SUBJECTS = ['All subjects', 'English', 'Math', 'Science', 'Programming', 'Business', 'Music', 'Design'];

const COLORS = ['#4c6eff', '#935bf5', '#00beb7', '#ff8032', '#22be70', '#f24545'];
function avatarColor(id) { return COLORS[(id?.charCodeAt(0) || 0) % COLORS.length]; }

const Stars = ({ rating }) => {
  const full  = Math.floor(rating);
  const empty = 5 - full;
  return (
    <span className="text-[#fbbf24] text-[13px]">
      {'★'.repeat(full)}{'☆'.repeat(empty)}
    </span>
  );
};

/* ── Animated register-prompt modal ── */
function RegisterModal({ tutorId, tutorName, onClose }) {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const goRegister = () => {
    close();
    setTimeout(() => {
      navigate(`/register?redirect=${encodeURIComponent('/tutors/' + tutorId)}`);
    }, 300);
  };

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: visible ? 'rgba(0,0,0,0.45)' : 'transparent',
        backdropFilter: visible ? 'blur(3px)' : 'none',
        transition: 'background 300ms ease, backdrop-filter 300ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          margin: '0 16px 32px',
          background: '#fff',
          borderRadius: 28,
          padding: '36px 32px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
          position: 'relative',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(80px) scale(0.96)',
          opacity: visible ? 1 : 0,
          transition: 'transform 300ms cubic-bezier(0.34,1.56,0.64,1), opacity 300ms ease',
        }}
      >
        <button
          onClick={close}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: '50%',
            background: '#f3f4f7', border: 'none',
            cursor: 'pointer', fontSize: 14, color: '#8a90a1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>

        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(76,110,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#4c6eff' }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:32,height:32}}><circle cx="10" cy="7" r="4"/><path d="M2 18a8 8 0 0116 0"/></svg>
        </div>

        <h2 style={{ textAlign: 'center', color: '#181b26', fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>
          {tutorName ? `Book a lesson with ${tutorName}` : 'View tutor profile'}
        </h2>
        <p style={{ textAlign: 'center', color: '#8a90a1', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
          Create a free account to book lessons, message tutors, and track your progress.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 28 }}>
          {[
            { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:28,height:28}}><circle cx="10" cy="10" r="8"/><circle cx="10" cy="10" r="4"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/></svg>, label: 'Find expert\ntutors' },
            { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:28,height:28}}><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H7l-4 4V4z"/></svg>, label: 'Message\ndirectly' },
            { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:28,height:28}}><rect x="2" y="4" width="16" height="14" rx="1.5"/><path d="M6 2v4M14 2v4M2 9h16" strokeLinecap="round"/></svg>, label: 'Book\nanytime' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ textAlign: 'center', color: '#4c6eff' }}>
              <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{icon}</div>
              <div style={{ color: '#8a90a1', fontSize: 11, fontWeight: 600, whiteSpace: 'pre-line', lineHeight: 1.3 }}>{label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={goRegister}
          style={{
            width: '100%', padding: '14px',
            background: '#4c6eff', color: '#fff',
            border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(76,110,255,0.35)',
            marginBottom: 10,
          }}
        >
          Create free account →
        </button>
        <button
          onClick={() => { window.open('/login', '_blank', 'noopener,noreferrer'); close(); }}
          style={{
            width: '100%', padding: '13px',
            background: 'transparent', color: '#4c5162',
            border: '1.5px solid #d2d4d9', borderRadius: 12,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#4c6eff'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = '#d2d4d9'}
        >
          Already have an account? Log in
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
const Marketplace = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tutors, setTutors]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState(() => {
    const sp = searchParams.get('subject');
    return sp && SUBJECTS.includes(sp) ? sp : 'All subjects';
  });
  const [search, setSearch]   = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [modal, setModal] = useState(null);
  const [hasEnrollments, setHasEnrollments] = useState(false);

  useEffect(() => {
    usersAPI.searchTutors()
      .then((res) => setTutors(res?.tutors || []))
      .catch(() => setTutors([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated && role === 'student' && user?.user_id) {
      enrollmentsAPI.getUserEnrollments(user.user_id)
        .then((res) => {
          const list = res?.enrollments || res || [];
          setHasEnrollments(Array.isArray(list) ? list.length > 0 : false);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, role, user?.user_id]);

  const filtered = useMemo(() =>
    tutors.filter((t) => {
      if (search) {
        const q = search.toLowerCase();
        const nameOk     = (t.name || '').toLowerCase().includes(q);
        const subjectOk  = (t.subjects || []).some((s) => s.toLowerCase().includes(q));
        const locationOk = (t.location || '').toLowerCase().includes(q);
        if (!nameOk && !subjectOk && !locationOk) return false;
      }
      if (maxPrice) {
        const price = t.hourly_price || 0;
        if (price > parseInt(maxPrice)) return false;
      }
      if (subject !== 'All subjects') {
        const sub = subject.toLowerCase();
        const ok  = (t.subjects || []).some((s) => s.toLowerCase().includes(sub));
        if (!ok) return false;
      }
      return true;
    }),
  [tutors, search, maxPrice, subject]);

  const handleProtectedAction = (tutorId, tutorName) => {
    if (isAuthenticated) {
      navigate(`/tutors/${tutorId}`);
    } else {
      setModal({ tutorId, tutorName });
    }
  };

  const showLmsButton = role === 'tutor' || (role === 'student' && hasEnrollments);
  const dashLink = role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard';

  return (
    <div className="min-h-screen bg-[#f5f6fa] font-sans">
      {modal && (
        <RegisterModal
          tutorId={modal.tutorId}
          tutorName={modal.tutorName}
          onClose={() => setModal(null)}
        />
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-[#ebebf0] h-[60px] flex items-center px-8 sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto w-full flex items-center justify-between">
          <Link to="/" className="text-[#4c6eff] text-[20px] font-bold">Tutofy</Link>
          <div className="flex items-center gap-6">
            <Link to="/tutors" className="text-[#181b26] text-[14px] font-semibold">Find Tutors</Link>
            <Link to="/become-tutor" className="text-[#8a90a1] text-[14px] hover:text-[#181b26] transition-colors">
              Become a Tutor
            </Link>
            {isAuthenticated && showLmsButton ? (
              <Link
                to={dashLink}
                className="bg-[#4c6eff] text-white text-[13px] font-semibold px-4 py-2 rounded-[8px] hover:opacity-90 transition-opacity"
              >
                My LMS →
              </Link>
            ) : !isAuthenticated ? (
              <div className="flex items-center gap-3">
                <a href="/login" target="_blank" rel="noopener noreferrer" className="text-[#8a90a1] text-[14px] hover:text-[#181b26]">Log in</a>
                <Link to="/register" className="bg-[#4c6eff] text-white text-[13px] font-semibold px-4 py-2 rounded-[8px] hover:opacity-90">
                  Sign up
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Header + filters */}
      <div className="bg-white border-b border-[#ebebf0] py-8 px-8">
        <div className="max-w-[1280px] mx-auto">
          <h1 className="text-[#181b26] text-[26px] font-bold mb-7">Find online tutors &amp; teachers</h1>

          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#8a90a1] font-medium">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-[42px] px-4 border border-[#d2d4d9] rounded-[8px] text-[14px] text-[#181b26] bg-white focus:outline-none focus:border-[#4c6eff] min-w-[180px]"
              >
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#8a90a1] font-medium">Price per hour</label>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-[42px] px-4 border border-[#d2d4d9] rounded-[8px] text-[14px] text-[#181b26] bg-white focus:outline-none focus:border-[#4c6eff] min-w-[180px]"
              >
                <option value="">Any price</option>
                <option value="5000">Up to 5,000 KZT</option>
                <option value="10000">Up to 10,000 KZT</option>
                <option value="20000">Up to 20,000 KZT</option>
                <option value="50000">Up to 50,000 KZT</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 ml-auto">
              <label className="text-[11px] text-[#8a90a1] font-medium">Search</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a90a1]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/>
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, subject, or location"
                  className="h-[42px] pl-9 pr-4 border border-[#d2d4d9] rounded-[8px] text-[14px] text-[#181b26] bg-white focus:outline-none focus:border-[#4c6eff] w-[280px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tutor list */}
      <div className="max-w-[1280px] mx-auto px-8 py-6">
        {!loading && (
          <p className="text-[#8a90a1] text-[13px] mb-5">
            {filtered.length} tutor{filtered.length !== 1 ? 's' : ''} available
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#4c6eff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-7 h-7">
                <circle cx="8" cy="8" r="5.5"/><path d="M13 13l4 4" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[#181b26] text-[18px] font-semibold mb-2">No tutors found</p>
            <p className="text-[#8a90a1] text-[14px]">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((tutor) => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                isAuthenticated={isAuthenticated}
                onProtectedAction={() => handleProtectedAction(tutor.id, tutor.name)}
              />
            ))}

          </div>
        )}
      </div>
    </div>
  );
};

/* ── Individual tutor card ── */
const TutorCard = ({ tutor, isAuthenticated, onProtectedAction }) => {
  const color    = avatarColor(tutor.id);
  const initials = (tutor.name || '??').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const subjects = tutor.subjects || [];
  const bio      = tutor.bio || 'Expert tutor with personalized sessions tailored to your learning goals.';
  const hasRating = tutor.avg_rating > 0;
  const price    = tutor.hourly_price || 0;

  return (
    <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6 flex gap-6 hover:shadow-[0_4px_20px_0_rgba(0,0,0,0.07)] transition-shadow">

      {/* Avatar */}
      <div className="flex-shrink-0">
        {tutor.photo_url ? (
          <img
            src={tutor.photo_url}
            alt={tutor.name}
            className="w-[90px] h-[90px] rounded-[16px] object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="w-[90px] h-[90px] rounded-[16px] items-center justify-center text-white text-[28px] font-bold select-none"
          style={{ backgroundColor: color, display: tutor.photo_url ? 'none' : 'flex' }}
        >
          {initials}
        </div>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">

            {/* Name */}
            <h3 className="text-[#181b26] text-[17px] font-bold mb-2">{tutor.name}</h3>

            {/* Subjects */}
            {subjects.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {subjects.slice(0, 5).map((s) => (
                  <span key={s} className="bg-[#f0f2ff] text-[#4c6eff] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
                {subjects.length > 5 && (
                  <span className="text-[11px] text-[#8a90a1] self-center">+{subjects.length - 5}</span>
                )}
              </div>
            ) : (
              <p className="text-[#8a90a1] text-[12px] mb-2">No subjects listed</p>
            )}

            {/* Bio */}
            <p className="text-[#4c5162] text-[13px] leading-[1.6] line-clamp-2 max-w-[580px]">
              {bio}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-5 mt-3 flex-wrap">
              {hasRating ? (
                <div className="flex items-center gap-1.5">
                  <Stars rating={tutor.avg_rating} />
                  <span className="text-[#181b26] text-[13px] font-bold">{tutor.avg_rating.toFixed(1)}</span>
                  <span className="text-[#8a90a1] text-[12px]">({tutor.review_count} reviews)</span>
                </div>
              ) : (
                <span className="text-[#8a90a1] text-[12px]">No reviews yet</span>
              )}
              {tutor.location && (
                <span className="text-[#8a90a1] text-[12px] flex items-center gap-1">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3 h-3">
                    <path d="M7 1a4 4 0 014 4c0 3-4 8-4 8S3 8 3 5a4 4 0 014-4z"/>
                    <circle cx="7" cy="5" r="1.2" fill="currentColor" stroke="none"/>
                  </svg>
                  {tutor.location}
                </span>
              )}
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex-shrink-0 text-right min-w-[160px]">
            <div className="mb-4">
              {price > 0 ? (
                <>
                  <p className="text-[#181b26] text-[20px] font-bold leading-none">
                    {price.toLocaleString()}<span className="text-[#8a90a1] text-[13px] font-normal"> KZT</span>
                  </p>
                  <p className="text-[#8a90a1] text-[11px] mt-0.5">per hour</p>
                </>
              ) : (
                <>
                  <p className="text-[#8a90a1] text-[14px] font-medium">Price on request</p>
                </>
              )}
              {tutor.min_price > 0 && (
                <div className="mt-2 pt-2 border-t border-[#f0f0f5]">
                  <p className="text-[#4c6eff] text-[15px] font-bold leading-none">
                    from {tutor.min_price.toLocaleString()} KZT
                  </p>
                  <p className="text-[#8a90a1] text-[11px] mt-0.5">Group course</p>
                </div>
              )}
            </div>

            <button
              onClick={onProtectedAction}
              className="w-full bg-[#4c6eff] text-white text-[13px] font-semibold py-2.5 rounded-[10px] hover:opacity-90 transition-opacity mb-2"
            >
              Book a lesson
            </button>
            <Link
              to={`/tutors/${tutor.id}`}
              className="block w-full text-center border border-[#d2d4d9] text-[#4c5162] text-[13px] font-semibold py-2.5 rounded-[10px] hover:border-[#4c6eff] hover:text-[#4c6eff] transition-colors"
            >
              View profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
