const CASAMELO_SUPABASE_EXEMPLO = {
  url: 'https://fulymepfkdenmtickfwk.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bHltZXBma2Rlbm10aWNrZndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTY4MTMsImV4cCI6MjA4NzQzMjgxM30.6BRJj59Amct0VLW8EdwRhZhHQVtmkIZtRkXPiXIzOpY',
  schema: 'public'
};

window.CASAMELO_SUPABASE_CONFIG = window.CASAMELO_SUPABASE_CONFIG || {
  ...CASAMELO_SUPABASE_EXEMPLO,
  enabled: true
};

(function () {
  const CONFIG_PADRAO = {
    ...CASAMELO_SUPABASE_EXEMPLO,
    schema: 'public',
    enabled: true
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
    enabled: Boolean(configGlobal.enabled) || credenciaisPersonalizadas
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

  const resumirErroSupabase = (error) => {
    if (!error) return null;

    return {
      message: error.message || 'Erro desconhecido',
      details: error.details || null,
      hint: error.hint || null,
      code: error.code || null,
      status: error.status || null,
      name: error.name || null
    };
  };

  const mapearCliente = (cliente = {}) => ({
    id: cliente.id || null,
    nome: String(cliente.nome || '').trim(),
    celular: normalizarCelular(cliente.celular),
    senha: String(cliente.senha || cliente.senha_hash || ''),
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
    nota: Number(comentario.nota) || 5,
    comentario: String(comentario.comentario || comentario.mensagem || '').trim(),
    dataAvaliacao: comentario.data_avaliacao || comentario.dataAvaliacao || comentario.created_at || comentario.criado_em || null
  });

  const obterSessaoLocal = () => {
    try {
      return JSON.parse(localStorage.getItem('casamelo_usuario_logado') || 'null');
    } catch (erro) {
      return null;
    }
  };

  const valoresFiltroCelular = (celular) => {
    const celularNormalizado = normalizarCelular(celular);
    if (!celularNormalizado) return [];

    return celularNormalizado.length === 11
      ? [celularNormalizado, `55${celularNormalizado}`]
      : [celularNormalizado];
  };

  const aplicarFiltroCelular = (query, coluna, celular) => {
    const valores = valoresFiltroCelular(celular);
    if (!valores.length) return null;
    if (valores.length === 1) {
      return query.eq(coluna, valores[0]);
    }

    const filtroOr = valores
      .map((valor) => `${coluna}.eq.${valor}`)
      .join(',');

    return query.or(filtroOr);
  };

  const erroColunaInexistente = (erro, coluna) => {
    if (!erro) return false;
    if (erro.code === '42703' || erro.code === 'PGRST204') return true;

    const mensagem = `${erro.message || ''} ${erro.details || ''} ${erro.hint || ''}`.toLowerCase();
    if (!mensagem) return false;
    return mensagem.includes(`'${String(coluna).toLowerCase()}'`) && (
      mensagem.includes('does not exist')
      || mensagem.includes('could not find the')
      || mensagem.includes('schema cache')
    );
  };

  const identificarCliente = (celular) => {
    const query = aplicarFiltroCelular(client.from('clientes').select('*'), 'celular', celular);
    return query ? query.maybeSingle() : Promise.resolve({ data: null, error: null });
  };

  const obterClienteIdPorCelular = async (celular) => {
    const query = aplicarFiltroCelular(client.from('clientes').select('id'), 'celular', celular);
    if (!query) return null;

    const { data, error } = await query.maybeSingle();
    if (error || !data?.id) return null;
    return data.id;
  };

  const parsePrecoNumerico = (preco) => {
    const valor = String(preco ?? '')
      .replace(/\s/g, '')
      .replace(/[R$r$\u00A0]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '');
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
  };

  const obterContextoAuthDebug = async () => {
    if (!client?.auth) {
      return {
        user: null,
        session: null,
        userError: null,
        sessionError: null,
        authDisponivel: false
      };
    }

    const [userResponse, sessionResponse] = await Promise.all([
      client.auth.getUser().catch((error) => ({ data: { user: null }, error })),
      client.auth.getSession().catch((error) => ({ data: { session: null }, error }))
    ]);

    return {
      user: userResponse?.data?.user || null,
      session: sessionResponse?.data?.session || null,
      userError: userResponse?.error || null,
      sessionError: sessionResponse?.error || null,
      authDisponivel: true
    };
  };

  const registrarFalhaOperacao = async (origem, detalhes = {}) => {
    const contextoAuth = await obterContextoAuthDebug();
    const resumoAuth = {
      authDisponivel: contextoAuth.authDisponivel,
      user: contextoAuth.user ? {
        id: contextoAuth.user.id,
        email: contextoAuth.user.email || null,
        phone: contextoAuth.user.phone || null
      } : null,
      sessionAtiva: Boolean(contextoAuth.session),
      userError: contextoAuth.userError ? {
        message: contextoAuth.userError.message,
        status: contextoAuth.userError.status || null,
        name: contextoAuth.userError.name || null
      } : null,
      sessionError: contextoAuth.sessionError ? {
        message: contextoAuth.sessionError.message,
        status: contextoAuth.sessionError.status || null,
        name: contextoAuth.sessionError.name || null
      } : null
    };

    const mensagemErro = `${detalhes?.error?.message || ''} ${detalhes?.error?.details || ''} ${detalhes?.error?.hint || ''}`.toLowerCase();
    const dicas = [];

    if (!resumoAuth.user) {
      dicas.push('Supabase Auth não encontrou usuário autenticado. Execute await window.CASAMELO_SUPABASE.debugAuthState() e confirme se data.user não é null.');
    }

    if (mensagemErro.includes('row-level security')) {
      dicas.push('O INSERT foi bloqueado por RLS. Revise as policies da tabela e, se usar user_id, confirme se a coluna recebe auth.uid() por default.');
    }

    if (mensagemErro.includes('null value') && mensagemErro.includes('user_id')) {
      dicas.push('A coluna user_id continua nula. Se a policy depender dela, aplique alter table public.clientes alter column user_id set default auth.uid();');
    }

    const erroDetalhado = {
      ...detalhes,
      error: resumirErroSupabase(detalhes?.error),
      auth: resumoAuth,
      dicas
    };

    ultimoErro = {
      origem,
      ...erroDetalhado
    };

    console.error(`[Casa Melo Decor] Falha em ${origem}.`, erroDetalhado);
    return ultimoErro;
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
      ultimoErro = resumirErroSupabase(error);

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
    async debugAuthState() {
      const contextoAuth = await obterContextoAuthDebug();
      const resumo = {
        authDisponivel: contextoAuth.authDisponivel,
        user: contextoAuth.user ? {
          id: contextoAuth.user.id,
          email: contextoAuth.user.email || null,
          phone: contextoAuth.user.phone || null
        } : null,
        session: contextoAuth.session ? {
          expires_at: contextoAuth.session.expires_at || null,
          token_type: contextoAuth.session.token_type || null,
          user_id: contextoAuth.session.user?.id || null
        } : null,
        userError: contextoAuth.userError,
        sessionError: contextoAuth.sessionError
      };

      console.log('[Casa Melo Decor] debugAuthState()', resumo);
      return resumo;
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
        const registroPadrao = {
          nome: String(clienteCadastro?.nome || '').trim(),
          celular: normalizarCelular(clienteCadastro?.celular),
          senha: String(clienteCadastro?.senha || ''),
          foto: String(clienteCadastro?.foto || '').trim(),
          receber_novidades: Boolean(clienteCadastro?.receberNovidades),
          ultimo_acesso: new Date().toISOString()
        };

        const payloads = [
          registroPadrao,
          {
            ...registroPadrao,
            senha_hash: registroPadrao.senha
          }
        ];

        let ultimoErroCadastro = null;
        for (const payload of payloads) {
          const { data, error } = await client.from('clientes').insert(payload).select('*').single();
          if (!error && data) return mapearCliente(data);
          ultimoErroCadastro = error || ultimoErroCadastro;
        }

        if (ultimoErroCadastro) {
          await registrarFalhaOperacao('cadastrarCliente', { payloads, error: ultimoErroCadastro });
        }
        return null;
      });
    },
    async autenticarCliente(celular, senha) {
      return executarConsulta('autenticarCliente', null, async () => {
        const celularNormalizado = normalizarCelular(celular);
        const senhaNormalizada = String(senha || '');
        if (!celularNormalizado || !senhaNormalizada) return null;

        const consultas = ['senha', 'senha_hash'];
        let data = null;
        for (const colunaSenha of consultas) {
          const resposta = await client
            .from('clientes')
            .select('*')
            .eq('celular', celularNormalizado)
            .eq(colunaSenha, senhaNormalizada)
            .maybeSingle();

          if (!resposta.error && resposta.data) {
            data = resposta.data;
            break;
          }
        }
        if (!data) return null;

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
        if (Object.hasOwn(campos, 'senha')) {
          const senha = String(campos.senha || '');
          payload.senha = senha;
          payload.senha_hash = senha;
        }
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

        const payloadBase = {
          itens,
          atualizado_em: new Date().toISOString()
        };

        const tentativasColunaCelular = [
          // Alguns projetos mais antigos usam `celular` em vez de `cliente_celular`.
          // Tentamos primeiro o formato legado para reduzir erros 400/42703 no console.
          { coluna: 'celular', onConflict: 'celular' },
          { coluna: 'cliente_celular', onConflict: 'cliente_celular' }
        ];

        let error = null;
        for (const tentativa of tentativasColunaCelular) {
          const payload = {
            ...payloadBase,
            [tentativa.coluna]: celularNormalizado
          };
          const resposta = await client.from('carrinhos').upsert(payload, { onConflict: tentativa.onConflict });
          error = resposta?.error || null;

          if (!error) return true;
          if (error.code !== '42703') break;
        }

        const clienteId = await obterClienteIdPorCelular(celularNormalizado);
        if (!clienteId) return false;

        const { data: carrinhoExistente } = await client
          .from('carrinhos')
          .select('id')
          .eq('cliente_id', clienteId)
          .eq('status', 'ativo')
          .order('criado_em', { ascending: false })
          .limit(1)
          .maybeSingle();

        let carrinhoId = carrinhoExistente?.id || null;
        if (!carrinhoId) {
          const { data: novoCarrinho, error: erroNovoCarrinho } = await client
            .from('carrinhos')
            .insert({
              cliente_id: clienteId,
              cliente_celular: celularNormalizado,
              status: 'ativo',
              atualizado_em: new Date().toISOString()
            })
            .select('id')
            .single();

          if (erroNovoCarrinho || !novoCarrinho?.id) return false;
          carrinhoId = novoCarrinho.id;
        }

        await client.from('itens_carrinho').delete().eq('carrinho_id', carrinhoId);
        if (!Array.isArray(itens) || !itens.length) return true;

        const itensNormalizados = itens.map((item) => ({
          carrinho_id: carrinhoId,
          produto_id: item?.produto_id || item?.produtoId || item?.id || null,
          quantidade: Math.max(1, Number(item?.quantidade) || 1),
          preco_unitario: parsePrecoNumerico(item?.preco_unitario ?? item?.preco)
        }));

        const { error: erroItens } = await client.from('itens_carrinho').insert(itensNormalizados);
        return !erroItens;
      });
    },
    async carregarCarrinho(celular) {
      return executarConsulta('carregarCarrinho', [], async () => {
        const celularNormalizado = normalizarCelular(celular);
        if (!celularNormalizado) return [];

        const mapearItensCarrinho = (itensCarrinho = []) => itensCarrinho.map((item) => ({
          id: item.produto_id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          produto_id: item.produto_id || null,
          nome: 'Produto',
          preco: Number(item.preco_unitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          quantidade: Math.max(1, Number(item.quantidade) || 1)
        }));

        const carregarItensPorCarrinhoId = async (carrinhoId) => {
          if (!carrinhoId) return null;
          const { data: itensCarrinho, error: erroItens } = await client
            .from('itens_carrinho')
            .select('produto_id, quantidade, preco_unitario')
            .eq('carrinho_id', carrinhoId);
          if (erroItens || !Array.isArray(itensCarrinho)) return null;
          return mapearItensCarrinho(itensCarrinho);
        };

        const clienteId = await obterClienteIdPorCelular(celularNormalizado);
        if (clienteId) {
          const { data: carrinhoAtivo, error: erroCarrinho } = await client
            .from('carrinhos')
            .select('id')
            .eq('cliente_id', clienteId)
            .eq('status', 'ativo')
            .order('criado_em', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!erroCarrinho && carrinhoAtivo?.id) {
            const itensAtivos = await carregarItensPorCarrinhoId(carrinhoAtivo.id);
            if (itensAtivos) return itensAtivos;
          }
        }

        const colunasCelularCarrinho = ['celular', 'cliente_celular'];

        for (const colunaCelular of colunasCelularCarrinho) {
          const queryCarrinhoPorCelular = aplicarFiltroCelular(
            client
              .from('carrinhos')
              .select('id')
              .eq('status', 'ativo')
              .order('criado_em', { ascending: false })
              .limit(1),
            colunaCelular,
            celularNormalizado
          );

          if (!queryCarrinhoPorCelular) continue;

          const { data: carrinhoPorCelular, error: erroCarrinhoPorCelular } = await queryCarrinhoPorCelular.maybeSingle();
          if (erroColunaInexistente(erroCarrinhoPorCelular, colunaCelular)) continue;
          if (!erroCarrinhoPorCelular && carrinhoPorCelular?.id) {
            const itensPorCelular = await carregarItensPorCarrinhoId(carrinhoPorCelular.id);
            if (itensPorCelular) return itensPorCelular;
          }
        }

        for (const colunaCelular of colunasCelularCarrinho) {
          const query = aplicarFiltroCelular(
            client.from('carrinhos').select('itens'),
            colunaCelular,
            celularNormalizado
          );
          if (!query) continue;

          const { data, error } = await query.maybeSingle();
          if (erroColunaInexistente(error, colunaCelular)) continue;
          if (!error) return Array.isArray(data?.itens) ? data.itens : [];
        }

        return [];
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

        const query = aplicarFiltroCelular(
          client
            .from('historico_compras')
            .select('*'),
          'cliente_celular',
          celularNormalizado
        );

        if (!query) return [];

        const { data, error } = await query.order('data_compra', { ascending: false });

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

        const consultasOrdenacao = ['created_at', 'data_avaliacao', 'criado_em'];

        for (const colunaData of consultasOrdenacao) {
          const { data, error } = await client.from('comentarios').select('*').order(colunaData, { ascending: false });
          if (!error && Array.isArray(data)) return data.map(mapearComentario);
        }

        return [];
      });
    },
    async buscarComentarios() {
      return api.listarAvaliacoes();
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
          comentario,
          nota,
          celular: celular || null,
          foto: String(avaliacao?.foto || '').trim() || null,
          data_avaliacao: avaliacao?.dataAvaliacao || new Date().toISOString()
        };

        const instanteCriacao = avaliacao?.dataAvaliacao || avaliacao?.createdAt || new Date().toISOString();
        const payloads = [
          {
            nome,
            mensagem: comentario,
            created_at: instanteCriacao,
            ...(avaliacao?.cliente_id ? { cliente_id: avaliacao.cliente_id } : {})
          },
          {
            id: String(avaliacao?.id || `${celular || 'anonimo'}-${Date.now()}`),
            nome,
            celular: celular || null,
            foto: String(avaliacao?.foto || '').trim() || null,
            nota,
            comentario,
            data_avaliacao: instanteCriacao
          },
          {
            nome,
            comentario,
            nota,
            ...(celular ? { celular } : {}),
            ...(String(avaliacao?.foto || '').trim() ? { foto: String(avaliacao.foto).trim() } : {}),
            created_at: instanteCriacao
          },
          {
            nome,
            comentario,
            nota,
            ...(celular ? { celular } : {}),
            ...(String(avaliacao?.foto || '').trim() ? { foto: String(avaliacao.foto).trim() } : {})
          }
        ];


        let ultimoErro = null;

        for (const payload of payloads) {
          const { data, error } = await client.from('comentarios').insert(payload).select('*').single();
          if (!error && data) return mapearComentario(data);
          ultimoErro = error || ultimoErro;
        }

        if (ultimoErro) {
          await registrarFalhaOperacao('adicionarAvaliacao', {
            payloads,
            error: ultimoErro
          });
        }

        return null;
      });
    },
    async criarComentario(comentario = {}) {
      return api.adicionarAvaliacao(comentario);
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
