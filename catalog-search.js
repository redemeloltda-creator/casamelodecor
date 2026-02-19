(function () {
  const LIMITE_RESULTADOS = 8;

  /* =========================
     NORMALIZAÇÃO
  ========================== */

  const normalizarTexto = (texto) =>
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
    normalizarTexto(texto)
      .split(' ')
      .filter(Boolean)
      .map((token) => mapaSinonimos[token] || token);

  const escaparRegex = (str) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /* =========================
     ELEMENTOS DOM
  ========================== */

  const campoBusca = document.getElementById('campoBusca');
  const resultadosDiv = document.getElementById('resultadosBusca');

  if (!campoBusca || !resultadosDiv) return;

  let produtosPreparados = [];

  /* =========================
     EXTRAÇÃO DE PRODUTO
  ========================== */

  const extrairProdutoDoCard = (card, categoria) => {
    const nome = card.querySelector('h3')?.textContent?.trim() || '';
    const descricao = card.querySelector('p')?.textContent?.trim() || '';
    const link = card.querySelector('a')?.getAttribute('href') || '#';
    const imagem = card.querySelector('img')?.getAttribute('src') || '';

    return {
      nome,
      categoria,
      material: descricao,
      marca: 'Casa Melo Decor',
      tamanho: 'Consulte opções',
      link,
      imagem,
      busca: tokenizar(`${nome} ${categoria} ${descricao}`).join(' ')
    };
  };

  /* =========================
     CARREGAR PRODUTOS DE TODAS AS PÁGINAS
  ========================== */

  const carregarTodosProdutos = async () => {
    const paginasCatalogo = [
      { arquivo: 'index.html', categoria: 'Produtos' },
      { arquivo: 'presentes.html', categoria: 'Presentes' },
      { arquivo: 'cozinha.html', categoria: 'Cozinha' },
      { arquivo: 'organizacao.html', categoria: 'Organização' },
      { arquivo: 'decoracao.html', categoria: 'Decoração' }
    ];

    for (const pagina of paginasCatalogo) {
      try {
        const resposta = await fetch(pagina.arquivo);
        if (!resposta.ok) continue;

        const html = await resposta.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const cards = doc.querySelectorAll('.produtos .produto');

        cards.forEach((card) => {
          produtosPreparados.push(
            extrairProdutoDoCard(card, pagina.categoria)
          );
        });

      } catch (erro) {
        console.warn('Erro ao carregar:', pagina.arquivo);
      }
    }
  };

  /* =========================
     FILTRO
  ========================== */

  const filtrarProdutos = (termo) => {
    const tokens = tokenizar(termo);
    if (!tokens.length) return [];

    return produtosPreparados.filter((produto) =>
      tokens.every((token) =>
        produto.busca.includes(token)
      )
    );
  };

  /* =========================
     RENDERIZAÇÃO
  ========================== */

  let indiceAtivo = -1;
  let resultadosAtuais = [];

  const destacarTexto = (texto, termo) => {
    const tokens = tokenizar(termo);
    let resultado = texto;

    tokens.forEach((token) => {
      const regex = new RegExp(
        `(${escaparRegex(token)})`,
        'gi'
      );
      resultado = resultado.replace(
        regex,
        '<span class="highlight">$1</span>'
      );
    });

    return resultado;
  };

  const renderizarResultados = (resultados, termo) => {
    resultadosDiv.innerHTML = '';
    indiceAtivo = -1;

    if (!resultados.length) {
      resultadosDiv.innerHTML =
        '<div class="sem-resultado">Nenhum produto encontrado</div>';
      resultadosDiv.style.display = 'block';
      return;
    }

    resultados.slice(0, LIMITE_RESULTADOS).forEach((produto) => {
      const div = document.createElement('div');
      div.className = 'resultado-item';

      div.innerHTML = `
        <img src="${produto.imagem}" alt="${produto.nome}">
        <div class="resultado-info">
          <h4>${destacarTexto(produto.nome, termo)}</h4>
          <p>${produto.categoria} | ${produto.material}</p>
          <p>Marca: ${produto.marca} | Tam: ${produto.tamanho}</p>
        </div>
      `;

      div.addEventListener('click', () => {
        window.open(produto.link, '_blank');
      });

      resultadosDiv.appendChild(div);
    });

    resultadosDiv.style.display = 'block';
  };

  /* =========================
     EVENTOS
  ========================== */

  campoBusca.addEventListener('input', function () {
    const termo = this.value;

    if (!termo.trim()) {
      resultadosDiv.style.display = 'none';
      resultadosDiv.innerHTML = '';
      resultadosAtuais = [];
      return;
    }

    resultadosAtuais = filtrarProdutos(termo);
    renderizarResultados(resultadosAtuais, termo);
  });

  campoBusca.addEventListener('keydown', function (e) {
    const itens = document.querySelectorAll('.resultado-item');
    if (!itens.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      indiceAtivo = (indiceAtivo + 1) % itens.length;
      atualizarSelecao(itens);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      indiceAtivo = (indiceAtivo - 1 + itens.length) % itens.length;
      atualizarSelecao(itens);
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (indiceAtivo >= 0 && resultadosAtuais[indiceAtivo]) {
        window.open(resultadosAtuais[indiceAtivo].link, '_blank');
      }
    }

    if (e.key === 'Escape') {
      resultadosDiv.style.display = 'none';
    }
  });

  function atualizarSelecao(itens) {
    itens.forEach((item) => item.classList.remove('ativo'));
    if (itens[indiceAtivo]) {
      itens[indiceAtivo].classList.add('ativo');
    }
  }

  document.addEventListener('click', function (e) {
    const container = document.querySelector('.busca-container');
    if (container && !container.contains(e.target)) {
      resultadosDiv.style.display = 'none';
    }
  });

  /* =========================
     INICIALIZAÇÃO
  ========================== */

  (async () => {
    await carregarTodosProdutos();
  })();
})();
