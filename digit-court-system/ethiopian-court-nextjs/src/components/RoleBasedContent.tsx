'use client';

import { useEffect, useState } from 'react';
import { normalizeRoleFromUser, type Role } from '@/lib/rbac';

interface RoleBasedContentProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleBasedContent({ 
  allowedRoles, 
  children, 
  fallback = null 
}: RoleBasedContentProps) {
  const [userRole, setUserRole] = useState<Role | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('courtUser');
    if (userStr && userStr !== 'undefined') {
      try {
        const userData = JSON.parse(userStr);
        setUserRole(normalizeRoleFromUser(userData));
      } catch (e) {
        console.error('Failed to parse user data');
        setUserRole('USER');
      }
    } else {
      setUserRole('USER');
    }
  }, []);

  if (userRole === null) return null;
  if (!allowedRoles.includes(userRole)) return <>{fallback}</>;
  
  return <>{children}</>;
}
