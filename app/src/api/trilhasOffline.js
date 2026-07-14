// Cópia local (localStorage) de trilhas salvas para uso offline (US6.2).

const CHAVE = 'soutrilheiro_trilhas_offline';

function lerTodas() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '{}');
  } catch {
    return {};
  }
}

export function salvarTrilhaOffline(trilha) {
  const todas = lerTodas();
  todas[trilha.id] = { ...trilha, salvaEm: new Date().toISOString() };
  localStorage.setItem(CHAVE, JSON.stringify(todas));
}

export function obterTrilhaOffline(id) {
  return lerTodas()[id] ?? null;
}

export function estaSalvaOffline(id) {
  return Boolean(lerTodas()[id]);
}

export function listarTrilhasOffline() {
  return Object.values(lerTodas());
}
