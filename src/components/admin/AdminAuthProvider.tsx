import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Провайдер для админской части
 * Использует стандартный AuthContext и QueryClient из App.tsx
 */
export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};