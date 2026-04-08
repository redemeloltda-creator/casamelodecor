-- ============================================================
-- CASO 1 (RECOMENDADO): manter RLS ativado e liberar anon
-- ============================================================
-- Ajuste o schema se sua tabela não estiver em "public".

-- Garante que RLS está ligado
alter table public.clientes enable row level security;

-- Opcional: evita comportamento surpresa com herança de permissões
alter table public.clientes force row level security;

-- Remove políticas antigas com mesmo nome (idempotente)
drop policy if exists "anon_can_select_clientes" on public.clientes;
drop policy if exists "anon_can_insert_clientes" on public.clientes;
drop policy if exists "anon_can_update_clientes" on public.clientes;

-- Permite SELECT para role anon
create policy "anon_can_select_clientes"
on public.clientes
for select
to anon
using (true);

-- Permite INSERT para role anon
create policy "anon_can_insert_clientes"
on public.clientes
for insert
to anon
with check (true);

-- Permite UPDATE para role anon
create policy "anon_can_update_clientes"
on public.clientes
for update
to anon
using (true)
with check (true);

-- (Opcional, mas recomendado) garante privilégios SQL básicos para anon
-- Sem isso, em alguns cenários a policy existe mas falta GRANT.
grant usage on schema public to anon;
grant select, insert, update on table public.clientes to anon;


-- ============================================================
-- CASO 2 (ALTERNATIVA): desativar RLS na tabela
-- ============================================================
-- ATENÇÃO: isso remove a proteção por linha e deixa o acesso
-- controlado apenas por GRANTs. Em produção, prefira o CASO 1.

-- Para desativar RLS:
-- alter table public.clientes disable row level security;

-- Se quiser reativar depois:
-- alter table public.clientes enable row level security;
