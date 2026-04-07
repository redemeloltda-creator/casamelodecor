import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fulymepfkdenmtickfwk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bHltZXBma2Rlbm10aWNrZndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTY4MTMsImV4cCI6MjA4NzQzMjgxM30.6BRJj59Amct0VLW8EdwRhZhHQVtmkIZtRkXPiXIzOpY';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const CAMPOS_VALIDOS = [
  'nome',
  'celular',
  'receber_novidades',
  'senha_hash'
];

const CAMPOS_VALIDOS_SET = new Set(CAMPOS_VALIDOS);

export function limparPayload(obj = {}) {
  return Object.entries(obj).reduce((acumulador, [chave, valor]) => {
    if (valor === undefined || valor === null) return acumulador;
    acumulador[chave] = valor;
    return acumulador;
  }, {});
}

export function filtrarCamposValidos(obj = {}) {
  return Object.entries(obj).reduce((acumulador, [chave, valor]) => {
    if (!CAMPOS_VALIDOS_SET.has(chave)) return acumulador;
    acumulador[chave] = valor;
    return acumulador;
  }, {});
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
  const payloadLimpo = limparPayload(cliente);
  const payloadSanitizado = filtrarCamposValidos(payloadLimpo);

  if (typeof payloadSanitizado.nome === 'string') {
    payloadSanitizado.nome = payloadSanitizado.nome.trim();
  }

  if (typeof payloadSanitizado.celular === 'string') {
    payloadSanitizado.celular = payloadSanitizado.celular.replace(/\D/g, '');
  }

  if (typeof payloadSanitizado.senha_hash === 'string') {
    payloadSanitizado.senha_hash = payloadSanitizado.senha_hash.trim();
  }

  if (Object.hasOwn(payloadSanitizado, 'receber_novidades')) {
    payloadSanitizado.receber_novidades = Boolean(payloadSanitizado.receber_novidades);
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert(payloadSanitizado)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export const criarCliente = cadastrarCliente;
