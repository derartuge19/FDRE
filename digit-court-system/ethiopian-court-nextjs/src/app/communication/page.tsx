'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare,
  Search,
  User,
  Settings,
  LogOut,
  Bell,
  Send,
  Paperclip,
  MoreVertical,
  FileText,
  ShieldCheck,
  Gavel,
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  Check,
  CheckCheck,
  Lock,
  Download,
  Video,
  Plus,
  Save,
  X,
  Circle,
  Image as ImageIcon,
  File,
  Phone,
  ChevronDown,
 } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import RequireAccess from '@/components/RequireAccess';
import RoleBasedContent from '@/components/RoleBasedContent';
import { useUserRole, useCurrentUser } from '@/hooks/useUserRole';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isSelf: boolean;
  status: 'sent' | 'delivered' | 'read';
  attachments: Attachment[];
}

interface Contact {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'away';
  avatar: string;
  lastMessage: string;
  lastSeen: string;
  unreadCount: number;
}

// ─── Mock contacts ─────────────────────────────────────────────────────────────
const MOCK_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Hon. Alem Tesfaye', role: 'Presiding Judge', status: 'online', avatar: '👨‍⚖️', lastMessage: 'Case CR-2026-044 hearing rescheduled.', lastSeen: 'Active Now', unreadCount: 2 },
  { id: 'c2', name: 'Adv. Meron Haile', role: 'Defense Counsel', status: 'online', avatar: '👩‍💼', lastMessage: 'Submitted amended motion.', lastSeen: 'Active Now', unreadCount: 0 },
  { id: 'c3', name: 'Ato Biruk Tadesse', role: 'Court Clerk', status: 'away', avatar: '🧑‍💼', lastMessage: 'Docket update for March 17.', lastSeen: '12 min ago', unreadCount: 1 },
  { id: 'c4', name: 'Adv. Sara Bekele', role: 'Prosecutor', status: 'offline', avatar: '👩‍⚖️', lastMessage: 'Evidence exhibit filed.', lastSeen: '3h ago', unreadCount: 0 },
  { id: 'c5', name: 'Dr. Yonas Girma', role: 'Expert Witness', status: 'offline', avatar: '👨‍🔬', lastMessage: 'Forensic report ready.', lastSeen: 'Yesterday', unreadCount: 0 },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  c1: [
    { id: 'm1', senderId: 'c1', senderName: 'Hon. Alem Tesfaye', content: 'Good morning. The preliminary hearing for Case CR-2026-044 has been moved to March 20th.', timestamp: '09:14', isSelf: false, status: 'read', attachments: [] },
    { id: 'm2', senderId: 'me', senderName: 'Me', content: 'Understood, Your Honour. We will notify all parties immediately.', timestamp: '09:16', isSelf: true, status: 'read', attachments: [] },
    { id: 'm3', senderId: 'c1', senderName: 'Hon. Alem Tesfaye', content: 'Please ensure the amended docket notice reaches the defense by end of day.', timestamp: '09:17', isSelf: false, status: 'read', attachments: [] },
    { id: 'm4', senderId: 'me', senderName: 'Me', content: 'Confirmed. I\'m attaching the rescheduled hearing order now.', timestamp: '09:19', isSelf: true, status: 'delivered', attachments: [{ id: 'a1', name: 'Hearing_Order_CR2026-044.pdf', size: '142 KB', type: 'pdf', url: '#' }] },
  ],
  c2: [
    { id: 'm5', senderId: 'c2', senderName: 'Adv. Meron Haile', content: 'I have submitted the amended motion to suppress. Please confirm receipt.', timestamp: '10:02', isSelf: false, status: 'read', attachments: [{ id: 'a2', name: 'Motion_to_Suppress_Amended.docx', size: '88 KB', type: 'doc', url: '#' }] },
    { id: 'm6', senderId: 'me', senderName: 'Me', content: 'Received. Forwarded to the presiding judge\'s clerk for review.', timestamp: '10:10', isSelf: true, status: 'read', attachments: [] },
  ],
  c3: [
    { id: 'm7', senderId: 'c3', senderName: 'Ato Biruk Tadesse', content: 'The March 17th docket has been updated. 6 cases on schedule.', timestamp: '08:30', isSelf: false, status: 'read', attachments: [] },
  ],
};

// ─── Helper ─────────────────────────────────────────────────────────────────
function fileIcon(type: string) {
  if (type.startsWith('image')) return <ImageIcon size={16} className="text-blue-400" />;
  if (type === 'pdf') return <FileText size={16} className="text-red-400" />;
  return <File size={16} className="text-emerald-400" />;
}

function statusIcon(status: 'sent' | 'delivered' | 'read') {
  if (status === 'read') return <CheckCheck size={14} className="text-emerald-400" />;
  if (status === 'delivered') return <CheckCheck size={14} className="text-slate-400" />;
  return <Check size={14} className="text-slate-400" />;
}

function statusDot(status: 'online' | 'offline' | 'away') {
  const colors: Record<string, string> = {
    online: 'bg-emerald-400',
    away: 'bg-amber-400',
    offline: 'bg-slate-400',
  };
  return <span className={`w-2.5 h-2.5 rounded-full ${colors[status]} ring-2 ring-[#0a0f0d] shrink-0`} />;
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function Communication() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(MOCK_CONTACTS[0]);
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('courtUser');
    if (userStr) {
      try { setCurrentUser(JSON.parse(userStr)); } catch { setCurrentUser({ name: 'Court User' }); }
    } else {
      setCurrentUser({ name: 'Court User' });
    }

    // Try to load real contacts from API
    const token = localStorage.getItem('courtToken');
    if (token) {
      fetch('http://localhost:5173/api/users', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data?.length) {
            const real: Contact[] = data.data.map((u: any) => ({
              id: u.id,
              name: u.name,
              role: u.roles?.[0] || 'Member',
              status: u.isActive ? 'online' : 'offline',
              avatar: u.roles?.[0] === 'judge' ? '👨‍⚖️' : '👤',
              lastMessage: 'Click to start a secure conversation.',
              lastSeen: u.isActive ? 'Active Now' : 'Recently',
              unreadCount: 0,
            }));
            setContacts([...MOCK_CONTACTS, ...real]);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedContact]);

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (!selectedContact) return;
    setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, unreadCount: 0 } : c));
    // Mark all received messages in this thread as read
    setMessages(prev => {
      const thread = prev[selectedContact.id] || [];
      return {
        ...prev,
        [selectedContact.id]: thread.map(m => (!m.isSelf && m.status !== 'read') ? { ...m, status: 'read' as const } : m),
      };
    });
  }, [selectedContact]);

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const attachments: Attachment[] = files.map(f => ({
      id: `att-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
      type: f.type.startsWith('image') ? 'image' : f.name.endsWith('.pdf') ? 'pdf' : 'doc',
      url: URL.createObjectURL(f),
    }));
    setPendingFiles(prev => [...prev, ...attachments]);
    e.target.value = '';
  };

  const sendMessage = () => {
    if (!newMessage.trim() && pendingFiles.length === 0) return;
    if (!selectedContact) return;

    const msg: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      senderName: currentUser?.name || 'Me',
      content: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      status: 'sent',
      attachments: pendingFiles,
    };

    setMessages(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), msg],
    }));
    setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, lastMessage: newMessage.trim() || 'Sent a file' } : c));
    setNewMessage('');
    setPendingFiles([]);

    // Simulate delivery → read receipts
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [selectedContact.id]: (prev[selectedContact.id] || []).map(m => m.id === msg.id ? { ...m, status: 'delivered' as const } : m),
      }));
    }, 1000);
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [selectedContact.id]: (prev[selectedContact.id] || []).map(m => m.id === msg.id ? { ...m, status: 'read' as const } : m),
      }));
    }, 2500);
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentThread = selectedContact ? (messages[selectedContact.id] || []) : [];

  if (!mounted) return null;

  return (
    <RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK', 'LAWYER', 'PLAINTIFF', 'DEFENDANT', 'USER']}>
    <div className="min-h-screen page-bg page-text font-sans flex flex-col">

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <Header />

      {/* ── Global Nav ────────────────────────────────────────────────────── */}
      <Navigation />

      {/* ── Main Layout: Sidebar + Chat ───────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 8.5rem)' }}>

        {/* Contacts Sidebar */}
        <aside className="w-80 xl:w-96 flex flex-col border-r border-emerald-500/10 card-bg shrink-0">
          {/* Sidebar Header */}
          <div className="p-5 border-b border-emerald-500/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black tracking-tight page-text">Secure Channels</h2>
              <button className="w-9 h-9 bg-emerald-500 hover:bg-emerald-400 rounded-xl flex items-center justify-center text-emerald-950 shadow-lg transition-all hover:scale-105">
                <Plus size={18} />
              </button>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search participants..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-sm font-medium placeholder:text-muted outline-none focus:border-emerald-500 transition-all page-text"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
            {filteredContacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-emerald-500/5 transition-all text-left ${selectedContact?.id === contact.id ? 'bg-emerald-500/10 border-r-2 border-emerald-400' : ''}`}
              >
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">{contact.avatar}</div>
                  <div className="absolute -bottom-0.5 -right-0.5">{statusDot(contact.status)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-sm truncate page-text">{contact.name}</span>
                    {contact.unreadCount > 0 && (
                      <span className="ml-2 shrink-0 min-w-[18px] h-4.5 bg-emerald-500 text-emerald-950 text-[10px] font-black rounded-full flex items-center justify-center px-1.5">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">{contact.role}</div>
                  <p className="text-xs text-muted truncate">{contact.lastMessage}</p>
                </div>
              </button>
            ))}
            {filteredContacts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <MessageSquare size={32} className="text-white/10 mb-3" />
                <p className="text-xs font-bold text-white/30">No participants found</p>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <p className="text-[10px] font-bold text-emerald-400/70 leading-relaxed">All messages are encrypted. Only authorized court participants may communicate.</p>
            </div>
          </div>
        </aside>

        {/* Chat Panel */}
        {selectedContact ? (
          <div className="flex-1 flex flex-col min-w-0">

            {/* Chat Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-emerald-500/10 card-bg shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">{selectedContact.avatar}</div>
                  <div className="absolute -bottom-0.5 -right-0.5">{statusDot(selectedContact.status)}</div>
                </div>
                <div>
                  <p className="font-black text-sm leading-none mb-0.5 page-text">{selectedContact.name}</p>
                  <p className="text-[10px] text-muted font-bold">{selectedContact.status === 'online' ? 'Active Now' : selectedContact.lastSeen} · {selectedContact.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl flex items-center justify-center transition-all" title="Voice call"><Phone size={16} className="text-secondary" /></button>
                <button className="w-9 h-9 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl flex items-center justify-center transition-all" title="Video call"><Video size={16} className="text-secondary" /></button>
                <button className="w-9 h-9 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl flex items-center justify-center transition-all"><MoreVertical size={16} className="text-secondary" /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-hide">
              {currentThread.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-4 text-3xl">{selectedContact.avatar}</div>
                  <p className="font-black text-secondary mb-1">{selectedContact.name}</p>
                  <p className="text-xs text-muted">Send the first secure message to this participant.</p>
                </div>
              )}

              <AnimatePresence>
                {currentThread.map((msg, idx) => {
                  const showDateBadge = idx === 0;
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${msg.isSelf ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        {!msg.isSelf && (
                          <span className="text-[10px] font-black text-emerald-400 pl-1">{msg.senderName}</span>
                        )}
                        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.isSelf ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-emerald-500/5 border border-emerald-500/20 page-text rounded-bl-sm'}`}>
                          {msg.content && <p>{msg.content}</p>}
                          {/* Attachments */}
                          {msg.attachments.length > 0 && (
                            <div className={`${msg.content ? 'mt-2' : ''} space-y-2`}>
                              {msg.attachments.map(att => (
                                <a key={att.id} href={att.url} download={att.name} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all group ${msg.isSelf ? 'bg-emerald-700 border-emerald-500/30 hover:bg-emerald-600' : 'bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10'}`}>
                                  <div className="w-8 h-8 bg-black/10 rounded-lg flex items-center justify-center shrink-0">
                                    {fileIcon(att.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{att.name}</p>
                                    <p className="text-[10px] opacity-60">{att.size}</p>
                                  </div>
                                  <Download size={14} className="opacity-50 group-hover:opacity-100 shrink-0" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={`flex items-center gap-1.5 px-1 ${msg.isSelf ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] text-muted">{msg.timestamp}</span>
                          {msg.isSelf && (
                            <span title={msg.status === 'read' ? 'Read' : msg.status === 'delivered' ? 'Delivered' : 'Sent'}>
                              {statusIcon(msg.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Pending files preview */}
            <AnimatePresence>
              {pendingFiles.length > 0 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 overflow-hidden">
                  <div className="flex gap-2 py-3 flex-wrap border-t border-white/5">
                    {pendingFiles.map(f => (
                      <div key={f.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                        {fileIcon(f.type)}
                        <span className="text-xs font-bold max-w-[120px] truncate">{f.name}</span>
                        <button onClick={() => setPendingFiles(prev => prev.filter(p => p.id !== f.id))} className="ml-1 text-white/30 hover:text-red-400 transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Input */}
            <div className="px-6 py-4 border-t border-emerald-500/10 card-bg shrink-0">
              <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-4 py-3 focus-within:border-emerald-500/50 transition-all">
                <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileSelect} />
                <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/20 border border-emerald-500/10 flex items-center justify-center transition-all shrink-0" title="Attach file">
                  <Paperclip size={16} className="text-muted hover:text-emerald-400" />
                </button>
                <input
                  type="text"
                  placeholder={`Secure message to ${selectedContact.name}...`}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-white/20"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-muted font-bold hidden sm:block">Enter ↵</span>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() && pendingFiles.length === 0}
                    className="w-9 h-9 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:hover:scale-100 shadow-lg shadow-emerald-500/20"
                  >
                    <Send size={16} className="text-emerald-950" />
                  </button>
                </div>
              </div>
              <p className="text-center text-[10px] text-muted/50 mt-2 font-medium">🔒 Messages are encrypted in transit and at rest · FDRE Judicial Communication Standard</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6">
              <MessageSquare size={36} className="text-emerald-400" />
            </div>
            <h3 className="text-xl font-black mb-2 page-text">Select a Channel</h3>
            <p className="text-sm text-muted max-w-xs">Choose a judicial participant from the left panel to begin a secure, encrypted conversation.</p>
          </div>
        )}
      </div>

    </div>
    </RequireAccess>
  );
}
