(function () {
  const suggestions = [
    {
      triggers: ["entrega", "entregam", "frete"],
      answer: "Fazemos atendimento em Coração de Jesus e região. Me chama no WhatsApp para confirmar frete e prazo certinho."
    },
    {
      triggers: ["horário", "aberto", "funcionamento"],
      answer: "Nosso horário é: Seg a Sex de 8h às 18h e sábado de 8h às 12h."
    },
    {
      triggers: ["endereço", "local", "onde fica"],
      answer: "Estamos na Rua Luiz Pires, 378 · Centro · Coração de Jesus - MG."
    },
    {
      triggers: ["catálogo", "produto", "produtos"],
      answer: "Você pode acessar os catálogos na seção Produtos aqui no site. Se quiser ajuda, te envio no WhatsApp também."
    }
  ];

  const panel = document.getElementById("assistentePainel");
  const toggle = document.getElementById("assistenteToggle");
  const closeButton = document.getElementById("assistenteFechar");
  const form = document.getElementById("assistenteForm");
  const input = document.getElementById("assistenteCampo");
  const messages = document.getElementById("assistenteMensagens");

  if (!panel || !toggle || !form || !input || !messages) {
    return;
  }

  const addMessage = (text, type) => {
    const item = document.createElement("p");
    item.className = `assistente-msg assistente-msg-${type}`;
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  };

  const answerQuestion = (question) => {
    const normalized = question.toLowerCase();
    const match = suggestions.find((item) => item.triggers.some((trigger) => normalized.includes(trigger)));
    if (match) {
      return match.answer;
    }

    return "Posso te ajudar melhor no WhatsApp 💬. Clique em “Falar com atendente” e eu já envio sua mensagem para nossa equipe.";
  };

  const openPanel = () => {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => {
      panel.classList.add("assistente-painel-aberto");
    });
  };

  const closePanel = () => {
    panel.classList.remove("assistente-painel-aberto");
    toggle.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      panel.hidden = true;
    }, 180);
  };

  toggle.addEventListener("click", () => {
    if (panel.hidden) {
      openPanel();
      return;
    }

    closePanel();
  });

  if (closeButton) {
    closeButton.addEventListener("click", closePanel);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, "cliente");
    input.value = "";

    const response = answerQuestion(question);
    window.setTimeout(() => addMessage(response, "bot"), 250);
  });
})();
