let tournamentData = null;
let currentRound = null;

function padId(id) {
  return String(id).padStart(10, '0');
}

function getStandingWithDropAndMedal(rank, dropFromRound) {
  let medal = '';
  if (rank === 1) medal = '🥇 ';
  else if (rank === 2) medal = '🥈 ';
  else if (rank === 3) medal = '🥉 ';

  let standing = rank ? `${medal}${rank}º` : '-';
  if (dropFromRound) standing += ' - Drop';
  return standing;
}

fetch('1.txt')
  .then(response => response.text())
  .then(str => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(str, 'text/xml');
    tournamentData = xml;

    const currentRoundNode = tournamentData.querySelector('CurrentRound');
    currentRound = parseInt(currentRoundNode?.textContent || "0", 10);

    const label = document.getElementById('rondaInfo');
    if (label) label.textContent = `Ronda: ${currentRound}`;

    setupListeners();
  })
  .catch(() => {
    const label = document.getElementById('rondaInfo');
    if (label) label.textContent = 'No se encontró el archivo de torneo.';
  });

function mostrarRonda(konamiId) {
  if (!tournamentData) return;
  const input = padId(konamiId.trim());

  const players = Array.from(tournamentData.querySelectorAll('TournPlayer'));
  const playerNode = players.find(p => padId(p.querySelector('ID')?.textContent) === input);
  const tableDiv = document.getElementById('tableContainer');
  const standingDiv = document.getElementById('standingContainer');
  standingDiv.style.display = "none"; // OCULTAR el standing en ronda

  if (!playerNode) {
    tableDiv.innerHTML = "<div style='text-align:center;margin:2em 0;'>No se encontró el Konami ID.</div>";
    return;
  }

  // Buscar match actual
  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const match = matches.find(m => {
    const round = parseInt(m.querySelector('Round')?.textContent || "0", 10);
    if (round !== currentRound) return false;
    const p1 = padId(m.querySelectorAll('Player')[0]?.textContent || "");
    const p2 = padId(m.querySelectorAll('Player')[1]?.textContent || "");
    return (input === p1 || input === p2);
  });

  if (!match) {
    tableDiv.innerHTML = "<div style='text-align:center;margin:2em 0;'>No tienes duelo en la ronda actual.</div>";
    return;
  }

  const p1 = padId(match.querySelectorAll('Player')[0]?.textContent || "");
  const p2 = padId(match.querySelectorAll('Player')[1]?.textContent || "");
  const mesa = match.querySelector('Table')?.textContent || '-';
  const nombre1Node = players.find(p => padId(p.querySelector('ID')?.textContent) === p1);
  const nombre2Node = players.find(p => padId(p.querySelector('ID')?.textContent) === p2);

  let jugador, oponente, jugadorId, oponenteId;
  if (input === p1) {
    jugador = `${nombre1Node.querySelector('FirstName')?.textContent} ${nombre1Node.querySelector('LastName')?.textContent}`;
    jugadorId = p1;
    oponente = nombre2Node
      ? `${nombre2Node.querySelector('FirstName')?.textContent} ${nombre2Node.querySelector('LastName')?.textContent}`
      : 'Oponente desconocido';
    oponenteId = p2;
  } else {
    jugador = `${nombre2Node.querySelector('FirstName')?.textContent} ${nombre2Node.querySelector('LastName')?.textContent}`;
    jugadorId = p2;
    oponente = nombre1Node
      ? `${nombre1Node.querySelector('FirstName')?.textContent} ${nombre1Node.querySelector('LastName')?.textContent}`
      : 'Oponente desconocido';
    oponenteId = p1;
  }

  tableDiv.innerHTML = `
    <div class="pareo-mesa">Mesa: ${mesa}</div>
    <div class="pareo-caja">
      <div class="pareo-nombre">
        ${jugador}
        <div class="pareo-id">${jugadorId}</div>
      </div>
      <div class="pareo-vs">VS</div>
      <div class="pareo-nombre-opp">
        ${oponente}
        <div class="pareo-id-opp">${oponenteId}</div>
      </div>
    </div>
  `;
}

function mostrarHistorial(konamiId) {
  if (!tournamentData) return;
  const input = padId(konamiId.trim());

  const players = Array.from(tournamentData.querySelectorAll('TournPlayer'));
  const playerNode = players.find(p => padId(p.querySelector('ID')?.textContent) === input);
  const historyDiv = document.getElementById('historyContainer');
  const standingDiv = document.getElementById('standingContainer');

  if (!playerNode) {
    historyDiv.innerHTML = "<div style='text-align:center;margin:2em 0;'>No se encontró el Konami ID.</div>";
    standingDiv.style.display = "none";
    return;
  }

  // Obtener standing
  const rank = parseInt(playerNode.querySelector('Rank')?.textContent || "0", 10);
  const dropFromRound = playerNode.querySelector('DropRound')?.textContent && parseInt(playerNode.querySelector('DropRound').textContent) > 0;
  standingDiv.innerHTML = `<div class="standing"><strong>Standing:</strong> ${getStandingWithDropAndMedal(rank, dropFromRound)}</div>`;
  standingDiv.style.display = "";

  // Historial de matches
  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const historial = [];
  matches.forEach(match => {
    const p1 = padId(match.querySelectorAll('Player')[0]?.textContent || "");
    const p2 = padId(match.querySelectorAll('Player')[1]?.textContent || "");
    const round = parseInt(match.querySelector('Round')?.textContent || "0", 10);
    const winner = padId(match.querySelector('Winner')?.textContent || "");

    if (input === p1 || input === p2) {
      const oponente = input === p1 ? p2 : p1;
      let resultado = 'Empate';
      if (winner === input) resultado = 'Victoria';
      else if (winner === oponente) resultado = 'Derrota';

      historial.push({ ronda: round, oponente, resultado });
    }
  });

  // Ordenar por ronda descendente
  historial.sort((a, b) => b.ronda - a.ronda);

  // Mostrar historial
  let html = `<div class="history-title"><strong>Historial:</strong></div>`;
  historial.forEach(({ ronda, oponente, resultado }) => {
    const player = players.find(p => padId(p.querySelector('ID')?.textContent) === oponente);
    const nombre = player
      ? `${player.querySelector('FirstName')?.textContent} ${player.querySelector('LastName')?.textContent}`
      : 'Oponente desconocido';

    let color = '#9E9E9E';
    if (resultado === 'Victoria') color = '#4CAF50';
    else if (resultado === 'Derrota') color = '#F44336';

    html += `
      <div class="hist-card">
        <div class="left-color" style="background:${color};"></div>
        <div class="hist-content">
          <div class="hist-ronda" style="color:${color};">Ronda ${ronda} - ${resultado}</div>
          <div class="hist-vs">VS ${nombre}</div>
        </div>
      </div>`;
  });

  historyDiv.innerHTML = html;
}

function setupListeners() {
  const input = document.getElementById('konamiId');
  const btnRonda = document.getElementById('btnRonda');
  const btnHistorial = document.getElementById('btnHistorial');
  const tableDiv = document.getElementById('tableContainer');
  const historyDiv = document.getElementById('historyContainer');
  const standingDiv = document.getElementById('standingContainer');

  function showRonda() {
    btnRonda.classList.add('active');
    btnHistorial.classList.remove('active');
    tableDiv.style.display = '';
    historyDiv.style.display = 'none';
    standingDiv.style.display = "none";
    mostrarRonda(input.value);
  }
  function showHistorial() {
    btnRonda.classList.remove('active');
    btnHistorial.classList.add('active');
    tableDiv.style.display = 'none';
    historyDiv.style.display = '';
    mostrarHistorial(input.value);
  }

  btnRonda.onclick = showRonda;
  btnHistorial.onclick = showHistorial;

  input.addEventListener('input', () => {
    if (input.value.length === 10) {
      if (btnRonda.classList.contains('active')) {
        mostrarRonda(input.value);
      } else {
        mostrarHistorial(input.value);
      }
    } else {
      tableDiv.innerHTML = "";
      historyDiv.innerHTML = "";
      standingDiv.innerHTML = "";
      standingDiv.style.display = "none";
    }
  });

  // Si hay ID en storage lo carga automáticamente
  const lastId = localStorage.getItem('konamiId');
  if (lastId && input) {
    input.value = lastId;
    setTimeout(() => {
      if (btnRonda.classList.contains('active')) mostrarRonda(lastId);
      else mostrarHistorial(lastId);
    }, 400);
  }
}
