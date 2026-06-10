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
     MÁSCARA CPF
  ========================= */
  function mascaraCPF(valor) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

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
          const [ano, mes, dia] = String(value).slice(0, 10).split("-").map(Number);
valueEl.textContent = `${String(dia).padStart(2,"0")}/${String(mes).padStart(2,"0")}/${ano}`;
        } else if (field === "cpf") {
          valueEl.textContent = mascaraCPF(String(value));
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
     ABRIR MODAL — CAMPOS INDIVIDUAIS
  ========================= */
  document.querySelectorAll(".btn-completar").forEach(btn => {
    btn.addEventListener("click", () => {
      const field = btn.dataset.field;

      if (!field) {
        const isAlterarSenha = btn.closest(".config-item")?.querySelector(".label")?.textContent?.includes("Senha");
        const is2fa = btn.closest(".config-item")?.querySelector(".label")?.textContent?.includes("2 etapas");

        if (isAlterarSenha) { abrirModalSenha(); return; }

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
    } else if (field === "cpf") {
      modalFieldContainer.innerHTML = `
        <input type="text" id="modalInput" placeholder="000.000.000-00" maxlength="14" />`;
    } else {
      const tipo = field === "data_nascimento" ? "date" : "text";
      modalFieldContainer.innerHTML = `
        <input type="${tipo}" id="modalInput" placeholder="${labels[field] || ""}" />`;
    }

    const input = document.getElementById("modalInput");
    if (field === "cpf" && user?.cpf) {
      input.value = mascaraCPF(String(user.cpf));
    } else {
      input.value = user?.[field] || "";
    } 
    if (field === "data_nascimento" && input.value) {
  input.value = input.value.slice(0, 10);
}

    // aplica máscara em tempo real no CPF
    if (field === "cpf") {
      input.addEventListener("input", () => {
        input.value = mascaraCPF(input.value);
      });
    }

    modal.style.display = "flex";
    setTimeout(() => input.focus(), 50);
  }

  /* =========================
     ABRIR MODAL — EDITAR TODOS OS DADOS
  ========================= */
  if (btnEditarDados) {
    btnEditarDados.addEventListener("click", () => {
      currentField = null;
      modalTitle.textContent = "Editar dados";
      modalFieldContainer.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px">

          <div>
            <label style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.4px">CPF</label>
            <input type="text" id="edit_cpf" placeholder="000.000.000-00" maxlength="14"
              value="${user?.cpf ? mascaraCPF(String(user.cpf)) : ""}"
              style="width:100%;height:44px;padding:0 14px;border-radius:10px;border:1.5px solid #e5e7eb;font-size:14px;margin-top:4px" />
          </div>

          <div>
            <label style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.4px">Data de nascimento</label>
            <input type="date" id="edit_data_nascimento"
              value="${user?.data_nascimento ? user.data_nascimento.split("T")[0] : ""}"
              style="width:100%;height:44px;padding:0 14px;border-radius:10px;border:1.5px solid #e5e7eb;font-size:14px;margin-top:4px" />
          </div>

          <div>
            <label style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.4px">Sexo</label>
            <select id="edit_sexo"
              style="width:100%;height:44px;padding:0 14px;border-radius:10px;border:1.5px solid #e5e7eb;font-size:14px;margin-top:4px">
              <option value="">Selecione</option>
              <option value="Feminino" ${user?.sexo === "Feminino" ? "selected" : ""}>Feminino</option>
              <option value="Masculino" ${user?.sexo === "Masculino" ? "selected" : ""}>Masculino</option>
              <option value="Não binário" ${user?.sexo === "Não binário" ? "selected" : ""}>Não binário</option>
              <option value="Prefiro não informar" ${user?.sexo === "Prefiro não informar" ? "selected" : ""}>Prefiro não informar</option>
            </select>
          </div>

          <div>
            <label style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.4px">Telefone</label>
            <input type="text" id="edit_fone" placeholder="(00) 00000-0000"
              value="${user?.fone || ""}"
              style="width:100%;height:44px;padding:0 14px;border-radius:10px;border:1.5px solid #e5e7eb;font-size:14px;margin-top:4px" />
          </div>

          <div>
            <label style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.4px">Endereço</label>
            <input type="text" id="edit_endereco" placeholder="Rua, número, cidade"
              value="${user?.endereco || ""}"
              style="width:100%;height:44px;padding:0 14px;border-radius:10px;border:1.5px solid #e5e7eb;font-size:14px;margin-top:4px" />
          </div>

          <div>
            <label style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.4px">Vínculo empregatício</label>
            <select id="edit_vinculo"
              style="width:100%;height:44px;padding:0 14px;border-radius:10px;border:1.5px solid #e5e7eb;font-size:14px;margin-top:4px">
              <option value="">Selecione</option>
              <option value="CLT" ${user?.vinculo === "CLT" ? "selected" : ""}>CLT</option>
              <option value="Autônomo" ${user?.vinculo === "Autônomo" ? "selected" : ""}>Autônomo</option>
              <option value="PJ" ${user?.vinculo === "PJ" ? "selected" : ""}>PJ</option>
              <option value="Servidor público" ${user?.vinculo === "Servidor público" ? "selected" : ""}>Servidor público</option>
              <option value="Estudante" ${user?.vinculo === "Estudante" ? "selected" : ""}>Estudante</option>
              <option value="Desempregado" ${user?.vinculo === "Desempregado" ? "selected" : ""}>Desempregado</option>
              <option value="Outro" ${user?.vinculo === "Outro" ? "selected" : ""}>Outro</option>
            </select>
          </div>

        </div>
      `;

      // máscara CPF no modal de editar todos
      const editCpfInput = document.getElementById("edit_cpf");
      if (editCpfInput) {
        editCpfInput.addEventListener("input", () => {
          editCpfInput.value = mascaraCPF(editCpfInput.value);
        });
      }

      modal.style.display = "flex";
    });
  }

  /* =========================
     ABRIR MODAL — ALTERAR SENHA
  ========================= */
  function abrirModalSenha() {
    currentField = null;
    modalTitle.textContent = "Alterar senha";
    modalFieldContainer.innerHTML = `
      <input type="password" id="senhaAtual"     placeholder="Senha atual"           style="margin-bottom:10px;display:block;width:100%" />
      <input type="password" id="senhaNova"      placeholder="Nova senha"            style="margin-bottom:10px;display:block;width:100%" />
      <input type="password" id="senhaConfirmar" placeholder="Confirmar nova senha"  style="display:block;width:100%" />
    `;
    modal.style.display = "flex";
    setTimeout(() => document.getElementById("senhaAtual")?.focus(), 50);
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

      /* --- Editar todos os dados --- */
      const editCpf = document.getElementById("edit_cpf");
      if (editCpf) {
        const campos = [
          { id: "edit_cpf",             field: "cpf" },
          { id: "edit_data_nascimento", field: "data_nascimento" },
          { id: "edit_sexo",            field: "sexo" },
          { id: "edit_fone",            field: "fone" },
          { id: "edit_endereco",        field: "endereco" },
          { id: "edit_vinculo",         field: "vinculo" }
        ];

        const promessas = campos
          .filter(c => {
            const el = document.getElementById(c.id);
            return el && el.value.trim() !== "";
          })
          .map(c => {
            const value = document.getElementById(c.id).value.trim();
            return fetch("/me", {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ field: c.field, value })
            }).then(() => { user[c.field] = value; });
          });
    const cpfEl = document.getElementById("edit_cpf");
        if (cpfEl && cpfEl.value.trim()) {
          const apenasNumeros = cpfEl.value.replace(/\D/g, "");
          if (apenasNumeros.length !== 11) {
            alert("CPF inválido. Digite os 11 dígitos.");
            return;
          }
        }



        Promise.all(promessas)
          .then(() => { fecharModal(); render(); })
          .catch(() => alert("Erro ao salvar dados"));
        return;
      }

      /* --- Alterar senha --- */
      const senhaAtualEl = document.getElementById("senhaAtual");
      if (senhaAtualEl) {
        const atual     = senhaAtualEl.value.trim();
        const nova      = document.getElementById("senhaNova")?.value.trim();
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

      
      /* --- Campo individual --- */
      if (!currentField) return;

      const modalInputAtual = document.getElementById("modalInput");
      if (!modalInputAtual) return;

      const value = modalInputAtual.value.trim();
      if (!value) return;

        if (currentField === "cpf") {
        const apenasNumeros = value.replace(/\D/g, "");
        if (apenasNumeros.length !== 11) {
          alert("CPF inválido. Digite os 11 dígitos.");
          return;
        }
      }

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
          window.location.href = "/home.html";
        })
        .catch(() => alert("Erro ao excluir conta"));
    });
  }
});