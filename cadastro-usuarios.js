(function () {
  const supabaseUrl = 'https://fulymepfkdenmtickfwk.supabase.co';
  const supabaseKey = 'sb_publishable_-EkQe8BgbDCAFQJ1j_1omg_J6Eu_fbc';

  const formCadastroClientes = document.getElementById('formCadastroClientes');
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const cadastroFeedback = document.getElementById('cadastroFeedback');

  if (!formCadastroClientes || !nomeInput || !emailInput || !window.supabase?.createClient) return;

  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
