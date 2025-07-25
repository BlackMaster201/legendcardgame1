document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("searchID");
  const rondaInfo = document.getElementById("rondaInfo");
  const tableContainer = document.getElementById("tableContainer");
  const historyContainer = document.getElementById("historyContainer");
  const btnRonda = document.getElementById("btnRonda");
  const btnHistorial = document.getElementById("btnHistorial");

  let torneoData = null;
  let currentRound = null;

  // Utilidades
  function extractNameAndID(str) {
    const match = str.match(/(.+)\s+\((\d{10})\)/);
    return match ? { name: match[1].trim(), id: match[2] } : { name: "", id: "" };
  }

  function setRondaInfoText(num) {
    rondaInfo.textContent = `Ronda: ${num}`;
  }

  function parseStanding(xml) {
    const standing = [];
    const entries = xml.querySelectorAll("Standing Entry");
    entries.forEach((entry, index) => {
      const id = entry.getAttribute("id");
      const name = entry.getAttribute("name");
      standing.push({
        id,
        name,
        position: index + 1,
        record: entry.getAttribute("record")
      });
    });
    return standing;
  }

  function parseMatches(xml, currentRound) {
    const matches = [];
    const matchNodes = xml.querySelectorAll(`Match[round="${currentRound}"]`);
    matchNodes.forEach(match => {
      const p1 = extractNameAndID(match.getAttribute("player1"));
      const p2 = extractNameAndID(match.getAttribute("player2"));
      const result = match.getAttribute("result");
      matches.push({ p1, p2, result });
    });
    return matches;
  }

  function displayMatch(id) {
    const matches = torneoData.matches;
    const match = matches.find(
      m => m.p1.id === id || m.p2.id === id
    );

    if (!match) {
      tableContainer.innerHTML = `<p>No se encontró ese Konami ID.</p>`;
      return;
    }

    const isPlayer1 = match.p1.id === id;
    const mi = isPlayer1 ? match.p1 : match.p2;
    const rival = isPlayer1 ? match.p2 : match.p1;

    tableContainer.innerHTML = `
      <div style="text-align:center; margin-bottom: 20px;">
        <h2 style="font-size: 32px; color: #D62828;">Ronda ${currentRound}</h2>
      </div>
      <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
        <div class="card">
          <h3>${mi.name}</h3>
          <p class="konami-id">${mi.id}</p>
        </div>
        <div class="vs-label">VS</div>
        <div class="card">
          <h3>${rival.name}</h3>
          <p class="konami-id">${rival.id}</p>
        </div>
      </div>
    `;
  }

  function displayHistory(id) {
    const history = torneoData.history.filter(h => h.id === id);
    if (!history.length) {
      historyContainer.innerHTML = `<p>No se encontró historial para este Konami ID.</p>`;
      return;
    }

    const standing = torneoData.standing.find(s => s.id === id);
    let standingText = standing ? `Standing: ${standing.position}` : "";

    if (standing && standing.position <= 3) {
      const medals = ["🥇", "🥈", "🥉"];
      standingText = `${medals[standing.position - 1]} Standing: ${standing.position}`;
    }

    const historyHTML = history.map(match => {
      const resultClass =
        match.result === "WIN" ? "result-win" :
        match.result === "LOSS" ? "result-loss" : "result-draw";

      return `
        <div class="card ${resultClass}">
          <h3>${match.result}</h3>
          <p class="konami-id">Ronda ${match.round}</p>
          <strong>${match.vs}</strong>
        </div>
      `;
    }).join("");

    historyContainer.innerHTML = `
      <div style="text-align:center; margin-bottom: 10px;">
        <h2 style="font-size: 20px; color: #D3D3D3;">${standingText}</h2>
      </div>
      ${historyHTML}
    `;
  }

  // Cargar y procesar archivo
  async function cargarTorneo() {
    try {
      const response = await fetch("1.txt");
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");

      const finalized = xml.querySelector("Finalized")?.textContent === "True";
      currentRound = parseInt(xml.querySelector("CurrentRound")?.textContent);
      if (isNaN(currentRound)) currentRound = -1;

      const standing = parseStanding(xml);
      const matches = parseMatches(xml, currentRound);

      const history = [];
      const allMatches = xml.querySelectorAll("Match");
      allMatches.forEach(match => {
        const r = parseInt(match.getAttribute("round"));
        const result = match.getAttribute("result");
        const p1 = extractNameAndID(match.getAttribute("player1"));
        const p2 = extractNameAndID(match.getAttribute("player2"));

        if (["WIN", "LOSS", "DRAW"].includes(result)) {
          history.push({ id: p1.id, round: r, result, vs: `VS ${p2.name}` });
          const invResult = result === "WIN" ? "LOSS" : result === "LOSS" ? "WIN" : "DRAW";
          history.push({ id: p2.id, round: r, result: invResult, vs: `VS ${p1.name}` });
        }
      });

      torneoData = { matches, history, standing };
      const savedID = localStorage.getItem("lastKonamiID");
      if (savedID) searchInput.value = savedID;

      // Mostrar ronda si corresponde
      const mostrarRonda = finalized ? currentRound : currentRound;
      setRondaInfoText(mostrarRonda);

      // Mostrar datos si hay búsqueda previa
      if (savedID) displayMatch(savedID);

    } catch (e) {
      rondaInfo.textContent = "No se encontró el archivo de torneo.";
    }
  }

  // Eventos
  searchInput.addEventListener("input", e => {
    const id = e.target.value.replace(/\D/g, "").slice(0, 10);
    e.target.value = id;
    localStorage.setItem("lastKonamiID", id);
    if (id.length === 10) {
      displayMatch(id);
    } else {
      tableContainer.innerHTML = "";
    }
  });

  btnRonda.addEventListener("click", () => {
    btnRonda.classList.add("active");
    btnHistorial.classList.remove("active");
    tableContainer.style.display = "block";
    historyContainer.style.display = "none";

    const id = searchInput.value;
    if (id.length === 10) displayMatch(id);
  });

  btnHistorial.addEventListener("click", () => {
    btnHistorial.classList.add("active");
    btnRonda.classList.remove("active");
    tableContainer.style.display = "none";
    historyContainer.style.display = "block";

    const id = searchInput.value;
    if (id.length === 10) displayHistory(id);
  });

  await cargarTorneo();
});
