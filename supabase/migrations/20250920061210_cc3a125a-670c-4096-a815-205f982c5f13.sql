-- Создание тестового события активности для проверки системы мониторинга
INSERT INTO public.event_logs (
  action_type,
  entity_type,
  entity_id,
  user_id,
  event_subtype,
  path,
  user_agent,
  ip_address,
  details
) VALUES (
  'page_view',
  'user_activity', 
  'f0d2b725-2619-4835-9248-1d212e29aa79'::uuid,
  'f0d2b725-2619-4835-9248-1d212e29aa79'::uuid,
  'navigation',
  '/admin/activity-monitor',
  'Mozilla/5.0 (Test ActivityMonitor)',
  '127.0.0.1'::inet,
  jsonb_build_object(
    'timestamp', now(),
    'referrer', '/admin/settings',
    'test_record', true,
    'system_check', 'activity_monitoring_system'
  )
);

-- Создание второй тестовой записи client_error для разнообразия
INSERT INTO public.event_logs (
  action_type,
  entity_type,
  entity_id,
  user_id,
  event_subtype,
  path,
  user_agent,
  ip_address,
  details
) VALUES (
  'client_error',
  'user_activity', 
  'f0d2b725-2619-4835-9248-1d212e29aa79'::uuid,
  'f0d2b725-2619-4835-9248-1d212e29aa79'::uuid,
  'javascript_error',
  '/admin/settings',
  'Mozilla/5.0 (Test Error)',
  '192.168.1.1'::inet,
  jsonb_build_object(
    'timestamp', now(),
    'message', 'Test error for activity monitoring',
    'stack', 'Error: Test error\n    at testFunction:1:1',
    'test_record', true
  )
);