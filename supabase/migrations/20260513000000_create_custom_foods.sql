-- ═══════════════════════════════════════════════════════════════
-- custom_foods — Base de dados compartilhada de alimentos
-- adicionados pelos usuários (foto IA, código de barras, manual)
--
-- Idempotente: cria a tabela se não existir e adiciona colunas
-- faltantes em instalações antigas.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.custom_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'outro',
  portion TEXT NOT NULL,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  fiber NUMERIC NOT NULL DEFAULT 0,
  sodium NUMERIC,
  sugar NUMERIC,
  saturated_fat NUMERIC,
  omega3 NUMERIC,
  cholesterol NUMERIC,
  is_brazilian BOOLEAN NOT NULL DEFAULT false,
  is_healthy BOOLEAN NOT NULL DEFAULT true,
  barcode TEXT,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Garante que colunas adicionadas depois existam em bancos antigos
ALTER TABLE public.custom_foods ADD COLUMN IF NOT EXISTS saturated_fat NUMERIC;
ALTER TABLE public.custom_foods ADD COLUMN IF NOT EXISTS omega3 NUMERIC;
ALTER TABLE public.custom_foods ADD COLUMN IF NOT EXISTS cholesterol NUMERIC;
ALTER TABLE public.custom_foods ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE public.custom_foods ADD COLUMN IF NOT EXISTS fiber NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.custom_foods ADD COLUMN IF NOT EXISTS is_brazilian BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.custom_foods ADD COLUMN IF NOT EXISTS is_healthy BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem LER a base compartilhada
DROP POLICY IF EXISTS "Authenticated users can view custom_foods" ON public.custom_foods;
CREATE POLICY "Authenticated users can view custom_foods"
  ON public.custom_foods FOR SELECT
  TO authenticated
  USING (true);

-- Cada usuário só pode INSERIR alimentos atribuídos a si mesmo
DROP POLICY IF EXISTS "Users can insert own custom_foods" ON public.custom_foods;
CREATE POLICY "Users can insert own custom_foods"
  ON public.custom_foods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = added_by);

-- Cada usuário só pode atualizar/deletar os que adicionou
DROP POLICY IF EXISTS "Users can update own custom_foods" ON public.custom_foods;
CREATE POLICY "Users can update own custom_foods"
  ON public.custom_foods FOR UPDATE
  TO authenticated
  USING (auth.uid() = added_by)
  WITH CHECK (auth.uid() = added_by);

DROP POLICY IF EXISTS "Users can delete own custom_foods" ON public.custom_foods;
CREATE POLICY "Users can delete own custom_foods"
  ON public.custom_foods FOR DELETE
  TO authenticated
  USING (auth.uid() = added_by);

-- Índices: nome (busca), barcode (lookup), created_at (ordenação)
CREATE INDEX IF NOT EXISTS idx_custom_foods_name ON public.custom_foods (name);
CREATE INDEX IF NOT EXISTS idx_custom_foods_barcode ON public.custom_foods (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_custom_foods_created ON public.custom_foods (created_at DESC);
