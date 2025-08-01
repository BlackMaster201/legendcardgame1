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
  })
  .catch(() => {
    const label = document.getElementById('rondaInfo');
    if (label) label.textContent = 'No se encontró el archivo de torneo.';
  });

function buscarEmparejamientos() {
  const inputRaw = document.getElementById('konamiId').value.trim();
  const input = padId(inputRaw);
  localStorage.setItem('konamiId', input);

  if (!tournamentData || !input) return;

  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const players = Array.from(tournamentData.querySelectorAll('TournPlayer'));

  const playerNode = players.find(p => padId(p.querySelector('ID')?.textContent) === input);
  const contenedor = document.getElementById('resultado');
  if (!playerNode) {
    contenedor.innerHTML = 'No se encontró el Konami ID.';
    return;
  }

  // Obtener rank y drop
  const rank = parseInt(playerNode.querySelector('Rank')?.textContent || "0", 10);
  const dropFromRound = playerNode.querySelector('DropRound')?.textContent && parseInt(playerNode.querySelector('DropRound').textContent) > 0;

  // Standing
  let standing = getStandingWithDropAndMedal(rank, dropFromRound);

  // Mostrar standing
  contenedor.innerHTML = `<div class="standing"><strong>Standing:</strong> ${standing}</div>`;

  // Historial de matches
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
  if (historial.length > 0) {
    contenedor.innerHTML += `<div class="history-title"><strong>Historial:</strong></div>`;
    historial.forEach(({ ronda, oponente, resultado }) => {
      const player = players.find(p => padId(p.querySelector('ID')?.textContent) === oponente);
      const nombre = player
        ? `${player.querySelector('FirstName')?.textContent} ${player.querySelector('LastName')?.textContent}`
        : 'Oponente desconocido';

      let color = '#9E9E9E';
      if (resultado === 'Victoria') color = '#4CAF50';
      else if (resultado === 'Derrota') color = '#F44336';

      contenedor.innerHTML += `
        <div class="hist-card">
          <div class="left-color" style="background:${color};"></div>
          <div class="hist-content">
            <div class="hist-ronda" style="color:${color};">Ronda ${ronda} - ${resultado}</div>
            <div class="hist-vs">VS ${nombre}</div>
          </div>
        </div>`;
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const lastId = localStorage.getItem('konamiId');
  const input = document.getElementById('konamiId');
  if (lastId && input) {
    input.value = lastId;
    setTimeout(buscarEmparejamientos, 300);
  }
  input.addEventListener('input', () => {
    if (input.value.length === 10) buscarEmparejamientos();
  });
});
