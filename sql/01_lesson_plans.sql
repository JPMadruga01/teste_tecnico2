create table if not exists public.lesson_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  subject text not null,
  topic text not null,
  school_year text not null,
  duration_minutes int not null check (duration_minutes > 0),
  class_size int,
  bncc_codes text[],
  teacher_goals text,
  resources text,
  constraints text,
  language text default 'pt-BR',
  generated jsonb not null,
  model_name text not null,
  raw_model_response jsonb,
  created_at timestamptz not null default now()
);
