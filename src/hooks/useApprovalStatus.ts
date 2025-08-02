import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useApprovalStatus = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile) {
      setIsChecking(false);
      return;
    }

    // Initial status check
    const checkInitialStatus = () => {
      if (profile.verification_status === 'verified') {
        setIsApproved(true);
        setTimeout(() => {
          // Redirect based on user type
          if (profile.user_type === 'seller') {
            navigate('/seller/dashboard');
          } else if (profile.user_type === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 2000);
      }
      setIsChecking(false);
    };

    checkInitialStatus();

    // Set up real-time subscription for profile changes
    const channel = supabase
      .channel('profile-verification-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          const newProfile = payload.new;
          if (newProfile.verification_status === 'verified') {
            setIsApproved(true);
            setTimeout(() => {
              // Redirect based on user type
              if (newProfile.user_type === 'seller') {
                navigate('/seller/dashboard');
              } else if (newProfile.user_type === 'admin') {
                navigate('/admin');
              } else {
                navigate('/');
              }
            }, 2000);
          } else if (newProfile.verification_status === 'blocked') {
            // Handle blocked status - redirect to home
            navigate('/');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, navigate]);

  return {
    isChecking,
    isApproved
  };
};