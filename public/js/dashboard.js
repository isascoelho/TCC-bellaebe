document.addEventListener("DOMContentLoaded", () => {
  fetch("/me", { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Não autenticado");
      return res.json();
    })
    .then(() => {
      atualizarTudo();
      carregarAtividadesHome();
    })
    .catch(() => {
      window.location.href = "comece.html";
    });
});

/* =========================
   UTIL
========================= */
function formatarMoedaBR(valor) {
  return `R$ ${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/* =========================
   ATUALIZAÇÃO CENTRAL
========================= */
function atualizarTudo() {
  atualizarResumoDashboard();

  if (typeof atualizarGraficoSemanal === "function") {
    atualizarGraficoSemanal();
  }
}

function atualizarResumoDashboard() {
  fetch("/dashboard/resumo", { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao buscar resumo do dashboard");
      return res.json();
    })
    .then(data => {
      const totalMesEl = document.getElementById("totalMes");
      const ultimaReceitaEl = document.getElementById("ultimaReceita");
      const ultimaDespesaEl = document.getElementById("ultimaDespesa");
      const saldoEl = document.getElementById("saldoValor");

      const totalMes = Number(data.totalMes || 0);
      const saldo = Number(data.saldo || 0);
      const ultimaReceita = data.ultimaReceita ? Number(data.ultimaReceita.valor) : 0;
      const ultimaDespesa = data.ultimaDespesa ? Number(data.ultimaDespesa.valor) : 0;

      if (totalMesEl) {
        totalMesEl.innerText = formatarMoedaBR(totalMes);
      }

      if (ultimaReceitaEl) {
        ultimaReceitaEl.innerText = data.ultimaReceita
          ? formatarMoedaBR(ultimaReceita)
          : "—";
      }

      if (ultimaDespesaEl) {
        ultimaDespesaEl.innerText = data.ultimaDespesa
          ? formatarMoedaBR(ultimaDespesa)
          : "—";
      }

      if (saldoEl) {
        saldoEl.innerText = formatarMoedaBR(saldo);
      }

      // avisa o resumo inteligente que os dados chegaram
      document.dispatchEvent(new CustomEvent("dashboardResumoAtualizado", {
        detail: {
          saldo,
          ultimaReceita,
          ultimaDespesa
        }
      }));
    })
    .catch(err => {
      console.error("Erro ao atualizar resumo do dashboard:", err);
    });
}

/* =========================
   ATIVIDADES / BOLHAS
========================= */
function carregarAtividadesHome() {
  Promise.all([
    fetch("/receitas", { credentials: "include" }).then(r => r.json()),
    fetch("/despesas", { credentials: "include" }).then(r => r.json())
  ])
    .then(([receitas, despesas]) => {
      const atividades = [];

      receitas.forEach(r => {
        atividades.push({
          tipo: "receita",
          nome: r.categoria || "Receita",
          valor: Number(r.valor),
          data: r.periodo
        });
      });

      despesas.forEach(d => {
        atividades.push({
          tipo: "despesa",
          nome: d.descricao || "Despesa",
          valor: Number(d.valor),
          data: d.periodo
        });
      });

      atividades.sort((a, b) => new Date(b.data) - new Date(a.data));

      if (typeof renderizarBolhas === "function") {
        renderizarBolhas(atividades.slice(0, 3));
      }
    })
    .catch(err => {
      console.error("Erro ao carregar atividades:", err);
    });
}