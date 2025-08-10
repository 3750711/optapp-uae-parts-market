import React, { useMemo } from 'react';
import { MessageCircle, Copy, Clock, ShieldCheck } from 'lucide-react';
import { CONTACT_CONFIG } from '@/config/contact';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface ContactAdminCardProps {
  language: 'ru' | 'en';
}

const i18n = {
  ru: {
    title: 'Связаться с администратором',
    subtitle: 'Напишите в Telegram. Мы ответим в рабочие часы.',
    openTelegram: 'Открыть Telegram',
    copyMessage: 'Скопировать сообщение',
    copied: 'Сообщение скопировано',
    schedule: 'График работы',
    note: 'Для быстрого ответа отправьте сообщение со следующими данными:',
  },
  en: {
    title: 'Contact administrator',
    subtitle: 'Message us on Telegram. We respond during working hours.',
    openTelegram: 'Open Telegram',
    copyMessage: 'Copy message',
    copied: 'Message copied',
    schedule: 'Working hours',
    note: 'For faster response, send a message with the details below:',
  },
};

export const ContactAdminCard: React.FC<ContactAdminCardProps> = ({ language }) => {
  const { user, profile } = useAuth();
  const t = i18n[language];

  const managerUsername = CONTACT_CONFIG.TELEGRAM_MANAGER.username;
  const managerUrl = `https://t.me/${managerUsername}`;

  const prefilledMessage = useMemo(() => {
    const parts: string[] = [];
    if (language === 'ru') {
      parts.push('Здравствуйте! Нужна помощь с подтверждением аккаунта.');
      parts.push(`Тип пользователя: ${profile?.user_type ?? '—'}`);
      if (profile?.user_type === 'seller') {
        parts.push(`Магазин: ${profile?.company_name ?? '—'}`);
        parts.push(`Локация: ${profile?.location ?? '—'}`);
        if (profile?.description_user) parts.push(`Описание: ${profile.description_user}`);
      }
      parts.push(`OPT ID: ${profile?.opt_id ?? '—'}`);
      parts.push(`Email: ${profile?.email ?? user?.email ?? '—'}`);
      parts.push(`User ID: ${user?.id ?? '—'}`);
    } else {
      parts.push('Hello! I need help with account approval.');
      parts.push(`User type: ${profile?.user_type ?? '—'}`);
      if (profile?.user_type === 'seller') {
        parts.push(`Store: ${profile?.company_name ?? '—'}`);
        parts.push(`Location: ${profile?.location ?? '—'}`);
        if (profile?.description_user) parts.push(`Description: ${profile.description_user}`);
      }
      parts.push(`OPT ID: ${profile?.opt_id ?? '—'}`);
      parts.push(`Email: ${profile?.email ?? user?.email ?? '—'}`);
      parts.push(`User ID: ${user?.id ?? '—'}`);
    }
    return parts.join('\n');
  }, [language, profile, user]);

  const deepLink = `${managerUrl}?text=${encodeURIComponent(prefilledMessage)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prefilledMessage);
      toast({ description: t.copied });
      console.log(`[Analytics] ${CONTACT_CONFIG.ANALYTICS_EVENTS.DIRECT_CONTACT}`, { via: 'copy', username: managerUsername });
    } catch (e) {
      console.error('Clipboard error', e);
    }
  };

  const handleOpen = () => {
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

      <section className="mb-4">
        <p className="text-sm mb-2">{t.note}</p>
        <pre className="whitespace-pre-wrap text-sm rounded-md bg-muted p-3 overflow-x-auto border">
{prefilledMessage}
        </pre>
      </section>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button asChild>
          <a href={deepLink} target="_blank" rel="noopener noreferrer" aria-label={t.openTelegram} onClick={handleOpen}>
            <MessageCircle className="h-4 w-4 mr-2" /> {t.openTelegram}
          </a>
        </Button>
        <Button variant="outline" onClick={handleCopy} aria-label={t.copyMessage}>
          <Copy className="h-4 w-4 mr-2" /> {t.copyMessage}
        </Button>
      </div>

      <aside className="mt-4 text-sm">
        <div className="flex items-start gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 mt-0.5" />
          <div>
            <div className="font-medium">{t.schedule}</div>
            <ul className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              <li>Суббота: {CONTACT_CONFIG.DEFAULT_WORKING_HOURS.saturday}</li>
              <li>Воскресенье: {CONTACT_CONFIG.DEFAULT_WORKING_HOURS.sunday}</li>
              <li>Понедельник: {CONTACT_CONFIG.DEFAULT_WORKING_HOURS.monday}</li>
              <li>Вторник: {CONTACT_CONFIG.DEFAULT_WORKING_HOURS.tuesday}</li>
              <li>Среда: {CONTACT_CONFIG.DEFAULT_WORKING_HOURS.wednesday}</li>
              <li>Четверг: {CONTACT_CONFIG.DEFAULT_WORKING_HOURS.thursday}</li>
              <li>Пятница: {CONTACT_CONFIG.DEFAULT_WORKING_HOURS.friday}</li>
            </ul>
          </div>
        </div>
      </aside>
    </article>
  );
};

export default ContactAdminCard;
