(function () {
  const CHAVE_CARRINHO = 'casaMeloCarrinho';
  const supabaseApi = window.CASAMELO_SUPABASE || null;
  const supabaseAtivo = Boolean(supabaseApi?.isConfigured?.());

  const headerTopo = document.querySelector('.header-topo');
  if (!headerTopo) return;

  if (document.getElementById('authModal')) {
    return;
  }

  const lerSessao = () => {
    try {
      return JSON.parse(localStorage.getItem('casamelo_usuario_logado') || 'null');
    } catch (erro) {
      return null;
    }
  };

  const lerCarrinho = () => {
    try {
      const dados = JSON.parse(localStorage.getItem(CHAVE_CARRINHO) || '[]');
      return Array.isArray(dados) ? dados : [];
    } catch (erro) {
      return [];
    }
  };

  const sincronizarCarrinhoRemoto = async (itens) => {
    if (!supabaseAtivo) return;
    const usuario = lerSessao();
    const celular = supabaseApi.normalizarCelular(usuario?.celular);
    if (!celular) return;
    await supabaseApi.salvarCarrinho(celular, itens);
  };

  const hidratarCarrinhoRemoto = async () => {
    if (!supabaseAtivo) return;
    const usuario = lerSessao();
    const celular = supabaseApi.normalizarCelular(usuario?.celular);
    if (!celular) return;

    const carrinhoRemoto = await supabaseApi.carregarCarrinho(celular);
    if (!Array.isArray(carrinhoRemoto) || !carrinhoRemoto.length) return;

    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinhoRemoto));
    document.dispatchEvent(new Event('casamelo-cart-change'));
  };

  const salvarCarrinho = (itens) => {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
    document.dispatchEvent(new Event('casamelo-cart-change'));
    sincronizarCarrinhoRemoto(itens);
  };

  const removerItem = (adicionadoEm) => {
    const itens = lerCarrinho();
    const indice = itens.findIndex((item) => item.adicionadoEm === adicionadoEm);

    if (indice === -1) return;

    itens.splice(indice, 1);
    salvarCarrinho(itens);
  };

  let areaDireita = headerTopo.querySelector('.header-direita');

  if (!areaDireita) {
    areaDireita = document.createElement('div');
    areaDireita.className = 'header-direita';
    headerTopo.appendChild(areaDireita);
  }

  if (!document.getElementById('carrinhoMenu')) {
    areaDireita.insertAdjacentHTML('beforeend', `
      <div class="carrinho-menu" id="carrinhoMenu">
        <button type="button" class="carrinho-botao" id="carrinhoBotao" aria-label="Abrir carrinho" aria-expanded="false">
          <svg class="carrinho-icone" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3.5 5.5h2.4l1.9 8.6a1 1 0 0 0 .98.78h7.96a1 1 0 0 0 .97-.75l1.35-5.23H7.6"></path>
            <circle cx="10.2" cy="18.5" r="1.45"></circle>
            <circle cx="16.6" cy="18.5" r="1.45"></circle>
            <circle class="carrinho-icone-detalhe" cx="18.8" cy="6" r="3.2"></circle>
            <path d="M18.8 4.6v2.8M17.4 6h2.8"></path>
          </svg>
          <span class="carrinho-contador" id="carrinhoContador">0</span>
        </button>
        <div class="carrinho-painel" id="carrinhoPainel" hidden>
          <p class="carrinho-titulo">Produtos no carrinho</p>
          <ul class="carrinho-lista" id="carrinhoLista"></ul>
          <p class="carrinho-vazio" id="carrinhoVazio">Seu carrinho está vazio.</p>
        </div>
      </div>
    `);
  }

  const carrinhoMenu = document.getElementById('carrinhoMenu');
  const carrinhoBotao = document.getElementById('carrinhoBotao');
  const carrinhoPainel = document.getElementById('carrinhoPainel');
  const carrinhoContador = document.getElementById('carrinhoContador');
  const carrinhoLista = document.getElementById('carrinhoLista');
  const carrinhoVazio = document.getElementById('carrinhoVazio');

  if (!carrinhoMenu || !carrinhoBotao || !carrinhoPainel || !carrinhoContador || !carrinhoLista || !carrinhoVazio) {
    return;
  }

  const atualizarBotaoCompra = (itens) => {
    let botaoCompra = document.getElementById('carrinhoComprarTudo');

    if (!botaoCompra) {
      botaoCompra = document.createElement('a');
      botaoCompra.id = 'carrinhoComprarTudo';
      botaoCompra.className = 'carrinho-item-comprar';
      botaoCompra.style.display = 'inline-flex';
      botaoCompra.style.marginTop = '8px';
      botaoCompra.style.width = '100%';
      botaoCompra.style.justifyContent = 'center';
      botaoCompra.target = '_blank';
      botaoCompra.rel = 'noopener noreferrer';
      botaoCompra.textContent = 'Comprar itens do carrinho';
      carrinhoPainel.appendChild(botaoCompra);
    }

    if (!itens.length) {
      botaoCompra.hidden = true;
      botaoCompra.removeAttribute('href');
      return;
    }

    botaoCompra.hidden = false;

    const mensagem = ['Olá! Quero comprar os itens do meu carrinho:', ...itens.map((item, i) => `${i + 1}. ${item.nome || 'Produto'}${item.preco ? ` — ${item.preco}` : ''}`)].join('\n');

    botaoCompra.href = `https://wa.me/5538999140400?text=${encodeURIComponent(mensagem)}`;
  };

  const atualizarCarrinho = () => {
    const itens = lerCarrinho();
    carrinhoContador.textContent = String(itens.length);
    carrinhoMenu.hidden = false;
    carrinhoLista.innerHTML = '';

    if (!itens.length) {
      carrinhoVazio.hidden = false;
      atualizarBotaoCompra([]);
      return;
    }

    carrinhoVazio.hidden = true;

    itens.slice().reverse().forEach((item) => {
      const linha = document.createElement('li');
      linha.className = 'carrinho-item';

      const topo = document.createElement('div');
      topo.className = 'carrinho-item-topo';

      const nome = document.createElement('span');
      nome.className = 'carrinho-item-nome';
      nome.textContent = item.nome || 'Produto sem nome';

      const remover = document.createElement('button');
      remover.type = 'button';
      remover.className = 'carrinho-item-remover';
      remover.textContent = '×';
      remover.setAttribute('aria-label', `Remover ${nome.textContent} do carrinho`);
      remover.addEventListener('click', () => removerItem(item.adicionadoEm));

      const preco = document.createElement('span');
      preco.className = 'carrinho-item-preco';
      preco.textContent = item.preco || 'Preço indisponível';

      const acoes = document.createElement('div');
      acoes.className = 'carrinho-item-acoes';

      const comprarItem = document.createElement('a');
      comprarItem.className = 'carrinho-item-comprar';
      comprarItem.textContent = 'Comprar item';

      const linkCompra = String(item?.linkCompra || '').trim();
      if (linkCompra) {
        comprarItem.href = linkCompra;
        comprarItem.target = '_blank';
        comprarItem.rel = 'noopener noreferrer';
      } else {
        comprarItem.classList.add('desabilitado');
        comprarItem.setAttribute('aria-disabled', 'true');
      }

      topo.appendChild(nome);
      topo.appendChild(remover);
      acoes.appendChild(comprarItem);
      linha.appendChild(topo);
      linha.appendChild(preco);
      linha.appendChild(acoes);
      carrinhoLista.appendChild(linha);
    });

    atualizarBotaoCompra(itens);
  };

  carrinhoBotao.addEventListener('click', () => {
    const abrir = carrinhoPainel.hidden;
    carrinhoPainel.hidden = !abrir;
    carrinhoBotao.setAttribute('aria-expanded', String(abrir));
  });

  document.addEventListener('click', (evento) => {
    if (carrinhoMenu.contains(evento.target)) return;
    carrinhoPainel.hidden = true;
    carrinhoBotao.setAttribute('aria-expanded', 'false');
  });

  window.addEventListener('storage', (evento) => {
    if (evento.key === CHAVE_CARRINHO) atualizarCarrinho();
  });

  document.addEventListener('casamelo-cart-change', atualizarCarrinho);

  hidratarCarrinhoRemoto().finally(atualizarCarrinho);
})();
