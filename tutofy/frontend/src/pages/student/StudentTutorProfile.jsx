import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { usersAPI } from '../../api/users';
import { coursesAPI } from '../../api/courses';
import { enrollmentsAPI } from '../../api/enrollments';
import { lessonsAPI } from '../../api/lessons';

// ── Helpers (shared with public TutorProfile) ────────────────────────────────

const JS_DAY_TO_NAME = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function parseProfileSlots(profile) {
  if (!profile) return [];
  try {
    const parsed = JSON.parse(profile.available_time_start);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.day) return parsed;
  } catch {}
  const days  = profile.available_days || [];
  const start = profile.available_time_start || '';
  const end   = profile.available_time_end   || '';
  if (days.length > 0 && start && end && !start.startsWith('['))
    return days.map((day, i) => ({ id: `legacy-${i}`, day, start, end }));
  return [];
}

function generateSlotsFromProfile(profile) {
  if (!profile) return [];
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
        const matching = parsed.filter(s => s.day === dayName);
        if (!matching.length) continue;
        const nowH = today.getHours();
        const daySlots = [];
        for (const slot of matching) {
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
  if (!profile?.available_days?.length || !profile?.available_time_start || !profile?.available_time_end) return [];
  const DAY_INDEX = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const allowedDays = new Set(profile.available_days.map(d => DAY_INDEX[d.toLowerCase()]).filter(d => d !== undefined));
  const [startH] = profile.available_time_start.split(':').map(Number);
  const [endH]   = profile.available_time_end.split(':').map(Number);
  const today = new Date();
  const slots = [];
  for (let d = 0; d < 14; d++) {
    const day = new Date(today); day.setDate(today.getDate() + d); day.setHours(0,0,0,0);
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

function filterBookedSlots(slots, booked) {
  if (!booked?.length) return slots;
  const bookedSet = new Set(booked.map(iso => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
  }));
  return slots
    .map(daySlots => daySlots.filter(({ day, hour }) => !bookedSet.has(`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${hour}`)))
    .filter(ds => ds.length > 0);
}

function toISOLocal(d, hour) {
  const dt = new Date(d); dt.setHours(hour, 0, 0, 0); return dt.toISOString();
}

const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDay(d) { return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`; }

const COLORS = ['#0d9488','#7c3aed','#0ea5e9','#ff8032','#22c55e','#ef4444'];
function avatarColor(id) { return COLORS[(id?.charCodeAt(0) || 0) % COLORS.length]; }

function tutorExtras(id) {
  const seed     = id ? id.charCodeAt(0) + (id.charCodeAt(1) || 0) : 42;
  return {
    rating:     parseFloat((4.5 + (seed % 5) * 0.1).toFixed(1)),
    reviews:    8  + (seed % 40),
    students:   3  + (seed % 20),
    lessons:    40 + (seed % 200),
    hourlyRate: [3000,4000,5000,6000,7000,8000,5500,4500][seed % 8],
  };
}

const Stars = ({ rating, size = 'md' }) => (
  <span className={`text-[#fbbf24] ${size === 'lg' ? 'text-[20px]' : 'text-[14px]'}`}>
    {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
  </span>
);

const RATING_DIMS = ['Responsiveness','Clarity','Progress','Preparation'];

// ── Component ────────────────────────────────────────────────────────────────

const StudentTutorProfile = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tutor, setTutor]               = useState(null);
  const [tutorProfile, setTutorProfile] = useState(null);
  const [courses, setCourses]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [bookedSlots, setBookedSlots]   = useState([]);

  const [enrolling, setEnrolling]   = useState(false);
  const [enrolledId, setEnrolledId] = useState(null);
  const [enrollError, setEnrollError] = useState('');

  const [showSlots, setShowSlots]       = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking]           = useState(false);
  const [bookingOk, setBookingOk]       = useState(false);
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
    const course = courses.find(c => c.id === courseId);
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
      if (msg.includes('already enrolled') || msg.includes('AlreadyExists')) setEnrolledId(courseId);
      else setEnrollError(msg || 'Enrollment failed. Please try again.');
    } finally { setEnrolling(false); }
  };

  const handleBookLesson = async () => {
    if (!selectedSlot) return;
    const price        = tutorProfile?.hourly_rate || tutorExtras(id).hourlyRate;
    const tutorName    = tutor?.name || 'Tutor';
    const title        = `Lesson with ${tutorName}`;
    const scheduled_at = toISOLocal(selectedSlot.day, selectedSlot.hour);

    setBooking(true); setBookingError('');
    try {
      await lessonsAPI.bookIndividualLesson({ tutor_id: id, title, scheduled_at, duration_minutes: 60, price });
      setBookingOk(true); setSelectedSlot(null); setShowSlots(false);
    } catch (err) {
      setBookingError(err.response?.data?.message || err.response?.data?.error || 'Booking failed. Please try again.');
    } finally { setBooking(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S';

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
        <StudentSidebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-[#0c0d12] text-[20px] font-bold">Tutor not found</p>
          <Link to="/student/marketplace" className="text-[#0d9488] text-[14px] font-medium hover:underline">
            ← Back to tutors
          </Link>
        </div>
      </div>
    );
  }

  const extras      = tutorExtras(tutor.id);
  const color       = avatarColor(tutor.id);
  const tutorInitials = tutor.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  const bio         = tutorProfile?.bio || courses[0]?.description || 'Expert tutor with personalised sessions tailored to your goals.';
  const slots       = filterBookedSlots(generateSlotsFromProfile(tutorProfile), bookedSlots);
  const hourlyPrice = tutorProfile?.hourly_rate || extras.hourlyRate;
  const parsedSlots = parseProfileSlots(tutorProfile);
  const hasAvailability = parsedSlots.length > 0;

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white h-[64px] border-b border-[#f0f0f5] flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/student/marketplace')}
              className="flex items-center gap-1.5 text-[#6b6f7d] text-[13px] hover:text-[#0d9488] transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Find Tutors
            </button>
            <span className="text-[#d2d4d9]">/</span>
            <span className="text-[#0c0d12] text-[14px] font-semibold">{tutor.name}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[rgba(13,148,136,0.12)] flex items-center justify-center">
            <span className="text-[#0d9488] text-[12px] font-bold">{initials}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1000px] mx-auto">

            {/* Hero card */}
            <div className="bg-white rounded-[20px] border border-[#ebebf0] p-7 mb-6">
              <div className="flex items-start gap-5">
                <div className="w-[100px] h-[100px] rounded-[20px] flex items-center justify-center text-white text-[32px] font-bold flex-shrink-0 select-none"
                  style={{ backgroundColor: color }}>
                  {tutorInitials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h1 className="text-[#0c0d12] text-[22px] font-bold">{tutor.name}</h1>
                    <svg viewBox="0 0 16 16" className="w-[18px] h-[18px] text-[#0d9488]" fill="currentColor">
                      <path d="M8 0l1.8 2.4L13 2l-.4 3.3 2.8 1.7-2 2.6.6 3.3-3.2-.8L8 14l-2.8-1.9-3.2.8.6-3.3-2-2.6L3.4 5.3 3 2l3.2.4L8 0z"/>
                      <path d="M5.5 8l2 2 3-3.5" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-[#6b6f7d] text-[14px] mb-2">
                    {courses.length > 0 ? courses.map(c => c.title).join(' · ') : 'Online Tutor'}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Stars rating={extras.rating} />
                      <span className="text-[#0c0d12] text-[14px] font-bold">{extras.rating}</span>
                      <span className="text-[#6b6f7d] text-[13px]">({extras.reviews} reviews)</span>
                    </div>
                    <span className="text-[#6b6f7d] text-[13px]">{extras.students} students</span>
                    <span className="text-[#6b6f7d] text-[13px]">{extras.lessons} lessons</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="bg-[#f0f9f4] text-[#22be70] text-[12px] font-semibold px-3 py-1 rounded-full">Verified Tutor</span>
                <span className="bg-[#f0f2ff] text-[#0d9488] text-[12px] font-semibold px-3 py-1 rounded-full">
                  {courses.length} group course{courses.length !== 1 ? 's' : ''}
                </span>
                <span className="bg-[#f0fff8] text-[#00beb7] text-[12px] font-semibold px-3 py-1 rounded-full">
                  Individual lessons available
                </span>
              </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-[1fr_300px] gap-6 items-start">

              {/* Left: courses + about */}
              <div className="space-y-5">

                {/* Group courses */}
                <div className="bg-white rounded-[20px] border border-[#ebebf0] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[#0c0d12] text-[16px] font-bold">Group courses</h2>
                    <span className="text-[#6b6f7d] text-[12px]">{courses.length} available</span>
                  </div>
                  {enrollError && (
                    <div className="bg-[rgba(242,69,69,0.08)] text-[#f24545] rounded-[10px] px-4 py-3 text-[13px] mb-4">{enrollError}</div>
                  )}
                  {courses.length === 0 ? (
                    <p className="text-[#6b6f7d] text-[14px] text-center py-8">No group courses available yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {courses.map((c, i) => {
                        const isEnrolled = enrolledId === c.id;
                        const cColor = COLORS[i % COLORS.length];
                        const seed = c.id ? c.id.charCodeAt(c.id.length - 1) : 0;
                        const maxStudents = c.max_students || 5;
                        const spotsLeft = maxStudents - (seed % maxStudents);
                        return (
                          <div key={c.id} className="flex items-start gap-4 p-4 border border-[#ebebf0] rounded-[14px] hover:border-[#0d9488]/30 transition-colors">
                            <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                              style={{ backgroundColor: cColor }}>
                              {(c.title || 'C')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#0c0d12] text-[14px] font-semibold mb-0.5">{c.title}</h3>
                              <p className="text-[#6b6f7d] text-[12px] line-clamp-2 mb-2">{c.description || 'Group course with weekly sessions.'}</p>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-[#0d9488] text-[13px] font-bold">
                                  {c.price ? `${c.price.toLocaleString()} KZT total` : 'Free'}
                                </span>
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${spotsLeft > 0 ? 'bg-[#f0f9f4] text-[#22be70]' : 'bg-[#fef2f2] text-[#f24545]'}`}>
                                  {spotsLeft > 0 ? `${spotsLeft}/${maxStudents} spots left` : 'Full'}
                                </span>
                              </div>
                            </div>
                            {isEnrolled ? (
                              <Link
                                to={`/student/courses/${c.id}`}
                                className="flex-shrink-0 bg-[#22be70] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:opacity-90"
                              >
                                Go to course →
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleEnroll(c.id)}
                                disabled={enrolling || spotsLeft === 0}
                                className="flex-shrink-0 bg-[#0d9488] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:opacity-90 disabled:opacity-50"
                              >
                                {enrolling ? '...' : c.price > 0 ? `Pay ${c.price.toLocaleString()} KZT` : 'Join free'}
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
                  <h2 className="text-[#0c0d12] text-[16px] font-bold mb-3">About</h2>
                  <p className="text-[#383a44] text-[14px] leading-[1.7] mb-5">{bio}</p>
                  <h3 className="text-[#0c0d12] text-[14px] font-semibold mb-3">Lesson rating</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {RATING_DIMS.map(dim => {
                      const val = (extras.rating - 0.2 + (dim.length % 3) * 0.1).toFixed(1);
                      return (
                        <div key={dim} className="flex items-center justify-between p-3 bg-[#f8f9fc] rounded-[10px]">
                          <span className="text-[#383a44] text-[13px]">{dim}</span>
                          <div className="flex items-center gap-1">
                            <Stars rating={parseFloat(val)} />
                            <span className="text-[#0c0d12] text-[13px] font-semibold ml-1">{val}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews */}
                <div className="bg-white rounded-[20px] border border-[#ebebf0] p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div>
                      <p className="text-[#0c0d12] text-[40px] font-bold leading-none">{extras.rating}</p>
                      <Stars rating={extras.rating} size="lg" />
                      <p className="text-[#6b6f7d] text-[12px] mt-1">{extras.reviews} reviews</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: 'Maria K.',    text: 'Very dedicated teacher. Helped me improve significantly in a short time.' },
                      { name: 'Temirlan B.', text: 'Highly recommend! Great teaching approach and clear explanations.' },
                      { name: 'Alena S.',    text: 'Patient and innovative. You can feel the progress after just a few sessions.' },
                    ].map(({ name, text }) => (
                      <div key={name} className="p-4 bg-[#f8f9fc] rounded-[12px]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#0d9488] flex items-center justify-center text-white text-[11px] font-bold">{name[0]}</div>
                            <span className="text-[#0c0d12] text-[13px] font-semibold">{name}</span>
                          </div>
                          <Stars rating={5} />
                        </div>
                        <p className="text-[#383a44] text-[13px] leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: booking card (sticky) */}
              <div className="sticky top-6 space-y-4">
                <div className="bg-white rounded-[20px] border border-[#ebebf0] p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <svg viewBox="0 0 18 18" fill="none" stroke="#00beb7" strokeWidth="1.5" className="w-4 h-4">
                      <circle cx="9" cy="6" r="3.5"/><path d="M3 17a6 6 0 0112 0"/>
                    </svg>
                    <p className="text-[#0c0d12] text-[15px] font-bold">Book an individual lesson</p>
                  </div>
                  <p className="text-[#6b6f7d] text-[12px] mb-4">1-on-1 · 60 min · Google Meet link generated after confirmation</p>

                  <div className="flex items-baseline gap-1 mb-4">
                    <p className="text-[#0c0d12] text-[30px] font-bold leading-none">{hourlyPrice.toLocaleString()}</p>
                    <span className="text-[#6b6f7d] text-[15px]">KZT / hour</span>
                  </div>

                  {hasAvailability && (
                    <div className="bg-[#f0fff8] rounded-[10px] px-3 py-2.5 mb-4">
                      <p className="text-[#00beb7] text-[11px] font-semibold uppercase tracking-wide mb-1.5">Availability</p>
                      {Object.entries(
                        parsedSlots.reduce((acc, s) => { (acc[s.day] = acc[s.day] || []).push(s); return acc; }, {})
                      ).map(([day, daySlots]) => (
                        <div key={day} className="flex items-baseline gap-1.5 mb-0.5">
                          <span className="text-[#0c0d12] text-[12px] font-semibold w-8 flex-shrink-0">{day.slice(0, 3)}</span>
                          <span className="text-[#383a44] text-[12px]">{daySlots.map(s => `${s.start}-${s.end}`).join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {bookingOk && (
                    <div className="bg-[#edfbf4] rounded-[10px] px-4 py-3 text-[13px] mb-3">
                      <p className="text-[#22be70] font-semibold mb-1">Lesson request sent!</p>
                      <p className="text-[#22be70]/80 text-[12px]">The tutor will confirm shortly. Check your{' '}
                        <Link to="/student/schedule" className="underline font-semibold">Schedule</Link>.
                      </p>
                    </div>
                  )}
                  {bookingError && (
                    <div className="bg-[rgba(242,69,69,0.08)] text-[#f24545] rounded-[8px] px-3 py-2 text-[12px] mb-3">{bookingError}</div>
                  )}

                  {!showSlots ? (
                    <button
                      onClick={() => { setShowSlots(true); setSelectedSlot(null); setBookingOk(false); }}
                      disabled={!hasAvailability && slots.length === 0}
                      className="w-full bg-[#00beb7] text-white text-[14px] font-semibold py-3 rounded-[12px] hover:opacity-90 transition-opacity shadow-[0_4px_14px_0_rgba(0,190,183,0.3)] disabled:opacity-40"
                    >
                      {hasAvailability || slots.length > 0 ? 'Choose a time' : 'No slots available yet'}
                    </button>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[#0c0d12] text-[13px] font-semibold">Select a time slot</p>
                        <button onClick={() => setShowSlots(false)} className="text-[#6b6f7d] text-[11px] hover:text-[#0c0d12]">Cancel</button>
                      </div>
                      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                        {slots.map((daySlots, di) => (
                          <div key={di}>
                            <p className="text-[#6b6f7d] text-[11px] font-medium mb-1.5">{fmtDay(daySlots[0].day)}</p>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {daySlots.map(({ day, hour }) => {
                                const isSel = selectedSlot?.day.getTime() === day.getTime() && selectedSlot?.hour === hour;
                                return (
                                  <button key={hour} onClick={() => setSelectedSlot({ day, hour })}
                                    className={`px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all ${isSel ? 'bg-[#00beb7] text-white' : 'bg-[#f3f4f7] text-[#383a44] hover:bg-[#e8f9f9] hover:text-[#00beb7]'}`}>
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
                          <p className="text-[#6b6f7d] text-[12px] mb-2">
                            {fmtDay(selectedSlot.day)} at {selectedSlot.hour}:00 · 60 min · {hourlyPrice.toLocaleString()} KZT
                          </p>
                          <button onClick={handleBookLesson} disabled={booking}
                            className="w-full bg-[#00beb7] text-white text-[13px] font-semibold py-2.5 rounded-[10px] hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                            {booking && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {booking ? 'Sending request...' : 'Confirm booking'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => navigate('/student/messages')}
                    className="w-full border border-[#d2d4d9] text-[#0c0d12] text-[13px] font-semibold py-2.5 rounded-[10px] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors mt-3"
                  >
                    Send message
                  </button>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-[20px] border border-[#ebebf0] p-5">
                  <div className="space-y-3">
                    {[
                      { label: 'Rating',         value: <span className="flex items-center gap-1"><Stars rating={extras.rating} /><span className="font-semibold">{extras.rating}</span></span> },
                      { label: 'Students',        value: extras.students },
                      { label: 'Lessons given',   value: extras.lessons },
                      { label: 'Group courses',   value: courses.length },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-[13px]">
                        <span className="text-[#6b6f7d]">{label}</span>
                        <span className="text-[#0c0d12]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTutorProfile;
