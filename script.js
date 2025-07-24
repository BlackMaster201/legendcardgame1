document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("searchID");
  const tableContainer = document.getElementById("tableContainer");
  const historyContainer = document.getElementById("historyContainer");
  const btnRonda = document.getElementById("btnRonda");
  const btnHistorial = document.getElementById("btnHistorial");
  const rondaInfo = document.getElementById("rondaInfo");
  let currentPlayerID = "";
  let currentRound = 0;
  let finalized = false;

  async function loadTournament() {
    try {
      const res = await fetch("1.txt");
      if (!res.ok) throw new Error("Archivo no encontrado");

      const text = await res.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");

      finalized = xml.querySelector("Finalized")?.textContent === "True";

      const rounds = Array.from(xml.querySelectorAll("Rounds > Round")).map(round => ({
        number: parseInt(round.getAttribute("Number")),
        matches: Array.from(round.querySelectorAll("Match")).map(match => ({
          player1: match.getAttribute("Player1"),
          player2: match.getAttribute("Player2"),
          result: match.getAttribute("Result"),
          table: match.getAttribute("Table")
        }))
      }));

      const standings = Array.from(xml.querySelectorAll("Standings > Standing")).map((s, i) => ({
        id: s.getAttribute("Player"),
        rank: i + 1
      }));

      currentRound = Math.max(...rounds.map(r => r.number));
      rondaInfo.textContent = `Ronda: ${currentRound}`;

      input.addEventListener("input", () => {
        const id = input.value.trim().slice(0, 10);
        input.value = id;
        currentPlayerID = id;
        localStorage.setItem("lastKonamiID", id);
        showRonda(rounds, id);
        showHistorial(rounds, standings, id);
      });

      const savedID = localStorage.getItem("lastKonamiID");
      if (savedID) {
        input.value = savedID;
        currentPlayerID = savedID;
        showRonda(rounds, savedID);
        showHistorial(rounds, standings, savedID);
      }

      btnRonda.addEventListener("click", () => {
        btnRonda.classList.add("active");
        btnHistorial.classList.remove("active");
        tableContainer.style.display = "block";
        historyContainer.style.display = "none";
      });

      btnHistorial.addEventListener("click", () => {
        btnHistorial.classList.add("active");
        btnRonda.classList.remove("active");
        tableContainer.style.display = "none";
        historyContainer.style.display = "block";
      });

    } catch (e) {
      rondaInfo.textContent = "Archivo 1.txt no encontrado.";
    }
  }

  function showRonda(rounds, id) {
    const round = rounds.find(r => r.number === currentRound);
    const match = round?.matches.find(m => m.player1 === id || m.player2 === id);
    if (!match) return (tableContainer.innerHTML = "<p>No encontrado en la ronda actual.</p>");

    const isP1 = match.player1 === id;
    const opponent = isP1 ? match.player2 : match.player1;

    tableContainer.innerHTML = `
      <div style="text-align:center; margin-bottom: 20px;">
        <h2 style="font-size: 32px; color: #D62828;">Mesa ${match.table}</h2>
      </div>

      <div class="card">
        <h3>${isP1 ? getPlayerName(match.player1) : getPlayerName(match.player2)}</h3>
        <p class="konami-id">${isP1 ? match.player1 : match.player2}</p>
        <div class="vs-label">VS</div>
        <h3>${isP1 ? getPlayerName(match.player2) : getPlayerName(match.player1)}</h3>
        <p class="konami-id">${isP1 ? match.player2 : match.player1}</p>
      </div>
    `;
  }

  function showHistorial(rounds, standings, id) {
    const filtered = rounds
      .filter(r => finalized || r.number !== currentRound)
      .map(r => {
        const match = r.matches.find(m => m.player1 === id || m.player2 === id);
        if (!match) return null;
        const isP1 = match.player1 === id;
        const opponentID = isP1 ? match.player2 : match.player1;
        const result = match.result;
        let outcome = "draw";

        if ((isP1 && result === "A") || (!isP1 && result === "B")) {
          outcome = "win";
        } else if ((isP1 && result === "B") || (!isP1 && result === "A")) {
          outcome = "loss";
        }

        const opponentStanding = standings.find(s => s.id === opponentID);
        const position = opponentStanding?.rank || "-";

        return {
          round: r.number,
          opponent: opponentID,
          result: outcome,
          position
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.round - a.round);

    const medal = rank => {
      if (rank === 1) return "🥇";
      if (rank === 2) return "🥈";
      if (rank === 3) return "🥉";
      return "";
    };

    historyContainer.innerHTML = filtered.map(h => `
      <div class="card result-${h.result}">
        <div><strong>Ronda ${h.round}</strong></div>
        <div>Standing: ${medal(h.position)} ${h.position}</div>
        <div>VS ${h.opponent}</div>
      </div>
    `).join("");
  }

  function getPlayerName(id) {
    // Placeholder: in future this should fetch real names
    return id;
  }

  loadTournament();
});
