let fullData = [];
let currentRound = 0;
let players = {};

function normalizeName(player) {
  return `${player.FirstName} ${player.LastName}`.trim();
}

function parseTournament(xml) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "application/xml");

  // Obtener ronda actual
  currentRound = parseInt(xmlDoc.querySelector("CurrentRound")?.textContent || "0");
  document.getElementById("rondaInfo").textContent = `Ronda: ${currentRound}`;

  // Indexar jugadores por ID
  const playerNodes = xmlDoc.querySelectorAll("TournPlayer");
  players = {};
  playerNodes.forEach(player => {
    const id = player.querySelector("ID")?.textContent;
    players[id] = {
      id,
      name: normalizeName({
        FirstName: player.querySelector("FirstName")?.textContent || "",
        LastName: player.querySelector("LastName")?.textContent || "",
      }),
      rank: player.querySelector("Rank")?.textContent,
    };
  });

  // Extraer matches solo de rondas completadas
  const matchNodes = xmlDoc.querySelectorAll("TournMatch");
  fullData = [];
  matchNodes.forEach(match => {
    const round = parseInt(match.querySelector("Round")?.textContent || "0");
    if (round > currentRound || !match.querySelector("Status")) return;
    const id1 = match.querySelectorAll("Player")[0]?.textContent;
    const id2 = match.querySelectorAll("Player")[1]?.textContent;
    const mesa = match.querySelector("Table")?.textContent || "?";
    const winner = match.querySelector("Winner")?.textContent;
    const status = match.querySelector("Status")?.textContent;

    fullData.push({
      round,
      mesa,
      id1,
      id2,
      winner,
      status,
    });
  });

  const saved = localStorage.getItem("lastKonamiID");
  if (saved && /^[0-9]{10}$/.test(saved)) {
    document.getElementById("searchID").value = saved;
    buscarJugador(saved);
  }
}

function buscarJugador(kid) {
  const historial = fullData
    .filter(m => m.id1 === kid || m.id2 === kid)
    .sort((a, b) => b.round - a.round);

  const actual = historial.find(m => m.round === currentRound);
  const prev = historial.filter(m => m.round < currentRound);

  mostrarActual(actual, kid);
  mostrarHistorial(prev, kid);
  localStorage.setItem("lastKonamiID", kid);
}

function mostrarActual(match, kid) {
  const container = document.getElementById("tableContainer");
  if (!match) {
    container.innerHTML = `<p>No tienes mesa asignada esta ronda.</p>`;
    return;
  }

  const yo = match.id1 === kid ? players[match.id1] : players[match.id2];
  const rival = match.id1 === kid ? players[match.id2] : players[match.id1];

  container.innerHTML = `
    <div style="text-align:center; margin-bottom: 20px;">
      <h2 style="font-size: 32px; color: #D62828;">Mesa ${match.mesa}</h2>
    </div>

    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <div style="background:#1E1E1E; border-radius:10px; overflow:hidden; max-width:400px; width:100%;">
        <div style="background:#D62828; height:4px;"></div>
        <div style="padding:10px 15px 15px; text-align:center;">
          <p style="margin:4px 0; font-weight:bold; color:#fff; font-size:16px;">${yo.name}</p>
          <p style="margin:4px 0; color:#bbb; font-size:14px;">${yo.id}</p>
        </div>
      </div>

      <div style="text-align:center; font-size: 20px; font-weight:bold; color: #D3D3D3;">VS</div>

      <div style="background:#1E1E1E; border-radius:10px; overflow:hidden; max-width:400px; width:100%;">
        <div style="background:#2A9D8F; height:4px;"></div>
        <div style="padding:10px 15px 15px; text-align:center;">
          <p style="margin:4px 0; font-weight:bold; color:#fff; font-size:16px;">${rival.name}</p>
          <p style="margin:4px 0; color:#bbb; font-size:14px;">${rival.id}</p>
        </div>
      </div>
    </div>
  `;
}

function mostrarHistorial(historial, kid) {
  const tab = document.getElementById("historialTab");
  const yo = players[kid];
  let html = `<div style="text-align:center; margin-bottom: 15px; font-weight:bold;">Posición actual: ${yo.rank}</div>`;

  historial.forEach(m => {
    const esJugador1 = m.id1 === kid;
    const oponente = players[esJugador1 ? m.id2 : m.id1];
    const resultado = m.status === "Draw"
      ? "Empate"
      : m.winner === kid ? "Victoria" : "Derrota";
    const color = resultado === "Victoria" ? "#4CAF50" : resultado === "Derrota" ? "#F44336" : "#9E9E9E";

    html += `
      <div style="background:#1E1E1E; border-radius:8px; padding:10px; margin-bottom:10px;">
        <div style="font-weight:bold; color:#fff;">Ronda ${m.round} - <span style="color:${color};">${resultado}</span></div>
        <div style="color:#ccc; font-size:14px;">vs. ${oponente.name} (${oponente.id})</div>
      </div>
    `;
  });

  tab.innerHTML = html;
}

// Detectar archivo .Tournament sin importar nombre
(async () => {
  try {
    const res = await fetch("./Torneo.Tournament");
    if (!res.ok) throw new Error();
    const xml = await res.text();
    parseTournament(xml);
  } catch {
    document.getElementById("rondaInfo").textContent = "Archivo .Tournament no encontrado.";
  }
})();

document.getElementById("searchID").addEventListener("input", function () {
  const input = this.value.replace(/\D/g, "").slice(0, 10);
  this.value = input;
  if (input.length === 10) buscarJugador(input);
  else document.getElementById("tableContainer").innerHTML = "";
});
