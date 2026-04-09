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

      if (totalMesEl) {
        totalMesEl.innerText = `R$ ${Number(data.totalMes || 0).toFixed(2)}`;
      }

      if (ultimaReceitaEl) {
        ultimaReceitaEl.innerText = data.ultimaReceita
          ? `R$ ${Number(data.ultimaReceita.valor).toFixed(2)}`
          : "—";
      }

      if (ultimaDespesaEl) {
        ultimaDespesaEl.innerText = data.ultimaDespesa
          ? `R$ ${Number(data.ultimaDespesa.valor).toFixed(2)}`
          : "—";
      }

      if (saldoEl) {
        saldoEl.innerText = `R$ ${Number(data.saldo || 0).toFixed(2)}`;
      }
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
          nome: d.descricao || "Despesa", // 🔥 AQUI ARRUMA O NOME
          valor: Number(d.valor),
          data: d.periodo
        });
      });

      // ordena por data (mais recente primeiro)
      atividades.sort((a, b) => new Date(b.data) - new Date(a.data));

      if (typeof renderizarBolhas === "function") {
        renderizarBolhas(atividades.slice(0, 3));
      }
    })
    .catch(err => {
      console.error("Erro ao carregar atividades:", err);
    });
}
