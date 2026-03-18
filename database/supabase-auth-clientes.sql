-- Migração opcional para projetos que usam Supabase Auth no front-end.
-- Atenção: este script substitui a policy pública de `clientes` por RLS amarrado ao usuário autenticado.
-- Use somente depois de migrar o login/cadastro para `supabase.auth.*`.

alter table public.clientes
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.clientes
  alter column user_id set default auth.uid();

create index if not exists idx_clientes_user_id on public.clientes (user_id);

alter table public.clientes enable row level security;

drop policy if exists "clientes_public_access" on public.clientes;
drop policy if exists "clientes_auth_select" on public.clientes;
drop policy if exists "clientes_auth_insert" on public.clientes;
drop policy if exists "clientes_auth_update" on public.clientes;
drop policy if exists "clientes_auth_delete" on public.clientes;

create policy "clientes_auth_select"
on public.clientes
for select
using (auth.uid() = user_id);

create policy "clientes_auth_insert"
on public.clientes
for insert
with check (auth.uid() = user_id);

create policy "clientes_auth_update"
on public.clientes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "clientes_auth_delete"
on public.clientes
for delete
using (auth.uid() = user_id);
