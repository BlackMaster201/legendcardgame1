let jugadores = {};
let partidas = [];
let rondaActual = 0;

async function cargarDatos() {
  try {
    const archivos = ["Torneo.Tournament"];
    let archivoValido = null;

    for (let nombre of archivos) {
      try {
        const res = await fetch(nombre);
        if (res.ok) {
          archivoValido = nombre;
          const xml = await res.text();
          procesarXML(xml);
          break;
        }
      } catch (e) {}
    }

    if (!archivoValido) {
      document.getElementById("rondaInfo").innerText = "Archivo .Tournament no encontrado.";
    }
  } catch (error) {
    console.error("Error cargando el archivo:", error);
  }
}

function obtenerNombreCompleto(id) {
  const jugador = jugadores[id];
  return jugador ? jugador.name : "Desconocido";
}

function procesarXML(xmlString) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlString, "application/xml");

  const ronda = xml.querySelector("CurrentRound");
  rondaActual = ronda ? parseInt(ronda.textContent) : 0;
  document.getElementById("rondaInfo").innerText = "Ronda: " + rondaActual;

  const playerNodes = xml.querySelectorAll("TournPlayer");
  jugadores = {};
  playerNodes.forEach(p => {
    const id = p.querySelector("Player > ID")?.textContent || "";
    const nombre = `${p.querySelector("Player > FirstName")?.textContent || ""} ${p.querySelector("Player > LastName")?.textContent || ""}`.trim();
    const rank = p.querySelector("Rank")?.textContent || "";
    jugadores[id] = { name: nombre, rank };
  });

  const matchNodes = xml.querySelectorAll("TournMatch");
  partidas = Array.from(matchNodes).map(m => ({
    p1: m.querySelectorAll("Player")[0]?.textContent || "",
    p2: m.querySelectorAll("Player")[1]?.textContent || "",
    r: parseInt(m.querySelector("Round")?.textContent || 0),
    mesa: m.querySelector("Table")?.textContent || "",
    winner: m.querySelector("Winner")?.textContent || "0",
    status: m.querySelector("Status")?.textContent || ""
  }));

  const saved = localStorage.getItem("lastKonamiID");
  if (saved && /^[0-9]{10}$/.test(saved)) {
    document.getElementById("searchID").value = saved;
    mostrarDatos(saved);
  }
}

function mostrarDatos(id) {
  const partida = partidas.find(p =>
    p.r === rondaActual && (p.p1 === id || p.p2 === id)
  );

  if (!partida) {
    document.getElementById("datosTab").innerHTML = "<p>No se encontró tu partida actual.</p>";
    return;
  }

  const soyP1 = partida.p1 === id;
  const miID = soyP1 ? partida.p1 : partida.p2;
  const rivalID = soyP1 ? partida.p2 : partida.p1;
  const miNombre = obtenerNombreCompleto(miID);
  const rivalNombre = obtenerNombreCompleto(rivalID);

  document.getElementById("datosTab").innerHTML = `
    <div style="text-align:center; margin-bottom: 20px;">
      <h2 style="font-size: 28px; color: #D62828;">Mesa ${partida.mesa}</h2>
    </div>
    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <div style="position: relative; width: 100%; max-width: 400px; padding: 12px; background: #1E1E1E; border-radius: 10px;">
        <div style="position: absolute; top: 0; left: 0; height: 5px; width: 100%; background-color: red; border-top-left-radius: 10px; border-top-right-radius: 10px;"></div>
        <div style="color: #fff; text-align: center;">
          <p style="margin: 0; font-weight: bold;">${miNombre}</p>
          <p style="margin: 0; font-size: 14px; color: #bbb;">${miID}</p>
        </div>
      </div>

      <div style="text-align:center; font-size: 18px; font-weight:bold; color: #D3D3D3;">VS</div>

      <div style="position: relative; width: 100%; max-width: 400px; padding: 12px; background: #1E1E1E; border-radius: 10px;">
        <div style="position: absolute; bottom: 0; left: 0; height: 5px; width: 100%; background-color: blue; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;"></div>
        <div style="color: #fff; text-align: center;">
          <p style="margin: 0; font-weight: bold;">${rivalNombre}</p>
          <p style="margin: 0; font-size: 14px; color: #bbb;">${rivalID}</p>
        </div>
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

    const resultado = p.status === "Draw" || p.winner === "0"
      ? "Empate"
      : p.winner === id
        ? "Victoria"
        : "Derrota";

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
  localStorage.setItem("lastKonamiID", id);
  if (id.length === 10) {
    mostrarDatos(id);
    mostrarHistorial(id);
  } else {
    document.getElementById("datosTab").innerHTML = "";
    document.getElementById("historialTab").innerHTML = "";
  }
});

cargarDatos();
