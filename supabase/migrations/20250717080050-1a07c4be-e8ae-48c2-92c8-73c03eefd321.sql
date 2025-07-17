-- Create table for account operation backups
CREATE TABLE IF NOT EXISTS public.account_operation_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  backup_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  restored_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.account_operation_backups ENABLE ROW LEVEL SECURITY;

-- Only admins can manage backups
CREATE POLICY "Only admins can manage backups" ON public.account_operation_backups
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Create function to restore account from backup
CREATE OR REPLACE FUNCTION public.restore_account_from_backup(backup_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  backup_record RECORD;
  result JSON;
BEGIN
  -- Only admins can restore
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can restore accounts';
  END IF;

  -- Get backup record
  SELECT * INTO backup_record
  FROM public.account_operation_backups
  WHERE id = backup_id
  AND restored_at IS NULL;

  IF backup_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Backup not found or already restored'
    );
  END IF;

  -- Restore profile data
  UPDATE public.profiles
  SET
    auth_method = backup_record.backup_data->>'auth_method',
    telegram_id = CASE 
      WHEN backup_record.backup_data->>'telegram_id' = 'null' THEN NULL
      ELSE (backup_record.backup_data->>'telegram_id')::bigint
    END,
    telegram = backup_record.backup_data->>'telegram',
    email_confirmed = (backup_record.backup_data->>'email_confirmed')::boolean
  WHERE id = backup_record.user_id;

  -- Mark backup as used
  UPDATE public.account_operation_backups
  SET restored_at = NOW()
  WHERE id = backup_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Account successfully restored',
    'user_id', backup_record.user_id,
    'operation_type', backup_record.operation_type
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error restoring account: ' || SQLERRM
    );
END;
$$;