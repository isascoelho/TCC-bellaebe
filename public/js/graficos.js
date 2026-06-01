document.addEventListener("DOMContentLoaded", function () {
  const periodoSelect = document.getElementById("periodo");
  const granularidadeSelect = document.getElementById("granularidade");
  const modoReceitasSelect = document.getElementById("modoReceitas");

  const btnAtualizar = document.getElementById("btnAtualizar");
  const btnExportar = document.getElementById("btnExportar");
  const btnVerDetalhesDespesas = document.getElementById("btnVerDetalhesDespesas");

  const totalReceitasEl = document.getElementById("totalReceitas");
  const totalDespesasEl = document.getElementById("totalDespesas");
  const resultadoEl = document.getElementById("resultadoPeriodo");
  const variacaoReceitasEl = document.getElementById("variacaoReceitas");
  const variacaoDespesasEl = document.getElementById("variacaoDespesas");
  const statusResultadoEl = document.getElementById("statusResultado");
  const semDadosEl = document.getElementById("semDados");
  const rodapeEvolucaoEl = document.getElementById("rodapeEvolucao");
  const legendaDespesasEl = document.getElementById("legendaDespesas");
  const totalReceitasRodapeEl = document.getElementById("totalReceitasRodape");
  const resumoInteligenteEl = document.getElementById("resumoInteligente");

  const modalDetalhesEl = document.getElementById("modalDetalhesDespesas");
  const detalhesResumoTopoEl = document.getElementById("detalhesResumoTopo");
  const listaCategoriasDespesasEl = document.getElementById("listaCategoriasDespesas");
  const listaLancamentosDespesasEl = document.getElementById("listaLancamentosDespesas");

  const canvasEvolucao = document.getElementById("graficoEvolucao");
  const canvasDespesasCategoria = document.getElementById("graficoDespesasCategoria");
  const canvasReceitasCategoria = document.getElementById("graficoReceitasCategoria");

  if (!periodoSelect || !canvasEvolucao || !canvasDespesasCategoria || !canvasReceitasCategoria) {
    return;
  }

  const CORES_RECEITAS = ["#122f73", "#3058d1", "#8aa4ec", "#b7c6f7"];
  const CORES_DESPESAS = ["#f5bf14", "#f6cf55", "#f7dd8a", "#f4e7b5", "#f1edd9"];

  const estado = {
    receitas: [],
    despesas: []
  };

  let despesasFiltradasAtual = [];
  let modoReceitasAtual = "valor";

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function formatarNumero(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatarDataBR(dataBase) {
    if (!dataBase) return "Data inválida";
    const soData = (typeof dataBase === "string" ? dataBase : dataBase.toISOString()).slice(0, 10);
    const [ano, mes, dia] = soData.split("-").map(Number);
    return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
  }

  function somar(lista) {
    return lista.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
  }

  // CORRIGIDO: constrói a data no timezone local para evitar desvio de fuso
  function obterData(item) {
    const base = item.periodo || item.data || item.createdAt;
    if (!base) return null;

    const soData = (typeof base === "string" ? base : base.toISOString()).slice(0, 10);
    const [ano, mes, dia] = soData.split("-").map(Number);
    if (!ano || !mes || !dia) return null;

    const data = new Date(ano, mes - 1, dia);
    data.setHours(0, 0, 0, 0);
    return data;
  }

  function obterInicioSemana(data) {
    const d = new Date(data);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  function filtrarPorPeriodo(lista, periodo) {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    let inicio = new Date(inicioHoje);

    if (periodo === "sem") {
      inicio = obterInicioSemana(inicioHoje);
    } else if (periodo === "mes") {
      inicio = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth(), 1);
    } else if (periodo === "3") {
      inicio = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth() - 2, 1);
    } else if (periodo === "6") {
      inicio = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth() - 5, 1);
    } else if (periodo === "12") {
      inicio = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth() - 11, 1);
    } else if (periodo === "ano") {
      inicio = new Date(inicioHoje.getFullYear(), 0, 1);
    }

    return lista.filter(item => {
      const data = obterData(item);
      if (!data) return false;
      return data >= inicio && data <= hoje;
    });
  }

  function filtrarAnoAtual(lista) {
    const anoAtual = new Date().getFullYear();
    return lista.filter(item => {
      const data = obterData(item);
      if (!data) return false;
      return data.getFullYear() === anoAtual;
    });
  }

  function filtrarPeriodoAnterior(lista, periodo) {
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    let anteriorInicio = new Date(inicioHoje);
    let anteriorFim = new Date(inicioHoje);

    if (periodo === "sem") {
      const atualInicio = obterInicioSemana(inicioHoje);
      anteriorFim = new Date(atualInicio);
      anteriorFim.setDate(anteriorFim.getDate() - 1);
      anteriorInicio = new Date(anteriorFim);
      anteriorInicio.setDate(anteriorFim.getDate() - 6);
    } else if (periodo === "mes") {
      anteriorInicio = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth() - 1, 1);
      anteriorFim = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth(), 0);
    } else if (periodo === "3") {
      anteriorInicio = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth() - 5, 1);
      anteriorFim = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth() - 2, 0);
    } else if (periodo === "6") {
      anteriorInicio = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth() - 11, 1);
      anteriorFim = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth() - 5, 0);
    } else if (periodo === "12") {
      anteriorInicio = new Date(inicioHoje.getFullYear() - 1, inicioHoje.getMonth() - 11, 1);
      anteriorFim = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth() - 11, 0);
    } else if (periodo === "ano") {
      anteriorInicio = new Date(inicioHoje.getFullYear() - 1, 0, 1);
      anteriorFim = new Date(inicioHoje.getFullYear() - 1, 11, 31);
    }

    return lista.filter(item => {
      const data = obterData(item);
      if (!data) return false;
      return data >= anteriorInicio && data <= anteriorFim;
    });
  }

  function calcularVariacao(atual, anterior) {
    if (anterior <= 0 && atual > 0) return "↑ novo no período";
    if (anterior <= 0 && atual <= 0) return "— sem histórico";
    const delta = ((atual - anterior) / anterior) * 100;
    const sinal = delta >= 0 ? "↑" : "↓";
    return `${sinal} ${formatarNumero(Math.abs(delta))}% vs. período anterior`;
  }

  function agruparPorCategoria(lista, fallback = "Outros") {
    const mapa = {};
    lista.forEach(item => {
      const categoria = item.categoria || item.descricao || item.nome || fallback;
      mapa[categoria] = (mapa[categoria] || 0) + (Number(item.valor) || 0);
    });
    const entries = Object.entries(mapa).sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map(([label]) => label),
      valores: entries.map(([, valor]) => valor)
    };
  }

  function resolverGranularidade(granularidadeSelecionada) {
    return granularidadeSelecionada === "semanal" ? "semanal" : "mensal";
  }

  function agruparTemporalmente(lista, modo) {
    const mapa = new Map();
    const anoAtual = new Date().getFullYear();

    if (modo === "mensal") {
      for (let mes = 0; mes < 12; mes++) {
        const chave = `${anoAtual}-${String(mes + 1).padStart(2, "0")}`;
        const dataMes = new Date(anoAtual, mes, 1);
        mapa.set(chave, {
          ordem: dataMes.getTime(),
          label: dataMes.toLocaleDateString("pt-BR", { month: "short" }),
          total: 0
        });
      }

      lista.forEach(item => {
        const data = obterData(item);
        if (!data) return;
        if (data.getFullYear() !== anoAtual) return;
        const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
        if (mapa.has(chave)) {
          mapa.get(chave).total += Number(item.valor) || 0;
        }
      });

      return mapa;
    }

    lista.forEach(item => {
      const data = obterData(item);
      if (!data) return;
      const inicioSemana = obterInicioSemana(data);
      const chave = inicioSemana.toISOString().slice(0, 10);
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          ordem: inicioSemana.getTime(),
          label: `Sem ${inicioSemana.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`,
          total: 0
        });
      }
      mapa.get(chave).total += Number(item.valor) || 0;
    });

    return mapa;
  }

  function montarSerieComparativa(receitasLista, despesasLista, modo) {
    const mapaReceitas = agruparTemporalmente(receitasLista, modo);
    const mapaDespesas = agruparTemporalmente(despesasLista, modo);

    let chaves = [];

    if (modo === "mensal") {
      const anoAtual = new Date().getFullYear();
      for (let mes = 0; mes < 12; mes++) {
        chaves.push(`${anoAtual}-${String(mes + 1).padStart(2, "0")}`);
      }
    } else {
      chaves = [...new Set([...mapaReceitas.keys(), ...mapaDespesas.keys()])].sort((a, b) => {
        const ordemA = mapaReceitas.get(a)?.ordem ?? mapaDespesas.get(a)?.ordem ?? 0;
        const ordemB = mapaReceitas.get(b)?.ordem ?? mapaDespesas.get(b)?.ordem ?? 0;
        return ordemA - ordemB;
      });
    }

    if (!chaves.length) {
      return { labels: ["Sem dados"], receitas: [0], despesas: [0] };
    }

    return {
      labels: chaves.map(chave => {
        const item = mapaReceitas.get(chave) || mapaDespesas.get(chave);
        if (!item) return chave;
        if (modo === "mensal") {
          const texto = item.label;
          return texto.charAt(0).toUpperCase() + texto.slice(1);
        }
        return item.label;
      }),
      receitas: chaves.map(chave => mapaReceitas.get(chave)?.total || 0),
      despesas: chaves.map(chave => mapaDespesas.get(chave)?.total || 0)
    };
  }

  function obterIconeResumo(tipo) {
    const icones = {
      receita: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h1v15h15v1H0zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5"/></svg>`,
      despesa: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14m1-7V4.5a.5.5 0 0 0-1 0V8a.5.5 0 0 0 .146.354l2 2a.5.5 0 0 0 .708-.708z"/></svg>`,
      percentual: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M13.442 2.558a1.5 1.5 0 0 1 0 2.121l-8.763 8.763a1.5 1.5 0 1 1-2.121-2.12l8.763-8.764a1.5 1.5 0 0 1 2.12 0"/><path d="M5.5 6a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m5 7a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3"/></svg>`,
      saldo: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M0 3a2 2 0 0 1 2-2h12a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm3 1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"/><path d="M8 5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3"/></svg>`,
      tendencia: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h1v15h15v1H0zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5"/></svg>`
    };
    return icones[tipo] || "";
  }

  function abrirModalDetalhesDespesas(listaDespesas, labels, valores) {
    if (!modalDetalhesEl || !detalhesResumoTopoEl || !listaCategoriasDespesasEl || !listaLancamentosDespesasEl) return;

    const totalDespesas = valores.reduce((a, b) => a + b, 0);
    const quantidade = listaDespesas.length;
    const maiorValor = valores.length ? Math.max(...valores) : 0;

    detalhesResumoTopoEl.innerHTML = `
      <div class="detalhes-mini-card"><span>Total de despesas</span><strong>${formatarMoeda(totalDespesas)}</strong></div>
      <div class="detalhes-mini-card"><span>Lançamentos</span><strong>${quantidade}</strong></div>
      <div class="detalhes-mini-card"><span>Maior categoria</span><strong>${formatarMoeda(maiorValor)}</strong></div>
    `;

    listaCategoriasDespesasEl.innerHTML = labels.length
      ? labels.map((label, index) => {
          const valor = valores[index];
          const percentual = totalDespesas > 0
            ? ((valor / totalDespesas) * 100).toFixed(1).replace(".", ",")
            : "0,0";
          const cor = CORES_DESPESAS[index % CORES_DESPESAS.length];
          return `
            <div class="detalhe-categoria-item">
              <span class="detalhe-categoria-bullet" style="background:${cor}"></span>
              <span class="detalhe-categoria-nome">${label}</span>
              <span class="detalhe-categoria-valor">${formatarMoeda(valor)}</span>
              <span class="detalhe-categoria-percentual">${percentual}%</span>
            </div>`;
        }).join("")
      : `<p class="detalhe-vazio">Não há categorias de despesas no período.</p>`;

    listaLancamentosDespesasEl.innerHTML = listaDespesas.length
      ? [...listaDespesas]
          .sort((a, b) => (obterData(b)?.getTime() || 0) - (obterData(a)?.getTime() || 0))
          .map(item => `
            <div class="detalhe-lancamento-item">
              <div>
                <div class="detalhe-lancamento-titulo">${item.descricao || item.categoria || "Despesa"}</div>
                <span class="detalhe-lancamento-meta">${item.categoria || "Sem categoria"} • ${formatarDataBR(item.periodo || item.data)}</span>
              </div>
              <div class="detalhe-lancamento-valor">${formatarMoeda(item.valor)}</div>
            </div>`).join("")
      : `<p class="detalhe-vazio">Não há lançamentos de despesas no período.</p>`;

    new bootstrap.Modal(modalDetalhesEl).show();
  }

  const centerTextPlugin = {
    id: "centerTextPlugin",
    afterDraw(chart) {
      if (chart.canvas.id !== "graficoDespesasCategoria" || chart.config.type !== "doughnut") return;
      const meta = chart.getDatasetMeta(0);
      if (!meta?.data?.length) return;

      const dados = chart.data.datasets[0].data || [];
      const semDespesas = chart.data.labels?.[0] === "Sem despesas";
      const total = semDespesas ? 0 : dados.reduce((a, b) => a + b, 0);

      const { ctx } = chart;
      const x = meta.data[0].x;
      const y = meta.data[0].y;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#6b7280";
      ctx.font = "500 14px Inter, sans-serif";
      ctx.fillText("Total", x, y - 14);
      ctx.fillStyle = "#0d0a48";
      ctx.font = "700 18px Inter, sans-serif";
      ctx.fillText(formatarMoeda(total), x, y + 14);
      ctx.restore();
    }
  };

  Chart.register(centerTextPlugin);

  const graficoEvolucao = new Chart(canvasEvolucao, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        { label: "Receitas", data: [], backgroundColor: "#07297a", borderRadius: 8, barThickness: 18 },
        { label: "Despesas", data: [], backgroundColor: "#f3bc10", borderRadius: 8, barThickness: 18 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", align: "start", labels: { usePointStyle: true, pointStyle: "line" } },
        tooltip: { callbacks: { label: context => `${context.dataset.label}: ${formatarMoeda(context.raw)}` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#60657a" } },
        y: {
          beginAtZero: true,
          ticks: { color: "#60657a", callback: value => formatarNumero(value) },
          grid: { color: "rgba(13,10,72,0.08)" }
        }
      }
    }
  });

  const graficoDespesasCategoria = new Chart(canvasDespesasCategoria, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{ data: [], backgroundColor: CORES_DESPESAS, borderWidth: 0, hoverOffset: 4 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "55%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => {
              if (context.chart.data.labels?.[0] === "Sem despesas") return "Sem despesas no período";
              return `${context.label}: ${formatarMoeda(context.raw)}`;
            }
          }
        }
      }
    }
  });

  const graficoReceitasCategoria = new Chart(canvasReceitasCategoria, {
    type: "bar",
    data: {
      labels: [],
      datasets: [{ data: [], backgroundColor: "#0a2565", borderRadius: 10, barThickness: 24 }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => modoReceitasAtual === "percentual"
              ? `${formatarNumero(context.raw)}%`
              : formatarMoeda(context.raw)
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { display: false },
          ticks: {
            color: "#60657a",
            callback: value => {
              if (modoReceitasAtual === "percentual") return `${value}%`;
              if (value >= 1000) return `${value / 1000}k`;
              return value;
            }
          }
        },
        y: { grid: { display: false }, ticks: { color: "#60657a" } }
      }
    }
  });

  function atualizarLegendaDespesas(labels, valores) {
    if (!legendaDespesasEl) return;
    const total = valores.reduce((a, b) => a + b, 0);
    legendaDespesasEl.innerHTML = "";

    if (!labels.length) {
      legendaDespesasEl.innerHTML = `<p style="color:#6b7280;margin:0;">Sem despesas no período.</p>`;
      return;
    }

    labels.forEach((label, index) => {
      const valor = valores[index];
      const percentual = total > 0 ? ((valor / total) * 100).toFixed(1).replace(".", ",") : "0,0";
      const item = document.createElement("div");
      item.className = "categoria-item";
      item.innerHTML = `
        <span class="categoria-bullet" style="background:${CORES_DESPESAS[index % CORES_DESPESAS.length]}"></span>
        <div class="categoria-texto"><strong>${label}</strong><small>${formatarMoeda(valor)}</small></div>
        <span class="categoria-percentual">${percentual}%</span>`;
      legendaDespesasEl.appendChild(item);
    });
  }

  function atualizarResumoInteligente(receitas, despesas, resultado, receitasCat, despesasCat) {
    if (!resumoInteligenteEl) return;

    const itens = [];

    const maiorReceitaIndex = receitasCat.valores.length
      ? receitasCat.valores.indexOf(Math.max(...receitasCat.valores)) : -1;
    const maiorDespesaIndex = despesasCat.valores.length
      ? despesasCat.valores.indexOf(Math.max(...despesasCat.valores)) : -1;

    if (maiorReceitaIndex >= 0 && receitas > 0) {
      itens.push({
        iconSvg: obterIconeResumo("receita"), iconClass: "icon-receita",
        titulo: `Maior receita: ${receitasCat.labels[maiorReceitaIndex]}`,
        descricao: `Representa ${formatarNumero((receitasCat.valores[maiorReceitaIndex] / receitas) * 100)}% das receitas do período.`
      });
    }

    if (maiorDespesaIndex >= 0 && despesas > 0) {
      itens.push({
        iconSvg: obterIconeResumo("despesa"), iconClass: "icon-despesa",
        titulo: `Maior gasto: ${despesasCat.labels[maiorDespesaIndex]}`,
        descricao: `Representa ${formatarNumero((despesasCat.valores[maiorDespesaIndex] / despesas) * 100)}% das despesas do período.`
      });
    }

    itens.push({
      iconSvg: obterIconeResumo("percentual"), iconClass: "icon-lucro",
      titulo: `Despesas representam ${receitas > 0 ? formatarNumero((despesas / receitas) * 100) : "0,00"}% da receita`,
      descricao: "Percentual de despesas sobre receitas."
    });

    itens.push({
      iconSvg: obterIconeResumo("saldo"),
      iconClass: resultado >= 0 ? "icon-saldo" : "icon-despesa",
      titulo: resultado >= 0 ? "Saldo do período está positivo" : "Saldo do período ficou negativo",
      descricao: resultado >= 0
        ? `Você teve um superávit de ${formatarMoeda(resultado)}.`
        : `Você teve um déficit de ${formatarMoeda(Math.abs(resultado))}.`
    });

    itens.push({
      iconSvg: obterIconeResumo("tendencia"), iconClass: "icon-tendencia",
      titulo: resultado >= 0 ? "Tendência financeira estável" : "Tendência financeira exige atenção",
      descricao: resultado >= 0
        ? "Suas finanças mantêm estabilidade no período."
        : "Vale revisar categorias com maior peso no período."
    });

    resumoInteligenteEl.innerHTML = itens.map(item => `
      <div class="resumo-item-v2">
        <div class="resumo-icon-v2 ${item.iconClass}">${item.iconSvg}</div>
        <div><strong>${item.titulo}</strong><small>${item.descricao}</small></div>
      </div>`).join("");
  }

  function atualizarTela() {
    const periodo = periodoSelect.value;
    const granularidadeFinal = resolverGranularidade(granularidadeSelect?.value || "mensal");
    modoReceitasAtual = modoReceitasSelect?.value || "valor";

    const receitasPeriodo  = filtrarPorPeriodo(estado.receitas, periodo);
    const despesasPeriodo  = filtrarPorPeriodo(estado.despesas, periodo);
    const receitasAnterior = filtrarPeriodoAnterior(estado.receitas, periodo);
    const despesasAnterior = filtrarPeriodoAnterior(estado.despesas, periodo);

    despesasFiltradasAtual = despesasPeriodo;

    const totalReceitas = somar(receitasPeriodo);
    const totalDespesas = somar(despesasPeriodo);
    const resultado     = totalReceitas - totalDespesas;

    if (totalReceitasEl) totalReceitasEl.textContent = formatarMoeda(totalReceitas);
    if (totalDespesasEl) totalDespesasEl.textContent = formatarMoeda(totalDespesas);
    if (resultadoEl)     resultadoEl.textContent     = formatarMoeda(resultado);

    if (variacaoReceitasEl) variacaoReceitasEl.textContent = calcularVariacao(totalReceitas, somar(receitasAnterior));
    if (variacaoDespesasEl) variacaoDespesasEl.textContent = calcularVariacao(totalDespesas, somar(despesasAnterior));

    if (resultadoEl && statusResultadoEl) {
      if (resultado >= 0) {
        resultadoEl.style.color = "#1f9a52";
        statusResultadoEl.textContent = "Saldo positivo";
        statusResultadoEl.style.color = "#1f9a52";
      } else {
        resultadoEl.style.color = "#d14343";
        statusResultadoEl.textContent = "Saldo negativo";
        statusResultadoEl.style.color = "#d14343";
      }
    }

    if (semDadosEl) semDadosEl.style.display = (totalReceitas === 0 && totalDespesas === 0) ? "block" : "none";

    const receitasParaEvolucao = granularidadeFinal === "mensal" ? filtrarAnoAtual(estado.receitas) : receitasPeriodo;
    const despesasParaEvolucao = granularidadeFinal === "mensal" ? filtrarAnoAtual(estado.despesas) : despesasPeriodo;

    const serieTemporal = montarSerieComparativa(receitasParaEvolucao, despesasParaEvolucao, granularidadeFinal);
    graficoEvolucao.data.labels = serieTemporal.labels;
    graficoEvolucao.data.datasets[0].data = serieTemporal.receitas;
    graficoEvolucao.data.datasets[1].data = serieTemporal.despesas;
    graficoEvolucao.update();

    const despesasCat = agruparPorCategoria(despesasPeriodo, "Outros");
    graficoDespesasCategoria.data.labels = despesasCat.labels.length ? despesasCat.labels : ["Sem despesas"];
    graficoDespesasCategoria.data.datasets[0].data = despesasCat.valores.length ? despesasCat.valores : [1];
    graficoDespesasCategoria.data.datasets[0].backgroundColor = despesasCat.valores.length ? CORES_DESPESAS : ["#d9d9d9"];
    graficoDespesasCategoria.update();

    atualizarLegendaDespesas(despesasCat.labels, despesasCat.valores);

    const receitasCat = agruparPorCategoria(receitasPeriodo, "Outros");

    if (modoReceitasAtual === "percentual") {
      const totalCat = receitasCat.valores.reduce((a, b) => a + b, 0);
      const percentuais = totalCat > 0
        ? receitasCat.valores.map(v => Number(((v / totalCat) * 100).toFixed(2)))
        : [];
      graficoReceitasCategoria.data.labels = receitasCat.labels.length ? receitasCat.labels : ["Sem receitas"];
      graficoReceitasCategoria.data.datasets[0].data = receitasCat.labels.length ? percentuais : [0];
      if (totalReceitasRodapeEl) totalReceitasRodapeEl.textContent = "100%";
    } else {
      graficoReceitasCategoria.data.labels = receitasCat.labels.length ? receitasCat.labels : ["Sem receitas"];
      graficoReceitasCategoria.data.datasets[0].data = receitasCat.valores.length ? receitasCat.valores : [0];
      if (totalReceitasRodapeEl) totalReceitasRodapeEl.textContent = formatarMoeda(totalReceitas);
    }
    graficoReceitasCategoria.update();

    const qtdPontos = serieTemporal.labels.filter(l => l !== "Sem dados").length || 1;
    const mediaReceitas = serieTemporal.receitas.reduce((a, b) => a + b, 0) / qtdPontos;
    const mediaDespesas = serieTemporal.despesas.reduce((a, b) => a + b, 0) / qtdPontos;

    if (rodapeEvolucaoEl) {
      const textoR = granularidadeFinal === "semanal" ? "Receitas médias semanais" : "Receitas médias mensais";
      const textoD = granularidadeFinal === "semanal" ? "Despesas médias semanais" : "Despesas médias mensais";
      rodapeEvolucaoEl.textContent = `${textoR}: ${formatarMoeda(mediaReceitas)} • ${textoD}: ${formatarMoeda(mediaDespesas)}`;
    }

    atualizarResumoInteligente(totalReceitas, totalDespesas, resultado, receitasCat, despesasCat);
  }

  function carregarDados() {
    Promise.allSettled([
      fetch("/receitas", { credentials: "include" }).then(r => { if (!r.ok) throw new Error("receitas " + r.status); return r.json(); }),
      fetch("/despesas", { credentials: "include" }).then(r => { if (!r.ok) throw new Error("despesas " + r.status); return r.json(); })
    ]).then(([receitasResult, despesasResult]) => {
      if (receitasResult.status === "rejected") {
        console.error("[graficos] Falha ao buscar receitas:", receitasResult.reason);
      }
      if (despesasResult.status === "rejected") {
        console.error("[graficos] Falha ao buscar despesas:", despesasResult.reason);
      }

      estado.receitas = receitasResult.status === "fulfilled" ? (receitasResult.value || []) : [];
      estado.despesas = despesasResult.status === "fulfilled" ? (despesasResult.value || []) : [];

      console.log("[graficos] receitas carregadas:", estado.receitas.length, "| despesas:", estado.despesas.length);

      atualizarTela();
    }).catch(err => console.error("Erro ao carregar gráficos:", err));
  }

  periodoSelect.addEventListener("change", atualizarTela);
  granularidadeSelect?.addEventListener("change", atualizarTela);
  modoReceitasSelect?.addEventListener("change", atualizarTela);
  btnAtualizar?.addEventListener("click", carregarDados);
  btnExportar?.addEventListener("click", () => window.print());

  btnVerDetalhesDespesas?.addEventListener("click", () => {
    const despesasCat = agruparPorCategoria(despesasFiltradasAtual, "Outros");
    abrirModalDetalhesDespesas(despesasFiltradasAtual, despesasCat.labels, despesasCat.valores);
  });

  carregarDados();
});