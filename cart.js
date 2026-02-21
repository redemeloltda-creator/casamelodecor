(function () {
  const CHAVE_CARRINHO = 'casaMeloCarrinho';

  const lerCarrinho = () => {
    try {
      const dados = JSON.parse(localStorage.getItem(CHAVE_CARRINHO));
      return Array.isArray(dados) ? dados : [];
    } catch (erro) {
      return [];
    }
  };

  const salvarCarrinho = (itens) => {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
    document.dispatchEvent(new Event('casamelo-cart-change'));
  };

  const adicionarItem = (produto) => {
    const carrinho = lerCarrinho();
    carrinho.push({ ...produto, quantidade: 1, adicionadoEm: new Date().toISOString() });
    salvarCarrinho(carrinho);
  };

  const mostrarConfirmacao = (nomeProduto) => {
    const avisoAnterior = document.querySelector('.cart-toast');
    if (avisoAnterior) avisoAnterior.remove();

    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = `${nomeProduto} adicionado ao carrinho.`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('visivel');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('visivel');
      setTimeout(() => toast.remove(), 250);
    }, 1800);
  };

  const criarBotaoCarrinho = (card) => {
    const nome = card.querySelector('h3')?.textContent?.trim();
    const preco = card.querySelector('.price')?.textContent?.trim();
    const imagem = card.querySelector('img')?.getAttribute('src') || '';
    const linkCompra = card.querySelector('.btn-whatsapp')?.closest('a')?.getAttribute('href') || '';

    if (!nome) return null;

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'btn-carrinho';
    botao.textContent = 'Adicionar ao carrinho';

    botao.addEventListener('click', () => {
      adicionarItem({ nome, preco, imagem, pagina: window.location.pathname, linkCompra });
      mostrarConfirmacao(nome);
    });

    return botao;
  };

  const montarAcoesProduto = () => {
    const cards = document.querySelectorAll('.grid .card');

    cards.forEach((card) => {
      const cardContent = card.querySelector('.card-content');
      const botaoWhatsApp = card.querySelector('.btn-whatsapp');
      const linkWhatsApp = botaoWhatsApp ? botaoWhatsApp.closest('a') : null;

      if (!cardContent || !linkWhatsApp || !botaoWhatsApp || cardContent.querySelector('.acoes-produto')) {
        return;
      }

      const containerAcoes = document.createElement('div');
      containerAcoes.className = 'acoes-produto';

      const botaoCarrinho = criarBotaoCarrinho(card);
      if (!botaoCarrinho) return;

      linkWhatsApp.parentNode.insertBefore(containerAcoes, linkWhatsApp);
      containerAcoes.appendChild(linkWhatsApp);
      containerAcoes.appendChild(botaoCarrinho);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montarAcoesProduto);
  } else {
    montarAcoesProduto();
  }
})();
