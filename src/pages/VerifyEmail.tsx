
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import EmailVerificationForm from '@/components/auth/EmailVerificationForm';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from "@/components/navigation/BackButton";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const email = searchParams.get('email') || '';
  const returnTo = searchParams.get('returnTo') || '/profile';

  const handleVerificationSuccess = async (verifiedEmail: string) => {
    // Email verified successfully - just mark it as confirmed in the profile
    
    try {
      // Update email_confirmed status in profile
      const { error } = await supabase
        .from('profiles')
        .update({ email_confirmed: true })
        .eq('id', user?.id);

      if (error) {
        console.error('Error updating email confirmation status:', error);
      }

      // Refresh profile to get updated data
      await refreshProfile();
      
      toast({
        title: "Email подтвержден!",
        description: "Ваш email успешно подтвержден.",
        variant: "default",
      });
      
      // Redirect user
      navigate(returnTo, { 
        replace: true,
        state: { emailVerified: true }
      });
    } catch (error) {
      console.error('Error in verification success handler:', error);
      // Still redirect even if update fails
      navigate(returnTo, { 
        replace: true,
        state: { emailVerified: true }
      });
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
          <BackButton className="mb-4" fallback={returnTo} />
          <div className="w-full max-w-md">
          <EmailVerificationForm
            initialEmail={email}
            onVerificationSuccess={handleVerificationSuccess}
            onCancel={handleCancel}
            onChangeEmail={() => navigate('/register', { replace: true })}
            title="Подтверждение email"
            description="Введите код подтверждения, отправленный на вашу почту"
          />
        </div>
      </div>
    </Layout>
  );
};

export default VerifyEmail;
