let receitaEditandoId = null;

document.addEventListener("DOMContentLoaded", () => {
  carregarReceitas();
  if (typeof atualizarTudo === "function") atualizarTudo();

  document
    .getElementById("btnSalvarReceita")
    .addEventListener("click", salvarReceita);
});

/* =========================
   SALVAR / EDITAR
========================= */
function salvarReceita() {
  const dados = {
    valor: document.getElementById("valor").value,
    periodo: document.getElementById("data").value,
    categoria: document.getElementById("categoria").value,
    banco: document.getElementById("banco").value,
    periodicidade: document.getElementById("periodicidade").value,
    descricao: document.getElementById("descricao").value
  };

  const metodo = receitaEditandoId ? "PUT" : "POST";
  const url = receitaEditandoId
    ? `/receitas/${receitaEditandoId}`
    : "/receitas";

  fetch(url, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  })
  .then(() => {
    limparFormulario();
    receitaEditandoId = null;
    document.getElementById("btnSalvarReceita").innerText = "Salvar";
    carregarReceitas();
    if (typeof atualizarTudo === "function") atualizarTudo();
  });
}

/* =========================
   LISTAR
========================= */
function carregarReceitas() {
  fetch("/receitas")
    .then(res => res.json())
    .then(receitas => {
      const tbody = document.getElementById("lista-receitas");
      tbody.innerHTML = "";

      if (!Array.isArray(receitas) || receitas.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="estado-vazio">
              Nenhuma receita cadastrada ainda
            </td>
          </tr>`;
        return;
      }

      receitas.forEach(r => {
        const descricao =
          r.descricao && r.descricao !== "null" ? r.descricao : "-";
        const periodicidade =
          r.periodicidade && r.periodicidade !== "null" ? r.periodicidade : "Única";

        tbody.innerHTML += `
          <tr>
            <td>${formatarData(r.periodo)}</td>
            <td>${r.categoria}</td>
            <td>${r.banco}</td>
            <td>${descricao}</td>
            <td>${periodicidade}</td>
            <td><strong>R$ ${Number(r.valor).toFixed(2)}</strong></td>
            <td>
              <button onclick="editarReceita(${r.ID})">✏️</button>
              <button onclick="excluirReceita(${r.ID})">🗑️</button>
            </td>
          </tr>`;
      });
    });
}

/* =========================
   EDITAR
========================= */
function editarReceita(id) {
  if (!id) {
    console.error("ID inválido para edição:", id);
    return;
  }

  fetch(`/receitas/${id}`)
    .then(res => res.json())
    .then(r => {
      if (!r) {
        alert("Receita não encontrada.");
        return;
      }

      document.getElementById("valor").value = r.valor;
      document.getElementById("data").value = r.periodo.split("T")[0];
      document.getElementById("categoria").value = r.categoria;
      document.getElementById("banco").value = r.banco;
      document.getElementById("periodicidade").value = r.periodicidade;
      document.getElementById("descricao").value =
        r.descricao && r.descricao !== "null" ? r.descricao : "";

      receitaEditandoId = id;
      document.getElementById("btnSalvarReceita").innerText = "Atualizar";
    });
}

/* =========================
   EXCLUIR
========================= */
function excluirReceita(id) {
  if (!confirm("Deseja excluir esta receita?")) return;

  fetch(`/receitas/${id}`, { method: "DELETE" })
    .then(() => {
      carregarReceitas();
      if (typeof atualizarTudo === "function") atualizarTudo();
    });
}

/* =========================
   UTIL
========================= */
function limparFormulario() {
  ["valor", "data", "categoria", "banco", "descricao"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function formatarData(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}
