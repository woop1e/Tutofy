import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TutorSidebar from '../../components/layout/TutorSidebar';
import { messagingAPI } from '../../api/messaging';

const ACCENT_COLORS = [
  { bg: 'bg-primary/20', initial: 'text-primary' },
  { bg: 'bg-purple/20',  initial: 'text-purple' },
  { bg: 'bg-teal/20',    initial: 'text-teal' },
  { bg: 'bg-orange/20',  initial: 'text-orange' },
  { bg: 'bg-[#22be70]/20', initial: 'text-[#22be70]' },
];

const TutorMessages = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchWrapRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || role !== 'tutor') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    messagingAPI.getConversations()
      .then((data) => setConversations(data?.conversations || []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedConv) return;
    messagingAPI.getConversationMessages(selectedConv.other_user_id)
      .then((data) => setMessages(data?.messages || []))
      .catch(() => setMessages([]));
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    messagingAPI.getMyStudents()
      .then((data) => setEnrolledStudents(data?.students || []))
      .catch(() => setEnrolledStudents([]))
      .finally(() => setStudentsLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return;
    setSending(true);
    try {
      await messagingAPI.sendMessage({
        receiver_id: selectedConv.other_user_id,
        content: newMessage.trim(),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender_id: user?.user_id,
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
        },
      ]);
      setNewMessage('');
    } catch {
    } finally {
      setSending(false);
    }
  };

  const openStudentChat = useCallback((student) => {
    const existing = conversations.find((c) => c.other_user_id === student.id);
    setSelectedConv(existing || { other_user_id: student.id, other_user_name: student.name, is_enrolled: true, last_message: '', last_message_at: '' });
    setSearch('');
    setSearchFocused(false);
  }, [conversations]);

  const initials = (name) =>
    (name || '??').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const studentSuggestions = enrolledStudents.filter((s) =>
    (s.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const filtered = conversations.filter((c) => {
    const name = c.other_user_name || '';
    if (!name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'enrolled') return c.is_enrolled;
    if (filter === 'not_enrolled') return !c.is_enrolled;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#f3f4f7] font-sans">
      <TutorSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white h-[68px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)] flex items-center px-7 justify-between flex-shrink-0">
          <div>
            <p className="text-dark text-[20px] font-bold">Messages</p>
            <p className="text-muted text-[13px]">Chat with your students</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-[12px] font-semibold">
                {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'T'}
              </span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Conversations Panel */}
          <div className="w-[360px] bg-white shadow-[0px_4px_12px_0px_rgba(0,0,0,0.06)] flex flex-col flex-shrink-0">
            <div className="p-5 pb-4 flex flex-col gap-2">
              <div className="relative" ref={searchWrapRef}>
                <div className={`flex items-center bg-[#f3f4f7] border rounded-[10px] px-3 h-[40px] transition-colors ${searchFocused ? 'border-primary' : 'border-light-muted'}`}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-muted mr-2 flex-shrink-0"><circle cx="9" cy="9" r="6"/><path d="M15 15l3 3" strokeLinecap="round"/></svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="Search or start new chat..."
                    className="flex-1 bg-transparent text-[13px] text-body placeholder-muted outline-none"
                  />
                  {search && (
                    <button onMouseDown={(e) => { e.preventDefault(); setSearch(''); }} className="text-muted hover:text-dark text-[18px] leading-none ml-1">×</button>
                  )}
                </div>

                {searchFocused && (
                  <div className="absolute left-0 right-0 top-[44px] bg-white border border-light-muted rounded-[10px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.12)] z-50 max-h-[240px] overflow-y-auto">
                    {studentsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : studentSuggestions.length === 0 ? (
                      <p className="text-center text-muted text-[12px] py-5">
                        {search ? 'No students match your search' : 'No enrolled students yet'}
                      </p>
                    ) : (
                      <>
                        <p className="text-[11px] text-muted font-semibold px-3 pt-2.5 pb-1 uppercase tracking-wide">Enrolled students</p>
                        {studentSuggestions.map((s) => {
                          const hasConv = conversations.some((c) => c.other_user_id === s.id);
                          return (
                            <button
                              key={s.id}
                              onMouseDown={(e) => { e.preventDefault(); openStudentChat(s); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f3f4f7] transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-primary text-[11px] font-bold">{initials(s.name)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] text-dark font-medium truncate">{s.name}</p>
                              </div>
                              {hasConv ? (
                                <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">Chat</span>
                              ) : (
                                <span className="text-[10px] text-muted bg-[#f3f4f7] px-1.5 py-0.5 rounded-full flex-shrink-0">New</span>
                              )}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full h-[36px] bg-[#f3f4f7] border border-light-muted rounded-[10px] px-3 text-[13px] text-body outline-none cursor-pointer"
              >
                <option value="all">All conversations</option>
                <option value="enrolled">Enrolled only</option>
                <option value="not_enrolled">Not enrolled only</option>
              </select>
            </div>
            <div className="h-px bg-border mx-0" />

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-muted text-[13px]">
                  {conversations.length === 0 ? 'No conversations yet' : 'No results found'}
                </div>
              ) : (
                filtered.map((conv, i) => {
                  const c = ACCENT_COLORS[i % ACCENT_COLORS.length];
                  const name = conv.other_user_name || `Student ${i + 1}`;
                  const isActive = selectedConv?.other_user_id === conv.other_user_id;
                  return (
                    <button
                      key={conv.other_user_id || i}
                      onClick={() => setSelectedConv(conv)}
                      className={`w-full flex items-center gap-3 px-4 py-5 border-b border-border transition-colors text-left relative ${
                        isActive ? 'bg-primary/6' : 'hover:bg-surface'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
                      )}
                      <div className={`w-11 h-11 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0 relative`}>
                        <span className={`${c.initial} text-[13px] font-bold`}>{initials(name)}</span>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22be70] rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`text-[14px] truncate ${isActive ? 'text-primary font-semibold' : 'text-dark font-medium'}`}>
                            {name}
                          </p>
                          <span className="text-muted text-[11px] flex-shrink-0 ml-2">
                            {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {conv.is_enrolled ? (
                            <span className="text-[10px] font-semibold text-[#22be70] bg-[#22be70]/10 px-1.5 py-0.5 rounded-full">Enrolled</span>
                          ) : (
                            <span className="text-[10px] font-semibold text-orange bg-orange/10 px-1.5 py-0.5 rounded-full">Not enrolled</span>
                          )}
                        </div>
                        <p className={`text-[12px] truncate mt-0.5 ${isActive ? 'text-body' : 'text-muted'}`}>
                          {conv.last_message || 'Start a conversation'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Window */}
          {selectedConv ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-white h-[72px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)] flex items-center px-5 justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center relative">
                    <span className="text-primary text-[13px] font-bold">
                      {initials(selectedConv.other_user_name)}
                    </span>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22be70] rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <p className="text-dark text-[16px] font-semibold">
                      {selectedConv.other_user_name || 'Student'}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-[#22be70] text-[13px]">● Online</p>
                      {selectedConv.is_enrolled ? (
                        <span className="text-[11px] font-semibold text-[#22be70] bg-[#22be70]/10 px-2 py-0.5 rounded-full">Enrolled student</span>
                      ) : (
                        <span className="text-[11px] font-semibold text-orange bg-orange/10 px-2 py-0.5 rounded-full">Not enrolled</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-muted text-[13px]">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isOwn = msg.sender_id === user?.user_id;
                    return (
                      <div key={msg.id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[560px] px-4 py-3 rounded-[16px] text-[14px] leading-relaxed shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] ${
                            isOwn ? 'bg-primary text-white' : 'bg-white text-dark'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-[11px] mt-1 text-right ${isOwn ? 'text-[#e5e5ff]' : 'text-muted'}`}>
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-white shadow-[0px_-2px_8px_0px_rgba(0,0,0,0.05)] p-4 flex items-center gap-3 flex-shrink-0">
                <div className="flex-1 flex items-center bg-[#f3f4f7] border border-light-muted rounded-[22px] px-4 h-11">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-[14px] text-body placeholder-muted outline-none"
                  />
                  <span className="text-muted text-[14px] ml-2 cursor-pointer">😊</span>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className="w-11 h-11 bg-primary rounded-full flex items-center justify-center shadow-[0px_4px_12px_0px_rgba(76,110,255,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <span className="text-white text-[18px] font-bold">→</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-muted">
              <div>
                <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 20 20" fill="none" stroke="#8a90a1" strokeWidth="1.5" className="w-8 h-8"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H7l-4 4V4z"/></svg>
                </div>
                <p className="text-dark text-[17px] font-semibold mb-2">Select a conversation</p>
                <p className="text-[14px]">Choose a student from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorMessages;
