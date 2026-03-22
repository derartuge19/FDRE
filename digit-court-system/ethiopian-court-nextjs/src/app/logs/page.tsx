'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import RequireAccess from '@/components/RequireAccess';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import { 
  Shield, 
  Terminal, 
  Activity, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Download, 
  RefreshCcw, 
  Clock, 
  Settings, 
  LogOut, 
  Bell, 
  LayoutDashboard, 
  Briefcase, 
  Gavel, 
  Video, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Save, 
  User,
  Database,
  Cpu,
  Globe,
  Zap,
  Server
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  status: 'success' | 'failure' | 'warning';
  ip: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function AuditLogs() {
  const [currentUser, setCurrentUser] = useState('Loading...');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'security' | 'telemetry'>('audit');
  
  const [systemStats, setSystemStats] = useState({
    cpu: 14,
    memory: 2.4,
    latency: 12,
    uptime: '142d 06h 22m',
    connections: 842
  });

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
        setCurrentUser(userData.name || 'Admin');
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }

    // Mock Audit Logs
    const mockLogs: AuditLog[] = [
      { id: 'LOG-001', timestamp: new Date().toISOString(), actor: 'admin.beckele', action: 'MFA_BYPASS_ATTEMPT', target: 'Security_Policy_7', status: 'failure', ip: '192.168.1.104', severity: 'critical' },
      { id: 'LOG-002', timestamp: new Date(Date.now() - 3600000).toISOString(), actor: 'judge.tesfaye', action: 'JUDGMENT_SIGNED', target: 'CASE-2026-044', status: 'success', ip: '10.0.4.12', severity: 'low' },
      { id: 'LOG-003', timestamp: new Date(Date.now() - 7200000).toISOString(), actor: 'system', action: 'DB_BACKUP_COMPLETED', target: 'Central_Vault', status: 'success', ip: 'internal', severity: 'low' },
      { id: 'LOG-004', timestamp: new Date(Date.now() - 86400000).toISOString(), actor: 'clerk.netsanet', action: 'PERMISSION_UPGRADE_REQ', target: 'Personnel_Registry', status: 'warning', ip: '192.168.1.201', severity: 'medium' },
      { id: 'LOG-005', timestamp: new Date(Date.now() - 172800000).toISOString(), actor: 'unknown', action: 'UNAUTHORIZED_API_ACCESS', target: 'Auth_Gateway', status: 'failure', ip: '45.12.8.99', severity: 'high' }
    ];
    setLogs(mockLogs);

    const fetchAudit = async () => {
       try {
          const res = await fetch('http://localhost:5173/api/system/audit-logs', {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.data) {
             setLogs(data.data.map((l: any) => ({
                id: l.id,
                actor: l.userId || 'System',
                action: l.action,
                target: l.details || 'N/A',
                timestamp: l.timestamp,
                severity: l.action.includes('ERROR') || l.action.includes('FAIL') ? 'high' : 'low',
                location: 'Central Registry'
             })));
          }
       } catch (err) {
          console.error('Audit telemetry failure:', err);
       }
    };

    if (token) fetchAudit();

    // Stats simulation
    const interval = setInterval(() => {
        setSystemStats(prev => ({
            ...prev,
            cpu: Math.floor(Math.random() * 20) + 5,
            latency: Math.floor(Math.random() * 15) + 8,
            connections: prev.connections + (Math.random() > 0.5 ? 1 : -1)
        }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  const handleExportChain = () => {
    setModalConfig({
      isOpen: true,
      title: 'Audit Chain Exported',
      message: 'The full judicial audit chain has been encrypted and exported as a cryptographically signed JSON ledger.',
      type: 'success'
    });
  };

  const handleUpdateFirewall = () => {
    setModalConfig({
      isOpen: true,
      title: 'Firewall Updated',
      message: 'Network ingress/egress rules have been synchronized across all federal judicial nodes.',
      type: 'success'
    });
  };

  const handleRefreshLogs = () => {
    setModalConfig({
      isOpen: true,
      title: 'Telemetry Refreshed',
      message: 'Observer Node has completed a full handshake with the central federal database.',
      type: 'info'
    });
  };

  const filteredLogs = logs.filter(log => 
    log.actor.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(log => filterSeverity === 'all' || log.severity === filterSeverity);

  if (!mounted) return null;

  return (
    <RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN']}>
    <div className="min-h-screen page-bg page-text font-sans">
      <Header />

      <Navigation />

      <main className="py-12 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-16 px-4">
             <div>
                <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                   <Activity size={14} className="animate-pulse" /> Judicial Telemetry Engine
                </div>
                <h1 className="text-6xl font-black page-text tracking-tighter mb-4 leading-none uppercase">Observer Node</h1>
                <p className="text-secondary font-bold text-lg max-w-2xl font-mono opacity-80 leading-relaxed uppercase">Neural audit monitoring for the Ethiopian digital jurisdiction. Encrypted policy enforcement & system health.</p>
             </div>
             
             <div className="flex gap-4">
                <button 
                  onClick={handleExportChain}
                  className="flex items-center gap-3 px-8 py-5 card-bg border border-emerald-500/10 page-text rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500/5 transition-all shadow-2xl font-mono"
                >
                   <Download size={18} className="text-emerald-500" /> Export Chain
                </button>
                <button 
                  onClick={handleUpdateFirewall}
                  className="flex items-center gap-3 px-10 py-5 bg-emerald-600 text-emerald-950 rounded-3xl font-black text-xs uppercase tracking-widest shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:bg-emerald-500 transition-all font-mono"
                >
                   <Shield size={18} /> Update Firewall
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
             {[
               { label: 'Neural CPU Load', value: `${systemStats.cpu}%`, icon: <Cpu />, color: 'emerald', trend: 'STABLE' },
               { label: 'Memory Allocation', value: `${systemStats.memory} TB`, icon: <Database />, color: 'blue', trend: 'OPTIMIZED' },
               { label: 'Backbone Latency', value: `${systemStats.latency}ms`, icon: <Zap />, color: 'amber', trend: 'ULTRA_FAST' },
               { label: 'Authorized Nodes', value: `${systemStats.connections}`, icon: <Globe />, color: 'purple', trend: 'ENCRYPTED' }
             ].map((stat, idx) => (
                <motion.div 
                   key={stat.label} 
                   initial={{ opacity: 0, y: 20 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   transition={{ delay: idx * 0.1 }}
                   className="card-bg p-8 rounded-[2rem] border border-emerald-500/10 shadow-2xl flex flex-col items-center text-center group hover:border-emerald-500/50 transition-all"
                >
                   <div className={`w-14 h-14 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-2xl mb-6 text-${stat.color}-500 shadow-inner group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                   <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                   <p className="text-4xl font-black page-text tracking-tighter mb-4 font-mono">{stat.value}</p>
                   <div className="px-3 py-1 bg-emerald-500/10 rounded-full text-[8px] font-black text-emerald-400 tracking-widest border border-emerald-500/20">{stat.trend}</div>
                </motion.div>
             ))}
          </div>

          {/* TAB CONTROL */}
          <div className="flex gap-2 p-1.5 bg-white/5 rounded-3xl border border-white/5 mb-10 max-w-xl mx-auto">
             {[
               { id: 'audit', label: 'Central Audit Chain', icon: <Terminal size={14}/> },
               { id: 'security', label: 'Access Policies', icon: <Lock size={14}/> },
               { id: 'telemetry', label: 'Health Monitor', icon: <Server size={14}/> }
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

          <AnimatePresence mode="wait">
            {activeTab === 'audit' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="card-bg p-6 rounded-[2.5rem] border border-emerald-500/10 shadow-2xl flex flex-wrap items-center gap-4 mb-10">
                   <div className="flex-1 min-w-[300px] relative group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                      <input 
                        type="text" 
                        placeholder="Scan audit logs via Actor ID, Neural Signature, or Target Object..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-emerald-500/5 border-2 border-transparent focus:border-emerald-500 outline-none rounded-2xl transition-all font-mono font-bold page-text shadow-inner placeholder:text-muted"
                      />
                   </div>
                   <div className="flex items-center gap-3">
                      <select 
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                        className="px-8 py-5 bg-emerald-500/5 border-2 border-transparent focus:border-red-500 rounded-2xl font-mono font-bold text-red-500 outline-none appearance-none cursor-pointer shadow-inner uppercase text-xs"
                      >
                        <option value="all">Global Priority</option>
                        <option value="critical">Critical Only</option>
                        <option value="high">Threat Detected</option>
                        <option value="medium">Modifications</option>
                        <option value="low">Sync Logs</option>
                      </select>
                      <button 
                        onClick={handleRefreshLogs}
                        className="p-5 bg-white text-black rounded-2xl hover:bg-emerald-500 transition-all shadow-lg"
                      >
                         <RefreshCcw size={20} />
                      </button>
                   </div>
                </div>

                <div className="card-bg rounded-[3rem] border border-emerald-500/10 shadow-2xl overflow-hidden">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono">
                         <thead>
                            <tr className="border-b border-emerald-500/10 bg-emerald-500/5">
                               {['Timestamp', 'Neural Identity', 'Action Protocol', 'Target Object', 'Origin IP', 'Severity'].map(th => (
                                 <th key={th} className="px-10 py-6 text-[10px] font-black text-emerald-500 uppercase tracking-widest">{th}</th>
                               ))}
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-emerald-500/5">
                            {filteredLogs.map((log) => (
                               <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-emerald-500/5 transition-all">
                                  <td className="px-10 py-8 text-[11px] text-muted font-bold">{new Date(log.timestamp).toLocaleString()}</td>
                                  <td className="px-10 py-8">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500 text-[10px]">@{log.actor[0]}</div>
                                        <span className="text-xs font-black page-text">{log.actor}</span>
                                     </div>
                                  </td>
                                  <td className="px-10 py-8">
                                     <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">{log.action}</span>
                                  </td>
                                  <td className="px-10 py-8 text-xs font-medium text-secondary">{log.target}</td>
                                  <td className="px-10 py-8 text-[10px] font-black text-muted">{log.ip}</td>
                                  <td className="px-10 py-8">
                                     <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black uppercase ${
                                       log.severity === 'critical' ? 'bg-red-500/20 text-red-500 border-red-500/30 font-bold' :
                                       log.severity === 'high' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' :
                                       'bg-emerald-500/10 text-muted border-emerald-500/10'
                                     }`}>
                                        {log.severity === 'critical' && <AlertTriangle size={12} />}
                                        {log.severity}
                                     </div>
                                  </td>
                               </motion.tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                   {filteredLogs.length === 0 && (
                      <div className="py-24 text-center">
                         <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700"><Search size={32} /></div>
                         <h4 className="text-xl font-black text-slate-600 uppercase tracking-tighter">Chain Empty</h4>
                         <p className="text-slate-700 font-bold text-xs font-mono">No audit records matched your current neural scan parameters.</p>
                      </div>
                   )}
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {[
                   { title: 'Neural MFA Enforcement', desc: 'Require cryptographic biometric verification for all judicial appointments and data modifications.', icon: <Lock className="text-blue-500" />, status: 'ACTIVE' },
                   { title: 'Geofencing Protocol', desc: 'Restrict neural uplink to authorized federal IP blocks and government intranets.', icon: <Globe className="text-emerald-500" />, status: 'ACTIVE' },
                   { title: 'Zero-Knowledge Auditing', desc: 'Encrypt audit logs before persistence to ensure tamper-proof historical recordkeeping.', icon: <Shield className="text-purple-500" />, status: 'ACTIVE' },
                   { title: 'MFA Grace Periods', desc: 'Allows authenticated users 30 minutes of unrestricted terminal access before re-authentication.', icon: <Clock className="text-amber-500" />, status: 'DISABLED' }
                 ].map((policy, idx) => (
                   <div key={idx} className="bg-[#1e293b]/50 p-10 rounded-[3rem] border border-white/5 shadow-2xl flex items-center justify-between group hover:border-emerald-500/50 transition-all cursor-pointer">
                      <div className="flex items-center gap-8">
                         <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">{policy.icon}</div>
                         <div>
                            <h4 className="text-2xl font-black text-white tracking-tighter mb-2 uppercase">{policy.title}</h4>
                            <p className="text-slate-500 font-bold text-xs font-mono max-w-sm leading-relaxed">{policy.desc}</p>
                         </div>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-widest ${policy.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-white/5 text-slate-700 border border-white/5 opacity-30'}`}>
                         {policy.status}
                      </div>
                   </div>
                 ))}
              </motion.div>
            )}

            {activeTab === 'telemetry' && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="bg-[#0f172a] rounded-[4rem] p-12 border border-white/5 relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full -mr-48 -mt-48 animate-pulse"></div>
                     <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                        <div>
                           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Neural Health Score</p>
                           <h3 className="text-8xl font-black text-white tracking-tighter font-mono">99.8<span className="text-2xl text-emerald-500 opacity-50">%</span></h3>
                           <p className="text-slate-500 font-bold text-xs mt-4 uppercase">System status is within judicial guidelines.</p>
                        </div>
                        <div className="flex flex-col justify-center space-y-6">
                           {[
                             { label: 'DB THROUGHPUT', val: '4.2 GB/s', color: 'emerald' },
                             { label: 'AUTH LATENCY', val: '12ms', color: 'emerald' },
                             { label: 'LOG INTEGRITY', val: 'VALIDATED', color: 'blue' }
                           ].map(it => (
                             <div key={it.label}>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{it.label}</p>
                                <div className="flex items-center gap-4">
                                   <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                      <motion.div initial={{ width: 0 }} animate={{ width: '90%' }} className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                                   </div>
                                   <span className="text-xs font-black text-white font-mono">{it.val}</span>
                                </div>
                             </div>
                           ))}
                        </div>
                        <div className="flex flex-col items-center md:items-end justify-center">
                           <div className="w-32 h-32 rounded-full border-8 border-white/5 p-4 flex items-center justify-center relative">
                              <div className="absolute inset-0 border-8 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                              <Server size={48} className="text-emerald-500 opacity-50" />
                           </div>
                           <p className="text-[10px] font-black text-emerald-500 uppercase mt-6 tracking-widest">Real-time Pulse active</p>
                        </div>
                     </div>
                  </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="py-24 text-center opacity-20 select-none pointer-events-none">
         <p className="text-[10px] font-black uppercase tracking-[1em] text-emerald-500/50">NEURAL AUDIT NODE // FEDERATION PROTOCOL 2026 // FDRE DIGITAL JURISDICTION</p>
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

