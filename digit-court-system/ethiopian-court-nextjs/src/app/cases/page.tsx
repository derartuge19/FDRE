'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Filter, 
  ChevronRight, 
  Eye, 
  Edit3, 
  FileText, 
  MoreVertical,
  Calendar,
  User,
  Shield,
  ArrowUpDown,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings,
  LogOut,
  Bell,
  Gavel,
  Video,
  Users,
  BarChart3,
  MessageSquare,
  Save,
  LayoutDashboard
} from 'lucide-react';

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  type: string;
  status: 'pending' | 'active' | 'completed' | 'urgent';
  plaintiff: string;
  defendant: string;
  judge: string;
  filingDate: string;
  lastUpdate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function Cases() {
  const [currentUser, setCurrentUser] = useState('Loading...');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [cases, setCases] = useState<Case[]>([]);
  const [mounted, setMounted] = useState(false);
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
    
    if (userStr) {
      const userData = JSON.parse(userStr);
      setCurrentUser(userData.name || 'User');
    }

    const fetchCases = async () => {
      const request = indexedDB.open('CourtRecordsDB', 2);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('recordings')) db.createObjectStore('recordings', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('cases')) db.createObjectStore('cases', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('documents')) db.createObjectStore('documents', { keyPath: 'id' });
      };
      
      request.onsuccess = async (e: any) => {
        const db = e.target.result;
        const transaction = db.transaction(['cases'], 'readonly');
        const store = transaction.objectStore('cases');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = async () => {
          if (getAllRequest.result && getAllRequest.result.length > 0) {
             setCases(getAllRequest.result.sort((a: any, b: any) => parseInt(b.timestamp || '0') - parseInt(a.timestamp || '0')));
          } else {
             try {
                const response = await fetch('http://localhost:5173/api/cases', {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                  const apiCases = data.data.map((c: any) => ({
                    id: c.id,
                    caseNumber: c.caseNumber,
                    title: c.title,
                    type: c.type,
                    status: c.status.toLowerCase(),
                    plaintiff: c.plaintiff,
                    defendant: c.defendant,
                    judge: c.assignedJudge || 'Not Assigned',
                    filingDate: c.filingDate,
                    lastUpdate: c.updatedAt || c.filingDate,
                    priority: c.priority.toLowerCase(),
                    timestamp: Date.now()
                  }));
                  
                  const writeTx = db.transaction(['cases'], 'readwrite');
                  const writeStore = writeTx.objectStore('cases');
                  apiCases.forEach((c: any) => writeStore.put(c));
                  
                  setCases(apiCases);
                }
             } catch (err) {
                console.error('Failed to fetch cases:', err);
             }
          }
        };
      };
    };

    if (token) fetchCases();
  }, []);

  const handleCreateCase = async () => {
    const token = localStorage.getItem('courtToken');
    
    // 1. National ID Verification Step (Simulated)
    const idNumber = "ID-" + Math.floor(Math.random() * 1000000);

    try {
      const verifRes = await fetch('http://localhost:5173/api/integration/verify-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ idNumber })
      });
      const verifData = await verifRes.json();
      if (!verifData.verified) {
        setModalConfig({
          isOpen: true,
          title: 'Identity Verification Failure',
          message: 'National ID registry could not authenticate the provided credentials. Registration aborted.',
          type: 'error'
        });
        return;
      }
      
      setModalConfig({
        isOpen: true,
        title: 'ID Verified',
        message: `Identity confirmed for ${verifData.data.fullName}. Linking to institutional payment gateway...`,
        type: 'success'
      });

      // 2. Court Fee Payment Step
      const amount = 500; // Mock court fee
      const payRes = await fetch('http://localhost:5173/api/integration/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount, type: 'CBE Birr', caseId: 'PENDING' })
      });
      const payData = await payRes.json();
      if (payData.status !== 'Completed') {
        setModalConfig({
          isOpen: true,
          title: 'Transaction Failure',
          message: 'The judicial fee payment was rejected by the gateway. Docket initialization suspended.',
          type: 'warning'
        });
        return;
      }
      
      setModalConfig({
        isOpen: true,
        title: 'Payment Confirmed',
        message: `Judicial Transaction ${payData.transactionId} verified. Finalizing docket indices...`,
        type: 'success'
      });

      // 3. Final Docket Initialization (Simulated)
      const title = "New Institutional Case Docket";
      const newCaseId = `CIV-2026-${Math.floor(Math.random() * 900 + 100)}`;
      
      const newCase: Case = {
        id: newCaseId,
        caseNumber: newCaseId,
        title: title,
        type: 'Civil',
        status: 'pending',
        plaintiff: verifData.data.fullName,
        defendant: 'To Be Determined',
        judge: 'Pending Assignment',
        filingDate: new Date().toISOString().split('T')[0],
        lastUpdate: new Date().toISOString().split('T')[0],
        priority: 'medium',
        ...({ timestamp: Date.now() } as any)
      };
      
      const request = indexedDB.open('CourtRecordsDB', 2);
      request.onsuccess = (e: any) => {
         const db = e.target.result;
         const tx = db.transaction(['cases'], 'readwrite');
         const store = tx.objectStore('cases');
         store.add(newCase);
         tx.oncomplete = () => {
            setCases(prev => [newCase, ...prev]);
            setModalConfig({
              isOpen: true,
              title: 'Case Filed Successfully',
              message: `Institutional docket ${newCaseId} has been indexed and committed to the CourtRecordsDB vault.`,
              type: 'success'
            });
         };
      };
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Integration Service Error',
        message: 'The judicial integration engine failed to finalize the docket entry. Please contact the administrator.',
        type: 'error'
      });
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        caseItem.plaintiff.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || caseItem.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      {/* Header */}
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
              <input type="text" placeholder="Search across judicial database..." className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/20 font-medium" />
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
                  <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-emerald-950 font-black">{currentUser[0]}</div>
                  <span className="text-white font-bold text-sm hidden md:block">{currentUser}</span>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-full mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-emerald-50 overflow-hidden z-[200]">
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

      {/* Navigation */}
      <nav className="nav-container sticky top-20 z-[90] bg-[#14532d] overflow-x-auto shadow-md">
        <div className="container mx-auto flex items-center h-16 px-6 gap-2">
          {[
            { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/' },
            { label: 'Cases', icon: <Briefcase size={18} />, href: '/cases', active: true },
            { label: 'Hearings', icon: <Gavel size={18} />, href: '/hearings' },
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
                <span className="bg-emerald-100 px-2 py-1 rounded">System</span>
                <span>/</span>
                <span>Case Archives</span>
              </div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">Docket Management</h1>
              <p className="text-gray-500 font-medium text-lg">Centralized repository for all judicial filings and active litigation.</p>
            </div>
            <button 
              onClick={handleCreateCase}
              className="flex items-center gap-3 px-10 py-5 bg-emerald-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-900 hover:scale-[1.02] transition-all"
            >
              <Plus size={20} className="text-emerald-400" /> Initialize New Docket
            </button>
          </div>

          {/* Quick Filters */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 mb-10 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
               <input 
                 type="text" 
                 placeholder="Search by Case ID, Title, or Legal Representative..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none rounded-2xl transition-all font-bold text-gray-800"
               />
            </div>
            <div className="flex items-center gap-3">
               <select 
                 value={filterStatus}
                 onChange={(e) => setFilterStatus(e.target.value)}
                 className="px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-gray-700 outline-none appearance-none cursor-pointer"
               >
                 <option value="all">All Status Protocol</option>
                 <option value="active">Active Litigation</option>
                 <option value="pending">Pending Validation</option>
                 <option value="urgent">Urgent Processing</option>
                 <option value="completed">Finalized</option>
               </select>
               <button className="p-5 bg-gray-900 text-white rounded-2xl hover:bg-emerald-600 transition-all">
                 <Filter size={20} />
               </button>
            </div>
          </div>

          {/* Dockets Matrix */}
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                         <th className="px-10 py-8 text-[10px] font-black text-emerald-900 uppercase tracking-widest">Case Metadata</th>
                         <th className="px-8 py-8 text-[10px] font-black text-emerald-900 uppercase tracking-widest">Legal Parties</th>
                         <th className="px-8 py-8 text-[10px] font-black text-emerald-900 uppercase tracking-widest">Jurisdiction</th>
                         <th className="px-8 py-8 text-[10px] font-black text-emerald-900 uppercase tracking-widest text-center">Protocol Status</th>
                         <th className="px-8 py-8 text-[10px] font-black text-emerald-900 uppercase tracking-widest">Chronology</th>
                         <th className="px-10 py-8 text-[10px] font-black text-emerald-900 uppercase tracking-widest text-right">Operational Control</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      <AnimatePresence>
                      {filteredCases.map((item, idx) => (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-emerald-50/30 transition-all group"
                        >
                           <td className="px-10 py-10">
                              <div className="flex flex-col gap-1">
                                 <span className="text-emerald-600 font-black tracking-widest text-xs uppercase font-mono">{item.caseNumber}</span>
                                 <span className="text-xl font-black text-gray-900 tracking-tight group-hover:text-emerald-950">{item.title}</span>
                              </div>
                           </td>
                           <td className="px-8 py-10">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg shadow-inner">👤</div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">{item.plaintiff}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">vs {item.defendant}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-10">
                              <div className="flex flex-col gap-1">
                                 <span className="text-sm font-bold text-gray-800">{item.judge}</span>
                                 <span className="text-[10px] font-black text-primary-600/60 uppercase tracking-widest">{item.type} Division</span>
                              </div>
                           </td>
                           <td className="px-8 py-10 text-center">
                              <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                item.status === 'urgent' ? 'bg-red-100 text-red-600' :
                                item.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                                item.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                {item.status}
                              </span>
                           </td>
                           <td className="px-8 py-10">
                              <div className="flex flex-col gap-1">
                                 <span className="text-xs font-bold text-gray-600 flex items-center gap-2">
                                    <Clock size={12} className="text-emerald-400" /> {item.lastUpdate}
                                 </span>
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filed: {item.filingDate}</span>
                              </div>
                           </td>
                           <td className="px-10 py-10">
                              <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-600 hover:bg-emerald-950 hover:text-white transition-all shadow-sm">
                                   <Eye size={18} />
                                 </button>
                                 <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-600 hover:bg-emerald-950 hover:text-white transition-all shadow-sm">
                                   <FileText size={18} />
                                 </button>
                                 <button className="p-3 bg-gray-900 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg">
                                   <Edit3 size={18} />
                                 </button>
                              </div>
                           </td>
                        </motion.tr>
                      ))}
                      </AnimatePresence>
                   </tbody>
                </table>
             </div>
             
             <div className="px-10 py-10 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500 font-medium italic">Displaying authorized docket entries for current administrative cycle.</p>
                <div className="flex gap-2">
                   {[1, 2, 3].map(p => (
                     <button key={p} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${p === 1 ? 'bg-emerald-950 text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-100'}`}>
                       {p}
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </main>
      <Modal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
}
