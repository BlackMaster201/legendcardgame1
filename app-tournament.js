async function loadTournamentFile() {
  const files = ['Torneo.Tournament', 'torneo.Tournament'];
  for (const file of files) {
    try {
      const res = await fetch(file);
      if (res.ok) {
        const text = await res.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'application/xml');
        return xmlDoc;
      }
    } catch (e) {}
  }
  document.getElementById("rondaInfo").innerText = "Archivo .Tournament no encontrado.";
  return null;
}

function parsePlayers(xml) {
  const players = {};
  xml.querySelectorAll("TournPlayer").forEach(p => {
    const id = p.querySelector("ID")?.textContent;
    const fullName = `${p.querySelector("FirstName")?.textContent} ${p.querySelector("LastName")?.textContent}`;
    const rank = parseInt(p.querySelector("Rank")?.textContent || "0");
    players[id] = { name: fullName.trim(), id, rank };
  });
  return players;
}

function parseMatches(xml) {
  const matches = [];
  xml.querySelectorAll("TournMatch").forEach(m => {
    const p1 = m.querySelectorAll("Player")[0]?.textContent;
    const p2 = m.querySelectorAll("Player")[1]?.textContent;
    const table = m.querySelector("Table")?.textContent;
    const round = parseInt(m.querySelector("Round")?.textContent || "0");
    const winner = m.querySelector("Winner")?.textContent;
    matches.push({ round, table, p1, p2, winner });
  });
  return matches;
}

function getCurrentRound(xml) {
  return parseInt(xml.querySelector("CurrentRound")?.textContent || "0");
}

function filterByID(id, players, matches, currentRound) {
  const currentMatch = matches.find(
    m => m.round === currentRound && (m.p1 === id || m.p2 === id)
  );

  const container = document.getElementById("tableContainer");
  const historyContainer = document.getElementById("historyContainer");
  container.innerHTML = "";
  historyContainer.innerHTML = "";

  if (!currentMatch) {
    container.innerHTML = "<p>No estás asignado en esta ronda.</p>";
    return;
  }

  const rivalID = currentMatch.p1 === id ? currentMatch.p2 : currentMatch.p1;
  const mi = players[id];
  const rival = players[rivalID];

  // Mostrar mesa actual
  container.innerHTML = `
    <div style="text-align:center; margin-bottom: 20px;">
      <h2 style="font-size: 32px; color: #D62828;">Mesa ${currentMatch.table}</h2>
    </div>
    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <div style="background:#1E1E1E; border-radius:10px; padding:10px 15px 15px; width:100%; max-width:400px; text-align:center; border-top: 5px solid #D62828;">
        <p style="margin:4px 0; font-weight:bold; color:#FFFFFF; font-size: 18px;">${mi.name}</p>
        <p style="margin:4px 0; font-size:14px; color:#CCCCCC;">${mi.id}</p>
      </div>

      <div style="text-align:center; font-size: 20px; font-weight:bold; color: #D3D3D3;">VS</div>

      <div style="background:#1E1E1E; border-radius:10px; padding:10px 15px 15px; width:100%; max-width:400px; text-align:center; border-bottom: 5px solid #0033cc;">
        <p style="margin:4px 0; font-weight:bold; color:#FFFFFF; font-size: 18px;">${rival.name}</p>
        <p style="margin:4px 0; font-size:14px; color:#CCCCCC;">${rival.id}</p>
      </div>
    </div>
  `;

  // Historial ordenado de ronda más reciente a más antigua
  const history = matches
    .filter(m => m.p1 === id || m.p2 === id)
    .filter(m => m.round < currentRound)
    .sort((a, b) => b.round - a.round);

  if (history.length > 0) {
    const standing = players[id]?.rank ? `Lugar actual: ${players[id].rank}` : "";
    historyContainer.innerHTML = `<h3 style="color:#fff; text-align:center;">${standing}</h3><br>`;
  }

  history.forEach(m => {
    const esGanador = m.winner === id;
    const esEmpate = m.winner === "0";
    const rivalId = m.p1 === id ? m.p2 : m.p1;
    const rivalName = players[rivalId]?.name || "Desconocido";
    const color = esEmpate ? "#ccc" : esGanador ? "#4CAF50" : "#D62828";
    const resultado = esEmpate ? "Empate" : esGanador ? "Victoria" : "Derrota";

    historyContainer.innerHTML += `
      <div style="border: 2px solid ${color}; border-radius: 10px; padding: 10px; margin: 10px 0;">
        <strong style="color:${color};">${resultado}</strong><br>
        <span style="color:#fff;">vs. ${rivalName}</span><br>
        <span style="color:#999;">Ronda ${m.round}</span>
      </div>
    `;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const xml = await loadTournamentFile();
  if (!xml) return;

  const currentRound = getCurrentRound(xml);
  const players = parsePlayers(xml);
  const matches = parseMatches(xml);
  document.getElementById("rondaInfo").innerText = "Ronda actual: " + currentRound;

  const saved = localStorage.getItem("lastKonamiID");
  const input = document.getElementById("searchID");

  function handleInput(id) {
    if (/^\d{10}$/.test(id)) {
      localStorage.setItem("lastKonamiID", id);
      filterByID(id, players, matches, currentRound);
    } else {
      document.getElementById("tableContainer").innerHTML = "";
      document.getElementById("historyContainer").innerHTML = "";
    }
  }

  if (saved) {
    input.value = saved;
    handleInput(saved);
  }

  input.addEventListener("input", e => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    input.value = value;
    handleInput(value);
  });

  // Tab switching
  document.getElementById("btnRonda").addEventListener("click", () => {
    document.getElementById("tableContainer").style.display = "block";
    document.getElementById("historyContainer").style.display = "none";
  });
  document.getElementById("btnHistorial").addEventListener("click", () => {
    document.getElementById("tableContainer").style.display = "none";
    document.getElementById("historyContainer").style.display = "block";
  });
});
