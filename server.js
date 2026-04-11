import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = process.env.OPENAI_RESPONSES_URL || 'https://api.openai.com/v1/responses';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

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

const normalizarCelular = (valor) => {
  const celular = String(valor || '').replace(/\D/g, '');
  if (celular.length === 13 && celular.startsWith('55')) {
    return celular.slice(2);
  }
  return celular;
};

const validarCelular = (valor) => {
  const celular = normalizarCelular(valor);
  return celular.length === 10 || celular.length === 11;
};

const normalizarItens = (itens = []) => {
  if (!Array.isArray(itens)) return [];

  return itens
    .map((item = {}) => {
      const nome = String(item?.nome || item?.name || '').trim();
      const quantidade = Number(item?.quantidade ?? item?.quantity ?? 0);
      if (!nome || !Number.isFinite(quantidade) || quantidade <= 0) return null;

      return {
        ...item,
        nome,
        quantidade
      };
    })
    .filter(Boolean);
};

const validarItens = (itens) => normalizarItens(itens).length > 0;

const validarCliente = (payload = {}) => (
  typeof payload?.nome === 'string'
  && payload.nome.trim().length >= 2
  && validarCelular(payload?.celular)
);

const parseJsonSeguro = (conteudo) => {
  if (!conteudo) return null;
  try {
    return JSON.parse(conteudo);
  } catch {
    return null;
  }
};

const normalizarPayloadOpenAI = (body = {}) => {
  if (Array.isArray(body?.messages) && !body?.input) {
    return {
      model: body.model || process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      input: body.messages,
      temperature: body.temperature
    };
  }

  if (typeof body === 'string') {
    return {
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      input: body
    };
  }

  return {
    model: body.model || process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    ...body
  };
};

const supabaseRest = async (pathUrl, { method = 'POST', body }) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathUrl}`, {
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
  const responseBody = parseJsonSeguro(responseText);

  if (!response.ok) {
    throw new Error(responseBody?.message || responseBody?.hint || responseText || 'Falha no Supabase REST');
  }

  return responseBody;
};

app.post('/api/chat', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'Chat indisponível: OPENAI_API_KEY não configurada no servidor.'
    });
  }

  const payload = normalizarPayloadOpenAI(req.body || {});

  if (!payload?.input) {
    return res.status(400).json({
      error: 'Payload inválido para /api/chat. Envie "input" (Responses API) ou "messages" (compatibilidade).'
    });
  }

  try {
    const upstream = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const contentType = upstream.headers.get('content-type') || '';

    if (upstream.status === 401) {
      const bodyErro = contentType.includes('application/json') ? await upstream.json() : await upstream.text();
      logEstruturado('error', {
        operacao: 'proxyOpenAI',
        status: 401,
        detalhe: bodyErro
      });

      return res.status(502).json({
        error: 'Falha de autenticação no provedor de IA. Verifique OPENAI_API_KEY no servidor.'
      });
    }

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
      body: [{ nome: payload.nome.trim(), celular: normalizarCelular(payload.celular) }]
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
  const itensNormalizados = normalizarItens(payload?.itens);

  if (!validarCelular(payload?.celular) || !itensNormalizados.length) {
    return res.status(400).json({ error: 'Payload inválido para carrinho.' });
  }

  try {
    const data = await supabaseRest('carrinhos', {
      method: 'POST',
      body: [{
        celular: normalizarCelular(payload.celular),
        itens: itensNormalizados
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
  const itensNormalizados = normalizarItens(payload?.itens);

  if (!validarCelular(payload?.celular) || !itensNormalizados.length) {
    return res.status(400).json({ error: 'Payload inválido para histórico.' });
  }

  try {
    const data = await supabaseRest('historico_compras', {
      method: 'POST',
      body: [{
        celular: normalizarCelular(payload.celular),
        itens: itensNormalizados
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
  console.log(`API e site rodando em http://localhost:${PORT}`);
});
