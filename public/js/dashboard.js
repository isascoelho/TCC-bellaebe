document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    window.location.href = "comece.html";
    return;
  }

  atualizarTudo();
});

/* =========================
   ATUALIZAÇÃO CENTRAL
========================= */
function atualizarTudo() {
  atualizarResumoReceitas();
  atualizarSaldo();
  if (typeof atualizarGraficoSemanal === "function") {
    atualizarGraficoSemanal();
  }
}

/* =========================
   RESUMO RECEITAS
========================= */
function atualizarResumoReceitas() {
  // TOTAL DO MÊS
  fetch("/receitas/total-mes")
    .then(res => res.json())
    .then(dados => {
      const el = document.getElementById("totalMes");
      if (el) el.innerText = `R$ ${Number(dados.total).toFixed(2)}`;
    });

  // ÚLTIMA RECEITA
  fetch("/receitas/ultima")
    .then(res => res.json())
    .then(receita => {
      const el = document.getElementById("ultimaReceita");
      if (el) {
        el.innerText = receita
          ? `R$ ${Number(receita.valor).toFixed(2)}`
          : "—";
      }
    });
}

/* =========================
   SALDO
========================= */
function atualizarSaldo() {
  Promise.all([
    fetch("/receitas/total").then(r => r.json()),
    fetch("/despesas/total").then(r => r.json())
  ])
  .then(([rec, desp]) => {
    const totalReceitas =
      rec && typeof rec.total === "number" ? rec.total : 0;

    const totalDespesas =
      desp && typeof desp.total === "number" ? desp.total : 0;

    const saldo = totalReceitas - totalDespesas;

    const el = document.getElementById("saldoValor");
    if (el) el.innerText = `R$ ${saldo.toFixed(2)}`;
  })
  .catch(err => {
    console.error("Erro ao atualizar saldo:", err);
  });
}