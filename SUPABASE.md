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
  - `comentarios` (aceita o modelo com `mensagem` e também o modelo com `comentario`, `nota` e `data_avaliacao`)

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

### 6.4. Helper para salvar/atualizar cliente automaticamente
Se o seu SQL da tabela `clientes` muda entre projetos (`celular`, `telefone`, `contato`; `criado_em` vs `created_at`), você pode usar o helper novo:

```js
await window.CASAMELO_SUPABASE.salvarOuAtualizarCliente({
  nome: 'Carlos',
  celular: '38998467031',
  email: 'carlos@email.com',
  receberNovidades: true
});
```

Ele tenta localizar por telefone/celular/contato e faz fallback automático de colunas durante insert/update.

### 6.5. Fluxo direto com Supabase Auth + `clientes`
Se você já está usando Supabase Auth e quer seguir exatamente o fluxo de criar conta, login e depois criar o registro em `clientes`, pode usar:

```js
// 1) Criar conta
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email,
  password
});
if (signUpError) throw signUpError;

// 2) Login
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password
});
if (signInError) throw signInError;

// 3) Criar cliente
const { data: userData, error: userError } = await supabase.auth.getUser();
if (userError) throw userError;

const user = userData.user;
if (!user) throw new Error('Usuário não autenticado');

const { data: cliente, error: clienteError } = await supabase
  .from('clientes')
  .insert({
    user_id: user.id,
    nome: 'Carlos',
    celular: '38998467031'
  })
  .select()
  .single();

if (clienteError) throw clienteError;
console.log(cliente);
```

Se preferir, já existem helpers prontos no arquivo `supabase-client.js`: `criarConta`, `loginComEmail` e `criarCliente`.

### 6.6. Comandos corretos para `clientes`
Use estes exemplos como base quando a tabela `public.clientes` estiver no schema deste repositório (`id`, `nome`, `celular`, `user_id`, sem coluna `email`):

```js
// Buscar cliente por celular
const { data, error } = await supabase
  .from('clientes')
  .select('*')
  .eq('celular', '38998467031')
  .maybeSingle();

// Inserir cliente (sem campo email)
const { data: novoCliente, error: erroNovoCliente } = await supabase
  .from('clientes')
  .insert({
    nome: 'Carlos',
    celular: '38998467031',
    user_id: user.id
  })
  .select()
  .single();

// Atualizar cliente por celular
const { data: clienteAtualizado, error: erroAtualizacao } = await supabase
  .from('clientes')
  .update({
    nome: 'Carlos Souza',
    receber_novidades: true,
    ultimo_acesso: new Date().toISOString()
  })
  .eq('celular', '38998467031')
  .select()
  .single();
```


## 7. Erro comum: 404 ao acessar `/rest/v1/clientes`
Esse erro quase sempre significa que o banco do Supabase **não está com a mesma estrutura esperada pelo site**.

O front-end desta loja consulta exatamente estas tabelas:
- `public.clientes` (`id`, `nome`, `celular`, `senha_hash`/`senha`, `foto`, `receber_novidades`, `ultimo_acesso`);
- `public.carrinhos` (`id`, `cliente_id`, `celular`, `status`, `atualizado_em`);
- `public.itens_carrinho` (`carrinho_id`, `produto_id`, `quantidade`, `preco_unitario`);
- `public.historico_compras` (`celular`, `cliente_id`, `itens`, `data_compra`);
- `public.comentarios` em formato `created_at` ou `data_avaliacao`.

Se no painel do Supabase você vê tabelas como `usuarios` e uma `comentarios` com `user_id` / `created_at`, isso é **outro modelo de banco** e o site não consegue consultar esses endpoints. Nesse caso:
1. execute `database/supabase-compat.sql` para adaptar a estrutura; ou
2. recrie do zero com `database/schema.supabase.sql`.

Depois disso, recarregue o site. O arquivo `supabase-config.js` agora também registra um erro mais claro no console quando detecta essa incompatibilidade.


## 8. Erro comum: "Envie TODOS os campos obrigatórios"
Se você recebeu uma mensagem como:

```json
{
  "nome": "Carlos",
  "celular": "38998467031"
}
```

normalmente o problema é que o endpoint de cadastro/login também exige **senha** (e em alguns fluxos, `receberNovidades` é opcional).

Use este payload mínimo para cadastro:

```json
{
  "nome": "Carlos",
  "celular": "38998467031",
  "senha": "123456"
}
```

Checklist rápido:
- `nome`: texto não vazio;
- `celular`: DDD + 9 números (11 dígitos, com ou sem máscara);
- `senha`: pelo menos 6 caracteres.

## 9. Erro comum: `PGRST204` (400 Bad Request)
Quando o PostgREST retorna `PGRST204`, o problema costuma estar no formato da chamada para `public.clientes`.

### Causa mais comum
Você tentou usar:

```http
POST /rest/v1/clientes?select=*
```

mas sem um body válido para inserção, ou com colunas que não existem no schema.

### Regra prática (método HTTP)
- **GET**: buscar dados;
- **POST**: inserir dados;
- **PATCH**: atualizar;
- **DELETE**: remover.

### Exemplo correto para buscar
```http
GET /rest/v1/clientes?select=*
```

### Exemplo correto para inserir e retornar a linha
```js
const { data, error } = await supabase
  .from('clientes')
  .insert([
    {
      nome: 'Carlos',
      celular: '38998467031'
    }
  ])
  .select();
```

### Checklist quando der `400`
1. **Body vazio ou inválido** no `POST`;
2. **Campo inexistente** (ex.: enviar `telefone` quando a tabela usa `celular`);
3. **RLS bloqueando** a operação (ver seção 6 para políticas).

### Sobre o header `Accept`
Evite `application/vnd.pgrst.object+json` em consultas que podem retornar 0 ou mais de 1 linha.
Esse formato só aceita exatamente um registro. Para resposta comum, prefira:

```http
Accept: application/json
```

No código atual, o front-end normaliza o celular e só aceita cadastro quando os três campos são válidos no `auth.js`.
