import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { usersAPI } from '../../api/users';
import TopBarActions from '../../components/ui/TopBarActions';

const STATUS_TABS = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE = {
  pending:  { bg: '#fff8e1', color: '#b45309', label: 'Pending' },
  approved: { bg: '#e6f9f0', color: '#15803d', label: 'Approved' },
  rejected: { bg: '#fef2f2', color: '#b91c1c', label: 'Rejected' },
};

const AdminTutorApplications = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [tutors, setTutors]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [acting, setActing]       = useState(null);
  const [selected, setSelected]   = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (!isAuthenticated || role !== 'admin') navigate('/login', { replace: true });
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    setLoading(true);
    usersAPI.getAllTutors(activeTab)
      .then((d) => setTutors(d?.tutors || []))
      .catch(() => setTutors([]))
      .finally(() => setLoading(false));
    setSelected(null);
  }, [activeTab]);

  const filtered = useMemo(() => {
    if (!search) return tutors;
    const q = search.toLowerCase();
    return tutors.filter((t) =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q) ||
      (t.location || '').toLowerCase().includes(q)
    );
  }, [tutors, search]);

  const updateTutorStatus = (id, newStatus) => {
    setTutors((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status: newStatus } : null);
  };

  const handleApprove = async (tutor) => {
    setActing(tutor.id);
    try {
      await usersAPI.approveTutor(tutor.id);
      updateTutorStatus(tutor.id, 'approved');
      if (activeTab === 'rejected') updateTutorStatus(tutor.id, 'approved');
    } catch {}
    finally { setActing(null); }
  };

  const handleReject = async (tutor) => {
    setActing(tutor.id);
    try {
      await usersAPI.rejectTutor(tutor.id);
      updateTutorStatus(tutor.id, 'rejected');
    } catch {}
    finally { setActing(null); }
  };

  const pendingCount = tutors.filter((t) => (t.status || 'pending') === 'pending').length;

  return (
    <div className="flex h-screen bg-[#f5f6fa] font-sans">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-[#ebebf0] px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-[#0c0d12] text-[22px] font-bold leading-none">Tutor Applications</h1>
            <p className="text-[#6b6f7d] text-[13px] mt-1">
              {activeTab === 'all'
                ? `${tutors.length} tutor${tutors.length !== 1 ? 's' : ''} total`
                : activeTab === 'pending'
                ? `${tutors.length} pending application${tutors.length !== 1 ? 's' : ''} awaiting review`
                : `${tutors.length} ${activeTab} tutor${tutors.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <TopBarActions />
        </div>

        {/* Status filter tabs */}
        <div className="bg-white border-b border-[#ebebf0] px-8 flex items-center gap-1 flex-shrink-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#0d9488] text-[#0d9488]'
                  : 'border-transparent text-[#6b6f7d] hover:text-[#0c0d12]'
              }`}
            >
              {tab.label}
              {tab.key === 'pending' && pendingCount > 0 && activeTab !== 'pending' && (
                <span className="ml-1.5 text-[10px] bg-[#f24545] text-white font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="bg-white border-b border-[#ebebf0] px-8 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="relative flex-1 max-w-xs">
            <svg viewBox="0 0 16 16" fill="none" stroke="#8a90a1" strokeWidth="1.4" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 h-9 border border-[#d2d4d9] rounded-[8px] text-[13px] focus:outline-none focus:border-[#0d9488] bg-white"
            />
          </div>
          <p className="text-[12px] text-[#6b6f7d] ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* List panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-[#6b6f7d]">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-3 opacity-30">
                  <circle cx="24" cy="18" r="8"/><path d="M8 44a16 16 0 0132 0"/>
                </svg>
                <p className="text-[14px] font-medium">No tutors found</p>
                <p className="text-[12px] mt-1">Try a different filter or search term</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filtered.map((tutor) => {
                  const tutorStatus = tutor.status || 'pending';
                  const badge = STATUS_BADGE[tutorStatus] || STATUS_BADGE.pending;
                  const isPending = tutorStatus === 'pending';
                  return (
                    <div
                      key={tutor.id}
                      onClick={() => setSelected(selected?.id === tutor.id ? null : tutor)}
                      className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all ${
                        selected?.id === tutor.id
                          ? 'border-[#0d9488] shadow-md'
                          : 'border-[#ebebf0] hover:border-[#c8ccdd]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-[#0d9488]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {tutor.photo_url ? (
                            <img src={tutor.photo_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <span className="text-[#0d9488] text-[15px] font-bold">
                              {(tutor.name || '?').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[14px] font-bold text-[#0c0d12]">{tutor.name || '-'}</p>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: badge.bg, color: badge.color }}
                            >
                              {badge.label}
                            </span>
                            {tutor.location && (
                              <span className="text-[11px] text-[#6b6f7d]">· {tutor.location}</span>
                            )}
                          </div>
                          <p className="text-[12px] text-[#6b6f7d] mt-0.5">{tutor.email}</p>
                          {(tutor.subjects || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {tutor.subjects.slice(0, 4).map((s) => (
                                <span key={s} className="text-[10px] bg-[#0d9488]/8 text-[#0d9488] font-medium px-2 py-0.5 rounded-full">{s}</span>
                              ))}
                              {tutor.subjects.length > 4 && (
                                <span className="text-[10px] text-[#6b6f7d]">+{tutor.subjects.length - 4} more</span>
                              )}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-[#6b6f7d]">
                            {tutor.experience_years > 0 && <span>{tutor.experience_years} yr exp</span>}
                            {tutor.lesson_type && <span>· {tutor.lesson_type}</span>}
                            {tutor.hourly_price > 0 && <span>· {tutor.hourly_price.toLocaleString()} KZT/hr</span>}
                          </div>
                        </div>

                        {/* Action buttons — only for pending */}
                        {isPending && (
                          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleApprove(tutor)}
                              disabled={acting === tutor.id}
                              className="px-4 py-1.5 bg-[#22be70] text-white text-[12px] font-bold rounded-[8px] hover:opacity-90 disabled:opacity-40 transition-opacity"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(tutor)}
                              disabled={acting === tutor.id}
                              className="px-4 py-1.5 border border-[#f24545] text-[#f24545] text-[12px] font-bold rounded-[8px] hover:bg-[#f24545]/5 disabled:opacity-40 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-[360px] flex-shrink-0 border-l border-[#ebebf0] bg-white overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-[#0c0d12]">Application Details</h3>
                <button onClick={() => setSelected(null)} className="text-[#6b6f7d] hover:text-[#0c0d12]">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Avatar + name */}
              <div className="flex flex-col items-center mb-5">
                <div className="w-20 h-20 rounded-full bg-[#0d9488]/10 flex items-center justify-center overflow-hidden mb-3">
                  {selected.photo_url ? (
                    <img src={selected.photo_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <span className="text-[#0d9488] text-[24px] font-bold">
                      {(selected.name || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-[16px] font-bold text-[#0c0d12]">{selected.name}</p>
                <p className="text-[12px] text-[#6b6f7d]">{selected.email}</p>
                {selected.phone && <p className="text-[12px] text-[#6b6f7d]">{selected.phone}</p>}
                {selected.location && <p className="text-[12px] text-[#6b6f7d] mt-0.5">{selected.location}</p>}
                {(() => {
                  const s = selected.status || 'pending';
                  const badge = STATUS_BADGE[s] || STATUS_BADGE.pending;
                  return (
                    <span className="mt-2 text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  );
                })()}
              </div>

              <DetailSection title="Bio">
                <p className="text-[12px] text-[#383a44] leading-relaxed">{selected.bio || '-'}</p>
              </DetailSection>

              <DetailSection title="Teaching">
                <Row label="Subjects">{(selected.subjects || []).join(', ') || '-'}</Row>
                <Row label="Language">{selected.teaching_language || '-'}</Row>
                <Row label="Level">{selected.student_level || '-'}</Row>
                <Row label="Format">{selected.lesson_type || '-'}</Row>
                <Row label="Experience">{selected.experience_years ? `${selected.experience_years} years` : '-'}</Row>
              </DetailSection>

              <DetailSection title="Pricing">
                <Row label="Hourly rate">{selected.hourly_price ? `${selected.hourly_price.toLocaleString()} KZT` : '-'}</Row>
              </DetailSection>

              <DetailSection title="Education">
                <p className="text-[12px] text-[#383a44] leading-relaxed">{selected.education || '-'}</p>
              </DetailSection>

              {(() => {
                const all = selected.certificates || [];
                const textCerts = all.filter(c => !c.startsWith('http') && !c.startsWith('idoc:'));
                const fileCerts = all.filter(c => c.startsWith('http'));
                const idDocs    = all.filter(c => c.startsWith('idoc:')).map(c => {
                  const rest = c.slice(5);
                  const sep  = rest.indexOf(':');
                  const type = rest.slice(0, sep);
                  const url  = rest.slice(sep + 1);
                  const labels = { passport: 'Passport', id_card: 'National ID Card', driver_license: "Driver's License", diploma: 'Diploma / Degree', other: 'Other Document' };
                  return { label: labels[type] || type, url };
                });
                const hasAnything = textCerts.length > 0 || fileCerts.length > 0 || idDocs.length > 0;
                if (!hasAnything) return null;
                return (
                  <>
                    {textCerts.length > 0 && (
                      <DetailSection title="Certificates">
                        <div className="flex flex-wrap gap-1">
                          {textCerts.map(c => (
                            <span key={c} className="text-[10px] bg-[#935bf5]/8 text-[#935bf5] font-medium px-2 py-0.5 rounded-full">{c}</span>
                          ))}
                        </div>
                      </DetailSection>
                    )}
                    {fileCerts.length > 0 && (
                      <DetailSection title="Certificate Files">
                        <div className="flex flex-col gap-2">
                          {fileCerts.map((url, i) => {
                            const name = decodeURIComponent(url.split('/').pop().split('?')[0]);
                            const isImg = /\.(png|jpe?g|webp|gif)$/i.test(name);
                            return (
                              <div key={i} className="border border-[#ebebf0] rounded-[10px] overflow-hidden">
                                {isImg && (
                                  <img src={url} alt={name} className="w-full max-h-48 object-contain bg-[#f8f8fb]" onError={e => { e.target.style.display = 'none'; }} />
                                )}
                                <a href={url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#935bf5] font-medium hover:bg-[#f8f8fb] transition-colors">
                                  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z"/>
                                    <path d="M9 2v4h4"/>
                                  </svg>
                                  {name || `Certificate ${i + 1}`}
                                  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" className="ml-auto opacity-50">
                                    <path d="M3 8h10M9 4l4 4-4 4"/>
                                  </svg>
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </DetailSection>
                    )}
                    {idDocs.length > 0 && (
                      <DetailSection title="Identity Documents">
                        <div className="flex flex-col gap-2">
                          {idDocs.map((doc, i) => {
                            const name = decodeURIComponent(doc.url.split('/').pop().split('?')[0]);
                            const isImg = /\.(png|jpe?g|webp|gif)$/i.test(name);
                            return (
                              <div key={i} className="border border-[#ebebf0] rounded-[10px] overflow-hidden">
                                {isImg && (
                                  <img src={doc.url} alt={doc.label} className="w-full max-h-48 object-contain bg-[#f8f8fb]" onError={e => { e.target.style.display = 'none'; }} />
                                )}
                                <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-[#f8f8fb] transition-colors">
                                  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="#22be70" strokeWidth="1.5">
                                    <rect x="2" y="2" width="12" height="12" rx="2"/>
                                    <path d="M5 8h6M5 5.5h6M5 10.5h4"/>
                                  </svg>
                                  <div>
                                    <p className="text-[11px] font-semibold text-[#383a44]">{doc.label}</p>
                                    <p className="text-[10px] text-[#888] truncate max-w-[180px]">{name}</p>
                                  </div>
                                  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" className="ml-auto opacity-50">
                                    <path d="M3 8h10M9 4l4 4-4 4"/>
                                  </svg>
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </DetailSection>
                    )}
                  </>
                );
              })()}

              {/* Bottom actions — only for pending */}
              {(selected.status || 'pending') === 'pending' && (
                <div className="flex gap-3 mt-6 sticky bottom-0 bg-white pt-4 border-t border-[#ebebf0]">
                  <button
                    onClick={() => handleApprove(selected)}
                    disabled={acting === selected.id}
                    className="flex-1 bg-[#22be70] text-white text-[13px] font-bold py-2.5 rounded-[10px] hover:opacity-90 disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selected)}
                    disabled={acting === selected.id}
                    className="flex-1 border border-[#f24545] text-[#f24545] text-[13px] font-bold py-2.5 rounded-[10px] hover:bg-[#f24545]/5 disabled:opacity-40"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailSection = ({ title, children }) => (
  <div className="mb-4">
    <p className="text-[10px] font-bold text-[#6b6f7d] uppercase tracking-wider mb-2">{title}</p>
    {children}
  </div>
);

const Row = ({ label, children }) => (
  <div className="flex gap-2 mb-1">
    <span className="text-[11px] text-[#6b6f7d] w-20 flex-shrink-0">{label}</span>
    <span className="text-[11px] text-[#383a44] font-medium">{children}</span>
  </div>
);

export default AdminTutorApplications;
