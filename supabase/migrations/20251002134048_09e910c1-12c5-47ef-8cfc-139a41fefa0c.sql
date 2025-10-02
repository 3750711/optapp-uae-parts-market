-- Add foreign key constraint from user_sessions to profiles
ALTER TABLE user_sessions
ADD CONSTRAINT user_sessions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
ON user_sessions(user_id);

-- Verify constraint was created
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'user_sessions';