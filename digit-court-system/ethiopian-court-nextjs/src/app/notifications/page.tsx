'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {  
  Bell, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Gavel, 
  Calendar,
  Settings,
  LogOut,
  User,
  LayoutDashboard,
  Briefcase,
  Video,
  Users,
  BarChart3,
  FileText,
  ChevronRight,
  Trash2,
  Shield
 } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import RequireAccess from '@/components/RequireAccess';

interface Notification {
  id: string;
  type: 'system' | 'hearing' | 'case' | 'message' | 'security';
  title: string;
  message: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
}

import { useNotifications } from '@/context/NotificationContext';

export default function Notifications() {
  const [currentUser, setCurrentUser] = useState('User');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { notifications: liveNotifications, markAsRead: markLiveAsRead, markAllAsRead, unreadCount: liveUnreadCount } = useNotifications();
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('courtUser');
    const token = localStorage.getItem('courtToken');
    
    if (userStr && userStr !== 'undefined') {
      try {
        const userData = JSON.parse(userStr);
        setCurrentUser(userData.name || 'User');
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }

    const fetchNotifications = async () => {
       try {
          const res = await fetch('http://localhost:5173/api/notifications', {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
             setDbNotifications(data.data);
          }
       } catch (err) {
          console.error('Failed to sync notifications');
       }
    };

    if (token) {
       fetchNotifications();
       const interval = setInterval(fetchNotifications, 10000);
       return () => clearInterval(interval);
    }
  }, []);

  const handleMarkAsRead = (id: string, isLive: boolean) => {
    if (isLive) {
      markLiveAsRead(id);
    } else {
      setDbNotifications(dbNotifications.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const deleteNotification = (id: string) => {
    setDbNotifications(dbNotifications.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    markAllAsRead();
    setDbNotifications(dbNotifications.map(n => ({...n, read: true})));
  };

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  if (!mounted) return null;

  const allNotifications = [...liveNotifications, ...dbNotifications].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const totalUnread = liveUnreadCount + dbNotifications.filter(n => !n.read).length;

  return (
    <RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK', 'LAWYER', 'PLAINTIFF', 'DEFENDANT', 'USER']}>
    <div className="min-h-screen page-bg">
      <Header />
      <Navigation />

      <main className="container mx-auto py-12 px-6">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar Nav */}
          <div className="w-full md:w-80 shrink-0 space-y-4">
            <div className="p-8 card-bg rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-500/10">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-950 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-950/20">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black page-text tracking-tight">Judicial Alerts</h2>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Notification Hub</p>
                  </div>
               </div>

                <nav className="space-y-2">
                  <div className="p-4 rounded-2xl bg-emerald-500/5 text-secondary border border-emerald-500/10">
                    <p className="text-xs font-bold leading-relaxed">Filter and manage your judicial broadcasts from this central hub.</p>
                  </div>
                </nav>
            </div>
            
            <div className="p-8 bg-emerald-950 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 blur-2xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
               <Shield size={40} className="text-emerald-400 mb-6 opacity-80" />
               <h3 className="text-lg font-black mb-2 leading-tight">Institutional Shield</h3>
               <p className="text-xs text-emerald-100/60 leading-relaxed font-medium">All communications are encrypted and audited per Federal Judicial Polices.</p>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 space-y-6">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                   <h1 className="text-5xl font-black page-text tracking-tighter">Broadcasts</h1>
                   <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {totalUnread} Unread
                   </div>
                </div>
                <button 
                  onClick={handleClearAll}
                  className="px-8 py-3 bg-emerald-500/5 border-2 border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-950 hover:text-white transition-all shadow-xl shadow-emerald-950/5 page-text"
                >
                  Clear All Alerts
                </button>
             </div>

             <AnimatePresence mode="popLayout">
                {allNotifications.length > 0 ? (
                   allNotifications.map((notif, idx) => (
                    <motion.div 
                      key={notif.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`relative p-8 rounded-[3rem] border-2 transition-all group ${notif.read ? 'card-bg border-emerald-500/10 opacity-60' : 'card-bg border-emerald-500 shadow-2xl shadow-emerald-950/10'}`}
                    >
                      <div className="flex items-start gap-8">
                         <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 ${
                           notif.type === 'hearing' ? 'bg-amber-500/10 text-amber-500' :
                           notif.type === 'message' ? 'bg-blue-500/10 text-blue-500' :
                           notif.type === 'security' ? 'bg-red-500/10 text-red-500' :
                           'bg-emerald-500/10 text-emerald-500'
                         }`}>
                           {notif.type === 'hearing' ? <Gavel size={24} /> :
                            notif.type === 'message' ? <MessageSquare size={24} /> :
                            notif.type === 'security' ? <Shield size={24} /> :
                            <Bell size={24} />}
                         </div>
                         
                         <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-3">
                                  <h3 className="text-xl font-black page-text tracking-tight">{notif.title}</h3>
                                  {notif.priority === 'high' && (
                                    <span className="px-3 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-tighter rounded-full">CRITICAL</span>
                                  )}
                               </div>
                               <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                                 {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                            </div>
                            <p className="text-secondary font-medium leading-relaxed mb-6">{notif.message}</p>
                            
                            <div className="flex items-center gap-4">
                               {!notif.read && (
                                 <button 
                                   onClick={() => handleMarkAsRead(notif.id, liveNotifications.some(ln => ln.id === notif.id))}
                                   className="px-6 py-2 bg-emerald-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-800 transition-all"
                                 >
                                   Acknowledge
                                 </button>
                               )}
                               <button 
                                 onClick={() => deleteNotification(notif.id)}
                                 className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                 <Trash2 size={16} />
                               </button>
                            </div>
                         </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                   <div className="p-20 text-center card-bg border-2 border-dashed border-emerald-500/20 rounded-[4rem]">
                      <div className="w-24 h-24 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">😴</div>
                      <h2 className="text-3xl font-black page-text mb-2 tracking-tight">Radio Silence</h2>
                      <p className="text-muted font-medium italic">All institutional channels are currently clear.</p>
                   </div>
                )}
             </AnimatePresence>
          </div>
        </div>
      </main>
      
      {/* Background Accents */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-400/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-emerald-600/5 blur-[100px] rounded-full"></div>
      </div>
    </div>
    </RequireAccess>
  );
}
