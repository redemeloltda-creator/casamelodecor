const CHAVE_CARRINHO = 'casaMeloCarrinho';
const CART_EVENT = 'casamelo-cart-change';
const CART_SYNC_COOLDOWN = 450;

const supabaseApi = window.CASAMELO_SUPABASE || null;
const supabaseAtivo = Boolean(supabaseApi?.isConfigured?.());

let ultimoSync = 0;
let syncTimer = null;

const lerSessao = () => {
  try {
    return JSON.parse(localStorage.getItem('casamelo_usuario_logado') || 'null');
  } catch {
    return null;
  }
};

const obterCelularUsuario = () => {
  const usuario = lerSessao();
  return supabaseApi?.normalizarCelular?.(usuario?.celular) || '';
};

const criarIdProduto = (produto = {}) => {
  const base = [
    produto.nome || 'produto',
    produto.preco || '',
    produto.linkCompra || '',
    produto.pagina || ''
  ]
    .join('|')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9|]+/g, '-')
    .replace(/-+/g, '-');

  return base.slice(0, 140);
};

const normalizarQuantidade = (valor) => {
  const n = Number.parseInt(valor, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
};

const normalizarItem = (item = {}) => {
  const nome = String(item.nome || 'Produto sem nome').trim();

  return {
    id: item.id || criarIdProduto(item),
    nome,
    preco: String(item.preco || 'Preço indisponível').trim(),
    imagem: String(item.imagem || '').trim(),
    pagina: String(item.pagina || '').trim(),
    linkCompra: String(item.linkCompra || '').trim(),
    quantidade: normalizarQuantidade(item.quantidade),
    criadoEm: item.criadoEm || item.adicionadoEm || new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
};

const normalizarLista = (dados) => {
  if (!Array.isArray(dados)) return [];

  const mapa = new Map();
  dados.forEach((item) => {
    const normalizado = normalizarItem(item);
    const existente = mapa.get(normalizado.id);

    if (existente) {
      existente.quantidade += normalizado.quantidade;
      existente.atualizadoEm = new Date().toISOString();
      return;
    }

    mapa.set(normalizado.id, normalizado);
  });

  return Array.from(mapa.values());
};

const lerCarrinho = () => {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_CARRINHO) || '[]');
    return normalizarLista(bruto);
  } catch {
    return [];
  }
};

const dispararEvento = () => {
  document.dispatchEvent(new Event(CART_EVENT));
};

const sincronizarCarrinhoRemoto = async (itens) => {
  if (!supabaseAtivo) return;
  const celular = obterCelularUsuario();
  if (!celular) return;

  await supabaseApi.salvarCarrinho(celular, itens);
};

const agendarSync = (itens) => {
  if (!supabaseAtivo) return;

  const agora = Date.now();
  const tempoRestante = Math.max(0, CART_SYNC_COOLDOWN - (agora - ultimoSync));

  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(async () => {
    ultimoSync = Date.now();
    try {
      await sincronizarCarrinhoRemoto(itens);
    } catch (erro) {
      console.warn('Falha ao sincronizar carrinho remoto:', erro);
    }
  }, tempoRestante);
};

const salvarCarrinho = (itens) => {
  const lista = normalizarLista(itens);
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(lista));
  dispararEvento();
  agendarSync(lista);
  return lista;
};

const quantidadeTotal = (itens = lerCarrinho()) => itens.reduce((acc, item) => acc + normalizarQuantidade(item.quantidade), 0);

const adicionarItem = (produto) => {
  const itens = lerCarrinho();
  const novo = normalizarItem(produto);
  const existente = itens.find((item) => item.id === novo.id);

  if (existente) {
    existente.quantidade += 1;
    existente.atualizadoEm = new Date().toISOString();
  } else {
    itens.push(novo);
  }

  return salvarCarrinho(itens);
};

const removerItem = (itemId) => {
  const itens = lerCarrinho();
  const novaLista = itens.filter((item) => item.id !== itemId);
  return salvarCarrinho(novaLista);
};

const atualizarQuantidade = (itemId, quantidade) => {
  const itens = lerCarrinho();
  const item = itens.find((linha) => linha.id === itemId);

  if (!item) return itens;

  if (quantidade <= 0) {
    return removerItem(itemId);
  }

  item.quantidade = normalizarQuantidade(quantidade);
  item.atualizadoEm = new Date().toISOString();
  return salvarCarrinho(itens);
};

const limparCarrinho = () => salvarCarrinho([]);

const hidratarCarrinhoRemoto = async () => {
  if (!supabaseAtivo) return lerCarrinho();
  const celular = obterCelularUsuario();
  if (!celular) return lerCarrinho();

  try {
    const remoto = await supabaseApi.carregarCarrinho(celular);
    if (!Array.isArray(remoto)) return lerCarrinho();

    return salvarCarrinho(remoto);
  } catch (erro) {
    console.warn('Falha ao hidratar carrinho remoto:', erro);
    return lerCarrinho();
  }
};

export const cartStore = {
  CHAVE_CARRINHO,
  CART_EVENT,
  criarIdProduto,
  lerCarrinho,
  salvarCarrinho,
  adicionarItem,
  removerItem,
  atualizarQuantidade,
  limparCarrinho,
  hidratarCarrinhoRemoto,
  quantidadeTotal
};
