# Supabase na Casa Melo Decor

## 1. Crie um projeto no Supabase
- Abra o painel do Supabase.
- Crie um projeto novo.
- Copie a **Project URL** e a **anon public key**.

## 2. Crie o banco de dados usado pelo site
- No SQL Editor do Supabase, execute o arquivo `database/schema.supabase.sql`.
- Se você já criou tabelas manualmente e o console mostra erros `404` para `/rest/v1/clientes`, `/carrinhos` ou `/historico_compras`, aplique `database/supabase-compat.sql`.
- Esse script cria as tabelas:
  - `clientes`
  - `carrinhos`
  - `historico_compras`
  - `comentarios`

## 3. Configure o front-end
Edite `supabase-config.js` e preencha:

```js
window.CASAMELO_SUPABASE_CONFIG = {
  url: 'https://SEU-PROJETO.supabase.co',
  anonKey: 'SUA_CHAVE_ANON',
  schema: 'public',
  enabled: true
};
```

## 3.1. Configuração padrão do repositório
- O arquivo versionado já traz um projeto Supabase configurado em `supabase-config.js`, com `enabled: true` por padrão.
- Se quiser trocar de projeto, sobrescreva `window.CASAMELO_SUPABASE_CONFIG` com a sua `url`, `anonKey`, `schema` e `enabled: true` antes de carregar `supabase-config.js`.
- Se preferir desativar a integração temporariamente, defina `window.CASAMELO_SUPABASE_CONFIG.enabled = false`.

## 4. O que o site passa a salvar no Supabase
Quando a configuração estiver preenchida, o site sincroniza automaticamente:
- cadastro e login de clientes;
- foto de perfil;
- preferência de receber novidades;
- carrinho;
- histórico de compras;
- avaliações/comentários.

## 5. Importante
O projeto atual é um site estático puro, sem back-end intermediário. Por isso, o SQL foi deixado com políticas abertas para a chave anon funcionar direto no navegador.

## 5.1. Consultas rápidas para comentários
Se você só quiser testar a tabela `comentarios` direto no console do navegador, pode usar os helpers já expostos pelo site:

```js
const comentarios = await window.CASAMELO_SUPABASE.buscarComentarios();
console.log(comentarios);

await window.CASAMELO_SUPABASE.criarComentario({
  nome: 'Cliente',
  comentario: 'Muito bom!',
  nota: 5
});
```

Internamente, a leitura tenta primeiro `created_at` e depois `data_avaliacao` / `criado_em`, sempre trazendo os comentários mais recentes primeiro.

## 6. Exemplo futuro com Supabase Auth + comentários
Se você quiser evoluir o projeto para usar autenticação nativa do Supabase, um fluxo simples seria:

1. importar o cliente do Supabase e criar a instância com a `Project URL` e a `anon key`;
2. fazer login com e-mail e senha usando `supabase.auth.signInWithPassword`;
3. guardar o usuário autenticado em memória ou no estado da aplicação;
4. ao publicar um comentário, usar o `user.id` autenticado para relacionar o registro na tabela `comentarios`.

Exemplo:

```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  return data.user;
}

async function postComment(textoComentario, user) {
  const { data, error } = await supabase
    .from('comentarios')
    .insert({
      usuario_id: user.id,
      comentario: textoComentario
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}
```

> Observação: esse exemplo representa uma evolução possível. O código atual do site ainda usa um fluxo próprio de cadastro/login no front-end, sem `Supabase Auth`.

Se você já migrou o cadastro/login para `supabase.auth.*` e o `insert` em `public.clientes` falha, faça este checklist:

1. no console do navegador, execute `await window.CASAMELO_SUPABASE.debugAuthState()`;
2. confirme se `user` não é `null` e se existe `session` ativa;
3. se o erro mencionar `row-level security`, aplique `database/supabase-auth-clientes.sql` para criar a coluna `user_id`, definir `default auth.uid()` e trocar a policy pública por policies baseadas em `auth.uid()`.

O `supabase-config.js` agora também registra no console o `payload`, o `error`, o estado resumido de autenticação e dicas quando um `insert` em `clientes` ou `comentarios` falha.

### 6.1. Atualizar clientes com Supabase
Para atualizar um registro em `clientes`, encadeie o `.select()` **depois** do `.update()` quando quiser que o Supabase retorne a linha atualizada:

```js
const { data, error } = await supabase
  .from('clientes')
  .update(payload)
  .eq('celular', '38998467031')
  .select();
```

Se você só precisa executar o `update` sem retornar dados, remova o `.select()`:

```js
const { error } = await supabase
  .from('clientes')
  .update(payload)
  .eq('celular', '38998467031');
```


### 6.2. Exemplo pronto em arquivo separado
Se preferir usar um cliente modular, o repositório agora inclui `supabase-client.js` com o mesmo formato:

```js
import { supabase } from './supabase-client.js';
```

### 6.3. Buscar e criar comentários em projetos que usam `created_at`
Se o seu projeto Supabase foi criado com a tabela `comentarios` no formato mais simples (`nome`, `comentario`, `nota`, `created_at`), você pode usar consultas como estas:

```js
const { data, error } = await supabase
  .from('comentarios')
  .select('*')
  .order('created_at', { ascending: false });

console.log(data);

await supabase
  .from('comentarios')
  .insert({
    nome: 'Cliente',
    comentario: 'Muito bom!',
    nota: 5
  });
```

O front-end do repositório agora tenta primeiro esse formato com `created_at` e, se a tabela estiver no formato compatível do projeto (`data_avaliacao`, `celular`, `foto`, `id`), faz fallback automático para ele.

Para produção, o ideal é evoluir depois para um modelo com:
- Supabase Auth;
- políticas RLS por usuário autenticado;
- senhas com hash;
- Storage para fotos em vez de Data URL.


## 7. Erro comum: 404 ao acessar `/rest/v1/clientes`
Esse erro quase sempre significa que o banco do Supabase **não está com a mesma estrutura esperada pelo site**.

O front-end desta loja consulta exatamente estas tabelas:
- `public.clientes` (`id`, `nome`, `celular`, `senha_hash`/`senha`, `foto`, `receber_novidades`, `ultimo_acesso`);
- `public.carrinhos` (`id`, `cliente_id`, `cliente_celular`, `status`, `atualizado_em`);
- `public.itens_carrinho` (`carrinho_id`, `produto_id`, `quantidade`, `preco_unitario`);
- `public.historico_compras` (`cliente_celular`, `cliente_id`, `itens`, `data_compra`);
- `public.comentarios` em formato `created_at` ou `data_avaliacao`.

Se no painel do Supabase você vê tabelas como `usuarios` e uma `comentarios` com `user_id` / `created_at`, isso é **outro modelo de banco** e o site não consegue consultar esses endpoints. Nesse caso:
1. execute `database/supabase-compat.sql` para adaptar a estrutura; ou
2. recrie do zero com `database/schema.supabase.sql`.

Depois disso, recarregue o site. O arquivo `supabase-config.js` agora também registra um erro mais claro no console quando detecta essa incompatibilidade.
