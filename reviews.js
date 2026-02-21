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

  const salvarAvaliacoes = (avaliacoes) => {
    localStorage.setItem(chaveAvaliacoes, JSON.stringify(avaliacoes));
  };

  const coracoes = (nota) => '❤'.repeat(nota);

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

    if (!avaliacoes.length) {
      lista.innerHTML = '<p class="avaliacao-vazia">Ainda não há avaliações. Seja a primeira pessoa a comentar.</p>';
      return;
    }

    lista.innerHTML = avaliacoes
      .slice()
      .reverse()
      .map((avaliacao) => {
        const nome = avaliacao.nome || 'Cliente';
        const texto = avaliacao.comentario || '';
        const nota = Number(avaliacao.nota) || 0;
        return `
          <article class="avaliacao-card">
            <div class="avaliacao-topo">
              <span class="avaliacao-nome">${nome}</span>
              <span class="avaliacao-nota" aria-label="Nota ${nota} de 5">${coracoes(nota)}</span>
            </div>
            <p>${texto}</p>
          </article>
        `;
      })
      .join('');
  };

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
      nome: usuario.nome || 'Cliente',
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

  document.addEventListener('casamelo-auth-change', atualizarEstadoFormulario);

  renderizarHearts();
  renderizarAvaliacoes();
  atualizarEstadoFormulario();
})();
