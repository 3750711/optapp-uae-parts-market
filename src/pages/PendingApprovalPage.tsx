import React from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useApprovalStatus } from '@/hooks/useApprovalStatus';
import { TelegramLoginWidget } from '@/components/auth/TelegramLoginWidget';

const translations = {
  en: {
    title: 'Pending Approval',
    description: 'Your account is awaiting approval. Please be patient.',
    contact: 'If you have any questions, please contact support.',
  },
  ru: {
    title: 'Ожидание подтверждения',
    description: 'Ваша учетная запись ожидает подтверждения. Пожалуйста, будьте терпеливы.',
    contact: 'Если у вас есть какие-либо вопросы, пожалуйста, свяжитесь с поддержкой.',
  },
};

const PendingApprovalPage: React.FC = () => {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const { isChecking, isApproved } = useApprovalStatus();

  const t = translations[language];

  if (isChecking) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-2xl font-semibold mb-4">{t.title}</h1>
          <p>{t.description}</p>
          <p>{t.contact}</p>
          <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isApproved) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-2xl font-semibold mb-4">{t.title}</h1>
          <p>{t.description}</p>
          <p>{t.contact}</p>
          <p>Your account has been approved.</p>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout>
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-2xl font-semibold mb-4">{t.title}</h1>
          <p>{t.description}</p>
          <p>{t.contact}</p>
        </div>
      </Layout>
      {/* Hidden Telegram widget to auto-open registration modal for incomplete Telegram profiles */}
      {profile?.auth_method === 'telegram' && (
        (!profile?.profile_completed || (profile as any)?.accepted_terms === false || (profile as any)?.accepted_privacy === false) && (
          <div className="sr-only" aria-hidden="true">
            <TelegramLoginWidget language={language} />
          </div>
        )
      )}
    </>
  );
};

export default PendingApprovalPage;
