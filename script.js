let jugadores = [];
let emparejamientos = [];
let rondaActual = 0;
let torneoFinalizado = false;

function parseXML(xmlText) {
  const parser = new DOMParser();
  return parser.parseFromString(xmlText, "text/xml");
}

function getJugador(id) {
  const jugador = jugadores.find(j => j.id === id);
  if (!jugador) return { nombre: "Desconocido", id };
  return jugador;
}

function mostrarMensaje(texto) {
  document.getElementById("tableContainer").innerHTML = `<p style="text-align:center">${texto}</p>`;
}

function mostrarDatosJugador(id) {
  const emparejamiento = emparejamientos.find(e => e.ronda === rondaActual && (e.j1 === id || e.j2 === id));
  if (!emparejamiento) {
    mostrarMensaje("No se encontró tu emparejamiento para esta ronda.");
    return;
  }

  const soyJugador1 = emparejamiento.j1 === id;
  const yo = getJugador(soyJugador1 ? emparejamiento.j1 : emparejamiento.j2);
  const rival = getJugador(soyJugador1 ? emparejamiento.j2 : emparejamiento.j1);

  const miCarta = `
    <div class="card" style="border-top: 4px solid #D62828;">
      <h3 class="nombre">${yo.nombre}</h3>
      <p class="konami-id">${yo.id}</p>
    </div>`;

  const cartaRival = `
    <div class="card" style="border-bottom: 4px solid #007BFF;">
      <h3 class="nombre">${rival.nombre}</h3>
      <p class="konami-id">${rival.id}</p>
    </div>`;

  document.getElementById("tableContainer").innerHTML = `
    <div style="text-align:center; margin-bottom: 20px;">
      <h2 style="font-size: 32px; color: #D62828;">Mesa ${emparejamiento.mesa}</h2>
    </div>
    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      ${miCarta}
      <div class="vs-label">VS</div>
      ${cartaRival}
    </div>`;
}

function mostrarHistorial(id) {
  const historial = emparejamientos
    .filter(e => e.j1 === id || e.j2 === id)
    .filter(e => torneoFinalizado || e.ronda !== rondaActual)
    .sort((a, b) => b.ronda - a.ronda);

  const jugador = getJugador(id);
  const contenedor = document.getElementById("historyContainer");

  if (!historial.length) {
    contenedor.innerHTML = "<p style='text-align:center'>No hay historial disponible.</p>";
    return;
  }

  const partes = historial.map(e => {
    const soyJugador1 = e.j1 === id;
    const rival = getJugador(soyJugador1 ? e.j2 : e.j1);
    const gané = e.ganador === id;
    const empate = e.ganador === "0";
    const resultado = empate ? "Empate" : gané ? "Victoria" : "Derrota";
    const claseResultado = empate ? "result-draw" : gané ? "result-win" : "result-loss";
    const colorBarra = gané ? "#4CAF50" : empate ? "#B0BEC5" : "#F44336";

    return `
      <div class="historial-item">
        <div class="color-bar" style="background-color: ${colorBarra};"></div>
        <div class="contenido">
          <div class="${claseResultado}">Ronda ${e.ronda} - ${resultado}</div>
          <div class="rival">VS ${rival.nombre}</div>
        </div>
      </div>`;
  });

  const ranking = jugador.rank;
  let medalla = "";
  if (ranking === 1) medalla = "🥇 ";
  else if (ranking === 2) medalla = "🥈 ";
  else if (ranking === 3) medalla = "🥉 ";

  contenedor.innerHTML = `
    <h2 style="text-align:center; color:#D62828;">Standing: ${medalla}${ranking}</h2>
    ${partes.join("")}`;
}

function cambiarPestana(activa) {
  const btnRonda = document.getElementById("btnRonda");
  const btnHistorial = document.getElementById("btnHistorial");
  const ronda = document.getElementById("tableContainer");
  const historial = document.getElementById("historyContainer");

  if (activa === "ronda") {
    btnRonda.classList.add("active");
    btnHistorial.classList.remove("active");
    ronda.style.display = "block";
    historial.style.display = "none";
  } else {
    btnRonda.classList.remove("active");
    btnHistorial.classList.add("active");
    ronda.style.display = "none";
    historial.style.display = "block";
  }
}

function cargarArchivo() {
  fetch("1.txt")
    .then(res => res.text())
    .then(txt => {
      const xml = parseXML(txt);
      rondaActual = parseInt(xml.querySelector("CurrentRound").textContent);
      torneoFinalizado = xml.querySelector("Finalized").textContent === "True";

      document.getElementById("rondaInfo").textContent = "Ronda: " + rondaActual;

      jugadores = Array.from(xml.querySelectorAll("TournPlayer")).map(tp => {
        const p = tp.querySelector("Player");
        return {
          id: p.querySelector("ID").textContent,
          nombre: `${p.querySelector("FirstName").textContent} ${p.querySelector("LastName").textContent}`.trim(),
          rank: parseInt(tp.querySelector("Rank").textContent)
        };
      });

      emparejamientos = Array.from(xml.querySelectorAll("TournMatch")).map(m => ({
        j1: m.querySelectorAll("Player")[0].textContent,
        j2: m.querySelectorAll("Player")[1].textContent,
        ronda: parseInt(m.querySelector("Round").textContent),
        ganador: m.querySelector("Winner").textContent,
        mesa: m.querySelector("Table").textContent
      }));

      const idGuardado = localStorage.getItem("lastKonamiID");
      if (idGuardado && /^\d{10}$/.test(idGuardado)) {
        document.getElementById("searchID").value = idGuardado;
        mostrarDatosJugador(idGuardado);
        mostrarHistorial(idGuardado);
      }
    })
    .catch(() => {
      document.getElementById("rondaInfo").textContent = "Archivo 1.txt no encontrado.";
    });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchID").addEventListener("input", e => {
    const id = e.target.value.replace(/\D/g, "").slice(0, 10);
    e.target.value = id;

    if (id.length === 10) {
      localStorage.setItem("lastKonamiID", id);
      mostrarDatosJugador(id);
      mostrarHistorial(id);
    } else {
      document.getElementById("tableContainer").innerHTML = "";
      document.getElementById("historyContainer").innerHTML = "";
    }
  });

  document.getElementById("btnRonda").addEventListener("click", () => cambiarPestana("ronda"));
  document.getElementById("btnHistorial").addEventListener("click", () => cambiarPestana("historial"));

  cargarArchivo();
});
