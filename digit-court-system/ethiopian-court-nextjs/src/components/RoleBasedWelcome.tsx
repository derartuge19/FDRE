'use client';

import { useUserRole } from '@/hooks/useUserRole';
import { Shield, Gavel, Briefcase, FileText, User, Users } from 'lucide-react';

export default function RoleBasedWelcome() {
  const userRole = useUserRole();

  const roleContent = {
    SYSTEM_ADMIN: {
      icon: <Shield size={48} className="text-emerald-500" />,
      title: 'Global System Administrator',
      subtitle: 'Universal Oversight & Governance',
      description: 'You have full structural and operational control over the Digital Judiciary Hub, including security, staffing, and documentation.',
      features: [
        'Manage all users, roles & staffing',
        'Full case docket & schedule control',
        'Institutional security & audit logs',
        'Virtual hearing orchestration',
        'System configuration & reporting'
      ]
    },
    COURT_ADMIN: {
      icon: <Users size={48} className="text-blue-500" />,
      title: 'Court Operations Administrator',
      subtitle: 'Universal Case & Staff Management',
      description: 'You have full structural and operational control over the Digital Judiciary Hub, including security, staffing, and documentation.',
      features: [
        'Manage all users, roles & staffing',
        'Full case docket & schedule control',
        'Institutional security & audit logs',
        'Virtual hearing orchestration',
        'System configuration & reporting'
      ]
    },
    JUDGE: {
      icon: <Gavel size={48} className="text-amber-600" />,
      title: 'Judicial Dashboard',
      subtitle: 'Your assigned cases and hearings',
      description: 'Access your assigned cases, manage hearings, review documents, and issue judgments.',
      features: [
        'View assigned cases',
        'Manage hearing schedules',
        'Review case documents',
        'Conduct virtual hearings',
        'Issue judgments and orders'
      ]
    },
    CLERK: {
      icon: <FileText size={48} className="text-purple-500" />,
      title: 'Court Clerk Dashboard',
      subtitle: 'Case processing and documentation',
      description: 'Process case filings, manage documents, schedule hearings, and maintain court records.',
      features: [
        'Process new case filings',
        'Manage case documents',
        'Schedule hearings',
        'Maintain court records',
        'Assist with case administration'
      ]
    },
    LAWYER: {
      icon: <Briefcase size={48} className="text-indigo-500" />,
      title: 'Legal Practice Dashboard',
      subtitle: 'Your client cases and hearings',
      description: 'Manage your client cases, prepare for hearings, submit documents, and communicate with the court.',
      features: [
        'View client cases',
        'Track hearing schedules',
        'Submit legal documents',
        'Participate in virtual hearings',
        'Communicate with clients'
      ]
    },
    PLAINTIFF: {
      icon: <User size={48} className="text-green-500" />,
      title: 'Plaintiff Dashboard',
      subtitle: 'Track your case progress',
      description: 'Monitor your case status, view hearing dates, access documents, and communicate with your legal team.',
      features: [
        'View your case details',
        'Track case progress',
        'See upcoming hearings',
        'Access case documents',
        'Message your lawyer'
      ]
    },
    DEFENDANT: {
      icon: <User size={48} className="text-red-500" />,
      title: 'Defendant Dashboard',
      subtitle: 'Track your case progress',
      description: 'Monitor your case status, view hearing dates, access documents, and communicate with your legal team.',
      features: [
        'View your case details',
        'Track case progress',
        'See upcoming hearings',
        'Access case documents',
        'Message your lawyer'
      ]
    },
    USER: {
      icon: <User size={48} className="text-gray-500" />,
      title: 'Welcome to Ethiopian Digital Court System',
      subtitle: 'Basic access',
      description: 'You have basic access to the system. Contact an administrator for additional permissions.',
      features: [
        'View notifications',
        'Update your profile',
        'Access help resources',
        'Contact support'
      ]
    }
  };

  const content = roleContent[userRole] || roleContent.USER;

  return (
    <div className="card-bg p-4 sm:p-10 rounded-3xl md:rounded-[3rem] border border-emerald-500/10 shadow-2xl mb-6 md:mb-10">
      <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 md:gap-8">
        <div className="w-14 h-14 md:w-20 md:h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
          {content.icon}
        </div>
        <div className="flex-1">
          <h2 className="text-xl md:text-3xl font-black page-text mb-1 md:mb-2">{content.title}</h2>
          <p className="text-emerald-500 font-bold text-sm md:text-lg mb-3 md:mb-4">{content.subtitle}</p>
          <p className="text-secondary text-sm md:text-base mb-6 leading-relaxed max-w-2xl mx-auto md:mx-0">{content.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-left">
            {content.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 md:gap-3 text-[13px] md:text-sm">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></div>
                <span className="text-secondary font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
