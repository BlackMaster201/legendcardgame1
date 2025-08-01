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

  const players = Array.from(tournamentData.querySelectorAll('TournPlayer'));
  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const standings = Array.from(tournamentData.querySelectorAll('TournStanding > Standing'));

  const player = players.find(p => padId(p.querySelector('ID')?.textContent) === input);
  if (!player) {
    tableContainer.textContent = 'No se encontró el Konami ID.';
    return;
  }

  const firstName = player.querySelector('FirstName')?.textContent || '';
  const lastName = player.querySelector('LastName')?.textContent || '';
  const fullName = `${firstName} ${lastName}`;

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<div class="nombre">${fullName}</div><div class="konami-id">${input}</div>`;
  tableContainer.appendChild(card);

  const match = matches.find(m => {
    const round = parseInt(m.querySelector('Round')?.textContent || "0");
    const p1 = padId(m.querySelectorAll('Player')[0]?.textContent);
    const p2 = padId(m.querySelectorAll('Player')[1]?.textContent);
    return round === currentRound && (p1 === input || p2 === input);
  });

  if (match) {
    const p1 = padId(match.querySelectorAll('Player')[0]?.textContent);
    const p2 = padId(match.querySelectorAll('Player')[1]?.textContent);
    const table = match.querySelector('Table')?.textContent || '';
    const opponentId = input === p1 ? p2 : p1;

    const opponent = players.find(p => padId(p.querySelector('ID')?.textContent) === opponentId);
    const oppName = opponent
      ? `${opponent.querySelector('FirstName')?.textContent || ''} ${opponent.querySelector('LastName')?.textContent || ''}`
      : 'Oponente desconocido';

    const vsLabel = document.createElement('div');
    vsLabel.className = 'vs-label';
    vsLabel.textContent = 'VS';
    const opponentCard = document.createElement('div');
    opponentCard.className = 'card bottom-border';
    opponentCard.innerHTML = `<div class="nombre">${oppName}</div><div class="konami-id">${opponentId}</div>`;

    const tableInfo = document.createElement('div');
    tableInfo.className = 'vs-label';
    tableInfo.textContent = `Mesa: ${table}`;

    tableContainer.appendChild(vsLabel);
    tableContainer.appendChild(opponentCard);
    tableContainer.appendChild(tableInfo);
  }

  // Historial
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

  const playerStanding = standings.find(s => padId(s.querySelector('ID')?.textContent) === input);
  const position = playerStanding?.querySelector('Rank')?.textContent || '-';
  const drop = player.querySelector('DropFromRound') ? ' - Drop' : '';
  const posLine = document.createElement('div');
  posLine.className = 'vs-label';
  posLine.textContent = `Standing: ${position}${drop}`;
  historyContainer.appendChild(posLine);

  historial.forEach(({ round, name, resultado }) => {
    const box = document.createElement('div');
    box.className = 'history-box';

    const line = document.createElement('div');
    line.className = 'history-line';
    line.classList.add(
      resultado === 'Victoria' ? 'result-win' :
      resultado === 'Derrota' ? 'result-loss' : 'result-draw'
    );

    const content = document.createElement('div');
    content.className = 'history-content';
    content.innerHTML = `
      <div class="history-title" style="color: ${line.style.backgroundColor}">
        Ronda ${round} - ${resultado}
      </div>
      <div class="history-opponent">VS ${name}</div>
    `;

    box.appendChild(line);
    box.appendChild(content);
    historyContainer.appendChild(box);
  });
}
