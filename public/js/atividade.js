console.log('atividades.js carregou');

window.renderizarBolhas = function (atividades) {
  const container = document.getElementById('bolhasContainer');
  const textoVazio = document.getElementById('semAtividades');

  if (!container || !textoVazio) return;

  container.innerHTML = '';

  if (!atividades || atividades.length === 0) {
    textoVazio.style.display = 'block';
    return;
  }

  textoVazio.style.display = 'none';

  const ultimas = atividades.slice(0, 3);

  const positions = [
    { top: '40px',  left: '90px' },
    { top: '140px', left: '75px' },
    { top: '80px',  left: '10px' }
  ];

  function formatarValor(valor) {
    return Number(valor).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function truncarNome(nome) {
    return nome.length > 10 ? nome.substring(0, 10) + '…' : nome;
  }

  ultimas.forEach((atividade, index) => {
    const bolha = document.createElement('div');
    bolha.classList.add('bolha', `bolha-${index + 1}`);

    if (index === 0) bolha.classList.add('bolha-grande');
    if (index === 1) bolha.classList.add('bolha-media');
    if (index === 2) bolha.classList.add('bolha-pequena');

    bolha.classList.add(
      atividade.tipo === 'receita' ? 'bolha-receita' : 'bolha-despesa'
    );

    bolha.innerHTML = `
      <span>${truncarNome(atividade.nome)}</span>
      <strong>R$ ${formatarValor(atividade.valor)}</strong>
    `;

    bolha.style.top          = positions[index].top;
    bolha.style.left         = positions[index].left;
    bolha.style.animationDelay = `${index * 0.12}s`;

    container.appendChild(bolha);
  });
};