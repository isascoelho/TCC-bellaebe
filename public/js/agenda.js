let planejamentoEditando = null;
let cachePlanejamentos = [];

/* ================== LISTAR ================== */
function carregarPlanejamentos() {
  fetch("/agenda", { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Não autenticado");
      return res.json();
    })
    .then(dados => {
      cachePlanejamentos = Array.isArray(dados) ? dados : [];
      renderizarTabela(cachePlanejamentos);
      atualizarCards(cachePlanejamentos);
    })
    .catch(err => {
      console.error("Erro ao carregar planejamentos:", err);
    });
}

/* ================== RENDER ================== */
function renderizarTabela(lista) {
  const tbody = document.getElementById("lista-planejamentos");
  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `
      <tr><td colspan="7">Nenhum planejamento encontrado</td></tr>
    `;
    return;
  }

  lista.forEach(p => {
    const status =
      Number(p.valor_gasto || 0) >= Number(p.valor_limite)
        ? "❌ Estourado"
        : "✅ Dentro da meta";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.objetivo}</td>
      <td>${formatarData(p.data_inc)}</td>
      <td>${p.data_pvst ? formatarData(p.data_pvst) : "-"}</td>
      <td>R$ ${Number(p.valor_limite).toFixed(2)}</td>
      <td>R$ ${Number(p.valor_gasto || 0).toFixed(2)}</td>
      <td>${status}</td>
      <td class="acoes">
        <button onclick="editarPlanejamento(${p.ID})">✏️</button>
        <button onclick="excluirPlanejamento(${p.ID})">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* ================== CARDS ================== */
function atualizarCards(lista) {
  let limite = 0;
  let gasto = 0;

  lista.forEach(p => {
    limite += Number(p.valor_limite || 0);
    gasto += Number(p.valor_gasto || 0);
  });

  document.getElementById("cardPlanejado").innerText =
    `R$ ${limite.toFixed(2)}`;

  document.getElementById("cardGastoPlanejado").innerText =
    `R$ ${gasto.toFixed(2)}`;

  document.getElementById("cardAtivos").innerText = lista.length;
}

/* ================== SALVAR / EDITAR ================== */
document.querySelector(".btnSalvarPlanejamento")
  .addEventListener("click", () => {

    const dados = {
      objetivo: document.getElementById("objetivo").value,
      data_inc: document.getElementById("dataInicial").value,
      data_pvst: document.getElementById("dataFinal").value || null,
      valor_limite: Number(document.getElementById("valorLimite").value),
      valor_gasto: Number(document.getElementById("valorGasto").value || 0),
      obs: document.getElementById("observacoes").value || null,
    };

    // 🔥 DEBUG CORRETO
    console.log("DADOS ENVIADOS:", dados);

    const metodo = planejamentoEditando ? "PUT" : "POST";
    const url = planejamentoEditando
      ? `/agenda/${planejamentoEditando}`
      : "/agenda";

    fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    })
      .then(res => {
        if (!res.ok) throw new Error("Erro ao salvar");
        return res.json();
      })
      .then(() => {
        planejamentoEditando = null;
         limparFormularioPlanejamento();
        carregarPlanejamentos();
      })
      .catch(err => {
        console.error(err);
        alert("Erro ao salvar planejamento");
      });
});

/* ================== EDITAR ================== */
function editarPlanejamento(id) {
  const p = cachePlanejamentos.find(x => x.ID === id);
  if (!p) return;

  document.getElementById("objetivo").value = p.objetivo;
  document.getElementById("dataInicial").value = p.data_inc;
  document.getElementById("dataFinal").value = p.data_pvst || "";
  document.getElementById("valorLimite").value = p.valor_limite;
  document.getElementById("valorGasto").value = p.valor_gasto || "";
  document.getElementById("observacoes").value = p.obs || "";

  planejamentoEditando = id;
}

/* ================== EXCLUIR ================== */
function excluirPlanejamento(id) {
  if (!confirm("Deseja excluir este planejamento?")) return;

  fetch(`/agenda/${id}`, {
    method: "DELETE",
    credentials: "include"
  }).then(() => carregarPlanejamentos());
}

/* ================== BUSCAR ================== */
document.getElementById("buscarPlanejamento")
  .addEventListener("input", e => {
    const termo = e.target.value.toLowerCase();
    renderizarTabela(
      cachePlanejamentos.filter(p =>
        p.objetivo.toLowerCase().includes(termo)
      )
    );
});

/* ================== UTIL ================== */
function formatarData(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}

/* ================== INIT ================== */
carregarPlanejamentos();

function limparFormularioPlanejamento() {
  document.getElementById("objetivo").value = "";
  document.getElementById("dataInicial").value = "";
  document.getElementById("dataFinal").value = "";
  document.getElementById("valorLimite").value = "";
  document.getElementById("valorGasto").value = "";
  document.getElementById("observacoes").value = "";
}