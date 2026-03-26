# Endpoint de proxy para OpenAI

Foi criado o endpoint `POST /api/chat` no servidor Node/Express.

## Como funciona

1. Recebe a requisição do frontend.
2. Adiciona `Authorization: Bearer OPENAI_API_KEY` no servidor.
3. Encaminha o payload para `https://api.openai.com/v1/responses`.
4. Devolve o status e a resposta da API externa para o frontend.

## Configuração

```bash
npm install
OPENAI_API_KEY=sua_chave_aqui npm start
```

Servidor padrão: `http://localhost:3000`

## Exemplo de chamada no frontend

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
