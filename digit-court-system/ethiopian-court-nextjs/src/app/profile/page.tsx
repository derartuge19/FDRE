'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Award, 
  Clock, 
  LogOut, 
  Settings, 
  Edit3, 
  CheckCircle2, 
  Lock,
  Camera,
  Bell,
  ChevronRight,
  Gavel,
  LayoutDashboard,
  FileText,
  Video,
  Users,
  BarChart3,
  MessageSquare
} from 'lucide-react';

export default function Profile() {
  const [currentUser, setCurrentUser] = useState({ name: 'Loading...', role: 'User', email: '...', phone: '...', department: '...' });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('courtUser');
    const token = localStorage.getItem('courtToken');
    
    if (userStr) {
      const userData = JSON.parse(userStr);
      setCurrentUser({
        name: userData.name || 'User',
        role: userData.roles?.[0] || 'Member',
        email: userData.email || 'judicial.officer@court.gov.et',
        phone: userData.phone || '+251 911 000 000',
        department: userData.department || 'Judiciary Council'
      });
    }

    const fetchPerformance = async () => {
       try {
          const res = await fetch('http://localhost:5173/api/reports/analytics/comprehensive', {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          // Profile could display dynamic stats from here if needed
       } catch (err) {
          console.error('Dossier sync failure');
       }
    };

    if (token) fetchPerformance();
  }, []);

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
              <ThemeToggle />
              <button className="relative w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all">
                <Bell size={20} className="text-white" />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-emerald-950"></span>
              </button>
              
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all">
                  <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-emerald-950 font-black text-xs">{currentUser.name[0]}</div>
                  <span className="text-white font-bold text-sm hidden md:block">{currentUser.name}</span>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-full mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-emerald-50 overflow-hidden z-[200]">
                      <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 font-bold text-xs uppercase text-emerald-600">Administrative Profile</div>
                      <div className="p-2">
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

      {/* Navigation */}
      <nav className="nav-container sticky top-20 z-[90] bg-[#14532d] overflow-x-auto shadow-md">
        <div className="container mx-auto flex items-center h-16 px-6 gap-2">
          { [
            { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/' },
            { label: 'Cases', icon: <Briefcase size={18} />, href: '/cases' },
            { label: 'Hearings', icon: <Gavel size={18} />, href: '/hearings' },
            { label: 'Documents', icon: <FileText size={18} />, href: '/documents' },
            { label: 'Virtual Hearing', icon: <Video size={18} />, href: '/virtual-hearing' },
            { label: 'Users', icon: <Users size={18} />, href: '/users' },
            { label: 'Reports', icon: <BarChart3 size={18} />, href: '/reports' },
            { label: 'Messages', icon: <MessageSquare size={18} />, href: '/communication' },
            { label: 'Settings', icon: <Settings size={18} />, href: '/settings' },
          ].map((item: any) => (
            <Link 
              key={item.label} 
              href={item.href} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                item.active ? 'bg-emerald-400 text-emerald-950 shadow-lg' : 'text-emerald-50 hover:bg-emerald-800'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          )) }
        </div>
      </nav>

      <main className="py-20 px-6">
         <div className="container mx-auto">
            <div className="relative mb-20">
               {/* Cover Area */}
               <div className="h-64 bg-emerald-950 rounded-[4rem] relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(16,185,129,0.2),transparent)]"></div>
                  <div className="absolute bottom-10 right-10">
                     <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-3xl transition-all">
                        <Camera size={14} /> Change Backdrop
                     </button>
                  </div>
               </div>

               {/* Profile Info Overlay */}
               <div className="px-12 -mt-24 relative z-10">
                  <div className="flex flex-col lg:flex-row items-end gap-10">
                     <div className="relative group">
                        <div className="w-48 h-48 bg-gray-50 rounded-[3.5rem] border-[8px] border-[#f8f6f3] shadow-2xl shadow-emerald-950/20 flex items-center justify-center text-7xl group-hover:scale-105 transition-transform">
                           👨‍⚖️
                        </div>
                        <button className="absolute bottom-2 right-2 w-12 h-12 bg-emerald-500 text-emerald-950 rounded-2xl border-4 border-[#f8f6f3] flex items-center justify-center shadow-xl hover:scale-110 transition-all">
                           <Camera size={18} />
                        </button>
                     </div>
                     <div className="flex-1 pb-4">
                        <div className="flex items-center gap-4 mb-2">
                           <h1 className="text-5xl font-black text-gray-900 tracking-tighter">{currentUser.name}</h1>
                           <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Shield size={20} /></div>
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                           <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                              <Briefcase size={14} /> {currentUser.role}
                           </div>
                           <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                           <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
                              <MapPin size={14} /> Supreme Court, Addis Ababa
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-4 pb-6">
                        <button className="flex items-center gap-3 px-8 py-5 bg-white border-2 border-gray-100 text-gray-900 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all shadow-xl">
                           <Settings size={20} /> Preferences
                        </button>
                        <button className="flex items-center gap-3 px-10 py-5 bg-emerald-950 text-emerald-400 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-emerald-900 transition-all">
                           <Edit3 size={20} /> Edit Dossier
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               {/* Left: Contact & Status */}
               <div className="space-y-8">
                  <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50">
                     <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Contact Information</h3>
                     <div className="space-y-6">
                        <div className="flex items-center gap-6 group">
                           <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-50"><Mail size={20} /></div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Official Email</p>
                              <p className="text-sm font-bold text-gray-800">{currentUser.email}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6 group">
                           <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-50"><Phone size={20} /></div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Secure Line</p>
                              <p className="text-sm font-bold text-gray-800">{currentUser.phone}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6 group">
                           <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-50"><Lock size={20} /></div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Credentials</p>
                              <p className="text-sm font-bold text-gray-800">Verified Employee #29402</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-emerald-950 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-emerald-950/30 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-10 -mt-10"></div>
                     <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em] mb-8">System Status</h3>
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
                        <span className="text-lg font-black tracking-tight">Active Online</span>
                     </div>
                     <p className="text-emerald-100/60 text-xs font-medium leading-relaxed mb-6">Your judicial workstation is currently synchronized with the central federal database.</p>
                     <div className="py-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-left">Last Handshake</span>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">3m ago</span>
                     </div>
                  </div>
               </div>

               {/* Right: Activity & Badges */}
               <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-12 rounded-[4rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50">
                     <div className="flex items-center justify-between mb-12">
                        <div>
                           <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Judicial Career</h2>
                           <p className="text-gray-400 font-medium text-sm italic">Authenticated record of deployments and achievements.</p>
                        </div>
                        <button className="flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-widest hover:underline">
                           View Full PDF Resume <ChevronRight size={14} />
                        </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        {[
                          { title: 'High Court Judge', period: '2020 - PRESENT', dept: 'Criminal Division', icon: <Gavel className="text-emerald-500" /> },
                          { title: 'Appellate Advocate', period: '2015 - 2020', dept: 'Addis Ababa Bar', icon: <Shield className="text-blue-500" /> }
                        ].map((exp, idx) => (
                          <div key={idx} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 group hover:border-emerald-500 transition-all">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 transform group-hover:-translate-y-2 transition-transform">{exp.icon}</div>
                             <h4 className="text-xl font-black text-gray-900 mb-1">{exp.title}</h4>
                             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">{exp.period}</p>
                             <p className="text-xs font-bold text-gray-400">{exp.dept}</p>
                          </div>
                        ))}
                     </div>

                     <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Internal Certifications</h3>
                     <div className="flex flex-wrap gap-4">
                        {[
                          { label: 'Remote Hearing Certified', icon: <CheckCircle2 size={14} /> },
                          { label: 'Digital Signatory v2', icon: <Award size={14} /> },
                          { label: 'High Security Clearance', icon: <Shield size={14} /> }
                        ].map(badge => (
                          <div key={badge.label} className="flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                             {badge.icon} {badge.label}
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Recent Activity</h3>
                           <Clock size={16} className="text-gray-300" />
                        </div>
                        <div className="space-y-6">
                           {[
                             { action: 'Signed final judgment for Case #CV-042', time: '2 hours ago' },
                             { action: 'Established secure link with Virtual Hub B', time: '4 hours ago' },
                             { action: 'Updated registry metadata for Docket #882', time: 'Yesterday' }
                           ].map((item, idx) => (
                             <div key={idx} className="relative pl-6 before:absolute before:left-0 before:top-1.5 before:w-2 before:h-2 before:bg-emerald-200 before:rounded-full">
                                <p className="text-xs font-bold text-gray-800 mb-1">{item.action}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.time}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                     <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 flex flex-col items-center justify-center text-center">
                        <Award size={48} className="text-amber-500 mb-6" />
                        <h4 className="text-2xl font-black text-gray-900 mb-2">Service Excellence</h4>
                        <p className="text-gray-400 text-xs font-medium leading-relaxed px-4">Recognized for ultra-efficient case disposal rates in the 2025 Judicial Performance Audit.</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </main>

      <footer className="py-20 text-center opacity-30 select-none pointer-events-none">
         <p className="text-[8px] font-black uppercase tracking-[1em] text-emerald-950">AUTHENTICATED JUDICIAL DOSSIER • FDRE DISTRICT 7</p>
      </footer>
    </div>
  );
}
