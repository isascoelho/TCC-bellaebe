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
  if (!tbody) return;

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
  let gastoPlanejado = 0;

  lista.forEach(p => {
    limite += Number(p.valor_limite || 0);
    gastoPlanejado += Number(p.valor_gasto || 0);
  });

  const cardPlanejado = document.getElementById("cardPlanejado");
  const cardGastoPlanejado = document.getElementById("cardGastoPlanejado");
  const cardAtivos = document.getElementById("cardAtivos");
  const cardSaldoAtual = document.getElementById("cardSaldoAtual");

  if (cardPlanejado) {
    cardPlanejado.innerText = `R$ ${limite.toFixed(2)}`;
  }

  if (cardGastoPlanejado) {
    cardGastoPlanejado.innerText = `R$ ${gastoPlanejado.toFixed(2)}`;
  }

  if (cardAtivos) {
    cardAtivos.innerText = lista.length;
  }

  if (cardSaldoAtual) {
    Promise.all([
      fetch("/receitas/total", { credentials: "include" }).then(r => r.json()),
      fetch("/despesas/total", { credentials: "include" }).then(r => r.json())
    ])
      .then(([receitas, despesas]) => {
        const totalReceitas = Number(receitas?.total || 0);
        const totalDespesas = Number(despesas?.total || 0);
        const saldoAtual = totalReceitas - totalDespesas;

        cardSaldoAtual.innerText = `R$ ${saldoAtual.toFixed(2)}`;
      })
      .catch(err => {
        console.error("Erro ao atualizar saldo atual da agenda:", err);
        cardSaldoAtual.innerText = "R$ 0,00";
      });
  }
}

/* ================== SALVAR / EDITAR ================== */
const btnSalvarPlanejamento = document.getElementById("btnSalvarPlanejamento");

if (btnSalvarPlanejamento) {
  btnSalvarPlanejamento.addEventListener("click", () => {
    const dados = {
      objetivo: document.getElementById("objetivo")?.value || "",
      data_inc: document.getElementById("dataInicial")?.value || "",
      data_pvst: document.getElementById("dataFinal")?.value || null,
      valor_limite: Number(document.getElementById("valorLimite")?.value || 0),
      valor_gasto: Number(document.getElementById("valorGasto")?.value || 0),
      obs: document.getElementById("observacoes")?.value || null,
    };

    console.log("DADOS ENVIADOS:", dados);

    const metodo = planejamentoEditando ? "PUT" : "POST";
    const url = planejamentoEditando
      ? `/agenda/${planejamentoEditando}`
      : "/agenda";

    fetch(url, {
      method: metodo,
      credentials: "include",
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

        if (btnSalvarPlanejamento) {
          btnSalvarPlanejamento.innerText = "Salvar planejamento";
        }

        carregarPlanejamentos();
      })
      .catch(err => {
        console.error(err);
        alert("Erro ao salvar planejamento");
      });
  });
}

/* ================== EDITAR ================== */
function editarPlanejamento(id) {
  const p = cachePlanejamentos.find(x => x.ID === id);
  if (!p) return;

  document.getElementById("objetivo").value = p.objetivo || "";
  document.getElementById("dataInicial").value = p.data_inc || "";
  document.getElementById("dataFinal").value = p.data_pvst || "";
  document.getElementById("valorLimite").value = p.valor_limite || "";
  document.getElementById("valorGasto").value = p.valor_gasto || "";
  document.getElementById("observacoes").value = p.obs || "";

  planejamentoEditando = id;

  if (btnSalvarPlanejamento) {
    btnSalvarPlanejamento.innerText = "Atualizar planejamento";
  }
}

/* ================== EXCLUIR ================== */
function excluirPlanejamento(id) {
  if (!confirm("Deseja excluir este planejamento?")) return;

  fetch(`/agenda/${id}`, {
    method: "DELETE",
    credentials: "include"
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao excluir planejamento");
      return res.json();
    })
    .then(() => {
      carregarPlanejamentos();
    })
    .catch(err => {
      console.error("Erro ao excluir planejamento:", err);
    });
}

/* ================== BUSCAR ================== */
const campoBusca = document.getElementById("buscarPlanejamento");

if (campoBusca) {
  campoBusca.addEventListener("input", e => {
    const termo = e.target.value.toLowerCase();

    renderizarTabela(
      cachePlanejamentos.filter(p =>
        (p.objetivo || "").toLowerCase().includes(termo)
      )
    );
  });
}

/* ================== UTIL ================== */
function formatarData(data) {
  if (!data) return "-";

  const dt = new Date(data);
  if (isNaN(dt.getTime())) return data;

  return dt.toLocaleDateString("pt-BR");
}

function limparFormularioPlanejamento() {
  const ids = [
    "objetivo",
    "dataInicial",
    "dataFinal",
    "valorLimite",
    "valorGasto",
    "observacoes"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

/* ================== INIT ================== */
carregarPlanejamentos();