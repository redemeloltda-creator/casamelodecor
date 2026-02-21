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
  const perfilSair = document.getElementById('perfilSair');

  if (!modal || !formLogin || !formCadastro) return;

  const chaveUsuarios = 'casamelo_usuarios';
  const chaveSessao = 'casamelo_usuario_logado';
  const totalDigitosCelular = 11;

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

  const limparSessao = () => {
    localStorage.removeItem(chaveSessao);
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

    if (!perfilMenu || !perfilNome || !perfilEmail) return;

    if (usuario) {
      perfilMenu.hidden = false;
      perfilNome.textContent = usuario.nome;
      perfilEmail.textContent = usuario.contato;
      return;
    }

    perfilMenu.hidden = true;
    perfilNome.textContent = '';
    perfilEmail.textContent = '';
    fecharPainelPerfil();
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

    usuarios.push({ nome, celular, senha });
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

    salvarSessao({ nome: usuario.nome, contato: usuario.celular || usuario.email || '' });
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
    });

    document.addEventListener('click', (evento) => {
      if (!perfilMenu || perfilMenu.hidden) return;
      if (perfilMenu.contains(evento.target)) return;
      fecharPainelPerfil();
    });
  }

  if (perfilSair) {
    perfilSair.addEventListener('click', () => {
      limparSessao();
      atualizarAreaPerfil();
      fecharPainelPerfil();
    });
  }

  atualizarAreaPerfil();
})();
