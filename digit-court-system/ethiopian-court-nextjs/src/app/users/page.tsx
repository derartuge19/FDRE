'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import {  
  Users as UsersIcon, 
  Search, 
  Plus, 
  Filter, 
  User, 
  Shield, 
  Mail, 
  Phone, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronRight,
  Gavel,
  Briefcase,
  LayoutDashboard,
  Settings,
  LogOut,
  Bell,
  Clock,
  FileText,
  Video,
  BarChart3,
  MessageSquare,
  Save
 } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import RequireAccess from '@/components/RequireAccess';
import { useCurrentUser } from '@/hooks/useUserRole';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'judge' | 'lawyer' | 'clerk' | 'plaintiff' | 'defendant' | 'public';
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
}

export default function Users() {
  const user = useCurrentUser();
  const currentUser = user?.name || 'Loading...';
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [mounted, setMounted] = useState(false);
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('courtToken');

    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5173/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          setUsers(data.data.map((u: any) => ({
             id: u.id,
             username: u.username,
             name: u.name,
             email: u.email,
             role: u.roles?.[0] || 'public',
             department: u.department || 'General',
             status: u.isActive ? 'active' : 'inactive',
             lastLogin: u.lastLogin || 'Never'
          })));
        } else {
           setModalConfig({
             isOpen: true,
             title: 'Authorization Protocol Failure',
             message: data.message || 'Identity verification for the judicial database failed. Access to personnel records denied.',
             type: 'error'
           });
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };

    if (token) fetchUsers();
  }, []);

  const handleCreateUser = async () => {
     const token = localStorage.getItem('courtToken');
     const name = "New Judicial Officer";
     const username = "officer.new";
     const role = "clerk";
     
     try {
       const response = await fetch('http://localhost:5173/api/users', {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify({ name, username, roles: [role], department: 'Registry' })
       });
       const data = await response.json();
       if (data.success) {
          setModalConfig({
            isOpen: true,
            title: 'Identity Provisioned',
            message: `Neural index updated. User '${name}' has been established within the judicial hierarchy.`,
            type: 'success'
          });
       } else {
          setModalConfig({
            isOpen: true,
            title: 'Provisioning Conflict',
            message: data.message || 'The central identity registry rejected this credential set.',
            type: 'error'
          });
       }
     } catch (err) {
        setModalConfig({
          isOpen: true,
          title: 'Gateway Timeout',
          message: 'Institutional provisioning services are currently unreachable.',
          type: 'error'
        });
     }
  };

  const handleLogout = () => {
    localStorage.removeItem('courtToken');
    localStorage.removeItem('courtUser');
    window.location.href = '/login';
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(u => filterRole === 'all' || u.role === filterRole);

  if (!mounted) return null;

  return (
    <RequireAccess allowedRoles={['SYSTEM_ADMIN', 'COURT_ADMIN']}>
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
                <span className="bg-emerald-500/10 px-2 py-1 rounded">Security</span>
                <span>/</span>
                <span>Personnel Directory</span>
              </div>
              <h1 className="text-5xl font-black page-text tracking-tighter mb-2">Access Control</h1>
              <p className="text-secondary font-medium text-lg">Manage judicial staff, legal representatives, and public access credentials.</p>
            </div>
            <div className="flex gap-4">
               <button className="flex items-center gap-3 px-8 py-5 bg-white border-2 border-gray-100 text-gray-900 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all shadow-xl">
                  Import Workforce
               </button>
                <button 
                  onClick={handleCreateUser}
                  className="flex items-center gap-3 px-10 py-5 bg-emerald-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-emerald-900 transition-all"
                >
                  <Plus size={20} className="text-emerald-400" /> Provision Account
                </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-950/5 border border-emerald-50/50 mb-10 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500" size={20} />
               <input 
                 type="text" 
                 placeholder="Search by Employee Name, System Username, or Email..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none rounded-2xl transition-all font-bold text-gray-800 shadow-inner"
               />
            </div>
            <div className="flex items-center gap-3">
               <select 
                 value={filterRole}
                 onChange={(e) => setFilterRole(e.target.value)}
                 className="px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold text-gray-700 outline-none appearance-none cursor-pointer shadow-inner"
               >
                 <option value="all">Every Classification</option>
                 <option value="judge">Judiciary Council</option>
                 <option value="lawyer">Bar Association</option>
                 <option value="admin">System Admin</option>
                 <option value="clerk">Registry Clerks</option>
               </select>
               <button className="p-5 bg-gray-900 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg"><Filter size={20} /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             <AnimatePresence>
             {filteredUsers.map((user, idx) => (
               <motion.div 
                 key={user.id}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: idx * 0.05 }}
                 className="bg-white rounded-[3rem] border border-emerald-50/50 shadow-2xl shadow-emerald-950/5 overflow-hidden flex flex-col group hover:border-emerald-500 transition-all"
               >
                  <div className="p-10 flex-1 flex flex-col items-center text-center">
                     <div className="relative mb-8">
                        <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-3xl shadow-xl border-2 border-white group-hover:scale-110 transition-transform">
                           {user.role === 'judge' ? <Gavel className="text-emerald-600" /> : user.role === 'lawyer' ? <Briefcase className="text-blue-500" /> : <User className="text-gray-400" />}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-2xl border-4 border-white flex items-center justify-center text-white ${
                          user.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}>
                           {user.status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        </span>
                     </div>

                     <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">{user.name}</h3>
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-4 py-1.5 bg-emerald-50 rounded-xl mb-6">@{user.username}</p>
                     
                     <div className="w-full space-y-3 mb-8">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-emerald-50/50 transition-colors">
                           <Mail size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                           <span className="text-xs font-bold text-gray-600 truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-emerald-50/50 transition-colors">
                           <Shield size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                           <span className="text-xs font-bold text-gray-600 truncate">{user.department} Unit</span>
                        </div>
                     </div>

                     <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> Last Access: {user.lastLogin}
                     </div>
                  </div>

                  <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                     <div className="flex gap-2">
                        <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 hover:bg-emerald-950 hover:text-white transition-all shadow-sm"><Settings size={20} /></button>
                        <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"><AlertTriangle size={20} /></button>
                     </div>
                     <button className="px-8 py-3.5 bg-emerald-950 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-emerald-800 transition-all flex items-center gap-2">
                        Profile <ChevronRight size={16} className="text-emerald-400" />
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
