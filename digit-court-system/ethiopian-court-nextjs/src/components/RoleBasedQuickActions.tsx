'use client';

import { useUserRole } from '@/hooks/useUserRole';
import Link from 'next/link';
import { 
  Plus, 
  Calendar, 
  FileText, 
  Video, 
  Users, 
  Gavel, 
  MessageSquare,
  Upload,
  Search,
  Settings,
  BarChart3,
  Shield
} from 'lucide-react';

export default function RoleBasedQuickActions() {
  const userRole = useUserRole();

  const roleActions = {
    SYSTEM_ADMIN: [
      { icon: <Users size={20} />, label: 'Manage Users', href: '/users', color: 'bg-blue-600' },
      { icon: <Plus size={20} />, label: 'File Case', href: '/cases', color: 'bg-emerald-600' },
      { icon: <Calendar size={20} />, label: 'Schedule Hearing', href: '/schedule', color: 'bg-indigo-600' },
      { icon: <Shield size={20} />, label: 'System Security', href: '/security', color: 'bg-red-600' },
      { icon: <BarChart3 size={20} />, label: 'Analytics', href: '/reports', color: 'bg-amber-600' },
      { icon: <Video size={20} />, label: 'Virtual Hearing', href: '/virtual-hearing', color: 'bg-purple-600' }
    ],
    COURT_ADMIN: [
      { icon: <Users size={20} />, label: 'Manage Staff', href: '/users', color: 'bg-blue-600' },
      { icon: <Plus size={20} />, label: 'Register Case', href: '/cases', color: 'bg-emerald-600' },
      { icon: <Calendar size={20} />, label: 'Schedule Hearing', href: '/schedule', color: 'bg-indigo-600' },
      { icon: <Shield size={20} />, label: 'Court Security', href: '/security', color: 'bg-red-600' },
      { icon: <BarChart3 size={20} />, label: 'Reports', href: '/reports', color: 'bg-amber-600' },
      { icon: <Video size={20} />, label: 'Virtual Hearing', href: '/virtual-hearing', color: 'bg-purple-600' }
    ],
    JUDGE: [
      { icon: <Gavel size={20} />, label: 'My Cases', href: '/cases', color: 'bg-amber-600' },
      { icon: <Calendar size={20} />, label: 'Hearing Schedule', href: '/hearings', color: 'bg-blue-500' },
      { icon: <Video size={20} />, label: 'Virtual Hearing', href: '/virtual-hearing', color: 'bg-emerald-500' },
      { icon: <FileText size={20} />, label: 'Review Documents', href: '/documents', color: 'bg-purple-500' }
    ],
    CLERK: [
      { icon: <Plus size={20} />, label: 'File New Case', href: '/cases', color: 'bg-emerald-500' },
      { icon: <Upload size={20} />, label: 'Upload Document', href: '/documents', color: 'bg-blue-500' },
      { icon: <Calendar size={20} />, label: 'Schedule Hearing', href: '/schedule', color: 'bg-purple-500' },
      { icon: <FileText size={20} />, label: 'Process Filings', href: '/documents', color: 'bg-amber-500' }
    ],
    LAWYER: [
      { icon: <Search size={20} />, label: 'My Cases', href: '/cases', color: 'bg-indigo-500' },
      { icon: <Calendar size={20} />, label: 'Hearing Schedule', href: '/hearings', color: 'bg-blue-500' },
      { icon: <Upload size={20} />, label: 'Submit Document', href: '/documents', color: 'bg-emerald-500' },
      { icon: <MessageSquare size={20} />, label: 'Messages', href: '/communication', color: 'bg-purple-500' }
    ],
    PLAINTIFF: [
      { icon: <Search size={20} />, label: 'My Case', href: '/cases', color: 'bg-green-500' },
      { icon: <Calendar size={20} />, label: 'Next Hearing', href: '/hearings', color: 'bg-blue-500' },
      { icon: <FileText size={20} />, label: 'Case Documents', href: '/documents', color: 'bg-purple-500' },
      { icon: <MessageSquare size={20} />, label: 'Contact Lawyer', href: '/communication', color: 'bg-emerald-500' }
    ],
    DEFENDANT: [
      { icon: <Search size={20} />, label: 'My Case', href: '/cases', color: 'bg-red-500' },
      { icon: <Calendar size={20} />, label: 'Next Hearing', href: '/hearings', color: 'bg-blue-500' },
      { icon: <FileText size={20} />, label: 'Case Documents', href: '/documents', color: 'bg-purple-500' },
      { icon: <MessageSquare size={20} />, label: 'Contact Lawyer', href: '/communication', color: 'bg-emerald-500' }
    ],
    USER: [
      { icon: <MessageSquare size={20} />, label: 'Messages', href: '/communication', color: 'bg-blue-500' },
      { icon: <Settings size={20} />, label: 'Profile Settings', href: '/profile', color: 'bg-gray-500' }
    ]
  };

  const actions = roleActions[userRole] || roleActions.USER;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {actions.map((action, idx) => (
        <Link
          key={idx}
          href={action.href}
          className="card-bg p-6 rounded-2xl border border-emerald-500/10 hover:border-emerald-500 transition-all group shadow-sm hover:shadow-lg"
        >
          <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
            {action.icon}
          </div>
          <p className="text-sm font-black page-text uppercase tracking-wide">{action.label}</p>
        </Link>
      ))}
    </div>
  );
}
