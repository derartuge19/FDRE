'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import RequireAccess from '@/components/RequireAccess';
import { 
  Shield, 
  Lock, 
  Key, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Activity, 
  Bell, 
  Settings, 
  LogOut,
  ChevronRight,
  Fingerprint,
  Eye,
  EyeOff,
  RefreshCw,
  Server
} from 'lucide-react';

export default function SecurityPortal() {
  const [currentUser, setCurrentUser] = useState('Admin');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'policies' | 'firewall' | 'encryption'>('policies');

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('courtUser');
    if (userStr && userStr !== 'undefined') {
      try {
  const userData = JSON.parse(userStr);
        setCurrentUser(userData.name || 'Admin');
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  const handleRotateKeys = () => {
    setModalConfig({
      isOpen: true,
      title: 'RSA Keys Rotated',
      message: 'System-wide asymmetric key rotation completed. All active sessions have been re-validated with the central authority.',
      type: 'success'
    });
  };

  const handleDeepScan = () => {
    setModalConfig({
      isOpen: true,
      title: 'Deep Scan Initiated',
      message: 'Anti-intrusion engines are currently scanning the judicial backbone for neural anomalies and policy violations.',
      type: 'info'
    });
  };

  if (!mounted) return null;

  return (
    <RequireAccess allowedRoles={['SYSTEM_ADMIN']}>
    <div className="min-h-screen page-bg page-text">
      {/* Header */}
      <Header />

      <Navigation />

      <main className="py-12 px-6">
        <div className="container mx-auto">
          {/* Hero Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-16 px-4">
             <div>
                <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                   <ShieldAlert size={14} className="animate-pulse" /> Threat Detection Level: Optimal
                </div>
                <h1 className="text-6xl font-black page-text tracking-tighter mb-4 leading-none uppercase">Security Core</h1>
                <p className="text-secondary font-bold text-lg max-w-2xl font-mono opacity-80 leading-relaxed uppercase">Advanced cryptographic governance and access policy orchestration for the digital judiciary.</p>
             </div>
             
             <div className="flex gap-4">
                <button 
                  onClick={handleRotateKeys}
                  className="flex items-center gap-3 px-8 py-5 card-bg border border-emerald-500/10 page-text rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500/5 transition-all shadow-2xl"
                >
                   <RefreshCw size={18} className="text-emerald-500" /> Rotate Keys
                </button>
                <button 
                  onClick={handleDeepScan}
                  className="flex items-center gap-3 px-10 py-5 bg-emerald-600 text-emerald-950 rounded-3xl font-black text-xs uppercase tracking-widest shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:bg-emerald-500 transition-all"
                >
                   <ShieldCheck size={18} /> Deep Scan
                </button>
             </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
             {[
               { label: 'Active Sessions', value: '142', icon: <Fingerprint />, trend: 'SECURE' },
               { label: 'MFA Compliance', value: '100%', icon: <Lock />, trend: 'OPTIMAL' },
               { label: 'Blocked Attacks', value: '12,402', icon: <ShieldAlert />, trend: 'MITIGATED' },
               { label: 'System Uptime', value: '99.99%', icon: <Activity />, trend: 'STABLE' }
             ].map((stat, idx) => (
                <motion.div 
                   key={stat.label} 
                   initial={{ opacity: 0, y: 20 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   transition={{ delay: idx * 0.1 }}
                   className="bg-[#1e293b]/50 p-8 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col items-center text-center group hover:border-emerald-500/50 transition-all"
                >
                   <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-2xl mb-6 text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">{stat.icon}</div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                   <p className="text-4xl font-black text-white tracking-tighter mb-4 font-mono">{stat.value}</p>
                   <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-emerald-400 tracking-widest border border-emerald-500/20">{stat.trend}</div>
                </motion.div>
             ))}
          </div>

          {/* Security Content */}
          <div className="bg-[#0f172a] rounded-[4rem] border border-white/5 shadow-2xl p-12">
             <div className="flex gap-2 p-1.5 bg-white/5 rounded-3xl border border-white/5 mb-12 max-w-xl mx-auto">
                {[
                  { id: 'policies', label: 'Access Policies', icon: <Key size={14}/> },
                  { id: 'firewall', label: 'Network Firewall', icon: <Shield size={14}/> },
                  { id: 'encryption', label: 'Encryption Node', icon: <Server size={14}/> }
                ].map(tab => (
                   <button 
                     key={tab.id} 
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-emerald-600 text-emerald-950 shadow-2xl' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                      {tab.icon} {tab.label}
                   </button>
                ))}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[
                  { title: 'Biometric MFA', desc: 'Enforce fingerprint or facial recognition for high-priority case modifications.', status: 'ENABLED', icon: <Fingerprint className="text-blue-500" /> },
                  { title: 'RSA-4096 Encryption', desc: 'All document payloads are encrypted with 4096-bit asymmetric keys.', status: 'ENABLED', icon: <Lock className="text-emerald-500" /> },
                  { title: 'Intrusion Detection', desc: 'Real-time analysis of neural traffic for pattern anomalies.', status: 'ACTIVE', icon: <Activity className="text-amber-500" /> },
                  { title: 'Audit Persistence', desc: 'Immutable logging of all administrative actions to the central chain.', status: 'ENFORCED', icon: <ShieldAlert className="text-red-500" /> }
                ].map((item, idx) => (
                   <div key={idx} className="bg-[#1e293b]/30 p-10 rounded-[3rem] border border-white/5 hover:border-emerald-500/50 transition-all cursor-pointer group">
                      <div className="flex items-center gap-8">
                         <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">{item.icon}</div>
                         <div>
                            <h4 className="text-2xl font-black text-white tracking-tighter mb-2 uppercase">{item.title}</h4>
                            <p className="text-slate-500 font-bold text-xs font-mono max-w-sm leading-relaxed">{item.desc}</p>
                         </div>
                      </div>
                      <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{item.status}</span>
                         </div>
                         <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Configure System</button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>
      </main>

      <footer className="py-24 text-center opacity-20 select-none pointer-events-none">
         <p className="text-[10px] font-black uppercase tracking-[1em] text-emerald-500/50">SECURE PROTOCOL // FDRE DIGITAL JURISDICTION // 2026</p>
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

