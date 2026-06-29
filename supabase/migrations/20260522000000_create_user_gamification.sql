-- Gamificação por atividade (água / treino / sono)
-- Aditiva: não altera nenhuma tabela existente. Uma linha por usuário.

create table if not exists public.user_gamification (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streaks jsonb not null default '{}'::jsonb,
  unlocked_achievements text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.user_gamification enable row level security;

drop policy if exists "users manage own gamification" on public.user_gamification;
create policy "users manage own gamification"
  on public.user_gamification
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
