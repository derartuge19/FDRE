'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  User
} from 'lucide-react';

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
    
    if (userStr) {
      const userData = JSON.parse(userStr);
      setCurrentUser(userData.name || 'User');
    }

    const fetchDocs = async () => {
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
                      caseId: c.id, // Internal ID for API calls
                      title: d.name,
                      type: 'pdf',
                      category: d.type.toLowerCase().replace(' ', '_'),
                      status: d.signed ? 'signed' : 'pending',
                      uploadDate: d.uploadedAt?.split('T')[0] || c.filingDate,
                      uploadedBy: d.uploader || 'Judicial Clerk',
                      size: '1.2 MB',
                      caseNumber: c.caseNumber,
                      tags: [c.type.toLowerCase()],
                      isSigned: d.signed,
                      isConfidential: false
                   });
                });
             });
             setDocuments(allDocs);
          }
       } catch (err) {
          console.error('Failed to fetch docs:', err);
       }
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
    setModalConfig({
      isOpen: true,
      title: 'Evidence Upload Protocol',
      message: 'Secure channel established. Please select the jurisdictional files for case association and neural encryption.',
      type: 'info'
    });
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
    <div className="min-h-screen bg-[#f8f6f3]">
      {/* Header */}
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
              <input type="text" placeholder="Search document repository..." className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/20 font-medium" />
            </div>
            
            <div className="flex items-center gap-6">
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
      <nav className="nav-container bg-[#14532d] overflow-x-auto shadow-md">
        <div className="container mx-auto flex items-center h-16 px-6 gap-2">
          {[
            { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/' },
            { label: 'Cases', icon: <Briefcase size={18} />, href: '/cases' },
            { label: 'Hearings', icon: <Gavel size={18} />, href: '/hearings' },
            { label: 'Documents', icon: <FileText size={18} />, href: '/documents', active: true },
            { label: 'Virtual Hearing', icon: <Video size={18} />, href: '/virtual-hearing' },
            { label: 'Users', icon: <Users size={18} />, href: '/users' },
            { label: 'Reports', icon: <BarChart3 size={18} />, href: '/reports' },
            { label: 'Messages', icon: <MessageSquare size={18} />, href: '/communication' },
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
                <span className="bg-emerald-100 px-2 py-1 rounded">Registry</span>
                <span>/</span>
                <span>Digital Archives</span>
              </div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">Vault Administration</h1>
              <p className="text-gray-500 font-medium text-lg">Secure management of judicial records, evidence exhibits, and signed judgments.</p>
            </div>
            <div className="flex gap-4">
               <button className="flex items-center gap-3 px-8 py-5 bg-white border-2 border-gray-100 text-gray-900 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all shadow-xl">
                  <Download size={20} className="text-emerald-600" /> Export Archive
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
               <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 flex flex-col items-center text-center">
                  <div className={`w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl mb-4 text-${stat.color}-500 shadow-inner`}>{stat.icon}</div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
               </motion.div>
             ))}
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 mb-10 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500" size={20} />
               <input 
                 type="text" 
                 placeholder="Search by Filename, Case Number, or Registry ID..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none rounded-2xl transition-all font-bold text-gray-800 shadow-inner"
               />
            </div>
             <div className="flex items-center gap-3">
               <select 
                 value={filterCategory}
                 onChange={(e) => setFilterCategory(e.target.value)}
                 className="px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-gray-700 outline-none appearance-none cursor-pointer"
               >
                 <option value="all">All Categories</option>
                 <option value="case_file">Primary Case Files</option>
                 <option value="evidence">Evidence Exhibits</option>
                 <option value="judgment">Final Judgments</option>
                 <option value="motion">Advocate Motions</option>
               </select>
               <button className="p-5 bg-gray-900 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg"><Filter size={20} /></button>
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
                 className="bg-white rounded-[3rem] border border-emerald-50/50 shadow-2xl shadow-emerald-950/5 overflow-hidden group hover:border-emerald-500 transition-all flex flex-col"
               >
                  <div className="p-10 flex-1">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                           {doc.type === 'pdf' ? <FileText className="text-red-500" /> : doc.type === 'image' ? <FileImage className="text-blue-500" /> : <FileCode className="text-emerald-500" />}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                             doc.status === 'signed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                           }`}>{doc.status}</span>
                           {doc.isConfidential && <span className="p-2 bg-red-100 text-red-600 rounded-xl shadow-sm"><Shield size={14} /></span>}
                        </div>
                     </div>
                     
                     <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight mb-4 group-hover:text-emerald-950 transition-colors line-clamp-2">{doc.title}</h3>
                     
                     <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Case ID</span>
                           <span className="text-xs font-bold text-gray-800">{doc.caseNumber}</span>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 border border-dashed border-gray-200 rounded-xl">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</span>
                           <span className="text-xs font-bold text-emerald-600 uppercase tracking-tighter">{doc.category.replace('_', ' ')}</span>
                        </div>
                     </div>

                     <div className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-2xl text-[10px] font-black text-emerald-900 uppercase tracking-widest">
                        <span>{doc.size}</span>
                        <div className="w-1 h-1 bg-emerald-300 rounded-full"></div>
                        <span>Uploaded: {doc.uploadDate}</span>
                     </div>
                  </div>

                  <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                     <div className="flex gap-2">
                        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-600 hover:bg-emerald-950 hover:text-white transition-all shadow-sm"><Eye size={16} /></button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-600 hover:bg-emerald-950 hover:text-white transition-all shadow-sm"><Share2 size={16} /></button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={16} /></button>
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
  );
}
