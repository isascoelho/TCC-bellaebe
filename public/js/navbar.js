// caminho absoluto da imagem padrão
const fotoPadrao = "/imagens/avatar.png";

document.addEventListener("DOMContentLoaded", () => {
  fetch("/me", { credentials: "include" })
  .then(res => {
    if (!res.ok) throw new Error("Não autenticado");
    return res.json();
  })
  .then(user => {
    const nome = document.getElementById("userNome");
    const email = document.getElementById("userEmail");
    const foto = document.getElementById("userFoto");

    if (nome) nome.textContent = user.nome || "Usuário";
    if (email) email.textContent = user.email || "";
    if (foto) foto.src = user.foto || "imagens/avatar.png";
  })
  .catch(err => {
    console.error("Erro ao carregar navbar:", err);
  });
});
