import { cartStore } from './cart-store.js';

(function () {
  const headerTopo = document.querySelector('.header-topo');
  if (!headerTopo) return;

  if (document.getElementById('authModal')) {
    return;
  }

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
          <div class="carrinho-painel-topo">
            <p class="carrinho-titulo">Seu carrinho</p>
            <button type="button" class="carrinho-limpar" id="carrinhoLimpar">Limpar</button>
          </div>
          <ul class="carrinho-lista" id="carrinhoLista"></ul>
          <p class="carrinho-vazio" id="carrinhoVazio">Seu carrinho está vazio.</p>
          <div class="carrinho-resumo" id="carrinhoResumo" hidden>
            <span id="carrinhoQuantidadeTotal">0 itens</span>
          </div>
          <a id="carrinhoComprarTudo" class="carrinho-item-comprar carrinho-comprar-tudo" hidden target="_blank" rel="noopener noreferrer">Comprar itens do carrinho</a>
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
  const carrinhoQuantidadeTotal = document.getElementById('carrinhoQuantidadeTotal');
  const carrinhoResumo = document.getElementById('carrinhoResumo');
  const carrinhoComprarTudo = document.getElementById('carrinhoComprarTudo');
  const carrinhoLimpar = document.getElementById('carrinhoLimpar');

  if (!carrinhoMenu || !carrinhoBotao || !carrinhoPainel || !carrinhoContador || !carrinhoLista || !carrinhoVazio || !carrinhoQuantidadeTotal || !carrinhoResumo || !carrinhoComprarTudo || !carrinhoLimpar) {
    return;
  }

  const montarLinkWhatsapp = (itens) => {
    const mensagem = [
      'Olá! Quero comprar os itens do meu carrinho:',
      ...itens.map((item, i) => `${i + 1}. ${item.nome || 'Produto'} — qtd: ${item.quantidade}${item.preco ? ` — ${item.preco}` : ''}`)
    ].join('\n');

    carrinhoComprarTudo.href = `https://wa.me/5538999140400?text=${encodeURIComponent(mensagem)}`;
  };

  const criarControleQuantidade = (item) => {
    const controle = document.createElement('div');
    controle.className = 'carrinho-quantidade';

    const menos = document.createElement('button');
    menos.type = 'button';
    menos.className = 'carrinho-quantidade-botao';
    menos.textContent = '−';
    menos.setAttribute('aria-label', `Diminuir quantidade de ${item.nome}`);
    menos.addEventListener('click', () => cartStore.atualizarQuantidade(item.id, item.quantidade - 1));

    const valor = document.createElement('span');
    valor.className = 'carrinho-quantidade-valor';
    valor.textContent = String(item.quantidade);

    const mais = document.createElement('button');
    mais.type = 'button';
    mais.className = 'carrinho-quantidade-botao';
    mais.textContent = '+';
    mais.setAttribute('aria-label', `Aumentar quantidade de ${item.nome}`);
    mais.addEventListener('click', () => cartStore.atualizarQuantidade(item.id, item.quantidade + 1));

    controle.appendChild(menos);
    controle.appendChild(valor);
    controle.appendChild(mais);

    return controle;
  };

  const criarLinhaItem = (item) => {
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
    remover.addEventListener('click', () => cartStore.removerItem(item.id));

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
    acoes.appendChild(criarControleQuantidade(item));
    acoes.appendChild(comprarItem);
    linha.appendChild(topo);
    linha.appendChild(preco);
    linha.appendChild(acoes);

    return linha;
  };

  const atualizarCarrinho = () => {
    const itens = cartStore.lerCarrinho();
    const totalItens = cartStore.quantidadeTotal(itens);

    carrinhoContador.textContent = String(totalItens);
    carrinhoMenu.hidden = false;
    carrinhoLista.innerHTML = '';

    if (!itens.length) {
      carrinhoVazio.hidden = false;
      carrinhoResumo.hidden = true;
      carrinhoComprarTudo.hidden = true;
      carrinhoComprarTudo.removeAttribute('href');
      return;
    }

    carrinhoVazio.hidden = true;
    carrinhoResumo.hidden = false;
    carrinhoQuantidadeTotal.textContent = `${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`;

    itens
      .slice()
      .sort((a, b) => (new Date(b.atualizadoEm || b.criadoEm)).getTime() - (new Date(a.atualizadoEm || a.criadoEm)).getTime())
      .forEach((item) => {
        carrinhoLista.appendChild(criarLinhaItem(item));
      });

    montarLinkWhatsapp(itens);
    carrinhoComprarTudo.hidden = false;
  };

  carrinhoBotao.addEventListener('click', () => {
    const abrir = carrinhoPainel.hidden;
    carrinhoPainel.hidden = !abrir;
    carrinhoBotao.setAttribute('aria-expanded', String(abrir));
  });

  carrinhoLimpar.addEventListener('click', () => {
    cartStore.limparCarrinho();
  });

  document.addEventListener('click', (evento) => {
    if (carrinhoMenu.contains(evento.target)) return;
    carrinhoPainel.hidden = true;
    carrinhoBotao.setAttribute('aria-expanded', 'false');
  });

  window.addEventListener('storage', (evento) => {
    if (evento.key === cartStore.CHAVE_CARRINHO) atualizarCarrinho();
  });

  document.addEventListener(cartStore.CART_EVENT, atualizarCarrinho);

  cartStore.hidratarCarrinhoRemoto().finally(atualizarCarrinho);
})();
