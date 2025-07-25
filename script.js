function buscarEmparejamientos() {
  const input = document.getElementById('konamiId').value.padStart(10, '0');
  localStorage.setItem('konamiId', input);

  const resultado = document.getElementById('resultado');
  resultado.innerHTML = "";

  if (!tournamentData || !input) return;

  const players = Array.from(tournamentData.querySelectorAll("TournPlayer"));
  const matches = Array.from(tournamentData.querySelectorAll("TournMatch"));
  const finalized = tournamentData.querySelector("Finalized")?.textContent === "True";

  const playerNode = players.find(p => p.querySelector("ID")?.textContent === input);
  if (!playerNode) {
    resultado.innerHTML = "No se encontró el Konami ID.";
    return;
  }

  const firstName = playerNode.querySelector("FirstName")?.textContent;
  const lastName = playerNode.querySelector("LastName")?.textContent;
  const standing = playerNode.querySelector("Standing")?.textContent || "Sin posición";
  const name = `${firstName} ${lastName}`;

  const historial = matches
    .map(m => {
      const round = parseInt(m.querySelector("Round")?.textContent || "0", 10);
      const p1 = m.querySelectorAll("Player")[0]?.textContent;
      const p2 = m.querySelectorAll("Player")[1]?.textContent;
      const winner = m.querySelector("Winner")?.textContent || "";
      const table = m.querySelector("Table")?.textContent;

      if (input !== p1 && input !== p2) return null;

      const oponenteId = input === p1 ? p2 : p1;
      const oponenteNode = players.find(p => p.querySelector("ID")?.textContent === oponenteId);
      const oponenteName = oponenteNode
        ? `${oponenteNode.querySelector("FirstName")?.textContent} ${oponenteNode.querySelector("LastName")?.textContent}`
        : "Desconocido";

      let resultado = "Empate";
      if (winner === input) resultado = "Victoria";
      else if (winner === oponenteId) resultado = "Derrota";

      return { round, resultado, oponenteName, mesa: table };
    })
    .filter(Boolean)
    .sort((a, b) => b.round - a.round);

  const actualMatch = historial.find(h => h.round === currentRound);

  const mostrarActual = !finalized && actualMatch;
  const historialFiltrado = finalized ? historial : historial.filter(h => h.round !== currentRound);

  if (mostrarActual) {
    resultado.innerHTML += `
      <div class="card" style="border-top: 4px solid #D62828; border-bottom: 4px solid #007BFF;">
        <h3>${name}</h3>
        <p class="konami-id">${input}</p>
      </div>
      <div class="vs-label">VS</div>
      <div class="card" style="border-top: 4px solid #007BFF; border-bottom: 4px solid #007BFF;">
        <h3>${actualMatch.oponenteName}</h3>
      </div>
      <div class="vs-label">Mesa ${actualMatch.mesa}</div>
    `;
  }

  if (historialFiltrado.length) {
    resultado.innerHTML += `<h2 style="margin-top:20px;">Standing: ${parseInt(standing) <= 3 ? ['🥇', '🥈', '🥉'][parseInt(standing) - 1] : ''} ${standing}</h2>`;

    historialFiltrado.forEach(h => {
      const colorClass = h.resultado === 'Victoria' ? 'green' : h.resultado === 'Derrota' ? 'red' : 'gray';

      resultado.innerHTML += `
        <div class="historial-entry ${colorClass}">
          <h4>Ronda ${h.round} - ${h.resultado}</h4>
          <p>VS ${h.oponenteName}</p>
        </div>
      `;
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("konamiId");
  const btnRonda = document.getElementById("btnRonda");
  const btnHistorial = document.getElementById("btnHistorial");
  const lastId = localStorage.getItem("konamiId");
  if (lastId) {
    input.value = lastId;
    setTimeout(buscarEmparejamientos, 300);
  }

  input.addEventListener("input", () => {
    const id = input.value.replace(/\D/g, "").slice(0, 10);
    input.value = id;
    if (id.length === 10) buscarEmparejamientos();
  });

  btnRonda.addEventListener("click", () => {
    btnRonda.classList.add("active");
    btnHistorial.classList.remove("active");
    buscarEmparejamientos();
  });

  btnHistorial.addEventListener("click", () => {
    btnRonda.classList.remove("active");
    btnHistorial.classList.add("active");
    buscarEmparejamientos();
  });
});
