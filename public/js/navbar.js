const userId = localStorage.getItem("userId");

// proteção básica
if (!userId) {
  window.location.href = "comece.html";
}

// caminho absoluto da imagem padrão
const fotoPadrao = "/imagens/avatar.png";

fetch(`/me/${userId}`)
  .then(res => res.json())
  .then(user => {
    if (!user) return;

    document.getElementById("userNome").innerText =
      user.nome || "Usuário";

    document.getElementById("userEmail").innerText =
      user.email || "";

    const img = document.getElementById("userFoto");

    // se a imagem falhar por qualquer motivo, usa a padrão
    img.onerror = () => {
      img.src = fotoPadrao;
    };

    // regra final
    if (!user.foto || user.foto.trim() === "") {
      img.src = fotoPadrao;
    } else {
      img.src = user.foto;
    }
  })
  .catch(() => {
    // fallback total
    const img = document.getElementById("userFoto");
    if (img) img.src = fotoPadrao;
  });
