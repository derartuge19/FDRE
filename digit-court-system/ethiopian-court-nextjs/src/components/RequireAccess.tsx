'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { canAccessPath, normalizeRoleFromUser, type Role } from '@/lib/rbac';

type Props = {
  children: React.ReactNode;
  /**
   * If provided, access is restricted to these roles.
   * If omitted, we only require the user to be logged in.
   */
  allowedRoles?: Role[];
  redirectTo?: string;
};

export default function RequireAccess({ children, allowedRoles, redirectTo = '/login' }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const { token, role } = useMemo(() => {
    if (typeof window === 'undefined') return { token: null as string | null, role: 'USER' as Role };
    const t = localStorage.getItem('courtToken');
    const u = localStorage.getItem('courtUser');
    let user = null;
    if (u && u !== 'undefined') {
      try {
        user = JSON.parse(u);
      } catch (e) {
        console.error('Failed to parse user in RequireAccess');
      }
    }
    return { token: t, role: normalizeRoleFromUser(user) };
  }, []);

  useEffect(() => {
    if (!token) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && allowedRoles.length && !allowedRoles.includes(role)) {
      router.replace('/');
      return;
    }

    // Optional stricter check: role must be allowed for this exact path.
    if (!canAccessPath(role, pathname)) {
      router.replace('/');
    }
  }, [allowedRoles, pathname, redirectTo, role, router, token]);

  if (!token) return null;
  if (allowedRoles && allowedRoles.length && !allowedRoles.includes(role)) return null;
  if (!canAccessPath(role, pathname)) return null;

  return (
    <>
      {children}
      {/* Fallback (rare): if router doesn't navigate, show a way out */}
      <noscript>
        <div style={{ padding: 16 }}>
          Access restricted. Go to <Link href="/">home</Link>.
        </div>
      </noscript>
    </>
  );
}

