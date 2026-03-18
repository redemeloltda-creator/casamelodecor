const CASAMELO_SUPABASE_EXEMPLO = {
  url: 'https://fulymepfkdenmtickfwk.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bHltZXBma2Rlbm10aWNrZndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTY4MTMsImV4cCI6MjA4NzQzMjgxM30.6BRJj59Amct0VLW8EdwRhZhHQVtmkIZtRkXPiXIzOpY',
  schema: 'public'
};

window.CASAMELO_SUPABASE_CONFIG = window.CASAMELO_SUPABASE_CONFIG || {
  ...CASAMELO_SUPABASE_EXEMPLO,
  enabled: false
};

(function () {
  const CONFIG_PADRAO = {
    ...CASAMELO_SUPABASE_EXEMPLO,
    schema: 'public',
    enabled: false
  };

  const configGlobal = window.CASAMELO_SUPABASE_CONFIG || {};
  const credenciaisPersonalizadas = Boolean(
    configGlobal.url
    && configGlobal.anonKey
    && (
      configGlobal.url !== CASAMELO_SUPABASE_EXEMPLO.url
      || configGlobal.anonKey !== CASAMELO_SUPABASE_EXEMPLO.anonKey
    )
  );
  const config = {
    ...CONFIG_PADRAO,
    ...configGlobal,
    enabled: configGlobal.enabled ?? credenciaisPersonalizadas
  };

  const normalizarCelular = (valor) => {
    const celularSemMascara = String(valor || '').replace(/\D/g, '');

    if (celularSemMascara.length === 13 && celularSemMascara.startsWith('55')) {
      return celularSemMascara.slice(2);
    }

    return celularSemMascara;
  };

  const criarCliente = () => {
    if (!config.enabled || !window.supabase || !config.url || !config.anonKey) return null;

    return window.supabase.createClient(config.url, config.anonKey, {
      db: { schema: config.schema }
    });
  };

  const client = criarCliente();
  let supabaseDisponivel = Boolean(client);
  let validacaoEstruturaPromise = null;
  let avisoEstruturaExibido = false;
  let avisoConfiguracaoExibido = false;
  let ultimoErro = null;

  const mapearCliente = (cliente = {}) => ({
    id: cliente.id || null,
    nome: String(cliente.nome || '').trim(),
    celular: normalizarCelular(cliente.celular),
    senha: String(cliente.senha || ''),
    foto: String(cliente.foto || '').trim(),
    receberNovidades: Boolean(cliente.receber_novidades ?? cliente.receberNovidades),
    ultimoAcesso: cliente.ultimo_acesso || cliente.ultimoAcesso || null,
    criadoEm: cliente.criado_em || cliente.criadoEm || null,
    atualizadoEm: cliente.atualizado_em || cliente.atualizadoEm || null
  });

  const mapearComentario = (comentario = {}) => ({
    id: String(comentario.id || '').trim(),
    nome: String(comentario.nome || '').trim(),
    celular: normalizarCelular(comentario.celular || comentario.cliente_celular),
    foto: String(comentario.foto || '').trim(),
    nota: Number(comentario.nota) || 0,
    comentario: String(comentario.comentario || '').trim(),
    dataAvaliacao: comentario.data_avaliacao || comentario.dataAvaliacao || comentario.criado_em || null
  });

  const obterSessaoLocal = () => {
    try {
      return JSON.parse(localStorage.getItem('casamelo_usuario_logado') || 'null');
    } catch (erro) {
      return null;
    }
  };

  const identificarCliente = (celular) => {
    const celularNormalizado = normalizarCelular(celular);
    return celularNormalizado ? client.from('clientes').select('*').eq('celular', celularNormalizado).maybeSingle() : Promise.resolve({ data: null, error: null });
  };

  const erroIndicaEstruturaIncompativel = (error) => {
    const status = Number(error?.status || error?.code || 0);
    const mensagem = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();

    return status === 404
      || mensagem.includes('relation')
      || mensagem.includes('does not exist')
      || mensagem.includes('could not find')
      || mensagem.includes('not found');
  };

  const avisarConfiguracaoDesativada = () => {
    if (avisoConfiguracaoExibido || config.enabled) return;

    avisoConfiguracaoExibido = true;
    console.info(
      '[Casa Melo Decor] Integração com Supabase desativada até você informar credenciais próprias em supabase-config.js '
      + 'ou definir window.CASAMELO_SUPABASE_CONFIG.enabled = true com um projeto compatível.'
    );
  };

  const avisarEstruturaIncompativel = (origem, error) => {
    if (avisoEstruturaExibido) return;

    avisoEstruturaExibido = true;
    console.error(
      `[Casa Melo Decor] Supabase desativado: a estrutura atual do banco não bate com o site. `
      + `A rotina "${origem}" esperava as tabelas public.clientes, public.carrinhos, public.historico_compras e public.comentarios. `
      + `No projeto Supabase, execute o arquivo database/schema.supabase.sql ou aplique database/supabase-compat.sql se você já criou tabelas como usuarios/comentarios com outro formato.`,
      error
    );
  };

  const garantirEstruturaCompativel = async (origem = 'inicialização') => {
    if (!client || !supabaseDisponivel) return false;

    if (!validacaoEstruturaPromise) {
      validacaoEstruturaPromise = (async () => {
        const tabelasObrigatorias = ['clientes', 'carrinhos', 'historico_compras', 'comentarios'];

        for (const tabela of tabelasObrigatorias) {
          const { error } = await client.from(tabela).select('*', { head: true, count: 'exact' }).limit(1);

          if (error) {
            if (erroIndicaEstruturaIncompativel(error)) {
              supabaseDisponivel = false;
              avisarEstruturaIncompativel(origem, error);
              return false;
            }

            throw error;
          }
        }

        return true;
      })().catch((error) => {
        if (erroIndicaEstruturaIncompativel(error)) {
          supabaseDisponivel = false;
          avisarEstruturaIncompativel(origem, error);
          return false;
        }

        throw error;
      });
    }

    return validacaoEstruturaPromise;
  };

  const executarConsulta = async (origem, fallback, operacao) => {
    if (!client || !supabaseDisponivel) {
      avisarConfiguracaoDesativada();
      return fallback;
    }

    const estruturaOk = await garantirEstruturaCompativel(origem);
    if (!estruturaOk) return fallback;

    try {
      ultimoErro = null;
      return await operacao();
    } catch (error) {
      ultimoErro = error || null;

      if (erroIndicaEstruturaIncompativel(error)) {
        supabaseDisponivel = false;
        avisarEstruturaIncompativel(origem, error);
        return fallback;
      }

      throw error;
    }
  };

  const api = {
    config,
    isConfigured() {
      return Boolean(client);
    },
    isAvailable() {
      return Boolean(client) && supabaseDisponivel;
    },
    getLastError() {
      return ultimoErro;
    },
    getClient() {
      return client;
    },
    normalizarCelular,
    async listarClientes() {
      return executarConsulta('listarClientes', [], async () => {
        const { data, error } = await client.from('clientes').select('*').order('criado_em', { ascending: true });
        if (error || !Array.isArray(data)) return [];
        return data.map(mapearCliente);
      });
    },
    async buscarClientePorCelular(celular) {
      return executarConsulta('buscarClientePorCelular', null, async () => {
        const { data, error } = await identificarCliente(celular);
        if (error || !data) return null;
        return mapearCliente(data);
      });
    },
    async cadastrarCliente(clienteCadastro) {
      return executarConsulta('cadastrarCliente', null, async () => {
        const registro = {
          nome: String(clienteCadastro?.nome || '').trim(),
          celular: normalizarCelular(clienteCadastro?.celular),
          senha: String(clienteCadastro?.senha || ''),
          foto: String(clienteCadastro?.foto || '').trim(),
          receber_novidades: Boolean(clienteCadastro?.receberNovidades),
          ultimo_acesso: new Date().toISOString()
        };

        const { data, error } = await client.from('clientes').insert(registro).select('*').single();
        if (error || !data) return null;
        return mapearCliente(data);
      });
    },
    async autenticarCliente(celular, senha) {
      return executarConsulta('autenticarCliente', null, async () => {
        const celularNormalizado = normalizarCelular(celular);
        const senhaNormalizada = String(senha || '');
        if (!celularNormalizado || !senhaNormalizada) return null;

        const { data, error } = await client
          .from('clientes')
          .select('*')
          .eq('celular', celularNormalizado)
          .eq('senha', senhaNormalizada)
          .maybeSingle();

        if (error || !data) return null;

        await client.from('clientes').update({ ultimo_acesso: new Date().toISOString() }).eq('celular', celularNormalizado);

        return mapearCliente(data);
      });
    },
    async atualizarCliente(celular, campos = {}) {
      return executarConsulta('atualizarCliente', null, async () => {
        const celularNormalizado = normalizarCelular(celular);
        if (!celularNormalizado) return null;

        const payload = {};
        if (Object.hasOwn(campos, 'nome')) payload.nome = String(campos.nome || '').trim();
        if (Object.hasOwn(campos, 'senha')) payload.senha = String(campos.senha || '');
        if (Object.hasOwn(campos, 'foto')) payload.foto = String(campos.foto || '').trim();
        if (Object.hasOwn(campos, 'receberNovidades')) payload.receber_novidades = Boolean(campos.receberNovidades);
        if (Object.hasOwn(campos, 'ultimoAcesso')) payload.ultimo_acesso = campos.ultimoAcesso;

        const { data, error } = await client
          .from('clientes')
          .update(payload)
          .eq('celular', celularNormalizado)
          .select('*')
          .maybeSingle();

        if (error || !data) return null;
        return mapearCliente(data);
      });
    },
    async excluirCliente(celular) {
      return executarConsulta('excluirCliente', false, async () => {
        const celularNormalizado = normalizarCelular(celular);
        if (!celularNormalizado) return false;

        const { error } = await client.from('clientes').delete().eq('celular', celularNormalizado);
        return !error;
      });
    },
    async salvarCarrinho(celular, itens = []) {
      return executarConsulta('salvarCarrinho', false, async () => {
        const celularNormalizado = normalizarCelular(celular);
        if (!celularNormalizado) return false;

        const payload = {
          cliente_celular: celularNormalizado,
          itens,
          atualizado_em: new Date().toISOString()
        };

        const { error } = await client.from('carrinhos').upsert(payload, { onConflict: 'cliente_celular' });
        return !error;
      });
    },
    async carregarCarrinho(celular) {
      return executarConsulta('carregarCarrinho', [], async () => {
        const celularNormalizado = normalizarCelular(celular);
        if (!celularNormalizado) return [];

        const { data, error } = await client.from('carrinhos').select('itens').eq('cliente_celular', celularNormalizado).maybeSingle();
        if (error) return [];
        return Array.isArray(data?.itens) ? data.itens : [];
      });
    },
    async sincronizarSessaoComCarrinho() {
      return executarConsulta('sincronizarSessaoComCarrinho', [], async () => {
        const sessao = obterSessaoLocal();
        const celular = normalizarCelular(sessao?.celular);
        if (!celular) return [];
        return api.carregarCarrinho(celular);
      });
    },
    async registrarCompra(celular, itens = []) {
      return executarConsulta('registrarCompra', false, async () => {
        const celularNormalizado = normalizarCelular(celular);
        if (!celularNormalizado || !Array.isArray(itens) || !itens.length) return false;

        const { error } = await client.from('historico_compras').insert({
          cliente_celular: celularNormalizado,
          itens,
          data_compra: new Date().toISOString()
        });

        return !error;
      });
    },
    async listarHistorico(celular) {
      return executarConsulta('listarHistorico', [], async () => {
        const celularNormalizado = normalizarCelular(celular);
        if (!celularNormalizado) return [];

        const { data, error } = await client
          .from('historico_compras')
          .select('*')
          .eq('cliente_celular', celularNormalizado)
          .order('data_compra', { ascending: false });

        if (error || !Array.isArray(data)) return [];

        return data.map((item) => ({
          celular: item.cliente_celular,
          itens: Array.isArray(item.itens) ? item.itens : [],
          data: item.data_compra
        }));
      });
    },
    async listarAvaliacoes() {
      return executarConsulta('listarAvaliacoes', [], async () => {
        const { data, error } = await client.from('comentarios').select('*').order('data_avaliacao', { ascending: true });
        if (error || !Array.isArray(data)) return [];
        return data.map(mapearComentario);
      });
    },
    async adicionarAvaliacao(avaliacao = {}) {
      return executarConsulta('adicionarAvaliacao', null, async () => {
        const celular = normalizarCelular(avaliacao?.celular);
        const comentario = String(avaliacao?.comentario || '').trim();
        const nome = String(avaliacao?.nome || '').trim();
        const nota = Math.max(1, Math.min(5, Number(avaliacao?.nota) || 0));
        if (!comentario || !nome || !nota) return null;

        const payload = {
          id: String(avaliacao?.id || `${celular || 'anonimo'}-${Date.now()}`),
          nome,
          celular: celular || null,
          foto: String(avaliacao?.foto || '').trim() || null,
          nota,
          comentario,
          data_avaliacao: avaliacao?.dataAvaliacao || new Date().toISOString()
        };

        const { data, error } = await client.from('comentarios').insert(payload).select('*').single();
        if (error || !data) return null;
        return mapearComentario(data);
      });
    },
    async excluirAvaliacao(idAvaliacao, celular) {
      return executarConsulta('excluirAvaliacao', false, async () => {
        const id = String(idAvaliacao || '').trim();
        if (!id) return false;

        let query = client.from('comentarios').delete().eq('id', id);
        const celularNormalizado = normalizarCelular(celular);
        if (celularNormalizado) query = query.eq('celular', celularNormalizado);

        const { error } = await query;
        return !error;
      });
    }
  };

  avisarConfiguracaoDesativada();
  window.CASAMELO_SUPABASE = api;
})();
