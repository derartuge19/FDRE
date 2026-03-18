'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentUser } from '@/hooks/useUserRole';
import { Search, Bell, User, Settings, LogOut } from 'lucide-react';

export default function Header() {
  const user = useCurrentUser();
  const currentUser = user?.name || 'System';
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  if (!mounted) return null;

  return (
    <header className="header">
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
            <input type="text" placeholder="Search cases, documents, or hearings..." className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/20 font-medium" />
            <div className="text-[10px] font-black text-white/40 border border-white/10 px-1.5 py-0.5 rounded-md">CMD + K</div>
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
                <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-emerald-950 font-black">
                  {currentUser[0] || 'U'}
                </div>
                <span className="text-white font-bold text-sm hidden md:block">{currentUser}</span>
              </button>
              
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-3 w-64 card-bg rounded-3xl shadow-2xl border border-emerald-500/10 overflow-hidden z-[200]"
                  >
                    <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/10">
                      <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Administrative Profile</p>
                      <p className="text-sm font-bold page-text truncate">{currentUser}</p>
                    </div>
                    <div className="p-2">
                      <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl page-text hover:bg-emerald-500/10 transition-colors"><User size={18} /> <span className="text-sm font-bold">Dossier</span></Link>
                      <Link href="/settings" className="flex items-center gap-3 p-3 rounded-xl page-text hover:bg-emerald-500/10 transition-colors"><Settings size={18} /> <span className="text-sm font-bold">Adjust Settings</span></Link>
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"><LogOut size={18} /> <span className="text-sm font-black uppercase tracking-widest text-left">Sign Out</span></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
