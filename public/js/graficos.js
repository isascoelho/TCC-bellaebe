document.addEventListener("DOMContentLoaded", function () {
  const periodoSelect = document.getElementById("periodo");
  const totalReceitasEl = document.getElementById("totalReceitas");
  const totalDespesasEl = document.getElementById("totalDespesas");
  const resultadoEl = document.getElementById("resultadoPeriodo");
  const textoAnalise = document.getElementById("graficoAnalise");
  const semDados = document.getElementById("semDados");

  const canvasReceitas = document.getElementById("graficoReceitas");
  const canvasDespesas = document.getElementById("graficoDespesas");
  const canvasComparativo = document.getElementById("graficoComparativo");

  if (
    !periodoSelect ||
    !totalReceitasEl ||
    !totalDespesasEl ||
    !resultadoEl ||
    !textoAnalise ||
    !semDados ||
    !canvasReceitas ||
    !canvasDespesas ||
    !canvasComparativo
  ) {
    return;
  }

  if (typeof Chart === "undefined") {
    console.error("Chart.js não foi carregado.");
    return;
  }

  const dadosFinanceiros = {
    sem: { receitas: 0, despesas: 0, receitasLista: [], despesasLista: [] },
    mes: { receitas: 0, despesas: 0, receitasLista: [], despesasLista: [] },
    "3": { receitas: 0, despesas: 0, receitasLista: [], despesasLista: [] },
    "6": { receitas: 0, despesas: 0, receitasLista: [], despesasLista: [] },
    "12": { receitas: 0, despesas: 0, receitasLista: [], despesasLista: [] },
    ano: { receitas: 0, despesas: 0, receitasLista: [], despesasLista: [] }
  };

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function diasEntre(data1, data2) {
    return (data1 - data2) / (1000 * 60 * 60 * 24);
  }

  function agruparPorCategoria(lista) {
    const mapa = {};

    lista.forEach(item => {
      const categoria =
        item.categoria ||
        item.descricao ||
        item.nome ||
        "Outros";

      const valor = Number(item.valor) || 0;
      mapa[categoria] = (mapa[categoria] || 0) + valor;
    });

    return {
      labels: Object.keys(mapa),
      valores: Object.values(mapa)
    };
  }

  const graficoReceitas = new Chart(canvasReceitas, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: ["#3d4bb4", "#5b6bdb", "#8a97f0", "#b9c2ff", "#d8ddff"],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "55%",
      plugins: {
        legend: {
          position: "bottom"
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${formatarMoeda(context.raw)}`;
            }
          }
        }
      }
    }
  });

  const graficoDespesas = new Chart(canvasDespesas, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: ["#ffcc00", "#ffd84d", "#ffe58a", "#fff1bf", "#fff6d9"],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "55%",
      plugins: {
        legend: {
          position: "bottom"
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${formatarMoeda(context.raw)}`;
            }
          }
        }
      }
    }
  });

  const graficoComparativo = new Chart(canvasComparativo, {
    type: "pie",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [
        {
          data: [0, 0],
          backgroundColor: ["#3d4bb4", "#ffcc00"],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${formatarMoeda(context.raw)}`;
            }
          }
        }
      }
    }
  });

  function processarLancamentos(lista, tipo) {
    const agora = new Date();

    lista.forEach(item => {
      const dataBase = item.periodo || item.data || item.createdAt;
      if (!dataBase) return;

      const data = new Date(dataBase);
      if (isNaN(data)) return;

      const valor = Number(item.valor) || 0;
      const diffMeses =
        (agora.getFullYear() - data.getFullYear()) * 12 +
        (agora.getMonth() - data.getMonth());

      const chaveValor = tipo;
      const chaveLista = `${tipo}Lista`;

      if (diasEntre(agora, data) <= 7) {
        dadosFinanceiros.sem[chaveValor] += valor;
        dadosFinanceiros.sem[chaveLista].push(item);
      }

      if (
        data.getMonth() === agora.getMonth() &&
        data.getFullYear() === agora.getFullYear()
      ) {
        dadosFinanceiros.mes[chaveValor] += valor;
        dadosFinanceiros.mes[chaveLista].push(item);
      }

      if (diffMeses < 3) {
        dadosFinanceiros["3"][chaveValor] += valor;
        dadosFinanceiros["3"][chaveLista].push(item);
      }

      if (diffMeses < 6) {
        dadosFinanceiros["6"][chaveValor] += valor;
        dadosFinanceiros["6"][chaveLista].push(item);
      }

      if (diffMeses < 12) {
        dadosFinanceiros["12"][chaveValor] += valor;
        dadosFinanceiros["12"][chaveLista].push(item);
      }

      if (data.getFullYear() === agora.getFullYear()) {
        dadosFinanceiros.ano[chaveValor] += valor;
        dadosFinanceiros.ano[chaveLista].push(item);
      }
    });
  }

  function atualizarGraficos(periodo) {
    const dados = dadosFinanceiros[periodo];
    if (!dados) return;

    const receitasAgrupadas = agruparPorCategoria(dados.receitasLista);
    const despesasAgrupadas = agruparPorCategoria(dados.despesasLista);

    graficoReceitas.data.labels =
      receitasAgrupadas.labels.length > 0 ? receitasAgrupadas.labels : ["Sem receitas"];
    graficoReceitas.data.datasets[0].data =
      receitasAgrupadas.valores.length > 0 ? receitasAgrupadas.valores : [1];
    graficoReceitas.data.datasets[0].backgroundColor =
      receitasAgrupadas.valores.length > 0
        ? ["#3d4bb4", "#5b6bdb", "#8a97f0", "#b9c2ff", "#d8ddff"]
        : ["#d9d9d9"];
    graficoReceitas.update();

    graficoDespesas.data.labels =
      despesasAgrupadas.labels.length > 0 ? despesasAgrupadas.labels : ["Sem despesas"];
    graficoDespesas.data.datasets[0].data =
      despesasAgrupadas.valores.length > 0 ? despesasAgrupadas.valores : [1];
    graficoDespesas.data.datasets[0].backgroundColor =
      despesasAgrupadas.valores.length > 0
        ? ["#ffcc00", "#ffd84d", "#ffe58a", "#fff1bf", "#fff6d9"]
        : ["#d9d9d9"];
    graficoDespesas.update();

    graficoComparativo.data.datasets[0].data = [
      Number(dados.receitas) || 0,
      Number(dados.despesas) || 0
    ];
    graficoComparativo.update();
  }

  function atualizarDashboard(periodo) {
    const dados = dadosFinanceiros[periodo];

    if (!dados) {
      totalReceitasEl.textContent = "R$ 0,00";
      totalDespesasEl.textContent = "R$ 0,00";
      resultadoEl.textContent = "R$ 0,00";
      textoAnalise.textContent =
        "Não há registros financeiros para o período selecionado.";
      semDados.style.display = "block";
      return;
    }

    const receitas = dados.receitas || 0;
    const despesas = dados.despesas || 0;
    const resultado = receitas - despesas;

    totalReceitasEl.textContent = formatarMoeda(receitas);
    totalDespesasEl.textContent = formatarMoeda(despesas);
    resultadoEl.textContent = formatarMoeda(resultado);

    resultadoEl.classList.remove("resultado-positivo", "resultado-negativo");

    if (resultado >= 0) {
      resultadoEl.classList.add("resultado-positivo");
      textoAnalise.textContent =
        "As despesas estão sob controle no período analisado.";
    } else {
      resultadoEl.classList.add("resultado-negativo");
      textoAnalise.textContent =
        "As despesas superaram o saldo disponível no período analisado.";
    }

    const semMovimento =
      receitas === 0 &&
      despesas === 0 &&
      dados.receitasLista.length === 0 &&
      dados.despesasLista.length === 0;

    semDados.style.display = semMovimento ? "block" : "none";

    atualizarGraficos(periodo);
  }

  Promise.allSettled([
    fetch("/receitas", { credentials: "include" }).then(res => {
      if (!res.ok) throw new Error("Erro ao buscar receitas");
      return res.json();
    }),
    fetch("/despesas", { credentials: "include" }).then(res => {
      if (!res.ok) throw new Error("Erro ao buscar despesas");
      return res.json();
    })
  ])
    .then(([resultadoReceitas, resultadoDespesas]) => {
      const receitas =
        resultadoReceitas.status === "fulfilled" ? (resultadoReceitas.value || []) : [];
      const despesas =
        resultadoDespesas.status === "fulfilled" ? (resultadoDespesas.value || []) : [];

      processarLancamentos(receitas, "receitas");
      processarLancamentos(despesas, "despesas");

      atualizarDashboard(periodoSelect.value);
    })
    .catch(err => {
      console.error("Erro ao montar dashboard financeiro:", err);
      atualizarDashboard(periodoSelect.value);
    });

  periodoSelect.addEventListener("change", e => {
    atualizarDashboard(e.target.value);
  });

  window.atualizarGraficosDashboard = atualizarDashboard;
});