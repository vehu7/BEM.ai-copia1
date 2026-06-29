-- Separa cirurgia bariátrica da coluna `medication` (que era um enum que
-- colocava GLP-1 e bariátrica como mutuamente exclusivos). Agora o usuário
-- pode ter feito bariátrica E estar usando GLP-1 simultaneamente.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS had_bariatric_surgery BOOLEAN NOT NULL DEFAULT false;

-- Backfill: quem tinha medication='bariatrica' agora tem had_bariatric_surgery=true
-- e medication='nenhum' (para os usuários que fizeram só a cirurgia sem GLP-1).
UPDATE profiles
SET had_bariatric_surgery = true,
    medication = 'nenhum'
WHERE medication = 'bariatrica';

COMMENT ON COLUMN profiles.had_bariatric_surgery IS 'Usuário realizou cirurgia bariátrica (independente de medicação GLP-1)';
