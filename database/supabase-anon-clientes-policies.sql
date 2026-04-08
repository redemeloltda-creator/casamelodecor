-- Policies para permitir uso de public.clientes com anon key em site estático.
-- Atenção: isso abre leitura e escrita para qualquer visitante.

alter table if exists public.clientes enable row level security;

-- Remove políticas antigas para evitar conflito com modelo auth.uid().
drop policy if exists "clientes_public_access" on public.clientes;
drop policy if exists "clientes_auth_select" on public.clientes;
drop policy if exists "clientes_auth_insert" on public.clientes;
drop policy if exists "clientes_auth_update" on public.clientes;
drop policy if exists "clientes_auth_delete" on public.clientes;
drop policy if exists "clientes_anon_select" on public.clientes;
drop policy if exists "clientes_anon_insert" on public.clientes;
drop policy if exists "clientes_anon_update" on public.clientes;
drop policy if exists "select publico clientes" on public.clientes;
drop policy if exists "insert publico clientes" on public.clientes;
drop policy if exists "update publico clientes" on public.clientes;

-- Permite SELECT para requests com role anon.
create policy "select publico clientes"
on public.clientes
for select
to anon
using (true);

-- Permite INSERT para requests com role anon.
create policy "insert publico clientes"
on public.clientes
for insert
to anon
with check (true);

-- Permite UPDATE para requests com role anon.
create policy "update publico clientes"
on public.clientes
for update
to anon
using (true)
with check (true);

-- Garante privilégios SQL mínimos para o role anon via PostgREST.
grant usage on schema public to anon;
grant select, insert, update on table public.clientes to anon;

-- Debug temporário (NÃO recomendado em produção):
-- alter table public.clientes disable row level security;

-- Se usar SERIAL/IDENTITY, mantenha grants de sequence (não necessário para UUID padrão).
