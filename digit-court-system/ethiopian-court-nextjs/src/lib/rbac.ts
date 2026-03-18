export type Role =
  | 'SYSTEM_ADMIN'
  | 'COURT_ADMIN'
  | 'JUDGE'
  | 'LAWYER'
  | 'PLAINTIFF'
  | 'DEFENDANT'
  | 'CLERK'
  | 'USER';

export type NavKey =
  | 'dashboard'
  | 'cases'
  | 'hearings'
  | 'documents'
  | 'virtualHearing'
  | 'users'
  | 'reports'
  | 'messages'
  | 'archives'
  | 'settings'
  | 'logs'
  | 'security'
  | 'schedule'
  | 'notifications'
  | 'profile';

export function normalizeRoleFromUser(user: any): Role {
  const raw =
    user?.courtRole ??
    user?.role ??
    (Array.isArray(user?.roles) ? user.roles[0] : undefined);

  const normalized = String(raw || 'USER').trim().toUpperCase();

  // Mapping backend strings to frontend Role types
  if (normalized === 'ADMIN' || normalized === 'SYSTEM_ADMIN' || normalized === 'SYSTEMADMIN') return 'SYSTEM_ADMIN';
  if (normalized === 'COURT_ADMIN' || normalized === 'COURTADMIN') return 'COURT_ADMIN';
  if (normalized === 'JUDGE') return 'JUDGE';
  if (normalized === 'CLERK' || normalized === 'COURT_STAFF') return 'CLERK';
  if (normalized === 'LAWYER' || normalized === 'ATTORNEY') return 'LAWYER';
  if (normalized === 'PLAINTIFF') return 'PLAINTIFF';
  if (normalized === 'DEFENDANT') return 'DEFENDANT';

  return 'USER';
}

export const ROLE_CAPABILITIES: Record<Role, { nav: NavKey[]; routes: string[] }> = {
  SYSTEM_ADMIN: {
    nav: ['dashboard', 'users', 'logs', 'security', 'settings', 'reports', 'notifications', 'profile'],
    routes: ['/', '/users', '/logs', '/security', '/settings', '/reports', '/notifications', '/profile']
  },
  COURT_ADMIN: {
    nav: ['dashboard', 'cases', 'hearings', 'schedule', 'reports', 'notifications', 'profile'],
    routes: ['/', '/cases', '/hearings', '/schedule', '/reports', '/notifications', '/profile']
  },
  JUDGE: {
    nav: ['dashboard', 'cases', 'hearings', 'virtualHearing', 'documents', 'archives', 'notifications', 'profile'],
    routes: ['/', '/cases', '/hearings', '/virtual-hearing', '/documents', '/archives', '/notifications', '/profile']
  },
  CLERK: {
    nav: ['dashboard', 'cases', 'documents', 'hearings', 'archives', 'notifications', 'profile'],
    routes: ['/', '/cases', '/documents', '/hearings', '/archives', '/notifications', '/profile']
  },
  LAWYER: {
    nav: ['dashboard', 'cases', 'documents', 'virtualHearing', 'messages', 'archives', 'notifications', 'profile'],
    routes: ['/', '/cases', '/documents', '/virtual-hearing', '/communication', '/archives', '/notifications', '/profile']
  },
  PLAINTIFF: {
    nav: ['dashboard', 'cases', 'documents', 'virtualHearing', 'messages', 'archives', 'notifications', 'profile'],
    routes: ['/', '/cases', '/documents', '/virtual-hearing', '/communication', '/archives', '/notifications', '/profile']
  },
  DEFENDANT: {
    nav: ['dashboard', 'cases', 'documents', 'virtualHearing', 'messages', 'archives', 'notifications', 'profile'],
    routes: ['/', '/cases', '/documents', '/virtual-hearing', '/communication', '/archives', '/notifications', '/profile']
  },
  USER: {
    nav: ['dashboard', 'messages', 'notifications', 'profile'],
    routes: ['/', '/communication', '/notifications', '/profile']
  }
};

export function canAccessPath(role: Role, pathname: string): boolean {
  const allowed = ROLE_CAPABILITIES[role]?.routes ?? [];
  return allowed.includes(pathname);
}

