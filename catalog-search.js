<script>
(function () {

  const produtosCatalogo = [

    { nome: 'VASO VIDRO 30CM AZUL DOURADO', material: 'Vidro', categoria: 'Vaso Decorativo', pagina: 'catalogo vaso decorativo.html', imagem: '186.jpeg', link: 'https://wa.me/p/26366231643027129/553899140400' },
    { nome: 'VASO CRISTAL 41CM DUBIOS COM PE AMBAR', material: 'Cristal', categoria: 'Vaso Decorativo', pagina: 'catalogo vaso decorativo.html', imagem: '4096.jpeg', link: 'https://wa.me/p/25828392396817993/553899140400' },
    { nome: 'VASO VIDRO GRILLO 12,5CM OURO', material: 'Vidro', categoria: 'Vaso Decorativo', pagina: 'catalogo vaso decorativo.html', imagem: '5257.jpeg', link: 'https://wa.me/p/26136998852616452/553899140400' },
    { nome: 'VASO BOJO CERAMICA 28CM G CAFE FOSCO', material: 'Ceramica', categoria: 'Vaso Decorativo', pagina: 'catalogo vaso decorativo.html', imagem: '5960.jpeg', link: 'https://wa.me/p/25977388951869561/553899140400' },
    { nome: 'LUMINARIA LED 34CM WOLFF SOMBRIA', material: 'Metal', categoria: 'Luminária', pagina: 'catalogo luminaria.html', imagem: '7895730618297.png', link: 'https://wa.me/p/26467765196161729/553899140400' },
    { nome: 'QUADRO DECORATIVO', material: 'Madeira', categoria: 'Quadro Decorativo', pagina: 'catalogo quadro decorativo.html', imagem: 'quadro.jpg', link: 'https://wa.me/5538999140400?text=Tenho%20interesse%20no%20Quadro%20Decorativo' },
    { nome: 'PORTA RETRATO 10X15CM ARABESCO DOURADO', material: 'Poliresina', categoria: 'Porta-retratos', pagina: 'catalogo porta retrato.html', imagem: '7899865438393-1.jpeg', link: 'https://wa.me/p/26458578643765490/553899140400' }

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

  const prepararProduto = (produto, indice) => ({
    ...produto,
    id: `produto-${indice}`,
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

  if (!input || !resultadosCatalogo || !mensagemSemResultados) return;

  const renderizarResultados = (resultados) => {
    resultadosCatalogo.innerHTML = resultados.map((produto) => `
      <article class="resultado-item" data-produto-id="${produto.id}">
        <img class="resultado-thumb" src="${produto.imagem}" alt="${produto.nome}">
        <div class="resultado-detalhes">
          <h4>${produto.nome}</h4>
          <p><strong>Categoria:</strong> ${produto.categoria}</p>
          <p><strong>Material:</strong> ${produto.material}</p>
          <a class="resultado-cta" href="${produto.link || produto.pagina}" target="_blank">Ver produto</a>
        </div>
      </article>
    `).join('');
  };

  input.addEventListener('input', (evento) => {
    const termo = evento.target.value.trim();
    const resultados = filtrarProdutos(termo);

    if (!termo) {
      listaProdutos.forEach((produto) => produto.style.display = '');
      resultadosCatalogo.innerHTML = '';
      mensagemSemResultados.hidden = true;
      return;
    }

    listaProdutos.forEach((produto) => produto.style.display = 'none');

    if (!resultados.length) {
      resultadosCatalogo.innerHTML = '';
      mensagemSemResultados.textContent = 'Nenhum produto encontrado no catálogo.';
      mensagemSemResultados.hidden = false;
      return;
    }

    mensagemSemResultados.hidden = true;
    renderizarResultados(resultados);
  });

  resultadosCatalogo.addEventListener('click', (evento) => {
    const card = evento.target.closest('.resultado-item');
    if (!card) return;

    const produto = produtosPreparados.find(p => p.id === card.dataset.produtoId);
    if (!produto) return;

    input.value = produto.nome;
    renderizarResultados([produto]);
  });

})();
</script>