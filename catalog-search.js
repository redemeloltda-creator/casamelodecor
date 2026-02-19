(function () {
  const produtosCatalogo = [
    { nome: 'VASO VIDRO 30CM AZUL DOURADO', material: 'Vidro', categoria: 'Vaso Decorativo', imagem: '186.jpeg', pagina: 'catalogo vaso decorativo.html', link: 'https://wa.me/p/26366231643027129/553899140400' },
    { nome: 'VASO CRISTAL 41CM DUBIOS COM PE AMBAR', material: 'Cristal', categoria: 'Vaso Decorativo', imagem: '4096.jpeg', pagina: 'catalogo vaso decorativo.html', link: 'https://wa.me/p/25828392396817993/553899140400' },
    { nome: 'VASO VIDRO GRILLO 12,5CM OURO', material: 'Vidro', categoria: 'Vaso Decorativo', imagem: '5257.jpeg', pagina: 'catalogo vaso decorativo.html', link: 'https://wa.me/p/26136998852616452/553899140400' },
    { nome: 'VASO BOJO CERAMICA 28CM G CAFE FOSCO', material: 'Ceramica', categoria: 'Vaso Decorativo', imagem: '5960.jpeg', pagina: 'catalogo vaso decorativo.html', link: 'https://wa.me/p/25977388951869561/553899140400' },
    { nome: 'VASO CERAMICA FUNIL MOSTARDA FOSCO', material: 'Ceramica', categoria: 'Vaso Decorativo', imagem: '5968.jpeg', pagina: 'catalogo vaso decorativo.html', link: 'https://wa.me/p/26595200300072948/553899140400' },
    { nome: 'VASO POTE ESTILO COM TRIPE MADAGAS', material: 'Ceramica', categoria: 'Vaso Decorativo', imagem: '5973.jpeg', pagina: 'catalogo vaso decorativo.html', link: 'https://wa.me/p/26213996851623500/553899140400' },
    { nome: 'VASO JARRO G TERRACOTA FOSCO TEXTURA', material: 'Ceramica', categoria: 'Vaso Decorativo', imagem: '5979.jpeg', pagina: 'catalogo vaso decorativo.html', link: 'https://wa.me/p/34239974258949721/553899140400' },
    { nome: 'VASO VIDRO 36,5CM ADELY COMPE', material: 'Vidro', categoria: 'Vaso Decorativo', imagem: '6679.jpeg', pagina: 'catalogo vaso decorativo.html', link: 'https://wa.me/p/26489684963983293/553899140400' },
    { nome: 'LUMINARIA LED 34CM WOLFF SOMBRIA', material: 'Metal', categoria: 'Luminária', imagem: '7895730618297.png', pagina: 'catalogo luminaria.html', link: 'https://wa.me/p/26467765196161729/553899140400' },
    { nome: 'LUMINARIA GAIOLA PASSARO LED 22CM', material: 'Metal', categoria: 'Luminária', imagem: '7908323304894.jpeg', pagina: 'catalogo luminaria.html', link: 'https://wa.me/p/25898652066439804/553899140400' },
    { nome: 'LUMINARIA LED MESA CHARTI CRISTAL 26CM', material: 'Plastico', categoria: 'Luminária', imagem: '7891100064824.jpeg', pagina: 'catalogo luminaria.html', link: 'https://wa.me/p/25601884226179112/553899140400' },
    { nome: 'LUMINARIA LED PILHA 24CM', material: 'Plastico', categoria: 'Luminária', imagem: '6991984042756.jpeg', pagina: 'catalogo luminaria.html', link: 'https://wa.me/p/26142230972131933/553899140400' },
    { nome: 'PORTA RETRATO 10X15CM ARABESCO DOURADO', material: 'Poliresina', categoria: 'Porta-retratos', imagem: '7899865438393-1.jpeg', pagina: 'catalogo porta retrato.html', link: 'https://wa.me/p/26458578643765490/553899140400' },
    { nome: 'PORTA RETRATO 10X15CM ANIMAIS', material: 'Poliresina', categoria: 'Porta-retratos', imagem: '7895730602494.jpeg', pagina: 'catalogo porta retrato.html', link: 'https://wa.me/p/26016942624599737/553899140400' },
    { nome: 'PORTA RETRATO METAL 10X15 LY C/PALHA PRETO', material: 'Metal', categoria: 'Porta-retratos', imagem: '7899768056359.jpeg', pagina: 'catalogo porta retrato.html', link: 'https://wa.me/p/25763654979984571/553899140400' },
    { nome: 'PORTA RETRATO 10x15CM FOLHA GINKGO', material: 'Poliresina', categoria: 'Porta-retratos', imagem: '7899865438355.jpeg', pagina: 'catalogo porta retrato.html', link: 'https://wa.me/p/33889963340647937/553899140400' },
    { nome: 'PORTO RETRATO MDF 15X20CM LY TEXTURA', material: 'MDF', categoria: 'Porta-retratos', imagem: '7899768052320.jpeg', pagina: 'catalogo porta retrato.html', link: 'https://wa.me/p/25759645040370999/553899140400' },
    { nome: 'PORTA RETRATO CERTIFICADO A4', material: 'Plastico', categoria: 'Porta-retratos', imagem: '7891100060635.png', pagina: 'catalogo porta retrato.html', link: 'https://wa.me/p/25838430742479444/553899140400' },
    { nome: 'PORTA RETRATO CERTIFICADO A4 MD FWB', material: 'Madeira', categoria: 'Porta-retratos', imagem: '7908888900838.png', pagina: 'catalogo porta retrato.html', link: 'https://wa.me/p/33842363765411127/553899140400' },
    { nome: 'PORTA RETRATO PLAS 10X15CM NEW DALIA', material: 'Plastico', categoria: 'Porta-retratos', imagem: '7908501007395.png', pagina: 'catalogo porta retrato.html', link: 'https://wa.me/p/33842363765411127/553899140400' },
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
    quadros: 'quadro'
  };

  const tokenizar = (texto) => normalizarTexto(texto)
    .split(' ')
    .filter(Boolean)
    .map((token) => sinonimos[token] || token);

  const produtosPreparados = produtosCatalogo.map((produto) => ({
    ...produto,
    textoBusca: tokenizar(`${produto.nome} ${produto.material} ${produto.categoria}`).join(' ')
  }));

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
      <a class="resultado-link" href="${produto.link || produto.pagina}" target="_blank" rel="noopener noreferrer" aria-label="Abrir produto ${produto.nome}">
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
