(function () {
  const form = document.getElementById('formAvaliacao');
  const heartsInput = document.getElementById('heartsInput');
  const comentarioInput = document.getElementById('comentarioAvaliacao');
  const feedback = document.getElementById('avaliacaoFeedback');
  const lista = document.getElementById('listaAvaliacoes');
  const btnEnviar = document.getElementById('btnEnviarAvaliacao');
  const btnLogin = document.getElementById('btnLoginAvaliacao');

  if (!form || !heartsInput || !comentarioInput || !feedback || !lista || !btnEnviar || !btnLogin) return;

  const chaveSessao = 'casamelo_usuario_logado';
  const chaveUsuarios = 'casamelo_usuarios';
  const chaveAvaliacoes = 'casamelo_avaliacoes';
  const chavesAvaliacoesLegadas = ['casamelo_comentarios', 'avaliacoes'];
  const endpointAvaliacoesOnline = 'https://jsonblob.com/api/jsonBlob/1342888989686272000';
  const intervaloSincronizacaoMs = 60000;

  let notaSelecionada = 0;
  let avaliacoesCache = [];

  const obterIdAvaliacao = (avaliacao) => {
    const idOriginal = String(avaliacao?.id || '').trim();
    if (idOriginal) return idOriginal;

    const celular = normalizarCelular(avaliacao?.celular);
    return `${celular}-${String(avaliacao?.comentario || '').trim()}`;
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

  const carregarSessao = () => {
    try {
      return JSON.parse(localStorage.getItem(chaveSessao) || 'null');
    } catch (erro) {
      return null;
    }
  };

  const normalizarListaAvaliacoes = (valor) => {
    if (!Array.isArray(valor)) return [];

    return valor.filter((item) => item && typeof item === 'object' && item.comentario);
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

  const carregarUsuarios = () => {
    try {
      return JSON.parse(localStorage.getItem(chaveUsuarios) || '[]');
    } catch (erro) {
      return [];
    }
  };

  const normalizarCelular = (valor) => String(valor || '').replace(/\D/g, '');

  const buscarFotoUsuario = (avaliacao, usuarios) => {
    const fotoAvaliacao = String(avaliacao?.foto || '').trim();
    if (fotoAvaliacao) return fotoAvaliacao;

    const celular = normalizarCelular(avaliacao?.celular);
    if (!celular) return '';

    const usuario = usuarios.find((item) => normalizarCelular(item?.celular) === celular);
    return String(usuario?.foto || '').trim();
  };

  const salvarAvaliacoesLocais = (avaliacoes) => {
    localStorage.setItem(chaveAvaliacoes, JSON.stringify(avaliacoes));

    chavesAvaliacoesLegadas.forEach((chave) => {
      localStorage.setItem(chave, JSON.stringify(avaliacoes));
    });
  };

  const salvarAvaliacoesOnline = async (avaliacoes) => {
    const resposta = await fetch(endpointAvaliacoesOnline, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(avaliacoes)
    });

    if (!resposta.ok) {
      throw new Error('Falha ao salvar avaliações online.');
    }
  };

  const carregarAvaliacoesOnline = async () => {
    const resposta = await fetch(endpointAvaliacoesOnline, {
      cache: 'no-store'
    });

    if (!resposta.ok) {
      throw new Error('Falha ao carregar avaliações online.');
    }

    const dados = await resposta.json();
    return Array.isArray(dados) ? dados : [];
  };

  const salvarComFallback = async (avaliacoes) => {
    avaliacoesCache = avaliacoes;
    salvarAvaliacoesLocais(avaliacoes);

    try {
      await salvarAvaliacoesOnline(avaliacoes);
      return true;
    } catch (erro) {
      feedback.textContent = 'Comentário salvo apenas neste dispositivo. Verifique sua conexão para publicar online.';
      return false;
    }
  };

  const publicarAvaliacoes = async (atualizarLista) => {
    const listaAtual = Array.isArray(atualizarLista) ? atualizarLista : [];

    try {
      const avaliacoesOnline = await carregarAvaliacoesOnline();
      const listaMesclada = mesclarAvaliacoes(avaliacoesOnline, avaliacoesCache, listaAtual);
      await salvarAvaliacoesOnline(listaMesclada);
      avaliacoesCache = listaMesclada;
      salvarAvaliacoesLocais(listaMesclada);
      return { publicouOnline: true, listaFinal: listaMesclada };
    } catch (erro) {
      await salvarComFallback(listaAtual);
      return { publicouOnline: false, listaFinal: listaAtual };
    }
  };

  const sincronizarAvaliacoesOnline = async ({ silencioso = false } = {}) => {
    const avaliacoesOnline = await carregarAvaliacoesOnline();
    avaliacoesCache = avaliacoesOnline;
    salvarAvaliacoesLocais(avaliacoesOnline);
    renderizarAvaliacoes();

    if (!silencioso) {
      feedback.textContent = '';
    }
  };

  const coracoes = (nota) => '❤'.repeat(nota);

  const escaparHtml = (texto) => String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

    const proximaLista = avaliacoesCache.filter((item) => String(item.id) !== idAvaliacao);
    const { publicouOnline, listaFinal } = await publicarAvaliacoes(proximaLista);
    avaliacoesCache = listaFinal;
    renderizarAvaliacoes();

    if (publicouOnline) {
      feedback.textContent = 'Comentário excluído com sucesso.';
    }
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

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const usuario = carregarSessao();
    if (!usuario) {
      feedback.textContent = 'Você precisa estar logado para avaliar.';
      atualizarEstadoFormulario();
      return;
    }

    const comentario = comentarioInput.value.trim();

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
      comentario
    };

    const proximaLista = [...avaliacoesCache, novaAvaliacao];
    const { publicouOnline, listaFinal } = await publicarAvaliacoes(proximaLista);
    avaliacoesCache = listaFinal;

    comentarioInput.value = '';
    notaSelecionada = 0;
    renderizarHearts();
    renderizarAvaliacoes();

    if (publicouOnline) {
      feedback.textContent = 'Avaliação enviada e publicada online com sucesso. Obrigado!';
    }
  });

  document.addEventListener('casamelo-auth-change', () => {
    atualizarEstadoFormulario();
    renderizarAvaliacoes();
  });

  const iniciarAvaliacoes = async () => {
    renderizarHearts();
    atualizarEstadoFormulario();

    const avaliacoesLocais = carregarAvaliacoesLocais();
    avaliacoesCache = avaliacoesLocais;
    renderizarAvaliacoes();

    try {
      await sincronizarAvaliacoesOnline();
    } catch (erro) {
      feedback.textContent = 'Não foi possível sincronizar avaliações online agora. Exibindo comentários deste dispositivo.';
    }

    setInterval(async () => {
      try {
        await sincronizarAvaliacoesOnline({ silencioso: true });
      } catch (erro) {
        // Mantém a última lista disponível para garantir que visitantes continuem vendo comentários.
      }
    }, intervaloSincronizacaoMs);
  };

  iniciarAvaliacoes();
})();
