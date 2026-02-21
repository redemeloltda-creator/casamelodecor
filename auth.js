(function () {
  const modal = document.getElementById('authModal');
  const titulo = document.getElementById('authTitulo');
  const feedback = document.getElementById('authFeedback');
  const formLogin = document.getElementById('formLogin');
  const formCadastro = document.getElementById('formCadastro');
  const btnFechar = document.getElementById('authFechar');
  const tabs = document.querySelectorAll('[data-auth-tab]');
  const botoesAbrir = document.querySelectorAll('[data-auth-open]');

  const perfilMenu = document.getElementById('perfilMenu');
  const perfilBotao = document.getElementById('perfilBotao');
  const perfilPainel = document.getElementById('perfilPainel');
  const perfilNome = document.getElementById('perfilNome');
  const perfilEmail = document.getElementById('perfilEmail');
  const perfilAvatarBotao = document.getElementById('perfilAvatarBotao');
  const perfilAvatarPainel = document.getElementById('perfilAvatarPainel');
  const perfilAvatarFallback = document.getElementById('perfilAvatarFallback');
  const perfilAvatarFallbackPainel = document.getElementById('perfilAvatarFallbackPainel');
  const perfilFotoInput = document.getElementById('perfilFotoInput');
  const perfilEditarFoto = document.getElementById('perfilEditarFoto');
  const perfilSalvarFoto = document.getElementById('perfilSalvarFoto');
  const perfilFotoPendente = document.getElementById('perfilFotoPendente');
  const perfilHistoricoLista = document.getElementById('perfilHistoricoLista');
  const perfilHistoricoVazio = document.getElementById('perfilHistoricoVazio');
  const perfilExcluirConta = document.getElementById('perfilExcluirConta');
  const perfilSair = document.getElementById('perfilSair');
  const carrinhoMenu = document.getElementById('carrinhoMenu');
  const carrinhoBotao = document.getElementById('carrinhoBotao');
  const carrinhoPainel = document.getElementById('carrinhoPainel');
  const carrinhoContador = document.getElementById('carrinhoContador');
  const carrinhoLista = document.getElementById('carrinhoLista');
  const carrinhoVazio = document.getElementById('carrinhoVazio');

  if (!modal || !formLogin || !formCadastro) return;

  const chaveUsuarios = 'casamelo_usuarios';
  const chaveSessao = 'casamelo_usuario_logado';
  const chaveCarrinho = 'casaMeloCarrinho';
  const chaveHistoricoCompras = 'casamelo_historico_compras';
  const totalDigitosCelular = 11;
  const tamanhoMaximoFoto = 2 * 1024 * 1024;
  let fotoPendente = '';

  const criarUsuarioNormalizado = (usuario = {}) => ({
    nome: String(usuario.nome || '').trim(),
    celular: normalizarCelular(usuario.celular),
    senha: String(usuario.senha || ''),
    foto: String(usuario.foto || '').trim()
  });

  const normalizarCelular = (valor) => String(valor || '').replace(/\D/g, '');

  const celularValido = (valor) => normalizarCelular(valor).length === totalDigitosCelular;

  const carregarUsuarios = () => {
    try {
      const usuarios = JSON.parse(localStorage.getItem(chaveUsuarios) || '[]');

      if (!Array.isArray(usuarios)) return [];

      return usuarios
        .map(criarUsuarioNormalizado)
        .filter((usuario) => usuario.nome && celularValido(usuario.celular) && usuario.senha);
    } catch (erro) {
      return [];
    }
  };

  const salvarUsuarios = (usuarios) => {
    localStorage.setItem(chaveUsuarios, JSON.stringify(usuarios));
  };

  const carregarSessao = () => {
    try {
      return JSON.parse(localStorage.getItem(chaveSessao) || 'null');
    } catch (erro) {
      return null;
    }
  };

  const salvarSessao = (usuario) => {
    localStorage.setItem(chaveSessao, JSON.stringify(usuario));
  };

  const montarSessaoUsuario = (usuario = {}) => ({
    nome: usuario.nome || '',
    contato: usuario.celular || usuario.email || '',
    celular: usuario.celular || '',
    foto: usuario.foto || '',
    dadosCliente: criarUsuarioNormalizado(usuario)
  });

  const atualizarFotoUsuario = (celular, foto) => {
    const usuarios = carregarUsuarios();
    const indiceUsuario = usuarios.findIndex((item) => normalizarCelular(item.celular) === normalizarCelular(celular));

    if (indiceUsuario === -1) return;

    usuarios[indiceUsuario].foto = foto;
    salvarUsuarios(usuarios);
  };

  const atualizarAvatar = (usuario) => {
    const foto = String(usuario?.foto || '').trim();
    const temFoto = Boolean(foto);

    [perfilAvatarBotao, perfilAvatarPainel].forEach((avatar) => {
      if (!avatar) return;

      if (temFoto) {
        avatar.src = foto;
      } else {
        avatar.removeAttribute('src');
      }

      avatar.hidden = !temFoto;
    });

    [perfilAvatarFallback, perfilAvatarFallbackPainel].forEach((fallback) => {
      if (!fallback) return;
      fallback.hidden = temFoto;
    });
  };

  const limparAlteracaoFotoPendente = () => {
    fotoPendente = '';
    if (perfilSalvarFoto) perfilSalvarFoto.hidden = true;
    if (perfilFotoPendente) perfilFotoPendente.hidden = true;
    if (perfilFotoInput) perfilFotoInput.value = '';
  };

  const exibirAlteracaoFotoPendente = (foto) => {
    fotoPendente = foto;
    if (perfilSalvarFoto) perfilSalvarFoto.hidden = false;
    if (perfilFotoPendente) perfilFotoPendente.hidden = false;
  };

  const limparSessao = () => {
    localStorage.removeItem(chaveSessao);
  };

  const excluirConta = (celular) => {
    const usuarios = carregarUsuarios();
    const usuariosAtualizados = usuarios.filter((item) => normalizarCelular(item.celular) !== normalizarCelular(celular));

    salvarUsuarios(usuariosAtualizados);
    limparSessao();
  };

  const carregarCarrinho = () => {
    try {
      const dados = JSON.parse(localStorage.getItem(chaveCarrinho) || '[]');
      return Array.isArray(dados) ? dados : [];
    } catch (erro) {
      return [];
    }
  };

  const salvarCarrinho = (itens) => {
    localStorage.setItem(chaveCarrinho, JSON.stringify(itens));
    document.dispatchEvent(new Event('casamelo-cart-change'));
  };

  const removerItemCarrinho = (adicionadoEm) => {
    const carrinho = carregarCarrinho();
    const indice = carrinho.findIndex((item) => item.adicionadoEm === adicionadoEm);

    if (indice === -1) return;

    carrinho.splice(indice, 1);
    salvarCarrinho(carrinho);
  };

  const fecharCarrinho = () => {
    if (!carrinhoBotao || !carrinhoPainel) return;
    carrinhoPainel.hidden = true;
    carrinhoBotao.setAttribute('aria-expanded', 'false');
  };

  const carregarHistoricoCompras = () => {
    try {
      const historico = JSON.parse(localStorage.getItem(chaveHistoricoCompras) || '[]');
      return Array.isArray(historico) ? historico : [];
    } catch (erro) {
      return [];
    }
  };

  const salvarHistoricoCompras = (historico) => {
    localStorage.setItem(chaveHistoricoCompras, JSON.stringify(historico));
  };

  const formatarDataHora = (valor) => {
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return 'Data indisponível';
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const atualizarHistoricoPerfil = () => {
    if (!perfilHistoricoLista || !perfilHistoricoVazio) return;

    const usuario = carregarSessao();
    const celular = normalizarCelular(usuario?.celular);
    const historico = carregarHistoricoCompras()
      .filter((compra) => normalizarCelular(compra?.celular) === celular)
      .slice()
      .reverse();

    perfilHistoricoLista.innerHTML = '';

    if (!historico.length) {
      perfilHistoricoVazio.hidden = false;
      return;
    }

    perfilHistoricoVazio.hidden = true;

    historico.forEach((compra) => {
      const item = document.createElement('li');
      item.className = 'perfil-historico-item';

      const data = document.createElement('p');
      data.className = 'perfil-historico-data';
      data.textContent = formatarDataHora(compra?.data);

      const resumo = document.createElement('p');
      resumo.className = 'perfil-historico-resumo';
      resumo.textContent = `${compra?.itens?.length || 0} item(ns): ${(compra?.itens || []).map((produto) => produto.nome || 'Produto').join(', ')}`;

      item.appendChild(data);
      item.appendChild(resumo);
      perfilHistoricoLista.appendChild(item);
    });
  };

  const registrarCompraHistorico = (itens) => {
    const usuario = carregarSessao();
    const celular = normalizarCelular(usuario?.celular);

    if (!celular || !Array.isArray(itens) || !itens.length) return;

    const historico = carregarHistoricoCompras();
    historico.push({
      celular,
      data: new Date().toISOString(),
      itens: itens.map((item) => ({
        nome: item?.nome || 'Produto sem nome',
        preco: item?.preco || ''
      }))
    });
    salvarHistoricoCompras(historico);
    atualizarHistoricoPerfil();
  };

  const montarMensagemCompra = (itens) => {
    const produtosCarrinho = itens
      .map((item, indice) => {
        const nome = String(item?.nome || '').trim() || 'Produto sem nome';
        const preco = String(item?.preco || '').trim();

        return `${indice + 1}. ${nome}${preco ? ` — ${preco}` : ''}`;
      })
      .join('\n');

    return [
      'Olá! Quero fazer um pedido com os itens do meu carrinho:',
      `\n${produtosCarrinho}`
    ].join('\n');
  };

  const atualizarBotaoCompra = (itens) => {
    if (!carrinhoPainel) return;

    let botaoCompra = document.getElementById('carrinhoComprarTudo');

    if (!botaoCompra) {
      botaoCompra = document.createElement('a');
      botaoCompra.id = 'carrinhoComprarTudo';
      botaoCompra.className = 'carrinho-comprar';
      botaoCompra.textContent = 'Comprar itens do carrinho';
      botaoCompra.target = '_blank';
      botaoCompra.rel = 'noopener noreferrer';
      carrinhoPainel.appendChild(botaoCompra);
    }

    if (!itens.length) {
      botaoCompra.hidden = true;
      botaoCompra.removeAttribute('href');
      return;
    }

    botaoCompra.hidden = false;
    const mensagem = montarMensagemCompra(itens);
    botaoCompra.href = `https://wa.me/5538999140400?text=${encodeURIComponent(mensagem)}`;

    botaoCompra.onclick = () => {
      registrarCompraHistorico(itens);
      salvarCarrinho([]);
      fecharCarrinho();
    };
  };

  const atualizarCarrinho = () => {
    if (!carrinhoContador || !carrinhoLista || !carrinhoVazio || !carrinhoMenu) return;

    const itens = carregarCarrinho();
    carrinhoContador.textContent = String(itens.length);
    carrinhoMenu.hidden = false;
    carrinhoLista.innerHTML = '';

    if (!itens.length) {
      carrinhoVazio.hidden = false;
      atualizarBotaoCompra(itens);
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

      const botaoRemover = document.createElement('button');
      botaoRemover.type = 'button';
      botaoRemover.className = 'carrinho-item-remover';
      botaoRemover.setAttribute('aria-label', `Remover ${nome.textContent} do carrinho`);
      botaoRemover.textContent = '×';
      botaoRemover.addEventListener('click', () => {
        removerItemCarrinho(item.adicionadoEm);
      });

      const preco = document.createElement('span');
      preco.className = 'carrinho-item-preco';
      preco.textContent = item.preco || 'Preço indisponível';

      topo.appendChild(nome);
      topo.appendChild(botaoRemover);
      linha.appendChild(topo);
      linha.appendChild(preco);
      carrinhoLista.appendChild(linha);
    });

    atualizarBotaoCompra(itens);
  };

  const fecharPainelPerfil = () => {
    if (!perfilBotao || !perfilPainel) return;

    perfilPainel.hidden = true;
    perfilBotao.setAttribute('aria-expanded', 'false');
  };

  const atualizarAreaPerfil = () => {
    const usuario = carregarSessao();

    botoesAbrir.forEach((botao) => {
      botao.hidden = Boolean(usuario);
    });

    if (perfilMenu && perfilNome && perfilEmail) {
      if (usuario) {
        perfilMenu.hidden = false;
        perfilNome.textContent = usuario.nome;
        perfilEmail.textContent = usuario.contato;
        atualizarAvatar(usuario);
        limparAlteracaoFotoPendente();
        atualizarHistoricoPerfil();
      } else {
        perfilMenu.hidden = true;
        perfilNome.textContent = '';
        perfilEmail.textContent = '';
        atualizarAvatar(null);
        fecharPainelPerfil();
        limparAlteracaoFotoPendente();
        atualizarHistoricoPerfil();
      }
    }

    document.dispatchEvent(new Event('casamelo-auth-change'));
  };

  const trocarAba = (aba) => {
    const loginAtivo = aba !== 'cadastro';

    titulo.textContent = loginAtivo ? 'Login' : 'Cadastro';
    formLogin.hidden = !loginAtivo;
    formCadastro.hidden = loginAtivo;
    feedback.textContent = '';

    tabs.forEach((tab) => {
      tab.classList.toggle('ativo', tab.dataset.authTab === (loginAtivo ? 'login' : 'cadastro'));
    });
  };

  const abrirModal = (abaInicial) => {
    modal.classList.add('aberto');
    modal.setAttribute('aria-hidden', 'false');
    trocarAba(abaInicial);
  };

  const fecharModal = () => {
    modal.classList.remove('aberto');
    modal.setAttribute('aria-hidden', 'true');
  };

  botoesAbrir.forEach((botao) => {
    botao.addEventListener('click', () => abrirModal(botao.dataset.authOpen));
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => trocarAba(tab.dataset.authTab));
  });

  btnFechar.addEventListener('click', fecharModal);
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fecharModal();
  });

  formCadastro.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const dados = new FormData(formCadastro);
    const nome = String(dados.get('nome') || '').trim();
    const celular = normalizarCelular(dados.get('celular'));
    const senha = String(dados.get('senha') || '');

    if (!nome || !celularValido(celular) || senha.length < 6) {
      feedback.textContent = 'Use um celular com DDD + 9 números e senha de no mínimo 6 caracteres.';
      return;
    }

    const usuarios = carregarUsuarios();
    const existe = usuarios.some((usuario) => usuario.celular === celular);

    if (existe) {
      feedback.textContent = 'Este número de celular já possui cadastro.';
      return;
    }

    usuarios.push(criarUsuarioNormalizado({ nome, celular, senha, foto: '' }));
    salvarUsuarios(usuarios);
    feedback.textContent = 'Cadastro realizado com sucesso. Agora faça seu login.';
    formCadastro.reset();
    trocarAba('login');
  });

  formLogin.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const dados = new FormData(formLogin);
    const login = String(dados.get('login') || '').trim();
    const senha = String(dados.get('senha') || '');
    const celularLogin = normalizarCelular(login);

    if (!celularValido(celularLogin)) {
      feedback.textContent = 'Informe seu celular com DDD + 9 números.';
      return;
    }

    const usuarios = carregarUsuarios();
    const usuario = usuarios.find((item) => normalizarCelular(item.celular) === celularLogin && item.senha === senha);

    if (!usuario) {
      feedback.textContent = 'Login inválido. Confira os dados e senha.';
      return;
    }

    salvarSessao(montarSessaoUsuario(usuario));
    atualizarAreaPerfil();

    feedback.textContent = `Olá, ${usuario.nome}. Login realizado!`;
    formLogin.reset();
    setTimeout(fecharModal, 800);
  });

    if (perfilBotao && perfilPainel) {
      perfilBotao.addEventListener('click', () => {
      const aberto = perfilPainel.hidden;
      perfilPainel.hidden = !aberto;
      perfilBotao.setAttribute('aria-expanded', String(aberto));
      if (aberto) fecharCarrinho();
    });

    document.addEventListener('click', (evento) => {
      if (!perfilMenu || perfilMenu.hidden) return;
      if (perfilMenu.contains(evento.target)) return;
      fecharPainelPerfil();
    });
  }

  if (carrinhoBotao && carrinhoPainel) {
    carrinhoBotao.addEventListener('click', () => {
      const aberto = carrinhoPainel.hidden;
      carrinhoPainel.hidden = !aberto;
      carrinhoBotao.setAttribute('aria-expanded', String(aberto));
      if (aberto) fecharPainelPerfil();
    });

    document.addEventListener('click', (evento) => {
      if (!carrinhoMenu || carrinhoMenu.hidden) return;
      if (carrinhoMenu.contains(evento.target)) return;
      fecharCarrinho();
    });

    window.addEventListener('storage', (evento) => {
      if (evento.key === chaveCarrinho) atualizarCarrinho();
    });

    document.addEventListener('casamelo-cart-change', atualizarCarrinho);
  }

  if (perfilExcluirConta) {
    perfilExcluirConta.addEventListener('click', () => {
      const usuario = carregarSessao();

      if (!usuario?.celular) return;

      const confirmou = window.confirm('Tem certeza que deseja excluir sua conta deste dispositivo? Esta ação não pode ser desfeita.');

      if (!confirmou) return;

      excluirConta(usuario.celular);
      atualizarAreaPerfil();
      fecharPainelPerfil();
      feedback.textContent = 'Conta excluída com sucesso.';
    });
  }

  if (perfilSair) {
    perfilSair.addEventListener('click', () => {
      limparSessao();
      atualizarAreaPerfil();
      fecharPainelPerfil();
    });
  }

  if (perfilEditarFoto && perfilFotoInput) {
    perfilEditarFoto.addEventListener('click', () => {
      perfilFotoInput.click();
    });

    perfilFotoInput.addEventListener('change', () => {
      const usuario = carregarSessao();
      const [arquivo] = Array.from(perfilFotoInput.files || []);

      if (!usuario || !arquivo) return;

      if (!arquivo.type.startsWith('image/')) {
        feedback.textContent = 'Escolha um arquivo de imagem válido (PNG, JPG ou WEBP).';
        limparAlteracaoFotoPendente();
        return;
      }

      if (arquivo.size > tamanhoMaximoFoto) {
        feedback.textContent = 'A foto deve ter até 2MB para manter o site rápido.';
        limparAlteracaoFotoPendente();
        return;
      }

      const leitor = new FileReader();
      leitor.onload = () => {
        const foto = String(leitor.result || '');

        if (!foto) {
          limparAlteracaoFotoPendente();
          return;
        }

        exibirAlteracaoFotoPendente(foto);
        feedback.textContent = 'Foto pronta para salvar. Clique no botão Salvar foto.';
      };
      leitor.readAsDataURL(arquivo);
    });
  }

  if (perfilSalvarFoto) {
    perfilSalvarFoto.addEventListener('click', () => {
      const usuario = carregarSessao();

      if (!usuario || !fotoPendente) return;

      const novaSessao = montarSessaoUsuario({ ...usuario.dadosCliente, ...usuario, foto: fotoPendente });
      salvarSessao(novaSessao);
      atualizarFotoUsuario(usuario.celular, fotoPendente);
      atualizarAreaPerfil();
      feedback.textContent = 'Foto de perfil atualizada com sucesso.';
      limparAlteracaoFotoPendente();
    });
  }

  atualizarAreaPerfil();
  atualizarCarrinho();
})();
