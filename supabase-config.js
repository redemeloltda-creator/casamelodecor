(function () {
  // Configuração direta do projeto Supabase informado.
  const SUPABASE_URL = 'https://fulymepfkdenmtickfwk.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bHltZXBma2Rlbm10aWNrZndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTY4MTMsImV4cCI6MjA4NzQzMjgxM30.6BRJj59Amct0VLW8EdwRhZhHQVtmkIZtRkXPiXIzOpY';

  window.casameloSupabaseConfig = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    configValida: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
    mensagemErro: '',
    async testarConexao() {
      if (!this.configValida) {
        return {
          ok: false,
          status: 0,
          erro: 'Configuração do Supabase inválida.'
        };
      }

      try {
        const resposta = await fetch(this.url, {
          method: 'GET',
          headers: {
            apikey: this.anonKey,
            Authorization: `Bearer ${this.anonKey}`
          }
        });

        return {
          ok: resposta.ok,
          status: resposta.status,
          erro: resposta.ok ? '' : `Falha ao conectar no Supabase (status ${resposta.status}).`
        };
      } catch (erro) {
        return {
          ok: false,
          status: 0,
          erro: erro instanceof Error ? erro.message : 'Erro desconhecido ao conectar no Supabase.'
        };
      }
    }
  };
})();
