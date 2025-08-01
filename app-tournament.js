let tournamentData = null;
let currentRound = null;

function padId(id) {
  return String(id).padStart(10, '0');
}

fetch('1.txt')
  .then(res => res.text())
  .then(xmlStr => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlStr, 'application/xml');
    tournamentData = xml;
    currentRound = parseInt(xml.querySelector('CurrentRound')?.textContent || "0");
    document.getElementById('rondaInfo').textContent = `Ronda: ${currentRound}`;
  })
  .catch(() => {
    document.getElementById('rondaInfo').textContent = 'No se encontró el archivo de torneo.';
  });

function buscarEmparejamientos() {
  const input = padId(document.getElementById('konamiId').value.trim());
  localStorage.setItem('konamiId', input);
  const tableContainer = document.getElementById('tableContainer');
  const historyContainer = document.getElementById('historyContainer');
  tableContainer.innerHTML = '';
  historyContainer.innerHTML = '';

  if (!tournamentData) {
    tableContainer.textContent = 'No se encontró el archivo de torneo.';
    return;
  }

  const players = Array.from(tournamentData.querySelectorAll('TournPlayer'));
  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  // Busca el nodo TournPlayer (para Drop y standing)
  const player = players.find(p => padId(p.querySelector('ID')?.textContent) === input);
  if (!player) {
    tableContainer.textContent = 'No se encontró el Konami ID.';
    return;
  }

  const firstName = player.querySelector('FirstName')?.textContent || '';
  const lastName = player.querySelector('LastName')?.textContent || '';
  const fullName = `${firstName} ${lastName}`;
  const dropFromRound = player.querySelector('DropRound')?.textContent;
  const hasDrop = dropFromRound && parseInt(dropFromRound) > 0;

  // --- Busca la mesa y el oponente de la ronda actual
  const match = matches.find(m => {
    const round = parseInt(m.querySelector('Round')?.textContent || "0");
    const p1 = padId(m.querySelectorAll('Player')[0]?.textContent);
    const p2 = padId(m.querySelectorAll('Player')[1]?.textContent);
    return round === currentRound && (p1 === input || p2 === input);
  });

  // --- Muestra la mesa ARRIBA y centrada
  if (match) {
    const table = match.querySelector('Table')?.textContent || '';
    const p1 = padId(match.querySelectorAll('Player')[0]?.textContent);
    const p2 = padId(match.querySelectorAll('Player')[1]?.textContent);
    const opponentId = input === p1 ? p2 : p1;
    const opponent = players.find(p => padId(p.querySelector('ID')?.textContent) === opponentId);
    const oppName = opponent
      ? `${opponent.querySelector('FirstName')?.textContent || ''} ${opponent.querySelector('LastName')?.textContent || ''}`
      : 'Oponente desconocido';

    // Mesa
    const tableInfo = document.createElement('div');
    tableInfo.className = 'table-label';
    tableInfo.textContent = `Mesa: ${table}`;
    tableContainer.appendChild(tableInfo);

    // Jugador principal
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="nombre">${fullName}</div><div class="konami-id">${input}</div>`;
    tableContainer.appendChild(card);

    // VS
    const vsLabel = document.createElement('div');
    vsLabel.className = 'vs-label';
    vsLabel.textContent = 'VS';
    tableContainer.appendChild(vsLabel);

    // Oponente
    const opponentCard = document.createElement('div');
    opponentCard.className = 'card bottom-border';
    opponentCard.innerHTML = `<div class="nombre">${oppName}</div><div class="konami-id">${opponentId}</div>`;
    tableContainer.appendChild(opponentCard);
  } else {
    // Si no hay match, muestra solo tu carta
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="nombre">${fullName}</div><div class="konami-id">${input}</div>`;
    tableContainer.appendChild(card);
  }

  // --- Standing (con medallas y drop si aplica)
  // Busca la posición en el ranking (standings se calcula desde jugadores)
  let standing = '-';
  let standingClass = '';
  let medal = '';
  // El Rank está en el nodo TournPlayer > Rank
  const rank = player.querySelector('Rank')?.textContent;
  if (rank) {
    standing = parseInt(rank, 10);
    if (standing === 1) {
      medal = '🥇';
      standingClass = 'standing-gold';
    } else if (standing === 2) {
      medal = '🥈';
      standingClass = 'standing-silver';
    } else if (standing === 3) {
      medal = '🥉';
      standingClass = 'standing-bronze';
    }
  }
  if (hasDrop) {
    standingClass = 'standing-drop';
  }
  const standingText = document.createElement('div');
  standingText.className = `history-standing ${standingClass}`;
  standingText.innerHTML = `Standing: ${medal}${standing}${hasDrop ? ' - Drop' : ''}`;
  historyContainer.appendChild(standingText);

  // --- Historial
  const historial = matches
    .map(m => {
      const round = parseInt(m.querySelector('Round')?.textContent);
      const p1 = padId(m.querySelectorAll('Player')[0]?.textContent);
      const p2 = padId(m.querySelectorAll('Player')[1]?.textContent);
      const winner = padId(m.querySelector('Winner')?.textContent || "");
      if (p1 !== input && p2 !== input) return null;
      const opponentId = input === p1 ? p2 : p1;
      const opponent = players.find(p => padId(p.querySelector('ID')?.textContent) === opponentId);
      const name = opponent
        ? `${opponent.querySelector('FirstName')?.textContent || ''} ${opponent.querySelector('LastName')?.textContent || ''}`
        : 'Oponente desconocido';
      let resultado = 'Empate';
      if (winner === input) resultado = 'Victoria';
      else if (winner === opponentId) resultado = 'Derrota';
      return { round, name, resultado };
    })
    .filter(Boolean)
    .sort((a, b) => b.round - a.round);

  // Render historial con colores y línea a la izquierda
  historial.forEach(({ round, name, resultado }) => {
    const box = document.createElement('div');
    box.className = 'history-box';

    const line = document.createElement('div');
    line.className = 'history-line';
    if (resultado === 'Victoria') line.classList.add('result-win');
    else if (resultado === 'Derrota') line.classList.add('result-loss');
    else line.classList.add('result-draw');

    let colorText = "#4CAF50";
    if (resultado === 'Derrota') colorText = "#F44336";
    else if (resultado === 'Empate') colorText = "#B0BEC5";

    const content = document.createElement('div');
    content.className = 'history-content';
    content.innerHTML = `
      <div class="history-title" style="color:${colorText}">
        Ronda ${round} - ${resultado}
      </div>
      <div class="history-opponent">VS ${name}</div>
    `;

    box.appendChild(line);
    box.appendChild(content);
    historyContainer.appendChild(box);
  });
}
