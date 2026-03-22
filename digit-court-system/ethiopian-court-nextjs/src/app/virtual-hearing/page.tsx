'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import { useUserRole } from '@/hooks/useUserRole';
import RequireAccess from '@/components/RequireAccess';
import {  
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Monitor, 
  FileText,
  Maximize2, 
  Minimize2, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Square, 
  Circle, 
  Pause, 
  Play, 
  Users, 
  User, 
  Shield, 
  Gavel, 
  Hand, 
  LogOut, 
  MoreHorizontal, 
  Share2, 
  Camera, 
  Send, 
  Lock, 
  Settings, 
  Bell, 
  Clock, 
  MessageSquare, 
  X, 
  Paperclip, 
  Volume2, 
  Activity, 
  Pipette, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Save, 
  Trash2,
  ArrowLeft
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
  const [activeBreakoutRoom, setActiveBreakoutRoom] = useState<string | null>(null);
  
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [presentationMode, setPresentationMode] = useState<'main' | 'split'>('main');
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab ] = useState<TabType>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBreakoutModalOpen, setIsBreakoutModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean, 
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' | 'security' | 'judicial',
    confirmLabel?: string,
    cancelLabel?: string
  }>({
    isOpen: false, title: '', message: '', type: 'info'
  });

  const [isSavePromptOpen, setIsSavePromptOpen] = useState(false);
  const [tempRecordingBlob, setTempRecordingBlob] = useState<Blob | null>(null);
  const [sessionId] = useState(`CHAMBER-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  const lobbyVideoRef = useRef<HTMLVideoElement>(null);
  const chamberVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [savedRecordings, setSavedRecordings] = useState<any[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>([]);
  const [activeEvidence, setActiveEvidence] = useState<any>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'judge-1', name: 'Judge Alemu Bekele', role: 'Presiding Judge', status: 'online', isMuted: false, isVideoOff: false, isRaisingHand: false, avatar: '⚖️', color: 'bg-emerald-600' },
    { id: 'lawyer-1', name: 'Lawyer Sara Ahmed', role: 'Plaintiff Attorney', status: 'online', isMuted: true, isVideoOff: false, isRaisingHand: false, avatar: '💼', color: 'bg-blue-600' },
    { id: 'lawyer-2', name: 'Lawyer Robert Johnson', role: 'Defense Counsel', status: 'online', isMuted: false, isVideoOff: false, isRaisingHand: false, avatar: '💼', color: 'bg-indigo-600' },
    { id: 'clerk-1', name: 'Clerk Mohammed', role: 'Court Clerk', status: 'waiting', isMuted: true, isVideoOff: true, isRaisingHand: false, avatar: '📋', color: 'bg-slate-600' },
    { id: 'plaintiff-1', name: 'John Doe', role: 'Plaintiff', status: 'online', isMuted: true, isVideoOff: false, isRaisingHand: false, avatar: '👤', color: 'bg-teal-600' },
  ]);

  const [breakoutRooms, setBreakoutRooms] = useState<any[]>([
    { id: 'room-1', name: 'Privileged Council A', participants: ['lawyer-1', 'plaintiff-1'] },
    { id: 'room-2', name: 'Private Deliberation', participants: ['judge-1'] }
  ]);

  const [messages, setMessages] = useState<any[]>([
    { id: 1, sender: 'SYSTEM', content: 'Judicial Security Protocol [RSA-4096] Established. Uplink Synchronized.', type: 'system', timestamp: '11:40' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [db, setDb] = useState<IDBDatabase | null>(null);

  const userRole = useUserRole();
  const isJudge = userRole === 'JUDGE' || userRole === 'SYSTEM_ADMIN';
  const isCourtStaff = isJudge || userRole === 'CLERK' || userRole === 'COURT_ADMIN';

  // --- INITIALIZATION ---
  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('courtUser');
    if (userStr && !currentUser) {
       try { setCurrentUser(JSON.parse(userStr)); } catch(e) {}
    }

    const request = indexedDB.open('CourtRecordsDB', 2);
    request.onsuccess = (e: any) => {
      setDb(e.target.result);
      loadSavedRecordings(e.target.result);
    };

    // Live Scribe Senses
    if (typeof window !== 'undefined' && ('WebkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => (result as any).transcript).join('');
        if (event.results[event.results.length - 1].isFinal) {
          setTranscripts(prev => [...prev, {
            id: Date.now(), speaker: 'Participant', text: transcript, timestamp: new Date().toLocaleTimeString()
          }]);
        }
      };
    }

    return () => {
    };
  }, []);

  // Timer & Recording Management
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (isRecording && !isRecordingPaused) {
        setRecordingDuration(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, isRecordingPaused]);

  useEffect(() => {
    let active = true;

    const initAudio = async () => {
      if (mounted && !isInHearing && localStream && isPreviewReady) {
        if (!audioContextRef.current) {
          const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
          const ctx = new AudioContextClass();
          
          if (ctx.state === 'suspended') {
            await ctx.resume().catch(e => console.log('AudioContext wait:', e));
          }
          
          if (!active) {
            ctx.close();
            return;
          }
          
          const analyser = ctx.createAnalyser();
          const src = ctx.createMediaStreamSource(localStream);
          src.connect(analyser); 
          analyser.fftSize = 256;
          
          audioContextRef.current = ctx;
          analyserRef.current = analyser;
        }

        const analyser = analyserRef.current;
        if (analyser) {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          const updateLevel = () => {
            if (!active || !analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((p, c) => p + c, 0) / (bufferLength || 1);
            setAudioLevel(average * 3);
            requestAnimationFrame(updateLevel);
          };
          
          updateLevel();
        }
      }
    };

    initAudio();
    
    return () => {
      active = false;
    };
  }, [mounted, isInHearing, localStream, isPreviewReady]);

  const isAcquiringMediaRef = useRef(false);

  // --- LOBBY MEDIA PREVIEW ---
  useEffect(() => {
    let active = true;
    
    const acquireMedia = async () => {
      if (mounted && !isInHearing && !localStream && !isAcquiringMediaRef.current) {
        isAcquiringMediaRef.current = true;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          
          if (!active) {
            stream.getTracks().forEach(t => t.stop());
            isAcquiringMediaRef.current = false;
            return;
          }
          
          setLocalStream(stream);
          setIsPreviewReady(true);
        } catch (err: any) {
          if (!active) {
            isAcquiringMediaRef.current = false;
            return;
          }
          console.error('Hardware Link Failure:', err);
          
          let errorMsg = 'Please authorize the judicial chamber to access your camera and microphone.';
          if (err.name === 'NotReadableError') {
              errorMsg = 'Hardware is locked by another application. Close other meeting tabs or apps and try again.';
          }
          
          setModalConfig({
            isOpen: true,
            title: 'Critical Uplink Intercepted',
            message: errorMsg,
            type: 'error'
          });
        } finally {
          isAcquiringMediaRef.current = false;
        }
      }
    };
    
    acquireMedia();
    
    return () => {
      active = false;
    };
  }, [mounted, isInHearing, localStream]);

  // Sync media tracks with mute state
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !isAudioMuted; });
    }
  }, [isAudioMuted, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => { t.enabled = !isVideoMuted; });
    }
  }, [isVideoMuted, localStream]);

  // Handle Video element assignment
  useEffect(() => {
    if (localStream) {
      if (!isInHearing && lobbyVideoRef.current) {
        lobbyVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, isInHearing]);

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
        if (localStream) localStream.getTracks().forEach(t => t.stop());
    };
  }, [localStream]);

  // --- ACTIONS ---
  const toggleAudio = () => {
    if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }
    setIsAudioMuted(!isAudioMuted);
  };

  const toggleVideo = () => {
    setIsVideoMuted(!isVideoMuted);
  };

  const establishLink = () => {
    if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }
    setIsInHearing(true);
    setSessionStartTime(Date.now());
    
    // Propagate muted/video state to tracks
    if (localStream) {
        localStream.getAudioTracks().forEach(t => t.enabled = !isAudioMuted);
        localStream.getVideoTracks().forEach(t => t.enabled = !isVideoMuted);
    }

    if (recognitionRef.current) try { recognitionRef.current.start(); setIsTranscribing(true); } catch(e) {}
    
    setMessages(prev => [...prev, { id: Date.now(), sender: 'SYSTEM', content: `${currentUser?.name || 'User'} has established a secure link to the chamber.`, type: 'system', timestamp: new Date().toLocaleTimeString() }]);
  };

  const toggleRecording = () => {
    if (!isRecording && localStream) {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(localStream, { mimeType: 'video/webm' });
      recorder.ondataavailable = e => e.data.size > 0 && recordedChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setTempRecordingBlob(blob);
        setIsSavePromptOpen(true);
        setRecordingDuration(0);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsRecordingPaused(false);
      setRecordingDuration(0);
      setMessages(prev => [...prev, { id: Date.now(), sender: 'SYSTEM', content: 'OFFICIAL RECORDING INITIATED.', type: 'system', timestamp: new Date().toLocaleTimeString() }]);
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      setIsRecordingPaused(false);
    }
  };

  const pauseRecording = () => {
    if (isRecording && mediaRecorderRef.current) {
        if (isRecordingPaused) {
            mediaRecorderRef.current.resume();
            setIsRecordingPaused(false);
        } else {
            mediaRecorderRef.current.pause();
            setIsRecordingPaused(true);
        }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadSavedRecordings = (database: IDBDatabase) => {
    const transaction = database.transaction(['recordings'], 'readonly');
    const request = transaction.objectStore('recordings').getAll();
    request.onsuccess = () => {
      setSavedRecordings(request.result.map(rec => ({ ...rec, url: URL.createObjectURL(rec.blob) })).sort((a, b) => b.id - a.id));
    };
  };

  const handleSaveRecording = (save: boolean) => {
    if (save && tempRecordingBlob && db) {
      const transaction = db.transaction(['recordings'], 'readwrite');
      transaction.objectStore('recordings').add({
        id: Date.now(), name: `HEARING_LOG_${new Date().toISOString().slice(0,10)}.webm`, blob: tempRecordingBlob, timestamp: new Date().toLocaleTimeString()
      });
      transaction.oncomplete = () => loadSavedRecordings(db);
    }
    setTempRecordingBlob(null);
    setIsSavePromptOpen(false);
  };

  const handleEvidenceAction = (file: any) => {
    setActiveEvidence(file);
    setPresentationMode('split');
    setMessages(prev => [...prev, { id: Date.now(), sender: 'SYSTEM', content: `EXHIBIT PRESENTED: ${file.name}.`, type: 'system', timestamp: new Date().toLocaleTimeString() }]);
  };

  const enterBreakout = (room: string) => {
    setIsBreakoutActive(true);
    setActiveBreakoutRoom(room);
    setMessages(prev => [...prev, { id: Date.now(), sender: 'SYSTEM', content: `ENTERING BREAKOUT ROOM: ${room}.`, type: 'system', timestamp: new Date().toLocaleTimeString() }]);
  };

  const leaveBreakout = () => {
    setIsBreakoutActive(false);
    setActiveBreakoutRoom(null);
    setMessages(prev => [...prev, { id: Date.now(), sender: 'SYSTEM', content: 'RETURNED TO MAIN CHAMBER.', type: 'system', timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleScreenShare = async () => {
    if (!isScreenSharing) {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            screenStreamRef.current = stream;
            setIsScreenSharing(true);
            setPresentationMode('split');
            
            stream.getVideoTracks()[0].onended = () => {
                setIsScreenSharing(false);
                setPresentationMode('main');
            };
        } catch (err) {
            console.error("Error sharing screen:", err);
        }
    } else {
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        setIsScreenSharing(false);
        setPresentationMode('main');
    }
  };

  if (!mounted) return null;

  return (
    <RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK', 'LAWYER', 'PLAINTIFF', 'DEFENDANT']}>
      <div className={`h-screen flex flex-col font-sans selection:bg-emerald-500/30 overflow-hidden ${!isInHearing ? 'bg-white' : 'bg-slate-50'}`}>
        <AnimatePresence mode="wait">
          {!isInHearing ? (
            <motion.div 
              key="lobby" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="flex-1 flex flex-col"
            >
              <header className="h-16 px-8 flex items-center justify-between border-b border-gray-100 bg-white shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                  <Link href="/" className="mr-2 p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-2 group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Dashboard</span>
                  </Link>
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Gavel size={20}/></div>
                  <span className="text-xl font-bold text-slate-800 tracking-tight">Judicial Chamber Link</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-slate-800">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 border border-emerald-100 font-bold text-xs">{currentUser?.name?.[0] || 'U'}</div>
                </div>
              </header>

              <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/30 overflow-hidden">
                <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center gap-16">
                  <div className="flex-1 w-full max-w-2xl space-y-6">
                    <div className="aspect-video bg-slate-900 rounded-[3rem] relative overflow-hidden shadow-2xl group ring-1 ring-slate-200">
                      <video 
                        ref={lobbyVideoRef}
                        autoPlay 
                        playsInline 
                        muted 
                        className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-500 ${isVideoMuted ? 'opacity-0' : 'opacity-100'}`} 
                      />
                      {isVideoMuted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                          <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center text-white/50"><VideoOff size={40}/></div>
                        </div>
                      )}
                      
                      <div className="absolute bottom-10 left-10 flex items-center gap-1.5 h-10 bg-black/20 backdrop-blur-md px-4 rounded-2xl border border-white/10">
                        <Mic size={14} className={isAudioMuted ? 'text-red-500' : 'text-emerald-500'} />
                        <div className="flex items-center gap-1 h-3">
                          {[...Array(8)].map((_, i) => (
                            <motion.div 
                              key={i} 
                              animate={{ 
                                height: isAudioMuted ? 4 : Math.max(4, (audioLevel / 255) * 20 * (0.5 + Math.random())) 
                              }} 
                              className={`w-1 rounded-full transition-colors ${isAudioMuted ? 'bg-red-500/30' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
                        <button onClick={toggleAudio} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md border ${isAudioMuted ? 'bg-red-500 border-red-400 text-white' : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'}`}>
                          {isAudioMuted ? <MicOff size={24}/> : <Mic size={24}/>}
                        </button>
                        <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md border ${isVideoMuted ? 'bg-red-500 border-red-400 text-white' : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'}`}>
                          {isVideoMuted ? <VideoOff size={24}/> : <Video size={24}/>}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-8 text-slate-400">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><Shield size={14} className="text-emerald-500"/> Secured Link</div>
                      <div className="w-px h-4 bg-slate-200"></div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><Users size={14}/> Participant Verification Ready</div>
                    </div>
                  </div>

                  <div className="lg:w-96 text-center lg:text-left space-y-10">
                    <div className="space-y-4">
                      <h2 className="text-5xl font-black text-slate-800 tracking-tighter leading-tight">Ready to join?</h2>
                      <p className="text-slate-500 font-medium leading-relaxed">The hearing for <span className="text-emerald-700 font-bold underline decoration-emerald-500/20 underline-offset-4">Case #{sessionId}</span> is in progress.</p>
                    </div>
                    
                    <div className="space-y-6">
                      <button onClick={establishLink} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/30 transform hover:-translate-y-1 transition-all active:scale-95">Enter Chamber</button>
                      <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Participants Present (5)</p>
                        <div className="flex -space-x-3 overflow-hidden justify-center lg:justify-start">
                          {participants.map(p => (
                            <div key={p.id} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-lg shadow-sm" title={p.name}>{p.avatar}</div>
                          ))}
                          <div className="w-10 h-10 rounded-full border-2 border-white bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">+2</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="hearing" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex-1 flex flex-col overflow-hidden max-h-screen relative bg-slate-50 text-slate-800"
            >
              {/* Top Status Bar (Floating when recording) */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex gap-3 pointer-events-none">
                {isRecording && (
                  <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 px-6 py-2.5 bg-red-600 text-white rounded-full shadow-2xl border border-red-500 pointer-events-auto">
                    <div className={`w-3 h-3 bg-white rounded-full ${isRecordingPaused ? 'opacity-50' : 'animate-pulse'}`}></div>
                    <span className="text-[11px] font-black uppercase tracking-widest">{isRecordingPaused ? 'Recording Paused' : 'Live Recording'}</span>
                    <div className="w-px h-4 bg-white/20 mx-1"></div>
                    <span className="text-sm font-black tabular-nums">{formatDuration(recordingDuration)}</span>
                  </motion.div>
                )}
                {isBreakoutActive && (
                  <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 px-6 py-2.5 bg-indigo-600 text-white rounded-full shadow-2xl border border-indigo-500 pointer-events-auto">
                    <Shield size={14} />
                    <span className="text-[11px] font-black uppercase tracking-widest">Private Breakout: {activeBreakoutRoom}</span>
                    <button onClick={leaveBreakout} className="ml-2 p-1 hover:bg-white/20 rounded-md transition-colors"><X size={14}/></button>
                  </motion.div>
                )}
              </div>

              <header className="h-16 px-8 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md shrink-0 z-50">
                <div className="flex items-center gap-4">
                  <Link href="/" className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  </Link>
                  <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">⚖️</div>
                  <div>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Judicial Portal • Case #{sessionId}</h2>
                    <h1 className="text-sm font-black text-slate-800 tracking-tight leading-none">Federal First Instance Court • Chamber Link</h1>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-xs font-black text-slate-800 tabular-nums">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setActiveTab('chat'); setIsSidebarOpen(!isSidebarOpen || activeTab !== 'chat'); }} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isSidebarOpen && activeTab === 'chat' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}><MessageSquare size={16}/></button>
                    <button onClick={() => { setActiveTab('transcripts'); setIsSidebarOpen(!isSidebarOpen || activeTab !== 'transcripts'); }} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isSidebarOpen && activeTab === 'transcripts' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}><Activity size={16}/></button>
                    <button onClick={() => { setActiveTab('recordings'); setIsSidebarOpen(!isSidebarOpen || activeTab !== 'recordings'); }} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isSidebarOpen && activeTab === 'recordings' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}><Save size={16}/></button>
                  </div>
                </div>
              </header>

              <div className="flex-1 flex overflow-hidden relative">
                <main className="flex-1 p-6 flex flex-col gap-6 overflow-hidden relative">
                  <div className={`flex-1 flex gap-6 min-h-0 ${presentationMode === 'split' ? 'flex-row' : 'flex-col'}`}>
                    
                    {/* Primary Presentation Area */}
                    {presentationMode === 'split' && (
                      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} id="presentation-container" className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden relative shadow-2xl group flex flex-col ring-1 ring-emerald-500/10">
                         <div className="absolute top-6 left-6 flex items-center gap-3 z-30">
                            <div className={`p-3 rounded-xl text-white shadow-xl ${isScreenSharing ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                                {isScreenSharing ? <Monitor size={20}/> : <FileText size={20}/>}
                            </div>
                            <div className="px-4 py-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl">
                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">{isScreenSharing ? 'Secure Presentation' : 'Evidence Exhibit'}</p>
                                <p className={`text-[9px] font-bold uppercase mt-1 ${isScreenSharing ? 'text-blue-600' : 'text-emerald-600'}`}>{isScreenSharing ? 'Local Presentation Stream' : activeEvidence?.name}</p>
                            </div>
                         </div>
                         <div className="absolute top-6 right-6 z-30 flex gap-2">
                             <button onClick={() => {
                                 const el = document.getElementById('presentation-container');
                                 if (!document.fullscreenElement) {
                                     el?.requestFullscreen().then(() => setIsFullscreen(true));
                                 } else {
                                     document.exitFullscreen().then(() => setIsFullscreen(false));
                                 }
                             }} title="Toggle Fullscreen" className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl flex items-center justify-center transition-all shadow-lg">
                                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18}/>}
                             </button>
                             <button onClick={() => { setPresentationMode('main'); setIsScreenSharing(false); if(document.fullscreenElement) document.exitFullscreen(); }} className="w-10 h-10 bg-white hover:bg-red-50 text-slate-800 hover:text-red-600 border border-slate-200 rounded-xl flex items-center justify-center transition-all shadow-lg"><X size={18}/></button>
                         </div>
                         
                         <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                            {isScreenSharing ? (
                                <video 
                                    ref={(el) => { if (el && screenStreamRef.current && el.srcObject !== screenStreamRef.current) el.srcObject = screenStreamRef.current; }}
                                    autoPlay 
                                    playsInline 
                                    className="w-full h-full object-contain" 
                                />
                            ) : (
                                <div className="w-full h-full bg-white rounded-3xl border border-slate-200 p-10 flex flex-col gap-6 shadow-inner relative overflow-hidden">
                                     <div className="flex-1 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                                        <FileText size={48} className="text-slate-200" />
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Propagating Visual Artifact...</p>
                                     </div>
                                </div>
                            )}
                         </div>
                      </motion.div>
                    )}

                    {/* Participant Grid - Optimized for all screen sizes to prevent overlapping */}
                    <div className={`${presentationMode === 'split' ? 'w-[26rem] flex-shrink-0 flex flex-col gap-6 overflow-y-auto pr-2' : 'flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10 overflow-y-auto content-start auto-rows-min'} min-h-0 h-full w-full scrollbar-hide pb-24 px-4`}>
                      
                      {/* Local Participant Card (Equal to others) */}
                      <motion.div layout className="bg-slate-900 rounded-[2.5rem] relative overflow-hidden shadow-lg group ring-4 ring-white aspect-video w-full">
                        <video 
                          ref={(el) => { 
                            if (el && localStream && el.srcObject !== localStream) el.srcObject = localStream; 
                          }}
                          autoPlay 
                          playsInline 
                          muted 
                          className={`w-full h-full object-cover transition-opacity duration-500 ${isVideoMuted ? 'opacity-0' : 'opacity-100'} -scale-x-100`} 
                        />
                        {isVideoMuted && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                            <div className="w-20 h-20 bg-white rounded-full border border-slate-200 flex items-center justify-center text-3xl font-black text-slate-200 shadow-inner">{currentUser?.name?.[0] || 'U'}</div>
                          </div>
                        )}
                        <div className="absolute top-5 right-5 z-20 h-8 px-3 bg-white/90 backdrop-blur-md rounded-lg flex items-center gap-2 border border-slate-200 shadow-lg">
                           <Mic size={12} className={isAudioMuted ? 'text-red-500' : 'text-emerald-600'} />
                           <div className="flex gap-0.5 items-end h-2.5">
                               {[...Array(4)].map((_, i) => (
                                 <motion.div key={i} animate={{ height: isAudioMuted ? 4 : 4 + Math.random() * 8 }} className={`w-0.5 rounded-full ${isAudioMuted ? 'bg-red-200' : 'bg-emerald-500'}`} />
                               ))}
                           </div>
                        </div>
                        <div className="absolute bottom-5 left-5 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl flex items-center gap-2 z-20">
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                           <span className="text-[9px] font-black text-white uppercase tracking-widest">You (Host)</span>
                        </div>
                      </motion.div>

                      {/* Remote Participants */}
                      {participants.slice(1).map(p => (
                        <motion.div layout key={p.id} className="aspect-video bg-white border border-slate-200 rounded-[2.5rem] relative overflow-hidden shadow-sm group hover:border-emerald-600/30 transition-all flex flex-col items-center justify-center gap-4 w-full">
                           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">{p.avatar}</div>
                           <div className="flex flex-col items-center gap-1">
                              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{p.name}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">{p.role}</span>
                           </div>
                           <div className="absolute top-5 right-5 text-red-500 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">{p.isMuted && <MicOff size={12} />}</div>
                           <div className="absolute bottom-5 left-5 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Remote</span>
                           </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Main Toolbar (Google Meet Style) */}
                  <div className="h-24 bg-white border border-slate-200 rounded-[2.5rem] flex items-center justify-between px-10 shrink-0 shadow-2xl relative z-50">
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums">{currentTime.toLocaleTimeString([], { hour12: false })}</span>
                       <div className="w-px h-6 bg-slate-100"></div>
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                          <Users size={14} className="text-slate-400" />
                          <span className="text-[10px] font-black text-slate-800">{participants.length + 2}</span>
                       </div>
                    </div>

                    <div className="flex items-center gap-3">
                       <button onClick={toggleAudio} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isAudioMuted ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                          {isAudioMuted ? <MicOff size={22}/> : <Mic size={22}/>}
                       </button>
                       <button onClick={toggleVideo} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isVideoMuted ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                          {isVideoMuted ? <VideoOff size={22}/> : <Video size={22}/>}
                       </button>
                       <div className="w-px h-10 bg-slate-100 mx-1"></div>
                       <button onClick={() => setIsEvidenceOpen(!isEvidenceOpen)} className={`h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isEvidenceOpen ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Vault</button>
                       <button onClick={handleScreenShare} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isScreenSharing ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Monitor size={22}/></button>
                       <button onClick={() => setIsBreakoutModalOpen(true)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:text-white`}><Users size={22}/></button>
                       
                       <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl ml-1">
                          <button onClick={toggleRecording} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-600 text-white shadow-lg' : 'text-red-600 hover:bg-red-50'}`} title="Record Session">
                             {isRecording ? <Square size={16} fill="currentColor"/> : <Circle size={16} fill="currentColor"/>}
                          </button>
                          {isRecording && (
                             <button onClick={pauseRecording} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all text-slate-500 hover:bg-white border border-transparent hover:border-slate-200`}>
                                {isRecordingPaused ? <Play size={18} fill="currentColor"/> : <Pause size={18} fill="currentColor"/>}
                             </button>
                          )}
                       </div>
                    </div>

                    <div className="flex items-center gap-4">
                       <button className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-all"><Hand size={20}/></button>
                       <button onClick={() => setIsInHearing(false)} className="h-14 px-8 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all">Hang Up</button>
                    </div>
                  </div>
                </main>

                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.aside 
                      initial={{ x: 450 }} 
                      animate={{ x: 0 }} 
                      exit={{ x: 450 }} 
                      className="w-[450px] bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden z-[55] shadow-2xl"
                    >
                      <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl ring-1 ring-slate-200">
                          {[{ id: 'chat', label: 'Protocol' }, { id: 'transcripts', label: 'Live Scribe' }, { id: 'recordings', label: 'Archive' }].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab.id ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:bg-slate-200/50'}`}>{tab.label}</button>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                        {activeTab === 'chat' && (
                          messages.map(msg => (
                            <div key={msg.id} className={`flex flex-col gap-2 ${msg.sender === (currentUser?.name || 'Local Participant') ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-3 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">
                                {msg.sender === 'SYSTEM' ? <Shield size={10} className="text-emerald-500"/> : <User size={10}/>} {msg.sender}
                              </div>
                              <div className={`p-5 rounded-2xl text-xs font-bold leading-relaxed max-w-[90%] shadow-sm border ${msg.type === 'system' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 italic text-center w-full' : msg.sender === (currentUser?.name || 'Local Participant') ? 'bg-emerald-600 text-white border-emerald-500 rounded-tr-none' : 'bg-slate-50 text-slate-800 border-slate-200 rounded-tl-none'}`}>
                                {msg.content}
                              </div>
                            </div>
                          ))
                        )}

                        {activeTab === 'transcripts' && (
                          <div className="space-y-8">
                            {transcripts.length === 0 ? (
                                <div className="text-center py-20">
                                    <Activity size={48} className="mx-auto text-slate-200 mb-6" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-loose">Waiting for judicial statements...<br/>Algorithm listening (R-400)</p>
                                </div>
                            ) : (
                                transcripts.map(t => (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={t.id} className="p-6 bg-slate-50 border-l-4 border-l-emerald-600 rounded-2xl space-y-3">
                                        <div className="flex justify-between items-center"><span className="text-[10px] font-black text-emerald-600 uppercase">{t.speaker}</span><span className="text-[8px] font-bold text-slate-400">[{t.timestamp}]</span></div>
                                        <p className="text-xs leading-relaxed text-slate-600 font-medium italic opacity-90">"{t.text}"</p>
                                    </motion.div>
                                ))
                            )}
                          </div>
                        )}

                        {activeTab === 'recordings' && (
                          <div className="space-y-6">
                            {savedRecordings.map(rec => (
                              <div key={rec.id} className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] flex items-center justify-between hover:bg-emerald-50 transition-all group shadow-sm">
                                <div>
                                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1 truncate max-w-[200px]">{rec.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{rec.timestamp}</p>
                                </div>
                                <a href={rec.url} download={rec.name} className="w-12 h-12 bg-white text-emerald-600 border border-slate-200 rounded-xl shadow-sm hover:shadow-md flex items-center justify-center transition-all"><Download size={18}/></a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="p-10 border-t border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-4 bg-white border border-slate-200 focus-within:border-emerald-600/50 rounded-2xl p-2 transition-all shadow-sm">
                          <button className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-emerald-600 transition-colors"><Paperclip size={18}/></button>
                          <input type="text" placeholder="Protocol transmission..." className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder:text-slate-300" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (setMessages([...messages, { id: Date.now(), sender: currentUser?.name || 'Local Participant', content: chatInput, timestamp: new Date().toLocaleTimeString() }]), setChatInput(''))} />
                          <button className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-xl shadow-lg active:scale-95 transition-all"><Send size={16}/></button>
                        </div>
                      </div>
                    </motion.aside>
                  )}
                </AnimatePresence>
              </div>

              {/* BREAKOUT MANAGEMENT MODAL */}
              <AnimatePresence>
                {isBreakoutModalOpen && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-12 bg-slate-900/40 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-w-5xl w-full bg-white border border-slate-200 rounded-[4rem] p-16 shadow-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between mb-16">
                        <div className="flex items-center gap-8">
                          <div className="w-20 h-20 bg-emerald-600/10 rounded-[2rem] flex items-center justify-center text-emerald-600 shadow-inner"><Users size={36}/></div>
                          <div>
                            <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tight leading-none">Breakout Sessions</h3>
                            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Assign judicial nodes to private deliberation sub-chambers</p>
                          </div>
                        </div>
                        <button onClick={() => setIsBreakoutModalOpen(false)} className="w-14 h-14 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center transition-all"><X size={24}/></button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="col-span-1 space-y-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Available Nodes</p>
                            <div className="bg-slate-50/50 rounded-[2rem] border border-slate-200 p-6 space-y-4 max-h-[40vh] overflow-y-auto">
                                {participants.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm group">
                                        <div className="flex items-center gap-4">
                                            <div className="text-xl">{p.avatar}</div>
                                            <span className="text-[11px] font-bold text-slate-800">{p.name}</span>
                                        </div>
                                        <button className="text-emerald-600 group-hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all">Assign</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {breakoutRooms.map(room => (
                                <div key={room.id} className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-10 flex flex-col gap-6 group hover:border-emerald-600/30 transition-all">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{room.name}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{room.participants.length > 0 ? `${room.participants.length} Active` : 'Empty'}</span>
                                    </div>
                                    <div className="flex-1 min-h-[150px] bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center gap-4 border border-slate-100">
                                        {room.participants.length === 0 ? (
                                            <>
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-200"><Plus size={24}/></div>
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Drop Nodes Here</p>
                                            </>
                                        ) : (
                                            <div className="flex -space-x-3 overflow-hidden">
                                                {room.participants.map((pid: string) => {
                                                    const p = participants.find(part => part.id === pid);
                                                    return <div key={pid} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center text-2xl shadow-sm">{p?.avatar}</div>
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => { enterBreakout(room.name); setIsBreakoutModalOpen(false); }} className="w-full py-4 bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Open Session</button>
                                </div>
                            ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* MODALS INSIDE CHAMBER */}
              <AnimatePresence>
                {isEvidenceOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-slate-900/20 backdrop-blur-xl">
                    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="max-w-6xl w-full bg-white border border-slate-200 rounded-[4rem] p-16 shadow-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between mb-16">
                        <div className="flex items-center gap-8">
                          <div className="w-20 h-20 bg-emerald-600/10 rounded-[2rem] flex items-center justify-center text-emerald-600 shadow-inner"><Pipette size={36}/></div>
                          <div>
                            <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tight leading-none">Evidence Vault</h3>
                            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Authorized digital exhibits for session propagation</p>
                          </div>
                        </div>
                        <button onClick={() => setIsEvidenceOpen(false)} className="w-14 h-14 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center transition-all"><X size={24}/></button>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 overflow-y-auto max-h-[50vh] pr-6 scrollbar-hide">
                        <div onClick={() => evidenceInputRef.current?.click()} className="aspect-square border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center gap-6 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all cursor-pointer group">
                          <Plus size={56} className="text-slate-200 group-hover:text-emerald-600 group-hover:scale-110 transition-all" />
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] group-hover:text-emerald-600 leading-none">Inject Exhibit</p>
                        </div>
                        {evidenceFiles.map(file => (
                          <div key={file.id} onClick={() => handleEvidenceAction(file)} className="aspect-square bg-slate-50/50 border border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-6 p-10 hover:border-emerald-600 hover:bg-white transition-all cursor-pointer relative group shadow-sm hover:shadow-md">
                            <FileText size={64} className="text-slate-200 group-hover:text-emerald-600 transition-colors" />
                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight text-center line-clamp-1 leading-none">{file.name}</p>
                            <div className="absolute bottom-10 right-10 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={16}/></div>
                          </div>
                        ))}
                      </div>
                      <input type="file" ref={evidenceInputRef} className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if(file) setEvidenceFiles(prev => [...prev, { id: Date.now(), name: file.name, size: (file.size/1024).toFixed(1)+'KB', url: URL.createObjectURL(file) }]);
                      }} />
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isSavePromptOpen && (
                  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-2xl">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="max-w-md w-full bg-white border border-slate-200 rounded-[4rem] p-16 text-center shadow-2xl">
                      <div className="w-24 h-24 bg-emerald-600/10 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-10 shadow-inner"><Save size={48}/></div>
                      <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4 leading-none">Archive Log?</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-12">Requirement 3.3: This recording will be finalized and uploaded to the official judicial repository for permanent archival.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleSaveRecording(false)} className="py-6 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Discard</button>
                        <button onClick={() => handleSaveRecording(true)} className="py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/30 transition-all">Finalize Log</button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        <Modal 
          isOpen={modalConfig.isOpen} 
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
          title={modalConfig.title} 
          message={modalConfig.message} 
          type={modalConfig.type} 
        />
      </div>
    </RequireAccess>
  );
}
