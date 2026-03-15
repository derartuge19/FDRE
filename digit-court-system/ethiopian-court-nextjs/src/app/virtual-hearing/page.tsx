'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
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
  X,
  Maximize2,
  Paperclip,
  Volume2,
  Terminal,
  Activity,
  Pipette,
  CheckCircle2,
  AlertCircle,
  DoorOpen,
  Play,
  Save,
  Download,
  Trash2
} from 'lucide-react';

// --- TYPES ---
interface Participant {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'waiting';
  isMuted: boolean;
  isVideoOff: boolean;
  isRaisingHand: boolean;
  avatar: string;
  color: string;
}

type TabType = 'chat' | 'nodes' | 'transcripts' | 'recordings';

export default function VirtualHearing() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInHearing, setIsInHearing] = useState(false);
  const [isBreakoutActive, setIsBreakoutActive] = useState(false);
  
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>({
    isOpen: false, title: '', message: '', type: 'info'
  });

  const [isSavePromptOpen, setIsSavePromptOpen] = useState(false);
  const [tempRecordingBlob, setTempRecordingBlob] = useState<Blob | null>(null);

  const [sessionId] = useState('COURT-SESSION-2026-X8');
  
  const lobbyVideoRef = useRef<HTMLVideoElement>(null);
  const chamberVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [savedRecordings, setSavedRecordings] = useState<any[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  const [participants] = useState<Participant[]>([
    { id: 'judge-1', name: 'Judge Alemu Bekele', role: 'Presiding Judge', status: 'online', isMuted: false, isVideoOff: false, isRaisingHand: false, avatar: '⚖️', color: 'bg-emerald-600' },
    { id: 'lawyer-1', name: 'Lawyer Sara Ahmed', role: 'Plaintiff Counsel', status: 'online', isMuted: true, isVideoOff: false, isRaisingHand: false, avatar: '💼', color: 'bg-blue-600' },
    { id: 'lawyer-2', name: 'Lawyer Robert Johnson', role: 'Defense Counsel', status: 'online', isMuted: false, isVideoOff: false, isRaisingHand: false, avatar: '💼', color: 'bg-purple-600' },
  ]);

  const [messages, setMessages] = useState<any[]>([
    { id: 1, sender: 'SYSTEM', content: 'Judicial Security Protocol [RSA-4096] Established.', type: 'system', timestamp: '14:30' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const currentUserRef = useRef<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('courtUser');
    if (user) {
      const parsed = JSON.parse(user);
      setCurrentUser(parsed);
      currentUserRef.current = parsed;
    }
  }, []);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Robust function to sync video element with current stream
  const syncMedia = useCallback(() => {
    const targetStream = isScreenSharing ? screenStreamRef.current : mediaStreamRef.current;
    
    if (isInHearing) {
      if (chamberVideoRef.current && chamberVideoRef.current.srcObject !== targetStream) {
        chamberVideoRef.current.srcObject = targetStream || null;
      }
    } else {
      if (lobbyVideoRef.current && lobbyVideoRef.current.srcObject !== mediaStreamRef.current) {
        lobbyVideoRef.current.srcObject = mediaStreamRef.current || null;
      }
    }
  }, [isScreenSharing, isInHearing]);
 
  const [db, setDb] = useState<IDBDatabase | null>(null);

  // IndexedDB and Component Initialization
  useEffect(() => {
    setMounted(true);
    
    // Core Judiciary Database Link
    const request = indexedDB.open('CourtRecordsDB', 2);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('recordings')) db.createObjectStore('recordings', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('cases')) db.createObjectStore('cases', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('documents')) db.createObjectStore('documents', { keyPath: 'id' });
    };
    request.onsuccess = (e: any) => {
      setDb(e.target.result);
      loadSavedRecordings(e.target.result);
    };

    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Live Scribe Initialization
    if (typeof window !== 'undefined' && ('WebkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => (result as any).transcript)
          .join('');
        
        if (event.results[event.results.length - 1].isFinal) {
          setTranscripts(prev => [...prev.slice(-10), {
            id: Date.now(),
            speaker: currentUserRef.current?.name || 'You',
            text: transcript,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }]);
        }
      };
    }

    return () => {
      clearInterval(interval);
      stopMedia();
    };
  }, []); // Dependencies cleared to prevent recursion

  // Proactive lobby initialization
  useEffect(() => {
    if (mounted && !isInHearing && !mediaStreamRef.current) {
      const initPreview = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          mediaStreamRef.current = stream;
          syncMedia();
        } catch (e) {
          console.log("Hardware access deferred");
        }
      };
      initPreview();
    }
  }, [mounted, isInHearing, syncMedia]);

  // Persistent monitor for video state
  useEffect(() => {
    syncMedia();
  }, [isInHearing, isBreakoutActive, isScreenSharing, syncMedia]);

  const startMedia = async () => {
    if (mediaStreamRef.current) {
      setIsInHearing(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      mediaStreamRef.current = stream;
      setIsInHearing(true);
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); setIsTranscribing(true); } catch (e) {}
      }
    } catch (e: any) {
      let msg = 'Could not access camera/microphone.';
      if (e.name === 'NotAllowedError') msg = 'Permission Denied: Please allow camera access in your browser settings.';
      setModalConfig({ isOpen: true, title: 'Hardware Access Denied', message: msg, type: 'error' });
    }
  };

  const stopMedia = () => {
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(track => track.stop());
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} setIsTranscribing(false); }
    mediaStreamRef.current = null;
    screenStreamRef.current = null;
    setIsInHearing(false);
    setIsRecording(false);
  };

  const toggleAudio = async () => {
    if (!mediaStreamRef.current) return;
    const audioTracks = mediaStreamRef.current.getAudioTracks();

    if (!isAudioMuted) {
      // Mute: stop the physical microphone hardware track
      audioTracks.forEach(track => track.stop());
      setIsAudioMuted(true);
    } else {
      // Unmute: re-request microphone access from the OS
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const newAudioTrack = newStream.getAudioTracks()[0];
        // Remove old stopped audio tracks from the stream
        audioTracks.forEach(t => mediaStreamRef.current!.removeTrack(t));
        // Add the fresh live track
        mediaStreamRef.current!.addTrack(newAudioTrack);
        setIsAudioMuted(false);
      } catch (e) {
        setModalConfig({ isOpen: true, title: 'Microphone Access Denied', message: 'Unable to re-enable microphone. Please check browser permissions.', type: 'error' });
      }
    }
  };

  const toggleVideo = async () => {
    if (!mediaStreamRef.current) return;
    const videoTracks = mediaStreamRef.current.getVideoTracks();

    if (!isVideoMuted) {
      // Turn off: stop the physical camera hardware track (camera LED turns off)
      videoTracks.forEach(track => track.stop());
      setIsVideoMuted(true);
      // Clear the video element so the black frame shows
      const videoEl = isInHearing ? chamberVideoRef.current : lobbyVideoRef.current;
      if (videoEl) {
        const audioTracks = mediaStreamRef.current!.getAudioTracks();
        const audioOnlyStream = new MediaStream(audioTracks);
        videoEl.srcObject = audioOnlyStream;
      }
    } else {
      // Turn on: re-request camera access from the OS (camera LED lights up)
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
        const newVideoTrack = newStream.getVideoTracks()[0];
        // Remove old stopped video tracks
        videoTracks.forEach(t => mediaStreamRef.current!.removeTrack(t));
        // Splice new live track back in
        mediaStreamRef.current!.addTrack(newVideoTrack);
        setIsVideoMuted(false);
        // Re-attach the full stream to the video element
        const videoEl = isInHearing ? chamberVideoRef.current : lobbyVideoRef.current;
        if (videoEl) videoEl.srcObject = mediaStreamRef.current;
      } catch (e) {
        setModalConfig({ isOpen: true, title: 'Camera Access Denied', message: 'Unable to re-enable camera. Please check browser permissions.', type: 'error' });
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = stopScreenShare;
      } catch (e) {}
    } else stopScreenShare();
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    const options = { mimeType: 'video/webm; codecs=vp9' };
    const recorder = new MediaRecorder(mediaStreamRef.current, options);
    recorder.ondataavailable = (event) => event.data.size > 0 && recordedChunksRef.current.push(event.data);
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      setTempRecordingBlob(blob);
      setIsSavePromptOpen(true);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const loadSavedRecordings = (database: IDBDatabase) => {
    if (!database.objectStoreNames.contains('recordings')) {
      console.warn("Recordings store not found yet");
      return;
    }
    try {
      const transaction = database.transaction(['recordings'], 'readonly');
      const store = transaction.objectStore('recordings');
      const request = store.getAll();
      request.onsuccess = () => {
        const records = request.result.map(rec => ({
          ...rec,
          url: URL.createObjectURL(rec.blob)
        }));
        setSavedRecordings(records.sort((a, b) => b.id - a.id));
      };
    } catch (e) {
      console.error("Failed to start transaction:", e);
    }
  };

  const processSaveRecording = (shouldSave: boolean) => {
    if (shouldSave && tempRecordingBlob && db) {
      const recordingData = {
        id: Date.now(),
        name: `Hearing_Archive_${new Date().toLocaleDateString()}.webm`,
        blob: tempRecordingBlob,
        timestamp: new Date().toLocaleTimeString()
      };

      const transaction = db.transaction(['recordings'], 'readwrite');
      const store = transaction.objectStore('recordings');
      store.add(recordingData);
      
      transaction.oncomplete = () => {
        loadSavedRecordings(db);
        setActiveTab('recordings');
      };
    }
    setTempRecordingBlob(null);
    setIsSavePromptOpen(false);
  };

  const toggleBreakout = () => {
    setIsBreakoutActive(!isBreakoutActive);
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'SYSTEM',
      content: !isBreakoutActive ? 'ENTERING PRIVATE BREAKOUT ROOM.' : 'RETURNING TO MAIN HEARING.',
      type: 'system',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'chat' | 'evidence') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileData = {
      id: Date.now(),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
      url: URL.createObjectURL(file),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (target === 'chat') {
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: currentUser?.name || 'You',
        content: `Uploaded File: ${file.name}`,
        file: fileData,
        timestamp: fileData.timestamp
      }]);
    } else {
      setEvidenceFiles(prev => [fileData, ...prev]);
      setIsEvidenceOpen(true);
    }
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: currentUser?.name || 'You',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatInput('');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans text-slate-900">
      <AnimatePresence mode="wait">
        {!isInHearing ? (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 flex flex-col min-h-screen">
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm shrink-0 sticky top-0 z-[100]">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Gavel size={24} /></div>
                  <div>
                    <h1 className="text-lg font-black text-slate-800 uppercase tracking-tighter">FDRE Court System</h1>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Virtual Hearing Portal</p>
                  </div>
               </div>
                <div className="flex items-center gap-6">
                   <ThemeToggle />
                   <Link href="/archives" className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs hover:bg-emerald-100 transition-all border border-emerald-100"><FileText size={16} /> Memory Vault</Link>
                   <button onClick={() => window.location.href = '/'} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs">Exit</button>
                </div>
            </header>
            
            {/* Global Context Navigation */}
            <nav className="nav-container sticky top-20 z-[90] bg-[#14532d] overflow-x-auto shadow-md shrink-0">
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
                  { label: 'Archives', icon: <Save size={18} />, href: '/archives' },
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

            <div className="flex-1 container mx-auto flex items-center justify-center p-10">
               <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-7 flex flex-col gap-8">
                     <div className="aspect-video bg-slate-200 rounded-[3rem] border border-slate-300 relative overflow-hidden shadow-inner group">
                        <video ref={lobbyVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
                        {!mediaStreamRef.current && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100">
                             <Camera size={48} className="text-slate-300 mb-4" />
                             <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Neural Link Standby</p>
                          </div>
                        )}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                           <button onClick={toggleAudio} className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${isAudioMuted ? 'bg-red-500 text-white' : 'bg-white text-slate-600'}`}>
                             {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
                           </button>
                           <button onClick={toggleVideo} className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${isVideoMuted ? 'bg-red-500 text-white' : 'bg-white text-slate-600'}`}>
                             {isVideoMuted ? <VideoOff size={24} /> : <Video size={24} />}
                           </button>
                        </div>
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                        {[{ icon: <Shield />, label: 'Channel', val: 'SECURE' }, { icon: <Activity />, label: 'Node', val: 'ACTIVE' }, { icon: <Terminal />, label: 'Auth', val: 'PASS' }].map(item => (
                          <div key={item.label} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col items-center gap-2 shadow-sm">
                             <div className="text-emerald-500">{item.icon}</div>
                             <p className="text-[10px] font-black uppercase text-slate-400">{item.label}</p>
                             <p className="text-xs font-black text-slate-800">{item.val}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-[3rem] p-12 shadow-2xl">
                     <div className="mb-10 text-center">
                        <h2 className="text-3xl font-black text-slate-800 mb-2">Enter Chamber</h2>
                        <p className="text-slate-500 text-sm italic">Session: {sessionId}</p>
                     </div>
                     <button onClick={startMedia} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-2xl font-black text-sm uppercase shadow-xl transform active:scale-95 transition-all">Establish Link</button>
                  </div>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="hearing" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-[200]">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-600/20"><Gavel size={16} /></div>
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-tighter">Judiciary Session: CIV-2026-X8 {isBreakoutActive && '(PRIVATE)'}</h2>
               </div>
               <div className="flex items-center gap-4">
                  {isRecording && <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full animate-pulse transition-all"><div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div><span className="text-[10px] font-black uppercase">Recording</span></div>}
                  <button onClick={toggleBreakout} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${isBreakoutActive ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <DoorOpen size={14} /> {isBreakoutActive ? 'Leave Room' : 'Join Breakout'}
                  </button>
               </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
               <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden relative">
                  {isBreakoutActive && (
                    <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center">
                       <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center gap-6 text-center max-w-md border border-white/20">
                          <Lock className="text-amber-500" size={56} />
                          <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Private Session</h3><p className="text-slate-500 text-sm leading-relaxed">Requirement 3.4: Cryptographic isolation active. Only participants in this room can see or hear you.</p></div>
                          <button onClick={toggleBreakout} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-emerald-500/30">Resume Main Hearing</button>
                       </div>
                    </div>
                  )}

                  <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 grid-rows-2 gap-4">
                     <div className="lg:col-span-2 lg:row-span-2 bg-slate-200 rounded-[2.5rem] border border-slate-300 relative overflow-hidden shadow-md">
                        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center"><div className="w-40 h-40 bg-white rounded-full flex items-center justify-center text-6xl shadow-2xl tracking-tighter">👨‍⚖️</div></div>
                        <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-[10px] font-black text-slate-700 uppercase">Judge Alemu Bekele</span></div>
                     </div>
                     <div className="bg-slate-800 rounded-[2.5rem] border-4 border-emerald-500/20 relative overflow-hidden shadow-2xl overflow-hidden">
                        <video ref={chamberVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-700 ${isVideoMuted ? 'opacity-0' : 'opacity-100'} -scale-x-100`} />
                        {isVideoMuted && <div className="absolute inset-0 flex items-center justify-center text-white/5 text-[120px] font-black opacity-20">{currentUser?.name?.[0]}</div>}
                        <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/40 backdrop-blur-md text-white rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border border-white/10">LOCAL LINK</div>
                        {isAudioMuted && <div className="absolute top-6 right-6 p-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/30"><MicOff size={14} /></div>}
                     </div>
                     <div className="bg-white rounded-[2.5rem] border border-slate-200 flex flex-col items-center justify-center gap-4 shadow-sm relative group overflow-hidden">
                        <div className="w-20 h-20 bg-blue-100/50 rounded-full flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-all">💼</div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-widest px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">Defense Counsel</p>
                        <div className="absolute bottom-4 right-4"><Activity size={12} className="text-emerald-500" /></div>
                     </div>
                  </div>

                  <AnimatePresence>
                    {isEvidenceOpen && (
                      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="h-2/5 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden flex flex-col z-[100]">
                         <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4 text-emerald-600"><Pipette size={28} className="transform rotate-12" /><h3 className="text-xl font-black text-slate-800 uppercase trackers-tighter">Evidence Vault (4.2)</h3></div>
                            <button onClick={() => setIsEvidenceOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20}/></button>
                         </div>
                         <div className="grid grid-cols-4 gap-6 flex-1 overflow-y-auto pr-4 scrollbar-hide">
                            <div 
                              onClick={() => evidenceInputRef.current?.click()}
                              className="border-2 border-dashed border-emerald-500/30 rounded-[2rem] flex flex-col items-center justify-center gap-3 py-10 hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer group bg-emerald-50/20"
                            >
                               <Plus size={40} className="text-emerald-500" />
                               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Inject Evidence</p>
                            </div>
                            {evidenceFiles.map(file => (
                              <div key={file.id} className="border border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 py-10 hover:border-emerald-500 transition-all cursor-pointer group relative bg-white shadow-sm">
                                 <FileText size={40} className="text-slate-300 group-hover:text-emerald-500" />
                                 <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest px-4 text-center truncate w-full">{file.name}</p>
                                 <p className="text-[8px] text-slate-400 font-bold uppercase">{file.size}</p>
                                 <a href={file.url} download={file.name} className="absolute inset-0 opacity-0" />
                                 <div className="absolute top-4 right-4 text-emerald-500"><CheckCircle2 size={12} /></div>
                              </div>
                            ))}
                            {evidenceFiles.length === 0 && Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center gap-3 py-10 opacity-40">
                                 <FileText size={40} className="text-slate-100" />
                                 <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest text-center">Empty Slot</p>
                              </div>
                            ))}
                         </div>
                         <input type="file" ref={evidenceInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'evidence')} />
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               <aside className="w-[420px] border-l border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden">
                  <div className="p-8 border-b border-slate-200">
                     <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] shadow-inner">
                        {[{ id: 'chat', label: 'Chat' }, { id: 'nodes', label: 'Nodes' }, { id: 'transcripts', label: 'Live' }, { id: 'recordings', label: 'Archives' }].map(tab => (
                          <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase transition-all tracking-wider ${activeTab === tab.id ? 'bg-white text-emerald-600 shadow-md border border-slate-100' : 'text-slate-400 hover:bg-slate-50'}`}>{tab.label}</button>
                        ))}
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                     {activeTab === 'chat' && messages.map(msg => (
                        <div key={msg.id} className={`flex flex-col gap-1.5 ${msg.sender === (currentUser?.name || 'You') ? 'items-end' : 'items-start'}`}>
                           <span className="text-[9px] font-black text-slate-400 uppercase px-3">{msg.sender}</span>
                           <div className={`p-5 rounded-[2rem] text-sm font-semibold max-w-[90%] shadow-sm ${msg.sender === (currentUser?.name || 'You') ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'}`}>
                             {msg.content}
                             {msg.file && (
                               <a href={msg.file.url} download={msg.file.name} className="mt-3 flex items-center gap-3 p-3 bg-black/10 rounded-2xl border border-white/10 hover:bg-black/20 transition-all">
                                 <FileText size={18} />
                                 <div className="flex-1 overflow-hidden">
                                   <p className="text-[10px] font-black truncate">{msg.file.name}</p>
                                   <p className="text-[8px] font-bold opacity-60 uppercase">{msg.file.size}</p>
                                 </div>
                                 <Download size={14} />
                               </a>
                             )}
                           </div>
                        </div>
                     ))}
                     {activeTab === 'nodes' && (
                        <div className="space-y-4">
                           <h3 className="text-[10px] font-black text-slate-800 uppercase trackers-widest opacity-40 mb-2">Participant Network</h3>
                           {participants.map(p => (
                             <div key={p.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className={`w-10 h-10 ${p.color} rounded-xl flex items-center justify-center text-lg text-white`}>{p.avatar}</div>
                                   <div>
                                      <p className="text-xs font-black text-slate-800">{p.name}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase">{p.role}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2">
                                   <div className={`w-2 h-2 rounded-full ${p.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                   <span className="text-[9px] font-black text-slate-400 uppercase">{p.status}</span>
                                </div>
                             </div>
                           ))}
                           <div className="mt-8 p-6 bg-emerald-600 rounded-[2rem] text-white">
                              <p className="text-[10px] font-black uppercase mb-4 opacity-70">Sovereign Encryption</p>
                              <div className="flex items-baseline gap-2 mb-2">
                                 <h4 className="text-3xl font-black">4096</h4>
                                 <span className="text-[10px] font-bold opacity-60 uppercase">Bit RSA</span>
                              </div>
                              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                 <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 10, repeat: Infinity }} className="h-full bg-white" />
                              </div>
                           </div>
                        </div>
                     )}
                     {activeTab === 'recordings' && (
                        <div className="space-y-4">
                           {savedRecordings.length === 0 ? <div className="py-24 text-center opacity-30 flex flex-col gap-6"><Download size={48} className="mx-auto" /><p className="text-[10px] font-black uppercase tracking-[0.3em]">Judiciary Logs Empty</p></div> : savedRecordings.map(rec => (
                             <div key={rec.id} className="p-5 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between hover:bg-emerald-50 hover:border-emerald-100 transition-all group"><div><p className="text-xs font-black text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors uppercase">{rec.name}</p><p className="text-[9px] text-slate-400 font-black mt-1 uppercase opacity-60 tracking-widest">{rec.timestamp}</p></div><a href={rec.url} download={rec.name} className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all"><Download size={16} /></a></div>
                           ))}
                        </div>
                     )}
                     {activeTab === 'transcripts' && (
                        <div className="space-y-4">
                           {transcripts.length === 0 ? <div className="py-24 text-center opacity-20"><Activity size={48} className="mx-auto opacity-30 animate-pulse" /><p className="text-xs font-black uppercase mt-4">Awaiting Signal...</p></div> : transcripts.map(t => (
                              <div key={t.id} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
                                 <p className="text-[10px] font-black text-slate-800 mb-2 flex justify-between uppercase"><span>{t.speaker}</span><span className="text-emerald-600 opacity-60">[{t.timestamp}]</span></p>
                                 <p className="text-xs italic leading-relaxed text-slate-600 font-medium">"{t.text}"</p>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                  <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                     <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 focus-within:border-emerald-500 rounded-[2rem] transition-all shadow-sm">
                        <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-emerald-500 transition-colors"><Paperclip size={20}/></button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'chat')} />
                        <input type="text" placeholder="Transmit data..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 bg-transparent outline-none text-xs font-bold text-slate-700" />
                        <button onClick={sendMessage} className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/40 active:scale-90 transition-all"><Send size={16}/></button>
                     </div>
                  </div>
               </aside>
            </div>

            <footer className="h-32 bg-white border-t border-slate-100 flex items-center justify-center gap-6 px-12 shrink-0 z-[200]">
               <div className="flex items-center gap-5 bg-slate-100/30 backdrop-blur-3xl p-4 border border-slate-200/50 rounded-[3rem] shadow-2xl">
                  <button onClick={toggleAudio} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl hover:-translate-y-1 active:scale-90 ${isAudioMuted ? 'bg-red-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>{isAudioMuted ? <MicOff size={28} /> : <Mic size={28} />}</button>
                  <button onClick={toggleVideo} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl hover:-translate-y-1 active:scale-90 ${isVideoMuted ? 'bg-red-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>{isVideoMuted ? <VideoOff size={28} /> : <Video size={28} />}</button>
                  <div className="w-px h-12 bg-slate-300/50 mx-2"></div>
                  <button onClick={toggleScreenShare} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl hover:-translate-y-1 active:scale-90 ${isScreenSharing ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}><Monitor size={28} /></button>
                  <button onClick={() => setIsEvidenceOpen(!isEvidenceOpen)} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl hover:-translate-y-1 active:scale-90 ${isEvidenceOpen ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}><Pipette size={28} /></button>
                  <button onClick={isRecording ? stopRecording : startRecording} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl hover:-translate-y-1 active:scale-90 ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-red-600'}`}>{isRecording ? <div className="w-6 h-6 bg-white rounded-sm" /> : <div className="w-6 h-6 bg-current rounded-full" />}</button>
                  <div className="w-px h-12 bg-slate-300/50 mx-2"></div>
                  <button onClick={stopMedia} className="w-24 h-16 bg-red-600 hover:bg-red-500 text-white rounded-[1.5rem] flex items-center justify-center active:scale-95 transition-all shadow-2xl shadow-red-500/30" title="Exit Court Chamber"><LogOut size={28} /></button>
               </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SAVE RECORDING PROMPT (3.3) --- */}
      <AnimatePresence>
        {isSavePromptOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => processSaveRecording(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[3rem] p-12 max-w-lg w-full shadow-2xl relative z-10 border border-white/20">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-8 mx-auto"><Save size={40} /></div>
              <div className="text-center mb-10">
                <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tighter uppercase">Save Hearing Log?</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">Requirement 3.3: Would you like to archive this recording to the permanent hearing record? You can download it later from the Archives tab.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => processSaveRecording(false)} className="py-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase transition-all flex items-center justify-center gap-2 group">
                  <Trash2 size={16} className="group-hover:text-red-500 transition-colors" /> Discard
                </button>
                <button onClick={() => processSaveRecording(true)} className="py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> Save to Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Modal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} title={modalConfig.title} message={modalConfig.message} type={modalConfig.type} />
    </div>
  );
}
