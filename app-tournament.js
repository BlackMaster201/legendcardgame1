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

  const contenedor = document.getElementById('tableContainer');
  const historialCont = document.getElementById('historyContainer');
  contenedor.innerHTML = '';
  historialCont.innerHTML = '';

  let emparejamientoActual = null;
  const historial = [];

  matches.forEach(match => {
    const round = parseInt(match.querySelector('Round')?.textContent || "0", 10);
    const mesa = match.querySelector('Table')?.textContent || "?";
    const p1 = padId(match.querySelectorAll('Player')[0]?.textContent || "");
    const p2 = padId(match.querySelectorAll('Player')[1]?.textContent || "");
    const winner = padId(match.querySelector('Winner')?.textContent || "");

    if (input === p1 || input === p2) {
      const oponenteId = input === p1 ? p2 : p1;
      const resultado =
        winner === input ? "Victoria" :
        winner === oponenteId ? "Derrota" :
        "Empate";

      historial.push({
        ronda: round,
        mesa,
        oponenteId,
        resultado,
        actual: round === currentRound
      });

      if (round === currentRound) {
        emparejamientoActual = { mesa, oponenteId };
      }
    }
  });

  if (!emparejamientoActual) {
    contenedor.innerHTML = "<p>No se encontró el Konami ID.</p>";
    return;
  }

  // Mostrar emparejamiento actual
  const jugador = players.find(p => padId(p.querySelector('ID')?.textContent) === input);
  const oponente = players.find(p => padId(p.querySelector('ID')?.textContent) === emparejamientoActual.oponenteId);
  const nombreJugador = jugador ? `${jugador.querySelector('FirstName')?.textContent} ${jugador.querySelector('LastName')?.textContent}` : 'Desconocido';
  const nombreOponente = oponente ? `${oponente.querySelector('FirstName')?.textContent} ${oponente.querySelector('LastName')?.textContent}` : 'Desconocido';

  contenedor.innerHTML = `
    <div class="card">
      <h3>${nombreJugador}</h3>
      <p class="konami-id">ID: ${input}</p>
    </div>
    <div class="vs-label">VS</div>
    <div class="card">
      <h3>${nombreOponente}</h3>
      <p class="konami-id">ID: ${emparejamientoActual.oponenteId}</p>
    </div>
    <div class="vs-label" style="margin-top:10px;">Mesa: ${emparejamientoActual.mesa}</div>
  `;

  // Mostrar historial
  historial.sort((a, b) => b.ronda - a.ronda);
  const finalized = tournamentData.querySelector('Finalized')?.textContent === 'True';
  historial.forEach(h => {
    if (!finalized && h.actual) return; // Omitir ronda actual si torneo no está finalizado

    const oponente = players.find(p => padId(p.querySelector('ID')?.textContent) === h.oponenteId);
    const nombreOponente = oponente
      ? `${oponente.querySelector('FirstName')?.textContent} ${oponente.querySelector('LastName')?.textContent}`
      : "Oponente desconocido";

    let color = "#999";
    if (h.resultado === "Victoria") color = "#4CAF50";
    else if (h.resultado === "Derrota") color = "#F44336";

    const div = document.createElement('div');
    div.style.borderLeft = `8px solid ${color}`;
    div.style.padding = '10px';
    div.style.margin = '10px auto';
    div.style.borderRadius = '6px';
    div.style.maxWidth = '400px';
    div.style.background = '#1e1e1e';

    div.innerHTML = `
      <div style="font-weight:bold; color: ${color}; text-align:center;">
        Ronda ${h.ronda} - ${h.resultado}
      </div>
      <div style="color:white; text-align:center; margin-top:5px;">
        VS ${nombreOponente}
      </div>
    `;
    historialCont.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const lastId = localStorage.getItem('konamiId');
  if (lastId) {
    document.getElementById('konamiId').value = lastId;
    buscarEmparejamientos();
  }

  document.getElementById('btnRonda').addEventListener('click', () => {
    document.getElementById('tableContainer').style.display = 'block';
    document.getElementById('historyContainer').style.display = 'none';
    document.getElementById('btnRonda').classList.add('active');
    document.getElementById('btnHistorial').classList.remove('active');
  });

  document.getElementById('btnHistorial').addEventListener('click', () => {
    document.getElementById('tableContainer').style.display = 'none';
    document.getElementById('historyContainer').style.display = 'block';
    document.getElementById('btnRonda').classList.remove('active');
    document.getElementById('btnHistorial').classList.add('active');
  });

  document.getElementById('konamiId').addEventListener('input', () => {
    if (document.getElementById('konamiId').value.length === 10) {
      buscarEmparejamientos();
    }
  });
});
