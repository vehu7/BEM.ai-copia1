-- Sistema de trial / assinatura (7 dias grátis + planos Guru)
-- Migração aditiva: adiciona 3 colunas sem alterar dados existentes.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS subscription_email TEXT;

-- Restringe valores permitidos para o plano
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'premium', 'premium_anual'));

-- Índice para consultas por plano (ex: listar usuários premium)
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

-- Índice para consultas por trial expirado
CREATE INDEX IF NOT EXISTS idx_profiles_trial_started_at ON profiles(trial_started_at);

-- Backfill explícito: garante que usuários existentes tenham trial iniciado AGORA.
-- Esta query é idempotente (só afeta linhas onde o campo é NULL, que nesse ponto
-- não deve existir por causa do DEFAULT, mas executamos por segurança).
UPDATE profiles
SET trial_started_at = NOW()
WHERE trial_started_at IS NULL;

UPDATE profiles
SET plan = 'free'
WHERE plan IS NULL;

COMMENT ON COLUMN profiles.plan IS 'Plano atual do usuário: free (trial), premium (mensal), premium_anual';
COMMENT ON COLUMN profiles.trial_started_at IS 'Data de início do trial de 7 dias grátis';
COMMENT ON COLUMN profiles.subscription_email IS 'E-mail usado na compra do plano (se diferente do cadastro)';
