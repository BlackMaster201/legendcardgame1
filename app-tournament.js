let tournamentData = null;
let currentRound = null;

// Utilidades
function padId(id) {
  return String(id).padStart(10, '0');
}

// Cargar archivo de torneo
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
  })
  .catch(() => {
    const label = document.getElementById('rondaInfo');
    if (label) label.textContent = 'No se encontró el archivo de torneo.';
  });

// Mostrar ronda, mesa, jugador y oponente
function mostrarRonda({ fullName, input, oppName, opponentId, table }) {
  const tableContainer = document.getElementById('tableContainer');
  tableContainer.innerHTML = '';

  // Mesa
  const tableInfo = document.createElement('div');
  tableInfo.className = 'table-label';
  tableInfo.textContent = `Mesa: ${table}`;
  tableContainer.appendChild(tableInfo);

  // Jugador principal (arriba, rojo)
  const card = document.createElement('div');
  card.className = 'card red-top';
  card.innerHTML = `<div class="nombre">${fullName}</div><div class="konami-id">${input}</div>`;
  tableContainer.appendChild(card);

  // VS label
  const vsLabel = document.createElement('div');
  vsLabel.className = 'vs-label';
  vsLabel.textContent = 'VS';
  tableContainer.appendChild(vsLabel);

  // Oponente (abajo, azul)
  const opponentCard = document.createElement('div');
  opponentCard.className = 'card blue-bottom';
  opponentCard.innerHTML = `<div class="nombre">${oppName}</div><div class="konami-id">${opponentId}</div>`;
  tableContainer.appendChild(opponentCard);
}

// Buscar emparejamientos
function buscarEmparejamientos() {
  const inputRaw = document.getElementById('konamiId').value.trim();
  const input = padId(inputRaw);
  localStorage.setItem('konamiId', input);

  if (!tournamentData || !input) return;

  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const players = Array.from(tournamentData.querySelectorAll('TournPlayer'));

  // Encontrar el nombre del jugador
  const playerData = players.find(p => padId(p.querySelector('ID')?.textContent) === input);
  if (!playerData) {
    document.getElementById('tableContainer').innerHTML = '<div style="color:red;font-weight:bold;text-align:center;">No se encontró el Konami ID.</div>';
    return;
  }
  const fullName = `${playerData.querySelector('FirstName')?.textContent} ${playerData.querySelector('LastName')?.textContent}`;

  // Buscar emparejamiento en ronda actual
  let matchFound = null;
  matches.forEach(match => {
    const round = parseInt(match.querySelector('Round')?.textContent || "0", 10);
    if (round === currentRound) {
      const p1 = padId(match.querySelectorAll('Player')[0]?.textContent || "");
      const p2 = padId(match.querySelectorAll('Player')[1]?.textContent || "");
      if (input === p1 || input === p2) {
        matchFound = match;
      }
    }
  });

  if (matchFound) {
    const p1 = padId(matchFound.querySelectorAll('Player')[0]?.textContent || "");
    const p2 = padId(matchFound.querySelectorAll('Player')[1]?.textContent || "");
    const table = matchFound.querySelector('Table')?.textContent || "-";
    const oppId = input === p1 ? p2 : p1;
    const oppData = players.find(p => padId(p.querySelector('ID')?.textContent) === oppId);
    const oppName = oppData ? `${oppData.querySelector('FirstName')?.textContent} ${oppData.querySelector('LastName')?.textContent}` : 'Oponente desconocido';

    mostrarRonda({
      fullName,
      input,
      oppName,
      opponentId: oppId,
      table
    });
  } else {
    document.getElementById('tableContainer').innerHTML = '<div style="color:red;font-weight:bold;text-align:center;">No tienes duelo en la ronda actual.</div>';
  }
}

// Alternar pestañas
function alternarPestanas() {
  const btnRonda = document.getElementById('btnRonda');
  const btnHistorial = document.getElementById('btnHistorial');
  const tableContainer = document.getElementById('tableContainer');
  const historyContainer = document.getElementById('historyContainer');

  btnRonda.addEventListener('click', () => {
    btnRonda.classList.add('active');
    btnHistorial.classList.remove('active');
    tableContainer.style.display = '';
    historyContainer.style.display = 'none';
  });

  btnHistorial.addEventListener('click', () => {
    btnHistorial.classList.add('active');
    btnRonda.classList.remove('active');
    tableContainer.style.display = 'none';
    historyContainer.style.display = '';
    mostrarHistorial();
  });
}

// Mostrar historial (puedes mejorar esto según tus necesidades, aquí solo el esqueleto)
function mostrarHistorial() {
  const inputRaw = document.getElementById('konamiId').value.trim();
  const input = padId(inputRaw);
  const historyContainer = document.getElementById('historyContainer');
  historyContainer.innerHTML = '';

  if (!tournamentData || !input) return;

  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const players = Array.from(tournamentData.querySelectorAll('TournPlayer'));

  // Encontrar el nombre del jugador
  const playerData = players.find(p => padId(p.querySelector('ID')?.textContent) === input);
  if (!playerData) {
    historyContainer.innerHTML = '<div style="color:red;font-weight:bold;text-align:center;">No se encontró el Konami ID.</div>';
    return;
  }

  // Historial (última a primera ronda)
  const historial = [];
  matches.forEach(match => {
    const p1 = padId(match.querySelectorAll('Player')[0]?.textContent || "");
    const p2 = padId(match.querySelectorAll('Player')[1]?.textContent || "");
    const round = parseInt(match.querySelector('Round')?.textContent || "0", 10);
    const winner = padId(match.querySelector('Winner')?.textContent || "");
    if (input === p1 || input === p2) {
      const oppId = input === p1 ? p2 : p1;
      let resultado = 'Empate';
      if (winner === input) resultado = 'Victoria';
      else if (winner === oppId) resultado = 'Derrota';
      historial.push({ ronda: round, oppId, resultado });
    }
  });
  historial.sort((a, b) => b.ronda - a.ronda);

  // Mostrar historial
  historial.forEach(({ ronda, oppId, resultado }) => {
    const oppData = players.find(p => padId(p.querySelector('ID')?.textContent) === oppId);
    const oppName = oppData ? `${oppData.querySelector('FirstName')?.textContent} ${oppData.querySelector('LastName')?.textContent}` : 'Oponente desconocido';
    let color =
      resultado === 'Victoria'
        ? '#4CAF50'
        : resultado === 'Derrota'
        ? '#F44336'
        : '#9E9E9E';

    const box = document.createElement('div');
    box.style.background = '#1E1E1E';
    box.style.borderRadius = '8px';
    box.style.margin = '10px auto';
    box.style.maxWidth = '340px';
    box.style.display = 'flex';
    box.style.alignItems = 'center';
    box.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    box.style.fontWeight = 'bold';

    // Línea de color a la izquierda
    const line = document.createElement('div');
    line.style.width = '6px';
    line.style.height = '46px';
    line.style.borderRadius = '6px 0 0 6px';
    line.style.background = color;
    box.appendChild(line);

    // Contenido
    const cont = document.createElement('div');
    cont.style.padding = '7px 16px';
    cont.style.width = '100%';

    // Línea 1: Ronda y resultado (color)
    const topLine = document.createElement('div');
    topLine.style.color = color;
    topLine.style.fontWeight = 'bold';
    topLine.style.fontSize = '16px';
    topLine.style.marginBottom = '2px';
    topLine.textContent = `Ronda ${ronda} - ${resultado}`;
    cont.appendChild(topLine);

    // Línea 2: VS nombre de adversario (blanco, normal)
    const bottomLine = document.createElement('div');
    bottomLine.style.color = 'white';
    bottomLine.style.fontWeight = 'bold';
    bottomLine.style.fontSize = '16px';
    bottomLine.style.marginLeft = '0';
    bottomLine.style.textAlign = 'left';
    bottomLine.textContent = `VS ${oppName}`;
    cont.appendChild(bottomLine);

    box.appendChild(cont);
    historyContainer.appendChild(box);
  });
}

// Listeners y autocompletar
document.addEventListener('DOMContentLoaded', () => {
  alternarPestanas();

  const lastId = localStorage.getItem('konamiId');
  if (lastId) {
    document.getElementById('konamiId').value = lastId;
    setTimeout(buscarEmparejamientos, 300);
  }

  document.getElementById('konamiId').addEventListener('input', buscarEmparejamientos);
});
