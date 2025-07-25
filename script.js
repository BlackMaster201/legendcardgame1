
function buscarEmparejamientos() {
  const inputRaw = document.getElementById('konamiId').value.trim();
  const input = inputRaw.padStart(10, '0');
  localStorage.setItem('konamiId', input);

  if (!window.tournamentData || !input) return;

  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const players = Array.from(tournamentData.querySelectorAll('TournPlayer'));

  const historial = [];
  let encontrado = false;
  let mesaActual = null;

  matches.forEach(match => {
    const p1 = match.querySelectorAll('Player')[0]?.textContent.padStart(10, '0') || "";
    const p2 = match.querySelectorAll('Player')[1]?.textContent.padStart(10, '0') || "";
    const round = parseInt(match.querySelector('Round')?.textContent || "0", 10);
    const winner = (match.querySelector('Winner')?.textContent || "").padStart(10, '0');
    const table = match.querySelector('Table')?.textContent || "";

    if (input === p1 || input === p2) {
      if (round === window.currentRound) {
        mesaActual = table;
      }
      const oponente = input === p1 ? p2 : p1;
      let resultado = 'Empate';
      if (winner === input) resultado = 'Victoria';
      else if (winner === oponente) resultado = 'Derrota';

      historial.push({ ronda: round, oponente, resultado });
      encontrado = true;
    }
  });

  const contenedor = document.getElementById('resultado');
  contenedor.innerHTML = '';

  if (!encontrado) {
    contenedor.innerHTML = 'No se encontró el Konami ID.';
    return;
  }

  const actual = historial.find(h => h.ronda === window.currentRound);
  const actualPlayer = players.find(p => p.querySelector('ID')?.textContent.padStart(10, '0') === input);
  const oponentePlayer = actual ? players.find(p => p.querySelector('ID')?.textContent.padStart(10, '0') === actual.oponente) : null;

  const actualHTML = actual && actualPlayer && oponentePlayer ? `
    <div class="card">
      <h3>${actualPlayer.querySelector('FirstName').textContent} ${actualPlayer.querySelector('LastName').textContent}</h3>
      <p class="konami-id">${actualPlayer.querySelector('ID').textContent}</p>
    </div>
    <div class="vs-label">VS</div>
    <div class="card">
      <h3>${oponentePlayer.querySelector('FirstName').textContent} ${oponentePlayer.querySelector('LastName').textContent}</h3>
      <p class="konami-id">${oponentePlayer.querySelector('ID').textContent}</p>
    </div>
    <div style="text-align:center; margin:10px 0; color:#aaa;">Mesa ${mesaActual}</div>
  ` : '';

  const finalized = tournamentData.querySelector('Finalized')?.textContent === 'True';

  let historialHTML = '';
  historial.sort((a, b) => b.ronda - a.ronda).forEach(({ ronda, oponente, resultado }) => {
    if (!finalized && ronda === window.currentRound) return;

    const player = players.find(p => p.querySelector('ID')?.textContent.padStart(10, '0') === oponente);
    const nombre = player ? `${player.querySelector('FirstName')?.textContent} ${player.querySelector('LastName')?.textContent}` : 'Oponente desconocido';
    const standing = player?.querySelector('Standing')?.textContent || '—';
    const colorClass = resultado === 'Victoria' ? 'green' : resultado === 'Derrota' ? 'red' : 'gray';

    historialHTML += `
      <div class="historial-entry ${colorClass}">
        <h4>Ronda ${ronda} - ${resultado}</h4>
        <p>VS ${nombre}</p>
        <p><strong>Standing:</strong> ${standing}</p>
      </div>`;
  });

  contenedor.innerHTML = `
    <div id="rondaContainer">${actualHTML}</div>
    <div id="historialContainer">${historialHTML}</div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const lastId = localStorage.getItem('konamiId');
  if (lastId) {
    document.getElementById('konamiId').value = lastId;
    setTimeout(buscarEmparejamientos, 300);
  }

  document.getElementById('btnRonda').addEventListener('click', () => {
    document.getElementById('btnRonda').classList.add('active');
    document.getElementById('btnHistorial').classList.remove('active');
    document.getElementById('rondaContainer').style.display = 'block';
    document.getElementById('historialContainer').style.display = 'none';
  });

  document.getElementById('btnHistorial').addEventListener('click', () => {
    document.getElementById('btnHistorial').classList.add('active');
    document.getElementById('btnRonda').classList.remove('active');
    document.getElementById('rondaContainer').style.display = 'none';
    document.getElementById('historialContainer').style.display = 'block';
  });
});
