(function () {
  const produtosCatalogo = [
    {
      nome: 'VASO VIDRO 30CM AZUL DOURADO',
      categoria: 'Vaso Decorativo',
      material: 'Vidro',
      marca: 'Royal',
      tamanho: '30cm',
      imagem: '186.jpeg',
      link: 'https://wa.me/p/26366231643027129/553899140400'
    },
    {
      nome: 'VASO CRISTAL 41CM DUBIOS COM PE AMBAR',
      categoria: 'Vaso Decorativo',
      material: 'Cristal',
      marca: 'Fullfit',
      tamanho: '41cm',
      imagem: '4096.jpeg',
      link: 'https://wa.me/p/25828392396817993/553899140400'
    },
    {
      nome: 'VASO VIDRO GRILLO 12,5CM OURO',
      categoria: 'Vaso Decorativo',
      material: 'Vidro',
      marca: 'Grillo',
      tamanho: '12,5cm',
      imagem: '5257.jpeg',
      link: 'https://wa.me/p/26136998852616452/553899140400'
    },
    {
      nome: 'VASO BOJO CERAMICA 28CM G CAFE FOSCO',
      categoria: 'Vaso Decorativo',
      material: 'Cerâmica',
      marca: 'Decorine',
      tamanho: '28cm',
      imagem: '5960.jpeg',
      link: 'https://wa.me/p/25977388951869561/553899140400'
    },
    {
      nome: 'LUMINARIA LED 34CM WOLFF SOMBRIA',
      categoria: 'Luminária',
      material: 'Metal',
      marca: 'Wolff',
      tamanho: '34cm',
      imagem: '7895730618297.png',
      link: 'https://wa.me/p/26467765196161729/553899140400'
    },
    {
      nome: 'PORTA RETRATO 10X15CM ARABESCO DOURADO',
      categoria: 'Porta-retrato',
      material: 'Poliresina',
      marca: 'Adely',
      tamanho: '10x15cm',
      imagem: '7899865438393-1.jpeg',
      link: 'https://wa.me/p/26458578643765490/553899140400'
    },
    {
      nome: 'PORTA RETRATO 10X15CM ANIMAIS',
      categoria: 'Porta-retrato',
      material: 'Poliresina',
      marca: 'Royal',
      tamanho: '10x15cm',
      imagem: '7895730602494.jpeg',
      link: 'https://wa.me/p/26016942624599737/553899140400'
    },
    {
      nome: 'PORTA RETRATO METAL 10X15 LY C/PALHA PRETO',
      categoria: 'Porta-retrato',
      material: 'Metal',
      marca: 'Lyor',
      tamanho: '10x15cm',
      imagem: '7899768056359.jpeg',
      link: 'https://wa.me/p/25763654979984571/553899140400'
    },
    {
      nome: 'PORTA RETRATO 10X15CM FOLHA GINKGO',
      categoria: 'Porta-retrato',
      material: 'Poliresina',
      marca: 'Adely',
      tamanho: '10x15cm',
      imagem: '7899865438355.jpeg',
      link: 'https://wa.me/p/33889963340647937/553899140400'
    },
    {
      nome: 'QUADRO DECORATIVO',
      categoria: 'Quadro Decorativo',
      material: 'Madeira',
      marca: 'Casa Melo Decor',
      tamanho: 'Único',
      imagem: 'quadro.jpg',
      link: 'https://wa.me/5538999140400?text=Tenho%20interesse%20no%20Quadro%20Decorativo'
    }
  ];

  const inputBusca = document.getElementById('busca-produto');
  const listaCategorias = document.querySelectorAll('.produto');
  const areaResultados = document.getElementById('resultados-catalogo');
  const mensagemSemResultados = document.getElementById('sem-resultados');

  if (!inputBusca || !areaResultados || !mensagemSemResultados) {
    return;
  }

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
    dourada: 'dourado',
    douradas: 'dourado'
  };

  const tokenizar = (texto) => normalizarTexto(texto)
    .split(' ')
    .filter(Boolean)
    .map((token) => mapaSinonimos[token] || token);

  const produtosPreparados = produtosCatalogo.map((produto, indice) => ({
    ...produto,
    id: `produto-${indice + 1}`,
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
    if (!tokens.length) {
      return [];
    }

    return produtosPreparados.filter((produto) =>
      tokens.every((token) => produto.busca.includes(token))
    );
  };

  const renderizarResultados = (resultados) => {
    areaResultados.innerHTML = resultados.map((produto) => `
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
    `).join('');
  };

  inputBusca.addEventListener('input', (event) => {
    const termo = event.target.value.trim();

    if (!termo) {
      areaResultados.innerHTML = '';
      mensagemSemResultados.hidden = true;
      listaCategorias.forEach((categoria) => {
        categoria.style.display = '';
      });
      return;
    }

    const resultados = filtrarProdutos(termo);
    listaCategorias.forEach((categoria) => {
      categoria.style.display = 'none';
    });

    if (!resultados.length) {
      areaResultados.innerHTML = '';
      mensagemSemResultados.hidden = false;
      mensagemSemResultados.textContent = 'Nenhum produto encontrado. Tente pesquisar por nome, material, marca ou tamanho.';
      return;
    }

    mensagemSemResultados.hidden = true;
    renderizarResultados(resultados);
  });
})();
