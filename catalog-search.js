(function () {
  const LIMITE_RESULTADOS = 8;

  /* =========================
     NORMALIZAÇÃO E TOKENIZAÇÃO
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

  const cards = Array.from(document.querySelectorAll('.produtos .produto'));
  if (!cards.length) return;

  const categoriaPagina =
    document.querySelector('header h2')
      ?.textContent?.replace('Catálogo de ', '')
      .trim() || 'Produtos';

  /* =========================
     EXTRAÇÃO DE PRODUTO
  ========================== */

  const extrairProdutoDoCard = (card, categoria = categoriaPagina) => {
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

  let produtosPreparados = cards.map((card) =>
    extrairProdutoDoCard(card)
  );

  const paginaAtual =
    window.location.pathname.split('/').pop() || 'index.html';

  /* =========================
     CARREGAR PRODUTOS EXTRAS (HOME)
  ========================== */

  const carregarProdutosExtrasHome = async () => {
    if (paginaAtual !== 'index.html' && paginaAtual !== '') return;

    const paginasCatalogo = [
      { arquivo: 'presentes.html', categoria: 'Presentes' },
      { arquivo: 'cozinha.html', categoria: 'Cozinha' },
      { arquivo: 'organizacao.html', categoria: 'Organização' }
    ];

    const produtosExtras = [];

    for (const pagina of paginasCatalogo) {
      try {
        const resposta = await fetch(pagina.arquivo);
        if (!resposta.ok) continue;

        const html = await resposta.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const cardsCatalogo =
          doc.querySelectorAll('.produtos .produto');

        cardsCatalogo.forEach((card) => {
          produtosExtras.push(
            extrairProdutoDoCard(card, pagina.categoria)
          );
        });
      } catch (_erro) {
        // Se falhar, mantém busca local
      }
    }

    if (produtosExtras.length) {
      produtosPreparados = [
        ...produtosPreparados,
        ...produtosExtras
      ];
    }
  };

  /* =========================
     FILTRO DE BUSCA
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

    resultados
      .slice(0, LIMITE_RESULTADOS)
      .forEach((produto, index) => {
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
    const itens =
      document.querySelectorAll('.resultado-item');

    if (!itens.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      indiceAtivo =
        (indiceAtivo + 1) % itens.length;
      atualizarSelecao(itens);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      indiceAtivo =
        (indiceAtivo - 1 + itens.length) %
        itens.length;
      atualizarSelecao(itens);
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (
        indiceAtivo >= 0 &&
        resultadosAtuais[indiceAtivo]
      ) {
        window.open(
          resultadosAtuais[indiceAtivo].link,
          '_blank'
        );
      }
    }

    if (e.key === 'Escape') {
      resultadosDiv.style.display = 'none';
    }
  });

  function atualizarSelecao(itens) {
    itens.forEach((item) =>
      item.classList.remove('ativo')
    );

    if (itens[indiceAtivo]) {
      itens[indiceAtivo].classList.add('ativo');
    }
  }

  document.addEventListener('click', function (e) {
    const container =
      document.querySelector('.busca-container');

    if (container && !container.contains(e.target)) {
      resultadosDiv.style.display = 'none';
    }
  });

  /* =========================
     INICIALIZAÇÃO
  ========================== */

  (async () => {
    await carregarProdutosExtrasHome();
  })();
})();
