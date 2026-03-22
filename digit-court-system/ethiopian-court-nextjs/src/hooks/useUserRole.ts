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
    const fetchProfile = async () => {
      const token = localStorage.getItem('courtToken');
      if (!token) return;

      try {
        const res = await fetch('http://localhost:5173/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
          localStorage.setItem('courtUser', JSON.stringify(data.data));
        }
      } catch (e) {
        console.error('Failed to fetch user profile');
      }
    };

    const userStr = localStorage.getItem('courtUser');
    if (userStr && userStr !== 'undefined') {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse local user data');
      }
    }
    
    fetchProfile();
  }, []);

  return user;
}
