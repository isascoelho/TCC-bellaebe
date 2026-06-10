const fotoPadrao = "/imagens/avatar.png";

document.addEventListener("DOMContentLoaded", () => {
  fetch("/me", { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Não autenticado");
      return res.json();
    })
    .then(user => {
      const nome  = document.getElementById("userNome");
      const email = document.getElementById("userEmail");
      const foto  = document.getElementById("userFoto");

      if (nome)  nome.textContent  = user.nome  || "Usuário";
      if (email) email.textContent = user.email || "";
      if (foto)  foto.src          = user.foto  || fotoPadrao;
    })
    .catch(err => console.error("Erro ao carregar navbar:", err));

  const sidebar = document.getElementById("offcanvasNavbar");
  if (!sidebar) return;

  const btnHamburger = document.createElement("button");
  btnHamburger.className = "btn-hamburger";
  btnHamburger.innerHTML = "&#9776;";
  btnHamburger.setAttribute("aria-label", "Abrir menu");
  document.body.appendChild(btnHamburger);

  const overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";
  document.body.appendChild(overlay);

  function abrirSidebar() {
    sidebar.classList.add("sidebar-aberta");
    overlay.classList.add("ativo");
    btnHamburger.innerHTML = "&#10005;";
  }

  function fecharSidebar() {
    sidebar.classList.remove("sidebar-aberta");
    overlay.classList.remove("ativo");
    btnHamburger.innerHTML = "&#9776;";
  }

  btnHamburger.addEventListener("click", () => {
    sidebar.classList.contains("sidebar-aberta") ? fecharSidebar() : abrirSidebar();
  });

  overlay.addEventListener("click", fecharSidebar);

  sidebar.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", fecharSidebar);
  });
});