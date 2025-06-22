
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import EmailVerificationForm from '@/components/auth/EmailVerificationForm';
import { useProfile } from '@/contexts/ProfileProvider';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetch } = useProfile();
  
  const email = searchParams.get('email') || '';
  const returnTo = searchParams.get('returnTo') || '/profile';

  const handleVerificationSuccess = async (verifiedEmail: string) => {
    console.log('Email verified successfully:', verifiedEmail);
    
    // Обновляем профиль пользователя
    await refetch();
    
    // Перенаправляем пользователя
    navigate(returnTo, { 
      replace: true,
      state: { emailVerified: true }
    });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <EmailVerificationForm
            initialEmail={email}
            onVerificationSuccess={handleVerificationSuccess}
            onCancel={handleCancel}
            title="Подтверждение email"
            description="Введите код подтверждения, отправленный на вашу почту"
          />
        </div>
      </div>
    </Layout>
  );
};

export default VerifyEmail;
