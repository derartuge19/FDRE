'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Gavel, 
  FileText, 
  Video, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Save, 
  Settings,
  ShieldAlert,
  Calendar,
  Activity,
  Bell,
  User
} from 'lucide-react';
import { ROLE_CAPABILITIES, type NavKey, type Role } from '@/lib/rbac';
import { useUserRole } from '@/hooks/useUserRole';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
}

export default function Navigation() {
  const pathname = usePathname();
  const userRole = useUserRole();

  const navItems = useMemo((): NavItem[] => {
    const navKeys: NavKey[] = ROLE_CAPABILITIES[userRole]?.nav ?? ROLE_CAPABILITIES.USER.nav;
    const map: Record<NavKey, NavItem> = {
      dashboard: { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/' },
      cases: { label: 'Cases', icon: <Briefcase size={18} />, href: '/cases' },
      hearings: { label: 'Hearings', icon: <Gavel size={18} />, href: '/hearings' },
      documents: { label: 'Documents', icon: <FileText size={18} />, href: '/documents' },
      virtualHearing: { label: 'Virtual Hearing', icon: <Video size={18} />, href: '/virtual-hearing' },
      users: { label: 'Users', icon: <Users size={18} />, href: '/users' },
      reports: { label: 'Reports', icon: <BarChart3 size={18} />, href: '/reports' },
      messages: { label: 'Messages', icon: <MessageSquare size={18} />, href: '/communication' },
      archives: { label: 'Archives', icon: <Save size={18} />, href: '/archives' },
      settings: { label: 'Settings', icon: <Settings size={18} />, href: '/settings' },
      logs: { label: 'Logs', icon: <Activity size={18} />, href: '/logs' },
      security: { label: 'Security', icon: <ShieldAlert size={18} />, href: '/security' },
      schedule: { label: 'Master Schedule', icon: <Calendar size={18} />, href: '/schedule' },
      notifications: { label: 'Notifications', icon: <Bell size={18} />, href: '/notifications' },
      profile: { label: 'Profile', icon: <User size={18} />, href: '/profile' }
    };

    return navKeys.map((k) => map[k]).filter(Boolean);
  }, [userRole]);

  return (
    <nav className="nav-container scrollbar-hide">
      <div className="container mx-auto flex items-center h-16 px-6 gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                isActive ? 'bg-emerald-400 text-emerald-950 shadow-lg' : 'text-emerald-50 hover:bg-emerald-800'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
