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

Para produção, o ideal é evoluir depois para um modelo com:
- Supabase Auth;
- políticas RLS por usuário autenticado;
- senhas com hash;
- Storage para fotos em vez de Data URL.
