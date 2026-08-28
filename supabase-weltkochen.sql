create table if not exists public.weltkochen_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.weltkochen_state disable row level security;

insert into public.weltkochen_state (id, data)
values ('weltkochen-global-state', '{}'::jsonb)
on conflict (id) do nothing;
