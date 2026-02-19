<script>
(function () {

  const LIMITE_RESULTADOS = 8;

  const normalizarTexto = (texto) =>
    texto.toLowerCase()
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
      .map(token => mapaSinonimos[token] || token);

  const produtosPreparados = PRODUTOS_CATALOGO.map(produto => ({
    ...produto,
    busca: tokenizar(
      `${produto.nome} ${produto.categoria} ${produto.material} ${produto.marca} ${produto.tamanho}`
    ).join(' ')
  }));

  const filtrarProdutos = (termo) => {
    const tokens = tokenizar(termo);
    if (!tokens.length) return [];

    return produtosPreparados.filter(produto =>
      tokens.every(token => produto.busca.includes(token))
    );
  };

  const campoBusca = document.getElementById('campoBusca');
  const resultadosDiv = document.getElementById('resultadosBusca');

  let indiceAtivo = -1;
  let resultadosAtuais = [];

  const destacarTexto = (texto, termo) => {
    const tokens = tokenizar(termo);
    let resultado = texto;

    tokens.forEach(token => {
      const regex = new RegExp(`(${token})`, 'gi');
      resultado = resultado.replace(regex, '<span class="highlight">$1</span>');
    });

    return resultado;
  };

  const renderizarResultados = (resultados, termo) => {
    resultadosDiv.innerHTML = '';
    indiceAtivo = -1;

    if (!resultados.length) {
      resultadosDiv.innerHTML = '<div class="sem-resultado">Nenhum produto encontrado</div>';
      resultadosDiv.style.display = 'block';
      return;
    }

    resultados.slice(0, LIMITE_RESULTADOS).forEach((produto, index) => {

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

  campoBusca.addEventListener('input', function () {
    const termo = this.value;
    resultadosAtuais = filtrarProdutos(termo);
    renderizarResultados(resultadosAtuais, termo);
  });

  campoBusca.addEventListener('keydown', function (e) {

    const itens = document.querySelectorAll('.resultado-item');

    if (e.key === 'ArrowDown') {
      indiceAtivo++;
      if (indiceAtivo >= itens.length) indiceAtivo = 0;
      atualizarSelecao(itens);
    }

    if (e.key === 'ArrowUp') {
      indiceAtivo--;
      if (indiceAtivo < 0) indiceAtivo = itens.length - 1;
      atualizarSelecao(itens);
    }

    if (e.key === 'Enter') {
      if (indiceAtivo >= 0 && resultadosAtuais[indiceAtivo]) {
        window.open(resultadosAtuais[indiceAtivo].link, '_blank');
      }
    }

  });

  function atualizarSelecao(itens) {
    itens.forEach(item => item.classList.remove('ativo'));
    if (itens[indiceAtivo]) {
      itens[indiceAtivo].classList.add('ativo');
    }
  }

  document.addEventListener('click', function (e) {
    if (!document.querySelector('.busca-container').contains(e.target)) {
      resultadosDiv.style.display = 'none';
    }
  });

})();
</script>
