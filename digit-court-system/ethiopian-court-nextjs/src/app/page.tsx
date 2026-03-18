'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import {  
  LayoutDashboard, 
  Briefcase, 
  Gavel, 
  FileText, 
  Video, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Settings,
  Bell,
  Search,
  Plus,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronRight,
  LogOut,
  Calendar,
  User,
  Save
 } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import RequireAccess from '@/components/RequireAccess';
import RoleBasedContent from '@/components/RoleBasedContent';
import RoleBasedWelcome from '@/components/RoleBasedWelcome';
import RoleBasedQuickActions from '@/components/RoleBasedQuickActions';
import { useUserRole } from '@/hooks/useUserRole';

export default function Dashboard() {
  const userRole = useUserRole();
  const [currentUser, setCurrentUser] = useState('Loading...');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [mounted, setMounted] = useState(false);

  const [stats, setStats] = useState([
    { label: 'Active Cases', value: '...', change: '+0%', icon: <Briefcase className="text-emerald-500" />, trend: 'up' },
    { label: 'Resolution Rate', value: '...', change: '+0%', icon: <Gavel className="text-amber-500" />, trend: 'up' },
    { label: 'Court Performance', value: '...', change: '+0%', icon: <TrendingUp className="text-blue-500" />, trend: 'up' },
    { label: 'Digital Adoption', value: '...', change: '+0%', icon: <TrendingUp className="text-emerald-400" />, trend: 'up' },
  ]);

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

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
        // Fetch Analytics
        const analyticsRes = await fetch('http://localhost:5173/api/reports/analytics/comprehensive', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const analyticsData = await analyticsRes.json();
        
        if (analyticsData.success) {
          const data = analyticsData.data || {};

          // Support both shapes:
          // - Old UI shape: { caseVolume: { monthly: number[] }, courtPerformance: { ... } }
          // - Gateway mock shape: { caseAnalytics: { total, closed, pending, averageResolutionDays }, performanceIndices: [...] }
          const monthly = Array.isArray(data?.caseVolume?.monthly) ? data.caseVolume.monthly : [];
          const lastMonthly = monthly.length ? monthly[monthly.length - 1] : null;

          const clearanceRate =
            typeof data?.courtPerformance?.clearanceRate === 'number'
              ? `${data.courtPerformance.clearanceRate}%`
              : (typeof data?.performanceIndices?.[0]?.value === 'string' ? data.performanceIndices[0].value : '—');

          const hearingEfficiency =
            typeof data?.courtPerformance?.hearingEfficiency === 'number'
              ? `${data.courtPerformance.hearingEfficiency}%`
              : (typeof data?.performanceIndices?.[1]?.value === 'string' ? data.performanceIndices[1].value : '—');

          const digitalAdoption =
            typeof data?.courtPerformance?.digitalAdoption === 'number'
              ? `${data.courtPerformance.digitalAdoption}%`
              : '—';

          const totalCases =
            typeof data?.caseAnalytics?.total === 'number'
              ? String(data.caseAnalytics.total)
              : (lastMonthly != null ? String(lastMonthly) : '—');

          setStats([
            { label: 'Total Cases', value: totalCases, change: '+12%', icon: <Briefcase className="text-emerald-500" />, trend: 'up' },
            { label: 'Clearance Rate', value: clearanceRate, change: '+3%', icon: <Gavel className="text-amber-500" />, trend: 'up' },
            { label: 'Efficiency', value: hearingEfficiency, change: '+2%', icon: <TrendingUp className="text-blue-500" />, trend: 'up' },
            { label: 'Digital Adoption', value: digitalAdoption, change: '+5%', icon: <TrendingUp className="text-emerald-400" />, trend: 'up' },
          ]);
        }

        // Fetch Audit Logs
        const logsRes = await fetch('http://localhost:5173/api/system/audit-logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const logsData = await logsRes.json();
        if (logsData.success) {
          setRecentActivities(logsData.data.map((log: any) => ({
            id: log.id,
            type: log.action.includes('HEARING') ? 'hearing' : 'system',
            title: log.action.replace(/_/g, ' '),
            desc: log.details,
            time: 'Just now',
            user: log.userId === 'admin-1' ? 'System' : 'Judiciary'
          })));
        }
      } catch (err) {
        console.error('Failed to synchronize dashboard:', err);
      }
    };

    if (token) fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };


  if (!mounted) return null;

  return (
    <RequireAccess>
    <div className="min-h-screen page-bg page-text">
      {/* Premium Header */}
      <Header />

      {/* Navigation Bar */}
      <Navigation />

      {/* Main Content */}
      <main className="main-container scrollbar-hide py-10 px-6">
        <div className="container mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
          >
            <div>
              <h1 className="text-5xl font-black page-text tracking-tighter mb-2">
                {userRole === 'JUDGE' && 'Judicial Dashboard'}
                {userRole === 'LAWYER' && 'Legal Practice Dashboard'}
                {userRole === 'CLERK' && 'Court Operations Dashboard'}
                {userRole === 'PLAINTIFF' && 'My Cases Dashboard'}
                {userRole === 'DEFENDANT' && 'My Cases Dashboard'}
                {(userRole === 'SYSTEM_ADMIN' || userRole === 'COURT_ADMIN') && 'Platform Overview'}
                {userRole === 'USER' && 'Dashboard'}
              </h1>
              <p className="text-secondary font-medium text-lg">
                {userRole === 'JUDGE' && 'Your assigned cases and hearing schedule.'}
                {userRole === 'LAWYER' && 'Client cases and upcoming hearings.'}
                {userRole === 'CLERK' && 'Case processing and document management.'}
                {(userRole === 'PLAINTIFF' || userRole === 'DEFENDANT') && 'Track your case progress and hearing dates.'}
                {(userRole === 'SYSTEM_ADMIN' || userRole === 'COURT_ADMIN') && 'Operational insights for the Federal Judiciary Hub.'}
                {userRole === 'USER' && 'Welcome to the Ethiopian Digital Court System.'}
              </p>
            </div>
            <div className="flex gap-4">
              <RoleBasedContent allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK']}>
                <button className="flex items-center gap-3 px-8 py-4 card-bg border-2 border-emerald-500/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500/5 transition-all shadow-sm page-text">
                  <BarChart3 size={16} className="text-emerald-500" /> Export Reports
                </button>
              </RoleBasedContent>
              <RoleBasedContent allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK']}>
                <button className="flex items-center gap-3 px-8 py-4 bg-emerald-950 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-2xl shadow-emerald-950/20">
                  <Plus size={16} className="text-emerald-400" /> Register New Case
                </button>
              </RoleBasedContent>
            </div>
          </motion.div>

          {/* Role-Based Welcome Message */}
          <RoleBasedWelcome />

          {/* Role-Based Quick Actions */}
          <RoleBasedQuickActions />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {stats.map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="card-bg p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-500/10 group hover:border-emerald-500 transition-all"
              >
                 <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
                    {stat.icon}
                  </div>
                  <div className={`flex items-center gap-1 font-black text-xs ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                    <TrendingUp size={14} /> {stat.change}
                  </div>
                </div>
                <p className="text-muted font-extrabold uppercase tracking-widest text-[10px] mb-1">{stat.label}</p>
                <p className="text-4xl font-black page-text tracking-tighter">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Recent Activities */}
            <div className="lg:col-span-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card-bg rounded-[3rem] shadow-2xl shadow-emerald-950/5 border border-emerald-500/10 overflow-hidden h-full"
              >
                <div className="p-10 border-b border-emerald-500/10 flex items-center justify-between">
                   <h3 className="text-2xl font-black page-text tracking-tight">Recent Activity Log</h3>
                   <button className="text-emerald-500 font-black text-xs uppercase tracking-widest hover:underline px-4 py-2 bg-emerald-500/10 rounded-xl">View All History</button>
                </div>
                <div className="p-10 space-y-6">
                   {recentActivities.map(activity => (
                     <div key={activity.id} className="flex items-center gap-6 p-6 rounded-3xl border-2 border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all group">
                        <div className="w-16 h-16 card-bg rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform border border-emerald-500/10">
                          {activity.type === 'case' ? '📂' : activity.type === 'hearing' ? '⚖️' : activity.type === 'document' ? '📝' : '👤'}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-black page-text text-lg tracking-tight">{activity.title}</h4>
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{activity.time}</span>
                          </div>
                          <p className="text-secondary font-medium text-sm mb-2">{activity.desc}</p>
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tight">Authorized: {activity.user}</span>
                          </div>
                        </div>
                        <ChevronRight className="text-muted opacity-30 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                     </div>
                   ))}
                </div>
              </motion.div>
            </div>

            {/* Upcoming Schedule */}
            <div className="lg:col-span-4 flex flex-col gap-10">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-emerald-950 p-10 rounded-[3rem] text-white shadow-2xl shadow-emerald-950/20 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                <h3 className="text-2xl font-black mb-8 relative z-10 flex items-center gap-3">
                  <Calendar className="text-emerald-400" /> Today's Sessions
                </h3>
                <div className="space-y-8 relative z-10">
                   {[
                     { time: '09:00 AM', title: 'Virtual Hearing', case: 'CIV-2026-0421', type: 'VIDEO' },
                     { time: '11:30 AM', title: 'Judgment Signing', case: 'CR-2026-0812', type: 'SIGN' },
                     { time: '02:00 PM', title: 'Counsel Briefing', case: 'CV-2026-0992', type: 'MEET' },
                   ].map(session => (
                     <div key={session.time} className="flex gap-6 items-start">
                        <div className="flex flex-col items-center">
                           <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full mb-2"></div>
                           <div className="w-0.5 h-16 bg-white/10"></div>
                        </div>
                        <div>
                           <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{session.time}</div>
                           <h4 className="font-extrabold text-lg mb-0.5">{session.title}</h4>
                           <p className="text-xs text-white/60 font-medium mb-3">Case ID: {session.case}</p>
                           <span className="px-3 py-1 bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10">{session.type}</span>
                        </div>
                     </div>
                   ))}
                </div>
                <button className="w-full mt-10 py-5 bg-emerald-400 text-emerald-950 font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-[1.02] shadow-xl shadow-emerald-400/20 transition-all">
                  Open Judicial Calendar
                </button>
              </motion.div>

               <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="card-bg p-10 rounded-[3rem] border border-emerald-500/10 shadow-2xl shadow-emerald-950/5"
              >
                 <h3 className="text-xl font-black page-text mb-6 flex items-center gap-3">
                   <Clock className="text-emerald-500" /> Pending Actions
                 </h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                       <span className="text-sm font-bold text-secondary">Document Approvals</span>
                       <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-black tracking-tighter">12 URGENT</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                       <span className="text-sm font-bold text-secondary">Case Assignments</span>
                       <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black tracking-tighter">5 PENDING</span>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </RequireAccess>
  );
}
