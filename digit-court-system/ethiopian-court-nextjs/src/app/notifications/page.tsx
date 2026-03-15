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

interface Notification {
  id: string;
  type: 'system' | 'hearing' | 'case' | 'message' | 'security';
  title: string;
  message: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
}

export default function Notifications() {
  const [currentUser, setCurrentUser] = useState('User');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('courtUser');
    const token = localStorage.getItem('courtToken');
    
    if (userStr) {
      const userData = JSON.parse(userStr);
      setCurrentUser(userData.name || 'User');
    }

    const fetchNotifications = async () => {
       try {
          const res = await fetch('http://localhost:5173/api/notifications', {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
             setNotifications(data.data);
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

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      <header className="header sticky top-0 z-[100] bg-emerald-950 border-b border-emerald-900 shadow-xl overflow-visible">
        <div className="container mx-auto">
          <div className="header-container flex items-center justify-between h-20 px-6">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-lg ring-2 ring-emerald-400 group-hover:rotate-12 transition-all">⚖️</div>
              <div className="text-white text-left">
                <div className="text-lg font-black tracking-tight leading-none mb-1">FDRE COURT SYSTEM</div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] opacity-80">Digital Administration</div>
              </div>
            </Link>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all">
                  <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-emerald-950 font-black text-xs">{currentUser[0]}</div>
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

      <main className="container mx-auto py-12 px-6">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar Nav */}
          <div className="w-full md:w-80 shrink-0 space-y-4">
            <div className="p-8 bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-950 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-950/20">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-emerald-950 tracking-tight">Judicial Alerts</h2>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Notification Hub</p>
                  </div>
               </div>

               <nav className="space-y-2">
                 {[
                   { label: 'Overview', icon: <LayoutDashboard size={18} />, href: '/' },
                   { label: 'Cases', icon: <Briefcase size={18} />, href: '/cases' },
                   { label: 'Hearings', icon: <Gavel size={18} />, href: '/hearings' },
                   { label: 'Messaging', icon: <MessageSquare size={18} />, href: '/communication' },
                   { label: 'Notifications', icon: <Bell size={18} />, href: '/notifications', active: true },
                   { label: 'Analytics', icon: <BarChart3 size={18} />, href: '/reports' }
                 ].map(item => (
                   <Link 
                     key={item.label} 
                     href={item.href} 
                     className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${item.active ? 'bg-emerald-950 text-white shadow-xl shadow-emerald-950/20' : 'text-emerald-900/60 hover:bg-emerald-50 hover:text-emerald-950'}`}
                   >
                     <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-sm font-black uppercase tracking-widest leading-none">{item.label}</span>
                     </div>
                     <ChevronRight size={14} className={`${item.active ? 'text-emerald-400' : 'text-emerald-900/20 group-hover:translate-x-1 transition-transform'}`} />
                   </Link>
                 ))}
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
                   <h1 className="text-5xl font-black text-emerald-950 tracking-tighter">Broadcasts</h1>
                   <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {notifications.filter(n => !n.read).length} Unread
                   </div>
                </div>
                <button 
                  onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                  className="px-8 py-3 bg-white border-2 border-emerald-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-950 hover:text-white transition-all shadow-xl shadow-emerald-950/5"
                >
                  Clear All Alerts
                </button>
             </div>

             <AnimatePresence mode="popLayout">
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <motion.div 
                      key={notif.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`relative p-8 rounded-[3rem] border-2 transition-all group ${notif.read ? 'bg-white border-gray-100 opacity-60' : 'bg-white border-emerald-950 shadow-2xl shadow-emerald-950/10'}`}
                    >
                      <div className="flex items-start gap-8">
                         <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 ${
                           notif.type === 'hearing' ? 'bg-amber-100 text-amber-600' :
                           notif.type === 'message' ? 'bg-blue-100 text-blue-600' :
                           notif.type === 'security' ? 'bg-red-100 text-red-600' :
                           'bg-emerald-100 text-emerald-600'
                         }`}>
                           {notif.type === 'hearing' ? <Gavel size={24} /> :
                            notif.type === 'message' ? <MessageSquare size={24} /> :
                            notif.type === 'security' ? <Shield size={24} /> :
                            <Bell size={24} />}
                         </div>
                         
                         <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-3">
                                  <h3 className="text-xl font-black text-emerald-950 tracking-tight">{notif.title}</h3>
                                  {notif.priority === 'high' && (
                                    <span className="px-3 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-tighter rounded-full">CRITICAL</span>
                                  )}
                               </div>
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{notif.timestamp}</span>
                            </div>
                            <p className="text-gray-600 font-medium leading-relaxed mb-6">{notif.message}</p>
                            
                            <div className="flex items-center gap-4">
                               {!notif.read && (
                                 <button 
                                   onClick={() => markAsRead(notif.id)}
                                   className="px-6 py-2 bg-emerald-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-800 transition-all"
                                 >
                                   Acknowledge
                                 </button>
                               )}
                               <button 
                                 onClick={() => deleteNotification(notif.id)}
                                 className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                               >
                                 <Trash2 size={16} />
                               </button>
                            </div>
                         </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-20 text-center bg-white border-2 border-dashed border-emerald-100 rounded-[4rem]">
                     <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">😴</div>
                     <h2 className="text-3xl font-black text-emerald-950 mb-2 tracking-tight">Radio Silence</h2>
                     <p className="text-gray-400 font-medium italic">All institutional channels are currently clear.</p>
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
  );
}
