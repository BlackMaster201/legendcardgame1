document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("searchID");
  const tableContainer = document.getElementById("tableContainer");
  const historyContainer = document.getElementById("historyContainer");
  const rondaInfo = document.getElementById("rondaInfo");
  const btnRonda = document.getElementById("btnRonda");
  const btnHistorial = document.getElementById("btnHistorial");

  let currentRound = null;
  let matches = [];
  let players = [];
  let results = [];
  let finalized = false;

  // Detectar archivo .Tournament
  async function cargarArchivoTournament() {
    try {
      const res = await fetch("1.txt");
      const text = await res.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");

      const roundNode = xml.querySelector("CurrentRound");
      currentRound = roundNode ? parseInt(roundNode.textContent.trim()) : null;
      if (isNaN(currentRound)) currentRound = null;

      finalized = xml.querySelector("Finalized")?.textContent === "True";

      players = Array.from(xml.querySelectorAll("Player")).map(p => ({
        id: p.getAttribute("id"),
        name: p.getAttribute("name"),
        roundResults: Array.from(p.querySelectorAll("RoundResult")).map(r => ({
          round: parseInt(r.getAttribute("round")),
          result: r.getAttribute("result"),
          opponent: r.getAttribute("opponent")
        }))
      }));

      matches = Array.from(xml.querySelectorAll(`Round[number="${currentRound}"] > Match`)).map(m => ({
        table: m.getAttribute("table"),
        player1: m.getAttribute("player1"),
        player2: m.getAttribute("player2")
      }));

      rondaInfo.textContent = currentRound ? `Ronda: ${currentRound}` : "Ronda no encontrada";
    } catch (e) {
      rondaInfo.textContent = "No se encontró el archivo de torneo.";
    }
  }

  function mostrarDatosJugador(id) {
    const jugador = players.find(p => p.id === id);
    if (!jugador) return (tableContainer.innerHTML = "<p>No se encontró ese Konami ID.</p>");

    const match = matches.find(m => m.player1 === id || m.player2 === id);
    if (!match) return (tableContainer.innerHTML = "<p>No tienes duelo asignado para esta ronda.</p>");

    const adversarioID = match.player1 === id ? match.player2 : match.player1;
    const adversario = players.find(p => p.id === adversarioID);

    tableContainer.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;">
        <h2 style="font-size:32px;color:#D62828;">Mesa ${match.table}</h2>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
        <div class="card" style="border-top:4px solid #D62828;">
          <h3>${jugador.name}</h3>
          <p class="konami-id">${jugador.id}</p>
        </div>
        <div class="vs-label">VS</div>
        <div class="card" style="border-bottom:4px solid #007BFF;">
          <h3>${adversario?.name ?? "Desconocido"}</h3>
          <p class="konami-id">${adversarioID}</p>
        </div>
      </div>
    `;
  }

  function mostrarHistorial(id) {
    const jugador = players.find(p => p.id === id);
    if (!jugador) return (historyContainer.innerHTML = "<p>No se encontró ese Konami ID.</p>");

    const standing = players
      .map(p => ({
        id: p.id,
        name: p.name,
        wins: p.roundResults.filter(r => r.result === "win").length
      }))
      .sort((a, b) => b.wins - a.wins)
      .findIndex(p => p.id === id) + 1;

    const historialOrdenado = jugador.roundResults
      .filter(r => finalized || r.round < currentRound)
      .sort((a, b) => b.round - a.round);

    const historialHTML = historialOrdenado.map(r => {
      const oponente = players.find(p => p.id === r.opponent)?.name || "Desconocido";
      const color =
        r.result === "win" ? "result-win" :
        r.result === "loss" ? "result-loss" : "result-draw";
      const texto =
        r.result === "win" ? "Victoria" :
        r.result === "loss" ? "Derrota" : "Empate";

      return `
        <div class="card ${color}" style="text-align:center;">
          <strong>Ronda ${r.round} — ${texto}</strong><br/>
          VS ${oponente}
        </div>
      `;
    }).join("");

    const medal = standing === 1 ? "🥇" : standing === 2 ? "🥈" : standing === 3 ? "🥉" : "";

    historyContainer.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;">
        <h2>Standing actual: ${medal} ${standing}</h2>
      </div>
      ${historialHTML || "<p>No hay historial disponible.</p>"}
    `;
  }

  btnRonda.addEventListener("click", () => {
    tableContainer.style.display = "block";
    historyContainer.style.display = "none";
    btnRonda.classList.add("active");
    btnHistorial.classList.remove("active");
    const id = searchInput.value;
    if (id.length === 10) mostrarDatosJugador(id);
  });

  btnHistorial.addEventListener("click", () => {
    tableContainer.style.display = "none";
    historyContainer.style.display = "block";
    btnHistorial.classList.add("active");
    btnRonda.classList.remove("active");
    const id = searchInput.value;
    if (id.length === 10) mostrarHistorial(id);
  });

  searchInput.addEventListener("input", () => {
    const val = searchInput.value.replace(/\D/g, "").slice(0, 10);
    searchInput.value = val;
    localStorage.setItem("lastKonamiID", val);
    if (val.length === 10) {
      if (btnHistorial.classList.contains("active")) {
        mostrarHistorial(val);
      } else {
        mostrarDatosJugador(val);
      }
    } else {
      tableContainer.innerHTML = "";
      historyContainer.innerHTML = "";
    }
  });

  const savedID = localStorage.getItem("lastKonamiID");
  if (savedID) {
    searchInput.value = savedID;
  }

  await cargarArchivoTournament();
  if (savedID?.length === 10) {
    mostrarDatosJugador(savedID);
  }
});
