# Supabase na Casa Melo Decor

## 1. Crie um projeto no Supabase
- Abra o painel do Supabase.
- Crie um projeto novo.
- Copie a **Project URL** e a **anon public key**.

## 2. Crie o banco de dados usado pelo site
- No SQL Editor do Supabase, execute o arquivo `database/schema.supabase.sql`.
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
  schema: 'public'
};
```

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

Para produção, o ideal é evoluir depois para um modelo com:
- Supabase Auth;
- políticas RLS por usuário autenticado;
- senhas com hash;
- Storage para fotos em vez de Data URL.
