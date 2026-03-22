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
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import RequireAccess from '@/components/RequireAccess';
import RoleBasedContent from '@/components/RoleBasedContent';
import { useUserRole, useCurrentUser } from '@/hooks/useUserRole';
import { filterCasesByRole } from '@/lib/dataFilters';

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
  const userRole = useUserRole();
  const currentUserData = useCurrentUser();
  const [currentUser, setCurrentUser] = useState('Loading...');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [cases, setCases] = useState<Case[]>([]);
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [mounted, setMounted] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean, 
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' | 'security' | 'judicial',
    confirmLabel?: string,
    cancelLabel?: string
  }>({
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
        setCurrentUser(userData.name || 'User');
      } catch (e) {
        console.error('Failed to parse user data');
      }
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
             setAllCases(getAllRequest.result.sort((a: any, b: any) => parseInt(b.timestamp || '0') - parseInt(a.timestamp || '0')));
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
                    status: (c.status || 'pending').toLowerCase(),
                    plaintiff: c.plaintiff,
                    defendant: c.defendant,
                    judge: c.assignedJudge || 'Not Assigned',
                    filingDate: c.filingDate,
                    lastUpdate: c.updatedAt || c.filingDate,
                    priority: (c.priority || 'medium').toLowerCase(),
                    timestamp: Date.now()
                  }));
                  
                  const writeTx = db.transaction(['cases'], 'readwrite');
                  const writeStore = writeTx.objectStore('cases');
                  apiCases.forEach((c: any) => writeStore.put(c));
                  
                  setAllCases(apiCases);
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

  // Filter cases based on user role
  useEffect(() => {
    if (currentUserData && allCases.length > 0) {
      const filtered = filterCasesByRole(allCases as any, userRole, currentUserData.id);
      setCases(filtered as Case[]);
    }
  }, [allCases, userRole, currentUserData]);

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

      // 3. Final Docket Commitment to Real Database
      const newCaseData = {
        title: "Institutional Dispute Registry",
        type: 'Civil',
        plaintiff: verifData.data.fullName,
        defendant: 'ABC International',
        priority: 'high'
      };

      const caseRes = await fetch('http://localhost:5173/api/cases', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newCaseData)
      });
      
      const caseData = await caseRes.json();
      
      if (caseData.success) {
        setCases(prev => [caseData.data, ...prev]);
        setModalConfig({
          isOpen: true,
          title: 'Institutional Docket Committed',
          message: `Case ${caseData.data.id} has been successfully synchronized with the Federal Judiciary Hub and committed to the PostgreSQL vault.`,
          type: 'success'
        });
      }
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
    <RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK', 'LAWYER', 'PLAINTIFF', 'DEFENDANT', 'USER']}>
    <div className="min-h-screen page-bg page-text">
      {/* Header */}
      <Header />

      {/* Navigation */}
      <Navigation />

      <main className="main-container py-10 px-6">
        <div className="container mx-auto">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest mb-3">
                <span className="bg-emerald-500/10 px-2 py-1 rounded">System</span>
                <span>/</span>
                <span>Case Archives</span>
              </div>
              <h1 className="text-5xl font-black page-text tracking-tighter mb-2">Docket Management</h1>
              <p className="text-secondary font-medium text-lg">Centralized repository for all judicial filings and active litigation.</p>
            </div>
            <RoleBasedContent allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN', 'JUDGE', 'CLERK']}>
              <button 
                onClick={handleCreateCase}
                className="flex items-center gap-3 px-10 py-5 bg-emerald-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-900 hover:scale-[1.02] transition-all"
              >
                <Plus size={20} className="text-emerald-400" /> Initialize New Docket
              </button>
            </RoleBasedContent>
          </div>

          {/* Quick Filters */}
          <div className="card-bg p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-500/10 mb-10 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
               <input 
                 type="text" 
                 placeholder="Search by Case ID, Title, or Legal Representative..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-16 pr-8 py-5 card-bg border-2 border-transparent focus:border-emerald-500 outline-none rounded-2xl transition-all font-bold page-text"
               />
            </div>
            <div className="flex items-center gap-3">
               <select 
                 value={filterStatus}
                 onChange={(e) => setFilterStatus(e.target.value)}
                 className="px-6 py-5 bg-emerald-500/5 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold page-text outline-none appearance-none cursor-pointer"
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
          <div className="card-bg rounded-[3rem] shadow-2xl shadow-emerald-950/5 border border-emerald-500/10 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-emerald-500/5 border-b border-emerald-500/10">
                         <th className="px-10 py-8 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Case Metadata</th>
                         <th className="px-8 py-8 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Legal Parties</th>
                         <th className="px-8 py-8 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Jurisdiction</th>
                         <th className="px-8 py-8 text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center">Protocol Status</th>
                         <th className="px-8 py-8 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Chronology</th>
                         <th className="px-10 py-8 text-[10px] font-black text-emerald-500 uppercase tracking-widest text-right">Operational Control</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-emerald-500/5">
                      <AnimatePresence>
                      {filteredCases.map((item, idx) => (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-emerald-500/5 transition-all group"
                        >
                           <td className="px-10 py-10">
                              <div className="flex flex-col gap-1">
                                 <span className="text-emerald-500 font-black tracking-widest text-xs uppercase font-mono">{item.caseNumber}</span>
                                 <span className="text-xl font-black page-text tracking-tight group-hover:text-emerald-500">{item.title}</span>
                              </div>
                           </td>
                           <td className="px-8 py-10">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 card-bg rounded-xl flex items-center justify-center text-lg shadow-inner border border-emerald-500/10">👤</div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold page-text">{item.plaintiff}</span>
                                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">vs {item.defendant}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-10">
                              <div className="flex flex-col gap-1">
                                 <span className="text-sm font-bold text-secondary">{item.judge}</span>
                                 <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">{item.type} Division</span>
                              </div>
                           </td>
                           <td className="px-8 py-10 text-center">
                              <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                item.status === 'urgent' ? 'bg-red-500/10 text-red-500' :
                                item.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                                item.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-blue-500/10 text-blue-500'
                              }`}>
                                {item.status}
                              </span>
                           </td>
                           <td className="px-8 py-10">
                              <div className="flex flex-col gap-1">
                                 <span className="text-xs font-bold text-secondary flex items-center gap-2">
                                    <Clock size={12} className="text-emerald-500" /> {item.lastUpdate}
                                 </span>
                                 <span className="text-[10px] font-black text-muted uppercase tracking-widest">Filed: {item.filingDate}</span>
                              </div>
                           </td>
                           <td className="px-10 py-10">
                              <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-3 card-bg border border-emerald-500/10 text-muted hover:bg-emerald-950 hover:text-white transition-all shadow-sm">
                                   <Eye size={18} />
                                 </button>
                                 <button className="p-3 card-bg border border-emerald-500/10 text-muted hover:bg-emerald-950 hover:text-white transition-all shadow-sm">
                                   <FileText size={18} />
                                 </button>
                                 <button className="p-3 bg-emerald-950 text-emerald-400 rounded-xl hover:bg-emerald-900 transition-all shadow-lg border border-emerald-500/20">
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
             
             <div className="px-10 py-10 bg-emerald-500/5 border-t border-emerald-500/10 flex items-center justify-between">
                <p className="text-sm text-muted font-medium italic">Displaying authorized docket entries for current administrative cycle.</p>
                <div className="flex gap-2">
                   {[1, 2, 3].map(p => (
                     <button key={p} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${p === 1 ? 'bg-emerald-950 text-white shadow-lg' : 'card-bg border border-emerald-500/10 text-muted hover:bg-emerald-500/10 page-text'}`}>
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
    </RequireAccess>
  );
}
