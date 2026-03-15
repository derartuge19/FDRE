'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Search, 
  Plus, 
  Filter, 
  Video, 
  Clock, 
  MapPin, 
  Gavel, 
  Users, 
  ChevronRight, 
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Settings,
  LogOut,
  Bell,
  Briefcase,
  FileText,
  BarChart3,
  MessageSquare,
  User,
  Save
} from 'lucide-react';

interface Hearing {
  id: string;
  hearingNumber: string;
  caseNumber: string;
  caseTitle: string;
  type: 'initial' | 'follow_up' | 'final' | 'emergency';
  date: string;
  time: string;
  duration: string;
  judge: string;
  courtroom: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  isVirtual: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function Hearings() {
  const [currentUser, setCurrentUser] = useState('Loading...');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('courtUser');
    const token = localStorage.getItem('courtToken');
    
    if (userStr) {
      const userData = JSON.parse(userStr);
      setCurrentUser(userData.name || 'User');
    }

    const fetchHearings = async () => {
       try {
          const response = await fetch('http://localhost:5173/api/hearings', {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) {
             setHearings(data.data.map((h: any) => {
                const dateParts = (h.date || '').split('T');
                return {
                  id: h.id || `H-${Math.random().toString(36).substr(2, 9)}`,
                  hearingNumber: h.id || 'N/A',
                  caseNumber: h.caseId || 'N/A',
                  caseTitle: h.title || 'Untitled Case',
                  type: 'initial',
                  date: dateParts[0] || 'TBD',
                  time: dateParts[1] ? dateParts[1].substring(0, 5) : '00:00',
                  duration: h.duration || '1h',
                  judge: h.participants?.[0] || 'Unassigned',
                  courtroom: h.type === 'Virtual' ? 'Digital Room' : 'Courtroom 1',
                  status: (h.status || 'scheduled').toLowerCase(),
                  isVirtual: h.type === 'Virtual',
                  priority: 'medium'
                };
             }));
          }
       } catch (err) {
          console.error('Failed to fetch hearings:', err);
       }
    };

    if (token) fetchHearings();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  const filteredHearings = hearings.filter(h => 
    h.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(h => filterStatus === 'all' || h.status === filterStatus);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      <header className="header sticky top-0 z-[100] bg-emerald-950 border-b border-emerald-900 shadow-xl overflow-visible">
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
              <ThemeToggle />
              <Link href="/notifications" className="relative w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all">
                <Bell size={20} className="text-white" />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-emerald-950"></span>
              </Link>
              
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all">
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

      <nav className="nav-container sticky top-20 z-[90] bg-[#14532d] overflow-x-auto shadow-md">
        <div className="container mx-auto flex items-center h-16 px-6 gap-2">
          {[
            { label: 'Dashboard', icon: <Clock size={18} />, href: '/' },
            { label: 'Cases', icon: <Briefcase size={18} />, href: '/cases' },
            { label: 'Hearings', icon: <Gavel size={18} />, href: '/hearings', active: true },
            { label: 'Documents', icon: <FileText size={18} />, href: '/documents' },
            { label: 'Virtual Hearing', icon: <Video size={18} />, href: '/virtual-hearing' },
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

      <main className="main-container py-10 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-3">
                <span className="bg-emerald-100 px-2 py-1 rounded">Judicial</span>
                <span>/</span>
                <span>Calendar Services</span>
              </div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">Hearing Orchestration</h1>
              <p className="text-gray-500 font-medium text-lg">Centralized scheduling and management of physical and virtual court proceedings.</p>
            </div>
            <div className="flex gap-4">
               <Link href="/virtual-hearing" className="flex items-center gap-3 px-8 py-5 bg-white border-2 border-gray-100 text-gray-900 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all shadow-xl">
                  <Video size={20} className="text-emerald-600" /> Start Virtual Session
               </Link>
               <button className="flex items-center gap-3 px-10 py-5 bg-emerald-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-emerald-900 transition-all">
                  <Plus size={20} className="text-emerald-400" /> Schedule Proceeding
               </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 mb-10 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500" size={20} />
               <input 
                 type="text" 
                 placeholder="Search by Case, Hearing ID, or Assigned Judge..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none rounded-2xl transition-all font-bold text-gray-800 shadow-inner"
               />
            </div>
            <div className="flex items-center gap-3">
               <select 
                 value={filterStatus}
                 onChange={(e) => setFilterStatus(e.target.value)}
                 className="px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-gray-700 outline-none appearance-none cursor-pointer shadow-inner"
               >
                 <option value="all">Every Proceeding</option>
                 <option value="scheduled">Confirmed Schedule</option>
                 <option value="in_progress">Live Transmission</option>
                 <option value="delayed">Pending Delay</option>
               </select>
               <button className="p-5 bg-gray-900 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg"><Filter size={20} /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             <AnimatePresence>
             {filteredHearings.map((hearing, idx) => (
               <motion.div 
                 key={hearing.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.05 }}
                 className="bg-white rounded-[3rem] border border-emerald-50/50 shadow-2xl shadow-emerald-950/5 overflow-hidden flex flex-col group hover:border-emerald-500 transition-all"
               >
                  <div className="p-10 flex-1">
                     <div className="flex justify-between items-start mb-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${hearing.isVirtual ? 'bg-blue-50 text-blue-500' : 'bg-翡翠-50 text-emerald-500'}`}>
                           {hearing.isVirtual ? <Video /> : <Gavel />}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             hearing.status === 'in_progress' ? 'bg-red-500 text-white animate-pulse' :
                             hearing.status === 'scheduled' ? 'bg-emerald-100 text-emerald-600' :
                             'bg-amber-100 text-amber-600'
                           }`}>{hearing.status.replace('_', ' ')}</span>
                           <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">#{hearing.hearingNumber}</span>
                        </div>
                     </div>

                     <div className="mb-8">
                        <h4 className="text-2xl font-black text-gray-900 tracking-tight line-clamp-2 mb-2 group-hover:text-emerald-950 leading-tight">{hearing.caseTitle}</h4>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-tighter">{hearing.caseNumber}</span>
                           <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                           <span className="text-xs font-bold text-gray-400 capitalize">{hearing.type.replace('_', ' ')} Stage</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                           <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                              <Calendar size={12} className="text-emerald-500" /> Date
                           </div>
                           <div className="text-sm font-bold text-gray-800">{hearing.date}</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                           <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                              <Clock size={12} className="text-emerald-500" /> Start
                           </div>
                           <div className="text-sm font-bold text-gray-800">{hearing.time}</div>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                           <MapPin size={16} className="text-gray-300" /> <span>{hearing.courtroom}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                           <Users size={16} className="text-gray-300" /> <span>{hearing.judge}</span>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                     <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-10 h-10 rounded-xl border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-500 shadow-sm relative z-[i]">P{i}</div>
                        ))}
                        <div className="w-10 h-10 rounded-xl border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 shadow-sm">+2</div>
                     </div>
                     <div className="flex items-center gap-3">
                        <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 hover:bg-emerald-950 hover:text-white transition-all shadow-sm"><MoreVertical size={20} /></button>
                        <button className="px-8 py-3.5 bg-emerald-950 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-emerald-800 transition-all flex items-center gap-2">
                           Detail <ChevronRight size={16} className="text-emerald-400" />
                        </button>
                     </div>
                  </div>
               </motion.div>
             ))}
             </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
