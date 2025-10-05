import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Провайдер для админской части
 * Использует Enhanced AuthContext с улучшениями:
 * - Single-flight запросы профиля
 * - BroadcastChannel между вкладками  
 * - TTL кэширование
 * - Защита от refresh-циклов
 * - Телеметрия
 * 
 * Использует стандартный QueryClient из App.tsx
 */
export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};