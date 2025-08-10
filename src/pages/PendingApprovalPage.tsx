import React from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useApprovalStatus } from '@/hooks/useApprovalStatus';
import { TelegramLoginWidget } from '@/components/auth/TelegramLoginWidget';
import { Helmet } from 'react-helmet-async';
import ContactAdminCard from '@/components/pending/ContactAdminCard';
import PendingApprovalChecklist from '@/components/pending/PendingApprovalChecklist';
import { LoadingState } from '@/components/ui/LoadingState';

const translations = {
  en: {
    title: 'Pending Approval',
    description: 'Your account is awaiting approval. Please be patient.',
    contact: 'If you have any questions, please contact support.',
    metaTitle: 'Account Pending Approval',
    metaDescription: 'Your account is awaiting admin approval. See checklist and contact admin via Telegram.',
    whatNextTitle: 'What happens next?',
    whatNextText: 'Our team will review your information shortly. You will be redirected automatically after approval.',
    telegramHint: 'Using Telegram login? Complete your profile in the Telegram modal (it may open automatically).',
  },
  ru: {
    title: 'Ожидание подтверждения',
    description: 'Ваша учетная запись ожидает подтверждения. Пожалуйста, будьте терпеливы.',
    contact: 'Если у вас есть вопросы — напишите администратору.',
    metaTitle: 'Ожидание подтверждения аккаунта',
    metaDescription: 'Ваш аккаунт ожидает подтверждения администратором. Проверьте чеклист и свяжитесь через Telegram.',
    whatNextTitle: 'Что дальше?',
    whatNextText: 'Мы скоро проверим вашу информацию. После подтверждения произойдет автоматический переход.',
    telegramHint: 'Вы вошли через Telegram? Завершите профиль в появляющемся окне Telegram (оно может открыться автоматически).',
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
        <Helmet>
          <title>{t.metaTitle}</title>
          <meta name="description" content={t.metaDescription} />
          <link rel="canonical" href="/pending-approval" />
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: t.metaTitle,
              description: t.metaDescription,
              url: '/pending-approval',
            })}
          </script>
        </Helmet>
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-2xl font-semibold mb-4">{t.title}</h1>
          <LoadingState isLoading loadingText={language === 'ru' ? 'Загрузка...' : 'Loading...'}>
            <div />
          </LoadingState>
        </div>
      </Layout>
    );
  }

  if (isApproved) {
    return (
      <Layout>
        <Helmet>
          <title>{t.metaTitle}</title>
          <meta name="description" content={t.metaDescription} />
          <link rel="canonical" href="/pending-approval" />
        </Helmet>
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
        <Helmet>
          <title>{t.metaTitle}</title>
          <meta name="description" content={t.metaDescription} />
          <link rel="canonical" href="/pending-approval" />
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: t.metaTitle,
              description: t.metaDescription,
              url: '/pending-approval',
            })}
          </script>
        </Helmet>
        <div className="container mx-auto px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold mb-2">{t.title}</h1>
            <p className="text-muted-foreground">{t.description}</p>
          </header>

          <main className="grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2 space-y-6">
              <PendingApprovalChecklist language={language} />

              <section className="rounded-lg border bg-card p-5 shadow-sm">
                <h2 className="text-lg font-semibold mb-2">{t.whatNextTitle}</h2>
                <p className="text-sm text-muted-foreground">{t.whatNextText}</p>
                {profile?.auth_method === 'telegram' && (
                  <p className="mt-3 text-sm">{t.telegramHint}</p>
                )}
              </section>
            </section>

            <aside className="lg:col-span-1">
              <ContactAdminCard language={language} />
            </aside>
          </main>
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
