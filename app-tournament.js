let tournamentData = null;
let currentRound = null;

function padId(id) {
  return String(id).padStart(10, '0');
}

fetch('1.txt')
  .then(response => response.text())
  .then(str => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(str, 'text/xml');
    tournamentData = xml;

    const currentRoundNode = tournamentData.querySelector('CurrentRound');
    const finalizedNode = tournamentData.querySelector('Finalized');
    const finalized = finalizedNode?.textContent === 'True';
    currentRound = parseInt(currentRoundNode?.textContent || "0", 10);

    const label = document.getElementById('rondaInfo');
    if (label) label.textContent = `Ronda: ${currentRound}`;

    document.getElementById('btnRonda').addEventListener('click', () => mostrarRonda(padId(localStorage.getItem('konamiId'))));
    document.getElementById('btnHistorial').addEventListener('click', () => mostrarHistorial(padId(localStorage.getItem('konamiId')), finalized));

    document.getElementById('konamiId').addEventListener('input', (e) => {
      const id = e.target.value.replace(/\D/g, '').slice(0, 10);
      e.target.value = id;
      if (id.length === 10) {
        localStorage.setItem('konamiId', id);
        mostrarRonda(id);
      } else {
        document.getElementById('resultado').innerHTML = '';
      }
    });

    const lastId = localStorage.getItem('konamiId');
    if (lastId) {
      document.getElementById('konamiId').value = lastId;
      mostrarRonda(padId(lastId));
    }
  })
  .catch(() => {
    const label = document.getElementById('rondaInfo');
    if (label) label.textContent = 'No se encontró el archivo de torneo.';
  });

function mostrarRonda(id) {
  const cont = document.getElementById('resultado');
  cont.innerHTML = '';
  if (!tournamentData || !id) return;

  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const players = Array.from(tournamentData.querySelectorAll('TournPlayer'));
  const actual = matches.find(m => {
    const round = parseInt(m.querySelector('Round')?.textContent || "0");
    const p1 = padId(m.querySelectorAll('Player')[0]?.textContent || "");
    const p2 = padId(m.querySelectorAll('Player')[1]?.textContent || "");
    return round === currentRound && (id === p1 || id === p2);
  });

  if (!actual) {
    cont.innerHTML = 'No se encontró información para esta ronda.';
    return;
  }

  const p1 = padId(actual.querySelectorAll('Player')[0]?.textContent || "");
  const p2 = padId(actual.querySelectorAll('Player')[1]?.textContent || "");
  const mesa = actual.querySelector('Table')?.textContent || '';
  const jugador = players.find(p => padId(p.querySelector('ID')?.textContent) === id);
  const oponenteId = id === p1 ? p2 : p1;
  const oponente = players.find(p => padId(p.querySelector('ID')?.textContent) === oponenteId);

  cont.innerHTML = `
    <h2 style="text-align:center;">Mesa ${mesa}</h2>
    <div class="card">
      <h3 class="card-title">${jugador?.querySelector('FirstName')?.textContent} ${jugador?.querySelector('LastName')?.textContent}</h3>
      <p class="konami-id">${id}</p>
    </div>
    <div class="vs-label">VS</div>
    <div class="card vs">
      <h3 class="card-title">${oponente?.querySelector('FirstName')?.textContent} ${oponente?.querySelector('LastName')?.textContent}</h3>
      <p class="konami-id">${oponenteId}</p>
    </div>
  `;
}

function mostrarHistorial(id, finalized) {
  const cont = document.getElementById('resultado');
  cont.innerHTML = '';
  if (!tournamentData || !id) return;

  const matches = Array.from(tournamentData.querySelectorAll('TournMatch'));
  const players = Array.from(tournamentData.querySelectorAll('TournPlayer'));

  const historial = matches
    .map(match => {
      const p1 = padId(match.querySelectorAll('Player')[0]?.textContent || "");
      const p2 = padId(match.querySelectorAll('Player')[1]?.textContent || "");
      const round = parseInt(match.querySelector('Round')?.textContent || "0");
      const winner = padId(match.querySelector('Winner')?.textContent || "");

      if (!finalized && round === currentRound) return null;

      if (id === p1 || id === p2) {
        const oponenteId = id === p1 ? p2 : p1;
        const oponente = players.find(p => padId(p.querySelector('ID')?.textContent) === oponenteId);
        const nombre = `${oponente?.querySelector('FirstName')?.textContent} ${oponente?.querySelector('LastName')?.textContent}`;
        let resultado = 'Empate';
        if (winner === id) resultado = 'Victoria';
        else if (winner === oponenteId) resultado = 'Derrota';

        return { ronda: round, nombre, resultado };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.ronda - a.ronda);

  const player = players.find(p => padId(p.querySelector('ID')?.textContent) === id);
  const standing = player?.querySelector('Standing')?.textContent;

  cont.innerHTML = `<h2 style="text-align:center;">Standing: ${getStandingEmoji(standing)} ${standing}</h2>`;

  historial.forEach(({ ronda, nombre, resultado }) => {
    let clase = resultado === 'Victoria' ? 'result-win' : resultado === 'Derrota' ? 'result-loss' : 'result-draw';

    const caja = document.createElement('div');
    caja.className = `result-box ${clase}`;
    caja.innerHTML = `
      <h3 style="color:inherit;">Ronda ${ronda}</h3>
      <p><span class="label">${resultado}</span> VS ${nombre}</p>
    `;
    cont.appendChild(caja);
  });
}

function getStandingEmoji(pos) {
  const p = parseInt(pos || '0');
  if (p === 1) return '🥇';
  if (p === 2) return '🥈';
  if (p === 3) return '🥉';
  return '';
}
