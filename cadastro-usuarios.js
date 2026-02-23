(function () {
  const chaveCadastros = 'casamelo_cadastros_clientes';
  const formCadastroClientes = document.getElementById('formCadastroClientes');
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const cadastroFeedback = document.getElementById('cadastroFeedback');

  if (!formCadastroClientes || !nomeInput || !emailInput || !cadastroFeedback) return;

  const carregarCadastros = () => {
    try {
      const dados = JSON.parse(localStorage.getItem(chaveCadastros) || '[]');
      return Array.isArray(dados) ? dados : [];
    } catch (erro) {
      return [];
    }
  };

  const salvarCadastros = (cadastros) => {
    localStorage.setItem(chaveCadastros, JSON.stringify(cadastros));
  };

  formCadastroClientes.addEventListener('submit', (event) => {
    event.preventDefault();

    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();

    if (!nome || !email) {
      cadastroFeedback.textContent = 'Preencha todos os campos.';
      return;
    }

    const cadastros = carregarCadastros();
    cadastros.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      nome,
      email,
      criadoEm: new Date().toISOString()
    });

    salvarCadastros(cadastros);
    cadastroFeedback.textContent = 'Cadastro salvo com sucesso neste dispositivo!';
    formCadastroClientes.reset();
  });
})();
