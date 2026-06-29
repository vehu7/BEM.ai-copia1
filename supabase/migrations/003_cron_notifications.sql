SELECT cron.schedule(
  'vivabem-notifications',
  '0 8,10,12,14,16,18,20 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vmfhhwbbwnotugnrdjpm.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
