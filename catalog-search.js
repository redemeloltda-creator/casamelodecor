<script>
(function () {

  const produtosCatalogo = [

    { nome: 'VASO VIDRO 30CM AZUL DOURADO', material: 'Vidro', categoria: 'Vaso Decorativo', imagem: '186.jpeg', pagina: 'catalogo vaso decorativo.html', link: 'https://wa.me/p/26366231643027129/553899140400' },
    { nome: 'VASO CRISTAL 41CM DUBIOS COM PE AMBAR', material: 'Cristal', categoria: 'Vaso Decorativo', imagem: '4096.jpeg', pagina: 'catalogo vaso decorativo.html', link: 'https://wa.me/p/25828392396817993/553899140400' },
    { nome: 'LUMINARIA LED 34CM WOLFF SOMBRIA', material: 'Metal', categoria: 'Luminária', imagem: '7895730618297.png', pagina: 'catalogo luminaria.html', link: 'https://wa.me/p/26467765196161729/553899140400' },
    { nome: 'PORTA RETRATO 10X15CM ARABESCO DOURADO', material: 'Poliresina', categoria: 'Porta-retratos', imagem: '7899865438393-1.jpeg', pagina: 'catalogo porta retrato.html', link: 'https://wa.me/p/26458578643765490/553899140400' },
    { nome: 'Quadro Decorativo', material: 'Madeira', categoria: 'Quadro Decorativo', imagem: 'quadro.jpg', pagina: 'catalogo quadro decorativo.html', link: 'https://wa.me/5538999140400?text=Tenho%20interesse%20no%20Quadro%20Decorativo' }

  ];

  const normalizarTexto = (texto) => texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sinonimos = {
    vasos: 'vaso',
    vidros: 'vidro',
    luminarias: 'luminaria',
    retratos: 'retrato',
    quadros: 'quadro',
    porta: 'porta'
  };

  const tokenizar = (texto) => normalizarTexto(texto)
    .split(' ')
    .filter(Boolean)
    .map((token) => sinonimos[token] || token);

  const prepararProduto = (produto) => ({
    ...produto,
    textoBusca: tokenizar(`${produto.nome} ${produto.material} ${produto.categoria}`).join(' ')
  });

  const produtosPreparados = produtosCatalogo.map(prepararProduto);

  const filtrarProdutos = (termo) => {
    const tokensBusca = tokenizar(termo);
    if (!tokensBusca.length) return [];

    return produtosPreparados.filter((produto) =>
      tokensBusca.every((token) => produto.textoBusca.includes(token))
    );
  };

  const input = document.getElementById('busca-produto');
  const listaProdutos = document.querySelectorAll('.produto');
  const resultadosCatalogo = document.getElementById('resultados-catalogo');
  const mensagemSemResultados = document.getElementById('sem-resultados');

  if (!input || !resultadosCatalogo || !mensagemSemResultados) {
    return;
  }

  input.addEventListener('input', (evento) => {
    const termo = evento.target.value.trim();
    const resultados = filtrarProdutos(termo);

    if (!termo) {
      listaProdutos.forEach((produto) => {
        produto.style.display = '';
      });
      resultadosCatalogo.innerHTML = '';
      mensagemSemResultados.hidden = true;
      return;
    }

    listaProdutos.forEach((produto) => {
      produto.style.display = 'none';
    });

    if (!resultados.length) {
      resultadosCatalogo.innerHTML = '';
      mensagemSemResultados.textContent = 'Nenhum produto encontrado no catálogo para esta busca.';
      mensagemSemResultados.hidden = false;
      return;
    }

    mensagemSemResultados.hidden = true;

    resultadosCatalogo.innerHTML = resultados.map((produto) => `
      <a class="resultado-link" href="${produto.link || produto.pagina}" target="_blank">
        <article class="resultado-item">
          <img class="resultado-thumb" src="${produto.imagem}" alt="${produto.nome}">
          <div class="resultado-detalhes">
            <h4>${produto.nome}</h4>
            <p><strong>Categoria:</strong> ${produto.categoria}</p>
            <p><strong>Material:</strong> ${produto.material}</p>
            <span class="resultado-cta">Comprar agora</span>
          </div>
        </article>
      </a>
    `).join('');
  });

})();
</script>