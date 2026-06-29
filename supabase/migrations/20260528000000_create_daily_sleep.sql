-- ═══════════════════════════════════════════════════════════════
-- daily_sleep — Registros de sono do usuário.
-- Antes os registros só ficavam em localStorage (bemai_sleep) e
-- sumiam ao trocar de aparelho ou limpar o cache. Agora persistem.
-- Idempotente: pode rodar em bancos novos e antigos.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.daily_sleep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  bedtime TEXT,
  wake_time TEXT,
  duration NUMERIC,
  quality TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_sleep ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily_sleep" ON public.daily_sleep;
CREATE POLICY "Users can view own daily_sleep"
  ON public.daily_sleep FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily_sleep" ON public.daily_sleep;
CREATE POLICY "Users can insert own daily_sleep"
  ON public.daily_sleep FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily_sleep" ON public.daily_sleep;
CREATE POLICY "Users can update own daily_sleep"
  ON public.daily_sleep FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own daily_sleep" ON public.daily_sleep;
CREATE POLICY "Users can delete own daily_sleep"
  ON public.daily_sleep FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_sleep_user_date ON public.daily_sleep (user_id, date DESC);
