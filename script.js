function buscarEmparejamientos() {
  const inputRaw = document.getElementById('konamiId').value.trim();
  const input = inputRaw.padStart(10, '0');
  localStorage.setItem('konamiId', input);

  const contenedor = document.getElementById('resultado');
  contenedor.innerHTML = "";

  if (!tournamentData || !input) return;

  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const players = Array.from(tournamentData.querySelectorAll('TournPlayer'));

  const historial = [];
  let encontrado = false;
  let matchActual = null;

  matches.forEach(match => {
    const round = parseInt(match.querySelector('Round')?.textContent || "0");
    const p1 = match.querySelectorAll('Player')[0]?.textContent.trim().padStart(10, '0');
    const p2 = match.querySelectorAll('Player')[1]?.textContent.trim().padStart(10, '0');
    const mesa = match.querySelector('Table')?.textContent || "—";
    const winner = match.querySelector('Winner')?.textContent.trim().padStart(10, '0');

    if (input === p1 || input === p2) {
      const oponente = input === p1 ? p2 : p1;
      let resultado = 'Empate';
      if (winner === input) resultado = 'Victoria';
      else if (winner === oponente) resultado = 'Derrota';

      if (round === currentRound) {
        matchActual = { mesa, oponente };
        encontrado = true;
      }

      historial.push({ ronda: round, oponente, resultado });
    }
  });

  const jugador = players.find(p => p.querySelector('ID')?.textContent.trim().padStart(10, '0') === input);
  const nombreJugador = jugador ? `${jugador.querySelector('FirstName')?.textContent} ${jugador.querySelector('LastName')?.textContent}` : 'Jugador desconocido';

  if (!encontrado && historial.length === 0) {
    contenedor.innerHTML = '<p>No se encontró el Konami ID.</p>';
    return;
  }

  const btnRonda = document.getElementById('btnRonda');
  const btnHistorial = document.getElementById('btnHistorial');

  btnRonda.onclick = () => {
    btnRonda.classList.add('active');
    btnHistorial.classList.remove('active');
    mostrarRonda(nombreJugador, input, matchActual);
  };

  btnHistorial.onclick = () => {
    btnHistorial.classList.add('active');
    btnRonda.classList.remove('active');
    mostrarHistorial(historial, players, input);
  };

  mostrarRonda(nombreJugador, input, matchActual);
}

function mostrarRonda(nombre, id, match) {
  const contenedor = document.getElementById('resultado');
  contenedor.innerHTML = "";

  if (!match) {
    contenedor.innerHTML = "<p>Sin emparejamiento en la ronda actual.</p>";
    return;
  }

  const oponente = match.oponente;
  const player = Array.from(tournamentData.querySelectorAll('TournPlayer')).find(
    p => p.querySelector('ID')?.textContent.trim().padStart(10, '0') === oponente
  );
  const nombreOponente = player ? `${player.querySelector('FirstName')?.textContent} ${player.querySelector('LastName')?.textContent}` : "Oponente desconocido";

  contenedor.innerHTML = `
    <h2 style="text-align:center; color:#D62828;">Mesa ${match.mesa}</h2>
    <div class="card red">
      <div><strong>${nombre}</strong></div>
      <div class="konami-id">${id}</div>
    </div>
    <div class="vs-label">VS</div>
    <div class="card blue">
      <div><strong>${nombreOponente}</strong></div>
      <div class="konami-id">${oponente}</div>
    </div>
  `;
}

function mostrarHistorial(historial, players, input) {
  const contenedor = document.getElementById('resultado');
  contenedor.innerHTML = "";

  historial.sort((a, b) => b.ronda - a.ronda);

  const torneoFinalizado = tournamentData.querySelector("Finalized")?.textContent === "True";
  if (!torneoFinalizado) historial = historial.filter(h => h.ronda !== currentRound);

  historial.forEach(({ ronda, oponente, resultado }) => {
    const player = players.find(p => p.querySelector('ID')?.textContent.trim().padStart(10, '0') === oponente);
    const nombre = player ? `${player.querySelector('FirstName')?.textContent} ${player.querySelector('LastName')?.textContent}` : "Oponente desconocido";

    const colorClass =
      resultado === 'Victoria' ? 'result-win'
      : resultado === 'Derrota' ? 'result-loss'
      : 'result-draw';

    const div = document.createElement('div');
    div.className = `result ${colorClass}`;
    div.innerHTML = `
      <div>Ronda ${ronda} - ${resultado}</div>
      <div class="result-text">VS ${nombre}</div>
    `;
    contenedor.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const lastId = localStorage.getItem('konamiId');
  if (lastId) {
    document.getElementById('konamiId').value = lastId;
    setTimeout(buscarEmparejamientos, 300);
  }
  document.getElementById('konamiId').addEventListener('input', function () {
    if (this.value.length === 10) buscarEmparejamientos();
  });
});
