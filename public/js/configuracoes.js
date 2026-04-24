let user = null;
let currentField = null;

document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     ELEMENTOS
  ========================= */
  const modal = document.getElementById("modalOverlay");
  const modalBox = document.querySelector(".sc-modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalCancel = document.getElementById("modalCancel");
  const modalSave = document.getElementById("modalSave");
  const modalFieldContainer = document.getElementById("modalFieldContainer");

  const btnEditarDados = document.querySelector(".btn-editar");
  const btnSair = document.querySelector(".btn-sair");
  const btnExcluir = document.querySelector(".btn-excluir");

  const avatar = document.getElementById("avatar");
  const avatarImg = document.getElementById("avatarImg");
  const avatarInput = document.getElementById("avatarInput");

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
    document.getElementById("userName").textContent = user?.nome || "Usuário";
    document.getElementById("userEmail").textContent = user?.email || "";

    if (avatarImg) {
      avatarImg.src = user?.foto || "imagens/avatar.png";
    }

    document.querySelectorAll(".config-item[data-field]").forEach(item => {
      const field = item.dataset.field;
      const valueEl = item.querySelector(".value");
      const btn = item.querySelector(".btn-completar");
      const value = user?.[field];

      if (value && String(value).trim() !== "") {
        if (field === "data_nascimento") {
          valueEl.textContent = new Date(value).toLocaleDateString("pt-BR");
        } else {
          valueEl.textContent = value;
        }

        valueEl.classList.remove("vazio");

        if (btn) {
          btn.style.display = "inline";
          btn.textContent = "Editar";
        }
      } else {
        valueEl.textContent = "Não informado";
        valueEl.classList.add("vazio");

        if (btn) {
          btn.style.display = "inline";
          btn.textContent = "Completar";
        }
      }
    });
  }

  /* =========================
     ABRIR MODAL
  ========================= */
  document.querySelectorAll(".btn-completar").forEach(btn => {
    btn.addEventListener("click", () => {
      const field = btn.dataset.field;

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

    modalTitle.textContent = `${user?.[field] ? "Editar" : "Preencher"} ${labels[field] || ""}`;

    if (field === "sexo") {
      modalFieldContainer.innerHTML = `
        <select id="modalInput">
          <option value="">Selecione</option>
          <option value="Feminino">Feminino</option>
          <option value="Masculino">Masculino</option>
          <option value="Não binário">Não binário</option>
          <option value="Prefiro não informar">Prefiro não informar</option>
        </select>
      `;
    } else if (field === "vinculo") {
      modalFieldContainer.innerHTML = `
        <select id="modalInput">
          <option value="">Selecione</option>
          <option value="CLT">CLT</option>
          <option value="Autônomo">Autônomo</option>
          <option value="PJ">PJ</option>
          <option value="Servidor público">Servidor público</option>
          <option value="Estudante">Estudante</option>
          <option value="Desempregado">Desempregado</option>
          <option value="Outro">Outro</option>
        </select>
      `;
    } else {
      const tipo = field === "data_nascimento" ? "date" : "text";

      modalFieldContainer.innerHTML = `
        <input type="${tipo}" id="modalInput" placeholder="${labels[field] || ""}" />
      `;
    }

    const input = document.getElementById("modalInput");
    input.value = user?.[field] || "";

    modal.style.display = "flex";
    setTimeout(() => input.focus(), 50);
  }

  /* =========================
     FECHAR MODAL
  ========================= */
  function fecharModal() {
    modal.style.display = "none";
    currentField = null;

    const inputAtual = document.getElementById("modalInput");
    if (inputAtual) inputAtual.value = "";
  }

  if (modalCancel) {
    modalCancel.onclick = fecharModal;
  }

  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) fecharModal();
    });
  }

  if (modalBox) {
    modalBox.addEventListener("click", e => {
      e.stopPropagation();
    });
  }

  /* =========================
     SALVAR CAMPO
  ========================= */
  if (modalSave) {
    modalSave.onclick = () => {
      if (!currentField) return;

      const modalInputAtual = document.getElementById("modalInput");
      if (!modalInputAtual) return;

      const value = modalInputAtual.value.trim();
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
  }

  /* =========================
     BOTÃO EDITAR DADOS
  ========================= */
  if (btnEditarDados) {
    btnEditarDados.addEventListener("click", () => {
      const primeiroItemEditavel = document.querySelector(".config-item[data-field]");

      if (!primeiroItemEditavel) {
        alert("Nenhum campo disponível para edição.");
        return;
      }

      abrirModal(primeiroItemEditavel.dataset.field);
    });
  }

  /* =========================
     FOTO DO USUÁRIO
  ========================= */
  if (avatar && avatarInput) {
    avatar.addEventListener("click", () => {
      avatarInput.click();
    });
  }

  if (avatarInput) {
    avatarInput.addEventListener("change", async () => {
      const file = avatarInput.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("foto", file);

      try {
        const res = await fetch("/me/foto", {
          method: "POST",
          credentials: "include",
          body: formData
        });

        if (!res.ok) throw new Error("Erro ao enviar foto");

        const data = await res.json();
        user.foto = data.foto;
        render();
      } catch (err) {
        console.error(err);
        alert("Erro ao enviar foto");
      }
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