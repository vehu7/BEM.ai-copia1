-- Tabela para armazenar subscriptions de push notification
-- Executar no SQL Editor do Supabase Dashboard

CREATE TABLE IF NOT EXISTS push_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscription"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);
