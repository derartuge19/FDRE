'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useCurrentUser } from '@/hooks/useUserRole';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'alert' | 'system' | 'hearing';
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type: Notification['type']) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const user = useCurrentUser();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    const ws = new WebSocket('ws://localhost:5173');
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'authenticate',
        userId: user.id || user.username,
        userName: user.name,
        userRole: user.roles?.[0]
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message' && !data.isSelf) {
          addNotification(
            `New Message from ${data.senderName}`,
            data.content,
            'message'
          );
          
          // Play notification sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {});
        }
      } catch (e) {
        console.error('Failed to parse socket message', e);
      }
    };

    return () => {
      ws.close();
    };
  }, [user]);

  const addNotification = (title: string, message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
