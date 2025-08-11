import React, { useMemo } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

interface PendingApprovalChecklistProps {
  language: 'ru' | 'en';
}

const i18n = {
  ru: {
    statusTitle: 'Статус аккаунта',
    awaiting: 'В ожидании подтверждения администратором',
    checklistTitle: 'Что нужно проверить',
    items: {
      telegram: 'Привязан Telegram',
      terms: 'Приняты условия использования',
      privacy: 'Принята политика конфиденциальности',
      profile: 'Профиль заполнен',
      email: 'Email подтвержден',
      storeBlock: 'Данные магазина (для продавцов)',
      company: 'Название магазина указано',
      location: 'Локация указана',
      description: 'Описание магазина указано',
    },
    actions: {
      completeProfile: 'Заполнить профиль',
      createStore: 'Перейти к профилю',
    },
    hint: 'Если что-то не заполнено — дополните профиль. После проверки мы активируем ваш аккаунт.',
  },
  en: {
    statusTitle: 'Account status',
    awaiting: 'Awaiting admin approval',
    checklistTitle: 'Please ensure the following',
    items: {
      telegram: 'Telegram linked',
      terms: 'Terms accepted',
      privacy: 'Privacy policy accepted',
      profile: 'Profile completed',
      email: 'Email confirmed',
      storeBlock: 'Store details (for sellers)',
      company: 'Store name provided',
      location: 'Location provided',
      description: 'Store description provided',
    },
    actions: {
      completeProfile: 'Complete profile',
      createStore: 'Go to profile',
    },
    hint: 'If anything is missing, please update your profile. We will approve your account shortly after review.',
  },
};

const Item: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <li className="flex items-center gap-2">
    {ok ? (
      <CheckCircle2 className="h-5 w-5 text-primary" />
    ) : (
      <XCircle className="h-5 w-5 text-destructive" />
    )}
    <span className="text-sm">{label}</span>
  </li>
);

export const PendingApprovalChecklist: React.FC<PendingApprovalChecklistProps> = ({ language }) => {
  const { profile } = useAuth();
  const t = i18n[language];

  const flags = useMemo(() => {
    const isTelegramLinked = Boolean(profile?.telegram || profile?.telegram_id);
    const hasTerms = Boolean(profile?.accepted_terms);
    const hasPrivacy = Boolean(profile?.accepted_privacy);
    const isEmailConfirmed = Boolean(profile?.email_confirmed);

    const fullNameOk = Boolean(profile?.full_name && profile.full_name.trim().length > 0);
    const phoneOk = Boolean(profile?.phone && profile.phone.trim().length > 0);

    const isSeller = profile?.user_type === 'seller';
    const hasCompany = Boolean(profile?.company_name && profile.company_name.trim().length > 0);
    const hasLocation = Boolean(profile?.location && profile.location.trim().length > 0);
    const hasDescription = Boolean(profile?.description_user && profile.description_user.trim().length > 0);

    const derivedBuyerComplete = fullNameOk && phoneOk && hasTerms && hasPrivacy && isEmailConfirmed;
    const derivedSellerComplete = derivedBuyerComplete && hasCompany && hasLocation && hasDescription;

    const isProfileCompleted = Boolean(profile?.profile_completed) || (isSeller ? derivedSellerComplete : derivedBuyerComplete);

    if (process.env.NODE_ENV === 'development') {
      // Helpful for debugging checklist states in development
      console.debug('[PendingApprovalChecklist] flags', {
        fullNameOk,
        phoneOk,
        hasTerms,
        hasPrivacy,
        isEmailConfirmed,
        isSeller,
        hasCompany,
        hasLocation,
        hasDescription,
        isProfileCompleted,
      });
    }

    return {
      isTelegramLinked,
      hasTerms,
      hasPrivacy,
      isProfileCompleted,
      isEmailConfirmed,
      isSeller,
      hasCompany,
      hasLocation,
      hasDescription,
    };
  }, [profile]);

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <header className="mb-3">
        <h2 className="text-lg font-semibold">{t.statusTitle}</h2>
        <p className="text-sm text-muted-foreground flex items-center gap-2"><Info className="h-4 w-4" /> {t.awaiting}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t.checklistTitle}</h3>
          <ul className="space-y-2">
            <Item ok={flags.isTelegramLinked} label={t.items.telegram} />
            <Item ok={flags.hasTerms} label={t.items.terms} />
            <Item ok={flags.hasPrivacy} label={t.items.privacy} />
            <Item ok={flags.isProfileCompleted} label={t.items.profile} />
            <Item ok={flags.isEmailConfirmed} label={t.items.email} />
          </ul>
        </div>
        {flags.isSeller && (
          <div>
            <h3 className="mb-2 text-sm font-medium">{t.items.storeBlock}</h3>
            <ul className="space-y-2">
              <Item ok={flags.hasCompany} label={t.items.company} />
              <Item ok={flags.hasLocation} label={t.items.location} />
              <Item ok={flags.hasDescription} label={t.items.description} />
            </ul>
          </div>
        )}
      </div>

      
    </section>
  );
};

export default PendingApprovalChecklist;
