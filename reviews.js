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
  let notaSelecionada = 0;

  const carregarSessao = () => {
    try {
      return JSON.parse(localStorage.getItem(chaveSessao) || 'null');
    } catch (erro) {
      return null;
    }
  };

  const carregarAvaliacoes = () => {
    try {
      return JSON.parse(localStorage.getItem(chaveAvaliacoes) || '[]');
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

  const salvarAvaliacoes = (avaliacoes) => {
    localStorage.setItem(chaveAvaliacoes, JSON.stringify(avaliacoes));
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
    const avaliacoes = carregarAvaliacoes();
    const usuarios = carregarUsuarios();
    const usuarioLogado = carregarSessao();
    const celularLogado = normalizarCelular(usuarioLogado?.celular);

    if (!avaliacoes.length) {
      lista.innerHTML = '<p class="avaliacao-vazia">Ainda não há avaliações. Seja a primeira pessoa a comentar.</p>';
      return;
    }

    lista.innerHTML = avaliacoes
      .map((avaliacao, indice) => ({ ...avaliacao, indice }))
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
          ? `<button type="button" class="avaliacao-excluir" data-avaliacao-indice="${avaliacao.indice}" aria-label="Excluir comentário de ${escaparHtml(nome)}">Excluir</button>`
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

  lista.addEventListener('click', (evento) => {
    const botaoExcluir = evento.target.closest('[data-avaliacao-indice]');
    if (!botaoExcluir) return;

    const usuario = carregarSessao();
    const indice = Number(botaoExcluir.dataset.avaliacaoIndice);
    const avaliacoes = carregarAvaliacoes();
    const avaliacao = avaliacoes[indice];

    if (!usuario || !avaliacao) return;

    const celularUsuario = normalizarCelular(usuario.celular);
    const celularAutor = normalizarCelular(avaliacao.celular);

    if (!celularUsuario || celularUsuario !== celularAutor) {
      feedback.textContent = 'Você só pode excluir comentários criados por você.';
      return;
    }

    avaliacoes.splice(indice, 1);
    salvarAvaliacoes(avaliacoes);
    renderizarAvaliacoes();
    feedback.textContent = 'Comentário excluído com sucesso.';
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

  form.addEventListener('submit', (evento) => {
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

    const avaliacoes = carregarAvaliacoes();
    avaliacoes.push({
      id: Date.now(),
      nome: usuario.nome || 'Cliente',
      celular: usuario.celular || '',
      foto: usuario.foto || '',
      nota: notaSelecionada,
      comentario
    });

    salvarAvaliacoes(avaliacoes);
    comentarioInput.value = '';
    notaSelecionada = 0;
    renderizarHearts();
    renderizarAvaliacoes();
    feedback.textContent = 'Avaliação enviada com sucesso. Obrigado!';
  });

  document.addEventListener('casamelo-auth-change', () => {
    atualizarEstadoFormulario();
    renderizarAvaliacoes();
  });

  renderizarHearts();
  renderizarAvaliacoes();
  atualizarEstadoFormulario();
})();
