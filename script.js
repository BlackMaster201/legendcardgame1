document.addEventListener('DOMContentLoaded', () => {
  const btnRonda = document.getElementById('btnRonda');
  const btnHistorial = document.getElementById('btnHistorial');
  const resultado = document.getElementById('resultado');
  const input = document.getElementById('konamiId');

  function showRonda() {
    btnRonda.classList.add('active');
    btnHistorial.classList.remove('active');
    buscarEmparejamientos('ronda');
  }

  function showHistorial() {
    btnHistorial.classList.add('active');
    btnRonda.classList.remove('active');
    buscarEmparejamientos('historial');
  }

  btnRonda.addEventListener('click', showRonda);
  btnHistorial.addEventListener('click', showHistorial);

  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 10);
    if (input.value.length === 10) {
      const modo = btnRonda.classList.contains('active') ? 'ronda' : 'historial';
      buscarEmparejamientos(modo);
      localStorage.setItem('konamiId', input.value);
    } else {
      resultado.innerHTML = '';
    }
  });

  const saved = localStorage.getItem('konamiId');
  if (saved) {
    input.value = saved;
    buscarEmparejamientos('ronda');
  }
});
