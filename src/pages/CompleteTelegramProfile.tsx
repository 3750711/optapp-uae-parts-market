import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TelegramProfileCompletion } from '@/components/auth/TelegramProfileCompletion';
import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';

const CompleteTelegramProfile: React.FC = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      // User not logged in, redirect to login
      navigate('/login');
      return;
    }

    if (!isLoading && profile) {
      // Check if profile is already completed
      if (profile.profile_completed) {
        // Profile already completed, redirect based on user type
        if (profile.user_type === 'seller') {
          navigate('/seller');
        } else {
          navigate('/');
        }
        return;
      }

      // Check if this is actually a Telegram user
      if (profile.auth_method !== 'telegram') {
        // Not a Telegram user, redirect to appropriate page
        navigate('/');
        return;
      }
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

  if (!user || !profile || profile.auth_method !== 'telegram' || profile.profile_completed) {
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