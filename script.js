let tournamentData = null;
let currentRound = null;

// Carga del archivo .Tournament (1.txt)
fetch('1.txt')
  .then(response => response.text())
  .then(str => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(str, 'text/xml');
    tournamentData = xml;

    // Obtener la ronda actual
    const currentRoundNode = tournamentData.querySelector('CurrentRound');
    currentRound = parseInt(currentRoundNode?.textContent || "0", 10);

    document.getElementById('rondaLabel').textContent = `Ronda: ${currentRound}`;
  })
  .catch(() => {
    document.getElementById('rondaLabel').textContent = 'No se encontró el archivo de torneo.';
  });

// Formateo con ceros a la izquierda para IDs
function padId(id) {
  return id.toString().padStart(10, '0');
}

// Función principal de búsqueda
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

  if (!encontrado) {
    document.getElementById('resultado').innerHTML = 'No se encontró el Konami ID.';
    return;
  }

  // Mostrar historial en orden descendente
  historial.sort((a, b) => b.ronda - a.ronda);
  const contenedor = document.getElementById('resultado');
  contenedor.innerHTML = '<h2>Historial:</h2>';

  historial.forEach(({ ronda, oponente, resultado }) => {
    const player = players.find(p => padId(p.querySelector('ID')?.textContent) === oponente);
    const nombre = player
      ? `${player.querySelector('FirstName')?.textContent} ${player.querySelector('LastName')?.textContent}`
      : 'Oponente desconocido';

    const color =
      resultado === 'Victoria'
        ? 'green'
        : resultado === 'Derrota'
        ? 'red'
        : 'gray';

    const caja = document.createElement('div');
    caja.style.backgroundColor = color;
    caja.style.color = 'white';
    caja.style.padding = '10px';
    caja.style.borderRadius = '10px';
    caja.style.marginBottom = '10px';
    caja.style.fontWeight = 'bold';
    caja.textContent = `Ronda ${ronda} - ${resultado} vs ${nombre}`;
    contenedor.appendChild(caja);
  });
}

// Restaurar búsqueda previa al recargar
document.addEventListener('DOMContentLoaded', () => {
  const lastId = localStorage.getItem('konamiId');
  if (lastId) {
    document.getElementById('konamiId').value = lastId;
    setTimeout(buscarEmparejamientos, 300);
  }
});
