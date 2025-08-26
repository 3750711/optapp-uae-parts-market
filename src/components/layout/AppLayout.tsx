import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import SessionWatchdog from '@/components/auth/SessionWatchdog';

export default function AppLayout() {
  return (
    <AuthProvider>
      <SessionWatchdog />
      <Outlet />
    </AuthProvider>
  );
}