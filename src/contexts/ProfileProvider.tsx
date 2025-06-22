
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/contexts/SimpleAuthContext';

interface ProfileContextType {
  profile: any;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { profile, isLoading } = useAuth();

  const value = {
    profile,
    isLoading,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
