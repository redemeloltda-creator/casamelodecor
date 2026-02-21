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
  const totalDigitosCelular = 11;
  const tamanhoMaximoFoto = 2 * 1024 * 1024;

  const normalizarCelular = (valor) => String(valor || '').replace(/\D/g, '');

  const celularValido = (valor) => normalizarCelular(valor).length === totalDigitosCelular;

  const carregarUsuarios = () => {
    try {
      return JSON.parse(localStorage.getItem(chaveUsuarios) || '[]');
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

  const limparSessao = () => {
    localStorage.removeItem(chaveSessao);
  };

  const carregarCarrinho = () => {
    try {
      const dados = JSON.parse(localStorage.getItem(chaveCarrinho) || '[]');
      return Array.isArray(dados) ? dados : [];
    } catch (erro) {
      return [];
    }
  };

  const fecharCarrinho = () => {
    if (!carrinhoBotao || !carrinhoPainel) return;
    carrinhoPainel.hidden = true;
    carrinhoBotao.setAttribute('aria-expanded', 'false');
  };

  const atualizarCarrinho = () => {
    if (!carrinhoContador || !carrinhoLista || !carrinhoVazio || !carrinhoMenu) return;

    const itens = carregarCarrinho();
    carrinhoContador.textContent = String(itens.length);
    carrinhoMenu.hidden = false;
    carrinhoLista.innerHTML = '';

    if (!itens.length) {
      carrinhoVazio.hidden = false;
      return;
    }

    carrinhoVazio.hidden = true;

    itens.slice().reverse().forEach((item) => {
      const linha = document.createElement('li');
      linha.className = 'carrinho-item';

      const nome = document.createElement('span');
      nome.className = 'carrinho-item-nome';
      nome.textContent = item.nome || 'Produto sem nome';

      const preco = document.createElement('span');
      preco.className = 'carrinho-item-preco';
      preco.textContent = item.preco || 'Preço indisponível';

      linha.appendChild(nome);
      linha.appendChild(preco);
      carrinhoLista.appendChild(linha);
    });
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
      } else {
        perfilMenu.hidden = true;
        perfilNome.textContent = '';
        perfilEmail.textContent = '';
        atualizarAvatar(null);
        fecharPainelPerfil();
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

    usuarios.push({ nome, celular, senha, foto: '' });
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

    salvarSessao({
      nome: usuario.nome,
      contato: usuario.celular || usuario.email || '',
      celular: usuario.celular,
      foto: usuario.foto || ''
    });
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
        perfilFotoInput.value = '';
        return;
      }

      if (arquivo.size > tamanhoMaximoFoto) {
        feedback.textContent = 'A foto deve ter até 2MB para manter o site rápido.';
        perfilFotoInput.value = '';
        return;
      }

      const leitor = new FileReader();
      leitor.onload = () => {
        const foto = String(leitor.result || '');
        const novaSessao = { ...usuario, foto };
        salvarSessao(novaSessao);
        atualizarFotoUsuario(usuario.celular, foto);
        atualizarAreaPerfil();
        feedback.textContent = 'Foto de perfil atualizada com sucesso.';
        perfilFotoInput.value = '';
      };
      leitor.readAsDataURL(arquivo);
    });
  }

  atualizarAreaPerfil();
  atualizarCarrinho();
})();
