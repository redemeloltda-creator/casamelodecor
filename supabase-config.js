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

  const hashSenha = async (senhaTexto) => {
    const senhaNormalizada = String(senhaTexto || '');
    if (!senhaNormalizada) return '';
    if (!window.crypto?.subtle) return senhaNormalizada;

    const bytes = new TextEncoder().encode(senhaNormalizada);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hashBuffer)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  const senhaConfere = async ({ senhaInformadaHash = '', senhaInformadaTexto = '', senhaPersistida = '' }) => {
    const senhaSalva = String(senhaPersistida || '').trim();
    const senhaHash = String(senhaInformadaHash || '').trim();
    const senhaTexto = String(senhaInformadaTexto || '').trim();

    if (!senhaSalva) return false;
    if (senhaHash && senhaSalva === senhaHash) return true;
    if (senhaTexto && senhaSalva === senhaTexto) return true;

    if (senhaTexto && !senhaHash) {
      const hashCalculado = await hashSenha(senhaTexto);
      return Boolean(hashCalculado && hashCalculado === senhaSalva);
    }

    return false;
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
    foto: String(cliente.foto || '').trim(),
    receberNovidades: Boolean(cliente.receber_novidades),
    criadoEm: cliente.criado_em || null,
    atualizadoEm: cliente.atualizado_em || null,
    userId: cliente.user_id || null
  });

  const mapearComentario = (comentario = {}) => ({
    id: String(comentario.id || '').trim(),
    nome: String(comentario.nome || '').trim(),
    celular: normalizarCelular(comentario.celular),
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

  const COLUNA_TELEFONE = 'celular';

  const aplicarFiltroCelular = (query, coluna, celular) => {
    const valores = valoresFiltroCelular(celular);
    if (!valores.length) return null;

    if (valores.length === 1) {
      return query.eq(coluna, valores[0]);
    }

    return query.in(coluna, valores);
  };

  const erroColunaInexistente = (erro, coluna) => {
    if (!erro) return false;
    if (erro.code === '42703' || erro.code === 'PGRST204') return true;

    const mensagem = `${erro.message || ''} ${erro.details || ''} ${erro.hint || ''}`.toLowerCase();
    if (!mensagem) return false;
    const colunaNormalizada = String(coluna).toLowerCase();
    const referenciaColuna = (
      mensagem.includes(`'${colunaNormalizada}'`)
      || mensagem.includes(`.${colunaNormalizada}`)
      || mensagem.includes(` ${colunaNormalizada} `)
      || mensagem.endsWith(colunaNormalizada)
    );

    return referenciaColuna && (
      mensagem.includes('does not exist')
      || mensagem.includes('could not find the')
      || mensagem.includes('schema cache')
    );
  };

  const extrairColunaInexistente = (erro) => {
    const mensagem = `${erro?.message || ''} ${erro?.details || ''} ${erro?.hint || ''}`;
    if (!mensagem) return null;

    const correspondencia = mensagem.match(/['"]([a-zA-Z_][a-zA-Z0-9_]*)['"]/);
    return correspondencia?.[1] || null;
  };

  const criarFiltroClientePorCelular = (query, celular) => {
    const celularNormalizado = normalizarCelular(celular);
    if (!celularNormalizado) return null;
    return query.eq(COLUNA_TELEFONE, celularNormalizado);
  };

  const buscarTodosClientes = async () => client
    .from('clientes')
    .select('*')
    .order('criado_em', { ascending: true });

  const obterClienteIdPorCelular = async (celular) => {
    const query = criarFiltroClientePorCelular(client.from('clientes').select('id'), celular);
    if (!query) return null;
    const { data, error } = await query.maybeSingle();
    if (error) return null;
    return data?.id || null;
  };

  const obterUsuarioAuthAtual = async () => {
    if (!client?.auth) return null;

    const { data, error } = await client.auth.getUser();
    if (error || !data?.user?.id) return null;
    return data.user;
  };

  const obterUserIdSessao = async () => {
    const userAuth = await obterUsuarioAuthAtual();
    if (userAuth?.id) return userAuth.id;

    const sessaoLocal = obterSessaoLocal();
    return sessaoLocal?.user_id || sessaoLocal?.userId || null;
  };

  const validarUsuarioAutenticado = async (origemOperacao) => {
    const userAuth = await obterUsuarioAuthAtual();
    if (userAuth?.id) return userAuth;

    await registrarFalhaOperacao(origemOperacao, {
      error: {
        message: 'Supabase Auth sem usuário autenticado.',
        details: 'client.auth.getUser() retornou user null antes da operação.',
        hint: 'Faça login via supabase.auth.signInWithPassword/signInWithOtp antes de gravar em public.clientes.'
      }
    });
    return null;
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

  const calcularTotalItens = (itens = []) => itens.reduce((acumulador, item) => {
    const preco = parsePrecoNumerico(item?.preco ?? item?.preco_unitario ?? item?.precoUnitario ?? 0);
    const quantidade = Math.max(1, Number(item?.quantidade) || 1);
    return acumulador + (preco * quantidade);
  }, 0);

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUuid = (valor) => UUID_REGEX.test(String(valor || '').trim());
  const CAMPOS_VALIDOS = [
    'id',
    'nome',
    'celular',
    'foto',
    'receber_novidades',
    'criado_em',
    'atualizado_em',
    'user_id'
  ];
  const COLUNAS_CLIENTES_VALIDAS = new Set(CAMPOS_VALIDOS);

  const removerCamposNulosOuIndefinidos = (obj = {}) => Object.entries(obj).reduce((acumulador, [chave, valor]) => {
    if (valor === undefined || valor === null) return acumulador;
    acumulador[chave] = valor;
    return acumulador;
  }, {});

  const limparPayload = (obj = {}) => removerCamposNulosOuIndefinidos(obj);

  const filtrarCampos = (obj = {}) => Object.entries(obj).reduce((acumulador, [chave, valor]) => {
    if (!COLUNAS_CLIENTES_VALIDAS.has(chave)) return acumulador;
    acumulador[chave] = valor;
    return acumulador;
  }, {});
  const filtrarCamposValidos = filtrarCampos;

  const sanitizarPayloadCliente = (payload = {}) => {
    const semNulos = limparPayload(payload);
    const permitido = filtrarCampos(semNulos);

    if (typeof permitido.nome === 'string') permitido.nome = permitido.nome.trim();
    if (typeof permitido.celular === 'string') permitido.celular = normalizarCelular(permitido.celular);
    if (typeof permitido.foto === 'string') permitido.foto = permitido.foto.trim();
    if (Object.hasOwn(permitido, 'receber_novidades')) permitido.receber_novidades = Boolean(permitido.receber_novidades);
    if (typeof permitido.user_id === 'string') permitido.user_id = permitido.user_id.trim();

    if (permitido.foto === '') delete permitido.foto;

    return permitido;
  };

  const sanitizarPayloadClientes = sanitizarPayloadCliente;

  const validarPayloadCadastroCliente = (payload = {}) => {
    const erros = [];

    if (!payload.nome || String(payload.nome).trim().length < 2) {
      erros.push('Campo "nome" é obrigatório e deve ter pelo menos 2 caracteres.');
    }

    if (!payload.celular) {
      erros.push('Campo "celular" é obrigatório.');
    } else {
      const celular = normalizarCelular(payload.celular);
      if (celular.length < 10 || celular.length > 13) {
        erros.push('Campo "celular" deve ter DDD + número (10 a 13 dígitos contando país).');
      }
    }

    if (Object.hasOwn(payload, 'user_id') && payload.user_id && !isUuid(payload.user_id)) {
      erros.push('Campo "user_id" precisa ser UUID válido quando informado.');
    }

    return {
      ok: erros.length === 0,
      erros
    };
  };

  const normalizarItensCarrinhoJson = (itens = []) => {
    if (!Array.isArray(itens)) return [];

    return itens.map((item = {}) => ({
      id: String(item.id || item.produto_id || item.produtoId || '').trim() || null,
      produto_id: isUuid(item.produto_id || item.produtoId || item.id) ? String(item.produto_id || item.produtoId || item.id).trim() : null,
      nome: String(item.nome || 'Produto').trim(),
      preco: String(item.preco || '').trim(),
      imagem: String(item.imagem || '').trim(),
      pagina: String(item.pagina || '').trim(),
      linkCompra: String(item.linkCompra || item.link_compra || '').trim(),
      quantidade: Math.max(1, Number(item.quantidade) || 1),
      criadoEm: item.criadoEm || item.adicionadoEm || item.criado_em || new Date().toISOString(),
      atualizadoEm: item.atualizadoEm || item.atualizado_em || new Date().toISOString()
    }));
  };

  const normalizarItensCarrinhoTabela = (carrinhoId, itens = []) => normalizarItensCarrinhoJson(itens).map((item) => ({
    carrinho_id: carrinhoId,
    produto_id: item.produto_id,
    quantidade: item.quantidade,
    preco_unitario: parsePrecoNumerico(item.preco)
  }));

  const buscarCarrinhoAtivoMaisRecente = async (queryBase) => {
    const colunasOrdenacao = ['created_at', 'atualizado_em', 'criado_em'];
    let ultimoErro = null;

    for (const coluna of colunasOrdenacao) {
      const { data, error } = await queryBase()
        .order(coluna, { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error) return { data, error: null };
      ultimoErro = error;
      if (erroColunaInexistente(error, coluna)) continue;
      return { data: null, error };
    }

    return { data: null, error: ultimoErro };
  };

  const atualizarOuInserirCarrinhoJson = async (celular, itens = []) => {
    const celularNormalizado = normalizarCelular(celular);
    if (!celularNormalizado) return { sucesso: false, error: null };

    const payloadBase = {
      itens: Array.isArray(itens) ? itens : [],
      atualizado_em: new Date().toISOString()
    };

    const tentativasColunaCelular = ['celular'];
    let ultimoErroCarrinho = null;

    for (const colunaCelular of tentativasColunaCelular) {
      const queryAtualizacao = aplicarFiltroCelular(
        client.from('carrinhos').update(payloadBase).select(colunaCelular),
        colunaCelular,
        celularNormalizado
      );

      if (!queryAtualizacao) continue;

      const { data: atualizados, error: erroAtualizacao } = await queryAtualizacao;
      if (!erroAtualizacao && Array.isArray(atualizados) && atualizados.length > 0) {
        return { sucesso: true, error: null };
      }
      if (erroColunaInexistente(erroAtualizacao, colunaCelular)) {
        ultimoErroCarrinho = erroAtualizacao;
        continue;
      }
      if (!erroAtualizacao) {
        const { error: erroInsert } = await client.from('carrinhos').insert({
          ...payloadBase,
          [colunaCelular]: celularNormalizado
        });
        if (!erroInsert) return { sucesso: true, error: null };
        if (erroColunaInexistente(erroInsert, colunaCelular)) {
          ultimoErroCarrinho = erroInsert;
          continue;
        }
        return { sucesso: false, error: erroInsert };
      }
      return { sucesso: false, error: erroAtualizacao };
    }

    return { sucesso: false, error: ultimoErroCarrinho };
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
    CAMPOS_VALIDOS: [...CAMPOS_VALIDOS],
    limparPayload,
    filtrarCampos,
    async listarClientes() {
      return executarConsulta('listarClientes', [], async () => {
        const { data, error } = await buscarTodosClientes();
        if (error || !Array.isArray(data)) return [];
        return data.map(mapearCliente);
      });
    },
    async buscarClientePorCelular(celular) {
      return executarConsulta('buscarClientePorCelular', null, async () => {
        const query = criarFiltroClientePorCelular(
          client.from('clientes').select('*'),
          celular
        );
        if (!query) return null;
        const { data, error } = await query.maybeSingle();
        if (error || !data) {
          if (error) {
            await registrarFalhaOperacao('buscarClientePorCelular', {
              celular: normalizarCelular(celular),
              error: resumirErroSupabase(error)
            });
          }
          return null;
        }
        return mapearCliente(data);
      });
    },
    async buscarCliente(celular) {
      return api.buscarClientePorCelular(celular);
    },
    async cadastrarCliente(clienteCadastro) {
      return executarConsulta('cadastrarCliente', null, async () => {
        const userAuth = await obterUsuarioAuthAtual();
        const dadosBase = {
          nome: String(clienteCadastro?.nome || '').trim(),
          celular: String(normalizarCelular(clienteCadastro?.celular || '')),
          foto: String(clienteCadastro?.foto || '').trim(),
          receber_novidades: Boolean(clienteCadastro?.receber_novidades ?? clienteCadastro?.receberNovidades)
        };

        const payloadBruto = {
          nome: dadosBase.nome,
          celular: dadosBase.celular,
          receber_novidades: dadosBase.receber_novidades,
          foto: dadosBase.foto
        };

        if (userAuth?.id) payloadBruto.user_id = userAuth.id;

        const payloadTentativa = sanitizarPayloadCliente(payloadBruto);
        const validacao = validarPayloadCadastroCliente(payloadTentativa);
        if (!validacao.ok) {
          await registrarFalhaOperacao('cadastrarCliente', {
            payload: dadosBase,
            payloadTentativa,
            validacao,
            error: {
              message: 'Payload inválido para INSERT em public.clientes.',
              details: validacao.erros.join(' | '),
              hint: 'Preencha nome/celular corretamente e envie apenas colunas existentes na tabela.'
            }
          });
          return null;
        }

        console.log('[Casa Melo Decor] cadastrarCliente ENVIANDO payload sanitizado:', JSON.stringify(payloadTentativa, null, 2));
        const ultimaResposta = await client.from('clientes').insert([payloadTentativa]).select('*').single();
        if (!ultimaResposta.error && ultimaResposta.data) return mapearCliente(ultimaResposta.data);

        if (ultimaResposta.error) {
          await registrarFalhaOperacao('cadastrarCliente', {
            payload: dadosBase,
            payloadTentativa,
            error: ultimaResposta.error,
            supabaseError: {
              status: ultimaResposta.error.status || null,
              code: ultimaResposta.error.code || null,
              message: ultimaResposta.error.message || 'Erro desconhecido',
              details: ultimaResposta.error.details || null,
              hint: ultimaResposta.error.hint || null
            }
          });
        }
        return null;
      });
    },

    async salvarOuAtualizarCliente(clienteCadastro = {}) {
      return executarConsulta('salvarOuAtualizarCliente', null, async () => {
        const celular = normalizarCelular(clienteCadastro?.celular || '');
        if (!celular) return null;

        const clienteAtual = await api.buscarClientePorCelular(celular);
        if (!clienteAtual) {
          return api.cadastrarCliente({ ...clienteCadastro, celular });
        }

        return api.atualizarCliente(celular, {
          nome: Object.hasOwn(clienteCadastro, 'nome') ? clienteCadastro.nome : clienteAtual.nome,
          foto: Object.hasOwn(clienteCadastro, 'foto') ? clienteCadastro.foto : clienteAtual.foto,
          receberNovidades: Object.hasOwn(clienteCadastro, 'receberNovidades')
            ? clienteCadastro.receberNovidades
            : clienteAtual.receberNovidades,
        });
      });
    },
    async autenticarCliente(celular, senhaHash, senhaTexto = '') {
      return executarConsulta('autenticarCliente', null, async () => {
        const celularNormalizado = normalizarCelular(celular);
        if (!celularNormalizado || !String(senhaHash || senhaTexto || '')) return null;

        const { data } = await client
          .from('clientes')
          .select('*')
          .eq(COLUNA_TELEFONE, celularNormalizado)
          .maybeSingle();

        if (!data) return null;

        const senhaRemota = String(data.senha || data.senha_hash || '').trim();
        const autenticado = await senhaConfere({
          senhaInformadaHash: String(senhaHash || '').trim(),
          senhaInformadaTexto: String(senhaTexto || '').trim(),
          senhaPersistida: senhaRemota
        });
        if (!autenticado) {
          await registrarFalhaOperacao('autenticarCliente', {
            celular: celularNormalizado,
            payload: { senhaInformada: '***' },
            error: {
              message: 'Senha inválida ou indisponível na tabela clientes.',
              details: 'A autenticação remota foi bloqueada para evitar login sem validar senha.',
              hint: 'Garanta que a coluna senha/senha_hash esteja preenchida ou use Supabase Auth no fluxo de login.'
            }
          });
          return null;
        }

        return mapearCliente(data);
      });
    },
    async atualizarCliente(celular, campos = {}) {
      return executarConsulta('atualizarCliente', null, async () => {
        const celularNormalizado = normalizarCelular(celular);
        if (!celularNormalizado) return null;

        const payload = {};
        if (Object.hasOwn(campos, 'nome')) payload.nome = String(campos.nome || '').trim();
        if (Object.hasOwn(campos, 'foto')) payload.foto = String(campos.foto || '').trim();
        if (Object.hasOwn(campos, 'receberNovidades')) payload.receber_novidades = Boolean(campos.receberNovidades);
        if (Object.hasOwn(campos, 'celular')) payload.celular = String(normalizarCelular(campos.celular || ''));

        const payloadSanitizado = sanitizarPayloadCliente(payload);
        console.log('[Casa Melo Decor] atualizarCliente ENVIANDO payload sanitizado:', JSON.stringify(payloadSanitizado, null, 2));
        if (!Object.keys(payloadSanitizado).length) {
          await registrarFalhaOperacao('atualizarCliente', {
            celular: celularNormalizado,
            payloadRecebido: payload,
            error: {
              message: 'Payload vazio após sanitização.',
              details: 'Nenhum campo válido/restante para UPDATE em public.clientes.',
              hint: `Envie apenas campos permitidos: ${CAMPOS_VALIDOS.join(', ')}`
            }
          });
          return null;
        }

        const { data, error } = await client
          .from('clientes')
          .update(payloadSanitizado)
          .eq(COLUNA_TELEFONE, celularNormalizado)
          .select('*')
          .maybeSingle();

        if (error) {
          await registrarFalhaOperacao('atualizarCliente', {
            payload,
            payloadSanitizado,
            celular: celularNormalizado,
            error: resumirErroSupabase(error)
          });
        }

        if (!data) return null;
        return mapearCliente(data);
      });
    },
    async excluirCliente(celular) {
      return executarConsulta('excluirCliente', false, async () => {
        const celularNormalizado = normalizarCelular(celular);
        if (!celularNormalizado) return false;

        const { error } = await client.from('clientes').delete().eq(COLUNA_TELEFONE, celularNormalizado);
        return !error;
      });
    },
    async salvarCarrinho(celular, itens = []) {
      return executarConsulta('salvarCarrinho', false, async () => {
        const celularNormalizado = normalizarCelular(celular);
        if (!celularNormalizado) return false;
        const itensNormalizadosJson = normalizarItensCarrinhoJson(itens);
        const clienteId = await obterClienteIdPorCelular(celularNormalizado);

        const payloadBase = {
          status: 'ativo',
          atualizado_em: new Date().toISOString(),
          ...(clienteId ? { cliente_id: clienteId } : {})
        };

        const fallbackJsonCarrinho = await atualizarOuInserirCarrinhoJson(celularNormalizado, itensNormalizadosJson);
        if (fallbackJsonCarrinho.sucesso) return true;

        const criarBuscaCarrinhoPorCelular = () => {
          const queryBase = client
            .from('carrinhos')
            .select('id')
            .eq('status', 'ativo');

          return aplicarFiltroCelular(queryBase, 'celular', celularNormalizado) || null;
        };

        let carrinhoExistente = null;
        if (clienteId) {
          const respostaCarrinhoPorCliente = await buscarCarrinhoAtivoMaisRecente(() => client
            .from('carrinhos')
            .select('id')
            .eq('cliente_id', clienteId)
            .eq('status', 'ativo'));
          carrinhoExistente = respostaCarrinhoPorCliente.data || null;
        }

        if (!carrinhoExistente) {
          const queryCarrinhoPorCelular = criarBuscaCarrinhoPorCelular();
          if (queryCarrinhoPorCelular) {
            const respostaCarrinhoPorCelular = await buscarCarrinhoAtivoMaisRecente(() => criarBuscaCarrinhoPorCelular());
            carrinhoExistente = respostaCarrinhoPorCelular.data || null;
          }
        }

        let carrinhoId = carrinhoExistente?.id || null;
        if (!carrinhoId) {
          const payloadBaseNovoCarrinho = {
            status: 'ativo',
            atualizado_em: new Date().toISOString(),
            ...(clienteId ? { cliente_id: clienteId } : {})
          };
          const payloadsNovoCarrinho = [
            { ...payloadBaseNovoCarrinho, celular: celularNormalizado },
            payloadBaseNovoCarrinho
          ];

          let novoCarrinho = null;
          let erroNovoCarrinho = null;
          for (const payloadNovoCarrinho of payloadsNovoCarrinho) {
            const respostaNovoCarrinho = await client
              .from('carrinhos')
              .insert(payloadNovoCarrinho)
              .select('id')
              .maybeSingle();

            if (!respostaNovoCarrinho.error && respostaNovoCarrinho.data?.id) {
              novoCarrinho = respostaNovoCarrinho.data;
              break;
            }

            erroNovoCarrinho = respostaNovoCarrinho.error || erroNovoCarrinho;
            if (!erroColunaInexistente(respostaNovoCarrinho.error, 'celular')) {
              break;
            }
          }

          if (erroNovoCarrinho || !novoCarrinho?.id) return false;
          carrinhoId = novoCarrinho.id;
        } else {
          await client
            .from('carrinhos')
            .update(payloadBase)
            .eq('id', carrinhoId);
        }

        await client.from('itens_carrinho').delete().eq('carrinho_id', carrinhoId);
        if (!itensNormalizadosJson.length) return true;

        const itensNormalizados = normalizarItensCarrinhoTabela(carrinhoId, itensNormalizadosJson);

        const { error: erroItens } = await client.from('itens_carrinho').insert(itensNormalizados);
        return !erroItens;
      });
    },
    async carregarCarrinho(celular) {
      return executarConsulta('carregarCarrinho', [], async () => {
        const celularNormalizado = normalizarCelular(celular);
        if (!celularNormalizado) return [];

        for (const colunaCelular of ['celular']) {
          const query = aplicarFiltroCelular(
            client
              .from('carrinhos')
              .select('itens, atualizado_em, criado_em')
              .order('atualizado_em', { ascending: false })
              .limit(1),
            colunaCelular,
            celularNormalizado
          );
          if (!query) continue;

          const { data, error } = await query.maybeSingle();
          if (erroColunaInexistente(error, colunaCelular) || erroColunaInexistente(error, 'itens')) continue;
          if (!error && Array.isArray(data?.itens)) {
            return normalizarItensCarrinhoJson(data.itens);
          }
        }

        const mapearItensCarrinho = (itensCarrinho = []) => itensCarrinho.map((item, index) => ({
          id: item.produto_id || `item-${index + 1}`,
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
          const { data: carrinhoAtivo, error: erroCarrinho } = await buscarCarrinhoAtivoMaisRecente(() => client
            .from('carrinhos')
            .select('id')
            .eq('cliente_id', clienteId)
            .eq('status', 'ativo'));

          if (!erroCarrinho && carrinhoAtivo?.id) {
            const itensAtivos = await carregarItensPorCarrinhoId(carrinhoAtivo.id);
            if (itensAtivos) return itensAtivos;
          }
        }

        const colunasCelularCarrinho = ['celular'];
        const filtrosStatus = ['status', null];

        for (const colunaCelular of colunasCelularCarrinho) {
          for (const colunaStatus of filtrosStatus) {
            const criarQueryCarrinhoPorCelular = () => {
              let query = client
                .from('carrinhos')
                .select('id');

              if (colunaStatus) {
                query = query.eq(colunaStatus, 'ativo');
              }

              return aplicarFiltroCelular(query, colunaCelular, celularNormalizado);
            };

            if (!criarQueryCarrinhoPorCelular()) continue;

            const { data: carrinhoPorCelular, error: erroCarrinhoPorCelular } = await buscarCarrinhoAtivoMaisRecente(
              criarQueryCarrinhoPorCelular
            );
            if (erroColunaInexistente(erroCarrinhoPorCelular, colunaCelular)) break;
            if (colunaStatus && erroColunaInexistente(erroCarrinhoPorCelular, colunaStatus)) continue;
            if (!erroCarrinhoPorCelular && carrinhoPorCelular?.id) {
              const itensPorCelular = await carregarItensPorCarrinhoId(carrinhoPorCelular.id);
              if (itensPorCelular) return itensPorCelular;
            }
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
        const clienteId = await obterClienteIdPorCelular(celularNormalizado);
        const userId = await obterUserIdSessao();

        const finalizarPedidoAuth = async () => {
          const usuarioAuth = await obterUsuarioAuthAtual();
          if (!usuarioAuth?.id) return false;

          const { data: carrinhoAtivo, error: erroCarrinhoAtivo } = await client
            .from('carrinhos')
            .select('*')
            .eq('user_id', usuarioAuth.id)
            .eq('status', 'ativo')
            .single();
          if (erroCarrinhoAtivo || !carrinhoAtivo?.id) return false;

          const { data: itensCarrinho, error: erroItensCarrinho } = await client
            .from('carrinho_itens')
            .select('*')
            .eq('carrinho_id', carrinhoAtivo.id);
          if (erroItensCarrinho || !Array.isArray(itensCarrinho) || !itensCarrinho.length) return false;

          const totalPedido = calcularTotalItens(itensCarrinho);

          const { data: pedidoCriado, error: erroPedido } = await client
            .from('pedidos')
            .insert({
              user_id: usuarioAuth.id,
              total: totalPedido
            })
            .select()
            .single();
          if (erroPedido || !pedidoCriado?.id) return false;

          const itensPedido = itensCarrinho.map((item = {}) => ({
            pedido_id: pedidoCriado.id,
            produto_id: item.produto_id || null,
            nome: String(item.nome || 'Produto').trim(),
            preco: Number(item.preco ?? item.preco_unitario ?? 0) || 0,
            quantidade: Math.max(1, Number(item.quantidade) || 1)
          }));

          const { error: erroItensPedido } = await client.from('pedido_itens').insert(itensPedido);
          if (erroItensPedido) return false;

          const { error: erroLimparCarrinho } = await client
            .from('carrinho_itens')
            .delete()
            .eq('carrinho_id', carrinhoAtivo.id);
          if (erroLimparCarrinho) return false;

          const { error: erroFinalizarCarrinho } = await client
            .from('carrinhos')
            .update({ status: 'finalizado' })
            .eq('id', carrinhoAtivo.id);
          if (erroFinalizarCarrinho) return false;

          return true;
        };

        const pedidoFinalizado = await finalizarPedidoAuth();
        if (pedidoFinalizado) return true;

        const { error } = await client.from('historico_compras').insert({
          celular: celularNormalizado,
          itens,
          data_compra: new Date().toISOString(),
          ...(clienteId ? { cliente_id: clienteId } : {}),
          ...(userId ? { user_id: userId } : {})
        });

        return !error;
      });
    },
    async listarHistorico(celular) {
      return executarConsulta('listarHistorico', [], async () => {
        const celularNormalizado = normalizarCelular(celular);
        if (!celularNormalizado) return [];
        const clienteId = await obterClienteIdPorCelular(celularNormalizado);

        let data = null;
        let error = null;

        if (clienteId) {
          const respostaPorCliente = await client
            .from('historico_compras')
            .select('*')
            .eq('cliente_id', clienteId)
            .order('data_compra', { ascending: false });

          data = respostaPorCliente.data;
          error = respostaPorCliente.error;
        }

        if (error || !Array.isArray(data)) {
          const query = aplicarFiltroCelular(
            client
              .from('historico_compras')
              .select('*'),
            'celular',
            celularNormalizado
          );
          if (!query) return [];

          const respostaPorCelular = await query.order('data_compra', { ascending: false });
          data = respostaPorCelular.data;
          error = respostaPorCelular.error;
        }

        if (error || !Array.isArray(data)) return [];

        return data.map((item) => ({
          celular: item.celular,
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
        const comentario = String(avaliacao?.comentario || avaliacao?.mensagem || '').trim();
        const nome = String(avaliacao?.nome || '').trim();
        const nota = Math.max(1, Math.min(5, Number(avaliacao?.nota) || 0));
        if (!comentario || !nome || !nota) return null;


        const clienteId = avaliacao?.cliente_id || await obterClienteIdPorCelular(celular);
        const userId = await obterUserIdSessao();
        const instanteCriacao = avaliacao?.dataAvaliacao || avaliacao?.createdAt || new Date().toISOString();
        const payloads = [
          {
            nome,
            mensagem: comentario,
            created_at: instanteCriacao,
            ...(clienteId ? { cliente_id: clienteId } : {}),
            ...(userId ? { user_id: userId } : {})
          },
          {
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
