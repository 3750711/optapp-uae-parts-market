import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TelegramProfileCompletion } from '@/components/auth/TelegramProfileCompletion';
import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CompleteTelegramProfile: React.FC = () => {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFixingProfile, setIsFixingProfile] = useState(false);

  // Function to fix corrupted profile (has user_type but no opt_id)
  const fixCorruptedProfile = async () => {
    if (!profile || !user) return;
    
    setIsFixingProfile(true);
    console.log('Fixing corrupted Telegram profile:', { 
      userId: user.id, 
      userType: profile.user_type, 
      optId: profile.opt_id,
      profileCompleted: profile.profile_completed 
    });
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: null,
          opt_id: null,
          profile_completed: false
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await refreshProfile();
      toast({
        title: "Профиль сброшен",
        description: "Теперь вы можете начать регистрацию заново"
      });
      
    } catch (error) {
      console.error('Error fixing profile:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось исправить профиль. Попробуйте обновить страницу.",
        variant: "destructive"
      });
    } finally {
      setIsFixingProfile(false);
    }
  };

  useEffect(() => {
    console.log('CompleteTelegramProfile useEffect:', { 
      isLoading, 
      user: !!user, 
      profile: profile ? {
        authMethod: profile.auth_method,
        userType: profile.user_type,
        optId: profile.opt_id,
        profileCompleted: profile.profile_completed,
        verificationStatus: profile.verification_status
      } : null 
    });

    if (!isLoading && !user) {
      console.log('No user, redirecting to login');
      navigate('/login');
      return;
    }

    if (!isLoading && profile) {
      // Check if this is actually a Telegram user first
      if (profile.auth_method !== 'telegram') {
        console.log('Not a Telegram user, redirecting to home');
        navigate('/');
        return;
      }

      // Check if profile is properly completed - main criteria: profile_completed = true AND opt_id exists
      if (profile.profile_completed && profile.opt_id) {
        console.log('Profile is completed, checking verification status');
        // Profile properly completed, check verification status
        if (profile.verification_status === 'verified') {
          console.log('User verified, redirecting based on user type');
          if (profile.user_type === 'seller') {
            navigate('/seller');
          } else {
            navigate('/');
          }
        } else if (profile.verification_status === 'pending') {
          console.log('User pending verification, staying on page');
          // Allow pending users to stay and complete profile if needed
        }
        return;
      }

      // If profile_completed is false or opt_id is missing, show the completion flow
      // This includes users who have user_type = 'buyer' but haven't completed registration
      console.log('Profile incomplete, showing completion flow');
    }
  }, [user, profile, isLoading, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show completion flow for any Telegram user who hasn't completed their profile
  // This includes users with user_type = 'buyer' who need to go through account type selection
  if (!user || !profile || profile.auth_method !== 'telegram' || (profile.profile_completed && profile.opt_id)) {
    return null; // Will be redirected by useEffect
  }

  return (
    <>
      <Helmet>
        <title>Complete Your Profile - PartsBay</title>
        <meta name="description" content="Complete your Telegram registration by providing additional information." />
      </Helmet>
      
      <TelegramProfileCompletion language="ru" />
    </>
  );
};

export default CompleteTelegramProfile;