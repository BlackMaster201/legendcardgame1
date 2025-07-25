document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("konamiId");
  const btnRonda = document.getElementById("btnRonda");
  const btnHistorial = document.getElementById("btnHistorial");
  const resultado = document.getElementById("resultado");
  const historial = document.getElementById("historial");

  input.value = localStorage.getItem("konamiId") || "";
  if (input.value.length === 10) {
    buscarEmparejamientos();
  }

  btnRonda.addEventListener("click", () => {
    btnRonda.classList.add("active");
    btnHistorial.classList.remove("active");
    resultado.style.display = "block";
    historial.style.display = "none";
  });

  btnHistorial.addEventListener("click", () => {
    btnHistorial.classList.add("active");
    btnRonda.classList.remove("active");
    resultado.style.display = "none";
    historial.style.display = "block";
  });

  input.addEventListener("input", () => {
    const value = input.value.replace(/\D/g, "").slice(0, 10);
    input.value = value;
    if (value.length === 10) {
      buscarEmparejamientos();
    }
  });
});
