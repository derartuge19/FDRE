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
  MessageSquare,
  X
} from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import RequireAccess from '@/components/RequireAccess';
import Modal from '@/components/Modal';

export default function Profile() {
  const [currentUser, setCurrentUser] = useState({ name: 'Loading...', role: 'User', email: '...', phone: '...', department: '...' });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', department: '' });
  
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

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [backdropImage, setBackdropImage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('courtUser');
    const token = localStorage.getItem('courtToken');
    const savedImg = localStorage.getItem('courtProfileImg');
    const savedBackdrop = localStorage.getItem('courtBackdropImg');
    
    if (savedImg) setProfileImage(savedImg);
    if (savedBackdrop) setBackdropImage(savedBackdrop);

    if (userStr && userStr !== 'undefined') {
      try {
        const userData = JSON.parse(userStr);
        setCurrentUser({
          name: userData.name || 'User',
          role: userData.roles?.[0] || 'Member',
          email: userData.email || 'judicial.officer@court.gov.et',
          phone: userData.phone || '+251 911 000 000',
          department: userData.department || 'Judiciary Council'
        });
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }

    const fetchPerformance = async () => {
       try {
          const res = await fetch('http://localhost:5173/api/reports/analytics/comprehensive', {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
       } catch (err) {
          console.error('Profile sync failure');
       }
    };

    if (token) fetchPerformance();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'backdrop') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'profile') {
          setProfileImage(base64String);
          localStorage.setItem('courtProfileImg', base64String);
        } else {
          setBackdropImage(base64String);
          localStorage.setItem('courtBackdropImg', base64String);
        }
        
        setModalConfig({
          isOpen: true,
          title: 'Profile Updated',
          message: 'Your profile image has been successfully synchronized.',
          type: 'success'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = { ...currentUser, ...editForm };
    setCurrentUser(updatedUser);
    
    // Persist to localStorage
    const userStr = localStorage.getItem('courtUser');
    if (userStr) {
       const fullData = JSON.parse(userStr);
       localStorage.setItem('courtUser', JSON.stringify({ ...fullData, ...editForm }));
    }
    
    setIsEditModalOpen(false);
    setModalConfig({
      isOpen: true,
      title: 'Profile Synchronized',
      message: 'Your judicial profile has been updated across the federal network.',
      type: 'success'
    });
  };

  const handlePlaceholderAction = (title: string, msg: string) => {
     setModalConfig({
        isOpen: true,
        title: title,
        message: msg,
        type: 'info'
     });
  };

  const handleLogout = () => {
    setModalConfig({
        isOpen: true,
        title: 'Terminate Session?',
        message: 'Are you sure you want to decouple from the judicial uplink? Unsaved procedural changes may be lost.',
        type: 'warning',
        confirmLabel: 'DECOUPLE NOW',
        cancelLabel: 'MAINTAIN UPLINK'
    });
  };

  const confirmLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  if (!mounted) return null;

  return (
    <RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK', 'LAWYER', 'PLAINTIFF', 'DEFENDANT', 'USER']}>
    <div className="min-h-screen page-bg page-text">
      <Header />
      <Navigation />

      <main className="py-20 px-6">
         <div className="container mx-auto">
            <div className="relative mb-20">
               {/* Cover Area */}
               <div className="h-64 bg-emerald-950 rounded-[4rem] relative overflow-hidden shadow-2xl">
                  {backdropImage ? (
                    <img src={backdropImage} className="w-full h-full object-cover opacity-60" alt="Backdrop" />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(16,185,129,0.2),transparent)]"></div>
                  )}
                  <div className="absolute bottom-10 right-10">
                     <label className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-emerald-500/10 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-3xl transition-all cursor-pointer">
                        <Camera size={14} /> Change Backdrop
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleImageChange(e, 'backdrop')} />
                     </label>
                  </div>
               </div>

               {/* Profile Info Overlay */}
               <div className="px-12 -mt-24 relative z-10">
                  <div className="flex flex-col lg:flex-row items-end gap-10">
                     <div className="relative group">
                        <div className="w-48 h-48 card-bg rounded-[3.5rem] border-[8px] border-page-bg shadow-2xl shadow-emerald-950/20 flex items-center justify-center text-7xl group-hover:scale-105 transition-transform overflow-hidden">
                           {profileImage ? (
                             <img src={profileImage} className="w-full h-full object-cover" alt="Profile" />
                           ) : (
                             currentUser.role === 'JUDGE' ? '👨‍⚖️' : '⚖️'
                           )}
                        </div>
                        <label className="absolute bottom-2 right-2 w-12 h-12 bg-emerald-500 text-emerald-950 rounded-2xl border-4 border-page-bg flex items-center justify-center shadow-xl hover:scale-110 transition-all cursor-pointer">
                           <Camera size={18} />
                           <input type="file" className="hidden" accept="image/*" onChange={e => handleImageChange(e, 'profile')} />
                        </label>
                     </div>
                     <div className="flex-1 pb-4 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start gap-4 mb-2">
                           <h1 className="text-5xl font-black page-text tracking-tighter">{currentUser.name}</h1>
                           <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl"><Shield size={20} /></div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                           <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                              <Briefcase size={14} /> {currentUser.role}
                           </div>
                           <div className="w-1.5 h-1.5 bg-emerald-500/20 rounded-full hidden sm:block"></div>
                           <div className="flex items-center gap-2 text-muted font-bold text-xs uppercase tracking-widest">
                              <MapPin size={14} /> Supreme Court, Addis Ababa
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-4 pb-6">
                        <button onClick={() => handlePlaceholderAction('Configuration Matrix', 'Institutional preferences are currently being synchronized with District Hub 7.')} className="flex items-center gap-3 px-8 py-5 card-bg border-2 border-emerald-500/10 page-text rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-500/5 transition-all shadow-xl">
                           <Settings size={20} /> Preferences
                        </button>
                        <button onClick={() => { setEditForm({ name: currentUser.name, email: currentUser.email, phone: currentUser.phone, department: currentUser.department }); setIsEditModalOpen(true); }} className="flex items-center gap-3 px-10 py-5 bg-emerald-950 text-emerald-400 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-emerald-900 transition-all border border-emerald-500/20 active:scale-95">
                           <Edit3 size={20} /> Edit Profile
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               {/* Left: Contact & Status */}
               <div className="space-y-8">
                  <div className="card-bg p-10 rounded-[3.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-500/10">
                     <h3 className="text-xs font-black text-muted uppercase tracking-[0.3em] mb-8">Contact Information</h3>
                     <div className="space-y-6">
                        <div className="flex items-center gap-6 group">
                           <div className="w-12 h-12 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-emerald-500 transition-colors group-hover:bg-emerald-500/10"><Mail size={20} /></div>
                           <div>
                              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Official Email</p>
                              <p className="text-sm font-bold page-text">{currentUser.email}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6 group">
                           <div className="w-12 h-12 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-emerald-500 transition-colors group-hover:bg-emerald-500/10"><Phone size={20} /></div>
                           <div>
                              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Secure Line</p>
                              <p className="text-sm font-bold page-text">{currentUser.phone}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6 group">
                           <div className="w-12 h-12 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-emerald-500 transition-colors group-hover:bg-emerald-500/10"><Lock size={20} /></div>
                           <div>
                              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Credentials</p>
                              <p className="text-sm font-bold page-text">Verified Employee #29402</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-emerald-950 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-emerald-950/30 relative overflow-hidden border border-emerald-500/20">
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
                  <div className="card-bg p-12 rounded-[4rem] shadow-2xl shadow-emerald-950/5 border border-emerald-500/10">
                     <div className="flex items-center justify-between mb-12">
                        <div>
                           <h2 className="text-3xl font-black page-text tracking-tighter">Judicial Career</h2>
                           <p className="text-muted font-medium text-sm italic">Authenticated record of deployments and achievements.</p>
                        </div>
                         <button onClick={() => handlePlaceholderAction('Document Propagation', 'Official CV artifacts are only generated through the Central Personnel Office.')} className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-widest hover:underline">
                            View Full PDF Resume <ChevronRight size={14} />
                         </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        {[
                          { title: 'High Court Judge', period: '2020 - PRESENT', dept: 'Criminal Division', icon: <Gavel className="text-emerald-500" /> },
                          { title: 'Appellate Advocate', period: '2015 - 2020', dept: 'Addis Ababa Bar', icon: <Shield className="text-blue-500" /> }
                        ].map((exp, idx) => (
                          <div key={idx} className="p-8 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/10 group hover:border-emerald-500 transition-all">
                             <div className="w-12 h-12 card-bg rounded-2xl flex items-center justify-center shadow-lg mb-6 transform group-hover:-translate-y-2 transition-transform">{exp.icon}</div>
                             <h4 className="text-xl font-black page-text mb-1">{exp.title}</h4>
                             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">{exp.period}</p>
                             <p className="text-xs font-bold text-muted">{exp.dept}</p>
                          </div>
                        ))}
                     </div>

                     <h3 className="text-xs font-black text-muted uppercase tracking-[0.3em] mb-8">Internal Certifications</h3>
                     <div className="flex flex-wrap gap-4">
                        {[
                          { label: 'Remote Hearing Certified', icon: <CheckCircle2 size={14} /> },
                          { label: 'Digital Signatory v2', icon: <Award size={14} /> },
                          { label: 'High Security Clearance', icon: <Shield size={14} /> }
                        ].map(badge => (
                          <div key={badge.label} className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                             {badge.icon} {badge.label}
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="card-bg p-10 rounded-[3.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-500/10">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="text-xs font-black text-muted uppercase tracking-[0.3em]">Recent Activity</h3>
                           <Clock size={16} className="text-muted" />
                        </div>
                        <div className="space-y-6">
                           {[
                             { action: 'Signed final judgment for Case #CV-042', time: '2 hours ago' },
                             { action: 'Established secure link with Virtual Hub B', time: '4 hours ago' },
                             { action: 'Updated registry metadata for Docket #882', time: 'Yesterday' }
                           ].map((item, idx) => (
                             <div key={idx} className="relative pl-6 before:absolute before:left-0 before:top-1.5 before:w-2 before:h-2 before:bg-emerald-500/30 before:rounded-full">
                                <p className="text-xs font-bold page-text mb-1">{item.action}</p>
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">{item.time}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                     <div className="card-bg p-10 rounded-[3.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-500/10 flex flex-col items-center justify-center text-center">
                        <Award size={48} className="text-amber-500 mb-6" />
                        <h4 className="text-2xl font-black page-text mb-2">Service Excellence</h4>
                        <p className="text-muted text-xs font-medium leading-relaxed px-4">Recognized for ultra-efficient case disposal rates in the 2025 Judicial Performance Audit.</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </main>

      <footer className="py-20 text-center opacity-30 select-none pointer-events-none">
         <p className="text-[8px] font-black uppercase tracking-[1em] text-emerald-950">AUTHENTICATED JUDICIAL PROFILE • FDRE DISTRICT 7</p>
       </footer>

       <AnimatePresence>
          {isEditModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-emerald-950/40 backdrop-blur-xl" />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                 animate={{ opacity: 1, scale: 1, y: 0 }} 
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl border border-emerald-500/10 overflow-hidden"
               >
                  <div className="p-12">
                     <div className="flex justify-between items-start mb-10">
                        <div>
                           <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-2">Update Profile</h2>
                           <p className="text-secondary font-medium uppercase text-[10px] tracking-widest">Institutional Credential Synchronization</p>
                        </div>
                        <button onClick={() => setIsEditModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                     </div>

                     <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                              <input required type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none rounded-2xl font-bold page-text transition-all" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
                              <input required type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none rounded-2xl font-bold page-text transition-all" />
                           </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Line</label>
                              <input required type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none rounded-2xl font-bold page-text transition-all" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Department</label>
                              <input required type="text" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 outline-none rounded-2xl font-bold page-text transition-all" />
                           </div>
                        </div>
                        <div className="pt-6">
                           <button type="submit" className="w-full py-6 bg-emerald-950 text-emerald-400 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-900 transition-all border border-emerald-500/20 active:scale-95">Commit Changes</button>
                        </div>
                     </form>
                  </div>
               </motion.div>
            </div>
          )}
       </AnimatePresence>

       {/* Confirmation Modals */}
       <Modal 
         isOpen={modalConfig.isOpen}
         title={modalConfig.title}
         message={modalConfig.message}
         type={modalConfig.type}
         onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
         onConfirm={modalConfig.type === 'warning' ? confirmLogout : undefined}
       />
    </div>
    </RequireAccess>
  );
}
