import React from 'react';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import { CONTACT_CONFIG } from '@/config/contact';
import { Button } from '@/components/ui/button';

interface ContactAdminCardProps {
  language: 'ru' | 'en';
}

const i18n = {
  ru: {
    title: 'Связаться с администратором',
    subtitle: 'Напишите нам в Telegram — ответим как можно скорее.',
    openTelegram: 'Связаться с администратором',
  },
  en: {
    title: 'Contact administrator',
    subtitle: 'Message us on Telegram — we will respond as soon as possible.',
    openTelegram: 'Contact administrator',
  },
};

export const ContactAdminCard: React.FC<ContactAdminCardProps> = ({ language }) => {
  const t = i18n[language];
  const managerUsername = CONTACT_CONFIG.TELEGRAM_MANAGER.username;
  const managerUrl = `https://t.me/${managerUsername}`;

  const handleOpen = () => {
    // lightweight analytics log
    console.log(`[Analytics] ${CONTACT_CONFIG.ANALYTICS_EVENTS.MANAGER_CONTACT}`, { via: 'telegram', username: managerUsername });
  };

  return (
    <article className="rounded-lg border bg-card p-5 shadow-sm">
      <header className="mb-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> {t.title}
        </h2>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </header>

      <div className="flex">
        <Button asChild>
          <a href={managerUrl} target="_blank" rel="noopener noreferrer" aria-label={t.openTelegram} onClick={handleOpen}>
            <MessageCircle className="h-4 w-4 mr-2" /> {t.openTelegram}
          </a>
        </Button>
      </div>
    </article>
  );
};

export default ContactAdminCard;
