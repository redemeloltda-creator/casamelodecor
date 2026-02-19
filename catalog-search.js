(function () {
  const normalizar = (texto) =>
    (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const mapaSinonimos = {
    vasos: 'vaso',
    vidros: 'vidro',
    retratos: 'retrato',
    luminarias: 'luminaria',
    quadros: 'quadro',
    metalico: 'metal',
    metalica: 'metal',
    plastico: 'plastico',
    dourada: 'dourado',
    douradas: 'dourado'
  };

  const tokenizar = (texto) =>
    normalizar(texto)
      .split(' ')
      .filter(Boolean)
      .map((token) => mapaSinonimos[token] || token);

  const campoBusca =
    document.getElementById('busca-produto') ||
    document.getElementById('busca-produto-home') ||
    document.getElementById('campoBusca');

  if (!campoBusca) return;

  const cards = Array.from(document.querySelectorAll('.produtos .produto'));

  if (!cards.length) return;

  const resultadosContainer =
    document.getElementById('resultados-catalogo') ||
    document.getElementById('resultados-home') ||
    document.getElementById('resultadosBusca');

  const semResultados =
    document.getElementById('sem-resultados') ||
    document.getElementById('sem-resultados-home');

  const produtos = cards.map((card) => {
    const nome = card.querySelector('h3')?.textContent?.trim() || '';
    const descricao = card.querySelector('p')?.textContent?.trim() || '';
    const link = card.querySelector('a')?.getAttribute('href') || '#';
    const imagem = card.querySelector('img')?.getAttribute('src') || '';

    return {
      nome,
      descricao,
      link,
      imagem,
      busca: tokenizar(`${nome} ${descricao}`).join(' ')
    };
  });

  const renderizarResultados = (lista) => {
    if (!resultadosContainer) return;

    if (!lista.length) {
      resultadosContainer.innerHTML = '';
      return;
    }

    resultadosContainer.innerHTML = lista
      .map(
        (produto) => `
        <a class="resultado-link" href="${produto.link}">
          <div class="resultado-item">
            <img class="resultado-thumb" src="${produto.imagem}" alt="${produto.nome}">
            <div class="resultado-detalhes">
              <h4>${produto.nome}</h4>
              <p>${produto.descricao}</p>
              <span>Ver catálogo</span>
            </div>
          </div>
        </a>
      `
      )
      .join('');
  };

  campoBusca.addEventListener('input', function () {
    const termo = this.value;
    const tokens = tokenizar(termo);

    if (!tokens.length) {
      cards.forEach((card) => card.classList.remove('oculto'));
      if (resultadosContainer) resultadosContainer.innerHTML = '';
      if (semResultados) semResultados.hidden = true;
      return;
    }

    const filtrados = produtos.filter((produto) =>
      tokens.every((token) => produto.busca.includes(token))
    );

    cards.forEach((card) => card.classList.add('oculto'));
    renderizarResultados(filtrados);

    if (semResultados) {
      semResultados.hidden = filtrados.length > 0;
    }
  });
})();
