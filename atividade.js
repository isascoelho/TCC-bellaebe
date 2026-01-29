console.log('atividades.js carregou');

window.renderizarBolhas = function (atividades) {
  const container = document.getElementById('bolhasContainer');
  const textoVazio = document.getElementById('semAtividades');

  if (!container || !textoVazio) return;

  container.innerHTML = '';

  // estado vazio
  if (!atividades || atividades.length === 0) {
    textoVazio.style.display = 'block';
    return;
  }

  textoVazio.style.display = 'none';

  const ultimas = atividades.slice(0, 3);

  
   const positions = [
    // FARMÁCIA – mais pra cima e direita
  { top: '20px', left: '80px' },

  // PIX – abaixo da farmácia e mais à direita
  { top: '110px', left: '75px' },

  // UBER – abaixo do pix e mais à esquerda
  { top: '60px', left: '10px' }
];

  ultimas.forEach((atividade, index) => {
    const bolha = document.createElement('div');
    bolha.classList.add('bolha' , `bolha-${index + 1}`);

    if (index === 0) bolha.classList.add('bolha-grande');
    if (index === 1) bolha.classList.add('bolha-media');
    if (index === 2) bolha.classList.add('bolha-pequena');

    bolha.classList.add(
      atividade.tipo === 'receita' ? 'bolha-receita' : 'bolha-despesa'
    );

    bolha.innerHTML = `
      <span>${atividade.nome}</span>
      <strong>R$ ${Number(atividade.valor).toFixed(2)}</strong>
    `;

    bolha.style.top = positions[index].top;
    bolha.style.left = positions[index].left;
    bolha.style.animationDelay = `${index * 0.12}s`;

    container.appendChild(bolha);
  });
};
