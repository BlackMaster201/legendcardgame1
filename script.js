let jugadores = {};
let partidas = [];
let rondaActual = 0;

function mostrarTab(tab) {
  const botones = document.querySelectorAll(".tab-button");
  botones.forEach(b => b.classList.remove("active"));
  document.getElementById("tableContainer").innerHTML = "";

  if (tab === "actual") {
    botones[0].classList.add("active");
    const saved = localStorage.getItem("lastKonamiID");
    if (saved) buscarJugador(saved);
  } else {
    botones[1].classList.add("active");
    const saved = localStorage.getItem("lastKonamiID");
    if (saved) mostrarHistorial(saved);
  }
}

function cargarDatos() {
  fetch("./Torneo.Tournament")
    .then(res => res.text())
    .then(xmlStr => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlStr, "text/xml");

      rondaActual = parseInt(xml.querySelector("CurrentRound").textContent);
      document.getElementById("rondaInfo").innerText = "Ronda: " + rondaActual;

      xml.querySelectorAll("TournPlayer").forEach(tp => {
        const id = tp.querySelector("Player > ID").textContent;
        const nombre = tp.querySelector("Player > FirstName").textContent + " " + tp.querySelector("Player > LastName").textContent;
        const rank = tp.querySelector("Rank").textContent;
        jugadores[id] = { nombre, rank };
      });

      xml.querySelectorAll("TournMatch").forEach(m => {
        const ronda = parseInt(m.querySelector("Round").textContent);
        const p1 = m.getElementsByTagName("Player")[0].textContent;
        const p2 = m.getElementsByTagName("Player")[1].textContent;
        const mesa = m.querySelector("Table").textContent;
        const ganador = m.querySelector("Winner").textContent;
        partidas.push({ ronda, p1, p2, mesa, ganador });
      });

      const saved = localStorage.getItem("lastKonamiID");
      if (saved) {
        document.getElementById("searchID").value = saved;
        buscarJugador(saved);
      }
    })
    .catch(() => {
      document.getElementById("rondaInfo").innerText = "Archivo .Tournament no encontrado.";
    });
}

function buscarJugador(id) {
  if (!/^\d{10}$/.test(id)) return;

  localStorage.setItem("lastKonamiID", id);

  const partida = partidas.find(p => p.ronda === rondaActual && (p.p1 === id || p.p2 === id));
  if (!partida) {
    document.getElementById("tableContainer").innerHTML = "<p>No estás emparejado en esta ronda.</p>";
    return;
  }

  const esP1 = partida.p1 === id;
  const yo = jugadores[esP1 ? partida.p1 : partida.p2];
  const rival = jugadores[esP1 ? partida.p2 : partida.p1];

  document.getElementById("tableContainer").innerHTML = `
    <div style="text-align:center; margin-bottom: 20px;">
      <h2 style="font-size: 32px; color: #D62828;">Mesa ${partida.mesa}</h2>
    </div>
    <div class="player-box red">
      <div class="name">${yo.nombre}</div>
      <div class="id">${esP1 ? partida.p1 : partida.p2}</div>
    </div>
    <div style="text-align:center; font-size: 20px; font-weight:bold; color: #D3D3D3;">VS</div>
    <div class="player-box blue">
      <div class="name">${rival.nombre}</div>
      <div class="id">${esP1 ? partida.p2 : partida.p1}</div>
    </div>
  `;
}

function mostrarHistorial(id) {
  const container = document.getElementById("tableContainer");
  const jugador = jugadores[id];
  if (!jugador) {
    container.innerHTML = "<p>Konami ID no encontrado.</p>";
    return;
  }

  const historial = partidas
    .filter(p => (p.p1 === id || p.p2 === id) && p.ronda < rondaActual)
    .sort((a, b) => b.ronda - a.ronda);

  const bloques = historial.map(p => {
    const esP1 = p.p1 === id;
    const rivalID = esP1 ? p.p2 : p.p1;
    const rival = jugadores[rivalID]?.nombre || "Desconocido";

    let clase = "historial-empate";
    if (p.ganador === id) clase = "historial-victoria";
    else if (p.ganador !== "0" && p.ganador !== id) clase = "historial-derrota";

    return `
      <div class="historial-item ${clase}">
        <strong>Ronda ${p.ronda}</strong><br />
        Contra: ${rival}
      </div>
    `;
  });

  container.innerHTML = `
    <div style="text-align:center; margin-bottom: 10px;">
      <h3>Posición actual: #${jugador.rank}</h3>
    </div>
    ${bloques.join("") || "<p>No hay historial disponible.</p>"}
  `;
}

document.getElementById("searchID").addEventListener("input", function () {
  const val = this.value.replace(/\D/g, "").slice(0, 10);
  this.value = val;
  if (val.length === 10) {
    const tab = document.querySelector(".tab-button.active").textContent;
    if (tab === "Ronda Actual") buscarJugador(val);
    else mostrarHistorial(val);
  } else {
    document.getElementById("tableContainer").innerHTML = "";
  }
});

window.addEventListener("load", cargarDatos);
