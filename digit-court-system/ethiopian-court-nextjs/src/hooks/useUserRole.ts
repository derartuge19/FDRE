'use client';

import { useEffect, useState } from 'react';
import { normalizeRoleFromUser, type Role } from '@/lib/rbac';

export function useUserRole(): Role {
  const [userRole, setUserRole] = useState<Role>('USER');

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
    }
  }, []);

  return userRole;
}

export function useCurrentUser() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('courtUser');
    if (userStr && userStr !== 'undefined') {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
  }, []);

  return user;
}
