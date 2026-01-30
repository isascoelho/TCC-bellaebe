document.addEventListener('DOMContentLoaded', function () {

  const canvas = document.getElementById('graficoSemanal');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function corPorValor(valor) {
    if (valor > 60) return '#FFD43B';
    if (valor >= 30) return '#FFE58A';
    return '#D3D3D3';
  }

  const labels = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const dadosIniciais = [0, 0, 0, 0, 0, 0, 0];

  const grafico = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: dadosIniciais,
        backgroundColor: dadosIniciais.map(corPorValor),
        categoryPercentage: 0.7,
        barPercentage: 0.5,
        borderRadius: 10,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { display: false, min: 0 }
      }
    }
  });

  window.atualizarGraficoSemanal = function () {
    fetch("/receitas/semana")
      .then(res => res.json())
      .then(dados => {
        if (!Array.isArray(dados)) return;

        const mapa = { DOM: 0, SEG: 0, TER: 0, QUA: 0, QUI: 0, SEX: 0, SÁB: 0 };

        dados.forEach(item => {
          const dia = item.dia?.substring(0, 3).toUpperCase();
          if (mapa[dia] !== undefined) {
            mapa[dia] = Number(item.total);
          }
        });

        const novosDados = Object.values(mapa);
        grafico.data.datasets[0].data = novosDados;
        grafico.data.datasets[0].backgroundColor =
          novosDados.map(corPorValor);

        grafico.update();
      });
  };

  atualizarGraficoSemanal();
});
