// JavaScript principal
let players = {};
let matches = [];
let currentRound = 0;
let finalized = false;

async function loadTournamentFile() {
  try {
    const response = await fetch("Torneo.Tournament");
    if (!response.ok) throw new Error("Archivo .Tournament no encontrado.");
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");

    currentRound = parseInt(xml.querySelector("CurrentRound")?.textContent || "0");
    finalized = xml.querySelector("Finalized")?.textContent === "True";
    document.getElementById("rondaInfo").textContent = "Ronda: " + currentRound;

    xml.querySelectorAll("TournPlayer").forEach(player => {
      const id = player.querySelector("ID").textContent;
      const firstName = player.querySelector("FirstName").textContent;
      const lastName = player.querySelector("LastName").textContent;
      const rank = player.querySelector("Rank").textContent;
      players[id] = { id, name: \`\${firstName} \${lastName}\`, rank: parseInt(rank) };
    });

    xml.querySelectorAll("TournMatch").forEach(match => {
      matches.push({
        player1: match.querySelectorAll("Player")[0].textContent,
        player2: match.querySelectorAll("Player")[1].textContent,
        round: parseInt(match.querySelector("Round").textContent),
        table: match.querySelector("Table").textContent,
        status: match.querySelector("Status").textContent,
        winner: match.querySelector("Winner").textContent
      });
    });

    const saved = localStorage.getItem("lastKonamiID");
    if (saved) {
      document.getElementById("searchID").value = saved;
      showRound(saved);
    }
  } catch (e) {
    document.getElementById("rondaInfo").textContent = "Archivo .Tournament no encontrado.";
  }
}

function showRound(kid) {
  localStorage.setItem("lastKonamiID", kid);
  const tableContainer = document.getElementById("tableContainer");
  const historyContainer = document.getElementById("historyContainer");
  tableContainer.innerHTML = "";
  historyContainer.innerHTML = "";
  tableContainer.style.display = "block";
  historyContainer.style.display = "none";

  const match = matches.find(m => (m.player1 === kid || m.player2 === kid) && (m.round === currentRound || (finalized && m.round === currentRound)));
  if (!match) {
    tableContainer.innerHTML = "<p>No se encontró ese Konami ID.</p>";
    return;
  }

  const isP1 = match.player1 === kid;
  const opponentID = isP1 ? match.player2 : match.player1;
  const opponent = players[opponentID];
  const player = players[kid];

  tableContainer.innerHTML = \`
    <div style="text-align:center; margin-bottom: 20px;">
      <h2 style="font-size: 32px; color: #D62828;">Mesa \${match.table}</h2>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:20px;">
      <div class="card">
        <h3>\${player.name}</h3>
        <div class="konami-id">\${player.id}</div>
      </div>
      <div class="vs-label">VS</div>
      <div class="card">
        <h3>\${opponent.name}</h3>
        <div class="konami-id">\${opponent.id}</div>
      </div>
    </div>\`;
}

function showHistory(kid) {
  const container = document.getElementById("historyContainer");
  const tableContainer = document.getElementById("tableContainer");
  container.innerHTML = "";
  tableContainer.style.display = "none";
  container.style.display = "block";

  const history = matches.filter(m => m.player1 === kid || m.player2 === kid)
                         .filter(m => finalized || m.round < currentRound)
                         .sort((a, b) => b.round - a.round);

  const player = players[kid];
  if (!player) {
    container.innerHTML = "<p>No se encontró ese Konami ID.</p>";
    return;
  }

  const top = document.createElement("div");
  const rank = player.rank;
  let medal = "";
  if (rank === 1) medal = "🥇 ";
  else if (rank === 2) medal = "🥈 ";
  else if (rank === 3) medal = "🥉 ";
  top.innerHTML = \`<h2 style="text-align:center;">Standing: \${medal}\${rank}</h2>\`;
  container.appendChild(top);

  history.forEach(match => {
    const isP1 = match.player1 === kid;
    const opponentID = isP1 ? match.player2 : match.player1;
    const opponent = players[opponentID];
    let resultClass = "result-draw", resultText = "Empate";

    if (match.winner === kid) {
      resultClass = "result-win";
      resultText = "Victoria";
    } else if (match.winner === opponentID) {
      resultClass = "result-loss";
      resultText = "Derrota";
    }

    const card = document.createElement("div");
    card.className = \`card \${resultClass}\`;
    card.innerHTML = \`
      <h3>Ronda \${match.round}</h3>
      <p><strong>\${resultText}</strong> vs \${opponent.name}</p>
    \`;
    container.appendChild(card);
  });
}

document.getElementById("searchID").addEventListener("input", function () {
  const id = this.value.replace(/\D/g, "").slice(0, 10);
  this.value = id;
  if (id.length === 10) showRound(id);
});

document.getElementById("btnRonda").addEventListener("click", function () {
  this.classList.add("active");
  document.getElementById("btnHistorial").classList.remove("active");
  const id = document.getElementById("searchID").value;
  if (id.length === 10) showRound(id);
});

document.getElementById("btnHistorial").addEventListener("click", function () {
  this.classList.add("active");
  document.getElementById("btnRonda").classList.remove("active");
  const id = document.getElementById("searchID").value;
  if (id.length === 10) showHistory(id);
});

loadTournamentFile();
