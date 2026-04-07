import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = process.env.OPENAI_RESPONSES_URL || 'https://api.openai.com/v1/responses';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

app.use(express.json({ limit: '1mb' }));

const logEstruturado = (nivel, payload) => {
  const base = {
    app: 'casamelodecor-api',
    timestamp: new Date().toISOString(),
    ...payload
  };

  if (nivel === 'error') {
    console.error(JSON.stringify(base));
    return;
  }

  console.log(JSON.stringify(base));
};

const validarCelular = (valor) => String(valor || '').replace(/\D/g, '').length >= 10;

const validarItens = (itens) => {
  if (!Array.isArray(itens) || itens.length === 0) return false;
  return itens.every((item) => (
    typeof item?.nome === 'string'
    && item.nome.trim()
    && Number.isFinite(Number(item?.quantidade || 0))
    && Number(item.quantidade) > 0
  ));
};

const validarCliente = (payload = {}) => (
  typeof payload?.nome === 'string'
  && payload.nome.trim().length >= 2
  && validarCelular(payload?.celular)
);

const supabaseRest = async (path, { method = 'POST', body }) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const responseText = await response.text();
  const responseBody = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    throw new Error(responseBody?.message || responseBody?.hint || responseText || 'Falha no Supabase REST');
  }

  return responseBody;
};

app.post('/api/chat', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY não configurada no servidor.'
    });
  }

  try {
    const upstream = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    const contentType = upstream.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    }

    const text = await upstream.text();
    return res.status(upstream.status).send(text);
  } catch (error) {
    return res.status(500).json({
      error: 'Falha no proxy para API externa.',
      detail: String(error)
    });
  }
});

app.post('/api/clientes', async (req, res) => {
  const payload = req.body || {};
  if (!validarCliente(payload)) {
    return res.status(400).json({ error: 'Payload inválido para clientes.' });
  }

  try {
    const data = await supabaseRest('clientes', {
      method: 'POST',
      body: [{ nome: payload.nome.trim(), celular: String(payload.celular).replace(/\D/g, '') }]
    });
    return res.status(201).json(Array.isArray(data) ? data[0] : data);
  } catch (error) {
    logEstruturado('error', {
      operacao: 'cadastrarCliente',
      erro: error.message,
      payload,
      fallback: false
    });
    return res.status(500).json({ error: 'Falha ao cadastrar cliente.' });
  }
});

app.post('/api/carrinho', async (req, res) => {
  const payload = req.body || {};
  if (!validarCelular(payload?.celular) || !validarItens(payload?.itens)) {
    return res.status(400).json({ error: 'Payload inválido para carrinho.' });
  }

  try {
    const data = await supabaseRest('carrinhos', {
      method: 'POST',
      body: [{
        celular: String(payload.celular).replace(/\D/g, ''),
        itens: payload.itens
      }]
    });
    return res.status(201).json(Array.isArray(data) ? data[0] : data);
  } catch (error) {
    logEstruturado('error', {
      operacao: 'salvarCarrinho',
      erro: error.message,
      payload,
      fallback: false
    });
    return res.status(500).json({ error: 'Falha ao salvar carrinho.' });
  }
});

app.post('/api/historico', async (req, res) => {
  const payload = req.body || {};
  if (!validarCelular(payload?.celular) || !validarItens(payload?.itens)) {
    return res.status(400).json({ error: 'Payload inválido para histórico.' });
  }

  try {
    const data = await supabaseRest('historico_compras', {
      method: 'POST',
      body: [{
        celular: String(payload.celular).replace(/\D/g, ''),
        itens: payload.itens
      }]
    });
    return res.status(201).json(Array.isArray(data) ? data[0] : data);
  } catch (error) {
    logEstruturado('error', {
      operacao: 'registrarCompra',
      erro: error.message,
      payload,
      fallback: false
    });
    return res.status(500).json({ error: 'Falha ao registrar compra.' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API proxy rodando em http://localhost:${PORT}`);
});
