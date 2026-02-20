(function () {
  const LIMITE_RESULTADOS = 8;

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

  const campoBusca = document.getElementById('campoBusca');
  const resultadosDiv = document.getElementById('resultadosBusca');
  const barraBusca = document.getElementById('barraBusca');
  const botoesBusca = document.querySelectorAll('[data-toggle-busca="true"], .botao-pesquisa');
  const botoesFecharBusca = document.querySelectorAll('[data-close-busca="true"]');

  botoesBusca.forEach((botao) => {
    botao.addEventListener('click', (evento) => {
      evento.preventDefault();

      if (barraBusca) {
        barraBusca.classList.add('aberta');
      }

      botao.classList.add('oculto');

      if (campoBusca) {
        campoBusca.focus();
      }
    });
  });


  botoesFecharBusca.forEach((botaoFechar) => {
    botaoFechar.addEventListener('click', (evento) => {
      evento.preventDefault();
      evento.stopPropagation();

      if (barraBusca) {
        barraBusca.classList.remove('aberta');
      }

      const botaoAbrir = document.querySelector('[data-toggle-busca="true"], .botao-pesquisa');
      if (botaoAbrir) {
        botaoAbrir.classList.remove('oculto');
      }

      if (resultadosDiv) {
        resultadosDiv.style.display = 'none';
        resultadosDiv.innerHTML = '';
      }

      if (campoBusca) {
        campoBusca.value = '';
      }
    });
  });

  if (!campoBusca || !resultadosDiv) return;

  let produtos = [];

  /* =========================
     CARREGAR JSON
  ========================== */

  const carregarProdutos = async () => {
    try {
      const resposta = await fetch('produtos.json');
      produtos = await resposta.json();

      // Criar campo de busca otimizado
      produtos = produtos.map((produto) => ({
        ...produto,
        busca: tokenizar(
          `${produto.nome} ${produto.categoria} ${produto.material}`
        ).join(' ')
      }));
    } catch (erro) {
      console.error('Erro ao carregar produtos.json');
    }
  };

  /* =========================
     FILTRO COM RELEVÂNCIA
  ========================== */

  const filtrarProdutos = (termo) => {
    const tokens = tokenizar(termo);
    if (!tokens.length) return [];

    return produtos
      .map((produto) => {
        let score = 0;

        tokens.forEach((token) => {
          if (normalizarTexto(produto.nome).includes(token)) score += 3;
          if (normalizarTexto(produto.categoria).includes(token)) score += 2;
          if (normalizarTexto(produto.material).includes(token)) score += 1;
        });

        return { ...produto, score };
      })
      .filter((produto) =>
        tokens.every((token) => produto.busca.includes(token))
      )
      .sort((a, b) => b.score - a.score);
  };

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
        window.location.href = produto.link;
      });

      resultadosDiv.appendChild(div);
    });

    resultadosDiv.style.display = 'block';
  };

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
        window.location.href = resultadosAtuais[indiceAtivo].link;
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

  (async () => {
    await carregarProdutos();
  })();
})();
