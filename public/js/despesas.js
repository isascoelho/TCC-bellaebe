let despesaEditando = null;

document.addEventListener("DOMContentLoaded", () => {
  definirPeriodoResumo();
  carregarDespesas();
  atualizarCardsDespesas();
  carregarResumoDespesas();

  const btnSalvar = document.getElementById("btnSalvarReceita");
  if (btnSalvar) {
    btnSalvar.addEventListener("click", salvarDespesa);
  }
});

/* =========================
   PERÍODO DO RESUMO
========================= */
function definirPeriodoResumo() {
  const agora = new Date();
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const periodoEl = document.getElementById("periodoResumo");
  if (periodoEl) {
    periodoEl.innerText = `Período: ${meses[agora.getMonth()]} / ${agora.getFullYear()}`;
  }
}

/* =========================
   SALVAR / EDITAR
========================= */
function salvarDespesa() {
  const periodo = document.getElementById("data").value;
  const valor = Number(document.getElementById("valor").value);
  const categoria = document.getElementById("categoria").value;
  const banco = document.getElementById("banco").value;
  const descricao = document.getElementById("descricao").value;
  const situacao = document.getElementById("situacao").value;
  const periodicidade = document.getElementById("periodicidade").value;
  const parcelamento =
    document.getElementById("parcelamento").value === "Parcelada";

  if (!periodo || isNaN(valor) || valor <= 0 || !situacao || !periodicidade) {
    alert("Preencha corretamente todos os campos obrigatórios");
    return;
  }

  const despesa = {
    periodo,
    valor,
    categoria: categoria || null,
    banco: banco || null,
    descricao: descricao || null,
    situacao,
    periodicidade,
    parcelamento
  };

  const metodo = despesaEditando ? "PUT" : "POST";
  const url = despesaEditando
    ? `/despesas/${despesaEditando}`
    : "/despesas";

  fetch(url, {
    method: metodo,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(despesa)
  })
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => {
          throw err;
        });
      }
      return res.json();
    })
    .then(() => {
      despesaEditando = null;
      limparFormulario();
      carregarDespesas();
      atualizarCardsDespesas();
      carregarResumoDespesas();

      if (typeof atualizarTudo === "function") atualizarTudo();
      if (typeof carregarAtividadesHome === "function") carregarAtividadesHome();
    })
    .catch(err => {
      console.error("Erro ao salvar despesa:", err);
      alert("Erro ao salvar despesa. Verifique os campos.");
    });
}

/* =========================
   LISTAR
========================= */
function carregarDespesas() {
  fetch("/despesas", {
    credentials: "include"
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao buscar despesas");
      return res.json();
    })
    .then(despesas => {
      const tbody = document.getElementById("lista-despesas");
      if (!tbody) return;

      tbody.innerHTML = "";

      if (!Array.isArray(despesas) || !despesas.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">Nenhuma despesa cadastrada</td>
          </tr>`;
        return;
      }

      despesas.forEach(d => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${d.periodo || "-"}</td>
          <td>${d.categoria || "-"}</td>
          <td>${d.banco || "-"}</td>
          <td>${d.descricao || "-"}</td>
          <td>${d.parcelamento ? "Parcelada" : "À vista"}</td>
          <td>R$ ${Number(d.valor || 0).toFixed(2)}</td>
          <td class="acoes">
            <button onclick="editarDespesa(${d.ID})">✏️</button>
            <button onclick="excluirDespesa(${d.ID})">🗑</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => console.error("Erro ao listar despesas:", err));
}

/* =========================
   EDITAR
========================= */
function editarDespesa(id) {
  fetch(`/despesas/${id}`, {
    credentials: "include"
  })
    .then(res => res.json())
    .then(d => {
      if (!d) return;

      document.getElementById("valor").value = d.valor || "";
      document.getElementById("data").value = d.periodo || "";
      document.getElementById("categoria").value = d.categoria || "";
      document.getElementById("banco").value = d.banco || "";
      document.getElementById("descricao").value = d.descricao || "";
      document.getElementById("situacao").value = d.situacao || "";
      document.getElementById("periodicidade").value = d.periodicidade || "";
      document.getElementById("parcelamento").value =
        d.parcelamento ? "Parcelada" : "À vista";

      despesaEditando = id;
    })
    .catch(err => {
      console.error("Erro ao carregar despesa para edição:", err);
    });
}

/* =========================
   EXCLUIR
========================= */
function excluirDespesa(id) {
  if (!confirm("Excluir esta despesa?")) return;

  fetch(`/despesas/${id}`, {
    method: "DELETE",
    credentials: "include"
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao excluir despesa");
      return res.json();
    })
    .then(() => {
      carregarDespesas();
      atualizarCardsDespesas();
      carregarResumoDespesas();

      if (typeof atualizarTudo === "function") atualizarTudo();
      if (typeof carregarAtividadesHome === "function") carregarAtividadesHome();
    })
    .catch(err => {
      console.error("Erro ao excluir despesa:", err);
    });
}

/* =========================
   LIMPAR FORMULÁRIO
========================= */
function limparFormulario() {
  document.getElementById("valor").value = "";
  document.getElementById("data").value = "";
  document.getElementById("categoria").value = "";
  document.getElementById("banco").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("situacao").value = "";
  document.getElementById("periodicidade").value = "";
  document.getElementById("parcelamento").value = "À vista";
}

/* =========================
   CARDS DO TOPO
========================= */
function atualizarCardsDespesas() {
  Promise.all([
    fetch("/despesas/total-mes", { credentials: "include" }).then(r => r.json()),
    fetch("/despesas/ultima", { credentials: "include" }).then(r => r.json())
  ])
    .then(([totalMes, ultimaDespesa]) => {
      const totalMesEl = document.getElementById("totalMesDespesa");
      const ultimaDespesaEl = document.getElementById("ultimaDespesaCard");

      const totalValor = Number(totalMes?.total || 0);
      const ultimaValor = Number(ultimaDespesa?.valor || 0);

      if (totalMesEl) {
        totalMesEl.innerText = `R$ ${totalValor.toFixed(2)}`;
      }

      if (ultimaDespesaEl) {
        ultimaDespesaEl.innerText = ultimaDespesa
          ? `R$ ${ultimaValor.toFixed(2)}`
          : "—";
      }
    })
    .catch(err => {
      console.error("Erro ao atualizar cards de despesas:", err);
    });
}

/* =========================
   RESUMO FINANCEIRO
========================= */
function carregarResumoDespesas() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");

  const inicio = `${ano}-${mes}-01`;
  const fim = `${ano}-${mes}-31`;

  fetch(`/despesas/relatorio?inicio=${inicio}&fim=${fim}`, {
    credentials: "include"
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao carregar relatório de despesas");
      return res.json();
    })
    .then(dados => {
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

      const valores = dados.map(item => Number(item.total || 0));
      const total = valores.reduce((acc, valor) => acc + valor, 0);
      const media = total / valores.length;
      const maior = Math.max(...valores);

      if (resumoTotal) resumoTotal.innerText = `R$ ${total.toFixed(2)}`;
      if (resumoMedia) resumoMedia.innerText = `R$ ${media.toFixed(2)}`;
      if (resumoMaior) resumoMaior.innerText = `R$ ${maior.toFixed(2)}`;
      if (resumoEstado) resumoEstado.hidden = true;
    })
    .catch(err => {
      console.error("Erro ao carregar resumo de despesas:", err);
    });
}

/* =========================
   RELATÓRIO POR PERÍODO
========================= */
function carregarRelatorioDespesas(inicio, fim) {
  fetch(`/despesas/relatorio?inicio=${inicio}&fim=${fim}`, {
    credentials: "include"
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao carregar relatório");
      return res.json();
    })
    .then(dados => {
      console.log("RELATÓRIO:", dados);
    })
    .catch(err => {
      console.error("Erro ao carregar relatório de despesas:", err);
    });
}