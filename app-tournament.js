// app-tournament.js
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("searchID");
  const rondaInfo = document.getElementById("rondaInfo");
  const container = document.getElementById("tableContainer");
  const currentTab = document.getElementById("currentTab");
  const historyTab = document.getElementById("historyTab");
  const tabContent1 = document.getElementById("tabContent1");
  const tabContent2 = document.getElementById("tabContent2");

  let tournamentData = null;

  input.addEventListener("input", () => {
    const id = input.value.replace(/\D/g, "").slice(0, 10);
    input.value = id;
    if (id.length === 10) {
      localStorage.setItem("lastKonamiID", id);
      renderMatch(id);
      renderHistory(id);
    } else {
      container.innerHTML = "";
      tabContent2.innerHTML = "";
    }
  });

  currentTab.addEventListener("click", () => {
    tabContent1.style.display = "block";
    tabContent2.style.display = "none";
    currentTab.classList.add("active");
    historyTab.classList.remove("active");
  });

  historyTab.addEventListener("click", () => {
    tabContent1.style.display = "none";
    tabContent2.style.display = "block";
    historyTab.classList.add("active");
    currentTab.classList.remove("active");
  });

  async function cargarArchivoTournament() {
    try {
      const res = await fetch("./Torneo.Tournament");
      if (!res.ok) throw new Error("No se pudo cargar el archivo");
      const text = await res.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");
      tournamentData = parseTournament(xml);
      rondaInfo.textContent = "Ronda: " + tournamentData.currentRound;
      const savedID = localStorage.getItem("lastKonamiID");
      if (savedID) {
        input.value = savedID;
        renderMatch(savedID);
        renderHistory(savedID);
      }
    } catch (e) {
      rondaInfo.textContent = "Archivo .Tournament no encontrado.";
    }
  }

  function parseTournament(xml) {
    const players = Array.from(xml.querySelectorAll("TournPlayer")).map(p => ({
      id: p.querySelector("Player > ID").textContent,
      name:
        p.querySelector("Player > FirstName").textContent +
        " " +
        p.querySelector("Player > LastName").textContent,
      rank: parseInt(p.querySelector("Rank").textContent),
    }));

    const matches = Array.from(xml.querySelectorAll("TournMatch")).map(m => ({
      player1: m.querySelectorAll("Player")[0].textContent,
      player2: m.querySelectorAll("Player")[1].textContent,
      round: parseInt(m.querySelector("Round").textContent),
      table: m.querySelector("Table").textContent,
      winner: m.querySelector("Winner").textContent,
      status: m.querySelector("Status").textContent,
    }));

    const currentRound = parseInt(xml.querySelector("CurrentRound").textContent);

    return { players, matches, currentRound };
  }

  function getPlayer(id) {
    return tournamentData.players.find(p => p.id === id);
  }

  function renderMatch(id) {
    const match = tournamentData.matches.find(
      m =>
        m.round === tournamentData.currentRound &&
        (m.player1 === id || m.player2 === id)
    );

    if (!match) {
      container.innerHTML = "<p>No tienes duelo esta ronda.</p>";
      return;
    }

    const me = getPlayer(id);
    const opponent = getPlayer(match.player1 === id ? match.player2 : match.player1);

    container.innerHTML = `
      <div style="text-align:center; margin-bottom: 20px;">
        <h2 style="font-size: 32px; color: #D62828;">Mesa ${match.table}</h2>
      </div>

      <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
        <div style="background: linear-gradient(to bottom, #D62828 50%, #1E1E1E 50%); border-radius:10px; padding:12px; width:100%; max-width:400px; text-align:center;">
          <p style="margin:0 3px; font-weight:bold; color:#fff; font-size:18px;">${me.name}</p>
          <p style="margin:4px 0 0; font-size: 14px; color: #999;"><strong>ID:</strong> ${me.id}</p>
        </div>

        <div style="text-align:center; font-size: 20px; font-weight:bold; color: #D3D3D3;">VS</div>

        <div style="background: linear-gradient(to bottom, #1E1E1E 50%, #0077CC 50%); border-radius:10px; padding:12px; width:100%; max-width:400px; text-align:center;">
          <p style="margin:0 3px; font-weight:bold; color:#fff; font-size:18px;">${opponent.name}</p>
          <p style="margin:4px 0 0; font-size: 14px; color: #999;"><strong>ID:</strong> ${opponent.id}</p>
        </div>
      </div>
    `;
  }

  function renderHistory(id) {
    const matches = tournamentData.matches
      .filter(m => (m.player1 === id || m.player2 === id) && m.round < tournamentData.currentRound)
      .sort((a, b) => b.round - a.round);

    const me = getPlayer(id);
    if (!me) {
      tabContent2.innerHTML = "<p>No se encontró tu información.</p>";
      return;
    }

    let html = `<h2 style="text-align:center; color:#fff;">Standing actual: ${me.rank}° lugar</h2>`;

    if (matches.length === 0) {
      html += "<p>No tienes historial de rondas anteriores.</p>";
    } else {
      html += `<ul style="list-style:none; padding:0;">`;

      matches.forEach(m => {
        const isPlayer1 = m.player1 === id;
        const opponent = getPlayer(isPlayer1 ? m.player2 : m.player1);
        const resultado =
          m.winner === id
            ? `<span style="color: #4CAF50;">Victoria</span>`
            : m.winner === "0"
            ? `<span style="color: #999;">Empate</span>`
            : `<span style="color: #F44336;">Derrota</span>`;

        html += `
          <li style="margin: 10px 0; padding: 10px; background: #1E1E1E; border-radius: 8px;">
            <strong style="color:#fff;">Ronda ${m.round}</strong><br>
            ${resultado} vs <strong style="color:#fff;">${opponent.name}</strong> (ID: ${opponent.id})
          </li>
        `;
      });

      html += `</ul>`;
    }

    tabContent2.innerHTML = html;
  }

  cargarArchivoTournament();
});
