let tournamentData = null;
let currentRound = null;
let standings = [];

function padId(id) {
  return String(id).padStart(10, '0');
}

// Fetch and parse tournament data
fetch('1.txt')
  .then(response => response.text())
  .then(str => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(str, 'text/xml');
    tournamentData = xml;

    const currentRoundNode = tournamentData.querySelector('CurrentRound');
    currentRound = parseInt(currentRoundNode?.textContent || "0", 10);

    // Leer standings
    standings = [];
    tournamentData.querySelectorAll("TournPlayer").forEach((p) => {
      const id = padId(p.querySelector("ID")?.textContent || "");
      const first = p.querySelector("FirstName")?.textContent || "";
      const last = p.querySelector("LastName")?.textContent || "";
      const rank = parseInt(p.querySelector("Rank")?.textContent || "0", 10);
      const drop = (p.querySelector("DropReason")?.textContent || "").toLowerCase() !== "active";
      standings.push({ id, name: `${first} ${last}`, rank, drop });
    });

    const label = document.getElementById('rondaInfo');
    if (label) label.textContent = `Ronda: ${currentRound}`;
  })
  .catch(() => {
    const label = document.getElementById('rondaInfo');
    if (label) label.textContent = 'No se encontró el archivo de torneo.';
  });

document.addEventListener('DOMContentLoaded', () => {
  const btnRonda = document.getElementById('btnRonda');
  const btnHistorial = document.getElementById('btnHistorial');
  btnRonda.onclick = () => mostrarRonda();
  btnHistorial.onclick = () => mostrarHistorial();
  const searchInput = document.getElementById('searchID');
  searchInput.addEventListener('input', () => mostrarRonda());
  // Restaura ID anterior si existe
  const lastId = localStorage.getItem('konamiId');
  if (lastId) {
    searchInput.value = lastId;
    setTimeout(() => mostrarRonda(), 350);
  }
});

function buscarJugador(id) {
  id = padId(id);
  const player = Array.from(tournamentData.querySelectorAll("TournPlayer"))
    .find(p => padId(p.querySelector("ID")?.textContent) === id);
  if (!player) return null;
  return {
    id,
    name: `${player.querySelector("FirstName")?.textContent || ""} ${player.querySelector("LastName")?.textContent || ""}`,
    standing: parseInt(player.querySelector("Rank")?.textContent || "0", 10),
    drop: (player.querySelector("DropReason")?.textContent || "").toLowerCase() !== "active"
  };
}
function buscarNombre(id) {
  id = padId(id);
  const player = Array.from(tournamentData.querySelectorAll("TournPlayer"))
    .find(p => padId(p.querySelector("ID")?.textContent) === id);
  return player
    ? `${player.querySelector("FirstName")?.textContent || ""} ${player.querySelector("LastName")?.textContent || ""}`
    : 'Oponente desconocido';
}
function mostrarRonda() {
  activarBoton('btnRonda');
  document.getElementById('tableContainer').style.display = "block";
  document.getElementById('historyContainer').style.display = "none";

  const inputRaw = document.getElementById('searchID').value.trim();
  if (!inputRaw || !tournamentData) {
    document.getElementById('tableContainer').innerHTML = '';
    return;
  }
  localStorage.setItem('konamiId', inputRaw);
  const input = padId(inputRaw);

  // Buscar pareo
  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const playerMatch = matches.find(m => {
    const p1 = padId(m.querySelectorAll('Player')[0]?.textContent || "");
    const p2 = padId(m.querySelectorAll('Player')[1]?.textContent || "");
    const round = parseInt(m.querySelector('Round')?.textContent || "0", 10);
    return (input === p1 || input === p2) && round === currentRound;
  });

  if (!playerMatch) {
    document.getElementById('tableContainer').innerHTML = "<div class='card-mesa'>No se encontró el Konami ID en la ronda actual.</div>";
    return;
  }
  const p1 = padId(playerMatch.querySelectorAll('Player')[0]?.textContent || "");
  const p2 = padId(playerMatch.querySelectorAll('Player')[1]?.textContent || "");
  const mesa = playerMatch.querySelector('Table')?.textContent || "-";
  const nombre1 = buscarNombre(p1);
  const nombre2 = buscarNombre(p2);

  let jugador, oponente;
  if (input === p1) {
    jugador = { nombre: nombre1, id: p1 };
    oponente = { nombre: nombre2, id: p2 };
  } else {
    jugador = { nombre: nombre2, id: p2 };
    oponente = { nombre: nombre1, id: p1 };
  }

  document.getElementById('tableContainer').innerHTML = `
    <div class="card-mesa">Mesa: ${mesa}</div>
    <div class="caja-jugador">
      ${jugador.nombre}<br>
      <span class="konami-id">${jugador.id}</span>
    </div>
    <div class="vs-label">VS</div>
    <div class="caja-oponente">
      ${oponente.nombre}<br>
      <span class="konami-id">${oponente.id}</span>
    </div>
  `;
}

function mostrarHistorial() {
  activarBoton('btnHistorial');
  document.getElementById('tableContainer').style.display = "none";
  document.getElementById('historyContainer').style.display = "block";
  const inputRaw = document.getElementById('searchID').value.trim();
  if (!inputRaw || !tournamentData) {
    document.getElementById('historyContainer').innerHTML = '';
    return;
  }
  localStorage.setItem('konamiId', inputRaw);
  const input = padId(inputRaw);

  const player = buscarJugador(input);
  // Standing actual
  let standingHtml = '';
  if (player && player.standing > 0) {
    let medal = "";
    if (player.standing === 1) medal = "🥇 ";
    else if (player.standing === 2) medal = "🥈 ";
    else if (player.standing === 3) medal = "🥉 ";
    standingHtml = `<div class="standing-container">Standing: ${medal}${player.standing}º${player.drop ? " - Drop" : ""}</div>`;
  }

  // Historial
  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  let historial = [];
  matches.forEach(m => {
    const p1 = padId(m.querySelectorAll('Player')[0]?.textContent || "");
    const p2 = padId(m.querySelectorAll('Player')[1]?.textContent || "");
    const round = parseInt(m.querySelector('Round')?.textContent || "0", 10);
    const winner = padId(m.querySelector('Winner')?.textContent || "");
    if (input === p1 || input === p2) {
      const oponenteId = input === p1 ? p2 : p1;
      const nombreOponente = buscarNombre(oponenteId);
      let resultado = "Empate";
      if (winner === input) resultado = "Victoria";
      else if (winner === oponenteId) resultado = "Derrota";
      let color = resultado === "Victoria" ? "win" : resultado === "Derrota" ? "loss" : "draw";
      historial.push({ ronda: round, resultado, nombreOponente, color });
    }
  });
  historial.sort((a, b) => b.ronda - a.ronda);

  // Render historial
  const container = document.getElementById('historyContainer');
  container.innerHTML = '';
  if (standingHtml) container.innerHTML += standingHtml;
  if (!historial.length) {
    container.innerHTML += "<div class='card-mesa'>No se encontró el Konami ID.</div>";
    return;
  }
  historial.forEach(({ ronda, resultado, nombreOponente, color }) => {
    const card = document.createElement("div");
    card.className = `historial-card ${color}`;
    const bar = document.createElement("div");
    bar.className = "historial-bar";
    card.appendChild(bar);

    // Primera línea
    const titulo = document.createElement("div");
    titulo.className = `historial-title`;
    titulo.innerHTML = `Ronda ${ronda} - ${resultado}`;
    card.appendChild(titulo);

    // Segunda línea
    const vs = document.createElement("div");
    vs.className = "historial-vs";
    vs.innerHTML = `VS ${nombreOponente}`;
    card.appendChild(vs);

    container.appendChild(card);
  });
}

function activarBoton(id) {
  document.getElementById('btnRonda').classList.remove('active');
  document.getElementById('btnHistorial').classList.remove('active');
  document.getElementById(id).classList.add('active');
}
