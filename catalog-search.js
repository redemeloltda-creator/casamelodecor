(function () {
  const produtosCatalogo = [
    { nome: 'VASO VIDRO 30CM AZUL DOURADO', material: 'Vidro', categoria: 'Vaso Decorativo', pagina: 'catalogo vaso decorativo.html' },
    { nome: 'VASO CRISTAL 41CM DUBIOS COM PE AMBAR', material: 'Cristal', categoria: 'Vaso Decorativo', pagina: 'catalogo vaso decorativo.html' },
    { nome: 'VASO VIDRO GRILLO 12,5CM OURO', material: 'Vidro', categoria: 'Vaso Decorativo', pagina: 'catalogo vaso decorativo.html' },
    { nome: 'VASO BOJO CERAMICA 28CM G CAFE FOSCO', material: 'Ceramica', categoria: 'Vaso Decorativo', pagina: 'catalogo vaso decorativo.html' },
    { nome: 'VASO CERAMICA FUNIL MOSTARDA FOSCO', material: 'Ceramica', categoria: 'Vaso Decorativo', pagina: 'catalogo vaso decorativo.html' },
    { nome: 'VASO POTE ESTILO COM TRIPE MADAGAS', material: 'Ceramica', categoria: 'Vaso Decorativo', pagina: 'catalogo vaso decorativo.html' },
    { nome: 'VASO JARRO G TERRACOTA FOSCO TEXTURA', material: 'Ceramica', categoria: 'Vaso Decorativo', pagina: 'catalogo vaso decorativo.html' },
    { nome: 'VASO VIDRO 36,5CM ADELY COMPE', material: 'Vidro', categoria: 'Vaso Decorativo', pagina: 'catalogo vaso decorativo.html' },
    { nome: 'LUMINARIA LED 34CM WOLFF SOMBRIA', material: 'Metal', categoria: 'Luminária', pagina: 'catalogo luminaria.html' },
    { nome: 'LUMINARIA GAIOLA PASSARO LED 22CM', material: 'Metal', categoria: 'Luminária', pagina: 'catalogo luminaria.html' },
    { nome: 'LUMINARIA LED MESA CHARTI CRISTAL 26CM', material: 'Plastico', categoria: 'Luminária', pagina: 'catalogo luminaria.html' },
    { nome: 'LUMINARIA LED PILHA 24CM', material: 'Plastico', categoria: 'Luminária', pagina: 'catalogo luminaria.html' },
    { nome: 'PORTA RETRATO 10X15CM ARABESCO DOURADO', material: 'Poliresina', categoria: 'Porta-retratos', pagina: 'catalogo porta retrato.html' },
    { nome: 'PORTA RETRATO 10X15CM ANIMAIS', material: 'Poliresina', categoria: 'Porta-retratos', pagina: 'catalogo porta retrato.html' },
    { nome: 'PORTA RETRATO METAL 10X15 LY C/PALHA PRETO', material: 'Metal', categoria: 'Porta-retratos', pagina: 'catalogo porta retrato.html' },
    { nome: 'PORTA RETRATO 10x15CM FOLHA GINKGO', material: 'Poliresina', categoria: 'Porta-retratos', pagina: 'catalogo porta retrato.html' },
    { nome: 'PORTO RETRATO MDF 15X20CM LY TEXTURA', material: 'MDF', categoria: 'Porta-retratos', pagina: 'catalogo porta retrato.html' },
    { nome: 'PORTA RETRATO CERTIFICADO A4', material: 'Plastico', categoria: 'Porta-retratos', pagina: 'catalogo porta retrato.html' },
    { nome: 'PORTA RETRATO CERTIFICADO A4 MD FWB', material: 'Madeira', categoria: 'Porta-retratos', pagina: 'catalogo porta retrato.html' },
    { nome: 'PORTA RETRATO PLAS 10X15CM NEW DALIA', material: 'Plastico', categoria: 'Porta-retratos', pagina: 'catalogo porta retrato.html' }
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
    porta: 'porta',
    retratos: 'retrato'
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
      <article class="resultado-item">
        <h4>${produto.nome}</h4>
        <p><strong>Categoria:</strong> ${produto.categoria}</p>
        <p><strong>Material:</strong> ${produto.material}</p>
        <a class="botao" href="${produto.pagina}">Ver no catálogo</a>
      </article>
    `).join('');
  });
})();
