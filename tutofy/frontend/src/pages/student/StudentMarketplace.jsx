import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { usersAPI } from '../../api/users';
import TopBarActions from '../../components/ui/TopBarActions';

const SUBJECTS = ['All subjects', 'English', 'Math', 'Science', 'Programming', 'Business', 'Music', 'Design'];

const MOCK_TUTORS = [
  { id: 'mock-aisha-bekova', name: 'Aisha Bekova', bio: 'Mathematics and Physics teacher with 6 years of experience. Helps students build strong foundations and excel in UNT entrance exams.', subjects: ['Math', 'Science'], hourly_price: 8000, experience_years: 6, teaching_language: 'Russian, Kazakh', lesson_type: 'both', available_days: ['Monday', 'Wednesday', 'Friday', 'Saturday'], avg_rating: 4.8, review_count: 34, location: 'Almaty', status: 'approved' },
  { id: 'mock-daniyar-seitkali', name: 'Daniyar Seitkali', bio: 'Full-stack developer and coding mentor. Specializing in Python, JavaScript, and web development. Ex-Yandex engineer.', subjects: ['Programming'], hourly_price: 12000, experience_years: 7, teaching_language: 'English, Russian', lesson_type: 'individual', available_days: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'], avg_rating: 4.9, review_count: 51, location: 'Astana', status: 'approved' },
  { id: 'mock-elena-marchenko', name: 'Elena Marchenko', bio: 'Certified English teacher (CELTA). 10 years teaching Business English, IELTS, and conversational English. Students scored 7.5+ on IELTS.', subjects: ['English'], hourly_price: 6500, experience_years: 10, teaching_language: 'English, Russian', lesson_type: 'both', available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], avg_rating: 4.7, review_count: 88, location: 'Almaty', status: 'approved' },
  { id: 'mock-arman-dzhaksybekov', name: 'Arman Dzhaksybekov', bio: 'MBA from KIMEP. Teaches business strategy, financial literacy, and entrepreneurship.', subjects: ['Business'], hourly_price: 15000, experience_years: 8, teaching_language: 'Russian, English', lesson_type: 'group', available_days: ['Monday', 'Wednesday', 'Saturday'], avg_rating: 4.5, review_count: 22, location: 'Almaty', status: 'approved' },
  { id: 'mock-sofia-pak', name: 'Sofia Pak', bio: 'Piano and music theory teacher, graduate of the Kazakh National Conservatory. Making music fun and accessible for all ages.', subjects: ['Music'], hourly_price: 5000, experience_years: 3, teaching_language: 'Russian', lesson_type: 'individual', available_days: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'], avg_rating: 0, review_count: 0, location: 'Almaty', status: 'approved' },
];

const COLORS = ['#0d9488', '#7c3aed', '#0ea5e9', '#ff8032', '#22c55e', '#ef4444'];
function avatarColor(id) { return COLORS[(id?.charCodeAt(0) || 0) % COLORS.length]; }

const LANG_CODES = { english: 'EN', russian: 'RU', kazakh: 'KZ', german: 'DE', french: 'FR', spanish: 'ES', chinese: 'ZH', arabic: 'AR', turkish: 'TR', korean: 'KO', japanese: 'JA', italian: 'IT' };
function toLangCode(lang) { return LANG_CODES[lang.trim().toLowerCase()] || lang.trim().slice(0, 2).toUpperCase(); }

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Stars = ({ rating }) => (
  <span className="text-[#fbbf24] text-[13px]">
    {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
  </span>
);

const TutorCard = ({ tutor }) => {
  const navigate   = useNavigate();
  const color      = avatarColor(tutor.id);
  const initials   = (tutor.name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const [imgErr, setImgErr] = useState(false);
  const isMock     = tutor.id?.startsWith('mock-');
  const subjects  = tutor.subjects || [];
  const hasRating = (tutor.avg_rating || 0) > 0;
  const price     = tutor.hourly_price || 0;

  const langCodes = useMemo(() => {
    if (!tutor.teaching_language) return [];
    return tutor.teaching_language.split(/[,;\/]/).map(s => toLangCode(s.trim())).filter(Boolean);
  }, [tutor.teaching_language]);

  const formatBadges = useMemo(() => {
    const lt = (tutor.lesson_type || '').toLowerCase();
    if (lt === 'individual') return ['Individual'];
    if (lt === 'group')      return ['Group'];
    if (lt === 'both')       return ['Individual', 'Group'];
    return [];
  }, [tutor.lesson_type]);

  const availLabel = useMemo(() => {
    const days = Array.isArray(tutor.available_days) ? tutor.available_days : [];
    if (!days.length) return null;
    const todayName = WEEK_DAYS[new Date().getDay()];
    if (days.includes(todayName)) return 'Available today';
    for (let i = 1; i <= 7; i++) {
      const d = WEEK_DAYS[(new Date().getDay() + i) % 7];
      if (days.includes(d)) return i === 1 ? 'Available tomorrow' : `Available ${d.slice(0, 3)}`;
    }
    return null;
  }, [tutor.available_days]);

  const handleView = () => {
    if (isMock) return;
    navigate(`/student/tutors/${tutor.id}`);
  };

  return (
    <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6 flex gap-5 hover:shadow-[0_4px_20px_0_rgba(0,0,0,0.07)] transition-shadow">
      <div className="flex-shrink-0">
        <div className="w-[88px] h-[88px] rounded-[14px] overflow-hidden flex items-center justify-center text-white text-[28px] font-bold select-none"
          style={{ backgroundColor: color }}>
          {tutor.photo_url && !imgErr
            ? <img src={tutor.photo_url} alt={tutor.name} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
            : initials}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="text-[#0c0d12] text-[17px] font-bold leading-tight">{tutor.name}</h3>
              {tutor.status === 'approved' && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#22be70] bg-[#edfbf4] px-2 py-0.5 rounded-full">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                    <circle cx="6" cy="6" r="5.5" fill="#22be70"/>
                    <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Verified
                </span>
              )}
            </div>

            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {subjects.slice(0, 5).map(s => (
                  <span key={s} className="bg-[#f0f2ff] text-[#0d9488] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            )}

            {tutor.bio && (
              <p className="text-[#383a44] text-[13px] leading-[1.6] line-clamp-2 max-w-[560px] mb-2.5">{tutor.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {(tutor.experience_years || 0) > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#383a44] bg-[#f3f4f7] px-2.5 py-1 rounded-full">
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3 h-3">
                    <circle cx="6" cy="6" r="5"/><path d="M6 3.5V6l1.5 1.5"/>
                  </svg>
                  {tutor.experience_years} yr{tutor.experience_years !== 1 ? 's' : ''} exp
                </span>
              )}
              {formatBadges.map(f => (
                <span key={f} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${f === 'Individual' ? 'bg-[rgba(13,148,136,0.1)] text-[#0d9488]' : 'bg-[rgba(147,91,245,0.1)] text-[#935bf5]'}`}>{f}</span>
              ))}
              {langCodes.length > 0 && (
                <span className="text-[11px] font-semibold text-[#383a44] bg-[#f3f4f7] px-2.5 py-1 rounded-full">
                  {langCodes.join(' · ')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {hasRating ? (
                <div className="flex items-center gap-1.5">
                  <Stars rating={tutor.avg_rating} />
                  <span className="text-[#0c0d12] text-[13px] font-bold">{tutor.avg_rating.toFixed(1)}</span>
                  <span className="text-[#6b6f7d] text-[12px]">({tutor.review_count} reviews)</span>
                </div>
              ) : (
                <span className="text-[11px] font-semibold text-[#ffa61a] bg-[rgba(255,166,26,0.1)] px-2.5 py-0.5 rounded-full">New tutor</span>
              )}
              {tutor.location && (
                <span className="text-[#6b6f7d] text-[12px] flex items-center gap-1">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3 h-3">
                    <path d="M7 1a4 4 0 014 4c0 3-4 8-4 8S3 8 3 5a4 4 0 014-4z"/>
                    <circle cx="7" cy="5" r="1.2" fill="currentColor" stroke="none"/>
                  </svg>
                  {tutor.location}
                </span>
              )}
              {availLabel && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#22be70]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22be70] inline-block" />
                  {availLabel}
                </span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 text-right min-w-[160px]">
            <div className="mb-4">
              {price > 0 ? (
                <>
                  <p className="text-[#0c0d12] text-[20px] font-bold leading-none">
                    {price.toLocaleString()}<span className="text-[#6b6f7d] text-[13px] font-normal"> KZT</span>
                  </p>
                  <p className="text-[#6b6f7d] text-[11px] mt-0.5">per hour</p>
                </>
              ) : (
                <p className="text-[#6b6f7d] text-[14px] font-medium">Price on request</p>
              )}
            </div>

            {isMock ? (
              <>
                <div className="w-full bg-[#0d9488]/40 text-white text-[13px] font-semibold py-2.5 rounded-[10px] text-center mb-2 select-none cursor-default">
                  Book a lesson
                </div>
                <div className="w-full text-center border border-[#d2d4d9] text-[#6b6f7d] text-[13px] font-semibold py-2.5 rounded-[10px] select-none cursor-default">
                  Demo tutor
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleView}
                  className="w-full bg-[#0d9488] text-white text-[13px] font-semibold py-2.5 rounded-[10px] hover:opacity-90 transition-opacity mb-2"
                >
                  Book a lesson
                </button>
                <button
                  onClick={handleView}
                  className="w-full border border-[#d2d4d9] text-[#383a44] text-[13px] font-semibold py-2.5 rounded-[10px] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors"
                >
                  View profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentMarketplace = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [tutors, setTutors]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [subject, setSubject]   = useState(() => {
    const sp = searchParams.get('subject');
    return sp && SUBJECTS.includes(sp) ? sp : 'All subjects';
  });
  const [search, setSearch]     = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    usersAPI.searchTutors()
      .then(res => setTutors([...(res?.tutors || []), ...MOCK_TUTORS]))
      .catch(() => setTutors(MOCK_TUTORS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    tutors.filter(t => {
      if (search) {
        const q = search.toLowerCase();
        if (!(t.name || '').toLowerCase().includes(q) &&
            !(t.subjects || []).some(s => s.toLowerCase().includes(q)) &&
            !(t.location || '').toLowerCase().includes(q)) return false;
      }
      if (maxPrice && (t.hourly_price || 0) > parseInt(maxPrice)) return false;
      if (subject !== 'All subjects') {
        if (!(t.subjects || []).some(s => s.toLowerCase().includes(subject.toLowerCase()))) return false;
      }
      return true;
    }),
  [tutors, search, maxPrice, subject]);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S';

  return (
    <div className="flex h-screen bg-[#f3f4f7] font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-[#f0f0f5] flex-shrink-0">
          <div className="h-[64px] flex items-center px-6 justify-between">
            <div>
              <h1 className="text-[#0c0d12] text-[16px] font-bold">Find Tutors</h1>
              <p className="text-[#6b6f7d] text-[12px]">Browse and book 1-on-1 lessons or group courses</p>
            </div>
            <div className="flex items-center gap-2">
              <TopBarActions />
              <div className="w-9 h-9 rounded-full bg-[rgba(13,148,136,0.12)] flex items-center justify-center">
                <span className="text-[#0d9488] text-[12px] font-bold">{initials}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 pb-4 flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#6b6f7d] font-medium">Subject</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="h-[38px] px-3 border border-[#d2d4d9] rounded-[8px] text-[13px] text-[#0c0d12] bg-white focus:outline-none focus:border-[#0d9488] min-w-[160px]"
              >
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#6b6f7d] font-medium">Price per hour</label>
              <select
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="h-[38px] px-3 border border-[#d2d4d9] rounded-[8px] text-[13px] text-[#0c0d12] bg-white focus:outline-none focus:border-[#0d9488] min-w-[160px]"
              >
                <option value="">Any price</option>
                <option value="5000">Up to 5,000 KZT</option>
                <option value="10000">Up to 10,000 KZT</option>
                <option value="20000">Up to 20,000 KZT</option>
                <option value="50000">Up to 50,000 KZT</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 ml-auto">
              <label className="text-[11px] text-[#6b6f7d] font-medium">Search</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b6f7d]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/>
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Name, subject, or location"
                  className="h-[38px] pl-9 pr-4 border border-[#d2d4d9] rounded-[8px] text-[13px] text-[#0c0d12] bg-white focus:outline-none focus:border-[#0d9488] w-[260px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          {!loading && (
            <p className="text-[#6b6f7d] text-[13px] mb-4">
              {filtered.length} tutor{filtered.length !== 1 ? 's' : ''} available
            </p>
          )}

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-14 h-14 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-7 h-7">
                  <circle cx="8" cy="8" r="5.5"/><path d="M13 13l4 4" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-[#0c0d12] text-[18px] font-semibold mb-2">No tutors found</p>
              <p className="text-[#6b6f7d] text-[14px]">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(tutor => <TutorCard key={tutor.id} tutor={tutor} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentMarketplace;
