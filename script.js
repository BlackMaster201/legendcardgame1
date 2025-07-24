// script.js

let currentRound = 0;
let fullPlayers = [];
let matches = [];
let finalized = false;

function parseTournamentXML(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");

  // Detectar si el torneo está finalizado
  finalized = xml.querySelector("Finalized")?.textContent.trim() === "True";

  // Obtener ronda actual
  currentRound = parseInt(xml.querySelector("CurrentRound")?.textContent || "0", 10);
  document.getElementById("rondaInfo").innerText = `Ronda: ${currentRound}`;

  // Obtener jugadores
  fullPlayers = [...xml.querySelectorAll("TournPlayer")].map(tp => {
    const id = tp.querySelector("ID")?.textContent.trim();
    const nombre = `${tp.querySelector("FirstName")?.textContent.trim()} ${tp.querySelector("LastName")?.textContent.trim()}`;
    const rank = parseInt(tp.querySelector("Rank")?.textContent || 0, 10);
    return { id, nombre, rank };
  });

  // Obtener matches
  matches = [...xml.querySelectorAll("TournMatch")].map(m => {
    return {
      jugador1: m.querySelectorAll("Player")[0]?.textContent.trim(),
      jugador2: m.querySelectorAll("Player")[1]?.textContent.trim(),
      ronda: parseInt(m.querySelector("Round")?.textContent || "0", 10),
      mesa: m.querySelector("Table")?.textContent.trim(),
      status: m.querySelector("Status")?.textContent.trim(),
      ganador: m.querySelector("Winner")?.textContent.trim()
    };
  });
}

function buscarJugadorPorID(id) {
  return fullPlayers.find(p => p.id === id);
}

function mostrarRonda(id) {
  const match = matches.find(m => m.ronda === currentRound && (m.jugador1 === id || m.jugador2 === id));
  const container = document.getElementById("tableContainer");
  const history = document.getElementById("historyContainer");
  container.innerHTML = "";
  history.innerHTML = "";
  if (!match) {
    container.innerHTML = `<p>No se encontró tu duelo en la ronda ${currentRound}.</p>`;
    return;
  }
  const yo = match.jugador1 === id ? match.jugador1 : match.jugador2;
  const rival = match.jugador1 === id ? match.jugador2 : match.jugador1;

  const yoData = buscarJugadorPorID(yo);
  const rivalData = buscarJugadorPorID(rival);

  container.innerHTML = `
    <div style="text-align:center; margin-bottom: 20px;">
      <h2 style="font-size: 32px; color: #D62828;">Mesa ${match.mesa}</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:20px;align-items:center;">
      <div class="card">
        <h3>${yoData?.nombre}</h3>
        <p class="konami-id">${yo}</p>
      </div>
      <div class="vs-label">VS</div>
      <div class="card">
        <h3>${rivalData?.nombre}</h3>
        <p class="konami-id">${rival}</p>
      </div>
    </div>
  `;
}

function mostrarHistorial(id) {
  const container = document.getElementById("historyContainer");
  const player = buscarJugadorPorID(id);
  const standing = player?.rank;

  const historial = matches.filter(m => m.jugador1 === id || m.jugador2 === id)
    .filter(m => finalized || m.ronda < currentRound)
    .sort((a, b) => b.ronda - a.ronda);

  container.innerHTML = `<h2 style="text-align:center;">Standing: ${
    standing === 1 ? "🥇 1" :
    standing === 2 ? "🥈 2" :
    standing === 3 ? "🥉 3" : standing
  }</h2>`;

  for (const duelo of historial) {
    const esJugador1 = duelo.jugador1 === id;
    const miId = esJugador1 ? duelo.jugador1 : duelo.jugador2;
    const rivalId = esJugador1 ? duelo.jugador2 : duelo.jugador1;
    const rivalData = buscarJugadorPorID(rivalId);

    let claseResultado = "result-draw";
    if (duelo.ganador === miId) claseResultado = "result-win";
    else if (duelo.ganador === rivalId) claseResultado = "result-loss";

    container.innerHTML += `
      <div class="card">
        <h3>Ronda ${duelo.ronda}</h3>
        <p class="${claseResultado}">VS ${rivalData?.nombre || "Desconocido"}</p>
      </div>
    `;
  }
}

function manejarBusqueda(id) {
  if (!/^\d{10}$/.test(id)) return;
  localStorage.setItem("lastKonamiID", id);
  if (document.getElementById("btnRonda").classList.contains("active")) {
    mostrarRonda(id);
  } else {
    mostrarHistorial(id);
  }
}

async function cargarArchivoTournament() {
  const archivos = ["Torneo.Tournament", "torneo.Tournament", "1.txt"];
  for (const nombre of archivos) {
    try {
      const res = await fetch(nombre);
      if (!res.ok) continue;
      const xml = await res.text();
      parseTournamentXML(xml);

      const lastID = localStorage.getItem("lastKonamiID");
      if (lastID) {
        manejarBusqueda(lastID);
        document.getElementById("searchID").value = lastID;
      }
      return;
    } catch (e) {
      console.warn("Error al leer archivo:", nombre);
    }
  }
  document.getElementById("rondaInfo").innerText = "Archivo .Tournament no encontrado.";
}

document.getElementById("searchID").addEventListener("input", e => {
  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
  e.target.value = val;
  if (val.length === 10) manejarBusqueda(val);
});

document.getElementById("btnRonda").addEventListener("click", () => {
  document.getElementById("btnRonda").classList.add("active");
  document.getElementById("btnHistorial").classList.remove("active");
  document.getElementById("tableContainer").style.display = "block";
  document.getElementById("historyContainer").style.display = "none";

  const val = document.getElementById("searchID").value;
  if (val.length === 10) mostrarRonda(val);
});

document.getElementById("btnHistorial").addEventListener("click", () => {
  document.getElementById("btnHistorial").classList.add("active");
  document.getElementById("btnRonda").classList.remove("active");
  document.getElementById("tableContainer").style.display = "none";
  document.getElementById("historyContainer").style.display = "block";

  const val = document.getElementById("searchID").value;
  if (val.length === 10) mostrarHistorial(val);
});

cargarArchivoTournament();
