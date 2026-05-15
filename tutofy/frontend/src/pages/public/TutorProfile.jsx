import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usersAPI } from '../../api/users';
import { coursesAPI } from '../../api/courses';
import { enrollmentsAPI } from '../../api/enrollments';
import { lessonsAPI } from '../../api/lessons';
import { useAuth } from '../../contexts/AuthContext';

function tutorExtras(id) {
  const seed       = id ? id.charCodeAt(0) + (id.charCodeAt(1) || 0) : 42;
  const rating     = parseFloat((4.5 + (seed % 5) * 0.1).toFixed(1));
  const reviews    = 8  + (seed % 40);
  const students   = 3  + (seed % 20);
  const lessons    = 40 + (seed % 200);
  const flags      = ['🇺🇸', '🇬🇧', '🇰🇿', '🇷🇺', '🇩🇪', '🇫🇷'];
  const flag       = flags[seed % flags.length];
  const hourlyRate = [12, 15, 18, 20, 22, 25, 17, 14][seed % 8];
  return { rating, reviews, students, lessons, flag, hourlyRate };
}

const COLORS = ['#4c6eff', '#935bf5', '#00beb7', '#ff8032', '#22be70', '#f24545'];
function avatarColor(id) { return COLORS[(id?.charCodeAt(0) || 0) % COLORS.length]; }

const Stars = ({ rating, size = 'md' }) => {
  const sz = size === 'lg' ? 'text-[20px]' : 'text-[14px]';
  return (
    <span className={`text-[#fbbf24] ${sz}`}>
      {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
    </span>
  );
};

const DAY_NAME_TO_INDEX = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

const JS_DAY_TO_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseProfileSlots(profile) {
  if (!profile) return [];
  try {
    const parsed = JSON.parse(profile.available_time_start);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.day) return parsed;
  } catch {}
  const days  = profile.available_days || [];
  const start = profile.available_time_start || '';
  const end   = profile.available_time_end   || '';
  if (days.length > 0 && start && end && !start.startsWith('[')) {
    return days.map((day, i) => ({ id: `legacy-${i}`, day, start, end }));
  }
  return [];
}

// Remove slots that are already booked (comparing local day + hour).
function filterBookedSlots(slots, bookedISOStrings) {
  if (!bookedISOStrings || bookedISOStrings.length === 0) return slots;
  const bookedSet = new Set(
    bookedISOStrings.map((iso) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
    })
  );
  return slots
    .map((daySlots) =>
      daySlots.filter(({ day, hour }) => {
        const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${hour}`;
        return !bookedSet.has(key);
      })
    )
    .filter((daySlots) => daySlots.length > 0);
}

// Generate available hour-slots for the next 14 days based on real profile availability
function generateSlotsFromProfile(profile) {
  if (!profile) return [];

  // New JSON slot format
  try {
    const parsed = JSON.parse(profile.available_time_start);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.day) {
      const today = new Date();
      const result = [];
      for (let d = 0; d < 14; d++) {
        const day = new Date(today);
        day.setDate(today.getDate() + d);
        day.setHours(0, 0, 0, 0);
        const dayName = JS_DAY_TO_NAME[day.getDay()];
        const matchingSlots = parsed.filter((s) => s.day === dayName);
        if (matchingSlots.length === 0) continue;
        const nowH = today.getHours();
        const daySlots = [];
        for (const slot of matchingSlots) {
          const [startH] = slot.start.split(':').map(Number);
          const [endH]   = slot.end.split(':').map(Number);
          for (let h = startH; h < endH; h++) {
            if (d === 0 && h <= nowH) continue;
            daySlots.push({ day: new Date(day), hour: h });
          }
        }
        if (daySlots.length) result.push(daySlots);
      }
      return result;
    }
  } catch {}

  // Legacy format
  if (!profile?.available_days?.length || !profile?.available_time_start || !profile?.available_time_end) {
    return [];
  }
  const allowedDays = new Set(
    profile.available_days.map((d) => DAY_NAME_TO_INDEX[d.toLowerCase()]).filter((d) => d !== undefined)
  );
  const [startH] = profile.available_time_start.split(':').map(Number);
  const [endH]   = profile.available_time_end.split(':').map(Number);

  const today = new Date();
  const slots = [];
  for (let d = 0; d < 14; d++) {
    const day = new Date(today);
    day.setDate(today.getDate() + d);
    day.setHours(0, 0, 0, 0);
    if (!allowedDays.has(day.getDay())) continue;
    const nowH = today.getHours();
    const daySlots = [];
    for (let h = startH; h < endH; h++) {
      if (d === 0 && h <= nowH) continue;
      daySlots.push({ day: new Date(day), hour: h });
    }
    if (daySlots.length) slots.push(daySlots);
  }
  return slots;
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDay(d) {
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

function toISOLocal(d, hour) {
  const dt = new Date(d);
  dt.setHours(hour, 0, 0, 0);
  return dt.toISOString();
}

const RATING_DIMS = ['Responsiveness', 'Clarity', 'Progress', 'Preparation'];

/* ═══════════════════════════════════════════════════════════ */
const TutorProfile = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { isAuthenticated, user, role } = useAuth();

  const [tutor, setTutor]             = useState(null);
  const [tutorProfile, setTutorProfile] = useState(null);
  const [courses, setCourses]         = useState([]);
  const [loading, setLoading]         = useState(true);

  // group course enrollment
  const [enrolling, setEnrolling]     = useState(false);
  const [enrolledId, setEnrolledId]   = useState(null);
  const [enrollError, setEnrollError] = useState('');

  // booked slots from backend — filtered out of the slot picker
  const [bookedSlots, setBookedSlots] = useState([]);

  // individual lesson booking
  const [showSlots, setShowSlots]     = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // { day, hour }
  const [booking, setBooking]         = useState(false);
  const [bookingOk, setBookingOk]     = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    Promise.all([
      usersAPI.getUserById(id).catch(() => null),
      coursesAPI.searchCourses({ tutor_id: id }).catch(() => ({ courses: [] })),
      usersAPI.getTutorProfile(id).catch(() => null),
      lessonsAPI.getTutorBookedSlots(id).catch(() => ({ scheduled_ats: [] })),
    ]).then(([userData, coursesRes, profileData, bookedRes]) => {
      setTutor(userData);
      setTutorProfile(profileData);
      setCourses(coursesRes?.courses || []);
      setBookedSlots(bookedRes?.scheduled_ats || []);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async (courseId) => {
    if (!isAuthenticated) {
      const course = courses.find((c) => c.id === courseId);
      if (course?.price > 0) {
        const paymentParams = new URLSearchParams({ course_id: courseId, amount: course.price, tutor_id: id, course_name: course.title || '' });
        navigate(`/register?redirect=${encodeURIComponent('/payment?' + paymentParams.toString())}`);
      } else {
        navigate(`/register?redirect=${encodeURIComponent('/tutors/' + id)}`);
      }
      return;
    }
    if (role !== 'student') return;
    const course = courses.find((c) => c.id === courseId);
    if (course?.price > 0) {
      const params = new URLSearchParams({ course_id: courseId, amount: course.price, tutor_id: id, course_name: course.title || '' });
      navigate(`/payment?${params.toString()}`);
      return;
    }
    setEnrolling(true); setEnrollError('');
    try {
      await enrollmentsAPI.enrollInCourse(courseId);
      setEnrolledId(courseId);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || '';
      if (msg.includes('already enrolled') || msg.includes('AlreadyExists')) {
        setEnrolledId(courseId);
      } else {
        setEnrollError(msg || 'Enrollment failed. Please try again.');
      }
    } finally {
      setEnrolling(false); }
  };

  const handleBookLesson = async () => {
    if (!isAuthenticated) { navigate(`/register?redirect=${encodeURIComponent('/tutors/' + id)}`); return; }
    if (!selectedSlot) return;

    const price = tutorProfile?.hourly_rate || tutorExtras(id).hourlyRate;
    const title = `Lesson with ${user?.name || 'Student'}`;
    const scheduled_at = toISOLocal(selectedSlot.day, selectedSlot.hour);

    // Paid lesson → go to payment page; after payment it calls /book-lesson.
    if (price > 0) {
      const params = new URLSearchParams({
        lesson_mode:      'true',
        tutor_id:         id,
        amount:           String(price),
        title,
        scheduled_at,
        duration_minutes: '60',
        tutor_name:       tutor?.name || '',
      });
      navigate(`/payment?${params.toString()}`);
      return;
    }

    // Free lesson → book directly.
    setBooking(true); setBookingError('');
    try {
      await lessonsAPI.bookIndividualLesson({
        tutor_id:        id,
        title,
        scheduled_at,
        duration_minutes: 60,
        price:           0,
      });
      setBookingOk(true);
      setSelectedSlot(null);
      setShowSlots(false);
    } catch (err) {
      setBookingError(err.response?.data?.message || err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center font-sans">
        <div className="w-8 h-8 border-4 border-[#4c6eff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex flex-col items-center justify-center font-sans gap-4">
        <div className="w-14 h-14 rounded-full bg-[#f0f0f5] flex items-center justify-center">
          <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-7 h-7">
            <circle cx="8" cy="8" r="5.5"/><path d="M13 13l4 4" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-[#181b26] text-[20px] font-bold">Tutor not found</p>
        <Link to="/tutors" className="text-[#4c6eff] text-[14px] font-medium hover:underline">
          ← Back to tutors
        </Link>
      </div>
    );
  }

  const extras   = tutorExtras(tutor.id);
  const color    = avatarColor(tutor.id);
  const initials = tutor.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  const bio      = tutorProfile?.bio || courses[0]?.description || 'Expert tutor with personalized sessions tailored to your learning goals and schedule. I help students of all levels achieve tangible progress.';
  const slots    = filterBookedSlots(generateSlotsFromProfile(tutorProfile), bookedSlots);
  const hourlyPrice  = tutorProfile?.hourly_rate || extras.hourlyRate;
  const parsedSlots  = parseProfileSlots(tutorProfile);
  const hasAvailability = parsedSlots.length > 0;
  const isOwnProfile = role === 'tutor' && user?.user_id === id;

  return (
    <div className="min-h-screen bg-[#f5f6fa] font-sans">

      {/* Navbar */}
      <nav className="bg-white border-b border-[#ebebf0] h-[60px] flex items-center px-8 sticky top-0 z-50">
        <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between">
          <Link to="/" className="text-[#4c6eff] text-[20px] font-bold">Tutofy</Link>
          <div className="flex items-center gap-5">
            <Link to="/tutors" className="text-[#8a90a1] text-[14px] hover:text-[#181b26]">Find Tutors</Link>
            {isAuthenticated && role === 'tutor' ? (
              <Link
                to="/tutor/dashboard"
                className="bg-[#4c6eff] text-white text-[13px] font-semibold px-4 py-2 rounded-[8px] hover:opacity-90"
              >
                My LMS →
              </Link>
            ) : !isAuthenticated ? (
              <Link to="/login" className="bg-[#4c6eff] text-white text-[13px] font-semibold px-4 py-2 rounded-[8px] hover:opacity-90">
                Log in
              </Link>
            ) : null}
          </div>
        </div>
      </nav>

      <div className="max-w-[1100px] mx-auto px-8 py-8">
        <button onClick={() => navigate(-1)} className="text-[#8a90a1] text-[13px] mb-6 hover:text-[#181b26] transition-colors flex items-center gap-1.5">
          ← Back to results
        </button>

        {/* Hero card */}
        <div className="bg-white rounded-[20px] border border-[#ebebf0] p-7 mb-6">
          <div className="flex items-start gap-5">
            <div
              className="w-[100px] h-[100px] rounded-[20px] flex items-center justify-center text-white text-[32px] font-bold flex-shrink-0 select-none"
              style={{ backgroundColor: color }}
            >
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-[#181b26] text-[22px] font-bold">{tutor.name}</h1>
                <span className="text-[16px]">{extras.flag}</span>
                <svg viewBox="0 0 16 16" className="w-[18px] h-[18px] text-[#4c6eff]" fill="currentColor">
                  <path d="M8 0l1.8 2.4L13 2l-.4 3.3 2.8 1.7-2 2.6.6 3.3-3.2-.8L8 14l-2.8-1.9-3.2.8.6-3.3-2-2.6L3.4 5.3 3 2l3.2.4L8 0z"/>
                  <path d="M5.5 8l2 2 3-3.5" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[#8a90a1] text-[14px] mb-2">
                {courses.length > 0 ? courses.map((c) => c.title).join(' · ') : 'Online Tutor'}
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Stars rating={extras.rating} />
                  <span className="text-[#181b26] text-[14px] font-bold">{extras.rating}</span>
                  <span className="text-[#8a90a1] text-[13px]">({extras.reviews} reviews)</span>
                </div>
                <span className="text-[#8a90a1] text-[13px]">{extras.students} students</span>
                <span className="text-[#8a90a1] text-[13px]">{extras.lessons} lessons</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="bg-[#f0f9f4] text-[#22be70] text-[12px] font-semibold px-3 py-1 rounded-full">
              ✓ Professional Tutor
            </span>
            <span className="bg-[#f0f2ff] text-[#4c6eff] text-[12px] font-semibold px-3 py-1 rounded-full">
              {courses.length} group course{courses.length !== 1 ? 's' : ''}
            </span>
            <span className="bg-[#f0fff8] text-[#00beb7] text-[12px] font-semibold px-3 py-1 rounded-full">
              Individual lessons available
            </span>
          </div>
        </div>

        {/* Two main blocks */}
        <div className="grid grid-cols-[1fr_320px] gap-6 items-start">

          {/* ── Left: Group courses + About ── */}
          <div className="space-y-5">

            {/* Group courses */}
            <div className="bg-white rounded-[20px] border border-[#ebebf0] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#181b26] text-[16px] font-bold">Group courses</h2>
                <span className="text-[#8a90a1] text-[12px]">{courses.length} available</span>
              </div>

              {enrollError && (
                <div className="bg-[rgba(242,69,69,0.08)] text-[#f24545] rounded-[10px] px-4 py-3 text-[13px] mb-4">
                  {enrollError}
                </div>
              )}

              {courses.length === 0 ? (
                <p className="text-[#8a90a1] text-[14px] text-center py-8">No group courses available yet.</p>
              ) : (
                <div className="space-y-3">
                  {courses.map((c, i) => {
                    const isEnrolled  = enrolledId === c.id;
                    const cColor      = COLORS[i % COLORS.length];
                    const maxStudents = c.max_students || 5;
                    const seed        = c.id ? c.id.charCodeAt(c.id.length - 1) : 0;
                    const enrolled    = seed % maxStudents;
                    const spotsLeft   = maxStudents - enrolled;
                    return (
                      <div key={c.id} className="flex items-start gap-4 p-4 border border-[#ebebf0] rounded-[14px] hover:border-[#4c6eff]/30 transition-colors">
                        <div
                          className="w-11 h-11 rounded-[12px] flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                          style={{ backgroundColor: cColor }}
                        >
                          {(c.title || 'C')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#181b26] text-[14px] font-semibold mb-0.5">{c.title}</h3>
                          <p className="text-[#8a90a1] text-[12px] line-clamp-2 mb-2">{c.description || 'Group course with weekly sessions.'}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[#4c6eff] text-[13px] font-bold">
                              {c.price ? `$${c.price} total` : 'Free'}
                            </span>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              spotsLeft > 0
                                ? 'bg-[#f0f9f4] text-[#22be70]'
                                : 'bg-[#fef2f2] text-[#f24545]'
                            }`}>
                              {spotsLeft > 0 ? `${spotsLeft}/${maxStudents} spots left` : 'Full'}
                            </span>
                          </div>
                        </div>
                        {isEnrolled ? (
                          <Link
                            to="/student/dashboard"
                            className="flex-shrink-0 bg-[#22be70] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:opacity-90"
                          >
                            Go to course →
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleEnroll(c.id)}
                            disabled={enrolling || role === 'tutor' || spotsLeft === 0}
                            className="flex-shrink-0 bg-[#4c6eff] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {enrolling ? '...' : !isAuthenticated ? 'Sign up' : c.price > 0 ? `Pay $${c.price}` : 'Join'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* About */}
            <div className="bg-white rounded-[20px] border border-[#ebebf0] p-6">
              <h2 className="text-[#181b26] text-[16px] font-bold mb-3">About</h2>
              <p className="text-[#4c5162] text-[14px] leading-[1.7] mb-5">{bio}</p>

              <h3 className="text-[#181b26] text-[14px] font-semibold mb-2">Languages</h3>
              <div className="flex items-center gap-2 flex-wrap mb-5">
                {['English — Proficient', 'Russian — Native', 'Kazakh — Native'].map((lang) => (
                  <span key={lang} className="bg-[#f5f6fa] text-[#4c5162] text-[13px] px-3 py-1.5 rounded-[8px] border border-[#ebebf0]">
                    {lang}
                  </span>
                ))}
              </div>

              <h3 className="text-[#181b26] text-[14px] font-semibold mb-3">Lesson rating</h3>
              <div className="grid grid-cols-2 gap-3">
                {RATING_DIMS.map((dim) => {
                  const val = (extras.rating - 0.2 + (dim.length % 3) * 0.1).toFixed(1);
                  return (
                    <div key={dim} className="flex items-center justify-between p-3 bg-[#f8f9fc] rounded-[10px]">
                      <span className="text-[#4c5162] text-[13px]">{dim}</span>
                      <div className="flex items-center gap-1">
                        <Stars rating={parseFloat(val)} />
                        <span className="text-[#181b26] text-[13px] font-semibold ml-1">{val}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews (condensed) */}
            <div className="bg-white rounded-[20px] border border-[#ebebf0] p-6">
              <div className="flex items-center gap-4 mb-5">
                <div>
                  <p className="text-[#181b26] text-[40px] font-bold leading-none">{extras.rating}</p>
                  <Stars rating={extras.rating} size="lg" />
                  <p className="text-[#8a90a1] text-[12px] mt-1">{extras.reviews} reviews</p>
                </div>
              </div>
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => {
                  const names = ['Maria K.', 'Temirlan B.', 'Alena S.'];
                  const texts = [
                    'Very dedicated teacher. Helped me improve significantly in a short time.',
                    'Highly recommend! Great teaching approach and clear explanations.',
                    'Patient and innovative. You can feel the progress after just a few sessions.',
                  ];
                  return (
                    <div key={i} className="p-4 bg-[#f8f9fc] rounded-[12px]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#4c6eff] flex items-center justify-center text-white text-[11px] font-bold">
                            {names[i][0]}
                          </div>
                          <span className="text-[#181b26] text-[13px] font-semibold">{names[i]}</span>
                        </div>
                        <Stars rating={5} />
                      </div>
                      <p className="text-[#4c5162] text-[13px] leading-relaxed">{texts[i]}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right: Book a lesson (sticky) ── */}
          <div className="sticky top-[76px] space-y-4">

            {/* Individual lesson booking card */}
            {isOwnProfile ? (
              <div className="bg-white rounded-[20px] border border-[#ebebf0] p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-[#f0f2ff] flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 20 20" fill="none" stroke="#4c6eff" strokeWidth="1.5" className="w-7 h-7">
                    <circle cx="10" cy="7" r="4"/><path d="M3 19a7 7 0 0114 0"/>
                  </svg>
                </div>
                <p className="text-[#181b26] text-[15px] font-bold mb-1">This is your profile</p>
                <p className="text-[#8a90a1] text-[13px] mb-4">Students see this page when they find you in the marketplace.</p>
                <Link
                  to="/tutor/dashboard"
                  className="block w-full bg-[#4c6eff] text-white text-[13px] font-semibold py-2.5 rounded-[12px] hover:opacity-90 transition-opacity"
                >
                  Go to my dashboard →
                </Link>
              </div>
            ) : (
            <div className="bg-white rounded-[20px] border border-[#ebebf0] p-6">
              <div className="flex items-center gap-2 mb-1">
                <svg viewBox="0 0 18 18" fill="none" stroke="#00beb7" strokeWidth="1.5" className="w-4 h-4">
                  <circle cx="9" cy="6" r="3.5"/><path d="M3 17a6 6 0 0112 0"/>
                </svg>
                <p className="text-[#181b26] text-[15px] font-bold">Book an individual lesson</p>
              </div>
              <p className="text-[#8a90a1] text-[12px] mb-4">1-on-1 · 60 min · Zoom link sent after booking</p>

              <div className="flex items-baseline gap-1 mb-4">
                <p className="text-[#181b26] text-[30px] font-bold leading-none">${hourlyPrice}</p>
                <span className="text-[#8a90a1] text-[15px]">/ hour</span>
              </div>

              {hasAvailability && (
                <div className="bg-[#f0fff8] rounded-[10px] px-3 py-2.5 mb-4">
                  <p className="text-[#00beb7] text-[11px] font-semibold uppercase tracking-wide mb-1.5">Availability</p>
                  {Object.entries(
                    parsedSlots.reduce((acc, s) => { (acc[s.day] = acc[s.day] || []).push(s); return acc; }, {})
                  ).map(([day, daySlots]) => (
                    <div key={day} className="flex items-baseline gap-1.5 mb-0.5">
                      <span className="text-[#181b26] text-[12px] font-semibold w-8 flex-shrink-0">{day.slice(0, 3)}</span>
                      <span className="text-[#4c5162] text-[12px]">{daySlots.map(s => `${s.start}–${s.end}`).join(', ')}</span>
                    </div>
                  ))}
                  {tutorProfile?.timezone && (
                    <p className="text-[#00beb7] text-[11px] mt-1">({tutorProfile.timezone})</p>
                  )}
                </div>
              )}

              {bookingOk && (
                <div className="bg-[#edfbf4] text-[#22be70] rounded-[10px] px-4 py-3 text-[13px] mb-3 font-medium">
                  Lesson booked! Check your dashboard.
                </div>
              )}
              {bookingError && (
                <div className="bg-[rgba(242,69,69,0.08)] text-[#f24545] rounded-[8px] px-3 py-2 text-[12px] mb-3">
                  {bookingError}
                </div>
              )}

              {!showSlots ? (
                <button
                  onClick={() => { setShowSlots(true); setSelectedSlot(null); setBookingOk(false); }}
                  disabled={!hasAvailability && slots.length === 0}
                  className="w-full bg-[#00beb7] text-white text-[14px] font-semibold py-3 rounded-[12px] hover:opacity-90 transition-opacity shadow-[0_4px_14px_0_rgba(0,190,183,0.3)] disabled:opacity-40"
                >
                  {hasAvailability || slots.length > 0 ? 'Choose time' : 'No slots set yet'}
                </button>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[#181b26] text-[13px] font-semibold">Select a time slot</p>
                    <button onClick={() => setShowSlots(false)} className="text-[#8a90a1] text-[11px] hover:text-[#181b26]">Cancel</button>
                  </div>

                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {slots.map((daySlots, di) => (
                      <div key={di}>
                        <p className="text-[#8a90a1] text-[11px] font-medium mb-1.5">{fmtDay(daySlots[0].day)}</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {daySlots.map(({ day, hour }) => {
                            const isSelected = selectedSlot?.day.getTime() === day.getTime() && selectedSlot?.hour === hour;
                            return (
                              <button
                                key={hour}
                                onClick={() => setSelectedSlot({ day, hour })}
                                className={`px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all ${
                                  isSelected
                                    ? 'bg-[#00beb7] text-white'
                                    : 'bg-[#f3f4f7] text-[#4c5162] hover:bg-[#e8f9f9] hover:text-[#00beb7]'
                                }`}
                              >
                                {hour}:00
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedSlot && (
                    <div className="mt-3 pt-3 border-t border-[#ebebf0]">
                      <p className="text-[#8a90a1] text-[12px] mb-2">
                        {fmtDay(selectedSlot.day)} at {selectedSlot.hour}:00 · 60 min · ${hourlyPrice}
                      </p>
                      <button
                        onClick={handleBookLesson}
                        disabled={booking}
                        className="w-full bg-[#00beb7] text-white text-[13px] font-semibold py-2.5 rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {booking && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {booking ? 'Booking...' : 'Confirm booking'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => isAuthenticated ? navigate('/student/messages') : navigate(`/register?redirect=${encodeURIComponent('/tutors/' + id)}`)}
                className="w-full border border-[#d2d4d9] text-[#181b26] text-[13px] font-semibold py-2.5 rounded-[10px] hover:border-[#4c6eff] hover:text-[#4c6eff] transition-colors mt-3"
              >
                Send message
              </button>
            </div>
            )} {/* end isOwnProfile else */}

            {/* Stats card */}
            <div className="bg-white rounded-[20px] border border-[#ebebf0] p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#8a90a1]">Rating</span>
                  <div className="flex items-center gap-1">
                    <Stars rating={extras.rating} />
                    <span className="text-[#181b26] font-semibold">{extras.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#8a90a1]">Students</span>
                  <span className="text-[#181b26] font-semibold">{extras.students}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#8a90a1]">Lessons given</span>
                  <span className="text-[#181b26] font-semibold">{extras.lessons}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#8a90a1]">Group courses</span>
                  <span className="text-[#181b26] font-semibold">{courses.length}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfile;
