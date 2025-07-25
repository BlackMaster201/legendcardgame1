let tournamentData = null;
let currentRound = null;

function padId(id) {
  return String(id).padStart(10, '0');
}

function mostrarRonda(round) {
  const label = document.getElementById('rondaInfo');
  if (label) label.textContent = `Ronda: ${round}`;
}

fetch('1.txt')
  .then(response => response.text())
  .then(str => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(str, 'text/xml');
    tournamentData = xml;

    const roundNode = tournamentData.querySelector("CurrentRound");
    currentRound = parseInt(roundNode?.textContent || "0", 10);
    mostrarRonda(currentRound);
  })
  .catch(() => {
    const label = document.getElementById('rondaInfo');
    if (label) label.textContent = 'No se encontró el archivo de torneo.';
  });

function buscarEmparejamientos() {
  const inputRaw = document.getElementById('konamiId').value.trim();
  const input = padId(inputRaw);
  localStorage.setItem("konamiId", input);

  if (!tournamentData || !input) return;

  const matches = Array.from(tournamentData.querySelectorAll("TournMatch"));
  const players = Array.from(tournamentData.querySelectorAll("TournPlayer"));

  const jugador = players.find(p => padId(p.querySelector("ID")?.textContent) === input);
  if (!jugador) {
    document.getElementById("resultado").innerHTML = `<p>No se encontró el Konami ID.</p>`;
    return;
  }

  // Buscar emparejamiento actual
  const match = matches.find(m => {
    const round = parseInt(m.querySelector("Round")?.textContent || "0", 10);
    return round === currentRound &&
      [0, 1].some(i => padId(m.querySelectorAll("Player")[i]?.textContent || "") === input);
  });

  if (!match) {
    document.getElementById("resultado").innerHTML = `<p>No se encontró emparejamiento en esta ronda.</p>`;
    return;
  }

  const mesa = match.querySelector("Table")?.textContent || "N/A";
  const player1 = padId(match.querySelectorAll("Player")[0]?.textContent || "");
  const player2 = padId(match.querySelectorAll("Player")[1]?.textContent || "");
  const isPlayer1 = player1 === input;
  const oponenteId = isPlayer1 ? player2 : player1;
  const oponente = players.find(p => padId(p.querySelector("ID")?.textContent) === oponenteId);

  const nombreJugador = `${jugador.querySelector("FirstName")?.textContent || ""} ${jugador.querySelector("LastName")?.textContent || ""}`;
  const nombreOponente = oponente
    ? `${oponente.querySelector("FirstName")?.textContent || ""} ${oponente.querySelector("LastName")?.textContent || ""}`
    : "Desconocido";

  document.getElementById("resultado").innerHTML = `
    <div class="mesa-title">Mesa ${mesa}</div>
    <div class="card jugador">
      <h3>${nombreJugador}</h3>
      <p class="konami-id">${input}</p>
    </div>
    <div class="vs-label">VS</div>
    <div class="card oponente">
      <h3>${nombreOponente}</h3>
      <p class="konami-id">${oponenteId}</p>
    </div>
  `;

  // Historial
  const historial = [];
  const finalized = tournamentData.querySelector("Finalized")?.textContent === "True";

  matches.forEach(m => {
    const ronda = parseInt(m.querySelector("Round")?.textContent || "0", 10);
    if (!finalized && ronda === currentRound) return;

    const p1 = padId(m.querySelectorAll("Player")[0]?.textContent || "");
    const p2 = padId(m.querySelectorAll("Player")[1]?.textContent || "");
    const ganador = padId(m.querySelector("Winner")?.textContent || "");

    if (input === p1 || input === p2) {
      const rivalId = input === p1 ? p2 : p1;
      const rival = players.find(p => padId(p.querySelector("ID")?.textContent) === rivalId);
      const nombreRival = rival
        ? `${rival.querySelector("FirstName")?.textContent || ""} ${rival.querySelector("LastName")?.textContent || ""}`
        : "Desconocido";

      let resultado = "Empate";
      if (ganador === input) resultado = "Victoria";
      else if (ganador === rivalId) resultado = "Derrota";

      const standing = jugador.querySelector("Standing")?.textContent || "N/A";

      historial.push({ ronda, resultado, nombreRival, standing });
    }
  });

  historial.sort((a, b) => b.ronda - a.ronda);

  const historialDiv = document.getElementById("historial");
  historialDiv.innerHTML = `
    <div class="standing">Standing: ${renderStanding(historial[0]?.standing)}</div>
    ${historial
      .map(h => renderHistorialItem(h.ronda, h.resultado, h.nombreRival))
      .join("")}
  `;
}

function renderHistorialItem(ronda, resultado, nombreRival) {
  const color =
    resultado === "Victoria"
      ? "#4CAF50"
      : resultado === "Derrota"
      ? "#F44336"
      : "#9E9E9E";

  return `
    <div class="historial-box" style="border-left: 8px solid ${color};">
      <div class="historial-titulo" style="color: ${color}; font-weight: bold;">Ronda ${ronda} - ${resultado}</div>
      <div class="historial-vs" style="color: white;">VS ${nombreRival}</div>
    </div>
  `;
}

function renderStanding(num) {
  const n = parseInt(num, 10);
  if (n === 1) return "🥇 1";
  if (n === 2) return "🥈 2";
  if (n === 3) return "🥉 3";
  return num;
}
