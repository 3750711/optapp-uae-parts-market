import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminQueryClient } from '@/admin/_shared/AdminQueryClient';

/**
 * Оптимизированный провайдер для админской части
 * Использует Enhanced AuthContext с улучшениями:
 * - Single-flight запросы профиля
 * - BroadcastChannel между вкладками  
 * - TTL кэширование
 * - Защита от refresh-циклов
 * - Телеметрия
 */
export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <AdminQueryClient>
        {children}
      </AdminQueryClient>
    </AuthProvider>
  );
};