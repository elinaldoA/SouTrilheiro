// Alerta sonoro de novas mensagens — sintetizado via Web Audio API (sem depender de arquivo externo).

const CHAVE_MUTE = 'chat_som_mudo';

let ctx = null;
let destravado = false;

function obterContexto() {
  if (!ctx) {
    const AudioContextClasse = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClasse) return null;
    ctx = new AudioContextClasse();
  }
  return ctx;
}

function destravarNoPrimeiroGesto() {
  if (destravado) return;
  destravado = true;
  const destravar = () => {
    const contexto = obterContexto();
    if (contexto && contexto.state === 'suspended') contexto.resume();
    document.removeEventListener('pointerdown', destravar);
    document.removeEventListener('keydown', destravar);
  };
  document.addEventListener('pointerdown', destravar);
  document.addEventListener('keydown', destravar);
}

if (typeof window !== 'undefined') destravarNoPrimeiroGesto();

export function somMudo() {
  return localStorage.getItem(CHAVE_MUTE) === '1';
}

export function alternarSomMudo() {
  const novo = !somMudo();
  localStorage.setItem(CHAVE_MUTE, novo ? '1' : '0');
  return novo;
}

/** Toca um "pop" suave de duas notas para indicar chegada de mensagem. */
export function tocarSomMensagem() {
  if (somMudo()) return;
  const contexto = obterContexto();
  if (!contexto) return;
  if (contexto.state === 'suspended') contexto.resume();

  const agora = contexto.currentTime;
  const notas = [
    { freq: 880, inicio: 0 },
    { freq: 1174.66, inicio: 0.09 },
  ];

  notas.forEach(({ freq, inicio }) => {
    const osc = contexto.createOscillator();
    const ganho = contexto.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t0 = agora + inicio;
    ganho.gain.setValueAtTime(0, t0);
    ganho.gain.linearRampToValueAtTime(0.16, t0 + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
    osc.connect(ganho);
    ganho.connect(contexto.destination);
    osc.start(t0);
    osc.stop(t0 + 0.3);
  });
}
