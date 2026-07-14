// Persistência local (localStorage) para percursos gravados.
// Usada em dois casos: (1) usuário não está logado — o percurso fica só neste dispositivo;
// (2) usuário está logado mas offline — o percurso é marcado `pendenteSync: true` e sobe pro
// Supabase automaticamente assim que a conexão voltar (ver src/lib/sincronizarPercursos.js).

const CHAVE = 'soutrilheiro_percursos_locais';

export function salvarPercursoLocal(percurso) {
  const existentes = listarPercursosLocais();
  const registro = { id: crypto.randomUUID(), criadoEm: new Date().toISOString(), ...percurso };
  localStorage.setItem(CHAVE, JSON.stringify([registro, ...existentes]));
  return registro;
}

export function listarPercursosLocais() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
  } catch {
    return [];
  }
}

export function buscarPercursoLocalPorId(id) {
  return listarPercursosLocais().find((p) => p.id === id) ?? null;
}

export function listarPercursosPendentes(usuarioId) {
  return listarPercursosLocais().filter((p) => p.pendenteSync && p.usuarioId === usuarioId);
}

export function removerPercursoLocal(id) {
  const restantes = listarPercursosLocais().filter((p) => p.id !== id);
  localStorage.setItem(CHAVE, JSON.stringify(restantes));
}
