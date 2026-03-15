'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Monitor, 
  Search,
  Plus,
  Filter,
  Users,
  Shield,
  Gavel,
  Circle,
  Hand,
  LogOut,
  MoreHorizontal,
  Share2,
  Camera,
  ChevronRight,
  Send,
  Lock,
  Settings,
  Bell,
  Clock,
  MessageSquare,
  LayoutDashboard,
  Briefcase,
  FileText,
  BarChart3,
  User
} from 'lucide-react';

export default function VirtualHearing() {
  const [currentUser, setCurrentUser] = useState('Loading...');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isInHearing, setIsInHearing] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [sessionId, setSessionId] = useState('H-2026-0421-SECURE');
  const [sessionKey, setSessionKey] = useState('password123');
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    const user = localStorage.getItem('courtUser');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUser(userData.name || 'User');
    } else {
      setCurrentUser('Guest');
    }

    // Check for meeting ID in URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setSessionId(id);
      setModalConfig({
        isOpen: true,
        title: 'Meeting Link Detected',
        message: `Secured meeting identifier ${id} has been automatically synchronized from your invite link.`,
        type: 'info'
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([
    { sender: 'JUDGE', content: 'Neural link established. Presiding over Case CIV-2026-001.', time: '14:30' },
    { sender: 'SYSTEM', content: 'Encryption: 4096-bit AES. All nodes verified.', time: '14:31' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const startSession = async () => {
    const token = localStorage.getItem('courtToken');
    try {
      // 1. Establish Backend Session
      const res = await fetch('http://localhost:5173/api/virtual-hearing/join', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ caseNumber: 'CIV-2026-001', hearingId: sessionId })
      });
      const data = await res.json();
      if (data.success) {
        setSessionInfo(data.data);
        // 2. Initialize Media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setIsInHearing(true);
        setTimeout(() => {
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        }, 100);
      }
    } catch (e) {
      setModalConfig({
        isOpen: true,
        title: 'Security Clearance Failure',
        message: 'The system could not verify your biometric or network access profile. Neural link establishment aborted.',
        type: 'error'
      });
    }
  };

  const handleJudgeControl = async (action: string) => {
    const token = localStorage.getItem('courtToken');
    try {
      await fetch(`http://localhost:5173/api/virtual-hearing/${sessionInfo.id}/control`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      setModalConfig({
        isOpen: true,
        title: 'Protocol Broadcast',
        message: `Judicial command '${action}' has been disseminated to all session nodes.`,
        type: 'info'
      });
    } catch (err) {
       setModalConfig({
        isOpen: true,
        title: 'Signal Disruption',
        message: 'The transmission of the judicial command was interrupted by a synchronization conflict.',
        type: 'warning'
      });
    }
  };

  const handleRecording = async () => {
    const token = localStorage.getItem('courtToken');
    const newStatus = isRecording ? 'STOP' : 'START';
    try {
      const res = await fetch(`http://localhost:5173/api/virtual-hearing/${sessionInfo.id}/recording`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if ((await res.json()).success) {
        setIsRecording(!isRecording);
      }
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Archival Error',
        message: 'The session recording module failed to initialize encryption. Evidence retention not active.',
        type: 'error'
      });
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    setMessages([...messages, { sender: 'YOU', content: inputMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInputMessage('');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex flex-col overflow-hidden">
      {!isInHearing && (
        <>
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
                  <button className="relative w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all">
                    <Bell size={20} className="text-white" />
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-emerald-950"></span>
                  </button>
                  
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
                { label: 'Virtual Hearing', icon: <Video size={18} />, href: '/virtual-hearing', active: true },
                { label: 'Users', icon: <Users size={18} />, href: '/users' },
                { label: 'Reports', icon: <BarChart3 size={18} />, href: '/reports' },
                { label: 'Messages', icon: <MessageSquare size={18} />, href: '/communication' },
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
        </>
      )}

      {isInHearing && (
        <header className="h-20 bg-emerald-950 border-b border-emerald-900 flex items-center justify-between px-8 shrink-0 relative z-[100]">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-lg ring-2 ring-emerald-400">⚖️</div>
            <div className="text-white">
              <div className="text-sm font-black tracking-tight leading-none mb-0.5">FDRE COURT SYSTEM</div>
              <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Live Session</div>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-3 px-4 py-2 border rounded-xl transition-all ${isRecording ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/10 border-white/10 text-white/40'}`}>
              <Circle size={14} className={isRecording ? 'fill-red-500 animate-pulse' : ''} />
              <span className="text-[10px] font-black uppercase tracking-widest">{isRecording ? 'LIVE SESSION RECORDING [00:42:15]' : 'RECORDING DEACTIVATED'}</span>
            </div>
            <button onClick={() => setIsInHearing(false)} className="px-6 py-2 bg-white/10 hover:bg-red-600 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-white font-bold">TERMINATE LINK</button>
          </div>
        </header>
      )}

      <main className={`flex-1 relative ${isInHearing ? 'bg-[#0a0f0d]' : 'bg-[#0f172a]'} transition-colors duration-700`}>
          {!isInHearing ? (
            <div className="h-full flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent">
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full">
                  <div className="text-center mb-12">
                     <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                        <Lock size={12} /> Secure Portal Entrance
                     </div>
                     <h1 className="text-6xl font-black tracking-tighter text-white mb-4">Remote Proceeding Unit</h1>
                     <p className="text-gray-400 text-lg font-medium leading-relaxed">Authorization required to establish neural encrypted video uplink with regional judicial district central servers.</p>
                  </div>

                  <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[3rem] p-12 shadow-2xl overflow-hidden relative group">
                     <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="relative z-10 space-y-8">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-2">Session Identifier</label>
                           <div className="relative">
                                <input 
                                  type="text" 
                                  value={sessionId}
                                  onChange={(e) => setSessionId(e.target.value)}
                                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-5 px-6 outline-none focus:border-emerald-500 transition-all font-bold text-emerald-50 pr-32"
                                />
                                <button 
                                  onClick={() => setSessionId(`H-${Math.random().toString(36).substr(2, 9).toUpperCase()}`)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-emerald-500 text-emerald-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-emerald-500 shadow-lg"
                                >
                                  Generate New
                                </button>
                             </div>
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-2">Cryptographic Key</label>
                             <input 
                               type="password" 
                               value={sessionKey}
                               onChange={(e) => setSessionKey(e.target.value)}
                               className="w-full bg-white/10 border border-white/20 rounded-2xl py-5 px-6 outline-none focus:border-emerald-500 transition-all font-bold tracking-widest text-white"
                             />
                          </div>
                        <div className="flex flex-col gap-4">
                          <button 
                            onClick={startSession}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                          >
                             Establish Secure Link <ChevronRight size={18} />
                          </button>
                          
                          <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                             <div className="shrink-0 w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                                <Share2 size={20} />
                             </div>
                             <div className="flex-1">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Testing Utility</p>
                                <button 
                                  onClick={() => {
                                    const link = `${window.location.origin}/virtual-hearing?id=${sessionId}`;
                                    navigator.clipboard.writeText(link);
                                    setModalConfig({
                                      isOpen: true,
                                      title: 'Invite Link Generated',
                                      message: 'A secure invite link has been encoded and copied to your clipboard. Disseminate only to verified participants.',
                                      type: 'success'
                                    });
                                  }}
                                  className="text-xs font-bold text-white hover:text-blue-300 transition-colors"
                                >
                                  Copy Test Meeting Link
                                </button>
                             </div>
                          </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-12 grid grid-cols-3 gap-6 opacity-30">
                     {['Camera Active', 'Encryption 4096-bit', 'Network Peer: High'].map(t => (
                       <div key={t} className="flex flex-col items-center gap-2">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                          <span className="text-[8px] font-black uppercase tracking-widest">{t}</span>
                       </div>
                     ))}
                  </div>
               </motion.div>
            </div>
          ) : (
            <div className="h-full flex flex-col xl:flex-row bg-black">
               {/* Video Grid */}
               <div className="flex-1 relative p-6 grid grid-cols-2 grid-rows-2 gap-4">
                  <div className="bg-white/5 rounded-3xl overflow-hidden relative group border border-white/5">
                     <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale-[0.2]" />
                     <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">You (Counsel)</span>
                     </div>
                  </div>
                  <div className="bg-white/5 rounded-3xl overflow-hidden relative border border-white/10 flex items-center justify-center flex-col gap-4">
                     <div className="w-24 h-24 bg-emerald-900/40 rounded-full flex items-center justify-center text-4xl shadow-2xl ring-4 ring-emerald-500/20">👨‍⚖️</div>
                     <h3 className="text-xl font-black tracking-tight text-white">Judge Alemu Bekele</h3>
                     <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/30">Presiding Officer</span>
                  </div>
                  <div className="bg-white/5 rounded-3xl border border-white/5 flex items-center justify-center grayscale opacity-40">
                     <Users size={64} className="text-white/20" />
                     <span className="absolute bottom-6 left-6 text-[10px] font-black uppercase tracking-widest text-white/40">Witness #A [PENDING]</span>
                  </div>
                  <div className="bg-emerald-950/20 rounded-3xl border border-emerald-500/20 flex flex-col items-center justify-center gap-6 p-8 text-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.1),transparent)]"></div>
                     <Shield size={64} className="text-emerald-500/40 mb-2" />
                     <h4 className="text-2xl font-black leading-tight text-white">Evidence Terminal<br/>V-Vault Active</h4>
                     <button className="px-8 py-3 bg-emerald-500 text-emerald-950 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all">Inject Exhibit</button>
                  </div>

                  {/* On-Video Overlay Controls */}
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 bg-black/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl z-[100]">
                     <button onClick={() => setIsAudioMuted(!isAudioMuted)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isAudioMuted ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                        {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
                     </button>
                     <button onClick={() => setIsVideoMuted(!isVideoMuted)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoMuted ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                        {isVideoMuted ? <VideoOff size={24} /> : <Video size={24} />}
                     </button>
                     <div className="w-px h-10 bg-white/10 mx-2"></div>
                     <button onClick={() => setIsScreenSharing(!isScreenSharing)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? 'bg-emerald-500 text-emerald-950' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                        <Monitor size={24} />
                     </button>
                     <button onClick={handleRecording} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                        <Circle size={24} className={isRecording ? 'fill-white' : ''} />
                     </button>
                     <button onClick={() => handleJudgeControl('MUTE_ALL')} className="w-14 h-14 rounded-full bg-amber-500 text-amber-950 flex items-center justify-center shadow-amber-500/20 hover:scale-110 transition-all" title="Judge: Mute All">
                        <MicOff size={24} />
                     </button>
                  </div>
               </div>

               {/* Interaction Sidebar */}
               <div className="w-full xl:w-96 bg-emerald-950/20 backdrop-blur-3xl border-l border-white/10 flex flex-col shrink-0">
                  <div className="p-8 border-b border-white/5">
                     <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-white tracking-tighter">Transcript Log</h2>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-black uppercase tracking-widest">AI Enabled</span>
                     </div>
                     <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 scrollbar-hide">
                         {messages.map((m, idx) => (
                          <div key={idx} className="space-y-2 border-l-2 border-emerald-500/50 pl-4 py-2 bg-white/5 rounded-r-xl transition-all hover:bg-white/10">
                             <div className="flex justify-between items-center text-[10px] font-black tracking-widest">
                                <span className={m.sender === 'YOU' ? 'text-emerald-400' : 'text-emerald-200'}>{m.sender}</span>
                                <span className="text-gray-500 font-bold">{m.time}</span>
                             </div>
                             <p className="text-sm font-medium text-white leading-relaxed">{m.content}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="p-8 mt-auto">
                     <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl mb-4 group focus-within:border-emerald-500/50 transition-all">
                        <input 
                          type="text" 
                          placeholder="Type instructions or chat..." 
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                          className="flex-1 bg-transparent outline-none text-xs font-bold text-white placeholder-gray-500" 
                        />
                        <button onClick={sendMessage} className="p-2 text-emerald-500"><Send size={18} /></button>
                     </div>
                     <div className="flex items-center gap-4 text-gray-500 font-bold text-[10px] uppercase tracking-widest px-2">
                        <span className="flex items-center gap-2"><Lock size={12} /> Encrypted</span>
                        <span>•</span>
                        <span>08 People Active</span>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </main>
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
