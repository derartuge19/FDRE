'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import { 
  MessageSquare, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Send, 
  Paperclip, 
  Image as ImageIcon,
  MoreVertical,
  ChevronLeft,
  Phone,
  Video,
  Info,
  Layers,
  FileText,
  Clock,
  ShieldCheck,
  Gavel,
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  roomId: string;
  isSelf?: boolean;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'away';
  avatar: string;
  lastMessage?: string;
  unreadCount?: number;
  lastSeen?: string;
}

export default function Communication() {
  const [currentUser, setCurrentUser] = useState('Loading...');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('courtUser');
    const token = localStorage.getItem('courtToken');
    
    if (userStr) {
      const userData = JSON.parse(userStr);
      setCurrentUser(userData.name || 'User');
    }

    const fetchContacts = async () => {
      try {
        const response = await fetch('http://localhost:5173/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setContacts(data.data.map((u: any) => ({
            id: u.id,
            name: u.name,
            role: u.roles?.[0] || 'Member',
            status: u.isActive ? 'online' : 'offline',
            avatar: u.roles?.[0] === 'judge' ? '👨‍⚖️' : '👤',
            lastMessage: 'Digital identity verified.',
            lastSeen: 'Active Now'
          })));
        }
      } catch (err) {
        console.error('Failed to sync contacts:', err);
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await fetch('http://localhost:5173/api/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setMessages(data.data.map((m: any) => ({
             id: m.id,
             senderId: m.senderId,
             senderName: m.senderId === 'me' ? 'Me' : 'Participant',
             content: m.content,
             timestamp: m.timestamp,
             roomId: m.receiverId,
             isSelf: m.senderId === (JSON.parse(userStr || '{}').id)
          })));
        }
      } catch (err) {
        console.error('Failed to sync messages:', err);
      }
    };

    if (token) {
      fetchContacts();
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); 
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedContact]);

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;
    const token = localStorage.getItem('courtToken');
    
    try {
      const response = await fetch('http://localhost:5173/api/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          receiverId: selectedContact.id,
          content: newMessage
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessages([...messages, {
          id: data.data.id,
          senderId: 'currentUser',
          senderName: 'Me',
          content: newMessage,
          timestamp: new Date().toISOString(),
          roomId: selectedContact.id,
          isSelf: true
        }]);
        setNewMessage('');
      }
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Transmission failure',
        message: 'The neural messaging uplink was interrupted by a network synchronization conflict. The broadcast was not cached.',
        type: 'error'
      });
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex flex-col h-screen overflow-hidden relative">
      {/* Header */}
      {/* Header */}
      <header className="header sticky top-0 z-[100] bg-emerald-950 border-b border-emerald-900 shadow-xl overflow-visible shrink-0">
        <div className="container mx-auto">
          <div className="header-container flex items-center justify-between h-20 px-6">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-lg ring-2 ring-emerald-400 group-hover:rotate-12 transition-all">⚖️</div>
              <div className="text-white">
                <div className="text-lg font-black tracking-tight leading-none mb-1">FDRE COURT SYSTEM</div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] opacity-80">Digital Administration</div>
              </div>
            </Link>
            
            <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl w-96 backdrop-blur-md">
              <Search size={18} className="text-white/40" />
              <input type="text" placeholder="Search operational database..." className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/20 font-medium" />
            </div>
            
            <div className="flex items-center gap-6">
              <Link href="/notifications" className="relative w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all">
                <Bell size={20} className="text-white" />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-emerald-950"></span>
              </Link>
              
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-emerald-950 font-black">{currentUser[0]}</div>
                  <span className="text-white font-bold text-sm hidden md:block">{currentUser}</span>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-full mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-emerald-50 overflow-hidden z-[200]">
                      <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 font-bold text-xs uppercase text-emerald-600">Administrative Profile</div>
                      <div className="p-2">
                        <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl text-emerald-950 hover:bg-emerald-50 transition-colors"><User size={18} /> <span className="text-sm font-bold">Dossier</span></Link>
                        <Link href="/settings" className="flex items-center gap-3 p-3 rounded-xl text-emerald-950 hover:bg-emerald-50 transition-colors"><Settings size={18} /> <span className="text-sm font-bold">Settings</span></Link>
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"><LogOut size={18} /> <span className="text-sm font-black uppercase tracking-widest text-left">Sign Out</span></button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-container bg-[#14532d] overflow-x-auto shadow-md shrink-0">
        <div className="container mx-auto flex items-center h-16 px-6 gap-2">
          {[
            { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/' },
            { label: 'Cases', icon: <Briefcase size={18} />, href: '/cases' },
            { label: 'Hearings', icon: <Gavel size={18} />, href: '/hearings' },
            { label: 'Documents', icon: <FileText size={18} />, href: '/documents' },
            { label: 'Virtual Hearing', icon: <Video size={18} />, href: '/virtual-hearing' },
            { label: 'Users', icon: <Users size={18} />, href: '/users' },
            { label: 'Reports', icon: <BarChart3 size={18} />, href: '/reports' },
            { label: 'Messages', icon: <MessageSquare size={18} />, href: '/communication', active: true },
            { label: 'Settings', icon: <Settings size={18} />, href: '/settings' },
          ].map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                item.active ? 'bg-emerald-400 text-emerald-950 shadow-lg' : 'text-emerald-50 hover:bg-emerald-800'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar Contacts */}
        <div className="w-80 md:w-96 bg-white border-r border-gray-100 flex flex-col shrink-0">
           <div className="p-6 border-b border-gray-50 bg-gray-50/50">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-black text-gray-900 tracking-tight">Active Channels</h2>
                 <button className="p-2 bg-emerald-950 text-emerald-400 rounded-xl hover:bg-emerald-900 transition-colors">
                    <MessageSquare size={16} />
                 </button>
              </div>
              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search secure channels..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-100 focus:border-emerald-500 outline-none rounded-xl text-xs font-bold text-gray-800 transition-all shadow-sm"
                 />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${
                    selectedContact?.id === contact.id ? 'bg-emerald-950 text-white shadow-xl shadow-emerald-950/20' : 'hover:bg-emerald-50 text-gray-600'
                  }`}
                >
                  <div className="relative shrink-0">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${selectedContact?.id === contact.id ? 'bg-emerald-900' : 'bg-gray-100 group-hover:bg-white'} transition-colors`}>
                        {contact.avatar}
                     </div>
                     <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                       contact.status === 'online' ? 'bg-emerald-400' : contact.status === 'away' ? 'bg-amber-400' : 'bg-gray-300'
                     }`}></span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                     <div className="flex justify-between items-center mb-0.5">
                        <span className={`font-black text-sm truncate ${selectedContact?.id === contact.id ? 'text-white' : 'text-gray-900'}`}>{contact.name}</span>
                        {contact.unreadCount && contact.unreadCount > 0 && <span className="px-1.5 py-0.5 bg-emerald-400 text-emerald-950 text-[8px] font-black rounded-md">{contact.unreadCount}</span>}
                     </div>
                     <p className={`text-[10px] truncate font-bold uppercase tracking-tight ${selectedContact?.id === contact.id ? 'text-emerald-200' : 'text-gray-400'}`}>
                        {contact.role}
                     </p>
                  </div>
                  {selectedContact?.id === contact.id && (
                    <motion.div layoutId="active-indicator" className="absolute left-0 w-1.5 h-8 bg-emerald-400 rounded-r-full shadow-[0_0_15px_rgba(52,211,153,0.5)]"></motion.div>
                  )}
                </button>
              ))}
           </div>
        </div>

        {/* Chat Canvas */}
        <div className="flex-1 flex flex-col bg-[#fdfcfb] relative overflow-hidden">
           {selectedContact ? (
             <>
               {/* Chat Header */}
               <div className="h-20 border-b border-gray-100 bg-white px-8 flex items-center justify-between shrink-0 shadow-sm relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shadow-inner text-xl">
                        {selectedContact.avatar}
                     </div>
                     <div>
                        <h3 className="font-black text-gray-900 tracking-tight leading-none mb-1">{selectedContact.name}</h3>
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${selectedContact.status === 'online' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedContact.lastSeen}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-emerald-950 hover:text-white transition-all shadow-sm border border-gray-100">
                        <Phone size={18} />
                     </button>
                     <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-emerald-950 hover:text-white transition-all shadow-sm border border-gray-100">
                        <Video size={18} />
                     </button>
                     <div className="w-px h-6 bg-gray-100 mx-2"></div>
                     <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-emerald-950 hover:text-white transition-all shadow-sm border border-gray-100">
                        <MoreVertical size={18} />
                     </button>
                  </div>
               </div>

               {/* Messages Stream */}
               <div className="flex-1 overflow-y-auto p-10 space-y-8">
                  <div className="flex justify-center mb-10">
                     <span className="px-6 py-2 bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-gray-200/50 shadow-inner flex items-center gap-2">
                        <ShieldCheck size={12} className="text-emerald-500" /> End-to-End Secure Channel Verified
                     </span>
                  </div>

                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'}`}
                    >
                       <div className={`max-w-[70%] group ${msg.isSelf ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                          <div className={`p-5 rounded-3xl shadow-xl text-sm font-medium leading-relaxed ${
                            msg.isSelf 
                            ? 'bg-emerald-950 text-emerald-50 rounded-tr-none shadow-emerald-950/20' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-gray-200/50'
                          }`}>
                             {msg.content}
                          </div>
                          <div className="flex items-center gap-2 px-2">
                             <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             {msg.isSelf && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>}
                          </div>
                       </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
               </div>

               {/* Chat Input Bar */}
               <div className="p-8 bg-white border-t border-gray-100 shrink-0 relative z-10 transition-all focus-within:shadow-2xl">
                  <div className="max-w-4xl mx-auto flex items-center gap-4">
                     <div className="flex gap-2">
                        <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                           <Paperclip size={20} />
                        </button>
                        <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                           <ImageIcon size={20} />
                        </button>
                     </div>
                     
                     <div className="flex-1 relative">
                        <input 
                          type="text" 
                          placeholder="Compose secure transmission..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          className="w-full py-5 px-8 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none rounded-3xl text-sm font-bold text-gray-800 transition-all shadow-inner"
                        />
                     </div>

                     <button 
                       onClick={sendMessage}
                       disabled={!newMessage.trim()}
                       className="w-14 h-14 bg-emerald-950 text-emerald-400 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-950/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
                     >
                        <Send size={24} />
                     </button>
                  </div>
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                <div className="relative mb-10">
                   <div className="w-40 h-40 bg-emerald-50 rounded-[3rem] rotate-12 flex items-center justify-center shadow-inner">
                      <MessageSquare size={64} className="text-emerald-600 opacity-20 -rotate-12" />
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-32 h-32 bg-white/20 backdrop-blur-md border border-white/50 rounded-[2.5rem] shadow-2xl flex items-center justify-center">
                        <ShieldCheck size={48} className="text-emerald-600" />
                     </div>
                   </div>
                </div>
                <h3 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">Secure Communications Unit</h3>
                <p className="max-w-md text-gray-500 font-medium text-lg mb-10 leading-relaxed">
                   Authorized personnel only. Select an encrypted channel from the portal sidebar to begin high-security judicial correspondence.
                </p>
                <div className="grid grid-cols-3 gap-6 w-full max-w-2xl px-10">
                   {[
                     { icon: <FileText className="text-blue-500" />, label: 'Shared Files' },
                     { icon: <Clock className="text-amber-500" />, label: 'Message History' },
                     { icon: <Layers className="text-purple-500" />, label: 'Group Channels' }
                   ].map(item => (
                     <div key={item.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-3">
                        {item.icon}
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{item.label}</span>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>

        {/* Info Sidebar (Optional/Right) */}
        {selectedContact && (
           <div className="w-80 bg-white border-l border-gray-100 hidden xl:flex flex-col shrink-0">
              <div className="p-8 border-b border-gray-50 flex flex-col items-center text-center">
                 <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-4xl shadow-xl mb-6 relative">
                    {selectedContact.avatar}
                    <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-emerald-100 text-emerald-600 text-[8px] font-black rounded-full border-2 border-white">VERIFIED</div>
                 </div>
                 <h4 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-2">{selectedContact.name}</h4>
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-3 py-1 bg-emerald-50 rounded-lg">{selectedContact.role}</p>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide">
                 <div>
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                       <Info size={12} className="text-emerald-500" /> Professional Details
                    </h5>
                    <div className="space-y-4">
                       <div className="flex flex-col gap-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Identification</span>
                          <span className="text-xs font-bold text-gray-800">{selectedContact.id}</span>
                       </div>
                       <div className="flex flex-col gap-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Office Protocol</span>
                          <span className="text-xs font-bold text-gray-800">Judiciary Registry 4B</span>
                       </div>
                    </div>
                 </div>

                 <div>
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Secured Assets</h5>
                    <div className="space-y-2">
                       {[
                         { name: 'Motion_Pre-Trial.pdf', size: '2.4MB' },
                         { name: 'Evidence_List.xlsx', size: '1.2MB' }
                       ].map(file => (
                         <div key={file.name} className="flex items-center gap-3 p-3 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer group border border-dashed border-gray-100 hover:border-emerald-200">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-emerald-500 transition-colors">
                               <FileText size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[10px] font-bold text-gray-800 truncate leading-none mb-1">{file.name}</p>
                               <span className="text-[8px] font-black text-gray-400 uppercase">{file.size}</span>
                            </div>
                         </div>
                       ))}
                       <button className="w-full py-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">View File Deck</button>
                    </div>
                 </div>
              </div>

              <div className="mt-auto p-8 border-t border-gray-50">
                 <button className="w-full py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all">
                    End Session
                 </button>
              </div>
           </div>
        )}
      </div>
      <Modal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
}
