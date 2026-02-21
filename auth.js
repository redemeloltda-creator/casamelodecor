(function () {
  const modal = document.getElementById('authModal');
  const titulo = document.getElementById('authTitulo');
  const feedback = document.getElementById('authFeedback');
  const formLogin = document.getElementById('formLogin');
  const formCadastro = document.getElementById('formCadastro');
  const btnFechar = document.getElementById('authFechar');
  const tabs = document.querySelectorAll('[data-auth-tab]');
  const botoesAbrir = document.querySelectorAll('[data-auth-open]');

  if (!modal || !formLogin || !formCadastro) return;

  const chaveUsuarios = 'casamelo_usuarios';

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
    const email = String(dados.get('email') || '').trim().toLowerCase();
    const senha = String(dados.get('senha') || '');

    if (!nome || !email || senha.length < 6) {
      feedback.textContent = 'Preencha os dados corretamente para cadastrar.';
      return;
    }

    const usuarios = carregarUsuarios();
    const existe = usuarios.some((usuario) => usuario.email === email);

    if (existe) {
      feedback.textContent = 'Este e-mail já possui cadastro.';
      return;
    }

    usuarios.push({ nome, email, senha });
    salvarUsuarios(usuarios);
    feedback.textContent = 'Cadastro realizado com sucesso. Agora faça seu login.';
    formCadastro.reset();
    trocarAba('login');
  });

  formLogin.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const dados = new FormData(formLogin);
    const email = String(dados.get('email') || '').trim().toLowerCase();
    const senha = String(dados.get('senha') || '');

    const usuarios = carregarUsuarios();
    const usuario = usuarios.find((item) => item.email === email && item.senha === senha);

    if (!usuario) {
      feedback.textContent = 'Login inválido. Confira e-mail e senha.';
      return;
    }

    feedback.textContent = `Olá, ${usuario.nome}. Login realizado!`;
    formLogin.reset();
    setTimeout(fecharModal, 800);
  });
})();
