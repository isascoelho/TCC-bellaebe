let receitaEditandoId = null;

document.addEventListener("DOMContentLoaded", () => {
  definirPeriodoResumoReceitas();
  carregarReceitas();
  atualizarCardsReceitas();
  carregarResumoReceitas();

  const btn = document.getElementById("btnSalvarReceita");
  if (btn) btn.addEventListener("click", salvarReceita);
});

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
  const url = receitaEditandoId
    ? `/receitas/${receitaEditandoId}`
    : "/receitas";

  fetch(url, {
    method: metodo,
    credentials: "include", // 🔥 ESSENCIAL
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
  if (btn) btn.innerText = "Salvar";

  carregarReceitas();
  atualizarCardsReceitas();
  carregarResumoReceitas();

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
  fetch("/receitas", {
    credentials: "include" // 🔥 ESSENCIAL
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao carregar receitas");
      return res.json();
    })
    .then(receitas => {
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
        const descricao =
          r.descricao && r.descricao !== "null" ? r.descricao : "-";
        const periodicidade =
          r.periodicidade && r.periodicidade !== "null"
            ? r.periodicidade
            : "Única";

        tbody.innerHTML += `
          <tr>
            <td>${formatarData(r.periodo)}</td>
            <td>${r.categoria}</td>
            <td>${r.banco}</td>
            <td>${descricao}</td>
            <td>${periodicidade}</td>
            <td><strong>R$ ${Number(r.valor).toFixed(2)}</strong></td>
            <td>
              <button onclick="editarReceita(${r.ID})">✏️</button>
              <button onclick="excluirReceita(${r.ID})">🗑️</button>
            </td>
          </tr>`;
      });
    })
    .catch(err => {
      console.error("Erro ao listar receitas:", err);
    });
}

/* =========================
   EDITAR
========================= */
function editarReceita(id) {
  fetch(`/receitas/${id}`, {
    credentials: "include" // 🔥 ESSENCIAL
  })
    .then(res => res.json())
    .then(r => {
      if (!r) {
        alert("Receita não encontrada.");
        return;
      }

      document.getElementById("valor").value = r.valor;
      document.getElementById("data").value = r.periodo.split("T")[0];
      document.getElementById("categoria").value = r.categoria;
      document.getElementById("banco").value = r.banco;
      document.getElementById("periodicidade").value = r.periodicidade;
      document.getElementById("descricao").value =
        r.descricao && r.descricao !== "null" ? r.descricao : "";

      receitaEditandoId = id;
      document.getElementById("btnSalvarReceita").innerText = "Atualizar";
    });
}

/* =========================
   EXCLUIR
========================= */
function excluirReceita(id) {
  if (!confirm("Deseja excluir esta receita?")) return;

  fetch(`/receitas/${id}`, {
    method: "DELETE",
    credentials: "include" // 🔥 ESSENCIAL
  })
   .then(() => {
  carregarReceitas();
  atualizarCardsReceitas();
  carregarResumoReceitas();

  if (typeof atualizarTudo === "function") atualizarTudo();
});
}

/* =========================
   UTIL
========================= */
function limparFormulario() {
  ["valor", "data", "categoria", "banco", "descricao"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function formatarData(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}

function definirPeriodoResumoReceitas() {
  const agora = new Date();
  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  const periodoEl = document.getElementById("periodoResumo");
  if (periodoEl) {
    periodoEl.innerText = `Período: ${meses[agora.getMonth()]} / ${agora.getFullYear()}`;
  }
}

function atualizarCardsReceitas() {
  Promise.all([
    fetch("/receitas/total-mes", { credentials: "include" }).then(r => r.json()),
    fetch("/receitas/ultima", { credentials: "include" }).then(r => r.json())
  ])
    .then(([totalMes, ultimaReceita]) => {
      const totalMesEl = document.getElementById("totalMes");
      const ultimaReceitaEl = document.getElementById("ultimaReceita");

      const totalValor = Number(totalMes?.total || 0);
      const ultimaValor = Number(ultimaReceita?.valor || 0);

      if (totalMesEl) {
        totalMesEl.innerText = `R$ ${totalValor.toFixed(2)}`;
      }

      if (ultimaReceitaEl) {
        ultimaReceitaEl.innerText = ultimaReceita
          ? `R$ ${ultimaValor.toFixed(2)}`
          : "—";
      }
    })
    .catch(err => {
      console.error("Erro ao atualizar cards de receitas:", err);
    });
}

function carregarResumoReceitas() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);

  const inicio = primeiroDia.toISOString().split("T")[0];
  const fim = ultimoDia.toISOString().split("T")[0];

  fetch(`/receitas/relatorio?inicio=${inicio}&fim=${fim}`, {
    credentials: "include"
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao carregar relatório de receitas");
      return res.json();
    })
    .then(dados => {
      console.log("RESUMO RECEITAS:", dados);

      const resumoTotal = document.getElementById("resumoTotal");
      const resumoMedia = document.getElementById("resumoMedia");
      const resumoMaior = document.getElementById("resumoMaior");
      const resumoEstado = document.getElementById("resumoEstado");

      if (!Array.isArray(dados) || !dados.length) {
        if (resumoTotal) resumoTotal.innerText = "R$ 0,00";
        if (resumoMedia) resumoMedia.innerText = "R$ 0,00";
        if (resumoMaior) resumoMaior.innerText = "R$ 0,00";
        if (resumoEstado) resumoEstado.hidden = false;
        return;
      }

      const valores = dados.map(item => Number(item.valor || 0));
      const total = valores.reduce((acc, v) => acc + v, 0);
      const media = total / valores.length;
      const maior = Math.max(...valores);

      if (resumoTotal) resumoTotal.innerText = `R$ ${total.toFixed(2)}`;
      if (resumoMedia) resumoMedia.innerText = `R$ ${media.toFixed(2)}`;
      if (resumoMaior) resumoMaior.innerText = `R$ ${maior.toFixed(2)}`;
      if (resumoEstado) resumoEstado.hidden = true;
    })
    .catch(err => {
      console.error("Erro ao carregar resumo de receitas:", err);
    });
}