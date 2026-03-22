'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentUser } from '@/hooks/useUserRole';
import { Search, Bell, User, Settings, LogOut } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

export default function Header() {
  const user = useCurrentUser();
  const { unreadCount } = useNotifications();
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
        <div className="header-container flex items-center justify-between h-auto md:h-20 py-3 md:py-0 px-4 md:px-6 gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 sm:gap-4 group shrink-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl shadow-lg ring-1 sm:ring-2 ring-emerald-400 group-hover:rotate-12 transition-all">⚖️</div>
            <div className="text-white">
              <div className="text-sm sm:text-lg font-black tracking-tight leading-none mb-0.5 sm:mb-1 uppercase">FDRE COURT <span className="hidden sm:inline">SYSTEM</span></div>
              <div className="text-[7px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] opacity-80">Digital Admin</div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex-1 max-w-md backdrop-blur-md">
            <Search size={18} className="text-white/40" />
            <input type="text" placeholder="Search cases..." className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/20 font-medium" />
            <div className="text-[10px] font-black text-white/40 border border-white/10 px-1.5 py-0.5 rounded-md">CMD + K</div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-6">
            <ThemeToggle />
            <Link href="/notifications" className="relative w-10 h-10 sm:w-12 sm:h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all">
              <Bell size={18} className="text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-emerald-500 text-emerald-950 text-[10px] font-black rounded-full border-2 border-emerald-950 flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
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
                      <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl page-text hover:bg-emerald-500/10 transition-colors"><User size={18} /> <span className="text-sm font-bold">Profile</span></Link>
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
