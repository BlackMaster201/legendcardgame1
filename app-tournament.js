let tournamentData = null;
let currentRound = null;

function padId(id) {
  return String(id).padStart(10, '0');
}

fetch('1.txt')
  .then(res => res.text())
  .then(str => {
    const parser = new DOMParser();
    tournamentData = parser.parseFromString(str, 'text/xml');
    currentRound = parseInt(tournamentData.querySelector('CurrentRound')?.textContent || "0", 10);
    const label = document.getElementById('rondaInfo');
    if (label) label.textContent = `Ronda: ${currentRound}`;
  })
  .catch(() => {
    const label = document.getElementById('rondaInfo');
    if (label) label.textContent = 'No se encontró el archivo de torneo.';
  });

function buscarEmparejamientos(modo = 'ronda') {
  const inputRaw = document.getElementById('konamiId')?.value.trim();
  const input = padId(inputRaw);
  const contenedor = document.getElementById('resultado');

  if (!tournamentData || !input) return;

  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const players = Array.from(tournamentData.querySelectorAll('TournPlayer'));
  const finalized = tournamentData.querySelector('Finalized')?.textContent === 'True';

  const historial = [];
  let actual = null;

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

      const item = { ronda: round, oponente, resultado };
      historial.push(item);
      if (round === currentRound) actual = item;
    }
  });

  const yo = players.find(p => padId(p.querySelector('ID')?.textContent) === input);
  const standing = yo?.querySelector('Standing')?.textContent || '?';

  if (!yo) {
    contenedor.innerHTML = '<p>No se encontró el Konami ID.</p>';
    return;
  }

  historial.sort((a, b) => b.ronda - a.ronda);

  if (modo === 'ronda') {
    if (!actual && !finalized) {
      contenedor.innerHTML = '<p>No hay emparejamiento para esta ronda.</p>';
      return;
    }

    const oponenteData = players.find(p => padId(p.querySelector('ID')?.textContent) === actual.oponente);
    const nombre = oponenteData
      ? `${oponenteData.querySelector('FirstName')?.textContent} ${oponenteData.querySelector('LastName')?.textContent}`
      : 'Oponente desconocido';

    const miNombre = `${yo.querySelector('FirstName')?.textContent} ${yo.querySelector('LastName')?.textContent}`;

    contenedor.innerHTML = `
      <div class="card red">
        <h3>${miNombre}</h3>
        <p class="konami-id">${input}</p>
      </div>
      <div class="vs-label">VS</div>
      <div class="card blue">
        <h3>${nombre}</h3>
        <p class="konami-id">${actual.oponente}</p>
      </div>
    `;
  } else {
    contenedor.innerHTML = `<h2 style="text-align:center">Standing: ${formatStanding(standing)}</h2>`;
    historial.forEach(item => {
      if (!finalized && item.ronda === currentRound) return;

      const oponente = players.find(p => padId(p.querySelector('ID')?.textContent) === item.oponente);
      const nombre = oponente
        ? `${oponente.querySelector('FirstName')?.textContent} ${oponente.querySelector('LastName')?.textContent}`
        : 'Oponente desconocido';

      const clase =
        item.resultado === 'Victoria'
          ? 'result-win'
          : item.resultado === 'Derrota'
          ? 'result-loss'
          : 'result-draw';

      contenedor.innerHTML += `
        <div class="historial-item ${clase}">
          Ronda ${item.ronda} - ${item.resultado} VS ${nombre}
        </div>
      `;
    });
  }
}

function formatStanding(s) {
  const n = parseInt(s, 10);
  if (n === 1) return '🥇 1';
  if (n === 2) return '🥈 2';
  if (n === 3) return '🥉 3';
  return s;
}
