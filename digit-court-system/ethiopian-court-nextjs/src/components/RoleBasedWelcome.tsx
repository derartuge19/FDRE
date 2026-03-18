'use client';

import { useUserRole } from '@/hooks/useUserRole';
import { Shield, Gavel, Briefcase, FileText, User, Users } from 'lucide-react';

export default function RoleBasedWelcome() {
  const userRole = useUserRole();

  const roleContent = {
    SYSTEM_ADMIN: {
      icon: <Shield size={48} className="text-emerald-500" />,
      title: 'System Administrator Dashboard',
      subtitle: 'Full system control and oversight',
      description: 'You have complete access to all system features, user management, security settings, and system logs.',
      features: [
        'Manage all users and roles',
        'Configure system settings',
        'Monitor security and audit logs',
        'Access all cases and hearings',
        'Generate comprehensive reports'
      ]
    },
    COURT_ADMIN: {
      icon: <Users size={48} className="text-blue-500" />,
      title: 'Court Administrator Dashboard',
      subtitle: 'Court operations and management',
      description: 'Manage court operations, schedule hearings, assign cases, and oversee administrative functions.',
      features: [
        'Manage court schedules',
        'Assign cases to judges',
        'Oversee case processing',
        'Manage court staff',
        'Generate operational reports'
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
    <div className="card-bg p-10 rounded-[3rem] border border-emerald-500/10 shadow-2xl mb-10">
      <div className="flex items-start gap-8">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
          {content.icon}
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-black page-text mb-2">{content.title}</h2>
          <p className="text-emerald-500 font-bold text-lg mb-4">{content.subtitle}</p>
          <p className="text-secondary mb-6 leading-relaxed">{content.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {content.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="text-secondary font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
