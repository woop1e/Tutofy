import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../api/users';
import { coursesAPI } from '../../api/courses';

const COLORS = ['#4c6eff', '#935bf5', '#00beb7', '#ff8032', '#22be70', '#f5447a'];

function tutorExtras(id) {
  const seed       = id ? id.charCodeAt(0) + (id.charCodeAt(1) || 0) : 42;
  const rating     = parseFloat((4.5 + (seed % 5) * 0.1).toFixed(1));
  const reviews    = 8  + (seed % 40);
  const hourlyRate = [12, 15, 18, 20, 22, 25, 17, 14][seed % 8];
  return { rating, reviews, hourlyRate };
}

function avatarColor(id) { return COLORS[(id?.charCodeAt(0) || 0) % COLORS.length]; }

const Stars = ({ n }) => (
  <span className="text-[#ffa61a] text-[12px]">
    {'★'.repeat(Math.floor(n))}{'☆'.repeat(5 - Math.floor(n))}
  </span>
);

// Subject tiles → values must match Marketplace SUBJECTS array
const SUBJECT_TILES = [
  { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><path d="M10 4v12M4 10h12" strokeLinecap="round"/></svg>, label: 'Math' },
  { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><rect x="2" y="4" width="16" height="12" rx="1.5"/><path d="M6 14h8M2 12h16" strokeLinecap="round"/></svg>, label: 'Programming' },
  { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><path d="M2 4a1 1 0 011-1h5a3 3 0 013 3v11a3 3 0 00-3-3H3a1 1 0 01-1-1V4zM18 4a1 1 0 00-1-1h-5a3 3 0 00-3 3v11a3 3 0 013-3h5a1 1 0 001-1V4z"/></svg>, label: 'English' },
  { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 3" strokeLinecap="round"/></svg>, label: 'Science' },
  { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><rect x="2" y="5" width="16" height="12" rx="1.5"/><path d="M6 5V4a2 2 0 014 0v1M10 5V4a2 2 0 014 0v1" strokeLinecap="round"/></svg>, label: 'Business' },
  { icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><circle cx="10" cy="10" r="8"/><circle cx="7" cy="8" r="1" fill="currentColor"/><circle cx="13" cy="8" r="1" fill="currentColor"/><circle cx="10" cy="13" r="1" fill="currentColor"/><circle cx="7" cy="13" r="1" fill="currentColor"/></svg>, label: 'Design' },
];

const Landing = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [tutors, setTutors]   = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersAPI.getAllUsers().catch(() => ({})),
      coursesAPI.getAllCourses().catch(() => ({})),
    ]).then(([usersRes, coursesRes]) => {
      const allUsers   = usersRes?.users   || [];
      const allCourses = coursesRes?.courses || [];
      setTutors(allUsers.filter((u) => u.role === 'tutor'));
      setCourses(allCourses);
    }).finally(() => setLoading(false));
  }, []);

  const enrichedTutors = tutors.slice(0, 6).map((t) => {
    const myCourses = courses.filter((c) => c.tutor_id === t.id);
    const extras    = tutorExtras(t.id);
    const color     = avatarColor(t.id);
    const initials  = t.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??';
    const subjects  = [...new Set(myCourses.map((c) => c.subject).filter(Boolean))].slice(0, 2);
    return { ...t, myCourses, extras, color, initials, subjects };
  });

  // Fallback cards for when the API is empty
  const fallback = [
    { id: null, initials: 'AJ', name: 'Alice Johnson',  subjects: ['English', 'IELTS'],  color: '#4c6eff', extras: { rating: 4.9, reviews: 34, hourlyRate: 18 } },
    { id: null, initials: 'EA', name: 'Edil Abenov',    subjects: ['Business English'],   color: '#935bf5', extras: { rating: 4.8, reviews: 21, hourlyRate: 15 } },
    { id: null, initials: 'SW', name: 'Sara Williams',  subjects: ['Math', 'Calculus'],   color: '#00beb7', extras: { rating: 5.0, reviews: 45, hourlyRate: 20 } },
    { id: null, initials: 'TB', name: 'Timur Bekov',    subjects: ['Python', 'React'],    color: '#ff8032', extras: { rating: 4.7, reviews: 18, hourlyRate: 22 } },
    { id: null, initials: 'AD', name: 'Assem D.',       subjects: ['Russian', 'English'], color: '#22be70', extras: { rating: 4.9, reviews: 29, hourlyRate: 14 } },
    { id: null, initials: 'MK', name: 'Maria Kim',      subjects: ['Design', 'UX'],       color: '#f5447a', extras: { rating: 4.8, reviews: 12, hourlyRate: 17 } },
  ];

  const displayTutors = (!loading && enrichedTutors.length > 0) ? enrichedTutors : fallback;

  const dashLink = isAuthenticated
    ? (role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard')
    : null;

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">

      {/* ── Navbar ── */}
      <nav className="bg-white h-[68px] shadow-[0_2px_12px_0_rgba(0,0,0,0.06)] sticky top-0 z-50 flex items-center">
        <div className="max-w-[1280px] mx-auto px-10 w-full flex items-center justify-between">
          <Link to="/" className="text-[#4c6eff] text-[22px] font-bold">Tutofy</Link>
          <div className="flex items-center gap-8">
            <Link to="/tutors" className="text-[#4c5162] text-[15px] hover:text-[#4c6eff] transition-colors">
              Find Tutors
            </Link>
            <Link to="/become-tutor" className="text-[#4c5162] text-[15px] hover:text-[#4c6eff] transition-colors">
              Become a Tutor
            </Link>
            {isAuthenticated ? (
              <Link to={dashLink}
                className="bg-[#4c6eff] text-white text-[14px] font-semibold px-5 py-2.5 rounded-[10px] hover:bg-[#3a56e0] transition-colors">
                My Dashboard →
              </Link>
            ) : (
              <>
                <a href="/login" target="_blank" rel="noopener noreferrer" className="text-[#4c6eff] text-[15px] font-semibold hover:opacity-80">
                  Log in
                </a>
                <Link to="/register"
                  className="bg-[#4c6eff] text-white text-[14px] font-semibold px-5 py-2.5 rounded-[10px] hover:bg-[#3a56e0] transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-white py-20">
        <div className="max-w-[1280px] mx-auto px-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[rgba(76,110,255,0.08)] text-[#4c6eff] text-[13px] font-medium px-4 py-2 rounded-full mb-7">
            Trusted by 50,000+ students worldwide
          </div>
          <h1 className="text-[58px] font-bold text-[#181b26] leading-[1.18] mb-6 max-w-[780px] mx-auto">
            Find Your Perfect<br />Tutor Today
          </h1>
          <p className="text-[#8a90a1] text-[18px] leading-relaxed mb-10 max-w-[520px] mx-auto">
            Learn anything with expert tutors — on your schedule, at your pace. Real results guaranteed.
          </p>

          <div className="flex items-center justify-center gap-4 mb-14">
            <Link to="/tutors"
              className="bg-[#4c6eff] text-white font-bold text-[17px] px-10 py-4 rounded-[14px] shadow-[0_10px_30px_-3px_rgba(76,110,255,0.4)] hover:bg-[#3a56e0] transition-all">
              Find a Tutor →
            </Link>
            <Link to="/become-tutor"
              className="border-[1.5px] border-[#4c6eff] text-[#4c6eff] font-semibold text-[17px] px-10 py-4 rounded-[14px] hover:bg-[rgba(76,110,255,0.06)] transition-all">
              Become a Tutor
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12">
            {[
              { value: '50K+', label: 'Students' },
              { value: '2K+', label: 'Expert Tutors' },
              { value: '98%', label: 'Satisfaction' },
              { value: '4.9★', label: 'Avg Rating' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[#181b26] text-[26px] font-bold leading-none mb-1">{s.value}</p>
                <p className="text-[#8a90a1] text-[14px]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Subjects ── */}
      <section className="py-16 bg-[#f8f9fc]">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-[#181b26] text-[26px] font-bold text-center mb-10">Popular Subjects</h2>
          <div className="grid grid-cols-6 gap-3">
            {SUBJECT_TILES.map((subj) => (
              <Link
                key={subj.label}
                to={`/tutors?subject=${encodeURIComponent(subj.label)}`}
                className="bg-white border border-[#f0f0f5] rounded-[14px] px-4 py-5 text-center hover:border-[#4c6eff] hover:shadow-sm transition-all group"
              >
                <div className="flex justify-center mb-2 text-[#4c6eff]">{subj.icon}</div>
                <p className="text-[14px] font-semibold text-[#181b26] group-hover:text-[#4c6eff] transition-colors">
                  {subj.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top-Rated Tutors ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-[#181b26] text-[32px] font-bold mb-2">Top-Rated Tutors</h2>
              <p className="text-[#8a90a1] text-[16px]">Expert tutors ready to help you succeed</p>
            </div>
            <Link to="/tutors" className="text-[#4c6eff] text-[14px] font-semibold hover:underline">
              See all tutors →
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#4c6eff] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {displayTutors.map((tutor) => {
                const { extras, color, initials, subjects } = tutor;
                return (
                  <div key={tutor.id || tutor.name}
                    className="bg-white border border-[#f0f0f5] rounded-[20px] p-6 hover:shadow-[0_8px_30px_0_rgba(0,0,0,0.10)] transition-all">

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-14 h-14 rounded-[14px] flex items-center justify-center text-white font-bold text-[18px] flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#181b26] font-bold text-[16px] truncate">{tutor.name}</p>
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          {(subjects?.length > 0 ? subjects : ['Online Tutor']).map((s) => (
                            <span key={s} className="text-[11px] text-[#8a90a1] bg-[#f5f6fa] px-2 py-0.5 rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <Stars n={extras.rating} />
                      <span className="text-[#181b26] text-[13px] font-semibold">{extras.rating}</span>
                      <span className="text-[#8a90a1] text-[12px]">({extras.reviews} reviews)</span>
                    </div>

                    {/* Price + Action */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#181b26] text-[18px] font-bold leading-none">${extras.hourlyRate}<span className="text-[#8a90a1] text-[12px] font-normal">/hr</span></p>
                        <p className="text-[#8a90a1] text-[11px]">Individual lessons</p>
                      </div>
                      {isAuthenticated ? (
                        <Link
                          to={tutor.id ? `/tutors/${tutor.id}` : '/tutors'}
                          className="text-[13px] font-semibold px-5 py-2 rounded-[10px] text-white hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: color }}
                        >
                          View Profile
                        </Link>
                      ) : (
                        <Link
                          to={tutor.id ? `/register?redirect=${encodeURIComponent('/tutors/' + tutor.id)}` : '/register'}
                          className="text-[13px] font-semibold px-5 py-2 rounded-[10px] text-white hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: color }}
                        >
                          Book Now
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Guest CTA */}
          {!isAuthenticated && (
            <div className="mt-10 bg-gradient-to-r from-[#4c6eff] to-[#7a5af8] rounded-[20px] p-8 flex items-center justify-between">
              <div>
                <p className="text-white text-[20px] font-bold mb-1">Ready to start learning?</p>
                <p className="text-white/75 text-[15px]">Register for free and unlock access to 2,000+ expert tutors.</p>
              </div>
              <Link
                to="/register"
                className="bg-white text-[#4c6eff] font-bold text-[15px] px-7 py-3 rounded-[12px] hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                Sign Up Free →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-20 bg-[#f8f9fc]">
        <div className="max-w-[1280px] mx-auto px-10 text-center">
          <h2 className="text-[#181b26] text-[32px] font-bold mb-3">How Tutofy Works</h2>
          <p className="text-[#8a90a1] text-[16px] mb-14">Start learning in three simple steps</p>
          <div className="grid grid-cols-3 gap-8 max-w-[960px] mx-auto">
            {[
              {
                step: '01',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="#4c6eff" strokeWidth="1.5" className="w-7 h-7"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4-4" strokeLinecap="round"/></svg>,
                title: 'Find a Tutor',
                desc: 'Browse top tutors by subject, availability, and price. Read reviews from real students.',
              },
              {
                step: '02',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="#4c6eff" strokeWidth="1.5" className="w-7 h-7"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
                title: 'Book a Session',
                desc: 'Schedule a 1-on-1 lesson at a time that suits you, or join a small group course.',
              },
              {
                step: '03',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="#4c6eff" strokeWidth="1.5" className="w-7 h-7"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
                title: 'Start Learning',
                desc: 'Learn with a dedicated tutor and track your progress with a personal dashboard.',
              },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-[20px] border border-[#f0f0f5] p-8 text-left relative">
                <span className="absolute top-6 right-6 text-[#f0f0f5] text-[40px] font-black">{s.step}</span>
                <div className="w-12 h-12 rounded-[12px] bg-[rgba(76,110,255,0.08)] flex items-center justify-center mb-5">
                  {s.icon}
                </div>
                <h3 className="text-[#181b26] text-[18px] font-bold mb-3">{s.title}</h3>
                <p className="text-[#8a90a1] text-[14px] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Tutofy ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-[#181b26] text-[32px] font-bold text-center mb-14">Why Choose Tutofy?</h2>
          <div className="grid grid-cols-4 gap-6">
            {[
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="#4c6eff" strokeWidth="1.5" className="w-6 h-6"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M12 8v4l3 3"/></svg>,
                title: 'Personalised Learning',
                desc: 'Every session is tailored to your specific goals and learning pace.',
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="#4c6eff" strokeWidth="1.5" className="w-6 h-6"><path d="M9 12l2 2 4-4"/><path d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z"/></svg>,
                title: 'Vetted Tutors',
                desc: 'All tutors are verified, background-checked, and student-reviewed.',
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="#4c6eff" strokeWidth="1.5" className="w-6 h-6"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
                title: 'Flexible Pricing',
                desc: 'Pay per session or save with group course packages.',
              },
              {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="#4c6eff" strokeWidth="1.5" className="w-6 h-6"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
                title: 'Progress Tracking',
                desc: 'Visual dashboards keep you motivated and on track.',
              },
            ].map((b) => (
              <div key={b.title} className="bg-[#f8f9fc] rounded-[16px] border border-[#f0f0f5] p-6">
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(76,110,255,0.08)] flex items-center justify-center mb-4">
                  {b.icon}
                </div>
                <h3 className="text-[#181b26] text-[16px] font-bold mb-2">{b.title}</h3>
                <p className="text-[#8a90a1] text-[13px] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      {!isAuthenticated && (
        <section className="py-20 bg-gradient-to-r from-[#4c6eff] to-[#7a5af8]">
          <div className="max-w-[1280px] mx-auto px-10 text-center">
            <h2 className="text-white text-[40px] font-bold mb-4">Start Learning Today</h2>
            <p className="text-white/75 text-[18px] mb-10">Join 50,000+ students learning with Tutofy</p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/register"
                className="bg-white text-[#4c6eff] font-bold text-[17px] px-10 py-4 rounded-[14px] hover:bg-gray-50 transition-colors">
                Get Started for Free →
              </Link>
              <Link to="/tutors"
                className="border-[1.5px] border-white text-white font-semibold text-[17px] px-10 py-4 rounded-[14px] hover:bg-white/10 transition-colors">
                Browse Tutors
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="bg-[#181b26] py-14">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-white text-[22px] font-bold mb-1">Tutofy</p>
              <p className="text-[#8a90a1] text-[14px]">Learn without limits.</p>
            </div>
            <div className="flex gap-12">
              <div className="flex flex-col gap-3">
                <Link to="/tutors" className="text-[#d2d4d9] text-[14px] hover:text-white transition-colors">Find Tutors</Link>
                <Link to="/become-tutor" className="text-[#d2d4d9] text-[14px] hover:text-white transition-colors">Become a Tutor</Link>
              </div>
              <div className="flex flex-col gap-3">
                <Link to="/login" className="text-[#d2d4d9] text-[14px] hover:text-white transition-colors">Log in</Link>
                <Link to="/register" className="text-[#d2d4d9] text-[14px] hover:text-white transition-colors">Sign Up</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6">
            <p className="text-[#8a90a1] text-[13px]">© 2025 Tutofy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
