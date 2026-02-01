let despesaEditando = null;

/* =========================
   PERÍODO DO RESUMO
========================= */
function definirPeriodoResumo() {
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

/* =========================
   SALVAR / EDITAR DESPESA
========================= */
const btnSalvar = document.getElementById("btnSalvarReceita");

if (btnSalvar) {
  btnSalvar.addEventListener("click", () => {
    const despesa = {
      periodo: document.getElementById("data").value,
      valor: Number(document.getElementById("valor").value),
      categoria: document.getElementById("categoria").value,
      banco: document.getElementById("banco").value,
      parcelamento:
        document.getElementById("parcelamento").value === "Parcelada",
      situacao: Number(document.getElementById("situacao").value),
      periodicidade: Number(document.getElementById("periodicidade").value),
      descricao: document.getElementById("descricao").value
    };

    if (
      !despesa.periodo ||
      !despesa.valor ||
      !despesa.categoria ||
      !despesa.banco ||
      !despesa.situacao ||
      !despesa.periodicidade
    ) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const metodo = despesaEditando ? "PUT" : "POST";
    const url = despesaEditando
      ? `/despesas/${despesaEditando}`
      : "/despesas";

    fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(despesa)
    })
      .then(res => {
        if (!res.ok) throw new Error("Erro ao salvar despesa");
        return res.json();
      })
      .then(() => {
        despesaEditando = null;
        limparFormulario();
        carregarDespesas();
      })
      .catch(err => {
        console.error(err);
        alert("Erro ao salvar despesa");
      });
  });
}

/* =========================
   LISTAR DESPESAS
========================= */
function carregarDespesas() {
  fetch("/despesas")
    .then(res => {
      if (!res.ok) throw new Error("Erro ao buscar despesas");
      return res.json();
    })
    .then(despesas => {
      const tbody = document.getElementById("lista-despesas");
      if (!tbody) return;

      tbody.innerHTML = "";

      if (!despesas.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">Nenhuma despesa cadastrada</td>
          </tr>
        `;
        return;
      }

      despesas.forEach(d => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${d.periodo}</td>
          <td>${d.categoria}</td>
          <td>${d.banco}</td>
          <td>${d.descricao || "-"}</td>
          <td>${d.parcelamento ? "Parcelada" : "À vista"}</td>
          <td>R$ ${Number(d.valor).toFixed(2)}</td>
          <td class="acoes">
            <button onclick="editarDespesa(${d.ID})">✏️</button>
            <button onclick="excluirDespesa(${d.ID})">🗑</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error(err);
    });
}

/* =========================
   EDITAR DESPESA
========================= */
function editarDespesa(id) {
  fetch(`/despesas/${id}`)
    .then(res => res.json())
    .then(d => {
      document.getElementById("valor").value = d.valor;
      document.getElementById("data").value = d.periodo;
      document.getElementById("categoria").value = d.categoria;
      document.getElementById("banco").value = d.banco;
      document.getElementById("descricao").value = d.descricao || "";
      document.getElementById("situacao").value = d.situacao;
      document.getElementById("periodicidade").value = d.periodicidade;
      document.getElementById("parcelamento").value =
        d.parcelamento ? "Parcelada" : "À vista";

      despesaEditando = id;
    });
}

/* =========================
   EXCLUIR DESPESA
========================= */
function excluirDespesa(id) {
  if (!confirm("Excluir esta despesa?")) return;

  fetch(`/despesas/${id}`, { method: "DELETE" })
    .then(() => carregarDespesas());
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
   INIT
========================= */
definirPeriodoResumo();
carregarDespesas();
