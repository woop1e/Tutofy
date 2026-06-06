﻿import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentSidebar from '../../components/layout/StudentSidebar';
import { messagingAPI } from '../../api/messaging';
import { enrollmentsAPI } from '../../api/enrollments';
import TopBarActions from '../../components/ui/TopBarActions';

const ACCENT_COLORS = [
  { bg: 'bg-primary/20', initial: 'text-primary' },
  { bg: 'bg-purple/20', initial: 'text-purple' },
  { bg: 'bg-teal/20', initial: 'text-teal' },
  { bg: 'bg-orange/20', initial: 'text-orange' },
  { bg: 'bg-[#22be70]/20', initial: 'text-[#22be70]' },
];

const initials = (name) =>
  (name || '??').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const Messages = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);
  const searchWrapRef = useRef(null);

  // Conversations & messages
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Search & filter
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'

  // People suggestions for dropdown
  const [myTutors, setMyTutors] = useState([]);
  const [coursemates, setCoursemates] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated || role !== 'student') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  // Load conversations
  useEffect(() => {
    messagingAPI.getConversations()
      .then((data) => {
        const convs = data?.conversations || [];
        setConversations(convs);
        // Auto-open chat if ?with= param is present
        const withId = searchParams.get('with');
        const withName = searchParams.get('name') || '';
        if (withId) {
          const existing = convs.find((c) => c.other_user_id === withId);
          setSelectedConv(existing || {
            other_user_id: withId,
            other_user_name: withName,
            other_user_role: 'tutor',
            last_message: '',
            unread_count: 0,
          });
        }
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedConv) return;
    messagingAPI.getConversationMessages(selectedConv.other_user_id)
      .then((data) => {
        setMessages(data?.messages || []);
        // Mark as read locally
        setConversations((prev) =>
          prev.map((c) =>
            c.other_user_id === selectedConv.other_user_id
              ? { ...c, unread_count: 0 }
              : c
          )
        );
      })
      .catch(() => setMessages([]));
  }, [selectedConv]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load tutors + coursemates when search is focused
  useEffect(() => {
    if (!searchFocused || myTutors.length > 0) return;
    setSuggestionsLoading(true);

    Promise.all([
      messagingAPI.getMyTutors()
        .then((data) => (data?.tutors || []).map((t) => ({ ...t, type: 'tutor' })))
        .catch(() => []),

      messagingAPI.getMyCoursemates
        ? messagingAPI.getMyCoursemates()
          .then((d) => (d?.coursemates || []).map((s) => ({ ...s, type: 'student' })))
          .catch(() => [])
        : Promise.resolve([]),
    ]).then(([tutors, mates]) => {
      setMyTutors(tutors);
      setCoursemates(mates);
    }).finally(() => setSuggestionsLoading(false));
  }, [searchFocused, myTutors.length]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return;
    setSending(true);
    try {
      await messagingAPI.sendMessage({
        receiver_id: selectedConv.other_user_id,
        content: newMessage.trim(),
      });
      const optimistic = {
        id: Date.now(),
        sender_id: user?.user_id,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setConversations((prev) =>
        prev.map((c) =>
          c.other_user_id === selectedConv.other_user_id
            ? { ...c, last_message: newMessage.trim(), last_message_at: optimistic.created_at }
            : c
        )
      );
      setNewMessage('');
    } catch {
    } finally {
      setSending(false);
    }
  };

  // Open chat from suggestion dropdown
  const openSuggestionChat = useCallback((person) => {
    const existing = conversations.find((c) => c.other_user_id === person.id);
    setSelectedConv(
      existing
        ? { ...existing, other_user_role: person.type }
        : {
          other_user_id: person.id,
          other_user_name: person.name,
          other_user_role: person.type,
          last_message: '',
          last_message_at: '',
          unread_count: 0,
        }
    );
    setSearch('');
    setSearchFocused(false);
  }, [conversations]);

  // Filtered conversations
  const filteredConversations = conversations.filter((c) => {
    const name = (c.other_user_name || '').toLowerCase();
    if (!name.includes(search.toLowerCase())) return false;
    if (filter === 'unread') return (c.unread_count || 0) > 0;
    if (filter === 'read') return (c.unread_count || 0) === 0;
    return true;
  });

  // Suggestions filtered by search
  const filteredTutors = myTutors.filter((t) =>
    (t.name || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredCoursemates = coursemates.filter((s) =>
    (s.name || '').toLowerCase().includes(search.toLowerCase())
  );
  const hasSuggestions = filteredTutors.length > 0 || filteredCoursemates.length > 0;

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <div className="flex h-screen bg-[#f3f4f7] font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white h-[68px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)] flex items-center px-7 justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-dark text-[20px] font-bold">Messages</p>
              <p className="text-muted text-[13px]">Chat with your tutors and coursemates</p>
            </div>
            {totalUnread > 0 && (
              <span className="bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <TopBarActions />
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-[12px] font-semibold">
                {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'S'}
              </span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* â"€â"€ Left Panel â"€â"€ */}
          <div className="w-[360px] bg-white shadow-[0px_4px_12px_0px_rgba(0,0,0,0.06)] flex flex-col flex-shrink-0">
            <div className="p-5 pb-3 flex flex-col gap-2">

              {/* Search with dropdown */}
              <div className="relative" ref={searchWrapRef}>
                <div
                  className={`flex items-center bg-[#f3f4f7] border rounded-[10px] px-3 h-[40px] transition-colors ${searchFocused ? 'border-primary' : 'border-light-muted'
                    }`}
                >
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
                    <button
                      onMouseDown={(e) => { e.preventDefault(); setSearch(''); }}
                      className="text-muted hover:text-dark text-[18px] leading-none ml-1"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Suggestions dropdown */}
                {searchFocused && (
                  <div className="absolute left-0 right-0 top-[44px] bg-white border border-light-muted rounded-[10px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.12)] z-50 max-h-[280px] overflow-y-auto">
                    {suggestionsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : !hasSuggestions ? (
                      <p className="text-center text-muted text-[12px] py-5">
                        {search ? 'No people match your search' : 'No tutors or coursemates yet'}
                      </p>
                    ) : (
                      <>
                        {/* Tutors section */}
                        {filteredTutors.length > 0 && (
                          <>
                            <p className="text-[11px] text-muted font-semibold px-3 pt-2.5 pb-1 uppercase tracking-wide">
                              My Tutors
                            </p>
                            {filteredTutors.map((tutor) => {
                              const hasConv = conversations.some((c) => c.other_user_id === tutor.id);
                              return (
                                <button
                                  key={tutor.id}
                                  onMouseDown={(e) => { e.preventDefault(); openSuggestionChat(tutor); }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f3f4f7] transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary text-[11px] font-bold">{initials(tutor.name)}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-[13px] text-dark font-medium truncate">{tutor.name}</p>
                                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">Tutor</span>
                                    </div>
                                    {tutor.course && (
                                      <p className="text-[11px] text-muted truncate">{tutor.course}</p>
                                    )}
                                  </div>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${hasConv
                                      ? 'text-primary bg-primary/10'
                                      : 'text-muted bg-[#f3f4f7]'
                                    }`}>
                                    {hasConv ? 'Chat' : 'New'}
                                  </span>
                                </button>
                              );
                            })}
                          </>
                        )}

                        {/* Coursemates section */}
                        {filteredCoursemates.length > 0 && (
                          <>
                            <p className="text-[11px] text-muted font-semibold px-3 pt-2.5 pb-1 uppercase tracking-wide border-t border-border mt-1">
                              Coursemates
                            </p>
                            {filteredCoursemates.map((mate) => {
                              const hasConv = conversations.some((c) => c.other_user_id === mate.id);
                              return (
                                <button
                                  key={mate.id}
                                  onMouseDown={(e) => { e.preventDefault(); openSuggestionChat(mate); }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f3f4f7] transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-teal text-[11px] font-bold">{initials(mate.name)}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-[13px] text-dark font-medium truncate">{mate.name}</p>
                                      <span className="text-[9px] font-bold text-teal bg-teal/10 px-1.5 py-0.5 rounded-full flex-shrink-0">Student</span>
                                    </div>
                                    {mate.course && (
                                      <p className="text-[11px] text-muted truncate">{mate.course}</p>
                                    )}
                                  </div>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${hasConv
                                      ? 'text-teal bg-teal/10'
                                      : 'text-muted bg-[#f3f4f7]'
                                    }`}>
                                    {hasConv ? 'Chat' : 'New'}
                                  </span>
                                </button>
                              );
                            })}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Read / Unread filter tabs */}
              <div className="flex gap-1 bg-[#f3f4f7] rounded-[10px] p-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'unread', label: 'Unread' },
                  { key: 'read', label: 'Read' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`flex-1 h-[30px] rounded-[8px] text-[12px] font-semibold transition-colors ${filter === tab.key
                        ? 'bg-white text-primary shadow-[0px_1px_4px_0px_rgba(0,0,0,0.08)]'
                        : 'text-muted hover:text-dark'
                      }`}
                  >
                    {tab.label}
                    {tab.key === 'unread' && totalUnread > 0 && (
                      <span className="ml-1 bg-primary text-white text-[9px] font-bold px-1 py-0.5 rounded-full">
                        {totalUnread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-10 text-muted text-[13px]">
                  {conversations.length === 0
                    ? 'No conversations yet'
                    : filter !== 'all'
                      ? `No ${filter} messages`
                      : 'No results found'}
                </div>
              ) : (
                filteredConversations.map((conv, i) => {
                  const c = ACCENT_COLORS[i % ACCENT_COLORS.length];
                  const name = conv.other_user_name || `User ${i + 1}`;
                  const isActive = selectedConv?.other_user_id === conv.other_user_id;
                  const isUnread = (conv.unread_count || 0) > 0;

                  return (
                    <button
                      key={conv.other_user_id || i}
                      onClick={() => setSelectedConv(conv)}
                      className={`w-full flex items-center gap-3 px-4 py-4 border-b border-border transition-colors text-left relative ${isActive ? 'bg-primary/[0.06]' : 'hover:bg-surface'
                        }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r-full" />
                      )}

                      <div className={`w-11 h-11 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0 relative`}>
                        <span className={`${c.initial} text-[13px] font-bold`}>{initials(name)}</span>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22be70] rounded-full border-2 border-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className={`text-[14px] truncate ${isActive ? 'text-primary font-semibold'
                                : isUnread ? 'text-dark font-bold'
                                  : 'text-dark font-medium'
                              }`}>
                              {name}
                            </p>
                            {conv.other_user_role === 'tutor' && (
                              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">Tutor</span>
                            )}
                            {conv.other_user_role === 'student' && (
                              <span className="text-[9px] font-bold text-teal bg-teal/10 px-1.5 py-0.5 rounded-full flex-shrink-0">Student</span>
                            )}
                          </div>
                          <span className={`text-[11px] flex-shrink-0 ml-2 ${isUnread ? 'text-primary font-semibold' : 'text-muted'}`}>
                            {conv.last_message_at
                              ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                        </div>
                        <p className={`text-[12px] truncate ${isActive ? 'text-body'
                            : isUnread ? 'text-body font-medium'
                              : 'text-muted'
                          }`}>
                          {conv.last_message || 'Start a conversation'}
                        </p>
                      </div>

                      {isUnread && (
                        <div className="w-[18px] h-[18px] bg-primary rounded-full flex items-center justify-center flex-shrink-0 ml-1">
                          <span className="text-white text-[10px] font-bold">{conv.unread_count}</span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* â"€â"€ Chat Window â"€â"€ */}
          {selectedConv ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="bg-white h-[72px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)] flex items-center px-5 justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center relative">
                    <span className="text-primary text-[13px] font-bold">
                      {initials(selectedConv.other_user_name)}
                    </span>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22be70] rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-dark text-[16px] font-semibold">
                        {selectedConv.other_user_name || 'User'}
                      </p>
                      {selectedConv.other_user_role === 'tutor' && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Tutor</span>
                      )}
                      {selectedConv.other_user_role === 'student' && (
                        <span className="text-[10px] font-bold text-teal bg-teal/10 px-2 py-0.5 rounded-full">Student</span>
                      )}
                    </div>
                    <p className="text-[#22be70] text-[13px] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22be70] inline-block" />Online</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
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
                          className={`max-w-[560px] px-4 py-3 rounded-[16px] text-[14px] leading-relaxed shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] ${isOwn ? 'bg-primary text-white' : 'bg-white text-dark'
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

              {/* Input */}
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
                  
                </div>
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className="w-11 h-11 bg-primary rounded-full flex items-center justify-center shadow-[0px_4px_12px_0px_rgba(76,110,255,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-white text-[18px] font-bold">→</span>
                  )}
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
                <p className="text-[14px]">Choose a tutor or coursemate to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
