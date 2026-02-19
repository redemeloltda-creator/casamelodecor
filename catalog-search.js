(function () {
  const PRODUTOS_CATALOGO = [
    { nome: 'VASO VIDRO 30CM AZUL DOURADO', categoria: 'Vaso Decorativo', material: 'Vidro', marca: 'Royal', tamanho: '30cm', imagem: '186.jpeg', link: 'https://wa.me/p/26366231643027129/553899140400' },
    { nome: 'VASO CRISTAL 41CM DUBIOS COM PE AMBAR', categoria: 'Vaso Decorativo', material: 'Cristal', marca: 'Fullfit', tamanho: '41cm', imagem: '4096.jpeg', link: 'https://wa.me/p/25828392396817993/553899140400' },
    { nome: 'VASO VIDRO GRILLO 12,5CM OURO', categoria: 'Vaso Decorativo', material: 'Vidro', marca: 'Grillo', tamanho: '12,5cm', imagem: '5257.jpeg', link: 'https://wa.me/p/26136998852616452/553899140400' },
    { nome: 'VASO BOJO CERAMICA 28CM G CAFE FOSCO', categoria: 'Vaso Decorativo', material: 'Cerâmica', marca: 'Decorine', tamanho: '28cm', imagem: '5960.jpeg', link: 'https://wa.me/p/25977388951869561/553899140400' },
    { nome: 'VASO CERAMICA FUNIL MOSTARDA FOSCO', categoria: 'Vaso Decorativo', material: 'Cerâmica', marca: 'Decorine', tamanho: '17,5cm', imagem: '5968.jpeg', link: 'https://wa.me/p/26595200300072948/553899140400' },
    { nome: 'VASO POTE ESTILO COM TRIPE MADAGAS', categoria: 'Vaso Decorativo', material: 'Cerâmica', marca: 'Decorine', tamanho: '19,5cm', imagem: '5973.jpeg', link: 'https://wa.me/p/26213996851623500/553899140400' },
    { nome: 'VASO JARRO G TERRACOTA FOSCO TEXTURA', categoria: 'Vaso Decorativo', material: 'Cerâmica', marca: 'Decorine', tamanho: '29cm', imagem: '5979.jpeg', link: 'https://wa.me/p/34239974258949721/553899140400' },
    { nome: 'VASO VIDRO 36,5CM ADELY COMPE', categoria: 'Vaso Decorativo', material: 'Vidro', marca: 'Adely', tamanho: '36cm', imagem: '6679.jpeg', link: 'https://wa.me/p/26489684963983293/553899140400' },
    { nome: 'LUMINARIA LED 34CM WOLFF SOMBRIA', categoria: 'Luminária', material: 'Metal', marca: 'Wolff', tamanho: '34cm', imagem: '7895730618297.png', link: 'https://wa.me/p/26467765196161729/553899140400' },
    { nome: 'LUMINARIA GAIOLA PASSARO LED 22CM', categoria: 'Luminária', material: 'Metal', marca: 'GiftHome', tamanho: '22cm', imagem: '7891100064824.jpeg', link: 'https://wa.me/p/25898652066439804/553899140400' },
    { nome: 'LUMINARIA LED MESA CHARTI CRISTAL 26CM', categoria: 'Luminária', material: 'Plástico', marca: 'Charti', tamanho: '26cm', imagem: '6991984042756.jpeg', link: 'https://wa.me/p/25601884226179112/553899140400' },
    { nome: 'LUMINARIA LED PILHA 24CM', categoria: 'Luminária', material: 'Plástico', marca: 'Planeta', tamanho: '24cm', imagem: '7891100060635.png', link: 'https://wa.me/p/26142230972131933/553899140400' },
    { nome: 'QUADRO DECORATIVO', categoria: 'Quadro Decorativo', material: 'Madeira', marca: 'Casa Melo Decor', tamanho: 'Único', imagem: 'quadro.jpg', link: 'https://wa.me/5538999140400?text=Tenho%20interesse%20no%20Quadro%20Decorativo' },
    { nome: 'PORTA RETRATO 10X15CM ARABESCO DOURADO', categoria: 'Porta-retrato', material: 'Poliresina', marca: 'Adely', tamanho: '15x19,5x5cm', imagem: '7899865438393-1.jpeg', link: 'https://wa.me/p/26458578643765490/553899140400' },
    { nome: 'PORTA RETRATO 10X15CM ANIMAIS', categoria: 'Porta-retrato', material: 'Poliresina', marca: 'Royal', tamanho: '10x15cm', imagem: '7895730602494.jpeg', link: 'https://wa.me/p/26016942624599737/553899140400' },
    { nome: 'PORTA RETRATO METAL 10X15 LY C/PALHA PRETO', categoria: 'Porta-retrato', material: 'Metal', marca: 'Lyor', tamanho: '10x15cm', imagem: '7899768056359.jpeg', link: 'https://wa.me/p/25763654979984571/553899140400' },
    { nome: 'PORTA RETRATO 10X15CM FOLHA GINKGO', categoria: 'Porta-retrato', material: 'Poliresina', marca: 'Adely', tamanho: '10x15cm', imagem: '7899865438355.jpeg', link: 'https://wa.me/p/33889963340647937/553899140400' },
    { nome: 'PORTO RETRATO MDF 15X20CM LY TEXTURA', categoria: 'Porta-retrato', material: 'MDF', marca: 'Lyor', tamanho: '15x20cm', imagem: '7908323304894.jpeg', link: 'https://wa.me/p/25759645040370999/553899140400' },
    { nome: 'PORTA RETRATO CERTIFICADO A4', categoria: 'Porta-retrato', material: 'Plástico', marca: 'Livon', tamanho: 'A4', imagem: '7908501007395.png', link: 'https://wa.me/p/25838430742479444/553899140400' },
    { nome: 'PORTA RETRATO CERTIFICADO A4 MD FWB', categoria: 'Porta-retrato', material: 'Madeira', marca: 'FWB', tamanho: 'A4', imagem: '7908888900838.png', link: 'https://wa.me/p/33842363765411127/553899140400' },
    { nome: 'PORTA RETRATO PLAS 10X15CM NEW DALIA', categoria: 'Porta-retrato', material: 'Plástico', marca: 'Newwey', tamanho: '10x15cm', imagem: '7899865438355.jpeg', link: 'https://wa.me/p/33842363765411127/553899140400' }
  ];

  const normalizarTexto = (texto) => texto
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

  const tokenizar = (texto) => normalizarTexto(texto)
    .split(' ')
    .filter(Boolean)
    .map((token) => mapaSinonimos[token] || token);

  const produtosPreparados = PRODUTOS_CATALOGO.map((produto) => ({
    ...produto,
    busca: tokenizar([
      produto.nome,
      produto.categoria,
      `material ${produto.material}`,
      `marca ${produto.marca}`,
      `tamanho ${produto.tamanho}`
    ].join(' ')).join(' ')
  }));

  const filtrarProdutos = (termoBusca) => {
    const tokens = tokenizar(termoBusca);
    if (!tokens.length) return [];

    return produtosPreparados.filter((produto) =>
      tokens.every((token) => produto.busca.includes(token))
    );
  };

  const montarCard = (produto) => `
    <article class="resultado-item">
      <img class="resultado-thumb" src="${produto.imagem}" alt="${produto.nome}">
      <div class="resultado-detalhes">
        <h4>${produto.nome}</h4>
        <p><strong>Categoria:</strong> ${produto.categoria}</p>
        <p><strong>Material:</strong> ${produto.material} | <strong>Marca:</strong> ${produto.marca}</p>
        <p><strong>Tamanho:</strong> ${produto.tamanho}</p>
        <a class="resultado-cta" href="${produto.link}" target="_blank" rel="noopener noreferrer">Ver produto</a>
      </div>
    </article>
  `;

  const iniciarBusca = ({ inputId, resultadosId, vazioId, cardsSelector }) => {
    const inputBusca = document.getElementById(inputId);
    const areaResultados = document.getElementById(resultadosId);
    const mensagemSemResultados = document.getElementById(vazioId);
    const cards = cardsSelector ? document.querySelectorAll(cardsSelector) : [];

    if (!inputBusca || !areaResultados || !mensagemSemResultados) return;

    inputBusca.addEventListener('input', (event) => {
      const termo = event.target.value.trim();

      if (!termo) {
        areaResultados.innerHTML = '';
        mensagemSemResultados.hidden = true;
        cards.forEach((card) => {
          card.style.display = '';
        });
        return;
      }

      const resultados = filtrarProdutos(termo);
      cards.forEach((card) => {
        card.style.display = 'none';
      });

      if (!resultados.length) {
        areaResultados.innerHTML = '';
        mensagemSemResultados.hidden = false;
        mensagemSemResultados.textContent = 'Nenhum produto encontrado. Tente nome, material, marca ou tamanho.';
        return;
      }

      mensagemSemResultados.hidden = true;
      areaResultados.innerHTML = resultados.map(montarCard).join('');
    });
  };

  iniciarBusca({
    inputId: 'busca-produto',
    resultadosId: 'resultados-catalogo',
    vazioId: 'sem-resultados',
    cardsSelector: '.produto'
  });

  iniciarBusca({
    inputId: 'busca-produto-home',
    resultadosId: 'resultados-home',
    vazioId: 'sem-resultados-home',
    cardsSelector: '.produtos .produto'
  });
})();
