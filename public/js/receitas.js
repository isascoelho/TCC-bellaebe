let receitaEditandoId = null;
let todasReceitas = [];

document.addEventListener("DOMContentLoaded", () => {
  popularFiltroPeriodo();

  document.getElementById("btnSalvarReceita")?.addEventListener("click", salvarReceita);

  document.getElementById("btnNovaModal")?.addEventListener("click", () => {
    const form = document.querySelector(".receitas-bottom-layout");
    if (form) form.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => document.getElementById("valor")?.focus(), 400);
  });

  document.getElementById("filtro-periodo")?.addEventListener("change", () => {
    definirPeriodoResumoReceitas();
    aplicarFiltros();
    atualizarCardsReceitas();
    carregarResumoReceitas();
  });

  document.getElementById("busca-receita")?.addEventListener("input", aplicarFiltros);
  document.getElementById("filtro-categoria")?.addEventListener("change", aplicarFiltros);
  document.getElementById("filtro-periodicidade")?.addEventListener("change", aplicarFiltros);
  document.getElementById("filtro-ordem")?.addEventListener("change", aplicarFiltros);
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
  return new Date(data).toLocaleDateString("pt-BR");
}

function limparFormulario() {
  ["valor", "data", "categoria", "banco", "descricao", "periodicidade"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

/* =========================
   PERÍODO
========================= */
function popularFiltroPeriodo() {
  const select = document.getElementById("filtro-periodo");
  if (!select) return;

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  fetch("/receitas/meses", { credentials: "include" })
    .then(res => res.json())
    .then(mesesDisponiveis => {
      select.innerHTML = "";

      // sempre inclui o mês atual mesmo sem dados
      const agora = new Date();
      const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
      if (!mesesDisponiveis.includes(mesAtual)) {
        mesesDisponiveis.unshift(mesAtual);
      }

      mesesDisponiveis.forEach((mesAno, i) => {
        const [ano, mes] = mesAno.split("-");
        const opt = document.createElement("option");
        opt.value = mesAno;
        opt.textContent = `${meses[Number(mes) - 1]} / ${ano}`;
        if (i === 0) opt.selected = true;
        select.appendChild(opt);
      });

      definirPeriodoResumoReceitas();
      carregarReceitas();
      atualizarCardsReceitas();
      carregarResumoReceitas();
    })
    .catch(() => {
      // fallback: gera 24 meses se a rota falhar
      select.innerHTML = "";
      const agora = new Date();
      for (let i = 0; i < 24; i++) {
        const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        const opt = document.createElement("option");
        opt.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        opt.textContent = `${meses[d.getMonth()]} / ${d.getFullYear()}`;
        if (i === 0) opt.selected = true;
        select.appendChild(opt);
      }

      definirPeriodoResumoReceitas();
      carregarReceitas();
      atualizarCardsReceitas();
      carregarResumoReceitas();
    });
}

function getPeriodoSelecionado() {
  const value = document.getElementById("filtro-periodo")?.value;
  const agora = new Date();

  if (!value) {
    const ano = agora.getFullYear();
    const mes = agora.getMonth();
    return {
      inicio: new Date(ano, mes, 1).toISOString().split("T")[0],
      fim: new Date(ano, mes + 1, 0).toISOString().split("T")[0],
      mes, ano
    };
  }

  const [ano, mesStr] = value.split("-");
  const mes = Number(mesStr) - 1;
  return {
    inicio: new Date(Number(ano), mes, 1).toISOString().split("T")[0],
    fim: new Date(Number(ano), mes + 1, 0).toISOString().split("T")[0],
    mes,
    ano: Number(ano)
  };
}

function definirPeriodoResumoReceitas() {
  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];
  const { mes, ano } = getPeriodoSelecionado();
  const periodoEl = document.getElementById("periodoResumo");
  if (periodoEl) periodoEl.innerText = `Período: ${meses[mes]} / ${ano}`;
}

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
  const url = receitaEditandoId ? `/receitas/${receitaEditandoId}` : "/receitas";

  fetch(url, {
    method: metodo,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao salvar receita");
      return res.json();
    })
    .then(() => {
      limparFormulario();
      receitaEditandoId = null;

      const btn = document.getElementById("btnSalvarReceita");
      if (btn) btn.innerHTML = '<i class="fas fa-save"></i> Salvar receita';

      popularFiltroPeriodo();

      if (typeof atualizarTudo === "function") atualizarTudo();
      if (typeof carregarAtividadesHome === "function") carregarAtividadesHome();
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao salvar receita");
    });
}

/* =========================
   LISTAR
========================= */
function carregarReceitas() {
  fetch("/receitas", { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao carregar receitas");
      return res.json();
    })
    .then(receitas => {
      todasReceitas = Array.isArray(receitas) ? receitas : [];
      aplicarFiltros();
    })
    .catch(err => console.error("Erro ao listar receitas:", err));
}

function renderizarReceitas(receitas) {
  const tbody = document.getElementById("lista-receitas");
  if (!tbody) return;

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
    const descricao = r.descricao && r.descricao !== "null" ? r.descricao : "-";
    const periodicidade = r.periodicidade && r.periodicidade !== "null" ? r.periodicidade : "Única";

    tbody.innerHTML += `
      <tr>
        <td>${formatarData(r.periodo)}</td>
        <td><span class="tag categoria">${r.categoria}</span></td>
        <td>${r.banco}</td>
        <td class="descricao">${descricao}</td>
        <td>${periodicidade}</td>
        <td><strong class="valor positivo">R$ ${formatarValor(r.valor)}</strong></td>
        <td class="acoes">
          <button class="acao editar" onclick="editarReceita(${r.ID})"><i class="fas fa-pencil"></i></button>
          <button class="acao excluir" onclick="excluirReceita(${r.ID})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
  });
}

/* =========================
   FILTROS
========================= */
function aplicarFiltros() {
  let filtradas = [...todasReceitas];

  const { inicio, fim } = getPeriodoSelecionado();
  filtradas = filtradas.filter(r => {
    const data = (r.periodo || "").slice(0, 10);
    return data >= inicio && data <= fim;
  });

  const busca = document.getElementById("busca-receita")?.value?.toLowerCase() || "";
  const categoria = document.getElementById("filtro-categoria")?.value || "";
  const periodicidade = document.getElementById("filtro-periodicidade")?.value || "";
  const ordem = document.getElementById("filtro-ordem")?.value || "Mais recentes";

  if (busca) {
    filtradas = filtradas.filter(r =>
      (r.descricao || "").toLowerCase().includes(busca) ||
      (r.categoria || "").toLowerCase().includes(busca) ||
      (r.banco || "").toLowerCase().includes(busca)
    );
  }

  if (categoria) filtradas = filtradas.filter(r => r.categoria === categoria);
  if (periodicidade) filtradas = filtradas.filter(r => (r.periodicidade || "Única") === periodicidade);

  if (ordem === "Mais recentes") filtradas.sort((a, b) => new Date(b.periodo) - new Date(a.periodo));
  if (ordem === "Mais antigos")  filtradas.sort((a, b) => new Date(a.periodo) - new Date(b.periodo));
  if (ordem === "Maior valor")   filtradas.sort((a, b) => Number(b.valor) - Number(a.valor));
  if (ordem === "Menor valor")   filtradas.sort((a, b) => Number(a.valor) - Number(b.valor));

  renderizarReceitas(filtradas);
}

/* =========================
   EDITAR
========================= */
function editarReceita(id) {
  fetch(`/receitas/${id}`, { credentials: "include" })
    .then(res => res.json())
    .then(r => {
      if (!r) { alert("Receita não encontrada."); return; }

      document.getElementById("valor").value = r.valor;
      document.getElementById("data").value = r.periodo.split("T")[0];
      document.getElementById("categoria").value = r.categoria;
      document.getElementById("banco").value = r.banco;
      document.getElementById("periodicidade").value = r.periodicidade;
      document.getElementById("descricao").value =
        r.descricao && r.descricao !== "null" ? r.descricao : "";

      receitaEditandoId = id;

      const btn = document.getElementById("btnSalvarReceita");
      if (btn) btn.innerHTML = '<i class="fas fa-save"></i> Atualizar receita';

      document.querySelector(".receitas-bottom-layout")?.scrollIntoView({ behavior: "smooth" });
    });
}

/* =========================
   EXCLUIR
========================= */
function excluirReceita(id) {
  if (!confirm("Deseja excluir esta receita?")) return;

  fetch(`/receitas/${id}`, { method: "DELETE", credentials: "include" })
    .then(() => {
      popularFiltroPeriodo();
      if (typeof atualizarTudo === "function") atualizarTudo();
    });
}

/* =========================
   CARDS KPI
========================= */
function atualizarCardsReceitas() {
  Promise.all([
    fetch("/receitas/total-mes", { credentials: "include" }).then(r => r.json()),
    fetch("/receitas/ultima", { credentials: "include" }).then(r => r.json())
  ])
    .then(([totalMes, ultimaReceita]) => {
      const totalValor = Number(totalMes?.total || 0);
      const ultimaValor = Number(ultimaReceita?.valor || 0);

      const totalMesEl   = document.getElementById("totalMes");
      const ultimaEl     = document.getElementById("ultimaReceita");
      const ultimaDataEl = document.getElementById("ultimaReceitaData");

      if (totalMesEl) totalMesEl.innerText = `R$ ${formatarValor(totalValor)}`;
      if (ultimaEl) ultimaEl.innerText = ultimaReceita ? `R$ ${formatarValor(ultimaValor)}` : "—";
      if (ultimaDataEl && ultimaReceita?.periodo) {
        ultimaDataEl.innerText = new Date(ultimaReceita.periodo).toLocaleDateString("pt-BR");
      }
    })
    .catch(err => console.error("Erro ao atualizar cards:", err));
}

/* =========================
   RESUMO
========================= */
function carregarResumoReceitas() {
  const { inicio, fim } = getPeriodoSelecionado();

  fetch(`/receitas/relatorio?inicio=${inicio}&fim=${fim}`, { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao carregar relatório");
      return res.json();
    })
    .then(dados => {
      const resumoTotal  = document.getElementById("resumoTotal");
      const resumoMedia  = document.getElementById("resumoMedia");
      const resumoMaior  = document.getElementById("resumoMaior");
      const resumoEstado = document.getElementById("resumoEstado");
      const maiorEl      = document.getElementById("maiorReceita");
      const mediaEl      = document.getElementById("mediaReceita");
      const totalRegEl   = document.getElementById("totalRegistrosReceita");
      const catMaiorEl   = document.getElementById("categoriaMaiorReceita");
      const maiorInfoEl  = document.getElementById("maiorReceitaInfo");

      if (!Array.isArray(dados) || !dados.length) {
        if (resumoTotal)  resumoTotal.innerText  = "R$ 0,00";
        if (resumoMedia)  resumoMedia.innerText  = "R$ 0,00";
        if (resumoMaior)  resumoMaior.innerText  = "R$ 0,00";
        if (maiorEl)      maiorEl.innerText      = "R$ 0,00";
        if (mediaEl)      mediaEl.innerText      = "R$ 0,00";
        if (totalRegEl)   totalRegEl.innerText   = "0 receitas registradas";
        if (resumoEstado) resumoEstado.hidden     = false;
        return;
      }

      const valores = dados.map(item => Number(item.valor || 0));
      const total   = valores.reduce((acc, v) => acc + v, 0);
      const media   = total / valores.length;
      const maior   = Math.max(...valores);

      if (resumoTotal)  resumoTotal.innerText  = `R$ ${formatarValor(total)}`;
      if (resumoMedia)  resumoMedia.innerText  = `R$ ${formatarValor(media)}`;
      if (resumoMaior)  resumoMaior.innerText  = `R$ ${formatarValor(maior)}`;
      if (maiorEl)      maiorEl.innerText      = `R$ ${formatarValor(maior)}`;
      if (mediaEl)      mediaEl.innerText      = `R$ ${formatarValor(media)}`;
      if (resumoEstado) resumoEstado.hidden     = true;

      const qtd = dados.length;
      if (totalRegEl) totalRegEl.innerText = `${qtd} ${qtd === 1 ? "receita registrada" : "receitas registradas"}`;

      const itemMaior = dados.find(item => Number(item.valor) === maior);
      if (maiorInfoEl && itemMaior) {
        maiorInfoEl.innerText = `${itemMaior.categoria} · ${formatarData(itemMaior.periodo)}`;
      }

      const categorias = {};
      dados.forEach(item => {
        categorias[item.categoria] = (categorias[item.categoria] || 0) + Number(item.valor);
      });
      const catMaior = Object.entries(categorias).sort((a, b) => b[1] - a[1])[0];
      if (catMaiorEl && catMaior) catMaiorEl.innerText = catMaior[0];
    })
    .catch(err => console.error("Erro ao carregar resumo:", err));
}