'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import {  
  FileText, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  Lock, 
  Shield, 
  Trash2, 
  Share2, 
  MoreHorizontal,
  FileCode,
  FileImage,
  Film,
  Music,
  ChevronDown,
  Upload,
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
  User,
  Save
 } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import RequireAccess from '@/components/RequireAccess';
import RoleBasedContent from '@/components/RoleBasedContent';
import { useUserRole, useCurrentUser } from '@/hooks/useUserRole';

interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'image' | 'video' | 'audio';
  category: 'case_file' | 'evidence' | 'judgment' | 'motion' | 'other';
  status: 'signed' | 'approved' | 'pending' | 'rejected' | 'archived';
  uploadDate: string;
  uploadedBy: string;
  size: string;
  caseNumber?: string;
  caseId?: string;
  tags: string[];
  isSigned: boolean;
  isConfidential: boolean;
}

export default function Documents() {
  const [currentUser, setCurrentUser] = useState('Loading...');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [documents, setDocuments] = useState<Document[]>([]);
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
    
    if (userStr && userStr !== 'undefined') {
      try {
  const userData = JSON.parse(userStr);
        setCurrentUser(userData.name || 'User');
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }

    const fetchDocs = async () => {
       const request = indexedDB.open('CourtRecordsDB', 2);
       request.onupgradeneeded = (e: any) => {
         const db = e.target.result;
         if (!db.objectStoreNames.contains('recordings')) db.createObjectStore('recordings', { keyPath: 'id' });
         if (!db.objectStoreNames.contains('cases')) db.createObjectStore('cases', { keyPath: 'id' });
         if (!db.objectStoreNames.contains('documents')) db.createObjectStore('documents', { keyPath: 'id' });
       };
       
       request.onsuccess = async (e: any) => {
          const db = e.target.result;
          const transaction = db.transaction(['documents'], 'readonly');
          const store = transaction.objectStore('documents');
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = async () => {
             if (getAllRequest.result && getAllRequest.result.length > 0) {
                 setDocuments(getAllRequest.result.sort((a: any, b: any) => parseInt(b.timestamp || '0') - parseInt(a.timestamp || '0')));
             } else {
                 try {
                    const response = await fetch('http://localhost:5173/api/cases', {
                         headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (data.success) {
                       const allDocs: Document[] = [];
                       data.data.forEach((c: any) => {
                          c.documents?.forEach((d: any) => {
                             allDocs.push({
                                id: d.id,
                                caseId: c.id,
                                title: d.name,
                                type: 'pdf',
                                category: d.type.toLowerCase().replace(' ', '_') as any,
                                status: d.signed ? 'signed' : 'pending',
                                uploadDate: d.uploadedAt?.split('T')[0] || c.filingDate,
                                uploadedBy: d.uploader || 'Judicial Clerk',
                                size: '1.2 MB',
                                caseNumber: c.caseNumber,
                                tags: [c.type.toLowerCase()],
                                isSigned: d.signed,
                                isConfidential: false,
                                ...({ timestamp: Date.now() } as any)
                             });
                          });
                       });
                       
                       const writeTx = db.transaction(['documents'], 'readwrite');
                       const writeStore = writeTx.objectStore('documents');
                       allDocs.forEach((d: any) => writeStore.put(d));
                       
                       setDocuments(allDocs);
                    }
                 } catch (err) {
                    console.error('Failed to fetch docs:', err);
                 }
             }
          };
       };
    };

    if (token) fetchDocs();
  }, []);

  const handleSign = async (docId: string, caseId: string) => {
    const token = localStorage.getItem('courtToken');
    if (!caseId) { 
      setModalConfig({
        isOpen: true,
        title: 'Association Conflict',
        message: 'No institutional case association found for this document. Authentication protocol aborted.',
        type: 'error'
      });
      return; 
    }
    
    try {
      const res = await fetch(`http://localhost:5173/api/documents/${caseId}/${docId}/sign`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
         setModalConfig({
           isOpen: true,
           title: 'Document Authenticated',
           message: `Digital Stamp generated and verified: ${data.data.signatureHash}. The judgment is now legally indexed.`,
           type: 'success'
         });
      }
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Signature Protocol Error',
        message: 'Neural verification service failed to authorize the digital stamp. Check your judicial clearance.',
        type: 'error'
      });
    }
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const newDoc: Document = {
         id: `DOC-${Date.now()}`,
         title: file.name,
         type: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.png') || file.name.endsWith('.jpg') ? 'image' : 'doc',
         category: 'evidence',
         status: 'pending',
         uploadDate: new Date().toISOString().split('T')[0],
         uploadedBy: currentUser,
         size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
         caseNumber: 'NEW-UPLOAD',
         tags: ['evidence'],
         isSigned: false,
         isConfidential: false
      };

      const request = indexedDB.open('CourtRecordsDB', 2);
      request.onsuccess = (ev: any) => {
         const db = ev.target.result;
         const tx = db.transaction(['documents'], 'readwrite');
         const store = tx.objectStore('documents');
         store.add({...newDoc, timestamp: Date.now()});
         tx.oncomplete = () => {
            setDocuments(prev => [{...newDoc, timestamp: Date.now()} as any, ...prev]);
            setModalConfig({
              isOpen: true,
              title: 'Evidence Upload Protocol',
              message: `Encrypted artifact '${file.name}' has been securely registered to the jurisdictional sandbox.`,
              type: 'success'
            });
         };
      };
    };
    input.click();
  };

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || (doc.caseNumber && doc.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
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
                <span className="bg-emerald-500/10 px-2 py-1 rounded">Registry</span>
                <span>/</span>
                <span>Digital Archives</span>
              </div>
              <h1 className="text-5xl font-black page-text tracking-tighter mb-2">Vault Administration</h1>
              <p className="text-secondary font-medium text-lg">Secure management of judicial records, evidence exhibits, and signed judgments.</p>
            </div>
            <div className="flex gap-4">
               <button className="flex items-center gap-3 px-8 py-5 card-bg border-2 border-emerald-500/10 page-text rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-500/5 transition-all shadow-xl">
                  <Download size={20} className="text-emerald-500" /> Export Archive
               </button>
                <button 
                  onClick={handleUpload}
                  className="flex items-center gap-3 px-10 py-5 bg-emerald-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-emerald-900 transition-all"
                >
                  <Upload size={20} className="text-emerald-400" /> Upload Payload
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
             {[
               { label: 'Total Records', value: '15.2k', icon: <FileText />, color: 'emerald' },
               { label: 'Signed Judgments', value: '3,842', icon: <CheckCircle />, color: 'blue' },
               { label: 'Pending Review', value: '124', icon: <Clock />, color: 'amber' },
               { label: 'Restricted Files', value: '52', icon: <Lock />, color: 'red' }
             ].map((stat, idx) => (
               <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="card-bg p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-500/10 flex flex-col items-center text-center">
                  <div className={`w-14 h-14 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-2xl mb-4 text-${stat.color}-500 shadow-inner`}>{stat.icon}</div>
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-black page-text tracking-tighter">{stat.value}</p>
               </motion.div>
             ))}
          </div>

          <div className="card-bg p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-500/10 mb-10 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-500" size={20} />
               <input 
                 type="text" 
                 placeholder="Search by Filename, Case Number, or Registry ID..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-16 pr-8 py-5 bg-emerald-500/5 border-2 border-transparent focus:border-emerald-500 focus:bg-transparent outline-none rounded-2xl transition-all font-bold page-text shadow-inner placeholder:text-muted"
               />
            </div>
             <div className="flex items-center gap-3">
               <select 
                 value={filterCategory}
                 onChange={(e) => setFilterCategory(e.target.value)}
                 className="px-6 py-5 bg-emerald-500/5 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-secondary outline-none appearance-none cursor-pointer shadow-inner"
               >
                 <option value="all">All Categories</option>
                 <option value="case_file">Primary Case Files</option>
                 <option value="evidence">Evidence Exhibits</option>
                 <option value="judgment">Final Judgments</option>
                 <option value="motion">Advocate Motions</option>
               </select>
               <button className="p-5 bg-emerald-950 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg"><Filter size={20} /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             <AnimatePresence>
             {filteredDocs.map((doc, idx) => (
               <motion.div 
                 key={doc.id}
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: idx * 0.05 }}
                 className="card-bg rounded-[3rem] border border-emerald-500/10 shadow-2xl shadow-emerald-950/5 overflow-hidden group hover:border-emerald-500 transition-all flex flex-col"
               >
                  <div className="p-10 flex-1">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                           {doc.type === 'pdf' ? <FileText className="text-red-500" /> : doc.type === 'image' ? <FileImage className="text-blue-500" /> : <FileCode className="text-emerald-500" />}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                             doc.status === 'signed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                           }`}>{doc.status}</span>
                           {doc.isConfidential && <span className="p-2 bg-red-100 text-red-600 rounded-xl shadow-sm"><Shield size={14} /></span>}
                        </div>
                     </div>
                     
                     <h3 className="text-xl font-black page-text tracking-tight leading-tight mb-4 group-hover:text-emerald-500 transition-colors line-clamp-2">{doc.title}</h3>
                     
                     <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                           <span className="text-[10px] font-black text-muted uppercase tracking-widest">Case ID</span>
                           <span className="text-xs font-bold page-text">{doc.caseNumber}</span>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 border border-dashed border-emerald-500/20 rounded-xl">
                           <span className="text-[10px] font-black text-muted uppercase tracking-widest">Category</span>
                           <span className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">{doc.category.replace('_', ' ')}</span>
                        </div>
                     </div>

                      <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-2xl text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                         <span>{doc.size}</span>
                         <div className="w-1 h-1 bg-emerald-500/30 rounded-full"></div>
                         <span>Uploaded: {doc.uploadDate}</span>
                      </div>
                  </div>

                   <div className="p-6 bg-emerald-500/5 border-t border-emerald-500/10 flex items-center justify-between">
                      <div className="flex gap-2">
                         <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-card-bg border border-emerald-500/10 text-muted hover:bg-emerald-950 hover:text-white transition-all shadow-sm"><Eye size={16} /></button>
                         <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-card-bg border border-emerald-500/10 text-muted hover:bg-emerald-950 hover:text-white transition-all shadow-sm"><Share2 size={16} /></button>
                         <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-card-bg border border-emerald-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={16} /></button>
                      </div>
                     <button className="flex items-center gap-2 px-6 py-3 bg-emerald-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-800 transition-all">
                        <Download size={14} className="text-emerald-400" /> Retrieve
                     </button>
                  </div>
               </motion.div>
             ))}
             </AnimatePresence>
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
