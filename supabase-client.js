import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fulymepfkdenmtickfwk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bHltZXBma2Rlbm10aWNrZndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTY4MTMsImV4cCI6MjA4NzQzMjgxM30.6BRJj59Amct0VLW8EdwRhZhHQVtmkIZtRkXPiXIzOpY';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const CAMPOS_VALIDOS = [
  'nome',
  'celular',
  'foto',
  'receber_novidades',
  'user_id'
];

const CAMPOS_VALIDOS_SET = new Set(CAMPOS_VALIDOS);

export function limparPayload(obj = {}) {
  return Object.entries(obj).reduce((acumulador, [chave, valor]) => {
    if (valor === undefined || valor === null) return acumulador;
    acumulador[chave] = valor;
    return acumulador;
  }, {});
}

export function filtrarCampos(obj = {}) {
  return Object.entries(obj).reduce((acumulador, [chave, valor]) => {
    if (!CAMPOS_VALIDOS_SET.has(chave)) return acumulador;
    acumulador[chave] = valor;
    return acumulador;
  }, {});
}

export const filtrarCamposValidos = filtrarCampos;

export function prepararPayloadCliente(cliente = {}) {
  const payloadLimpo = limparPayload(cliente);
  const payload = filtrarCampos(payloadLimpo);

  if (typeof payload.nome === 'string') {
    payload.nome = payload.nome.trim();
  }

  if (typeof payload.celular === 'string') {
    payload.celular = payload.celular.replace(/\D/g, '');
  }

  if (typeof payload.foto === 'string') {
    payload.foto = payload.foto.trim();
  }

  if (typeof payload.user_id === 'string') {
    payload.user_id = payload.user_id.trim();
  }

  if (Object.hasOwn(payload, 'receber_novidades')) {
    payload.receber_novidades = Boolean(payload.receber_novidades);
  }

  return payload;
}

export async function criarConta(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) throw error;

  return data;
}

export async function loginComEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  return data;
}

export async function cadastrarCliente(cliente = {}) {
  const payload = prepararPayloadCliente(cliente);

  if (Object.keys(payload).length === 0) {
    throw new Error('Payload de cliente sem campos válidos para INSERT.');
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert([payload])
    .select('*')
    .single();

  if (error) throw error;

  return data;
}

export async function atualizarCliente(celular, campos = {}) {
  const celularNormalizado = String(celular || '').replace(/\D/g, '');
  if (!celularNormalizado) {
    throw new Error('Celular é obrigatório para UPDATE.');
  }

  const payload = prepararPayloadCliente(campos);
  delete payload.celular;

  if (Object.keys(payload).length === 0) {
    throw new Error('Payload de cliente sem campos válidos para UPDATE.');
  }

  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('celular', celularNormalizado)
    .select('*')
    .single();

  if (error) throw error;

  return data;
}

export const criarCliente = cadastrarCliente;
