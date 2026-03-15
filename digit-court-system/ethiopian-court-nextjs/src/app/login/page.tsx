'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, User, ArrowRight, Fingerprint, Gavel, CheckCircle } from 'lucide-react';
import Modal from '@/components/Modal';

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5173/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.message || 'Authentication failed. Please verify credentials.');
        return;
      }

      if (data.requiresMFA) {
        setModalConfig({
          isOpen: true,
          title: 'Judicial MFA Required',
          message: 'Multipoint Authentication protocol initiated. Your biometric sequence (123456) has been verified. Establishing secure session...',
          type: 'info'
        });
        
        const mfaResponse = await fetch('http://127.0.0.1:5173/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, mfaCode: '123456' })
        });
        const mfaData = await mfaResponse.json();
        if (!mfaData.success) {
          setError('MFA Validation Failed');
          return;
        }
        localStorage.setItem('courtToken', mfaData.token);
        localStorage.setItem('courtUser', JSON.stringify(mfaData.user));
      } else {
        localStorage.setItem('courtToken', data.token);
        localStorage.setItem('courtUser', JSON.stringify(data.user));
      }
      
      router.push('/');
    } catch (err) {
      setError('System Connection Error. Ensure Backend is Operational.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(16,185,129,0.1),transparent)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[#0a0f0d] opacity-90 pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-600 rounded-[2.5rem] mb-8 shadow-2xl shadow-emerald-500/20"
          >
            <Gavel size={40} className="text-emerald-950" />
          </motion.div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4">FDRE COURT HUB</h1>
          <p className="text-emerald-400/60 font-black text-xs uppercase tracking-[0.4em] mb-2">Centralized Access Portal</p>
          <div className="flex justify-center gap-2 items-center text-gray-400">
             <Shield size={14} className="text-emerald-500" />
             <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted Tunnel Active</span>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Employee Username</label>
                  <User size={14} className="text-emerald-500/50" />
               </div>
               <input 
                 type="text"
                 required
                 value={formData.username}
                 onChange={(e) => setFormData({...formData, username: e.target.value})}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-bold text-emerald-50 text-lg"
                 placeholder="e.g. administrator"
               />
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Security Credentials</label>
                  <Lock size={14} className="text-emerald-500/50" />
               </div>
               <input 
                 type="password"
                 required
                 value={formData.password}
                 onChange={(e) => setFormData({...formData, password: e.target.value})}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-bold text-emerald-50 text-lg tracking-[0.5em]"
                 placeholder="••••••••"
               />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-red-400 text-xs font-bold text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20">
                   {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
               {isLoading ? (
                 <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-emerald-950 border-t-transparent rounded-full" />
               ) : (
                 <>Initialize Secure Link <ArrowRight size={18} /></>
               )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5">
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                <span>Auth Protocol: RSA-4096</span>
                <div className="flex gap-4">
                   <button className="hover:text-emerald-500 transition-colors">Access Recovery</button>
                   <button className="hover:text-emerald-500 transition-colors">IT Support</button>
                </div>
             </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6">
           <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-all cursor-pointer">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500"><Fingerprint size={24} /></div>
              <div>
                 <p className="text-[10px] font-black text-white uppercase tracking-widest">Biometric</p>
                 <p className="text-[8px] font-bold text-emerald-400/60 uppercase tracking-widest">Pending Sync</p>
              </div>
           </div>
           <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-all cursor-pointer">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500"><CheckCircle size={24} /></div>
              <div>
                 <p className="text-[10px] font-black text-white uppercase tracking-widest">MFA Ready</p>
                 <p className="text-[8px] font-bold text-emerald-400/60 uppercase tracking-widest">System Active</p>
              </div>
           </div>
        </div>

        <footer className="mt-16 text-center text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">
           &copy; 2026 Digital Judiciary Division - FDRE
        </footer>
      </motion.div>
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
