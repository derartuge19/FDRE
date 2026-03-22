'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
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
  Mic,
  MicOff,
  VideoOff,
  Shield,
  UserPlus,
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
  if (status === 'delivered') return <Check size={14} className="text-emerald-400" />;
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
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const selectedContactRef = useRef<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const messagesRef = useRef<Record<string, Message[]>>({});
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<any[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  // Call States
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [currentCallPeerId, setCurrentCallPeerId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'dialing' | 'ringing' | 'active'>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean, 
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' | 'security' | 'judicial',
    confirmLabel?: string,
    cancelLabel?: string,
    onConfirm?: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const candidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

  // Aggressive mounting refs for video
  const setLocalVideo = useCallback((el: HTMLVideoElement | null) => {
    if (el && localStream) {
      el.srcObject = localStream;
      el.onloadedmetadata = () => { el.play().catch(() => {}); };
      el.play().catch(() => {});
    }
  }, [localStream]);

  const setRemoteVideo = useCallback((el: HTMLVideoElement | null) => {
    if (el && remoteStream) {
      el.srcObject = remoteStream;
      el.onloadedmetadata = () => { el.play().catch(() => {}); };
      el.play().catch(() => {});
    }
  }, [remoteStream]);

  // 1. Initialize
  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('courtUser');
    const user = userStr ? JSON.parse(userStr) : { id: 'anonymous', name: 'Court User' };
    setCurrentUser(user);

    const token = localStorage.getItem('courtToken');
    fetch('http://localhost:5173/api/database/users', { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(r => r.json()).then(data => {
      if (data.success) {
        setContacts(data.data.filter((u: any) => u.id !== user.id).map((u: any) => ({
          id: u.id,
          name: u.name,
          role: u.roles?.[0] || 'Participant',
          status: 'offline',
          avatar: u.roles?.[0] === 'judge' ? '👨‍⚖️' : '👤',
          lastMessage: 'Secure Judicial Channel',
          lastSeen: 'Recently',
          unreadCount: 0,
        })));
      }
    });

    const ws = new WebSocket('ws://localhost:5173');
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'authenticate',
        userId: user.id || user.username,
        userName: user.name,
        userRole: user.roles?.[0]
      }));
    };
    ws.onmessage = (event) => handleIncomingSocketMessage(JSON.parse(event.data));
    setSocket(ws);
    return () => {
      ws.close();
      stopMedia();
    };
  }, []);

  // Synchronize refs with state for use inside WebSocket closure
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Handle Mute/Video Toggles on Stream
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff, localStream]);

  // Ringing Sound
  const playRingSound = (isIncoming: boolean) => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      
      const playTone = (freq: number, start: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.1, start + 0.1);
        gain.gain.linearRampToValueAtTime(0, start + 0.4);
        osc.start(start);
        osc.stop(start + 0.5);
      };

      if (isIncoming) {
        playTone(440, ctx.currentTime);
        playTone(554.37, ctx.currentTime + 0.2); // Major third
      } else {
        playTone(440, ctx.currentTime);
        playTone(329.63, ctx.currentTime + 0.3); // Perfect fifth down
      }
    } catch (e) { console.error('Audio fail:', e); }
  };

  const stopMedia = (eOrSignal: any = true) => {
    const shouldSignal = typeof eOrSignal === 'boolean' ? eOrSignal : true;
    
    if (shouldSignal && socket && currentCallPeerId) {
      socket.send(JSON.stringify({
        type: 'signaling_message',
        targetUserId: currentCallPeerId,
        signalingData: { type: 'call_ended' }
      }));
    }

    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setIsCalling(false);
    setCallStatus('idle');
    setIncomingCall(null);
    setCurrentCallPeerId(null);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    candidateQueueRef.current = [];
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState('');

  // 2. WebSocket Message Handler
  const handleIncomingSocketMessage = (data: any) => {
    switch (data.type) {
      case 'online_users_update':
        setOnlineUsers(data.users.map((u: any) => u.id));
        setContacts(prev => prev.map(c => ({
          ...c,
          status: data.users.find((u: any) => u.id === c.id) ? 'online' : 'offline'
        })));
        break;

      case 'chat_message':
        const threadId = data.isSelf ? data.recipientId : data.senderId;
        const msg: Message = {
          id: data.id,
          senderId: data.senderId,
          senderName: data.senderName,
          content: data.content,
          timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: data.isSelf || false,
          status: data.status || 'sent',
          attachments: data.attachments || []
        };
        
        const isCurrentChat = selectedContactRef.current?.id === threadId;

        setMessages(prev => {
          const chatHistory = prev[threadId] || [];
          if (chatHistory.some(m => m.id === msg.id)) return prev;
          return { ...prev, [threadId]: [...chatHistory, msg] };
        });

        // Mark as read immediately if chat is open, else increment unread count
        if (!data.isSelf) {
          if (isCurrentChat && document.hasFocus() && socketRef.current) {
            socketRef.current.send(JSON.stringify({
              type: 'mark_read',
              messageIds: [data.id],
              senderId: data.senderId,
            }));
          } else if (!isCurrentChat) {
            setContacts(prev => prev.map(c => 
              c.id === data.senderId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
            ));
          }
        }
        break;

      case 'message_edited':
        setMessages(prev => {
          const newState = { ...prev };
          Object.keys(newState).forEach(tId => {
            newState[tId] = newState[tId].map(m => m.id === data.messageId ? { ...m, content: data.content } : m);
          });
          return newState;
        });
        break;

      case 'message_deleted':
        setMessages(prev => {
          const newState = { ...prev };
          Object.keys(newState).forEach(tId => {
            newState[tId] = newState[tId].filter(m => m.id !== data.messageId);
          });
          return newState;
        });
        break;

      case 'message_history':
        setMessages(prev => ({
          ...prev,
          [data.recipientId]: data.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }))
        }));
        break;

      case 'messages_read':
        const readerId = data.readBy; // Either us or them
        setMessages(prev => {
          const newState = { ...prev };
          Object.keys(newState).forEach(tId => {
            newState[tId] = newState[tId].map(m => 
              data.messageIds.includes(m.id) ? { ...m, status: 'read' as const } : m
            );
          });
          return newState;
        });
        break;

      case 'signaling_message':
        handleSignaling(data);
        break;
    }
  };

  const handleSignaling = async (data: any) => {
    const { signalingData, senderId } = data;
    
    if (signalingData.type === 'offer') {
      setIncomingCall({ 
        senderId, 
        senderName: data.senderName, 
        callType: signalingData.callType,
        sdp: signalingData.sdp 
      });
      playRingSound(true);
    } else if (signalingData.type === 'answer' && pcRef.current) {
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(signalingData));
        setCallStatus('active');
        processCandidateQueue();
      } catch (err) {
        console.error('Failure setting remote answer:', err);
      }
    } else if (signalingData.type === 'candidate') {
      if (pcRef.current && pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(signalingData.candidate));
        } catch (err) {
          console.error('Error adding direct ICE candidate:', err);
        }
      } else {
        candidateQueueRef.current.push(signalingData.candidate);
      }
    } else if (signalingData.type === 'call_ended') {
      stopMedia(false); // Don't loop signals back
    }
  };

  const processCandidateQueue = async () => {
    if (!pcRef.current || !pcRef.current.remoteDescription) return;
    while (candidateQueueRef.current.length > 0) {
      const candidate = candidateQueueRef.current.shift();
      if (candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding queued ICE candidate:', err);
        }
      }
    }
  };

  // 3. Media Actions
  const initiateCall = async (type: 'voice' | 'video') => {
    if (!selectedContact || !socket) return;
    setCallStatus('dialing');
    setIsCalling(true);
    setCurrentCallPeerId(selectedContact.id);
    playRingSound(false);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
    setLocalStream(stream);

    pcRef.current = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    stream.getTracks().forEach(track => pcRef.current?.addTrack(track, stream));

    pcRef.current.ontrack = (e) => setRemoteStream(e.streams[0]);
    // Use currentCallPeerId consistently
    const targetId = selectedContact.id;
    setCurrentCallPeerId(targetId);

    pcRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.send(JSON.stringify({
          type: 'signaling_message',
          targetUserId: targetId,
          signalingData: { type: 'candidate', candidate: e.candidate }
        }));
      }
    };

    pcRef.current.oniceconnectionstatechange = () => {
      console.log('ICE Connection:', pcRef.current?.iceConnectionState);
      if (pcRef.current?.iceConnectionState === 'connected') setCallStatus('active');
    };

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socket.send(JSON.stringify({
      type: 'signaling_message',
      targetUserId: targetId,
      signalingData: { type: 'offer', sdp: offer.sdp, callType: type }
    }));
  };

  const acceptCall = async () => {
    if (!incomingCall || !socket) return;
    const peerId = incomingCall.senderId;
    const callType = incomingCall.callType;
    const sdp = incomingCall.sdp;
    
    setIncomingCall(null); // Clear notification immediately
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
    setLocalStream(stream);
    setCallStatus('active');
    setIsCalling(true);
    setCurrentCallPeerId(peerId);

    pcRef.current = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    
    stream.getTracks().forEach(track => {
      pcRef.current?.addTrack(track, stream);
    });

    pcRef.current.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pcRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.send(JSON.stringify({
          type: 'signaling_message',
          targetUserId: peerId,
          signalingData: { type: 'candidate', candidate: e.candidate }
        }));
      }
    };

    pcRef.current.oniceconnectionstatechange = () => {
      console.log('ICE Connection (Receiver):', pcRef.current?.iceConnectionState);
    };

    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: sdp }));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.send(JSON.stringify({
        type: 'signaling_message',
        targetUserId: incomingCall.senderId,
        signalingData: { type: 'answer', sdp: answer.sdp }
      }));
      processCandidateQueue();
    } catch (err) {
      console.error('Error during call acceptance:', err);
      stopMedia();
    }
    setIncomingCall(null);
  };

  // 4. Message Actions
  const sendMessage = async () => {
    if (!newMessage.trim() && pendingFiles.length === 0) return;
    if (!selectedContact || !socket) return;

    let attachments: Attachment[] = [];
    if (pendingFiles.length > 0) {
      const formData = new FormData();
      pendingFiles.forEach(f => formData.append('files', f.file));
      const r = await fetch('http://localhost:5173/api/upload', { method: 'POST', body: formData });
      const d = await r.json();
      if (d.success) attachments = d.files.map((f: any) => ({ ...f, id: `att-${Date.now()}` }));
    }

    socket.send(JSON.stringify({
      type: 'send_message',
      recipientId: selectedContact.id,
      content: newMessage.trim(),
      attachments
    }));
    setNewMessage('');
    setPendingFiles([]);
  };

  const handleFileSelect = (e: any) => {
    const f = Array.from(e.target.files || []).map((file: any) => ({ id: Math.random().toString(), name: file.name, file }));
    setPendingFiles(prev => [...prev, ...f]);
  };

  const saveEdit = (msgId: string) => {
    if (!selectedContact || !socket) return;
    socket.send(JSON.stringify({ type: 'edit_message', messageId: msgId, content: editBuffer, recipientId: selectedContact.id }));
    setEditingId(null);
  };

  const deleteMsg = (id: string, contactId: string) => {
    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'Permanent Deletion',
      message: 'Are you sure you want to scrub this message from the judicial record for both parties? This action cannot be undone.',
      confirmLabel: 'DESTRUCT FOR ALL',
      cancelLabel: 'ABORT',
      onConfirm: () => {
        socket?.send(JSON.stringify({ type: 'delete_message', messageId: id, recipientId: contactId }));
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const currentThread = selectedContact ? (messages[selectedContact.id] || []) : [];

  if (!mounted) return null;

  return (
    <RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK', 'LAWYER', 'PLAINTIFF', 'DEFENDANT', 'USER']}>
    <div className="min-h-screen page-bg page-text font-sans flex flex-col relative overflow-hidden">
      <Header />
      <Navigation />

      {/* CALL UI MODAL (Full Screen Overlay) */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-[#0a0f0d]/90 backdrop-blur-3xl flex flex-col items-center justify-center p-12 overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               <motion.div 
                 animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                 transition={{ repeat: Infinity, duration: 3 }}
                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-emerald-500/20"
               />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full">
              <div className="relative">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-emerald-500/10 to-emerald-900/30 border border-emerald-500/20 flex items-center justify-center text-3xl shadow-2xl">
                  {incomingCall.senderName?.[0] || '👤'}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-emerald-950 shadow-xl animate-bounce">
                  <Phone size={18} />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight">{incomingCall.senderName}</h3>
                <p className="text-emerald-500 font-bold uppercase tracking-[0.3em] text-[10px]">Secure Channel Incoming</p>
              </div>
              <div className="flex items-center gap-6 mt-2">
                <button onClick={() => setIncomingCall(null)} className="w-14 h-14 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center group shadow-lg"><Phone size={24} className="rotate-[135deg] group-hover:scale-110 transition-transform" /></button>
                <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center shadow-2xl shadow-emerald-500/30 transition-all hover:scale-110 active:scale-95 animate-pulse"><Phone size={28} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CALL UI MODAL (Telegram Style) */}
      <AnimatePresence>
        {isCalling && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            {/* AMBIENT BACKGROUND BLUR */}
            <div className="absolute inset-0 opacity-40">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-900/20 via-black to-blue-900/10" />
               <motion.div 
                 animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                 transition={{ duration: 10, repeat: Infinity }}
                 className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.15),transparent_70%)]" 
               />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-12 px-6 max-w-4xl mx-auto">
              {/* CENTERED AVATAR (STOWED WHEN ACTIVE) */}
              {!remoteStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-8"
                  >
                    <div className="relative">
                      <motion.div 
                        animate={callStatus !== 'active' ? { scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] } : {}}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="absolute inset-0 rounded-full bg-emerald-500/10 blur-3xl -z-10"
                      />
                      <div className="w-40 h-40 rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-center text-6xl shadow-3xl backdrop-blur-xl">
                        {selectedContact?.avatar || (incomingCall?.senderName?.[0] || '👤')}
                      </div>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-4 border-2 border-dashed border-emerald-500/20 rounded-[3.5rem]"
                      />
                    </div>

                    <div className="text-center space-y-2">
                      <h2 className="text-4xl font-black tracking-tight text-white">
                        {selectedContact?.name || incomingCall?.senderName || 'Justice Member'}
                      </h2>
                      <div className="text-xs font-bold text-emerald-500/50 uppercase tracking-[0.4em] h-6 flex items-center justify-center gap-3">
                        {callStatus === 'dialing' ? (
                          <>
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>Establishing Secure Link</motion.span>
                            <span className="flex gap-1">
                              {[0,1,2].map(i => <motion.div key={i} animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: i*0.2 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />)}
                            </span>
                          </>
                        ) : 'Authenticating...'}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* MEDIA VIEW (SIDE-BY-SIDE SPLIT SCREEN) */}
              <div className="flex-1 w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center min-h-0 relative my-12">
                {/* LOCAL FEED */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="w-full aspect-video md:h-full max-h-[60vh] rounded-[2.5rem] overflow-hidden bg-black/60 border border-white/5 shadow-2xl relative"
                >
                  <video 
                    id="local-video-el"
                    ref={setLocalVideo}
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover -scale-x-100"
                  />
                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     <span className="text-[9px] font-black uppercase text-white tracking-widest">Local Node (You)</span>
                  </div>
                  {isVideoOff && (
                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3">
                       <VideoOff size={32} className="text-white/20" />
                       <p className="text-[10px] text-white/20 font-black tracking-widest uppercase">Video Disabled</p>
                    </div>
                  )}
                </motion.div>

                {/* REMOTE FEED */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="w-full aspect-video md:h-full max-h-[60vh] rounded-[2.5rem] overflow-hidden bg-black/60 border border-white/5 shadow-2xl relative"
                >
                  {remoteStream ? (
                    <video 
                      id="remote-video-el"
                      ref={setRemoteVideo}
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-10">
                       <VideoOff size={40} className="text-white" />
                       <p className="text-[9px] font-black uppercase tracking-[0.2em]">Synchronizing Waveform</p>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     <span className="text-[9px] font-black uppercase text-white tracking-widest">
                       {selectedContact?.name || incomingCall?.senderName || 'Justice Member'}
                     </span>
                  </div>
                </motion.div>
              </div>

              {/* FLOATING CONTROLS BAR */}
              <div className="w-full flex flex-col items-center pt-8 pb-4">
                <div className="flex items-center gap-4 px-8 py-4 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl">
                  <button 
                    onClick={() => setIsMuted(!isMuted)} 
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isMuted ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>

                  <button 
                    onClick={stopMedia} 
                    className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center group hover:bg-red-500 active:scale-95 transition-all shadow-xl shadow-red-600/30"
                    title="End Call"
                  >
                    <Phone size={28} className="rotate-[135deg] text-white" />
                  </button>

                  <button 
                    onClick={() => setIsVideoOff(!isVideoOff)} 
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                  </button>
                </div>
                
                <p className="mt-6 text-[8px] font-black uppercase tracking-[0.3em] text-white/10">Judicial Communication Protocol Active</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 8.5rem)' }}>
        {/* Contacts Sidebar */}
        <aside className="w-80 xl:w-96 flex flex-col border-r border-emerald-500/10 card-bg shrink-0">
          <div className="p-5 border-b border-emerald-500/10">
            <h2 className="text-base font-black tracking-tight page-text mb-4 text-secondary">Judicial Channels</h2>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text" placeholder="Search..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-sm outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {filteredContacts.map(contact => (
              <button
                key={contact.id} 
                onClick={() => {
                  setSelectedContact(contact);
                  setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unreadCount: 0 } : c));
                  
                  const unreadMsgs = (messagesRef.current[contact.id] || []).filter(m => !m.isSelf && m.status !== 'read');
                  if (unreadMsgs.length > 0 && socketRef.current) {
                    socketRef.current.send(JSON.stringify({
                      type: 'mark_read',
                      messageIds: unreadMsgs.map(m => m.id),
                      senderId: contact.id
                    }));
                  }
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-emerald-500/5 transition-all text-left ${selectedContact?.id === contact.id ? 'bg-emerald-500/10 border-r-2 border-emerald-400' : ''}`}
              >
                <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">{contact.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm truncate">{contact.name}</span>
                    {contact.unreadCount > 0 && <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center shadow-[0_0_10px_rgba(16,185,129,0.4)]">{contact.unreadCount}</span>}
                  </div>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">{contact.role}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Panel */}
        {selectedContact ? (
          <div className="flex-1 flex flex-col min-w-0 relative">
            <div className="h-16 px-6 flex items-center justify-between border-b border-emerald-500/10 card-bg shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">{selectedContact.avatar}</div>
                <div>
                  <p className="font-black text-sm">{selectedContact.name}</p>
                  <p className="text-[10px] text-muted font-bold text-emerald-400/80">CHANNEL ESTABLISHED</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => initiateCall('voice')} className="w-10 h-10 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 transition-all"><Phone size={18}/></button>
                <button onClick={() => initiateCall('video')} className="w-10 h-10 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 transition-all"><Video size={18}/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hide">
              {currentThread.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`max-w-[75%] flex flex-col gap-1.5 ${msg.isSelf ? 'items-end' : 'items-start'} relative`}>
                    
                    {/* ENHANCED BUBBLE */}
                    <div className={`
                      group/bubble relative
                      rounded-2xl px-5 py-3.5 text-sm shadow-xl transition-all duration-300
                      ${msg.isSelf 
                        ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-br-none shadow-emerald-900/40 hover:shadow-emerald-500/30' 
                        : 'bg-gradient-to-br from-white/10 to-white/5 border border-emerald-500/20 page-text rounded-bl-none shadow-black/20 hover:border-emerald-500/40'
                      }
                    `}>
                      {editingId === msg.id ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <textarea 
                            value={editBuffer} 
                            onChange={(e) => setEditBuffer(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-emerald-400 min-h-[60px]"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingId(null)} className="p-1 hover:text-red-400"><X size={14}/></button>
                            <button onClick={() => saveEdit(msg.id)} className="p-1 hover:text-emerald-400 font-bold text-[10px]">SAVE</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                          {msg.attachments?.map((att: any) => (
                            <a key={att.id} href={att.url} target="_blank" className="mt-3 flex items-center gap-3 p-2.5 rounded-xl bg-black/20 border border-white/5 text-xs hover:bg-black/30 transition-all">
                              {fileIcon(att.type)} <span className="flex-1 truncate font-medium">{att.name}</span>
                              <Download size={14} className="opacity-40" />
                            </a>
                          ))}
                        </>
                      )}

                      {/* GLASSMORPHIC ACTION MENU (Positioned Outside) */}
                      <div className={`
                        absolute top-0 ${msg.isSelf ? '-left-11' : '-right-11'} 
                        opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 flex flex-col gap-1 p-1
                      `}>
                         <button 
                          onClick={() => setModalConfig({
                            isOpen: true,
                            type: 'security',
                            title: 'Secure Message Integrity',
                            message: `🔓 CHANNEL: SECURE JUDICIAL UPLINK\n🆔 MSG ID: ${msg.id.substring(0, 12)}...\n🔐 ENCRYPTION: AES-256-GCM\n📡 STATUS: ${msg.status.toUpperCase()}\n✅ INTEGRITY: SIGNED & VALIDATED`,
                            confirmLabel: 'CLOSE AUDIT'
                          })}
                          className="w-8 h-8 bg-black/40 backdrop-blur-md hover:bg-white/20 rounded-xl flex items-center justify-center text-emerald-400 border border-white/10 transition-colors shadow-xl" 
                          title="Message Info"
                        >
                          <ShieldCheck size={14} />
                        </button>
                        {msg.isSelf && (
                          <>
                            <button 
                              onClick={() => { setEditingId(msg.id); setEditBuffer(msg.content); }}
                              className="w-8 h-8 bg-black/40 backdrop-blur-md hover:bg-blue-500/40 rounded-xl flex items-center justify-center text-blue-400 border border-white/10 transition-colors shadow-xl" 
                              title="Edit Message"
                            >
                              <Send size={14} className="rotate-[-45deg]" />
                            </button>
                            <button 
                              onClick={() => deleteMsg(msg.id, selectedContact.id)}
                              className="w-8 h-8 bg-black/40 backdrop-blur-md hover:bg-red-500/40 rounded-xl flex items-center justify-center text-red-100 border border-white/10 transition-colors shadow-xl" 
                              title="Delete Message"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-1 text-[10px] font-bold tracking-tight opacity-50">
                      <span>{msg.timestamp}</span>
                      {msg.isSelf && <span className="flex items-center">{statusIcon(msg.status)}</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-6 py-4 border-t border-emerald-500/10 card-bg">
              <div className="flex gap-2 mb-3 flex-wrap">
                {pendingFiles.map(f => (
                  <div key={f.id} className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2 border border-emerald-500/20 transition-all hover:bg-emerald-500/30">
                    <Paperclip size={10} /> {f.name} <X size={10} className="cursor-pointer" onClick={() => setPendingFiles(prev => prev.filter(p => p.id !== f.id))}/>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-5 py-3.5 shadow-inner">
                <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileSelect} />
                <button onClick={() => fileInputRef.current?.click()} className="text-emerald-400/60 hover:text-emerald-400 transition-colors"><Paperclip size={22} /></button>
                <input
                  type="text" placeholder={`Write a secure message to ${selectedContact.name}...`}
                  value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder-emerald-500/30"
                />
                <button onClick={sendMessage} className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20 transform hover:scale-105 active:scale-95"><Send size={20} className="text-emerald-950" /></button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-30">
            <MessageSquare size={64} className="mb-4" />
            <h3 className="text-lg font-black">Judicial Messaging</h3>
            <p className="text-xs max-w-xs">Select a verified participant to begin a secure conversation.</p>
          </div>
        )}
      </div>
      <Modal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmLabel={modalConfig.confirmLabel}
        cancelLabel={modalConfig.cancelLabel}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
    </RequireAccess>
  );
}
