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


function definirPeriodoResumo() {
  const agora = new Date();

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril",
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const mes = meses[agora.getMonth()];
  const ano = agora.getFullYear();

  document.getElementById("periodoResumo").innerText =
    `Período: ${mes} / ${ano}`;
}

function atualizarResumoMes() {
  const linhas = document.querySelectorAll("#lista-receitas tr");

  let total = 0;
  let maior = 0;
  let quantidade = 0;

  linhas.forEach(linha => {
    const colunaValor = linha.querySelector("td:nth-child(6)");
    if (!colunaValor) return;

    const valor = parseFloat(
      colunaValor.innerText
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim()
    );

    if (isNaN(valor)) return;

    total += valor;
    quantidade++;

    if (valor > maior) {
      maior = valor;
    }
  });

  const media = quantidade > 0 ? total / quantidade : 0;

  const totalEl = document.getElementById("resumoTotal");
  const mediaEl = document.getElementById("resumoMedia");
  const maiorEl = document.getElementById("resumoMaior");
  const estadoEl = document.getElementById("resumoEstado");

  totalEl.innerText = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  mediaEl.innerText = media.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  maiorEl.innerText = maior.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  // estado vazio
  estadoEl.hidden = quantidade !== 0;

  // feedback visual
  [totalEl, mediaEl, maiorEl].forEach(el => {
    el.classList.add("atualizado");
    setTimeout(() => el.classList.remove("atualizado"), 400);
  });
}

/* chama ao carregar */
definirPeriodoResumo();
atualizarResumoMes();