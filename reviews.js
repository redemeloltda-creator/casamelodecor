(function () {
  const form = document.getElementById('formAvaliacao');
  const heartsInput = document.getElementById('heartsInput');
  const comentarioInput = document.getElementById('comentarioAvaliacao');
  const feedback = document.getElementById('avaliacaoFeedback');
  const lista = document.getElementById('listaAvaliacoes');
  const btnEnviar = document.getElementById('btnEnviarAvaliacao');
  const btnLogin = document.getElementById('btnLoginAvaliacao');
  const tabsExperiencia = document.querySelectorAll('[data-experience-tab]');
  const paineisExperiencia = document.querySelectorAll('[data-experience-panel]');

  if (!form || !heartsInput || !comentarioInput || !feedback || !lista || !btnEnviar || !btnLogin) return;

  const chaveSessao = 'casamelo_usuario_logado';
  const chaveUsuarios = 'casamelo_usuarios';
  const chaveAvaliacoes = 'casamelo_avaliacoes';
  const chavesAvaliacoesLegadas = ['casamelo_comentarios', 'avaliacoes'];
  const endpointAvaliacoes = window.CASAMELO_AVALIACOES_API || '/api/comentarios';
  const supabaseApi = window.CASAMELO_SUPABASE || null;
  const supabaseAtivo = Boolean(supabaseApi?.isConfigured?.());

  let notaSelecionada = 0;
  let avaliacoesCache = [];

  const normalizarCelular = (valor) => String(valor || '').replace(/\D/g, '');

  const obterIdAvaliacao = (avaliacao) => {
    const idOriginal = String(avaliacao?.id || '').trim();
    if (idOriginal) return idOriginal;

    const celular = normalizarCelular(avaliacao?.celular);
    return `${celular}-${String(avaliacao?.comentario || '').trim()}`;
  };

  const normalizarStringComparacao = (valor) => String(valor || '').trim();

  const normalizarListaAvaliacoes = (valor) => {
    if (!Array.isArray(valor)) return [];

    return valor.filter((item) => item && typeof item === 'object' && item.comentario);
  };

  const carregarSessao = () => {
    try {
      return JSON.parse(localStorage.getItem(chaveSessao) || 'null');
    } catch (erro) {
      return null;
    }
  };

  const carregarUsuarios = () => {
    try {
      return JSON.parse(localStorage.getItem(chaveUsuarios) || '[]');
    } catch (erro) {
      return [];
    }
  };

  const mesclarAvaliacoes = (...listas) => {
    const mapa = new Map();

    listas
      .flatMap((lista) => normalizarListaAvaliacoes(lista))
      .forEach((avaliacao) => {
        const id = obterIdAvaliacao(avaliacao);
        const registroAtual = mapa.get(id);

        if (!registroAtual) {
          mapa.set(id, { ...avaliacao, id });
          return;
        }

        const proximoRegistro = {
          ...registroAtual,
          ...avaliacao,
          id,
          comentario: avaliacao.comentario || registroAtual.comentario,
          nome: avaliacao.nome || registroAtual.nome,
          celular: avaliacao.celular || registroAtual.celular,
          foto: avaliacao.foto || registroAtual.foto,
          nota: Number(avaliacao.nota || registroAtual.nota) || 0
        };

        mapa.set(id, proximoRegistro);
      });

    return [...mapa.values()];
  };

  const carregarAvaliacoesLocais = () => {
    try {
      const avaliacoesSalvas = [
        localStorage.getItem(chaveAvaliacoes),
        ...chavesAvaliacoesLegadas.map((chave) => localStorage.getItem(chave))
      ]
        .map((item) => {
          try {
            return JSON.parse(item || '[]');
          } catch (erro) {
            return [];
          }
        })
        .flatMap((item) => normalizarListaAvaliacoes(item));

      return mesclarAvaliacoes(avaliacoesSalvas);
    } catch (erro) {
      return [];
    }
  };

  const salvarAvaliacoesLocais = (avaliacoes) => {
    localStorage.setItem(chaveAvaliacoes, JSON.stringify(avaliacoes));

    chavesAvaliacoesLegadas.forEach((chave) => {
      localStorage.setItem(chave, JSON.stringify(avaliacoes));
    });
  };

  const carregarAvaliacoesRemotas = async () => {
    if (supabaseAtivo) {
      try {
        return normalizarListaAvaliacoes(await supabaseApi.listarAvaliacoes());
      } catch (erro) {
        return [];
      }
    }

    try {
      const resposta = await fetch(endpointAvaliacoes, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!resposta.ok) return [];

      const dados = await resposta.json();
      return normalizarListaAvaliacoes(dados);
    } catch (erro) {
      return [];
    }
  };

  const adicionarAvaliacaoRemota = async (avaliacao) => {
    if (supabaseAtivo) {
      try {
        return await supabaseApi.adicionarAvaliacao(avaliacao);
      } catch (erro) {
        return null;
      }
    }

    try {
      const resposta = await fetch(endpointAvaliacoes, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(avaliacao)
      });

      if (!resposta.ok) return null;

      const dados = await resposta.json();
      return dados && typeof dados === 'object' ? dados : null;
    } catch (erro) {
      return null;
    }
  };

  const excluirAvaliacaoRemota = async (idAvaliacao, celular) => {
    if (supabaseAtivo) {
      try {
        return await supabaseApi.excluirAvaliacao(idAvaliacao, celular);
      } catch (erro) {
        return false;
      }
    }

    try {
      const parametros = new URLSearchParams();
      if (celular) parametros.set('celular', celular);

      const sufixoQuery = parametros.toString() ? `?${parametros.toString()}` : '';
      const resposta = await fetch(`${endpointAvaliacoes}/${encodeURIComponent(idAvaliacao)}${sufixoQuery}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json'
        }
      });

      return resposta.ok;
    } catch (erro) {
      return false;
    }
  };

  const salvarAvaliacoes = async (avaliacoes) => {
    avaliacoesCache = avaliacoes;
    salvarAvaliacoesLocais(avaliacoes);
    return { listaFinal: avaliacoes };
  };

  const buscarFotoUsuario = (avaliacao, usuarios) => {
    const fotoAvaliacao = String(avaliacao?.foto || '').trim();
    if (fotoAvaliacao) return fotoAvaliacao;

    const celular = normalizarCelular(avaliacao?.celular);
    if (!celular) return '';

    const usuario = usuarios.find((item) => normalizarCelular(item?.celular) === celular);
    return String(usuario?.foto || '').trim();
  };

  const coracoes = (nota) => '❤'.repeat(nota);

  const formatarDataAvaliacao = (valorData) => {
    if (!valorData) return '';

    const data = new Date(valorData);
    if (Number.isNaN(data.getTime())) return '';

    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const ativarAbaExperiencia = (aba) => {
    if (!tabsExperiencia.length || !paineisExperiencia.length) return;

    const abaAtiva = aba === 'visao-geral' ? 'visao-geral' : 'comentarios';

    tabsExperiencia.forEach((tab) => {
      const ativa = tab.dataset.experienceTab === abaAtiva;
      tab.classList.toggle('ativo', ativa);
      tab.setAttribute('aria-selected', String(ativa));
    });

    paineisExperiencia.forEach((painel) => {
      painel.hidden = painel.dataset.experiencePanel !== abaAtiva;
    });
  };

  const escaparHtml = (texto) => String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const limitarTamanhoComentario = (texto, tamanhoMaximo = 500) => String(texto || '')
    .trim()
    .slice(0, tamanhoMaximo);

  const renderizarHearts = () => {
    heartsInput.innerHTML = '';

    for (let i = 1; i <= 5; i += 1) {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'heart-btn';
      botao.textContent = '❤';
      botao.setAttribute('aria-label', `Dar nota ${i} de 5`);
      botao.classList.toggle('ativo', i <= notaSelecionada);
      botao.addEventListener('click', () => {
        notaSelecionada = i;
        renderizarHearts();
      });
      heartsInput.appendChild(botao);
    }
  };

  const renderizarAvaliacoes = () => {
    const usuarios = carregarUsuarios();
    const usuarioLogado = carregarSessao();
    const celularLogado = normalizarCelular(usuarioLogado?.celular);

    if (!avaliacoesCache.length) {
      lista.innerHTML = '<p class="avaliacao-vazia">Ainda não há avaliações. Seja a primeira pessoa a comentar.</p>';
      return;
    }

    lista.innerHTML = [...avaliacoesCache]
      .reverse()
      .map((avaliacao) => {
        const nome = avaliacao.nome || 'Cliente';
        const texto = avaliacao.comentario || '';
        const nota = Number(avaliacao.nota) || 0;
        const dataAvaliacao = formatarDataAvaliacao(avaliacao.dataAvaliacao);
        const foto = buscarFotoUsuario(avaliacao, usuarios);
        const celularAutor = normalizarCelular(avaliacao.celular);
        const podeExcluir = Boolean(celularLogado) && celularLogado === celularAutor;
        const inicial = nome.trim().charAt(0).toUpperCase() || 'C';
        const avatar = foto
          ? `<img class="avaliacao-avatar" src="${escaparHtml(foto)}" alt="Foto de ${escaparHtml(nome)}" loading="lazy">`
          : `<span class="avaliacao-avatar-fallback" aria-hidden="true">${escaparHtml(inicial)}</span>`;
        const acaoExcluir = podeExcluir
          ? `<button type="button" class="avaliacao-excluir" data-avaliacao-id="${escaparHtml(avaliacao.id)}" aria-label="Excluir comentário de ${escaparHtml(nome)}">Excluir</button>`
          : '';

        return `
          <article class="avaliacao-card">
            <div class="avaliacao-topo">
              <div class="avaliacao-autor">
                ${avatar}
                <span class="avaliacao-nome">${escaparHtml(nome)}</span>
              </div>
              <div class="avaliacao-acoes">
                <span class="avaliacao-nota" aria-label="Nota ${nota} de 5">${coracoes(nota)}</span>
                ${acaoExcluir}
              </div>
            </div>
            ${dataAvaliacao ? `<p class="avaliacao-data">${escaparHtml(dataAvaliacao)}</p>` : ''}
            <p>${escaparHtml(texto)}</p>
          </article>
        `;
      })
      .join('');
  };

  lista.addEventListener('click', async (evento) => {
    const botaoExcluir = evento.target.closest('[data-avaliacao-id]');
    if (!botaoExcluir) return;

    const usuario = carregarSessao();
    const idAvaliacao = String(botaoExcluir.dataset.avaliacaoId);
    const avaliacao = avaliacoesCache.find((item) => String(item.id) === idAvaliacao);

    if (!usuario || !avaliacao) return;

    const celularUsuario = normalizarCelular(usuario.celular);
    const celularAutor = normalizarCelular(avaliacao.celular);

    if (!celularUsuario || celularUsuario !== celularAutor) {
      feedback.textContent = 'Você só pode excluir comentários criados por você.';
      return;
    }

    const excluiuRemoto = await excluirAvaliacaoRemota(idAvaliacao, celularUsuario);
    const proximaLista = avaliacoesCache.filter((item) => String(item.id) !== idAvaliacao);
    const { listaFinal } = await salvarAvaliacoes(proximaLista);
    avaliacoesCache = listaFinal;
    renderizarAvaliacoes();
    feedback.textContent = excluiuRemoto
      ? 'Comentário excluído para todos com sucesso.'
      : 'Comentário excluído neste dispositivo. A sincronização global não estava disponível.';
  });

  const atualizarEstadoFormulario = () => {
    const usuario = carregarSessao();
    const logado = Boolean(usuario);

    comentarioInput.disabled = !logado;
    btnEnviar.hidden = !logado;
    btnLogin.hidden = logado;

    if (!logado) {
      feedback.textContent = 'Faça login para enviar comentário e nota.';
    } else {
      feedback.textContent = '';
    }
  };

  btnLogin.addEventListener('click', () => {
    const botaoAbrirLogin = document.querySelector('[data-auth-open="login"]');
    if (botaoAbrirLogin) botaoAbrirLogin.click();
  });

  tabsExperiencia.forEach((tab) => {
    tab.addEventListener('click', () => {
      const aba = tab.dataset.experienceTab;
      ativarAbaExperiencia(aba);
      const novaHash = aba === 'comentarios' ? '#comentarios' : '#visao-geral';
      if (window.location.hash !== novaHash) {
        history.replaceState(null, '', novaHash);
      }
    });
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (btnEnviar.disabled) return;

    const usuario = carregarSessao();
    if (!usuario) {
      feedback.textContent = 'Você precisa estar logado para avaliar.';
      atualizarEstadoFormulario();
      return;
    }

    const comentario = limitarTamanhoComentario(comentarioInput.value);

    if (!notaSelecionada) {
      feedback.textContent = 'Selecione de 1 a 5 corações para avaliar.';
      return;
    }

    if (!comentario) {
      feedback.textContent = 'Escreva um comentário antes de enviar.';
      return;
    }

    const novaAvaliacao = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      nome: usuario.nome || 'Cliente',
      celular: usuario.celular || '',
      foto: usuario.foto || '',
      nota: notaSelecionada,
      comentario,
      dataAvaliacao: new Date().toISOString()
    };

    btnEnviar.disabled = true;

    try {
      const avaliacaoRemota = await adicionarAvaliacaoRemota(novaAvaliacao);
      const proximaLista = [...avaliacoesCache, avaliacaoRemota || novaAvaliacao];
      const { listaFinal } = await salvarAvaliacoes(proximaLista);
      avaliacoesCache = listaFinal;

      comentarioInput.value = '';
      notaSelecionada = 0;
      renderizarHearts();
      renderizarAvaliacoes();
      feedback.textContent = avaliacaoRemota
        ? 'Avaliação publicada para todos com sucesso. Obrigado!'
        : 'Avaliação salva neste dispositivo. Conecte a API para publicar para todos.';
    } finally {
      btnEnviar.disabled = false;
    }
  });

  document.addEventListener('casamelo-auth-change', () => {
    atualizarEstadoFormulario();
    renderizarAvaliacoes();
  });

  window.addEventListener('hashchange', () => {
    ativarAbaExperiencia(window.location.hash === '#visao-geral' ? 'visao-geral' : 'comentarios');
  });

  const iniciarAvaliacoes = async () => {
    ativarAbaExperiencia(window.location.hash === '#visao-geral' ? 'visao-geral' : 'comentarios');
    renderizarHearts();
    atualizarEstadoFormulario();

    const avaliacoesLocais = carregarAvaliacoesLocais();
    const avaliacoesRemotas = await carregarAvaliacoesRemotas();
    avaliacoesCache = mesclarAvaliacoes(avaliacoesLocais, avaliacoesRemotas);
    salvarAvaliacoesLocais(avaliacoesCache);
    renderizarAvaliacoes();
  };

  iniciarAvaliacoes();
})();
