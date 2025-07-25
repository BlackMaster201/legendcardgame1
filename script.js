let rondaActual = -1;
let historialData = [];
let finalized = false;

function obtenerDatosDelTorneo() {
  fetch('1.txt')
    .then(res => res.text())
    .then(xmlText => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, 'application/xml');

      finalized = xml.querySelector('Finalized')?.textContent === 'True';

      const rounds = Array.from(xml.querySelectorAll('Round')).map(r => ({
        number: parseInt(r.getAttribute('Number')),
        matches: Array.from(r.querySelectorAll('Match')).map(m => ({
          table: m.getAttribute('Table'),
          player1: {
            name: m.querySelector('Player1 > Name')?.textContent || '',
            id: m.querySelector('Player1 > KonamiID')?.textContent || '',
            score: parseInt(m.getAttribute('Player1Score') || '0')
          },
          player2: {
            name: m.querySelector('Player2 > Name')?.textContent || '',
            id: m.querySelector('Player2 > KonamiID')?.textContent || '',
            score: parseInt(m.getAttribute('Player2Score') || '0')
          }
        }))
      }));

      const maxRonda = Math.max(...rounds.map(r => r.number));
      rondaActual = finalized ? maxRonda : maxRonda;

      document.getElementById('rondaInfo').textContent = `Ronda: ${rondaActual}`;
      historialData = rounds;
      const idGuardado = localStorage.getItem('lastKonamiID');
      if (idGuardado) document.getElementById('searchID').value = idGuardado;
      if (idGuardado?.length === 10) mostrarRondaYHistorial(idGuardado);
    })
    .catch(() => {
      document.getElementById('rondaInfo').textContent = 'No se encontró el archivo de torneo.';
    });
}

function mostrarRondaYHistorial(id) {
  const rondaCont = document.getElementById('tableContainer');
  const histCont = document.getElementById('historyContainer');
  rondaCont.innerHTML = '';
  histCont.innerHTML = '';

  const rondaData = historialData.find(r => r.number === rondaActual);
  const match = rondaData?.matches.find(m => m.player1.id === id || m.player2.id === id);
  if (match && (!finalized || rondaActual === historialData.length)) {
    const soyP1 = match.player1.id === id;
    const yo = soyP1 ? match.player1 : match.player2;
    const rival = soyP1 ? match.player2 : match.player1;
    const mesa = match.table;

    rondaCont.innerHTML = `
      <div style="text-align:center; margin-bottom: 20px;">
        <h2 style="font-size: 32px; color: #D62828;">Mesa ${mesa}</h2>
      </div>

      <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
        <div class="card" style="border-top: 4px solid #D62828;">
          <h3>${yo.name}</h3>
          <p class="konami-id">${yo.id}</p>
        </div>

        <div class="vs-label">VS</div>

        <div class="card" style="border-bottom: 4px solid #007BFF;">
          <h3>${rival.name}</h3>
          <p class="konami-id">${rival.id}</p>
        </div>
      </div>
    `;
  }

  // Historial
  const standings = calcularStanding(id);
  const historial = [];

  for (let i = historialData.length - 1; i >= 0; i--) {
    const ronda = historialData[i];
    const partida = ronda.matches.find(m => m.player1.id === id || m.player2.id === id);
    if (!partida) continue;
    if (!finalized && ronda.number === rondaActual) continue;

    const soyP1 = partida.player1.id === id;
    const yo = soyP1 ? partida.player1 : partida.player2;
    const rival = soyP1 ? partida.player2 : partida.player1;

    let resultado = 'Empate', clase = 'result-draw';
    if (yo.score > rival.score) [resultado, clase] = ['Victoria', 'result-win'];
    else if (yo.score < rival.score) [resultado, clase] = ['Derrota', 'result-loss'];

    historial.push(`
      <div class="history-box ${clase}">
        <strong>Ronda ${ronda.number} - ${resultado}</strong><br/>
        <strong>VS ${rival.name}</strong>
      </div>
    `);
  }

  if (historial.length > 0) {
    const medalla = ['🥇', '🥈', '🥉'][standings.pos - 1] || '';
    histCont.innerHTML = `
      <div style="text-align: center; margin-bottom: 15px;">
        <h3>Standing: ${medalla}${standings.pos}</h3>
      </div>
      ${historial.join('')}
    `;
  }
}

function calcularStanding(id) {
  const puntos = {};
  historialData.forEach(ronda => {
    ronda.matches.forEach(m => {
      const { player1: p1, player2: p2 } = m;
      puntos[p1.id] = (puntos[p1.id] || 0) + p1.score;
      puntos[p2.id] = (puntos[p2.id] || 0) + p2.score;
    });
  });

  const ordenados = Object.entries(puntos)
    .sort((a, b) => b[1] - a[1])
    .map(([id], i) => ({ id, pos: i + 1 }));

  return ordenados.find(p => p.id === id) || { pos: '-' };
}

document.getElementById('searchID').addEventListener('input', e => {
  const id = e.target.value.replace(/\D/g, '').slice(0, 10);
  e.target.value = id;
  localStorage.setItem('lastKonamiID', id);
  if (id.length === 10) mostrarRondaYHistorial(id);
});

document.getElementById('btnRonda').addEventListener('click', () => {
  document.getElementById('btnRonda').classList.add('active');
  document.getElementById('btnHistorial').classList.remove('active');
  document.getElementById('tableContainer').style.display = 'block';
  document.getElementById('historyContainer').style.display = 'none';
});

document.getElementById('btnHistorial').addEventListener('click', () => {
  document.getElementById('btnHistorial').classList.add('active');
  document.getElementById('btnRonda').classList.remove('active');
  document.getElementById('tableContainer').style.display = 'none';
  document.getElementById('historyContainer').style.display = 'block';
});

window.addEventListener('load', obtenerDatosDelTorneo);
