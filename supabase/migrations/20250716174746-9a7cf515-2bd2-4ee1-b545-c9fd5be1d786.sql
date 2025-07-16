-- Sync existing orphaned Telegram users (users in auth.users but not in profiles)
SELECT public.sync_orphaned_telegram_users_safe();