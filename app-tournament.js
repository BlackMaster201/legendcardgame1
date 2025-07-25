let tournamentData = null;
let currentRound = null;
let torneoFinalizado = false;

function padId(id) {
  return String(id).padStart(10, '0');
}

function obtenerNombrePorId(id) {
  const jugadores = tournamentData.querySelectorAll('TournPlayer');
  for (let jugador of jugadores) {
    const idJugador = padId(jugador.querySelector('ID')?.textContent || "");
    if (idJugador === id) {
      const nombre = jugador.querySelector('FirstName')?.textContent || "";
      const apellido = jugador.querySelector('LastName')?.textContent || "";
      return `${nombre} ${apellido}`;
    }
  }
  return "Desconocido";
}

function obtenerMesaYAdversario(id) {
  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  for (let match of matches) {
    const ronda = parseInt(match.querySelector('Round')?.textContent || "0", 10);
    if (ronda !== currentRound) continue;
    const p1 = padId(match.querySelectorAll('Player')[0]?.textContent || "");
    const p2 = padId(match.querySelectorAll('Player')[1]?.textContent || "");
    if (id === p1 || id === p2) {
      const mesa = match.querySelector('Table')?.textContent || "—";
      const rivalId = id === p1 ? p2 : p1;
      return { mesa, rivalId };
    }
  }
  return null;
}

function mostrarRonda(id) {
  const resultadosDiv = document.getElementById('resultados');
  const info = obtenerMesaYAdversario(id);
  if (!info) {
    resultadosDiv.innerHTML = '<p>No se encontró este Konami ID en esta ronda.</p>';
    return;
  }

  const nombre = obtenerNombrePorId(id);
  const rivalNombre = obtenerNombrePorId(info.rivalId);

  resultadosDiv.innerHTML = `
    <div class="mesa">Mesa ${info.mesa}</div>
    <div class="card card-top">
      <div class="nombre">${nombre}</div>
      <div class="konami-id">${id}</div>
    </div>
    <div class="vs">VS</div>
    <div class="card card-bottom">
      <div class="nombre">${rivalNombre}</div>
      <div class="konami-id">${info.rivalId}</div>
    </div>
  `;
}

function mostrarHistorial(id) {
  const historialDiv = document.getElementById('historial');
  historialDiv.innerHTML = "";

  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const historial = [];

  matches.forEach(match => {
    const p1 = padId(match.querySelectorAll('Player')[0]?.textContent || "");
    const p2 = padId(match.querySelectorAll('Player')[1]?.textContent || "");
    const ronda = parseInt(match.querySelector('Round')?.textContent || "0", 10);
    const ganador = padId(match.querySelector('Winner')?.textContent || "");
    if (id === p1 || id === p2) {
      if (!torneoFinalizado && ronda === currentRound) return;
      const rivalId = id === p1 ? p2 : p1;
      const resultado = ganador === id ? "Victoria" : ganador === rivalId ? "Derrota" : "Empate";
      historial.push({ ronda, rivalId, resultado });
    }
  });

  const standings = Array.from(tournamentData.querySelectorAll('TournStanding'));
  const standing = standings.find(s => padId(s.querySelector('ID')?.textContent || "") === id);
  const posicion = standing ? parseInt(standing.querySelector('Rank')?.textContent || "0", 10) : null;

  let posLabel = posicion != null
    ? posicion === 1 ? "🥇 1"
    : posicion === 2 ? "🥈 2"
    : posicion === 3 ? "🥉 3"
    : `${posicion}`
    : "—";

  historialDiv.innerHTML = `<h2 style="text-align:center;">Standing: ${posLabel}</h2>`;

  historial.sort((a, b) => b.ronda - a.ronda);
  historial.forEach(entry => {
    const nombre = obtenerNombrePorId(entry.rivalId);
    const colorClass = entry.resultado === "Victoria"
      ? "result-win"
      : entry.resultado === "Derrota"
      ? "result-loss"
      : "result-draw";

    const div = document.createElement('div');
    div.className = `historial-entry ${colorClass}`;
    div.innerHTML = `
      <h3>Ronda ${entry.ronda} - ${entry.resultado}</h3>
      <p>VS ${nombre}</p>
    `;
    historialDiv.appendChild(div);
  });
}

function buscarEmparejamientos() {
  const input = document.getElementById('konamiId');
  const id = padId(input.value.trim());
  if (!id) return;
  localStorage.setItem('konamiId', id);
  mostrarRonda(id);
  mostrarHistorial(id);
}

fetch("1.txt")
  .then(res => res.text())
  .then(text => {
    const parser = new DOMParser();
    tournamentData = parser.parseFromString(text, "text/xml");
    currentRound = parseInt(tournamentData.querySelector("CurrentRound")?.textContent || "0", 10);
    torneoFinalizado = tournamentData.querySelector("Finalized")?.textContent === "True";
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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnRonda").addEventListener("click", () => {
    document.getElementById("btnRonda").classList.add("active");
    document.getElementById("btnHistorial").classList.remove("active");
    document.getElementById("resultados").style.display = "block";
    document.getElementById("historial").style.display = "none";
  });

  document.getElementById("btnHistorial").addEventListener("click", () => {
    document.getElementById("btnRonda").classList.remove("active");
    document.getElementById("btnHistorial").classList.add("active");
    document.getElementById("resultados").style.display = "none";
    document.getElementById("historial").style.display = "block";
  });
});
