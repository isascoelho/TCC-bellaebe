document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("graficoSemanal");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  function corPorValor(valor) {
    if (valor > 60) return "#FFD43B";
    if (valor >= 30) return "#FFE58A";
    return "#D3D3D3";
  }

  const labels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const dadosIniciais = [0, 0, 0, 0, 0, 0, 0];

  const grafico = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: dadosIniciais,
          backgroundColor: dadosIniciais.map(corPorValor),
          categoryPercentage: 0.7,
          barPercentage: 0.5,
          borderRadius: 10,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
  x: {
    display: true,
    grid: {
      display: false
    }
  },
  y: {
    display: true,
    beginAtZero: true,
    ticks: {
  callback: function(value) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
},
    grid: {
      display: true
    }
  }
}
    }
  });

  const mapaDias = {
    SUNDAY: "DOM",
    MONDAY: "SEG",
    TUESDAY: "TER",
    WEDNESDAY: "QUA",
    THURSDAY: "QUI",
    FRIDAY: "SEX",
    SATURDAY: "SÁB"
  };

  window.atualizarGraficoSemanal = function () {
    fetch("/despesas/semana", {
      credentials: "include"
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Erro HTTP: " + res.status);
        }
        return res.json();
      })
      .then(dados => {
        if (!Array.isArray(dados)) return;

        const mapa = {
          DOM: 0,
          SEG: 0,
          TER: 0,
          QUA: 0,
          QUI: 0,
          SEX: 0,
          SÁB: 0
        };

        dados.forEach(item => {
          const diaEN = item.dia?.toUpperCase();
          const diaBR = mapaDias[diaEN];

          if (diaBR) {
            mapa[diaBR] = Number(item.total) || 0;
          }
        });

        const novosDados = labels.map(dia => mapa[dia]);

        grafico.data.datasets[0].data = novosDados;
        grafico.data.datasets[0].backgroundColor = novosDados.map(corPorValor);
        grafico.update();
      })
      .catch(err => {
        console.error("Erro no gráfico semanal:", err);
      });
  };

  window.testarGraficoSemanal = function () {
    const dadosTeste = [10, 25, 40, 80, 55, 30, 15];
    grafico.data.datasets[0].data = dadosTeste;
    grafico.data.datasets[0].backgroundColor = dadosTeste.map(corPorValor);
    grafico.update();
  };

  atualizarGraficoSemanal();
});