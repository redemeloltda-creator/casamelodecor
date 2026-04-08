import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fulymepfkdenmtickfwk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bHltZXBma2Rlbm10aWNrZndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTY4MTMsImV4cCI6MjA4NzQzMjgxM30.6BRJj59Amct0VLW8EdwRhZhHQVtmkIZtRkXPiXIzOpY';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const CAMPOS_VALIDOS = ['nome', 'celular', 'email'];

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

function prepararPayloadCliente(dados = {}) {
  const payload = filtrarCampos(limparPayload(dados));

  if (typeof payload.nome === 'string') {
    payload.nome = payload.nome.trim();
  }

  if (typeof payload.celular === 'string') {
    payload.celular = payload.celular.replace(/\D/g, '');
  }

  if (typeof payload.email === 'string') {
    payload.email = payload.email.trim().toLowerCase();
  }

  return limparPayload(payload);
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

export async function cadastrarCliente(dados = {}) {
  const payload = prepararPayloadCliente(dados);

  if (!payload.nome || !payload.celular) {
    throw new Error('Payload inválido: informe nome e celular.');
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  return data;
}

export async function atualizarCliente(dados = {}) {
  const payload = prepararPayloadCliente(dados);
  const celular = String(payload.celular || '').replace(/\D/g, '');

  if (!celular) {
    throw new Error('Campo obrigatório para UPDATE: celular.');
  }

  delete payload.celular;

  if (Object.keys(payload).length === 0) {
    throw new Error('Payload inválido para UPDATE: nada para atualizar.');
  }

  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('celular', celular)
    .select('*')
    .single();

  if (error) throw error;

  return data;
}

export const criarCliente = cadastrarCliente;
