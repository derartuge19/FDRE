'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import { 
  Calendar, 
  Search, 
  Plus, 
  Filter, 
  MapPin, 
  Users, 
  Clock, 
  Gavel, 
  ChevronRight, 
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  ArrowRight,
  User,
  Settings,
  LogOut,
  Bell,
  Briefcase,
  FileText,
  Video,
  BarChart3,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';
import RequireAccess from '@/components/RequireAccess';

interface ScheduleEntry {
  id: string;
  caseNumber: string;
  caseTitle: string;
  judge: string;
  room: string;
  date: string;
  time: string;
  duration: string;
  status: 'scheduled' | 'priority' | 'tentative' | 'conflict';
  type: 'Mechanical' | 'Digital' | 'Full Bench' | 'Chamber';
}

export default function MasterSchedule() {
  const [currentUser, setCurrentUser] = useState('Loading...');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [availableRooms] = useState(['Room 101', 'Room 102', 'Grand Hall', 'Virtual Chamber A', 'Digital Room 4']);
  const [judges] = useState(['Judge Alemu Bekele', 'Judge Tesfaye G.', 'Judge Meron H.', 'Presiding Judge']);

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('courtUser');
    const token = localStorage.getItem('courtToken');
    
    if (userStr && userStr !== 'undefined') {
      try {
        const userData = JSON.parse(userStr);
        setCurrentUser(userData.name || 'Court Admin');
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }

    const mockEntries: ScheduleEntry[] = [
      { id: 'SCH-101', caseNumber: 'CASE-2026-004', caseTitle: 'Institutional Trust vs. Central Registry', judge: 'Judge Alemu Bekele', room: 'Room 101', date: filterDate, time: '09:00', duration: '2h', status: 'priority', type: 'Full Bench' },
      { id: 'SCH-102', caseNumber: 'CASE-2026-012', caseTitle: 'Property Dispute: Arada District', judge: 'Judge Tesfaye G.', room: 'Room 102', date: filterDate, time: '10:30', duration: '1h', status: 'scheduled', type: 'Mechanical' },
      { id: 'SCH-103', caseNumber: 'CASE-2026-044', caseTitle: 'Labor Dispute: Textile Federation', judge: 'Judge Meron H.', room: 'Virtual Chamber A', date: filterDate, time: '13:00', duration: '1.5h', status: 'priority', type: 'Digital' },
      { id: 'SCH-104', caseNumber: 'CASE-2026-089', caseTitle: 'Contractual Violation: Tech Hub', judge: 'Presiding Judge', room: 'Digital Room 4', date: filterDate, time: '15:00', duration: '3h', status: 'conflict', type: 'Chamber' }
    ];
    setEntries(mockEntries);
  }, [filterDate]);

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  const publishSchedule = () => {
    setIsSyncing(true);
    setTimeout(() => {
        setIsSyncing(false);
        setModalConfig({
            isOpen: true,
            title: 'Master Schedule Published',
            message: 'All judicial officers and legal representatives have been notified of the weekly schedule updates via secure broadcast.',
            type: 'success'
        });
    }, 2000);
  };

  const handleResolveStack = () => {
    setModalConfig({
      isOpen: true,
      title: 'Conflicts Resolved',
      message: 'The scheduling engine has automatically reassigned overlapping judicial sessions to optimized time blocks.',
      type: 'success'
    });
  };

  const handleAllocateNew = () => {
    setModalConfig({
      isOpen: true,
      title: 'New Allocation Portal',
      message: 'Opening the docket allocation interface for new judicial proceedings.',
      type: 'info'
    });
  };

  const handleRowAction = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Session Management',
      message: `Accessing administrative options for docket item ${id}.`,
      type: 'info'
    });
  };

  if (!mounted) return null;

  return (
    <RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE']}>
    <div className="min-h-screen page-bg page-text">
      <Header />

      <Navigation />

      <main className="py-12 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-16">
            <div>
              <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest mb-4">
                <Calendar size={16} /> Judicial Operations / Scheduling
              </div>
              <h1 className="text-6xl font-black page-text tracking-tighter mb-4 leading-none uppercase">Orchestration Hub</h1>
              <p className="text-secondary font-bold text-lg max-w-2xl leading-relaxed uppercase opacity-80">Synchronize judges, courtrooms, and proceedings across the federal jurisdiction.</p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={publishSchedule}
                disabled={isSyncing}
                className="flex items-center gap-3 px-12 py-6 bg-emerald-950 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-emerald-900 transition-all relative overflow-hidden"
              >
                {isSyncing ? (
                    <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                ) : <CheckCircle2 size={20} className="text-emerald-400" />}
                <span>{isSyncing ? 'Synchronizing...' : 'Propagate Schedule'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
             <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-inner"><Gavel /></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Judges Deployed</p>
                <p className="text-4xl font-black text-gray-900 tracking-tighter">14 / 20</p>
             </div>
             <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 shadow-inner"><MapPin /></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Room Occupancy</p>
                <p className="text-4xl font-black text-gray-900 tracking-tighter">82%</p>
             </div>
             <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 flex flex-col items-center">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6 shadow-inner"><AlertTriangle /></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Conflict Alerts</p>
                <p className="text-4xl font-black text-gray-900 tracking-tighter">3 Active</p>
             </div>
             <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 flex flex-col items-center">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 shadow-inner"><Clock /></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Avg. Session</p>
                <p className="text-4xl font-black text-gray-900 tracking-tighter">1.4 hrs</p>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl shadow-emerald-950/10 border border-emerald-50/50 overflow-hidden">
             <div className="flex flex-wrap items-center justify-between gap-6 mb-12 px-4">
                <div className="flex items-center gap-4">
                   <div className="flex bg-gray-50 border-2 border-gray-100 rounded-2xl overflow-hidden shadow-inner">
                      <input 
                        type="date" 
                        value={filterDate} 
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-transparent border-none outline-none px-6 py-4 font-bold text-gray-700" 
                      />
                   </div>
                   <button className="p-4 bg-emerald-950 text-white rounded-2xl shadow-xl hover:bg-emerald-900 transition-all"><Filter size={20}/></button>
                </div>
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirmed</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conflict</span>
                   </div>
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-gray-100 uppercase">
                         {['Temporal Sync', 'Judicial Lead', 'Location Matrix', 'Docket Item', 'Session Protocol', 'Status'].map(th => (
                            <th key={th} className="px-8 py-6 text-[10px] font-black text-gray-400 tracking-[0.2em]">{th}</th>
                         ))}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {entries.map((entry) => (
                         <tr key={entry.id} className="group hover:bg-emerald-50/30 transition-all">
                            <td className="px-8 py-10">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-xs shadow-inner shadow-emerald-950/5 font-mono">{entry.time}</div>
                                  <div>
                                     <p className="text-xs font-black text-gray-900">{entry.duration}</p>
                                     <p className="text-[9px] font-bold text-gray-400 uppercase">Payload Time</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-10">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-950 text-white flex items-center justify-center text-xs font-black">{(entry.judge.split(' ').slice(-1)[0] || 'J')[0]}</div>
                                  <span className="text-sm font-black text-gray-800">{entry.judge}</span>
                               </div>
                            </td>
                            <td className="px-8 py-10">
                               <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                  <MapPin size={14} className="text-blue-500" /> {entry.room}
                               </div>
                            </td>
                            <td className="px-8 py-10">
                               <div>
                                  <p className="text-xs font-black text-gray-900 group-hover:text-emerald-950 transition-colors">{entry.caseTitle}</p>
                                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">{entry.caseNumber}</p>
                               </div>
                            </td>
                            <td className="px-8 py-10">
                               <span className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest">{entry.type} Stage</span>
                            </td>
                            <td className="px-8 py-10">
                               <div className="flex items-center gap-6">
                                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                    entry.status === 'priority' ? 'bg-blue-600 text-white' :
                                    entry.status === 'conflict' ? 'bg-red-500 text-white animate-pulse' :
                                    'bg-emerald-100 text-emerald-700'
                                  }`}>{entry.status}</div>
                                  <button onClick={() => handleRowAction(entry.id)} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-emerald-950 hover:text-white transition-all shadow-sm"><MoreVertical size={16}/></button>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             <div className="p-10 border-t border-gray-50 mt-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-4 p-6 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 flex-1 w-full md:w-auto">
                   <div className="w-14 h-14 bg-white rounded-[1.5rem] flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-950/5"><AlertTriangle /></div>
                   <div>
                      <p className="text-xs font-black text-emerald-950 uppercase tracking-widest">Neural Conflict Detection</p>
                      <p className="text-[10px] font-bold text-emerald-700/60 uppercase max-w-sm">System has identified 2 overlapping judge assignments for the upcoming diurnal cycle.</p>
                   </div>
                   <button onClick={handleResolveStack} className="ml-auto px-8 py-3 bg-emerald-950 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all">Resolve Stack</button>
                </div>
                
                <div className="flex gap-4">
                   <button className="px-10 py-4 text-emerald-950 font-black text-xs uppercase tracking-widest hover:bg-emerald-50 rounded-2xl transition-all">Clear Canvas</button>
                   <button onClick={handleAllocateNew} className="px-12 py-4 bg-emerald-950 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-emerald-800 transition-all flex items-center gap-2">Allocate New <ArrowRight size={14} /></button>
                </div>
             </div>
          </div>
        </div>
      </main>

      <footer className="py-24 text-center opacity-30 select-none pointer-events-none">
         <p className="text-[9px] font-black uppercase tracking-[1em] text-emerald-950">AUTHENTICATED JUDICIAL OVERLAY // MASTER DOCKET // FDRE DISTRICT 7</p>
      </footer>

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

