(function () {
  const SUPABASE_URL = 'https://fulymepfkdenmtickfwk.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bHltZXBma2Rlbm10aWNrZndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTY4MTMsImV4cCI6MjA4NzQzMjgxM30.6BRJj59Amct0VLW8EdwRhZhHQVtmkIZtRkXPiXIzOpY';

  const { createClient } = window.supabase || {};
  const formCadastroClientes = document.getElementById('formCadastroClientes');
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const cadastroFeedback = document.getElementById('cadastroFeedback');

  if (!formCadastroClientes || !nomeInput || !emailInput || !createClient) return;

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
