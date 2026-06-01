let despesaEditando = null;
let despesasOriginais = [];
let periodoSelecionado = null;

document.addEventListener("DOMContentLoaded", () => {
  preencherSelectPeriodo();

  const btnSalvar = document.getElementById("btnSalvarReceita");
  if (btnSalvar) btnSalvar.addEventListener("click", salvarDespesa);

  const buscaInput = document.getElementById("busca-despesa");
  const filtroCategoria = document.getElementById("filtro-categoria");
  const filtroStatus = document.getElementById("filtro-status");
  const filtroOrdem = document.getElementById("filtro-ordem");
  const filtroPeriodo = document.getElementById("filtro-periodo");

  if (buscaInput) buscaInput.addEventListener("keyup", aplicarFiltros);
  if (filtroCategoria) filtroCategoria.addEventListener("change", aplicarFiltros);
  if (filtroStatus) filtroStatus.addEventListener("change", aplicarFiltros);
  if (filtroOrdem) filtroOrdem.addEventListener("change", aplicarFiltros);
  if (filtroPeriodo) filtroPeriodo.addEventListener("change", filtrarPorPeriodo);

  const btnNovaModal = document.getElementById("btnNovaModal");
  if (btnNovaModal) btnNovaModal.addEventListener("click", novaDepesaClick);
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
  // Evita problema de timezone: usa apenas a parte da data
  const soData = (typeof data === "string" ? data : data.toISOString()).slice(0, 10);
  const [ano, mes, dia] = soData.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
}

function getPeriodoAtual() {
  if (periodoSelecionado) return periodoSelecionado;
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

/* =========================
   PERÍODO
========================= */
function preencherSelectPeriodo() {
  const selectPeriodo = document.getElementById("filtro-periodo");
  if (!selectPeriodo) return;

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  fetch("/despesas/meses", { credentials: "include" })
    .then(res => res.json())
    .then(mesesDisponiveis => {
      selectPeriodo.innerHTML = "";

      const agora = new Date();
      const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
      if (!mesesDisponiveis.includes(mesAtual)) {
        mesesDisponiveis.unshift(mesAtual);
      }

      mesesDisponiveis.forEach((mesAno, i) => {
        const [ano, mes] = mesAno.split("-");
        const opcao = document.createElement("option");
        opcao.value = mesAno;
        opcao.innerText = `${meses[Number(mes) - 1]} / ${ano}`;
        if (i === 0) {
          opcao.selected = true;
          periodoSelecionado = mesAno;
        }
        selectPeriodo.appendChild(opcao);
      });

      definirPeriodoResumo();
      carregarDespesas();
      atualizarCardsDespesas();
      carregarResumoDespesas();
    })
    .catch(() => {
      selectPeriodo.innerHTML = "";
      const agora = new Date();
      for (let i = 0; i < 24; i++) {
        const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        const mes = d.getMonth();
        const ano = d.getFullYear();
        const opcao = document.createElement("option");
        opcao.value = `${ano}-${String(mes + 1).padStart(2, "0")}`;
        opcao.innerText = `${meses[mes]} / ${ano}`;
        if (i === 0) {
          opcao.selected = true;
          periodoSelecionado = opcao.value;
        }
        selectPeriodo.appendChild(opcao);
      }

      definirPeriodoResumo();
      carregarDespesas();
      atualizarCardsDespesas();
      carregarResumoDespesas();
    });
}

function filtrarPorPeriodo() {
  const selectPeriodo = document.getElementById("filtro-periodo");
  if (!selectPeriodo) return;

  periodoSelecionado = selectPeriodo.value;

  document.getElementById("busca-despesa").value = "";
  document.getElementById("filtro-categoria").value = "";
  document.getElementById("filtro-status").value = "";
  document.getElementById("filtro-ordem").value = "Mais recentes";

  aplicarFiltros();
  atualizarCardsDespesas();
  carregarResumoDespesas();
}

function novaDepesaClick() {
  limparFormulario();
  despesaEditando = null;

  document.getElementById("busca-despesa").value = "";
  document.getElementById("filtro-categoria").value = "";
  document.getElementById("filtro-status").value = "";
  document.getElementById("filtro-ordem").value = "Mais recentes";

  aplicarFiltros();
  document.querySelector(".receitas-form")?.scrollIntoView({ behavior: "smooth" });
}

function definirPeriodoResumo() {
  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  const periodo = getPeriodoAtual();
  const [ano, mes] = periodo.split("-");
  const periodoEl = document.getElementById("periodoResumo");
  if (periodoEl) {
    periodoEl.innerText = `Período: ${meses[parseInt(mes) - 1]} / ${ano}`;
  }
}

/* =========================
   SALVAR / EDITAR
========================= */
function salvarDespesa() {
  const periodo = document.getElementById("data").value;
  const valor = Number(document.getElementById("valor").value);
  const categoria = document.getElementById("categoria").value;
  const banco = document.getElementById("banco").value;
  const descricao = document.getElementById("descricao").value;
  const situacao = document.getElementById("situacao").value;
  const periodicidade = document.getElementById("periodicidade").value;
  const parcelamento = document.getElementById("parcelamento").value === "Parcelada";

  if (!periodo || isNaN(valor) || valor <= 0 || !situacao || !periodicidade) {
    alert("Preencha corretamente todos os campos obrigatórios");
    return;
  }

  const despesa = {
    periodo, valor,
    categoria: categoria || null,
    banco: banco || null,
    descricao: descricao || null,
    situacao, periodicidade, parcelamento
  };

  const metodo = despesaEditando ? "PUT" : "POST";
  const url = despesaEditando ? `/despesas/${despesaEditando}` : "/despesas";

  fetch(url, {
    method: metodo,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(despesa)
  })
    .then(res => {
      if (!res.ok) return res.json().then(err => { throw err; });
      return res.json();
    })
    .then(() => {
      despesaEditando = null;
      limparFormulario();

      document.getElementById("busca-despesa").value = "";
      document.getElementById("filtro-categoria").value = "";
      document.getElementById("filtro-status").value = "";
      document.getElementById("filtro-ordem").value = "Mais recentes";

      preencherSelectPeriodo();

      if (typeof atualizarTudo === "function") atualizarTudo();
      if (typeof carregarAtividadesHome === "function") carregarAtividadesHome();

      alert("Despesa salva com sucesso!");
    })
    .catch(err => {
      console.error("Erro ao salvar despesa:", err);
      alert("Erro ao salvar despesa. Verifique os campos.");
    });
}

/* =========================
   LISTAR
========================= */
function carregarDespesas() {
  fetch("/despesas", { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao buscar despesas");
      return res.json();
    })
    .then(despesas => {
      despesasOriginais = despesas || [];
      aplicarFiltros();
    })
    .catch(err => console.error("Erro ao listar despesas:", err));
}

function renderizarTabela(despesas) {
  const tbody = document.getElementById("lista-despesas");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!Array.isArray(despesas) || !despesas.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 20px; color: #999;">
          Nenhuma despesa encontrada
        </td>
      </tr>`;
    return;
  }

  despesas.forEach(d => {
    const tr = document.createElement("tr");
    const statusBadge = d.situacao == 1 ? "✓ Pago" : "⏳ Pendente";
    const tipoParcelamento = d.parcelamento ? "Parcelada" : "À vista";

    tr.innerHTML = `
      <td>${formatarData(d.periodo)}</td>
      <td><span class="tag categoria">${d.categoria || "-"}</span></td>
      <td>${d.banco || "-"}</td>
      <td class="descricao">${d.descricao || "-"}</td>
      <td><span style="background: ${d.situacao == 1 ? "rgba(25,135,84,0.2)" : "rgba(220,53,69,0.2)"}; padding: 4px 10px; border-radius: 8px; font-weight: 600; color: ${d.situacao == 1 ? "#198754" : "#dc3545"};">${statusBadge}</span></td>
      <td>${tipoParcelamento}</td>
      <td><strong class="valor positivo">R$ ${formatarValor(d.valor || 0)}</strong></td>
      <td class="acoes">
        <button class="acao editar" onclick="editarDespesa(${d.ID})"><i class="fas fa-pencil"></i></button>
        <button class="acao excluir" onclick="excluirDespesa(${d.ID})"><i class="fas fa-trash"></i></button>
      </td>`;
    tbody.appendChild(tr);
  });
}

/* =========================
   EDITAR
========================= */
function editarDespesa(id) {
  fetch(`/despesas/${id}`, { credentials: "include" })
    .then(res => res.json())
    .then(d => {
      if (!d) return;

      document.getElementById("valor").value = d.valor || "";
      document.getElementById("data").value = (d.periodo || "").slice(0, 10);
      document.getElementById("categoria").value = d.categoria || "";
      document.getElementById("banco").value = d.banco || "";
      document.getElementById("descricao").value = d.descricao || "";
      document.getElementById("situacao").value = d.situacao || "";
      document.getElementById("periodicidade").value = d.periodicidade || "";
      document.getElementById("parcelamento").value = d.parcelamento ? "Parcelada" : "À vista";

      despesaEditando = id;
      document.querySelector(".receitas-form")?.scrollIntoView({ behavior: "smooth" });
    })
    .catch(err => console.error("Erro ao carregar despesa para edição:", err));
}

/* =========================
   EXCLUIR
========================= */
function excluirDespesa(id) {
  if (!confirm("Excluir esta despesa?")) return;

  fetch(`/despesas/${id}`, { method: "DELETE", credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao excluir despesa");
      return res.json();
    })
    .then(() => {
      document.getElementById("busca-despesa").value = "";
      document.getElementById("filtro-categoria").value = "";
      document.getElementById("filtro-status").value = "";
      document.getElementById("filtro-ordem").value = "Mais recentes";

      preencherSelectPeriodo();

      if (typeof atualizarTudo === "function") atualizarTudo();
      if (typeof carregarAtividadesHome === "function") carregarAtividadesHome();
    })
    .catch(err => console.error("Erro ao excluir despesa:", err));
}

/* =========================
   LIMPAR FORMULÁRIO
========================= */
function limparFormulario() {
  document.getElementById("valor").value = "";
  document.getElementById("data").value = "";
  document.getElementById("categoria").value = "";
  document.getElementById("banco").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("situacao").value = "";
  document.getElementById("periodicidade").value = "";
  document.getElementById("parcelamento").value = "À vista";
  despesaEditando = null;
}

/* =========================
   CARDS KPI
========================= */
function atualizarCardsDespesas() {
  fetch("/despesas", { credentials: "include" })
    .then(res => res.json())
    .then(despesas => {
      const periodo = getPeriodoAtual();
      let filtradas = (despesas || []).filter(d => (d.periodo || "").slice(0, 7) === periodo);

      if (!filtradas.length) {
        document.getElementById("totalMesDespesa").innerText = "R$ 0,00";
        document.getElementById("ultimaDespesaCard").innerText = "R$ 0,00";
        document.getElementById("mediaDispesa").innerText = "R$ 0,00";
        document.getElementById("despesasPendentes").innerText = "0";
        document.getElementById("totalRegistros").innerText = "0 despesas registradas";
        document.getElementById("maiorDespesaData").innerText = "Nenhuma despesa";
        document.getElementById("valorPendente").innerText = "R$ 0,00 para vencer";
        return;
      }

      const total = filtradas.reduce((acc, d) => acc + Number(d.valor || 0), 0);
      document.getElementById("totalMesDespesa").innerText = `R$ ${formatarValor(total)}`;

      const maiorDespesa = filtradas.reduce((max, d) =>
        Number(d.valor || 0) > Number(max.valor || 0) ? d : max);
      document.getElementById("ultimaDespesaCard").innerText = `R$ ${formatarValor(maiorDespesa.valor || 0)}`;
      document.getElementById("maiorDespesaData").innerText =
        `${maiorDespesa.categoria || "Sem categoria"} · ${formatarData(maiorDespesa.periodo)}`;

      const pendentes = filtradas.filter(d => d.situacao == 2);
      document.getElementById("despesasPendentes").innerText = pendentes.length;
      const totalPendente = pendentes.reduce((acc, d) => acc + Number(d.valor || 0), 0);
      document.getElementById("valorPendente").innerText = `R$ ${formatarValor(totalPendente)} para vencer`;

      const media = total / filtradas.length;
      document.getElementById("mediaDispesa").innerText = `R$ ${formatarValor(media)}`;

      const qtd = filtradas.length;
      document.getElementById("totalRegistros").innerText =
        `${qtd} despesa${qtd > 1 ? "s" : ""} registrada${qtd > 1 ? "s" : ""}`;
    })
    .catch(err => console.error("Erro ao atualizar cards:", err));
}

/* =========================
   RESUMO FINANCEIRO
========================= */
function carregarResumoDespesas() {
  fetch("/despesas", { credentials: "include" })
    .then(res => res.json())
    .then(despesas => {
      const periodo = getPeriodoAtual();
      const filtradas = (despesas || []).filter(d => (d.periodo || "").slice(0, 7) === periodo);

      const resumoTotal    = document.getElementById("resumoTotal");
      const resumoMedia    = document.getElementById("resumoMedia");
      const resumoMaior    = document.getElementById("resumoMaior");
      const resumoEstado   = document.getElementById("resumoEstado");
      const categoriaMaior = document.getElementById("categoriaMaiorGasto");
      const periodoResumo  = document.getElementById("periodoResumo");

      if (!filtradas.length) {
        if (resumoTotal)  resumoTotal.innerText  = "R$ 0,00";
        if (resumoMedia)  resumoMedia.innerText  = "R$ 0,00";
        if (resumoMaior)  resumoMaior.innerText  = "R$ 0,00";
        if (resumoEstado) resumoEstado.hidden     = false;
        return;
      }

      const valores = filtradas.map(d => Number(d.valor || 0));
      const total   = valores.reduce((acc, v) => acc + v, 0);
      const media   = total / valores.length;
      const maior   = Math.max(...valores);

      if (resumoTotal)  resumoTotal.innerText  = `R$ ${formatarValor(total)}`;
      if (resumoMedia)  resumoMedia.innerText  = `R$ ${formatarValor(media)}`;
      if (resumoMaior)  resumoMaior.innerText  = `R$ ${formatarValor(maior)}`;
      if (resumoEstado) resumoEstado.hidden     = true;

      if (periodoResumo) {
        const [ano, mes] = periodo.split("-");
        const meses = ["","Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                       "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
        periodoResumo.innerText = `Período: ${meses[parseInt(mes)]} / ${ano}`;
      }

      if (categoriaMaior && filtradas.length > 0) {
        const maiorCat = filtradas.reduce((max, d) =>
          Number(d.valor || 0) > Number(max.valor || 0) ? d : max);
        categoriaMaior.innerText = maiorCat.categoria || "Sem categoria";
      }
    })
    .catch(err => console.error("Erro ao carregar resumo:", err));
}

/* =========================
   FILTROS
========================= */
function aplicarFiltros() {
  const busca     = document.getElementById("busca-despesa").value.toLowerCase();
  const categoria = document.getElementById("filtro-categoria").value.toLowerCase();
  const status    = document.getElementById("filtro-status").value;
  const ordem     = document.getElementById("filtro-ordem").value;
  const periodo   = getPeriodoAtual();

  let filtradas = JSON.parse(JSON.stringify(despesasOriginais));

  // Filtra pelo período selecionado (sempre garante um valor)
  filtradas = filtradas.filter(d => (d.periodo || "").slice(0, 7) === periodo);

  if (busca) {
    filtradas = filtradas.filter(d =>
      ((d.descricao || "") + (d.categoria || "") + (d.banco || "")).toLowerCase().includes(busca)
    );
  }

  if (categoria) {
    filtradas = filtradas.filter(d => (d.categoria || "").toLowerCase().includes(categoria));
  }

  if (status) {
    filtradas = filtradas.filter(d => d.situacao == status);
  }

  switch (ordem) {
    case "Mais recentes": filtradas.sort((a, b) => new Date(b.periodo) - new Date(a.periodo)); break;
    case "Mais antigos":  filtradas.sort((a, b) => new Date(a.periodo) - new Date(b.periodo)); break;
    case "Maior valor":   filtradas.sort((a, b) => Number(b.valor) - Number(a.valor)); break;
    case "Menor valor":   filtradas.sort((a, b) => Number(a.valor) - Number(b.valor)); break;
    default:              filtradas.sort((a, b) => new Date(b.periodo) - new Date(a.periodo));
  }

  renderizarTabela(filtradas);
}