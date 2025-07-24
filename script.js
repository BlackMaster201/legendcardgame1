let jugadores = {};
let partidas = [];
let rondaActual = 0;

function obtenerNombreCompleto(id) {
  const jugador = jugadores[id];
  return jugador ? jugador.nombre : "Desconocido";
}

function cargarDatos(xml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  rondaActual = parseInt(doc.querySelector("CurrentRound")?.textContent || "0");
  document.getElementById("rondaInfo").innerText = "Ronda: " + rondaActual;

  jugadores = {};
  doc.querySelectorAll("TournPlayer").forEach(tp => {
    const id = tp.querySelector("Player > ID")?.textContent;
    const nombre = `${tp.querySelector("Player > FirstName")?.textContent || ""} ${tp.querySelector("Player > LastName")?.textContent || ""}`.trim();
    const rank = tp.querySelector("Rank")?.textContent || "0";
    jugadores[id] = { id, nombre, rank };
  });

  partidas = [];
  doc.querySelectorAll("TournMatch").forEach(match => {
    partidas.push({
      r: parseInt(match.querySelector("Round")?.textContent),
      p1: match.querySelectorAll("Player")[0]?.textContent,
      p2: match.querySelectorAll("Player")[1]?.textContent,
      mesa: match.querySelector("Table")?.textContent,
      ganador: match.querySelector("Winner")?.textContent,
      status: match.querySelector("Status")?.textContent
    });
  });

  const savedID = localStorage.getItem("lastKonamiID");
  if (savedID) {
    document.getElementById("searchID").value = savedID;
    buscarJugador(savedID);
  }
}

function buscarJugador(id) {
  if (!/^\d{10}$/.test(id)) {
    document.getElementById("tableContainer").innerHTML = "";
    document.getElementById("historialTab").innerHTML = "";
    return;
  }

  localStorage.setItem("lastKonamiID", id);
  mostrarRondaActual(id);
  mostrarHistorial(id);
}

function mostrarRondaActual(id) {
  const actual = partidas.find(p => p.r === rondaActual && (p.p1 === id || p.p2 === id));

  if (!actual) {
    document.getElementById("tableContainer").innerHTML = "<p>No tienes partida esta ronda.</p>";
    return;
  }

  const soyP1 = actual.p1 === id;
  const rival = soyP1 ? actual.p2 : actual.p1;

  const nombre = jugadores[id]?.nombre || "Jugador";
  const nombreRival = obtenerNombreCompleto(rival);
  const idRival = rival || "";

  document.getElementById("tableContainer").innerHTML = `
    <div style="text-align:center; margin-bottom: 20px;">
      <h2 style="font-size: 32px; color: #D62828;">Mesa ${actual.mesa}</h2>
    </div>

    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <div style="border-top: 6px solid #D62828; border-radius:10px; padding:10px 15px 10px; width:100%; max-width:400px; background:#1E1E1E;">
        <p style="margin:0 0 4px; font-weight: bold; font-size: 16px; color: #fff;">${nombre}</p>
        <p style="margin:0; font-size: 14px; color: #aaa;">${id}</p>
      </div>

      <div style="text-align:center; font-size: 20px; font-weight:bold; color: #D3D3D3;">VS</div>

      <div style="border-bottom: 6px solid #2A9DF4; border-radius:10px; padding:10px 15px 10px; width:100%; max-width:400px; background:#1E1E1E;">
        <p style="margin:0 0 4px; font-weight: bold; font-size: 16px; color: #fff;">${nombreRival}</p>
        <p style="margin:0; font-size: 14px; color: #aaa;">${idRival}</p>
      </div>
    </div>
  `;
}

function mostrarHistorial(id) {
  const historial = partidas
    .filter(p => p.r < rondaActual && (p.p1 === id || p.p2 === id))
    .sort((a, b) => b.r - a.r);

  if (!jugadores[id]) {
    document.getElementById("historialTab").innerHTML = "<p>Jugador no encontrado.</p>";
    return;
  }

  const rank = jugadores[id].rank || "?";

  const filas = historial.map(p => {
    const soyP1 = p.p1 === id;
    const rivalID = soyP1 ? p.p2 : p.p1;
    const nombreRival = obtenerNombreCompleto(rivalID);
    const resultado =
      p.status === "Draw" ? "Empate" :
      p.winner === id ? "Victoria" : "Derrota";

    const color = resultado === "Victoria" ? "limegreen" : resultado === "Derrota" ? "tomato" : "gray";

    return `<tr>
      <td style="padding: 6px; border-bottom: 1px solid #444;">Ronda ${p.r}</td>
      <td style="padding: 6px; border-bottom: 1px solid #444;">${nombreRival}</td>
      <td style="padding: 6px; border-bottom: 1px solid #444; color: ${color}; font-weight: bold;">${resultado}</td>
    </tr>`;
  }).join("");

  document.getElementById("historialTab").innerHTML = `
    <div style="text-align:center; margin-bottom: 10px;">
      <h2 style="font-size: 20px; color: #fff;">Standing: #${rank}</h2>
    </div>
    <table style="width:100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr style="color: #aaa; border-bottom: 2px solid #888;">
          <th style="padding: 6px; text-align: left;">Ronda</th>
          <th style="padding: 6px; text-align: left;">Oponente</th>
          <th style="padding: 6px; text-align: left;">Resultado</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

document.getElementById("searchID").addEventListener("input", function () {
  const id = this.value.replace(/\D/g, "").slice(0, 10);
  this.value = id;
  if (id.length === 10) buscarJugador(id);
});

fetch("./Torneo.Tournament")
  .then(res => res.ok ? res.text() : Promise.reject("Archivo .Tournament no encontrado"))
  .then(cargarDatos)
  .catch(() => {
    document.getElementById("rondaInfo").innerText = "Archivo .Tournament no encontrado.";
  });
