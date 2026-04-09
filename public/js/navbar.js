// caminho absoluto da imagem padrão
const fotoPadrao = "/imagens/avatar.png";

document.addEventListener("DOMContentLoaded", () => {
  fetch("/me", {
    credentials: "include" // 🔥 ESSENCIAL
  })
    .then(res => {
      if (!res.ok) {
        window.location.href = "comece.html";
        throw new Error("Não autenticado");
      }
      return res.json();
    })
    .then(user => {
      if (!user) return;

      const nomeEl = document.getElementById("userNome");
      const emailEl = document.getElementById("userEmail");
      const img = document.getElementById("userFoto");

      if (nomeEl) nomeEl.innerText = user.nome || "Usuário";
      if (emailEl) emailEl.innerText = user.email || "";

      if (img) {
        img.onerror = () => {
          img.src = fotoPadrao;
        };

        img.src =
          user.foto && user.foto.trim() !== ""
            ? user.foto
            : fotoPadrao;
      }
    })
    .catch(err => {
      console.error("Erro ao carregar navbar:", err);
      const img = document.getElementById("userFoto");
      if (img) img.src = fotoPadrao;
    });
});
