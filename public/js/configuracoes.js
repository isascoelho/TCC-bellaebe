let user = null;
let currentField = null;

document.addEventListener("DOMContentLoaded", () => {
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
  const btnRemoverFoto = document.getElementById("btnRemoverFoto");

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

    const configEmail = document.getElementById("configUserEmail");
    if (configEmail) configEmail.textContent = user?.email || "";

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
        if (btn) { btn.style.display = "inline"; btn.textContent = "Editar"; }
      } else {
        valueEl.textContent = "Não informado";
        valueEl.classList.add("vazio");
        if (btn) { btn.style.display = "inline"; btn.textContent = "Completar"; }
      }
    });
  }

  /* =========================
     ABRIR MODAL — CAMPOS DE PERFIL
  ========================= */
  document.querySelectorAll(".btn-completar").forEach(btn => {
    btn.addEventListener("click", () => {
      const field = btn.dataset.field;

      if (!field) {
        const isAlterarSenha = btn.closest(".config-item")?.querySelector(".label")?.textContent?.includes("Senha");
        const is2fa = btn.closest(".config-item")?.querySelector(".label")?.textContent?.includes("2 etapas");

        if (isAlterarSenha) { abrirModalSenha(); return; }
        if (is2fa) { abrirModal2FA(); return; }
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
        </select>`;
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
        </select>`;
    } else {
      const tipo = field === "data_nascimento" ? "date" : "text";
      modalFieldContainer.innerHTML = `
        <input type="${tipo}" id="modalInput" placeholder="${labels[field] || ""}" />`;
    }

    const input = document.getElementById("modalInput");
    input.value = user?.[field] || "";
    modal.style.display = "flex";
    setTimeout(() => input.focus(), 50);
  }

  /* =========================
     ABRIR MODAL — ALTERAR SENHA
  ========================= */
  function abrirModalSenha() {
    currentField = null;
    modalTitle.textContent = "Alterar senha";
    modalFieldContainer.innerHTML = `
      <input type="password" id="senhaAtual"    placeholder="Senha atual"          style="margin-bottom:10px;display:block;width:100%" />
      <input type="password" id="senhaNova"     placeholder="Nova senha"           style="margin-bottom:10px;display:block;width:100%" />
      <input type="password" id="senhaConfirmar" placeholder="Confirmar nova senha" style="display:block;width:100%" />
    `;
    modal.style.display = "flex";
    setTimeout(() => document.getElementById("senhaAtual")?.focus(), 50);
  }

  /* =========================
     ABRIR MODAL — 2 ETAPAS
  ========================= */
  function abrirModal2FA() {
    currentField = null;
    const ativo = user?.twofa_ativo;
    modalTitle.textContent = ativo ? "Desativar verificação em 2 etapas" : "Ativar verificação em 2 etapas";
    modalFieldContainer.innerHTML = ativo
      ? `<p style="font-size:14px;color:#6b7280;margin-bottom:12px">
           Confirme sua senha para desativar a verificação em 2 etapas.
         </p>
         <input type="password" id="senha2fa" placeholder="Sua senha atual" style="display:block;width:100%" />`
      : `<p style="font-size:14px;color:#6b7280;margin-bottom:12px">
           Ao ativar, um código será enviado para o seu e-mail 
           <strong>${user?.email || ""}</strong> a cada login.
         </p>
         <input type="password" id="senha2fa" placeholder="Confirme sua senha para ativar" style="display:block;width:100%" />`;
    modal.style.display = "flex";
    setTimeout(() => document.getElementById("senha2fa")?.focus(), 50);
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

  if (modalCancel) modalCancel.onclick = fecharModal;

  if (modal) {
    modal.addEventListener("click", e => { if (e.target === modal) fecharModal(); });
  }

  if (modalBox) {
    modalBox.addEventListener("click", e => e.stopPropagation());
  }

  /* =========================
     SALVAR
  ========================= */
  if (modalSave) {
    modalSave.onclick = () => {

      /* --- Alterar senha --- */
      const senhaAtualEl = document.getElementById("senhaAtual");
      if (senhaAtualEl) {
        const atual    = senhaAtualEl.value.trim();
        const nova     = document.getElementById("senhaNova")?.value.trim();
        const confirmar = document.getElementById("senhaConfirmar")?.value.trim();

        if (!atual || !nova || !confirmar) { alert("Preencha todos os campos."); return; }
        if (nova !== confirmar)            { alert("As senhas não coincidem."); return; }
        if (nova.length < 6)               { alert("A nova senha deve ter ao menos 6 caracteres."); return; }

        fetch("/me/senha", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senhaAtual: atual, senhaNova: nova })
        })
          .then(res => {
            if (!res.ok) throw new Error();
            fecharModal();
            alert("Senha alterada com sucesso!");
          })
          .catch(() => alert("Senha atual incorreta ou erro ao alterar."));
        return;
      }

      /* --- 2 etapas --- */
      const senha2faEl = document.getElementById("senha2fa");
      if (senha2faEl) {
        const senha = senha2faEl.value.trim();
        if (!senha) { alert("Informe sua senha."); return; }

        const ativando = !user?.twofa_ativo;

        fetch("/me/2fa", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senha, ativo: ativando })
        })
          .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then(() => {
            user.twofa_ativo = ativando;
            fecharModal();
            render();
            alert(ativando
              ? "Verificação em 2 etapas ativada! Você receberá um código por e-mail a cada login."
              : "Verificação em 2 etapas desativada."
            );

            // Atualiza o texto do botão de 2FA
            const itens = document.querySelectorAll(".config-item");
            itens.forEach(item => {
              const label = item.querySelector(".label");
              const value = item.querySelector(".value");
              const btnItem = item.querySelector(".btn-completar");
              if (label?.textContent?.includes("2 etapas") && value && btnItem) {
                value.textContent = ativando ? "Ativo" : "Não configurado";
                value.classList.toggle("vazio", !ativando);
                btnItem.textContent = ativando ? "Desativar" : "Ativar";
              }
            });
          })
          .catch(() => alert("Senha incorreta ou erro ao alterar configuração."));
        return;
      }

      /* --- Campos de perfil (fluxo normal) --- */
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
      if (!primeiroItemEditavel) { alert("Nenhum campo disponível para edição."); return; }
      abrirModal(primeiroItemEditavel.dataset.field);
    });
  }

  /* =========================
     FOTO DO USUÁRIO — TROCAR
  ========================= */
  if (avatar && avatarInput) {
    avatar.addEventListener("click", () => avatarInput.click());
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
     FOTO DO USUÁRIO — REMOVER
  ========================= */
  if (btnRemoverFoto) {
    btnRemoverFoto.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Remover foto de perfil?")) return;

      try {
        const res = await fetch("/me/foto", {
          method: "DELETE",
          credentials: "include"
        });
        if (!res.ok) throw new Error();
        user.foto = null;
        if (avatarImg) avatarImg.src = "imagens/avatar.png";
      } catch {
        alert("Erro ao remover foto.");
      }
    });
  }

  /* =========================
     SAIR DA CONTA
  ========================= */
  if (btnSair) {
    btnSair.addEventListener("click", () => {
      fetch("/logout", { method: "POST", credentials: "include" })
        .finally(() => { window.location.href = "/comece.html"; });
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

      fetch("/me", { method: "DELETE", credentials: "include" })
        .then(res => {
          if (!res.ok) throw new Error();
          window.location.href = "/login.html";
        })
        .catch(() => alert("Erro ao excluir conta"));
    });
  }
});