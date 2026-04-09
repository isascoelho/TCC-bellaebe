document.addEventListener("DOMContentLoaded", () => {
  let user = null;
  let currentField = null;

  // ELEMENTOS
  const modal = document.getElementById("modalOverlay");
  const modalBox = document.querySelector(".sc-modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalInput = document.getElementById("modalInput");
  const modalCancel = document.getElementById("modalCancel");
  const modalSave = document.getElementById("modalSave");

  const btnEditarDados = document.querySelector(".btn-editar");
  const btnSair = document.querySelector(".btn-sair");
  const btnExcluir = document.querySelector(".btn-excluir");

  /* =========================
     BUSCAR USUÁRIO LOGADO
  ========================= */
  fetch("/me", { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Não autenticado");
      return res.json();
    })
    .then(data => {
      user = data;
      render();
    })
    .catch(() => {
      window.location.href = "/comece.html";
    });

  /* =========================
     RENDER
  ========================= */
  function render() {
    document.getElementById("userName").textContent = user.nome || "Usuário";
    document.getElementById("userEmail").textContent = user.email || "";

    document.querySelectorAll(".config-item[data-field]").forEach(item => {
      const field = item.dataset.field;
      const valueEl = item.querySelector(".value");
      const btn = item.querySelector(".btn-completar");

      const value = user[field];

      if (value && String(value).trim() !== "") {
        if (field === "data_nascimento") {
          valueEl.textContent = new Date(value).toLocaleDateString("pt-BR");
        } else {
          valueEl.textContent = value;
        }

        valueEl.classList.remove("vazio");
        if (btn) btn.style.display = "none";
      } else {
        valueEl.textContent = "Não informado";
        valueEl.classList.add("vazio");
        if (btn) btn.style.display = "inline";
      }
    });
  }

  /* =========================
     ABRIR MODAL
  ========================= */
  document.querySelectorAll(".btn-completar").forEach(btn => {
  btn.addEventListener("click", () => {
    const field = btn.dataset.field;

    // 🔒 ignora botões sem campo (ex: senha)
    if (!field) {
      alert("Alteração de senha ainda não implementada.");
      return;
    }

    abrirModal(field);
  });
});

  function abrirModal(field) {
  currentField = field;

  const labels = {
    cpf: "CPF",
    data_nascimento: "Data de nascimento",
    fone: "Telefone",
    sexo: "Sexo",
    endereco: "Endereço",
    vinculo: "Vínculo empregatício"
  };

  modalTitle.textContent = `Preencher ${labels[field] || ""}`;

  modalInput.type = field === "data_nascimento" ? "date" : "text";
  modalInput.value = user[field] || "";
  modalInput.placeholder = labels[field] || "";

  modal.style.display = "flex";

  setTimeout(() => modalInput.focus(), 50);
}


  /* =========================
     FECHAR MODAL
  ========================= */
  function fecharModal() {
    modal.style.display = "none";
    currentField = null;
    modalInput.value = "";
  }

  modalCancel.onclick = fecharModal;

  modal.addEventListener("click", e => {
    if (e.target === modal) fecharModal();
  });

  modalBox.addEventListener("click", e => {
    e.stopPropagation();
  });

  /* =========================
     SALVAR CAMPO
  ========================= */
  modalSave.onclick = () => {
    if (!currentField) return;

    const value = modalInput.value.trim();
    if (!value) return;

    fetch("/me", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field: currentField, value })
    })
      .then(res => {
        if (!res.ok) throw new Error("Erro ao salvar");
        return res.json();
      })
      .then(() => {
        user[currentField] = value;
        fecharModal();
        render();
      })
      .catch(() => alert("Erro ao salvar informação"));
  };

  /* =========================
     BOTÃO EDITAR DADOS
  ========================= */
  if (btnEditarDados) {
    btnEditarDados.addEventListener("click", () => {
      const primeiroVazio = document.querySelector(
        ".config-item .value.vazio"
      );

      if (!primeiroVazio) {
        alert("Todos os dados já estão preenchidos 👍");
        return;
      }

      const item = primeiroVazio.closest(".config-item");
      abrirModal(item.dataset.field);
    });
  }

  /* =========================
     SAIR DA CONTA
  ========================= */
  if (btnSair) {
    btnSair.addEventListener("click", () => {
      fetch("/logout", { method: "POST", credentials: "include" })
        .finally(() => {
          window.location.href = "/comece.html";
        });
    });
  }

  /* =========================
     EXCLUIR CONTA
  ========================= */
  if (btnExcluir) {
    btnExcluir.addEventListener("click", () => {
      const confirmar = confirm(
        "Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita."
      );

      if (!confirmar) return;

      fetch("/me", {
        method: "DELETE",
        credentials: "include"
      })
        .then(res => {
          if (!res.ok) throw new Error();
          window.location.href = "/login.html";
        })
        .catch(() => alert("Erro ao excluir conta"));
    });
  }
});