-- Migração incremental (idempotente) para melhorar consistência e performance
-- Compatível com o schema atual do projeto.

begin;

create extension if not exists pgcrypto;

-- 1) Defaults e colunas de auditoria
alter table if exists public.clientes
  alter column atualizado_em set default now();

alter table if exists public.carrinhos
  alter column atualizado_em set default now();

alter table if exists public.comentarios
  alter column atualizado_em set default now();

alter table if exists public.entregas
  alter column atualizado_em set default now();

-- 2) Trigger único para manter atualizado_em consistente
create or replace function public.casamelo_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_clientes_touch_updated_at on public.clientes;
create trigger trg_clientes_touch_updated_at
before update on public.clientes
for each row
execute function public.casamelo_touch_updated_at();

drop trigger if exists trg_carrinhos_touch_updated_at on public.carrinhos;
create trigger trg_carrinhos_touch_updated_at
before update on public.carrinhos
for each row
execute function public.casamelo_touch_updated_at();

drop trigger if exists trg_comentarios_touch_updated_at on public.comentarios;
create trigger trg_comentarios_touch_updated_at
before update on public.comentarios
for each row
execute function public.casamelo_touch_updated_at();

drop trigger if exists trg_entregas_touch_updated_at on public.entregas;
create trigger trg_entregas_touch_updated_at
before update on public.entregas
for each row
execute function public.casamelo_touch_updated_at();

-- 3) Constraints de integridade (sem quebrar dados existentes)
alter table if exists public.itens_carrinho
  drop constraint if exists itens_carrinho_quantidade_check,
  add constraint itens_carrinho_quantidade_check check (quantidade > 0),
  drop constraint if exists itens_carrinho_preco_unitario_check,
  add constraint itens_carrinho_preco_unitario_check check (preco_unitario >= 0);

alter table if exists public.itens_pedido
  drop constraint if exists itens_pedido_quantidade_check,
  add constraint itens_pedido_quantidade_check check (quantidade > 0),
  drop constraint if exists itens_pedido_preco_unitario_check,
  add constraint itens_pedido_preco_unitario_check check (preco_unitario >= 0);

alter table if exists public.pagamentos
  drop constraint if exists pagamentos_valor_check,
  add constraint pagamentos_valor_check check (valor is null or valor >= 0);

-- 4) Índices para relacionamentos e filtros comuns
create index if not exists idx_carrinhos_cliente_id on public.carrinhos(cliente_id);
create index if not exists idx_carrinhos_user_id on public.carrinhos(user_id);
create index if not exists idx_carrinhos_status on public.carrinhos(status);
create index if not exists idx_carrinhos_criado_em on public.carrinhos(criado_em desc);

create index if not exists idx_itens_carrinho_carrinho_id on public.itens_carrinho(carrinho_id);
create index if not exists idx_itens_carrinho_produto_id on public.itens_carrinho(produto_id);
create index if not exists idx_itens_carrinho_user_id on public.itens_carrinho(user_id);

create index if not exists idx_historico_compras_cliente_id on public.historico_compras(cliente_id);
create index if not exists idx_historico_compras_user_id on public.historico_compras(user_id);
create index if not exists idx_historico_compras_data_compra on public.historico_compras(data_compra desc);

create index if not exists idx_pedidos_cliente_id on public.pedidos(cliente_id);
create index if not exists idx_pedidos_user_id on public.pedidos(user_id);
create index if not exists idx_pedidos_status on public.pedidos(status);
create index if not exists idx_pedidos_criado_em on public.pedidos(criado_em desc);

create index if not exists idx_itens_pedido_pedido_id on public.itens_pedido(pedido_id);
create index if not exists idx_itens_pedido_produto_id on public.itens_pedido(produto_id);
create index if not exists idx_itens_pedido_user_id on public.itens_pedido(user_id);

create index if not exists idx_pagamentos_pedido_id on public.pagamentos(pedido_id);
create index if not exists idx_pagamentos_status on public.pagamentos(status);
create index if not exists idx_pagamentos_criado_em on public.pagamentos(criado_em desc);

create index if not exists idx_entregas_pedido_id on public.entregas(pedido_id);
create index if not exists idx_entregas_status on public.entregas(status);
create index if not exists idx_entregas_atualizado_em on public.entregas(atualizado_em desc);

create index if not exists idx_enderecos_user_id on public.enderecos(user_id);
create index if not exists idx_enderecos_principal on public.enderecos(user_id, principal);

create index if not exists idx_comentarios_user_id on public.comentarios(user_id);
create index if not exists idx_comentarios_criado_em on public.comentarios(criado_em desc);

create index if not exists idx_produtos_user_id on public.produtos(user_id);
create index if not exists idx_produtos_ativo on public.produtos(ativo);

-- 5) Segurança: prepara migração de senha em texto puro para hash
alter table if exists public.clientes
  add column if not exists senha_hash text;

comment on column public.clientes.senha is 'DEPRECATED: evitar senha em texto puro; usar senha_hash.';
comment on column public.clientes.senha_hash is 'Senha com hash (ex.: bcrypt/argon2) para substituir clientes.senha.';

commit;
