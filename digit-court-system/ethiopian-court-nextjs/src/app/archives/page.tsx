'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Trash2, 
  Video, 
  Calendar, 
  Clock, 
  Search, 
  Gavel, 
  ChevronRight,
  Shield,
  FileText,
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  MessageSquare,
  Save,
  Settings
} from 'lucide-react';

export default function Archives() {
  const [records, setRecords] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'recordings' | 'transcripts' | 'cases'>('recordings');
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setMounted(true);
    const request = indexedDB.open('CourtRecordsDB', 2);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('recordings')) db.createObjectStore('recordings', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('cases')) db.createObjectStore('cases', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('documents')) db.createObjectStore('documents', { keyPath: 'id' });
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('recordings')) {
         setRecords([]);
         return;
      }
      const transaction = db.transaction(['recordings'], 'readonly');
      const store = transaction.objectStore('recordings');
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        const results = getAllRequest.result.map((rec: any) => ({
          ...rec,
          url: URL.createObjectURL(rec.blob)
        }));
        setRecords(results.sort((a: any, b: any) => b.id - a.id));
      };
      
      if (db.objectStoreNames.contains('cases')) {
        db.transaction(['cases'], 'readonly').objectStore('cases').getAll().onsuccess = (e: any) => setCases(e.target.result || []);
      }
      
      if (db.objectStoreNames.contains('documents')) {
        db.transaction(['documents'], 'readonly').objectStore('documents').getAll().onsuccess = (e: any) => setDocuments(e.target.result || []);
      }
    };
  }, []);

  const deleteRecording = (id: number) => {
    const request = indexedDB.open('CourtRecordsDB', 1);
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const transaction = db.transaction(['recordings'], 'readwrite');
      transaction.objectStore('recordings').delete(id);
      transaction.oncomplete = () => {
        setRecords((prev: any[]) => prev.filter((r: any) => r.id !== id));
      };
    };
  };

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredCases = cases.filter(c => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredDocuments = documents.filter(d => 
    d.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans text-slate-900">
      {/* Premium Header */}
      <header className="h-20 bg-emerald-950 border-b border-emerald-900 flex items-center justify-between px-12 shadow-2xl sticky top-0 z-[100]">
        <Link href="/" className="flex items-center gap-5 group">
          <div className="w-14 h-14 bg-white rounded-[1.25rem] flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all duration-500">
            <Gavel size={28} className="text-emerald-900" />
          </div>
          <div className="text-white">
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none mb-1">Judiciary Archives</h1>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em] opacity-70">Official Record Maintenance</p>
          </div>
        </Link>
        <div className="flex items-center gap-6">
           <ThemeToggle />
           <div className="hidden lg:flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
              <Shield size={16} className="text-emerald-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">RSA-4096 Secure Vault</span>
           </div>
           <Link href="/virtual-hearing" className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl shadow-emerald-500/20 active:scale-95">Return to Chamber</Link>
        </div>
      </header>

      {/* Global Context Navigation */}
      <nav className="nav-container sticky top-20 z-[90] bg-[#14532d] overflow-x-auto shadow-md shrink-0 border-t border-emerald-900/50">
        <div className="container mx-auto flex items-center h-16 px-6 gap-2">
          {[
            { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/' },
            { label: 'Cases', icon: <Briefcase size={18} />, href: '/cases' },
            { label: 'Hearings', icon: <Gavel size={18} />, href: '/hearings' },
            { label: 'Documents', icon: <FileText size={18} />, href: '/documents' },
            { label: 'Virtual Hearing', icon: <Video size={18} />, href: '/virtual-hearing' },
            { label: 'Users', icon: <Users size={18} />, href: '/users' },
            { label: 'Reports', icon: <BarChart3 size={18} />, href: '/reports' },
            { label: 'Messages', icon: <MessageSquare size={18} />, href: '/communication' },
            { label: 'Archives', icon: <Save size={18} />, href: '/archives', active: true },
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

      <div className="flex" style={{ minHeight: 'calc(100vh - 9rem)' }}>
        {/* Sidebar Nav */}
        <aside className="w-80 bg-white border-r border-slate-200 p-10 flex flex-col gap-10 shrink-0">
           <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Archive Explorer</h3>
              <nav className="flex flex-col gap-2">
                 <button onClick={() => setActiveTab('recordings')} className={`flex items-center gap-4 p-4 rounded-2xl text-xs font-black uppercase transition-all border ${activeTab === 'recordings' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Video size={18} /> Video Logs</button>
                 <button onClick={() => setActiveTab('transcripts')} className={`flex items-center gap-4 p-4 rounded-2xl text-xs font-black uppercase transition-all border ${activeTab === 'transcripts' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><FileText size={18} /> Transcripts</button>
                 <button onClick={() => setActiveTab('cases')} className={`flex items-center gap-4 p-4 rounded-2xl text-xs font-black uppercase transition-all border ${activeTab === 'cases' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Calendar size={18} /> Session History</button>
              </nav>
           </div>
           
           <div className="mt-auto p-8 bg-slate-900 rounded-[2.5rem] text-white">
              <p className="text-[10px] font-black uppercase opacity-50 mb-4">Vault Stats</p>
              <div className="space-y-4">
                 <div><p className="text-2xl font-black">{records.length + cases.length + documents.length}</p><p className="text-[9px] font-bold text-emerald-400 uppercase opacity-70 tracking-tighter">Total Items Stored</p></div>
                 <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '45%' }} className="h-full bg-emerald-500" /></div>
                 <p className="text-[10px] font-medium text-white/40 italic leading-relaxed">Local storage encrypted by jurisdictional directive (3.3).</p>
              </div>
           </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-16 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-16">
              <div>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                   <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest mb-4">
                     <span className="bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200/50">Official Dossier</span>
                   </div>
                   <h2 className="text-6xl font-black text-slate-900 tracking-tighter mb-4 leading-none">Hearing Memory Vault</h2>
                   <p className="text-slate-500 font-medium text-xl max-w-2xl leading-relaxed">Management and playback of high-fidelity judicial proceedings committed to the sovereign record.</p>
                </motion.div>
              </div>
              <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-slate-100 flex items-center gap-4 w-full lg:w-[450px]">
                <div className="w-14 h-14 bg-slate-50 rounded-[1.8rem] flex items-center justify-center text-slate-300"><Search size={24} /></div>
                <input 
                  type="text" 
                  placeholder="Query archive logs..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 w-full placeholder:text-slate-300" 
                />
              </div>
            </div>

            {activeTab === 'recordings' && (
              filteredRecords.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[4rem] border border-slate-100 py-32 flex flex-col items-center justify-center gap-10 shadow-2xl shadow-emerald-950/5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_0%,_#FDFCFB_100%)] opacity-50" />
                  <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 relative z-10 shadow-inner group overflow-hidden">
                     <div className="absolute inset-0 bg-emerald-50 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-full opacity-20" />
                     <Video size={56} className="relative z-10" />
                  </div>
                  <div className="text-center relative z-10 px-8">
                     <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4">Video Logs Standby</h3>
                     <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] max-w-xs mx-auto leading-loose">The jurisdictional vault contains no committed video records at this time.</p>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                  <AnimatePresence>
                    {filteredRecords.map((rec: any, idx: number) => (
                      <motion.div 
                        key={rec.id} 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group"
                      >
                        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-emerald-950/5 overflow-hidden group-hover:border-emerald-500 group-hover:shadow-emerald-950/10 transition-all duration-500 flex flex-col relative h-full">
                          <div className="aspect-video bg-slate-900 relative overflow-hidden">
                            <video src={rec.url} controls className="w-full h-full object-cover" />
                            <div className="absolute top-6 left-6 px-4 py-2 bg-emerald-600/90 backdrop-blur-md text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">JUDICIAL CAPTURE</div>
                            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur px-3 py-1 rounded-xl text-[9px] font-bold text-white uppercase tracking-tighter">HD 1080P</div>
                          </div>
                          <div className="p-12 flex-1 flex flex-col gap-8">
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Archive #{rec.id.toString().slice(-4)}</span>
                              </div>
                              <h4 className="text-2xl font-black text-slate-800 tracking-tighter mb-4 group-hover:text-emerald-700 transition-colors uppercase leading-tight line-clamp-2">{rec.name}</h4>
                              <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                                 <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><Calendar size={14} className="text-emerald-600" /> {new Date(rec.id).toLocaleDateString()}</div>
                                 <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"><Clock size={14} className="text-emerald-600" /> {rec.timestamp}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-8 border-t border-slate-50 mt-auto">
                              <button onClick={() => deleteRecording(rec.id)} className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95"><Trash2 size={20} /></button>
                              <a href={rec.url} download={rec.name} className="flex items-center gap-4 px-10 py-5 bg-emerald-950 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-800 transition-all hover:-translate-y-1 active:scale-95 group/btn">
                                 Commit Download <Download size={18} className="text-emerald-400 group-hover/btn:translate-y-0.5 transition-transform" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )
            )}

            {activeTab === 'cases' && (
               filteredCases.length === 0 ? (
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[4rem] border border-slate-100 py-32 flex flex-col items-center justify-center gap-10 shadow-2xl shadow-emerald-950/5 relative overflow-hidden">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_0%,_#FDFCFB_100%)] opacity-50" />
                   <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 relative z-10 shadow-inner group overflow-hidden">
                      <div className="absolute inset-0 bg-emerald-50 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-full opacity-20" />
                      <Calendar size={56} className="relative z-10" />
                   </div>
                   <div className="text-center relative z-10 px-8">
                      <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4">No Session History</h3>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] max-w-xs mx-auto leading-loose">There are no case dockets stored in the local vault.</p>
                   </div>
                 </motion.div>
               ) : (
                 <div className="grid grid-cols-1 gap-6">
                   <AnimatePresence>
                     {filteredCases.map((caseItem: any, idx: number) => (
                       <motion.div key={caseItem.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-emerald-950/5 flex flex-col md:flex-row gap-6 md:items-center justify-between group hover:border-emerald-500 transition-all">
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <span className="text-2xl">⚖️</span>
                             </div>
                             <div>
                                <div className="flex items-center gap-3 mb-2">
                                   <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-lg">{caseItem.caseNumber}</span>
                                   <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${caseItem.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>{caseItem.status}</span>
                                </div>
                                <h4 className="text-xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-emerald-900 transition-colors uppercase">{caseItem.title}</h4>
                             </div>
                          </div>
                          <div className="flex flex-col gap-2 md:items-end">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plaintiff: <span className="text-slate-700">{caseItem.plaintiff}</span></span>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type: <span className="text-slate-700">{caseItem.type}</span></span>
                          </div>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                 </div>
               )
            )}

            {activeTab === 'transcripts' && (
               filteredDocuments.length === 0 ? (
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[4rem] border border-slate-100 py-32 flex flex-col items-center justify-center gap-10 shadow-2xl shadow-emerald-950/5 relative overflow-hidden">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_0%,_#FDFCFB_100%)] opacity-50" />
                   <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 relative z-10 shadow-inner group overflow-hidden">
                      <div className="absolute inset-0 bg-emerald-50 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-full opacity-20" />
                      <FileText size={56} className="relative z-10" />
                   </div>
                   <div className="text-center relative z-10 px-8">
                      <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4">No Transcripts/Documents</h3>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] max-w-xs mx-auto leading-loose">There are no document artifacts stored in the local vault.</p>
                   </div>
                 </motion.div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   <AnimatePresence>
                     {filteredDocuments.map((doc: any, idx: number) => (
                       <motion.div key={doc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-emerald-950/5 flex flex-col gap-6 group hover:border-emerald-500 transition-all">
                          <div className="flex justify-between items-start">
                             <div className="w-14 h-14 bg-slate-50 rounded-[1.2rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <FileText size={24} className="text-emerald-500" />
                             </div>
                             <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">{doc.category.replace('_', ' ')}</span>
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-emerald-900 transition-colors uppercase mb-2 line-clamp-2">{doc.title}</h4>
                             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>{doc.size}</span>
                                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                <span>{doc.uploadDate}</span>
                             </div>
                          </div>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                 </div>
               )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
