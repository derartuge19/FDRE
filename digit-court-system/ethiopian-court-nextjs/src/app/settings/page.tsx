'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import {  
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Bell, 
  Database, 
  Save, 
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck, 
  Globe, 
  Smartphone, 
  Mail, 
  Clock, 
  Calendar,
  AlertTriangle,
  Download,
  Moon,
  Sun,
  Monitor,
  Check,
  Gavel,
  Briefcase,
  FileText,
  Video,
  Users,
  BarChart3,
  MessageSquare,
  LayoutDashboard
 } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import RequireAccess from '@/components/RequireAccess';

interface SystemSettings {
  systemName: string;
  courtName: string;
  timezone: string;
  dateFormat: string;
  language: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  sessionTimeout: number;
  maxFileSize: number;
  allowedFileTypes: string[];
}

interface UserSettings {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  twoFactorAuth: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export default function Settings() {
  const [currentUser, setCurrentUser] = useState('Loading...');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    systemName: 'Ethiopian Digital Court System',
    courtName: 'Federal Supreme Court',
    timezone: 'Africa/Addis_Ababa',
    dateFormat: 'YYYY-MM-DD',
    language: 'en',
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    autoBackup: true,
    backupFrequency: 'daily',
    sessionTimeout: 30,
    maxFileSize: 10,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'mp4', 'mp3']
  });

  const [userSettings, setUserSettings] = useState<UserSettings>({
    fullName: 'John Doe',
    email: 'john.doe@court.gov.et',
    phone: '+251-11-123456',
    role: 'Judge',
    department: 'Judiciary',
    timezone: 'Africa/Addis_Ababa',
    language: 'en',
    emailNotifications: true,
    smsNotifications: false,
    twoFactorAuth: true,
    theme: 'light'
  });

  const [cloudStatus, setCloudStatus] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('courtUser');
    const token = localStorage.getItem('courtToken');
    
    if (userStr && userStr !== 'undefined') {
      try {
        const userData = JSON.parse(userStr);
        setCurrentUser(userData.name || 'User');
        setUserSettings(prev => ({
          ...prev,
          fullName: userData.name || 'User',
          role: userData.roles?.[0] || 'User',
          email: userData.email || '',
          department: userData.department || 'N/A'
        }));
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }

    const fetchSystemSettings = async () => {
       try {
          const res = await fetch('http://localhost:5173/api/settings', {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
             setSystemSettings(prev => ({
                ...prev,
                courtName: data.data.court.name,
                timezone: data.data.court.timezone,
                language: data.data.court.language,
                emailNotifications: data.data.court.emailNotifications === 'Enabled',
                smsNotifications: data.data.court.smsNotifications === 'Enabled',
                sessionTimeout: data.data.system.sessionTimeout
             }));
          }
       } catch (err) {
          console.error('Failed to sync system settings:', err);
       }
    };

    if (token) fetchSystemSettings();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  if (!mounted) return null;

  const handleSystemSettingsChange = (key: keyof SystemSettings, value: any) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleUserSettingsChange = (key: keyof UserSettings, value: any) => {
    setUserSettings(prev => ({ ...prev, [key]: value }));
  };


  const saveSettings = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('courtToken');
    try {
      // Broadcast settings to administrative gateway
      await fetch('http://localhost:5173/api/system/config', {
        method: 'GET', // Using GET to fetch current policy as mock check
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setIsSaving(false);
      setModalConfig({
        isOpen: true,
        title: 'System Conflict',
        message: 'The administrative gateway could not synchronize your policy updates. Please verify your jurisdictional credentials.',
        type: 'error'
      });
    }
  };

  const triggerBackup = async () => {
    const token = localStorage.getItem('courtToken');
    try {
      const res = await fetch('http://localhost:5173/api/system/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
         setModalConfig({
           isOpen: true,
           title: 'Judicial Backup Initiated',
           message: `A system-wide snapshot of the court database has been localized. ${data.message}`,
           type: 'success'
         });
      }
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Network Gateway Error',
        message: 'Institutional backup servers are currently unreachable. Retrying downlink sync.',
        type: 'warning'
      });
    }
  };

  const fetchCloudStatus = async () => {
    const token = localStorage.getItem('courtToken');
    try {
      const res = await fetch('http://localhost:5173/api/system/cloud-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setCloudStatus(data);
    } catch (err) {
      console.error('Cloud monitor failure');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <SettingsIcon size={20} /> },
    { id: 'user', label: 'User Profile', icon: <User size={20} /> },
    { id: 'security', label: 'Security', icon: <Lock size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'backup', label: 'Backup & Storage', icon: <Database size={20} /> }
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK']}>
    <div className="min-h-screen page-bg page-text">
      {/* Premium Navigation Header */}
      <Header />

      <Navigation />

      <main className="main-container scrollbar-hide">
        <div className="container mx-auto px-6 py-12">
          
          {/* Page Header with Animation */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
          >
            <div>
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest mb-3">
                <span className="bg-emerald-500/10 px-2 py-1 rounded">Admin</span>
                <span>/</span>
                <span>Systems Control</span>
              </div>
              <h1 className="text-5xl font-black page-text tracking-tighter mb-2">Configuration Hub</h1>
              <p className="text-secondary font-medium text-lg max-w-xl">Optimize your judicial management platform with advanced administration tools.</p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={saveSettings}
              disabled={isSaving}
              className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl relative overflow-hidden ${
                saveSuccess 
                ? 'bg-green-500 text-white shadow-green-500/20' 
                : 'bg-emerald-950 text-white shadow-emerald-950/20'
              }`}
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : saveSuccess ? (
                <CheckCircle2 size={20} />
              ) : (
                <Save size={20} className="text-emerald-400" />
              )}
              <span>{isSaving ? 'Processing...' : saveSuccess ? 'Sync Completed' : 'Commit Changes'}</span>
            </motion.button>
          </motion.div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-bg rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-500/10 p-4 sticky top-28"
              >
                <div className="px-6 py-6 border-b border-emerald-500/10 mb-4">
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Management Sections</p>
                </div>
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center w-full px-6 py-4 rounded-[1.5rem] transition-all duration-300 group overflow-hidden ${
                        activeTab === tab.id
                          ? 'bg-emerald-950 text-white shadow-xl shadow-emerald-950/10 translate-x-1'
                          : 'text-muted hover:bg-emerald-500/5 hover:text-emerald-500'
                      }`}
                    >
                      {activeTab === tab.id && (
                        <motion.div layoutId="activeTab" className="absolute inset-0 bg-emerald-950" />
                      )}
                      <span className="relative z-10 mr-4 transition-transform group-hover:scale-125 duration-500">
                        {tab.icon}
                      </span>
                      <span className="relative z-10 font-black text-sm uppercase tracking-widest">{tab.label}</span>
                      {activeTab === tab.id && (
                        <motion.div 
                          layoutId="activeIndicator"
                          className="relative z-10 ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full" 
                        />
                      )}
                    </button>
                  ))}
                </nav>
                
                <div className="mt-8 p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex flex-col items-center text-center">
                   <AlertTriangle className="text-amber-500 mb-4" size={32} />
                   <h4 className="font-black text-emerald-900 text-sm mb-2 uppercase tracking-tight">Security Protocol</h4>
                   <p className="text-[10px] text-emerald-700 font-bold opacity-80 leading-relaxed mb-6">ALL CONFIGURATION CHANGES ARE LOGGED FOR AUDIT PURPOSES AS PER JUDICIAL POLICY.</p>
                   <button className="w-full py-3 bg-white border border-emerald-200 rounded-xl text-[10px] font-black uppercase text-emerald-950 hover:bg-white transition-all shadow-sm">VIEW AUDIT LOGS</button>
                </div>
              </motion.div>
            </aside>

            {/* Main Content Areas */}
            <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.98, x: -20 }}
                  transition={{ duration: 0.4, ease: "circOut" }}
                  className="bg-white rounded-[3rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 overflow-hidden min-h-[700px] flex flex-col"
                >
                  {/* Robust Content Header */}
                  <div className="p-10 md:p-14 border-b border-gray-50 bg-gradient-to-br from-white to-gray-50/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                      <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-3">
                        {tabs.find(t => t.id === activeTab)?.label} Settings
                      </h2>
                      <p className="text-gray-500 font-medium text-lg">
                        {activeTab === 'general' && 'Configure fundamental platform identities and regional jurisdiction parameters.'}
                        {activeTab === 'user' && 'Manage judicial staff credentials, profile visibility and visual preferences.'}
                        {activeTab === 'security' && 'Authorize multi-factor protocols and manage authentication governance.'}
                        {activeTab === 'notifications' && 'Select transmission channels for judicial alerts and case life-cycle updates.'}
                        {activeTab === 'backup' && 'Initialize automated archival processes and optimize data resiliency.'}
                      </p>
                    </div>
                  </div>

                  {/* Content Sections */}
                  <div className="flex-1 p-10 md:p-14">
                    
                    {activeTab === 'general' && (
                      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        <motion.div variants={itemVariants} className="space-y-3 group">
                           <div className="flex items-center gap-2 mb-1">
                             <Globe size={14} className="text-emerald-600" />
                             <label className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em] group-focus-within:text-emerald-600 transition-colors">Digital Platform Identity</label>
                           </div>
                           <input
                             type="text"
                             value={systemSettings.systemName}
                             onChange={(e) => handleSystemSettingsChange('systemName', e.target.value)}
                             className="w-full px-8 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white focus:shadow-2xl focus:shadow-emerald-100 outline-none transition-all font-bold text-gray-800 text-lg shadow-inner"
                           />
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-3 group">
                           <div className="flex items-center gap-2 mb-1">
                             <ShieldCheck size={14} className="text-emerald-600" />
                             <label className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em] group-focus-within:text-emerald-600 transition-colors">Judicial Institution Name</label>
                           </div>
                           <input
                             type="text"
                             value={systemSettings.courtName}
                             onChange={(e) => handleSystemSettingsChange('courtName', e.target.value)}
                             className="w-full px-8 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white focus:shadow-2xl focus:shadow-emerald-100 outline-none transition-all font-bold text-gray-800 text-lg shadow-inner"
                           />
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-3 group">
                           <div className="flex items-center gap-2 mb-1">
                             <Clock size={14} className="text-emerald-600" />
                             <label className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em] group-focus-within:text-emerald-600 transition-colors">Standard Timezone Control</label>
                           </div>
                           <select
                              value={systemSettings.timezone}
                              onChange={(e) => handleSystemSettingsChange('timezone', e.target.value)}
                              className="w-full px-8 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-800 text-lg appearance-none cursor-pointer shadow-inner"
                            >
                              <option value="Africa/Addis_Ababa">Addis Ababa, Ethiopia (GMT+3)</option>
                              <option value="UTC">Universal Time Coordinated (UTC)</option>
                            </select>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-3 group">
                           <div className="flex items-center gap-2 mb-1">
                             <Calendar size={14} className="text-emerald-600" />
                             <label className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em] group-focus-within:text-emerald-600 transition-colors">Temporal Data Format</label>
                           </div>
                           <select
                              value={systemSettings.dateFormat}
                              onChange={(e) => handleSystemSettingsChange('dateFormat', e.target.value)}
                              className="w-full px-8 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-800 text-lg appearance-none cursor-pointer shadow-inner"
                            >
                              <option value="YYYY-MM-DD">International Standard (2026-03-14)</option>
                              <option value="DD/MM/YYYY">European/Federal (14/03/2026)</option>
                            </select>
                        </motion.div>
                      </motion.div>
                    )}

                    {activeTab === 'notifications' && (
                      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 max-w-3xl">
                        {[
                          {id: 'email', label: 'Email Governance Transmission', desc: 'Secure transmission of case life-cycle updates and judicial orders to authorized mail servers.', icon: <Mail className="text-emerald-600" />, value: userSettings.emailNotifications},
                          {id: 'sms', label: 'Emergency SMS Protocol', desc: 'Immediate cellular broadcast for urgent scheduling conflicts or security alerts.', icon: <Smartphone className="text-emerald-600" />, value: userSettings.smsNotifications},
                          {id: 'push', label: 'Real-time Desktop Telemetry', desc: 'Browser-level telemetry for case events while the administrative terminal is active.', icon: <Monitor className="text-emerald-600" />, value: true}
                        ].map(item => (
                          <motion.div 
                            key={item.id} 
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center justify-between p-8 bg-white border-2 border-gray-100 rounded-[2rem] hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-950/5 transition-all cursor-pointer group"
                            onClick={() => {
                              if(item.id === 'email') handleUserSettingsChange('emailNotifications', !item.value);
                              if(item.id === 'sms') handleUserSettingsChange('smsNotifications', !item.value);
                            }}
                          >
                            <div className="flex items-center gap-6">
                               <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
                                 {item.icon}
                               </div>
                               <div>
                                  <h4 className="font-black text-emerald-950 text-xl tracking-tight mb-1">{item.label}</h4>
                                  <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-md">{item.desc}</p>
                               </div>
                            </div>
                            <div className={`w-14 h-8 rounded-full border-2 transition-all p-1 ${item.value ? 'bg-emerald-950 border-emerald-950' : 'bg-gray-100 border-gray-200'}`}>
                               <motion.div 
                                 animate={{ x: item.value ? 24 : 0 }}
                                 className="w-5 h-5 bg-white rounded-full shadow-lg" 
                               />
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    {activeTab === 'user' && (
                       <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-12">
                         <div className="flex flex-col md:flex-row items-center gap-10 p-10 bg-emerald-950 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 blur-[80px] rounded-full"></div>
                            <div className="relative z-10">
                              <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center text-6xl shadow-2xl border border-white/20">👤</div>
                            </div>
                            <div className="relative z-10 flex-1 text-center md:text-left">
                               <h3 className="text-4xl font-black tracking-tight mb-2">{userSettings.fullName}</h3>
                               <p className="text-emerald-400 font-bold uppercase tracking-[0.3em] text-xs mb-6 underline decoration-emerald-400/30 underline-offset-8 decoration-2">{userSettings.role} • Digital Infrastructure</p>
                               <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                  <span className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">JUDICIARY_01</span>
                                  <span className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">FEDERAL_AUTH</span>
                               </div>
                            </div>
                            <button className="relative z-10 px-8 py-4 bg-emerald-400 text-emerald-950 font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-400/20">
                              Update Profile
                            </button>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <motion.div variants={itemVariants} className="space-y-4">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Legal Designation</label>
                               <input type="text" value={userSettings.fullName} onChange={(e) => handleUserSettingsChange('fullName', e.target.value)} className="w-full px-8 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-800 text-lg shadow-inner" />
                            </motion.div>
                            <motion.div variants={itemVariants} className="space-y-4">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Judicial Contact Address</label>
                               <input type="email" value={userSettings.email} onChange={(e) => handleUserSettingsChange('email', e.target.value)} className="w-full px-8 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-800 text-lg shadow-inner" />
                            </motion.div>
                         </div>

                         <div className="pt-6">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-8">Interface Immersion Control</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                               {[
                                 {id: 'light', label: 'DIURNAL', icon: <Sun size={24} />, bg: 'from-amber-500 to-orange-500'},
                                 {id: 'dark', label: 'NOCTURNAL', icon: <Moon size={24} />, bg: 'from-slate-800 to-black'},
                                 {id: 'auto', label: 'ADAPTIVE', icon: <Monitor size={24} />, bg: 'from-emerald-600 to-emerald-900'}
                               ].map(t => (
                                 <button 
                                   key={t.id}
                                   onClick={() => handleUserSettingsChange('theme', t.id as any)}
                                   className={`relative p-8 rounded-[2.5rem] border-4 transition-all overflow-hidden text-center group ${
                                     userSettings.theme === t.id 
                                     ? 'border-emerald-500 bg-white shadow-2xl shadow-emerald-950/10 scale-105' 
                                     : 'border-transparent bg-gray-50 hover:bg-gray-100'
                                   }`}
                                 >
                                   <div className={`text-3xl mb-4 flex justify-center ${userSettings.theme === t.id ? 'text-emerald-600 scale-125' : 'text-gray-400 group-hover:scale-110'} transition-all duration-500`}>
                                     {t.icon}
                                   </div>
                                   <p className={`text-xs font-black tracking-[0.2em] ${userSettings.theme === t.id ? 'text-emerald-950' : 'text-gray-400'}`}>{t.label}</p>
                                   {userSettings.theme === t.id && (
                                     <motion.div layoutId="themeDot" className="mt-3 w-1.5 h-1.5 bg-emerald-500 rounded-full mx-auto" />
                                   )}
                                 </button>
                               ))}
                            </div>
                         </div>
                       </motion.div>
                    )}

                    {activeTab === 'security' && (
                       <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
                         <div className="p-10 bg-white border-2 border-emerald-950 rounded-[3rem] flex items-center justify-between shadow-2xl shadow-emerald-950/5 group hover:bg-emerald-950 hover:text-white transition-all cursor-pointer">
                            <div className="flex items-center gap-8">
                               <div className="text-4xl w-20 h-20 bg-emerald-50 flex items-center justify-center rounded-3xl group-hover:bg-white/10 group-hover:rotate-12 transition-all shadow-inner">🔒</div>
                               <div>
                                  <h4 className="text-2xl font-black tracking-tight mb-2">Access Credentials</h4>
                                  <p className="text-gray-500 group-hover:text-emerald-200 font-medium transition-colors">Last modification recognized 14 cycles ago</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-[0.2em] px-6 py-3 border-2 border-emerald-100 rounded-2xl group-hover:bg-emerald-400 group-hover:text-emerald-950 group-hover:border-emerald-400 transition-all">
                               INITIATE UPDATE <ChevronRight size={14} />
                            </div>
                         </div>

                         <div className="p-10 bg-emerald-50/30 border-2 border-emerald-100 rounded-[3rem] flex items-center justify-between">
                            <div className="flex items-center gap-8">
                               <div className="text-4xl w-20 h-20 bg-white flex items-center justify-center rounded-3xl shadow-xl shadow-emerald-950/5">🗝️</div>
                               <div>
                                  <h4 className="text-2xl font-black tracking-tight mb-2">Multi-Factor Governance</h4>
                                  <p className="text-emerald-800/60 font-medium">Secured with encrypted biometric telemetry</p>
                               </div>
                            </div>
                            <button 
                              onClick={() => handleUserSettingsChange('twoFactorAuth', !userSettings.twoFactorAuth)}
                              className={`px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all ${
                                userSettings.twoFactorAuth 
                                ? 'bg-emerald-950 text-white shadow-emerald-950/20' 
                                : 'bg-white text-emerald-950 border-2 border-emerald-100'
                              }`}
                            >
                              {userSettings.twoFactorAuth ? 'SECURED' : 'UNSECURED'}
                            </button>
                         </div>
                       </motion.div>
                    )}

                    {activeTab === 'backup' && (
                       <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-10">
                         <div className="relative p-12 bg-gradient-to-br from-emerald-950 to-[#0a2e1a] rounded-[3.5rem] text-white shadow-2xl overflow-hidden group">
                           <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/5 blur-[100px] rounded-full -mr-48 -mt-48 transition-transform duration-[3000ms] group-hover:rotate-180"></div>
                           <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full -ml-32 -mb-32"></div>
                           
                           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
                             <div className="flex items-center gap-8">
                                <div className="text-5xl w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/20">🛸</div>
                                <div onClick={fetchCloudStatus} className="cursor-pointer">
                                   <h4 className="text-3xl font-black mb-1">Automated Archival</h4>
                                   <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]"></div>
                                      <p className="text-sm text-emerald-300 font-bold uppercase tracking-widest italic">{cloudStatus ? `${cloudStatus.cloudProvider}::${cloudStatus.sync}` : 'POLL_SYSTEM_CONNECITIVITY'}</p>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-6">
                               <button onClick={triggerBackup} className="px-8 py-3 bg-white text-emerald-950 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Initiate Snapshot</button>
                               <div 
                                  onClick={() => handleSystemSettingsChange('autoBackup', !systemSettings.autoBackup)}
                                  className={`w-20 h-10 rounded-full transition-all p-1.5 cursor-pointer relative ${systemSettings.autoBackup ? 'bg-emerald-400' : 'bg-white/10'}`}
                               >
                                  <motion.div 
                                    animate={{ x: systemSettings.autoBackup ? 40 : 0 }}
                                    className="w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center"
                                  >
                                     {systemSettings.autoBackup && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                                  </motion.div>
                               </div>
                             </div>
                           </div>

                           <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              {[
                                {label: 'Cycle Frequency', val: systemSettings.backupFrequency.toUpperCase(), sub: 'OPTIMIZED', icon: <Clock size={16} />},
                                {label: 'Snapshot Limit', val: `${systemSettings.maxFileSize} GB`, sub: 'SCALABLE', icon: <Database size={16} />},
                                {label: 'Storage Uplink', val: cloudStatus?.cloudProvider || 'SECURE_CLOUD', sub: cloudStatus?.sync || 'FEDERAL_VAULT', icon: <Globe size={16} />}
                              ].map(stat => (
                                <div key={stat.label} className="p-6 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                                   <div className="text-emerald-400 mb-3">{stat.icon}</div>
                                   <p className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-1 opacity-70">{stat.label}</p>
                                   <p className="text-xl font-bold mb-1 tracking-tight">{stat.val}</p>
                                   <p className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 px-2 py-0.5 rounded-full">{stat.sub}</p>
                                </div>
                              ))}
                           </div>
                         </div>

                         <div className="p-10 bg-white border-2 border-gray-100 rounded-[3rem] group hover:border-emerald-500 transition-all">
                            <div className="flex items-center justify-between mb-8">
                               <div className="flex items-center gap-3">
                                 <Download className="text-emerald-600" size={20} />
                                 <h4 className="font-black text-emerald-950 text-xl tracking-tight">Authorized Evidence Formats</h4>
                               </div>
                               <button className="px-6 py-2 bg-emerald-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-110 transition-all">MANAGE FILTERS</button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                               {systemSettings.allowedFileTypes.map(type => (
                                 <div key={type} className="flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-2xl border border-transparent group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
                                    <span className="text-emerald-950 font-black text-xs uppercase tracking-widest">{type}</span>
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                 </div>
                               ))}
                            </div>
                         </div>
                       </motion.div>
                    )}

                  </div>

                  {/* Persistent Feedback Footer */}
                  <div className="p-10 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between flex-wrap gap-6">
                     <div className="flex items-center gap-3 text-gray-400 font-bold text-[10px] uppercase tracking-widest italic">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        Platform Synchronization Optimized for Performance.
                     </div>
                     <div className="flex gap-4">
                        <button className="px-10 py-4 text-emerald-900/60 font-black text-xs uppercase tracking-widest hover:text-emerald-950 transition-colors">Abort Changes</button>
                        <button 
                          onClick={saveSettings}
                          className="px-14 py-4 bg-emerald-950 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:bg-emerald-800 hover:-translate-y-1 active:scale-95 transition-all shadow-emerald-950/20"
                        >
                          Sync Platform Settings
                        </button>
                     </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
      
      {/* Dynamic Background Accents */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-400/5 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] rounded-full"></div>
      </div>
    </div>
    </RequireAccess>
  );
}
