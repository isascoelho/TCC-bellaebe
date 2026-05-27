let planejamentoEditando = null;
let cachePlanejamentos = [];

document.addEventListener("DOMContentLoaded", () => {
  carregarPlanejamentos();

  document.getElementById("btnSalvarPlanejamento")?.addEventListener("click", salvarPlanejamento);

  document.getElementById("btnNovoPlanejamento")?.addEventListener("click", () => {
    limparFormularioPlanejamento();
    planejamentoEditando = null;
    const btn = document.getElementById("btnSalvarPlanejamento");
    if (btn) btn.innerHTML = '<i class="fas fa-save"></i> Salvar planejamento';
    document.querySelector(".agenda-bottom-layout")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => document.getElementById("objetivo")?.focus(), 400);
  });

  document.getElementById("buscarPlanejamento")?.addEventListener("input", aplicarFiltrosAgenda);
  document.getElementById("filtro-status-agenda")?.addEventListener("change", aplicarFiltrosAgenda);
  document.getElementById("filtro-ordem-agenda")?.addEventListener("change", aplicarFiltrosAgenda);
});

/* =========================
   UTIL
========================= */
function formatarValor(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatarData(data) {
  if (!data) return "-";
  const dt = new Date(data);
  if (isNaN(dt.getTime())) return data;
  return dt.toLocaleDateString("pt-BR");
}

function limparFormularioPlanejamento() {
  ["objetivo","dataInicial","dataFinal","valorLimite","valorGasto","observacoes"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

/* =========================
   LISTAR
========================= */
function carregarPlanejamentos() {
  fetch("/agenda", { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Não autenticado");
      return res.json();
    })
    .then(dados => {
      cachePlanejamentos = Array.isArray(dados) ? dados : [];
      aplicarFiltrosAgenda();
      atualizarCards(cachePlanejamentos);
    })
    .catch(err => console.error("Erro ao carregar planejamentos:", err));
}

/* =========================
   FILTROS
========================= */
function aplicarFiltrosAgenda() {
  let lista = [...cachePlanejamentos];

  const busca = document.getElementById("buscarPlanejamento")?.value?.toLowerCase() || "";
  const status = document.getElementById("filtro-status-agenda")?.value || "";
  const ordem = document.getElementById("filtro-ordem-agenda")?.value || "Mais recentes";

  if (busca) {
    lista = lista.filter(p => (p.objetivo || "").toLowerCase().includes(busca));
  }

  if (status === "estourado") {
    lista = lista.filter(p => Number(p.valor_gasto || 0) >= Number(p.valor_limite));
  } else if (status === "ativo") {
    lista = lista.filter(p => Number(p.valor_gasto || 0) < Number(p.valor_limite));
  }

  switch (ordem) {
    case "Mais recentes": lista.sort((a, b) => new Date(b.data_inc) - new Date(a.data_inc)); break;
    case "Mais antigos":  lista.sort((a, b) => new Date(a.data_inc) - new Date(b.data_inc)); break;
    case "Maior limite":  lista.sort((a, b) => Number(b.valor_limite) - Number(a.valor_limite)); break;
    case "Maior gasto":   lista.sort((a, b) => Number(b.valor_gasto || 0) - Number(a.valor_gasto || 0)); break;
  }

  renderizarTabela(lista);
}

/* =========================
   RENDER TABELA
========================= */
function renderizarTabela(lista) {
  const tbody = document.getElementById("lista-planejamentos");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:24px;color:#9ca3af">
          Nenhum planejamento encontrado
        </td>
      </tr>`;
    return;
  }

  lista.forEach(p => {
    const limite = Number(p.valor_limite || 0);
    const gasto  = Number(p.valor_gasto || 0);
    const pct    = limite > 0 ? Math.min((gasto / limite) * 100, 100) : 0;
    const estourado = gasto >= limite && limite > 0;
    const quase = pct >= 80 && !estourado;

    let statusBadge, barColor;
    if (estourado) {
      statusBadge = `<span class="agenda-status estourado">Estourado</span>`;
      barColor = "#ef4444";
    } else if (quase) {
      statusBadge = `<span class="agenda-status" style="background:rgba(245,158,11,.15);color:#b45309">Quase no limite</span>`;
      barColor = "#f59e0b";
    } else {
      statusBadge = `<span class="agenda-status ativo">Ativo</span>`;
      barColor = "linear-gradient(90deg,#ffd43b,#ffcc00)";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:600;color:#1a1a3e">${p.objetivo || "-"}</td>
      <td>${formatarData(p.data_inc)}</td>
      <td>${p.data_pvst ? formatarData(p.data_pvst) : "-"}</td>
      <td><strong class="valor positivo">R$ ${formatarValor(limite)}</strong></td>
      <td>R$ ${formatarValor(gasto)}</td>
      <td style="min-width:120px">
        <div style="font-size:11px;color:#6b7280;margin-bottom:4px">${Math.round(pct)}%</div>
        <div style="background:#f3f4f6;border-radius:999px;height:6px;overflow:hidden">
          <div style="width:${pct}%;height:100%;border-radius:999px;background:${barColor}"></div>
        </div>
      </td>
      <td>${statusBadge}</td>
      <td class="acoes">
        <button class="acao editar" onclick="editarPlanejamento(${p.ID})"><i class="fas fa-pencil"></i></button>
        <button class="acao excluir" onclick="excluirPlanejamento(${p.ID})"><i class="fas fa-trash"></i></button>
      </td>`;
    tbody.appendChild(tr);
  });
}

/* =========================
   CARDS KPI
========================= */
function atualizarCards(lista) {
  let limite = 0;
  let gastoPlanejado = 0;
  let ativos = 0;

  lista.forEach(p => {
    limite         += Number(p.valor_limite || 0);
    gastoPlanejado += Number(p.valor_gasto || 0);
    if (Number(p.valor_gasto || 0) < Number(p.valor_limite || 0)) ativos++;
  });

  const cardPlanejado     = document.getElementById("cardPlanejado");
  const cardGasto         = document.getElementById("cardGastoPlanejado");
  const cardAtivos        = document.getElementById("cardAtivos");
  const cardAtivosSub     = document.getElementById("cardAtivosSub");
  const cardPlanejadoSub  = document.getElementById("cardPlanejadoSub");

  if (cardPlanejado)    cardPlanejado.innerText    = `R$ ${formatarValor(limite)}`;
  if (cardGasto)        cardGasto.innerText        = `R$ ${formatarValor(gastoPlanejado)}`;
  if (cardAtivos)       cardAtivos.innerText       = lista.length;
  if (cardAtivosSub)    cardAtivosSub.innerText    = `${ativos} ativo${ativos !== 1 ? "s" : ""}`;
  if (cardPlanejadoSub) cardPlanejadoSub.innerText = `${lista.length} planejamento${lista.length !== 1 ? "s" : ""}`;

  const cardSaldo = document.getElementById("cardSaldoAtual");
  if (cardSaldo) {
    Promise.all([
      fetch("/receitas/total", { credentials: "include" }).then(r => r.json()),
      fetch("/despesas/total", { credentials: "include" }).then(r => r.json())
    ])
      .then(([receitas, despesas]) => {
        const saldo = Number(receitas?.total || 0) - Number(despesas?.total || 0);
        cardSaldo.innerText = `R$ ${formatarValor(saldo)}`;
        cardSaldo.style.color = saldo >= 0 ? "#15803d" : "#dc3545";
      })
      .catch(() => { cardSaldo.innerText = "R$ 0,00"; });
  }
}

/* =========================
   SALVAR
========================= */
function salvarPlanejamento() {
  const dados = {
    objetivo:    document.getElementById("objetivo")?.value || "",
    data_inc:    document.getElementById("dataInicial")?.value || "",
    data_pvst:   document.getElementById("dataFinal")?.value || null,
    valor_limite: Number(document.getElementById("valorLimite")?.value || 0),
    valor_gasto:  Number(document.getElementById("valorGasto")?.value || 0),
    obs:          document.getElementById("observacoes")?.value || null,
  };

  const metodo = planejamentoEditando ? "PUT" : "POST";
  const url = planejamentoEditando ? `/agenda/${planejamentoEditando}` : "/agenda";

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
      const btn = document.getElementById("btnSalvarPlanejamento");
      if (btn) btn.innerHTML = '<i class="fas fa-save"></i> Salvar planejamento';
      carregarPlanejamentos();
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao salvar planejamento");
    });
}

/* =========================
   EDITAR
========================= */
function editarPlanejamento(id) {
  const p = cachePlanejamentos.find(x => x.ID === id);
  if (!p) return;

  document.getElementById("objetivo").value    = p.objetivo || "";
  document.getElementById("dataInicial").value = p.data_inc || "";
  document.getElementById("dataFinal").value   = p.data_pvst || "";
  document.getElementById("valorLimite").value = p.valor_limite || "";
  document.getElementById("valorGasto").value  = p.valor_gasto || "";
  document.getElementById("observacoes").value = p.obs || "";

  planejamentoEditando = id;

  const btn = document.getElementById("btnSalvarPlanejamento");
  if (btn) btn.innerHTML = '<i class="fas fa-save"></i> Atualizar planejamento';

  document.querySelector(".agenda-bottom-layout")?.scrollIntoView({ behavior: "smooth" });
}

/* =========================
   EXCLUIR
========================= */
function excluirPlanejamento(id) {
  if (!confirm("Deseja excluir este planejamento?")) return;

  fetch(`/agenda/${id}`, { method: "DELETE", credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao excluir planejamento");
      return res.json();
    })
    .then(() => carregarPlanejamentos())
    .catch(err => console.error("Erro ao excluir planejamento:", err));
}