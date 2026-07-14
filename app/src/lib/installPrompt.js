let evento = null;
let instalado = false;
const ouvintes = new Set();

function notificar() {
  for (const cb of ouvintes) cb();
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  evento = e;
  notificar();
});

window.addEventListener('appinstalled', () => {
  evento = null;
  instalado = true;
  notificar();
});

export function obterPromptInstalacao() {
  return evento;
}

export function appJaInstalado() {
  return (
    instalado ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function ouvirPromptInstalacao(cb) {
  ouvintes.add(cb);
  return () => ouvintes.delete(cb);
}
