let tournamentData = null;
let currentRound = null;

// Carga del archivo .Tournament (1.txt)
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

// Añade ceros al inicio si faltan
function padId(id) {
  return id?.toString().padStart(10, '0') ?? '';
}

function buscarEmparejamientos() {
  const input = document.getElementById('konamiId').value.trim();
  localStorage.setItem('konamiId', input);

  if (!tournamentData || !input) return;

  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const players = Array.from(tournamentData.querySelectorAll('TournPlayer'));

  const historial = [];
  let encontrado = false;

  matches.forEach(match => {
    const p1 = padId(match.querySelectorAll('Player')[0]?.textContent);
    const p2 = padId(match.querySelectorAll('Player')[1]?.textContent);
    const round = match.querySelector('Round')?.textContent;
    const winner = padId(match.querySelector('Winner')?.textContent);

    if (input === p1 || input === p2) {
      encontrado = true;
      const oponente = input === p1 ? p2 : p1;
      let resultado = 'Empate';
      if (winner === input) resultado = 'Victoria';
      else if (winner === oponente) resultado = 'Derrota';

      historial.push({ ronda: round, oponente, resultado });
    }
  });

  const contenedor = document.getElementById('resultado');

  if (!encontrado) {
    contenedor.innerHTML = 'No se encontró el Konami ID.';
    return;
  }

  historial.sort((a, b) => b.ronda - a.ronda);
  contenedor.innerHTML = '<h2>Historial:</h2>';

  historial.forEach(({ ronda, oponente, resultado }) => {
    const player = players.find(p => padId(p.querySelector('ID')?.textContent) === oponente);
    const nombre = player
      ? `${player.querySelector('FirstName')?.textContent} ${player.querySelector('LastName')?.textContent}`
      : 'Oponente desconocido';

    const color =
      resultado === 'Victoria'
        ? '#4CAF50'
        : resultado === 'Derrota'
        ? '#F44336'
        : '#9E9E9E';

    const caja = document.createElement('div');
    caja.style.backgroundColor = color;
    caja.style.color = 'white';
    caja.style.padding = '10px';
    caja.style.borderRadius = '10px';
    caja.style.marginBottom = '10px';
    caja.style.fontWeight = 'bold';
    caja.style.textAlign = 'center';
    caja.textContent = `Ronda ${ronda} - ${resultado} vs ${nombre}`;
    contenedor.appendChild(caja);
  });
}

// Al cargar, restaurar Konami ID
document.addEventListener('DOMContentLoaded', () => {
  const lastId = localStorage.getItem('konamiId');
  if (lastId) {
    document.getElementById('konamiId').value = lastId;
    setTimeout(buscarEmparejamientos, 300);
  }
});
