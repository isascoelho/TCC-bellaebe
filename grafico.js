document.addEventListener('DOMContentLoaded', function () {

  const canvas = document.getElementById('graficoSemanal');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // FUNÇÃO DE COR POR VALOR
  function corPorValor(valor) {
    // ALTOS: > 60
    if (valor > 60) {
      return '#FFD43B'; // amarelo forte
    }

    // MODERADOS: de 30 a 60
    if (valor >= 30 && valor <= 60) {
      return '#FFE58A'; // amarelo claro
    }

    // BAIXOS: < 30
    return '#D3D3D3'; // cinza
  }

  // DADOS INICIAIS (ZERADOS)
  const dadosIniciais = [100, 30, 45, 80, 20, 10, 70];
  const coresIniciais = dadosIniciais.map(valor => corPorValor(valor));

  // CRIA O GRÁFICO
  const grafico = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
      datasets: [{
        data: dadosIniciais,
        backgroundColor: coresIniciais,
         barPercentage: 0.8,
        categoryPercentage: 0.7,
        barPercentage: 0.5,
        borderRadius: 10,
        borderSkipped: false
      }]
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
          grid: {
            display: false
          },
          ticks: {
            color: '#6c6c6c'
          }
        },
        y: {
          display: false,
          min: 0,
          max: 100
        }
      }
    }
  });

  // FUNÇÃO PARA ATUALIZAR DEPOIS DO CADASTRO
  window.atualizarGraficoSemanal = function (novosDados) {
    grafico.data.datasets[0].data = novosDados;
    grafico.data.datasets[0].backgroundColor =
      novosDados.map(valor => corPorValor(valor));

    grafico.update();
  };

});
