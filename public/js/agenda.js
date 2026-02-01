let usuarioId = localStorage.getItem("userId");
let planejamentoEditando = null;
let cachePlanejamentos = [];

// ================== LISTAR ==================
function carregarPlanejamentos() {
  fetch(`/agenda/${usuarioId}`)
    .then(res => res.json())
    .then(dados => {
      cachePlanejamentos = dados;
      renderizarTabela(dados);
      atualizarCards(dados);
    });
}

// ================== RENDER ==================
function renderizarTabela(lista) {
  const tbody = document.getElementById("lista-planejamentos");
  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `
      <tr><td colspan="7">Nenhum planejamento encontrado</td></tr>
    `;
    return;
  }

  lista.forEach(p => {
    const status =
      p.valor_gasto >= p.valor_limite
        ? "❌ Estourado"
        : "✅ Dentro da meta";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.objetivo}</td>
      <td>${p.data_inc}</td>
      <td>${p.data_pvst || "-"}</td>
      <td>R$ ${Number(p.valor_limite).toFixed(2)}</td>
      <td>R$ ${Number(p.valor_gasto || 0).toFixed(2)}</td>
      <td>${status}</td>
      <td class="acoes">
        <button onclick="editarPlanejamento(${p.ID})">✏️</button>
        <button onclick="excluirPlanejamento(${p.ID})">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ================== CARDS ==================
function atualizarCards(lista) {
  let limite = 0;
  let gasto = 0;

  lista.forEach(p => {
    limite += Number(p.valor_limite || 0);
    gasto += Number(p.valor_gasto || 0);
  });

  const elPlanejado = document.getElementById("cardPlanejado");
  const elGasto = document.getElementById("cardGastoPlanejado");
  const elAtivos = document.getElementById("cardAtivos");

  if (elPlanejado)
    elPlanejado.innerText = `R$ ${limite.toFixed(2)}`;

  if (elGasto)
    elGasto.innerText = `R$ ${gasto.toFixed(2)}`;

  if (elAtivos)
    elAtivos.innerText = lista.length;
}

// ================== SALVAR / EDITAR ==================
document.querySelector(".btnSalvarPlanejamento")
  .addEventListener("click", () => {

    const objetivo = document.getElementById("objetivo");
    const dataInicial = document.getElementById("dataInicial");
    const dataFinal = document.getElementById("dataFinal");
    const valorLimite = document.getElementById("valorLimite");
    const valorGasto = document.getElementById("valorGasto");
    const observacoes = document.getElementById("observacoes");

    if (!objetivo || !dataInicial || !valorLimite) {
      console.error("Algum campo não foi encontrado no HTML");
      return;
    }

    const dados = {
      objetivo: objetivo.value,
      data_inc: dataInicial.value,
      data_pvst: dataFinal.value || null,
      valor_limite: Number(valorLimite.value),
      valor_gasto: Number(valorGasto.value || 0),
      obs: observacoes.value || null,
      codusuario: usuarioId
    };

    if (!dados.objetivo || !dados.data_inc || !dados.valor_limite) {
      alert("Preencha objetivo, data inicial e valor limite");
      return;
    }

    const metodo = planejamentoEditando ? "PUT" : "POST";
    const url = planejamentoEditando
      ? `/agenda/${planejamentoEditando}`
      : "/agenda";

    fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    })
      .then(res => {
        if (!res.ok) throw new Error("Erro ao salvar");
        return res.json();
      })
      .then(() => {
        planejamentoEditando = null;
        carregarPlanejamentos();
      })
      .catch(err => {
        console.error(err);
        alert("Erro ao salvar planejamento");
      });
});


// ================== EDITAR ==================
function editarPlanejamento(id) {
  const p = cachePlanejamentos.find(x => x.ID === id);
  if (!p) return;

  document.getElementById("objetivo").value = p.objetivo;
  document.getElementById("dataInicial").value = p.data_inc;
  document.getElementById("dataFinal").value = p.data_pvst || "";
  document.getElementById("valorLimite").value = p.valor_limite;
  document.getElementById("valorGasto").value = p.valor_gasto || "";
  document.getElementById("observacoes").value = p.obs || "";

  planejamentoEditando = id;
}

// ================== EXCLUIR ==================
function excluirPlanejamento(id) {
  if (!confirm("Deseja excluir este planejamento?")) return;

  fetch(`/agenda/${id}`, { method: "DELETE" })
    .then(() => carregarPlanejamentos());
}

// ================== BUSCAR ==================
document.getElementById("buscarPlanejamento")
  .addEventListener("input", e => {
    const termo = e.target.value.toLowerCase();

    const filtrado = cachePlanejamentos.filter(p =>
      p.objetivo.toLowerCase().includes(termo)
    );

    renderizarTabela(filtrado);
  });

// ================== INIT ==================
carregarPlanejamentos();
