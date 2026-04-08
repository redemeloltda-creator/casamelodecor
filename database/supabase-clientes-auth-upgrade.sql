-- Ajustes para alinhar a tabela public.clientes com o fluxo do site
-- (cadastro/login com email + senha hash + status ativo).

alter table public.clientes
  add column if not exists email text,
  add column if not exists senha text,
  add column if not exists ativo boolean default true;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clientes'
      and column_name = 'senha_hash'
  ) then
    execute $sql$
      update public.clientes
      set senha = coalesce(nullif(senha, ''), nullif(senha_hash, ''), senha)
      where true
    $sql$;
  end if;
end
$$;

-- Garante unicidade opcional do e-mail (permite null).
create unique index if not exists clientes_email_unique_idx
  on public.clientes (lower(email))
  where email is not null;

-- Índices de busca usados no site.
create index if not exists clientes_celular_idx on public.clientes (celular);
create index if not exists clientes_public_token_idx on public.clientes (public_token);

-- Trigger para updated_at (caso ainda não exista no projeto).
create or replace function public.casamelo_touch_clientes_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_clientes_touch_atualizado_em on public.clientes;
create trigger trg_clientes_touch_atualizado_em
before update on public.clientes
for each row
execute function public.casamelo_touch_clientes_atualizado_em();
