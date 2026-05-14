create table public.carrinhos (
  id uuid not null default gen_random_uuid (),
  cliente_celular character varying null,
  created_at timestamp without time zone null default now(),
  cliente_id uuid null,
  atualizado_em timestamp without time zone null,
  status character varying(20) null default 'ativo'::character varying,
  criado_em timestamp without time zone null default now(),
  constraint carrinhos_pkey primary key (id),
  constraint fk_carrinho_cliente foreign key (cliente_id) references clientes (id)
) TABLESPACE pg_default;

create index IF not exists idx_carrinhos_cliente on public.carrinhos using btree (cliente_id) TABLESPACE pg_default;

create index IF not exists idx_carrinho_cliente on public.carrinhos using btree (cliente_id) TABLESPACE pg_default;

create trigger trigger_backup_carrinhos
after INSERT
or DELETE
or
update on carrinhos for EACH row
execute FUNCTION fn_backup_carrinhos ();

create trigger update_carrinho_timestamp BEFORE
update on carrinhos for EACH row
execute FUNCTION update_timestamp ();
