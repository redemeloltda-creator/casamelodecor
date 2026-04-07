# Endpoints de proxy (OpenAI + escrita no Supabase)

Foram criados endpoints no servidor Node/Express para:

- `POST /api/chat` (proxy para OpenAI)
- `POST /api/clientes` (escrita validada em `clientes`)
- `POST /api/carrinho` (escrita validada em `carrinhos`)
- `POST /api/historico` (escrita validada em `historico_compras`)

## Como funciona

1. Recebe a requisição do frontend.
2. Adiciona `Authorization: Bearer OPENAI_API_KEY` no servidor.
3. Encaminha o payload para `https://api.openai.com/v1/responses`.
4. Devolve o status e a resposta da API externa para o frontend.

## Configuração

```bash
npm install
OPENAI_API_KEY=sua_chave_aqui \
SUPABASE_URL=https://SEU-PROJETO.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key \
npm start
```

Servidor padrão: `http://localhost:3000`

## Exemplo de chamada no frontend (`/api/chat`)

```js
await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4.1-mini',
    input: 'Olá!'
  })
});
```

## Healthcheck

`GET /health` retorna `{ "ok": true }`.

## Exemplo de escrita protegida (`/api/clientes`)

```js
await fetch('/api/clientes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'Maria',
    celular: '11988887777'
  })
});
```

> Os endpoints de escrita fazem validação mínima de payload e registram erros em formato estruturado no backend.
