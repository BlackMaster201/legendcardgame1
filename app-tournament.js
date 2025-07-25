let tournamentData = null;
let currentRound = null;

function padId(id) {
  return String(id).padStart(10, '0');
}

function getStanding(id) {
  const players = Array.from(tournamentData.querySelectorAll("TournPlayer"));
  const player = players.find(p => padId(p.querySelector("ID")?.textContent) === id);
  return player ? parseInt(player.querySelector("Standing")?.textContent || "0", 10) : null;
}

function getName(id) {
  const players = Array.from(tournamentData.querySelectorAll("TournPlayer"));
  const player = players.find(p => padId(p.querySelector("ID")?.textContent) === id);
  if (!player) return "Desconocido";
  const first = player.querySelector("FirstName")?.textContent || "";
  const last = player.querySelector("LastName")?.textContent || "";
  return `${first} ${last}`;
}

function mostrarRonda(id) {
  const matches = Array.from(tournamentData.querySelectorAll("TournMatch"));
  const match = matches.find(m => {
    const p1 = padId(m.querySelectorAll("Player")[0]?.textContent || "");
    const p2 = padId(m.querySelectorAll("Player")[1]?.textContent || "");
    const round = parseInt(m.querySelector("Round")?.textContent || "0", 10);
    return (id === p1 || id === p2) && round === currentRound;
  });

  const container = document.getElementById("tableContainer");
  if (!match) {
    container.innerHTML = `<p>No se encontró tu emparejamiento para esta ronda.</p>`;
    return;
  }

  const p1 = padId(match.querySelectorAll("Player")[0]?.textContent || "");
  const p2 = padId(match.querySelectorAll("Player")[1]?.textContent || "");
  const mesa = match.querySelector("Table")?.textContent || "???";

  const yo = id === p1 ? p1 : p2;
  const rival = id === p1 ? p2 : p1;

  container.innerHTML = `
    <div style="text-align:center; margin-bottom: 20px;">
      <h2 style="font-size: 32px; color: #D62828;">Mesa ${mesa}</h2>
    </div>
    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <div class="card" style="border-top: 4px solid #D62828;">
        <h3>${getName(yo)}</h3>
        <p class="konami-id">${yo}</p>
      </div>
      <div class="vs-label">VS</div>
      <div class="card" style="border-bottom: 4px solid #007BFF;">
        <h3>${getName(rival)}</h3>
        <p class="konami-id">${rival}</p>
      </div>
    </div>
  `;
}

function mostrarHistorial(id) {
  const matches = Array.from(tournamentData.querySelectorAll("TournMatch"));
  const historial = [];

  matches.forEach(m => {
    const p1 = padId(m.querySelectorAll("Player")[0]?.textContent || "");
    const p2 = padId(m.querySelectorAll("Player")[1]?.textContent || "");
    const round = parseInt(m.querySelector("Round")?.textContent || "0", 10);
    const winner = padId(m.querySelector("Winner")?.textContent || "");

    if (p1 === id || p2 === id) {
      const oponente = id === p1 ? p2 : p1;
      let resultado = "Empate";
      if (winner === id) resultado = "Victoria";
      else if (winner === oponente) resultado = "Derrota";
      historial.push({ round, oponente, resultado });
    }
  });

  const finalized = tournamentData.querySelector("Finalized")?.textContent === "True";
  const mostrarHasta = finalized ? currentRound : currentRound - 1;

  const filtered = historial.filter(h => h.round <= mostrarHasta).sort((a, b) => b.round - a.round);
  const contenedor = document.getElementById("historyContainer");
  contenedor.innerHTML = "";

  const standing = getStanding(id);
  if (standing !== null) {
    let medalla = "";
    if (standing === 1) medalla = "🥇 ";
    else if (standing === 2) medalla = "🥈 ";
    else if (standing === 3) medalla = "🥉 ";
    contenedor.innerHTML = `<h2 style="text-align:center;">Standing: ${medalla}${standing}</h2>`;
  }

  filtered.forEach(({ round, oponente, resultado }) => {
    const nombre = getName(oponente);
    const color =
      resultado === "Victoria" ? "#4CAF50" :
      resultado === "Derrota" ? "#F44336" : "#9E9E9E";

    const item = document.createElement("div");
    item.style.borderLeft = `8px solid ${color}`;
    item.style.backgroundColor = "#1E1E1E";
    item.style.padding = "10px";
    item.style.margin = "10px 0";
    item.style.borderRadius = "10px";

    item.innerHTML = `
      <div style="color:${color}; font-weight:bold;">Ronda ${round} - ${resultado}</div>
      <div style="color:white; font-weight:bold;">VS ${nombre}</div>
    `;
    contenedor.appendChild(item);
  });
}

function buscarEmparejamientos() {
  const id = document.getElementById("konamiId")?.value?.trim();
  if (!id || !tournamentData) return;

  localStorage.setItem("konamiId", id);

  mostrarRonda(id);
  mostrarHistorial(id);
}

document.addEventListener("DOMContentLoaded", () => {
  fetch("1.txt")
    .then(res => res.text())
    .then(text => {
      const parser = new DOMParser();
      tournamentData = parser.parseFromString(text, "application/xml");
      currentRound = parseInt(tournamentData.querySelector("CurrentRound")?.textContent || "0", 10);
      document.getElementById("rondaInfo").textContent = `Ronda: ${currentRound}`;

      const saved = localStorage.getItem("konamiId");
      if (saved) {
        document.getElementById("konamiId").value = saved;
        buscarEmparejamientos();
      }
    })
    .catch(() => {
      document.getElementById("rondaInfo").textContent = "No se encontró el archivo de torneo.";
    });
});
