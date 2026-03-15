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

export default function Dashboard() {
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
    
    if (userStr) {
      const userData = JSON.parse(userStr);
      setCurrentUser(userData.name || 'User');
    }

    const fetchData = async () => {
      try {
        // Fetch Analytics
        const analyticsRes = await fetch('http://localhost:5173/api/reports/analytics/comprehensive', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const analyticsData = await analyticsRes.json();
        
        if (analyticsData.success) {
          const data = analyticsData.data;
          setStats([
            { label: 'Monthly Volume', value: data.caseVolume.monthly[data.caseVolume.monthly.length - 1].toString(), change: '+12%', icon: <Briefcase className="text-emerald-500" />, trend: 'up' },
            { label: 'Clearance Rate', value: `${data.courtPerformance.clearanceRate}%`, change: '+3%', icon: <Gavel className="text-amber-500" />, trend: 'up' },
            { label: 'Hearing Efficiency', value: `${data.courtPerformance.hearingEfficiency}%`, change: '+2%', icon: <TrendingUp className="text-blue-500" />, trend: 'up' },
            { label: 'Digital Adoption', value: `${data.courtPerformance.digitalAdoption}%`, change: '+5%', icon: <TrendingUp className="text-emerald-400" />, trend: 'up' },
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

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/', active: true },
    { label: 'Cases', icon: <Briefcase size={18} />, href: '/cases' },
    { label: 'Hearings', icon: <Gavel size={18} />, href: '/hearings' },
    { label: 'Documents', icon: <FileText size={18} />, href: '/documents' },
    { label: 'Virtual Hearing', icon: <Video size={18} />, href: '/virtual-hearing' },
    { label: 'Users', icon: <Users size={18} />, href: '/users' },
    { label: 'Reports', icon: <BarChart3 size={18} />, href: '/reports' },
    { label: 'Messages', icon: <MessageSquare size={18} />, href: '/communication' },
    { label: 'Archives', icon: <Save size={18} />, href: '/archives' },
    { label: 'Settings', icon: <Settings size={18} />, href: '/settings' },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      {/* Premium Header */}
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
              <input type="text" placeholder="Search cases, documents, or hearings..." className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/20 font-medium" />
              <div className="text-[10px] font-black text-white/40 border border-white/10 px-1.5 py-0.5 rounded-md">CMD + K</div>
            </div>
            
            <div className="flex items-center gap-6">
              <ThemeToggle />
              <Link href="/notifications" className="relative w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all">
                <Bell size={20} className="text-white" />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-emerald-950"></span>
              </Link>
              
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-emerald-950 font-black">
                    {currentUser[0]}
                  </div>
                  <span className="text-white font-bold text-sm hidden md:block">{currentUser}</span>
                </button>
                
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-emerald-50 overflow-hidden z-[200]"
                    >
                      <div className="p-4 bg-emerald-50/50 border-b border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Administrative Profile</p>
                        <p className="text-sm font-bold text-emerald-950 truncate">{currentUser}</p>
                      </div>
                      <div className="p-2">
                        <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl text-emerald-950 hover:bg-emerald-50 transition-colors"><User size={18} /> <span className="text-sm font-bold">Dossier</span></Link>
                        <Link href="/settings" className="flex items-center gap-3 p-3 rounded-xl text-emerald-950 hover:bg-emerald-50 transition-colors"><Settings size={18} /> <span className="text-sm font-bold">Adjust Settings</span></Link>
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

      {/* Navigation Bar */}
      <nav className="nav-container sticky top-20 z-[90] bg-[#14532d] overflow-x-auto shadow-md">
        <div className="container mx-auto flex items-center h-16 px-6 gap-2">
          {navItems.map((item) => (
            <Link 
              key={item.label}
              href={item.href} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                item.active 
                ? 'bg-emerald-400 text-emerald-950 shadow-lg' 
                : 'text-emerald-50 hover:bg-emerald-800'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-container scrollbar-hide py-10 px-6">
        <div className="container mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
          >
            <div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">Platform Overview</h1>
              <p className="text-gray-500 font-medium text-lg">Operational insights for the Federal Judiciary Hub.</p>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
                <BarChart3 size={16} className="text-emerald-600" /> Export Reports
              </button>
              <button className="flex items-center gap-3 px-8 py-4 bg-emerald-950 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-2xl shadow-emerald-950/20">
                <Plus size={16} className="text-emerald-400" /> Register New Case
              </button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {stats.map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 group hover:border-emerald-500 transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
                    {stat.icon}
                  </div>
                  <div className={`flex items-center gap-1 font-black text-xs ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                    <TrendingUp size={14} /> {stat.change}
                  </div>
                </div>
                <p className="text-gray-500 font-extrabold uppercase tracking-widest text-[10px] mb-1">{stat.label}</p>
                <p className="text-4xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Recent Activities */}
            <div className="lg:col-span-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[3rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 overflow-hidden h-full"
              >
                <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">Recent Activity Log</h3>
                   <button className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline px-4 py-2 bg-emerald-50 rounded-xl">View All History</button>
                </div>
                <div className="p-10 space-y-6">
                   {recentActivities.map(activity => (
                     <div key={activity.id} className="flex items-center gap-6 p-6 rounded-3xl border-2 border-transparent hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                          {activity.type === 'case' ? '📂' : activity.type === 'hearing' ? '⚖️' : activity.type === 'document' ? '📝' : '👤'}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-black text-gray-900 text-lg tracking-tight">{activity.title}</h4>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activity.time}</span>
                          </div>
                          <p className="text-gray-500 font-medium text-sm mb-2">{activity.desc}</p>
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                             <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tight">Authorized: {activity.user}</span>
                          </div>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
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
                className="bg-white p-10 rounded-[3rem] border border-emerald-50 shadow-2xl shadow-emerald-950/5"
              >
                 <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                   <Clock className="text-emerald-600" /> Pending Actions
                 </h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                       <span className="text-sm font-bold text-gray-700">Document Approvals</span>
                       <span className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black tracking-tighter">12 URGENT</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                       <span className="text-sm font-bold text-gray-700">Case Assignments</span>
                       <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black tracking-tighter">5 PENDING</span>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
