'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import {  
  BarChart3, 
  Search, 
  Download, 
  Calendar, 
  Filter, 
  FileText, 
  TrendingUp, 
  PieChart, 
  Clock, 
  Share2, 
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Zap,
  ShieldCheck,
  Settings,
  LogOut,
  Bell,
  Gavel,
  Briefcase,
  LayoutDashboard,
  Video,
  Users,
  MessageSquare,
  User,
  Save
 } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import RequireAccess from '@/components/RequireAccess';

interface Report {
  id: string;
  title: string;
  type: 'case_analytics' | 'user_activity' | 'court_performance' | 'financial' | 'custom';
  status: 'ready' | 'generating' | 'scheduled';
  generatedDate: string;
  period: string;
  size: string;
}

export default function Reports() {
  const [currentUser, setCurrentUser] = useState('Loading...');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [reports, setReports] = useState<Report[]>([]);
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

    const fetchData = async () => {
      try {
        // Fetch Live Reports & Analytics
        const analyticsRes = await fetch('http://localhost:5173/api/reports/analytics/comprehensive', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const analyticsData = await analyticsRes.json();

        // Fetch Audit Logs for Report generation
        const logsRes = await fetch('http://localhost:5173/api/system/audit-logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const logsData = await logsRes.json();

        if (analyticsData.success && logsData.success) {
           const liveReports: Report[] = [
             { id: 'AN-001', title: 'Institutional Case Volume Analysis', type: 'case_analytics', status: 'ready', generatedDate: new Date().toISOString().split('T')[0], period: 'March 2026', size: '2.4 MB' },
             { id: 'AN-002', title: 'Judicial Workload & Efficiency Report', type: 'court_performance', status: 'ready', generatedDate: new Date().toISOString().split('T')[0], period: 'Current Month', size: '1.2 MB' },
             { id: 'AU-001', title: `System-Wide Activity Log (${logsData.data.length} Entries)`, type: 'user_activity', status: 'ready', generatedDate: new Date().toISOString().split('T')[0], period: 'Last 24 Hours', size: '856 KB' }
           ];
           setReports(liveReports);
        }
      } catch (err) {
        console.error('Failed to sync judicial reporting engine:', err);
      }
    };

    if (token) fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  const filteredReports = reports.filter(r => filterType === 'all' || r.type === filterType);

  if (!mounted) return null;

  return (
    <RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK']}>
    <div className="min-h-screen page-bg page-text">
      {/* Header */}
      <Header />

      {/* Navigation */}
      <Navigation />

      <main className="main-container py-10 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-3">
                <span className="bg-emerald-500/10 px-2 py-1 rounded">Analytics</span>
                <span>/</span>
                <span>Operational Intelligence</span>
              </div>
              <h1 className="text-5xl font-black page-text tracking-tighter mb-2">Court Insights</h1>
              <p className="text-secondary font-medium text-lg">Statistical distributions, efficiency metrics, and executive judicial summaries.</p>
            </div>
            <div className="flex gap-4">
               <button className="flex items-center gap-3 px-8 py-5 card-bg border-2 border-emerald-500/10 page-text rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-500/5 transition-all shadow-xl">
                  <Calendar size={20} className="text-emerald-500" /> Schedule Data Task
               </button>
               <button className="flex items-center gap-3 px-10 py-5 bg-emerald-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-emerald-900 transition-all">
                  <PieChart size={20} className="text-emerald-400" /> Synthesize Report
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
             {[
               { label: 'Case Disposal Rate', value: '84.2%', icon: <Zap />, trend: '+5.2%', color: 'emerald' },
               { label: 'Resolution Latency', value: '18 Days', icon: <Clock />, trend: '-2.1%', color: 'blue' },
               { label: 'Resource Utilization', value: '92.8%', icon: <ShieldCheck />, trend: '+0.5%', color: 'purple' }
             ].map((card, idx) => (
               <motion.div key={card.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className="card-bg p-10 rounded-[3rem] border border-emerald-500/10 shadow-2xl shadow-emerald-950/5 overflow-hidden relative group hover:border-emerald-500 transition-all">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-${card.color}-500/5 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform`}></div>
                  <div className={`w-14 h-14 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-2xl text-${card.color}-500 mb-6 shadow-inner`}>{card.icon}</div>
                  <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">{card.label}</p>
                  <div className="flex items-end gap-3">
                     <span className="text-4xl font-black page-text tracking-tighter">{card.value}</span>
                     <span className={`text-xs font-bold mb-1 ${card.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{card.trend}</span>
                  </div>
               </motion.div>
             ))}
          </div>

          <div className="card-bg p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-500/10 mb-10 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-500" size={20} />
               <input 
                 type="text" 
                 placeholder="Search by Report Title, Generated ID, or Period Tag..."
                 className="w-full pl-16 pr-8 py-5 bg-emerald-500/5 border-2 border-transparent focus:border-emerald-500 focus:bg-transparent outline-none rounded-2xl transition-all font-bold page-text shadow-inner placeholder:text-muted"
               />
            </div>
             <div className="flex items-center gap-3">
               <select 
                 value={filterType}
                 onChange={(e) => setFilterType(e.target.value)}
                 className="px-6 py-5 bg-emerald-500/5 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-secondary outline-none cursor-pointer appearance-none shadow-inner"
               >
                 <option value="all">Every Report Type</option>
                 <option value="case_analytics">Judicial Analytics</option>
                 <option value="financial">Financial Audits</option>
                 <option value="performance">KPU Metrics</option>
               </select>
               <button className="p-5 bg-emerald-950 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg"><Filter size={20} /></button>
            </div>
          </div>

          <div className="space-y-6">
             <AnimatePresence>
             {filteredReports.map((report, idx) => (
               <motion.div 
                 key={report.id}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: idx * 0.05 }}
                 className="card-bg p-6 rounded-[2.5rem] border border-emerald-500/10 shadow-2xl shadow-emerald-950/5 hover:border-emerald-500 transition-all group flex flex-wrap items-center gap-8"
               >
                  <div className="w-20 h-20 bg-emerald-500/5 rounded-[2rem] flex items-center justify-center text-3xl text-emerald-500 shadow-inner group-hover:scale-105 transition-transform">
                     {report.type === 'financial' ? <BarChart3 /> : report.type === 'user_activity' ? <UsersIcon /> : <FileText />}
                  </div>
                  
                  <div className="flex-1 min-w-[200px]">
                     <h4 className="text-xl font-black page-text tracking-tight mb-1 group-hover:text-emerald-500 transition-colors uppercase">{report.title}</h4>
                     <div className="flex items-center gap-4 text-[10px] font-black text-muted uppercase tracking-widest">
                        <span className="text-emerald-500 px-2 py-0.5 bg-emerald-500/10 rounded">{report.type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Period: {report.period}</span>
                     </div>
                  </div>

                  <div className="hidden lg:flex flex-col items-center">
                     <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Generated</span>
                     <span className="text-sm font-bold page-text">{report.generatedDate}</span>
                  </div>

                  <div className="hidden lg:flex flex-col items-center">
                     <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Status</span>
                     <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                       report.status === 'ready' ? 'bg-emerald-500/10 text-emerald-500' : 
                       report.status === 'generating' ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
                       'bg-blue-500/10 text-blue-500'
                     }`}>
                        {report.status}
                     </span>
                  </div>

                  <div className="flex items-center gap-3">
                     <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-500/5 text-muted hover:bg-emerald-950 hover:text-white transition-all shadow-sm"><RefreshCw size={20} /></button>
                     <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-500/5 text-muted hover:bg-emerald-950 hover:text-white transition-all shadow-sm"><Share2 size={20} /></button>
                     <div className="w-px h-10 bg-emerald-500/10 mx-2"></div>
                     <button className="px-8 py-4 bg-emerald-950 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-lg hover:bg-emerald-800 transition-all flex items-center gap-2">
                        <Download size={16} className="text-emerald-400" /> Export
                     </button>
                  </div>
               </motion.div>
             ))}
             </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
    </RequireAccess>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  );
}
