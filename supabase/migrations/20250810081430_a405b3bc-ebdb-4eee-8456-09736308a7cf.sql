BEGIN;

-- 1) Deduplicate any existing duplicate welcome "sent" logs, keep the latest per user
WITH ranked AS (
  SELECT 
    id,
    related_entity_id,
    notification_type,
    status,
    telegram_message_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY related_entity_id, notification_type
      ORDER BY created_at DESC
    ) AS rn
  FROM public.telegram_notifications_log
  WHERE notification_type = 'welcome_registration'
    AND status = 'sent'
)
DELETE FROM public.telegram_notifications_log t
USING ranked r
WHERE t.id = r.id AND r.rn > 1;

-- 2) Enforce single welcome message per user via a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS uniq_welcome_sent_per_user
ON public.telegram_notifications_log (related_entity_id, notification_type)
WHERE status = 'sent' AND notification_type = 'welcome_registration';

-- 3) Remove potential duplicate triggers that could invoke welcome multiple times
DROP TRIGGER IF EXISTS trg_notify_on_user_registration ON public.profiles;
DROP TRIGGER IF EXISTS tr_profiles_notify_welcome_update ON public.profiles;

COMMIT;