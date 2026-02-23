(function () {
  const supabaseConfig = window.casameloSupabaseConfig || {};

  const { createClient } = window.supabase || {};
  const formCadastroClientes = document.getElementById('formCadastroClientes');
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const cadastroFeedback = document.getElementById('cadastroFeedback');

  if (!formCadastroClientes || !nomeInput || !emailInput || !createClient || !supabaseConfig.configValida) return;

  const supabaseClient = createClient(supabaseConfig.url, supabaseConfig.anonKey);

  if (typeof supabaseConfig.testarConexao === 'function') {
    supabaseConfig.testarConexao().then((resultado) => {
      if (!resultado.ok) {
        cadastroFeedback.textContent = `Aviso de conexão: ${resultado.erro}`;
      }
    });
  }

  formCadastroClientes.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();

    if (!nome || !email) {
      cadastroFeedback.textContent = 'Preencha todos os campos.';
      return;
    }

    cadastroFeedback.textContent = 'Salvando...';

    const { error } = await supabaseClient
      .from('usuarios')
      .insert([{ nome, email }]);

    if (error) {
      cadastroFeedback.textContent = `Erro: ${error.message}`;
      console.error(error);
      return;
    }

    cadastroFeedback.textContent = 'Salvo com sucesso!';
    formCadastroClientes.reset();
  });
})();
