import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { usersAPI } from '../../api/users';
import { coursesAPI } from '../../api/courses';
import TopBarActions from '../../components/ui/TopBarActions';

const COLORS = ['#0d9488', '#935bf5', '#00beb7', '#ff8032', '#22c55e', '#ef4444'];
function avatarColor(id) { return COLORS[(id?.charCodeAt(0) || 0) % COLORS.length]; }

const LANG_CODES_MAP = {
  english: 'EN', russian: 'RU', kazakh: 'KZ', german: 'DE',
  french: 'FR', spanish: 'ES', chinese: 'ZH', arabic: 'AR',
  turkish: 'TR', korean: 'KO', japanese: 'JA', italian: 'IT',
};
function toLangCode(lang) {
  return LANG_CODES_MAP[lang.trim().toLowerCase()] || lang.trim().slice(0, 2).toUpperCase();
}
const WEEK_DAYS_LIST = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TutorPublicProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const uid = user?.user_id;
    if (!uid) { setLoading(false); return; }
    Promise.all([
      usersAPI.getTutorProfile(uid).catch(() => null),
      coursesAPI.searchCourses({ tutor_id: uid }).catch(() => ({ courses: [] })),
    ]).then(([prof, coursesRes]) => {
      setProfile(prof);
      setCourses(coursesRes?.courses || []);
    }).finally(() => setLoading(false));
  }, [user]);

  const color      = avatarColor(user?.user_id);
  const initials   = (user?.name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const subjects   = profile?.subjects || [];
  const bio        = profile?.bio || '';
  const expYears   = profile?.experience_years || 0;
  const price      = profile?.hourly_price || 0;
  const isVerified = profile?.status === 'approved';

  const langCodes = useMemo(() => {
    if (!profile?.teaching_language) return [];
    return profile.teaching_language.split(/[,;\/]/).map(s => toLangCode(s.trim())).filter(Boolean);
  }, [profile?.teaching_language]);

  const formatBadges = useMemo(() => {
    const lt = (profile?.lesson_type || '').toLowerCase();
    if (lt === 'individual') return ['Individual'];
    if (lt === 'group') return ['Group'];
    if (lt === 'both') return ['Individual', 'Group'];
    return [];
  }, [profile?.lesson_type]);

  const availLabel = useMemo(() => {
    const days = Array.isArray(profile?.available_days) ? profile.available_days : [];
    if (!days.length) return null;
    const todayName = WEEK_DAYS_LIST[new Date().getDay()];
    if (days.includes(todayName)) return 'Available today';
    for (let i = 1; i <= 7; i++) {
      const d = WEEK_DAYS_LIST[(new Date().getDay() + i) % 7];
      if (days.includes(d)) return i === 1 ? 'Available tomorrow' : `Available ${d.slice(0, 3)}`;
    }
    return null;
  }, [profile?.available_days]);

  const coursePrices = courses.map(c => c.price || 0).filter(p => p > 0);
  const minPrice = coursePrices.length > 0 ? Math.min(...coursePrices) : 0;

  return (
    <div className="flex h-screen bg-[#f3f4f7] font-sans">
      <TutorSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white h-[68px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)] flex items-center px-7 flex-shrink-0">
          <div>
            <p className="text-[#0c0d12] text-[20px] font-bold">Public Profile</p>
            <p className="text-[#6b6f7d] text-[13px]">This is how students see you in the marketplace</p>
          </div>
          <TopBarActions />
        </div>

        <div className="flex-1 p-6overflow-y-auto  flex flex-col items-center">
          <div className="w-full max-w-[780px]">

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">

                {/* Marketplace card */}
                <div className="bg-white rounded-[16px] border border-[#ebebf0] p-6 flex gap-5 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)]">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {profile?.photo_url ? (
                      <img src={profile.photo_url} alt={user?.name}
                        className="w-[88px] h-[88px] rounded-[14px] object-cover"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div className="w-[88px] h-[88px] rounded-[14px] flex items-center justify-center text-white text-[28px] font-bold select-none"
                      style={{ backgroundColor: color, display: profile?.photo_url ? 'none' : 'flex' }}>
                      {initials}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">

                        {/* Name + verified */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="text-[#0c0d12] text-[17px] font-bold">{user?.name}</h3>
                          {isVerified && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#22be70] bg-[#edfbf4] px-2 py-0.5 rounded-full">
                              <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                                <circle cx="6" cy="6" r="5.5" fill="#22be70"/>
                                <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Verified
                            </span>
                          )}
                        </div>

                        {/* Subjects */}
                        {subjects.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {subjects.slice(0, 5).map(s => (
                              <span key={s} className="bg-[#f0f2ff] text-[#0d9488] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">{s}</span>
                            ))}
                            {subjects.length > 5 && <span className="text-[11px] text-[#6b6f7d] self-center">+{subjects.length - 5}</span>}
                          </div>
                        )}

                        {/* Bio */}
                        {bio ? (
                          <p className="text-[#383a44] text-[13px] leading-[1.6] line-clamp-2 max-w-[500px] mb-2.5">{bio}</p>
                        ) : (
                          <p className="text-[#6b6f7d] text-[13px] italic mb-2.5">No bio set — add one in <Link to="/tutor/profile" className="text-[#0d9488] hover:underline">My Profile</Link></p>
                        )}

                        {/* Pills */}
                        {(expYears > 0 || formatBadges.length > 0 || langCodes.length > 0) && (
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {expYears > 0 && (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#383a44] bg-[#f3f4f7] px-2.5 py-1 rounded-full">
                                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3 h-3">
                                  <circle cx="6" cy="6" r="5"/><path d="M6 3.5V6l1.5 1.5"/>
                                </svg>
                                {expYears} yr{expYears !== 1 ? 's' : ''} exp
                              </span>
                            )}
                            {formatBadges.map(f => (
                              <span key={f} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                                f === 'Individual' ? 'bg-[rgba(13,148,136,0.1)] text-[#0d9488]' : 'bg-[rgba(147,91,245,0.1)] text-[#935bf5]'
                              }`}>{f}</span>
                            ))}
                            {langCodes.length > 0 && (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#383a44] bg-[#f3f4f7] px-2.5 py-1 rounded-full">
                                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3 h-3">
                                  <circle cx="6" cy="6" r="5"/>
                                  <path d="M6 1c-1.5 1.5-2 3-2 5s.5 3.5 2 5M6 1c1.5 1.5 2 3 2 5s-.5 3.5-2 5M1 6h10"/>
                                </svg>
                                {langCodes.join(' · ')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="text-[11px] font-semibold text-[#ffa61a] bg-[rgba(255,166,26,0.1)] px-2.5 py-0.5 rounded-full">
                            New tutor
                          </span>
                          {profile?.location && (
                            <span className="text-[#6b6f7d] text-[12px] flex items-center gap-1">
                              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3 h-3">
                                <path d="M7 1a4 4 0 014 4c0 3-4 8-4 8S3 8 3 5a4 4 0 014-4z"/>
                                <circle cx="7" cy="5" r="1.2" fill="currentColor" stroke="none"/>
                              </svg>
                              {profile.location}
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

                      {/* Price + CTA */}
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
                          {minPrice > 0 && (
                            <div className="mt-2 pt-2 border-t border-[#f0f0f5]">
                              <p className="text-[#0d9488] text-[15px] font-bold leading-none">
                                from {minPrice.toLocaleString()} KZT
                              </p>
                              <p className="text-[#6b6f7d] text-[11px] mt-0.5">Group course</p>
                            </div>
                          )}
                        </div>

                        <div className="w-full bg-[#0d9488]/30 text-[#0d9488] text-[13px] font-semibold py-2.5 rounded-[10px] text-center mb-2 select-none cursor-default border border-[#0d9488]/20">
                          Book a lesson
                        </div>
                        <button
                          onClick={() => setExpanded(v => !v)}
                          className="w-full text-center border border-[#d2d4d9] text-[#383a44] text-[13px] font-semibold py-2.5 rounded-[10px] hover:border-[#0d9488] hover:text-[#0d9488] transition-colors flex items-center justify-center gap-1.5"
                        >
                          {expanded ? 'Hide details' : 'View profile'}
                          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}>
                            <path d="M2 3.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded profile details */}
                {expanded && (
                  <div className="bg-white rounded-[16px] border border-[#ebebf0] divide-y divide-[#f0f0f5] shadow-[0_4px_20px_0_rgba(0,0,0,0.04)] overflow-hidden">

                    {/* About */}
                    {bio && (
                      <div className="p-6">
                        <h2 className="text-[#0c0d12] text-[14px] font-bold mb-2">About</h2>
                        <p className="text-[#383a44] text-[13px] leading-[1.7]">{bio}</p>
                      </div>
                    )}

                    {/* Group courses */}
                    <div className="p-6">
                      <h2 className="text-[#0c0d12] text-[14px] font-bold mb-3">
                        Group courses
                        <span className="ml-2 text-[11px] font-medium text-[#6b6f7d]">{courses.length} available</span>
                      </h2>
                      {courses.length === 0 ? (
                        <p className="text-[#6b6f7d] text-[13px]">No group courses yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {courses.map((c, i) => (
                            <div key={c.id} className="flex items-center gap-3 p-3 rounded-[12px] bg-[#f8f9fc]">
                              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                                {(c.title || 'C')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[#0c0d12] text-[13px] font-semibold truncate">{c.title}</p>
                                {c.description && <p className="text-[#6b6f7d] text-[11px] truncate">{c.description}</p>}
                              </div>
                              <span className="text-[#0d9488] text-[12px] font-bold flex-shrink-0">
                                {c.price ? `${c.price.toLocaleString()} KZT` : 'Free'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Availability */}
                    {Array.isArray(profile?.available_days) && profile.available_days.length > 0 && (
                      <div className="p-6">
                        <h2 className="text-[#0c0d12] text-[14px] font-bold mb-3">Availability</h2>
                        <div className="flex flex-wrap gap-2">
                          {profile.available_days.map(day => (
                            <span key={day} className="text-[12px] font-medium text-[#0d9488] bg-[rgba(13,148,136,0.08)] px-3 py-1 rounded-full">
                              {day}
                            </span>
                          ))}
                        </div>
                        {profile.available_time_start && profile.available_time_end &&
                          !profile.available_time_start.startsWith('[') && (
                          <p className="text-[#6b6f7d] text-[12px] mt-2">
                            {profile.available_time_start} – {profile.available_time_end}
                            {profile.timezone && ` (${profile.timezone})`}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Languages / education */}
                    {(profile?.teaching_language || profile?.education) && (
                      <div className="p-6 grid grid-cols-2 gap-6">
                        {profile?.teaching_language && (
                          <div>
                            <h2 className="text-[#0c0d12] text-[14px] font-bold mb-2">Teaching language</h2>
                            <div className="flex flex-wrap gap-1.5">
                              {langCodes.map(code => (
                                <span key={code} className="text-[12px] font-semibold text-[#383a44] bg-[#f3f4f7] px-2.5 py-1 rounded-[6px]">{code}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {profile?.education && (
                          <div>
                            <h2 className="text-[#0c0d12] text-[14px] font-bold mb-2">Education</h2>
                            <p className="text-[#383a44] text-[13px]">{profile.education}</p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

                <p className="text-center text-[12px] text-[#6b6f7d]">
                  To update your profile, go to{' '}
                  <Link to="/tutor/profile" className="text-[#0d9488] font-medium hover:underline">My Profile</Link>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorPublicProfile;
