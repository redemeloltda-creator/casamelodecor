(function () {
  const SUPABASE_URL = 'https://fulymepfkdenmtickfwk.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_-EkQe8BgbDCAFQJ1j_1omg_J6Eu_fbc';
  const { createClient } = window.supabase || {};

  const formCadastroClientes = document.getElementById('formCadastroClientes');
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const cadastroFeedback = document.getElementById('cadastroFeedback');

  if (!formCadastroClientes || !nomeInput || !emailInput || !createClient) return;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const salvar = async () => {
    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();

    if (!nome || !email) {
      cadastroFeedback.textContent = 'Preencha nome e email antes de salvar.';
      return;
    }

    cadastroFeedback.textContent = 'Salvando cadastro...';

    const { error } = await supabase
      .from('usuarios')
      .insert([{ nome, email }]);

    if (error) {
      cadastroFeedback.textContent = `Erro: ${error.message}`;
      return;
    }

    cadastroFeedback.textContent = 'Salvo com sucesso!';
    formCadastroClientes.reset();
  };

  formCadastroClientes.addEventListener('submit', async (event) => {
    event.preventDefault();
    await salvar();
  });

  window.salvar = salvar;
})();
