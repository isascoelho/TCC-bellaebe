document.addEventListener("DOMContentLoaded", function () {
  const insightSaldo = document.getElementById("insightSaldo");
  const insightSaldoDesc = document.getElementById("insightSaldoDesc");
  const insightMaiorGasto = document.getElementById("insightMaiorGasto");
  const insightMaiorGastoDesc = document.getElementById("insightMaiorGastoDesc");

  function formatarBRL(valor) {
    return valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function atualizarResumo({ saldo, ultimaDespesa }) {
    if (insightSaldo && insightSaldoDesc) {
      if (saldo > 0) {
        insightSaldo.textContent = "Seu saldo continua positivo.";
        insightSaldoDesc.textContent = `Saldo atual de R$ ${formatarBRL(saldo)}.`;
      } else if (saldo < 0) {
        insightSaldo.textContent = "Seu saldo está negativo.";
        insightSaldoDesc.textContent = "Vale revisar receitas e despesas recentes.";
      } else {
        insightSaldo.textContent = "Seu saldo está zerado.";
        insightSaldoDesc.textContent = "Acompanhe os próximos lançamentos.";
      }
    }

    if (insightMaiorGasto && insightMaiorGastoDesc) {
      if (ultimaDespesa > 0) {
        insightMaiorGasto.textContent = `Última despesa registrada: R$ ${formatarBRL(ultimaDespesa)}`;
        insightMaiorGastoDesc.textContent = "Verifique se esse gasto impacta seu planejamento.";
      } else {
        insightMaiorGasto.textContent = "Nenhuma despesa recente encontrada.";
        insightMaiorGastoDesc.textContent = "Aguardando novos lançamentos.";
      }
    }
  }

  document.addEventListener("dashboardResumoAtualizado", function (event) {
    atualizarResumo(event.detail);
  });
});