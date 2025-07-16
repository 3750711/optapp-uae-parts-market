-- Create trigger for automatic profile creation when new users are added
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync existing orphaned Telegram users (users in auth.users but not in profiles)
SELECT public.sync_orphaned_telegram_users_safe();